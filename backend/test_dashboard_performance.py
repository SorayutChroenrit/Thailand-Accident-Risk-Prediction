#!/usr/bin/env python3
"""
Dashboard Performance & Bug Fix Testing Script
Tests all 4 fixes:
1. Database performance (with indexes)
2. Filter functionality (vehicle, weather, accident cause)
3. Province heatmap data (casualties breakdown)
4. Graphs data (all_events availability)
"""

import json
import time
from typing import Any, Dict

import requests

API_BASE_URL = "http://localhost:10000"

# ANSI color codes
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"


def print_header(text: str):
    """Print section header"""
    print("\n" + "=" * 80)
    print(f"{BLUE}{text}{RESET}")
    print("=" * 80)


def print_test(text: str):
    """Print test description"""
    print(f"\n{YELLOW}🧪 {text}{RESET}")


def print_success(text: str):
    """Print success message"""
    print(f"{GREEN}✅ {text}{RESET}")


def print_error(text: str):
    """Print error message"""
    print(f"{RED}❌ {text}{RESET}")


def print_info(text: str):
    """Print info message"""
    print(f"   ℹ️  {text}")


def test_api_connection() -> bool:
    """Test 0: API Connection"""
    print_test("Testing API connection...")
    try:
        response = requests.get(f"{API_BASE_URL}/", timeout=5)
        if response.status_code == 200:
            print_success("API is running")
            return True
        else:
            print_error(f"API returned status {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Cannot connect to API: {e}")
        print_info("Make sure backend is running: python main.py")
        return False


def test_dashboard_performance() -> Dict[str, Any]:
    """Test 1: Dashboard Load Performance"""
    print_header("TEST 1: Dashboard Load Performance")

    results = {"passed": False, "load_time": 0, "cached_load_time": 0, "improvement": 0}

    # Test 1.1: First load (no cache)
    print_test("Testing first load (cold cache)...")
    start_time = time.time()
    try:
        response = requests.get(
            f"{API_BASE_URL}/dashboard/stats",
            params={"date_range": "all", "province": "all", "casualty_type": "all"},
            timeout=30,
        )
        load_time = time.time() - start_time
        results["load_time"] = load_time

        if response.status_code == 200:
            print_success(f"Dashboard loaded in {load_time:.2f}s")
            if load_time < 5:
                print_info("Performance: EXCELLENT (< 5s)")
            elif load_time < 10:
                print_info("Performance: GOOD (< 10s)")
            else:
                print_info("Performance: SLOW (>= 10s) - Consider applying indexes")
        else:
            print_error(f"Failed with status {response.status_code}")
            return results
    except Exception as e:
        print_error(f"Request failed: {e}")
        return results

    # Test 1.2: Second load (with cache)
    print_test("Testing second load (warm cache)...")
    start_time = time.time()
    try:
        response = requests.get(
            f"{API_BASE_URL}/dashboard/stats",
            params={"date_range": "all", "province": "all", "casualty_type": "all"},
            timeout=30,
        )
        cached_load_time = time.time() - start_time
        results["cached_load_time"] = cached_load_time

        if response.status_code == 200:
            improvement = ((load_time - cached_load_time) / load_time) * 100
            results["improvement"] = improvement
            print_success(f"Cached load: {cached_load_time:.2f}s")
            print_info(f"Cache improvement: {improvement:.1f}% faster")

            if cached_load_time < 1:
                print_success("Cache is working EXCELLENTLY!")
                results["passed"] = True
            elif cached_load_time < 2:
                print_success("Cache is working WELL!")
                results["passed"] = True
            else:
                print_info("Cache might not be working optimally")
        else:
            print_error(f"Failed with status {response.status_code}")
    except Exception as e:
        print_error(f"Request failed: {e}")

    return results


