/**
 * Envelope de respuesta — se mantiene igual al backend actual, todo el
 * equipo ya lo conoce. Todas las respuestas del backend (real o mock)
 * tienen esta forma, sin excepción.
 */
export type ApiSuccess<T> = {
  success: true;
  data: T;
  error: null;
};

export type ApiError = {
  success: false;
  data: null;
  error: {
    code: number;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function isApiSuccess<T>(res: ApiResponse<T>): res is ApiSuccess<T> {
  return res.success === true;
}
