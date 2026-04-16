/**
 * Node.js配置提供者
 * 收集Node.js运行时环境信息
 */

import type { Platform, DeviceInfo } from '../../core/types';
import type { ConfigProvider } from '../../adapter/types';
import os from 'os';
import crypto from 'crypto';

/** Node.js配置提供者 */
export class NodeConfigProvider implements ConfigProvider {
  async getDeviceInfo(): Promise<DeviceInfo> {
    // 生成设备ID（基于主机名和进程ID）
    const deviceId = this.generateDeviceId();

    // 收集Node.js环境信息
    const envInfo = this.collectEnvInfo();

    return {
      deviceId,
      platform: 'nodejs' as Platform,
      os: envInfo.platform,
      osVersion: envInfo.release,
      // Node.js特有信息
      nodeVersion: envInfo.nodeVersion,
      arch: envInfo.arch,
      cpus: envInfo.cpus?.length,
      memory: envInfo.totalMemory,
      hostname: envInfo.hostname,
    };
  }

  /** 生成设备ID */
  private generateDeviceId(): string {
    try {
      const hostname = os.hostname();
      const pid = process.pid;
      const hash = crypto.createHash('md5').update(`${hostname}-${pid}`).digest('hex');
      return `node-${hash}`;
    } catch (e) {
      return `node-${process.pid}-${Date.now()}`;
    }
  }

  /** 收集环境信息 */
  private collectEnvInfo(): {
    platform: string;
    release: string;
    nodeVersion: string;
    arch: string;
    cpus?: unknown[];
    totalMemory?: number;
    hostname?: string;
  } {
    const info: {
      platform: string;
      release: string;
      nodeVersion: string;
      arch: string;
      cpus?: unknown[];
      totalMemory?: number;
      hostname?: string;
    } = {
      platform: process.platform,
      release: os.release(),
      nodeVersion: process.version,
      arch: process.arch,
    };

    try {
      info.cpus = os.cpus();
      info.totalMemory = os.totalmem();
      info.hostname = os.hostname();
    } catch (e) {
      // 忽略错误
    }

    return info;
  }

  async getUserId(): Promise<string | undefined> {
    // Node.js环境中，用户ID可能来自环境变量或配置文件
    return process.env.USER_ID || process.env.USER || undefined;
  }

  async getAnonymousId(): Promise<string | undefined> {
    // Node.js环境中，匿名ID可以基于机器标识生成
    try {
      const machineId = os.hostname() + os.arch() + os.platform();
      return crypto.createHash('md5').update(machineId).digest('hex');
    } catch (e) {
      return undefined;
    }
  }
}
