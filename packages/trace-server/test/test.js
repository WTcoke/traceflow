import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 500 },
    { duration: '60s', target: 800 },
    { duration: '60s', target: 1000 },
    { duration: '20s', target: 0 },
  ],

  thresholds: {
    http_req_duration: ['p(95)<100'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:3000/api/v1';

function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function generateEvent() {
  return {
    msgId: generateId('msg'),

    deviceId: generateId('device'),

    userId: generateId('user'),

    eventTime: Date.now(),

    eventType: 'behavior',

    platform: 'web',

    data: {
      page: '/home',

      action: 'click',
    },
  };
}

function generateBatch() {
  const count = Math.floor(Math.random() * 20) + 5;

  return Array.from({ length: count }, generateEvent);
}

export default function () {
  const isBatch = Math.random() > 0.4;

  let res;

  if (isBatch) {
    res = http.post(
      `${BASE_URL}/collect`,
      JSON.stringify({
        appId: 'test-app-2025',
        events: generateBatch(),
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } else {
    res = http.post(
      `${BASE_URL}/collect`,
      JSON.stringify({
        appId: 'test-app-2025',
        events: [generateEvent()],
      }),
      {
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }

  check(res, {
    'status ok': (r) => r.status === 200 || r.status === 201,
  });

  sleep(Math.random() * 1 + 0.5);
}
