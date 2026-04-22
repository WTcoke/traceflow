import { Test, TestingModule } from '@nestjs/testing';
import { BuriedPointService } from './buried-point.service';

describe('BuriedPointService', () => {
  let service: BuriedPointService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuriedPointService],
    }).compile();

    service = module.get<BuriedPointService>(BuriedPointService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
