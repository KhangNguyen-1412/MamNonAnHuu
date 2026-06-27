import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, History, Clock, BookOpen } from 'lucide-react';

export interface AcademicYear {
  id: string;
  name: string;
  displayLabel: string;
  isCurrent: boolean;
  defaultTermId: string;
}

const mockYears: AcademicYear[] = [
  { id: "AY_2025_2026", name: "Năm học 2025 - 2026", displayLabel: "NĂM HỌC 25-26", isCurrent: true, defaultTermId: "TERM_2526_02" },
  { id: "AY_2024_2025", name: "Năm học 2024 - 2025", displayLabel: "NĂM HỌC 24-25", isCurrent: false, defaultTermId: "TERM_2425_02" },
  { id: "AY_2023_2024", name: "Năm học 2023 - 2024", displayLabel: "NĂM HỌC 23-24", isCurrent: false, defaultTermId: "TERM_2324_02" }
];

export const TermSelector: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Dynamically build list of available years starting with stored rollover year
  const availableYears = useMemo(() => {
    const list = [...mockYears];
    const storedName = localStorage.getItem('active_academic_year_name');
    if (storedName && !list.some(y => y.name === storedName)) {
      const parts = storedName.match(/\d+/g);
      if (parts && parts.length >= 2) {
        const start = parts[0];
        const end = parts[1];
        const displayLabel = `NĂM HỌC ${start.substring(2)}-${end.substring(2)}`;
        list.unshift({
          id: `AY_${start}_${end}`,
          name: storedName,
          displayLabel,
          isCurrent: true,
          defaultTermId: `TERM_${start.substring(2)}${end.substring(2)}_01`
        });
      }
    }
    return list;
  }, []);

  const initialYear = useMemo(() => {
    const storedName = localStorage.getItem('active_academic_year_name');
    if (storedName) {
      const match = availableYears.find(y => y.name === storedName);
      if (match) return match;
    }
    return availableYears[0];
  }, [availableYears]);

  const [selectedYear, setSelectedYear] = useState<AcademicYear>(initialYear);

  useEffect(() => {
    localStorage.setItem('active_term_id', selectedYear.defaultTermId);
    localStorage.setItem('active_academic_year_name', selectedYear.name);
    localStorage.setItem('active_academic_year_id', selectedYear.id);
  }, [selectedYear]);

  // Synchronize when connection/year changes in other panels
  useEffect(() => {
    const handleTermChanged = () => {
      const storedName = localStorage.getItem('active_academic_year_name');
      if (storedName && storedName !== selectedYear.name) {
        const match = availableYears.find(y => y.name === storedName);
        if (match) {
          setSelectedYear(match);
        } else {
          const parts = storedName.match(/\d+/g);
          if (parts && parts.length >= 2) {
            const start = parts[0];
            const end = parts[1];
            const displayLabel = `NĂM HỌC ${start.substring(2)}-${end.substring(2)}`;
            setSelectedYear({
              id: `AY_${start}_${end}`,
              name: storedName,
              displayLabel,
              isCurrent: true,
              defaultTermId: `TERM_${start.substring(2)}${end.substring(2)}_01`
            });
          }
        }
      }
    };
    window.addEventListener('term-changed', handleTermChanged);
    return () => window.removeEventListener('term-changed', handleTermChanged);
  }, [selectedYear, availableYears]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredYears = useMemo(() => {
    if (!search) return availableYears;
    const lowerSearch = search.toLowerCase();
    return availableYears.filter(y => y.name.toLowerCase().includes(lowerSearch));
  }, [search, availableYears]);

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] rounded-full hover:bg-[#e8eef6] transition-colors shadow-sm cursor-pointer"
      >
        <BookOpen className="w-4 h-4 text-[#2c5ea0]" />
        <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-wider">
          {selectedYear.displayLabel}
        </span>
        <ChevronDown className="w-4 h-4 text-[#7b8a9e]" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#ffffff] border border-[#b8c6d9] rounded-2xl shadow-[0_8px_30px_rgba(44,40,37,0.1)] overflow-hidden">
          <div className="p-3 border-b border-[#b8c6d9] bg-[#f5f8fc]">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7b8a9e] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm năm học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
              />
            </div>
          </div>

          <div className="max-h-[320px] overflow-y-auto p-2 scrollbar-thin space-y-1">
            {filteredYears.length === 0 ? (
               <div className="p-4 text-center text-sm font-medium text-[#7b8a9e] italic">
                 Không tìm thấy kết quả phù hợp.
               </div>
            ) : (
              filteredYears.map(year => {
                const isSelected = selectedYear.id === year.id;
                return (
                  <button
                    key={year.id}
                    onClick={() => {
                      setSelectedYear(year);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-colors cursor-pointer ${
                      isSelected 
                        ? 'bg-[#1e2a3a] text-white shadow-[2px_2px_0px_#4a5568]' 
                        : 'hover:bg-[#e8eef6] text-[#4a5568]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className={`w-4 h-4 ${year.isCurrent ? 'text-[#10b981]' : 'text-[#7b8a9e]'}`} />
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-[#1e2a3a]'}`}>
                        {year.name}
                      </span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                        Đang chọn
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          
          <div className="p-3 border-t border-[#b8c6d9] bg-[#e8eef6]">
            <button className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-[#4a5568] hover:bg-[#ffffff] hover:text-[#1e2a3a] border shadow-sm border-[#b8c6d9] transition-all cursor-pointer">
              <History className="w-4 h-4" />
              <span>Xem lịch sử năm học cũ hơn...</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

