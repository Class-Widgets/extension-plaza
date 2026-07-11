// app/components/Common/Pagination.tsx
import React from "react";
import { Button, Text } from "@fluentui/react-components";
import { ChevronLeftRegular, ChevronRightRegular } from "@fluentui/react-icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  const generatePageNumbers = () => {
    const pageNumbers: number[] = [];
    const showPages = 5;
    const halfShowPages = Math.floor(showPages / 2);

    let startPage = Math.max(1, currentPage - halfShowPages);
    let endPage = Math.min(totalPages, startPage + showPages - 1);

    if (endPage - startPage + 1 < showPages) {
      startPage = Math.max(1, endPage - showPages + 1);
    }

    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) {
        pageNumbers.push(-1);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(-1);
      }
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = generatePageNumbers();

  if (totalPages <= 1) return null;

  return (
    <nav className={`flex flex-wrap items-center justify-center gap-2 ${className}`} aria-label="分页">
      <Button
        appearance="subtle"
        icon={<ChevronLeftRegular />}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        上一页
      </Button>

      {pageNumbers.map((page, index) => (
        <React.Fragment key={index}>
          {page === -1 ? (
            <Text size={200} className="px-1 text-gray-400">...</Text>
          ) : (
            <Button
              appearance={currentPage === page ? "primary" : "subtle"}
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          )}
        </React.Fragment>
      ))}

      <Button
        appearance="subtle"
        icon={<ChevronRightRegular />}
        iconPosition="after"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        下一页
      </Button>
    </nav>
  );
}
