/**
 * Bilingual Filter Mappings - Generated from Database
 * Based on actual unique values from accident_records table
 * 
 * Structure: Thai database value as ID, with English translations
 */

// Vehicle Type Mappings (from database: 10 unique values)
export const vehicleTypes = [
  { id: "all", name_en: "All Vehicles", name_th: "ยานพาหนะทั้งหมด" },
  { 
    id: "รถปิคอัพบรรทุก 4 ล้อ", 
    name_en: "Pickup Truck (4-wheel)", 
    name_th: "รถปิคอัพบรรทุก 4 ล้อ",
    count: 391
  },
  { 
    id: "รถยนต์นั่งส่วนบุคคล/รถยนต์นั่งสาธารณะ", 
    name_en: "Passenger Car", 
    name_th: "รถยนต์นั่งส่วนบุคคล/รถยนต์นั่งสาธารณะ",
    count: 264
  },
  { 
    id: "รถจักรยานยนต์", 
    name_en: "Motorcycle", 
    name_th: "รถจักรยานยนต์",
    count: 153
  },
  { 
    id: "รถบรรทุกมากกว่า 10 ล้อ (รถพ่วง)", 
    name_en: "Truck (>10 wheels)", 
    name_th: "รถบรรทุกมากกว่า 10 ล้อ (รถพ่วง)",
    count: 76
  },
  { 
    id: "รถบรรทุก 6 ล้อ", 
    name_en: "Truck (6-wheel)", 
    name_th: "รถบรรทุก 6 ล้อ",
    count: 34
  },
  { 
    id: "รถบรรทุกมากกว่า 6 ล้อ ไม่เกิน 10 ล้อ", 
    name_en: "Truck (6-10 wheels)", 
    name_th: "รถบรรทุกมากกว่า 6 ล้อ ไม่เกิน 10 ล้อ",
    count: 26
  },
  { 
    id: "รถตู้", 
    name_en: "Van", 
    name_th: "รถตู้",
    count: 6
  },
  { 
    id: "รถปิคอัพโดยสาร", 
    name_en: "Passenger Pickup", 
    name_th: "รถปิคอัพโดยสาร",
    count: 5
  },
  { 
    id: "อื่นๆ", 
    name_en: "Other", 
    name_th: "อื่นๆ",
    count: 27
  },
  { 
    id: "ไม่ระบุประเภทรถ", 
    name_en: "Unknown", 
    name_th: "ไม่ระบุประเภทรถ",
    count: 7
  },
];

// Weather Condition Mappings (from database: 5 unique values)
export const weatherTypes = [
  { id: "all", name_en: "All Weather", name_th: "ทุกสภาพอากาศ" },
  { 
    id: "แจ่มใส", 
    name_en: "Clear Sky", 
    name_th: "แจ่มใส",
    count: 731
  },
  { 
    id: "ฝนตก", 
    name_en: "Rain", 
    name_th: "ฝนตก",
    count: 260
  },
  { 
    id: "มีหมอก/ควัน/ฝุ่น", 
    name_en: "Fog/Smoke/Dust", 
    name_th: "มีหมอก/ควัน/ฝุ่น",
    count: 6
  },
  { 
    id: "มืดครึ้ม", 
    name_en: "Cloudy", 
    name_th: "มืดครึ้ม",
    count: 1
  },
  { 
    id: "ไม่ทราบสภาพอากาศ", 
    name_en: "Unknown", 
    name_th: "ไม่ทราบสภาพอากาศ",
    count: 2
  },
];

// Accident Cause Mappings (from database: 10+ unique values)
export const accidentCauseTypes = [
  { id: "all", name_en: "All Causes", name_th: "ทุกสาเหตุ" },
  { 
    id: "ขับรถเร็วเกินอัตรากำหนด", 
    name_en: "Speeding", 
    name_th: "ขับรถเร็วเกินอัตรากำหนด",
    count: 794
  },
  { 
    id: "คน/รถ/สัตว์ตัดหน้ากระชั้นชิด", 
    name_en: "Cutting In", 
    name_th: "คน/รถ/สัตว์ตัดหน้ากระชั้นชิด",
    count: 85
  },
  { 
    id: "หลับใน", 
    name_en: "Drowsy Driving", 
    name_th: "หลับใน",
    count: 36
  },
  { 
    id: "อุปกรณ์ยานพาหนะบกพร่อง", 
    name_en: "Vehicle Defect", 
    name_th: "อุปกรณ์ยานพาหนะบกพร่อง",
    count: 32
  },
  { 
    id: "ฝ่าฝืนสัญญาณไฟ/เครื่องหมายจราจร", 
    name_en: "Traffic Signal Violation", 
    name_th: "ฝ่าฝืนสัญญาณไฟ/เครื่องหมายจราจร",
    count: 12
  },
  { 
    id: "แซงรถอย่างผิดกฎหมาย", 
    name_en: "Illegal Overtaking", 
    name_th: "แซงรถอย่างผิดกฎหมาย",
    count: 7
  },
  { 
    id: "เมาสุรา", 
    name_en: "Drunk Driving", 
    name_th: "เมาสุรา",
    count: 5
  },
  { 
    id: "ถนนลื่น", 
    name_en: "Slippery Road", 
    name_th: "ถนนลื่น",
    count: 2
  },
  { 
    id: "อื่นๆ", 
    name_en: "Other", 
    name_th: "อื่นๆ",
    count: 3
  },
  { 
    id: "ไม่ทราบมูลเหตุ", 
    name_en: "Unknown", 
    name_th: "ไม่ทราบมูลเหตุ",
    count: 12
  },
];

// Casualty Types (unchanged - these are computed fields)
export const casualtyTypes = [
  { id: "all", name_en: "All Casualties", name_th: "ทุกระดับ" },
  { id: "fatal", name_en: "Fatal", name_th: "เสียชีวิต" },
  { id: "serious", name_en: "Serious Injury", name_th: "บาดเจ็บสาหัส" },
  { id: "minor", name_en: "Minor Injury", name_th: "บาดเจ็บเล็กน้อย" },
  { id: "survivors", name_en: "Survivors", name_th: "ผู้รอดชีวิต" },
];

// Helper function to get display name by language
export function getDisplayName(
  item: { name_en: string; name_th: string },
  language: "en" | "th"
): string {
  return language === "th" ? item.name_th : item.name_en;
}

// Helper function to find item by ID
export function findItemById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find((item) => item.id === id);
}
