import ee from '@google/earthengine';
import { register, z } from '../registry';

const IndexEnum = ['NDVI','EVI','NDWI'] as const;

register({
  name: 'calculate_spectral_index',
  description: 'Compute NDVI/EVI/NDWI',
  input: z.object({ imageId: z.string(), index: z.enum(IndexEnum), mapping: z.object({ nir:z.string(), red:z.string(), green:z.string().optional(), swir:z.string().optional() }) }),
  output: z.object({ ok: z.boolean() }),
  handler: async ({ imageId, index, mapping }) => {
    const img = new ee.Image(imageId);
    let out = img;
    if(index==='NDVI') out = img.expression('(NIR-RED)/(NIR+RED)', {NIR: img.select(mapping.nir), RED: img.select(mapping.red)}).rename('NDVI');
    if(index==='EVI') out = img.expression('2.5*((NIR-RED)/(NIR+6*RED-7.5*BLUE+1))', {NIR:img.select(mapping.nir), RED:img.select(mapping.red), BLUE: img.select(mapping.green ?? mapping.red)}).rename('EVI');
    if(index==='NDWI') out = img.expression('(GREEN-NIR)/(GREEN+NIR)', {GREEN: img.select(mapping.green ?? mapping.red), NIR: img.select(mapping.nir)}).rename('NDWI');
    out.projection(); // touch
    return { ok: true };
  },
});
