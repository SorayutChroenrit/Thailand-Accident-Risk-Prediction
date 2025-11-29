/**
 * iTIC Foundation API Service
 * Real-time traffic incidents and events from iTIC
 * Source: https://org.iticfoundation.org/download
 */

export interface ITICEvent {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  type: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  source: string;
  verified: boolean;
  location: string;
  affectedRoads?: string[];
}

export interface ITICCamera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  url: string;
  mjpegUrl: string;
  jpegUrl: string;
}

// Use backend proxy to avoid CORS issues
const BACKEND_URL = 'http://localhost:10000';
const ITIC_EVENTS_PROXY = `${BACKEND_URL}/itic/events`;
const ITIC_CAMERAS_PROXY = `${BACKEND_URL}/itic/cameras`;
const ITIC_CAMERA_MJPEG = 'http://cameras.iticfoundation.org/api/mjpeg2.php';
const ITIC_CAMERA_JPEG = 'http://cameras.iticfoundation.org/api/jpeg2.php';

/**
 * Fetch traffic incidents from iTIC/Longdo Events API (via backend proxy)
 * Supports historical data fetching
 */
export async function fetchITICEvents(options?: {
  year?: number;
  historical?: boolean;
}): Promise<ITICEvent[]> {
  try {
    const { year, historical = false } = options || {};

    console.log('📡 Fetching iTIC/Longdo events via backend proxy...');

    // Build query parameters
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (historical) params.append('historical', 'true');

    const url = `${ITIC_EVENTS_PROXY}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`iTIC Events API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.events?.length || 0} iTIC/Longdo events`);
    if (historical) {
      console.log(`   Years included: ${data.years?.join(', ') || 'N/A'}`);
    }

    // Transform iTIC/Longdo event format to our format
    const events: ITICEvent[] = (data.events || []).map((event: any) => {
      // Determine severity based on event category and title
      let severity: 'low' | 'medium' | 'high' = 'medium';
      const category = (event.category || '').toLowerCase();
      const title = (event.title || '').toLowerCase();
      const description = (event.description || '').toLowerCase();

      // High severity events
      if (
        category.includes('accident') || title.includes('อุบัติเหตุ') ||
        title.includes('accident') || category.includes('fire') ||
        title.includes('เพลิงไหม้') || title.includes('flooding') ||
        title.includes('น้ำท่วม')
      ) {
        severity = 'high';
      }
      // Medium severity events
      else if (
        category.includes('congestion') || title.includes('รถติด') ||
        title.includes('traffic') || category.includes('construction') ||
        title.includes('ก่อสร้าง') || category.includes('checkpoint')
      ) {
        severity = 'medium';
      }
      // Low severity events
      else {
        severity = 'low';
      }

      // Map iTIC/Longdo event types to our system
      let eventType = 'accident';
      if (category.includes('construction') || title.includes('ก่อสร้าง')) {
        eventType = 'construction';
      } else if (category.includes('flood') || title.includes('น้ำท่วม')) {
        eventType = 'flooding';
      } else if (category.includes('rain') || title.includes('ฝน')) {
        eventType = 'weather';
      } else if (category.includes('broken') || title.includes('รถเสีย')) {
        eventType = 'breakdown';
      } else if (category.includes('congestion') || title.includes('รถติด')) {
        eventType = 'congestion';
      } else if (category.includes('fire') || title.includes('เพลิงไหม้')) {
        eventType = 'fire';
      } else if (category.includes('checkpoint') || title.includes('ด่าน')) {
        eventType = 'checkpoint';
      } else if (category.includes('accident') || title.includes('อุบัติเหตุ')) {
        eventType = 'accident';
      }

      // Parse timestamp
      let timestamp = new Date().toISOString();
      if (event.pubDate) {
        try {
          timestamp = new Date(event.pubDate).toISOString();
        } catch (e) {
          // Keep default if parse fails
        }
      }

      return {
        id: event.id || `longdo_${event.lat}_${event.lon}_${Date.now()}`,
        title: event.title || 'เหตุการณ์จราจร',
        description: event.description || event.detail || '',
        latitude: parseFloat(event.lat) || 0,
        longitude: parseFloat(event.lon) || 0,
        type: eventType,
        severity,
        timestamp,
        source: event.year ? `Longdo ${event.year}` : 'Longdo Traffic',
        verified: true,
        location: event.location || '',
        affectedRoads: event.roads || [],
      };
    }).filter((event: ITICEvent) => event.latitude !== 0 && event.longitude !== 0);

    return events;
  } catch (error) {
    console.error('❌ Error fetching iTIC/Longdo events:', error);
    return [];
  }
}

/**
 * Fetch traffic camera list from iTIC
 */
export async function fetchITICCameras(): Promise<ITICCamera[]> {
  try {
    console.log('📹 Fetching iTIC cameras via backend proxy...');

    const response = await fetch(ITIC_CAMERAS_PROXY, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`iTIC Cameras API returned ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ Fetched ${data.cameras?.length || 0} iTIC cameras`);

    const cameras: ITICCamera[] = (data.cameras || []).map((cam: any) => ({
      id: cam.camid || cam.id,
      name: cam.name || 'กล้อง CCTV',
      latitude: parseFloat(cam.lat) || 0,
      longitude: parseFloat(cam.lon) || 0,
      url: cam.url || '',
      mjpegUrl: `${ITIC_CAMERA_MJPEG}?camid=${cam.camid}`,
      jpegUrl: `${ITIC_CAMERA_JPEG}?camid=${cam.camid}`,
    })).filter((cam: ITICCamera) => cam.latitude !== 0 && cam.longitude !== 0);

    return cameras;
  } catch (error) {
    console.error('❌ Error fetching iTIC cameras:', error);
    return [];
  }
}

/**
 * Get camera image URL
 */
export function getCameraImageUrl(cameraId: string, format: 'mjpeg' | 'jpeg' = 'jpeg'): string {
  if (format === 'mjpeg') {
    return `${ITIC_CAMERA_MJPEG}?camid=${cameraId}`;
  }
  return `${ITIC_CAMERA_JPEG}?camid=${cameraId}`;
}
