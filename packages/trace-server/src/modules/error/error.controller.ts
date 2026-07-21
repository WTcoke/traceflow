import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ErrorService } from './error.service';
import { ErrorListQueryDto } from './dto/error-list-query.dto';
import { ErrorListResponseDto } from './dto/error-list-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('error')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('error')
export class ErrorController {
  constructor(private readonly errorService: ErrorService) {}

  @Get('list')
  @ApiOperation({ summary: '错误列表查询', description: '获取错误记录列表' })
  @Permissions('error:read')
  async getList(@Query() query: ErrorListQueryDto): Promise<ErrorListResponseDto> {
    return this.errorService.getList(query);
  }
}
