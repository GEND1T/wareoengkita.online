import { Request, Response, NextFunction } from 'express';

interface CacheEntry {
  data: any;
  expiry: number;
}

const memoryCache = new Map<string, CacheEntry>();

export const cacheMiddleware = (durationSeconds: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cached = memoryCache.get(key);

    // Only serve non-empty cached data if not expired
    if (
      cached &&
      Date.now() < cached.expiry &&
      cached.data?.success &&
      Array.isArray(cached.data?.data) &&
      cached.data.data.length > 0
    ) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (
        res.statusCode >= 200 &&
        res.statusCode < 300 &&
        body?.success &&
        Array.isArray(body?.data) &&
        body.data.length > 0
      ) {
        memoryCache.set(key, {
          data: body,
          expiry: Date.now() + durationSeconds * 1000,
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

export const clearCacheByPrefix = (prefix: string) => {
  for (const key of memoryCache.keys()) {
    if (key.includes(prefix)) {
      memoryCache.delete(key);
    }
  }
};

export const clearAllCache = () => {
  memoryCache.clear();
};
