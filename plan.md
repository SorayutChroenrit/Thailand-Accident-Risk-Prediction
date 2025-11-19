# Thailand Accident Risk Prediction Application

## Project Overview
A web application that predicts accident risk areas in Thailand with severity levels (Minor Injury/บาดเจ็บน้อย, Serious Injury/บาดเจ็บสาหัส, Fatal/เสียชีวิต) using machine learning models fed by real-time weather, traffic, and historical accident data.

---

## Tech Stack

### Frontend
- **Framework**: TanStack Start (React 19)
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Maps**: Leaflet with OpenStreetMap
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **i18n**: Custom hook for EN/TH

### Backend
- **API Routes**: TanStack Start API
- **ML Service**: Python FastAPI
- **Database**: Neon PostgreSQL (free cloud) with PostGIS

### External APIs
- **Weather**: OpenWeatherMap API (free tier)
- **Traffic**: TomTom Traffic API (free tier)
- **Historical Data**: Mock data (real data to be provided later)

### Deployment
- **Frontend**: Vercel
- **ML Service**: Railway/Render
- **Database**: Neon PostgreSQL

---

## Design System

### Colors
```css
--primary: #2563EB        /* Blue - Trust, safety */
--risk-low: #22C55E       /* Green - Minor injury */
--risk-medium: #F97316    /* Orange - Serious injury */
--risk-high: #EF4444      /* Red - Fatal */
--background: #F8FAFC     /* Light slate */
--foreground: #0F172A     /* Dark slate */
```

### Typography
- **Font Family**: IBM Plex Sans Thai
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Risk Severity Labels
| Level | English | Thai | Color | Icon |
|-------|---------|------|-------|------|
| Low | Minor Injury | บาดเจ็บน้อย | Green | Shield |
| Medium | Serious Injury | บาดเจ็บสาหัส | Orange | AlertTriangle |
| High | Fatal | เสียชีวิต | Red | Skull |

---

## Application Structure

### Pages

#### 1. Landing Page (`/`)
- Professional hero section with animated statistics
- Quick location search
- Feature highlights (3-4 cards)
- Live risk preview widget
- Recent predictions
- Call-to-action buttons
- Footer with links

#### 2. Interactive Map (`/map`)
- Full-screen Leaflet map (Thailand bounds: 5.6-20.5°N, 97.3-105.6°E)
- Risk heatmap overlay
- Clickable location markers
- Filter sidebar:
  - Time period
  - Severity level
  - Road type
  - Weather conditions
- Search bar
- Current location button
- Legend

#### 3. Dashboard (`/dashboard`)
- Overview stat cards:
  - Total predictions today
  - High-risk areas count
  - Active weather alerts
  - Traffic incidents
- Charts:
  - Risk distribution pie chart
  - Accidents over time line chart
  - Top 10 high-risk areas bar chart
  - Risk by hour heatmap
  - Weather correlation chart
- Real-time data indicators
- Export buttons

#### 4. Prediction Tool (`/predict`)
- Location input (map picker or address)
- Auto-filled current weather data
- Auto-filled traffic conditions
- Date/time selector
- Additional factors input
- Prediction results:
  - Risk score (0-100%)
  - Severity with confidence
  - Contributing factors
  - Historical comparison
  - Safety recommendations

#### 5. Historical Data (`/history`)
- DataTable with columns:
  - Location
  - Date/Time
  - Severity
  - Weather
  - Risk Score
- Filters and search
- Pagination
- Export to CSV/Excel

#### 6. Reports (`/reports`)
- Report type selection
- Date range picker
- Region/province filter
- Generate PDF/Excel
- Scheduled reports (future)

#### 7. Settings (`/settings`)
- Language toggle (EN/TH)
- Theme (Light/Dark/System)
- Default map view
- Data preferences

#### 8. About (`/about`)
- Project description
- Methodology explanation
- Data sources
- Team/Contact info
- FAQ

---

## Project Structure

