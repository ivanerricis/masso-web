import type { ReactNode } from "react";

type PageHeaderProps = {
    title: string;
    description: string;
    action?: ReactNode;
};

const PageHeader = ({ title, description, action}: PageHeaderProps) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">{title}</h1>
                    <p className="text-muted-foreground hidden md:block">{description}</p>
                </div>
                {action}
            </div>
        </div>
    );
};

export default PageHeader;
