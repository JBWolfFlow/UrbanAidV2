# Contributing to UrbanAid

Thank you for your interest in contributing to UrbanAid! This document provides guidelines and information for contributors.

## 🎯 Project Mission

UrbanAid empowers people to find clean, safe, and accessible public resources with minimal friction. Every contribution should align with our core values:

- **Simplicity**: Keep the user experience simple and intuitive
- **Accessibility**: Ensure features work for all users
- **Privacy**: Respect user privacy and data
- **Reliability**: Build robust, tested functionality
- **Community**: Foster an inclusive, helpful community

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ for React Native development
- **Python** 3.11+ for FastAPI backend
- **React Native CLI** for mobile development
- **Docker** (optional) for containerized development
- **Git** for version control

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/urbanaid.git
   cd urbanaid
   ```

2. **Set up the mobile app**
   ```bash
   cd mobile-app
   npm install
   
   # For iOS
   cd ios && pod install && cd ..
   npx react-native run-ios
   
   # For Android
   npx react-native run-android
   ```

3. **Set up the backend**
   ```bash
   cd api
   pip install -r requirements.txt
   uvicorn main:app --reload
   ```

4. **Using Docker (alternative)**
   ```bash
   cd docker
   docker-compose up --build
   ```

### Environment Variables

Create `.env` files with required variables:

**Mobile App (.env)**
```
API_URL=http://localhost:8000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Backend (.env)**
```
DATABASE_URL=postgresql://username:password@localhost:5432/urbanaid
REDIS_URL=redis://localhost:6379
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
JWT_SECRET_KEY=your_secret_key
```

## 📋 Development Standards

### Code Quality

- **TypeScript** for all frontend code
- **Python type hints** for all backend code
- **ESLint** and **Prettier** for code formatting
- **pytest** for Python tests
- **Jest** for JavaScript/TypeScript tests

### Commit Guidelines

Use conventional commits:

```
feat: add water fountain filtering
fix: resolve location permission issue
docs: update API documentation
test: add unit tests for utility service
refactor: optimize map rendering performance
```

### Code Review Process

1. Create a feature branch from `main`
2. Make your changes with tests
3. Submit a Pull Request
4. Address review feedback
5. Merge after approval

### Testing Requirements

- **Unit tests** for all new functions
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **Accessibility tests** for UI components

**Example Test Structure:**
```typescript
// mobile-app/src/__tests__/services/apiService.test.ts
describe('ApiService', () => {
  it('should fetch nearby utilities', async () => {
    const utilities = await apiService.getNearbyUtilities({
      latitude: 40.7128,
      longitude: -74.0060,
      radius: 5.0,
      limit: 10
    });
    expect(utilities).toBeDefined();
    expect(utilities.length).toBeLessThanOrEqual(10);
  });
});
```

## 🏗️ Architecture Guidelines

### Frontend (React Native)

- **Component Structure**: Use functional components with hooks
- **State Management**: Zustand for global state, local state for component-specific data
- **Navigation**: React Navigation for screen transitions
- **Styling**: React Native Paper for UI components, custom styles for unique designs
- **Offline Support**: Cache critical data locally using AsyncStorage

### Backend (FastAPI)

- **MVC Pattern**: Separate models, controllers, and services
- **Database**: SQLAlchemy ORM with PostgreSQL
- **Authentication**: JWT tokens (optional for core functionality)
- **API Design**: RESTful endpoints with clear documentation
- **Error Handling**: Consistent error responses with proper HTTP status codes

### Database Schema

```sql
-- Core utility table
CREATE TABLE utilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category utility_category NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    wheelchair_accessible BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add PostGIS for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;
ALTER TABLE utilities ADD COLUMN location GEOGRAPHY(POINT, 4326);
```

## 🌟 Feature Development

### Adding New Utility Categories

