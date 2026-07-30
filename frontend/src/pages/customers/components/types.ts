export type CustomerSortOption = "createdAt:desc" | "createdAt:asc" | "name:asc" | "name:desc";

export const DEFAULT_CUSTOMER_SORT_OPTION: CustomerSortOption = "createdAt:desc";

export const customerSortOptions: { value: CustomerSortOption; label: string }[] = [
    { value: "createdAt:desc", label: "Più recenti" },
    { value: "createdAt:asc", label: "Meno recenti" },
    { value: "name:asc", label: "Nome (A-Z)" },
    { value: "name:desc", label: "Nome (Z-A)" },
];
