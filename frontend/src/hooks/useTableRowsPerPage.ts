import { useState } from "react";
import { getStoredTableRowsPerPage } from "@/lib/theme";

export const useTableRowsPerPage = () => {
    const [pageSize] = useState(() => getStoredTableRowsPerPage());

    return pageSize;
};
