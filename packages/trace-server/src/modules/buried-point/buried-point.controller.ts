import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BuriedPointService } from './buried-point.service';
import { CreateBuriedPointDto } from './dto/create-buried-point.dto';
import { UpdateBuriedPointDto } from './dto/update-buried-point.dto';

@Controller('buried-point')
export class BuriedPointController {
  constructor(private readonly buriedPointService: BuriedPointService) {}

  @Post()
  create(@Body() createBuriedPointDto: CreateBuriedPointDto) {
    return this.buriedPointService.create(createBuriedPointDto);
  }

  @Get()
  findAll() {
    return this.buriedPointService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.buriedPointService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBuriedPointDto: UpdateBuriedPointDto) {
    return this.buriedPointService.update(+id, updateBuriedPointDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.buriedPointService.remove(+id);
  }
}