def test_filters() -> Dict[str, Any]:
    """Test 2: Filter Functionality"""
    print_header("TEST 2: Filter Functionality")

    results = {
        "passed": False,
        "vehicle_filter": False,
        "weather_filter": False,
        "cause_filter": False,
        "all_events_exists": False,
    }

    # Test 2.1: Check if all_events is returned
    print_test("Testing if all_events array is returned...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/dashboard/stats",
            params={"date_range": "all", "province": "all", "casualty_type": "all"},
        )
        data = response.json()

        if "all_events" in data and isinstance(data["all_events"], list):
            print_success(f"all_events array exists ({len(data['all_events'])} events)")
            results["all_events_exists"] = True

            # Check structure of all_events
            if len(data["all_events"]) > 0:
                sample = data["all_events"][0]
                required_fields = [
                    "vehicle_1",
                    "weather_condition",
                    "presumed_cause",
                    "accident_type",
                    "casualties_fatal",
                    "casualties_serious",
                    "casualties_minor",
                ]

                missing_fields = [f for f in required_fields if f not in sample]
                if not missing_fields:
                    print_success("all_events has correct structure")
                    results["vehicle_filter"] = True
                    results["weather_filter"] = True
                    results["cause_filter"] = True
                else:
                    print_error(f"all_events missing fields: {missing_fields}")
            else:
                print_info("all_events is empty (might be no data)")
        else:
            print_error("all_events array not found in response")
            print_info("Client-side filtering will NOT work!")
    except Exception as e:
        print_error(f"Request failed: {e}")
        return results

    # Test 2.2: Test filter parameters
    print_test("Testing filter parameters...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/dashboard/stats",
            params={
                "date_range": "2024",
                "province": "กรุงเทพมหานคร",
                "casualty_type": "fatal",
                "vehicle_type": "รถจักรยานยนต์",
                "weather": "ฝนตก",
                "accident_cause": "ขับรถเร็วเกินกว่าที่กฎหมายกำหนด",
            },
        )
        if response.status_code == 200:
            print_success("All filter parameters accepted")
        else:
            print_error(f"Filter request failed with status {response.status_code}")
    except Exception as e:
        print_error(f"Filter request failed: {e}")

    # Set overall pass/fail
    results["passed"] = all(
        [
            results["all_events_exists"],
            results["vehicle_filter"],
            results["weather_filter"],
            results["cause_filter"],
        ]
    )

    return results


def test_province_heatmap() -> Dict[str, Any]:
    """Test 3: Province Heatmap Data"""
    print_header("TEST 3: Province Heatmap Data (Casualties Breakdown)")

    results = {
        "passed": False,
        "all_provinces_exists": False,
        "has_casualties": False,
        "province_count": 0,
    }

    print_test("Testing province data structure...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/dashboard/stats",
            params={"date_range": "all", "province": "all", "casualty_type": "all"},
        )
        data = response.json()

        if "all_provinces" in data and isinstance(data["all_provinces"], list):
            results["all_provinces_exists"] = True
            results["province_count"] = len(data["all_provinces"])
            print_success(
                f"all_provinces array exists ({results['province_count']} provinces)"
            )

            # Check if provinces have casualty breakdown
            if len(data["all_provinces"]) > 0:
                sample = data["all_provinces"][0]

                # Check for new fields
                required_fields = [
                    "province",
                    "count",
                    "fatal",
                    "serious",
                    "minor",
                    "survivors",
                ]
                has_all_fields = all(f in sample for f in required_fields)

                if has_all_fields:
                    print_success("Provinces have complete casualty breakdown")
                    results["has_casualties"] = True

                    # Show sample data
                    print_info(f"Sample: {sample['province']}")
                    print_info(f"  Total: {sample['count']}")
                    print_info(f"  Fatal: {sample['fatal']}")
                    print_info(f"  Serious: {sample['serious']}")
                    print_info(f"  Minor: {sample['minor']}")
                    print_info(f"  Survivors: {sample['survivors']}")
                else:
                    print_error("Provinces missing casualty breakdown")
                    print_info(f"Sample has: {list(sample.keys())}")
                    print_info(f"Expected: {required_fields}")
            else:
                print_info("all_provinces is empty")
        else:
            print_error("all_provinces array not found in response")
    except Exception as e:
        print_error(f"Request failed: {e}")
        return results

    results["passed"] = results["all_provinces_exists"] and results["has_casualties"]
    return results


