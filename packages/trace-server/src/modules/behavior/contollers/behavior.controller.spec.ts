import { Test, TestingModule } from '@nestjs/testing';
import { BehaviorController } from '../contollers/behavior.controller';
import { BehaviorService } from '../services/behavior.service';

describe('BehaviorController', () => {
  let controller: BehaviorController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BehaviorController],
      providers: [BehaviorService],
    }).compile();

    controller = module.get<BehaviorController>(BehaviorController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
