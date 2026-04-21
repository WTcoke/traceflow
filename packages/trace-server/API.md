# TraceFlow API Documentation

## Base URL

```
http://localhost:3000/api
```

## Swagger UI

```
http://localhost:3000/api/docs
```

---

## Endpoints

### 1. Single Event Track

**POST** `/track`

Submit a single tracking event.

**Request Body:**

```json
{
  "eventId": "550e8400-e29b-41d4-a716-446655440000",
  "eventType": "track",
  "eventName": "button_click",
  "timestamp": 1713001234567,
  "userId": "user-123",
  "anonymousId": "anon-456",
  "sessionId": "sess-789",
  "deviceInfo": {
    "deviceId": "device-001",
    "platform": "web",
    "userAgent": "Mozilla/5.0...",
    "screenWidth": 1920,
    "screenHeight": 1080,
    "os": "Windows",
    "osVersion": "10",
    "browser": "Chrome",
    "browserVersion": "120.0",
    "language": "zh-CN",
    "timezone": "Asia/Shanghai",
    "networkType": "WiFi",
    "appVersion": "1.0.0",
    "sdkVersion": "1.0.0",
    "channel": "App Store"
  },
  "url": "https://example.com/page",
  "title": "首页",
  "referrer": "https://google.com",
  "properties": { "buttonName": "提交" },
  "priority": "normal"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "eventId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

### 2. Batch Event Track

**POST** `/track/batch`

Submit multiple tracking events at once. Maximum 100 events per batch.

**Request Body:**

```json
{
  "events": [
    {
      "eventId": "event-001",
      "eventType": "track",
      "timestamp": 1713001234567,
      "anonymousId": "anon-456",
      "sessionId": "sess-789",
      "deviceInfo": {
        "deviceId": "device-001",
        "platform": "web"
      }
    },
    {
      "eventId": "event-002",
      "eventType": "page",
      "timestamp": 1713001235000,
      "anonymousId": "anon-456",
      "sessionId": "sess-789",
      "deviceInfo": {
        "deviceId": "device-001",
        "platform": "web"
      }
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "accepted": 2,
    "rejected": 0,
    "errors": []
  }
}
```

---

### 3. Get Event by ID

**GET** `/track/{id}`

Retrieve a single event by its ID.

**Path Parameters:**

| Parameter | Type   | Description                                      |
| --------- | ------ | ------------------------------------------------ |
| id        | string | Event ID (eventId or database auto-increment ID) |

**Query Parameters:**

| Parameter | Type   | Default | Description         |
| --------- | ------ | ------- | ------------------- |
| idType    | string | eventId | `eventId` or `dbId` |

**Example:** `GET /track/550e8400-e29b-41d4-a716-446655440000?idType=eventId`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "1",
    "eventId": "550e8400-e29b-41d4-a716-446655440000",
    "eventType": "page",
    "eventName": null,
    "timestamp": "1713001234567",
    "userId": "user-123",
    "anonymousId": "anon-456",
    "sessionId": "sess-789",
    "url": "https://example.com/page",
    "title": "首页",
    "referrer": "https://google.com",
    "deviceInfo": {
      "deviceId": "device-001",
      "platform": "web"
    },
    "properties": { "key": "value" },
    "priority": "normal",
    "createdAt": "1713001235000"
  }
}
```

**Response (404):**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}
```

---

### 4. Simple Statistics

**GET** `/track/analytics/simple-stats`

Get aggregated statistics for tracking events within a time range.

**Query Parameters:**

| Parameter | Type   | Required | Description                     |
| --------- | ------ | -------- | ------------------------------- |
| startTime | number | Yes      | Start timestamp in milliseconds |
| endTime   | number | Yes      | End timestamp in milliseconds   |
| userId    | string | No       | Filter by user ID               |
| eventType | string | No       | Filter by event type            |

**Example:** `GET /track/analytics/simple-stats?startTime=0&endTime=9999999999999`

**Response (200):**

```json
{
  "success": true,
  "data": {
    "totalEvents": 1234567,
    "byEventType": {
      "track": 500000,
      "page": 600000,
      "error": 100000,
      "identify": 34567,
      "custom": 0
    },
    "byPlatform": {
      "web": 800000,
      "miniapp-weixin": 400000,
      "miniapp-alipay": 34567
    },
    "uniqueUsers": 50000,
    "uniqueSessions": 120000
  }
}
```

---

## Field Enums

### EventType

| Value    | Description   |
| -------- | ------------- |
| track    | Custom event  |
| page     | Page view     |
| error    | Error event   |
| identify | User identity |
| custom   | Custom event  |

### Platform

| Value           | Description            |
| --------------- | ---------------------- |
| web             | Web browser            |
| miniapp-weixin  | WeChat Mini Program    |
| miniapp-alipay  | Alipay Mini Program    |
| miniapp-baidu   | Baidu Mini Program     |
| miniapp-toutiao | ByteDance Mini Program |
| nodejs          | Node.js server         |

### Priority

| Value    | Description     |
| -------- | --------------- |
| critical | High priority   |
| normal   | Normal priority |
| low      | Low priority    |

---

## Error Responses

**400 Bad Request:**

```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Validation failed"
  }
}
```

**404 Not Found:**

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Event not found"
  }
}
```

**500 Internal Server Error:**

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Internal server error"
  }
}
```
