"""
Seed Washington State facilities into the local UrbanAid database.

Pulls real data from government APIs and open data portals:
  - HRSA health centers (via data.hrsa.gov)
  - VA facilities (via HIFLD ArcGIS — no key required)
  - USDA service centers (via usda.gov service center locator)
  - Refuge Restrooms (via refugerestrooms.org API)
  - Seattle Drinking Fountains (via Seattle ArcGIS)
  - Seattle Public WiFi (curated library/civic locations)
  - WA State Parks Facilities (via geo.wa.gov ArcGIS)
  - King County Metro Transit Shelters (via KC GIS ArcGIS)
  - WA211 Food Banks & Free Meals (via search.wa211.org)
  - WA211 Homeless Shelters (via search.wa211.org)

Then transforms and inserts into the local SQLite utilities table.

Usage:
    cd api/
    source .venv/bin/activate
    python scripts/seed_wa.py                    # seed all
    python scripts/seed_wa.py --clear            # clear DB then seed
    python scripts/seed_wa.py --source restrooms # seed single source
"""

import sys
import os
import uuid
import json
import re
import csv
import io
import time
import argparse

# Add parent dir so we can import project modules
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import httpx
from models.database import SessionLocal, init_db
from models.utility import Utility

# Washington state geographic bounds for validation
WA_LAT_MIN = 45.54
WA_LAT_MAX = 49.00
WA_LON_MIN = -124.85
WA_LON_MAX = -116.92

# WA metro area coordinates for radius-based API queries
WA_METRO_COORDS = [
    (47.6062, -122.3321, "Seattle"),
    (47.2529, -122.4443, "Tacoma"),
    (47.6588, -117.4260, "Spokane"),
    (48.7519, -122.4787, "Bellingham"),
    (47.0379, -122.9007, "Olympia"),
    (46.6021, -120.5059, "Yakima"),
    (46.7324, -117.0002, "Pullman"),
    (47.2372, -122.2351, "Federal Way"),
    (47.6101, -122.2015, "Bellevue"),
    (48.0001, -122.2059, "Everett"),
    (46.2804, -119.2752, "Kennewick"),
    (47.4829, -122.2171, "Renton"),
]


def is_in_washington(lat, lon):
    # type: (float, float) -> bool
    """Validate that coordinates fall within Washington state bounds."""
    return (WA_LAT_MIN <= lat <= WA_LAT_MAX) and (WA_LON_MIN <= lon <= WA_LON_MAX)


# ---------------------------------------------------------------------------
# ArcGIS Pagination Helper
# ---------------------------------------------------------------------------


def _fetch_arcgis_all(base_url, where="1=1", out_fields="*", batch_size=1000):
    # type: (str, str, str, int) -> List[Dict]
    """
    Paginate through an ArcGIS REST Feature Service and return all features.

    ArcGIS services cap each response at maxRecordCount (typically 1000-2000).
    This function loops using resultOffset until exceededTransferLimit is False.

    Returns list of feature dicts, each with 'attributes' and 'geometry' keys.
    """
    all_features = []  # type: List[Dict]
    offset = 0

    with httpx.Client(timeout=30.0) as client:
        while True:
            params = {
                "where": where,
                "outFields": out_fields,
                "f": "json",
                "resultOffset": str(offset),
                "resultRecordCount": str(batch_size),
                "returnGeometry": "true",
                "outSR": "4326",  # WGS84 lat/lon
            }
            try:
                resp = client.get(base_url + "/query", params=params)
                if resp.status_code != 200:
                    print(
                        f"  ArcGIS returned status {resp.status_code} at offset {offset}"
                    )
                    break

                data = resp.json()

                # Check for ArcGIS error response
                if "error" in data:
                    print(f"  ArcGIS error: {data['error'].get('message', 'unknown')}")
                    break

                features = data.get("features", [])
                if not features:
                    break

                all_features.extend(features)
                offset += len(features)

                # Check if there are more records
                if not data.get("exceededTransferLimit", False):
                    break

            except Exception as e:
                print(f"  ArcGIS fetch error at offset {offset}: {e}")
                break

    return all_features


# ---------------------------------------------------------------------------
# HRSA Health Centers
# ---------------------------------------------------------------------------


def fetch_hrsa_wa():
    # type: () -> List[Dict]
    """
    Fetch HRSA health centers for Washington from data.hrsa.gov.

    Downloads the national Health Center Service Delivery Sites CSV
    and filters for active WA sites. No API key required.
    CSV columns include lat/lon, site name, address, phone, website.
    """
    print("\n--- Fetching HRSA health centers for WA ---")
    centers = []  # type: List[Dict]

    csv_url = (
        "https://data.hrsa.gov/DataDownload/DD_Files"
        "/Health_Center_Service_Delivery_and_LookAlike_Sites.csv"
    )

    try:
        with httpx.Client(timeout=60.0, follow_redirects=True) as client:
            print("  Downloading HRSA national CSV (~10 MB)...")
            response = client.get(csv_url)

            if response.status_code == 200:
                # Parse CSV from response text
                reader = csv.DictReader(io.StringIO(response.text))

                for row in reader:
                    # Filter to WA + Active sites only
                    if row.get("Site State Abbreviation", "").strip() != "WA":
                        continue
                    status = row.get("Site Status Description", "").strip()
                    if status and status.lower() != "active":
                        continue

                    # X = longitude, Y = latitude in HRSA's coordinate system
                    lon = _safe_float(
                        row.get("Geocoding Artifact Address Primary X Coordinate")
                    )
                    lat = _safe_float(
                        row.get("Geocoding Artifact Address Primary Y Coordinate")
                    )
                    if not lat or not lon or not is_in_washington(lat, lon):
                        continue

                    site_name = (row.get("Site Name") or "").strip()
                    hc_name = (row.get("Health Center Name") or "").strip()
                    name = site_name or hc_name or "HRSA Health Center"

                    address_parts = [
                        (row.get("Site Address") or "").strip(),
                        (row.get("Site City") or "").strip(),
                        "WA",
                        (row.get("Site Postal Code") or "").strip(),
                    ]
                    address = ", ".join(filter(None, address_parts))

                    hc_type = (row.get("Health Center Type Description") or "").strip()
                    location_type = (
                        row.get("Health Center Location Type Description") or ""
                    ).strip()
                    desc_parts = []
                    if hc_type:
                        desc_parts.append(hc_type)
                    if location_type and location_type != "Permanent":
                        desc_parts.append("(%s)" % location_type)
                    if hc_name and hc_name != site_name:
                        desc_parts.append("Part of %s" % hc_name)
                    description = (
                        " ".join(desc_parts) if desc_parts else "HRSA Health Center"
                    )

                    phone = (row.get("Site Telephone Number") or "").strip()
                    website = (row.get("Site Web Address") or "").strip()

                    centers.append(
                        {
                            "name": name,
                            "category": "health_center",
                            "subcategory": "community_health_center",
                            "latitude": lat,
                            "longitude": lon,
                            "description": description,
                            "address": address,
                            "phone": phone,
                            "website": website,
                            "source": "HRSA",
                        }
                    )
            else:
                print(f"  HRSA CSV download returned status {response.status_code}")

    except Exception as e:
        print(f"  HRSA fetch error: {e}")

    print(f"  Found {len(centers)} HRSA centers in WA")
    return centers


# ---------------------------------------------------------------------------
# VA Facilities
# ---------------------------------------------------------------------------


def fetch_va_wa():
    # type: () -> List[Dict]
    """
    Fetch VA facilities for Washington from the HIFLD ArcGIS Feature Service.

    HIFLD (Homeland Infrastructure Foundation-Level Data) mirrors the
    VA's VAST database as a public ArcGIS service -- no API key needed.
    Dataset includes medical centers, outpatient clinics, vet centers,
    and CBOCs with lat/lon coordinates.

    Service: VHA_Facilities_v2 (Layer 0)
    Fields: STA_NO, STA_NAME, S_ABBR, S_ADD1, S_CITY, S_STATE, S_ZIP,
            LAT, LON, CNAME (county)
    """
    print("\n--- Fetching VA facilities for WA (HIFLD ArcGIS) ---")
    facilities = []  # type: List[Dict]

    # HIFLD ArcGIS org: VFLAJVozK0rtzQmT
    base_url = (
        "https://services2.arcgis.com/VFLAJVozK0rtzQmT/ArcGIS/rest/services"
        "/Veterans_Health_Administration_Medical_Facilities/FeatureServer/0"
    )

    # Map S_ABBR codes to subcategories
    abbr_map = {
        "VAMC": "va_medical_center",
        "OOS": "va_outpatient_clinic",
        "MSCBOC": "va_outpatient_clinic",
        "PCCBOC": "va_outpatient_clinic",
        "VTCR": "va_vet_center",
        "MVCTR": "va_vet_center",
    }

    # Friendly labels for description
    abbr_label = {
        "VAMC": "VA Medical Center",
        "OOS": "VA Outpatient Clinic",
        "MSCBOC": "Multi-Specialty Community-Based Outpatient Clinic",
        "PCCBOC": "Primary Care Community-Based Outpatient Clinic",
        "VTCR": "Vet Center",
        "MVCTR": "Mobile Vet Center",
    }

    try:
        features = _fetch_arcgis_all(
            base_url,
            where="S_STATE='WA'",
            out_fields="STA_NO,STA_NAME,S_ABBR,S_ADD1,S_CITY,S_STATE,S_ZIP,LAT,LON,CNAME",
            batch_size=100,
        )

        for feat in features:
            attrs = feat.get("attributes", {})

            lat = _safe_float(attrs.get("LAT"))
            lon = _safe_float(attrs.get("LON"))
            if not lat or not lon or not is_in_washington(lat, lon):
                continue

            abbr = (attrs.get("S_ABBR") or "").strip().upper()
            subcategory = abbr_map.get(abbr, "va_facility")
            label = abbr_label.get(abbr, "VA Facility")

            name = (attrs.get("STA_NAME") or "VA Facility").strip()

            address_parts = [
                (attrs.get("S_ADD1") or "").strip(),
                (attrs.get("S_CITY") or "").strip(),
                "WA",
                (attrs.get("S_ZIP") or "").strip(),
            ]
            address = ", ".join(filter(None, address_parts))

            county = (attrs.get("CNAME") or "").strip()
            desc = "%s in %s County, WA" % (label, county) if county else label

            facilities.append(
                {
                    "name": name,
                    "category": "va_facility",
                    "subcategory": subcategory,
                    "latitude": lat,
                    "longitude": lon,
                    "description": desc,
                    "address": address,
                    "phone": "",
                    "website": "https://www.va.gov/find-locations",
                    "source": "VA (HIFLD)",
                }
            )

    except Exception as e:
        print(f"  VA HIFLD fetch error: {e}")

    if len(facilities) == 0:
        print("  HIFLD returned no data -- using curated fallback...")
        facilities = _get_curated_va()

    print(f"  Found {len(facilities)} VA facilities in WA")
    return facilities


