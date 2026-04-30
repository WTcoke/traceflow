/* eslint-disable @typescript-eslint/no-var-requires */

import * as ip2region from 'ip2region';

const searcher = new ip2region.default();

export function parseIP(ip: string) {
  try {
    const result = searcher.search(ip) as any;

    if (!result) return null;

    const country = result.country || '';
    const region = result.region || '';
    const province = result.province || '';
    const city = result.city || '';
    const isp = result.isp || '';

    if (city === '内网IP' && !country) {
      return {
        country: '0',
        region: '',
        province: '',
        city: '',
        isp: '',
      };
    }

    return {
      country,
      region,
      province,
      city,
      isp,
    };
  } catch {
    return null;
  }
}
