const waitFor = async (delayMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, delayMs));

export const withRetry = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  options?: {
    retries?: number;
    delayMs?: number;
  },
): Promise<T> => {
  const retries = options?.retries ?? 3;
  const delayMs = options?.delayMs ?? 1000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`[retry] ${operationName} failed on attempt ${attempt}/${retries + 1}`, error);

      if (attempt <= retries) {
        await waitFor(delayMs);
      }
    }
  }

  throw lastError;
};
