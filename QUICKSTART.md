# Quick Start Guide

## Project Structure (Updated!)

The project has been reorganized into separate frontend and backend directories:

```
project410/
├── frontend/          # React + TanStack Router
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
└── backend/           # FastAPI ML API
    ├── main_xgboost.py
    ├── models/
    ├── start.sh
    └── requirements.txt
```

## Running the Application

### 1. Start Backend (ML API)

```bash
cd backend
./start.sh
```

Backend will run on: **http://localhost:8000**

The startup script automatically:
- Uses Homebrew-installed FastAPI and uvicorn
- Activates venv for ML packages (XGBoost, sklearn, pandas, numpy)
- Loads the XGBoost model (113 features, 82.6% accuracy)

**API Documentation:** http://localhost:8000/docs

### 2. Start Frontend

Open a new terminal:

```bash
cd frontend
pnpm dev
```

Frontend will run on: **http://localhost:5174** (or 5173)

### 3. Open in Browser

Visit: http://localhost:5174

## Available Pages

- **/** - Home page
- **/predict** - Single point prediction
- **/risk-map** - Interactive risk map with Longdo Maps
- **/route-analysis** - Route risk analysis (can call ML API)

## Testing the ML API

### Health Check
```bash
curl http://localhost:8000/
```

### Predict Accident Risk
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 13.7563,
    "longitude": 100.5018,
    "hour": 18,
    "day_of_week": 5,
    "month": 11,
    "temperature": 32.0,
    "rainfall": 0.0,
    "traffic_density": 0.8,
    "average_speed": 45.0
  }'
```

**Response:**
```json
{
  "prediction": "บาดเจ็บสาหัส",
  "probabilities": {
    "บาดเจ็บสาหัส": 0.597,
    "บาดเจ็บเล็กน้อย": 0.068,
    "เสียชีวิต": 0.335
  },
  "risk_score": 52,
  "risk_level": "high",
  "confidence": 0.597
}
```

## Frontend API Integration

The frontend can call the ML API from `src/lib/ml-prediction-api.ts`:

```typescript
import { predictAccidentRisk } from '@/lib/ml-prediction-api'

const result = await predictAccidentRisk({
  latitude: 13.7563,
  longitude: 100.5018,
  hour: 18,
  day_of_week: 5,
  month: 11
})

console.log(result.prediction)      // "บาดเจ็บสาหัส"
console.log(result.risk_score)      // 52
console.log(result.risk_level)      // "high"
```

## Model Information

- **Model Type**: XGBoost Classifier
- **Accuracy**: 82.6% (test set)
- **Classes**: 
  - บาดเจ็บเล็กน้อย (Minor injury)
  - บาดเจ็บสาหัส (Serious injury)
  - เสียชีวิต (Fatal)
- **Features**: 113 features including:
  - Location (lat/lng)
  - Time (hour, day, month)
  - Weather conditions
  - Traffic density
  - Road characteristics

## Stopping the Servers

### Stop Backend
```bash
# Find the process
lsof -ti:8000

# Kill it
kill -9 <PID>
```

Or just press `CTRL+C` in the terminal running the backend.

### Stop Frontend
Press `CTRL+C` in the terminal running `pnpm dev`.

## Troubleshooting

### Backend won't start
1. Check if port 8000 is in use: `lsof -ti:8000`
2. Make sure you have libomp installed: `brew install libomp`
3. Verify model files exist in `backend/models/`:
   - xgboost_model.pkl
   - label_encoder.pkl
   - feature_metadata.json

### Frontend won't start
1. Make sure dependencies are installed: `cd frontend && pnpm install`
2. Check if another Vite server is running (port 5173/5174)

### CORS errors
The backend has CORS enabled for all origins in development. If you still see CORS errors, check that the backend is running on port 8000.

## Next Steps

1. Add your Longdo API key to `frontend/.env`:
   ```env
   VITE_LONGDO_API_KEY=your_api_key_here
   ```

2. Integrate ML predictions into the route-analysis page

3. Add real-time traffic data from Longdo Maps API

4. Deploy to production (see README.md for deployment guide)

## Documentation

- `README.md` - Full project documentation
- `backend/README_XGBOOST.md` - Backend API details
- `LONGDO_INTEGRATION.md` - Longdo Maps integration
- `REAL_DATA_INTEGRATION.md` - Real data integration guide
