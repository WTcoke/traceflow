import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MonitorService } from './monitor.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('server')
@Controller('server')
export class MonitorController {
  constructor(private readonly monitorService: MonitorService) {}

  @Get('health')
  @ApiOperation({ summary: '健康检查', description: '无需鉴权，供外部监控系统调用' })
  @ApiResponse({ status: 200, description: '成功' })
  async getHealth() {
    return this.monitorService.getHealth();
  }

  @Post()
  create(@Body() createMonitorDto: CreateMonitorDto) {
    return this.monitorService.create(createMonitorDto);
  }

  @Get()
  findAll() {
    return this.monitorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.monitorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMonitorDto: UpdateMonitorDto) {
    return this.monitorService.update(+id, updateMonitorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.monitorService.remove(+id);
  }
}
