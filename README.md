# SafeRoute Thailand - Accident Risk Prediction Platform

SafeRoute Thailand is a comprehensive web application designed to predict and analyze road accident risks across Thailand. It leverages Machine Learning, real-time traffic data, and weather conditions to provide actionable insights for safer travel.

## 🚀 Features

-   **Risk Prediction:** AI-powered accident risk assessment based on location, time, weather, and traffic data.
-   **Interactive Dashboard:** Visual analytics of accident statistics, hotspots, and trends.
-   **Real-time Monitoring:** Live traffic and weather updates integrated into risk models.
-   **Route Planning:** Safer route suggestions avoiding high-risk areas.
-   **Multi-language Support:** Full support for English and Thai languages.

## 🛠 Technology Stack

### Frontend
-   **Framework:** React 19 (via Vite)
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS 4, Shadcn UI (Radix UI)
-   **State Management:** React Context / Hooks
-   **Routing:** TanStack Router
-   **Maps:** Leaflet, React-Leaflet
-   **Charts:** Recharts
-   **Auth:** Google OAuth

### Backend
-   **Framework:** FastAPI (Python)
-   **ML Libraries:** Scikit-learn, XGBoost, Pandas, NumPy
-   **Database Client:** Supabase Python Client
-   **API Integration:** OpenWeatherMap, TomTom Traffic API

### Database & Infrastructure
-   **Database:** Supabase (PostgreSQL), Neon (Serverless Postgres)
-   **ORM:** Drizzle ORM (Frontend/Edge), SQL (Backend)

## 📋 Prerequisites

-   Node.js (v18+ recommended)
-   pnpm (or npm/yarn)
-   Python 3.9+
-   Git

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SorayutChroenrit/Thailand-Accident-Risk-Prediction.git
cd Thailand-Accident-Risk-Prediction
```

### 2. Backend Setup

Navigate to the backend directory and set up the Python environment.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Environment Variables (`backend/.env`):**
Create a `.env` file in the `backend` directory with the following keys:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENWEATHER_API_KEY=your_openweather_key
TOMTOM_API_KEY=your_tomtom_key
```

**Run the Backend:**

```bash
# Development mode
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
API Documentation (Swagger UI): `http://localhost:8000/docs`

### 3. Frontend Setup

Navigate to the frontend directory.

```bash
cd ../frontend

# Install dependencies
pnpm install
```

**Environment Variables (`frontend/.env`):**
Create a `.env` file in the `frontend` directory (if needed, though Vite handles env vars prefixed with `VITE_`).

```env
VITE_API_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

**Run the Frontend:**

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`.

## 📖 Usage Guide

1.  **Dashboard:** View overall accident statistics, heatmaps of high-risk provinces, and temporal trends.
2.  **Live Events:** Monitor real-time traffic incidents and weather alerts.
3.  **Predict:** Select a location and time to get a specific accident risk probability.
4.  **Route:** Plan a trip between two points and see the risk level of the suggested route.
5.  **Records:** Access historical accident data (requires login).

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 🇹🇭 คู่มือการติดตั้งและใช้งาน (สำหรับผู้เริ่มต้น)

หากคุณเพิ่ง Clone โปรเจกต์นี้มา ให้ทำตามขั้นตอนดังนี้เพื่อให้ระบบทำงานได้สมบูรณ์:

### 1. เตรียม Environment
ต้องติดตั้งโปรแกรมเหล่านี้ก่อน:
-   **Node.js** (แนะนำเวอร์ชั่น 18 ขึ้นไป)
-   **Python** (เวอร์ชั่น 3.9 ขึ้นไป)
-   **Git**

### 2. ตั้งค่า Backend (ระบบหลังบ้าน)
เปิด Terminal แล้วเข้าไปที่โฟลเดอร์ `backend`:

```bash
cd backend
```

สร้างและเปิดใช้งาน Virtual Environment:
```bash
# สำหรับ Mac/Linux
python3 -m venv venv
source venv/bin/activate

# สำหรับ Windows
python -m venv venv
venv\Scripts\activate
```

ติดตั้ง Library ที่จำเป็น:
```bash
pip install -r requirements.txt
```

**สำคัญ:** สร้างไฟล์ `.env` ในโฟลเดอร์ `backend` และใส่ค่าเหล่านี้ (ถ้าไม่มีต้องขอจากเจ้าของโปรเจกต์):
```env
SUPABASE_URL=...
SUPABASE_KEY=...
OPENWEATHER_API_KEY=...
TOMTOM_API_KEY=...
```

รัน Server:
```bash
uvicorn main:app --reload --port 10000
```
*Backend จะทำงานที่ `http://localhost:10000`*

---

### 3. ตั้งค่า Frontend (หน้าเว็บ)
เปิด Terminal อีกตัว (อย่าปิดตัวเก่า) แล้วเข้าไปที่ `frontend`:

```bash
cd frontend
```

ติดตั้ง Package:
```bash
pnpm install
# หรือ npm install
```

**สำคัญ:** สร้างไฟล์ `.env` ในโฟลเดอร์ `frontend` โดยดูตัวอย่างจาก `.env.example`:
```env
VITE_ML_API_URL=http://localhost:10000
VITE_LONGDO_API_KEY=370a1776e0879ff8bb99731798210fd7
VITE_GISTDA_API_KEY=7567523F6CB64B498F24398D01F2A4FD
```

รันหน้าเว็บ:
```bash
pnpm dev
# หรือ npm run dev
```
*เว็บจะเปิดที่ `http://localhost:5173`*

---

### ✅ เช็คความเรียบร้อย
1.  เปิดเว็บ `http://localhost:5173`
2.  ลองกดเมนู **"Map"** แผนที่ต้องขึ้น
3.  ลองกด **"Reports"** ข้อมูลต้องโหลดได้ (ถ้าหมุนติ้วๆ แสดงว่า Backend ยังไม่รัน หรือต่อ Database ไม่ได้)

---

## 📄 License

This project is licensed under the MIT License.
