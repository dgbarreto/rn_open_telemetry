"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelemetryStorage = void 0;
class TelemetryStorage {
    constructor() {
        this.spans = [];
        this.maxSpans = 10000; // Keep last 10k spans
    }
    addSpan(span) {
        this.spans.push(span);
        // Keep only the most recent spans
        if (this.spans.length > this.maxSpans) {
            this.spans = this.spans.slice(-this.maxSpans);
        }
    }
    getAllSpans() {
        return [...this.spans].reverse(); // Most recent first
    }
    getSpansByService(serviceName) {
        return this.spans.filter(span => span.serviceName === serviceName);
    }
    getSpansByOperation(operationName) {
        return this.spans.filter(span => span.operationName === operationName);
    }
    getTotalSpans() {
        return this.spans.length;
    }
    getStats() {
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
        const operations = new Map();
        let errorCount = 0;
        let successCount = 0;
        // Count operations and errors
        this.spans.forEach(span => {
            const opName = span.operationName;
            operations.set(opName, (operations.get(opName) || 0) + 1);
            if (span.status === 'ERROR' || span.status === 'error') {
                errorCount++;
            }
            else {
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
    clear() {
        this.spans = [];
    }
    getRecentSpans(limit = 50) {
        return this.spans.slice(-limit).reverse();
    }
}
exports.TelemetryStorage = TelemetryStorage;
//# sourceMappingURL=storage.js.map