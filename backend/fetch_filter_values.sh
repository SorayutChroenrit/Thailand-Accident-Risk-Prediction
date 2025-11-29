#!/bin/bash
# Script to fetch filter values from database and generate bilingual mappings

echo "🔍 Fetching filter values from database..."
echo "Make sure backend server is running on port 10000"
echo ""

# Fetch data from endpoint
curl -s http://localhost:10000/dashboard/filter-values > /tmp/filter_values.json

if [ $? -eq 0 ]; then
    echo "✅ Data fetched successfully!"
    echo ""
    echo "📊 Filter Values Summary:"
    echo ""
    
    # Display vehicle types (top 15)
    echo "=== VEHICLE TYPES (Top 15) ==="
    cat /tmp/filter_values.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for i, item in enumerate(data['vehicle_types'][:15], 1):
    print(f\"{i:2d}. {item['value']:50s} | {item['count']:8,} records\")
"
    echo ""
    
    # Display weather conditions
    echo "=== WEATHER CONDITIONS (All) ==="
    cat /tmp/filter_values.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for i, item in enumerate(data['weather_conditions'], 1):
    print(f\"{i:2d}. {item['value']:50s} | {item['count']:8,} records\")
"
    echo ""
    
    # Display accident causes (top 15)
    echo "=== ACCIDENT CAUSES (Top 15) ==="
    cat /tmp/filter_values.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for i, item in enumerate(data['accident_causes'][:15], 1):
    print(f\"{i:2d}. {item['value']:50s} | {item['count']:8,} records\")
"
    echo ""
    echo "✅ Full data saved to /tmp/filter_values.json"
    echo "Use this data to create bilingual filter mappings!"
else
    echo "❌ Failed to fetch data. Make sure backend server is running."
    exit 1
fi
