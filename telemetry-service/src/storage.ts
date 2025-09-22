export interface TelemetrySpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operationName: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: string;
  attributes: Record<string, any>;
  events: Array<{
    name: string;
    timestamp: number;
    attributes?: Record<string, any>;
  }>;
  serviceName: string;
  timestamp: string;
}

export interface TelemetryStats {
  totalSpans: number;
  uniqueServices: number;
  uniqueOperations: number;
  timeRange: {
    earliest: string | null;
    latest: string | null;
  };
  topOperations: Array<{
    name: string;
    count: number;
  }>;
  errorCount: number;
  successCount: number;
}

export class TelemetryStorage {
  private spans: TelemetrySpan[] = [];
  private maxSpans: number = 10000; // Keep last 10k spans

  public addSpan(span: TelemetrySpan): void {
    this.spans.push(span);
    
    // Keep only the most recent spans
    if (this.spans.length > this.maxSpans) {
      this.spans = this.spans.slice(-this.maxSpans);
    }
  }

  public getAllSpans(): TelemetrySpan[] {
    return [...this.spans].reverse(); // Most recent first
  }

  public getSpansByService(serviceName: string): TelemetrySpan[] {
    return this.spans.filter(span => span.serviceName === serviceName);
  }

  public getSpansByOperation(operationName: string): TelemetrySpan[] {
    return this.spans.filter(span => span.operationName === operationName);
  }

  public getTotalSpans(): number {
    return this.spans.length;
  }

  public getStats(): TelemetryStats {
    if (this.spans.length === 0) {
      return {
        totalSpans: 0,
        uniqueServices: 0,
        uniqueOperations: 0,
        timeRange: { earliest: null, latest: null },
        topOperations: [],
        errorCount: 0,
        successCount: 0
      };
    }

    const services = new Set(this.spans.map(s => s.serviceName));
    const operations = new Map<string, number>();
    let errorCount = 0;
    let successCount = 0;

    // Count operations and errors
    this.spans.forEach(span => {
      const opName = span.operationName;
      operations.set(opName, (operations.get(opName) || 0) + 1);
      
      if (span.status === 'ERROR' || span.status === 'error') {
        errorCount++;
      } else {
        successCount++;
      }
    });

    // Sort operations by count
    const topOperations = Array.from(operations.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Time range
    const timestamps = this.spans.map(s => s.timestamp).sort();
    
    return {
      totalSpans: this.spans.length,
      uniqueServices: services.size,
      uniqueOperations: operations.size,
      timeRange: {
        earliest: timestamps[0] || null,
        latest: timestamps[timestamps.length - 1] || null
      },
      topOperations,
      errorCount,
      successCount
    };
  }

  public clear(): void {
    this.spans = [];
  }

  public getRecentSpans(limit: number = 50): TelemetrySpan[] {
    return this.spans.slice(-limit).reverse();
  }
}
