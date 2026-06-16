/**
 * @file src/types/api.ts
 * @description Shared API contract types for CORELASI.
 *
 * These types define the contract between frontend and backend.
 * All services use these shapes both in mock mode and in real API mode.
 * When the backend is ready, service implementations swap — but these types never change.
 */

// ─── Response Envelope ────────────────────────────────────────────────────────

/** Standard success response from any API endpoint */
export type ApiResponse<T> = {
  success: true;
  message: string;
  data: T;
};

/** Standard error response from any API endpoint */
export type ApiErrorResponse = {
  success: false;
  message: string;
  /** Field-level validation errors, keyed by field name */
  errors?: Record<string, string[]>;
};

/** Either a success or error API response */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

// ─── Pagination ────────────────────────────────────────────────────────────────

/** Paginated list response — used for all list endpoints */
export type PaginatedResponse<T> = {
  items: T[];
  meta: PaginationMeta;
};

export type PaginationMeta = {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
};

// ─── Query Parameters ──────────────────────────────────────────────────────────

/** Common query parameters for list/filter endpoints */
export type QueryParams = {
  search?: string;
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

// ─── Auth ──────────────────────────────────────────────────────────────────────

/** Short-lived access token returned in an auth response. */
export type AccessTokenResponse = {
  /** Short-lived access token (Authorization: Bearer <token>) */
  accessToken: string;
};

/** Login request payload */
export type LoginRequest = {
  email: string;
  password: string;
};

// ─── File Upload ───────────────────────────────────────────────────────────────

/** File attachment metadata returned after upload */
export type FileAttachment = {
  /** URL to access/download the file */
  url: string;
  /** Original filename */
  name: string;
  /** MIME type */
  type: string;
  /** File size in bytes */
  size: number;
};

// ─── Error Class ───────────────────────────────────────────────────────────────

/**
 * Typed API error thrown by the axios interceptor.
 * Allows catch blocks to discriminate API errors from network errors.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, string[]>;
  public readonly isApiError = true as const;

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }

  /** Check if a caught value is an ApiError */
  static is(error: unknown): error is ApiError {
    return (
      error instanceof ApiError ||
      (error !== null &&
        typeof error === "object" &&
        "isApiError" in error &&
        (error as ApiError).isApiError === true)
    );
  }

  get isUnauthorized(): boolean {
    return this.statusCode === 401;
  }

  get isForbidden(): boolean {
    return this.statusCode === 403;
  }

  get isNotFound(): boolean {
    return this.statusCode === 404;
  }

  get isValidationError(): boolean {
    return this.statusCode === 422;
  }

  get isServerError(): boolean {
    return this.statusCode >= 500;
  }
}