def _get_curated_va():
    # type: () -> List[Dict]
    """Curated fallback VA facilities in Washington state."""
    base = {
        "category": "va_facility",
        "phone": "",
        "website": "https://www.va.gov/find-locations",
        "source": "VA (HIFLD)",
    }
    entries = [
        (
            "Seattle VA Medical Center",
            "va_medical_center",
            47.5552,
            -122.2999,
            "1660 S Columbian Way, Seattle, WA 98108",
            "VA Medical Center in King County, WA",
        ),
        (
            "American Lake VA Medical Center",
            "va_medical_center",
            47.1010,
            -122.5764,
            "9600 Veterans Dr SW, Tacoma, WA 98493",
            "VA Medical Center in Pierce County, WA",
        ),
        (
            "Mann-Grandstaff VA Medical Center",
            "va_medical_center",
            47.6698,
            -117.3927,
            "4815 N Assembly St, Spokane, WA 99205",
            "VA Medical Center in Spokane County, WA",
        ),
        (
            "Jonathan M. Wainwright Memorial VAMC",
            "va_medical_center",
            46.0731,
            -118.3354,
            "77 Wainwright Dr, Walla Walla, WA 99362",
            "VA Medical Center in Walla Walla County, WA",
        ),
        (
            "Seattle Vet Center",
            "va_vet_center",
            47.5989,
            -122.3283,
            "4735 E Marginal Way S, Seattle, WA 98134",
            "Vet Center in King County, WA",
        ),
        (
            "Tacoma Vet Center",
            "va_vet_center",
            47.2335,
            -122.5036,
            "4916 Center St Suite E, Tacoma, WA 98409",
            "Vet Center in Pierce County, WA",
        ),
        (
            "Spokane Vet Center",
            "va_vet_center",
            47.6481,
            -117.4253,
            "13109 E Mirabeau Pkwy, Spokane Valley, WA 99216",
            "Vet Center in Spokane County, WA",
        ),
        (
            "Bellingham Vet Center",
            "va_vet_center",
            48.7336,
            -122.4662,
            "3800 Byron Ave Suite 124, Bellingham, WA 98229",
            "Vet Center in Whatcom County, WA",
        ),
        (
            "Federal Way Vet Center",
            "va_vet_center",
            47.3144,
            -122.2909,
            "32020 32nd Ave S Suite 110, Federal Way, WA 98001",
            "Vet Center in King County, WA",
        ),
        (
            "Yakima Valley Vet Center",
            "va_vet_center",
            46.5819,
            -120.5024,
            "1111 N 1st St Suite 1, Yakima, WA 98901",
            "Vet Center in Yakima County, WA",
        ),
    ]
    result = []
    for name, subcat, lat, lon, addr, desc in entries:
        item = dict(base)
        item.update(
            {
                "name": name,
                "subcategory": subcat,
                "latitude": lat,
                "longitude": lon,
                "address": addr,
                "description": desc,
            }
        )
        result.append(item)
    return result


# ---------------------------------------------------------------------------
# USDA Service Centers
# ---------------------------------------------------------------------------


def fetch_usda_wa():
    # type: () -> List[Dict]
    """
    Fetch USDA service centers for Washington.
    Uses the USDA Service Center Locator.
    """
    print("\n--- Fetching USDA service centers for WA ---")
    facilities = []  # type: List[Dict]

    try:
        # USDA Service Center Locator API
        url = "https://offices.sc.egov.usda.gov/locator/app"
        params = {
            "state": "WA",
            "agency": "all",
            "outputFormat": "json",
        }

        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            response = client.get(url, params=params)

            if response.status_code == 200:
                try:
                    data = response.json()
                    raw = (
                        data
                        if isinstance(data, list)
                        else data.get("results", data.get("offices", []))
                    )

                    for office in raw:
                        lat = _safe_float(office.get("latitude") or office.get("lat"))
                        lon = _safe_float(
                            office.get("longitude")
                            or office.get("lng")
                            or office.get("lon")
                        )

                        if lat and lon and is_in_washington(lat, lon):
                            agency = (office.get("agency") or "").upper()
                            subcategory = _usda_subcategory(agency)
                            address = ", ".join(
                                filter(
                                    None,
                                    [
                                        office.get("address", ""),
                                        office.get("city", ""),
                                        office.get("state", "WA"),
                                        office.get("zip", ""),
                                    ],
                                )
                            )

                            facilities.append(
                                {
                                    "name": office.get("name")
                                    or "USDA %s Office" % agency,
                                    "category": subcategory,
                                    "subcategory": subcategory,
                                    "latitude": lat,
                                    "longitude": lon,
                                    "description": "USDA %s service center in Washington state"
                                    % agency,
                                    "address": address,
                                    "phone": office.get("phone", ""),
                                    "website": office.get("website", ""),
                                    "source": "USDA",
                                }
                            )
                except (json.JSONDecodeError, ValueError):
                    print(
                        "  USDA response was not JSON \u2014 may need different approach"
                    )
            else:
                print(f"  USDA API returned status {response.status_code}")

    except Exception as e:
        print(f"  USDA fetch error: {e}")

    # If the API didn't return data, seed known WA USDA offices manually
    if len(facilities) == 0:
        print("  Using curated WA USDA facilities...")
        facilities = _get_curated_usda_wa()

    print(f"  Found {len(facilities)} USDA facilities in WA")
    return facilities


def _get_curated_usda_wa():
    # type: () -> List[Dict]
    """Curated list of known USDA service centers in Washington state."""
    return [
        {
            "name": "USDA Service Center - Spokane",
            "category": "usda_farm_service_center",
            "subcategory": "usda_farm_service_center",
            "latitude": 47.6588,
            "longitude": -117.4260,
            "description": "USDA Farm Service Agency and Natural Resources Conservation Service",
            "address": "11707 E Sprague Ave, Suite 303, Spokane, WA 99206",
            "phone": "(509) 323-3000",
            "website": "https://www.farmers.gov",
            "source": "USDA",
        },
        {
            "name": "USDA Service Center - Moses Lake",
            "category": "usda_farm_service_center",
            "subcategory": "usda_farm_service_center",
            "latitude": 47.1301,
            "longitude": -119.2781,
            "description": "USDA Farm Service Agency \u2014 Grant County Office",
            "address": "1005 S Pioneer Way, Moses Lake, WA 98837",
            "phone": "(509) 765-6664",
            "website": "https://www.farmers.gov",
            "source": "USDA",
        },
        {
            "name": "USDA Service Center - Yakima",
            "category": "usda_farm_service_center",
            "subcategory": "usda_farm_service_center",
            "latitude": 46.6021,
            "longitude": -120.5059,
            "description": "USDA Farm Service Agency \u2014 Yakima County Office",
            "address": "1606 Perry St Suite F, Yakima, WA 98902",
            "phone": "(509) 454-5667",
            "website": "https://www.farmers.gov",
            "source": "USDA",
        },
        {
            "name": "USDA Service Center - Mount Vernon",
            "category": "usda_farm_service_center",
            "subcategory": "usda_farm_service_center",
            "latitude": 48.4201,
            "longitude": -122.3343,
            "description": "USDA Farm Service Agency \u2014 Skagit County Office",
            "address": "2021 E College Way Suite 214, Mount Vernon, WA 98273",
            "phone": "(360) 428-7684",
            "website": "https://www.farmers.gov",
            "source": "USDA",
        },
        {
            "name": "WA SNAP Office - Seattle",
            "category": "usda_snap_office",
            "subcategory": "usda_snap_office",
            "latitude": 47.6062,
            "longitude": -122.3321,
            "description": "DSHS Community Service Office \u2014 SNAP benefits enrollment and assistance",
            "address": "1700 E Cherry St, Seattle, WA 98122",
            "phone": "(877) 501-2233",
            "website": "https://www.dshs.wa.gov/esa/community-services-offices",
            "source": "USDA",
        },
        {
            "name": "WA SNAP Office - Tacoma",
            "category": "usda_snap_office",
            "subcategory": "usda_snap_office",
            "latitude": 47.2529,
            "longitude": -122.4443,
            "description": "DSHS Community Service Office \u2014 SNAP benefits enrollment and assistance",
            "address": "1949 S State St, Tacoma, WA 98405",
            "phone": "(877) 501-2233",
            "website": "https://www.dshs.wa.gov/esa/community-services-offices",
            "source": "USDA",
        },
        {
            "name": "WA WIC Office - Olympia",
            "category": "usda_wic_office",
            "subcategory": "usda_wic_office",
            "latitude": 47.0379,
            "longitude": -122.9007,
            "description": "WIC (Women, Infants, and Children) nutrition program office",
            "address": "629 Legion Way SE, Olympia, WA 98501",
            "phone": "(360) 236-3555",
            "website": "https://www.doh.wa.gov/YouandYourFamily/WIC",
            "source": "USDA",
        },
    ]


