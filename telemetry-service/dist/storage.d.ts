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
export declare class TelemetryStorage {
    private spans;
    private maxSpans;
    addSpan(span: TelemetrySpan): void;
    getAllSpans(): TelemetrySpan[];
    getSpansByService(serviceName: string): TelemetrySpan[];
    getSpansByOperation(operationName: string): TelemetrySpan[];
    getTotalSpans(): number;
    getStats(): TelemetryStats;
    clear(): void;
    getRecentSpans(limit?: number): TelemetrySpan[];
}
//# sourceMappingURL=storage.d.ts.map