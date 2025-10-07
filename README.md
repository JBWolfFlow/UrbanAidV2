# UrbanAid V2

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React Native](https://img.shields.io/badge/React%20Native-0.72+-blue.svg)](https://reactnative.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org/)

**A comprehensive cross-platform mobile application designed to help users quickly find nearby public utilities like water fountains, bathrooms, charging stations, and other critical civic resources. Built with React Native and FastAPI, UrbanAid V2 provides real-time access to essential public services across all 50 US states.**

## 🌍 Mission

UrbanAid empowers people — travelers, low-income families, the homeless, athletes, parents, and everyday citizens — to find clean, safe, and accessible public resources with minimal friction. The app launches fast, works offline, and operates globally.

## ⚡ Core Value: Simplicity

- App launches straight into the **map screen**
- 1-tap search and navigation
- Everything works in 3 taps or fewer

## 🛠️ Tech Stack

### Frontend
- **React Native** (iOS + Android)
- Google Maps SDK integration
- Offline-ready with local caching
- Light & dark mode support

### Backend
- **FastAPI** with async/await
- REST API endpoints
- PostgreSQL database
- Docker containerization

### Integrations
- Google Maps SDK
- Apple CoreLocation
- Firebase Auth (optional)
- Geolocation services

## 🏗️ Project Structure

```
/mobile-app/          # React Native application
  /src/
    /components/      # Reusable UI components
    /screens/         # Screen components
    /services/        # API and data services
    /utils/           # Helper functions
    /assets/          # Images, fonts, etc.
    /hooks/           # Custom React hooks
  App.tsx
  main.ts

/api/                 # FastAPI backend
  /routes/            # API route handlers
  /models/            # Database models
  /controllers/       # Business logic
  /services/          # External services
  /schemas/           # Pydantic schemas
  /utils/             # Backend utilities
  main.py
  requirements.txt

/docs/                # Documentation
/docker/              # Docker configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- React Native CLI
- Google Maps API key
- Docker (optional)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/JBWolfFlow/UrbanAidV2.git
   cd UrbanAidV2
   ```

2. **Set up the mobile app**
   ```bash
   cd mobile-app
   npm install
   npx react-native run-ios    # or run-android
   ```

3. **Set up the backend**
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Using Docker (Recommended)**
   ```bash
   docker-compose up --build
   ```

## 🧩 Core Features

### 1. 📍 Utility Discovery
- Water fountains
- Public restrooms  
- Benches
- Handwashing stations
- Cooling/Warming shelters
- Free food locations
- Public Wi-Fi
- Phone charging stations
- Transit stops
- Public libraries
- Community clinics

### 2. 🔎 Search & Filter
- Distance-based filtering
- Open now status
- Wheelchair accessibility
- Trust/verification scores
- Natural language search

### 3. ➕ Community Contributions
- Add new utility locations
- Rate and review utilities
- Report issues or closures
- Photo uploads

### 4. 📶 Offline Mode
- Cached location data
- Offline map tiles
- Sync when online

### 5. 🛡️ Privacy & Safety
- No forced login required
- Location used only in foreground
- Open privacy policy
- Community moderation

## 🌐 Internationalization

Supported languages:
- English
- Spanish
- French
- Hindi
- Arabic

## 📱 Platform Support

- **iOS**: 15.0+
- **Android**: API Level 23+ (Android 6.0)

## 🤝 Contributing

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

## 📊 Project Status

- ✅ **Mobile App**: React Native application with full feature set
- ✅ **Backend API**: FastAPI with comprehensive endpoints
- ✅ **Database**: PostgreSQL with optimized schemas
- ✅ **Docker**: Containerized deployment ready
- ✅ **50 State Coverage**: Complete US coverage implemented
- ✅ **Government Data Integration**: HRSA, USDA, VA services integrated
- 🔄 **Testing**: Comprehensive test suite in development
- 🔄 **CI/CD**: GitHub Actions workflow in progress

## 🏛️ Government Data Integration

UrbanAid V2 integrates with multiple government data sources:

- **HRSA (Health Resources & Services Administration)**: Community health centers
- **USDA (United States Department of Agriculture)**: Food assistance programs
- **VA (Veterans Affairs)**: Veterans services and facilities
- **State & Local APIs**: Municipal utility data

## 📈 Performance

- **App Launch Time**: < 2 seconds
- **Offline Capability**: Full functionality without internet
- **Data Sync**: Real-time updates when online
- **Battery Optimization**: Minimal background usage

## 🔒 Security & Privacy

- **No Personal Data Collection**: Location data only when app is active
- **Open Source**: Full transparency in code and data handling
- **Community Moderation**: User-driven content verification
- **GDPR Compliant**: Privacy-first design principles

## 🆘 Support

For support, please:
- Open an issue on [GitHub Issues](https://github.com/JBWolfFlow/UrbanAidV2/issues)
- Check our [documentation](docs/)
- Review [contributing guidelines](docs/CONTRIBUTING.md)

## 🙏 Acknowledgments

- Government data providers (HRSA, USDA, VA)
- Open source community
- Beta testers and contributors
- Municipal data partnerships

---

**Made with ❤️ for the community** 