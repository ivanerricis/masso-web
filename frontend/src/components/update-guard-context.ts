import { createContext } from "react";

export type UpdateGuardContextValue = {
    setIsUpdating: (value: boolean) => void;
};

export const UpdateGuardContext = createContext<UpdateGuardContextValue | null>(null);
