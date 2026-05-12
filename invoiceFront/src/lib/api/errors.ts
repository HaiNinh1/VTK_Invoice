// Normalized error class for all API failures.
// The axios client (client.ts) converts AxiosError -> ApiError so callers
// only deal with one shape.

export type FieldErrors = Record<string, string[]>;

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly fields: FieldErrors | null;
  public readonly raw: unknown;

  constructor(opts: {
    status: number;
    code: string;
    message: string;
    fields?: FieldErrors | null;
    raw?: unknown;
  }) {
    super(opts.message);
    this.name = 'ApiError';
    this.status = opts.status;
    this.code = opts.code;
    this.fields = opts.fields ?? null;
    this.raw = opts.raw;
  }

  isUnauthorized() {
    return this.status === 401;
  }
  isForbidden() {
    return this.status === 403;
  }
  isValidation() {
    return this.status === 422;
  }
  isSignatureRequired() {
    return this.status === 428 || this.code === 'signature_required';
  }
  isAlreadyInvoiced() {
    return this.status === 409;
  }
  isNetwork() {
    return this.status === 0;
  }
}

/**
 * Normalize any error body returned by Laravel into an ApiError.
 * Backend envelope is INCONSISTENT — handles:
 *   - { error: "code" }
 *   - { message: "..." }
 *   - { message, errors: { field: [msg, ...] } } (422)
 *   - bare string / unknown shape
 */
export function normalizeError(status: number, body: unknown): ApiError {
  if (status === 0) {
    return new ApiError({
      status: 0,
      code: 'network_error',
      message: 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra mạng.',
      raw: body,
    });
  }

  const b = (body ?? {}) as Record<string, unknown>;

  // 422 validation
  if (status === 422 && b.errors && typeof b.errors === 'object') {
    return new ApiError({
      status,
      code: 'validation_failed',
      message: (b.message as string) || 'Dữ liệu không hợp lệ',
      fields: b.errors as FieldErrors,
      raw: body,
    });
  }

  // Signature gate
  if (status === 428 || b.error === 'signature_required') {
    return new ApiError({
      status,
      code: 'signature_required',
      message: 'Bạn cần thiết lập chữ ký trước khi thực hiện thao tác này.',
      raw: body,
    });
  }

  // Already invoiced (409)
  if (status === 409) {
    return new ApiError({
      status,
      code: (b.error as string) || 'conflict',
      message:
        (b.message as string) ||
        (b.error as string) ||
        'Thao tác bị xung đột với trạng thái hiện tại.',
      raw: body,
    });
  }

  // 401 / 403
  if (status === 401) {
    return new ApiError({
      status,
      code: 'unauthenticated',
      message: (b.message as string) || 'Phiên đăng nhập đã hết hạn.',
      raw: body,
    });
  }
  if (status === 403) {
    return new ApiError({
      status,
      code: 'forbidden',
      message: (b.message as string) || 'Bạn không có quyền thực hiện thao tác này.',
      raw: body,
    });
  }

  // Generic {error:"..."}
  if (typeof b.error === 'string') {
    return new ApiError({
      status,
      code: b.error,
      message: (b.message as string) || b.error,
      raw: body,
    });
  }

  // Generic {message:"..."}
  if (typeof b.message === 'string') {
    return new ApiError({
      status,
      code: 'error',
      message: b.message,
      raw: body,
    });
  }

  return new ApiError({
    status,
    code: 'error',
    message: `Lỗi máy chủ (${status})`,
    raw: body,
  });
}
