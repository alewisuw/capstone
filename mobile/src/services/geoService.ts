import axios from 'axios';

const BOUNDARY_API_BASE =
  process.env.EXPO_PUBLIC_BOUNDARY_API_BASE_URL || 'https://represent.opennorth.ca';
const GEOCODER_BASE =
  process.env.EXPO_PUBLIC_GEOCODER_BASE_URL || 'https://nominatim.openstreetmap.org/search';
const GEOCODER_USER_AGENT =
  process.env.EXPO_PUBLIC_GEOCODER_USER_AGENT || 'BillBoardApp/1.0 (contact@yourdomain.com)';

const boundaryClient = axios.create({
  baseURL: BOUNDARY_API_BASE,
  timeout: 12000,
});

const geocodeClient = axios.create({
  baseURL: GEOCODER_BASE,
  timeout: 12000,
});

export type BoundarySet = {
  id?: string;
  slug?: string;
  name?: string;
  url?: string;
};

export type Boundary = {
  id?: string;
  slug?: string;
  name?: string;
  url?: string;
  external_id?: string;
};

type PostcodeResponse = {
  boundaries_centroid?: Boundary[];
  boundaries_concordance?: Boundary[];
};

type BoundaryListResponse = {
  objects?: Boundary[];
  meta?: {
    next?: string | null;
  };
};

type BoundarySetListResponse = {
  objects?: BoundarySet[];
};

let cachedFederalSet: BoundarySet | null = null;
let cachedFederalBoundaries: Boundary[] | null = null;

export const geocodeAddress = async (
  query: string
): Promise<{ lat: number; lng: number; displayName?: string }> => {
  const normalizedQuery = normalizeGeocodeQuery(query);
  const response = await geocodeClient.get('', {
    params: {
      q: normalizedQuery,
      format: 'json',
      limit: 1,
      countrycodes: 'ca',
      addressdetails: 1,
      email: 'mdotto@uwaterloo.ca',
    },
    headers: {
      Accept: 'application/json',
      'User-Agent': GEOCODER_USER_AGENT,
      Referer: GEOCODER_USER_AGENT,
    },
  });

  const result = Array.isArray(response.data) ? response.data[0] : null;
  if (!result || !result.lat || !result.lon) {
    throw new Error('No geocode results');
  }

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name,
  };
};

const normalizeGeocodeQuery = (input: string): string => {
  const trimmed = input.trim();
  const compact = trimmed.replace(/\s+/g, '').toUpperCase();
  const isPostal = /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact);
  if (!isPostal) return trimmed;
  const formatted = `${compact.slice(0, 3)} ${compact.slice(3)}`;
  return `${formatted} Canada`;
};

export const getFederalBoundarySet = async (): Promise<BoundarySet> => {
  if (cachedFederalSet) return cachedFederalSet;
  const response = await boundaryClient.get<BoundarySetListResponse>('/boundary-sets/', {
    params: { limit: 2000 },
  });
  const sets = response.data?.objects || [];
  const match = sets.find((set) => {
    const name = (set.name || '').toLowerCase();
    return name.includes('federal') && name.includes('electoral');
  });
  if (match) {
    cachedFederalSet = match;
    return match;
  }
  cachedFederalSet = {
    slug: 'federal-electoral-districts',
    name: 'Federal Electoral Districts',
  };
  return cachedFederalSet;
};

export const findBoundaryByPoint = async (lat: number, lng: number): Promise<Boundary> => {
  const set = await getFederalBoundarySet();
  const setSlug = getBoundarySetSlug(set);
  const response = await requestWithRetry<BoundaryListResponse>(() =>
    boundaryClient.get(`/boundaries/${setSlug}/`, {
      params: {
        contains: `${lat},${lng}`,
        limit: 1,
      },
    })
  );
  const boundary = response.data?.objects?.[0];
  if (!boundary) {
    throw new Error('No boundary found');
  }
  return boundary;
};

export const findBoundaryByPostalCode = async (postalCode: string): Promise<Boundary> => {
  const normalized = postalCode.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(normalized)) {
    throw new Error('Invalid postal code');
  }
  const response = await requestWithRetry<PostcodeResponse>(() =>
    boundaryClient.get(`/postcodes/${normalized}/`, {
      params: { sets: 'federal-electoral-districts' },
    })
  );
  const centroidMatch = response.data?.boundaries_centroid?.[0];
  if (centroidMatch) return centroidMatch;
  const concordanceMatch = response.data?.boundaries_concordance?.[0];
  if (concordanceMatch) return concordanceMatch;
  throw new Error('No boundary found');
};

export const listFederalBoundaries = async (): Promise<Boundary[]> => {
  if (cachedFederalBoundaries) return cachedFederalBoundaries;
  const set = await getFederalBoundarySet();
  const setSlug = getBoundarySetSlug(set);

  let nextUrl: string | null = `/boundaries/${setSlug}/?limit=350`;
  const results: Boundary[] = [];

  while (nextUrl) {
    const response = await boundaryClient.get<BoundaryListResponse>(nextUrl);
    if (response.data?.objects) {
      results.push(...response.data.objects);
    }
    const next = response.data?.meta?.next;
    nextUrl = typeof next === 'string' && next.length > 0 ? next : null;
  }

  cachedFederalBoundaries = results;
  return results;
};

export const getBoundarySimpleShape = async (boundary: Boundary): Promise<unknown> => {
  const boundaryUrl = getBoundaryDetailUrl(boundary);
  const response = await requestWithRetry<unknown>(() =>
    axios.get(`${boundaryUrl}/simple_shape`)
  );
  return response.data;
};

const getBoundarySetSlug = (set: BoundarySet): string => {
  if (set.slug) return set.slug;
  if (set.id) return set.id;
  if (set.url) {
    const parts = set.url.split('/').filter(Boolean);
    return parts[parts.length - 1];
  }
  throw new Error('Boundary set slug not available');
};

const getBoundaryDetailUrl = (boundary: Boundary): string => {
  if (boundary.url) {
    const clean = boundary.url.replace(/\/$/, '');
    return clean.startsWith('http') ? clean : `${BOUNDARY_API_BASE}${clean}`;
  }
  throw new Error('Boundary URL not available');
};

const requestWithRetry = async <T>(
  request: () => Promise<{ data: T }>,
  attempts = 2
): Promise<{ data: T }> => {
  let lastError: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await request();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || attempt === attempts - 1) {
        throw err;
      }
      await delay(400);
    }
  }
  throw lastError;
};

const isRetryable = (err: unknown): boolean => {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    return status === 502 || status === 503 || status === 504;
  }
  return false;
};

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
