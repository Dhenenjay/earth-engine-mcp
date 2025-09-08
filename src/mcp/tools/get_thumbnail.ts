import ee from '@google/earthengine';
import { register, z } from '../registry';
import { parseAoi } from '@/src/utils/geo';

register({
  name: 'get_thumbnail_image',
  description: 'Get thumbnail URL for an image & region',
  input: z.object({ imageId: z.string(), aoi: z.any(), visParams: z.record(z.any()).default({}), size: z.object({ width:z.number().optional(), height:z.number().optional() }).optional() }),
  output: z.object({ url: z.string(), ttlSeconds: z.number() }),
  handler: async ({ imageId, aoi, visParams, size }) => {
    const region = parseAoi(aoi);
    // @ts-ignore
    const url = new ee.Image(imageId).getThumbURL({ region, ...visParams, ...size });
    return { url, ttlSeconds: 3600 };
  },
});
