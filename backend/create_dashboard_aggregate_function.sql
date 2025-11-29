-- PostgreSQL Function for Fast Dashboard Aggregation
-- This function runs aggregation queries directly in the database
-- instead of fetching all 122k+ rows to Python

CREATE OR REPLACE FUNCTION get_dashboard_stats(
    p_start_date TEXT DEFAULT '2019-01-01',
    p_end_date TEXT DEFAULT '2025-12-31',
    p_province TEXT DEFAULT 'all',
    p_vehicle_type TEXT DEFAULT 'all',
    p_weather TEXT DEFAULT 'all',
    p_casualty_type TEXT DEFAULT 'all'
)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    WITH filtered_data AS (
        SELECT
            accident_datetime,
            accident_type,
            province,
            vehicle_1,
            weather_condition,
            accident_cause,
            casualties_fatal,
            casualties_serious,
            casualties_minor,
            CASE
                WHEN casualties_fatal > 0 THEN 'fatal'
                WHEN casualties_serious > 0 THEN 'serious'
                WHEN casualties_minor > 0 THEN 'minor'
                ELSE 'survivors'
            END as severity_category
        FROM accident_records
        WHERE accident_datetime >= p_start_date::TIMESTAMP
          AND accident_datetime <= p_end_date::TIMESTAMP
          AND (p_province = 'all' OR province = p_province)
          AND (p_vehicle_type = 'all' OR vehicle_1 = p_vehicle_type)
          AND (
            p_weather = 'all' OR
            weather_condition = p_weather OR
            (p_weather = 'แจ่มใส' AND weather_condition = 'clear') OR
            (p_weather = 'ฝนตก' AND weather_condition = 'rain') OR
            (p_weather = 'มืดครึ้ม' AND weather_condition = 'cloudy') OR
            (p_weather = 'หมอก' AND weather_condition = 'fog') OR
            (p_weather = 'ฝนตกหนัก' AND weather_condition = 'heavy_rain')
          )
          AND (
            p_casualty_type = 'all' OR
            (p_casualty_type = 'fatal' AND casualties_fatal > 0) OR
            (p_casualty_type = 'serious' AND casualties_serious > 0 AND casualties_fatal = 0) OR
            (p_casualty_type = 'minor' AND casualties_minor > 0 AND casualties_serious = 0 AND casualties_fatal = 0) OR
            (p_casualty_type = 'survivors' AND casualties_fatal = 0 AND casualties_serious = 0 AND casualties_minor = 0)
          )
    ),
    summary_stats AS (
        SELECT
            COUNT(*) as total_accidents,
            SUM(casualties_fatal) as total_fatalities,
            SUM(casualties_serious) as total_serious,
            SUM(casualties_minor) as total_minor
        FROM filtered_data
    ),
    type_stats AS (
        SELECT
            accident_type,
            COUNT(*) as count
        FROM filtered_data
        GROUP BY accident_type
        ORDER BY count DESC
        LIMIT 10
    ),
    weather_stats AS (
        SELECT
            CASE
                WHEN weather_condition = 'clear' THEN 'แจ่มใส'
                WHEN weather_condition = 'rain' THEN 'ฝนตก'
                WHEN weather_condition = 'cloudy' THEN 'มืดครึ้ม'
                WHEN weather_condition = 'fog' THEN 'หมอก'
                WHEN weather_condition = 'heavy_rain' THEN 'ฝนตกหนัก'
                ELSE COALESCE(weather_condition, 'ไม่ทราบ')
            END as weather,
            COUNT(*) as count
        FROM filtered_data
        GROUP BY weather_condition
        ORDER BY count DESC
    ),
    cause_stats AS (
        SELECT
            COALESCE(accident_cause, 'ไม่ระบุ') as cause,
            COUNT(*) as count
        FROM filtered_data
        WHERE accident_cause IS NOT NULL AND accident_cause != ''
        GROUP BY accident_cause
        ORDER BY count DESC
        LIMIT 10
    ),
    province_stats AS (
        SELECT
            province,
            COUNT(*) as count
        FROM filtered_data
        GROUP BY province
        ORDER BY count DESC
        LIMIT 10
    ),
    all_province_stats AS (
        SELECT
            province,
            COUNT(*) as count,
            SUM(casualties_fatal) as fatal,
            SUM(casualties_serious) as serious,
            SUM(casualties_minor) as minor,
            SUM(CASE WHEN casualties_fatal = 0 THEN 1 ELSE 0 END) as survivors
        FROM filtered_data
        GROUP BY province
        ORDER BY count DESC
    ),
    monthly_stats AS (
        SELECT
            TO_CHAR(accident_datetime, 'YYYY-MM') as month,
            COUNT(*) as count
        FROM filtered_data
        GROUP BY TO_CHAR(accident_datetime, 'YYYY-MM')
        ORDER BY month
    ),
    hourly_stats AS (
        SELECT
            EXTRACT(HOUR FROM accident_datetime)::INTEGER as hour,
            COUNT(*) as count
        FROM filtered_data
        GROUP BY EXTRACT(HOUR FROM accident_datetime)
        ORDER BY hour
    ),
    daily_stats AS (
        SELECT
            EXTRACT(DOW FROM accident_datetime)::INTEGER as day_of_week,
            COUNT(*) as count
        FROM filtered_data
        GROUP BY EXTRACT(DOW FROM accident_datetime)
        ORDER BY day_of_week
    ),
    vehicle_hour_stats AS (
        SELECT
            vehicle_1,
            EXTRACT(HOUR FROM accident_datetime)::INTEGER as hour,
            COUNT(*) as count
        FROM filtered_data
        WHERE vehicle_1 IS NOT NULL
        GROUP BY vehicle_1, EXTRACT(HOUR FROM accident_datetime)
        ORDER BY vehicle_1, hour
    )
    SELECT json_build_object(
        'summary', (
            SELECT json_build_object(
                'total_accidents', total_accidents,
                'fatalities', total_fatalities,
                'serious_injuries', total_serious,
                'minor_injuries', total_minor,
                'survivors', total_accidents - total_fatalities,
                'high_risk_areas', (SELECT COUNT(*) FROM province_stats WHERE count > 100)
            )
            FROM summary_stats
        ),
        'event_types', (
            SELECT json_agg(json_build_object('type', accident_type, 'count', count))
            FROM type_stats
        ),
        'weather_data', (
            SELECT json_agg(json_build_object('weather', weather, 'count', count))
            FROM weather_stats
        ),
        'accident_causes', (
            SELECT json_agg(json_build_object('cause', cause, 'count', count))
            FROM cause_stats
        ),
        'top_provinces', (
            SELECT json_agg(json_build_object('province', province, 'count', count))
            FROM province_stats
        ),
        'all_provinces', (
            SELECT json_agg(json_build_object(
                'province', province,
                'count', count,
                'fatal', fatal,
                'serious', serious,
                'minor', minor,
                'survivors', survivors
            ))
            FROM all_province_stats
        ),
        'monthly_trend', (
            SELECT json_agg(json_build_object('month', month, 'count', count))
            FROM monthly_stats
        ),
        'hourly_pattern', (
            SELECT json_agg(json_build_object('hour', hour, 'count', count))
            FROM hourly_stats
        ),
        'daily_pattern', (
            SELECT json_agg(json_build_object('day_of_week', day_of_week, 'count', count))
            FROM daily_stats
        ),
        'vehicle_by_hour', (
            SELECT json_agg(json_build_object('vehicle_type', vehicle_1, 'hour', hour, 'count', count))
            FROM vehicle_hour_stats
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_dashboard_stats(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_stats(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon;

-- Example usage:
-- SELECT get_dashboard_stats('2019-01-01', '2025-12-31', 'all', 'all', 'all', 'all');
-- SELECT get_dashboard_stats('2024-01-01', '2024-12-31', 'กรุงเทพมหานคร', 'รถจักรยานยนต์', 'ฝนตก', 'fatal');
