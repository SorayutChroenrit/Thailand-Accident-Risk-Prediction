// Mock data for Thailand Accident Risk Prediction Application

// Provinces in Thailand with coordinates
export const provinces = [
  { id: 1, name_en: 'Bangkok', name_th: 'กรุงเทพมหานคร', lat: 13.7563, lng: 100.5018 },
  { id: 2, name_en: 'Chiang Mai', name_th: 'เชียงใหม่', lat: 18.7883, lng: 98.9853 },
  { id: 3, name_en: 'Phuket', name_th: 'ภูเก็ต', lat: 7.8804, lng: 98.3923 },
  { id: 4, name_en: 'Khon Kaen', name_th: 'ขอนแก่น', lat: 16.4322, lng: 102.8236 },
  { id: 5, name_en: 'Nakhon Ratchasima', name_th: 'นครราชสีมา', lat: 14.9799, lng: 102.0978 },
  { id: 6, name_en: 'Chonburi', name_th: 'ชลบุรี', lat: 13.3611, lng: 100.9847 },
  { id: 7, name_en: 'Songkhla', name_th: 'สงขลา', lat: 7.1897, lng: 100.5954 },
  { id: 8, name_en: 'Nonthaburi', name_th: 'นนทบุรี', lat: 13.8621, lng: 100.5144 },
  { id: 9, name_en: 'Pathum Thani', name_th: 'ปทุมธานี', lat: 14.0208, lng: 100.5250 },
  { id: 10, name_en: 'Samut Prakan', name_th: 'สมุทรปราการ', lat: 13.5990, lng: 100.5998 },
]

// High-risk locations with accident data
export const riskLocations = [
  {
    id: 1,
    name_en: 'Din Daeng Intersection',
    name_th: 'แยกดินแดง',
    lat: 13.7649,
    lng: 100.5442,
    province_id: 1,
    road_type: 'intersection',
    risk_score: 85,
    severity: 'high',
    accidents_30d: 12,
    speed_limit: 60,
  },
  {
    id: 2,
    name_en: 'Rama IV - Sukhumvit Junction',
    name_th: 'แยกพระราม 4 - สุขุมวิท',
    lat: 13.7234,
    lng: 100.5601,
    province_id: 1,
    road_type: 'intersection',
    risk_score: 78,
    severity: 'high',
    accidents_30d: 8,
    speed_limit: 50,
  },
  {
    id: 3,
    name_en: 'Vibhavadi Highway Km 12',
    name_th: 'ถนนวิภาวดี กม.12',
    lat: 13.8456,
    lng: 100.5612,
    province_id: 1,
    road_type: 'highway',
    risk_score: 72,
    severity: 'medium',
    accidents_30d: 6,
    speed_limit: 90,
  },
  {
    id: 4,
    name_en: 'Motorway 7 Km 45',
    name_th: 'มอเตอร์เวย์ 7 กม.45',
    lat: 13.4521,
    lng: 100.9123,
    province_id: 6,
    road_type: 'highway',
    risk_score: 68,
    severity: 'medium',
    accidents_30d: 5,
    speed_limit: 120,
  },
  {
    id: 5,
    name_en: 'Hang Dong Intersection',
    name_th: 'แยกหางดง',
    lat: 18.6892,
    lng: 98.9423,
    province_id: 2,
    road_type: 'intersection',
    risk_score: 65,
    severity: 'medium',
    accidents_30d: 4,
    speed_limit: 60,
  },
  {
    id: 6,
    name_en: 'Phuket Hill Road',
    name_th: 'ถนนภูเก็ตฮิลล์',
    lat: 7.9012,
    lng: 98.3345,
    province_id: 3,
    road_type: 'urban',
    risk_score: 58,
    severity: 'medium',
    accidents_30d: 3,
    speed_limit: 50,
  },
  {
    id: 7,
    name_en: 'Khon Kaen Ring Road',
    name_th: 'ถนนวงแหวนขอนแก่น',
    lat: 16.4512,
    lng: 102.8456,
    province_id: 4,
    road_type: 'highway',
    risk_score: 45,
    severity: 'low',
    accidents_30d: 2,
    speed_limit: 80,
  },
  {
    id: 8,
    name_en: 'Nonthaburi Pier Junction',
    name_th: 'แยกท่าเรือนนทบุรี',
    lat: 13.8567,
    lng: 100.4978,
    province_id: 8,
    road_type: 'intersection',
    risk_score: 42,
    severity: 'low',
    accidents_30d: 2,
    speed_limit: 50,
  },
  {
    id: 9,
    name_en: 'Rangsit Canal Road',
    name_th: 'ถนนคลองรังสิต',
    lat: 14.0345,
    lng: 100.6123,
    province_id: 9,
    road_type: 'urban',
    risk_score: 38,
    severity: 'low',
    accidents_30d: 1,
    speed_limit: 60,
  },
  {
    id: 10,
    name_en: 'Bang Na-Trat Highway',
    name_th: 'ถนนบางนา-ตราด',
    lat: 13.5678,
    lng: 100.6234,
    province_id: 10,
    road_type: 'highway',
    risk_score: 71,
    severity: 'medium',
    accidents_30d: 7,
    speed_limit: 90,
  },
  {
    id: 11,
    name_en: 'Asok Intersection',
    name_th: 'แยกอโศก',
    lat: 13.7380,
    lng: 100.5607,
    province_id: 1,
    road_type: 'intersection',
    risk_score: 82,
    severity: 'high',
    accidents_30d: 10,
    speed_limit: 50,
  },
  {
    id: 12,
    name_en: 'Victory Monument',
    name_th: 'อนุสาวรีย์ชัยสมรภูมิ',
    lat: 13.7650,
    lng: 100.5382,
    province_id: 1,
    road_type: 'intersection',
    risk_score: 79,
    severity: 'high',
    accidents_30d: 9,
    speed_limit: 50,
  },
]

