import React, { useState, useEffect } from 'react';
import { Panel } from '../layout/Panel';
import { 
  Shield, 
  Users, 
  UserCheck, 
  Building, 
  Clock, 
  Plus, 
  Search, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  TrendingUp, 
  Printer, 
  ScanLine, 
  RefreshCw, 
  FileText,
  UserCheck2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line
} from 'recharts';
import { 
  getSecurityVisitors, 
  saveSecurityVisitor, 
  deleteSecurityVisitor,
  getSecurityEarlyDismissals, 
  saveSecurityEarlyDismissal, 
  deleteSecurityEarlyDismissal,
  getSecurityAssetPasses, 
  saveSecurityAssetPass, 
  deleteSecurityAssetPass,
  getSecurityPatrols, 
  saveSecurityPatrol, 
  deleteSecurityPatrol,
  getSecurityIncidents, 
  saveSecurityIncident, 
  deleteSecurityIncident,
  getSystemShifts, 
  saveSystemShift,
  getSystemAbsences, 
  saveSystemAbsence,
  SecurityVisitor,
  SecurityEarlyDismissal,
  SecurityAssetPass,
  SecurityPatrol,
  SecurityIncident,
  SystemShift,
  SystemAbsence
} from '../../services/dbService';
import { useUserRole } from '../../utils/role';
import { getStaffList } from '../../services/hrService';
import { auth } from '../../services/firebase';

const TAB_METADATA: Record<string, { title: string; desc: string }> = {
  overview: {
    title: 'Màn hình Giám sát An ninh',
    desc: 'Theo dõi trực tuyến tình trạng ca trực, trạng thái hệ thống an ninh và các chỉ số nhanh'
  },
  access: {
    title: 'Kiểm soát Cổng trường & Ra vào',
    desc: 'Quản lý thông tin khách viếng thăm, thợ sửa chữa bảo trì và phê duyệt học sinh về sớm'
  },
  assets: {
    title: 'An ninh Tài sản & Tuần tra Trị an',
    desc: 'Đối chiếu giấy phép mang tài sản ra cổng trường và ghi chép sổ nhật ký tuần tra phòng học'
  },
  parking: {
    title: 'Quản lý Phương tiện & Bãi xe',
    desc: 'Tra cứu thông tin biển kiểm soát xe học sinh, cán bộ giáo viên và xử lý mất thẻ xe'
  },
  incidents: {
    title: 'Biên bản & Báo cáo Sự cố',
    desc: 'Ghi nhận thông tin cụ thể các sự việc mất trật tự trị an, hỏng hóc hoặc sự cố phát sinh'
  },
  schedule: {
    title: 'Lịch trực & Phân ca Tổ bảo vệ',
    desc: 'Bảng phân công ca trực gác cổng tuần học và điều phối nhân sự tổ bảo vệ'
  },
  attendance: {
    title: 'Chấm công & Phê duyệt Nghỉ phép',
    desc: 'Xét duyệt đơn xin nghỉ phép của nhân sự bảo vệ cấp dưới và theo dõi điểm danh'
  },
  reports: {
    title: 'Báo cáo An ninh & Thống kê định kỳ',
    desc: 'Tổng hợp số liệu sự cố an ninh và lưu lượng ra vào cổng trường định kỳ hàng tháng'
  }
};

const WEEK_OPTIONS = [
  { id: '2026-W25', label: 'Tuần 25 (15/06/2026 - 21/06/2026)', dates: ['15/06/2026', '16/06/2026', '17/06/2026', '18/06/2026', '19/06/2026', '20/06/2026', '21/06/2026'] },
  { id: '2026-W26', label: 'Tuần 26 (22/06/2026 - 28/06/2026)', dates: ['22/06/2026', '23/06/2026', '24/06/2026', '25/06/2026', '26/06/2026', '27/06/2026', '28/06/2026'] },
  { id: '2026-W27', label: 'Tuần 27 (29/06/2026 - 05/07/2026)', dates: ['29/06/2026', '30/06/2026', '31/06/2026', '01/07/2026', '02/07/2026', '03/07/2026', '04/07/2026'] }
];


