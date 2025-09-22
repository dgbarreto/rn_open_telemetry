import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { trace } from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { BatchSpanProcessor, ConsoleSpanExporter, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';

// Simple console-only version to avoid network issues
export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  endpoint: string;
  apiKey?: string;
  environment?: string;
}

class TelemetryManager {
  private provider: WebTracerProvider | null = null;
  private isInitialized = false;
  private config: TelemetryConfig | null = null;

  public initialize(config: TelemetryConfig): void {
    if (this.isInitialized) {
      console.warn('Telemetry is already initialized');
      return;
    }

    this.config = config;

    try {
      // Create tracer provider
      this.provider = new WebTracerProvider();

      console.log(`🏷️ Service configured: ${config.serviceName}@${config.serviceVersion}`);

      // Create HTTP exporter for sending to telemetry service
      const baseHttpExporter = new OTLPTraceExporter({
        url: `${config.endpoint}/v1/traces`,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Wrap the exporter to add debugging
      const httpExporter = {
        export: (spans: any, resultCallback: any) => {
          console.log(`📤 [HTTP Export] CALLED! Attempting to send ${spans.length} spans`);
          console.log(`📤 [HTTP Export] Spans details:`, spans.map((s: any) => ({ 
            name: s.name, 
            traceId: s.traceId,
            spanId: s.spanId 
          })));
          
          return baseHttpExporter.export(spans, (result: any) => {
            console.log(`📤 [HTTP Export] Export result:`, result);
            if (result.code !== 0) {
              console.error(`❌ [HTTP Export] Export failed with code ${result.code}:`, result.error);
            } else {
              console.log(`✅ [HTTP Export] Export succeeded for ${spans.length} spans`);
            }
            resultCallback(result);
          });
        },
        shutdown: () => {
          console.log('🔽 [HTTP Export] Shutdown called');
          return baseHttpExporter.shutdown();
        },
      };

      console.log(`🌐 HTTP Exporter configured for: ${config.endpoint}/v1/traces`);

      // Create console exporter for local debugging
      const consoleExporter = new ConsoleSpanExporter();

      // Create span processors for both exporters - using SimpleSpanProcessor for immediate export
      const httpSpanProcessor = new SimpleSpanProcessor(httpExporter);

      const consoleSpanProcessor = new SimpleSpanProcessor(consoleExporter);

      console.log(`🚀 Using SimpleSpanProcessor for immediate export`);

      // Add both span processors
      (this.provider as any).addSpanProcessor(httpSpanProcessor);
      (this.provider as any).addSpanProcessor(consoleSpanProcessor);

      // Register the provider globally
      trace.setGlobalTracerProvider(this.provider);

      this.isInitialized = true;
      console.log('✅ OpenTelemetry initialized with HTTP and console exporters');
      console.log(`📡 Sending telemetry to: ${config.endpoint}/v1/traces`);
    } catch (error) {
      console.warn('⚠️ OpenTelemetry initialization failed:', error);
      this.isInitialized = true; // Still mark as initialized so app works
    }
  }

  public shutdown(): Promise<void> {
    if (!this.provider) {
      return Promise.resolve();
    }

    return this.provider.shutdown().then(() => {
      this.isInitialized = false;
      this.provider = null;
      console.log('OpenTelemetry shut down successfully');
    }).catch((error) => {
      console.error('Error during OpenTelemetry shutdown:', error);
      this.isInitialized = false;
      this.provider = null;
    });
  }

  public isReady(): boolean {
    return this.isInitialized;
  }

  public getConfig(): TelemetryConfig | null {
    return this.config;
  }
}

export const telemetryManager = new TelemetryManager();

// Default configuration for local development
export const defaultTelemetryConfig: TelemetryConfig = {
  serviceName: 'opentelemetry-rn-app',
  serviceVersion: '1.0.0',
  endpoint: 'http://10.0.2.2:4318', // Android emulator endpoint to local telemetry service
  environment: 'development',
};
