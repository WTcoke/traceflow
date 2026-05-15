/**
 * 平台适配器工厂
 * 根据平台类型创建对应的网络适配器、存储适配器和配置提供者
 */

import type { Platform, SDKConfig, StorageConfig } from '../core/types';
import type { INetworkAdapter, IStorageAdapter, ConfigProvider } from './types';

// 从各平台模块引入适配器
import { WeixinNetworkAdapter, WeixinStorageAdapter } from '../platform/weixin';
import { AlipayNetworkAdapter, AlipayStorageAdapter } from '../platform/alipay';
import { BaiduNetworkAdapter, BaiduStorageAdapter } from '../platform/baidu';
import { ToutiaoNetworkAdapter, ToutiaoStorageAdapter } from '../platform/toutiao';
import { NodeNetworkAdapter, NodeStorageAdapter } from '../platform/nodejs';
import { WebNetworkAdapter, WebStorageAdapter, WebConfigProvider } from '../platform/web';

// 从平台模块引入配置提供者
import { WeixinConfigProvider } from '../platform/weixin';
import { AlipayConfigProvider } from '../platform/alipay';
import { BaiduConfigProvider } from '../platform/baidu';
import { ToutiaoConfigProvider } from '../platform/toutiao';
import { NodeConfigProvider } from '../platform/nodejs';

// 引入平台检测
import { detectPlatform } from '../platform/detector';

/** 平台适配器工厂 */
export class PlatformAdapterFactory {
  /**
   * 创建网络适配器
   */
  static createNetworkAdapter(platform: Platform, config: SDKConfig): INetworkAdapter | undefined {
    const serverUrl = config.serverUrl || '';

    switch (platform) {
      case 'miniapp-weixin':
        return new WeixinNetworkAdapter(serverUrl);
      case 'miniapp-alipay':
        return new AlipayNetworkAdapter(serverUrl);
      case 'miniapp-baidu':
        return new BaiduNetworkAdapter(serverUrl);
      case 'miniapp-toutiao':
        return new ToutiaoNetworkAdapter(serverUrl);
      case 'nodejs':
        return new NodeNetworkAdapter(serverUrl);
      case 'web':
        return new WebNetworkAdapter(config);
      default:
        return undefined;
    }
  }

  /**
   * 创建存储适配器
   */
  static createStorageAdapter(
    platform: Platform,
    config: StorageConfig,
  ): IStorageAdapter | undefined {
    const prefix = config.prefix ?? 'trace_';

    switch (platform) {
      case 'miniapp-weixin':
        return new WeixinStorageAdapter('local', prefix);
      case 'miniapp-baidu':
        return new BaiduStorageAdapter(prefix);
      case 'miniapp-toutiao':
        return new ToutiaoStorageAdapter(prefix);
      case 'miniapp-alipay':
        return new AlipayStorageAdapter(prefix);
      case 'nodejs':
        return new NodeStorageAdapter(prefix);
      case 'web':
        return new WebStorageAdapter('local', prefix);
      default:
        return undefined;
    }
  }

  /**
   * 创建配置提供者
   */
  static createConfigProvider(
    platform: Platform,
    storageAdapter?: IStorageAdapter,
  ): ConfigProvider {
    switch (platform) {
      case 'miniapp-weixin':
        return new WeixinConfigProvider();
      case 'miniapp-alipay':
        return new AlipayConfigProvider();
      case 'miniapp-baidu':
        return new BaiduConfigProvider();
      case 'miniapp-toutiao':
        return new ToutiaoConfigProvider();
      case 'nodejs':
        return new NodeConfigProvider();
      case 'web':
        return new WebConfigProvider(storageAdapter);
      default:
        return new WebConfigProvider(storageAdapter);
    }
  }

  /**
   * 根据平台创建所有适配器
   */
  static createAllAdapters(
    platform: Platform,
    sdkConfig: SDKConfig,
  ): {
    networkAdapter?: INetworkAdapter;
    storageAdapter?: IStorageAdapter;
    configProvider: ConfigProvider;
  } {
    const networkAdapter = this.createNetworkAdapter(platform, sdkConfig);
    const storageAdapter = this.createStorageAdapter(platform, sdkConfig.storageConfig || {});
    const configProvider = this.createConfigProvider(platform, storageAdapter);

    return {
      networkAdapter,
      storageAdapter,
      configProvider,
    };
  }

  /**
   * 检测平台并创建适配器
   */
  static createAdaptersByDetection(sdkConfig: SDKConfig): {
    networkAdapter?: INetworkAdapter;
    storageAdapter?: IStorageAdapter;
    configProvider: ConfigProvider;
    platform: Platform;
  } {
    const platform = sdkConfig.platform || detectPlatform();
    const adapters = this.createAllAdapters(platform, sdkConfig);

    return {
      ...adapters,
      platform,
    };
  }
}
