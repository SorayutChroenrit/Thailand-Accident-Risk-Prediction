-- Create Comprehensive Accident Data Table
-- This table stores ALL columns from accident_2019_2025_with_weather.csv

CREATE TABLE IF NOT EXISTS accident_records (
    -- Primary Key
    id BIGSERIAL PRIMARY KEY,

    -- Accident Identification
    acc_code TEXT,
    event_id TEXT UNIQUE,

    -- Date/Time Information
    accident_year INTEGER,
    accident_date DATE,
    accident_time TIME,
    accident_datetime TIMESTAMP,
    report_date DATE,
    report_time TIME,
    hour INTEGER,
    timestamp TIMESTAMP,

    -- Location Information
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    province TEXT,
    organization TEXT,
    organization_route TEXT,
    route_code TEXT,
    route_name TEXT,
    km FLOAT,
    accident_location TEXT,

    -- Accident Details
    vehicle_1 TEXT,
    accident_area_type TEXT,
    presumed_cause TEXT,
    accident_type TEXT,
    weather_condition TEXT,

    -- Vehicle Counts
    total_vehicles INTEGER DEFAULT 0,
    total_vehicles_and_people INTEGER DEFAULT 0,
    motorcycles INTEGER DEFAULT 0,
    tricycles INTEGER DEFAULT 0,
    private_cars INTEGER DEFAULT 0,
    vans INTEGER DEFAULT 0,
    passenger_pickups INTEGER DEFAULT 0,
    buses INTEGER DEFAULT 0,
    pickup_trucks_4wheel INTEGER DEFAULT 0,
    trucks_6wheel INTEGER DEFAULT 0,
    trucks_under_10wheel INTEGER DEFAULT 0,
    trucks_over_10wheel INTEGER DEFAULT 0,
    tuk_tuks INTEGER DEFAULT 0,
    other_vehicles INTEGER DEFAULT 0,
    pedestrians INTEGER DEFAULT 0,

    -- Casualties
    casualties_fatal INTEGER DEFAULT 0,
    casualties_serious INTEGER DEFAULT 0,
    casualties_minor INTEGER DEFAULT 0,
    casualties_total INTEGER DEFAULT 0,

    -- Weather Data
    temperature FLOAT,
    dewpoint FLOAT,
    humidity FLOAT,
    wind_speed FLOAT,
    wind_direction FLOAT,
    pressure FLOAT,
    cloud_cover FLOAT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_accident_records_datetime ON accident_records(accident_datetime);
CREATE INDEX IF NOT EXISTS idx_accident_records_year ON accident_records(accident_year);
CREATE INDEX IF NOT EXISTS idx_accident_records_location ON accident_records(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_accident_records_province ON accident_records(province);
CREATE INDEX IF NOT EXISTS idx_accident_records_acc_code ON accident_records(acc_code);

-- Create GiST Index for Spatial Queries (if PostGIS is enabled)
-- CREATE INDEX IF NOT EXISTS idx_accident_records_geom ON accident_records USING GIST(ST_MakePoint(longitude, latitude));

COMMENT ON TABLE accident_records IS 'Comprehensive accident records from 2019-2025 with weather data';
COMMENT ON COLUMN accident_records.acc_code IS 'Accident code from source data';
COMMENT ON COLUMN accident_records.casualties_fatal IS 'Number of fatalities';
COMMENT ON COLUMN accident_records.casualties_serious IS 'Number of serious injuries';
COMMENT ON COLUMN accident_records.casualties_minor IS 'Number of minor injuries';
COMMENT ON COLUMN accident_records.temperature IS 'Temperature in Celsius';
COMMENT ON COLUMN accident_records.humidity IS 'Humidity percentage';
COMMENT ON COLUMN accident_records.wind_speed IS 'Wind speed in km/h';
