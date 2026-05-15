import type { INetworkAdapter } from '../../adapter/types';
import type { TraceEvent } from '../../core/types';

export interface WebOptions {
  useBeaconOnUnload?: boolean;
  beaconQueueStrategy?: 'remove-on-accepted' | 'keep-for-retry';
}

export interface IWebNetworkAdapter extends INetworkAdapter {
  sendBeacon(events: TraceEvent[]): boolean;
}
