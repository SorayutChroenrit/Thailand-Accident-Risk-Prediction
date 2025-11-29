#!/usr/bin/env python3
"""
Update Dashboard Function Script
Applies the updated SQL function to Supabase with casualty_type and weather filters
"""

import os


def main():
    """Main function"""
    print("=" * 70)
    print("Dashboard Function Update Script")
    print("=" * 70)
    print("\nThis script will help you update the dashboard SQL function")
    print("to support casualty_type filter and weather data aggregation.\n")

    # Check if SQL file exists
    if not os.path.exists("create_dashboard_aggregate_function.sql"):
        print("❌ Error: create_dashboard_aggregate_function.sql not found")
        print("   Make sure you're running this from the backend directory")
        return

    print("✅ SQL file found: create_dashboard_aggregate_function.sql")
    print("\n" + "=" * 70)
    print("⚠️  MANUAL STEP REQUIRED:")
    print("=" * 70)
    print("\nThe SQL function needs to be updated in your Supabase SQL Editor.")
    print("\n📋 STEPS TO UPDATE:")
    print("\n1. Go to: https://supabase.com/dashboard")
    print("2. Select your project")
    print("3. Navigate to: SQL Editor (left sidebar)")
    print("4. Click 'New Query'")
    print("5. Copy the contents of: backend/create_dashboard_aggregate_function.sql")
    print("6. Paste into the SQL Editor")
    print("7. Click 'Run' to execute")
    print("\n" + "=" * 70)
    print("📄 FILE TO COPY:")
    print("=" * 70)

    # Display the SQL file path
    sql_path = os.path.abspath("create_dashboard_aggregate_function.sql")
    print(f"\nFull path: {sql_path}")

    # Read and show first few lines
    print("\n📝 Preview of SQL function:")
    print("-" * 70)
    try:
        with open(
            "create_dashboard_aggregate_function.sql", "r", encoding="utf-8"
        ) as f:
            lines = f.readlines()
            for i, line in enumerate(lines[:15], 1):
                print(f"{i:3d}: {line.rstrip()}")
            print(f"... ({len(lines)} total lines)")
    except Exception as e:
        print(f"Error reading file: {e}")

    print("-" * 70)

    print("\n" + "=" * 70)
    print("✨ WHAT'S NEW IN THIS UPDATE:")
    print("=" * 70)
    print("\n✅ New Features:")
    print("  • Casualty type filter (fatal/serious/minor/survivors)")
    print("  • Weather data aggregation for weather chart")
    print("  • All filters now work together correctly")

    print("\n🔧 Function Signature:")
    print("  get_dashboard_stats(")
    print("    p_start_date TEXT,")
    print("    p_end_date TEXT,")
    print("    p_province TEXT,")
    print("    p_vehicle_type TEXT,")
    print("    p_weather TEXT,")
    print("    p_casualty_type TEXT  ← NEW!")
    print("  )")

    print("\n📊 New API Response Fields:")
    print("  • weather_data: Array of {weather, count}")

    print("\n" + "=" * 70)
    print("🚀 AFTER UPDATING THE SQL FUNCTION:")
    print("=" * 70)
    print("\n1. Restart your FastAPI server:")
    print("   cd backend")
    print("   python main.py")
    print("\n2. Restart your frontend dev server:")
    print("   cd frontend")
    print("   npm run dev")
    print("\n3. Test the dashboard filters at:")
    print("   http://localhost:5173/dashboard")

    print("\n" + "=" * 70)
    print("✅ ALL SET!")
    print("=" * 70)
    print("\nOnce you've updated the SQL function in Supabase,")
    print("all dashboard filters will work correctly!")
    print("\n📚 For detailed instructions, see:")
    print("   - DASHBOARD_FIXES.md (English)")
    print("   - DASHBOARD_FIXES_TH.md (Thai)")
    print("=" * 70)


if __name__ == "__main__":
    main()
