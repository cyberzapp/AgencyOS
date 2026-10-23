import { ApiEnvelope, ErrorLogEntry } from "@/types/agency";

export type ServiceName =
  | "firebase_auth"
  | "firestore_db"
  | "gcp_pubsub"
  | "gcp_storage"
  | "gemini_ai"
  | "api_gateway";

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitStatus {
  state: CircuitState;
  failureCount: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  fallbackInvocations: number;
}

const FAILURE_THRESHOLD = 3;
const RECOVERY_WINDOW_MS = 30_000;

class ResilientCircuitRegistry {
  private circuits: Map<ServiceName, CircuitStatus> = new Map();
  private recentErrors: ErrorLogEntry[] = [];

  constructor() {
    const services: ServiceName[] = [
      "firebase_auth",
      "firestore_db",
      "gcp_pubsub",
      "gcp_storage",
      "gemini_ai",
      "api_gateway",
    ];
    for (const s of services) {
      this.circuits.set(s, {
        state: "CLOSED",
        failureCount: 0,
        lastFailureAt: null,
        lastSuccessAt: Date.now(),
        fallbackInvocations: 0,
      });
    }
  }

  public getStatus(service: ServiceName): CircuitStatus {
    const current = this.circuits.get(service) || {
      state: "CLOSED",
      failureCount: 0,
      lastFailureAt: null,
      lastSuccessAt: null,
      fallbackInvocations: 0,
    };

    if (
      current.state === "OPEN" &&
      current.lastFailureAt &&
      Date.now() - current.lastFailureAt > RECOVERY_WINDOW_MS
    ) {
      current.state = "HALF_OPEN";
      this.circuits.set(service, current);
    }

    return current;
  }

  public recordSuccess(service: ServiceName): void {
    const current = this.getStatus(service);
    current.state = "CLOSED";
    current.failureCount = 0;
    current.lastSuccessAt = Date.now();
    this.circuits.set(service, current);
  }

  public recordFailure(
    service: ServiceName,
    code: string,
    message: string,
    fallbackAction: string
  ): void {
    const current = this.getStatus(service);
    current.failureCount += 1;
    current.lastFailureAt = Date.now();
    current.fallbackInvocations += 1;

    if (current.failureCount >= FAILURE_THRESHOLD) {
      current.state = "OPEN";
    }
    this.circuits.set(service, current);

    const entry: ErrorLogEntry = {
      id: `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 5)
        .toUpperCase()}`,
      code,
      service,
      message,
      fallbackAction,
      resolvedByFallback: true,
      timestamp: new Date().toISOString(),
    };

    this.recentErrors.unshift(entry);
    if (this.recentErrors.length > 50) {
      this.recentErrors.pop();
    }
  }

  public recordFallbackInvocation(service: ServiceName): void {
    const current = this.getStatus(service);
    current.fallbackInvocations += 1;
    this.circuits.set(service, current);
  }

  public getAllStatuses(): Record<ServiceName, CircuitStatus> {
    const out = {} as Record<ServiceName, CircuitStatus>;
    for (const key of this.circuits.keys()) {
      out[key] = this.getStatus(key);
    }
    return out;
  }

  public getRecentErrors(): ErrorLogEntry[] {
    return [...this.recentErrors];
  }
}

export const circuitRegistry = new ResilientCircuitRegistry();

/**
 * Executes a cloud operation with timeout, retry backoff, and circuit-breaker
 * protection. Automatically falls back to `fallbackFn` so the request never crashes.
 */
export async function withResilientFallback<T>(options: {
  service: ServiceName;
  operationName: string;
  isCloudConfigured: boolean;
  primaryFn: () => Promise<T>;
  fallbackFn: () => Promise<T> | T;
  maxRetries?: number;
  timeoutMs?: number;
}): Promise<{
  result: T;
  fallbackUsed: boolean;
  provider: "firebase_gcp_cloud" | "resilient_local_engine";
  latencyMs: number;
}> {
  const start = Date.now();
  const maxRetries = options.maxRetries ?? 2;
  const timeoutMs = options.timeoutMs ?? 3500;

  if (!options.isCloudConfigured) {
    circuitRegistry.recordFallbackInvocation(options.service);
    const result = await options.fallbackFn();
    return {
      result,
      fallbackUsed: true,
      provider: "resilient_local_engine",
      latencyMs: Math.max(1, Date.now() - start),
    };
  }

  const circuit = circuitRegistry.getStatus(options.service);
  if (circuit.state === "OPEN") {
    circuitRegistry.recordFallbackInvocation(options.service);
    const result = await options.fallbackFn();
    return {
      result,
      fallbackUsed: true,
      provider: "resilient_local_engine",
      latencyMs: Math.max(1, Date.now() - start),
    };
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race<T>([
        options.primaryFn(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(
                  `Timeout (${timeoutMs}ms) exceeded for ${options.service}:${options.operationName}`
                )
              ),
            timeoutMs
          )
        ),
      ]);
      circuitRegistry.recordSuccess(options.service);
      return {
        result,
        fallbackUsed: false,
        provider: "firebase_gcp_cloud",
        latencyMs: Math.max(1, Date.now() - start),
      };
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const backoffMs = Math.min(400, 80 * Math.pow(2, attempt));
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  const errMsg =
    lastError instanceof Error ? lastError.message : "Unknown upstream cloud error";
  circuitRegistry.recordFailure(
    options.service,
    "UPSTREAM_DEGRADED",
    `${options.operationName}: ${errMsg}`,
    `Executed resilient fallback for ${options.operationName}`
  );

  const fallbackResult = await options.fallbackFn();
  return {
    result: fallbackResult,
    fallbackUsed: true,
    provider: "resilient_local_engine",
    latencyMs: Math.max(1, Date.now() - start),
  };
}

export function createApiResponse<T>(params: {
  data: T;
  latencyMs?: number;
  fallbackUsed?: boolean;
  provider?: "firebase_gcp_cloud" | "resilient_local_engine";
}): ApiEnvelope<T> {
  return {
    success: true,
    data: params.data,
    meta: {
      requestId: `req_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      latencyMs: params.latencyMs ?? 4,
      provider: params.provider ?? "resilient_local_engine",
      fallbackUsed: params.fallbackUsed ?? true,
    },
  };
}

export function createApiError<T = never>(params: {
  code: string;
  message: string;
  details?: string;
  recoverable?: boolean;
  latencyMs?: number;
}): ApiEnvelope<T> {
  return {
    success: false,
    error: {
      code: params.code,
      message: params.message,
      details: params.details,
      recoverable: params.recoverable ?? true,
    },
    meta: {
      requestId: `req_${Date.now().toString(36)}_${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      latencyMs: params.latencyMs ?? 2,
      provider: "resilient_local_engine",
      fallbackUsed: true,
    },
  };
}
