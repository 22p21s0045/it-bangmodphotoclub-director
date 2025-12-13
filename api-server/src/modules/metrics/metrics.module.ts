import { Module } from '@nestjs/common';
import {
  PrometheusModule,
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
} from '@willsoto/nestjs-prometheus';
import { MetricsService } from './metrics.service';

@Module({
  imports: [
    PrometheusModule.register({
      defaultMetrics: {
        enabled: true,
      },
      path: '/metrics',
    }),
  ],
  providers: [
    MetricsService,
    // HTTP Request Duration Histogram
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    }),
    // HTTP Request Counter
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),
    // HTTP Error Counter
    makeCounterProvider({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'path', 'status', 'error_type'],
    }),
    // Business Metrics
    makeCounterProvider({
      name: 'photos_uploaded_total',
      help: 'Total number of photos uploaded',
      labelNames: ['type'],
    }),
    makeCounterProvider({
      name: 'events_created_total',
      help: 'Total number of events created',
    }),
    makeCounterProvider({
      name: 'users_registered_total',
      help: 'Total number of users registered',
    }),
    makeGaugeProvider({
      name: 'active_events_count',
      help: 'Current number of active events',
    }),
    // Auth Metrics
    makeCounterProvider({
      name: 'login_attempts_total',
      help: 'Total number of login attempts',
      labelNames: ['status'],
    }),
    makeCounterProvider({
      name: 'login_errors_total',
      help: 'Total number of login errors',
      labelNames: ['reason'],
    }),
  ],
  exports: [MetricsService],
})
export class MetricsModule {}
