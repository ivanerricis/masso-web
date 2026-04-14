import axios from "axios";

export const getApiErrorMessage = (error: unknown, fallbackMessage = "Operazione non riuscita") => {
    if (axios.isAxiosError<{ message?: string }>(error)) {
        return error.response?.data?.message ?? error.message ?? fallbackMessage;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return fallbackMessage;
};