# ---------------------------------------------------------------------------
# Refuge Restrooms
# ---------------------------------------------------------------------------


def fetch_refuge_restrooms_wa():
    # type: () -> List[Dict]
    """
    Fetch gender-neutral and accessible restrooms in WA from Refuge Restrooms API.

    Queries multiple WA metro areas to get statewide coverage.
    Deduplicates by Refuge API ID across overlapping search radii.
    """
    print("\n--- Fetching Refuge Restrooms for WA ---")
    facilities = []  # type: List[Dict]
    seen_ids = set()  # type: set

    try:
        with httpx.Client(timeout=30.0) as client:
            for lat, lon, city in WA_METRO_COORDS:
                try:
                    url = "https://www.refugerestrooms.org/api/v1/restrooms/by_location"
                    params = {
                        "lat": str(lat),
                        "lng": str(lon),
                        "per_page": "100",
                        "ada": "false",  # get all, we'll track accessibility separately
                    }
                    resp = client.get(url, params=params)
                    if resp.status_code != 200:
                        print(f"  Refuge API returned {resp.status_code} for {city}")
                        time.sleep(0.5)
                        continue

                    restrooms = resp.json()
                    city_count = 0
                    for r in restrooms:
                        rid = r.get("id")
                        if rid in seen_ids:
                            continue
                        seen_ids.add(rid)

                        rlat = _safe_float(r.get("latitude"))
                        rlon = _safe_float(r.get("longitude"))
                        if not rlat or not rlon or not is_in_washington(rlat, rlon):
                            continue

                        name = r.get("name") or "Public Restroom"
                        desc_parts = []
                        if r.get("unisex"):
                            desc_parts.append("Gender-neutral restroom")
                        else:
                            desc_parts.append("Public restroom")
                        if r.get("directions"):
                            desc_parts.append(r["directions"])
                        if r.get("comment"):
                            desc_parts.append(r["comment"])

                        facilities.append(
                            {
                                "name": name,
                                "category": "restroom",
                                "subcategory": "restroom",
                                "latitude": rlat,
                                "longitude": rlon,
                                "description": ". ".join(desc_parts)[:500],
                                "address": r.get("street", ""),
                                "phone": "",
                                "website": "",
                                "source": "Refuge Restrooms",
                                "wheelchair_accessible": bool(r.get("accessible")),
                                "has_baby_changing": bool(r.get("changing_table")),
                            }
                        )
                        city_count += 1

                    if city_count > 0:
                        print(f"  {city}: {city_count} restrooms")
                    time.sleep(0.5)  # Rate limit between city requests

                except Exception as e:
                    print(f"  Error fetching restrooms for {city}: {e}")
                    time.sleep(0.5)

    except Exception as e:
        print(f"  Refuge Restrooms fetch error: {e}")

    if len(facilities) == 0:
        print("  Using curated WA restroom locations...")
        facilities = _get_curated_restrooms()

    print(f"  Found {len(facilities)} restrooms in WA")
    return facilities


def _get_curated_restrooms():
    # type: () -> List[Dict]
    """Curated fallback restroom locations in Seattle area."""
    return [
        {
            "name": "Pike Place Market Public Restroom",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.6097,
            "longitude": -122.3425,
            "description": "Public restroom at Pike Place Market, lower level near the parking garage.",
            "address": "85 Pike St, Seattle, WA 98101",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": True,
        },
        {
            "name": "Pioneer Square Public Restroom",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.6020,
            "longitude": -122.3340,
            "description": "Portland Loo style public restroom in Pioneer Square.",
            "address": "Pioneer Square, Seattle, WA 98104",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": False,
        },
        {
            "name": "Seattle Center Armory Restroom",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.6215,
            "longitude": -122.3520,
            "description": "Public restroom inside the Seattle Center Armory building.",
            "address": "305 Harrison St, Seattle, WA 98109",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": True,
        },
        {
            "name": "Cal Anderson Park Restroom",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.6174,
            "longitude": -122.3193,
            "description": "Public restroom in Cal Anderson Park, Capitol Hill.",
            "address": "1635 11th Ave, Seattle, WA 98122",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": False,
        },
        {
            "name": "Westlake Park Public Restroom",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.6110,
            "longitude": -122.3370,
            "description": "Portland Loo public restroom at Westlake Park.",
            "address": "401 Pine St, Seattle, WA 98101",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": False,
        },
        {
            "name": "Green Lake Park Restroom (North)",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.6815,
            "longitude": -122.3400,
            "description": "Public restroom near the north end of Green Lake.",
            "address": "7201 E Green Lake Dr N, Seattle, WA 98115",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": False,
        },
        {
            "name": "Volunteer Park Restroom",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.6305,
            "longitude": -122.3158,
            "description": "Public restroom in Volunteer Park near the water tower.",
            "address": "1247 15th Ave E, Seattle, WA 98112",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": False,
        },
        {
            "name": "Tacoma Union Station Restroom",
            "category": "restroom",
            "subcategory": "restroom",
            "latitude": 47.2529,
            "longitude": -122.4395,
            "description": "Public restroom inside Union Station, Tacoma.",
            "address": "1717 Pacific Ave, Tacoma, WA 98402",
            "phone": "",
            "website": "",
            "source": "Refuge Restrooms",
            "wheelchair_accessible": True,
            "has_baby_changing": True,
        },
    ]


# ---------------------------------------------------------------------------
# Seattle Drinking Fountains
# ---------------------------------------------------------------------------


def fetch_seattle_fountains():
    # type: () -> List[Dict]
    """
    Fetch drinking fountain locations from Seattle's ArcGIS GeoData portal.

    Filters out removed/inactive fountains and enriches descriptions with
    park name, dog bowl, and bottle filler availability.
    """
    print("\n--- Fetching Seattle drinking fountains ---")
    facilities = []  # type: List[Dict]

    # Seattle Parks ArcGIS Feature Service for drinking fountains
    # NOTE: org ID is ZOyb2t4B0UYuYNYH (lowercase 'u', not 'h')
    base_url = (
        "https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services"
        "/Drinking_Fountain/FeatureServer/0"
    )

    try:
        features = _fetch_arcgis_all(
            base_url,
            where="1=1",
            out_fields="*",
            batch_size=500,
        )

        for feat in features:
            attrs = feat.get("attributes", {})
            geom = feat.get("geometry", {})

            lat = _safe_float(geom.get("y"))
            lon = _safe_float(geom.get("x"))
            if not lat or not lon or not is_in_washington(lat, lon):
                continue

            # Filter out removed/inactive fountains
            # API uses LIFE_CYCLE_CODE: A=Active, CURRENT_STATUS for closures
            lifecycle = (attrs.get("LIFE_CYCLE_CODE") or "A").upper()
            current_status = (attrs.get("CURRENT_STATUS") or "").upper()
            if lifecycle not in ("A", "ACTIVE", "") or current_status in (
                "REMOVED",
                "DECOMMISSIONED",
            ):
                continue

            equipdesc = attrs.get("EQUIPDESC") or ""
            park = attrs.get("PARK") or ""
            name = (
                equipdesc
                if equipdesc
                else ("Drinking Fountain - %s" % park if park else "Drinking Fountain")
            )
            desc_parts = ["Public drinking fountain"]

            if park:
                desc_parts.append("in %s" % park)

            dog_bowl = attrs.get("DOG_BOWL") or ""
            if dog_bowl and str(dog_bowl).upper() in ("YES", "Y", "1", "TRUE"):
                desc_parts.append("Dog bowl available")

            bottle_filler = attrs.get("BOTTLE_FILLER") or ""
            if bottle_filler and str(bottle_filler).upper() in (
                "YES",
                "Y",
                "1",
                "TRUE",
            ):
                desc_parts.append("Bottle filler available")

            facilities.append(
                {
                    "name": name[:255],
                    "category": "water_fountain",
                    "subcategory": "water_fountain",
                    "latitude": lat,
                    "longitude": lon,
                    "description": ". ".join(desc_parts),
                    "address": park if park else "",
                    "phone": "",
                    "website": "",
                    "source": "Seattle GeoData",
                    "wheelchair_accessible": True,
                    "has_baby_changing": False,
                }
            )

    except Exception as e:
        print(f"  Seattle Fountains fetch error: {e}")

    if len(facilities) == 0:
        print("  Using curated Seattle fountain locations...")
        facilities = _get_curated_fountains()

    print(f"  Found {len(facilities)} drinking fountains")
    return facilities