```
project410/
├── app/
│   ├── routes/
│   │   ├── __root.tsx          # Root layout
│   │   ├── index.tsx           # Landing page
│   │   ├── map.tsx             # Interactive map
│   │   ├── dashboard.tsx       # Analytics dashboard
│   │   ├── predict.tsx         # Prediction tool
│   │   ├── history.tsx         # Historical data
│   │   ├── reports.tsx         # Report generation
│   │   ├── settings.tsx        # User settings
│   │   ├── about.tsx           # About page
│   │   └── api/
│   │       ├── locations.ts
│   │       ├── accidents.ts
│   │       ├── predict.ts
│   │       ├── stats.ts
│   │       ├── weather.ts
│   │       └── traffic.ts
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Navigation.tsx
│   │   ├── map/
│   │   │   ├── RiskMap.tsx
│   │   │   ├── HeatmapLayer.tsx
│   │   │   ├── LocationMarker.tsx
│   │   │   └── MapControls.tsx
│   │   ├── charts/
│   │   │   ├── RiskPieChart.tsx
│   │   │   ├── TimelineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── HeatmapChart.tsx
│   │   ├── forms/
│   │   │   ├── PredictionForm.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── FilterForm.tsx
│   │   └── common/
│   │       ├── RiskBadge.tsx
│   │       ├── StatCard.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── LanguageToggle.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   ├── api.ts
│   │   ├── constants.ts
│   │   └── validations.ts
│   ├── hooks/
│   │   ├── useLanguage.ts
│   │   ├── useTheme.ts
│   │   ├── useWeather.ts
│   │   └── useTraffic.ts
│   ├── i18n/
│   │   ├── en.json
│   │   └── th.json
│   ├── types/
│   │   └── index.ts
│   └── styles/
│       └── globals.css
├── ml-service/
│   ├── app.py                  # FastAPI main
│   ├── model/
│   │   ├── train.py
│   │   ├── predict.py
│   │   └── model.pkl
│   ├── services/
│   │   ├── weather.py
│   │   └── traffic.py
│   └── requirements.txt
├── public/
│   └── images/
├── tailwind.config.ts
├── components.json             # shadcn config
├── package.json
├── plan.md                     # This file
└── README.md
```

---

## Database Schema

### Tables

```sql
-- Provinces/Regions
CREATE TABLE provinces (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_th VARCHAR(100) NOT NULL,
  geometry GEOMETRY(POLYGON, 4326)
);

-- Locations (accident-prone areas)
CREATE TABLE locations (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(200),
  name_th VARCHAR(200),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  geometry GEOMETRY(POINT, 4326),
  road_type VARCHAR(50),
  province_id INTEGER REFERENCES provinces(id),
  speed_limit INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Historical accidents
CREATE TABLE accidents (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  occurred_at TIMESTAMP NOT NULL,
  severity VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high'
  weather_condition VARCHAR(50),
  road_condition VARCHAR(50),
  casualties_minor INTEGER DEFAULT 0,
  casualties_serious INTEGER DEFAULT 0,
  casualties_fatal INTEGER DEFAULT 0,
  factors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Weather data cache
CREATE TABLE weather_data (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  fetched_at TIMESTAMP NOT NULL,
  temperature DECIMAL(5, 2),
  humidity INTEGER,
  visibility INTEGER,
  wind_speed DECIMAL(5, 2),
  condition VARCHAR(50),
  rain_1h DECIMAL(5, 2),
  raw_data JSONB
);

-- Traffic data cache
CREATE TABLE traffic_data (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  fetched_at TIMESTAMP NOT NULL,
  congestion_level INTEGER, -- 0-100
  average_speed DECIMAL(5, 2),
  incidents INTEGER,
  raw_data JSONB
);

-- Predictions log
CREATE TABLE predictions (
  id SERIAL PRIMARY KEY,
  location_id INTEGER REFERENCES locations(id),
  predicted_at TIMESTAMP NOT NULL,
  risk_score DECIMAL(5, 2) NOT NULL,
  severity_prediction VARCHAR(20) NOT NULL,
  confidence DECIMAL(5, 2),
  weather_data_id INTEGER REFERENCES weather_data(id),
  traffic_data_id INTEGER REFERENCES traffic_data(id),
  factors JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_accidents_location ON accidents(location_id);
CREATE INDEX idx_accidents_occurred ON accidents(occurred_at);
CREATE INDEX idx_weather_location_time ON weather_data(location_id, fetched_at);
CREATE INDEX idx_traffic_location_time ON traffic_data(location_id, fetched_at);
CREATE INDEX idx_predictions_location ON predictions(location_id);
```

---

## API Endpoints

### TanStack Start API Routes

```typescript
// Locations
GET  /api/locations              // List all locations
GET  /api/locations/:id          // Get location details
GET  /api/locations/nearby       // Get nearby locations (lat, lng, radius)

// Accidents
GET  /api/accidents              // List accidents (with filters)
GET  /api/accidents/stats        // Aggregated statistics

// Predictions
POST /api/predict                // Make a prediction
GET  /api/predictions            // List past predictions

// Real-time data
GET  /api/weather/:locationId    // Get current weather
GET  /api/traffic/:locationId    // Get current traffic
POST /api/data/refresh           // Trigger data refresh

// Dashboard
GET  /api/dashboard/stats        // Dashboard statistics
GET  /api/dashboard/charts       // Chart data

// Export
GET  /api/export/accidents       // Export accidents data
GET  /api/export/predictions     // Export predictions data
```