1. Update `UtilityCategory` type in `mobile-app/src/types/utility.ts`
2. Add translation keys in `mobile-app/src/services/i18n.ts`
3. Create icon mapping in `mobile-app/src/utils/utilityHelpers.ts`
4. Update backend enum in `api/models/utility.py`
5. Add database migration

### Internationalization

- Add translations to all supported languages
- Use `t()` function for all user-facing text
- Test UI with longer text (German) and RTL languages (Arabic)
- Consider cultural differences in icons and colors

### Accessibility

- Add proper ARIA labels and hints
- Ensure minimum color contrast ratios
- Support screen readers
- Test with VoiceOver (iOS) and TalkBack (Android)
- Provide alternative text for images

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Reproduce the bug consistently
3. Test on multiple devices/platforms
4. Gather relevant logs

### Bug Report Template

```
**Environment:**
- Device: iPhone 14 Pro / Samsung Galaxy S21
- OS Version: iOS 16.0 / Android 12
- App Version: 1.0.0

**Steps to Reproduce:**
1. Open the app
2. Search for "water fountain"
3. Tap on first result

**Expected Behavior:**
Should show utility details

**Actual Behavior:**
App crashes with error message

**Logs:**
[Attach relevant logs]

**Screenshots:**
[Add screenshots if helpful]
```

## 🎨 Design Guidelines

### UI/UX Principles

- **Map-First**: The map should be the primary interface
- **3-Tap Rule**: Any action should be completable in 3 taps or fewer
- **Consistency**: Use Material Design 3 components
- **Performance**: Optimize for low-end devices
- **Offline**: Core functionality should work offline

### Visual Design

- **Colors**: Primary blue (#2196F3), consistent with public service themes
- **Typography**: Roboto for Android, SF Pro for iOS
- **Icons**: Material Design icons with custom utility icons
- **Spacing**: 8dp grid system
- **Accessibility**: WCAG 2.1 AA compliance

## 🚀 Deployment

### Mobile App

- **iOS**: TestFlight for beta testing, App Store for production
- **Android**: Google Play Console for beta and production
- **CI/CD**: GitHub Actions for automated builds and testing

### Backend API

- **Development**: Docker Compose for local development
- **Staging**: Google Cloud Run or AWS ECS
- **Production**: Kubernetes cluster with auto-scaling
- **Database**: Managed PostgreSQL with read replicas
- **Monitoring**: Prometheus + Grafana for metrics

## 📈 Performance Guidelines

### Mobile App

- **Bundle Size**: Keep app size under 50MB
- **Memory Usage**: Monitor for memory leaks
- **Battery**: Optimize location tracking
- **Network**: Cache API responses, handle offline gracefully

### Backend API

- **Response Time**: < 200ms for nearby utilities endpoint
- **Database**: Index geospatial queries properly
- **Caching**: Redis for frequently accessed data
- **Rate Limiting**: Prevent API abuse

## 🔒 Security

### Data Privacy

- **Location**: Only use location when app is active
- **Analytics**: Anonymous usage analytics only
- **User Data**: Minimal data collection
- **Consent**: Clear privacy policy and consent flows

### API Security

- **Authentication**: Optional JWT tokens
- **Rate Limiting**: Prevent abuse and spam
- **Input Validation**: Sanitize all user inputs
- **HTTPS**: Enforce SSL in production

## 🤝 Community

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Discord**: Real-time chat for contributors
- **Twitter**: Project updates and announcements

### Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/). Be respectful, inclusive, and constructive in all interactions.

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Material Design 3](https://m3.material.io/)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [Google Maps Platform](https://developers.google.com/maps)

## ❓ Getting Help

1. Check existing [documentation](../README.md)
2. Search [GitHub Issues](https://github.com/your-org/urbanaid/issues)
3. Ask in [GitHub Discussions](https://github.com/your-org/urbanaid/discussions)
4. Join our [Discord community](https://discord.gg/urbanaid)

Thank you for contributing to UrbanAid! Together, we can help people find the public resources they need. 🌟 