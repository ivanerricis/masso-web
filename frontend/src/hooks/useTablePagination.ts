import { useEffect, useState, type DependencyList } from "react";

type UseTablePaginationParams = {
    resetDependencies?: DependencyList;
};

export const useTablePagination = ({ resetDependencies = [] }: UseTablePaginationParams = {}) => {
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        setCurrentPage(1);
    }, resetDependencies);

    return {
        currentPage,
        setCurrentPage,
    };
};