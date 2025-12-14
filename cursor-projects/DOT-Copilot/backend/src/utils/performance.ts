import { Request, Response, NextFunction } from 'express';

export interface PerformanceMetrics {
  requestCount: number;
  totalResponseTime: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  errorCount: number;
}

const metrics: Map<string, PerformanceMetrics> = new Map();

export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const route = `${req.method} ${req.route?.path || req.path}`;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    let routeMetrics = metrics.get(route);
    if (!routeMetrics) {
      routeMetrics = {
        requestCount: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        errorCount: 0,
      };
      metrics.set(route, routeMetrics);
    }

    routeMetrics.requestCount++;
    routeMetrics.totalResponseTime += duration;
    routeMetrics.averageResponseTime = routeMetrics.totalResponseTime / routeMetrics.requestCount;
    routeMetrics.minResponseTime = Math.min(routeMetrics.minResponseTime, duration);
    routeMetrics.maxResponseTime = Math.max(routeMetrics.maxResponseTime, duration);

    if (statusCode >= 400) {
      routeMetrics.errorCount++;
    }

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${route} took ${duration}ms`);
    }
  });

  next();
};

export const getMetrics = (): Record<string, PerformanceMetrics> => {
  const result: Record<string, PerformanceMetrics> = {};
  for (const [route, routeMetrics] of metrics.entries()) {
    result[route] = { ...routeMetrics };
  }
  return result;
};

export const resetMetrics = () => {
  metrics.clear();
};

