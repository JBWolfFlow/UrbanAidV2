# UrbanAid

**A cross-platform mobile application to help users quickly find nearby public utilities like water fountains, bathrooms, charging stations, and other critical civic resources.**

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

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd UrbanAid
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

## 🆘 Support

For support, please open an issue on GitHub or contact our team. 