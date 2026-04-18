export class ServiceError extends Error {
  status: number;

  constructor(message: string, status: number = 400) {
    super(message);
    this.name = "ServiceError";
    this.status = status;
  }
}

type TStatusErrorLike = {
  status?: unknown;
  message?: unknown;
};

function isStatusErrorLike(error: unknown): error is TStatusErrorLike {
  return typeof error === "object" && error !== null && "status" in error;
}

export function getServiceErrorStatus(error: unknown): number {
  if (error instanceof ServiceError) {
    return error.status;
  }

  if (isStatusErrorLike(error) && typeof error.status === "number") {
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

  if (isStatusErrorLike(error) && typeof error.message === "string") {
    return error.message;
  }

  return fallbackMessage;
}
