import { Logger } from 'winston';
import { TelemetryStorage } from './storage';
export declare class OTLPProcessor {
    private storage;
    private logger;
    constructor(storage: TelemetryStorage, logger: Logger);
    processTraces(data: any): Promise<void>;
    processMetrics(data: any): Promise<void>;
    private extractServiceName;
    private convertSpan;
    private nanosToMillis;
    private bytesToHex;
    private extractStatus;
    private extractAttributes;
    private extractEvents;
}
//# sourceMappingURL=otlp-processor.d.ts.map