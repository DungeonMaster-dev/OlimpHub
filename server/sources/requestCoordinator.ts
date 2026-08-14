type RequestCoordinatorOptions = {
  minIntervalMs: number;
  now?: () => number;
  sleep?: (milliseconds: number) => Promise<void>;
};

type RequestOptions = {
  cacheKey: string;
  cacheTtlMs: number;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const defaultSleep = (milliseconds: number) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

export class SourceRequestCoordinator {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private nextRequestAt = 0;
  private readonly now: () => number;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(private readonly options: RequestCoordinatorOptions) {
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
  }

  async run<T>(request: RequestOptions, load: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(request.cacheKey) as
      | CacheEntry<T>
      | undefined;
    if (cached && cached.expiresAt > this.now()) return cached.value;
    if (cached) this.cache.delete(request.cacheKey);

    const existing = this.inFlight.get(request.cacheKey) as
      | Promise<T>
      | undefined;
    if (existing) return existing;

    const pending = this.execute(request, load);
    this.inFlight.set(request.cacheKey, pending);
    try {
      return await pending;
    } finally {
      if (this.inFlight.get(request.cacheKey) === pending) {
        this.inFlight.delete(request.cacheKey);
      }
    }
  }

  private async execute<T>(
    request: RequestOptions,
    load: () => Promise<T>
  ): Promise<T> {
    const current = this.now();
    const delay = Math.max(0, this.nextRequestAt - current);
    this.nextRequestAt =
      Math.max(current, this.nextRequestAt) + this.options.minIntervalMs;
    if (delay) await this.sleep(delay);
    const result = await load();
    if (request.cacheTtlMs > 0) {
      this.cache.set(request.cacheKey, {
        value: result,
        expiresAt: this.now() + request.cacheTtlMs,
      });
    }
    return result;
  }
}

export function stableRequestCacheKey(
  method: string,
  params: Record<string, string>
) {
  return `${method}?${Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
    )
    .join("&")}`;
}
