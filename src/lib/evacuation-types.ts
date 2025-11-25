export interface EvacuationCenter {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  capacity: number;
  current_occupancy: number;
  contact_phone: string | null;
  contact_name: string | null;
  
  // Facilities
  has_food: boolean;
  has_water: boolean;
  has_medical: boolean;
  has_electricity: boolean;
  has_toilet: boolean;
  has_shower: boolean;
  has_bedding: boolean;
  has_wifi: boolean;
  accepts_pets: boolean;
  
  // Status
  status: 'open' | 'full' | 'closed';
  notes: string | null;
  
  created_at: string;
  updated_at: string;
}

export const facilityLabels: Record<string, { icon: string; label: string }> = {
  has_food: { icon: '🍚', label: 'อาหาร' },
  has_water: { icon: '💧', label: 'น้ำดื่ม' },
  has_medical: { icon: '💊', label: 'ยา/พยาบาล' },
  has_electricity: { icon: '⚡', label: 'ไฟฟ้า' },
  has_toilet: { icon: '🚽', label: 'ห้องน้ำ' },
  has_shower: { icon: '🚿', label: 'ห้องอาบน้ำ' },
  has_bedding: { icon: '🛏️', label: 'ที่นอน' },
  has_wifi: { icon: '📶', label: 'WiFi' },
  accepts_pets: { icon: '🐕', label: 'รับสัตว์เลี้ยง' },
};

export const statusLabels: Record<string, { color: string; label: string }> = {
  open: { color: 'green', label: 'เปิดรับ' },
  full: { color: 'yellow', label: 'เต็ม' },
  closed: { color: 'red', label: 'ปิด' },
};
