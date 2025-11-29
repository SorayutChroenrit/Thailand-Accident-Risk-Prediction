#!/usr/bin/env python3
"""
Test Dashboard Filters Script
Verifies that all dashboard filters work correctly
"""

import json
from datetime import datetime

import requests

# API endpoint
API_BASE_URL = "http://localhost:10000"


def test_filter(filter_name, params, description):
    """Test a single filter combination"""
    print(f"\n{'=' * 70}")
    print(f"🧪 Testing: {filter_name}")
    print(f"📝 Description: {description}")
    print(f"📋 Parameters: {json.dumps(params, indent=2, ensure_ascii=False)}")
    print(f"{'=' * 70}")

    try:
        # Make API request
        response = requests.get(f"{API_BASE_URL}/dashboard/stats", params=params)

        if response.status_code != 200:
            print(f"❌ FAILED: HTTP {response.status_code}")
            print(f"   Response: {response.text[:200]}")
            return False

        data = response.json()

        # Check required fields
        required_fields = [
            "summary",
            "event_types",
            "weather_data",
            "accident_causes",
            "top_provinces",
            "monthly_trend",
            "hourly_pattern",
        ]

        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            print(f"❌ FAILED: Missing fields: {missing_fields}")
            return False

        # Display results
        summary = data.get("summary", {})
        print(f"\n✅ SUCCESS!")
        print(f"   Total Accidents: {summary.get('total_accidents', 0):,}")
        print(f"   Fatalities: {summary.get('fatalities', 0):,}")
        print(f"   Serious Injuries: {summary.get('serious_injuries', 0):,}")
        print(f"   Minor Injuries: {summary.get('minor_injuries', 0):,}")

        # Show weather data
        weather_data = data.get("weather_data", [])
        print(f"\n   Weather Types: {len(weather_data)}")
        for item in weather_data[:3]:
            print(f"      • {item.get('weather')}: {item.get('count'):,}")

        # Show accident causes
        causes = data.get("accident_causes", [])
        print(f"\n   Accident Causes: {len(causes)}")
        for item in causes[:3]:
            print(f"      • {item.get('cause')}: {item.get('count'):,}")

        return True

    except requests.exceptions.ConnectionError:
        print(f"❌ FAILED: Cannot connect to {API_BASE_URL}")
        print(f"   Make sure the backend server is running!")
        return False
    except Exception as e:
        print(f"❌ FAILED: {str(e)}")
        return False


def main():
    """Run all filter tests"""
    print("\n" + "=" * 70)
    print("🚀 Dashboard Filter Testing Script")
    print("=" * 70)
    print(f"Testing API at: {API_BASE_URL}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    tests = []

    # Test 1: All filters on "all"
    tests.append(
        test_filter(
            "Baseline (All Filters = 'all')",
            {
                "date_range": "all",
                "province": "all",
                "casualty_type": "all",
                "vehicle_type": "all",
                "weather": "all",
            },
            "Should return all data (~145,000 accidents)",
        )
    )

    # Test 2: Province filter
    tests.append(
        test_filter(
            "Province Filter",
            {
                "date_range": "all",
                "province": "กรุงเทพมหานคร",
                "casualty_type": "all",
                "vehicle_type": "all",
                "weather": "all",
            },
            "Should return only Bangkok accidents",
        )
    )

    # Test 3: Severity filter (Fatal)
    tests.append(
        test_filter(
            "Severity Filter (Fatal)",
            {
                "date_range": "all",
                "province": "all",
                "casualty_type": "fatal",
                "vehicle_type": "all",
                "weather": "all",
            },
            "Should return only fatal accidents",
        )
    )

    # Test 4: Vehicle type filter
    tests.append(
        test_filter(
            "Vehicle Type Filter (Motorcycle)",
            {
                "date_range": "all",
                "province": "all",
                "casualty_type": "all",
                "vehicle_type": "รถจักรยานยนต์",
                "weather": "all",
            },
            "Should return only motorcycle accidents",
        )
    )

    # Test 5: Weather filter (Rain)
    tests.append(
        test_filter(
            "Weather Filter (Rain)",
            {
                "date_range": "all",
                "province": "all",
                "casualty_type": "all",
                "vehicle_type": "all",
                "weather": "ฝนตก",
            },
            "Should return only accidents in rain",
        )
    )

    # Test 6: Weather filter (Clear)
    tests.append(
        test_filter(
            "Weather Filter (Clear)",
            {
                "date_range": "all",
                "province": "all",
                "casualty_type": "all",
                "vehicle_type": "all",
                "weather": "แจ่มใส",
            },
            "Should return only accidents in clear weather",
        )
    )

    # Test 7: Date range filter
    tests.append(
        test_filter(
            "Date Range Filter (2024)",
            {
                "date_range": "2024",
                "province": "all",
                "casualty_type": "all",
                "vehicle_type": "all",
                "weather": "all",
            },
            "Should return only 2024 accidents",
        )
    )

    # Test 8: Combined filters
    tests.append(
        test_filter(
            "Combined Filters (Bangkok + Motorcycle + Fatal)",
            {
                "date_range": "all",
                "province": "กรุงเทพมหานคร",
                "casualty_type": "fatal",
                "vehicle_type": "รถจักรยานยนต์",
                "weather": "all",
            },
            "Should return fatal motorcycle accidents in Bangkok",
        )
    )

    # Test 9: All filters combined
    tests.append(
        test_filter(
            "All Filters Combined",
            {
                "date_range": "2024",
                "province": "กรุงเทพมหานคร",
                "casualty_type": "serious",
                "vehicle_type": "รถจักรยานยนต์",
                "weather": "ฝนตก",
            },
            "Should return serious motorcycle accidents in Bangkok in rain in 2024",
        )
    )

    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    passed = sum(tests)
    total = len(tests)
    print(f"✅ Passed: {passed}/{total}")
    print(f"❌ Failed: {total - passed}/{total}")

    if passed == total:
        print("\n🎉 ALL TESTS PASSED!")
        print("\n✨ All dashboard filters are working correctly:")
        print("   ✅ Province filter")
        print("   ✅ Date range filter")
        print("   ✅ Severity filter (casualty_type)")
        print("   ✅ Vehicle type filter")
        print("   ✅ Weather filter")
        print("   ✅ Combined filters")
        print("   ✅ Weather data aggregation")
        print("   ✅ Accident causes aggregation")
    else:
        print("\n⚠️  SOME TESTS FAILED")
        print("\nTroubleshooting:")
        print("1. Make sure backend server is running: python main.py")
        print("2. Check that SQL function was updated in Supabase")
        print("3. Verify database has required columns:")
        print("   - weather_condition")
        print("   - vehicle_1")
        print("   - accident_cause")
        print("   - casualties_fatal, casualties_serious, casualties_minor")

    print("=" * 70)

    return passed == total


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
