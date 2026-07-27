import { useContext } from "react";
import { UpdateGuardContext } from "@/components/update-guard-context";

export const useUpdateGuard = () => {
    const context = useContext(UpdateGuardContext);

    if (!context) {
        throw new Error("useUpdateGuard deve essere usato dentro UpdateGuardProvider");
    }

    return context;
};