def _get_curated_fountains():
    # type: () -> List[Dict]
    """Curated fallback drinking fountain locations in Seattle."""
    base = {
        "category": "water_fountain",
        "subcategory": "water_fountain",
        "phone": "",
        "website": "",
        "source": "Seattle GeoData",
        "wheelchair_accessible": True,
        "has_baby_changing": False,
    }
    entries = [
        (
            "Green Lake Park Fountain",
            47.6812,
            -122.3408,
            "Public drinking fountain in Green Lake Park.",
            "Green Lake Park, Seattle, WA",
        ),
        (
            "Cal Anderson Park Fountain",
            47.6175,
            -122.3195,
            "Public drinking fountain in Cal Anderson Park.",
            "Cal Anderson Park, Seattle, WA",
        ),
        (
            "Volunteer Park Fountain",
            47.6306,
            -122.3155,
            "Public drinking fountain in Volunteer Park.",
            "Volunteer Park, Seattle, WA",
        ),
        (
            "Gas Works Park Fountain",
            47.6456,
            -122.3344,
            "Public drinking fountain in Gas Works Park.",
            "Gas Works Park, Seattle, WA",
        ),
        (
            "Kerry Park Fountain",
            47.6295,
            -122.3601,
            "Public drinking fountain near Kerry Park viewpoint.",
            "Kerry Park, Seattle, WA",
        ),
        (
            "Discovery Park Fountain",
            47.6573,
            -122.4057,
            "Public drinking fountain at Discovery Park visitor center.",
            "Discovery Park, Seattle, WA",
        ),
        (
            "Seward Park Fountain",
            47.5517,
            -122.2533,
            "Public drinking fountain in Seward Park.",
            "Seward Park, Seattle, WA",
        ),
        (
            "Woodland Park Fountain",
            47.6690,
            -122.3503,
            "Public drinking fountain in Woodland Park.",
            "Woodland Park, Seattle, WA",
        ),
        (
            "Lincoln Park Fountain",
            47.5314,
            -122.3934,
            "Public drinking fountain in Lincoln Park.",
            "Lincoln Park, Seattle, WA",
        ),
        (
            "Magnuson Park Fountain",
            47.6836,
            -122.2563,
            "Public drinking fountain in Magnuson Park.",
            "Magnuson Park, Seattle, WA",
        ),
    ]
    result = []
    for name, lat, lon, desc, addr in entries:
        item = dict(base)
        item.update(
            {
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "description": desc,
                "address": addr,
            }
        )
        result.append(item)
    return result


# ---------------------------------------------------------------------------
# Seattle Public WiFi
# ---------------------------------------------------------------------------


def fetch_seattle_wifi():
    # type: () -> List[Dict]
    """
    Fetch public WiFi locations in Seattle.

    Tries the Seattle Open Data (Socrata) API first, then falls back to a
    curated list of library branches and civic buildings with free WiFi.
    """
    print("\n--- Fetching Seattle public WiFi locations ---")
    facilities = []  # type: List[Dict]

    # Try Seattle Open Data Socrata endpoint for public WiFi
    try:
        url = "https://data.seattle.gov/resource/n4uh-mgsn.json"
        params = {"$limit": "200"}

        with httpx.Client(timeout=20.0) as client:
            resp = client.get(url, params=params)
            if resp.status_code == 200:
                data = resp.json()
                for item in data:
                    lat = _safe_float(
                        item.get("latitude")
                        or (item.get("location", {}) or {}).get("latitude")
                    )
                    lon = _safe_float(
                        item.get("longitude")
                        or (item.get("location", {}) or {}).get("longitude")
                    )
                    if lat and lon and is_in_washington(lat, lon):
                        name = (
                            item.get("name")
                            or item.get("location_name")
                            or "Public WiFi"
                        )
                        facilities.append(
                            {
                                "name": name,
                                "category": "wifi",
                                "subcategory": "wifi",
                                "latitude": lat,
                                "longitude": lon,
                                "description": "Free public WiFi hotspot",
                                "address": item.get("address", ""),
                                "phone": "",
                                "website": "",
                                "source": "Seattle Open Data",
                                "wheelchair_accessible": True,
                                "has_baby_changing": False,
                            }
                        )
            else:
                print(f"  Seattle WiFi API returned {resp.status_code}")

    except Exception as e:
        print(f"  Seattle WiFi fetch error: {e}")

    if len(facilities) == 0:
        print("  Using curated Seattle WiFi locations...")
        facilities = _get_curated_wifi()

    print(f"  Found {len(facilities)} WiFi locations")
    return facilities


def _get_curated_wifi():
    # type: () -> List[Dict]
    """Curated free public WiFi locations — Seattle Public Library branches and civic buildings."""
    base = {
        "category": "wifi",
        "subcategory": "wifi",
        "phone": "(206) 386-4636",
        "website": "https://www.spl.org",
        "source": "Seattle Open Data",
        "wheelchair_accessible": True,
        "has_baby_changing": False,
    }
    entries = [
        (
            "Seattle Central Library",
            47.6067,
            -122.3325,
            "1000 Fourth Ave, Seattle, WA 98104",
            "Free WiFi at Seattle Central Library. Open to the public.",
        ),
        (
            "Capitol Hill Branch Library",
            47.6231,
            -122.3209,
            "425 Harvard Ave E, Seattle, WA 98102",
            "Free WiFi at Capitol Hill Branch Library.",
        ),
        (
            "Ballard Branch Library",
            47.6688,
            -122.3843,
            "5614 22nd Ave NW, Seattle, WA 98107",
            "Free WiFi at Ballard Branch Library.",
        ),
        (
            "University Branch Library",
            47.6611,
            -122.3142,
            "5009 Roosevelt Way NE, Seattle, WA 98105",
            "Free WiFi at University Branch Library.",
        ),
        (
            "Columbia City Branch Library",
            47.5601,
            -122.2862,
            "4721 Rainier Ave S, Seattle, WA 98118",
            "Free WiFi at Columbia City Branch Library.",
        ),
        (
            "Beacon Hill Branch Library",
            47.5681,
            -122.3112,
            "2821 Beacon Ave S, Seattle, WA 98144",
            "Free WiFi at Beacon Hill Branch Library.",
        ),
        (
            "Fremont Branch Library",
            47.6510,
            -122.3499,
            "731 N 35th St, Seattle, WA 98103",
            "Free WiFi at Fremont Branch Library.",
        ),
        (
            "Greenwood Branch Library",
            47.6930,
            -122.3556,
            "8016 Greenwood Ave N, Seattle, WA 98103",
            "Free WiFi at Greenwood Branch Library.",
        ),
        (
            "Rainier Beach Branch Library",
            47.5103,
            -122.2666,
            "9125 Rainier Ave S, Seattle, WA 98118",
            "Free WiFi at Rainier Beach Branch Library.",
        ),
        (
            "West Seattle Branch Library",
            47.5605,
            -122.3877,
            "2306 42nd Ave SW, Seattle, WA 98116",
            "Free WiFi at West Seattle Branch Library.",
        ),
        (
            "Douglass-Truth Branch Library",
            47.6125,
            -122.2992,
            "2300 E Yesler Way, Seattle, WA 98122",
            "Free WiFi at Douglass-Truth Branch Library.",
        ),
        (
            "Magnolia Branch Library",
            47.6401,
            -122.3989,
            "2801 34th Ave W, Seattle, WA 98199",
            "Free WiFi at Magnolia Branch Library.",
        ),
        (
            "Northeast Branch Library",
            47.7113,
            -122.3282,
            "6801 35th Ave NE, Seattle, WA 98115",
            "Free WiFi at Northeast Branch Library.",
        ),
        (
            "Northgate Branch Library",
            47.7075,
            -122.3267,
            "10548 5th Ave NE, Seattle, WA 98125",
            "Free WiFi at Northgate Branch Library.",
        ),
        (
            "Queen Anne Branch Library",
            47.6363,
            -122.3575,
            "400 W Garfield St, Seattle, WA 98119",
            "Free WiFi at Queen Anne Branch Library.",
        ),
        (
            "South Park Branch Library",
            47.5267,
            -122.3212,
            "8604 8th Ave S, Seattle, WA 98108",
            "Free WiFi at South Park Branch Library.",
        ),
        (
            "Wallingford Branch Library",
            47.6617,
            -122.3345,
            "1501 N 45th St, Seattle, WA 98103",
            "Free WiFi at Wallingford Branch Library.",
        ),
        (
            "High Point Branch Library",
            47.5439,
            -122.3728,
            "3411 SW Raymond St, Seattle, WA 98126",
            "Free WiFi at High Point Branch Library.",
        ),
        (
            "International District Branch Library",
            47.5990,
            -122.3233,
            "713 8th Ave S, Seattle, WA 98104",
            "Free WiFi at International District Branch Library.",
        ),
        (
            "Lake City Branch Library",
            47.7192,
            -122.2937,
            "12501 28th Ave NE, Seattle, WA 98125",
            "Free WiFi at Lake City Branch Library.",
        ),
        (
            "Madrona-Sally Goldmark Branch Library",
            47.6121,
            -122.2888,
            "1134 33rd Ave, Seattle, WA 98122",
            "Free WiFi at Madrona-Sally Goldmark Branch Library.",
        ),
        (
            "Montlake Branch Library",
            47.6373,
            -122.3043,
            "2401 24th Ave E, Seattle, WA 98112",
            "Free WiFi at Montlake Branch Library.",
        ),
        (
            "NewHolly Branch Library",
            47.5417,
            -122.2905,
            "7058 32nd Ave S, Seattle, WA 98118",
            "Free WiFi at NewHolly Branch Library.",
        ),
        (
            "Broadview Branch Library",
            47.7235,
            -122.3558,
            "12755 Greenwood Ave N, Seattle, WA 98133",
            "Free WiFi at Broadview Branch Library.",
        ),
        (
            "Delridge Branch Library",
            47.5586,
            -122.3646,
            "5423 Delridge Way SW, Seattle, WA 98106",
            "Free WiFi at Delridge Branch Library.",
        ),
        (
            "Green Lake Branch Library",
            47.6795,
            -122.3290,
            "7364 E Green Lake Dr N, Seattle, WA 98115",
            "Free WiFi at Green Lake Branch Library.",
        ),
        (
            "Southwest Branch Library",
            47.5224,
            -122.3607,
            "9010 35th Ave SW, Seattle, WA 98126",
            "Free WiFi at Southwest Branch Library.",
        ),
        # Civic buildings
        (
            "Seattle City Hall",
            47.6039,
            -122.3303,
            "600 4th Ave, Seattle, WA 98104",
            "Free public WiFi in Seattle City Hall lobby.",
        ),
        (
            "Seattle Center",
            47.6215,
            -122.3530,
            "305 Harrison St, Seattle, WA 98109",
            "Free public WiFi at Seattle Center campus.",
        ),
        (
            "King County Customer Service Center",
            47.6013,
            -122.3316,
            "201 S Jackson St, Seattle, WA 98104",
            "Free public WiFi at King County Customer Service Center.",
        ),
    ]
    result = []
    for name, lat, lon, addr, desc in entries:
        item = dict(base)
        item.update(
            {
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "address": addr,
                "description": desc,
            }
        )
        # Civic buildings don't have library phone/website
        if "Library" not in name:
            item["phone"] = ""
            item["website"] = ""
        result.append(item)
    return result


