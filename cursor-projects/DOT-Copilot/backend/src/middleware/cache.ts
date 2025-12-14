import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: any; expires: number }>();

interface CacheOptions {
  ttl?: number; // Time to live in seconds
  keyGenerator?: (req: Request) => string;
}

export const cacheMiddleware = (options: CacheOptions = {}) => {
  const { ttl = 60, keyGenerator } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = keyGenerator 
      ? keyGenerator(req)
      : `${req.method}:${req.originalUrl}`;

    const cached = cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return res.json(cached.data);
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      cache.set(key, {
        data,
        expires: Date.now() + ttl * 1000,
      });
      return originalJson(data);
    };

    next();
  };
};

export const clearCache = (pattern?: string) => {
  if (!pattern) {
    cache.clear();
    return;
  }

  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
};

// Clear cache on mutations
export const clearCacheOnMutation = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (data: any) {
    // Clear related cache entries
    if (req.path.includes('/users')) {
      clearCache('GET:/api/users');
    }
    if (req.path.includes('/fleets')) {
      clearCache('GET:/api/fleets');
    }
    if (req.path.includes('/training-programs')) {
      clearCache('GET:/api/training-programs');
    }
    // Add more patterns as needed
    return originalJson(data);
  };
  next();
};

