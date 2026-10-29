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

export interface PublicBranch {
  id: string;
  name: string;
  location?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isOpen?: boolean;
  openTime?: string;
  closeTime?: string;
  phone?: string;
  imageUrl?: string;
}

export async function fetchBranchesApi(): Promise<PublicBranch[]> {
  try {
    const res = await fetch(`${API_BASE}/api/branches`);
    if (!res.ok) throw new Error('Failed to fetch branches');
    return await res.json();
  } catch (err) {
    console.warn('Using fallback branches:', err);
    return [];
  }
}

export interface PublicMenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  status: string;
  categoryId: string;
  category?: {
    id: string;
    name: string;
  };
}

export async function fetchMenuApi(): Promise<PublicMenuItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/menu`);
    if (!res.ok) throw new Error('Failed to fetch menu');
    return await res.json();
  } catch (err) {
    console.warn('Using fallback menu:', err);
    return [];
  }
}

export interface PublicCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export async function fetchCategoriesApi(): Promise<PublicCategory[]> {
  try {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (!res.ok) throw new Error('Failed to fetch categories');
    return await res.json();
  } catch (err) {
    console.warn('Using fallback categories:', err);
    return [];
  }
}
