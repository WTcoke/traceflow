import { Injectable } from '@nestjs/common';
import { TrackService } from '../track/track.service';
import { CollectBatchDto } from './dto/collect-batch.dto';
import { CollectEventDto } from './dto/collect-event.dto';
import { CollectSingleDto } from './dto/collect-single.dto';

@Injectable()
export class CollectService {
  constructor(private readonly trackService: TrackService) {}

  async collectSingle(_appKey: string, dto: CollectSingleDto) {
    await this.trackService.createEvent(this.toTrackDto(dto.data));

    return {
      successCount: 1,
      failCount: 0,
      failData: [],
    };
  }

  async collectBatch(_appKey: string, dto: CollectBatchDto) {
    const result = await this.trackService.createEventBatch({
      events: dto.data.map((event) => this.toTrackDto(event)),
    });

    return {
      successCount: result.count,
      failCount: dto.data.length - result.count,
      failData: [],
    };
  }

  private toTrackDto(event: CollectEventDto) {
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      eventName: event.eventName,
      timestamp: event.timestamp,
      userId: event.userId,
      anonymousId: event.anonymousId,
      sessionId: event.sessionId,
      deviceInfo: event.deviceInfo,
      url: event.url,
      title: event.title,
      referrer: event.referrer,
      properties: event.properties,
      priority: event.priority,
    };
import { CreateCollectDto } from './dto/create-collect.dto';
import { UpdateCollectDto } from './dto/update-collect.dto';

@Injectable()
export class CollectService {
  create(createCollectDto: CreateCollectDto) {
    return 'This action adds a new collect';
  }

  findAll() {
    return `This action returns all collect`;
  }

  findOne(id: number) {
    return `This action returns a #${id} collect`;
  }

  update(id: number, updateCollectDto: UpdateCollectDto) {
    return `This action updates a #${id} collect`;
  }

  remove(id: number) {
    return `This action removes a #${id} collect`;
  }
}
