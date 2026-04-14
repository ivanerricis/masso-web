import { getApiErrorMessage, listIssues } from "@/lib/api";
import type { IssueDto } from "@/types/dtos";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

type UseIssuesRowsParams = {
    searchText: string;
};

export const useIssuesRows = ({ searchText }: UseIssuesRowsParams) => {
    const [issueRows, setIssueRows] = useState<IssueDto[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadIssues = useCallback(async () => {
        setIsLoading(true);
        try {
            const issues = await listIssues();
            setIssueRows(issues);
        } catch (error) {
            toast.error(getApiErrorMessage(error, "Impossibile caricare i difetti"));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const visibleIssueRows = useMemo(() => {
        return issueRows.filter((issue) => {
            const query = searchText.trim().toLowerCase();
            if (!query) {
                return true;
            }

            return [String(issue.id), issue.description]
                .join(" ")
                .toLowerCase()
                .includes(query);
        });
    }, [issueRows, searchText]);

    return {
        issueRows,
        visibleIssueRows,
        isLoading,
        loadIssues,
    };
};
