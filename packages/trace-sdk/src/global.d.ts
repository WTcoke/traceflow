/**
 * 全局类型声明文件
 * 声明小程序、浏览器、Node.js 等环境的全局变量
 */

// 微信小程序全局对象
declare interface Wx {
  request: (options: {
    url: string;
    method?: string;
    header?: Record<string, string>;
    data?: string;
    success?: (res: { statusCode: number }) => void;
    fail?: (err: { errMsg?: string }) => void;
  }) => void;
  getStorageSync: (key: string) => unknown;
  setStorageSync: (key: string, data: unknown) => void;
  removeStorageSync: (key: string) => void;
  getStorageInfoSync: () => { keys: string[] };
  getSystemInfoSync: () => {
    screenWidth?: number;
    screenHeight?: number;
    platform?: string;
    system?: string;
    language?: string;
    SDKVersion?: string;
    version?: string;
    brand?: string;
    model?: string;
  };
}

// 支付宝小程序全局对象
declare interface My {
  httpRequest: (options: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    data?: string;
    success?: (res: { status: number }) => void;
    fail?: (err: { errorMessage?: string; errMsg?: string }) => void;
  }) => void;
  getStorage: (options: { key: string }) => { data: unknown };
  setStorage: (options: { key: string; data: unknown }) => void;
  removeStorage: (options: { key: string }) => void;
  clearStorage: () => void;
  getStorageInfoSync?: () => { keys: string[] };
  getSystemInfo?: (options: {
    success?: (info: {
      platform?: string;
      system?: string;
      language?: string;
      version?: string;
    }) => void;
  }) => void;
}

// 百度小程序全局对象
declare interface Swan {
  request: (options: {
    url: string;
    method?: string;
    header?: Record<string, string>;
    data?: string;
    success?: (res: { statusCode: number }) => void;
    fail?: (err: { errMsg?: string }) => void;
  }) => void;
  getStorageSync: (key: string) => unknown;
  setStorageSync: (key: string, data: unknown) => void;
  removeStorageSync: (key: string) => void;
  getStorageInfoSync: () => { keys: string[] };
  getSystemInfoSync: () => {
    screenWidth?: number;
    screenHeight?: number;
    platform?: string;
    system?: string;
    language?: string;
    SDKVersion?: string;
    version?: string;
    brand?: string;
    model?: string;
  };
}

// 头条小程序全局对象
declare interface Tt {
  request: (options: {
    url: string;
    method?: string;
    header?: Record<string, string>;
    data?: string;
    success?: (res: { statusCode: number }) => void;
    fail?: (err: { errMsg?: string }) => void;
  }) => void;
  getStorageSync: (key: string) => unknown;
  setStorageSync: (key: string, data: unknown) => void;
  removeStorageSync: (key: string) => void;
  getStorageInfoSync: () => { keys: string[] };
  getSystemInfoSync: () => {
    screenWidth?: number;
    screenHeight?: number;
    platform?: string;
    system?: string;
    language?: string;
    SDKVersion?: string;
    version?: string;
    brand?: string;
    model?: string;
  };
}

// 全局变量声明
declare global {
  // 微信小程序
  const wx: Wx | undefined;
  // 支付宝小程序
  const my: My | undefined;
  // 百度小程序
  const swan: Swan | undefined;
  // 头条小程序
  const tt: Tt | undefined;
  // Node.js global 对象（兼容旧代码）
  // eslint-disable-next-line no-var
  var global: typeof globalThis | undefined;
}

export {};
