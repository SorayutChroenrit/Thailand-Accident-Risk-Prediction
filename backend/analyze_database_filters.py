#!/usr/bin/env python3
"""
Query database to get actual unique values for filter mappings
This creates accurate Thai-English mappings based on real data
"""

import asyncio
import os
from collections import Counter
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(supabase_url, supabase_key)


async def get_unique_values(column_name: str, limit: int = 50):
    """Get unique values from database column"""
    print(f"\n{'='*80}")
    print(f"📊 {column_name.upper()} - Unique Values from Database")
    print(f"{'='*80}\n")
    
    try:
        # Query all records for this column
        response = supabase.table("accident_records").select(column_name).execute()
        
        # Count occurrences
        values = [record[column_name] for record in response.data if record.get(column_name)]
        value_counts = Counter(values)
        
        # Sort by frequency
        sorted_values = value_counts.most_common(limit)
        
        total = sum(value_counts.values())
        print(f"Total non-empty records: {total:,}")
        print(f"Unique values: {len(value_counts):,}\n")
        
        # Display top values
        for i, (value, count) in enumerate(sorted_values, 1):
            percentage = (count / total) * 100
            print(f"{i:3d}. {value:60s} | {count:8,} ({percentage:5.2f}%)")
        
        if len(value_counts) > limit:
            print(f"\n... and {len(value_counts) - limit} more unique values")
        
        return sorted_values
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return []


async def main():
    print("\n" + "="*80)
    print("🔍 DATABASE FILTER VALUES ANALYSIS")
    print("="*80)
    
    # Get unique values for each filter column
    vehicle_values = await get_unique_values("vehicle_1", 30)
    weather_values = await get_unique_values("weather_condition", 20)
    cause_values = await get_unique_values("presumed_cause", 30)
    
    # Generate Python mapping code
    print("\n" + "="*80)
    print("📝 GENERATED MAPPING CODE")
    print("="*80)
    
    print("\n# Vehicle Type Mapping (based on actual database values)")
    print("VEHICLE_TYPE_MAPPING = {")
    for value, count in vehicle_values[:15]:
        # Create a simple key from the Thai value
        key = value.lower().replace(" ", "_").replace("รถ", "")[:20]
        print(f'    "{key}": ["{value}"],  # {count:,} records')
    print("}\n")
    
    print("\n# Weather Condition Mapping (based on actual database values)")
    print("WEATHER_CONDITION_MAPPING = {")
    for value, count in weather_values[:10]:
        key = value.lower().replace(" ", "_")[:20]
        print(f'    "{key}": ["{value}"],  # {count:,} records')
    print("}\n")
    
    print("\n# Accident Cause Mapping (based on actual database values)")
    print("ACCIDENT_CAUSE_MAPPING = {")
    for value, count in cause_values[:15]:
        key = value.lower().replace(" ", "_")[:20]
        print(f'    "{key}": ["{value}"],  # {count:,} records')
    print("}\n")
    
    print("\n✅ Analysis complete!")
    print("\nNext steps:")
    print("1. Review the generated mappings above")
    print("2. Create proper English translations for each Thai value")
    print("3. Update filter-mappings.ts with bilingual support")
    print("4. Update main.py with database-driven mappings\n")


if __name__ == "__main__":
    asyncio.run(main())
