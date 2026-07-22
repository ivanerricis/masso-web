import { useState, type DependencyList } from "react";

type UseTablePaginationParams = {
    resetDependencies?: DependencyList;
};

const haveDependenciesChanged = (previous: DependencyList, next: DependencyList) =>
    previous.length !== next.length || previous.some((dependency, index) => dependency !== next[index]);

export const useTablePagination = ({ resetDependencies = [] }: UseTablePaginationParams = {}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [previousDependencies, setPreviousDependencies] = useState(resetDependencies);

    if (haveDependenciesChanged(previousDependencies, resetDependencies)) {
        setPreviousDependencies(resetDependencies);

        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }

    return {
        currentPage,
        setCurrentPage,
    };
};
