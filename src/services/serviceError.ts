export class ServiceError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

export function getServiceErrorStatus(error: unknown): number {
  if (error instanceof ServiceError) {
    return error.status;
  }

  return 500;
}

export function getServiceErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof ServiceError) {
    return error.message;
  }

  return fallbackMessage;
}
