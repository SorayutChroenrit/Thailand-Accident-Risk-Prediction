#!/usr/bin/env python3
"""
Test script to query database and get actual filter values
"""

import sys
sys.path.append('.')

from supabase_traffic_client import SupabaseTrafficClient

def get_distinct_values_from_events(events, column_name):
    """Get distinct values and counts from events list"""
    value_counts = {}
    for event in events:
        value = event.get(column_name, "")
        if value and value.strip():
            value_counts[value] = value_counts.get(value, 0) + 1
    
    return sorted(value_counts.items(), key=lambda x: x[1], reverse=True)

def main():
    print("\n" + "="*80)
    print("🔍 DASHBOARD FILTER VALUES - DATABASE ANALYSIS")
    print("="*80)
    
    # Initialize client
    client = SupabaseTrafficClient()
    
    # Get all events (this will use cache if available)
    print("\n📥 Fetching all events from database...")
    events = client.get_events_by_date_range("2019-01-01", "2025-12-31")
    print(f"✅ Loaded {len(events):,} events\n")
    
    # Analyze vehicle_1
    print("\n" + "="*80)
    print("📊 VEHICLE_1 - Top 25 Values")
    print("="*80 + "\n")
    
    vehicle_values = get_distinct_values_from_events(events, "vehicle_1")
    total = sum(count for _, count in vehicle_values)
    
    for i, (value, count) in enumerate(vehicle_values[:25], 1):
        percentage = (count / total) * 100 if total > 0 else 0
        print(f"{i:2d}. {value:50s} | {count:8,} ({percentage:5.2f}%)")
    
    # Analyze weather_condition
    print("\n" + "="*80)
    print("📊 WEATHER_CONDITION - Top 15 Values")
    print("="*80 + "\n")
    
    weather_values = get_distinct_values_from_events(events, "weather_condition")
    total = sum(count for _, count in weather_values)
    
    for i, (value, count) in enumerate(weather_values[:15], 1):
        percentage = (count / total) * 100 if total > 0 else 0
        print(f"{i:2d}. {value:50s} | {count:8,} ({percentage:5.2f}%)")
    
    # Analyze presumed_cause
    print("\n" + "="*80)
    print("📊 PRESUMED_CAUSE - Top 25 Values")
    print("="*80 + "\n")
    
    cause_values = get_distinct_values_from_events(events, "presumed_cause")
    total = sum(count for _, count in cause_values)
    
    for i, (value, count) in enumerate(cause_values[:25], 1):
        percentage = (count / total) * 100 if total > 0 else 0
        print(f"{i:2d}. {value:50s} | {count:8,} ({percentage:5.2f}%)")
    
    # Summary
    print("\n" + "="*80)
    print("📋 SUMMARY")
    print("="*80)
    print(f"\nVehicle Types: {len(vehicle_values)} unique values")
    print(f"Weather Conditions: {len(weather_values)} unique values")
    print(f"Accident Causes: {len(cause_values)} unique values")
    
    print("\n✅ Analysis complete!\n")

if __name__ == "__main__":
    main()
