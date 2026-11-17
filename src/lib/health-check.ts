import { validateMonitorTarget } from "./validateUrl";

export interface HealthCheckResult {
  status: "success" | "failure";
  statusCode: number | null;
  responseTime: number;
  errorMessage: string | null;
}

interface HealthCheckOptions {
  url: string;
  timeout: number;
  expectedStatusCodes?: number[];
}

export async function performHealthCheck({
  url,
  timeout,
  expectedStatusCodes = [200],
}: HealthCheckOptions): Promise<HealthCheckResult> {
  const startTime = Date.now();

  try {
    const validation = await validateMonitorTarget(url);

    if (!validation.valid) {
      return {
        status: "failure",
        statusCode: null,
        responseTime: Date.now() - startTime,
        errorMessage: validation.message,
      };
    }

    const controller = new AbortController();//! use for cansel request to handel request time

    const timeoutId = setTimeout(() => {
      controller.abort();  //! if get request  take extra time abort the request
    }, timeout);

    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,  //! without it contoller.abort() not work
        cache: "no-store",
      });

      const responseTime = Date.now() - startTime;

      const isSuccess = expectedStatusCodes.includes(response.status);

      return {
        status: isSuccess ? "success" : "failure",
        statusCode: response.status,
        responseTime,
        errorMessage: isSuccess
          ? null
          : `Unexpected HTTP status: ${response.status}`,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
     let errorMessage: string;

    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errorMessage = "Request timed out";
      } else {
        errorMessage = error.message;
      }
    } else {
      errorMessage = "Unknown health check error";
    }
    return {
      status: "failure",
      statusCode: null,
      responseTime: Date.now() - startTime,
      errorMessage
    };
  }
}