interface SecurityPanelProps {
  initialTab?: string;
  onSelectModule?: (id: any) => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ initialTab = 'overview', onSelectModule }) => {
  const currentRole = useUserRole();
  
  // UI states
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChief, setIsChief] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState({ name: 'Bác Bảo vệ', title: 'Nhân viên Bảo vệ' });
  const [loading, setLoading] = useState(true);
  const [selectedWeekId, setSelectedWeekId] = useState('2026-W26');

  // Data collections
  const [visitors, setVisitors] = useState<SecurityVisitor[]>([]);
  const [earlyDismissals, setEarlyDismissals] = useState<SecurityEarlyDismissal[]>([]);
  const [assetPasses, setAssetPasses] = useState<SecurityAssetPass[]>([]);
  const [patrols, setPatrols] = useState<SecurityPatrol[]>([]);
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [shifts, setShifts] = useState<SystemShift[]>([]);
  const [leaves, setLeaves] = useState<SystemAbsence[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Modals and Interactive states
  const [showScanner, setShowScanner] = useState(false);
  const [scannerResult, setScannerResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showPatrolModal, setShowPatrolModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAlarmModal, setShowAlarmModal] = useState(false);

  // Form states
  const [newVisitor, setNewVisitor] = useState({ name: '', cccd: '', hostName: '', purpose: '' });
  const [newIncident, setNewIncident] = useState({ type: 'Hỏng hóc CSVC' as any, severity: 'Trung bình' as any, description: '' });
  const [newPatrol, setNewPatrol] = useState({ statusDetails: '', status: 'Bình thường' as any, uncheckedRooms: [] as string[] });
  const [newLeave, setNewLeave] = useState({ startDate: '', endDate: '', reason: '', backupStaffEmail: '' });


  // Load user profile & data
  useEffect(() => {
    const resolveRoleAndData = async () => {
      setLoading(true);
      try {
        const email = auth.currentUser?.email;
        const fetchedStaff = await getStaffList();
        setStaffList(fetchedStaff);

        if (email) {
          const cleanEmail = email.toLowerCase().trim();
          const staff = fetchedStaff.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
          if (staff) {
            const title = staff.role || staff.jobRole || 'Nhân viên Bảo vệ';
            setCurrentUserProfile({ name: staff.name, title });
            if (title.toLowerCase().includes('tổ trưởng')) {
              setIsChief(true);
            }
          }
        }

        // Fetch data
        const [vList, edList, apList, pList, incList, shList, lvList] = await Promise.all([
          getSecurityVisitors(),
          getSecurityEarlyDismissals(),
          getSecurityAssetPasses(),
          getSecurityPatrols(),
          getSecurityIncidents(),
          getSystemShifts(),
          getSystemAbsences()
        ]);

        setVisitors(vList);
        setEarlyDismissals(edList);
        setAssetPasses(apList);
        setPatrols(pList);
        setIncidents(incList);
        setShifts(shList);
        setLeaves(lvList);
      } catch (err) {
        console.error('Error fetching security workspace data:', err);
      } finally {
        setLoading(false);
      }
    };

    resolveRoleAndData();
  }, []);


  // Update tab if prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handlers for Visitors
  const handleCheckInVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVisitor.name || !newVisitor.cccd) return;

    const timeStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const visitorObj: SecurityVisitor = {
      id: 'VIS-' + Math.floor(1000 + Math.random() * 9000),
      name: newVisitor.name,
      cccd: newVisitor.cccd,
      hostName: newVisitor.hostName || 'Văn phòng Nhà trường',
      purpose: newVisitor.purpose || 'Họp/Liên hệ công tác',
      checkInTime: timeStr,
      status: 'Đang ở trường'
    };

    try {
      await saveSecurityVisitor(visitorObj);
      setVisitors(prev => [visitorObj, ...prev]);
      setShowVisitorModal(false);
      setNewVisitor({ name: '', cccd: '', hostName: '', purpose: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckOutVisitor = async (id: string) => {
    const timeStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const target = visitors.find(v => v.id === id);
    if (!target) return;

    const updated: SecurityVisitor = {
      ...target,
      checkOutTime: timeStr,
      status: 'Đã rời trường'
    };

    try {
      await saveSecurityVisitor(updated);
      setVisitors(prev => prev.map(v => v.id === id ? updated : v));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteLog = async (id: string, type: 'visitor' | 'early' | 'asset' | 'patrol' | 'incident') => {
    if (!isChief) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa bản ghi này?')) return;

    try {
      if (type === 'visitor') {
        await deleteSecurityVisitor(id);
        setVisitors(prev => prev.filter(v => v.id !== id));
      } else if (type === 'early') {
        await deleteSecurityEarlyDismissal(id);
        setEarlyDismissals(prev => prev.filter(e => e.id !== id));
      } else if (type === 'asset') {
        await deleteSecurityAssetPass(id);
        setAssetPasses(prev => prev.filter(a => a.id !== id));
      } else if (type === 'patrol') {
        await deleteSecurityPatrol(id);
        setPatrols(prev => prev.filter(p => p.id !== id));
      } else if (type === 'incident') {
        await deleteSecurityIncident(id);
        setIncidents(prev => prev.filter(i => i.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Early Dismissals (Học sinh về sớm)
  const handleVerifyEarlyDismissal = async (studentIdOrName: string) => {
    // Search in earlyDismissals list
    const cleanSearch = studentIdOrName.toLowerCase().trim();
    const match = earlyDismissals.find(ed => 
      ed.studentName.toLowerCase().includes(cleanSearch) || 
      ed.id.toLowerCase().includes(cleanSearch)
    );

    if (match) {
      if (match.status === 'Đã ra cổng') {
        return { success: false, message: `Học sinh ${match.studentName} đã ra cổng lúc ${match.dismissedTime} trước đó.` };
      }
      if (match.status === 'Không được phép') {
        return { success: false, message: `Học sinh ${match.studentName} không được phép ra (Duyệt bị từ chối).` };
      }

      // Allow checkout
      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const updated: SecurityEarlyDismissal = {
        ...match,
        status: 'Đã ra cổng',
        dismissedTime: timeStr
      };

      await saveSecurityEarlyDismissal(updated);
      setEarlyDismissals(prev => prev.map(e => e.id === match.id ? updated : e));
      return { success: true, message: `XÁC NHẬN HỢP LỆ! Cho phép học sinh ${match.studentName} ra cổng.`, data: match };
    } else {
      return { success: false, message: `Không tìm thấy phiếu xin ra cổng sớm cho "${studentIdOrName}" được duyệt hôm nay.` };
    }
  };

  // Handlers for Asset Passes
  const handleVerifyAssetPass = async (passId: string) => {
    const match = assetPasses.find(p => p.id.toLowerCase().trim() === passId.toLowerCase().trim());
    if (match) {
      if (match.status === 'Đã cho qua') {
        return { success: false, message: `Giấy phép ${match.id} đã được kiểm tra cho ra trước đó.` };
      }
      if (match.status === 'Bị giữ lại') {
        return { success: false, message: `Cảnh báo! Giấy phép ${match.id} đang bị giữ lại do nghi vấn.` };
      }

      const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const updated: SecurityAssetPass = {
        ...match,
        status: 'Đã cho qua',
        dismissedTime: timeStr
      };

      await saveSecurityAssetPass(updated);
      setAssetPasses(prev => prev.map(p => p.id === match.id ? updated : p));
      return { success: true, message: `HỢP LỆ! Cho phép mang tài sản: ${match.itemName} ra khỏi trường.`, data: match };
    } else {
      return { success: false, message: `Không tìm thấy Giấy phép xuất tài sản có mã "${passId}".` };
    }
  };

  // Simulator QR scanner
  const startQRScanner = () => {
    setShowScanner(true);
    setScannerResult(null);
  };

  const handleSimulateScan = async (code: string) => {
    let res;
    if (code.startsWith('ED') || code.startsWith('HS') || code.includes('Cường') || code.includes('Hà')) {
      res = await handleVerifyEarlyDismissal(code);
    } else if (code.startsWith('PASS') || code.includes('Tivi') || code.includes('Máy chiếu')) {
      res = await handleVerifyAssetPass(code);
    } else {
      res = { success: false, message: `Mã QR/CCCD "${code}" không khớp dữ liệu hành chính nào.` };
    }
    setScannerResult(res);
  };

  // Handlers for Incidents
  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncident.description) return;

    const timeStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const incidentObj: SecurityIncident = {
      id: 'INC-' + Math.floor(100 + Math.random() * 900),
      time: timeStr,
      reporter: currentUserProfile.name,
      type: newIncident.type,
      description: newIncident.description,
      status: 'Đã báo cáo BGH',
      severity: newIncident.severity
    };

    try {
      await saveSecurityIncident(incidentObj);
      setIncidents(prev => [incidentObj, ...prev]);
      setShowIncidentModal(false);
      setNewIncident({ type: 'Hỏng hóc CSVC', severity: 'Trung bình', description: '' });
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Patrols
  const handleCreatePatrol = async (e: React.FormEvent) => {
    e.preventDefault();
    const timeStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const details = newPatrol.statusDetails || 'Đã kiểm tra cổng chính, hàng rào, ngắt điện toàn bộ lớp học dãy A và B.';
    
    const patrolObj: SecurityPatrol = {
      id: 'PAT-' + Math.floor(100 + Math.random() * 900),
      patrolTime: timeStr,
      officerName: currentUserProfile.name,
      statusDetails: details,
      status: newPatrol.status
    };

    try {
      await saveSecurityPatrol(patrolObj);
      setPatrols(prev => [patrolObj, ...prev]);
      setShowPatrolModal(false);
      setNewPatrol({ statusDetails: '', status: 'Bình thường', uncheckedRooms: [] });
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for Chief Leaves approval
  const handleApproveLeave = async (id: string, status: 'Đã duyệt' | 'Từ chối') => {
    if (!isChief) return;
    const target = leaves.find(l => l.id === id);
    if (!target) return;

    const updated: SystemAbsence = {
      ...target,
      status,
      approvedBy: currentUserProfile.name
    };

    try {
      await saveSystemAbsence(updated);
      setLeaves(prev => prev.map(l => l.id === id ? updated : l));
      
      if (status === 'Đã duyệt' && target.backupStaffEmail && target.backupStaffName) {
        const affectedShifts = shifts.filter(s => s.date === target.date && s.staffEmail === target.staffEmail);
        for (const sh of affectedShifts) {
          const replaced: SystemShift = {
            ...sh,
            staffEmail: target.backupStaffEmail,
            staffName: target.backupStaffName,
            notes: `Trực thay cho ${target.staffName}. Lý do: ${target.reason}`
          };
          await saveSystemShift(replaced);
          setShifts(prev => prev.map(s => s.id === sh.id ? replaced : s));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for new Leave request (for regular security)
  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeave.startDate || !newLeave.reason) return;

    // Convert HTML date (YYYY-MM-DD) to DD/MM/YYYY
    const [year, month, day] = newLeave.startDate.split('-');
    const dateFormatted = `${day}/${month}/${year}`;

    // Get other security guards from staff list
    const securityGuards = staffList.filter(s => {
      const r = (s.role || s.jobRole || '').toLowerCase();
      const isSecurity = r.includes('bảo vệ');
      const isCurrentUser = s.email?.toLowerCase().trim() === auth.currentUser?.email?.toLowerCase().trim();
      return isSecurity && !isCurrentUser;
    });

    const selectedBackup = securityGuards.find(g => g.email === newLeave.backupStaffEmail);
    const backupStaffEmail = selectedBackup ? selectedBackup.email : 'hung.baove@security.mnah.edu.vn';
    const backupStaffName = selectedBackup ? selectedBackup.name : 'Chú Hùng';

    const leaveObj: SystemAbsence = {
      id: 'LV-' + Math.floor(100 + Math.random() * 900),
      staffEmail: auth.currentUser?.email || 'security@security.mnah.edu.vn',
      staffName: currentUserProfile.name,
      roleType: 'security',
      date: dateFormatted,
      reason: newLeave.reason,
      status: 'Chờ duyệt',
      backupStaffEmail,
      backupStaffName
    };

    try {
      await saveSystemAbsence(leaveObj);
      setLeaves(prev => [leaveObj, ...prev]);
      setShowLeaveModal(false);
      setNewLeave({ startDate: '', endDate: '', reason: '', backupStaffEmail: '' });
    } catch (err) {
      console.error(err);
    }
  };


  // Trigger Alarm pushes to BGH
  const handleTriggerAlarm = () => {
    setShowAlarmModal(false);
    alert('🚨 CẢNH BÁO KHẨN CẤP ĐÃ ĐƯỢC GỬI! Hệ thống đã bắn thông báo đẩy khẩn đến Hiệu trưởng và các thành viên Ban Giám Hiệu.');
  };

  // Filter logs for timeline / table view
  const filteredVisitors = visitors.filter(v => 
    v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.cccd.includes(searchQuery) ||
    v.hostName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDismissals = earlyDismissals.filter(ed => 
    ed.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ed.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ed.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssetPasses = assetPasses.filter(ap => 
    ap.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ap.carrierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ap.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate live activity logs for Overview
  const getActivityLogs = () => {
    const logs: { id: string; time: string; type: string; title: string; content: string; color: string }[] = [];

    // Add visitors
    visitors.forEach(v => {
      logs.push({
        id: `v-${v.id}-${v.status}`,
        time: v.checkInTime,
        type: 'Khách ra vào',
        title: `Khách ${v.name} check-in`,
        content: `Mục đích: ${v.purpose} | Gặp: ${v.hostName} | Trạng thái: ${v.status}`,
        color: v.status === 'Đang ở trường' ? '#2e6b8a' : '#4a5568'
      });
      if (v.checkOutTime) {
        logs.push({
          id: `v-out-${v.id}`,
          time: v.checkOutTime,
          type: 'Khách ra vào',
          title: `Khách ${v.name} check-out`,
          content: `Đã rời cổng trường an toàn.`,
          color: '#7b8a9e'
        });
      }
    });

    // Add early dismissals
    earlyDismissals.filter(ed => ed.status === 'Đã ra cổng').forEach(ed => {
      logs.push({
        id: `ed-${ed.id}`,
        time: ed.dismissedTime ? `21/06/2026 ${ed.dismissedTime}` : '21/06/2026',
        type: 'Học sinh về sớm',
        title: `Học sinh ${ed.studentName} (${ed.className}) ra cổng`,
        content: `Lý do: ${ed.reason} | Duyệt ký: ${ed.approvedBy}`,
        color: '#2c5ea0'
      });
    });

    // Add asset passes
    assetPasses.filter(ap => ap.status === 'Đã cho qua').forEach(ap => {
      logs.push({
        id: `ap-${ap.id}`,
        time: ap.dismissedTime ? `21/06/2026 ${ap.dismissedTime}` : '21/06/2026',
        type: 'An ninh Tài sản',
        title: `Xuất tài sản: ${ap.itemName}`,
        content: `Số lượng: ${ap.quantity} | Người mang ra: ${ap.carrierName} | Duyệt bởi: ${ap.approvedBy}`,
        color: '#a8c4e0'
      });
    });

    // Add patrols
    patrols.forEach(p => {
      logs.push({
        id: `p-${p.id}`,
        time: p.patrolTime,
        type: 'Tuần tra an ninh',
        title: `Tuần tra: Bảo vệ ${p.officerName}`,
        content: `${p.statusDetails} | Kết quả: ${p.status}`,
        color: p.status === 'Bình thường' ? '#2e6b8a' : '#2c5ea0'
      });
    });

    // Add incidents
    incidents.forEach(inc => {
      logs.push({
        id: `inc-${inc.id}`,
        time: inc.time,
        type: 'SỰ CỐ KHẨN',
        title: `Báo cáo sự cố: ${inc.type}`,
        content: `${inc.description} | Độ nghiêm trọng: ${inc.severity} | Trạng thái: ${inc.status}`,
        color: '#2c5ea0'
      });
    });

    // Sort by time descending
    const parseTime = (tStr: string) => {
      const parts = tStr.split(/[/\s:]+/);
      if (parts.length >= 5) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), parseInt(parts[3]), parseInt(parts[4])).getTime();
      }
      return 0;
    };

    return logs.sort((a, b) => parseTime(b.time) - parseTime(a.time)).slice(0, 8);
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-[#f0f4fa] text-[#1e2a3a] main-scrollbar">
      {/* Background micro grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#b8c6d9_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] flex items-center gap-3">
              {TAB_METADATA[activeTab]?.title || 'Chốt Kiểm Soát An Ninh'}
            </h2>
            <p className="text-[#4a5568] text-sm font-semibold mt-2">
              {TAB_METADATA[activeTab]?.desc || 'Giám sát ra vào cổng trường, kiểm soát tài sản và bảo đảm trị an học đường'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={startQRScanner}
              className="flex items-center px-6 py-3 bg-[#2e6b8a] text-[#f5f8fc] border border-[#2b4233] text-xs uppercase tracking-widest font-bold hover:bg-[#2d4534] transition rounded-full shadow-[2px_2px_0px_#1e2a3a] active:translate-y-0.5 active:shadow-none"
            >
              <ScanLine className="w-4 h-4 mr-2 animate-pulse" />
              Quét QR / Thẻ Học Sinh
            </button>
            <button 
              onClick={() => setShowAlarmModal(true)}
              className="flex items-center px-6 py-3 bg-[#2c5ea0] text-[#f5f8fc] border border-[#522929] text-xs uppercase tracking-widest font-bold hover:bg-[#633232] transition rounded-full shadow-[2px_2px_0px_#1e2a3a] animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              BÁO ĐỘNG KHẨN
            </button>
          </div>
        </div>

        {/* Tab content loading indicator */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <RefreshCw className="w-8 h-8 text-[#2c5ea0] animate-spin" />
            <span className="ml-3 font-bold uppercase tracking-widest text-xs text-[#7b8a9e]">Đang truy xuất dữ liệu an ninh...</span>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* ────────── TAB 1: OVERVIEW ────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Ca trực & Bàn giao ca Hero section */}
                <div className="bg-[#1e2a3a] rounded-3xl border border-[#131a25] p-6 md:p-8 text-[#f5f8fc] relative overflow-hidden shadow-[4px_4px_0px_#7b8a9e] min-h-[160px] flex flex-col justify-between">
                  <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none">
                    <Shield className="w-full h-full text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#a8c4e0] bg-[#a8c4e0]/10 border border-[#a8c4e0]/20 px-3 py-1 rounded-full uppercase tracking-widest">
                      Nhật ký ca trực trực tuyến
                    </span>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#a8c4e0] mt-3">
                      Ca trực an toàn, {currentUserProfile.name}!
                    </h3>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6 border-t border-white/10 pt-4 text-xs font-bold uppercase tracking-wider text-[#8e9eb4]">
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div>Ca hiện tại: <span className="text-[#f5f8fc]">Ca Sáng (06:00 - 14:00)</span></div>
                      <div>Đồng nghiệp cùng ca: <span className="text-[#f5f8fc]">Chú Bùi Văn Bảo, Anh Nguyễn Hoàng Lam</span></div>
                    </div>
                    <div className="flex items-center gap-2 text-[#2e6b8a] bg-[#2e6b8a]/20 border border-[#2e6b8a]/30 px-3 py-1.5 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Hệ thống an ninh: Đang hoạt động ổn định
                    </div>
                  </div>
                </div>

                {/* KPI Metrics Cards & Tablet Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Card 1 */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col justify-between hover:shadow-none hover:translate-y-0.5 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">Khách thăm trường</h4>
                        <p className="text-3xl font-serif font-bold text-[#1e2a3a] mt-2">
                          {visitors.filter(v => v.status === 'Đang ở trường').length} người
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-[#e8eef6] rounded-2xl flex items-center justify-center text-[#2c5ea0] border border-[#b8c6d9]">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-[11px] text-[#4a5568] font-bold mt-4 uppercase tracking-wider">Hiện diện trong khuôn viên</p>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col justify-between hover:shadow-none hover:translate-y-0.5 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">Nhà thầu sửa chữa</h4>
                        <p className="text-3xl font-serif font-bold text-[#1e2a3a] mt-2">
                          {visitors.filter(v => v.status === 'Đang ở trường' && v.purpose.toLowerCase().includes('sửa')).length} đội
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-[#e8eef6] rounded-2xl flex items-center justify-center text-[#2e6b8a] border border-[#b8c6d9]">
                        <Building className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-[11px] text-[#4a5568] font-bold mt-4 uppercase tracking-wider">Đang bảo trì thiết bị, điện nước</p>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col justify-between hover:shadow-none hover:translate-y-0.5 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">Học sinh ra sớm hôm nay</h4>
                        <p className="text-3xl font-serif font-bold text-[#1e2a3a] mt-2">
                          {earlyDismissals.filter(ed => ed.status === 'Chờ ra cổng').length} em
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-[#e8eef6] rounded-2xl flex items-center justify-center text-[#2c5ea0] border border-[#b8c6d9]">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-[11px] text-[#4a5568] font-bold mt-4 uppercase tracking-wider">Đã được GVCN/Giám thị duyệt chờ ra</p>
                  </div>
                </div>

                {/* Quick Actions (Tablet optimized huge buttons) */}
                <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-8">
                  <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] pb-3 mb-6">
                    Tác vụ siêu tốc (Dành cho máy tính bảng / điện thoại di động)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                      onClick={startQRScanner}
                      className="h-32 bg-[#d4dde9] hover:bg-[#b8c6d9] border-2 border-[#a3b3c8] active:scale-95 transition rounded-3xl flex flex-col items-center justify-center p-6 gap-3 group text-[#1e2a3a]"
                    >
                      <ScanLine className="w-10 h-10 text-[#2c5ea0] group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-widest">Quét QR Học sinh / Khách</span>
                    </button>

                    <button
                      onClick={() => setShowVisitorModal(true)}
                      className="h-32 bg-[#d4dde9] hover:bg-[#b8c6d9] border-2 border-[#a3b3c8] active:scale-95 transition rounded-3xl flex flex-col items-center justify-center p-6 gap-3 group text-[#1e2a3a]"
                    >
                      <Plus className="w-10 h-10 text-[#2e6b8a] group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-widest">Đăng ký khách mới</span>
                    </button>

                    <button
                      onClick={() => setShowPatrolModal(true)}
                      className="h-32 bg-[#d4dde9] hover:bg-[#b8c6d9] border-2 border-[#a3b3c8] active:scale-95 transition rounded-3xl flex flex-col items-center justify-center p-6 gap-3 group text-[#1e2a3a]"
                    >
                      <Shield className="w-10 h-10 text-[#1e2a3a] group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold uppercase tracking-widest">Ghi nhật ký tuần tra đêm</span>
                    </button>
                  </div>
                </div>

                {/* Timeline and Quick Access */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Timeline (Live Activity Log) */}
                  <div className="lg:col-span-2 bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#b8c6d9] bg-[#e8eef6] flex justify-between items-center">
                      <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest">Nhật ký hoạt động ca trực</h3>
                      <span className="text-[10px] bg-[#1e2a3a] text-[#a8c4e0] px-3 py-1 font-bold tracking-widest uppercase">Thời gian thực</span>
                    </div>
                    <div className="flex-1 p-6 divide-y divide-[#b8c6d9]/60 max-h-[480px] overflow-y-auto main-scrollbar">
                      {getActivityLogs().length === 0 ? (
                        <div className="text-center py-10 text-[#7b8a9e] font-bold text-xs uppercase tracking-wider">
                          Không có hoạt động nào trong ca trực hôm nay.
                        </div>
                      ) : (
                        getActivityLogs().map(log => (
                          <div key={log.id} className="py-4 flex gap-4 items-start hover:bg-[#f0f4fa] px-2 rounded-xl transition-colors">
                            <div 
                              className="w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold shrink-0 font-mono shadow-sm"
                              style={{ borderColor: log.color, color: log.color, backgroundColor: `${log.color}08` }}
                            >
                              {log.type.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-[#1e2a3a] flex flex-wrap justify-between items-start gap-1">
                                <span className="truncate">{log.title}</span>
                                <span className="text-[10px] text-[#7b8a9e] font-mono">{log.time.split(' ')[1] || log.time}</span>
                              </div>
                              <p className="text-xs text-[#4a5568] mt-1 font-medium">{log.content}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quick stats / Helper actions */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4">
                        Tiện ích nhanh bảo vệ
                      </h3>
                      <div className="space-y-3">
                        <button 
                          onClick={() => { setActiveTab('access'); }}
                          className="w-full text-left px-4 py-3 bg-[#e8eef6] hover:bg-[#d4dde9] text-xs font-bold text-[#4a5568] uppercase tracking-widest border border-[#b8c6d9] rounded-2xl flex items-center justify-between"
                        >
                          <span>Tra cứu thẻ học sinh</span>
                          <span>&rarr;</span>
                        </button>
                        <button 
                          onClick={() => { setActiveTab('assets'); }}
                          className="w-full text-left px-4 py-3 bg-[#e8eef6] hover:bg-[#d4dde9] text-xs font-bold text-[#4a5568] uppercase tracking-widest border border-[#b8c6d9] rounded-2xl flex items-center justify-between"
                        >
                          <span>Xem giấy phép xuất vật tư</span>
                          <span>&rarr;</span>
                        </button>
                        <button 
                          onClick={() => {
                            if (isChief) {
                              setActiveTab('schedule');
                            } else {
                              setShowLeaveModal(true);
                            }
                          }}
                          className="w-full text-left px-4 py-3 bg-[#e8eef6] hover:bg-[#d4dde9] text-xs font-bold text-[#4a5568] uppercase tracking-widest border border-[#b8c6d9] rounded-2xl flex items-center justify-between"
                        >
                          <span>{isChief ? 'Quản lý phân ca trực' : 'Đăng ký xin nghỉ phép'}</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t border-[#b8c6d9] text-[11px] text-[#7b8a9e] font-bold uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#2c5ea0]" />
                      Cập nhật lúc: {new Date().toLocaleTimeString('vi-VN')}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ────────── TAB 2: ACCESS CONTROL (KIỂM SOÁT RA VÀO) ────────── */}
            {activeTab === 'access' && (
              <div className="space-y-8">
                {/* Search Bar & Check in button */}
                <div className="bg-[#e8eef6] border border-[#b8c6d9] rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm khách, CCCD, tên học sinh..."
                      className="w-full pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold rounded-full focus:outline-none focus:border-[#2c5ea0]"
                    />
                  </div>
                  <button 
                    onClick={() => setShowVisitorModal(true)}
                    className="flex items-center justify-center px-6 py-2.5 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] text-xs uppercase tracking-widest font-bold rounded-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Đăng ký khách thăm trường
                  </button>
                </div>

                {/* Subsections: Visitors List, Early Dismissals, Contractors */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Visitors Log */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-4 flex justify-between items-center">
                      <span>Sổ Nhật Ký Khách Viếng Thăm</span>
                      <span className="text-xs bg-[#d4dde9] text-[#4a5568] px-2 py-0.5 rounded-full">{filteredVisitors.length} khách</span>
                    </h3>
                    <div className="overflow-y-auto max-h-[350px] space-y-4 pr-1 main-scrollbar flex-1">
                      {filteredVisitors.length === 0 ? (
                        <p className="text-center py-8 text-xs text-[#7b8a9e] font-bold uppercase">Không có khách đăng ký phù hợp.</p>
                      ) : (
                        filteredVisitors.map(v => (
                          <div key={v.id} className="border border-[#b8c6d9] rounded-2xl p-4 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all">
                            <div className="space-y-1">
                              <h4 className="font-bold text-[#1e2a3a] flex items-center gap-2">
                                {v.name}
                                <span className="text-[9px] bg-[#a8c4e0] text-[#4a5568] px-2 py-0.5 rounded-full font-mono font-bold">{v.id}</span>
                              </h4>
                              <p className="text-xs font-medium text-[#4a5568]">Số CCCD: <span className="font-mono text-[#1e2a3a]">{v.cccd}</span></p>
                              <p className="text-xs font-semibold text-[#2c5ea0]">Gặp: {v.hostName}</p>
                              <p className="text-xs text-[#7b8a9e] italic">Mục đích: {v.purpose}</p>
                              <p className="text-[10px] text-[#7b8a9e] font-bold">Vào lúc: {v.checkInTime} {v.checkOutTime && `| Ra lúc: ${v.checkOutTime}`}</p>
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                              {v.status === 'Đang ở trường' ? (
                                <button
                                  onClick={() => handleCheckOutVisitor(v.id)}
                                  className="w-full md:w-auto px-4 py-2 bg-[#2e6b8a] hover:bg-[#2d4534] text-[#f5f8fc] text-[10px] font-bold uppercase tracking-widest rounded-xl"
                                >
                                  Check-out (Rời cổng)
                                </button>
                              ) : (
                                <span className="text-[10px] bg-[#e8eef6] text-[#7b8a9e] border border-[#b8c6d9] px-3 py-1.5 rounded-xl font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  <Check className="w-3 h-3 text-emerald-600" /> Đã rời cổng
                                </span>
                              )}
                              {isChief && (
                                <button 
                                  onClick={() => handleDeleteLog(v.id, 'visitor')}
                                  className="p-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
                                  title="Xóa log lỗi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right: Early Dismissals */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-4 flex justify-between items-center">
                      <span>Phê duyệt ra cổng sớm (Học sinh)</span>
                      <span className="text-xs bg-[#d4dde9] text-[#4a5568] px-2 py-0.5 rounded-full">{filteredDismissals.length} học sinh</span>
                    </h3>
                    <div className="overflow-y-auto max-h-[350px] space-y-4 pr-1 main-scrollbar flex-1">
                      {filteredDismissals.length === 0 ? (
                        <p className="text-center py-8 text-xs text-[#7b8a9e] font-bold uppercase">Không có dữ liệu học sinh được duyệt về sớm.</p>
                      ) : (
                        filteredDismissals.map(ed => (
                          <div key={ed.id} className="border border-[#b8c6d9] rounded-2xl p-4 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-sm transition-all">
                            <div className="space-y-1">
                              <h4 className="font-bold text-[#1e2a3a] flex items-center gap-2">
                                {ed.studentName}
                                <span className="text-[10px] bg-[#d4dde9] text-[#4a5568] px-2 py-0.5 rounded-full font-bold">{ed.className}</span>
                              </h4>
                              <p className="text-xs text-[#4a5568] font-semibold">Giờ phép: {ed.allowedTime}</p>
                              <p className="text-xs text-[#7b8a9e] font-medium">Lý do: {ed.reason}</p>
                              <p className="text-xs text-[#2e6b8a] font-bold">Duyệt ký: {ed.approvedBy}</p>
                              {ed.dismissedTime && <p className="text-[10px] text-[#7b8a9e] font-bold">Thực tế ra cổng: {ed.dismissedTime}</p>}
                            </div>
                            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                              {ed.status === 'Chờ ra cổng' ? (
                                <button
                                  onClick={async () => {
                                    const r = await handleVerifyEarlyDismissal(ed.id);
                                    alert(r.message);
                                  }}
                                  className="w-full md:w-auto px-4 py-2 bg-[#2c5ea0] hover:bg-[#633232] text-[#f5f8fc] text-[10px] font-bold uppercase tracking-widest rounded-xl"
                                >
                                  Cho Ra Cổng
                                </button>
                              ) : ed.status === 'Đã ra cổng' ? (
                                <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  <Check className="w-3.5 h-3.5 text-emerald-600" /> Đã ra cổng
                                </span>
                              ) : (
                                <span className="text-[10px] bg-red-50 text-red-800 border border-red-200 px-3 py-1.5 rounded-xl font-bold uppercase tracking-widest flex items-center gap-1.5">
                                  <X className="w-3.5 h-3.5 text-red-600" /> Không cho phép
                                </span>
                              )}
                              {isChief && (
                                <button 
                                  onClick={() => handleDeleteLog(ed.id, 'early')}
                                  className="p-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ────────── TAB 3: ASSET SECURITY & PATROLS (AN NINH TÀI SẢN) ────────── */}
            {activeTab === 'assets' && (
              <div className="space-y-8">
                {/* Assets passes inspection */}
                <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6">
                  <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-6 flex justify-between items-center">
                    <span>Đăng ký & Đối chiếu Giấy phép mang tài sản ra ngoài</span>
                    <span className="text-xs bg-[#d4dde9] text-[#4a5568] px-2 py-0.5 rounded-full">{filteredAssetPasses.length} giấy phép</span>
                  </h3>
                  
                  {/* Search Asset bar */}
                  <div className="mb-6 relative max-w-md">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Tìm theo tên thiết bị, người vận chuyển..."
                      className="w-full pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold rounded-full focus:outline-none focus:border-[#2c5ea0]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredAssetPasses.length === 0 ? (
                      <p className="col-span-2 text-center py-8 text-xs text-[#7b8a9e] font-bold uppercase">Không có dữ liệu giấy phép.</p>
                    ) : (
                      filteredAssetPasses.map(ap => (
                        <div key={ap.id} className="border border-[#b8c6d9] rounded-2xl p-5 bg-white space-y-3 shadow-inner">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] bg-[#a8c4e0] text-[#4a5568] px-2 py-0.5 rounded-full font-mono font-bold">{ap.id}</span>
                              <h4 className="font-bold text-[#1e2a3a] text-base mt-1.5">{ap.itemName}</h4>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                              ap.status === 'Đã cho qua' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : ap.status === 'Bị giữ lại'
                                ? 'bg-red-50 text-red-800 border-red-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {ap.status}
                            </span>
                          </div>
                          
                          <div className="text-xs text-[#4a5568] space-y-1 pt-2 border-t border-[#b8c6d9]/40 font-medium">
                            <p>Số lượng: <span className="font-bold text-[#1e2a3a]">{ap.quantity} cái/bộ</span></p>
                            <p>Mục đích xuất: <span className="text-[#1e2a3a]">{ap.reason}</span></p>
                            <p>Người vận chuyển: <span className="text-[#1e2a3a] font-bold">{ap.carrierName}</span></p>
                            <p>Ký duyệt hành chính: <span className="text-[#2e6b8a] font-bold">{ap.approvedBy}</span></p>
                            <p>Ngày duyệt: <span className="text-[#1e2a3a] font-mono">{ap.dateApproved}</span></p>
                            {ap.dismissedTime && <p className="text-[10px] text-[#7b8a9e] font-bold">Cổng ra lúc: {ap.dismissedTime}</p>}
                          </div>

                          <div className="pt-3 flex gap-2">
                            {ap.status === 'Chờ kiểm tra' && (
                              <>
                                <button
                                  onClick={async () => {
                                    const r = await handleVerifyAssetPass(ap.id);
                                    alert(r.message);
                                  }}
                                  className="flex-1 py-2 bg-[#2e6b8a] hover:bg-[#2d4534] text-[#f5f8fc] text-[10px] font-bold uppercase tracking-widest rounded-xl"
                                >
                                  Duyệt qua cổng
                                </button>
                                <button
                                  onClick={async () => {
                                    const updated: SecurityAssetPass = { ...ap, status: 'Bị giữ lại' };
                                    await saveSecurityAssetPass(updated);
                                    setAssetPasses(prev => prev.map(p => p.id === ap.id ? updated : p));
                                    alert(`⚠️ Báo động giữ lại tài sản thành công. Đang gửi báo cáo đến Tổ trưởng.`);
                                  }}
                                  className="py-2 px-3 border border-red-200 hover:bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded-xl"
                                >
                                  Giữ lại
                                </button>
                              </>
                            )}
                            {isChief && (
                              <button 
                                onClick={() => handleDeleteLog(ap.id, 'asset')}
                                className="px-3 py-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Patrols checklist & list */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Patrols checklist form */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-4">
                      Tạo nhật ký tuần tra ca trực
                    </h3>
                    <form onSubmit={handleCreatePatrol} className="space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1.5">Kết quả kiểm tra</label>
                          <select 
                            value={newPatrol.status} 
                            onChange={e => setNewPatrol(prev => ({ ...prev, status: e.target.value as any }))}
                            className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                          >
                            <option value="Bình thường">🟢 Mọi thứ bình thường</option>
                            <option value="Có sự cố">⚠️ Phát hiện sự cố an ninh</option>
                            <option value="Giao ca thành công">🤝 Bàn giao ca trực sạch sẽ</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1.5">Phòng chưa ngắt điện/khóa cửa (nếu có)</label>
                          <div className="grid grid-cols-3 gap-2">
                            {['1A1', '1A2', '2A1', '11A2', '5A1', '12A2'].map(room => {
                              const isChecked = newPatrol.uncheckedRooms.includes(room);
                              return (
                                <button
                                  type="button"
                                  key={room}
                                  onClick={() => {
                                    setNewPatrol(prev => {
                                      const rooms = prev.uncheckedRooms.includes(room) 
                                        ? prev.uncheckedRooms.filter(r => r !== room)
                                        : [...prev.uncheckedRooms, room];
                                      return { ...prev, uncheckedRooms: rooms };
                                    });
                                  }}
                                  className={`py-1.5 text-[10px] font-bold border rounded-lg transition-colors ${
                                    isChecked 
                                      ? 'bg-red-50 border-red-300 text-red-800' 
                                      : 'bg-white border-[#b8c6d9] text-[#4a5568]'
                                  }`}
                                >
                                  Lớp {room}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1.5">Chi tiết ghi nhận tuần tra</label>
                          <textarea 
                            rows={4}
                            value={newPatrol.statusDetails}
                            onChange={e => setNewPatrol(prev => ({ ...prev, statusDetails: e.target.value }))}
                            placeholder="Mô tả cụ thể trạng thái tuần tra, khóa cửa phòng học, tủ điều hòa, thiết bị chiếu sáng..."
                            className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-2xl resize-none"
                          ></textarea>
                        </div>
                      </div>
                      <button 
                        type="submit"
                        className="w-full mt-4 py-3 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] text-xs uppercase tracking-widest font-bold rounded-xl"
                      >
                        Ghi Sổ Tuần Tra
                      </button>
                    </form>
                  </div>

                  {/* Patrols log list */}
                  <div className="lg:col-span-2 bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-4">
                      Lịch sử tuần tra & Giao nhận ca
                    </h3>
                    <div className="overflow-y-auto max-h-[360px] space-y-4 pr-1 main-scrollbar flex-1">
                      {patrols.length === 0 ? (
                        <p className="text-center py-8 text-xs text-[#7b8a9e] font-bold uppercase">Chưa có bản ghi tuần tra nào.</p>
                      ) : (
                        patrols.map(p => (
                          <div key={p.id} className="border border-[#b8c6d9] rounded-2xl p-4 bg-white space-y-2 hover:shadow-sm transition-all">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                  p.status === 'Bình thường' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                    : p.status === 'Giao ca thành công'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                                }`}>
                                  {p.status}
                                </span>
                                <span className="text-xs text-[#7b8a9e] font-mono">{p.patrolTime}</span>
                              </div>
                              {isChief && (
                                <button 
                                  onClick={() => handleDeleteLog(p.id, 'patrol')}
                                  className="p-1 text-red-700 hover:bg-red-50 border border-red-200 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-xs text-[#1e2a3a] font-medium leading-relaxed">{p.statusDetails}</p>
                            <p className="text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider">Tuần tra viên: Bác {p.officerName}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ────────── TAB 4: PARKING (QUẢN LÝ BÃI XE) ────────── */}
            {activeTab === 'parking' && (
              <div className="space-y-8">
                {/* Plate lookup */}
                <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-8 max-w-2xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <Building className="w-12 h-12 text-[#2c5ea0] mx-auto opacity-70" />
                    <h3 className="text-lg font-serif font-bold text-[#1e2a3a] uppercase tracking-wider">
                      Tra cứu biển số bãi xe học sinh / giáo viên
                    </h3>
                    <p className="text-xs text-[#4a5568] font-medium">
                      Nhập biển kiểm soát xe máy, xe máy điện của học sinh/cán bộ để xác minh chủ sở hữu hoặc xử lý mất thẻ.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Ví dụ: 63B3-12345"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="flex-1 px-5 py-3 bg-[#f5f8fc] border-2 border-[#b8c6d9] text-sm font-bold uppercase tracking-wider focus:outline-none focus:border-[#2c5ea0] rounded-2xl"
                    />
                    <button 
                      onClick={() => {
                        const q = searchQuery.toUpperCase().trim();
                        if (q.includes('63') || q.includes('12')) {
                          alert(`🔍 KẾT QUẢ ĐỐI CHIẾU:\n- Biển số: ${q}\n- Chủ xe: Nguyễn Văn An (Học sinh Lớp 1A1)\n- Loại xe: Wave Alpha màu xanh đen\n- Trạng thái đăng ký: Hợp lệ (Đã cấp thẻ số 482)`);
                        } else {
                          alert(`❌ Không tìm thấy thông tin đăng ký xe máy điện/xe máy cho biển số "${q}".`);
                        }
                      }}
                      className="px-6 py-3 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] text-xs uppercase tracking-widest font-bold rounded-2xl shadow-md"
                    >
                      Tra cứu chủ xe
                    </button>
                  </div>

                  <div className="border-t border-[#b8c6d9]/60 pt-6 space-y-4">
                    <h4 className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">
                      Quy trình giải quyết mất thẻ xe:
                    </h4>
                    <ul className="text-xs text-[#4a5568] space-y-2 leading-relaxed list-decimal pl-5 font-semibold">
                      <li>Đối chiếu chứng minh thư (CCCD) và thông tin đăng ký biển số trong hệ thống.</li>
                      <li>Ký bản cam kết bảo vệ xe và lưu ảnh chụp khuôn mặt học sinh để đối chiếu cam-out.</li>
                      <li>Báo cáo Tổ trưởng bãi xe để xóa mã thẻ xe cũ tránh kẻ gian nhặt được thẻ lợi dụng dắt xe ra ngoài.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* ────────── TAB 5: INCIDENT REPORT (BIÊN BẢN SỰ CỐ) ────────── */}
            {activeTab === 'incidents' && (
              <div className="space-y-8">
                {/* Search Bar & Check in button */}
                <div className="bg-[#e8eef6] border border-[#b8c6d9] rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm sự cố..."
                      className="w-full pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold rounded-full focus:outline-none focus:border-[#2c5ea0]"
                    />
                  </div>
                  <button 
                    onClick={() => setShowIncidentModal(true)}
                    className="flex items-center justify-center px-6 py-2.5 bg-[#2c5ea0] hover:bg-[#633232] text-[#f5f8fc] text-xs uppercase tracking-widest font-bold rounded-full"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Tạo báo cáo sự cố an ninh
                  </button>
                </div>

                {/* List of incidents */}
                <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6">
                  <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-6">
                    Danh sách biên bản sự cố trị an & cơ sở vật chất
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {incidents.filter(i => i.description.toLowerCase().includes(searchQuery.toLowerCase()) || i.type.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <p className="col-span-2 text-center py-8 text-xs text-[#7b8a9e] font-bold uppercase">Không có báo cáo sự cố nào được ghi nhận.</p>
                    ) : (
                      incidents.filter(i => i.description.toLowerCase().includes(searchQuery.toLowerCase()) || i.type.toLowerCase().includes(searchQuery.toLowerCase())).map(inc => (
                        <div key={inc.id} className="border border-[#b8c6d9] rounded-2xl p-5 bg-white space-y-3 shadow-inner">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] bg-red-50 text-red-800 border border-red-200 px-2 py-0.5 rounded-full font-mono font-bold">{inc.id}</span>
                              <h4 className="font-bold text-[#1e2a3a] text-base mt-1.5">{inc.type}</h4>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                              inc.status === 'Đã giải quyết' 
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}>
                              {inc.status}
                            </span>
                          </div>

                          <p className="text-xs font-semibold text-[#2c5ea0]">Mức độ: {inc.severity} khẩn</p>
                          <p className="text-xs text-[#4a5568] leading-relaxed font-medium">{inc.description}</p>

                          <div className="pt-3 border-t border-[#b8c6d9]/40 flex justify-between items-center text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider">
                            <span>Người báo cáo: {inc.reporter}</span>
                            <span>{inc.time}</span>
                          </div>

                          <div className="pt-2 flex justify-between items-center gap-2">
                            {inc.status !== 'Đã giải quyết' && (
                              <button
                                onClick={async () => {
                                  const updated: SecurityIncident = { ...inc, status: 'Đã giải quyết' };
                                  await saveSecurityIncident(updated);
                                  setIncidents(prev => prev.map(i => i.id === inc.id ? updated : i));
                                }}
                                className="px-4 py-2 bg-[#2e6b8a] hover:bg-[#2d4534] text-[#f5f8fc] text-[10px] font-bold uppercase tracking-widest rounded-xl"
                              >
                                Đánh dấu đã giải quyết
                              </button>
                            )}
                            {isChief && (
                              <button 
                                onClick={() => handleDeleteLog(inc.id, 'incident')}
                                className="p-2 border border-red-200 text-red-700 hover:bg-red-50 rounded-xl ml-auto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ────────── TAB 6: SCHEDULE & SHIFTS (PHÂN CA TRỰC) ────────── */}
            {activeTab === 'schedule' && (
              <div className="space-y-8 animate-fade-in">
                <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6">
                  <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Lịch trực tổ bảo vệ</span>
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
                    <span className="text-xs bg-[#d4dde9] text-[#4a5568] px-2 py-0.5 rounded-full self-start sm:self-auto">Chỉ hiển thị ca đã xuất bản</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((dayName, idx) => {
                      const currentWeek = WEEK_OPTIONS.find(w => w.id === selectedWeekId) || WEEK_OPTIONS[1];
                      const dateStr = currentWeek.dates[idx];
                      const displayDate = dateStr ? dateStr.substring(0, 5) : '';
                      const dayShifts = shifts.filter(s => s.roleType === 'security' && s.date === dateStr && s.status === 'published');
                      
                      return (
                        <div key={dayName} className="border border-[#b8c6d9] rounded-2xl p-4 bg-white space-y-3 min-h-[150px] shadow-sm">
                          <div className="text-xs font-bold text-[#2c5ea0] border-b border-[#b8c6d9]/40 pb-1.5 text-center uppercase tracking-wider">
                            {dayName} ({displayDate})
                          </div>
                          
                          <div className="space-y-2">
                            {dayShifts.length === 0 ? (
                              <div className="text-[10px] text-gray-400 italic text-center py-4">Không có ca</div>
                            ) : (
                              dayShifts.map(s => (
                                <div key={s.id} className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] space-y-1 font-semibold">
                                  <div className="font-bold text-blue-900 truncate">{s.shiftType.split(' ')[0]}</div>
                                  <div className="text-[#1e2a3a] font-serif font-bold text-[11px]">{s.staffName}</div>
                                  <div className="text-gray-500 font-mono text-[9px] truncate">{s.locationOrArea}</div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}


            {/* ────────── TAB 7: LEAVES & ATTENDANCE (CHẤM CÔNG & PHÉP - CHIEF ONLY) ────────── */}
            {activeTab === 'attendance' && isChief && (
              <div className="space-y-8">
                <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6">
                  <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-6">
                    Phê duyệt đơn xin nghỉ phép của nhân sự bảo vệ
                  </h3>
                  <div className="space-y-4">
                    {leaves.length === 0 ? (
                      <p className="text-center py-8 text-xs text-[#7b8a9e] font-bold uppercase">Không có đơn xin nghỉ phép nào.</p>
                    ) : (
                      leaves.map(lv => (
                        <div key={lv.id} className="border border-[#b8c6d9] rounded-2xl p-5 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm animate-fade-in">
                          <div className="space-y-1">
                            <h4 className="font-bold text-[#1e2a3a] text-base">{lv.staffName}</h4>
                            <p className="text-xs text-[#4a5568] font-semibold">Ngày vắng: <span className="text-[#2c5ea0] font-mono">{lv.date}</span></p>
                            <p className="text-xs text-[#7b8a9e] italic font-semibold">Lý do: {lv.reason}</p>
                            {lv.backupStaffName && (
                              <p className="text-[10px] text-emerald-700 font-bold">Người làm thay: {lv.backupStaffName}</p>
                            )}
                            <p className="text-xs font-bold text-[#4a5568]">Trạng thái: <span className="underline">{lv.status}</span></p>
                          </div>
                          
                          {lv.status === 'Chờ duyệt' && (
                            <div className="flex gap-2 w-full md:w-auto justify-end">
                              <button 
                                onClick={() => handleApproveLeave(lv.id, 'Đã duyệt')}
                                className="px-4 py-2 bg-[#2e6b8a] hover:bg-[#2d4534] text-[#f5f8fc] text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" /> Duyệt đơn
                              </button>
                              <button 
                                onClick={() => handleApproveLeave(lv.id, 'Từ chối')}
                                className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded-xl flex items-center gap-1"
                              >
                                <X className="w-3.5 h-3.5" /> Từ chối
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ────────── TAB 8: MONTHLY REPORTS (BÁO CÁO THÁNG - CHIEF ONLY) ────────── */}
            {activeTab === 'reports' && isChief && (
              <div className="space-y-8">
                {/* Analytics charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Visitor analytics */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6">
                    <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-6">
                      Thống kê lượng khách ra vào theo ngày (Tháng 6)
                    </h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={[
                          { date: '15/06', 'Lượt khách': 12 },
                          { date: '16/06', 'Lượt khách': 18 },
                          { date: '17/06', 'Lượt khách': 25 },
                          { date: '18/06', 'Lượt khách': 14 },
                          { date: '19/06', 'Lượt khách': 30 },
                          { date: '20/06', 'Lượt khách': 8 },
                          { date: '21/06', 'Lượt khách': 16 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dce4ee" />
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7b8a9e', fontWeight: 'bold' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#7b8a9e', fontWeight: 'bold' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e2a3a', color: '#f5f8fc', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Line type="monotone" dataKey="Lượt khách" stroke="#2c5ea0" strokeWidth={3} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Incidents statistics */}
                  <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6">
                    <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-6">
                      Thống kê sự cố ghi nhận theo phân loại
                    </h3>
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { category: 'Hỏng hóc CSVC', 'Số sự cố': 8 },
                          { category: 'Ẩu đả/Gây rối', 'Số sự cố': 2 },
                          { category: 'Mất cắp vật tư', 'Số sự cố': 1 },
                          { category: 'Sự cố cháy nổ', 'Số sự cố': 0 },
                          { category: 'Khác', 'Số sự cố': 3 }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#dce4ee" />
                          <XAxis dataKey="category" tick={{ fontSize: 9, fill: '#7b8a9e', fontWeight: 'bold' }} />
                          <YAxis tick={{ fontSize: 10, fill: '#7b8a9e', fontWeight: 'bold' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#1e2a3a', color: '#f5f8fc', border: 'none', borderRadius: '8px', fontSize: '12px' }} />
                          <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          <Bar dataKey="Số sự cố" fill="#2e6b8a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── MODAL 1: QR BARCODE SIMULATOR SCANNER ─── */}
      {showScanner && (
        <div className="fixed inset-0 bg-[#1e2a3a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f5f8fc] border-2 border-[#b8c6d9] rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button 
              onClick={() => { setShowScanner(false); setScannerResult(null); }}
              className="absolute right-4 top-4 p-2 text-[#7b8a9e] hover:text-[#1e2a3a]"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center space-y-2">
              <ScanLine className="w-10 h-10 text-[#2c5ea0] mx-auto animate-pulse" />
              <h3 className="text-lg font-serif font-bold text-[#1e2a3a] uppercase tracking-wider">
                Giả lập Camera quét Barcode/QR học sinh & CCCD
              </h3>
              <p className="text-xs text-[#4a5568]">
                Trong thực tế, camera máy tính bảng sẽ mở tại khung hình dưới đây để quét thẻ thông minh.
              </p>
            </div>

            {/* Video feed mock */}
            <div className="relative border-4 border-dashed border-[#a3b3c8] bg-black h-64 rounded-2xl overflow-hidden flex flex-col justify-center items-center">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600 animate-bounce"></div>
              <Camera className="w-16 h-16 text-white/30 animate-pulse" />
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-2">Đang tìm kiếm mã vạch...</span>
              
              {/* Scan indicators */}
              <div className="absolute inset-x-8 inset-y-12 border-2 border-emerald-500/20 rounded-xl pointer-events-none"></div>
            </div>

            {/* Simulated Scannable Data options */}
            <div className="space-y-3">
              <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Chọn một mã thẻ giả lập để quét thử:</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSimulateScan('ED-002')}
                  className="px-3 py-2 bg-[#d4dde9] hover:bg-[#b8c6d9] text-[10px] font-bold uppercase tracking-wider rounded-xl text-left truncate"
                  title="Mã thẻ Học sinh: Nguyễn Thu Hà"
                >
                  [Học sinh] Nguyễn Thu Hà (ED-002)
                </button>
                <button
                  onClick={() => handleSimulateScan('ED-001')}
                  className="px-3 py-2 bg-[#d4dde9] hover:bg-[#b8c6d9] text-[10px] font-bold uppercase tracking-wider rounded-xl text-left truncate"
                  title="Mã thẻ Học sinh: Lê Văn Cường"
                >
                  [Học sinh] Lê Văn Cường (ED-001)
                </button>
                <button
                  onClick={() => handleSimulateScan('PASS-002')}
                  className="px-3 py-2 bg-[#d4dde9] hover:bg-[#b8c6d9] text-[10px] font-bold uppercase tracking-wider rounded-xl text-left truncate"
                  title="Giấy phép xuất: Máy chiếu Epson"
                >
                  [Vật tư] Máy chiếu Epson (PASS-002)
                </button>
                <button
                  onClick={() => handleSimulateScan('TEST-FAIL')}
                  className="px-3 py-2 bg-[#d4dde9] hover:bg-[#b8c6d9] text-[10px] font-bold uppercase tracking-wider rounded-xl text-left truncate"
                >
                  [Lỗi] Mã thẻ lạ
                </button>
              </div>
            </div>

            {/* Scanner outcome alert */}
            {scannerResult && (
              <div className={`p-4 border-2 rounded-2xl space-y-2 animate-fade-in ${
                scannerResult.success 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                  {scannerResult.success ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                  {scannerResult.success ? 'Hợp lệ thành công' : 'Từ chối ra cổng'}
                </div>
                <p className="text-xs font-semibold leading-relaxed">{scannerResult.message}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL 2: REGISTER VISITOR ─── */}
      {showVisitorModal && (
        <div className="fixed inset-0 bg-[#1e2a3a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f5f8fc] border-2 border-[#b8c6d9] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowVisitorModal(false)}
              className="absolute right-4 top-4 p-2 text-[#7b8a9e] hover:text-[#1e2a3a]"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-2 mb-4">
              Đăng ký khách viếng thăm mới
            </h3>
            <form onSubmit={handleCheckInVisitor} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Họ tên khách</label>
                <input 
                  type="text"
                  required
                  value={newVisitor.name}
                  onChange={e => setNewVisitor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Số CCCD / CMND</label>
                <input 
                  type="text"
                  required
                  value={newVisitor.cccd}
                  onChange={e => setNewVisitor(prev => ({ ...prev, cccd: e.target.value }))}
                  placeholder="Ví dụ: 079185000123"
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Cán bộ / Giáo viên tiếp đón</label>
                <input 
                  type="text"
                  value={newVisitor.hostName}
                  onChange={e => setNewVisitor(prev => ({ ...prev, hostName: e.target.value }))}
                  placeholder="Ví dụ: Cô Thảo GVCN lớp 1A1"
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Lý do / Mục đích gặp</label>
                <input 
                  type="text"
                  value={newVisitor.purpose}
                  onChange={e => setNewVisitor(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="Ví dụ: Phụ huynh trao đổi chuyên cần"
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                />
              </div>
              
              <button 
                type="submit"
                className="w-full py-3 bg-[#2e6b8a] hover:bg-[#2d4534] text-[#f5f8fc] text-xs uppercase tracking-widest font-bold rounded-xl mt-4"
              >
                Đăng ký & Cho vào trường
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: INCIDENT REPORT ─── */}
      {showIncidentModal && (
        <div className="fixed inset-0 bg-[#1e2a3a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f5f8fc] border-2 border-[#b8c6d9] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowIncidentModal(false)}
              className="absolute right-4 top-4 p-2 text-[#7b8a9e] hover:text-[#1e2a3a]"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-2 mb-4">
              Lập biên bản sự cố an ninh khẩn cấp
            </h3>
            <form onSubmit={handleCreateIncident} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Phân loại sự cố</label>
                <select 
                  value={newIncident.type}
                  onChange={e => setNewIncident(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                >
                  <option value="Hỏng hóc CSVC">Hư hỏng cơ sở vật chất (Vỡ kính, hỏng cổng...)</option>
                  <option value="Ẩu đả">Ẩu đả / Gây rối trật tự học đường</option>
                  <option value="Mất cắp">Mất cắp / Nghi vấn trộm cắp vật tư</option>
                  <option value="Cháy nổ">Sự cố cháy nổ / Báo cháy</option>
                  <option value="Khác">Phát sinh an ninh khác</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Mức độ nghiêm trọng</label>
                <select 
                  value={newIncident.severity}
                  onChange={e => setNewIncident(prev => ({ ...prev, severity: e.target.value as any }))}
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                >
                  <option value="Thấp">Thấp (Chỉ theo dõi nội bộ)</option>
                  <option value="Trung bình">Trung bình (Cần sửa chữa hoặc xử lý sớm)</option>
                  <option value="Nghiêm trọng">Nghiêm trọng (Báo động khẩn gửi BGH/Hiệu trưởng)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Mô tả cụ thể sự việc</label>
                <textarea 
                  rows={4}
                  required
                  value={newIncident.description}
                  onChange={e => setNewIncident(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Ghi cụ thể sự việc diễn ra vào lúc mấy giờ, ở đâu, đối tượng liên quan và biện pháp kiểm soát ban đầu của bảo vệ..."
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-2xl resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="w-full py-3 bg-[#2c5ea0] hover:bg-[#633232] text-[#f5f8fc] text-xs uppercase tracking-widest font-bold rounded-xl mt-4"
              >
                Gửi Báo Cáo Sự Cố
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 4: ALARM CONFIRMATION ─── */}
      {showAlarmModal && (
        <div className="fixed inset-0 bg-[#2c5ea0]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f5f8fc] border-4 border-red-500 rounded-3xl max-w-md w-full p-6 shadow-2xl relative text-center space-y-6">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto animate-bounce" />
            <div className="space-y-2">
              <h3 className="text-xl font-serif font-bold text-red-950 uppercase tracking-wider">
                XÁC NHẬN BÁO ĐỘNG KHẨN CẤP?
              </h3>
              <p className="text-xs text-[#4a5568] leading-relaxed font-semibold">
                Cảnh báo! Hành động này sẽ gửi một tin nhắn SOS báo động đẩy màu đỏ khẩn cấp đến thiết bị của toàn bộ Ban Giám Hiệu. Chỉ sử dụng trong trường hợp hỏa hoạn lớn, xâm nhập trái phép có vũ khí, hoặc ẩu đả nghiêm trọng đe dọa trị an.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={handleTriggerAlarm}
                className="flex-1 py-3 bg-red-700 hover:bg-red-800 text-white text-xs uppercase tracking-widest font-bold rounded-xl"
              >
                CÓ, GỬI SOS KHẨN!
              </button>
              <button 
                onClick={() => setShowAlarmModal(false)}
                className="flex-1 py-3 bg-[#d4dde9] hover:bg-[#b8c6d9] text-[#1e2a3a] text-xs uppercase tracking-widest font-bold rounded-xl"
              >
                HỦY
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: REGISTER LEAVE (FOR STAFF) ─── */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-[#1e2a3a]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#f5f8fc] border-2 border-[#b8c6d9] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setShowLeaveModal(false)}
              className="absolute right-4 top-4 p-2 text-[#7b8a9e] hover:text-[#1e2a3a]"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="text-lg font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-2 mb-4">
              Đăng ký đơn xin nghỉ phép bảo vệ
            </h3>
            <form onSubmit={handleCreateLeave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Ngày bắt đầu nghỉ</label>
                <input 
                  type="date"
                  required
                  value={newLeave.startDate}
                  onChange={e => setNewLeave(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Ngày đi làm lại</label>
                <input 
                  type="date"
                  required
                  value={newLeave.endDate}
                  onChange={e => setNewLeave(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Người trực thay thế</label>
                <select
                  required
                  value={newLeave.backupStaffEmail}
                  onChange={e => setNewLeave(prev => ({ ...prev, backupStaffEmail: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
                >
                  <option value="">-- Chọn người trực thay thế --</option>
                  {staffList.filter(s => {
                    const r = (s.role || s.jobRole || '').toLowerCase();
                    const isSecurity = r.includes('bảo vệ');
                    const isCurrentUser = s.email?.toLowerCase().trim() === auth.currentUser?.email?.toLowerCase().trim();
                    return isSecurity && !isCurrentUser;
                  }).map(g => (
                    <option key={g.email} value={g.email}>{g.name} ({g.role || g.jobRole || 'Bảo vệ'})</option>
                  ))}
                  {staffList.filter(s => {
                    const r = (s.role || s.jobRole || '').toLowerCase();
                    return r.includes('bảo vệ') && s.email?.toLowerCase().trim() !== auth.currentUser?.email?.toLowerCase().trim();
                  }).length === 0 && (
                    <>
                      <option value="hung.baove@security.mnah.edu.vn">Chú Hùng (Nhân viên Bảo vệ)</option>
                      <option value="binh.baove@security.mnah.edu.vn">Chú Bình (Nhân viên Bảo vệ)</option>
                      <option value="manh.baove@security.mnah.edu.vn">Chú Mạnh (Nhân viên Bảo vệ)</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Lý do nghỉ phép</label>
                <textarea 
                  rows={3}
                  required
                  value={newLeave.reason}
                  onChange={e => setNewLeave(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Ghi rõ lý do nghỉ phép, kế hoạch sắp xếp người trực thay thế hoặc bàn giao chìa khóa..."
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl resize-none"
                ></textarea>
              </div>
              
              <button 
                type="submit"
                className="w-full py-3 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] text-xs uppercase tracking-widest font-bold rounded-xl mt-4"
              >
                Nộp Đơn Lên Tổ Trưởng
              </button>
            </form>

          </div>
        </div>
      )}
    </main>
  );
};
