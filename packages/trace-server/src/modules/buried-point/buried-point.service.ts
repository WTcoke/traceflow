import { Injectable } from '@nestjs/common';
import { CreateBuriedPointDto } from './dto/create-buried-point.dto';
import { UpdateBuriedPointDto } from './dto/update-buried-point.dto';

@Injectable()
export class BuriedPointService {
  create(createBuriedPointDto: CreateBuriedPointDto) {
    return 'This action adds a new buriedPoint';
  }

  findAll() {
    return `This action returns all buriedPoint`;
  }

  findOne(id: number) {
    return `This action returns a #${id} buriedPoint`;
  }

  update(id: number, updateBuriedPointDto: UpdateBuriedPointDto) {
    return `This action updates a #${id} buriedPoint`;
  }

  remove(id: number) {
    return `This action removes a #${id} buriedPoint`;
  }
}
