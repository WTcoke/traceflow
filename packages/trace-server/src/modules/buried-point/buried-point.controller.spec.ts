import { Test, TestingModule } from '@nestjs/testing';
import { BuriedPointController } from './buried-point.controller';
import { BuriedPointService } from './buried-point.service';

describe('BuriedPointController', () => {
  let controller: BuriedPointController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BuriedPointController],
      providers: [BuriedPointService],
    }).compile();

    controller = module.get<BuriedPointController>(BuriedPointController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
