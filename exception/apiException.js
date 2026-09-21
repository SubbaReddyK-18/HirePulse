export class ApiException extends Error {
  constructor(message, status = 0, originalError = null) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.originalError = originalError;
  }
}

export function handleApiError(error, fallbackMessage = "Something went wrong. Please try again.") {
  if (error instanceof ApiException) {
    throw error;
  }

  if (error && error.response) {
    const status = error.response.status;
    if (status === 404) {
      throw new ApiException("The requested record was not found.", status, error);
    }
    if (status >= 500) {
      throw new ApiException("The server could not complete this request.", status, error);
    }
    throw new ApiException(fallbackMessage, status, error);
  }

  if (error && (error.code === "ECONNABORTED" || error.message === "Network Error" || !error.response)) {
    throw new ApiException(
      "Unable to reach the server. Start JSON Server on port 3000 and try again.",
      0,
      error
    );
  }

  throw new ApiException(fallbackMessage, 0, error);
}

export async function withApiHandler(requestFn, fallbackMessage) {
  try {
    return await requestFn();
  } catch (error) {
    handleApiError(error, fallbackMessage);
  }
}
