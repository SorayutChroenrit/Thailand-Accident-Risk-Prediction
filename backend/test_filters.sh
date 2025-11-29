# Test the endpoint after restarting server

curl http://localhost:10000/dashboard/filter-values | python3 -m json.tool > /tmp/filter_values_formatted.json

# View top vehicle types
echo "=== TOP 10 VEHICLE TYPES ==="
cat /tmp/filter_values_formatted.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for i, item in enumerate(data['vehicle_types'][:10], 1):
    print(f\"{i:2d}. {item['value']:50s} | {item['count']:8,}\")
"

# View all weather conditions
echo ""
echo "=== ALL WEATHER CONDITIONS ==="
cat /tmp/filter_values_formatted.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for i, item in enumerate(data['weather_conditions'], 1):
    print(f\"{i:2d}. {item['value']:50s} | {item['count']:8,}\")
"

# View top accident causes
echo ""
echo "=== TOP 10 ACCIDENT CAUSES ==="
cat /tmp/filter_values_formatted.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for i, item in enumerate(data['accident_causes'][:10], 1):
    print(f\"{i:2d}. {item['value']:50s} | {item['count']:8,}\")
"