// Historical accident records
export const accidents = [
  {
    id: 1,
    location_id: 1,
    occurred_at: '2024-01-15T08:30:00',
    severity: 'high',
    weather: 'rain',
    road_condition: 'wet',
    casualties_minor: 0,
    casualties_serious: 2,
    casualties_fatal: 1,
    factors: ['speeding', 'wet_road', 'poor_visibility'],
  },
  {
    id: 2,
    location_id: 2,
    occurred_at: '2024-01-14T17:45:00',
    severity: 'medium',
    weather: 'clear',
    road_condition: 'dry',
    casualties_minor: 3,
    casualties_serious: 1,
    casualties_fatal: 0,
    factors: ['running_red_light', 'rush_hour'],
  },
  {
    id: 3,
    location_id: 3,
    occurred_at: '2024-01-14T06:15:00',
    severity: 'low',
    weather: 'fog',
    road_condition: 'wet',
    casualties_minor: 2,
    casualties_serious: 0,
    casualties_fatal: 0,
    factors: ['fog', 'tailgating'],
  },
  {
    id: 4,
    location_id: 11,
    occurred_at: '2024-01-13T19:30:00',
    severity: 'high',
    weather: 'clear',
    road_condition: 'dry',
    casualties_minor: 1,
    casualties_serious: 3,
    casualties_fatal: 0,
    factors: ['drunk_driving', 'speeding'],
  },
  {
    id: 5,
    location_id: 4,
    occurred_at: '2024-01-13T14:00:00',
    severity: 'medium',
    weather: 'rain',
    road_condition: 'wet',
    casualties_minor: 2,
    casualties_serious: 1,
    casualties_fatal: 0,
    factors: ['hydroplaning', 'speeding'],
  },
  {
    id: 6,
    location_id: 12,
    occurred_at: '2024-01-12T08:00:00',
    severity: 'low',
    weather: 'clear',
    road_condition: 'dry',
    casualties_minor: 1,
    casualties_serious: 0,
    casualties_fatal: 0,
    factors: ['distracted_driving'],
  },
  {
    id: 7,
    location_id: 10,
    occurred_at: '2024-01-12T22:30:00',
    severity: 'high',
    weather: 'clear',
    road_condition: 'dry',
    casualties_minor: 0,
    casualties_serious: 1,
    casualties_fatal: 2,
    factors: ['speeding', 'drunk_driving', 'no_seatbelt'],
  },
  {
    id: 8,
    location_id: 5,
    occurred_at: '2024-01-11T16:45:00',
    severity: 'medium',
    weather: 'rain',
    road_condition: 'wet',
    casualties_minor: 3,
    casualties_serious: 0,
    casualties_fatal: 0,
    factors: ['wet_road', 'poor_visibility'],
  },
]

// Current weather data for locations
export const weatherData = [
  {
    location_id: 1,
    temperature: 32,
    humidity: 75,
    visibility: 8000,
    wind_speed: 12,
    condition: 'partly_cloudy',
    rain_1h: 0,
  },
  {
    location_id: 2,
    temperature: 31,
    humidity: 80,
    visibility: 6000,
    wind_speed: 8,
    condition: 'rain',
    rain_1h: 2.5,
  },
  {
    location_id: 3,
    temperature: 33,
    humidity: 70,
    visibility: 10000,
    wind_speed: 15,
    condition: 'clear',
    rain_1h: 0,
  },
]

// Traffic data for locations
export const trafficData = [
  {
    location_id: 1,
    congestion_level: 78,
    average_speed: 25,
    incidents: 2,
  },
  {
    location_id: 2,
    congestion_level: 85,
    average_speed: 18,
    incidents: 1,
  },
  {
    location_id: 3,
    congestion_level: 45,
    average_speed: 65,
    incidents: 0,
  },
]

