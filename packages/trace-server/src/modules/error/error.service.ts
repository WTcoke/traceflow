import { Injectable } from '@nestjs/common';
import { ErrorListQueryDto } from './dto/error-list-query.dto';
import { ErrorListResponseDto } from './dto/error-list-response.dto';

@Injectable()
export class ErrorService {
  getErrorList(query: ErrorListQueryDto): ErrorListResponseDto {
    const { pageNum = 1, pageSize = 10, errorType } = query;

    const total = 200;
    const pages = Math.ceil(total / pageSize);

    return {
      total,
      pages,
      list: this.generateMockData(pageSize, errorType),
    };
  }

  private generateMockData(limit: number, errorType?: string) {
    const types = ['js', 'resource', 'network'];
    const mockList = [];
    for (let i = 0; i < limit; i++) {
      const type = errorType || types[i % types.length];
      mockList.push({
        id: `173456789012345${i}`,
        eventType: 'error',
        errorType: type,
        message:
          type === 'js'
            ? `TypeError: Cannot read property '${['foo', 'bar', 'baz'][i % 3]}' of undefined`
            : type === 'resource'
              ? `Failed to load resource: ${['img', 'script', 'css'][i % 3]}.png`
              : `Network request failed: ${['fetch', 'xhr', 'jsonp'][i % 3]}`,
        stack:
          type === 'js'
            ? `at ${['handleClick', 'onSubmit', 'render'][i % 3]} (${['/app.js:1', '/main.js:2', '/index.js:3'][i % 3]})`
            : undefined,
        pageUrl: `/page/${i}`,
        eventTime: Date.now() - i * 60000,
        os: i % 2 === 0 ? 'Windows' : 'macOS',
        browser: i % 2 === 0 ? 'Chrome 120' : 'Safari 17',
      });
    }
    return mockList;
  }
}