# ---------------------------------------------------------------------------
# WA State Parks Facilities
# ---------------------------------------------------------------------------


def fetch_wa_parks_facilities():
    # type: () -> List[Dict]
    """
    Fetch facility data from WA State Parks via geo.wa.gov ArcGIS REST.

    Maps facility types to UrbanAid categories:
      RESTROOM / COMFORT STATION / VAULT TOILET -> restroom
      DRINKING FOUNTAIN -> water_fountain
      SHELTER / PICNIC SHELTER -> shelter
      BENCH -> bench
    """
    print("\n--- Fetching WA State Parks facilities ---")
    facilities = []  # type: List[Dict]

    # WA State Parks FICAP facilities ArcGIS service
    base_url = (
        "https://services.arcgis.com/jsIt88o09Q0r1j8h/arcgis/rest/services"
        "/StateParksFacilities/FeatureServer/0"
    )

    # Category mapping for facility types
    facility_type_map = {
        "RESTROOM": "restroom",
        "COMFORT STATION": "restroom",
        "VAULT TOILET": "restroom",
        "DRINKING FOUNTAIN": "water_fountain",
        "SHELTER": "shelter",
        "PICNIC SHELTER": "shelter",
        "BENCH": "bench",
    }

    try:
        features = _fetch_arcgis_all(
            base_url,
            where="1=1",
            out_fields="*",
            batch_size=1000,
        )

        for feat in features:
            attrs = feat.get("attributes", {})
            geom = feat.get("geometry", {})

            lat = _safe_float(geom.get("y"))
            lon = _safe_float(geom.get("x"))
            if not lat or not lon or not is_in_washington(lat, lon):
                continue

            # Get facility type and map to our category
            ftype = (
                (
                    attrs.get("FACILITY_TYPE")
                    or attrs.get("FacilityType")
                    or attrs.get("TYPE")
                    or ""
                )
                .upper()
                .strip()
            )

            category = None
            for key, cat in facility_type_map.items():
                if key in ftype:
                    category = cat
                    break

            if not category:
                continue  # Skip facility types we don't map

            park_name = (
                attrs.get("PARK_NAME")
                or attrs.get("ParkName")
                or attrs.get("PARK")
                or "WA State Park"
            )
            facility_name = (
                attrs.get("FACILITY_NAME") or attrs.get("Name") or ftype.title()
            )

            facilities.append(
                {
                    "name": "%s - %s" % (park_name, facility_name),
                    "category": category,
                    "subcategory": category,
                    "latitude": lat,
                    "longitude": lon,
                    "description": "%s facility at %s (WA State Parks)"
                    % (ftype.title(), park_name),
                    "address": park_name,
                    "phone": "",
                    "website": "https://parks.wa.gov",
                    "source": "WA State Parks",
                    "wheelchair_accessible": True,
                    "has_baby_changing": False,
                }
            )

    except Exception as e:
        print(f"  WA State Parks fetch error: {e}")

    if len(facilities) == 0:
        print("  Using curated WA State Parks facilities...")
        facilities = _get_curated_parks()

    print(f"  Found {len(facilities)} state park facilities")
    return facilities


def _get_curated_parks():
    # type: () -> List[Dict]
    """Curated fallback WA State Parks facilities."""
    base = {
        "phone": "",
        "website": "https://parks.wa.gov",
        "source": "WA State Parks",
        "wheelchair_accessible": True,
        "has_baby_changing": False,
    }
    entries = [
        (
            "Deception Pass SP - Restroom (Cranberry Lake)",
            "restroom",
            48.3963,
            -122.6490,
            "Restroom facility at Cranberry Lake area, Deception Pass State Park.",
        ),
        (
            "Deception Pass SP - Restroom (West Beach)",
            "restroom",
            48.3996,
            -122.6551,
            "Restroom facility at West Beach, Deception Pass State Park.",
        ),
        (
            "Deception Pass SP - Picnic Shelter",
            "shelter",
            48.3970,
            -122.6485,
            "Covered picnic shelter at Deception Pass State Park.",
        ),
        (
            "Fort Worden SP - Restroom",
            "restroom",
            48.1374,
            -122.7654,
            "Restroom facility at Fort Worden Historical State Park.",
        ),
        (
            "Fort Worden SP - Picnic Shelter",
            "shelter",
            48.1370,
            -122.7640,
            "Covered picnic shelter at Fort Worden Historical State Park.",
        ),
        (
            "Moran SP - Restroom (Mountain Lake)",
            "restroom",
            48.6671,
            -122.8340,
            "Restroom facility near Mountain Lake, Moran State Park.",
        ),
        (
            "Moran SP - Shelter",
            "shelter",
            48.6665,
            -122.8335,
            "Covered shelter at Moran State Park, Orcas Island.",
        ),
        (
            "Palouse Falls SP - Restroom",
            "restroom",
            46.6639,
            -118.2268,
            "Vault toilet at Palouse Falls State Park.",
        ),
        (
            "Cape Disappointment SP - Restroom",
            "restroom",
            46.2818,
            -124.0501,
            "Restroom facility at Cape Disappointment State Park.",
        ),
        (
            "Beacon Rock SP - Restroom",
            "restroom",
            45.6286,
            -122.0226,
            "Restroom facility at Beacon Rock State Park.",
        ),
        (
            "Riverside SP - Restroom",
            "restroom",
            47.8433,
            -117.5023,
            "Restroom facility at Riverside State Park, Spokane.",
        ),
        (
            "Riverside SP - Bench",
            "bench",
            47.8440,
            -117.5030,
            "Bench along the Spokane River trail at Riverside State Park.",
        ),
        (
            "Sun Lakes-Dry Falls SP - Restroom",
            "restroom",
            47.5851,
            -119.3733,
            "Restroom facility at Sun Lakes-Dry Falls State Park.",
        ),
        (
            "Larrabee SP - Restroom",
            "restroom",
            48.6537,
            -122.4910,
            "Restroom facility at Larrabee State Park, Bellingham.",
        ),
        (
            "Saltwater SP - Restroom",
            "restroom",
            47.3726,
            -122.3270,
            "Restroom facility at Saltwater State Park, Des Moines.",
        ),
    ]
    result = []
    for name, cat, lat, lon, desc in entries:
        item = dict(base)
        item.update(
            {
                "name": name,
                "category": cat,
                "subcategory": cat,
                "latitude": lat,
                "longitude": lon,
                "description": desc,
                "address": name.split(" - ")[0],
            }
        )
        result.append(item)
    return result


# ---------------------------------------------------------------------------
# King County Metro Transit Shelters
# ---------------------------------------------------------------------------


def fetch_kc_metro_shelters():
    # type: () -> List[Dict]
    """
    Fetch transit shelter locations from King County GIS ArcGIS REST service.

    Filters for stops that have shelters and maps to the 'transit' category.
    """
    print("\n--- Fetching King County Metro transit shelters ---")
    facilities = []  # type: List[Dict]

    # King County GIS — Transit/Public_Transit/MapServer, Layer 2 = Bus_Stops
    # Field NUM_SHELTERS > 0 indicates the stop has one or more shelters
    base_url = (
        "https://gismaps.kingcounty.gov/arcgis/rest/services"
        "/Transit/Public_Transit/MapServer/2"
    )

    try:
        features = _fetch_arcgis_all(
            base_url,
            where="NUM_SHELTERS > 0",  # Server-side filter for sheltered stops
            out_fields="STOP_ID,ON_STREET_NAME,CF_CROSS_STREETNAME,ROUTE_LIST,NUM_SHELTERS,JURISDICTION,STOP_STATUS",
            batch_size=1000,
        )

        for feat in features:
            attrs = feat.get("attributes", {})
            geom = feat.get("geometry", {})

            lat = _safe_float(geom.get("y"))
            lon = _safe_float(geom.get("x"))
            if not lat or not lon or not is_in_washington(lat, lon):
                continue

            # Skip inactive stops
            stop_status = (attrs.get("STOP_STATUS") or "").upper()
            if stop_status and stop_status != "ACT":
                continue

            on_street = attrs.get("ON_STREET_NAME") or ""
            cross_street = attrs.get("CF_CROSS_STREETNAME") or ""
            if on_street and cross_street:
                stop_name = "Transit Shelter - %s & %s" % (on_street, cross_street)
            elif on_street:
                stop_name = "Transit Shelter - %s" % on_street
            else:
                stop_name = "Transit Shelter #%s" % (attrs.get("STOP_ID") or "")

            desc_parts = ["Metro transit shelter"]
            num_shelters = attrs.get("NUM_SHELTERS") or 1
            if num_shelters and int(num_shelters) > 1:
                desc_parts.append("%d shelters" % int(num_shelters))
            routes = attrs.get("ROUTE_LIST") or ""
            if routes:
                desc_parts.append("Routes: %s" % routes)

            jurisdiction = attrs.get("JURISDICTION") or ""

            # OBA Puget Sound uses "1_XXXXX" for King County Metro stops
            stop_id = attrs.get("STOP_ID")
            oba_id = "1_%s" % stop_id if stop_id else None

            facilities.append(
                {
                    "name": stop_name[:255],
                    "category": "transit",
                    "subcategory": "transit",
                    "latitude": lat,
                    "longitude": lon,
                    "description": ". ".join(desc_parts),
                    "address": (
                        "%s & %s, %s" % (on_street, cross_street, jurisdiction)
                    ).strip(", ")
                    if on_street
                    else "",
                    "phone": "",
                    "website": "https://kingcounty.gov/metro",
                    "source": "KC Metro",
                    "wheelchair_accessible": True,
                    "has_baby_changing": False,
                    "external_id": oba_id,
                }
            )

    except Exception as e:
        print(f"  KC Metro fetch error: {e}")

    if len(facilities) == 0:
        print("  Using curated KC Metro transit shelter locations...")
        facilities = _get_curated_transit()

    print(f"  Found {len(facilities)} transit shelters")
    return facilities


