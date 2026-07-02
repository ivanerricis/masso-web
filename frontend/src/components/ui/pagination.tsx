import * as React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
    return <nav role="navigation" aria-label="pagination" className={cn("mx-auto flex w-full justify-center", className)} {...props} />;
}

function PaginationContent({ className, ...props }: React.ComponentProps<"ul">) {
    return <ul className={cn("flex flex-row items-center gap-1", className)} {...props} />;
}

function PaginationItem({ className, ...props }: React.ComponentProps<"li">) {
    return <li className={cn("", className)} {...props} />;
}

type PaginationLinkProps = React.ComponentProps<"a"> & {
    isActive?: boolean;
};

function PaginationLink({ className, isActive, ...props }: PaginationLinkProps) {
    return (
        <a
            aria-current={isActive ? "page" : undefined}
            className={cn(buttonVariants({ variant: isActive ? "outline" : "ghost" }), className)}
            {...props}
        />
    );
}

function PaginationPrevious({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
    return (
        <PaginationLink aria-label="Vai alla pagina precedente" className={cn("gap-1 px-3", className)} {...props}>
            <ChevronLeft className="size-4" />
            <span className="sr-only">Precedente</span>
        </PaginationLink>
    );
}

function PaginationNext({ className, ...props }: React.ComponentProps<typeof PaginationLink>) {
    return (
        <PaginationLink aria-label="Vai alla pagina successiva" className={cn("gap-1 px-3", className)} {...props}>
            <span className="sr-only">Successiva</span>
            <ChevronRight className="size-4" />
        </PaginationLink>
    );
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span aria-hidden="true" className={cn("flex size-9 items-center justify-center", className)} {...props}>
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Altre pagine</span>
        </span>
    );
}

export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious };