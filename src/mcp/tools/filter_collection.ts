import ee from '@google/earthengine';
import { register, z } from '../registry';
import { parseAoi } from '@/src/utils/geo';

register({
  name: 'filter_collection_by_date_and_region',
  description: 'Filter an ImageCollection by time range and AOI',
  input: z.object({ datasetId: z.string(), aoi: z.any(), start: z.string(), end: z.string() }),
  output: z.object({ count: z.number() }),
  handler: async ({ datasetId, aoi, start, end }) => {
    const region = parseAoi(aoi);
    const col = new ee.ImageCollection(datasetId).filterDate(start, end).filterBounds(region);
    const count = await col.size().getInfo();
    return { count };
  },
});
