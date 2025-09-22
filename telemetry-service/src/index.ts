import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createLogger, format, transports } from 'winston';
import { TelemetryStorage } from './storage';
import { OTLPProcessor } from './otlp-processor';

// Create logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'telemetry-service.log' })
  ]
});

class TelemetryService {
  private app: express.Application;
  private storage: TelemetryStorage;
  private otlpProcessor: OTLPProcessor;
  private port: number;

  constructor(port: number = 4318) {
    this.app = express();
    this.port = port;
    this.storage = new TelemetryStorage();
    this.otlpProcessor = new OTLPProcessor(this.storage, logger);
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    // Serve static files (dashboard)
    this.app.use(express.static('public'));

    // Enable CORS for React Native
    this.app.use(cors({
      origin: ['http://localhost:8081', 'http://10.0.2.2:8081', 'exp://127.0.0.1:8081'],
      methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      credentials: true
    }));

    // Log ALL incoming requests before body parsing
    this.app.use((req, res, next) => {
      console.log(`📥 INCOMING REQUEST: ${req.method} ${req.path}`);
      console.log(`Headers:`, req.headers);
      next();
    });

    // Body parsers with error handling
    this.app.use(bodyParser.json({ 
      limit: '10mb',
      type: 'application/json'
    }));
    this.app.use(bodyParser.raw({ 
      type: 'application/x-protobuf', 
      limit: '10mb' 
    }));
    
    // Request logging after parsing
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        headers: req.headers,
        body: req.method === 'POST' ? req.body : undefined
      });
      next();
    });

    // Global error handler for body parsing errors
    this.app.use((error: any, req: any, res: any, next: any) => {
      if (error instanceof SyntaxError) {
        console.log(`❌ Body parsing error for ${req.method} ${req.path}:`, error.message);
        return res.status(400).json({ error: 'Invalid JSON in request body' });
      }
      next(error);
    });
  }

  private setupRoutes(): void {
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
        console.log("🔥 === TRACES ENDPOINT HIT ===");
        console.log("Request received at:", new Date().toISOString());
        console.log("Request headers:", req.headers);
        console.log("Request body type:", typeof req.body);
        console.log("Request body length:", JSON.stringify(req.body).length);
        
        logger.info('📊 Received traces data', { 
          contentType: req.headers['content-type'],
          bodySize: JSON.stringify(req.body).length 
        });
        
        await this.otlpProcessor.processTraces(req.body);
        console.log("✅ Traces processed successfully");
        res.status(200).json({ success: true });
      } catch (error) {
        console.error("❌ Error processing traces:", error);
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
      } catch (error) {
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

  public start(): void {
    this.app.listen(this.port, '0.0.0.0', () => {
      console.log('🚀🚀🚀 === TELEMETRY SERVICE STARTED === 🚀🚀🚀');
      console.log(`📡 Server listening on: http://0.0.0.0:${this.port}`);
      console.log(`📡 Local access: http://localhost:${this.port}`);
      console.log(`📡 Android emulator access: http://10.0.2.2:${this.port}`);
      console.log('================================================');
      
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
