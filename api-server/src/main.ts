import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MetricsService } from './modules/metrics/metrics.service';
import { HttpMetricsInterceptor } from './modules/metrics/http-metrics.interceptor';
import { ErrorMetricsFilter } from './modules/metrics/error-metrics.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get metrics service instance
  const metricsService = app.get(MetricsService);
  
  // Register global metrics interceptor and error filter
  app.useGlobalInterceptors(new HttpMetricsInterceptor(metricsService));
  app.useGlobalFilters(new ErrorMetricsFilter(metricsService));
  
  app.enableCors();
  await app.listen(3000);
  
  console.log('🚀 API Server running on http://localhost:3000');
  console.log('📊 Metrics available at http://localhost:3000/metrics');
}
bootstrap();
