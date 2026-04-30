import { Controller, Post, Headers, Req, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { createGunzip } from 'zlib';
import { promisify } from 'util';
import { CollectService } from './collect.service';
import { SingleBuriedPointDto, BatchBuriedPointDto } from './dto/buried-point.dto';

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

@ApiTags('埋点收集')
@Controller('collect')
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  private async decompressBody(req: Request): Promise<string> {
    const contentEncoding = req.headers['content-encoding'];
    const rawBody = (req as any).rawBody;

    if (contentEncoding === 'gzip' && rawBody) {
      try {
        const decompressed = await gunzipAsync(rawBody);
        return decompressed.toString('utf8');
      } catch {
        return rawBody.toString('utf8');
      }
    }

    if (rawBody) {
      return rawBody.toString('utf8');
    }
    if (typeof req.body === 'string') {
      return req.body;
    }
    return JSON.stringify(req.body);
  }

  @Post('single')
  @ApiOperation({ summary: '单条埋点数据上报' })
  @ApiHeader({ name: 'X-App-Id', description: '项目应用ID', required: true })
  @ApiHeader({ name: 'X-Timestamp', description: '时间戳（毫秒）', required: true })
  @ApiHeader({ name: 'X-Signature', description: 'HMAC-SHA256签名', required: true })
  @ApiHeader({ name: 'Content-Encoding', description: 'gzip（可选）', required: false })
  @ApiBody({ type: SingleBuriedPointDto })
  async collectSingle(
    @Headers('X-App-Id') appId: string,
    @Headers('X-Timestamp') timestamp: string,
    @Headers('X-Signature') signature: string,
    @Req() req: Request,
    @Body() body: SingleBuriedPointDto,
  ) {
    const rawBody = await this.decompressBody(req);

    const { projectId } = await this.collectService.verifySignature(
      appId,
      timestamp,
      signature,
      rawBody,
    );

    await this.collectService.sendToQueue(projectId, [body]);

    return { success: true };
  }

  @Post('batch')
  @ApiOperation({ summary: '批量埋点数据上报' })
  @ApiHeader({ name: 'X-App-Id', description: '项目应用ID', required: true })
  @ApiHeader({ name: 'X-Timestamp', description: '时间戳（毫秒）', required: true })
  @ApiHeader({ name: 'X-Signature', description: 'HMAC-SHA256签名', required: true })
  @ApiHeader({ name: 'Content-Encoding', description: 'gzip（可选）', required: false })
  @ApiBody({ type: BatchBuriedPointDto })
  async collectBatch(
    @Headers('X-App-Id') appId: string,
    @Headers('X-Timestamp') timestamp: string,
    @Headers('X-Signature') signature: string,
    @Req() req: Request,
    @Body() body: BatchBuriedPointDto,
  ) {
    // 限制单次最大条数
    const MAX_BATCH_SIZE = 100;
    if (!body.list || body.list.length > MAX_BATCH_SIZE) {
      throw new BadRequestException(
        `单次上报最多 ${MAX_BATCH_SIZE} 条数据，实际收到 ${body.list?.length || 0} 条`,
      );
    }
    const rawBody = await this.decompressBody(req);

    const { projectId } = await this.collectService.verifySignature(
      appId,
      timestamp,
      signature,
      rawBody,
    );

    await this.collectService.sendToQueue(projectId, body.list);

    return { success: true, count: body.list.length };
  }
}
