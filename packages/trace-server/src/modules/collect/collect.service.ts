import { Injectable } from '@nestjs/common';
import { CreateCollectDto } from './dto/create-collect.dto';

@Injectable()
export class CollectService {
  /**
   * 单条事件上报
   * @param event 事件数据
   * @returns 上报结果
   */
  reportSingle(event: CreateCollectDto) {
    // 这里可以实现实际的事件处理逻辑，比如存储到数据库
    console.log('Reporting single event:', event);
    return {
      success: true,
      message: 'Event reported successfully',
      data: event,
    };
  }

  /**
   * 批量事件上报
   * @param events 事件数组
   * @returns 上报结果
   */
  reportBatch(events: CreateCollectDto[]) {
    // 这里可以实现实际的批量事件处理逻辑，比如批量存储到数据库
    console.log('Reporting batch events:', events.length, 'events');
    return {
      success: true,
      message: `${events.length} events reported successfully`,
      data: {
        count: events.length,
        events: events,
      },
    };
  }
}
