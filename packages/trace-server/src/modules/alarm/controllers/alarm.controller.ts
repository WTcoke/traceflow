import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlarmService } from '../services/alarm.service';
import { CreateAlarmRuleDto } from '../dto/create-alarm.dto';
import { UpdateAlarmRuleDto } from '../dto/update-alarm.dto';
import { HandleAlarmRecordDto } from '../dto/handle-alarm-record.dto';
import { AlarmRecordQueryDto } from '../dto/alarm-record-query.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permissions } from '../../../common/decorators/permissions.decorator';

@ApiTags('告警中心')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('alarm')
export class AlarmController {
  constructor(private readonly alarmService: AlarmService) {}

  @Post('rules')
  @ApiOperation({ summary: '创建告警规则' })
  @Permissions('alarm:manage')
  createRule(@Body() dto: CreateAlarmRuleDto) {
    return this.alarmService.createAlarmRule(dto);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: '更新告警规则' })
  @Permissions('alarm:manage')
  updateRule(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAlarmRuleDto) {
    return this.alarmService.updateAlarmRule(id, dto);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: '删除告警规则' })
  @Permissions('alarm:manage')
  deleteRule(@Param('id', ParseIntPipe) id: number) {
    return this.alarmService.deleteAlarmRule(id);
  }

  @Get('records')
  @ApiOperation({ summary: '告警记录列表' })
  @Permissions('alarm:read')
  findRecords(@Query() query: AlarmRecordQueryDto) {
    return this.alarmService.findAlarmRecords(query);
  }

  @Put('records/:id/handle')
  @ApiOperation({ summary: '处理告警' })
  @Permissions('alarm:manage')
  handleRecord(@Param('id', ParseIntPipe) id: number, @Body() dto: HandleAlarmRecordDto) {
    return this.alarmService.handleAlarmRecord(id, dto);
  }
}
