from supabase_traffic_client import get_supabase_traffic_client
import json

def inspect_data():
    try:
        client = get_supabase_traffic_client()
        
        # Get specific event to check coordinates
        response = client.client.table("traffic_events").select("*").eq("id", 1052379).execute()
        
        if response.data:
            print(f"✅ Fetched {len(response.data)} events.")
            for event in response.data:
                print(f"--- Event {event.get('id')} ---")
                print(f"ID: {event.get('id')}")
                print(f"Lat: {event.get('latitude')}")
                print(f"Lon: {event.get('longitude')}")
                print(f"Event Date: {event.get('event_date')}")
                print(f"Title: {event.get('title_th')}")
        else:
            print("❌ No events found.")
            
    except Exception as e:
        print(f"Error: {e}")
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    inspect_data()
