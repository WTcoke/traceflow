import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CollectService } from './collect.service';
import { CollectBatchDto } from './dto/collect-batch.dto';
import { CollectSingleDto } from './dto/collect-single.dto';

function createSuccessResponse<T>(data: T, requestId: string) {
  return {
    code: 200,
    message: '请求成功',
    data,
    requestId,
  };
}

@ApiTags('collect - SDK 数据上报')
@Controller('collect')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  @Post('single')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '单条数据上报', description: 'SDK 单条事件上报接口' })
  @ApiHeader({ name: 'X-App-Key', required: true, description: '项目 App Key' })
  @ApiResponse({ status: 200, description: '上报成功' })
  async collectSingle(
    @Headers('x-app-key') appKey: string | undefined,
    @Body() dto: CollectSingleDto,
  ) {
    this.ensureAppKey(appKey);
    const requestId = this.generateRequestId();
    const result = await this.collectService.collectSingle(appKey!, dto);
    return createSuccessResponse(result, requestId);
  }

  @Post('batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '批量数据上报', description: 'SDK 批量事件上报接口' })
  @ApiHeader({ name: 'X-App-Key', required: true, description: '项目 App Key' })
  @ApiResponse({ status: 200, description: '上报成功' })
  async collectBatch(
    @Headers('x-app-key') appKey: string | undefined,
    @Body() dto: CollectBatchDto,
  ) {
    this.ensureAppKey(appKey);
    const requestId = this.generateRequestId();
    const result = await this.collectService.collectBatch(appKey!, dto);
    return createSuccessResponse(result, requestId);
  }

  private ensureAppKey(appKey: string | undefined): void {
    if (!appKey) {
      throw new UnauthorizedException('X-App-Key is required');
    }
  }

  private generateRequestId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
