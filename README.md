# Thailand Accident Risk Prediction App

A full-stack application for predicting accident risk in Thailand using Machine Learning (XGBoost) and real-time map visualization.

## Project Structure

```
project410/
├── frontend/          # React + TypeScript + TanStack Router
│   ├── src/           # React components and routes
│   ├── public/        # Static assets
│   └── package.json   # Frontend dependencies
│
├── backend/           # FastAPI + Python ML API
│   ├── main_xgboost.py      # ML prediction API
│   ├── models/              # XGBoost model files
│   └── requirements.txt     # Python dependencies
│
└── README.md          # This file
```

## Features

- 🗺️ **Interactive Risk Map** - Visualize accident risk zones with Longdo Maps
- 🔮 **ML Prediction** - XGBoost model predicts accident severity (82.6% accuracy)
- 🛣️ **Route Analysis** - Analyze risk along a route with real-time factors
- 📊 **Risk Scoring** - 0-100 risk score with confidence levels
- 🌦️ **Weather Integration** - Considers weather conditions in predictions

## Getting Started

### Frontend (React + TanStack Router)

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend will run on: `http://localhost:5173`

### Backend (FastAPI + Python)

```bash
cd backend

# Install dependencies (using system Python)
python3 -m pip install --break-system-packages -r requirements.txt

# Or use virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run the API
python3 main_xgboost.py
```

Backend will run on: `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

## ML Model Details

- **Model**: XGBoost Classifier
- **Classes**: 3 (บาดเจ็บเล็กน้อย, บาดเจ็บสาหัส, เสียชีวิต)
- **Features**: 113 features including:
  - Location (latitude, longitude)
  - Time factors (hour, day, month, rush hour)
  - Weather conditions
  - Road characteristics
  - Traffic density
- **Accuracy**: 82.6% test accuracy

## API Endpoints

### GET `/`
Health check and service info

### POST `/predict`
Predict accident severity for a single point

```json
{
  "latitude": 13.7563,
  "longitude": 100.5018,
  "hour": 18,
  "day_of_week": 5,
  "month": 11
}
```

### POST `/predict/route`
Predict risk along a route

## Environment Variables

### Frontend (`frontend/.env`)
```env
VITE_LONGDO_API_KEY=your_longdo_api_key
```

## Tech Stack

### Frontend
- React 18
- TypeScript
- TanStack Router
- Vite
- Tailwind CSS
- Longdo Maps API

### Backend
- Python 3.13+
- FastAPI
- XGBoost
- scikit-learn
- pandas
- numpy

## Development

Both frontend and backend run independently:

1. Start backend first: `cd backend && python3 main_xgboost.py`
2. Start frontend: `cd frontend && pnpm dev`
3. Open `http://localhost:5173` in browser

The frontend will make API calls to `http://localhost:8000`

## Documentation

- `LONGDO_INTEGRATION.md` - Longdo Maps integration guide
- `REAL_DATA_INTEGRATION.md` - Real data integration guide
- `backend/README_XGBOOST.md` - Backend API documentation

## License

MIT
