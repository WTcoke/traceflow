import { Injectable } from '@nestjs/common';
import { CollectBatchDto } from './dto/collect-batch.dto';
import { CollectSingleDto } from './dto/collect-single.dto';

@Injectable()
export class CollectService {
  // 处理单条上报
  async collectSingle(_appKey: string, dto: CollectSingleDto) {
    // 直接返回成功响应
    return {
      successCount: 1,
      failCount: 0,
      failData: [],
    };
  }

  // 处理批量上报
  async collectBatch(_appKey: string, dto: CollectBatchDto) {
    // 直接返回成功响应
    return {
      successCount: dto.data.length,
      failCount: 0,
      failData: [],
    };
  }
}
