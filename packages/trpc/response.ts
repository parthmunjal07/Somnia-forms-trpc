export function createSuccess<T>(payload: { data: T; meta?: Record<string, unknown> }) {
  return {
    success: true,
    data: payload.data,
    meta: payload.meta,
  };
}

export function createError(payload: { code: string; message: string }) {
  return {
    success: false,
    error: {
      code: payload.code,
      message: payload.message,
    },
  };
}
