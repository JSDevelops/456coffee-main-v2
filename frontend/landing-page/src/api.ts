const API_BASE = import.meta.env.VITE_API_URL || 'https://api.cafe-coffee.shop';

export interface AcademyEnrollPayload {
  studentName: string;
  phone: string;
  lineId?: string;
  courseTrack?: string;
  planStatus?: string;
  preferredDate?: string;
  notes?: string;
}

export interface PlantationBookPayload {
  farmerName: string;
  phone: string;
  lineId?: string;
  saplingCount?: number;
  landArea?: string;
  subdistrict?: string;
  district: string;
  province?: string;
  gpsLocation?: string;
  experienceLevel?: string;
}

export async function enrollAcademyApi(payload: AcademyEnrollPayload) {
  const res = await fetch(`${API_BASE}/api/ecosystem/academy/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
  }
  return res.json();
}

export async function bookPlantationApi(payload: PlantationBookPayload) {
  const res = await fetch(`${API_BASE}/api/ecosystem/plantations/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'ไม่สามารถส่งข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
  }
  return res.json();
}

export async function fetchLocationsApi() {
  const res = await fetch(`${API_BASE}/api/ecosystem/locations`);
  if (!res.ok) {
    throw new Error('Failed to load locations');
  }
  return res.json();
}
