import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, X, Search, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { slideDownVariants, itemVariants, containerVariants } from '../../utils/animations';

const getDaysInMonth = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
  const totalDays = new Date(year, month + 1, 0).getDate();
  
  const prevMonthDays = [];
  const prevMonthTotal = new Date(year, month, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Start from Monday
  for (let i = startOffset - 1; i >= 0; i--) {
    prevMonthDays.push({
      day: prevMonthTotal - i,
      month: month === 0 ? 11 : month - 1,
      year: month === 0 ? year - 1 : year,
      isCurrentMonth: false
    });
  }

  const currentMonthDays = [];
  for (let i = 1; i <= totalDays; i++) {
    currentMonthDays.push({
      day: i,
      month,
      year,
      isCurrentMonth: true
    });
  }

  const nextMonthDays = [];
  const totalAdded = prevMonthDays.length + currentMonthDays.length;
  const remaining = 42 - totalAdded;
  for (let i = 1; i <= remaining; i++) {
    nextMonthDays.push({
      day: i,
      month: month === 11 ? 0 : month + 1,
      year: month === 11 ? year + 1 : year,
      isCurrentMonth: false
    });
  }

  return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
};

export const BaseSelect = ({
  label,
  options,
  value,
  onChange,
  placeholder = "--- Chọn ---",
  searchable = false,
  clearable = false,
  disabled = false,
  error,
  required = false,
  wrapperClassName
}: {
  label?: string;
  options: {value: string; label: string}[];
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // Close dropdown if the input itself goes completely out of the viewport on scroll
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }

      const dropdownHeight = 240;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left: rect.left,
        width: rect.width
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleScrollAndResize = (e: Event) => {
      // If the scroll target is inside our own dropdown list, ignore it so the options list can be scrolled!
      if (e.type === 'scroll' && dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      // Otherwise update the coordinates so the dropdown list scrolls in sync with the input box
      updateCoords();
    };

    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", handleScrollAndResize, { capture: true });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", handleScrollAndResize, { capture: true });
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find(o => o.value === value);
  const filteredOptions = options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`relative w-full ${wrapperClassName || ''}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">
          {label} {required && <span className="text-[#2c5ea0]">*</span>}
        </label>
      )}
      <div 
        className={`relative flex items-center w-full px-4 py-3 bg-[#ffffff] border rounded-xl text-sm font-bold transition-colors
          ${disabled ? 'bg-[#e8eef6] text-[#8e9eb4] cursor-not-allowed border-[#b8c6d9]' : 
            error ? 'border-[#2c5ea0] focus-within:ring-2 focus-within:ring-[#2c5ea0]/20 cursor-pointer' : 
            'border-[#b8c6d9] text-[#1e2a3a] focus-within:border-[#2c5ea0] focus-within:ring-2 focus-within:ring-[#2c5ea0]/20 hover:border-[#8e9eb4] cursor-pointer'}
        `}
        onClick={() => {
          if (disabled) return;
          if (!isOpen) {
            updateCoords();
          }
          setIsOpen(!isOpen);
        }}
      >
        <div className="flex-1 truncate">
          {selectedOption ? selectedOption.label : <span className="text-[#7b8a9e] font-normal">{placeholder}</span>}
        </div>
        <div className="flex items-center gap-2">
          {clearable && selectedOption && !disabled && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(""); setSearch(""); }}
              className="text-[#7b8a9e] hover:text-[#2c5ea0] transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-[#7b8a9e] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && coords !== null && !disabled && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideDownVariants}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 9999
            }}
            className="bg-[#ffffff] border border-[#b8c6d9] rounded-xl shadow-lg max-h-60 overflow-hidden flex flex-col"
          >
            {searchable && (
              <div className="p-2 border-b border-[#e8eef6] flex items-center bg-[#f5f8fc] shrink-0">
                <Search className="w-4 h-4 text-[#7b8a9e] ml-2" />
                <input
                  type="text"
                  autoFocus
                  className="w-full px-3 py-2 bg-transparent text-sm font-bold text-[#1e2a3a] focus:outline-none placeholder:text-[#7b8a9e] placeholder:font-normal"
                  placeholder="Tìm kiếm nhanh..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            )}
            <ul className="overflow-y-auto py-1 flex-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <motion.li
                    key={opt.value}
                    variants={itemVariants}
                    onClick={() => { onChange(opt.value); setIsOpen(false); setSearch(""); }}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.value ? 'bg-[#e8eef6] text-[#2c5ea0] font-bold' : 'text-[#4a5568] hover:bg-[#f5f8fc] hover:text-[#1e2a3a] font-medium'}`}
                  >
                    {opt.label}
                  </motion.li>
                ))
              ) : (
                <motion.li
                  variants={itemVariants}
                  className="px-4 py-3 text-sm text-[#7b8a9e] text-center italic"
                >
                  Không tìm thấy kết quả
                </motion.li>
              )}
            </ul>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {error && <p className="mt-1.5 text-xs text-[#2c5ea0] font-medium">{error}</p>}
    </div>
  );
};

