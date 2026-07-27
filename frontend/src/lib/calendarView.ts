import type { View } from "react-big-calendar";

const viewStorageKey = "masso-web-calendar-view";
const validViews: View[] = ["month", "week", "work_week", "day", "agenda"];
const mobileBreakpoint = 768;

// La griglia mensile a 7 colonne è illeggibile sotto il breakpoint mobile: senza una
// preferenza salvata, la vista Agenda (elenco verticale) è molto più utilizzabile.
const getDefaultView = (): View => (window.innerWidth < mobileBreakpoint ? "agenda" : "month");

export const getStoredCalendarView = (): View => {
    const storedValue = localStorage.getItem(viewStorageKey);

    return validViews.includes(storedValue as View) ? (storedValue as View) : getDefaultView();
};

export const setStoredCalendarView = (view: View) => {
    localStorage.setItem(viewStorageKey, view);
};
