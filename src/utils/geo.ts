import type { Feature, FeatureCollection, Geometry } from 'geojson';
import ee from '@google/earthengine';

export function parseAoi(aoi: any): any {
  if (!aoi) throw new Error('AOI required');
  if (aoi.type === 'FeatureCollection') return new ee.FeatureCollection(aoi as FeatureCollection).geometry();
  if (aoi.type === 'Feature') return new ee.Feature(new ee.Geometry(aoi.geometry)).geometry();
  if (aoi.type) return new ee.Geometry(aoi as Geometry);
  throw new Error('Unsupported AOI format');
}
export function clampScale(scale: number, min=10, max=10000) {
  return Math.max(min, Math.min(max, scale));
}
