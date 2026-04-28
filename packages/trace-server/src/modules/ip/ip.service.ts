import { Injectable } from '@nestjs/common';
import * as geoip from 'geoip-lite';

@Injectable()
export class IpService {
  private cache = new Map<string, any>();
  getRegion(ip: string) {
    if (!ip) return null;

    if (this.cache.has(ip)) {
      return this.cache.get(ip);
    }

    const res = geoip.lookup(ip);

    const result = {
      country: res?.country || '',
      region: res?.region || '',
      city: res?.city || '',
    };

    this.cache.set(ip, result);
    return result;
  }
}
