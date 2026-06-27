import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  pageSize: number;
  onPageSizeChange?: (pageSize: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  onPageSizeChange,
}) => {
  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between w-full font-bold text-[10px] uppercase tracking-widest text-[#4a5568]">
        <span>Tổng cộng: {totalItems} bản ghi</span>
      </div>
    );
  }

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };

  // Generate range of page numbers to show
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();
  const startItemIndex = (currentPage - 1) * pageSize + 1;
  const endItemIndex = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full font-bold text-[10px] uppercase tracking-widest text-[#4a5568]">
      <div className="flex items-center gap-2 flex-wrap">
        <span>
          Hiển thị {totalItems === 0 ? 0 : startItemIndex}-{endItemIndex} của {totalItems} bản ghi
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2 normal-case">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4a5568]">Hàng:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#f5f8fc] border border-[#b8c6d9] rounded-md px-1.5 py-0.5 text-xs font-bold focus:outline-none focus:border-[#2c5ea0] text-[#1e2a3a] cursor-pointer"
            >
              {[5, 10, 20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          onClick={handleFirst}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-full border transition-all ${
            currentPage === 1
              ? 'text-[#8e9eb4] border-transparent cursor-not-allowed'
              : 'text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6] hover:text-[#2c5ea0]'
          }`}
          title="Trang đầu"
        >
          <ChevronsLeft className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handlePrev}
          disabled={currentPage === 1}
          className={`p-1.5 rounded-full border transition-all ${
            currentPage === 1
              ? 'text-[#8e9eb4] border-transparent cursor-not-allowed'
              : 'text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6] hover:text-[#2c5ea0]'
          }`}
          title="Trang trước"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {pages[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-2.5 py-1 text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#e8eef6] rounded-full transition-all"
            >
              1
            </button>
            {pages[0] > 2 && <span className="text-[#7b8a9e] px-1 text-xs">...</span>}
          </>
        )}

        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all border ${
              page === currentPage
                ? 'bg-[#2c5ea0] text-white border-[#2c5ea0]'
                : 'text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6] hover:text-[#2c5ea0]'
            }`}
          >
            {page}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && <span className="text-[#7b8a9e] px-1 text-xs">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-2.5 py-1 text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#e8eef6] rounded-full transition-all"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-full border transition-all ${
            currentPage === totalPages
              ? 'text-[#8e9eb4] border-transparent cursor-not-allowed'
              : 'text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6] hover:text-[#2c5ea0]'
          }`}
          title="Trang sau"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleLast}
          disabled={currentPage === totalPages}
          className={`p-1.5 rounded-full border transition-all ${
            currentPage === totalPages
              ? 'text-[#8e9eb4] border-transparent cursor-not-allowed'
              : 'text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6] hover:text-[#2c5ea0]'
          }`}
          title="Trang cuối"
        >
          <ChevronsRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
