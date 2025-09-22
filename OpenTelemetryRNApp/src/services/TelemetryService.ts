import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';
import type { Span, Tracer } from '@opentelemetry/api';

export interface EventAttributes {
  [key: string]: string | number | boolean | undefined;
}

export interface UserInteractionEvent {
  type: 'user_interaction';
  action: string;
  component: string;
  screen?: string;
  userId?: string;
  metadata?: EventAttributes;
}

export interface ApiCallEvent {
  type: 'api_call';
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  error?: string;
  metadata?: EventAttributes;
}

export interface ErrorEvent {
  type: 'error';
  errorType: string;
  message: string;
  stack?: string;
  screen?: string;
  userId?: string;
  metadata?: EventAttributes;
}

export interface CustomEvent {
  type: 'custom';
  name: string;
  category?: string;
  metadata?: EventAttributes;
}

export type TelemetryEvent = UserInteractionEvent | ApiCallEvent | ErrorEvent | CustomEvent;

class TelemetryService {
  private tracer: Tracer;
  private readonly serviceName = 'opentelemetry-rn-app';

  constructor() {
    this.tracer = trace.getTracer(this.serviceName, '1.0.0');
  }

  /**
   * Log a user interaction event
   */
  public logUserInteraction(event: Omit<UserInteractionEvent, 'type'>): void {
    console.log(`🔍 [Telemetry] Creating span for user interaction: ${event.action}`);
    
    const span = this.tracer.startSpan(`user_interaction.${event.action}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'user.action': event.action,
        'ui.component': event.component,
        'ui.screen': event.screen || 'unknown',
        'user.id': event.userId || 'anonymous',
        ...this.flattenMetadata(event.metadata),
      },
    });

    console.log(`📊 [Telemetry] Span created with ID: ${span.spanContext().spanId}`);

    span.addEvent('user_interaction', {
      component: event.component,
      action: event.action,
      timestamp: Date.now(),
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    console.log(`✅ [Telemetry] Span ended and should be exported: ${event.action} on ${event.component}`);
    
    // Manual export since automatic export isn't working
    this.manualExportSpan(span, `user_interaction.${event.action}`, {
      'user.action': event.action,
      'ui.component': event.component,
      'ui.screen': event.screen || 'unknown',
      'user.id': event.userId || 'anonymous',
    });
  }

  /**
   * Test connectivity by sending a simple span
   */
  public testConnectivity(): void {
    console.log('🧪 [Telemetry] Testing connectivity...');
    
    // First, test direct HTTP connectivity
    this.testDirectHttp();
    
    const span = this.tracer.startSpan('connectivity_test', {
      kind: SpanKind.CLIENT,
      attributes: {
        'test.type': 'connectivity',
        'test.timestamp': Date.now(),
      },
    });

    console.log(`📊 [Telemetry] Test span created with ID: ${span.spanContext().spanId}`);

    span.addEvent('test_event', {
      message: 'Testing telemetry connectivity',
      timestamp: Date.now(),
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    console.log('🚀 [Telemetry] Test span created and ended');
    
    // Manual export for the test span
    this.manualExportSpan(span, 'connectivity_test', {
      'test.type': 'connectivity',
      'test.timestamp': Date.now(),
    });
    
    // Try to force export by getting the provider and manually flushing
    setTimeout(() => {
      console.log('🔄 [Telemetry] Attempting manual flush...');
      const provider = trace.getTracerProvider() as any;
      if (provider && provider.forceFlush) {
        provider.forceFlush().then(() => {
          console.log('✅ [Telemetry] Manual flush completed');
        }).catch((error: any) => {
          console.error('❌ [Telemetry] Manual flush failed:', error);
        });
      } else {
        console.log('⚠️ [Telemetry] No forceFlush method available');
      }
    }, 500);
  }

  /**
   * Manually export span data since automatic export isn't working
   */
  private async manualExportSpan(span: Span, spanName: string, attributes: Record<string, any>): Promise<void> {
    try {
      const spanContext = span.spanContext();
      const now = Date.now();
      
      const otlpData = {
        resourceSpans: [{
          resource: {
            attributes: [{
              key: 'service.name',
              value: { stringValue: 'opentelemetry-rn-app' }
            }, {
              key: 'service.version', 
              value: { stringValue: '1.0.0' }
            }]
          },
          scopeSpans: [{
            scope: { 
              name: this.serviceName,
              version: '1.0.0'
            },
            spans: [{
              traceId: spanContext.traceId,
              spanId: spanContext.spanId,
              name: spanName,
              kind: 1, // CLIENT
              startTimeUnixNano: String(now * 1000000),
              endTimeUnixNano: String((now + 100) * 1000000),
              attributes: Object.entries(attributes).map(([key, value]) => ({
                key,
                value: { stringValue: String(value) }
              })),
              status: { code: 1 } // OK
            }]
          }]
        }]
      };

      console.log(`🚀 [Manual Export] Sending span: ${spanName}`);
      
      const response = await fetch('http://10.0.2.2:4318/v1/traces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otlpData)
      });
      
      if (response.ok) {
        console.log(`✅ [Manual Export] Successfully sent span: ${spanName}`);
      } else {
        console.error(`❌ [Manual Export] Failed to send span: ${response.status}`);
      }
      
    } catch (error) {
      console.error(`❌ [Manual Export] Error sending span:`, error);
    }
  }

  private async testDirectHttp(): Promise<void> {
    try {
      console.log('🌐 [Direct HTTP] Testing direct connectivity to telemetry service...');
      
      // Test health endpoint
      const response = await fetch('http://10.0.2.2:4318/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`🌐 [Direct HTTP] Health check response: ${response.status}`);
      const text = await response.text();
      console.log(`🌐 [Direct HTTP] Health check body:`, text);
      
      // Test traces endpoint with dummy data
      console.log('🌐 [Direct HTTP] Testing traces endpoint...');
      const tracesResponse = await fetch('http://10.0.2.2:4318/v1/traces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceSpans: [{
            resource: {
              attributes: [{
                key: 'service.name',
                value: { stringValue: 'test-rn-app' }
              }]
            },
            scopeSpans: [{
              scope: { name: 'manual-test' },
              spans: [{
                traceId: '12345678901234567890123456789012',
                spanId: '1234567890123456',
                name: 'manual-test-span',
                kind: 1,
                startTimeUnixNano: String(Date.now() * 1000000),
                endTimeUnixNano: String((Date.now() + 1000) * 1000000),
                status: { code: 1 }
              }]
            }]
          }]
        })
      });
      
      console.log(`🌐 [Direct HTTP] Traces response: ${tracesResponse.status}`);
      const tracesText = await tracesResponse.text();
      console.log(`🌐 [Direct HTTP] Traces body:`, tracesText);
      
    } catch (error) {
      console.error('❌ [Direct HTTP] Test failed:', error);
    }
  }

  /**
   * Log an API call event
   */
  public logApiCall(event: Omit<ApiCallEvent, 'type'>): void {
    const spanName = `api_call.${event.method.toUpperCase()}_${this.getPathFromUrl(event.url)}`;
    
    const span = this.tracer.startSpan(spanName, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': event.method,
        'http.url': event.url,
        'http.status_code': event.statusCode,
        'http.duration_ms': event.duration,
        ...this.flattenMetadata(event.metadata),
      },
    });

    if (event.error) {
      span.recordException(new Error(event.error));
      span.setStatus({ code: SpanStatusCode.ERROR, message: event.error });
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
    }

    span.addEvent('api_call', {
      method: event.method,
      url: event.url,
      status_code: event.statusCode,
      timestamp: Date.now(),
    });

    span.end();

    console.log(`[Telemetry] API Call: ${event.method} ${event.url} - ${event.statusCode || 'pending'}`);
  }

  /**
   * Log an error event
   */
  public logError(event: Omit<ErrorEvent, 'type'>): void {
    const span = this.tracer.startSpan(`error.${event.errorType}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'error.type': event.errorType,
        'error.message': event.message,
        'error.screen': event.screen || 'unknown',
        'user.id': event.userId || 'anonymous',
        ...this.flattenMetadata(event.metadata),
      },
    });

    const error = new Error(event.message);
    if (event.stack) {
      error.stack = event.stack;
    }

    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: event.message });

    span.addEvent('error_occurred', {
      error_type: event.errorType,
      message: event.message,
      timestamp: Date.now(),
    });

    span.end();

    console.error(`[Telemetry] Error: ${event.errorType} - ${event.message}`);
  }

  /**
   * Log a custom event
   */
  public logCustomEvent(event: Omit<CustomEvent, 'type'>): void {
    const span = this.tracer.startSpan(`custom.${event.name}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'custom.name': event.name,
        'custom.category': event.category || 'general',
        ...this.flattenMetadata(event.metadata),
      },
    });

    span.addEvent('custom_event', {
      name: event.name,
      category: event.category || 'general',
      timestamp: Date.now(),
    });

    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    console.log(`[Telemetry] Custom Event: ${event.name}`);
  }

  /**
   * Create a span for tracking a specific operation
   */
  public async trackOperation<T>(
    operationName: string,
    operation: (span: Span) => Promise<T> | T,
    attributes?: EventAttributes
  ): Promise<T> {
    const span = this.tracer.startSpan(operationName, {
      kind: SpanKind.CLIENT,
      attributes: this.flattenMetadata(attributes),
    });

    try {
      const result = await Promise.resolve(operation(span));
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ 
        code: SpanStatusCode.ERROR, 
        message: (error as Error).message 
      });
      throw error;
    } finally {
      span.end();
    }
  }

  /**
   * Start a span manually (remember to call end() on it)
   */
  public startSpan(name: string, attributes?: EventAttributes): Span {
    return this.tracer.startSpan(name, {
      kind: SpanKind.CLIENT,
      attributes: this.flattenMetadata(attributes),
    });
  }

  /**
   * Helper method to flatten metadata for OpenTelemetry attributes
   */
  private flattenMetadata(metadata?: EventAttributes): Record<string, string | number | boolean> {
    if (!metadata) return {};
    
    const flattened: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined) {
        flattened[key] = value;
      }
    }
    return flattened;
  }

  /**
   * Extract path from URL for span naming
   */
  private getPathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.replace(/\//g, '_').replace(/^_/, '') || 'root';
    } catch {
      return 'invalid_url';
    }
  }
}

// Export singleton instance
export const telemetryService = new TelemetryService();

// Helper functions for common use cases
export const trackUserClick = (component: string, screen?: string, metadata?: EventAttributes) => {
  telemetryService.logUserInteraction({
    action: 'click',
    component,
    screen,
    metadata,
  });
};

export const trackScreenView = (screenName: string, metadata?: EventAttributes) => {
  telemetryService.logCustomEvent({
    name: 'screen_view',
    category: 'navigation',
    metadata: {
      screen_name: screenName,
      ...metadata,
    },
  });
};

export const trackApiError = (url: string, method: string, error: string, statusCode?: number) => {
  telemetryService.logApiCall({
    url,
    method,
    error,
    statusCode,
  });
};
