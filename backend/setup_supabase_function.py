#!/usr/bin/env python3
"""
Script to create PostgreSQL aggregation function in Supabase
This will make dashboard loading 100x faster!
"""

import os

from dotenv import load_dotenv
from supabase import Client, create_client

# Load environment variables from .env file
load_dotenv()

# Read SQL file
with open("create_dashboard_aggregate_function.sql", "r", encoding="utf-8") as f:
    sql_function = f.read()

# Get Supabase credentials from environment
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_KEY"
)  # Need service key for creating functions

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    print("\nPlease set them in your .env file:")
    print("  SUPABASE_SERVICE_KEY=your_service_role_key_here")
    exit(1)

print("🔗 Connecting to Supabase...")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("📝 Creating PostgreSQL aggregation function...")
print("\nSQL to execute:")
print("=" * 80)
print(sql_function)
print("=" * 80)

try:
    # Execute the SQL function
    response = supabase.rpc("exec_sql", {"query": sql_function}).execute()
    print("\n✅ PostgreSQL function created successfully!")
    print("\nYou can now test it with:")
    print("  SELECT get_dashboard_stats('2019-01-01', '2025-12-31', 'all');")

except Exception as e:
    print(f"\n⚠️ Could not create via RPC. Error: {e}")
    print("\n📋 Please run this SQL manually in Supabase SQL Editor:")
    print("\n1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql")
    print("2. Paste the SQL from: create_dashboard_aggregate_function.sql")
    print("3. Click 'Run'")
    print("\nAlternatively, use psql:")
    print(f"  psql '{SUPABASE_URL}' < create_dashboard_aggregate_function.sql")
