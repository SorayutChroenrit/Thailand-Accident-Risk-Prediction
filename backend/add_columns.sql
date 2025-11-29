-- Add Missing Columns to traffic_events Table
-- Run this in Supabase SQL Editor

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS casualties_fatal INTEGER DEFAULT 0;

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS casualties_serious INTEGER DEFAULT 0;

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS casualties_minor INTEGER DEFAULT 0;

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS temperature FLOAT;

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS humidity FLOAT;

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS wind_speed FLOAT;

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS pressure FLOAT;

ALTER TABLE traffic_events
        ADD COLUMN IF NOT EXISTS cloud_cover FLOAT;