def _get_curated_transit():
    # type: () -> List[Dict]
    """Curated fallback transit shelter/hub locations."""
    base = {
        "category": "transit",
        "subcategory": "transit",
        "phone": "",
        "website": "https://kingcounty.gov/metro",
        "source": "KC Metro",
        "wheelchair_accessible": True,
        "has_baby_changing": False,
    }
    entries = [
        (
            "U-District Station Transit Shelter",
            47.6614,
            -122.3131,
            "4700 University Way NE, Seattle, WA 98105",
            "Metro transit shelter at U-District Station. Major transfer point.",
        ),
        (
            "Capitol Hill Station Transit Shelter",
            47.6195,
            -122.3208,
            "1424 Broadway, Seattle, WA 98122",
            "Metro transit shelter at Capitol Hill Station.",
        ),
        (
            "Westlake Station Transit Shelter",
            47.6113,
            -122.3370,
            "400 Pine St, Seattle, WA 98101",
            "Metro transit hub at Westlake Station. Major transfer point.",
        ),
        (
            "Pioneer Square Station Transit Shelter",
            47.6021,
            -122.3314,
            "3rd Ave & James St, Seattle, WA 98104",
            "Metro transit shelter at Pioneer Square Station.",
        ),
        (
            "International District Station Transit Shelter",
            47.5982,
            -122.3279,
            "5th Ave S & S Jackson St, Seattle, WA 98104",
            "Metro transit shelter at International District Station.",
        ),
        (
            "Columbia City Station Transit Shelter",
            47.5601,
            -122.2870,
            "4800 Rainier Ave S, Seattle, WA 98118",
            "Metro transit shelter at Columbia City Station.",
        ),
        (
            "Northgate Station Transit Shelter",
            47.7065,
            -122.3266,
            "10230 4th Ave NE, Seattle, WA 98125",
            "Metro transit hub at Northgate Station. Major transfer point.",
        ),
        (
            "Bellevue Transit Center Shelter",
            47.6159,
            -122.1960,
            "108th Ave NE & NE 6th St, Bellevue, WA 98004",
            "Metro transit shelter at Bellevue Transit Center.",
        ),
        (
            "Tacoma Dome Station Transit Shelter",
            47.2392,
            -122.4282,
            "610 Puyallup Ave, Tacoma, WA 98421",
            "Metro transit shelter at Tacoma Dome Station. Sounder & bus transfer.",
        ),
        (
            "Tukwila International Blvd Station Transit Shelter",
            47.4649,
            -122.2882,
            "18000 International Blvd, Tukwila, WA 98188",
            "Metro transit shelter at Tukwila Station.",
        ),
        (
            "Rainier Beach Station Transit Shelter",
            47.5222,
            -122.2691,
            "8702 Rainier Ave S, Seattle, WA 98118",
            "Metro transit shelter at Rainier Beach Station.",
        ),
        (
            "Burien Transit Center Shelter",
            47.4710,
            -122.3430,
            "14900 4th Ave SW, Burien, WA 98166",
            "Metro transit shelter at Burien Transit Center.",
        ),
        (
            "Auburn Station Transit Shelter",
            47.3072,
            -122.2284,
            "23 A St SW, Auburn, WA 98001",
            "Metro transit shelter at Auburn Station.",
        ),
        (
            "Federal Way Transit Center Shelter",
            47.3183,
            -122.3030,
            "31507 Pete von Reichbauer Way S, Federal Way, WA 98003",
            "Metro transit shelter at Federal Way Transit Center.",
        ),
        (
            "Kent Station Transit Shelter",
            47.3847,
            -122.2345,
            "321 1st Ave N, Kent, WA 98032",
            "Metro transit shelter at Kent Station.",
        ),
    ]
    result = []
    for name, lat, lon, addr, desc in entries:
        item = dict(base)
        item.update(
            {
                "name": name,
                "latitude": lat,
                "longitude": lon,
                "address": addr,
                "description": desc,
            }
        )
        result.append(item)
    return result


# ---------------------------------------------------------------------------
# WA211 Food Banks & Free Meals
# ---------------------------------------------------------------------------


def fetch_wa211_food():
    # type: () -> List[Dict]
    """
    Fetch food banks and free meal programs from Washington 211 (search.wa211.org).

    WA211 is a Next.js app that embeds search results as __NEXT_DATA__ JSON.
    We paginate through two taxonomy codes:
      - BD-1800.2000 = Food Pantries / Food Banks
      - BD-5000.8300 = Free Meals / Soup Kitchens

    Each listing includes name, address, phone, website, coordinates, and summary.
    Coordinates are GeoJSON order: [longitude, latitude].
    """
    print("\n--- Fetching WA211 food banks & free meals ---")
    facilities = []  # type: List[Dict]
    seen_coords = set()  # type: set

    taxonomy_codes = [
        ("BD-1800.2000", "food_pantry"),  # Food Pantries / Food Banks
        ("BD-5000.8300", "community_meal"),  # Free Meals / Soup Kitchens
    ]

    # Regex to clean service name: remove "offered by/at ..." suffix
    name_clean_re = re.compile(r"\s+offered\s+(by|at)\s+.*$", re.IGNORECASE)

    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            for taxonomy, subcategory in taxonomy_codes:
                page = 1
                page_count = 0

                while True:
                    url = "https://search.wa211.org/search"
                    params = {
                        "query": taxonomy,
                        "query_type": "taxonomy",
                        "page": str(page),
                    }

                    try:
                        resp = client.get(url, params=params)
                        if resp.status_code != 200:
                            print(
                                f"  WA211 returned {resp.status_code} for {taxonomy} page {page}"
                            )
                            break

                        # Extract __NEXT_DATA__ JSON from the HTML
                        match = re.search(
                            r'<script\s+id="__NEXT_DATA__"\s+type="application/json">\s*({.*?})\s*</script>',
                            resp.text,
                            re.DOTALL,
                        )
                        if not match:
                            # No more data or page structure changed
                            break

                        next_data = json.loads(match.group(1))

                        # Navigate to the search results in the Next.js page props
                        page_props = next_data.get("props", {}).get("pageProps", {})
                        results = (
                            page_props.get("searchResults")
                            or page_props.get("results")
                            or page_props.get("data", {}).get("results")
                            or []
                        )

                        if not results:
                            break

                        for entry in results:
                            location = entry.get("location") or {}
                            coords = location.get("coordinates") or []
                            if len(coords) < 2:
                                continue

                            # GeoJSON: [longitude, latitude]
                            lon = _safe_float(coords[0])
                            lat = _safe_float(coords[1])
                            if not lat or not lon or not is_in_washington(lat, lon):
                                continue

                            # Coordinate dedup within this fetch
                            coord_key = (round(lat * 10000), round(lon * 10000))
                            if coord_key in seen_coords:
                                continue
                            seen_coords.add(coord_key)

                            raw_name = (
                                entry.get("serviceName")
                                or entry.get("name")
                                or "Food Resource"
                            )
                            name = name_clean_re.sub("", raw_name).strip()
                            if not name:
                                name = raw_name.strip()

                            summary = (entry.get("summary") or "").strip()
                            address = (entry.get("address") or "").strip()
                            phone = (entry.get("phone") or "").strip()
                            website = (entry.get("website") or "").strip()

                            facilities.append(
                                {
                                    "name": name[:255],
                                    "category": "free_food",
                                    "subcategory": subcategory,
                                    "latitude": lat,
                                    "longitude": lon,
                                    "description": summary[:500]
                                    if summary
                                    else "Free food resource",
                                    "address": address,
                                    "phone": phone,
                                    "website": website,
                                    "source": "WA211",
                                }
                            )
                            page_count += 1

                        page += 1
                        time.sleep(0.5)  # Polite rate limiting

                    except (json.JSONDecodeError, KeyError) as e:
                        print(f"  WA211 parse error on {taxonomy} page {page}: {e}")
                        break
                    except Exception as e:
                        print(f"  WA211 fetch error on {taxonomy} page {page}: {e}")
                        break

                print(
                    f"  {taxonomy} ({subcategory}): {page_count} entries across {page - 1} pages"
                )

    except Exception as e:
        print(f"  WA211 fetch error: {e}")

    print(f"  Found {len(facilities)} food resources in WA")
    return facilities


# ---------------------------------------------------------------------------
# WA211 Homeless Shelters
# ---------------------------------------------------------------------------


