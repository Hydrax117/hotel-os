/**
 * Resource-based inventory API client
 * Mirrors the backend ResourcesModule endpoints
 */
import { apiClient } from './client';

// ── Types ──────────────────────────────────────────────────────────────────────

export type BookingUnit = 'NIGHT' | 'HOUR' | 'DAY' | 'SESSION' | 'CUSTOM';
export type ResourceLifecycleStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export type ResourceOperationalStatus =
  | 'READY'
  | 'DIRTY'
  | 'OCCUPIED'
  | 'INSPECTION'
  | 'MAINTENANCE'
  | 'OUT_OF_SERVICE';
export type ResourceMarketplaceVisibility = 'PRIVATE' | 'UNLISTED' | 'PUBLIC';

export type ResourceType = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultBookable: boolean;
};

export type ResourceCategory = {
  id: string;
  hotelId: string;
  resourceTypeId: string;
  resourceType: ResourceType;
  name: string;
  code: string;
  description: string | null;
  defaultBookingUnit: BookingUnit;
  defaultCapacity: number | null;
  defaultMinimumDurationMinutes: number | null;
  defaultMaximumDurationMinutes: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: { resources: number };
};

export type Building = {
  id: string;
  hotelId: string;
  name: string;
  code: string;
  floors: Floor[];
  _count?: { resources: number };
};

export type Floor = {
  id: string;
  hotelId: string;
  buildingId: string;
  name: string;
  levelNumber: number;
};

export type ResourceImage = {
  id: string;
  resourceId: string;
  url: string;
  caption: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Resource = {
  id: string;
  hotelId: string;
  resourceCategoryId: string;
  category: ResourceCategory;
  buildingId: string | null;
  building: Building | null;
  floorId: string | null;
  floor: Floor | null;
  name: string;
  code: string;
  description: string | null;
  bookingUnit: BookingUnit;
  isBookable: boolean;
  marketplaceVisibility: ResourceMarketplaceVisibility;
  lifecycleStatus: ResourceLifecycleStatus;
  operationalStatus: ResourceOperationalStatus;
  capacity: number | null;
  minimumCapacity: number | null;
  minimumDurationMinutes: number | null;
  maximumDurationMinutes: number | null;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  attributes: Record<string, unknown> | null;
  internalNotes: string | null;
  archivedAt: string | null;
  images: ResourceImage[];
  createdAt: string;
  updatedAt: string;
};

// ── API calls ──────────────────────────────────────────────────────────────────

export const resourcesApi = {
  // Resource types
  getResourceTypes: () =>
    apiClient.get<ResourceType[]>('/api/v1/resource-types'),

  // Categories
  getCategories: (hotelId: string) =>
    apiClient.get<ResourceCategory[]>(`/api/v1/hotels/${hotelId}/resource-categories`),

  createCategory: (
    hotelId: string,
    payload: {
      name: string;
      code: string;
      resourceTypeId: string;
      description?: string;
      defaultBookingUnit?: BookingUnit;
      defaultCapacity?: number;
      defaultMinimumDurationMinutes?: number;
      defaultMaximumDurationMinutes?: number;
    },
  ) =>
    apiClient.post<ResourceCategory>(
      `/api/v1/hotels/${hotelId}/resource-categories`,
      payload,
    ),

  updateCategory: (
    categoryId: string,
    payload: Partial<{
      name: string;
      description: string;
      defaultBookingUnit: BookingUnit;
      defaultCapacity: number;
      isActive: boolean;
    }>,
  ) =>
    apiClient.patch<ResourceCategory>(
      `/api/v1/resource-categories/${categoryId}`,
      payload,
    ),

  // Buildings
  getBuildings: (hotelId: string) =>
    apiClient.get<Building[]>(`/api/v1/hotels/${hotelId}/buildings`),

  createBuilding: (hotelId: string, payload: { name: string; code: string }) =>
    apiClient.post<Building>(`/api/v1/hotels/${hotelId}/buildings`, payload),

  createFloor: (
    hotelId: string,
    buildingId: string,
    payload: { name: string; levelNumber: number },
  ) =>
    apiClient.post<Floor>(
      `/api/v1/hotels/${hotelId}/buildings/${buildingId}/floors`,
      payload,
    ),

  // Resources
  listResources: (
    hotelId: string,
    params?: {
      categoryId?: string;
      buildingId?: string;
      floorId?: string;
      lifecycleStatus?: ResourceLifecycleStatus;
      operationalStatus?: ResourceOperationalStatus;
      isBookable?: boolean;
    },
  ) => {
    const qs = params ? '?' + new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, String(v)])
    ).toString() : '';
    return apiClient.get<Resource[]>(`/api/v1/hotels/${hotelId}/resources${qs}`);
  },

  getResource: (resourceId: string) =>
    apiClient.get<Resource>(`/api/v1/resources/${resourceId}`),

  createResource: (
    hotelId: string,
    payload: {
      name: string;
      code: string;
      resourceCategoryId: string;
      buildingId?: string;
      floorId?: string;
      description?: string;
      bookingUnit?: BookingUnit;
      isBookable?: boolean;
      marketplaceVisibility?: ResourceMarketplaceVisibility;
      capacity?: number;
      attributes?: Record<string, unknown>;
      internalNotes?: string;
    },
  ) =>
    apiClient.post<Resource>(`/api/v1/hotels/${hotelId}/resources`, payload),

  bulkCreateResources: (
    hotelId: string,
    payload: {
      resourceCategoryId: string;
      buildingId?: string;
      floorId?: string;
      bookingUnit?: BookingUnit;
      isBookable?: boolean;
      marketplaceVisibility?: ResourceMarketplaceVisibility;
      resources: { name: string; code: string; capacity?: number; attributes?: Record<string, unknown> }[];
    },
  ) =>
    apiClient.post<{ created: Resource[]; errors: { code: string; error: string }[] }>(
      `/api/v1/hotels/${hotelId}/resources/bulk`,
      payload,
    ),

  updateResource: (resourceId: string, payload: Partial<Omit<Resource, 'id' | 'hotelId' | 'code' | 'category' | 'building' | 'floor' | 'images' | 'createdAt' | 'updatedAt'>>) =>
    apiClient.patch<Resource>(`/api/v1/resources/${resourceId}`, payload),

  archiveResource: (resourceId: string) =>
    apiClient.post<Resource>(`/api/v1/resources/${resourceId}/archive`),

  updateOperationalStatus: (
    resourceId: string,
    payload: { operationalStatus: ResourceOperationalStatus; notes?: string },
  ) =>
    apiClient.patch<Resource>(`/api/v1/resources/${resourceId}/operational-status`, payload),

  // Images
  getImages: (resourceId: string) =>
    apiClient.get<ResourceImage[]>(`/api/v1/resources/${resourceId}/images`),

  addImage: (
    resourceId: string,
    payload: { url: string; caption?: string; isPrimary?: boolean; sortOrder?: number },
  ) =>
    apiClient.post<ResourceImage>(`/api/v1/resources/${resourceId}/images`, payload),

  deleteImage: (resourceId: string, imageId: string) =>
    apiClient.delete(`/api/v1/resources/${resourceId}/images/${imageId}`),

  setPrimaryImage: (resourceId: string, imageId: string) =>
    apiClient.patch<ResourceImage>(
      `/api/v1/resources/${resourceId}/images/${imageId}/primary`,
    ),
};
