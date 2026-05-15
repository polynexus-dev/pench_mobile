import { AppError } from "./AppError";

export class ApiError extends AppError {
    readonly endpoint?: string;   //which URL failed 

    constructor(
        message: string,
        statusCode: number,
        endpoint?: string,
    ) {
        super(message, `API_${statusCode}`, statusCode);
        this.name = "ApiError";
        this.endpoint = endpoint;
        Object.setPrototypeOf(this, new.target.prototype);
    }

    static fromResponse(status: number, message: string, endpoint?: string): ApiError {
        return new ApiError(message, status, endpoint);
    }
}
