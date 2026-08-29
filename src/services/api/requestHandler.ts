import { ApiError } from "@/errors/ApiError";


export const requestHandler = {
  async handle<T>(request: Promise<T>): Promise<T> {
    try {
      return await request;
    } catch (error: any) {
      if (error.response) {
        throw ApiError.fromResponse(
          error.response.status,
          error.response.data?.message || "An API error occurred.",
          error.config?.url
        );
      }
      throw error;
    }
  },
};
