import { useContext } from "react";
import { BusyGuardContext } from "@/components/busy-guard-context";

export const useBusyGuard = () => {
    const context = useContext(BusyGuardContext);

    if (!context) {
        throw new Error("useBusyGuard deve essere usato dentro BusyGuardProvider");
    }

    return context;
};
