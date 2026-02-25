# UrbanAid V2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-blue.svg)](https://reactnative.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)

**A mobile application that helps users find nearby public utilities — water fountains, restrooms, shelters, health centers, and more. Built with React Native (Expo) and FastAPI, UrbanAid V2 provides instant access to essential public resources with bundled data for zero-latency launch.**

## Mission

UrbanAid empowers people — travelers, low-income families, the homeless, athletes, parents, and everyday citizens — to find clean, safe, and accessible public resources with minimal friction.

## Tech Stack

### Frontend
- **React Native 0.79** with Expo SDK 53 (New Architecture / Fabric enabled)
- **Google Maps SDK** with native `icon` markers (~4,000 pins rendered instantly)
- Bundled utility data for offline-first experience
- Light & dark mode via Zustand theme store
- i18n support (English, Spanish, French, Hindi, Arabic)

### Backend
- **FastAPI 0.104** with async/await
- **PostgreSQL** database with SQLAlchemy ORM
- JWT authentication with RBAC
- Redis-backed rate limiting & response caching
- Docker containerization
- Structured logging (JSON or human-readable)

### Integrations
- Google Maps SDK (iOS)
- HRSA Health Centers (seeded database)
- VA Medical Facilities (seeded database)
- USDA Facilities (live API)
- OneBusAway Transit API (Puget Sound)

## Project Structure

```
/mobile-app/          # React Native (Expo) application
  /src/
    /components/      # Reusable UI components (GlassCard, GradientButton, etc.)
    /screens/         # Screen components (Map, Search, Add, Profile)
    /services/        # API service, i18n
    /stores/          # Zustand stores (theme, location, utility, onboarding)
    /utils/           # Helpers (markerImages, permissions, location)
    /assets/          # Marker PNGs, bundled utilities.json
    /theme/           # Colors, tokens, design system
  App.tsx

/api/                 # FastAPI backend
  /models/            # SQLAlchemy database models
  /controllers/       # Business logic (class-based)
  /services/          # External service wrappers
  /schemas/           # Pydantic request/response schemas
  /utils/             # Auth, exceptions, logging
  /middleware/         # Security headers, rate limiting, CORS
  /scripts/           # Database seeding scripts
  main.py
  requirements.txt
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Expo CLI (`npx expo`)
- Google Maps API key
- Docker (optional, for backend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JBWolfFlow/UrbanAidV2.git
   cd UrbanAidV2
   ```

2. **Set up the mobile app**
   ```bash
   cd mobile-app
   npm install          # patch-package runs automatically via postinstall
   npx expo run:ios     # builds and runs on iOS device/simulator
   ```

3. **Set up the backend**
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Using Docker**
   ```bash
   docker-compose up --build
   ```

## Core Features

### Utility Discovery
- Water fountains, public restrooms, benches
- Handwashing stations, cooling/warming shelters
- Free food locations, public Wi-Fi, phone charging
- Transit stops, public libraries, community clinics
- HRSA health centers, VA facilities, USDA offices

### Search & Filter
- 15 grouped category filters with instant switching
- Natural language search with synonym matching
- Distance-based sorting (nearest first)
- Wheelchair accessibility indicators

### Community Contributions
- Add new utility locations (3-step wizard with map picker)
- Rate and review utilities
- Report issues or closures

### Offline-First
- ~4,000 utility locations bundled in app binary
- Stale-while-revalidate background refresh
- AsyncStorage persistence across sessions

### Privacy & Safety
- No forced login required
- Location used only in foreground
- Privacy policy & terms of service screens
- Community moderation via admin roles

## Platform Support

- **iOS**: 15.0+ (primary platform, tested on iPhone 16 Pro)
- **Android**: API Level 23+ (Android 6.0)

## Coverage

- **Washington State**: Full coverage with ~4,000 utility locations
- Government data sources: HRSA, USDA, VA

## Performance

- **App Launch**: ~5s welcome screen while native markers mount
- **Marker Rendering**: All ~4,000 pins in one React commit (no trickle)
- **Image Loading**: Native MarkerIconPreloader pre-caches ~36 unique images
- **Filter Switching**: Instant via deferred values (no re-mount)

## CI/CD

- **Mobile CI**: TypeScript type-check + ESLint (`mobile-ci.yml`)
- **API CI**: Ruff linting + pytest + Docker build (`api-ci.yml`)
- **EAS Build**: Development, preview, and production profiles configured

## Security

- JWT authentication with refresh token rotation
- CORS whitelist (no wildcard origins)
- Security headers (CSP, HSTS, X-Frame-Options)
- Rate limiting (Redis-backed in production)
- Admin endpoints secured via header-based keys
- API docs disabled in production

## Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Government data providers (HRSA, USDA, VA)
- OneBusAway Puget Sound (transit data)
- Open source community

---

**Made with care for urban accessibility**
