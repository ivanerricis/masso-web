import type { View } from "react-big-calendar";

const viewStorageKey = "masso-web-calendar-view";
const validViews: View[] = ["month", "week", "work_week", "day", "agenda"];
const defaultView: View = "month";

export const getStoredCalendarView = (): View => {
    const storedValue = localStorage.getItem(viewStorageKey);

    return validViews.includes(storedValue as View) ? (storedValue as View) : defaultView;
};

export const setStoredCalendarView = (view: View) => {
    localStorage.setItem(viewStorageKey, view);
};
