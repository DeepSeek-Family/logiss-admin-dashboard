import React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (size: number) => void;
  itemsPerPageOptions?: number[];
}

export const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
}: PaginationProps) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);
  // Always include the current page size so the dropdown reflects the active value.
  const sizeOptions = Array.from(new Set([...itemsPerPageOptions, itemsPerPage])).sort((a, b) => a - b);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      
      if (currentPage < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-line-2">
      <div className="flex items-center gap-1">
        <button 
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-ink-4 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        
        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, i) => (
            page === '...' ? (
              <span key={`dots-${i}`} className="px-2 text-ink-4"><MoreHorizontal size={14} /></span>
            ) : (
              <button
                key={page}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                  currentPage === page 
                    ? 'bg-primary text-white shadow-md shadow-primary/20 scale-110' 
                    : 'text-ink-3 hover:bg-bg hover:text-ink'
                }`}
              >
                {page}
              </button>
            )
          ))}
        </div>

        <button 
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-ink-4 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>

      <div className="flex items-center gap-4">
        {onItemsPerPageChange && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-4 whitespace-nowrap">Rows per page</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="bg-white border border-line-2 rounded-lg pl-2.5 pr-7 py-1.5 text-xs font-medium text-ink outline-none cursor-pointer hover:border-primary/40 focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
            >
              {sizeOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        )}
        <div className="text-xs font-semibold text-ink-4">
          Showing <span className="text-ink font-medium">{startItem}–{endItem}</span> of <span className="text-ink font-medium">{totalItems.toLocaleString()}</span> results
        </div>
      </div>
    </div>
  );
};
