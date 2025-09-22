"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTLPProcessor = void 0;
class OTLPProcessor {
    constructor(storage, logger) {
        this.storage = storage;
        this.logger = logger;
    }
    async processTraces(data) {
        try {
            this.logger.info('Processing OTLP traces data', {
                dataType: typeof data,
                hasResourceSpans: !!data?.resourceSpans,
                dataKeys: Object.keys(data || {})
            });
            if (!data || !data.resourceSpans) {
                this.logger.warn('No resourceSpans found in traces data');
                return;
            }
            for (const resourceSpan of data.resourceSpans) {
                const serviceName = this.extractServiceName(resourceSpan.resource);
                if (!resourceSpan.scopeSpans) {
                    this.logger.warn('No scopeSpans found in resourceSpan');
                    continue;
                }
                for (const scopeSpan of resourceSpan.scopeSpans) {
                    if (!scopeSpan.spans) {
                        this.logger.warn('No spans found in scopeSpan');
                        continue;
                    }
                    for (const span of scopeSpan.spans) {
                        const telemetrySpan = this.convertSpan(span, serviceName);
                        this.storage.addSpan(telemetrySpan);
                        this.logger.info('📊 Processed span', {
                            traceId: telemetrySpan.traceId,
                            spanId: telemetrySpan.spanId,
                            operationName: telemetrySpan.operationName,
                            serviceName: telemetrySpan.serviceName,
                            duration: `${telemetrySpan.duration}ms`,
                            status: telemetrySpan.status,
                            attributes: telemetrySpan.attributes
                        });
                    }
                }
            }
        }
        catch (error) {
            this.logger.error('Error processing traces:', error);
            throw error;
        }
    }
    async processMetrics(data) {
        this.logger.info('📈 Received metrics data', { data });
        // For now, just log metrics - can be extended later
    }
    extractServiceName(resource) {
        if (!resource || !resource.attributes) {
            return 'unknown-service';
        }
        // Look for service.name attribute
        for (const attr of resource.attributes) {
            if (attr.key === 'service.name') {
                return attr.value?.stringValue || 'unknown-service';
            }
        }
        return 'unknown-service';
    }
    convertSpan(span, serviceName) {
        // Convert timestamps from nanoseconds to milliseconds
        const startTimeMs = this.nanosToMillis(span.startTimeUnixNano);
        const endTimeMs = this.nanosToMillis(span.endTimeUnixNano);
        return {
            traceId: this.bytesToHex(span.traceId),
            spanId: this.bytesToHex(span.spanId),
            parentSpanId: span.parentSpanId ? this.bytesToHex(span.parentSpanId) : undefined,
            operationName: span.name || 'unknown-operation',
            startTime: startTimeMs,
            endTime: endTimeMs,
            duration: endTimeMs - startTimeMs,
            status: this.extractStatus(span.status),
            attributes: this.extractAttributes(span.attributes),
            events: this.extractEvents(span.events),
            serviceName,
            timestamp: new Date(startTimeMs).toISOString()
        };
    }
    nanosToMillis(nanos) {
        if (typeof nanos === 'string') {
            return Math.floor(parseInt(nanos) / 1000000);
        }
        return Math.floor(nanos / 1000000);
    }
    bytesToHex(bytes) {
        if (typeof bytes === 'string') {
            return bytes;
        }
        if (!bytes || bytes.length === 0) {
            return '';
        }
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }
    extractStatus(status) {
        if (!status)
            return 'OK';
        // OTLP status codes: 0=UNSET, 1=OK, 2=ERROR
        switch (status.code) {
            case 0: return 'UNSET';
            case 1: return 'OK';
            case 2: return 'ERROR';
            default: return 'UNKNOWN';
        }
    }
    extractAttributes(attributes) {
        if (!attributes)
            return {};
        const result = {};
        for (const attr of attributes) {
            if (!attr.key)
                continue;
            const value = attr.value;
            if (!value)
                continue;
            // Extract value based on type
            if (value.stringValue !== undefined) {
                result[attr.key] = value.stringValue;
            }
            else if (value.intValue !== undefined) {
                result[attr.key] = parseInt(value.intValue);
            }
            else if (value.doubleValue !== undefined) {
                result[attr.key] = value.doubleValue;
            }
            else if (value.boolValue !== undefined) {
                result[attr.key] = value.boolValue;
            }
            else {
                result[attr.key] = JSON.stringify(value);
            }
        }
        return result;
    }
    extractEvents(events) {
        if (!events)
            return [];
        return events.map(event => ({
            name: event.name || 'unknown-event',
            timestamp: this.nanosToMillis(event.timeUnixNano),
            attributes: this.extractAttributes(event.attributes)
        }));
    }
}
exports.OTLPProcessor = OTLPProcessor;
//# sourceMappingURL=otlp-processor.js.map