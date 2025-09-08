import ee from '@google/earthengine';
import { register, z } from '../registry';
import { parseAoi } from '@/src/utils/geo';

register({
  name: 'clip_image_to_region',
  description: 'Clip image by AOI',
  input: z.object({ imageId: z.string(), aoi: z.any() }),
  output: z.object({ ok: z.boolean() }),
  handler: async ({ imageId, aoi }) => {
    const img = new ee.Image(imageId);
    const region = parseAoi(aoi);
    img.clip(region).bandNames();
    return { ok: true };
  },
});
