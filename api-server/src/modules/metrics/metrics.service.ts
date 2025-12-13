import { Injectable } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  constructor(
    @InjectMetric('http_request_duration_seconds')
    public readonly httpRequestDuration: Histogram<string>,
    @InjectMetric('http_requests_total')
    public readonly httpRequestsTotal: Counter<string>,
    @InjectMetric('http_errors_total')
    public readonly httpErrorsTotal: Counter<string>,
    @InjectMetric('photos_uploaded_total')
    public readonly photosUploadedTotal: Counter<string>,
    @InjectMetric('events_created_total')
    public readonly eventsCreatedTotal: Counter<string>,
    @InjectMetric('users_registered_total')
    public readonly usersRegisteredTotal: Counter<string>,
    @InjectMetric('active_events_count')
    public readonly activeEventsCount: Gauge<string>,
    @InjectMetric('login_attempts_total')
    public readonly loginAttemptsTotal: Counter<string>,
    @InjectMetric('login_errors_total')
    public readonly loginErrorsTotal: Counter<string>,
  ) {}

  // HTTP Metrics
  recordHttpRequest(method: string, path: string, status: number, duration: number) {
    const labels = { method, path: this.normalizePath(path), status: status.toString() };
    this.httpRequestDuration.observe(labels, duration);
    this.httpRequestsTotal.inc(labels);
  }

  recordHttpError(method: string, path: string, status: number, errorType: string) {
    this.httpErrorsTotal.inc({
      method,
      path: this.normalizePath(path),
      status: status.toString(),
      error_type: errorType,
    });
  }

  // Business Metrics
  recordPhotoUpload(type: 'raw' | 'edited') {
    this.photosUploadedTotal.inc({ type });
  }

  recordEventCreated() {
    this.eventsCreatedTotal.inc();
  }

  recordUserRegistered() {
    this.usersRegisteredTotal.inc();
  }

  setActiveEventsCount(count: number) {
    this.activeEventsCount.set(count);
  }

  // Auth Metrics
  recordLoginAttempt(status: 'success' | 'failure') {
    this.loginAttemptsTotal.inc({ status });
  }

  recordLoginError(reason: 'user_not_found' | 'invalid_password' | 'account_suspended' | 'no_password') {
    this.loginErrorsTotal.inc({ reason });
  }

  // Helper to normalize paths (remove dynamic segments like IDs)
  private normalizePath(path: string): string {
    // Replace UUIDs with :id placeholder
    return path
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      // Replace numeric IDs with :id placeholder
      .replace(/\/\d+/g, '/:id');
  }
}

