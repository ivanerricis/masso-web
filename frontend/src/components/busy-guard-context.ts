import { createContext } from "react";

export type BusyGuardState = {
    title: string;
    description: string;
};

export type BusyGuardContextValue = {
    setBusy: (state: BusyGuardState | null) => void;
};

export const BusyGuardContext = createContext<BusyGuardContextValue | null>(null);
