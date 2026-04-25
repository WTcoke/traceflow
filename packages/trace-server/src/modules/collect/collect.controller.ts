import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CollectService } from './collect.service';
import { CreateCollectDto } from './dto/create-collect.dto';
import { BatchCollectDto } from './dto/batch-collect.dto';

@ApiTags('collect')
@Controller('collect')
export class CollectController {
  constructor(private readonly collectService: CollectService) {}

  @ApiOperation({
    summary: '单条事件上报',
    description: '上报单条事件数据',
  })
  @Post('single')
  reportSingle(@Body() createCollectDto: CreateCollectDto) {
    return this.collectService.reportSingle(createCollectDto.data);
  }

  @ApiOperation({
    summary: '批量事件上报',
    description: '批量上报多条事件数据',
  })
  @Post('batch')
  reportBatch(@Body() batchCollectDto: BatchCollectDto) {
    return this.collectService.reportBatch(batchCollectDto.data);
  }
}
