import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarDays, 
  Users, 
  Clock, 
  AlertTriangle, 
  Check, 
  X, 
  Plus, 
  Copy, 
  FileText, 
  MapPin, 
  ChevronRight,
  Shield,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Info,
  Calendar
} from 'lucide-react';
import { 
  getSystemShifts, 
  saveSystemShift, 
  deleteSystemShift, 
  getSystemAbsences, 
  saveSystemAbsence, 
  SystemShift, 
  SystemAbsence 
} from '../../services/dbService';
import { getStaffList, Staff } from '../../services/hrService';

// Predefined staff list if db list is empty, with mapping of emails
const HARDCODED_STAFF = [
  // Bảo vệ
  { email: 'security@security.mnah.edu.vn', name: 'Bác Nguyễn Văn Bảo', roleType: 'security', roleName: 'Tổ trưởng bảo vệ' },
  { email: 'hung.baove@security.mnah.edu.vn', name: 'Chú Hùng', roleType: 'security', roleName: 'Nhân viên Bảo vệ' },
  { email: 'binh.baove@security.mnah.edu.vn', name: 'Chú Bình', roleType: 'security', roleName: 'Nhân viên Bảo vệ' },
  { email: 'manh.baove@security.mnah.edu.vn', name: 'Chú Mạnh', roleType: 'security', roleName: 'Nhân viên Bảo vệ' },
  // Tạp vụ
  { email: 'tapvu@cleaner.mnah.edu.vn', name: 'Cô Phạm Thị Cần', roleType: 'cleaner', roleName: 'Nhân viên Tạp vụ' },
  { email: 'binh.tapvu@cleaner.mnah.edu.vn', name: 'Cô Bình', roleType: 'cleaner', roleName: 'Nhân viên Tạp vụ' },
  { email: 'hoa.tapvu@cleaner.mnah.edu.vn', name: 'Cô Hoa', roleType: 'cleaner', roleName: 'Nhân viên Tạp vụ' },
  // Thư viện
  { email: 'thuvien@library.mnah.edu.vn', name: 'Cô Trịnh Thị Thư', roleType: 'librarian', roleName: 'Nhân viên Thư viện' },
  { email: 'an.thuvien@library.mnah.edu.vn', name: 'Cô An', roleType: 'librarian', roleName: 'Nhân viên Thư viện' },
];

const WEEK_OPTIONS = [
  { id: '2026-W25', label: 'Tuần 25 (15/06/2026 - 21/06/2026)', dates: ['15/06/2026', '16/06/2026', '17/06/2026', '18/06/2026', '19/06/2026', '20/06/2026', '21/06/2026'] },
  { id: '2026-W26', label: 'Tuần 26 (22/06/2026 - 28/06/2026)', dates: ['22/06/2026', '23/06/2026', '24/06/2026', '25/06/2026', '26/06/2026', '27/06/2026', '28/06/2026'] },
  { id: '2026-W27', label: 'Tuần 27 (29/06/2026 - 05/07/2026)', dates: ['29/06/2026', '30/06/2026', '31/06/2026', '01/07/2026', '02/07/2026', '03/07/2026', '04/07/2026'] }
];

const SHIFT_TEMPLATES = {
  security: {
    shifts: ['Ca 1 (06:00 - 14:00)', 'Ca 2 (14:00 - 22:00)', 'Ca 3 (22:00 - 06:00)'],
    locations: ['Chốt Cổng chính', 'Tuần tra Dãy phòng học', 'Trực Bãi xe']
  },
  cleaner: {
    shifts: ['Ca Sáng (06:00 - 11:30)', 'Ca Chiều (12:30 - 17:00)'],
    locations: ['Dãy Khối 1', 'Dãy Khối 2 & 12', 'Khu Hiệu bộ (Phòng BGH/Văn thư)', 'Khu Vệ sinh chung']
  },
  librarian: {
    shifts: ['Ca Hành chính (07:00 - 17:00)', 'Ca Trực trưa (11:30 - 13:00)'],
    locations: ['Trực Quầy Mượn/Trả', 'Kiểm kê Kho sách', 'Xử lý Hồ sơ phôi bằng (Hỗ trợ Văn thư)']
  }
};

