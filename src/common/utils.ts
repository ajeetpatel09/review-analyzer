import { CustomResponse } from "../interfaces/types";
export const buildResponse = (
  data: unknown,
  message: string,
  error: unknown = "",
) => {
  const response: CustomResponse = {
    data,
    message,
    error,
  };

  return response;
};
