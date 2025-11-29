"""
Add this endpoint to main.py to query unique filter values from database
"""

@app.get("/dashboard/filter-values")
async def get_filter_values():
    """
    Get unique values for all filter columns from database
    Returns actual values with counts for bilingual mapping
    """
    try:
        client = SupabaseTrafficClient()
        
        # Query all events to analyze filter values
        print("📊 Querying database for unique filter values...")
        events = client.get_events_by_date_range("2019-01-01", "2025-12-31")
        print(f"✅ Loaded {len(events):,} events")
        
        # Count occurrences for each filter column
        vehicle_counts = {}
        weather_counts = {}
        cause_counts = {}
        
        for event in events:
            # Vehicle types
            vehicle = event.get("vehicle_1", "")
            if vehicle and vehicle.strip():
                vehicle_counts[vehicle] = vehicle_counts.get(vehicle, 0) + 1
            
            # Weather conditions
            weather = event.get("weather_condition", "")
            if weather and weather.strip():
                weather_counts[weather] = weather_counts.get(weather, 0) + 1
            
            # Accident causes
            cause = event.get("presumed_cause", "")
            if cause and cause.strip():
                cause_counts[cause] = cause_counts.get(cause, 0) + 1
        
        # Sort by frequency (most common first)
        vehicle_sorted = sorted(vehicle_counts.items(), key=lambda x: x[1], reverse=True)
        weather_sorted = sorted(weather_counts.items(), key=lambda x: x[1], reverse=True)
        cause_sorted = sorted(cause_counts.items(), key=lambda x: x[1], reverse=True)
        
        # Log results
        print(f"\n📊 Filter Values Summary:")
        print(f"  - Vehicle Types: {len(vehicle_counts)} unique values")
        print(f"  - Weather Conditions: {len(weather_counts)} unique values")
        print(f"  - Accident Causes: {len(cause_counts)} unique values")
        
        return {
            "vehicle_types": [
                {"value": value, "count": count}
                for value, count in vehicle_sorted
            ],
            "weather_conditions": [
                {"value": value, "count": count}
                for value, count in weather_sorted
            ],
            "accident_causes": [
                {"value": value, "count": count}
                for value, count in cause_sorted
            ],
            "total_events": len(events),
        }
        
    except Exception as e:
        print(f"❌ Error getting filter values: {e}")
        raise HTTPException(status_code=500, detail=str(e))
