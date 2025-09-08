import ee from '@google/earthengine';
import { register, z } from '../registry';
import { exportImageToGCS, getTaskStatus } from '@/src/gee/tasks';
import { parseAoi } from '@/src/utils/geo';

register({
  name: 'export_image_to_cloud_storage',
  description: 'Start a GeoTIFF export to GCS',
  input: z.object({ imageId: z.string(), bucket: z.string(), fileNamePrefix: z.string(), aoi: z.any(), scale: z.number().optional(), crs: z.string().optional() }),
  output: z.object({ taskId: z.string(), state: z.string().optional() }),
  handler: async ({ imageId, bucket, fileNamePrefix, aoi, scale, crs }) => {
    const image = new ee.Image(imageId); const region = parseAoi(aoi);
    const { taskId } = exportImageToGCS({ image, description:`export-${fileNamePrefix}`, bucket, fileNamePrefix, region, scale, crs });
    const status = getTaskStatus(taskId);
    return { taskId, state: status.state };
  },
});
