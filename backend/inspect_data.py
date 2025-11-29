from supabase_traffic_client import get_supabase_traffic_client
import json

def inspect_data():
    try:
        client = get_supabase_traffic_client()
        
        # Search for events with "Cr." in description
        response = client.client.table("traffic_events").select("*").ilike("description_th", "%Cr.%").limit(5).execute()
        
        if response.data:
            print(f"✅ Fetched {len(response.data)} events.")
            for i, event in enumerate(response.data):
                print(f"\n--- Event {i+1} ---")
                print(f"ID: {event.get('id')}")
                print(f"Source: {event.get('source')}")
                print(f"Title (TH): {event.get('title_th')}")
                print(f"Description (EN): {event.get('description_en')}")
                print(f"Description (TH): {event.get('description_th')}")
                print(f"Source URL: {event.get('source_url')}")
        else:
            print("⚠️ No data found in traffic_events.")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    inspect_data()