export const SystemRosterPanel: React.FC = () => {
  const [selectedWeekId, setSelectedWeekId] = useState('2026-W26');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'security' | 'cleaner' | 'librarian'>('all');
  
  // Data lists
  const [shifts, setShifts] = useState<SystemShift[]>([]);
  const [absences, setAbsences] = useState<SystemAbsence[]>([]);
  const [staffList, setStaffList] = useState<any[]>(HARDCODED_STAFF);
  
  // Modals & UI status
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [isUrgentModal, setIsUrgentModal] = useState(false);
  const [currentEditShift, setCurrentEditShift] = useState<Partial<SystemShift> | null>(null);

  // Load datasets
  const loadData = async () => {
    setLoading(true);
    try {
      const [allShifts, allAbsences, fetchedStaff] = await Promise.all([
        getSystemShifts(),
        getSystemAbsences(),
        getStaffList()
      ]);
      
      setShifts(allShifts);
      setAbsences(allAbsences);
      
      // Merge HARDCODED_STAFF with fetchedStaff if we want to ensure we have specific accounts
      const mappedFetched = fetchedStaff
        .filter(s => {
          const r = (s.role || s.jobRole || '').toLowerCase();
          return r.includes('bảo vệ') || r.includes('tạp vụ') || r.includes('lao công') || r.includes('thư viện') || r.includes('librarian');
        })
        .map(s => {
          const r = (s.role || s.jobRole || '').toLowerCase();
          let roleType: 'security' | 'cleaner' | 'librarian' = 'security';
          if (r.includes('tạp vụ') || r.includes('lao công') || r.includes('lao động')) roleType = 'cleaner';
          if (r.includes('thư viện') || r.includes('librarian')) roleType = 'librarian';
          return {
            email: s.email,
            name: s.name,
            roleType,
            roleName: s.role || s.jobRole || 'Nhân viên'
          };
        });

      // Combine and filter unique emails
      const combined = [...HARDCODED_STAFF];
      mappedFetched.forEach(item => {
        if (!combined.some(c => c.email.toLowerCase() === item.email.toLowerCase())) {
          combined.push(item);
        }
      });
      setStaffList(combined);
    } catch (err) {
      console.error('Failed to load roster system data:', err);
      showToast('Không thể kết nối dữ liệu. Đang hiển thị bản offline.', 'warning');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Duplicate entire schedule of week prior to the selected week
  const handleDuplicatePreviousWeek = async () => {
    const currentWeekIndex = WEEK_OPTIONS.findIndex(w => w.id === selectedWeekId);
    if (currentWeekIndex <= 0) {
      showToast('Không có dữ liệu tuần trước đó để sao chép.', 'error');
      return;
    }
    const prevWeek = WEEK_OPTIONS[currentWeekIndex - 1];
    const prevShifts = shifts.filter(s => s.weekId === prevWeek.id);
    
    if (prevShifts.length === 0) {
      showToast(`Không có lịch trực nào ở tuần trước (${prevWeek.label}) để sao chép.`, 'warning');
      return;
    }

    const currentWeek = WEEK_OPTIONS[currentWeekIndex];
    
    try {
      const newShifts: SystemShift[] = [];
      
      // For each day (Monday -> Sunday) of current week, find shifts of same day index in previous week
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const prevDayShifts = prevShifts.filter(s => s.dayOfWeek === (dayIndex + 2));
        const currentDayDate = currentWeek.dates[dayIndex];
        
        prevDayShifts.forEach(s => {
          const newId = `SYS-SH-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
          newShifts.push({
            ...s,
            id: newId,
            weekId: currentWeek.id,
            date: currentDayDate,
            status: 'draft' // Reset copied shifts to draft
          });
        });
      }

      // Save to Firebase/localStorage
      for (const ns of newShifts) {
        await saveSystemShift(ns);
      }
      
      // Update state
      setShifts(prev => [...prev, ...newShifts]);
      showToast(`🔄 Đã sao chép thành công ${newShifts.length} ca trực từ tuần trước dưới dạng Bản nháp!`, 'success');
    } catch (e) {
      showToast('Có lỗi xảy ra khi sao chép lịch trực.', 'error');
    }
  };

  // Publish all drafts of selected week
  const handlePublishWeek = async () => {
    const weekShifts = shifts.filter(s => s.weekId === selectedWeekId);
    const draftShifts = weekShifts.filter(s => s.status === 'draft');
    
    if (draftShifts.length === 0) {
      showToast('Tất cả lịch trực của tuần này đã được xuất bản.', 'warning');
      return;
    }

    try {
      const updatedShifts = [...shifts];
      for (const ds of draftShifts) {
        const updatedShift: SystemShift = { ...ds, status: 'published' };
        await saveSystemShift(updatedShift);
        const idx = updatedShifts.findIndex(s => s.id === ds.id);
        if (idx !== -1) updatedShifts[idx] = updatedShift;
      }
      setShifts(updatedShifts);
      showToast(`📢 Đã xuất bản thành công ${draftShifts.length} ca trực! Đồng bộ dữ liệu xuống thiết bị nhân sự.`, 'success');
    } catch (e) {
      showToast('Không thể xuất bản lịch trực.', 'error');
    }
  };

  // Simulating PDF exports
  const handleExportPDF = () => {
    showToast('📄 Đang khởi tạo bản in lịch tuần... Xuất file PDF thành công!', 'success');
  };

  // Add/edit shift save handler
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEditShift?.staffEmail || !currentEditShift.date || !currentEditShift.shiftType || !currentEditShift.locationOrArea) {
      showToast('Vui lòng điền đầy đủ thông tin ca trực.', 'error');
      return;
    }

    try {
      const staff = staffList.find(s => s.email === currentEditShift.staffEmail);
      const targetShift: SystemShift = {
        id: currentEditShift.id || `SYS-SH-${Date.now()}`,
        weekId: currentEditShift.weekId || selectedWeekId,
        date: currentEditShift.date,
        dayOfWeek: currentEditShift.dayOfWeek || 2,
        roleType: currentEditShift.roleType || 'security',
        shiftType: currentEditShift.shiftType,
        staffEmail: currentEditShift.staffEmail,
        staffName: staff ? staff.name : 'Chưa rõ',
        locationOrArea: currentEditShift.locationOrArea,
        status: currentEditShift.status || 'draft',
        notes: currentEditShift.notes || ''
      };

      await saveSystemShift(targetShift);
      
      setShifts(prev => {
        const exists = prev.some(s => s.id === targetShift.id);
        if (exists) {
          return prev.map(s => s.id === targetShift.id ? targetShift : s);
        } else {
          return [...prev, targetShift];
        }
      });

      setShowShiftModal(false);
      showToast(currentEditShift.id ? '💾 Cập nhật ca trực thành công!' : '✨ Thêm ca trực thành công!', 'success');
    } catch (err) {
      showToast('Lỗi khi lưu ca trực.', 'error');
    }
  };

  const handleDeleteShiftClick = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ca trực này?')) {
      try {
        await deleteSystemShift(id);
        setShifts(prev => prev.filter(s => s.id !== id));
        showToast('🗑️ Đã xóa ca trực thành công.', 'success');
      } catch (err) {
        showToast('Lỗi khi xóa ca trực.', 'error');
      }
    }
  };

  // Approve absence
  const handleApproveAbsence = async (abs: SystemAbsence, approve: boolean) => {
    try {
      const nextStatus = approve ? 'Đã duyệt' : 'Từ chối';
      const updatedAbs: SystemAbsence = {
        ...abs,
        status: nextStatus,
        approvedBy: 'Thầy Nguyễn Văn Hiệu'
      };
      
      await saveSystemAbsence(updatedAbs);
      
      // Update absence list
      setAbsences(prev => prev.map(a => a.id === abs.id ? updatedAbs : a));

      // If approved, let's automatically replace the shift's staff details with the backup staff!
      if (approve && abs.backupStaffEmail && abs.backupStaffName) {
        const weekShifts = shifts.filter(s => s.date === abs.date && s.staffEmail === abs.staffEmail);
        for (const ws of weekShifts) {
          const replacedShift: SystemShift = {
            ...ws,
            staffEmail: abs.backupStaffEmail,
            staffName: abs.backupStaffName,
            notes: `Trực thay cho ${abs.staffName}. Lý do: ${abs.reason}`
          };
          await saveSystemShift(replacedShift);
          setShifts(prev => prev.map(s => s.id === ws.id ? replacedShift : s));
        }
        showToast(`✅ Đã phê duyệt nghỉ phép. Tự động chuyển ca trực ngày ${abs.date} sang cho ${abs.backupStaffName}!`, 'success');
      } else {
        showToast(`Đã ${approve ? 'duyệt' : 'từ chối'} yêu cầu vắng mặt/đổi ca.`, 'success');
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi phê duyệt.', 'error');
    }
  };

  // Conflict helper: check if the staff is assigned to multiple shifts on the same date
  const checkConflicts = (staffEmail: string, date: string, currentShifts: SystemShift[]): boolean => {
    const staffDayShifts = currentShifts.filter(s => s.staffEmail === staffEmail && s.date === date);
    return staffDayShifts.length > 1; // Conflict if assigned to 2 or more shifts on the same day
  };

  // Get date helper from dayOfWeek index (2 to 8)
  const getWeekDate = (dayOfWeek: number): string => {
    const targetWeek = WEEK_OPTIONS.find(w => w.id === selectedWeekId);
    if (!targetWeek) return '';
    return targetWeek.dates[dayOfWeek - 2];
  };

  // Form inputs initialization
  const openAddShiftCell = (staffEmail: string, dayOfWeek: number) => {
    const staff = staffList.find(s => s.email === staffEmail);
    if (!staff) return;
    const date = getWeekDate(dayOfWeek);
    const templates = SHIFT_TEMPLATES[staff.roleType as keyof typeof SHIFT_TEMPLATES];
    
    setCurrentEditShift({
      id: '',
      weekId: selectedWeekId,
      date,
      dayOfWeek,
      roleType: staff.roleType,
      shiftType: templates.shifts[0],
      staffEmail,
      staffName: staff.name,
      locationOrArea: templates.locations[0],
      status: 'draft',
      notes: ''
    });
    setIsUrgentModal(false);
    setShowShiftModal(true);
  };

  const openUrgentShift = () => {
    setCurrentEditShift({
      id: '',
      weekId: selectedWeekId,
      date: WEEK_OPTIONS.find(w => w.id === selectedWeekId)?.dates[0] || '',
      dayOfWeek: 2,
      roleType: 'security',
      shiftType: SHIFT_TEMPLATES.security.shifts[0],
      staffEmail: staffList.filter(s => s.roleType === 'security')[0]?.email || '',
      staffName: staffList.filter(s => s.roleType === 'security')[0]?.name || '',
      locationOrArea: SHIFT_TEMPLATES.security.locations[0],
      status: 'published', // Urgent shifts are published by default
      notes: 'Ca trực khẩn cấp bổ sung'
    });
    setIsUrgentModal(true);
    setShowShiftModal(true);
  };

  const openEditShift = (shift: SystemShift) => {
    setCurrentEditShift(shift);
    setIsUrgentModal(false);
    setShowShiftModal(true);
  };

  // Filter staff list based on role selection
  const filteredStaff = staffList.filter(s => {
    if (selectedRoleFilter === 'all') return true;
    return s.roleType === selectedRoleFilter;
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 right-8 z-50 px-6 py-3 rounded-2xl border shadow-lg flex items-center font-bold text-xs uppercase tracking-wider ${
              toast.type === 'success' ? 'bg-[#2e6b8a] text-white border-[#1e4f6a]' : 
              toast.type === 'warning' ? 'bg-[#a8c4e0] text-black border-[#8e9eb4]' : 'bg-[#2c5ea0] text-white border-[#5c2525]'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4 mr-2" /> : <AlertTriangle className="w-4 h-4 mr-2" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0">
        
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 border-b-[3px] border-double border-[#b8c6d9] pb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Quản Lý Lịch Trực Hệ Thống</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Ban Giám Hiệu điều hành phân ca trực: Bảo vệ, Tạp vụ và Thư viện</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
            <button 
              onClick={openUrgentShift}
              className="flex items-center px-4 py-2.5 bg-rose-700 text-white border border-rose-800 text-xs uppercase tracking-widest font-bold hover:bg-rose-800 transition shadow-[2px_2px_0px_#5c1a1a] active:shadow-none active:translate-y-[2px] rounded-full cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Ca trực Khẩn cấp
            </button>
            <button 
              onClick={handleDuplicatePreviousWeek}
              className="flex items-center px-4 py-2.5 bg-[#a8c4e0] text-black border border-[#8e9eb4] text-xs uppercase tracking-widest font-bold hover:bg-[#d4c19f] transition shadow-[2px_2px_0px_#7b8a9e] active:shadow-none active:translate-y-[2px] rounded-full cursor-pointer"
            >
              <Copy className="w-4 h-4 mr-1.5" /> Sao chép tuần trước
            </button>
            <button 
              onClick={handlePublishWeek}
              className="flex items-center px-4 py-2.5 bg-[#2e6b8a] text-white border border-[#1e4f6a] text-xs uppercase tracking-widest font-bold hover:bg-[#324b3a] transition shadow-[2px_2px_0px_#1e2d22] active:shadow-none active:translate-y-[2px] rounded-full cursor-pointer"
            >
              <Check className="w-4 h-4 mr-1.5" /> Xuất bản lịch
            </button>
            <button 
              onClick={handleExportPDF}
              className="flex items-center px-4 py-2.5 bg-white text-[#1e2a3a] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#e8eef6] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-[2px] rounded-full cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-1.5" /> Xuất bản in PDF
            </button>
          </div>
        </div>

        {/* Top Filters Bar */}
        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-[#2c5ea0]" />
              <select 
                value={selectedWeekId} 
                onChange={(e) => setSelectedWeekId(e.target.value)}
                className="p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
              >
                {WEEK_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1.5 bg-[#e8eef6] p-1 rounded-xl border border-[#b8c6d9]">
              <button 
                onClick={() => setSelectedRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedRoleFilter === 'all' ? 'bg-[#2c5ea0] text-white' : 'text-[#4a5568] hover:bg-[#d4dde9]'}`}
              >
                Tất cả bộ phận
              </button>
              <button 
                onClick={() => setSelectedRoleFilter('security')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedRoleFilter === 'security' ? 'bg-[#2c5ea0] text-white' : 'text-[#4a5568] hover:bg-[#d4dde9]'}`}
              >
                👮 Bảo vệ
              </button>
              <button 
                onClick={() => setSelectedRoleFilter('cleaner')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedRoleFilter === 'cleaner' ? 'bg-[#2c5ea0] text-white' : 'text-[#4a5568] hover:bg-[#d4dde9]'}`}
              >
                🧹 Tạp vụ
              </button>
              <button 
                onClick={() => setSelectedRoleFilter('librarian')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${selectedRoleFilter === 'librarian' ? 'bg-[#2c5ea0] text-white' : 'text-[#4a5568] hover:bg-[#d4dde9]'}`}
              >
                📚 Thư viện
              </button>
            </div>
          </div>

          <div className="text-[11px] text-[#7b8a9e] font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="w-3 h-3 bg-[#f5f8fc] border border-dashed border-[#7b8a9e] inline-block rounded"></span> Nháp (Draft)
            <span className="w-3 h-3 bg-[#2e6b8a]/10 border border-[#2e6b8a]/20 inline-block rounded"></span> Đã xuất bản (Published)
            <span className="w-3 h-3 bg-red-100 border border-red-300 inline-block rounded"></span> Cảnh báo xung đột
          </div>
        </div>

        {/* Pivot Grid Board */}
        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] rounded-3xl overflow-hidden flex flex-col mb-8">
          
          <div className="p-4 bg-[#e8eef6] border-b border-[#b8c6d9] flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-[#2c5ea0]" /> Bảng phân công ca trực ma trận
            </h3>
            <span className="text-[10px] font-bold text-[#2c5ea0] bg-red-50 border border-red-200 px-2 py-0.5 rounded flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Gợi ý: Click ô bất kỳ để thêm ca trực cho nhân sự đó.
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5ea0]"></div>
              <p className="text-xs font-bold text-[#7b8a9e] uppercase tracking-wider mt-3">Đang cập nhật sơ đồ lịch trực...</p>
            </div>
          ) : (
            <div className="overflow-x-auto min-w-full">
              <table className="w-full border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#f5f8fc] border-b-2 border-[#b8c6d9]">
                    <th className="p-4 text-left border-r border-[#b8c6d9] text-xs font-bold text-[#4a5568] uppercase tracking-wider w-[220px]">
                      Nhân sự & Vai trò
                    </th>
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((day, idx) => {
                      const dateStr = getWeekDate(idx + 2);
                      const displayDate = dateStr ? dateStr.substring(0, 5) : '';
                      return (
                        <th key={day} className="p-3 text-center border-r border-[#b8c6d9] text-xs font-bold text-[#1e2a3a] w-[140px]">
                          <div>{day}</div>
                          <div className="text-[10px] text-[#7b8a9e] font-semibold mt-0.5">{displayDate}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                  {filteredStaff.map(staff => {
                    const groupColor = 
                      staff.roleType === 'security' ? 'border-l-4 border-l-blue-500' :
                      staff.roleType === 'cleaner' ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-amber-500';
                    return (
                      <tr key={staff.email} className={`hover:bg-[#e8eef6]/40 transition-colors ${groupColor}`}>
                        {/* Staff profile column */}
                        <td className="p-4 border-r border-[#b8c6d9] align-middle">
                          <div className="font-bold text-sm text-[#1e2a3a]">{staff.name}</div>
                          <div className="text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                            {staff.roleType === 'security' && '👮 ' + staff.roleName}
                            {staff.roleType === 'cleaner' && '🧹 ' + staff.roleName}
                            {staff.roleType === 'librarian' && '📚 ' + staff.roleName}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5 truncate max-w-[200px]" title={staff.email}>
                            {staff.email}
                          </div>
                        </td>

                        {/* Schedule columns (Monday -> Sunday) */}
                        {[2, 3, 4, 5, 6, 7, 8].map(dayOfWeek => {
                          const date = getWeekDate(dayOfWeek);
                          const cellShifts = shifts.filter(s => s.staffEmail === staff.email && s.date === date && s.weekId === selectedWeekId);
                          const hasConflict = checkConflicts(staff.email, date, shifts);

                          return (
                            <td 
                              key={dayOfWeek} 
                              onClick={(e) => {
                                // Prevent modal opening if we clicked an inner action button
                                if ((e.target as HTMLElement).closest('.btn-action')) return;
                                openAddShiftCell(staff.email, dayOfWeek);
                              }}
                              className={`p-2 border-r border-[#b8c6d9] align-top text-center cursor-pointer min-h-[90px] relative bg-[#edf2f9] hover:bg-[#dfdacf] transition-all ${
                                hasConflict ? 'bg-red-50/70 border border-red-300' : ''
                              }`}
                            >
                              <div className="space-y-1.5">
                                {cellShifts.map(s => {
                                  const isPublished = s.status === 'published';
                                  const shiftBadge = 
                                    staff.roleType === 'security' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                    staff.roleType === 'cleaner' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                                    'bg-amber-50 text-amber-800 border-amber-200';
                                  return (
                                    <div 
                                      key={s.id} 
                                      className={`p-2 text-left rounded-xl border text-[11px] font-bold shadow-sm relative group/shift ${shiftBadge} ${
                                        isPublished ? 'bg-opacity-100' : 'border-dashed border-gray-400 opacity-90'
                                      }`}
                                    >
                                      {/* Action hover tools */}
                                      <div className="absolute top-1 right-1 opacity-0 group-hover/shift:opacity-100 flex items-center gap-1 transition-opacity">
                                        <button 
                                          title="Sửa ca trực"
                                          onClick={(e) => { e.stopPropagation(); openEditShift(s); }}
                                          className="btn-action p-1 bg-white hover:bg-gray-100 text-gray-700 rounded shadow border border-gray-300"
                                        >
                                          <EditShiftIcon />
                                        </button>
                                        <button 
                                          title="Xóa"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteShiftClick(s.id); }}
                                          className="btn-action p-1 bg-rose-500 hover:bg-rose-600 text-white rounded shadow border border-rose-600"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-1 text-[10px] font-extrabold text-gray-500 mb-0.5">
                                        <Clock className="w-3 h-3" /> {s.shiftType.split(' ')[0]}
                                      </div>
                                      <div className="truncate text-xs font-serif font-bold">{s.shiftType}</div>
                                      <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-1">
                                        <MapPin className="w-3 h-3 shrink-0" /> {s.locationOrArea}
                                      </div>
                                      
                                      <div className="mt-1 flex items-center justify-between text-[9px] text-gray-400">
                                        <span>{isPublished ? '🟢 Đã duyệt' : '📝 Bản nháp'}</span>
                                      </div>
                                    </div>
                                  );
                                })}

                                {cellShifts.length === 0 && (
                                  <div className="h-12 flex items-center justify-center text-[10px] text-[#7b8a9e] italic group-hover:block transition-all opacity-20 hover:opacity-100">
                                    + Thêm ca
                                  </div>
                                )}

                                {hasConflict && (
                                  <div className="mt-1 p-1 bg-red-100 text-red-800 border border-red-200 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 animate-pulse">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Trực trùng ca!
                                  </div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Section: Absences & Exchange Requests & Configuration Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Absences Log */}
          <div className="lg:col-span-2 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] rounded-3xl p-6 flex flex-col">
            <h3 className="text-sm font-serif font-bold text-[#2c5ea0] mb-4 flex items-center gap-2 border-b border-[#b8c6d9] pb-2">
              <Users className="w-5 h-5" /> Nhật ký Đổi ca & Vắng mặt
            </h3>

            {absences.length === 0 ? (
              <p className="text-sm text-[#7b8a9e] italic py-6 text-center">Không có đơn xin vắng mặt hay đổi ca trực nào.</p>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {absences.map(abs => {
                  const roleBadge = 
                    abs.roleType === 'security' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                    abs.roleType === 'cleaner' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 
                    'bg-amber-50 text-amber-800 border-amber-200';
                  return (
                    <div 
                      key={abs.id} 
                      className={`p-4 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white shadow-sm`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#1e2a3a]">{abs.staffName}</span>
                          <span className={`text-[9px] font-bold border rounded px-1.5 py-0.5 uppercase tracking-wider ${roleBadge}`}>
                            {abs.roleType === 'security' ? 'Bảo vệ' : abs.roleType === 'cleaner' ? 'Tạp vụ' : 'Thư viện'}
                          </span>
                          <span className="text-[10px] text-gray-500 font-semibold font-mono">Ngày: {abs.date}</span>
                        </div>
                        <p className="text-xs text-[#4a5568] font-semibold">Lý do: <span className="text-[#2c5ea0] italic">"{abs.reason}"</span></p>
                        {abs.backupStaffName && (
                          <div className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                            🔄 Người trực thay: {abs.backupStaffName} ({abs.backupStaffEmail})
                          </div>
                        )}
                        {abs.approvedBy && (
                          <div className="text-[9px] text-[#7b8a9e] font-bold">Duyệt bởi: {abs.approvedBy}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        {abs.status === 'Chờ duyệt' ? (
                          <>
                            <button 
                              onClick={() => handleApproveAbsence(abs, true)}
                              className="px-3 py-1.5 bg-[#2e6b8a] hover:bg-[#324b3a] text-white border border-[#1e4f6a] rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Duyệt
                            </button>
                            <button 
                              onClick={() => handleApproveAbsence(abs, false)}
                              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            abs.status === 'Đã duyệt' ? 'bg-[#2e6b8a]/10 text-[#2e6b8a] border border-[#2e6b8a]/20' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {abs.status === 'Đã duyệt' ? '🟢 Đã duyệt' : '🔴 Từ chối'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shift configuration card */}
          <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] rounded-3xl p-6">
            <h3 className="text-sm font-serif font-bold text-[#1e2a3a] mb-4 flex items-center gap-2 border-b border-[#b8c6d9] pb-2">
              <Shield className="w-5 h-5 text-[#2c5ea0]" /> Khung cấu hình ca gốc
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">👮 BỘ PHẬN BẢO VỆ</p>
                <div className="text-[11px] text-[#4a5568] space-y-1 pl-2">
                  <p><span className="font-bold">Giờ trực:</span> Ca 1 (6h-14h), Ca 2 (14h-22h), Ca 3 (22h-6h sáng mai)</p>
                  <p><span className="font-bold">Vị trí trực:</span> Chốt Cổng chính, Tuần tra Dãy học, Trực Bãi xe</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">🧹 BỘ PHẬN TẠP VỤ</p>
                <div className="text-[11px] text-[#4a5568] space-y-1 pl-2">
                  <p><span className="font-bold">Giờ trực:</span> Ca Sáng (6h-11h30), Ca Chiều (12h30-17h)</p>
                  <p><span className="font-bold">Vị trí trực:</span> Dãy Khối 1, Dãy Khối 2 & 12, Khu Hiệu bộ, Vệ sinh</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-700 uppercase tracking-widest">📚 BỘ PHẬN THƯ VIỆN</p>
                <div className="text-[11px] text-[#4a5568] space-y-1 pl-2">
                  <p><span className="font-bold">Giờ trực:</span> Ca Hành chính (7h-17h), Ca Trực trưa (11h30-13h)</p>
                  <p><span className="font-bold">Nhiệm vụ:</span> Quầy Mượn/Trả, Kiểm kê Kho, Xử lý hồ sơ phôi bằng</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Roster Add / Edit Shift Modal */}
      {showShiftModal && currentEditShift && (
        <div className="fixed inset-0 z-50 bg-[#1e2a3a]/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-2xl rounded-3xl max-w-md w-full overflow-hidden p-6 relative">
            <button 
              onClick={() => setShowShiftModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-[#e8eef6] rounded-full text-[#7b8a9e] transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h3 className="font-serif font-bold text-[#1e2a3a] text-lg mb-4 flex items-center gap-2 border-b border-[#b8c6d9] pb-2">
              <CalendarDays className="w-5 h-5 text-[#2c5ea0]" /> 
              {isUrgentModal ? 'Thêm Ca trực Khẩn cấp' : (currentEditShift.id ? 'Cập nhật Ca trực' : 'Thêm Ca trực')}
            </h3>

            <form onSubmit={handleSaveShift} className="space-y-4">
              
              {/* Date selection (Locked if not urgent modal) */}
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1">Ngày trực</label>
                {isUrgentModal ? (
                  <select 
                    value={currentEditShift.date}
                    onChange={(e) => {
                      const dates = WEEK_OPTIONS.find(w => w.id === selectedWeekId)?.dates || [];
                      const idx = dates.indexOf(e.target.value);
                      setCurrentEditShift(prev => ({ ...prev, date: e.target.value, dayOfWeek: idx !== -1 ? idx + 2 : 2 }));
                    }}
                    className="w-full p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]"
                  >
                    {(WEEK_OPTIONS.find(w => w.id === selectedWeekId)?.dates || []).map((date, idx) => (
                      <option key={date} value={date}>Thứ {idx + 2 === 8 ? 'Nhật' : idx + 2} ({date})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    disabled 
                    value={currentEditShift.date}
                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-500 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Department/Staff type picker (Locked if cell-specific click) */}
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1">Nhân sự trực</label>
                {isUrgentModal ? (
                  <select 
                    value={currentEditShift.staffEmail}
                    onChange={(e) => {
                      const staff = staffList.find(s => s.email === e.target.value);
                      if (staff) {
                        const templates = SHIFT_TEMPLATES[staff.roleType as keyof typeof SHIFT_TEMPLATES];
                        setCurrentEditShift(prev => ({
                          ...prev,
                          staffEmail: staff.email,
                          staffName: staff.name,
                          roleType: staff.roleType,
                          shiftType: templates.shifts[0],
                          locationOrArea: templates.locations[0]
                        }));
                      }
                    }}
                    className="w-full p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]"
                  >
                    {staffList.map(s => (
                      <option key={s.email} value={s.email}>{s.name} ({s.roleName})</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    disabled 
                    value={currentEditShift.staffName + ' (' + currentEditShift.staffEmail + ')'}
                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-500 cursor-not-allowed"
                  />
                )}
              </div>

              {/* Shift type Template selection */}
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1">Khung ca trực</label>
                <select 
                  value={currentEditShift.shiftType}
                  onChange={(e) => setCurrentEditShift(prev => ({ ...prev, shiftType: e.target.value }))}
                  className="w-full p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]"
                >
                  {SHIFT_TEMPLATES[currentEditShift.roleType as keyof typeof SHIFT_TEMPLATES]?.shifts.map(sh => (
                    <option key={sh} value={sh}>{sh}</option>
                  ))}
                </select>
              </div>

              {/* Location or Area selection */}
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1">Vị trí / Khu vực phụ trách</label>
                <select 
                  value={currentEditShift.locationOrArea}
                  onChange={(e) => setCurrentEditShift(prev => ({ ...prev, locationOrArea: e.target.value }))}
                  className="w-full p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]"
                >
                  {SHIFT_TEMPLATES[currentEditShift.roleType as keyof typeof SHIFT_TEMPLATES]?.locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1">Ghi chú thêm</label>
                <textarea 
                  value={currentEditShift.notes}
                  onChange={(e) => setCurrentEditShift(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                  placeholder="Nhập ghi chú hoặc yêu cầu bàn giao ca..."
                  rows={2}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-wider mb-1">Trạng thái phát hành</label>
                <select 
                  value={currentEditShift.status}
                  onChange={(e) => setCurrentEditShift(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                  className="w-full p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]"
                >
                  <option value="draft">Bản nháp (BGH đang cân nhắc)</option>
                  <option value="published">Xuất bản (Nhân viên thấy ngay)</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#b8c6d9]">
                <button 
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="px-4 py-2 border border-[#b8c6d9] text-[#4a5568] rounded-xl text-xs font-bold hover:bg-[#e8eef6] transition cursor-pointer"
                >
                  Đóng
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#2c5ea0] text-white border border-[#5c2525] rounded-xl text-xs font-bold hover:bg-[#663030] transition shadow-[2px_2px_0px_#153460] active:shadow-none active:translate-y-[2px] cursor-pointer"
                >
                  Lưu ca trực
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </main>
  );
};

// Sub-component for micro icon styling of EditShift
const EditShiftIcon = () => (
  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);
