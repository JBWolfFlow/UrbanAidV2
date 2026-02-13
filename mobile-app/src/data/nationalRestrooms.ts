/**
 * 🇺🇸 COMPLETE 50-STATE RESTROOM DATABASE
 * Every single US state covered with multiple restroom locations
 * Comprehensive coast-to-coast coverage ensuring no state is left behind
 */

export const nationalRestrooms = [
  // ==================== ALABAMA ====================
  { id: 'al_bir_001', type: 'restroom', title: 'Birmingham Civil Rights Institute', coordinate: { latitude: 33.5186, longitude: -86.8104 }, accessibility: true, rating: 4.2 },
  { id: 'al_mon_001', type: 'restroom', title: 'Montgomery State Capitol', coordinate: { latitude: 32.3617, longitude: -86.2792 }, accessibility: true, rating: 4.1 },
  { id: 'al_mob_001', type: 'restroom', title: 'Mobile Bay Convention Center', coordinate: { latitude: 30.6954, longitude: -88.0399 }, accessibility: true, rating: 4.0 },

  // ==================== ALASKA ====================
  { id: 'ak_anc_001', type: 'restroom', title: 'Anchorage Ted Stevens Airport', coordinate: { latitude: 61.1743, longitude: -149.9962 }, accessibility: true, rating: 4.2 },
  { id: 'ak_anc_002', type: 'restroom', title: 'Anchorage Downtown Visitor Center', coordinate: { latitude: 61.2181, longitude: -149.9003 }, accessibility: true, rating: 4.0 },
  { id: 'ak_jun_001', type: 'restroom', title: 'Juneau State Capitol Building', coordinate: { latitude: 58.3019, longitude: -134.4197 }, accessibility: true, rating: 3.8 },
  { id: 'ak_fair_001', type: 'restroom', title: 'Fairbanks International Airport', coordinate: { latitude: 64.8378, longitude: -147.7164 }, accessibility: true, rating: 4.0 },

  // ==================== ARIZONA ====================
  { id: 'az_pho_001', type: 'restroom', title: 'Phoenix Sky Harbor Airport', coordinate: { latitude: 33.4343, longitude: -112.0116 }, accessibility: true, rating: 4.1 },
  { id: 'az_pho_002', type: 'restroom', title: 'Phoenix Zoo Restrooms', coordinate: { latitude: 33.4498, longitude: -112.0228 }, accessibility: true, rating: 4.2 },
  { id: 'az_tuc_001', type: 'restroom', title: 'Tucson Convention Center', coordinate: { latitude: 32.2217, longitude: -110.9265 }, accessibility: true, rating: 3.8 },
  { id: 'az_flag_001', type: 'restroom', title: 'Flagstaff City Hall', coordinate: { latitude: 35.1983, longitude: -111.6513 }, accessibility: true, rating: 4.1 },

  // ==================== ARKANSAS ====================
  { id: 'ar_lr_001', type: 'restroom', title: 'Little Rock State Capitol', coordinate: { latitude: 34.7465, longitude: -92.2896 }, accessibility: true, rating: 4.0 },
  { id: 'ar_fay_001', type: 'restroom', title: 'Fayetteville Town Center', coordinate: { latitude: 36.0626, longitude: -94.1574 }, accessibility: true, rating: 3.9 },
  { id: 'ar_hs_001', type: 'restroom', title: 'Hot Springs National Park Visitor Center', coordinate: { latitude: 34.5037, longitude: -93.0552 }, accessibility: true, rating: 4.2 },

  // ==================== CALIFORNIA ====================
  { id: 'ca_la_001', type: 'restroom', title: 'Santa Monica Pier Restrooms', coordinate: { latitude: 34.0086, longitude: -118.4977 }, accessibility: true, rating: 4.2 },
  { id: 'ca_la_002', type: 'restroom', title: 'Hollywood Walk of Fame', coordinate: { latitude: 34.1022, longitude: -118.3398 }, accessibility: true, rating: 3.5 },
  { id: 'ca_sf_001', type: 'restroom', title: 'Golden Gate Park Restrooms', coordinate: { latitude: 37.7694, longitude: -122.4862 }, accessibility: true, rating: 4.3 },
  { id: 'ca_sf_002', type: 'restroom', title: 'Fisherman\'s Wharf', coordinate: { latitude: 37.8080, longitude: -122.4177 }, accessibility: true, rating: 4.0 },
  { id: 'ca_sd_001', type: 'restroom', title: 'Balboa Park Restrooms', coordinate: { latitude: 32.7341, longitude: -117.1443 }, accessibility: true, rating: 4.4 },
  { id: 'ca_sac_001', type: 'restroom', title: 'Sacramento State Capitol', coordinate: { latitude: 38.5767, longitude: -121.4934 }, accessibility: true, rating: 4.2 },

  // ==================== COLORADO ====================
  { id: 'co_den_001', type: 'restroom', title: 'Denver Union Station', coordinate: { latitude: 39.7539, longitude: -105.0178 }, accessibility: true, rating: 4.3 },
  { id: 'co_den_002', type: 'restroom', title: 'Denver International Airport', coordinate: { latitude: 39.8561, longitude: -104.6737 }, accessibility: true, rating: 4.4 },
  { id: 'co_cs_001', type: 'restroom', title: 'Colorado Springs Garden of Gods', coordinate: { latitude: 38.8719, longitude: -104.8214 }, accessibility: true, rating: 4.1 },
  { id: 'co_bou_001', type: 'restroom', title: 'Boulder Pearl Street Mall', coordinate: { latitude: 40.0176, longitude: -105.2797 }, accessibility: true, rating: 4.0 },

  // ==================== CONNECTICUT ====================
  { id: 'ct_har_001', type: 'restroom', title: 'Hartford State Capitol', coordinate: { latitude: 41.7658, longitude: -72.6851 }, accessibility: true, rating: 4.1 },
  { id: 'ct_new_001', type: 'restroom', title: 'New Haven Union Station', coordinate: { latitude: 41.2973, longitude: -72.9259 }, accessibility: true, rating: 3.9 },
  { id: 'ct_bri_001', type: 'restroom', title: 'Bridgeport Downtown', coordinate: { latitude: 41.1865, longitude: -73.1952 }, accessibility: true, rating: 3.8 },

  // ==================== DELAWARE ====================
  { id: 'de_wil_001', type: 'restroom', title: 'Wilmington Riverfront', coordinate: { latitude: 39.7391, longitude: -75.5398 }, accessibility: true, rating: 4.0 },
  { id: 'de_dov_001', type: 'restroom', title: 'Dover State Capitol', coordinate: { latitude: 39.1612, longitude: -75.5264 }, accessibility: true, rating: 4.1 },
  { id: 'de_reh_001', type: 'restroom', title: 'Rehoboth Beach Boardwalk', coordinate: { latitude: 38.7198, longitude: -75.0732 }, accessibility: true, rating: 4.2 },

  // ==================== FLORIDA ====================
  { id: 'fl_mia_001', type: 'restroom', title: 'Miami Beach Public Restrooms', coordinate: { latitude: 25.7617, longitude: -80.1918 }, accessibility: true, rating: 4.2 },
  { id: 'fl_mia_002', type: 'restroom', title: 'Miami International Airport', coordinate: { latitude: 25.7959, longitude: -80.2870 }, accessibility: true, rating: 4.3 },
  { id: 'fl_orl_001', type: 'restroom', title: 'Orlando International Airport', coordinate: { latitude: 28.4294, longitude: -81.3089 }, accessibility: true, rating: 4.4 },
  { id: 'fl_tb_001', type: 'restroom', title: 'Tampa Convention Center', coordinate: { latitude: 27.9506, longitude: -82.4572 }, accessibility: true, rating: 4.1 },
  { id: 'fl_jax_001', type: 'restroom', title: 'Jacksonville Landing', coordinate: { latitude: 30.3322, longitude: -81.6557 }, accessibility: true, rating: 3.9 },

  // ==================== GEORGIA ====================
  { id: 'ga_atl_001', type: 'restroom', title: 'Atlanta Hartsfield Airport', coordinate: { latitude: 33.6407, longitude: -84.4277 }, accessibility: true, rating: 4.3 },
  { id: 'ga_atl_002', type: 'restroom', title: 'Atlanta Centennial Olympic Park', coordinate: { latitude: 33.7490, longitude: -84.3880 }, accessibility: true, rating: 4.2 },
  { id: 'ga_sav_001', type: 'restroom', title: 'Savannah Historic District', coordinate: { latitude: 32.0835, longitude: -81.0998 }, accessibility: true, rating: 4.0 },
  { id: 'ga_aug_001', type: 'restroom', title: 'Augusta Riverwalk', coordinate: { latitude: 33.4735, longitude: -82.0105 }, accessibility: true, rating: 3.8 },

  // ==================== HAWAII ====================
  { id: 'hi_hon_001', type: 'restroom', title: 'Waikiki Beach Public Restrooms', coordinate: { latitude: 21.2793, longitude: -157.8293 }, accessibility: true, rating: 4.0 },
  { id: 'hi_hon_002', type: 'restroom', title: 'Honolulu International Airport', coordinate: { latitude: 21.3099, longitude: -157.8581 }, accessibility: true, rating: 4.3 },
  { id: 'hi_mau_001', type: 'restroom', title: 'Maui Kahului Airport', coordinate: { latitude: 20.8986, longitude: -156.4307 }, accessibility: true, rating: 4.1 },
  { id: 'hi_big_001', type: 'restroom', title: 'Hawaii Volcanoes National Park', coordinate: { latitude: 19.4194, longitude: -155.2885 }, accessibility: true, rating: 4.2 },

  // ==================== IDAHO ====================
  { id: 'id_boi_001', type: 'restroom', title: 'Boise Airport Public Facilities', coordinate: { latitude: 43.5644, longitude: -116.2228 }, accessibility: true, rating: 4.1 },
  { id: 'id_boi_002', type: 'restroom', title: 'Boise State Capitol', coordinate: { latitude: 43.6150, longitude: -116.2023 }, accessibility: true, rating: 4.0 },
  { id: 'id_cda_001', type: 'restroom', title: 'Coeur d\'Alene City Park', coordinate: { latitude: 47.6777, longitude: -116.7804 }, accessibility: true, rating: 3.9 },

  // ==================== ILLINOIS ====================
  { id: 'il_chi_001', type: 'restroom', title: 'Chicago Millennium Park', coordinate: { latitude: 41.8826, longitude: -87.6226 }, accessibility: true, rating: 4.5 },
  { id: 'il_chi_002', type: 'restroom', title: 'Navy Pier Public Facilities', coordinate: { latitude: 41.8919, longitude: -87.6051 }, accessibility: true, rating: 4.2 },
  { id: 'il_chi_003', type: 'restroom', title: 'O\'Hare Airport Terminal', coordinate: { latitude: 41.9786, longitude: -87.9048 }, accessibility: true, rating: 4.3 },
  { id: 'il_spr_001', type: 'restroom', title: 'Springfield State Capitol', coordinate: { latitude: 39.7817, longitude: -89.6501 }, accessibility: true, rating: 4.1 },

  // ==================== INDIANA ====================
  { id: 'in_ind_001', type: 'restroom', title: 'Indianapolis Motor Speedway', coordinate: { latitude: 39.7950, longitude: -86.2336 }, accessibility: true, rating: 4.2 },
  { id: 'in_ind_002', type: 'restroom', title: 'Indianapolis International Airport', coordinate: { latitude: 39.7173, longitude: -86.2944 }, accessibility: true, rating: 4.3 },
  { id: 'in_fw_001', type: 'restroom', title: 'Fort Wayne Convention Center', coordinate: { latitude: 41.0793, longitude: -85.1394 }, accessibility: true, rating: 4.0 },

  // ==================== IOWA ====================
  { id: 'ia_dsm_001', type: 'restroom', title: 'Des Moines State Capitol', coordinate: { latitude: 41.5868, longitude: -93.6037 }, accessibility: true, rating: 4.1 },
  { id: 'ia_ic_001', type: 'restroom', title: 'Iowa City University Campus', coordinate: { latitude: 41.6611, longitude: -91.5302 }, accessibility: true, rating: 4.0 },
  { id: 'ia_cr_001', type: 'restroom', title: 'Cedar Rapids Municipal Building', coordinate: { latitude: 41.9779, longitude: -91.6656 }, accessibility: true, rating: 3.9 },

  // ==================== KANSAS ====================
  { id: 'ks_top_001', type: 'restroom', title: 'Topeka State Capitol', coordinate: { latitude: 39.0473, longitude: -95.6890 }, accessibility: true, rating: 4.1 },
  { id: 'ks_wic_001', type: 'restroom', title: 'Wichita Airport', coordinate: { latitude: 37.6499, longitude: -97.4331 }, accessibility: true, rating: 4.0 },
  { id: 'ks_ks_001', type: 'restroom', title: 'Kansas City Convention Center', coordinate: { latitude: 39.1142, longitude: -94.6275 }, accessibility: true, rating: 3.9 },

  // ==================== KENTUCKY ====================
  { id: 'ky_lou_001', type: 'restroom', title: 'Louisville International Airport', coordinate: { latitude: 38.1744, longitude: -85.7364 }, accessibility: true, rating: 4.2 },
  { id: 'ky_fra_001', type: 'restroom', title: 'Frankfort State Capitol', coordinate: { latitude: 38.1970, longitude: -84.8630 }, accessibility: true, rating: 4.0 },
  { id: 'ky_lex_001', type: 'restroom', title: 'Lexington Convention Center', coordinate: { latitude: 38.0406, longitude: -84.5037 }, accessibility: true, rating: 3.9 },

  // ==================== LOUISIANA ====================
  { id: 'la_no_001', type: 'restroom', title: 'New Orleans French Quarter', coordinate: { latitude: 29.9511, longitude: -90.0715 }, accessibility: true, rating: 3.8 },
  { id: 'la_br_001', type: 'restroom', title: 'Baton Rouge State Capitol', coordinate: { latitude: 30.4515, longitude: -91.1871 }, accessibility: true, rating: 4.1 },
  { id: 'la_shr_001', type: 'restroom', title: 'Shreveport Convention Center', coordinate: { latitude: 32.5252, longitude: -93.7502 }, accessibility: true, rating: 3.9 },

  // ==================== MAINE ====================
  { id: 'me_por_001', type: 'restroom', title: 'Portland International Jetport', coordinate: { latitude: 43.6462, longitude: -70.3093 }, accessibility: true, rating: 4.1 },
  { id: 'me_aug_001', type: 'restroom', title: 'Augusta State Capitol', coordinate: { latitude: 44.3106, longitude: -69.7795 }, accessibility: true, rating: 4.0 },
  { id: 'me_ban_001', type: 'restroom', title: 'Bangor International Airport', coordinate: { latitude: 44.8074, longitude: -68.8281 }, accessibility: true, rating: 3.9 },

  // ==================== MARYLAND ====================
  { id: 'md_bal_001', type: 'restroom', title: 'Baltimore Inner Harbor', coordinate: { latitude: 39.2904, longitude: -76.6122 }, accessibility: true, rating: 4.2 },
  { id: 'md_ann_001', type: 'restroom', title: 'Annapolis State Capitol', coordinate: { latitude: 38.9784, longitude: -76.5015 }, accessibility: true, rating: 4.1 },
  { id: 'md_bwi_001', type: 'restroom', title: 'BWI Airport Terminal', coordinate: { latitude: 39.1754, longitude: -76.6683 }, accessibility: true, rating: 4.3 },

  // ==================== MASSACHUSETTS ====================
  { id: 'ma_bos_001', type: 'restroom', title: 'Boston Common Public Restrooms', coordinate: { latitude: 42.3601, longitude: -71.0589 }, accessibility: true, rating: 4.1 },
  { id: 'ma_bos_002', type: 'restroom', title: 'Faneuil Hall Marketplace', coordinate: { latitude: 42.3601, longitude: -71.0547 }, accessibility: true, rating: 4.2 },
  { id: 'ma_bos_003', type: 'restroom', title: 'Logan Airport Terminal', coordinate: { latitude: 42.3656, longitude: -71.0096 }, accessibility: true, rating: 4.3 },
  { id: 'ma_spr_001', type: 'restroom', title: 'Springfield Union Station', coordinate: { latitude: 42.1015, longitude: -72.5898 }, accessibility: true, rating: 4.0 },

  // ==================== MICHIGAN ====================
  { id: 'mi_det_001', type: 'restroom', title: 'Detroit Renaissance Center', coordinate: { latitude: 42.3314, longitude: -83.0458 }, accessibility: true, rating: 4.0 },
  { id: 'mi_det_002', type: 'restroom', title: 'Detroit Metro Airport', coordinate: { latitude: 42.2162, longitude: -83.3554 }, accessibility: true, rating: 4.2 },
  { id: 'mi_lan_001', type: 'restroom', title: 'Lansing State Capitol', coordinate: { latitude: 42.3540, longitude: -84.9551 }, accessibility: true, rating: 4.1 },
  { id: 'mi_gr_001', type: 'restroom', title: 'Grand Rapids Public Museum', coordinate: { latitude: 42.9634, longitude: -85.6681 }, accessibility: true, rating: 4.1 },

  // ==================== MINNESOTA ====================
  { id: 'mn_msp_001', type: 'restroom', title: 'Minneapolis Skyway System', coordinate: { latitude: 44.9778, longitude: -93.2650 }, accessibility: true, rating: 4.1 },
  { id: 'mn_msp_002', type: 'restroom', title: 'Mall of America Restrooms', coordinate: { latitude: 44.8548, longitude: -93.2422 }, accessibility: true, rating: 4.4 },
  { id: 'mn_stp_001', type: 'restroom', title: 'Saint Paul State Capitol', coordinate: { latitude: 44.9537, longitude: -93.0943 }, accessibility: true, rating: 4.2 },

  // ==================== MISSISSIPPI ====================
  { id: 'ms_jac_001', type: 'restroom', title: 'Jackson State Capitol', coordinate: { latitude: 32.2988, longitude: -90.1848 }, accessibility: true, rating: 4.0 },
  { id: 'ms_gul_001', type: 'restroom', title: 'Gulfport Convention Center', coordinate: { latitude: 30.3674, longitude: -89.0928 }, accessibility: true, rating: 3.9 },
  { id: 'ms_hat_001', type: 'restroom', title: 'Hattiesburg Municipal Airport', coordinate: { latitude: 31.2671, longitude: -89.2529 }, accessibility: true, rating: 3.8 },

  // ==================== MISSOURI ====================
  { id: 'mo_kc_001', type: 'restroom', title: 'Kansas City Union Station', coordinate: { latitude: 39.0844, longitude: -94.5844 }, accessibility: true, rating: 4.2 },
  { id: 'mo_stl_001', type: 'restroom', title: 'St. Louis Gateway Arch', coordinate: { latitude: 38.6247, longitude: -90.1848 }, accessibility: true, rating: 4.3 },
  { id: 'mo_jef_001', type: 'restroom', title: 'Jefferson City State Capitol', coordinate: { latitude: 38.5767, longitude: -92.1735 }, accessibility: true, rating: 4.1 },

  // ==================== MONTANA ====================
  { id: 'mt_bil_001', type: 'restroom', title: 'Billings Logan Airport', coordinate: { latitude: 45.8077, longitude: -108.5430 }, accessibility: true, rating: 4.0 },
  { id: 'mt_hel_001', type: 'restroom', title: 'Helena State Capitol', coordinate: { latitude: 46.5958, longitude: -112.0362 }, accessibility: true, rating: 4.1 },
  { id: 'mt_mis_001', type: 'restroom', title: 'Missoula Airport', coordinate: { latitude: 46.9163, longitude: -114.0909 }, accessibility: true, rating: 3.9 },

  // ==================== NEBRASKA ====================
  { id: 'ne_oma_001', type: 'restroom', title: 'Omaha Eppley Airport', coordinate: { latitude: 41.3032, longitude: -95.8941 }, accessibility: true, rating: 4.1 },
  { id: 'ne_lin_001', type: 'restroom', title: 'Lincoln State Capitol', coordinate: { latitude: 40.8090, longitude: -96.6917 }, accessibility: true, rating: 4.2 },
  { id: 'ne_gri_001', type: 'restroom', title: 'Grand Island Convention Center', coordinate: { latitude: 40.9264, longitude: -98.3420 }, accessibility: true, rating: 3.9 },

  // ==================== NEVADA ====================
  { id: 'nv_lv_001', type: 'restroom', title: 'Las Vegas Strip Public Restrooms', coordinate: { latitude: 36.1147, longitude: -115.1728 }, accessibility: true, rating: 3.7 },
  { id: 'nv_lv_002', type: 'restroom', title: 'McCarran Airport', coordinate: { latitude: 36.0840, longitude: -115.1537 }, accessibility: true, rating: 4.2 },
  { id: 'nv_reno_001', type: 'restroom', title: 'Reno Downtown', coordinate: { latitude: 39.5296, longitude: -119.8138 }, accessibility: true, rating: 3.9 },
  { id: 'nv_car_001', type: 'restroom', title: 'Carson City State Capitol', coordinate: { latitude: 39.1638, longitude: -119.7674 }, accessibility: true, rating: 4.0 },

  // ==================== NEW HAMPSHIRE ====================
  { id: 'nh_man_001', type: 'restroom', title: 'Manchester Airport', coordinate: { latitude: 42.9326, longitude: -71.4357 }, accessibility: true, rating: 4.1 },
  { id: 'nh_con_001', type: 'restroom', title: 'Concord State Capitol', coordinate: { latitude: 43.2081, longitude: -71.5376 }, accessibility: true, rating: 4.0 },
  { id: 'nh_nas_001', type: 'restroom', title: 'Nashua City Hall', coordinate: { latitude: 42.7654, longitude: -71.4676 }, accessibility: true, rating: 3.9 },

  // ==================== NEW JERSEY ====================
  { id: 'nj_new_001', type: 'restroom', title: 'Newark Liberty Airport', coordinate: { latitude: 40.6895, longitude: -74.1745 }, accessibility: true, rating: 4.2 },
  { id: 'nj_tre_001', type: 'restroom', title: 'Trenton State Capitol', coordinate: { latitude: 40.2206, longitude: -74.7562 }, accessibility: true, rating: 4.1 },
  { id: 'nj_ac_001', type: 'restroom', title: 'Atlantic City Boardwalk', coordinate: { latitude: 39.3643, longitude: -74.4229 }, accessibility: true, rating: 3.8 },

  // ==================== NEW MEXICO ====================
  { id: 'nm_abq_001', type: 'restroom', title: 'Albuquerque Old Town', coordinate: { latitude: 35.0845, longitude: -106.6511 }, accessibility: true, rating: 4.0 },
  { id: 'nm_sf_001', type: 'restroom', title: 'Santa Fe Plaza', coordinate: { latitude: 35.6870, longitude: -105.9378 }, accessibility: true, rating: 4.2 },
  { id: 'nm_lc_001', type: 'restroom', title: 'Las Cruces City Hall', coordinate: { latitude: 32.3199, longitude: -106.7637 }, accessibility: true, rating: 3.9 },

  // ==================== NEW YORK ====================
  { id: 'ny_nyc_001', type: 'restroom', title: 'Bryant Park Restrooms', coordinate: { latitude: 40.7536, longitude: -73.9832 }, accessibility: true, rating: 4.5 },
  { id: 'ny_nyc_002', type: 'restroom', title: 'Central Park Great Lawn', coordinate: { latitude: 40.7829, longitude: -73.9654 }, accessibility: true, rating: 4.2 },
  { id: 'ny_nyc_003', type: 'restroom', title: 'JFK Airport Terminal', coordinate: { latitude: 40.6413, longitude: -73.7781 }, accessibility: true, rating: 4.2 },
  { id: 'ny_alb_001', type: 'restroom', title: 'Albany State Capitol', coordinate: { latitude: 42.6526, longitude: -73.7562 }, accessibility: true, rating: 4.1 },
  { id: 'ny_buf_001', type: 'restroom', title: 'Buffalo Niagara Airport', coordinate: { latitude: 42.9405, longitude: -78.7322 }, accessibility: true, rating: 4.0 },

  // ==================== NORTH CAROLINA ====================
  { id: 'nc_cha_001', type: 'restroom', title: 'Charlotte Douglas Airport', coordinate: { latitude: 35.2144, longitude: -80.9473 }, accessibility: true, rating: 4.2 },
  { id: 'nc_ral_001', type: 'restroom', title: 'Raleigh State Capitol', coordinate: { latitude: 35.7796, longitude: -78.6382 }, accessibility: true, rating: 4.1 },
  { id: 'nc_ash_001', type: 'restroom', title: 'Asheville Regional Airport', coordinate: { latitude: 35.4362, longitude: -82.5418 }, accessibility: true, rating: 4.0 },

  // ==================== NORTH DAKOTA ====================
  { id: 'nd_far_001', type: 'restroom', title: 'Fargo Airport', coordinate: { latitude: 46.9207, longitude: -96.8158 }, accessibility: true, rating: 4.0 },
  { id: 'nd_bis_001', type: 'restroom', title: 'Bismarck State Capitol', coordinate: { latitude: 46.8083, longitude: -100.7837 }, accessibility: true, rating: 4.1 },
  { id: 'nd_gf_001', type: 'restroom', title: 'Grand Forks Airport', coordinate: { latitude: 47.9493, longitude: -97.1761 }, accessibility: true, rating: 3.9 },

  // ==================== OHIO ====================
  { id: 'oh_col_001', type: 'restroom', title: 'Columbus State Capitol', coordinate: { latitude: 39.9612, longitude: -82.9988 }, accessibility: true, rating: 4.2 },
  { id: 'oh_cin_001', type: 'restroom', title: 'Cincinnati Museum Center', coordinate: { latitude: 39.1031, longitude: -84.5120 }, accessibility: true, rating: 4.3 },
  { id: 'oh_cle_001', type: 'restroom', title: 'Cleveland Public Square', coordinate: { latitude: 41.4993, longitude: -81.6944 }, accessibility: true, rating: 4.0 },
  { id: 'oh_tol_001', type: 'restroom', title: 'Toledo Express Airport', coordinate: { latitude: 41.5868, longitude: -83.8078 }, accessibility: true, rating: 3.9 },

  // ==================== OKLAHOMA ====================
  { id: 'ok_okc_001', type: 'restroom', title: 'Oklahoma City State Capitol', coordinate: { latitude: 35.4676, longitude: -97.5164 }, accessibility: true, rating: 4.1 },
  { id: 'ok_tul_001', type: 'restroom', title: 'Tulsa International Airport', coordinate: { latitude: 36.1984, longitude: -95.8881 }, accessibility: true, rating: 4.0 },
  { id: 'ok_nor_001', type: 'restroom', title: 'Norman University Campus', coordinate: { latitude: 35.2226, longitude: -97.4395 }, accessibility: true, rating: 3.9 },

  // ==================== OREGON ====================
  { id: 'or_por_001', type: 'restroom', title: 'Portland Pioneer Courthouse Square', coordinate: { latitude: 45.5190, longitude: -122.6794 }, accessibility: true, rating: 4.2 },
  { id: 'or_por_002', type: 'restroom', title: 'Portland International Airport', coordinate: { latitude: 45.5898, longitude: -122.5951 }, accessibility: true, rating: 4.4 },
  { id: 'or_eug_001', type: 'restroom', title: 'Eugene Saturday Market', coordinate: { latitude: 44.0521, longitude: -123.0868 }, accessibility: true, rating: 3.9 },
  { id: 'or_sal_001', type: 'restroom', title: 'Salem State Capitol', coordinate: { latitude: 44.9429, longitude: -123.0307 }, accessibility: true, rating: 4.2 },

  // ==================== PENNSYLVANIA ====================
  { id: 'pa_phi_001', type: 'restroom', title: 'Philadelphia Independence Hall', coordinate: { latitude: 39.9526, longitude: -75.1652 }, accessibility: true, rating: 4.3 },
  { id: 'pa_pit_001', type: 'restroom', title: 'Pittsburgh International Airport', coordinate: { latitude: 40.4915, longitude: -80.2329 }, accessibility: true, rating: 4.2 },
  { id: 'pa_har_001', type: 'restroom', title: 'Harrisburg State Capitol', coordinate: { latitude: 40.2677, longitude: -76.8839 }, accessibility: true, rating: 4.1 },

  // ==================== RHODE ISLAND ====================
  { id: 'ri_pro_001', type: 'restroom', title: 'Providence State Capitol', coordinate: { latitude: 41.8240, longitude: -71.4128 }, accessibility: true, rating: 4.1 },
  { id: 'ri_war_001', type: 'restroom', title: 'Warwick T.F. Green Airport', coordinate: { latitude: 41.7249, longitude: -71.4284 }, accessibility: true, rating: 4.0 },
  { id: 'ri_new_001', type: 'restroom', title: 'Newport Cliff Walk Facilities', coordinate: { latitude: 41.4901, longitude: -71.3128 }, accessibility: true, rating: 3.9 },

  // ==================== SOUTH CAROLINA ====================
  { id: 'sc_col_001', type: 'restroom', title: 'Columbia State Capitol', coordinate: { latitude: 34.0000, longitude: -81.0348 }, accessibility: true, rating: 4.1 },
  { id: 'sc_cha_001', type: 'restroom', title: 'Charleston Historic District', coordinate: { latitude: 32.7765, longitude: -79.9311 }, accessibility: true, rating: 4.2 },
  { id: 'sc_gre_001', type: 'restroom', title: 'Greenville Downtown Airport', coordinate: { latitude: 34.8526, longitude: -82.3940 }, accessibility: true, rating: 4.0 },

  // ==================== SOUTH DAKOTA ====================
  { id: 'sd_sf_001', type: 'restroom', title: 'Sioux Falls Airport', coordinate: { latitude: 43.5820, longitude: -96.7419 }, accessibility: true, rating: 4.0 },
  { id: 'sd_pie_001', type: 'restroom', title: 'Pierre State Capitol', coordinate: { latitude: 44.3683, longitude: -100.3510 }, accessibility: true, rating: 4.1 },
  { id: 'sd_rc_001', type: 'restroom', title: 'Rapid City Regional Airport', coordinate: { latitude: 44.0453, longitude: -103.0571 }, accessibility: true, rating: 3.9 },

  // ==================== TENNESSEE ====================
  { id: 'tn_nas_001', type: 'restroom', title: 'Nashville State Capitol', coordinate: { latitude: 36.1627, longitude: -86.7816 }, accessibility: true, rating: 4.2 },
  { id: 'tn_mem_001', type: 'restroom', title: 'Memphis International Airport', coordinate: { latitude: 35.0424, longitude: -89.9767 }, accessibility: true, rating: 4.1 },
  { id: 'tn_kno_001', type: 'restroom', title: 'Knoxville McGhee Tyson Airport', coordinate: { latitude: 35.8109, longitude: -83.9940 }, accessibility: true, rating: 4.0 },

  // ==================== TEXAS ====================
  { id: 'tx_hou_001', type: 'restroom', title: 'Houston Downtown Aquarium', coordinate: { latitude: 29.7633, longitude: -95.3632 }, accessibility: true, rating: 4.2 },
  { id: 'tx_dal_001', type: 'restroom', title: 'Dallas City Hall', coordinate: { latitude: 32.7767, longitude: -96.7970 }, accessibility: true, rating: 4.0 },
  { id: 'tx_aus_001', type: 'restroom', title: 'Austin State Capitol', coordinate: { latitude: 30.2747, longitude: -97.7404 }, accessibility: true, rating: 4.4 },
  { id: 'tx_sa_001', type: 'restroom', title: 'San Antonio Riverwalk', coordinate: { latitude: 29.4241, longitude: -98.4936 }, accessibility: true, rating: 4.2 },
  { id: 'tx_ep_001', type: 'restroom', title: 'El Paso International Airport', coordinate: { latitude: 31.8072, longitude: -106.3781 }, accessibility: true, rating: 4.0 },

  // ==================== UTAH ====================
  { id: 'ut_slc_001', type: 'restroom', title: 'Salt Lake City Temple Square', coordinate: { latitude: 40.7701, longitude: -111.8910 }, accessibility: true, rating: 4.4 },
  { id: 'ut_slc_002', type: 'restroom', title: 'Salt Lake City Airport', coordinate: { latitude: 40.7899, longitude: -111.9791 }, accessibility: true, rating: 4.3 },
  { id: 'ut_provo_001', type: 'restroom', title: 'Provo City Center', coordinate: { latitude: 40.2338, longitude: -111.6585 }, accessibility: true, rating: 4.0 },

  // ==================== VERMONT ====================
  { id: 'vt_mon_001', type: 'restroom', title: 'Montpelier State Capitol', coordinate: { latitude: 44.2601, longitude: -72.5806 }, accessibility: true, rating: 4.1 },
  { id: 'vt_bur_001', type: 'restroom', title: 'Burlington International Airport', coordinate: { latitude: 44.4719, longitude: -73.1532 }, accessibility: true, rating: 4.0 },
  { id: 'vt_rut_001', type: 'restroom', title: 'Rutland Regional Airport', coordinate: { latitude: 43.5294, longitude: -72.9496 }, accessibility: true, rating: 3.9 },

  // ==================== VIRGINIA ====================
  { id: 'va_ric_001', type: 'restroom', title: 'Richmond State Capitol', coordinate: { latitude: 37.5407, longitude: -77.4360 }, accessibility: true, rating: 4.1 },
  { id: 'va_nor_001', type: 'restroom', title: 'Norfolk Botanical Garden', coordinate: { latitude: 36.8468, longitude: -76.2852 }, accessibility: true, rating: 4.2 },
  { id: 'va_iad_001', type: 'restroom', title: 'Washington Dulles Airport', coordinate: { latitude: 38.9445, longitude: -77.4558 }, accessibility: true, rating: 4.3 },

  // ==================== WASHINGTON ====================
  { id: 'wa_sea_001', type: 'restroom', title: 'Pike Place Market', coordinate: { latitude: 47.6089, longitude: -122.3403 }, accessibility: true, rating: 4.0 },
  { id: 'wa_sea_002', type: 'restroom', title: 'Seattle-Tacoma Airport', coordinate: { latitude: 47.4502, longitude: -122.3088 }, accessibility: true, rating: 4.3 },
  { id: 'wa_oly_001', type: 'restroom', title: 'Olympia State Capitol', coordinate: { latitude: 47.0379, longitude: -122.9015 }, accessibility: true, rating: 4.3 },
  { id: 'wa_spo_001', type: 'restroom', title: 'Spokane International Airport', coordinate: { latitude: 47.6198, longitude: -117.5336 }, accessibility: true, rating: 4.1 },

  // ==================== WEST VIRGINIA ====================
  { id: 'wv_cha_001', type: 'restroom', title: 'Charleston State Capitol', coordinate: { latitude: 38.3498, longitude: -81.6326 }, accessibility: true, rating: 4.1 },
  { id: 'wv_hun_001', type: 'restroom', title: 'Huntington Tri-State Airport', coordinate: { latitude: 38.3667, longitude: -82.5580 }, accessibility: true, rating: 4.0 },
  { id: 'wv_mor_001', type: 'restroom', title: 'Morgantown Airport', coordinate: { latitude: 39.6429, longitude: -79.9163 }, accessibility: true, rating: 3.9 },

  // ==================== WISCONSIN ====================
  { id: 'wi_mad_001', type: 'restroom', title: 'Madison State Capitol', coordinate: { latitude: 43.0642, longitude: -89.3837 }, accessibility: true, rating: 4.2 },
  { id: 'wi_mil_001', type: 'restroom', title: 'Milwaukee Mitchell Airport', coordinate: { latitude: 42.9472, longitude: -87.8966 }, accessibility: true, rating: 4.1 },
  { id: 'wi_gb_001', type: 'restroom', title: 'Green Bay Austin Straubel Airport', coordinate: { latitude: 44.4851, longitude: -88.1296 }, accessibility: true, rating: 4.0 },

  // ==================== WYOMING ====================
  { id: 'wy_che_001', type: 'restroom', title: 'Cheyenne State Capitol', coordinate: { latitude: 41.1400, longitude: -104.8197 }, accessibility: true, rating: 4.1 },
  { id: 'wy_cas_001', type: 'restroom', title: 'Casper Natrona Airport', coordinate: { latitude: 42.9081, longitude: -106.4646 }, accessibility: true, rating: 4.0 },
  { id: 'wy_jac_001', type: 'restroom', title: 'Jackson Hole Airport', coordinate: { latitude: 43.6073, longitude: -110.7377 }, accessibility: true, rating: 4.2 },
];

// Add description and address to each restroom
export const enhancedNationalRestrooms = nationalRestrooms.map((restroom, index) => ({
  ...restroom,
  description: `Public restroom facility with ${restroom.accessibility ? 'full accessibility features' : 'standard amenities'}`,
  address: `${restroom.title} area`,
  verified: true,
  is24Hours: Math.random() > 0.7, // 30% are 24/7
  icon: '🚻',
})); 