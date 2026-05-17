import type { ReportManager } from '../../report/ReportManager';
import type { IWebNetworkAdapter, WebOptions } from './types';

export class WebLifecycleReporter {
  private readonly options: Required<WebOptions>;
  private cleanupHandlers: Array<() => void> = [];

  constructor(
    private readonly reporter: ReportManager,
    private readonly networkAdapter: IWebNetworkAdapter,
    options?: WebOptions,
  ) {
    this.options = {
      useBeaconOnUnload: options?.useBeaconOnUnload ?? false,
      beaconQueueStrategy: options?.beaconQueueStrategy ?? 'keep-for-retry',
    };
  }

  start(): void {
    if (!this.options.useBeaconOnUnload) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const flushByBeacon = () => {
      const events = this.reporter.peekPendingForTransport();
      if (events.length === 0) return;

      const accepted = this.networkAdapter.sendBeacon(events);
      if (accepted && this.options.beaconQueueStrategy === 'remove-on-accepted') {
        this.reporter.removePending(events.length);
      }
    };

    window.addEventListener('pagehide', flushByBeacon);
    this.cleanupHandlers.push(() => window.removeEventListener('pagehide', flushByBeacon));

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushByBeacon();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    this.cleanupHandlers.push(() =>
      document.removeEventListener('visibilitychange', handleVisibilityChange),
    );
  }

  stop(): void {
    this.cleanupHandlers.forEach((cleanup) => cleanup());
    this.cleanupHandlers = [];
  }
}