// Predictions log
export const predictions = [
  {
    id: 1,
    location_id: 1,
    predicted_at: '2024-01-15T10:00:00',
    risk_score: 85,
    severity: 'high',
    confidence: 92,
    factors: {
      weather: 0.25,
      traffic: 0.30,
      historical: 0.25,
      time_of_day: 0.20,
    },
  },
  {
    id: 2,
    location_id: 2,
    predicted_at: '2024-01-15T10:05:00',
    risk_score: 78,
    severity: 'high',
    confidence: 88,
    factors: {
      weather: 0.35,
      traffic: 0.25,
      historical: 0.20,
      time_of_day: 0.20,
    },
  },
  {
    id: 3,
    location_id: 7,
    predicted_at: '2024-01-15T10:10:00',
    risk_score: 45,
    severity: 'low',
    confidence: 85,
    factors: {
      weather: 0.15,
      traffic: 0.20,
      historical: 0.35,
      time_of_day: 0.30,
    },
  },
]

// Dashboard statistics
export const dashboardStats = {
  totalPredictions: 1247,
  highRiskAreas: 5,
  activeAlerts: 3,
  trafficIncidents: 8,
  predictionsToday: 156,
  accuracyRate: 94.2,
  areasMonitored: 77,
}

// Chart data - Risk distribution
export const riskDistribution = [
  { name: 'Low Risk', value: 45, color: '#16A34A' },
  { name: 'Medium Risk', value: 35, color: '#EA580C' },
  { name: 'High Risk', value: 20, color: '#DC2626' },
]

// Chart data - Accidents over time (last 7 days)
export const accidentsOverTime = [
  { date: 'Mon', accidents: 12, predictions: 45 },
  { date: 'Tue', accidents: 8, predictions: 52 },
  { date: 'Wed', accidents: 15, predictions: 48 },
  { date: 'Thu', accidents: 10, predictions: 55 },
  { date: 'Fri', accidents: 18, predictions: 62 },
  { date: 'Sat', accidents: 22, predictions: 78 },
  { date: 'Sun', accidents: 14, predictions: 65 },
]

// Chart data - Risk by hour
export const riskByHour = [
  { hour: '00:00', risk: 25 },
  { hour: '02:00', risk: 20 },
  { hour: '04:00', risk: 15 },
  { hour: '06:00', risk: 45 },
  { hour: '08:00', risk: 75 },
  { hour: '10:00', risk: 55 },
  { hour: '12:00', risk: 50 },
  { hour: '14:00', risk: 55 },
  { hour: '16:00', risk: 70 },
  { hour: '18:00', risk: 85 },
  { hour: '20:00', risk: 65 },
  { hour: '22:00', risk: 45 },
]

// Chart data - Risk by weather
export const riskByWeather = [
  { condition: 'Clear', risk: 35, accidents: 45 },
  { condition: 'Cloudy', risk: 42, accidents: 52 },
  { condition: 'Rain', risk: 75, accidents: 98 },
  { condition: 'Heavy Rain', risk: 88, accidents: 124 },
  { condition: 'Fog', risk: 70, accidents: 67 },
]

// Top high-risk areas
export const topHighRiskAreas = [
  { name: 'Din Daeng', risk: 85, accidents: 12 },
  { name: 'Asok', risk: 82, accidents: 10 },
  { name: 'Victory Monument', risk: 79, accidents: 9 },
  { name: 'Rama IV-Sukhumvit', risk: 78, accidents: 8 },
  { name: 'Vibhavadi Km 12', risk: 72, accidents: 6 },
]

// Severity labels
export const severityLabels = {
  low: { en: 'Minor Injury', th: 'บาดเจ็บน้อย', color: '#16A34A' },
  medium: { en: 'Serious Injury', th: 'บาดเจ็บสาหัส', color: '#EA580C' },
  high: { en: 'Fatal', th: 'เสียชีวิต', color: '#DC2626' },
}

// Weather conditions
export const weatherConditions = [
  { value: 'clear', label_en: 'Clear', label_th: 'แจ่มใส' },
  { value: 'partly_cloudy', label_en: 'Partly Cloudy', label_th: 'มีเมฆบางส่วน' },
  { value: 'cloudy', label_en: 'Cloudy', label_th: 'มีเมฆมาก' },
  { value: 'rain', label_en: 'Rain', label_th: 'ฝนตก' },
  { value: 'heavy_rain', label_en: 'Heavy Rain', label_th: 'ฝนตกหนัก' },
  { value: 'fog', label_en: 'Fog', label_th: 'หมอก' },
]

// Road types
export const roadTypes = [
  { value: 'highway', label_en: 'Highway', label_th: 'ทางหลวง' },
  { value: 'urban', label_en: 'Urban Road', label_th: 'ถนนในเมือง' },
  { value: 'intersection', label_en: 'Intersection', label_th: 'ทางแยก' },
  { value: 'rural', label_en: 'Rural Road', label_th: 'ถนนชนบท' },
]
