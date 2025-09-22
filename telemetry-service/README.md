# OpenTelemetry Local Service

A local Node.js service that receives and displays OpenTelemetry data from your React Native app.

## Features

- ✅ **OTLP HTTP Receiver** - Receives traces and metrics
- ✅ **Real-time Dashboard** - Web interface to view telemetry data
- ✅ **Data Storage** - In-memory storage with stats and filtering
- ✅ **REST API** - Endpoints to query telemetry data
- ✅ **Auto-refresh** - Real-time updates in the dashboard

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the service:**
   ```bash
   npm run dev
   ```

3. **Open the dashboard:**
   ```
   http://localhost:4318
   ```

## Endpoints

### OpenTelemetry Endpoints
- `POST /v1/traces` - Receive OTLP trace data
- `POST /v1/metrics` - Receive OTLP metrics data

### API Endpoints
- `GET /` - Service info and available endpoints
- `GET /health` - Health check with service stats
- `GET /telemetry/spans` - Get all spans (latest 100)
- `GET /telemetry/stats` - Get telemetry statistics
- `DELETE /telemetry/clear` - Clear all stored data

### Dashboard
- `GET /` - Interactive web dashboard

## Configuration

The service runs on port **4318** by default (standard OTLP HTTP port).

For Android emulator, the React Native app should use endpoint:
```
http://10.0.2.2:4318
```

For iOS simulator, use:
```
http://localhost:4318
```

## Dashboard Features

The web dashboard provides:

1. **Statistics Overview**
   - Total spans received
   - Number of unique services
   - Number of unique operations
   - Success/error counts

2. **Recent Spans View**
   - Span names and durations
   - Service information
   - Status (OK/ERROR)
   - Detailed attributes
   - Timestamps

3. **Real-time Updates**
   - Auto-refresh every 5 seconds
   - Manual refresh button
   - Clear all data option

## Data Flow

```
React Native App → OpenTelemetry SDK → HTTP Request → Local Service → Dashboard
```

1. React Native app generates telemetry events
2. OpenTelemetry SDK batches and sends via HTTP
3. Local service receives and processes OTLP data
4. Data is stored in memory and displayed in dashboard
5. Dashboard auto-refreshes to show latest data

## Example Usage

1. **Start the telemetry service:**
   ```bash
   npm run dev
   ```

2. **Open dashboard in browser:**
   ```
   http://localhost:4318
   ```

3. **Run your React Native app** and interact with it

4. **Watch real-time telemetry data** appear in the dashboard

## Development

- `npm run dev` - Start with hot reload
- `npm run build` - Build TypeScript
- `npm start` - Start built version

## Sample API Responses

### GET /telemetry/stats
```json
{
  "totalSpans": 42,
  "uniqueServices": 1,
  "uniqueOperations": 8,
  "timeRange": {
    "earliest": "2025-09-22T14:30:00.000Z",
    "latest": "2025-09-22T14:35:00.000Z"
  },
  "topOperations": [
    { "name": "user_interaction.click", "count": 15 },
    { "name": "screen_view", "count": 8 }
  ],
  "errorCount": 2,
  "successCount": 40
}
```

### GET /telemetry/spans
```json
{
  "total": 42,
  "spans": [
    {
      "traceId": "abc123...",
      "spanId": "def456...",
      "operationName": "user_interaction.click",
      "serviceName": "opentelemetry-rn-app",
      "duration": 1.2,
      "status": "OK",
      "attributes": {
        "user.action": "click",
        "ui.component": "increment_button"
      },
      "timestamp": "2025-09-22T14:35:00.000Z"
    }
  ]
}
```

## Troubleshooting

### Common Issues

1. **React Native app can't connect:**
   - Make sure the service is running on port 4318
   - For Android emulator, use `10.0.2.2:4318`
   - For iOS simulator, use `localhost:4318`

2. **No data appearing:**
   - Check if telemetry is initialized in React Native app
   - Verify endpoint configuration matches
   - Check browser console for errors

3. **CORS errors:**
   - Service is configured for React Native origins
   - Restart service if needed

### Logs

The service logs all activities to:
- Console (with colors)
- `telemetry-service.log` file

Look for entries like:
```
📊 Processed span: user_interaction.click (1.2ms) - OK
```

## Next Steps

- Connect to external observability platforms (Jaeger, Zipkin)
- Add persistent storage (Redis, PostgreSQL)
- Implement data retention policies
- Add alerting capabilities
- Export data to external systems
