import { generateId } from './uuid';
import type { IStorageAdapter } from '../adapter/types';
import { WebStorageAdapter } from '../platform/web/WebStorageAdapter';

/**
 * 会话管理
 * 负责会话 ID 的生成、维护和过期管理
 */

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟无活动视为新会话

interface SessionData {
  id: string;
  createdAt: number;
  lastActiveAt: number;
}

class SessionManager {
  private session: SessionData;
  private storageKey: string = 'session';
  private storageAdapter: IStorageAdapter;

  constructor(storageAdapter?: IStorageAdapter) {
    this.storageAdapter = storageAdapter || new WebStorageAdapter('local');
    this.session = this.loadSession();
  }

  /**
   * 获取当前会话 ID
   */
  getSessionId(): string {
    this.updateActivity();
    return this.session.id;
  }

  /**
   * 获取会话信息
   */
  getSessionInfo(): { id: string; duration: number; isNew: boolean } {
    return {
      id: this.session.id,
      duration: Date.now() - this.session.createdAt,
      isNew: Date.now() - this.session.lastActiveAt < 1000,
    };
  }

  /**
   * 更新会话活跃时间
   */
  private updateActivity(): void {
    const now = Date.now();
    if (now - this.session.lastActiveAt > SESSION_TIMEOUT) {
      // 超时，创建新会话
      this.session = {
        id: `sess_${generateId()}`,
        createdAt: now,
        lastActiveAt: now,
      };
    } else {
      this.session.lastActiveAt = now;
    }
  }

  /**
   * 加载会话
   */
  private loadSession(): SessionData {
    if (typeof window === 'undefined') {
      return this.createNewSession();
    }

    try {
      const key = this.storageKey;
      const data = this.storageAdapter.get(key);
      if (data) {
        const session = JSON.parse(data) as SessionData;
        // 检查是否过期
        if (Date.now() - session.lastActiveAt < SESSION_TIMEOUT) {
          return session;
        }
      }
    } catch {
      // 忽略解析错误
    }

    return this.createNewSession();
  }

  /**
   * 创建新会话
   */
  private createNewSession(): SessionData {
    return {
      id: `sess_${generateId()}`,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    };
  }

  /**
   * 重置会话
   */
  reset(): void {
    this.session = this.createNewSession();
  }
}

// 导出单例
let instance: SessionManager | null = null;

export function getSessionManager(storageAdapter?: IStorageAdapter): SessionManager {
  if (!instance) {
    instance = new SessionManager(storageAdapter);
  }
  return instance;
}

export { SessionManager };
