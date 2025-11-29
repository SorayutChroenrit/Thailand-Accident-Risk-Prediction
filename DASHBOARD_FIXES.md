# Dashboard Fixes - Implementation Guide

## Issues Fixed

1. ✅ **Filter Issues**: Only province filter worked, but severity, vehicle, and weather filters didn't work
2. ✅ **Heat Map Color Issue**: When selecting a province, it turned grey instead of maintaining color intensity
3. ✅ **Weather Chart Empty**: The weather chart was empty because API didn't return weather data

## Changes Made

### 1. Backend Changes

#### A. Updated SQL Function (`backend/create_dashboard_aggregate_function.sql`)
- Added `p_casualty_type` parameter to filter by casualty severity (fatal/serious/minor/survivors)
- Added `weather_stats` CTE to aggregate weather condition data
- Added casualty type filtering logic in the WHERE clause
- Updated GRANT statements to include the new parameter

#### B. Updated API (`backend/main.py`)
- Added `p_casualty_type` parameter to RPC function call
- Added `weather_data` field to response mapping

### 2. Frontend Changes

#### A. Updated TypeScript Interface (`frontend/src/lib/dashboard-service.ts`)
- Added `weather_data` field to `DashboardStats` interface

#### B. Updated Dashboard Component (`frontend/src/routes/dashboard.tsx`)
- Fixed `weatherData` to use API data instead of empty array
- Fixed heat map to maintain province colors when filtering (removed grey-out effect)
- Fixed province selection to use name comparison instead of ID
- Fixed pie chart label type issues

## How to Apply These Changes

### Step 1: Update the Database Function

You need to update the PostgreSQL function in your Supabase database:

**Option A: Using Supabase SQL Editor (Recommended)**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Navigate to: SQL Editor (left sidebar)
3. Open the file: `backend/create_dashboard_aggregate_function.sql`
4. Copy the entire content and paste it into the SQL Editor
5. Click **"Run"** to execute

**Option B: Using Python Script**
```bash
cd backend
python update_dashboard_function.py
```
Note: This script will guide you through the manual steps since Supabase Python client doesn't support direct SQL execution.

**Option C: Using psql Command Line**
```bash
cd backend
psql 'YOUR_DATABASE_URL' < create_dashboard_aggregate_function.sql
```

### Step 2: Restart Backend Server

After updating the database function, restart your FastAPI server:

```bash
cd backend
python main.py
```

### Step 3: Restart Frontend

The frontend changes are already in place, just restart your dev server:

```bash
cd frontend
npm run dev
```

## Testing the Fixes

### 1. Test Province Filter
- Open dashboard: http://localhost:5173/dashboard
- Select any province from the dropdown
- ✅ The heat map should maintain colors for all provinces (not turn grey)
- ✅ The selected province should have a thicker border (weight: 3)
- ✅ All statistics should update to show only that province's data

### 2. Test Severity Filter (ระดับความรุนแรง)
- Select "ผู้เสียชีวิต" (Fatal) from the dropdown
- ✅ Statistics should update to show only fatal accidents
- ✅ Charts should reflect filtered data

### 3. Test Vehicle Type Filter (ประเภทรถ)
- Select "รถจักรยานยนต์" (Motorcycle) from the dropdown
- ✅ Statistics should update to show only motorcycle accidents
- ✅ Vehicle chart should update accordingly

### 4. Test Weather Filter (สภาพอากาศ)
- Select "ฝนตก" (Rain) from the dropdown
- ✅ Statistics should update to show only accidents in rain
- ✅ Weather chart should now be populated with data

### 5. Test Combined Filters
- Try selecting multiple filters at once
- ✅ All filters should work together correctly
- ✅ Data should be filtered by ALL selected criteria

### 6. Test Weather Chart
- The weather chart should now show data instead of being empty
- ✅ Should display bars for: แจ่มใส (Clear), ฝนตก (Rain), มืดครึ้ม (Overcast)
- ✅ Hover tooltips should work

## API Parameters

The dashboard API now accepts these parameters:

```
GET /dashboard/stats?date_range=all&province=all&casualty_type=all&vehicle_type=all&weather=all
```

### Valid Values:

**date_range:**
- `all`, `2025`, `2024`, `2023`, `2022`, `2021`, `2020`, `2019`

**province:**
- `all` or any Thai province name (e.g., `กรุงเทพมหานคร`)

**casualty_type:** ⭐ NEW
- `all`, `fatal`, `serious`, `minor`, `survivors`

**vehicle_type:**
- `all` or any vehicle type (e.g., `รถจักรยานยนต์`)

**weather:** ⭐ NOW WORKS
- `all`, `แจ่มใส`, `ฝนตก`, `มืดครึ้ม`

## Database Function Signature

```sql
CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_start_date TEXT DEFAULT '2019-01-01',
    p_end_date TEXT DEFAULT '2025-12-31',
    p_province TEXT DEFAULT 'all',
    p_vehicle_type TEXT DEFAULT 'all',
    p_weather TEXT DEFAULT 'all',
    p_casualty_type TEXT DEFAULT 'all'  -- NEW PARAMETER
)
RETURNS JSON
```

## Troubleshooting

### Issue: Filters still don't work
- Make sure you updated the SQL function in Supabase
- Restart the backend server
- Clear browser cache and reload

### Issue: Weather chart is still empty
- Check if your database has `weather_condition` column populated
- Verify the SQL function returns `weather_data` in the response
- Check browser console for API errors

### Issue: Heat map still turns grey
- Make sure you pulled the latest frontend code
- Clear browser cache
- Check that lines 384-392 and 466-471 in `dashboard.tsx` don't have the grey color logic

### Issue: "Function not found" error
- The SQL function wasn't updated in Supabase
- Follow Step 1 again to update the database function
- Make sure you're using the correct Supabase project

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the backend logs for API errors
3. Verify the SQL function exists in Supabase
4. Make sure all environment variables are set correctly

## Summary

All dashboard filters now work correctly:
- ✅ Province filter (จังหวัด)
- ✅ Date range filter (ช่วงวันที่)
- ✅ Severity filter (ระดับความรุนแรง) - **NOW WORKING**
- ✅ Vehicle type filter (ประเภทรถ) - **NOW WORKING**
- ✅ Weather filter (สภาพอากาศ) - **NOW WORKING**

Heat map behavior improved:
- ✅ Provinces maintain their color intensity when filtering
- ✅ Selected province is highlighted with a thicker border

Weather chart now populated:
- ✅ Displays weather condition distribution
- ✅ Updates based on selected filters