"""
Supabase Client for Traffic Events
Query historical traffic event data from Supabase
With in-memory caching for faster repeat queries
"""

import hashlib
import json
import os
from datetime import datetime, timedelta
from functools import lru_cache
from typing import Dict, List, Optional

from dotenv import load_dotenv
from supabase import Client, create_client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")


class SupabaseTrafficClient:
    """Client for querying traffic events from Supabase with caching"""

    def __init__(self):
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError(
                "Missing SUPABASE_URL or SUPABASE_KEY environment variables"
            )

        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self._cache: Dict[str, tuple[datetime, List[Dict]]] = {}
        self._cache_ttl = 300  # 5 minutes cache TTL
        print("✅ Supabase Traffic client initialized with caching")

    def _get_cache_key(self, **kwargs) -> str:
        """Generate cache key from query parameters"""
        key_str = json.dumps(kwargs, sort_keys=True)
        return hashlib.md5(key_str.encode()).hexdigest()

    def _get_cached(self, cache_key: str) -> Optional[List[Dict]]:
        """Get data from cache if not expired"""
        if cache_key in self._cache:
            cached_time, cached_data = self._cache[cache_key]
            if (datetime.now() - cached_time).total_seconds() < self._cache_ttl:
                print(f"✅ Cache hit for {cache_key[:8]}...")
                return cached_data
        return None

    def _set_cache(self, cache_key: str, data: List[Dict]):
        """Store data in cache"""
        self._cache[cache_key] = (datetime.now(), data)
        print(f"💾 Cached {len(data)} events (key: {cache_key[:8]}...)")

    def get_events_by_year(
        self,
        year: int,
        event_types: Optional[List[str]] = None,
        severities: Optional[List[str]] = None,
        limit: Optional[int] = None,
        month: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> List[Dict]:
        """Get events for a specific year (with caching)

        Best practice: Use reasonable limits for UI performance
        - Default: 5000 events (good for map display)
        - With month filter: typically 200-500 events
        """

        # Check cache first
        cache_key = self._get_cache_key(
            year=year,
            event_types=event_types,
            severities=severities,
            limit=limit,
            month=month,
            offset=offset,
        )
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        try:
            print(
                f"📊 Fetching events for year {year}"
                + (f" month {month}" if month else "")
                + " from database..."
            )

            # Set reasonable default limit: 5000 events (good balance for UX)
            # If limit is very high (999999), don't apply limit
            effective_limit = limit if limit is not None else 5000
            apply_limit = effective_limit < 999999

            query = (
                self.client.table("traffic_events")
                .select(
                    "event_id,latitude,longitude,event_type,severity,severity_score,"
                    "title_th,title_en,description_th,event_date,year,source,location_name"
                )
                .eq("year", year)
            )

            # Filter by month if specified (reduces results significantly!)
            if month:
                query = query.gte("event_date", f"{year}-{month:02d}-01")
                if month == 12:
                    query = query.lt("event_date", f"{year + 1}-01-01")
                else:
                    query = query.lt("event_date", f"{year}-{month + 1:02d}-01")

            if event_types:
                query = query.in_("event_type", event_types)

            if severities:
                query = query.in_("severity", severities)

            query = query.order("event_date", desc=True)

            # If we want all events (no limit), fetch in batches
            if not apply_limit:
                all_data = []
                batch_size = 1000
                batch_offset = offset if offset else 0

                while True:
                    batch_query = query.range(
                        batch_offset, batch_offset + batch_size - 1
                    )
                    response = batch_query.execute()
                    batch = response.data

                    if not batch:
                        break

                    all_data.extend(batch)

                    # If we got less than batch_size, we've reached the end
                    if len(batch) < batch_size:
                        break

                    batch_offset += batch_size

                # Store in cache
                self._set_cache(cache_key, all_data)
                print(f"✅ Retrieved {len(all_data)} events (no limit - fetched all)")
                return all_data
            else:
                # Apply limit and offset for paginated queries
                start_offset = offset if offset else 0
                end_offset = start_offset + effective_limit - 1

                query = query.range(start_offset, end_offset)
                response = query.execute()
                data = response.data

                # Store in cache
                self._set_cache(cache_key, data)

                print(
                    f"✅ Retrieved {len(data)} events (limit: {effective_limit}, offset: {start_offset})"
                )
                return data

        except Exception as e:
            print(f"❌ Error querying year {year}: {e}")
            # Return empty list on timeout instead of crashing
            return []

    def get_events_multi_year(
        self,
        start_year: int,
        end_year: int,
        event_types: Optional[List[str]] = None,
        severities: Optional[List[str]] = None,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """Get events across multiple years

        Best practice: Limit to 10000 events for multi-year queries
        """

        # Set reasonable limit for multi-year: 10000 events max
        effective_limit = limit if limit is not None else 10000

        print(
            f"📊 Fetching events from {start_year} to {end_year} (limit: {effective_limit})..."
        )

        query = self.client.table("traffic_events").select("*")
        query = query.gte("year", start_year).lte("year", end_year)

        if event_types:
            query = query.in_("event_type", event_types)

        if severities:
            query = query.in_("severity", severities)

        query = query.order("event_date", desc=True)
        query = query.limit(effective_limit)

        response = query.execute()
        data = response.data

        print(f"✅ Retrieved {len(data)} events")
        return data

    def get_events_by_date_range(
        self,
        start_date: str,
        end_date: str,
        event_types: Optional[List[str]] = None,
        severities: Optional[List[str]] = None,
        limit: Optional[int] = None,
        offset: Optional[int] = None,
    ) -> tuple[List[Dict], int]:
        """Get events within a date range with pagination

        Parameters:
        - start_date: Start date (YYYY-MM-DD)
        - end_date: End date (YYYY-MM-DD)
        - event_types: Filter by event types
        - severities: Filter by severities
        - limit: Max results per page
        - offset: Number of records to skip

        Returns:
        - Tuple of (events list, total count)
        """

        # Note: We don't use cache for this method because total count
        # needs to be calculated separately and cache would make it incorrect

        try:
            print(f"📊 Fetching events from {start_date} to {end_date}...")

            # Handle limit=None for export (fetch all)
            if limit is None:
                print("📥 Exporting ALL events (no limit)...")
                effective_limit = None
                effective_offset = 0
            else:
                effective_limit = limit
                effective_offset = offset if offset is not None else 0

            # Build query for data
            query = (
                self.client.table("traffic_events")
                .select(
                    "event_id,latitude,longitude,event_type,severity,severity_score,"
                    "title_th,title_en,description_th,event_date,year,source,location_name"
                )
                .gte("event_date", start_date)
                .lte("event_date", end_date)
            )

            if event_types:
                query = query.in_("event_type", event_types)

            if severities:
                query = query.in_("severity", severities)

            query = query.order("event_date", desc=True)  # Descending order - latest first

            # Apply range only if limit is set (for pagination)
            if effective_limit is not None:
                query = query.range(
                    effective_offset, effective_offset + effective_limit - 1
                )

            response = query.execute()
            data = response.data

            # Get total count with same filters
            count_query = (
                self.client.table("traffic_events")
                .select("event_id", count="exact")
                .gte("event_date", start_date)
                .lte("event_date", end_date)
            )

            if event_types:
                count_query = count_query.in_("event_type", event_types)

            if severities:
                count_query = count_query.in_("severity", severities)

            count_response = count_query.execute()
            total_count = (
                count_response.count if hasattr(count_response, "count") else len(data)
            )

            print(f"✅ Retrieved {len(data)} events (total: {total_count})")

            return data, total_count

        except Exception as e:
            print(f"❌ Error fetching events by date range: {e}")
            import traceback

            traceback.print_exc()
            return [], 0

    def get_events_in_bounds(
        self,
        north: float,
        south: float,
        east: float,
        west: float,
        year: Optional[int] = None,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """Get events within geographic bounds"""
        query = self.client.table("traffic_events").select("*")
        query = query.gte("latitude", south).lte("latitude", north)
        query = query.gte("longitude", west).lte("longitude", east)

        if year:
            query = query.eq("year", year)

        query = query.order("event_date", desc=True)

        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data

    def get_events_near_location(
        self,
        latitude: float,
        longitude: float,
        radius_km: float = 5.0,
        year: Optional[int] = None,
        limit: int = 100,
    ) -> List[Dict]:
        """Get events near a location using Supabase RPC function"""
        try:
            response = self.client.rpc(
                "get_events_near_location",
                {
                    "p_latitude": latitude,
                    "p_longitude": longitude,
                    "p_radius_km": radius_km,
                    "p_limit": limit,
                },
            ).execute()

            events = response.data

            # Filter by year if specified
            if year and events:
                events = [e for e in events if e.get("year") == year]

            return events
        except Exception as e:
            print(f"⚠️ RPC function not available, using bounds fallback: {e}")
            # Fallback to bounding box
            # Approximate: 1 degree ≈ 111 km
            deg_offset = radius_km / 111.0
            return self.get_events_in_bounds(
                north=latitude + deg_offset,
                south=latitude - deg_offset,
                east=longitude + deg_offset,
                west=longitude - deg_offset,
                year=year,
                limit=limit,
            )

    def get_events_by_province(
        self, province: str, year: Optional[int] = None, limit: Optional[int] = None
    ) -> List[Dict]:
        """Get events for a specific province"""
        query = self.client.table("traffic_events").select("*").eq("province", province)

        if year:
            query = query.eq("year", year)

        query = query.order("event_date", desc=True)

        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data

    def get_recent_events(
        self, hours: int = 24, limit: Optional[int] = None
    ) -> List[Dict]:
        """Get recent events within specified hours"""
        cutoff_time = datetime.now() - timedelta(hours=hours)

        query = (
            self.client.table("traffic_events")
            .select("*")
            .gte("event_date", cutoff_time.isoformat())
            .order("event_date", desc=True)
        )

        if limit:
            query = query.limit(limit)

        response = query.execute()

        return response.data

    def get_high_severity_events(
        self, year: Optional[int] = None, limit: Optional[int] = None
    ) -> List[Dict]:
        """Get high severity events"""
        query = self.client.table("traffic_events").select("*").eq("severity", "high")

        if year:
            query = query.eq("year", year)

        query = query.order("event_date", desc=True)

        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data

    def get_event_statistics(self, year: Optional[int] = None) -> Dict:
        """Get event statistics"""
        query = self.client.table("traffic_events").select("event_type, severity, year")

        if year:
            query = query.eq("year", year)

        response = query.execute()
        events = response.data

        stats = {"total": len(events), "by_type": {}, "by_severity": {}, "by_year": {}}

        for event in events:
            # Count by type
            event_type = event.get("event_type", "unknown")
            stats["by_type"][event_type] = stats["by_type"].get(event_type, 0) + 1

            # Count by severity
            severity = event.get("severity", "unknown")
            stats["by_severity"][severity] = stats["by_severity"].get(severity, 0) + 1

            # Count by year
            event_year = event.get("year", 0)
            stats["by_year"][event_year] = stats["by_year"].get(event_year, 0) + 1

        return stats

    def get_traffic_cameras(
        self,
        province: Optional[str] = None,
        active_only: bool = True,
        limit: Optional[int] = None,
    ) -> List[Dict]:
        """Get traffic cameras"""
        query = self.client.table("traffic_cameras").select("*")

        if province:
            query = query.eq("province", province)

        if active_only:
            query = query.eq("is_active", True)

        if limit:
            query = query.limit(limit)

        response = query.execute()
        return response.data

    def get_traffic_index_history(
        self, year: int, region: str = "bangkok", limit: Optional[int] = None
    ) -> List[Dict]:
        """Get traffic index history"""
        query = (
            self.client.table("traffic_index_history")
            .select("*")
            .eq("year", year)
            .eq("region", region)
            .order("datetime", desc=True)
        )

        if limit:
            query = query.limit(limit)

        response = query.execute()

        return response.data


# Singleton instance
_supabase_traffic_client = None


def get_supabase_traffic_client() -> SupabaseTrafficClient:
    """Get or create Supabase traffic client singleton"""
    global _supabase_traffic_client
    if _supabase_traffic_client is None:
        _supabase_traffic_client = SupabaseTrafficClient()
    return _supabase_traffic_client
