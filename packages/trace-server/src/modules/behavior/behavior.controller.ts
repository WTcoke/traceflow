import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BehaviorService } from './behavior.service';
import { CreateBehaviorDto } from './dto/create-behavior.dto';
import { UpdateBehaviorDto } from './dto/update-behavior.dto';

@Controller('behavior')
export class BehaviorController {
  constructor(private readonly behaviorService: BehaviorService) {}

  @Post()
  create(@Body() createBehaviorDto: CreateBehaviorDto) {
    return this.behaviorService.create(createBehaviorDto);
  }

  @Get()
  findAll() {
    return this.behaviorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.behaviorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBehaviorDto: UpdateBehaviorDto) {
    return this.behaviorService.update(+id, updateBehaviorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.behaviorService.remove(+id);
  }
}
