import { Injectable } from '@nestjs/common';
import { BehaviorPathsQueryDto } from './dto/behavior-paths-query.dto';
import { BehaviorPathsResponseDto } from './dto/behavior-paths-response.dto';

@Injectable()
export class BehaviorService {
  getPaths(query: BehaviorPathsQueryDto): BehaviorPathsResponseDto {
    const { pageNum = 1, pageSize = 10 } = query;

    const total = 50;
    const pages = Math.ceil(total / pageSize);

    return {
      total,
      pages,
      list: this.generateMockData(pageSize),
    };
  }

  private generateMockData(limit: number) {
    const mockList = [];
    for (let i = 0; i < limit; i++) {
      mockList.push({
        pageUrl: `/page/${i}`,
        eventName: i % 2 === 0 ? 'click' : 'input',
        element: i % 3 === 0 ? `#btn-${i}` : undefined,
        eventTime: Date.now() - i * 1000,
      });
    }
    return mockList;
  }
}