export const BaseDatePicker = ({
  label,
  value,
  onChange,
  min,
  max,
  disabled = false,
  error,
  required = false,
  wrapperClassName,
  inputClassName,
  type = "date"
}: {
  label?: string;
  value?: string;
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
  type?: "date" | "time" | "month" | "datetime-local";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const today = new Date();
  const [navDate, setNavDate] = useState(() => {
    if (value && type === 'date') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
    return today;
  });

  const currentYear = navDate.getFullYear();
  const currentMonth = navDate.getMonth();

  useEffect(() => {
    if (!isOpen && value && type === 'date') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setNavDate(d);
      }
    }
  }, [value, isOpen, type]);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      
      // Close dropdown if the input itself goes completely out of the viewport on scroll
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }

      const dropdownHeight = 350;
      const dropdownWidth = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      let left = rect.left;
      if (left + dropdownWidth > window.innerWidth) {
        left = window.innerWidth - dropdownWidth - 16;
      }
      if (left < 16) left = 16;

      setCoords({
        top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
        left
      });
    }
  };

  useEffect(() => {
    if (!isOpen || type !== 'date') return;
    updateCoords();

    const handleScrollAndResize = (e: Event) => {
      // If scroll happens inside the calendar dropdown, don't close it!
      if (e.type === 'scroll' && dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updateCoords();
    };

    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", handleScrollAndResize, { capture: true });

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", handleScrollAndResize, { capture: true });
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, type]);

  const handlePrevMonth = () => {
    setNavDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setNavDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleMonthChange = (m: number) => {
    setNavDate(new Date(currentYear, m, 1));
  };

  const handleYearChange = (y: number) => {
    setNavDate(new Date(y, currentMonth, 1));
  };

  const selectDate = (year: number, month: number, day: number) => {
    const d = new Date(year, month, day);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const clearDate = () => {
    onChange('');
    setIsOpen(false);
  };

  const setDateToToday = () => {
    const d = new Date();
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    onChange(`${yStr}-${mStr}-${dStr}`);
    setIsOpen(false);
  };

  const formatDateToVN = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const daysGrid = getDaysInMonth(currentYear, currentMonth);
  const Icon = type === 'time' ? Clock : Calendar;

  if (type !== 'date') {
    return (
      <div className={`w-full ${wrapperClassName || ''}`}>
        {label && (
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">
            {label} {required && <span className="text-[#2c5ea0]">*</span>}
          </label>
        )}
        <div className="relative line-height-none flex items-center">
          <input 
            type={type} 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min={min}
            max={max}
            disabled={disabled}
            className={`w-full block pl-4 pr-10 py-3 bg-[#ffffff] border rounded-xl transition-colors base-date-input appearance-none
              ${disabled ? 'bg-[#e8eef6] text-[#8e9eb4] cursor-not-allowed border-[#b8c6d9]' : 
                error ? 'border-[#2c5ea0] focus:border-[#2c5ea0] focus:ring-2 focus:ring-[#2c5ea0]/20 focus:outline-none' : 
                'border-[#b8c6d9] focus:border-[#2c5ea0] focus:ring-2 focus:ring-[#2c5ea0]/20 hover:border-[#8e9eb4] focus:outline-none'}
              ${!disabled ? (!value ? 'text-[#7b8a9e] font-normal text-sm' : 'text-[#1e2a3a] font-bold text-sm') : ''}
              ${inputClassName || ''}
            `}
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Icon className="w-4 h-4 text-[#7b8a9e]" />
          </div>
        </div>
        {error && <p className="mt-1.5 text-xs text-[#2c5ea0] font-medium">{error}</p>}
      </div>
    );
  }

  const monthsList = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  const selectYearsRange = Array.from({ length: 100 }, (_, i) => today.getFullYear() - 80 + i);

  return (
    <div className={`w-full relative ${wrapperClassName || ''}`} ref={containerRef}>
      {label && (
        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">
          {label} {required && <span className="text-[#2c5ea0]">*</span>}
        </label>
      )}
      <div className="relative line-height-none flex items-center">
        <input 
          type="text" 
          value={formatDateToVN(value)}
          placeholder="Chọn ngày (DD/MM/YYYY)..."
          readOnly
          onClick={() => {
            if (disabled) return;
            if (!isOpen) {
              updateCoords();
            }
            setIsOpen(!isOpen);
          }}
          disabled={disabled}
          className={`w-full block pl-4 pr-10 py-3 bg-[#ffffff] border rounded-xl transition-colors cursor-pointer select-none
            ${disabled ? 'bg-[#e8eef6] text-[#8e9eb4] cursor-not-allowed border-[#b8c6d9]' : 
              error ? 'border-[#2c5ea0] focus:border-[#2c5ea0] focus:ring-2 focus:ring-[#2c5ea0]/20 focus:outline-none' : 
              'border-[#b8c6d9] focus:border-[#2c5ea0] focus:ring-2 focus:ring-[#2c5ea0]/20 hover:border-[#8e9eb4] focus:outline-none'}
            ${!disabled ? (!value ? 'text-[#7b8a9e] font-normal text-sm' : 'text-[#1e2a3a] font-bold text-sm') : ''}
            ${inputClassName || ''}
          `}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Calendar className="w-4 h-4 text-[#7b8a9e]" />
        </div>
      </div>
      {error && <p className="mt-1.5 text-xs text-[#2c5ea0] font-medium">{error}</p>}

      {isOpen && coords !== null && !disabled && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideDownVariants}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: '280px',
              zIndex: 9999
            }}
            className="bg-[#ffffff] border border-[#b8c6d9] rounded-2xl shadow-xl p-4 flex flex-col gap-3 font-sans"
          >
          {/* Header */}
          <div className="flex items-center justify-between gap-1 shrink-0">
            <button 
              type="button" 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[#e8eef6] rounded-lg text-[#4a5568] hover:text-[#2c5ea0] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              <select 
                value={currentMonth} 
                onChange={(e) => handleMonthChange(Number(e.target.value))}
                className="bg-transparent border-0 font-bold text-xs text-[#1e2a3a] focus:ring-0 focus:outline-none p-0 cursor-pointer"
              >
                {monthsList.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              <select 
                value={currentYear} 
                onChange={(e) => handleYearChange(Number(e.target.value))}
                className="bg-transparent border-0 font-bold text-xs text-[#1e2a3a] focus:ring-0 focus:outline-none p-0 cursor-pointer"
              >
                {selectYearsRange.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button 
              type="button" 
              onClick={handleNextMonth}
              className="p-1 hover:bg-[#e8eef6] rounded-lg text-[#4a5568] hover:text-[#2c5ea0] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center border-b border-[#e8eef6] pb-1 shrink-0">
            {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName, idx) => (
              <span key={idx} className="text-[10px] font-bold text-[#7b8a9e] uppercase py-1">{dayName}</span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {daysGrid.map((item, idx) => {
              const itemDateStr = `${item.year}-${String(item.month + 1).padStart(2, '0')}-${String(item.day).padStart(2, '0')}`;
              const isSelected = value === itemDateStr;
              const isToday = getTodayStr() === itemDateStr;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDate(item.year, item.month, item.day)}
                  className={`w-8 h-8 mx-auto flex items-center justify-center text-xs font-bold rounded-lg transition-colors
                    ${item.isCurrentMonth ? 'text-[#1e2a3a] hover:bg-[#e8eef6] hover:text-[#2c5ea0]' : 'text-[#8e9eb4]/40 font-normal'}
                    ${isSelected ? 'bg-[#2c5ea0] text-white hover:bg-[#633232] hover:text-white' : ''}
                    ${isToday && !isSelected ? 'border border-[#2c5ea0] text-[#2c5ea0]' : ''}
                  `}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center border-t border-[#e8eef6] pt-2 shrink-0">
            <button 
              type="button" 
              onClick={clearDate}
              className="text-xs font-bold text-[#7b8a9e] hover:text-[#2c5ea0] transition-colors p-1"
            >
              Xóa
            </button>
            <button 
              type="button" 
              onClick={setDateToToday}
              className="text-xs font-bold text-[#2e6b8a] hover:text-[#1e4f6a] transition-colors p-1"
            >
              Hôm nay
            </button>
          </div>
        </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export const FilterSelect = ({
  value,
  onChange,
  options,
  label,
  icon: Icon,
  className = ""
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  label: string;
  icon?: React.ComponentType<any>;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null);

  const updateCoords = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setIsOpen(false);
        return;
      }
      const dropdownHeight = Math.min(240, options.length * 34 + 8);
      const spaceBelow = window.innerHeight - rect.bottom;
      const showAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

      setCoords({
        top: showAbove ? rect.top - dropdownHeight - 4 : rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 180)
      });
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    updateCoords();

    const handleScrollAndResize = (e: Event) => {
      if (e.type === 'scroll' && dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      updateCoords();
    };

    window.addEventListener("resize", updateCoords);
    window.addEventListener("scroll", handleScrollAndResize, { capture: true });

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("resize", updateCoords);
      window.removeEventListener("scroll", handleScrollAndResize, { capture: true });
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, options]);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-[#a8c4e0] hover:bg-[#bdd4ec] border border-[#7b8a9e] rounded-full text-[10px] font-bold text-[#1e2a3a] shadow-sm uppercase tracking-widest transition-all cursor-pointer select-none"
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-[#1e2a3a] shrink-0" />}
        <span className="text-[#7b8a9e] shrink-0">{label}:</span>
        <span className="text-[#1e2a3a] truncate max-w-[120px]">{selectedOption ? selectedOption.label : value}</span>
        <ChevronDown className={`w-3 h-3 text-[#7b8a9e] transition-transform shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && coords !== null && createPortal(
        <AnimatePresence>
          <motion.div
            ref={dropdownRef}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={slideDownVariants}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              minWidth: coords.width,
              zIndex: 9999
            }}
            className="bg-[#f5f8fc] border border-[#b8c6d9] rounded-xl shadow-lg max-h-60 overflow-y-auto py-1 main-scrollbar"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  variants={itemVariants}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors block truncate
                    ${isSelected
                      ? 'bg-[#2c5ea0] text-white'
                      : 'text-[#1e2a3a] hover:bg-[#e8eef6] hover:text-[#2c5ea0]'}
                  `}
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

