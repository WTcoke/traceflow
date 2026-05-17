/**
 * Web 平台入口
 * 用于 CDN 和独立 Web 应用
 */
export { TraceSDK } from './src/core/SDK';
export {
  WebNetworkAdapter,
  WebStorageAdapter,
  localStorageAdapter,
  sessionStorageAdapter,
  WebConfigProvider,
} from './src/platform/web';
export { WebTestClickPlugin } from './src/plugins/web/WebTestClickPlugin';
export { BasePlugin } from './src/core/BasePlugin';
import { TraceSDK } from './src/core/SDK';
import type { SDKConfig } from './src/core/types';
import { WebLifecycleReporter } from './src/platform/web/WebLifecycleReporter';
import { WebNetworkAdapter } from './src/platform/web/WebNetworkAdapter';
import type { WebOptions } from './src/platform/web/types';

export interface WebSDKConfig extends SDKConfig {
  web?: WebOptions;
}

export async function initWeb(config: WebSDKConfig): Promise<TraceSDK> {
  const sdk = await TraceSDK.init(config);

  if (config.web?.useBeaconOnUnload === true) {
    const reporter = sdk.getReportManager();
    const networkAdapter = sdk.getNetworkAdapter();

    if (networkAdapter instanceof WebNetworkAdapter) {
      const lifecycleReporter = new WebLifecycleReporter(reporter, networkAdapter, config.web);
      lifecycleReporter.start();
      const destroy = sdk.destroy.bind(sdk);
      sdk.destroy = () => {
        lifecycleReporter.stop();
        destroy();
      };
    }
  }

  return sdk;
}
