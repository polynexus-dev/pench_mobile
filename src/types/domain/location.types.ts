export type LocationTag = "home" | "work" | "other" | string;

export interface CustomerLocation {
  id: number | string;
  tag: LocationTag;
  label?: string;
  address: string;
  landmark?: string;
  latitude: string | number;
  longitude: string | number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateLocationPayload {
  tag: string;
  label?: string;
  address: string;
  landmark?: string;
  latitude: string;
  longitude: string;
  is_default?: boolean;
}

export interface UpdateLocationPayload {
  tag?: string;
  label?: string;
  address?: string;
  landmark?: string;
  latitude?: string;
  longitude?: string;
  is_default?: boolean;
}
