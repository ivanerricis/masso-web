import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodType } from "zod";

type ValidationSchemas = {
    params?: ZodType;
    query?: ZodType;
    body?: ZodType;
};

type ValidationErrorResponse = {
    message: string;
    errors: {
        params?: unknown;
        query?: unknown;
        body?: unknown;
    };
};

const setValidatedRequestProperty = <T extends keyof Pick<Request, "params" | "query" | "body">>(
    req: Request,
    key: T,
    value: Request[T]
) => {
    Object.defineProperty(req, key, {
        value,
        configurable: true,
        enumerable: true,
        writable: true,
    });
};

export const validate = ({ params, query, body }: ValidationSchemas): RequestHandler => {
    return (req: Request, res: Response<ValidationErrorResponse>, next: NextFunction) => {
        const errors: ValidationErrorResponse["errors"] = {};

        if (params) {
            const parsedParams = params.safeParse(req.params);
            if (!parsedParams.success) {
                errors.params = parsedParams.error.flatten();
            } else {
                setValidatedRequestProperty(req, "params", parsedParams.data as Request["params"]);
            }
        }

        if (query) {
            const parsedQuery = query.safeParse(req.query);
            if (!parsedQuery.success) {
                errors.query = parsedQuery.error.flatten();
            } else {
                setValidatedRequestProperty(req, "query", parsedQuery.data as Request["query"]);
            }
        }

        if (body) {
            const parsedBody = body.safeParse(req.body);
            if (!parsedBody.success) {
                errors.body = parsedBody.error.flatten();
            } else {
                setValidatedRequestProperty(req, "body", parsedBody.data as Request["body"]);
            }
        }

        if (Object.keys(errors).length > 0) {
            res.status(400).json({
                message: "Validation error",
                errors,
            });
            return;
        }

        next();
    };
};