### Python ML Service API

```python
POST /predict                    # Make prediction
{
  "latitude": 13.7563,
  "longitude": 100.5018,
  "datetime": "2024-01-15T14:30:00",
  "weather": {...},
  "traffic": {...}
}

GET  /model/info                 # Model metadata
POST /model/retrain              # Trigger retraining (admin)
GET  /health                     # Health check
```

---

## External API Integration

### OpenWeatherMap API
- **Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **Free Tier**: 1,000 calls/day
- **Data Used**:
  - Temperature
  - Humidity
  - Visibility
  - Wind speed
  - Rain volume
  - Weather condition

### TomTom Traffic API
- **Endpoint**: `https://api.tomtom.com/traffic/services/4/flowSegmentData`
- **Free Tier**: 2,500 requests/day
- **Data Used**:
  - Current speed
  - Free flow speed
  - Congestion level
  - Road closure info

---

## ML Model Features

### Input Features
1. **Location**: latitude, longitude
2. **Temporal**: hour, day_of_week, month, is_holiday
3. **Weather**: temperature, humidity, visibility, wind_speed, rain, condition
4. **Traffic**: congestion_level, average_speed, incidents
5. **Historical**: accident_count_30d, avg_severity_30d
6. **Road**: road_type, speed_limit, near_intersection

### Output
- **risk_score**: 0-100 (probability of accident)
- **severity**: 'low' | 'medium' | 'high'
- **confidence**: 0-100
- **contributing_factors**: Array of factor weights

### Model Architecture
- **Algorithm**: XGBoost or Random Forest
- **Training**: Historical accident data + weather + traffic
- **Retraining**: Weekly with new data

---

## Implementation Phases

### Phase 1: Foundation + Landing Page
- [x] Create plan.md
- [ ] Initialize TanStack Start project
- [ ] Setup Tailwind CSS
- [ ] Install and configure shadcn/ui
- [ ] Setup IBM Plex Sans Thai font
- [ ] Create professional landing page
- [ ] Setup Neon PostgreSQL
- [ ] Create basic layout (Header, Footer, Navigation)
- [ ] Implement language toggle

### Phase 2: Data Automation Pipeline
- [ ] Create OpenWeatherMap integration service
- [ ] Create TomTom Traffic integration service
- [ ] Setup database tables
- [ ] Create data fetching cron jobs
- [ ] Build API routes for weather/traffic
- [ ] Create mock historical accident data

### Phase 3: Core UI Pages
- [ ] Build Map page with Leaflet
- [ ] Create Dashboard with charts
- [ ] Build Prediction form
- [ ] Create History data table
- [ ] Build Reports page
- [ ] Create Settings page
- [ ] Build About page

### Phase 4: ML Integration
- [ ] Setup Python FastAPI service
- [ ] Create ML model training pipeline
- [ ] Build prediction endpoint
- [ ] Connect frontend to ML service
- [ ] Display real-time predictions

### Phase 5: Polish & Features
- [ ] Add all Recharts visualizations
- [ ] Implement PDF/Excel export
- [ ] Add loading states & skeletons
- [ ] Complete EN/TH translations
- [ ] Implement dark mode
- [ ] Add animations & transitions
- [ ] Error handling & validation

### Phase 6: Deployment
- [ ] Deploy frontend to Vercel
- [ ] Deploy ML service to Railway
- [ ] Configure Neon PostgreSQL
- [ ] Setup environment variables
- [ ] Configure domains
- [ ] Testing & optimization
- [ ] Documentation

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/...

# External APIs
OPENWEATHERMAP_API_KEY=your_key
TOMTOM_API_KEY=your_key

# ML Service
ML_SERVICE_URL=https://your-ml-service.railway.app

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Run ML service
cd ml-service && uvicorn app:app --reload

# Database migrations
pnpm db:migrate

# Seed mock data
pnpm db:seed
```

---

## Notes for AI Agents

1. **Always read this plan.md first** before making changes
2. **Follow the project structure** defined above
3. **Use shadcn/ui components** from the ui/ folder
4. **Maintain bilingual support** - all user-facing text should have EN/TH versions
5. **Use the defined color scheme** for consistency
6. **Follow TypeScript best practices** with proper typing
7. **Keep components modular** and reusable
8. **Document complex functions** with JSDoc comments
9. **Use the defined API structure** for all endpoints
10. **Test changes** before committing

---

## Resources

- [TanStack Start Docs](https://tanstack.com/start)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Leaflet Documentation](https://leafletjs.com)
- [Recharts](https://recharts.org)
- [Neon PostgreSQL](https://neon.tech)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [TomTom Traffic API](https://developer.tomtom.com)
