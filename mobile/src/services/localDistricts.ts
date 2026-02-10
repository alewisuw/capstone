import federalDistricts from '../data/federalDistricts2023.json';

type Geometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: number[][][] | number[][][][];
};

type DistrictProperties = {
  name?: string;
  id?: string;
  province?: string;
};

type DistrictFeature = {
  type: 'Feature';
  geometry: Geometry;
  properties: DistrictProperties;
};

type DistrictCollection = {
  type: 'FeatureCollection';
  features: DistrictFeature[];
};

export type LocalDistrictSummary = {
  name: string;
  id?: string;
  index: number;
};

const data = federalDistricts as DistrictCollection;

export const listLocalDistricts = (): LocalDistrictSummary[] => {
  return (data.features || []).map((feature, index) => ({
    name: feature.properties?.name || 'Unknown district',
    id: feature.properties?.id,
    index,
  }));
};

export const getLocalDistrictFeature = (index: number): DistrictFeature | null => {
  return data.features?.[index] || null;
};

export const findLocalDistrictByPoint = (
  lat: number,
  lng: number
): { feature: DistrictFeature; index: number } | null => {
  const point: [number, number] = [lng, lat];
  for (let i = 0; i < data.features.length; i += 1) {
    const feature = data.features[i];
    if (pointInGeometry(point, feature.geometry)) {
      return { feature, index: i };
    }
  }
  return null;
};

const pointInGeometry = (point: [number, number], geometry: Geometry): boolean => {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates as number[][][]);
  }
  if (geometry.type === 'MultiPolygon') {
    const polygons = geometry.coordinates as number[][][][];
    return polygons.some((polygon) => pointInPolygon(point, polygon));
  }
  return false;
};

const pointInPolygon = (point: [number, number], polygon: number[][][]): boolean => {
  if (!polygon.length) return false;
  const [outer, ...holes] = polygon;
  if (!pointInRing(point, outer)) return false;
  for (const hole of holes) {
    if (pointInRing(point, hole)) return false;
  }
  return true;
};

const pointInRing = (point: [number, number], ring: number[][]): boolean => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi + 0.0) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
};
