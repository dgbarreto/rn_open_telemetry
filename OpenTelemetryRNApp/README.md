# OpenTelemetry React Native Demo App

This is a complete React Native application that demonstrates how to integrate OpenTelemetry for comprehensive event logging, tracing, and monitoring.

## Features

- ✅ Complete OpenTelemetry SDK integration
- ✅ Custom telemetry service for easy event logging
- ✅ User interaction tracking
- ✅ API call monitoring
- ✅ Error tracking and reporting
- ✅ Custom events and metrics
- ✅ Screen navigation tracking
- ✅ React Native compatible configuration

## Project Structure

```
OpenTelemetryRNApp/
├── src/
│   ├── config/
│   │   └── telemetry.ts          # OpenTelemetry configuration
│   ├── services/
│   │   └── TelemetryService.ts   # Custom telemetry service
│   └── components/
│       ├── Navigation.tsx        # Simple tab navigation
│       ├── HomeScreen.tsx        # Main demo screen
│       └── EventsScreen.tsx      # Events display screen
├── App.tsx                       # Main app component
├── index.ts                      # App entry point with polyfills
├── metro.config.js               # Metro bundler configuration
└── README.md                     # This file
```

## Dependencies

### Core Dependencies
- `@opentelemetry/api` - OpenTelemetry API
- `@opentelemetry/sdk-node` - Node.js SDK
- `@opentelemetry/exporter-trace-otlp-http` - HTTP trace exporter
- `@opentelemetry/exporter-metrics-otlp-http` - HTTP metrics exporter
- `@opentelemetry/instrumentation` - Instrumentation framework
- `@opentelemetry/resources` - Resource detection
- `@opentelemetry/semantic-conventions` - Semantic conventions

### React Native Polyfills
- `react-native-get-random-values` - Crypto polyfill
- `react-native-url-polyfill` - URL API polyfill
- `readable-stream` - Stream polyfill

## Installation

1. **Clone or create the project:**
   ```bash
   npx create-expo-app@latest OpenTelemetryRNApp --template blank-typescript
   cd OpenTelemetryRNApp
   ```

2. **Install dependencies:**
   ```bash
   npm install @opentelemetry/api @opentelemetry/sdk-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/exporter-metrics-otlp-http @opentelemetry/instrumentation @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/auto-instrumentations-node @opentelemetry/sdk-metrics react-native-get-random-values react-native-url-polyfill @react-native-async-storage/async-storage readable-stream
   ```

3. **Set up the source files** (copy the files from this project structure)

## Configuration

### Telemetry Configuration

The app is configured to send telemetry data to an OpenTelemetry Collector. You can modify the configuration in `src/config/telemetry.ts`:

```typescript
export const defaultTelemetryConfig: TelemetryConfig = {
  serviceName: 'opentelemetry-rn-app',
  serviceVersion: '1.0.0',
  endpoint: 'http://localhost:4318', // Change this to your collector endpoint
  environment: 'development',
};
```

### Setting up OpenTelemetry Collector (Optional)

For local testing, you can run an OpenTelemetry Collector using Docker:

1. **Create `docker-compose.yml`:**
   ```yaml
   version: '3.8'
   services:
     otel-collector:
       image: otel/opentelemetry-collector:latest
       command: ["--config=/etc/otel-collector-config.yaml"]
       volumes:
         - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
       ports:
         - "4317:4317"   # OTLP gRPC receiver
         - "4318:4318"   # OTLP HTTP receiver
       depends_on:
         - jaeger

     jaeger:
       image: jaegertracing/all-in-one:latest
       ports:
         - "16686:16686"
         - "14250:14250"
       environment:
         - COLLECTOR_OTLP_ENABLED=true
   ```

2. **Create `otel-collector-config.yaml`:**
   ```yaml
   receivers:
     otlp:
       protocols:
         grpc:
           endpoint: 0.0.0.0:4317
         http:
           endpoint: 0.0.0.0:4318

   processors:
     batch:

   exporters:
     jaeger:
       endpoint: jaeger:14250
       tls:
         insecure: true
     logging:
       loglevel: debug

   service:
     pipelines:
       traces:
         receivers: [otlp]
         processors: [batch]
         exporters: [jaeger, logging]
       metrics:
         receivers: [otlp]
         processors: [batch]
         exporters: [logging]
   ```

3. **Run the collector:**
   ```bash
   docker-compose up -d
   ```

4. **Access Jaeger UI at:** http://localhost:16686

## Running the App

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Run on your preferred platform:**
   - **iOS Simulator:** Press `i`
   - **Android Emulator:** Press `a`
   - **Web Browser:** Press `w`

## Features Overview

### 1. User Interaction Tracking
- Button clicks with component and screen context
- Text input milestone tracking
- Navigation between screens

### 2. API Call Monitoring
- Simulated API calls with success/failure scenarios
- Duration tracking
- Status code logging
- Error reporting

### 3. Error Tracking
- Automatic error capture with stack traces
- Custom error categorization
- Screen context for errors

### 4. Custom Events
- Screen view tracking
- Application lifecycle events
- Business logic events

### 5. Telemetry Service API

The `TelemetryService` provides easy-to-use methods:

```typescript
import { telemetryService } from './src/services/TelemetryService';

// Log user interactions
telemetryService.logUserInteraction({
  action: 'click',
  component: 'submit_button',
  screen: 'checkout',
  metadata: { order_id: '12345' }
});

// Log API calls
telemetryService.logApiCall({
  method: 'POST',
  url: 'https://api.example.com/orders',
  statusCode: 201,
  duration: 450
});

// Log errors
telemetryService.logError({
  errorType: 'ValidationError',
  message: 'Invalid email format',
  screen: 'registration'
});

// Log custom events
telemetryService.logCustomEvent({
  name: 'feature_used',
  category: 'engagement',
  metadata: { feature_name: 'dark_mode' }
});
```

## Troubleshooting

### Common Issues

1. **Metro bundler errors with OpenTelemetry:**
   - Ensure `metro.config.js` is properly configured
   - Check that all polyfills are installed

2. **Polyfill issues:**
   - Make sure polyfills are imported in `index.ts` before other imports
   - Verify `react-native-get-random-values` and `react-native-url-polyfill` are installed

3. **Network errors:**
   - Check if the OpenTelemetry Collector endpoint is accessible
   - For iOS Simulator, use `localhost`
   - For Android Emulator, use `10.0.2.2` instead of `localhost`

### Network Configuration for Android

If testing on Android emulator, update the endpoint in `telemetry.ts`:

```typescript
export const defaultTelemetryConfig: TelemetryConfig = {
  serviceName: 'opentelemetry-rn-app',
  serviceVersion: '1.0.0',
  endpoint: 'http://10.0.2.2:4318', // Use 10.0.2.2 for Android emulator
  environment: 'development',
};
```

## Production Considerations

1. **Environment Configuration:**
   - Use environment variables for endpoints
   - Configure different settings for dev/staging/production

2. **Performance:**
   - Implement sampling for high-traffic applications
   - Use batch exporters for better performance

3. **Privacy:**
   - Be mindful of PII in telemetry data
   - Implement data sanitization

4. **Error Handling:**
   - Ensure telemetry failures don't crash the app
   - Implement fallback mechanisms

## Next Steps

- Integrate with your preferred observability platform (Jaeger, Zipkin, etc.)
- Add custom instrumentation for specific business logic
- Implement user session tracking
- Add performance metrics
- Set up alerting based on telemetry data

## License

This project is provided as an educational example for integrating OpenTelemetry with React Native.