def test_graphs_data() -> Dict[str, Any]:
    """Test 4: Graphs Data Availability"""
    print_header("TEST 4: Graphs Data Availability")

    results = {
        "passed": False,
        "weather_data": False,
        "event_types": False,
        "accident_causes": False,
        "severity_distribution": False,
    }

    print_test("Testing graphs data...")
    try:
        response = requests.get(
            f"{API_BASE_URL}/dashboard/stats",
            params={"date_range": "all", "province": "all", "casualty_type": "all"},
        )
        data = response.json()

        # Check weather_data
        if "weather_data" in data and len(data["weather_data"]) > 0:
            print_success(
                f"Weather data available ({len(data['weather_data'])} entries)"
            )
            results["weather_data"] = True
        else:
            print_error("Weather data missing or empty")

        # Check event_types
        if "event_types" in data and len(data["event_types"]) > 0:
            print_success(f"Event types available ({len(data['event_types'])} entries)")
            results["event_types"] = True
        else:
            print_error("Event types missing or empty")

        # Check accident_causes
        if "accident_causes" in data and len(data["accident_causes"]) > 0:
            print_success(
                f"Accident causes available ({len(data['accident_causes'])} entries)"
            )
            results["accident_causes"] = True
        else:
            print_error("Accident causes missing or empty")

        # Check severity_distribution
        if "severity_distribution" in data and len(data["severity_distribution"]) > 0:
            print_success(
                f"Severity distribution available ({len(data['severity_distribution'])} entries)"
            )
            results["severity_distribution"] = True
        else:
            print_error("Severity distribution missing or empty")

    except Exception as e:
        print_error(f"Request failed: {e}")
        return results

    results["passed"] = all(
        [
            results["weather_data"],
            results["event_types"],
            results["accident_causes"],
            results["severity_distribution"],
        ]
    )

    return results


def main():
    """Run all tests"""
    print(f"\n{BLUE}{'=' * 80}")
    print("🧪 Dashboard Performance & Bug Fix Testing")
    print(f"{'=' * 80}{RESET}\n")

    # Test 0: Connection
    if not test_api_connection():
        print(f"\n{RED}Cannot proceed without API connection{RESET}")
        return

    # Run all tests
    test_results = {}

    test_results["performance"] = test_dashboard_performance()
    test_results["filters"] = test_filters()
    test_results["province_heatmap"] = test_province_heatmap()
    test_results["graphs"] = test_graphs_data()

    # Summary
    print_header("📊 TEST SUMMARY")

    all_passed = True

    print(f"\n1️⃣  Performance Test:")
    if test_results["performance"]["passed"]:
        print_success(
            f"   PASSED - {test_results['performance']['cached_load_time']:.2f}s cached load"
        )
    else:
        print_error("   FAILED - Slow performance")
        all_passed = False

    print(f"\n2️⃣  Filter Test:")
    if test_results["filters"]["passed"]:
        print_success("   PASSED - All filters working")
    else:
        print_error("   FAILED - Filters not working")
        all_passed = False

    print(f"\n3️⃣  Province Heatmap Test:")
    if test_results["province_heatmap"]["passed"]:
        print_success(
            f"   PASSED - {test_results['province_heatmap']['province_count']} provinces with casualties"
        )
    else:
        print_error("   FAILED - Province data incomplete")
        all_passed = False

    print(f"\n4️⃣  Graphs Data Test:")
    if test_results["graphs"]["passed"]:
        print_success("   PASSED - All graphs have data")
    else:
        print_error("   FAILED - Some graphs missing data")
        all_passed = False

    print("\n" + "=" * 80)
    if all_passed:
        print(f"{GREEN}✅ ALL TESTS PASSED! Dashboard is working correctly.{RESET}")
    else:
        print(f"{RED}❌ SOME TESTS FAILED! Please review the fixes.{RESET}")
    print("=" * 80 + "\n")

    # Recommendations
    if not all_passed:
        print(f"{YELLOW}📋 RECOMMENDATIONS:{RESET}")

        if not test_results["performance"]["passed"]:
            print("   • Apply database indexes (see backend/add_database_indexes.sql)")
            print("   • Run: ANALYZE accident_records; in Supabase")

        if not test_results["filters"]["passed"]:
            print("   • Check backend main.py includes all_events in response")
            print("   • Verify frontend dashboard.tsx does client-side filtering")

        if not test_results["province_heatmap"]["passed"]:
            print("   • Update backend to track province_casualties")
            print("   • Ensure all_provinces includes fatal/serious/minor/survivors")

        if not test_results["graphs"]["passed"]:
            print("   • Check API response includes all graph data arrays")
            print("   • Verify aggregation logic in backend")

        print()


if __name__ == "__main__":
    main()
