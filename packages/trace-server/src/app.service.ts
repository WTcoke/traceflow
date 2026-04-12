import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'trace-server',
      message: 'Trace Server is healthy',
    };
  }
}
