import { router, usePage } from "@inertiajs/react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  paginationLinks: { url: string | null; label: string; active: boolean }[];
  searchParam?: string;
}

export function DataTablePagination({ paginationLinks, searchParam = "search" }: PaginationProps) {
  if (paginationLinks.length === 0) return null;

  const pageProps = usePage().props as Record<string, any>;
  const search = pageProps[searchParam] ?? "";

  const handlePageChange = (url: string | null) => {
    if (url) {
      router.visit(url, {
        data: { [searchParam]: search },
        preserveScroll: true,
        preserveState: true,
      });
    }
  };

  const numericLinks = paginationLinks.filter((link) => !isNaN(Number(link.label)));
  const totalPages = numericLinks.length;
  const currentPage = numericLinks.find((link) => link.active);
  const currentPageNumber = currentPage ? Number(currentPage.label) : 1;

  const visiblePages: (typeof numericLinks[number] | "ellipsis")[] = [];
  const sidePages = 1;

  for (let i = 0; i < totalPages; i++) {
    const pageNumber = Number(numericLinks[i].label);
    if (
      pageNumber === 1 ||
      pageNumber === totalPages ||
      (pageNumber >= currentPageNumber - sidePages &&
        pageNumber <= currentPageNumber + sidePages)
    ) {
      visiblePages.push(numericLinks[i]);
    } else if (visiblePages[visiblePages.length - 1] !== "ellipsis") {
      visiblePages.push("ellipsis");
    }
  }

  const prevLink = paginationLinks.find((link) => link.label.includes("Previous"));
  const nextLink = paginationLinks.find((link) => link.label.includes("Next"));

  return (
    <Pagination className="text-xs p-2 bg-gray-100 dark:bg-zinc-900">
      <PaginationContent className="flex flex-wrap justify-center gap-1">
        {/* Previous */}
        {prevLink?.url && (
          <PaginationItem>
            <PaginationLink
              onClick={() => handlePageChange(prevLink.url)}
              className="px-1.5 py-1 h-7 w-7 flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        )}

        {/* Page Numbers */}
        {visiblePages.map((link, index) =>
          link === "ellipsis" ? (
            <PaginationEllipsis
              key={index}
              className="text-gray-500 h-7 w-7 flex items-center justify-center"
            />
          ) : (
            <PaginationItem key={index}>
              <PaginationLink
                onClick={() => handlePageChange(link.url)}
                isActive={link.active}
                className="px-2 py-1 h-7 w-7 text-xs flex items-center justify-center"
              >
                {link.label}
              </PaginationLink>
            </PaginationItem>
          )
        )}

        {/* Next */}
        {nextLink?.url && (
          <PaginationItem>
            <PaginationLink
              onClick={() => handlePageChange(nextLink.url)}
              className="px-1.5 py-1 h-7 w-7 flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