def fetch_wa211_shelters():
    # type: () -> List[Dict]
    """
    Fetch homeless shelters from Washington 211 (search.wa211.org).

    Uses the same __NEXT_DATA__ JSON extraction pattern as fetch_wa211_food().
    Queries shelter-related AIRS taxonomy codes:
      - BH-1800          = Emergency Shelter (general)
      - BH-1800.2500     = Homeless/Homeless Youth Shelters
      - BH-1800.8500     = Transitional Shelter/Housing
      - BH-1800.1500     = Domestic Violence Shelters
      - BH-1800.9000     = Warming Centers / Cold Weather Shelters

    Coordinates are GeoJSON order: [longitude, latitude].
    Falls back to a curated list of major WA shelters if scraping fails.
    """
    print("\n--- Fetching WA211 homeless shelters ---")
    facilities = []  # type: List[Dict]
    seen_coords = set()  # type: set

    taxonomy_codes = [
        ("BH-1800", "emergency_shelter"),
        ("BH-1800.2500", "homeless_shelter"),
        ("BH-1800.8500", "transitional_housing"),
        ("BH-1800.1500", "domestic_violence"),
        ("BH-1800.9000", "warming_center"),
    ]

    # Regex to clean service name: remove "offered by/at ..." suffix
    name_clean_re = re.compile(r"\s+offered\s+(by|at)\s+.*$", re.IGNORECASE)

    try:
        with httpx.Client(timeout=30.0, follow_redirects=True) as client:
            for taxonomy, subcategory in taxonomy_codes:
                page = 1
                page_count = 0

                while True:
                    url = "https://search.wa211.org/search"
                    params = {
                        "query": taxonomy,
                        "query_type": "taxonomy",
                        "page": str(page),
                    }

                    try:
                        resp = client.get(url, params=params)
                        if resp.status_code != 200:
                            print(
                                f"  WA211 returned {resp.status_code} for {taxonomy} page {page}"
                            )
                            break

                        # Extract __NEXT_DATA__ JSON from the HTML
                        match = re.search(
                            r'<script\s+id="__NEXT_DATA__"\s+type="application/json">\s*({.*?})\s*</script>',
                            resp.text,
                            re.DOTALL,
                        )
                        if not match:
                            break

                        next_data = json.loads(match.group(1))

                        # Navigate to the search results in the Next.js page props
                        page_props = next_data.get("props", {}).get("pageProps", {})
                        results = (
                            page_props.get("searchResults")
                            or page_props.get("results")
                            or page_props.get("data", {}).get("results")
                            or []
                        )

                        if not results:
                            break

                        for entry in results:
                            location = entry.get("location") or {}
                            coords = location.get("coordinates") or []
                            if len(coords) < 2:
                                continue

                            # GeoJSON: [longitude, latitude]
                            lon = _safe_float(coords[0])
                            lat = _safe_float(coords[1])
                            if not lat or not lon or not is_in_washington(lat, lon):
                                continue

                            # Coordinate dedup at ~11m precision
                            coord_key = (round(lat * 10000), round(lon * 10000))
                            if coord_key in seen_coords:
                                continue
                            seen_coords.add(coord_key)

                            raw_name = (
                                entry.get("serviceName")
                                or entry.get("name")
                                or "Homeless Shelter"
                            )
                            name = name_clean_re.sub("", raw_name).strip()
                            if not name:
                                name = raw_name.strip()

                            summary = (entry.get("summary") or "").strip()
                            address = (entry.get("address") or "").strip()
                            phone = (entry.get("phone") or "").strip()
                            website = (entry.get("website") or "").strip()

                            facilities.append(
                                {
                                    "name": name[:255],
                                    "category": "shelter",
                                    "subcategory": subcategory,
                                    "latitude": lat,
                                    "longitude": lon,
                                    "description": summary[:500]
                                    if summary
                                    else "Homeless shelter resource",
                                    "address": address,
                                    "phone": phone,
                                    "website": website,
                                    "source": "WA211",
                                }
                            )
                            page_count += 1

                        page += 1
                        time.sleep(0.5)  # Polite rate limiting

                    except (json.JSONDecodeError, KeyError) as e:
                        print(f"  WA211 parse error on {taxonomy} page {page}: {e}")
                        break
                    except Exception as e:
                        print(f"  WA211 fetch error on {taxonomy} page {page}: {e}")
                        break

                print(
                    f"  {taxonomy} ({subcategory}): {page_count} entries across {page - 1} pages"
                )

    except Exception as e:
        print(f"  WA211 shelters fetch error: {e}")

    # Merge in curated shelters (dedups via seen_coords)
    curated = _get_curated_shelters()
    curated_added = 0
    for entry in curated:
        coord_key = (
            round(entry["latitude"] * 10000),
            round(entry["longitude"] * 10000),
        )
        if coord_key not in seen_coords:
            seen_coords.add(coord_key)
            facilities.append(entry)
            curated_added += 1
    if curated_added:
        print(f"  Added {curated_added} curated shelters")

    print(f"  Found {len(facilities)} shelter resources in WA")
    return facilities


def _get_curated_shelters():
    # type: () -> List[Dict]
    """
    Curated list of major homeless shelters in Washington state.

    These are well-known shelters manually geocoded from
    HomelessShelterDirectory.org and verified against public records.
    They serve as a fallback when scraping yields no data and also
    fill gaps in WA211 coverage for prominent shelters.
    """
    base = {
        "category": "shelter",
        "source": "Curated (HomelessShelterDirectory.org)",
    }
    entries = [
        # Seattle
        (
            "Compass Center Day Shelter",
            "emergency_shelter",
            47.6062,
            -122.3381,
            "2015 3rd Ave, Seattle, WA 98121",
            "(206) 474-0186",
            "Day shelter providing meals, case management, and housing referrals.",
        ),
        (
            "Bread of Life Mission",
            "emergency_shelter",
            47.5984,
            -122.3281,
            "97 S Main St, Seattle, WA 98104",
            "(206) 682-3579",
            "Emergency overnight shelter and meals for men. Faith-based mission.",
        ),
        (
            "Seattle's Union Gospel Mission",
            "emergency_shelter",
            47.5983,
            -122.3332,
            "318 2nd Ave Extension S, Seattle, WA 98104",
            "(206) 622-5177",
            "Emergency shelter, meals, and recovery programs for men and families.",
        ),
        (
            "Sacred Heart Shelter",
            "emergency_shelter",
            47.6062,
            -122.3321,
            "232 Warren Ave N, Seattle, WA 98109",
            "(206) 285-7489",
            "Emergency shelter for single adults operated by Catholic Community Services.",
        ),
        (
            "Salvation Army Women's Shelter",
            "domestic_violence",
            47.6033,
            -122.3336,
            "1101 Pike St, Seattle, WA 98101",
            "(206) 447-9944",
            "Emergency shelter for women and families. Salvation Army operated.",
        ),
        (
            "Noel House Women's Referral Center",
            "emergency_shelter",
            47.6115,
            -122.3370,
            "118 Bell St, Seattle, WA 98121",
            "(206) 441-3210",
            "Referral center and shelter for single women in downtown Seattle.",
        ),
        (
            "Mary's Place Family Shelter",
            "homeless_shelter",
            47.6245,
            -122.3555,
            "1830 9th Ave W, Seattle, WA 98119",
            "(206) 621-8474",
            "Family shelter providing safe overnight accommodations and services for families with children.",
        ),
        (
            "DESC Emergency Shelter",
            "emergency_shelter",
            47.6013,
            -122.3316,
            "515 3rd Ave, Seattle, WA 98104",
            "(206) 464-1570",
            "Emergency shelter and supportive services for chronically homeless adults.",
        ),
        (
            "YouthCare Orion Center",
            "homeless_shelter",
            47.6138,
            -122.3375,
            "1828 Yale Ave, Seattle, WA 98101",
            "(206) 694-4500",
            "Drop-in center and shelter for homeless youth ages 12-24.",
        ),
        # Spokane
        (
            "Union Gospel Mission - Spokane",
            "emergency_shelter",
            47.6544,
            -117.4170,
            "1224 E Trent Ave, Spokane, WA 99202",
            "(509) 535-8510",
            "Emergency shelter, meals, and recovery programs in Spokane.",
        ),
        (
            "Spokane Salvation Army Shelter",
            "emergency_shelter",
            47.6561,
            -117.4119,
            "222 E Indiana Ave, Spokane, WA 99207",
            "(509) 325-6810",
            "Emergency shelter and social services for individuals and families.",
        ),
        (
            "Hope House Spokane",
            "transitional_housing",
            47.6602,
            -117.4253,
            "4005 N Cook St, Spokane, WA 99207",
            "(509) 325-4310",
            "Transitional housing and support services for homeless women and children.",
        ),
        (
            "House of Charity Spokane",
            "emergency_shelter",
            47.6583,
            -117.4097,
            "32 W Pacific Ave, Spokane, WA 99201",
            "(509) 624-7821",
            "Emergency shelter providing beds, meals, and case management.",
        ),
        (
            "Crosswalk Spokane Youth Shelter",
            "homeless_shelter",
            47.6508,
            -117.4265,
            "525 W 2nd Ave, Spokane, WA 99201",
            "(509) 624-2378",
            "Emergency shelter and services for homeless youth in Spokane.",
        ),
        (
            "VOA Crosswalk Shelter",
            "homeless_shelter",
            47.6542,
            -117.4235,
            "525 W 2nd Ave, Spokane, WA 99201",
            "(509) 536-1050",
            "Youth emergency shelter operated by Volunteers of America.",
        ),
        (
            "Family Promise of Spokane",
            "homeless_shelter",
            47.6570,
            -117.4120,
            "904 E Hartson Ave, Spokane, WA 99202",
            "(509) 747-5487",
            "Temporary shelter and support for homeless families with children.",
        ),
        # Tacoma
        (
            "Tacoma Rescue Mission",
            "emergency_shelter",
            47.2509,
            -122.4391,
            "425 S Tacoma Way, Tacoma, WA 98402",
            "(253) 383-4493",
            "Emergency shelter and meals for men, women, and families in Tacoma.",
        ),
        (
            "Nativity House Tacoma",
            "emergency_shelter",
            47.2538,
            -122.4425,
            "702 S 14th St, Tacoma, WA 98405",
            "(253) 502-2786",
            "Emergency shelter providing day and night services for homeless adults.",
        ),
        (
            "Catholic Community Services Tacoma",
            "emergency_shelter",
            47.2543,
            -122.4400,
            "1323 S Yakima Ave, Tacoma, WA 98405",
            "(253) 502-2600",
            "Emergency shelter and social services for individuals and families in Tacoma.",
        ),
        # Olympia
        (
            "Interfaith Works Emergency Overnight Shelter",
            "emergency_shelter",
            47.0425,
            -122.8975,
            "602 State Ave NE, Olympia, WA 98501",
            "(360) 357-7224",
            "Emergency overnight shelter in Olympia for single adults.",
        ),
        (
            "Family Support Center of South Sound",
            "homeless_shelter",
            47.0379,
            -122.9007,
            "201 Capitol Way N, Olympia, WA 98501",
            "(360) 754-9297",
            "Shelter and services for homeless families in the Olympia area.",
        ),
        # Bellingham
        (
            "Lighthouse Mission Ministries",
            "emergency_shelter",
            48.7519,
            -122.4787,
            "910 W Holly St, Bellingham, WA 98225",
            "(360) 733-5120",
            "Emergency shelter, meals, and recovery programs in Bellingham.",
        ),
        (
            "Whatcom County Cold Weather Shelter",
            "warming_center",
            48.7550,
            -122.4750,
            "Bellingham, WA 98225",
            "(360) 733-5120",
            "Seasonal cold weather shelter activated during freezing temperatures.",
        ),
        # Vancouver
        (
            "Share House Shelter",
            "emergency_shelter",
            45.6280,
            -122.6740,
            "2306 NE Andresen Rd, Vancouver, WA 98661",
            "(360) 448-2121",
            "Emergency shelter for men, women, and families in Vancouver, WA.",
        ),
        (
            "Lincoln Place Shelter",
            "transitional_housing",
            45.6300,
            -122.6712,
            "711 W 13th St, Vancouver, WA 98660",
            "(360) 993-9556",
            "Transitional shelter and housing support in Vancouver, WA.",
        ),
    ]
    result = []
    for name, subcat, lat, lon, addr, phone, desc in entries:
        item = dict(base)
        item.update(
            {
                "name": name,
                "subcategory": subcat,
                "latitude": lat,
                "longitude": lon,
                "address": addr,
                "phone": phone,
                "website": "",
                "description": desc,
            }
        )
        result.append(item)
    return result


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _safe_float(val):
    """Safely convert a value to float, returning None on failure."""
    if val is None:
        return None
    try:
        f = float(val)
        return f if f != 0 else None
    except (ValueError, TypeError):
        return None


def _build_address(data):
    # type: (Dict) -> str
    """Build a single address string from HRSA-style data."""
    parts = [
        data.get("address") or data.get("Address") or data.get("site_address") or "",
        data.get("city") or data.get("City") or data.get("site_city") or "",
        data.get("state") or data.get("State") or "WA",
        data.get("zip") or data.get("Zip") or data.get("site_postal_code") or "",
    ]
    return ", ".join(filter(None, parts))


def _va_subcategory(facility_type, classification):
    # type: (str, str) -> str
    """Map VA facility type to our category system."""
    ft = (facility_type or "").lower()
    cl = (classification or "").lower()
    if "medical center" in ft or "vamc" in cl:
        return "va_medical_center"
    elif "outpatient" in ft or "clinic" in ft or "cboc" in cl:
        return "va_outpatient_clinic"
    elif "vet center" in ft:
        return "va_vet_center"
    return "va_facility"


def _usda_subcategory(agency):
    # type: (str) -> str
    """Map USDA agency to our category system."""
    agency = agency.upper()
    if "FSA" in agency or "FARM" in agency:
        return "usda_farm_service_center"
    elif "FNS" in agency or "SNAP" in agency:
        return "usda_snap_office"
    elif "WIC" in agency:
        return "usda_wic_office"
    return "usda_farm_service_center"


# ---------------------------------------------------------------------------
# Database operations
# ---------------------------------------------------------------------------


def clear_all(db):
    # type: (Session) -> None
    """Delete all utilities from the database."""
    count = db.query(Utility).delete()
    db.commit()
    print(f"\nCleared {count} existing utilities from database.")


def _coord_key(category, lat, lon):
    # type: (str, float, float) -> Tuple[str, int, int]
    """
    Generate a dedup key from category and coordinates.

    Rounds to ~11m precision (0.0001 degrees) so that records at
    effectively the same location with the same category are treated
    as duplicates.
    """
    return (category, round(lat * 10000), round(lon * 10000))


def insert_facilities(db, facilities):
    # type: (Session, List[Dict]) -> Tuple[int, int]
    """
    Insert transformed facilities into the utilities table.

    Returns (inserted_count, skipped_count).
    Performs coordinate-based dedup against both existing DB records and
    within the current batch.
    """
    # Build set of existing coordinate keys for dedup
    existing_keys = set()  # type: set
    existing = db.query(Utility.category, Utility.latitude, Utility.longitude).all()
    for cat, lat, lon in existing:
        existing_keys.add(_coord_key(cat, lat, lon))

    inserted = 0
    skipped = 0

    for f in facilities:
        key = _coord_key(f["category"], f["latitude"], f["longitude"])
        if key in existing_keys:
            skipped += 1
            continue
        existing_keys.add(key)

        utility = Utility(
            id=str(uuid.uuid4()),
            name=f["name"][:255],
            category=f["category"],
            subcategory=f.get("subcategory"),
            latitude=f["latitude"],
            longitude=f["longitude"],
            description=f.get("description", ""),
            address=f.get("address", ""),
            phone=f.get("phone", ""),
            website=f.get("website", ""),
            external_id=f.get("external_id"),
            verified=True,  # Government data is pre-verified
            is_active=True,
            wheelchair_accessible=f.get("wheelchair_accessible", True),
            has_baby_changing=f.get("has_baby_changing", False),
        )
        db.add(utility)
        inserted += 1

    db.commit()
    return inserted, skipped


def seed_custom(db, custom_utilities):
    # type: (Session, List[Dict]) -> Tuple[int, int]
    """
    Insert user-provided custom utilities.

    Each dict in custom_utilities should have at minimum:
      name, category, latitude, longitude

    Example:
        seed_custom(db, [
            {"name": "Free Shower - Union Gospel", "category": "shower",
             "latitude": 47.6015, "longitude": -122.3320,
             "address": "318 2nd Ave Extension S, Seattle, WA 98104"}
        ])
    """
    return insert_facilities(db, custom_utilities)


# ---------------------------------------------------------------------------
# Source registry
# ---------------------------------------------------------------------------

SOURCE_FETCHERS = {
    "hrsa": ("HRSA Health Centers", fetch_hrsa_wa),
    "va": ("VA Facilities", fetch_va_wa),
    "usda": ("USDA Service Centers", fetch_usda_wa),
    "restrooms": ("Refuge Restrooms", fetch_refuge_restrooms_wa),
    "fountains": ("Seattle Drinking Fountains", fetch_seattle_fountains),
    "wifi": ("Seattle Public WiFi", fetch_seattle_wifi),
    "parks": ("WA State Parks", fetch_wa_parks_facilities),
    "transit": ("KC Metro Shelters", fetch_kc_metro_shelters),
    "food": ("WA211 Food Banks & Meals", fetch_wa211_food),
    "shelters": ("WA Homeless Shelters", fetch_wa211_shelters),
}

ALL_SOURCES = list(SOURCE_FETCHERS.keys())


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    parser = argparse.ArgumentParser(description="Seed WA facilities into UrbanAid DB")
    parser.add_argument(
        "--clear",
        action="store_true",
        help="Clear all existing utilities before seeding",
    )
    parser.add_argument(
        "--source",
        choices=["all"] + ALL_SOURCES,
        default="all",
        help="Seed a single source or all (default: all)",
    )
    args = parser.parse_args()

    # Initialize database tables (idempotent)
    init_db()

    db = SessionLocal()
    try:
        if args.clear:
            clear_all(db)

        # Determine which sources to run
        if args.source == "all":
            sources_to_run = ALL_SOURCES
        else:
            sources_to_run = [args.source]

        # Fetch and insert per source
        summary = []  # type: List[Tuple[str, int, int, int]]

        for source_key in sources_to_run:
            label, fetcher = SOURCE_FETCHERS[source_key]
            data = fetcher()
            if data:
                inserted, skipped = insert_facilities(db, data)
                summary.append((label, len(data), inserted, skipped))
            else:
                summary.append((label, 0, 0, 0))

        # Print summary table
        print("\n" + "=" * 62)
        print("  %-30s %8s %8s %8s" % ("Source", "Fetched", "Inserted", "Skipped"))
        print("  " + "-" * 58)
        total_fetched = 0
        total_inserted = 0
        total_skipped = 0
        for label, fetched, inserted, skipped in summary:
            print("  %-30s %8d %8d %8d" % (label, fetched, inserted, skipped))
            total_fetched += fetched
            total_inserted += inserted
            total_skipped += skipped
        print("  " + "-" * 58)
        print(
            "  %-30s %8d %8d %8d"
            % ("TOTAL", total_fetched, total_inserted, total_skipped)
        )
        print("=" * 62)

        # Show total active count in DB
        total = db.query(Utility).filter(Utility.is_active == True).count()
        print(f"\nTotal active utilities in DB: {total}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
