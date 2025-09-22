"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const winston_1 = require("winston");
const storage_1 = require("./storage");
const otlp_processor_1 = require("./otlp-processor");
// Create logger
const logger = (0, winston_1.createLogger)({
    level: 'info',
    format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.colorize(), winston_1.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })),
    transports: [
        new winston_1.transports.Console(),
        new winston_1.transports.File({ filename: 'telemetry-service.log' })
    ]
});
class TelemetryService {
    constructor(port = 4318) {
        this.app = (0, express_1.default)();
        this.port = port;
        this.storage = new storage_1.TelemetryStorage();
        this.otlpProcessor = new otlp_processor_1.OTLPProcessor(this.storage, logger);
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Serve static files (dashboard)
        this.app.use(express_1.default.static('public'));
        // Enable CORS for React Native
        this.app.use((0, cors_1.default)({
            origin: ['http://localhost:8081', 'http://10.0.2.2:8081', 'exp://127.0.0.1:8081'],
            methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
            credentials: true
        }));
        // Body parsers
        this.app.use(body_parser_1.default.json({ limit: '10mb' }));
        this.app.use(body_parser_1.default.raw({ type: 'application/x-protobuf', limit: '10mb' }));
        // Request logging
        this.app.use((req, res, next) => {
            logger.info(`${req.method} ${req.path}`, {
                headers: req.headers,
                body: req.method === 'POST' ? req.body : undefined
            });
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                totalSpans: this.storage.getTotalSpans()
            });
        });
        // OTLP Traces endpoint
        this.app.post('/v1/traces', async (req, res) => {
            try {
                logger.info('Received traces data');
                await this.otlpProcessor.processTraces(req.body);
                res.status(200).json({ success: true });
            }
            catch (error) {
                logger.error('Error processing traces:', error);
                res.status(500).json({ error: 'Failed to process traces' });
            }
        });
        // OTLP Metrics endpoint (for future use)
        this.app.post('/v1/metrics', async (req, res) => {
            try {
                logger.info('Received metrics data');
                await this.otlpProcessor.processMetrics(req.body);
                res.status(200).json({ success: true });
            }
            catch (error) {
                logger.error('Error processing metrics:', error);
                res.status(500).json({ error: 'Failed to process metrics' });
            }
        });
        // Get all telemetry data (for debugging)
        this.app.get('/telemetry/spans', (req, res) => {
            const spans = this.storage.getAllSpans();
            res.json({
                total: spans.length,
                spans: spans.slice(0, 100) // Limit to last 100 spans
            });
        });
        // Get telemetry stats
        this.app.get('/telemetry/stats', (req, res) => {
            const stats = this.storage.getStats();
            res.json(stats);
        });
        // Clear all telemetry data
        this.app.delete('/telemetry/clear', (req, res) => {
            this.storage.clear();
            logger.info('Cleared all telemetry data');
            res.json({ success: true, message: 'All telemetry data cleared' });
        });
        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'OpenTelemetry Receiver',
                version: '1.0.0',
                endpoints: {
                    health: '/health',
                    traces: '/v1/traces',
                    metrics: '/v1/metrics',
                    spans: '/telemetry/spans',
                    stats: '/telemetry/stats',
                    clear: '/telemetry/clear'
                }
            });
        });
    }
    start() {
        this.app.listen(this.port, '0.0.0.0', () => {
            logger.info(`🚀 Telemetry Service running on port ${this.port}`);
            logger.info(`🌐 Dashboard: http://localhost:${this.port}`);
            logger.info(`📊 Health check: http://localhost:${this.port}/health`);
            logger.info(`📈 View spans: http://localhost:${this.port}/telemetry/spans`);
            logger.info(`📋 View stats: http://localhost:${this.port}/telemetry/stats`);
            logger.info(`🔄 OTLP endpoint: http://localhost:${this.port}/v1/traces`);
        });
    }
}
// Start the service
const service = new TelemetryService(4318);
service.start();
// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully');
    process.exit(0);
});
//# sourceMappingURL=index.js.map