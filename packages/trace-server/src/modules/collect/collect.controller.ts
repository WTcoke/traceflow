import { Controller, Post, Headers, Req, Body, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { createGunzip } from 'zlib';
import { promisify } from 'util';
import { CollectService } from './collect.service';
import {
  SingleBuriedPointDto,
  BatchBuriedPointDto,
  buriedPointSchema,
  batchBuriedPointSchema,
} from './dto/buried-point.dto';
import { AjvValidationPipe } from '../../common/pipes/ajv-validation.pipe';

const gunzipAsync = promisify(
  (input: Buffer, callback: (err: Error | null, result: Buffer) => void) => {
    const chunks: Buffer[] = [];
    const gunzip = createGunzip();
    gunzip.on('data', (chunk) => chunks.push(chunk));
    gunzip.on('end', () => callback(null, Buffer.concat(chunks)));
    gunzip.on('error', (err) => callback(err, Buffer.alloc(0)));
    gunzip.end(input);
  },
);

/**
 * 埋点收集控制器
 */
@ApiTags('埋点收集')
@Controller('collect')
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  /**
   * 解压gzip数据
   */
  private async decompressBody(req: Request): Promise<string> {
    const contentEncoding = req.headers['content-encoding'];
    const rawBody = (req as any).rawBody;

    if (contentEncoding === 'gzip' && rawBody) {
      try {
        // 解压
        const decompressed = await gunzipAsync(rawBody);
        return decompressed.toString('utf8');
      } catch {
        // 如果解压失败，尝试直接使用
        return rawBody.toString('utf8');
      }
    }

    // 非gzip编码
    if (rawBody) {
      return rawBody.toString('utf8');
    }
    if (typeof req.body === 'string') {
      return req.body;
    }
    return JSON.stringify(req.body);
  }

  /**
   * 单条埋点数据上报
   */
  @Post('single')
  @ApiOperation({ summary: '单条埋点数据上报' })
  @ApiHeader({ name: 'X-App-Id', description: '项目应用ID', required: true })
  @ApiHeader({ name: 'X-Timestamp', description: '时间戳（毫秒）', required: true })
  @ApiHeader({ name: 'X-Signature', description: 'HMAC-SHA256签名', required: true })
  @ApiHeader({ name: 'Content-Encoding', description: 'gzip（可选）', required: false })
  @ApiBody({ type: SingleBuriedPointDto })
  @UsePipes(new AjvValidationPipe(buriedPointSchema))
  async collectSingle(
    @Headers('X-App-Id') appId: string,
    @Headers('X-Timestamp') timestamp: string,
    @Headers('X-Signature') signature: string,
    @Req() req: Request,
    @Body() body: SingleBuriedPointDto,
  ) {
    // 获取原始body用于签名验证
    const rawBody = await this.decompressBody(req);

    // 验证签名
    const { projectId } = await this.collectService.verifySignature(
      appId,
      timestamp,
      signature,
      rawBody,
    );

    // 处理数据
    await this.collectService.collectSingle(projectId, body);

    return { success: true };
  }

  /**
   * 批量埋点数据上报
   */
  @Post('batch')
  @ApiOperation({ summary: '批量埋点数据上报' })
  @ApiHeader({ name: 'X-App-Id', description: '项目应用ID', required: true })
  @ApiHeader({ name: 'X-Timestamp', description: '时间戳（毫秒）', required: true })
  @ApiHeader({ name: 'X-Signature', description: 'HMAC-SHA256签名', required: true })
  @ApiHeader({ name: 'Content-Encoding', description: 'gzip（可选）', required: false })
  @ApiBody({ type: BatchBuriedPointDto })
  @UsePipes(new AjvValidationPipe(batchBuriedPointSchema))
  async collectBatch(
    @Headers('X-App-Id') appId: string,
    @Headers('X-Timestamp') timestamp: string,
    @Headers('X-Signature') signature: string,
    @Req() req: Request,
    @Body() body: BatchBuriedPointDto,
  ) {
    // 获取原始body用于签名验证
    const rawBody = await this.decompressBody(req);

    // 验证签名
    const { projectId } = await this.collectService.verifySignature(
      appId,
      timestamp,
      signature,
      rawBody,
    );

    // 处理数据
    const result = await this.collectService.collectBatch(projectId, body);

    return result;
  }
}
