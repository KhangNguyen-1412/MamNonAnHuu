import React, { useState, useEffect } from 'react';
import { 
  Filter, Plus, Search, DollarSign, CreditCard, PieChart as PieChartIcon, 
  TrendingUp, X, Printer, ShieldAlert, FileText, Ban, Check, AlertCircle, 
  Settings, Users, Building, ShieldCheck, Download, Trash2, Edit, RefreshCw, Send, AlertTriangle
} from 'lucide-react';
import { 
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { auth } from '../../services/firebase';
import { useUserRole } from '../../utils/role';
import { getStudents, Student } from '../../services/studentService';
import { getStaffList, Staff } from '../../services/hrService';
import { NAVIGATION } from '../../data/navigation';
import { 
  getFinanceReceipts, getFinanceTransactions, saveFinanceReceipt, saveFinanceTransaction, 
  TuitionReceipt, FinanceTransaction, getMaintenances, saveMaintenance, Maintenance 
} from '../../services/dbService';

interface FinancePanelProps {
  activeViewTab?: string;
}

interface FeeConfig {
  id: string;
  name: string;
  amount: number;
  appliesTo: string;
}

interface OperatingBill {
  id: string;
  date: string;
  title: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  cashier?: string;
}

interface PayrollVoucher {
  id: string;
  staffId: string;
  name: string;
  baseSalary: number;
  coeff: number;
  seniorityPercent: number;
  overtimeHours: number;
  totalAmount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

interface MaintenanceVoucher {
  id: string;
  ticketId: string;
  location: string;
  detail: string;
  amount: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  operator: string;
  ip: string;
  action: string;
  details: string;
}

// Currency words helper
function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng chẵn';
  const units = ['', 'ngàn', 'triệu', 'tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  
  let result = '';
  const trieu = Math.floor(num / 1000000);
  const ngan = Math.floor((num % 1000000) / 1000);
  const dong = num % 1000;
  
  if (trieu > 0) {
    result += `${digits[trieu]} triệu `;
  }
  if (ngan > 0) {
    const tramNum = Math.floor(ngan / 100);
    const chucNum = Math.floor((ngan % 100) / 10);
    const donviNum = ngan % 10;
    
    if (tramNum > 0) {
      result += `${digits[tramNum]} trăm `;
      if (chucNum === 0 && donviNum > 0) {
        result += 'lẻ ';
      }
    }
    if (chucNum > 0) {
      if (chucNum === 1) result += 'mười ';
      else result += `${digits[chucNum]} mươi `;
    }
    if (donviNum > 0) {
      if (donviNum === 5 && chucNum > 0) result += 'lăm ';
      else if (donviNum === 1 && chucNum > 1) result += 'mốt ';
      else result += `${digits[donviNum]} `;
    }
    result += 'ngàn ';
  }
  if (dong > 0) {
    result += `${dong} đồng`;
  } else {
    result += 'đồng chẵn';
  }
  
  result = result.trim();
  return result.charAt(0).toUpperCase() + result.slice(1);
}

const COLORS = ['#2e6b8a', '#2c5ea0', '#7b8a9e', '#a8c4e0'];

export const FinancePanel: React.FC<FinancePanelProps> = ({ activeViewTab }) => {
  const currentRole = useUserRole();
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Core Db Collections
  const [tuitions, setTuitions] = useState<TuitionReceipt[]>([]);
  const [expenses, setExpenses] = useState<FinanceTransaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

  // Persistent Local Configurations
  const [feeConfigs, setFeeConfigs] = useState<FeeConfig[]>([]);
  const [operatingBills, setOperatingBills] = useState<OperatingBill[]>([]);
  const [payrollVouchers, setPayrollVouchers] = useState<PayrollVoucher[]>([]);
  const [maintenanceVouchers, setMaintenanceVouchers] = useState<MaintenanceVoucher[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [lockDate, setLockDate] = useState<string>('2026-05-31'); // Chief lock date (default End of May)

  // Filters & Page
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]); // For bulk actions

  // Modals state
  const [voidModal, setVoidModal] = useState<{
    isOpen: boolean;
    itemId: string;
    type: 'tuition' | 'expense' | 'payroll' | 'operating' | 'maintenance';
    reason: string;
  } | null>(null);

  const [printReceiptModal, setPrintReceiptModal] = useState<TuitionReceipt | null>(null);
  
  // Custom transaction modals
  const [showFeeConfigModal, setShowFeeConfigModal] = useState<FeeConfig | null>(null);
  const [showBillCreateModal, setShowBillCreateModal] = useState(false);
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState<number>(0);
  const [newBillDate, setNewBillDate] = useState('2026-06-22');

  const [auditHistoryItem, setAuditHistoryItem] = useState<{ type: string; id: string; name: string } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (activeViewTab) {
      setActiveTab(activeViewTab);
    }
  }, [activeViewTab]);

  const loadFinanceWorkspace = async () => {
    try {
      setLoading(true);
      const [tList, eList, stds, stf, maints] = await Promise.all([
        getFinanceReceipts(),
        getFinanceTransactions(),
        getStudents(),
        getStaffList(),
        getMaintenances()
      ]);

      setTuitions(tList);
      setExpenses(eList);
      setStudents(stds);
      setStaffList(stf);
      setMaintenances(maints);

      // 1. Resolve Fee Configs
      const storedFees = localStorage.getItem('finance_fee_configs');
      if (storedFees) {
        setFeeConfigs(JSON.parse(storedFees));
      } else {
        const defaultFees: FeeConfig[] = [
          { id: 'F001', name: 'Học phí lớp Nhà trẻ (24-36 th)', amount: 2200000, appliesTo: 'Khối 0' },
          { id: 'F002', name: 'Học phí khối Mẫu giáo (Mầm/Chồi/Lá)', amount: 1800000, appliesTo: 'Khối 1' },
          { id: 'F003', name: 'Tiền ăn bán trú & sữa xế (Tháng)', amount: 660000, appliesTo: 'Bán trú' },
          { id: 'F004', name: 'Phí cấn trừ tiền ăn ngày nghỉ (mỗi ngày)', amount: 30000, appliesTo: 'Cấn trừ' },
          { id: 'F005', name: 'Bảo hiểm y tế học đường (Năm)', amount: 702000, appliesTo: 'Tất cả' },
          { id: 'F006', name: 'Tiền nước uống & vệ sinh organic', amount: 120000, appliesTo: 'Tất cả' },
          { id: 'F007', name: 'Phí câu lạc bộ năng khiếu tự chọn', amount: 300000, appliesTo: 'Tất cả' }
        ];
        localStorage.setItem('finance_fee_configs', JSON.stringify(defaultFees));
        setFeeConfigs(defaultFees);
      }

      // 2. Resolve Operating Bills
      const storedBills = localStorage.getItem('finance_operating_bills');
      if (storedBills) {
        setOperatingBills(JSON.parse(storedBills));
      } else {
        const defaultBills: OperatingBill[] = [
          { id: 'OP-101', date: '2026-06-18', title: 'Hóa đơn tiền điện toàn trường dãy nhà A, B', amount: 15450000, status: 'approved', cashier: 'Nguyễn Thị Mai' },
          { id: 'OP-102', date: '2026-06-19', title: 'Tiền nước máy Sinh hoạt & Phòng cháy chữa cháy', amount: 2300000, status: 'pending', cashier: 'Nguyễn Thị Mai' },
          { id: 'OP-103', date: '2026-06-20', title: 'Thanh toán dịch vụ cáp quang VNPT phòng IT', amount: 1200000, status: 'draft', cashier: 'Nguyễn Thị Mai' },
          { id: 'OP-104', date: '2026-06-05', title: 'Vật tư văn phòng phẩm học kỳ II (giấy thi, mực in)', amount: 8400000, status: 'approved', cashier: 'Nguyễn Thị Mai' }
        ];
        localStorage.setItem('finance_operating_bills', JSON.stringify(defaultBills));
        setOperatingBills(defaultBills);
      }

      // 3. Resolve Payroll Vouchers
      const storedPayroll = localStorage.getItem('finance_payroll_vouchers');
      if (storedPayroll) {
        setPayrollVouchers(JSON.parse(storedPayroll));
      } else {
        // Calculate dynamic payroll seeds based on hr list
        const defaultPayroll = stf.map((staff, idx) => {
          const baseSalary = 1800000;
          const coeff = staff.id === 'CB1007' ? 3.0 : 2.34;
          const seniorityPercent = staff.id === 'CB1007' ? 15 : 8;
          const overtimeHours = staff.id.startsWith('CB1') ? 10 : 0;
          const totalAmount = baseSalary * coeff * (1 + seniorityPercent / 100) + overtimeHours * 150000;

          return {
            id: `PR-${staff.id}`,
            staffId: staff.id,
            name: staff.name,
            baseSalary,
            coeff,
            seniorityPercent,
            overtimeHours,
            totalAmount: Math.round(totalAmount),
            status: idx < 2 ? 'approved' as const : (idx === 2 ? 'pending' as const : 'draft' as const)
          };
        });
        localStorage.setItem('finance_payroll_vouchers', JSON.stringify(defaultPayroll));
        setPayrollVouchers(defaultPayroll);
      }

      // 4. Resolve Maintenance Vouchers
      const storedMaint = localStorage.getItem('finance_maintenance_vouchers');
      if (storedMaint) {
        setMaintenanceVouchers(JSON.parse(storedMaint));
      } else {
        const completedMaints = maints.filter(m => m.status === 'Đã Hoàn Thành');
        const defaultMaint: MaintenanceVoucher[] = completedMaints.map((m, idx) => ({
          id: `MC-${m.id}`,
          ticketId: m.id,
          location: m.location,
          detail: m.detail,
          amount: m.severity === 'Nghiêm Trọng' ? 3200000 : 850000,
          status: idx === 0 ? 'approved' : 'pending'
        }));
        localStorage.setItem('finance_maintenance_vouchers', JSON.stringify(defaultMaint));
        setMaintenanceVouchers(defaultMaint);
      }

      // 5. Resolve Audit Logs
      const storedLogs = localStorage.getItem('finance_audit_logs');
      if (storedLogs) {
        setAuditLogs(JSON.parse(storedLogs));
      } else {
        const defaultLogs: AuditLog[] = [
          { id: 'AD-801', timestamp: '21/06/2026 08:00', operator: 'phan.van@account.mnah.edu.vn', ip: '192.168.1.5', action: 'Phê duyệt lương', details: 'Khóa bảng lương cán sự Tổ Toán - Tin' },
          { id: 'AD-802', timestamp: '21/06/2026 08:15', operator: 'mai.nguyen@account.mnah.edu.vn', ip: '192.168.1.10', action: 'Tạo đề xuất chi', details: 'Đăng ký chi trả tiền điện sinh hoạt OP-101' },
          { id: 'AD-803', timestamp: '20/06/2026 15:30', operator: 'phan.van@account.mnah.edu.vn', ip: '192.168.1.5', action: 'Khóa sổ', details: 'Đóng cổng tài chính tháng 5/2026' }
        ];
        localStorage.setItem('finance_audit_logs', JSON.stringify(defaultLogs));
        setAuditLogs(defaultLogs);
      }

      // 6. Lock Date
      const storedLock = localStorage.getItem('finance_lock_date');
      if (storedLock) {
        setLockDate(storedLock);
      }

    } catch (err) {
      console.error("Error loading finance workspace", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinanceWorkspace();
  }, []);

  // Helper to record audit events
  const addAuditLog = (action: string, details: string) => {
    const email = auth.currentUser?.email || (currentRole === 'chief_accountant' ? 'phan.van@account.mnah.edu.vn' : 'mai.nguyen@account.mnah.edu.vn');
    const newLog: AuditLog = {
      id: `AD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN').slice(0, 5),
      operator: email,
      ip: '192.168.1.' + Math.floor(10 + Math.random() * 90),
      action,
      details
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev];
      localStorage.setItem('finance_audit_logs', JSON.stringify(updated));
      return updated;
    });
  };

  // Date lock check
  const isDateLocked = (dateStr: string): boolean => {
    // dateStr could be YYYY-MM-DD or DD/MM/YYYY
    let checkDateStr = dateStr;
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      checkDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    const checkTime = new Date(checkDateStr).getTime();
    const lockTime = new Date(lockDate).getTime();
    return checkTime <= lockTime;
  };

  // 1. Fee Config CRUD (Chief Accountant only)
  const handleSaveFeeConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFeeConfigModal) return;
    
    if (currentRole !== 'chief_accountant') {
      alert('Chỉ Kế toán trưởng được phép thay đổi định mức thu chi!');
      return;
    }

    const updated = feeConfigs.map(f => f.id === showFeeConfigModal.id ? showFeeConfigModal : f);
    setFeeConfigs(updated);
    localStorage.setItem('finance_fee_configs', JSON.stringify(updated));
    addAuditLog('Cập nhật định mức', `Thay đổi ${showFeeConfigModal.name} thành ${showFeeConfigModal.amount.toLocaleString()} đ`);
    setShowFeeConfigModal(null);
    showToast('✔️ Cập nhật định mức đợt thu thành công!');
  };

  // 2. Maker Action: Create Operating Bill (Lập đề xuất chi)
  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBillTitle.trim() || newBillAmount <= 0) {
      alert('Vui lòng điền nội dung và số tiền hợp lệ!');
      return;
    }

    if (isDateLocked(newBillDate)) {
      alert(`⚠️ Kỳ kế toán trước ngày ${lockDate} đã bị khóa sổ bởi Kế toán trưởng. Không thể tạo chứng từ vào ngày này!`);
      return;
    }

    const newBill: OperatingBill = {
      id: `OP-${Date.now().toString().slice(-3)}`,
      date: newBillDate,
      title: newBillTitle,
      amount: newBillAmount,
      status: 'draft',
      cashier: 'Nguyễn Thị Mai'
    };

    const updated = [newBill, ...operatingBills];
    setOperatingBills(updated);
    localStorage.setItem('finance_operating_bills', JSON.stringify(updated));
    addAuditLog('Lập đề xuất chi', `Tạo phiếu nháp chi phí vận hành ${newBill.id} - ${newBill.title}`);
    
    setNewBillTitle('');
    setNewBillAmount(0);
    setShowBillCreateModal(false);
    showToast('💾 Đã lưu nháp phiếu chi phí vận hành!');
  };

  const handleTrìnhDuyệtBill = (billId: string) => {
    const bill = operatingBills.find(b => b.id === billId);
    if (!bill) return;

    if (isDateLocked(bill.date)) {
      alert(`⚠️ Kỳ kế toán trước ngày ${lockDate} đã bị khóa sổ. Không thể thao tác!`);
      return;
    }

    const updated = operatingBills.map(b => b.id === billId ? { ...b, status: 'pending' as const } : b);
    setOperatingBills(updated);
    localStorage.setItem('finance_operating_bills', JSON.stringify(updated));
    addAuditLog('Trình duyệt chi', `Trình phiếu chi vận hành ${billId} lên Kế toán trưởng phê duyệt`);
    showToast('📤 Đã trình Kế toán trưởng duyệt chi!');
  };

  // Maker Action: Trình bảng lương
  const handleTrìnhDuyệtLương = (payrollId: string) => {
    const updated = payrollVouchers.map(p => p.id === payrollId ? { ...p, status: 'pending' as const } : p);
    setPayrollVouchers(updated);
    localStorage.setItem('finance_payroll_vouchers', JSON.stringify(updated));
    addAuditLog('Trình duyệt lương', `Trình bảng tính lương giáo viên ${payrollId} lên Kế toán trưởng`);
    showToast('📤 Đã trình phê duyệt lương giáo viên!');
  };

  // Maker Action: Trình thanh toán bảo trì
  const handleTrìnhDuyệtMaint = (voucherId: string) => {
    const updated = maintenanceVouchers.map(v => v.id === voucherId ? { ...v, status: 'pending' as const } : v);
    setMaintenanceVouchers(updated);
    localStorage.setItem('finance_maintenance_vouchers', JSON.stringify(updated));
    addAuditLog('Trình chi bảo trì', `Trình hồ sơ thanh toán bảo trì ${voucherId} nghiệm thu`);
    showToast('📤 Đã trình phê duyệt chi thanh toán bảo trì!');
  };

  // 3. Checker Action: Approve/Reject (Kế toán trưởng phê duyệt / từ chối)
  const handleApproveVoucher = async (id: string, type: 'operating' | 'payroll' | 'maintenance') => {
    if (currentRole !== 'chief_accountant') {
      alert('Chỉ Kế toán trưởng có quyền phê duyệt kiểm soát chi tiêu!');
      return;
    }

    if (type === 'operating') {
      const bill = operatingBills.find(b => b.id === id);
      if (!bill) return;
      
      const updated = operatingBills.map(b => b.id === id ? { ...b, status: 'approved' as const } : b);
      setOperatingBills(updated);
      localStorage.setItem('finance_operating_bills', JSON.stringify(updated));

      // Append transaction to general ledger collection
      const newTx: FinanceTransaction = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('vi-VN'),
        title: `Chi trả: ${bill.title}`,
        amount: -bill.amount,
        type: 'Phiếu Chi'
      };
      await saveFinanceTransaction(newTx);
      setExpenses(prev => [newTx, ...prev]);

      addAuditLog('Duyệt phiếu chi', `Kế toán trưởng phê duyệt phiếu chi vận hành ${id} trị giá ${bill.amount.toLocaleString()} đ`);
      showToast('🟢 Đã phê duyệt và xuất quỹ thành công!');
    } 
    else if (type === 'payroll') {
      const pay = payrollVouchers.find(p => p.id === id);
      if (!pay) return;

      const updated = payrollVouchers.map(p => p.id === id ? { ...p, status: 'approved' as const } : p);
      setPayrollVouchers(updated);
      localStorage.setItem('finance_payroll_vouchers', JSON.stringify(updated));

      // Append transaction
      const newTx: FinanceTransaction = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('vi-VN'),
        title: `Chi lương giáo viên: ${pay.name}`,
        amount: -pay.totalAmount,
        type: 'Phiếu Chi'
      };
      await saveFinanceTransaction(newTx);
      setExpenses(prev => [newTx, ...prev]);

      addAuditLog('Duyệt bảng lương', `Kế toán trưởng phê duyệt chi lương giáo viên ${pay.name} (${pay.staffId})`);
      showToast('🟢 Đã duyệt chi trả lương thành công!');
    }
    else if (type === 'maintenance') {
      const voucher = maintenanceVouchers.find(v => v.id === id);
      if (!voucher) return;

      const updated = maintenanceVouchers.map(v => v.id === id ? { ...v, status: 'approved' as const } : v);
      setMaintenanceVouchers(updated);
      localStorage.setItem('finance_maintenance_vouchers', JSON.stringify(updated));

      // Append transaction
      const newTx: FinanceTransaction = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('vi-VN'),
        title: `Thanh toán sửa chữa: ${voucher.detail} (${voucher.location})`,
        amount: -voucher.amount,
        type: 'Phiếu Chi'
      };
      await saveFinanceTransaction(newTx);
      setExpenses(prev => [newTx, ...prev]);

      addAuditLog('Duyệt chi bảo trì', `Kế toán trưởng phê duyệt chi phí sửa chữa nghiệm thu ${id}`);
      showToast('🟢 Đã duyệt chi trả bảo trì cơ sở vật chất!');
    }
  };

  const handleOpenRejectDialog = (id: string, type: 'tuition' | 'expense' | 'payroll' | 'operating' | 'maintenance') => {
    if (currentRole !== 'chief_accountant') {
      alert('Chỉ Kế toán trưởng mới có quyền kiểm tra, từ chối chứng từ!');
      return;
    }
    setVoidModal({
      isOpen: true,
      itemId: id,
      type,
      reason: ''
    });
  };

  const handleApproveVoidReceiptDirect = async (receiptId: string) => {
    if (currentRole !== 'chief_accountant') {
      alert('Chỉ Kế toán trưởng có quyền phê duyệt hủy biên lai!');
      return;
    }
    const target = tuitions.find(t => t.id === receiptId);
    if (!target) return;
    const reason = target.voidReason || 'Hủy theo yêu cầu của kế toán viên';
    const updated = { ...target, status: 'Đã Hủy' as const, voidReason: reason };
    await saveFinanceReceipt(updated);
    setTuitions(prev => prev.map(t => t.id === receiptId ? updated : t));

    // Append balancing write-back ledger transaction
    const newTx: FinanceTransaction = {
      id: `TX-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString('vi-VN'),
      title: `Hủy & Hoàn trả học phí: ${target.name} (${target.id})`,
      amount: -target.amount,
      type: 'Phiếu Chi',
      voidReason: reason
    };
    await saveFinanceTransaction(newTx);
    setExpenses(prev => [newTx, ...prev]);

    addAuditLog('Đồng ý hủy biên lai', `Kế toán trưởng phê duyệt hủy biên lai đóng tiền học phí ${receiptId}`);
    showToast('🗑️ Đã xác nhận hủy biên lai đóng phí!');
  };

  const handleConfirmRejectOrVoid = async () => {
    if (!voidModal) return;
    const { itemId, type, reason } = voidModal;

    if (type === 'operating') {
      const updated = operatingBills.map(b => b.id === itemId ? { ...b, status: 'rejected' as const, rejectReason: reason } : b);
      setOperatingBills(updated);
      localStorage.setItem('finance_operating_bills', JSON.stringify(updated));
      addAuditLog('Từ chối phiếu chi', `Kế toán trưởng từ chối phiếu chi ${itemId}. Lý do: ${reason}`);
      showToast('🔴 Đã từ chối phiếu chi. Đẩy phản hồi về kế toán viên.');
    } 
    else if (type === 'payroll') {
      const updated = payrollVouchers.map(p => p.id === itemId ? { ...p, status: 'rejected' as const, rejectReason: reason } : p);
      setPayrollVouchers(updated);
      localStorage.setItem('finance_payroll_vouchers', JSON.stringify(updated));
      addAuditLog('Từ chối lương', `Từ chối duyệt lương mã ${itemId}. Lý do: ${reason}`);
      showToast('🔴 Đã trả về yêu cầu tính lương.');
    }
    else if (type === 'maintenance') {
      const updated = maintenanceVouchers.map(v => v.id === itemId ? { ...v, status: 'rejected' as const, rejectReason: reason } : v);
      setMaintenanceVouchers(updated);
      localStorage.setItem('finance_maintenance_vouchers', JSON.stringify(updated));
      addAuditLog('Từ chối chi bảo trì', `Kế toán trưởng từ chối thanh toán sửa chữa ${itemId}. Lý do: ${reason}`);
      showToast('🔴 Đã từ chối phiếu bảo trì.');
    }
    else if (type === 'tuition') {
      // Maker requested void, Checker approves void
      const target = tuitions.find(t => t.id === itemId);
      if (!target) return;
      const updated = { ...target, status: 'Đã Hủy' as const, voidReason: reason };
      await saveFinanceReceipt(updated);
      setTuitions(prev => prev.map(t => t.id === itemId ? updated : t));

      // Append balancing write-back ledger transaction
      const newTx: FinanceTransaction = {
        id: `TX-${Date.now().toString().slice(-4)}`,
        date: new Date().toLocaleDateString('vi-VN'),
        title: `Hủy & Hoàn trả học phí: ${target.name} (${target.id})`,
        amount: -target.amount,
        type: 'Phiếu Chi',
        voidReason: reason
      };
      await saveFinanceTransaction(newTx);
      setExpenses(prev => [newTx, ...prev]);

      addAuditLog('Đồng ý hủy biên lai', `Kế toán trưởng phê duyệt hủy biên lai đóng tiền học phí ${itemId}`);
      showToast('🗑️ Đã xác nhận hủy biên lai đóng phí!');
    }
    else if (type === 'expense') {
      // Voiding a transaction in ledger
      const target = expenses.find(e => e.id === itemId);
      if (!target) return;
      const updated = { ...target, type: 'Đã Hủy' as const, voidReason: reason };
      await saveFinanceTransaction(updated);
      setExpenses(prev => prev.map(e => e.id === itemId ? updated : e));
      addAuditLog('Hủy giao dịch sổ quỹ', `Kế toán trưởng hủy giao dịch ${itemId} khỏi sổ quỹ`);
      showToast('🗑️ Đã hủy giao dịch sổ quỹ!');
    }

    setVoidModal(null);
  };

  // Maker action: Yêu cầu hủy biên lai (đưa vào trạng thái void_pending)
  const handleRequestVoidReceipt = async (receiptId: string) => {
    const target = tuitions.find(t => t.id === receiptId);
    if (!target) return;

    if (isDateLocked(target.date)) {
      alert(`⚠️ Biên lai thuộc kỳ kế toán đã khóa sổ. Không thể yêu cầu hủy!`);
      return;
    }

    const reason = prompt('Nhập lý do yêu cầu hủy biên lai đóng học phí này:');
    if (!reason) return;

    const updated = { ...target, status: 'Chờ Duyệt KH' as const, voidReason: reason };
    await saveFinanceReceipt(updated);
    setTuitions(prev => prev.map(t => t.id === receiptId ? updated : t));
    addAuditLog('Yêu cầu hủy biên lai', `Lập yêu cầu hủy biên lai ${receiptId}. Lý do: ${reason}`);
    showToast('📤 Đã trình Kế toán trưởng phê duyệt hủy biên lai!');
  };

  // 4. Financial Lock Config (Chief Accountant only)
  const handleUpdateLockDate = (date: string) => {
    if (currentRole !== 'chief_accountant') {
      alert('Chỉ Kế toán trưởng có quyền thay đổi cài đặt khóa sổ kế toán!');
      return;
    }
    setLockDate(date);
    localStorage.setItem('finance_lock_date', date);
    addAuditLog('Khóa sổ tài chính', `Đổi ngày giới hạn khóa sổ sang ${date}`);
    showToast(`🔒 Đã cập nhật ngày khóa sổ sang ngày ${date}!`);
  };

  // 5. Bulk actions for debtors
  const handleToggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (studentsList: Student[]) => {
    if (selectedItemIds.length === studentsList.length) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(studentsList.map(s => s.id));
    }
  };

  const handleBulkReceipts = async () => {
    if (selectedItemIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xuất biên lai thu tiền hàng loạt cho ${selectedItemIds.length} học sinh đã chọn?`)) {
      try {
        setLoading(true);
        let count = 0;
        for (const studentId of selectedItemIds) {
          const student = students.find(s => s.id === studentId);
          if (!student) continue;

          // Check if already paid
          const paid = tuitions.find(t => t.name === student.name && t.className === student.grade && t.status === 'Đã Nộp');
          if (paid) continue;

          // Issue tuition receipt
          const feeAmount = feeConfigs.find(f => f.appliesTo === student.grade)?.amount || 1800000;
          const newReceipt: TuitionReceipt = {
            id: `HD-${Date.now().toString().slice(-3)}-${count}`,
            name: student.name,
            className: student.grade,
            amount: feeAmount,
            status: 'Đã Nộp',
            date: new Date().toLocaleDateString('vi-VN'),
            cashier: 'Nguyễn Thị Mai'
          };
          await saveFinanceReceipt(newReceipt);
          setTuitions(prev => [newReceipt, ...prev]);

          // Ledger record
          const newTx: FinanceTransaction = {
            id: `TX-${Date.now().toString().slice(-4)}-${count}`,
            date: new Date().toLocaleDateString('vi-VN'),
            title: `Thu học phí: ${student.name} (${student.grade})`,
            amount: feeAmount,
            type: 'Phiếu Thu'
          };
          await saveFinanceTransaction(newTx);
          setExpenses(prev => [newTx, ...prev]);
          count++;
        }
        addAuditLog('Phát hành biên lai hàng loạt', `Tự động gạch nợ học phí hàng loạt cho ${count} học sinh`);
        setSelectedItemIds([]);
        showToast(`💾 Đã phát hành thành công ${count} biên lai đóng phí!`);
        loadFinanceWorkspace();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkZaloRemind = () => {
    if (selectedItemIds.length === 0) return;
    alert(`📢 Đã gửi tin nhắn nhắc nợ học phí tự động qua Zalo/SMS đến phụ huynh của ${selectedItemIds.length} học sinh vắng nộp.`);
    addAuditLog('Nhắc nợ hàng loạt', `Gửi tin nhắn nhắc nợ Zalo hàng loạt cho ${selectedItemIds.length} học sinh`);
    setSelectedItemIds([]);
  };

  // CSV Export utility
  const handleExportCSV = (type: 'tuition' | 'expenses' | 'ledger' | 'audit') => {
    let csvContent = '\uFEFF';
    let filename = '';

    if (type === 'tuition') {
      csvContent += 'Mã Học Sinh,Họ Và Tên,Khối Lớp,Trạng Thái Nộp Học Phí,Định Mức Học Phí (VNĐ)\n';
      students.forEach(s => {
        const isPaid = tuitions.some(t => t.name === s.name && t.className === s.grade && t.status === 'Đã Nộp');
        const fee = feeConfigs.find(f => f.appliesTo === s.grade)?.amount || 1800000;
        csvContent += `${s.id},${s.name},${s.grade},${isPaid ? 'Đã Nộp' : 'Chưa Đóng'},${fee}\n`;
      });
      filename = `CongNoHocPhi_${new Date().toLocaleDateString('vi-VN')}.csv`;
    } 
    else if (type === 'expenses') {
      csvContent += 'Mã Giao Dịch,Nội Dung Chi,Số Tiền,Trạng Thái Duyệt\n';
      operatingBills.forEach(b => {
        csvContent += `${b.id},${b.title},${b.amount},${b.status}\n`;
      });
      filename = `ChiPhiDuyet_${new Date().toLocaleDateString('vi-VN')}.csv`;
    }
    else if (type === 'ledger') {
      csvContent += 'Mã Phiếu,Ngày Giao Dịch,Nội Dung,Số Tiền (VNĐ),Loại Giao Dịch\n';
      expenses.forEach(e => {
        csvContent += `${e.id},${e.date},${e.title},${e.amount},${e.type}\n`;
      });
      filename = `SoQuyTienGửi_${new Date().toLocaleDateString('vi-VN')}.csv`;
    }
    else if (type === 'audit') {
      csvContent += 'Mã Log,Thời Gian,Người Thực Hiện,Địa Chỉ IP,Thao Tác,Chi Tiết\n';
      auditLogs.forEach(l => {
        csvContent += `${l.id},${l.timestamp},${l.operator},${l.ip},${l.action},"${l.details}"\n`;
      });
      filename = `NhatKyKiemToan_${new Date().toLocaleDateString('vi-VN')}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📊 Đã xuất dữ liệu Excel thành công!');
  };

  // CSV Import utility
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  
  const handleConfirmImport = async () => {
    if (!importText.trim()) return;
    try {
      setLoading(true);
      const lines = importText.split('\n');
      let count = 0;
      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 4) {
          // Format expected: Name,Grade,Amount,Date
          const name = parts[0].trim();
          const className = parts[1].trim();
          const amount = parseInt(parts[2].trim(), 10);
          const date = parts[3].trim() || new Date().toLocaleDateString('vi-VN');

          if (!name || !className || isNaN(amount)) continue;

          const newReceipt: TuitionReceipt = {
            id: `HD-IMP-${Date.now().toString().slice(-3)}-${count}`,
            name,
            className,
            amount,
            status: 'Đã Nộp',
            date,
            cashier: 'Nguyễn Thị Mai'
          };
          await saveFinanceReceipt(newReceipt);
          setTuitions(prev => [newReceipt, ...prev]);

          const newTx: FinanceTransaction = {
            id: `TX-IMP-${Date.now().toString().slice(-4)}-${count}`,
            date,
            title: `Thu học phí import: ${name} (${className})`,
            amount,
            type: 'Phiếu Thu'
          };
          await saveFinanceTransaction(newTx);
          setExpenses(prev => [newTx, ...prev]);
          count++;
        }
      }
      addAuditLog('Import dữ liệu học phí', `Nhập khẩu thành công ${count} biên lai đóng phí từ danh sách Excel`);
      setShowImportModal(false);
      setImportText('');
      showToast(`💾 Đã import thành công ${count} biên lai đóng phí!`);
      loadFinanceWorkspace();
    } catch (err) {
      console.error(err);
      alert('Lỗi định dạng import. Định dạng mẫu: Tên học sinh,Khối lớp,Số tiền,Ngày đóng');
    } finally {
      setLoading(false);
    }
  };

  // Computations for KPI cards
  const totalRevThisMonth = expenses
    .filter(e => e.type === 'Phiếu Thu' && e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0);

  const activeReceipts = tuitions.filter(t => t.status !== 'Đã Hủy');
  const unpaidCount = students.length - activeReceipts.filter(t => t.status === 'Đã Nộp').length;
  const unpaidAmount = students.reduce((sum, s) => {
    const isPaid = activeReceipts.some(t => t.name === s.name && t.className === s.grade && t.status === 'Đã Nộp');
    if (!isPaid) {
      const fee = feeConfigs.find(f => f.appliesTo === s.grade)?.amount || 1800000;
      return sum + fee;
    }
    return sum;
  }, 0);

  const cashBalance = expenses
    .filter(e => e.type !== 'Đã Hủy')
    .reduce((sum, e) => sum + e.amount, 0);

  const bankBalance = 432500000 + cashBalance; // Seed bank opening balance + flow

  const expectedPayroll = payrollVouchers.reduce((sum, p) => sum + p.totalAmount, 0);

  // Filters compute
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = filterClass === 'All' || s.grade === filterClass;
    
    const paid = tuitions.some(t => t.name === s.name && t.className === s.grade && t.status === 'Đã Nộp');
    const matchesStatus = filterStatus === 'All' || 
      (filterStatus === 'Paid' && paid) || 
      (filterStatus === 'Unpaid' && !paid);

    return matchesSearch && matchesClass && matchesStatus;
  });

  const uniqueClasses = Array.from(new Set(students.map(s => s.grade))).sort();

  // Operating pending approvals count
  const pendingOperating = operatingBills.filter(b => b.status === 'pending');
  const pendingPayroll = payrollVouchers.filter(p => p.status === 'pending');
  const pendingMaintenance = maintenanceVouchers.filter(v => v.status === 'pending');
  const pendingVoidReceipts = tuitions.filter(t => t.status === 'Chờ Duyệt KH');

  const totalPendingReviews = pendingOperating.length + pendingPayroll.length + pendingMaintenance.length + pendingVoidReceipts.length;

  // Resolve active group details
  const activeNavItem = NAVIGATION.find(item => item.id === activeTab || item.id === `finance-${activeTab}`);
  const groupLabel = activeNavItem?.group 
    ? activeNavItem.group.split(' & ').map(word => 
        word.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
      ).join(' & ')
    : activeNavItem?.label || 'Tổng quan Tài chính';

  const headerTitle = currentRole === 'chief_accountant'
    ? `Kế toán trưởng — ${groupLabel}`
    : `Phòng Kế Toán — ${groupLabel}`;

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[#f5f8fc]">
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-[#f5f8fc] border border-[#b8c6d9] px-6 py-3 rounded-2xl shadow-lg flex items-center font-bold text-xs uppercase tracking-wider animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 mr-2 text-green-400" /> {toast}
        </div>
      )}

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0 gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">
              {headerTitle}
            </h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">
              Hệ thống kiểm soát tài chính kép độc lập (Zero-Tolerance for Errors)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex px-3 py-1 bg-[#2c5ea0]/10 text-[#2c5ea0] border border-[#2c5ea0]/20 text-[10px] font-bold uppercase tracking-widest rounded-lg">
              Kỳ: T06/26
            </span>
            <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg border ${
              lockDate ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
            }`}>
              {lockDate ? `Đã khóa sổ trước: ${lockDate.split('-').reverse().join('/')}` : 'Mở sổ tự do'}
            </span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {(activeTab === 'finance-overview' || activeTab === 'overview') && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI indicators */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Tổng thu tháng này</span>
                  <span className="text-2xl font-serif font-bold text-[#2e6b8a] mt-2 block">{(totalRevThisMonth).toLocaleString()} VNĐ</span>
                </div>
                <DollarSign className="w-8 h-8 text-[#2e6b8a] opacity-60" />
              </div>

              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Công nợ học phí</span>
                  <span className="text-2xl font-serif font-bold text-red-700 mt-2 block">{unpaidCount} HS / {unpaidAmount.toLocaleString()} đ</span>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-700 opacity-60 animate-pulse" />
              </div>

              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Số dư Quỹ khả dụng</span>
                  <span className="text-xl font-serif font-bold text-[#1e2a3a] mt-2 block">
                    <span className="text-xs text-gray-500 block font-sans">Bank: {bankBalance.toLocaleString()} đ</span>
                    <span className="text-xs text-gray-500 block font-sans">Cash: {cashBalance.toLocaleString()} đ</span>
                  </span>
                </div>
                <TrendingUp className="w-8 h-8 text-[#7b8a9e] opacity-60" />
              </div>

              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Quỹ lương dự kiến</span>
                  <span className="text-2xl font-serif font-bold text-amber-700 mt-2 block">{expectedPayroll.toLocaleString()} VNĐ</span>
                </div>
                <Users className="w-8 h-8 text-amber-700 opacity-60" />
              </div>
            </div>

            {/* Pending actions (Maker-Checker inbox) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-6">
                
                {/* Maker-Checker Pending Queue */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-4">
                  <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
                    <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-2 text-[#2c5ea0]" />
                      {currentRole === 'chief_accountant' ? `Danh sách chờ duyệt (${totalPendingReviews} yêu cầu)` : 'Hồ sơ đã lập - Đang chờ duyệt'}
                    </h4>
                    {totalPendingReviews > 0 && currentRole === 'chief_accountant' && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[9px] font-bold uppercase rounded-md animate-pulse">
                        Cần xử lý gấp
                      </span>
                    )}
                  </div>

                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {/* Void Requests (Biên lai) */}
                    {pendingVoidReceipts.map(r => (
                      <div key={r.id} className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex items-center justify-between text-xs gap-4">
                        <div>
                          <p className="font-bold text-red-950">⚠️ Yêu cầu HỦY BIÊN LAI {r.id}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Học sinh: {r.name} • Lớp {r.className} • Trị giá: {r.amount.toLocaleString()} đ</p>
                          <p className="text-[10px] text-red-700 italic mt-0.5">Lý do trình: "{r.voidReason}"</p>
                        </div>
                        {currentRole === 'chief_accountant' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveVoidReceiptDirect(r.id)} // This triggers void approval directly
                              className="px-3 py-1 bg-red-700 text-white font-bold rounded-lg text-[10px] hover:bg-red-800"
                            >
                              Đồng ý Hủy
                            </button>
                            <button 
                              onClick={() => {
                                const target = tuitions.find(t => t.id === r.id);
                                if (target) {
                                  saveFinanceReceipt({ ...target, status: 'Đã Nộp', voidReason: '' });
                                  setTuitions(prev => prev.map(t => t.id === r.id ? { ...t, status: 'Đã Nộp', voidReason: '' } : t));
                                  showToast('Đã bác bỏ yêu cầu hủy biên lai.');
                                }
                              }} 
                              className="px-3 py-1 bg-gray-200 text-gray-700 font-bold rounded-lg text-[10px]"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Đang chờ duyệt...</span>
                        )}
                      </div>
                    ))}

                    {/* Operating Bills pending */}
                    {operatingBills.filter(b => b.status === 'pending').map(b => (
                      <div key={b.id} className="p-3 bg-amber-50/30 border border-amber-200 rounded-xl flex items-center justify-between text-xs gap-4">
                        <div>
                          <p className="font-bold text-[#1e2a3a]">📝 Đề xuất chi vận hành: {b.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">ID: {b.id} • Ngày: {b.date} • Số tiền: {b.amount.toLocaleString()} đ</p>
                        </div>
                        {currentRole === 'chief_accountant' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveVoucher(b.id, 'operating')}
                              className="px-3 py-1 bg-[#2e6b8a] text-white font-bold rounded-lg text-[10px] hover:bg-[#2d4334]"
                            >
                              Chi Quỹ
                            </button>
                            <button 
                              onClick={() => handleOpenRejectDialog(b.id, 'operating')}
                              className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-[10px] hover:bg-red-200"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Đang chờ duyệt...</span>
                        )}
                      </div>
                    ))}

                    {/* Payroll Vouchers pending */}
                    {payrollVouchers.filter(p => p.status === 'pending').map(p => (
                      <div key={p.id} className="p-3 bg-amber-50/30 border border-amber-200 rounded-xl flex items-center justify-between text-xs gap-4">
                        <div>
                          <p className="font-bold text-[#1e2a3a]">👔 Chi trả lương: {p.name}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">MSCB: {p.staffId} • Hệ số: {p.coeff} • Thực nhận: {p.totalAmount.toLocaleString()} đ</p>
                        </div>
                        {currentRole === 'chief_accountant' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveVoucher(p.id, 'payroll')}
                              className="px-3 py-1 bg-[#2e6b8a] text-white font-bold rounded-lg text-[10px]"
                            >
                              Duyệt Chi
                            </button>
                            <button 
                              onClick={() => handleOpenRejectDialog(p.id, 'payroll')}
                              className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-[10px]"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Đang chờ duyệt...</span>
                        )}
                      </div>
                    ))}

                    {/* Maintenance pending */}
                    {maintenanceVouchers.filter(v => v.status === 'pending').map(v => (
                      <div key={v.id} className="p-3 bg-amber-50/30 border border-amber-200 rounded-xl flex items-center justify-between text-xs gap-4">
                        <div>
                          <p className="font-bold text-[#1e2a3a]">🛠️ Nghiệm thu sửa chữa: {v.detail}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">Phòng: {v.location} • Chi phí đề xuất: {v.amount.toLocaleString()} đ</p>
                        </div>
                        {currentRole === 'chief_accountant' ? (
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleApproveVoucher(v.id, 'maintenance')}
                              className="px-3 py-1 bg-[#2e6b8a] text-white font-bold rounded-lg text-[10px]"
                            >
                              Chi Quỹ
                            </button>
                            <button 
                              onClick={() => handleOpenRejectDialog(v.id, 'maintenance')} // standard reject
                              className="px-3 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-[10px]"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Đang chờ duyệt...</span>
                        )}
                      </div>
                    ))}

                    {totalPendingReviews === 0 && (
                      <p className="text-xs text-gray-400 text-center py-6">Không có yêu cầu giao dịch nào đang chờ xử lý.</p>
                    )}
                  </div>
                </div>

                {/* Flow analytics chart */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-4">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Dòng Tiền Vào / Ra Thực Tế (Triệu VNĐ)</h4>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'T02/26', Thu: 120, Chi: 90 },
                        { name: 'T03/26', Thu: 180, Chi: 110 },
                        { name: 'T04/26', Thu: 210, Chi: 130 },
                        { name: 'T05/26', Thu: 190, Chi: 95 },
                        { name: 'T06/26', Thu: Number((totalRevThisMonth / 1000000).toFixed(1)), Chi: 80 }
                      ]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorThu" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2e6b8a" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#2e6b8a" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorChi" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2c5ea0" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#2c5ea0" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7b8a9e', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7b8a9e', fontWeight: 'bold' }} />
                        <Tooltip />
                        <Legend iconType="circle" />
                        <Area type="monotone" dataKey="Thu" stroke="#2e6b8a" fillOpacity={1} fill="url(#colorThu)" />
                        <Area type="monotone" dataKey="Chi" stroke="#2c5ea0" fillOpacity={1} fill="url(#colorChi)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Right panel: Recent actions & locks */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Emergency Warnings */}
                <div className="bg-[#ebd1cf]/20 border border-[#2c5ea0]/30 p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#ebd1cf] pb-2 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" /> Xử lý Khẩn Cấp
                  </h4>
                  <div className="space-y-3 text-xs leading-relaxed text-red-950">
                    {unpaidCount > 300 && (
                      <div className="p-3 bg-white border border-red-200 rounded-xl space-y-2">
                        <span className="font-bold text-red-700">⚠️ Chậm đóng học phí:</span>
                        <p className="text-[11px] text-gray-500">Hơn {unpaidCount} học sinh chưa nộp học phí đợt này. Lượng công nợ treo cao ({unpaidAmount.toLocaleString()} đ).</p>
                        <button onClick={() => setActiveTab('tuition')} className="text-[10px] font-bold text-blue-700 hover:underline flex items-center">
                          Đi kiểm tra và đôn đốc Zalo ➔
                        </button>
                      </div>
                    )}
                    <div className="p-3 bg-white border border-red-200 rounded-xl space-y-1.5">
                      <span className="font-bold text-[#1e2a3a]">🌐 Hóa đơn VNPT:</span>
                      <p className="text-[11px] text-gray-500">Hóa đơn mạng VNPT phòng máy tính đến hạn đóng vào ngày mai. Số tiền: 1.200.000 đ.</p>
                      {currentRole !== 'chief_accountant' ? (
                        <button 
                          onClick={() => {
                            const vnpt = operatingBills.find(b => b.id === 'OP-103');
                            if (vnpt && vnpt.status === 'draft') {
                              handleTrìnhDuyệtBill('OP-103');
                            }
                          }}
                          className="text-[10px] font-bold text-[#2c5ea0] hover:underline"
                        >
                          Trình Kế toán trưởng chi ngay ➔
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleApproveVoucher('OP-103', 'operating')}
                          className="text-[10px] font-bold text-[#2e6b8a] hover:underline"
                        >
                          Chi quỹ ngay ➔
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Audit quick log */}
                <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-3.5">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                    Lịch sử thao tác
                  </h4>
                  <div className="space-y-3">
                    {auditLogs.slice(0, 3).map(log => (
                      <div key={log.id} className="text-xs space-y-1">
                        <span className="text-[9px] font-bold text-[#7b8a9e]">{log.timestamp} • IP: {log.ip}</span>
                        <p className="font-bold text-[#1e2a3a] leading-snug">{log.action}</p>
                        <p className="text-[10px] text-gray-500 italic">By: {log.operator}</p>
                        <p className="text-[10px] text-gray-600">{log.details}</p>
                        <hr className="border-dashed border-[#dce4ee] mt-2" />
                      </div>
                    ))}
                    {currentRole === 'chief_accountant' && (
                      <button onClick={() => setActiveTab('audit')} className="w-full text-center text-[10px] font-bold text-blue-700 hover:underline uppercase tracking-wider block">
                        Xem toàn bộ nhật ký ➔
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Recent Transactions list */}
            <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-4">
              <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Sổ giao dịch ngân quỹ gần đây nhất</h4>
              <div className="overflow-auto max-h-[300px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[#4a5568] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="p-3">Mã phiếu</th>
                      <th className="p-3">Ngày</th>
                      <th className="p-3">Nội dung</th>
                      <th className="p-3 text-right">Số tiền (VNĐ)</th>
                      <th className="p-3 text-center">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.slice(0, 5).map(e => (
                      <tr key={e.id} className="border-b border-[#dce4ee] hover:bg-[#f5f8fc]">
                        <td className="p-3 font-mono font-bold text-[#7b8a9e]">{e.id}</td>
                        <td className="p-3">{e.date}</td>
                        <td className="p-3 font-bold">{e.title}</td>
                        <td className={`p-3 text-right font-bold ${e.amount < 0 ? 'text-[#2c5ea0]' : 'text-[#2e6b8a]'}`}>
                          {e.amount.toLocaleString()} đ
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                            e.type === 'Phiếu Thu' ? 'bg-[#e5f0e8] text-[#2e6b8a]' : 
                            e.type === 'Phiếu Chi' ? 'bg-amber-50 text-amber-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {e.type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: config fees (CẤU HÌNH ĐỢT THU) */}
        {(activeTab === 'finance-fees' || activeTab === 'fees') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Định mức các khoản thu quy định tại cơ sở</h4>
              {currentRole === 'chief_accountant' ? (
                <p className="text-[10px] text-green-700 font-bold uppercase">🔓 Bạn đang có quyền sửa đổi định mức</p>
              ) : (
                <p className="text-[10px] text-[#7b8a9e] font-bold uppercase">🔒 Chỉ xem (Chỉ Kế toán trưởng có quyền thay đổi)</p>
              )}
            </div>

            <div className="overflow-auto max-h-[400px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[10px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4">Mã định mức</th>
                    <th className="p-4">Tên khoản thu</th>
                    <th className="p-4">Đối tượng áp dụng</th>
                    <th className="p-4 text-right">Định mức nộp học phí</th>
                    {currentRole === 'chief_accountant' && <th className="p-4 text-center">Tác vụ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee] text-xs">
                  {feeConfigs.map(f => (
                    <tr key={f.id} className="hover:bg-[#f5f8fc] transition-colors">
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">{f.id}</td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{f.name}</td>
                      <td className="p-4 font-bold text-[#4a5568]">{f.appliesTo}</td>
                      <td className="p-4 text-right font-serif text-base font-bold text-[#2e6b8a]">
                        {f.amount.toLocaleString()} đ
                      </td>
                      {currentRole === 'chief_accountant' && (
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => setShowFeeConfigModal(f)}
                            className="p-1.5 border border-[#b8c6d9] hover:border-[#2c5ea0] hover:bg-[#ebd1cf]/10 rounded-lg text-gray-500 hover:text-[#2c5ea0] transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Edit fee configuration modal */}
            {showFeeConfigModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-md bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#b8c6d9] pb-2">Điều chỉnh mức đợt thu</h3>
                  <form onSubmit={handleSaveFeeConfig} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Mã khoản thu</label>
                      <input type="text" value={showFeeConfigModal.id} disabled className="w-full p-2 bg-gray-100 border border-[#b8c6d9] text-xs font-bold font-mono rounded" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Tên đợt thu / Khoản phí</label>
                      <input type="text" value={showFeeConfigModal.name} onChange={e => setShowFeeConfigModal({ ...showFeeConfigModal, name: e.target.value })} className="w-full p-2 bg-white border border-[#b8c6d9] text-xs font-bold rounded" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Định mức thu (VNĐ)</label>
                      <input 
                        type="text" 
                        value={showFeeConfigModal.amount.toLocaleString()} 
                        onChange={e => {
                          const clean = e.target.value.replace(/\D/g, '');
                          setShowFeeConfigModal({ ...showFeeConfigModal, amount: clean ? parseInt(clean, 10) : 0 });
                        }} 
                        className="w-full p-2 bg-white border border-[#b8c6d9] text-xs font-bold font-serif text-[#2e6b8a] rounded" 
                        required 
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">Tương đương: {numberToVietnameseWords(showFeeConfigModal.amount)}</span>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setShowFeeConfigModal(null)} className="px-4 py-2 border border-[#b8c6d9] rounded-full text-xs font-bold uppercase">Hủy</button>
                      <button type="submit" className="px-5 py-2 bg-[#2c5ea0] text-white text-xs font-bold uppercase rounded-full">Lưu</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TUITION DEBTORS (CÔNG NỢ HỌC PHÍ) */}
        {(activeTab === 'finance-tuition' || activeTab === 'tuition') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#dce4ee] pb-4">
              <div>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Quản lý và tổng hợp công nợ đóng học phí</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Tìm kiếm học sinh chậm đóng phí, theo dõi đối tượng miễn giảm</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên, mã học sinh..."
                    className="pl-9 pr-4 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[180px] rounded-full"
                  />
                </div>
                <select 
                  value={filterClass} 
                  onChange={e => setFilterClass(e.target.value)} 
                  className="px-3 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold rounded-full"
                >
                  <option value="All">TẤT CẢ KHỐI LỚP</option>
                  {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)} 
                  className="px-3 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold rounded-full"
                >
                  <option value="All">TẤT CẢ TRẠNG THÁI</option>
                  <option value="Paid">ĐÃ ĐÓNG HỌC PHÍ</option>
                  <option value="Unpaid">CHƯA ĐÓNG HỌC PHÍ</option>
                </select>
                
                <button onClick={() => handleExportCSV('tuition')} className="p-2 border border-[#b8c6d9] hover:border-black rounded-lg text-gray-600 hover:text-black transition-colors" title="Xuất CSV">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => setShowImportModal(true)} className="px-4 py-2 bg-[#1e2a3a] hover:bg-black text-[#f5f8fc] text-xs font-bold uppercase rounded-full">
                  Nhập Excel
                </button>
              </div>
            </div>

            {/* Checkbox bulk actions bar */}
            {selectedItemIds.length > 0 && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom duration-200">
                <span className="text-xs font-bold text-amber-950">Đã chọn: <strong className="text-red-700">{selectedItemIds.length}</strong> học sinh</span>
                <div className="flex gap-2">
                  <button 
                    onClick={handleBulkReceipts}
                    className="px-4 py-2 bg-[#2e6b8a] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#2d4334]"
                  >
                    Phát hành Biên lai hàng loạt
                  </button>
                  <button 
                    onClick={handleBulkZaloRemind}
                    className="px-4 py-2 bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-blue-800"
                  >
                    Gửi nhắc nợ Zalo
                  </button>
                  <button onClick={() => setSelectedItemIds([])} className="px-3 py-2 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-lg">
                    Bỏ chọn
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-auto max-h-[450px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[9px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4 text-center w-12">
                      <input 
                        type="checkbox" 
                        checked={selectedItemIds.length === filteredStudents.length && filteredStudents.length > 0} 
                        onChange={() => handleSelectAll(filteredStudents)} 
                        className="w-3.5 h-3.5 cursor-pointer"
                      />
                    </th>
                    <th className="p-4">Mã Học Sinh</th>
                    <th className="p-4">Họ và Tên</th>
                    <th className="p-4">Lớp Học</th>
                    <th className="p-4 text-right">Định mức (VNĐ)</th>
                    <th className="p-4">Diện Miễn Giảm</th>
                    <th className="p-4 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {filteredStudents.map(s => {
                    const isPaid = tuitions.some(t => t.name === s.name && t.className === s.grade && t.status === 'Đã Nộp');
                    const fee = feeConfigs.find(f => f.appliesTo === s.grade)?.amount || 1800000;
                    const isSelected = selectedItemIds.includes(s.id);
                    
                    return (
                      <tr key={s.id} className={`hover:bg-[#f5f8fc] transition-colors ${isSelected ? 'bg-amber-50/20' : ''}`}>
                        <td className="p-4 text-center">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleToggleSelectItem(s.id)}
                            className="w-3.5 h-3.5 cursor-pointer"
                          />
                        </td>
                        <td className="p-4 font-mono font-bold text-[#7b8a9e]">{s.id}</td>
                        <td className="p-4 font-bold text-[#1e2a3a]">{s.name}</td>
                        <td className="p-4 font-bold text-[#4a5568]">{s.grade}</td>
                        <td className="p-4 text-right font-serif font-bold text-[#2e6b8a]">
                          {fee.toLocaleString()} đ
                        </td>
                        <td className="p-4 font-bold text-gray-500">
                          {s.id === 'HS2023.0821' ? 'Diện miễn giảm (Con thương binh - 50%)' : 'Nộp chuẩn 100%'}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded-full border ${
                            isPaid ? 'bg-green-50 text-[#2e6b8a] border-green-200' : 'bg-red-50 text-red-700 border-red-200 animate-pulse'
                          }`}>
                            {isPaid ? 'Đã Nộp' : 'Chưa Đóng'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-6 text-gray-400 font-bold">Không tìm thấy học sinh nào khớp bộ lọc.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Import Dialog */}
            {showImportModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                <div className="w-full max-w-lg bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#b8c6d9] pb-2">Nhập khẩu dữ liệu học phí đóng tay</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Dán nội dung bảng tính Excel (phân tách bằng dấu phẩy). Mẫu định dạng:<br />
                    <code>Họ tên học sinh,Khối lớp,Số tiền đóng,Ngày nộp (DD/MM/YYYY)</code>
                  </p>
                  <textarea
                    rows={6}
                    value={importText}
                    onChange={e => setImportText(e.target.value)}
                    placeholder="Nguyễn Văn A,10A1,1800000,21/06/2026&#10;Trần Thị B,11B2,1900000,21/06/2026"
                    className="w-full p-3 bg-white border border-[#b8c6d9] text-xs font-mono rounded-lg focus:outline-none"
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={() => setShowImportModal(false)} className="px-4 py-2 border border-[#b8c6d9] rounded-full text-xs font-bold uppercase">Hủy</button>
                    <button type="button" onClick={handleConfirmImport} className="px-5 py-2 bg-[#2c5ea0] text-white text-xs font-bold uppercase rounded-full">Nhập Khẩu</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: RECEIPTS LEDGER (DANH SÁCH BIÊN LAI) */}
        {(activeTab === 'finance-receipts' || activeTab === 'receipts') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <div>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Danh mục hóa đơn biên lai điện tử đã phát hành</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Maker-Checker: Kế toán đề xuất hủy, Kế toán trưởng phê duyệt gạch sổ.</p>
              </div>
            </div>

            <div className="overflow-auto max-h-[450px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[9px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4">Mã biên lai</th>
                    <th className="p-4">Học sinh nộp tiền</th>
                    <th className="p-4">Lớp</th>
                    <th className="p-4 text-right">Số tiền (VNĐ)</th>
                    <th className="p-4">Nội dung / Ghi chú</th>
                    <th className="p-4 text-center">Trạng Thái</th>
                    <th className="p-4 text-center">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {tuitions.map(t => (
                    <tr key={t.id} className={`hover:bg-[#f5f8fc] ${t.status === 'Đã Hủy' ? 'line-through text-gray-400 opacity-60' : ''} ${t.id.startsWith('REC-COMP-') ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">
                        <div>{t.id}</div>
                        {t.id.startsWith('REC-COMP-') && (
                          <span className="inline-block text-[8px] bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-full mt-1 font-sans uppercase font-bold">
                            Đền bù Sách
                          </span>
                        )}
                      </td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{t.name}</td>
                      <td className="p-4 font-bold text-[#4a5568]">{t.className}</td>
                      <td className="p-4 text-right font-serif text-sm font-bold text-[#2e6b8a]">{t.amount.toLocaleString()} đ</td>
                      <td className="p-4 italic text-[#2c5ea0] max-w-xs truncate">
                        {t.id.startsWith('REC-COMP-') ? (t.voidReason || 'Khoản đền bù sách mất/hỏng') : (t.voidReason || '—')}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                          t.status === 'Đã Nộp' ? 'bg-green-50 text-[#2e6b8a] border border-green-200' :
                          t.status === 'Chờ Duyệt KH' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                          'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                          {t.status === 'Chờ Duyệt KH' ? 'Chờ Hủy' : t.status}
                        </span>
                      </td>
                      <td className="p-4 text-center flex items-center justify-center gap-2">
                        <button onClick={() => setPrintReceiptModal(t)} className="p-1 border border-[#b8c6d9] hover:border-black rounded-lg text-gray-500 hover:text-black">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {t.status === 'Đã Nộp' && (
                          <button 
                            onClick={() => handleRequestVoidReceipt(t.id)}
                            className="p-1 border border-red-200 hover:border-red-500 rounded-lg text-red-400 hover:text-red-600"
                            title="Yêu cầu hủy"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: PAYROLL & ALLOWANCES (BẢNG LƯƠNG & PHỤ CẤP) */}
        {(activeTab === 'finance-payroll' || activeTab === 'payroll') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <div>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Bảng tổng hợp chi lương &amp; phụ cấp định kỳ cán bộ</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Lương = Lương cơ bản * Hệ số * (1 + Thâm niên) + Giờ phụ trội (150,000 đ/giờ)</p>
              </div>
              <button onClick={() => handleExportCSV('expenses')} className="p-2 border border-[#b8c6d9] hover:border-black rounded-lg text-gray-600 hover:text-black">
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto max-h-[450px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[9px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4">Mã Cán Bộ</th>
                    <th className="p-4">Họ và Tên</th>
                    <th className="p-4 text-center">Hệ Số</th>
                    <th className="p-4 text-center">Thâm Niên</th>
                    <th className="p-4 text-center">Vượt Giờ</th>
                    <th className="p-4 text-right">Tổng Nhận (VNĐ)</th>
                    <th className="p-4 text-center">Trạng Thái</th>
                    <th className="p-4 text-center">Kiểm Soát</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {payrollVouchers.map(p => (
                    <tr key={p.id} className="hover:bg-[#f5f8fc]">
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">{p.staffId}</td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{p.name}</td>
                      <td className="p-4 text-center font-bold text-[#4a5568]">{p.coeff}</td>
                      <td className="p-4 text-center font-bold text-[#4a5568]">{p.seniorityPercent}%</td>
                      <td className="p-4 text-center font-bold text-[#4a5568]">{p.overtimeHours} tiết</td>
                      <td className="p-4 text-right font-serif font-bold text-[#2e6b8a]">{p.totalAmount.toLocaleString()} đ</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                          p.status === 'approved' ? 'bg-green-50 text-[#2e6b8a] border border-green-200' :
                          p.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                          p.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {p.status}
                        </span>
                        {p.rejectReason && p.status === 'rejected' && (
                          <span className="block text-[8px] text-red-600 mt-1">"{p.rejectReason}"</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {p.status === 'draft' && currentRole !== 'chief_accountant' && (
                          <button 
                            onClick={() => handleTrìnhDuyệtLương(p.id)}
                            className="px-3 py-1 bg-[#1e2a3a] text-white font-bold rounded-lg text-[10px] hover:bg-black"
                          >
                            Trình duyệt
                          </button>
                        )}
                        {p.status === 'pending' && currentRole === 'chief_accountant' && (
                          <div className="flex gap-1.5 justify-center">
                            <button 
                              onClick={() => handleApproveVoucher(p.id, 'payroll')}
                              className="p-1 bg-green-50 hover:bg-green-100 text-emerald-700 rounded border border-green-200"
                              title="Duyệt chi"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleOpenRejectDialog(p.id, 'payroll')}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                              title="Từ chối"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {p.status === 'approved' && (
                          <span className="text-gray-400 text-[10px] italic">Đã khóa chi quỹ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: OPERATING EXPENSES (CHI PHÍ VẬN HÀNH & MUA SẮM) */}
        {(activeTab === 'finance-expenses' || activeTab === 'expenses') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <div>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Đề xuất và hóa đơn thanh toán chi phí vận hành</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Điện, nước, viễn thông, và mua sắm vật liệu trường học tinh gọn.</p>
              </div>
              {currentRole !== 'chief_accountant' && (
                <button 
                  onClick={() => setShowBillCreateModal(true)}
                  className="px-5 py-2 bg-[#2c5ea0] hover:bg-[#5a2e2e] text-white text-xs font-bold uppercase rounded-full flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Lập phiếu chi mới
                </button>
              )}
            </div>

            <div className="overflow-auto max-h-[450px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[9px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4">Mã số phiếu</th>
                    <th className="p-4">Ngày hóa đơn</th>
                    <th className="p-4">Nội dung đề xuất</th>
                    <th className="p-4 text-right">Số tiền (VNĐ)</th>
                    <th className="p-4 text-center">Trạng Thái</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {operatingBills.map(b => (
                    <tr key={b.id} className="hover:bg-[#f5f8fc]">
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">{b.id}</td>
                      <td className="p-4 font-serif">{b.date}</td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{b.title}</td>
                      <td className="p-4 text-right font-serif font-bold text-[#2c5ea0]">{b.amount.toLocaleString()} đ</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                          b.status === 'approved' ? 'bg-green-50 text-[#2e6b8a] border border-green-200' :
                          b.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                          b.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {b.status}
                        </span>
                        {b.rejectReason && b.status === 'rejected' && (
                          <span className="block text-[8px] text-red-600 mt-1">"{b.rejectReason}"</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {b.status === 'draft' && currentRole !== 'chief_accountant' && (
                          <button 
                            onClick={() => handleTrìnhDuyệtBill(b.id)}
                            className="px-3 py-1 bg-[#1e2a3a] text-white font-bold rounded-lg text-[10px]"
                          >
                            Trình duyệt
                          </button>
                        )}
                        {b.status === 'pending' && currentRole === 'chief_accountant' && (
                          <div className="flex gap-1.5 justify-center">
                            <button 
                              onClick={() => handleApproveVoucher(b.id, 'operating')}
                              className="p-1 bg-green-50 hover:bg-green-100 text-emerald-700 rounded border border-green-200"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleOpenRejectDialog(b.id, 'operating')}
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {b.status === 'approved' && (
                          <span className="text-gray-400 text-[10px] italic">Đã chi tiền mặt/kho bạc</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Create bill dialog */}
            {showBillCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-scale-up">
                <div className="w-full max-w-md bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4">
                  <h3 className="text-sm font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#b8c6d9] pb-2">Lập phiếu đề xuất chi phí</h3>
                  <form onSubmit={handleCreateBill} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Ngày lập phiếu chi</label>
                      <input type="date" value={newBillDate} onChange={e => setNewBillDate(e.target.value)} className="w-full p-2 bg-white border border-[#b8c6d9] text-xs font-bold rounded" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Nội dung đề xuất / Hóa đơn mua sắm</label>
                      <input type="text" value={newBillTitle} onChange={e => setNewBillTitle(e.target.value)} placeholder="Ví dụ: Mua bóng điện thay thế dãy phòng học lý..." className="w-full p-2 bg-white border border-[#b8c6d9] text-xs font-bold rounded" required />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase mb-1">Số tiền thanh toán (VNĐ)</label>
                      <input 
                        type="text" 
                        value={newBillAmount.toLocaleString()} 
                        onChange={e => {
                          const clean = e.target.value.replace(/\D/g, '');
                          setNewBillAmount(clean ? parseInt(clean, 10) : 0);
                        }} 
                        placeholder="Số tiền chi"
                        className="w-full p-2 bg-white border border-[#b8c6d9] text-xs font-bold font-serif text-[#2c5ea0] rounded" 
                        required 
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">Bằng chữ: {numberToVietnameseWords(newBillAmount)}</span>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setShowBillCreateModal(false)} className="px-4 py-2 border border-[#b8c6d9] rounded-full text-xs font-bold uppercase">Hủy</button>
                      <button type="submit" className="px-5 py-2 bg-[#2c5ea0] text-white text-xs font-bold uppercase rounded-full">Lưu nháp</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: MAINTENANCE PAYMENTS (Duyệt chi thanh toán sửa chữa bảo trì) */}
        {(activeTab === 'finance-maintenance' || activeTab === 'maintenance') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <div>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Hồ sơ thanh toán sửa chữa &amp; cải tạo cơ sở vật chất</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Đối chiếu nghiệm thu sửa chữa từ phòng quản trị để thực hiện chi trả.</p>
              </div>
            </div>

            <div className="overflow-auto max-h-[450px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[9px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4">Mã số hồ sơ</th>
                    <th className="p-4">Mã sự cố gốc</th>
                    <th className="p-4">Địa điểm sửa chữa</th>
                    <th className="p-4">Nội dung khắc phục</th>
                    <th className="p-4 text-right">Chi phí thanh toán</th>
                    <th className="p-4 text-center">Trạng Thái</th>
                    <th className="p-4 text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {maintenanceVouchers.map(v => (
                    <tr key={v.id} className="hover:bg-[#f5f8fc]">
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">{v.id}</td>
                      <td className="p-4 font-mono font-bold text-gray-500">{v.ticketId}</td>
                      <td className="p-4 font-bold text-[#4a5568]">{v.location}</td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{v.detail}</td>
                      <td className="p-4 text-right font-serif font-bold text-[#2c5ea0]">{v.amount.toLocaleString()} đ</td>
                      <td className="p-4 text-center">
                        <span className={`px-2.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                          v.status === 'approved' ? 'bg-green-50 text-[#2e6b8a] border border-green-200' :
                          v.status === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {v.status === 'draft' && currentRole !== 'chief_accountant' && (
                          <button 
                            onClick={() => handleTrìnhDuyệtMaint(v.id)}
                            className="px-3 py-1 bg-[#1e2a3a] text-white font-bold rounded-lg text-[10px]"
                          >
                            Trình duyệt
                          </button>
                        )}
                        {v.status === 'pending' && currentRole === 'chief_accountant' && (
                          <div className="flex gap-1.5 justify-center">
                            <button 
                              onClick={() => handleApproveVoucher(v.id, 'maintenance')}
                              className="p-1 bg-green-50 hover:bg-green-100 text-emerald-700 rounded border border-green-200"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => handleOpenRejectDialog(v.id, 'maintenance')} // reuse standard reject dialog
                              className="p-1 bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        {v.status === 'approved' && (
                          <span className="text-gray-400 text-[10px] italic">Đã thanh quyết toán</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 8: FUND LEDGER (SỔ QUỸ TIỀN MẶT / KHO BẠC) */}
        {(activeTab === 'finance-ledger' || activeTab === 'ledger') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <div>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Nhật ký biến động quỹ ngân sách trường</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Đối soát quỹ tiền mặt tại két sắt cơ sở và số dư tài khoản giao dịch ngân hàng.</p>
              </div>
              <button onClick={() => handleExportCSV('ledger')} className="p-2 border border-[#b8c6d9] hover:border-black rounded-lg text-gray-600 hover:text-black">
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto max-h-[450px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[9px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4">Mã số giao dịch</th>
                    <th className="p-4">Ngày ghi nhận</th>
                    <th className="p-4">Diễn giải nội dung thu chi</th>
                    <th className="p-4 text-right">Biến động quỹ</th>
                    <th className="p-4 text-center">Chứng từ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {expenses.map(e => (
                    <tr key={e.id} className="hover:bg-[#f5f8fc]">
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">{e.id}</td>
                      <td className="p-4 font-serif">{e.date}</td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{e.title}</td>
                      <td className={`p-4 text-right font-serif font-bold ${e.amount < 0 ? 'text-[#2c5ea0]' : 'text-[#2e6b8a]'}`}>
                        {e.amount > 0 ? '+' : ''}{e.amount.toLocaleString()} đ
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded ${
                          e.type === 'Phiếu Thu' ? 'bg-green-50 text-[#2e6b8a]' : 
                          e.type === 'Phiếu Chi' ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 9: REPORTS (BÁO CÁO THU CHI) */}
        {(activeTab === 'finance-reports' || activeTab === 'reports') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <div>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Quyết toán thu chi ngân sách trường học tinh gọn</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Báo cáo cân đối dòng tiền trình Hiệu trưởng và Ban Giám Hiệu phê chuẩn.</p>
              </div>
              <button onClick={() => window.print()} className="px-5 py-2 bg-[#1e2a3a] hover:bg-black text-[#f5f8fc] text-xs font-bold uppercase rounded-full">
                In Báo Cáo
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="border border-[#b8c6d9] p-5 rounded-2xl bg-white shadow-sm space-y-4">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Phân bổ chi phí vận hành</h5>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Lương giáo viên', value: expectedPayroll },
                          { name: 'Chi phí điện nước', value: 17750000 },
                          { name: 'Bảo trì sửa chữa', value: 4050000 },
                          { name: 'Hành chính tổng hợp', value: 8400000 }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="border border-[#b8c6d9] p-5 rounded-2xl bg-white shadow-sm space-y-4">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 text-center">Tiến độ thu học phí toàn trường</h5>
                <div className="h-[220px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Đã hoàn thành', value: students.length - unpaidCount },
                          { name: 'Chưa nộp tiền', value: unpaidCount }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                      >
                        <Cell fill="#2e6b8a" />
                        <Cell fill="#ebd1cf" />
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                    <p className="text-2xl font-bold font-serif text-[#2e6b8a]">{Math.round(((students.length - unpaidCount) / students.length) * 100)}%</p>
                    <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Đã nộp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 10: TAX EXPORTS (XUẤT FILE MISA & KHO BẠC) */}
        {(activeTab === 'finance-tax' || activeTab === 'tax') && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="border-b border-[#dce4ee] pb-3">
              <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest">Đẩy dữ liệu quyết toán sang hệ thống Kho bạc / MISA</h4>
              <p className="text-[10px] text-[#7b8a9e] mt-0.5">Xuất file XML/Excel theo biểu mẫu chuẩn ban hành của Bộ Tài chính.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-[#b8c6d9] p-5 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-48">
                <div>
                  <h5 className="font-bold text-sm text-[#1e2a3a]">File thống kê MISA Bamboo.NET</h5>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">Xuất toàn bộ biên lai học phí và phiếu chi theo định dạng tương thích với phần mềm kế toán hành chính sự nghiệp MISA.</p>
                </div>
                <button onClick={() => handleExportCSV('ledger')} className="w-full py-2 bg-[#1e2a3a] hover:bg-black text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Xuất file MISA (.CSV)
                </button>
              </div>

              <div className="border border-[#b8c6d9] p-5 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-48">
                <div>
                  <h5 className="font-bold text-sm text-[#1e2a3a]">Báo cáo Kho bạc Nhà nước (TABMIS)</h5>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">Kết xuất danh mục quỹ thu chi ngân sách, quyết toán tiền gửi ngân hàng phục vụ đối chiếu kho bạc định kỳ.</p>
                </div>
                <button onClick={() => handleExportCSV('ledger')} className="w-full py-2 bg-[#1e2a3a] hover:bg-black text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Tải mẫu Kho bạc (.CSV)
                </button>
              </div>

              <div className="border border-[#b8c6d9] p-5 rounded-2xl bg-white shadow-sm flex flex-col justify-between h-48">
                <div>
                  <h5 className="font-bold text-sm text-[#1e2a3a]">Báo cáo Thuế &amp; Hóa đơn điện tử</h5>
                  <p className="text-xs text-gray-500 mt-2 leading-relaxed">Xuất danh mục biên lai thuế thu nhập, thuế giá trị gia tăng các dịch vụ bán trú và học liệu để kê khai thuế nhà trường.</p>
                </div>
                <button onClick={() => handleExportCSV('ledger')} className="w-full py-2 bg-[#1e2a3a] hover:bg-black text-white text-xs font-bold uppercase rounded-xl flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Tải file Thuế (.CSV)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 11: CONFIG (CHỈ KẾ TOÁN TRƯƠNG) */}
        {(activeTab === 'finance-config' || activeTab === 'config') && currentRole === 'chief_accountant' && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-8 animate-in fade-in duration-300">
            <div className="border-b border-[#dce4ee] pb-3">
              <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest">Bảng cấu hình định mức &amp; kiểm soát rủi ro của Kế toán trưởng</h4>
              <p className="text-[10px] text-[#7b8a9e] mt-0.5">Phân quyền, giới hạn ngày khóa sổ, và thiết lập luật đối soát Maker-Checker.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Financial Lock Config Card */}
              <div className="border border-[#b8c6d9] p-5 rounded-2xl bg-white shadow-sm space-y-4">
                <h5 className="font-bold text-xs text-[#1e2a3a] uppercase tracking-wider border-b border-[#dce4ee] pb-2 flex items-center">
                  <Settings className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Khóa sổ kế toán định kỳ (Financial Lock)
                </h5>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Thiết lập mốc thời gian khóa sổ tài chính. Sau khi khóa, nhân viên kế toán  không thể sửa đổi, lập phiếu chi hay hủy biên lai đóng phí thuộc thời gian trước ngày đã khóa.
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div>
                    <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Mốc khóa sổ giới hạn</label>
                    <input 
                      type="date" 
                      value={lockDate} 
                      onChange={e => handleUpdateLockDate(e.target.value)}
                      className="p-2 border border-[#b8c6d9] rounded-lg text-xs font-bold focus:outline-none" 
                    />
                  </div>
                  <span className="text-[11px] text-red-700 font-bold bg-red-50 p-2 rounded-lg border border-red-200 mt-5">
                    🔓 Đã khóa sổ trước ngày: {lockDate.split('-').reverse().join('/')}
                  </span>
                </div>
              </div>

              {/* Fee and rate variables config */}
              <div className="border border-[#b8c6d9] p-5 rounded-2xl bg-white shadow-sm space-y-4">
                <h5 className="font-bold text-xs text-[#1e2a3a] uppercase tracking-wider border-b border-[#dce4ee] pb-2 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Cấu hình các tham số chi lương
                </h5>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Lương cơ bản (đồng)</label>
                    <input type="text" defaultValue="1,800,000" disabled className="w-full p-2 bg-gray-100 border border-[#b8c6d9] rounded font-bold" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-[#4a5568] uppercase mb-1">Đơn giá giờ dạy thêm (đồng/tiết)</label>
                    <input type="text" defaultValue="150,000" disabled className="w-full p-2 bg-gray-100 border border-[#b8c6d9] rounded font-bold" />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic">Các tham số này được thiết lập chuẩn theo Nghị định nhà nước dành cho khối th và được Kế toán trưởng khóa chết.</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 12: AUDIT TRAIL LOGS (CHỈ KẾ TOÁN TRƯƠNG) */}
        {(activeTab === 'finance-audit' || activeTab === 'audit') && currentRole === 'chief_accountant' && (
          <div className="bg-white border-[3px] border-double border-[#b8c6d9] p-6 rounded-3xl shadow-[4px_4px_0px_#dce4ee] space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b border-[#dce4ee] pb-3">
              <div>
                <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest">Nhật ký kiểm toán tài chính toàn khóa (Audit Trail)</h4>
                <p className="text-[10px] text-[#7b8a9e] mt-0.5">Giám sát và ghi nhận toàn bộ dấu vết lịch sử chỉnh sửa, phê duyệt giao dịch trên hệ thống.</p>
              </div>
              <button onClick={() => handleExportCSV('audit')} className="p-2 border border-[#b8c6d9] hover:border-black rounded-lg text-gray-600 hover:text-black">
                <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-auto max-h-[450px] border border-[#b8c6d9] dark:border-[#283548] rounded-2xl main-scrollbar">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e8eef6] dark:bg-[#131a25] text-[9px] font-bold text-[#4a5568] uppercase tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="p-4 w-20">Mã log</th>
                    <th className="p-4 w-40">Thời gian</th>
                    <th className="p-4">Người thực hiện</th>
                    <th className="p-4 text-center w-28">Địa chỉ IP</th>
                    <th className="p-4 w-36">Thao tác</th>
                    <th className="p-4">Chi tiết thay đổi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#f5f8fc]">
                      <td className="p-4 font-mono font-bold text-[#7b8a9e]">{log.id}</td>
                      <td className="p-4 font-serif text-gray-500">{log.timestamp}</td>
                      <td className="p-4 font-bold text-[#1e2a3a]">{log.operator}</td>
                      <td className="p-4 text-center font-mono font-semibold text-gray-600">{log.ip}</td>
                      <td className="p-4 font-bold text-[#2c5ea0]">{log.action}</td>
                      <td className="p-4 text-[#4a5568]">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* category dialog void block */}
      {voidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-red-700 flex items-center border-b border-[#b8c6d9] pb-2">
              <ShieldAlert className="w-5 h-5 mr-2" /> HỦY CHỨNG TỪ TÀI CHÍNH
            </h3>
            <p className="text-xs text-[#4a5568] leading-relaxed">
              Bạn đang thực hiện thao tác hủy/từ chối giao dịch <strong className="font-mono text-black">{voidModal.itemId}</strong>. Vui lòng điền lý do bắt buộc để đồng bộ sổ sách và ghi nhật ký kiểm toán.
            </p>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Lý do từ chối / hủy bỏ</label>
              <textarea
                value={voidModal.reason}
                onChange={e => setVoidModal(prev => prev ? { ...prev, reason: e.target.value } : null)}
                placeholder="Nhập lý do chi tiết..."
                rows={3}
                className="w-full p-3 bg-white border border-[#b8c6d9] rounded-xl text-xs font-semibold text-[#1e2a3a] focus:outline-none"
              />
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setVoidModal(null)} className="px-4 py-2 border border-[#b8c6d9] rounded-full text-xs font-bold uppercase">Hủy bỏ</button>
              <button 
                onClick={handleConfirmRejectOrVoid} 
                disabled={!voidModal.reason.trim()} 
                className="px-5 py-2 bg-red-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest rounded-full"
              >
                Ghi sổ hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vintage style printable receipt PREVIEW */}
      {printReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:bg-white print:p-0">
          <div className="w-full max-w-lg bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] rounded-3xl overflow-hidden shadow-2xl flex flex-col print:border-none print:shadow-none print:bg-white print:w-full print:h-full">
            <div className="p-4 bg-[#e8eef6] border-b-[3px] border-double border-[#b8c6d9] flex items-center justify-between print:hidden">
              <span className="font-serif font-bold text-sm text-[#1e2a3a]">Biên lai điện tử chính quy</span>
              <button onClick={() => setPrintReceiptModal(null)} className="p-1.5 text-gray-500 hover:text-black hover:bg-white/50 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-8 space-y-6 flex-1 bg-[#f5f8fc] font-serif relative print:p-4 text-[#1e2a3a]">
              <div className="absolute top-0 right-0 w-32 h-32 border-[3px] border-red-700/20 text-red-700/20 border-double flex items-center justify-center font-bold font-sans text-xs uppercase rounded-full -rotate-12 translate-x-4 translate-y-4 select-none">
                Đã Thu Tiền
              </div>
              
              <div className="text-center space-y-1">
                <h4 className="font-bold text-base uppercase tracking-wider">TRƯỜNG TRUNG HỌC PHỔ THÔNG AN HỮU</h4>
                <p className="text-[10px] text-[#4a5568] font-sans">An Hữu, Cái Bè, Tiền Giang — Hotline: 1900 1234</p>
                <div className="w-24 h-0.5 bg-[#b8c6d9] mx-auto my-3" />
                <h3 className="font-bold text-xl text-[#2c5ea0] uppercase tracking-widest pt-2">BIÊN LAI THU HỌC PHÍ</h3>
                <p className="text-xs font-sans text-[#7b8a9e] uppercase tracking-widest font-bold">Số phiếu: {printReceiptModal.id}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-dashed border-[#b8c6d9] text-xs font-sans">
                <div className="flex justify-between">
                  <span className="text-[#4a5568] font-medium">Họ tên học sinh:</span>
                  <span className="font-bold">{printReceiptModal.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4a5568] font-medium">Lớp học:</span>
                  <span className="font-bold">{printReceiptModal.className}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4a5568] font-medium">Ngày nộp tiền:</span>
                  <span className="font-serif font-bold">{printReceiptModal.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4a5568] font-medium">Thủ quỹ phụ trách:</span>
                  <span className="font-bold">{printReceiptModal.cashier || 'Trần Thị Thu'}</span>
                </div>
              </div>

              <div className="pt-4 border-t-2 border-[#1e2a3a] space-y-2">
                <div className="flex justify-between items-center text-[#1e2a3a]">
                  <span className="font-sans font-bold text-xs uppercase tracking-wider">Tổng cộng thực thu:</span>
                  <span className="font-serif font-bold text-lg text-[#2e6b8a]">{printReceiptModal.amount.toLocaleString()} VNĐ</span>
                </div>
                <p className="text-[10px] italic text-[#4a5568] text-right">
                  ( Bằng chữ: {numberToVietnameseWords(printReceiptModal.amount)} )
                </p>
              </div>

              <div className="grid grid-cols-2 text-center pt-8 text-xs font-sans">
                <div className="space-y-10">
                  <p className="font-bold uppercase tracking-wider">Người nộp tiền</p>
                  <p className="italic text-gray-400 font-serif">(Ký, ghi rõ họ tên)</p>
                </div>
                <div className="space-y-10">
                  <p className="font-bold uppercase tracking-wider">Thủ quỹ thu tiền</p>
                  <p className="italic font-serif text-[#1e2a3a] font-bold underline">Thủ quỹ {printReceiptModal.cashier || 'Trần Thị Thu'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#e8eef6] border-t-[3px] border-double border-[#b8c6d9] flex gap-3 justify-end print:hidden">
              <button onClick={() => setPrintReceiptModal(null)} className="px-5 py-2.5 bg-white border border-[#b8c6d9] font-bold text-xs uppercase tracking-widest rounded-full text-[#4a5568]">Đóng lại</button>
              <button onClick={() => window.print()} className="px-6 py-2.5 bg-[#1e2a3a] border border-[#131a25] text-white font-bold text-xs uppercase tracking-widest rounded-full hover:bg-black transition-all flex items-center shadow-md"><Printer className="w-4 h-4 mr-2" /> In Biên Lai</button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};
