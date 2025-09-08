import ee from '@google/earthengine';
import { JWT } from 'google-auth-library';
import { decodeSaJson } from '@/src/utils/env';

let initialized=false;

export async function initEarthEngineWithSA(){
  if (initialized) return;
  const sa = decodeSaJson();
  const jwt = new JWT({ email: sa.client_email, key: sa.private_key, scopes: ['https://www.googleapis.com/auth/earthengine','https://www.googleapis.com/auth/devstorage.read_write']});
  const creds = await jwt.authorize();
  await new Promise<void>((resolve,reject)=> ee.data.authenticateViaPrivateKey(sa, ()=>{ ee.initialize(null, null, ()=>{ initialized=true; resolve(); }, reject); }, reject));
}

export function ensureEE(){ if(!initialized) throw new Error('Earth Engine not initialized'); }

export async function getTileService(image: any, vis: any){
  ensureEE();
  // @ts-ignore
  const map = image.getMap(vis);
  return { mapId: map.mapid, tileUrlTemplate: map.urlFormat, ttlSeconds: 3600, visParams: vis };
}
