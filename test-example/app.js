const logPanel = document.getElementById('logPanel');
const status = document.getElementById('status');

const baseUrlInput = document.getElementById('baseUrl');
const appIdInput = document.getElementById('appId');
const eventNameInput = document.getElementById('eventName');
const eventPropsInput = document.getElementById('eventProps');

const initBtn = document.getElementById('initBtn');
const pageBtn = document.getElementById('pageBtn');
const trackBtn = document.getElementById('trackBtn');
const errorBtn = document.getElementById('errorBtn');
const healthBtn = document.getElementById('healthBtn');
const clearBtn = document.getElementById('clearBtn');

let sdkInstance = null;

function sdkApi() {
  // IIFE 构建后 window.TraceSDK 是包含导出的对象
  // 优先使用 initWeb（Web 平台专用入口）
  if (window.TraceSDK && typeof window.TraceSDK.initWeb === 'function') {
    return window.TraceSDK;
  }

  // 兜底：直接使用 TraceSDK 类
  if (window.TraceSDK && typeof window.TraceSDK.TraceSDK?.init === 'function') {
    return window.TraceSDK;
  }

  return null;
}

function setStatus(text) {
  status.textContent = `Status: ${text}`;
}

function log(message, payload) {
  const time = new Date().toLocaleTimeString();
  const lines = [`[${time}] ${message}`];

  if (payload !== undefined) {
    lines.push(typeof payload === 'string' ? payload : JSON.stringify(payload, null, 2));
  }

  logPanel.textContent = `${lines.join('\n')}\n\n${logPanel.textContent}`;
}

function parseProps() {
  try {
    return JSON.parse(eventPropsInput.value || '{}');
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
}

function requireSdk() {
  if (!sdkInstance) {
    throw new Error('SDK is not initialized yet.');
  }

  return sdkInstance;
}

async function initSdk() {
  const api = sdkApi();
  if (!api) {
    throw new Error('TraceSDK bundle was not loaded.');
  }

  // 使用 initWeb（Web 平台专用入口）
  sdkInstance = await api.initWeb({
    appId: appIdInput.value.trim(),
    baseUrl: baseUrlInput.value.trim(),
    debug: true,
    reportConfig: {
      batchSize: 1,
      flushInterval: 300,
    },
    onReady: () => log('sdk ready'),
    onReportSuccess: (event) =>
      log('report success', { eventId: event.eventId, eventType: event.eventType }),
    onReportFail: (event, error) =>
      log('report fail', {
        eventId: event.eventId,
        eventType: event.eventType,
        error: error.message,
      }),
  });
}

async function checkDocs() {
  const baseUrl = baseUrlInput.value.trim();
  // 如果 baseUrl 以 /api/v1 结尾，去掉它，然后拼接 /api/docs
  const url = baseUrl.replace(/\/api\/v1\/?$/, '') + '/api/docs';
  const response = await fetch(url);
  log('docs check', { url, status: response.status, ok: response.ok });
}

async function run(label, action) {
  try {
    await action();
    setStatus(`${label} success`);
  } catch (error) {
    setStatus(`${label} failed`);
    log(`${label} failed`, { error: error.message });
  }
}

initBtn.addEventListener('click', () => run('init', initSdk));

pageBtn.addEventListener('click', () =>
  run('page', async () => {
    // page(data?: Record<string, unknown>) - 传入对象
    requireSdk().page({
      pageUrl: window.location.pathname,
      pageTitle: document.title,
    });
    log('page sent');
  }),
);

trackBtn.addEventListener('click', () =>
  run('track', async () => {
    requireSdk().track(eventNameInput.value.trim() || 'static_page_probe', parseProps());
    log('track sent');
  }),
);

errorBtn.addEventListener('click', () =>
  run('error', async () => {
    requireSdk().error(new Error('Static page smoke error'), { source: 'test-example' });
    log('error sent');
  }),
);

healthBtn.addEventListener('click', () => run('docs', checkDocs));

clearBtn.addEventListener('click', () => {
  logPanel.textContent = '[clear] reset';
  setStatus('idle');
});
