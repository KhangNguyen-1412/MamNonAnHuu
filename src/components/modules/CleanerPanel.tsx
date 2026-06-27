import React, { useState, useEffect } from 'react';
import { Panel } from '../layout/Panel';
import { 
  Sparkles,
  CheckSquare,
  Calendar,
  Coffee,
  Megaphone,
  Plus,
  Minus,
  Check,
  X,
  AlertTriangle,
  Camera,
  User,
  MapPin,
  Clock,
  ClipboardList,
  Layers,
  ChevronRight,
  TrendingUp,
  Inbox,
  AlertCircle
} from 'lucide-react';
import { 
  getCleanerTasks, 
  saveCleanerTask, 
  getCleanerSupplyRequests, 
  saveCleanerSupplyRequest, 
  getCleanerIncidents, 
  saveCleanerIncident, 
  CleanerTask, 
  CleanerSupplyRequest, 
  CleanerIncident,
  getSystemShifts,
  SystemShift
} from '../../services/dbService';
import { useUserRole } from '../../utils/role';
import { getStaffList, Staff } from '../../services/hrService';
import { auth } from '../../services/firebase';

const playTingSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (err) {
    console.warn("Web Audio API sound failed to play", err);
  }
};

const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.setValueAtTime(450, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch (err) {
    console.warn("Web Audio API sound failed to play", err);
  }
};

interface CleanerPanelProps {
  initialTab?: string;
  onSelectModule?: (id: any) => void;
}

const WEEK_OPTIONS = [
  { id: '2026-W25', label: 'Tuần 25 (15/06/2026 - 21/06/2026)', dates: ['15/06/2026', '16/06/2026', '17/06/2026', '18/06/2026', '19/06/2026', '20/06/2026', '21/06/2026'] },
  { id: '2026-W26', label: 'Tuần 26 (22/06/2026 - 28/06/2026)', dates: ['22/06/2026', '23/06/2026', '24/06/2026', '25/06/2026', '26/06/2026', '27/06/2026', '28/06/2026'] },
  { id: '2026-W27', label: 'Tuần 27 (29/06/2026 - 05/07/2026)', dates: ['29/06/2026', '30/06/2026', '31/06/2026', '01/07/2026', '02/07/2026', '03/07/2026', '04/07/2026'] }
];

export const CleanerPanel: React.FC<CleanerPanelProps> = ({ initialTab = 'overview', onSelectModule }) => {
  const currentRole = useUserRole();
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [isChief, setIsChief] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState({ name: 'Cô Lao Công', title: 'Nhân viên Tạp vụ' });
  const [loading, setLoading] = useState(true);
  const [selectedWeekId, setSelectedWeekId] = useState('2026-W26');


  // Core collections
  const [tasks, setTasks] = useState<CleanerTask[]>([]);
  const [supplies, setSupplies] = useState<CleanerSupplyRequest[]>([]);
  const [incidents, setIncidents] = useState<CleanerIncident[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [systemShifts, setSystemShifts] = useState<SystemShift[]>([]);

  // Local interaction states
  const [showSupplyModal, setShowSupplyModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);

  // Supply Form state
  const [supplyForm, setSupplyForm] = useState({ name: 'Giấy vệ sinh cuộn lớn', qty: 5, notes: '' });
  // Incident Form state
  const [incidentForm, setIncidentForm] = useState({ title: 'Vòi nước rò rỉ', location: 'Nhà vệ sinh tầng 1 dãy A', description: '', photoAttached: false });

  // Predefined supplies & locations
  const SUPPLY_ITEMS = [
    'Giấy vệ sinh cuộn lớn',
    'Nước lau sàn Sunlight 5L',
    'Nước tẩy bồn cầu Vim 1L',
    'Xà phòng rửa tay',
    'Chổi lau nhà sợi san hô',
    'Túi đựng rác lớn',
    'Giẻ lau sợi bông'
  ];

  const LOCATIONS = [
    'Nhà vệ sinh tầng 1 dãy A',
    'Nhà vệ sinh tầng 2 dãy A',
    'Nhà vệ sinh tầng 3 dãy A',
    'Nhà vệ sinh nam tầng 1 dãy B',
    'Nhà vệ sinh nữ tầng 1 dãy B',
    'Phòng học Khối 1 dãy B',
    'Phòng học Khối 2 dãy B',
    'Phòng học Khối 5 dãy A',
    'Phòng họp Hội đồng (Tầng 2)',
    'Sân trường chính',
    'Khu vực Căn-tin & Bán trú'
  ];

  const INCIDENT_TYPES = [
    'Vòi nước rò rỉ',
    'Bóng đèn tuýp bị cháy',
    'Hỏng chốt cửa sổ',
    'Tắc nghẽn bồn cầu',
    'Cửa kính bị nứt',
    'Hỏng ổ khóa cửa',
    'Sự cố khác'
  ];

  // Resolve user info & load data
  const loadData = async () => {
    setLoading(true);
    try {
      const email = auth.currentUser?.email;
      if (email) {
        const cleanEmail = email.toLowerCase().trim();
        
        // Handle mock emails overrides
        if (cleanEmail === 'to-truong-tapvu@cleaner.mnah.edu.vn') {
          setCurrentUserProfile({ name: 'Cô Trần Thị B', title: 'Tổ trưởng Tạp vụ / Giám sát vệ sinh' });
          setIsChief(true);
        } else if (cleanEmail === 'tapvu@cleaner.mnah.edu.vn') {
          setCurrentUserProfile({ name: 'Cô Phạm Thị Cần', title: 'Nhân viên Tạp vụ' });
          setIsChief(false);
        } else {
          // Resolve from actual staff list
          const list = await getStaffList();
          const staff = list.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
          if (staff) {
            const title = staff.role || staff.jobRole || 'Nhân viên Tạp vụ';
            setCurrentUserProfile({ name: staff.name, title });
            if (title.toLowerCase().includes('tổ trưởng') || title.toLowerCase().includes('giám sát')) {
              setIsChief(true);
            }
          }
        }
      }

      // Fetch collections
      const [taskList, supplyList, incidentList, allStaff, sysShifts] = await Promise.all([
        getCleanerTasks(),
        getCleanerSupplyRequests(),
        getCleanerIncidents(),
        getStaffList(),
        getSystemShifts()
      ]);

      setTasks(taskList);
      setSupplies(supplyList);
      setIncidents(incidentList);
      setStaffList(allStaff.filter(s => (s.role || '').toLowerCase().includes('tạp vụ') || (s.role || '').toLowerCase().includes('lao công') || (s.jobRole || '').toLowerCase().includes('lao công')));
      setSystemShifts(sysShifts);
    } catch (err) {
      console.error("Error loading cleaner panel data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Handle task complete check
  const handleToggleTaskStatus = async (id: string, currentStatus: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    let newStatus: 'Chưa bắt đầu' | 'Đang thực hiện' | 'Hoàn thành' | 'Đã nghiệm thu' = 'Chưa bắt đầu';
    if (currentStatus === 'Chưa bắt đầu') {
      newStatus = 'Đang thực hiện';
    } else if (currentStatus === 'Đang thực hiện') {
      newStatus = 'Hoàn thành';
      playTingSound();
    } else if (currentStatus === 'Hoàn thành') {
      newStatus = 'Chưa bắt đầu';
    }

    const updated: CleanerTask = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? updated : t));

    try {
      await saveCleanerTask(updated);
    } catch (err) {
      console.error("Failed to save task update:", err);
    }
  };

  // Handle claim urgent request
  const handleClaimUrgentTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const email = auth.currentUser?.email || 'tapvu@cleaner.mnah.edu.vn';
    const updated: CleanerTask = {
      ...target,
      status: 'Đang thực hiện',
      assignedTo: email,
      updatedAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setTasks(prev => prev.map(t => t.id === id ? updated : t));
    playTingSound();

    try {
      await saveCleanerTask(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit supply request
  const handleSubmitSupplyRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = auth.currentUser?.email || 'tapvu@cleaner.mnah.edu.vn';
    const newReq: CleanerSupplyRequest = {
      id: 'CSR-' + Math.floor(1000 + Math.random() * 9000),
      supplyName: supplyForm.name,
      quantityRequested: supplyForm.qty,
      requestedBy: email,
      requestedAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Chờ phê duyệt',
      notes: supplyForm.notes
    };

    // Optimistic update
    setSupplies(prev => [newReq, ...prev]);
    setShowSupplyModal(false);
    setSupplyForm({ name: 'Giấy vệ sinh cuộn lớn', qty: 5, notes: '' });
    playTingSound();

    try {
      await saveCleanerSupplyRequest(newReq);
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Incident Report
  const handleSubmitIncidentReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = auth.currentUser?.email || 'tapvu@cleaner.mnah.edu.vn';
    const newInc: CleanerIncident = {
      id: 'CLI-' + Math.floor(1000 + Math.random() * 9000),
      title: incidentForm.title,
      location: incidentForm.location,
      description: incidentForm.description,
      reportedBy: email,
      reportedAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'Mới',
      photoUrl: incidentForm.photoAttached ? 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400' : undefined
    };

    setIncidents(prev => [newInc, ...prev]);
    setShowIncidentModal(false);
    setIncidentForm({ title: 'Vòi nước rò rỉ', location: 'Nhà vệ sinh tầng 1 dãy A', description: '', photoAttached: false });
    playAlertSound();

    try {
      await saveCleanerIncident(newInc);
    } catch (err) {
      console.error(err);
    }
  };

  // Lead: Approve supply request
  const handleApproveSupply = async (id: string, status: 'Đã phê duyệt' | 'Đã từ chối' | 'Đã cấp phát') => {
    const target = supplies.find(s => s.id === id);
    if (!target) return;

    const updated: CleanerSupplyRequest = {
      ...target,
      status,
      approvedBy: currentUserProfile.name,
      approvedAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setSupplies(prev => prev.map(s => s.id === id ? updated : s));
    playTingSound();

    try {
      await saveCleanerSupplyRequest(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Lead: assign staff to zone
  const handleAssignTaskStaff = async (taskId: string, staffEmail: string) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const updated: CleanerTask = {
      ...target,
      assignedTo: staffEmail,
      updatedAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    playTingSound();

    try {
      await saveCleanerTask(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Lead: evaluate/accept task
  const handleAcceptTaskResult = async (taskId: string, pass: boolean) => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    const updated: CleanerTask = {
      ...target,
      status: pass ? 'Đã nghiệm thu' : 'Đang thực hiện',
      updatedAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    playTingSound();

    try {
      await saveCleanerTask(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Incident lead resolution
  const handleResolveIncident = async (id: string, newStatus: 'Đã tiếp nhận' | 'Đang sửa chữa' | 'Đã khắc phục') => {
    const target = incidents.find(i => i.id === id);
    if (!target) return;

    const updated: CleanerIncident = {
      ...target,
      status: newStatus
    };

    setIncidents(prev => prev.map(i => i.id === id ? updated : i));
    playTingSound();

    try {
      await saveCleanerIncident(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Filter tasks based on logged-in cleaner
  const myTasks = tasks.filter(t => isChief || t.assignedTo === (auth.currentUser?.email || 'tapvu@cleaner.mnah.edu.vn'));
  const urgentTasks = tasks.filter(t => t.isUrgent && t.status !== 'Hoàn thành' && t.status !== 'Đã nghiệm thu');
  const routineTasks = myTasks.filter(t => !t.isUrgent);

  const completedCount = myTasks.filter(t => t.status === 'Hoàn thành' || t.status === 'Đã nghiệm thu').length;
  const totalTasksCount = myTasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedCount / totalTasksCount) * 100) : 0;

  // Render bottom bar buttons
  const bottomNavItems = [
    { id: 'overview', label: 'TRANG CHỦ', icon: CheckSquare },
    { id: 'schedule', label: 'LỊCH LÀM', icon: Calendar },
    { id: 'supplies', label: 'VẬT TƯ', icon: Coffee },
    { id: 'reports', label: 'BÁO SỰ CỐ', icon: Megaphone }
  ];

  return (
    <Panel>
      <div className="flex-1 flex flex-col min-h-0 bg-[#e8eef6] text-[#1e2a3a] font-sans relative pb-20 md:pb-6">
        
        {/* Top Header Panel Greeting (Matches instructions) */}
        <div className="bg-[#f5f8fc] border-b-[3px] border-double border-[#b8c6d9] p-4 sm:p-6 rounded-2xl shadow-sm mb-6 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#2c5ea0]/[0.02] rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#2e6b8a] rounded-full animate-pulse"></span>
                <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Ca làm việc hiện tại</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2c5ea0]">
                Chào ca {new Date().getHours() < 12 ? 'Sáng' : 'Chiều'}, {currentUserProfile.name}!
              </h2>
              <p className="text-xs sm:text-sm text-[#4a5568] font-medium flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#7b8a9e]" />
                <span className="font-bold text-[#2e6b8a]">Khu vực phụ trách hôm nay:</span> Dãy phòng học Khối 1 & Nhà vệ sinh Tầng 1
              </p>
            </div>
            
            {/* Progress indicator */}
            <div className="bg-[#e8eef6] border border-[#b8c6d9] p-3 rounded-xl min-w-[150px] shadow-inner flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider">Tiến độ công việc</p>
                <p className="text-xs font-bold text-[#1e2a3a] mt-0.5">
                  🟢 Đã xong {completedCount}/{totalTasksCount} khu vực
                </p>
              </div>
              <span className="font-serif font-bold text-[#2c5ea0] text-lg">{progressPercent}%</span>
            </div>
          </div>
        </div>


        {/* Main Tab content container */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-[#f5f8fc] border border-[#b8c6d9] rounded-2xl p-4 sm:p-6 shadow-sm">
          
          {/* TAB 1: DASHBOARD / CHECKLIST */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Urgent Emergency Requests Section */}
              {urgentTasks.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-wider flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> Yêu cầu đột xuất (Khẩn cấp)
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {urgentTasks.map(t => (
                      <div key={t.id} className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pulse-slow">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-rose-600 text-white font-bold text-[9px] uppercase tracking-widest rounded">🚨 KHẨN CẤP</span>
                            <span className="text-[10px] text-[#7b8a9e] font-semibold">{t.createdAt}</span>
                          </div>
                          <h4 className="text-sm font-bold text-[#2c5ea0] mt-1.5">{t.title}</h4>
                          <p className="text-xs text-[#4a5568] mt-1 font-semibold flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {t.location}
                          </p>
                          {t.notes && <p className="text-xs italic text-[#70675a] mt-1 bg-white/50 p-2 border-l-2 border-rose-400 rounded-r">Ghi chú: {t.notes}</p>}
                          {t.reportedBy && <p className="text-[10px] text-[#7b8a9e] mt-1">Người yêu cầu: {t.reportedBy}</p>}
                        </div>
                        
                        {t.assignedTo ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#2e6b8a] bg-[#2e6b8a]/10 px-3 py-1.5 border border-[#2e6b8a]/20 rounded-lg">
                              Đã nhận việc
                            </span>
                            <button
                              onClick={() => handleToggleTaskStatus(t.id, t.status)}
                              className="px-4 py-2 bg-[#2e6b8a] text-white border border-[#1e4f6a] rounded-xl text-xs font-bold uppercase tracking-wider shadow hover:bg-[#324b3a] transition-all"
                            >
                              Hoàn thành
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleClaimUrgentTask(t.id)}
                            className="w-full sm:w-auto px-5 py-3 bg-rose-600 text-white border border-rose-700 shadow-[2px_2px_0px_#4a1414] hover:bg-rose-700 rounded-xl text-xs uppercase tracking-widest font-bold transition-all active:translate-y-[1px] active:shadow-none cursor-pointer"
                          >
                            Nhận việc ngay
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Periodic Checklist / Todo List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#b8c6d9] pb-2">
                  <h3 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider flex items-center gap-1.5">
                    <ClipboardList className="w-4.5 h-4.5 text-[#2c5ea0]" /> Danh sách công việc định kỳ
                  </h3>
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase bg-[#e8eef6] px-2 py-0.5 border border-[#b8c6d9] rounded">Ca trực</span>
                </div>
                
                {routineTasks.length === 0 ? (
                  <p className="text-sm text-[#7b8a9e] italic text-center py-6">Hôm nay không có nhiệm vụ dọn dẹp nào được phân công.</p>
                ) : (
                  <div className="space-y-2">
                    {routineTasks.map(t => {
                      const isDone = t.status === 'Hoàn thành' || t.status === 'Đã nghiệm thu';
                      const isProgress = t.status === 'Đang thực hiện';
                      return (
                        <div 
                          key={t.id} 
                          className={`p-4 border rounded-xl flex items-center justify-between gap-4 transition-all shadow-sm ${isDone ? 'bg-[#e8eef6]/50 border-[#b8c6d9]' : isProgress ? 'bg-emerald-50/30 border-emerald-200' : 'bg-white border-[#b8c6d9]'}`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <button
                              onClick={() => handleToggleTaskStatus(t.id, t.status)}
                              className={`w-6 h-6 shrink-0 rounded border flex items-center justify-center transition-colors cursor-pointer mt-0.5 ${isDone ? 'bg-[#2e6b8a] border-[#1e4f6a] text-white shadow-inner' : 'bg-white border-[#b8c6d9] hover:border-[#2c5ea0]'}`}
                            >
                              {isDone && <Check className="w-4.5 h-4.5" />}
                            </button>
                            
                            <div className="min-w-0 flex-1">
                              <span className={`text-sm font-bold block truncate ${isDone ? 'line-through text-[#7b8a9e]' : 'text-[#1e2a3a]'}`}>
                                {t.title}
                              </span>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-[11px] text-[#4a5568] font-semibold">
                                <span className="flex items-center gap-1 text-[#7b8a9e]">
                                  <MapPin className="w-3 h-3" /> {t.location}
                                </span>
                                <span className="flex items-center gap-1 text-[#2e6b8a]">
                                  <Clock className="w-3 h-3" /> Ca {t.timeSlot}
                                </span>
                                {t.notes && <span className="italic text-[#70675a]">({t.notes})</span>}
                              </div>
                            </div>
                          </div>

                          {/* Status Badge & Inspector Action */}
                          <div className="flex items-center gap-2 shrink-0">
                            {isChief && t.status === 'Hoàn thành' ? (
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleAcceptTaskResult(t.id, true)}
                                  title="Đạt / Nghiệm thu"
                                  className="p-1.5 bg-[#2e6b8a] text-white border border-[#1e4f6a] rounded-lg shadow hover:bg-[#324b3a] transition-all cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleAcceptTaskResult(t.id, false)}
                                  title="Yêu cầu dọn lại"
                                  className="p-1.5 bg-rose-600 text-white border border-rose-700 rounded-lg shadow hover:bg-rose-700 transition-all cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.status === 'Đã nghiệm thu' ? 'bg-[#2e6b8a]/10 text-[#2e6b8a] border border-[#2e6b8a]/20' : t.status === 'Hoàn thành' ? 'bg-[#a8c4e0] text-[#2c5ea0] border border-[#b8c6d9]' : isProgress ? 'bg-emerald-100 text-[#2e6b8a] border border-emerald-200 animate-pulse' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                {t.status}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Events list */}
              <div className="bg-[#e8eef6]/40 border border-[#b8c6d9] p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#2c5ea0]" /> Công việc chuẩn bị Sự kiện hôm nay
                </h4>
                <div className="bg-white border border-[#b8c6d9] p-3 rounded-lg flex justify-between items-center shadow-sm">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#2c5ea0] bg-[#e8eef6] px-2 py-0.5 border border-[#b8c6d9] rounded">13:30</span>
                    <p className="text-xs font-bold text-[#1e2a3a] mt-1.5">Chuẩn bị nước suối & Khăn trải bàn</p>
                    <p className="text-[10px] text-[#7b8a9e] mt-0.5">Phòng họp Hội đồng (Tầng 2) | Ca chiều phụ trách</p>
                  </div>
                  <span className="text-[10px] font-bold text-[#2e6b8a] bg-[#2e6b8a]/10 px-2 py-0.5 rounded border border-[#2e6b8a]/20">Tự động sinh</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: SCHEDULES / ASSIGNMENTS */}
          {activeTab === 'schedule' && (
            <div className="space-y-6 animate-fade-in">
              
              {isChief && (
                /* Supervisor Drag-drop or select assignment editor */
                <div className="bg-[#e8eef6]/50 border border-[#b8c6d9] p-4 rounded-2xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#2c5ea0]">Bảng Điều phối & Phân công Công việc</h3>
                    <p className="text-xs text-[#7b8a9e] mt-0.5">Giám sát ca dọn dẹp và phân chia khu vực phụ trách cho nhân sự tạp vụ</p>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    
                    {/* Zone list to assign */}
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9] pb-1">Khu vực cần phân công</p>
                      <div className="space-y-2">
                        {tasks.map(t => (
                          <div key={t.id} className="bg-white border border-[#b8c6d9] p-3 rounded-xl flex items-center justify-between gap-3 shadow-sm">
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-[#1e2a3a] block truncate">{t.title}</span>
                              <span className="text-[10px] text-[#7b8a9e] font-semibold flex items-center gap-0.5 mt-0.5">
                                <MapPin className="w-3.5 h-3.5" /> {t.location}
                              </span>
                            </div>
                            
                            <select
                              value={t.assignedTo}
                              onChange={(e) => handleAssignTaskStaff(t.id, e.target.value)}
                              className="p-1.5 bg-[#e8eef6] border border-[#b8c6d9] rounded-lg text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0] shadow-sm max-w-[150px]"
                            >
                              <option value="">-- Chưa giao --</option>
                              <option value="tapvu@cleaner.mnah.edu.vn">Cô Phạm Thị Cần</option>
                              <option value="co.can@cleaner.mnah.edu.vn">Cô Nguyễn Thị H</option>
                              <option value="lead@cleaner.mnah.edu.vn">Cô Trần Thị B</option>
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overall School Hygiene Monitoring */}
                    <div className="space-y-3 bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                      <p className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9] pb-1">Báo cáo hiện trạng vệ sinh toàn trường</p>
                      
                      <div className="space-y-2 pt-1">
                        <div className="flex justify-between items-center p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs">
                          <span className="font-bold text-rose-800">🚽 Nhà vệ sinh Tầng 3 (Dãy A)</span>
                          <span className="font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded">🔴 4 giờ chưa dọn dẹp</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-lg text-xs">
                          <span className="font-bold text-[#4a5568]">🧹 Sân trường khu B</span>
                          <span className="font-bold text-[#2c5ea0] bg-[#f5f8fc] border border-[#b8c6d9] px-2 py-0.5 rounded">⏳ Đang dọn dẹp</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                          <span className="font-bold text-emerald-800">🏫 Dãy lớp học Khối 1 (Dãy B)</span>
                          <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">🟢 Sạch sẽ (Đã check-in)</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Standard Routine Area Timetable & Unified published shifts */}
              <div className="space-y-6">
                <div className="bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-6">
                  <h3 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span>Lịch trực tổ tạp vụ</span>
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
                    <span className="text-xs bg-[#d4dde9] text-[#4a5568] px-2 py-0.5 rounded-full self-start sm:self-auto">Chỉ hiển thị ca đã xuất bản từ BGH</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-4">
                    {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'].map((dayName, idx) => {
                      const currentWeek = WEEK_OPTIONS.find(w => w.id === selectedWeekId) || WEEK_OPTIONS[1];
                      const dateStr = currentWeek.dates[idx];
                      const displayDate = dateStr ? dateStr.substring(0, 5) : '';
                      const dayShifts = systemShifts.filter(s => s.roleType === 'cleaner' && s.date === dateStr && s.status === 'published');
                      
                      return (
                        <div key={dayName} className="border border-[#b8c6d9] rounded-2xl p-4 bg-white space-y-3 min-h-[150px] shadow-sm">
                          <div className="text-xs font-bold text-[#2e6b8a] border-b border-[#b8c6d9]/40 pb-1.5 text-center uppercase tracking-wider">
                            {dayName} ({displayDate})
                          </div>

                          
                          <div className="space-y-2">
                            {dayShifts.length === 0 ? (
                              <div className="text-[10px] text-gray-400 italic text-center py-4">Không có ca</div>
                            ) : (
                              dayShifts.map(s => (
                                <div key={s.id} className="p-2 bg-emerald-50 border border-emerald-100 rounded-xl text-[10px] space-y-1 font-semibold animate-fade-in">
                                  <div className="font-bold text-emerald-900 truncate">{s.shiftType.split(' ')[0]}</div>
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

                <h3 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Mô tả công việc định kỳ của ca trực</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* MORNING SHIFT */}
                  <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-2">
                      <span className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider">🌅 CA SÁNG</span>
                      <span className="text-[10px] font-mono text-[#7b8a9e] font-semibold">06:00 - 11:30</span>
                    </div>
                    <ul className="text-xs text-[#4a5568] font-semibold space-y-2 pl-2 list-disc list-inside">
                      <li>Chuẩn bị vệ sinh đầu buổi học</li>
                      <li>Lau bục giảng, bảng đen</li>
                      <li>Kiểm kê nước sạch, nước rửa tay</li>
                    </ul>
                  </div>

                  {/* RECESS SHIFT */}
                  <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-2">
                      <span className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider">☀️ GIỜ RA CHƠI</span>
                      <span className="text-[10px] font-mono text-[#7b8a9e] font-semibold">09:00 - 09:30</span>
                    </div>
                    <ul className="text-xs text-[#4a5568] font-semibold space-y-2 pl-2 list-disc list-inside">
                      <li>Lau dọn nhanh nhà vệ sinh học sinh</li>
                      <li>Thu gom rác tại các giỏ rác hành lang</li>
                      <li>Giải quyết các sự cố đổ vỡ phát sinh</li>
                    </ul>
                  </div>

                  {/* END OF DAY SHIFT */}
                  <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-2">
                      <span className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider">🌆 CUỐI BUỔI</span>
                      <span className="text-[10px] font-mono text-[#7b8a9e] font-semibold">17:00 - 18:30</span>
                    </div>
                    <ul className="text-xs text-[#4a5568] font-semibold space-y-2 pl-2 list-disc list-inside">
                      <li>Quét dọn toàn diện phòng học</li>
                      <li>Khóa vòi nước, tắt bóng đèn quạt</li>
                      <li>Đổ rác ra khu tập kết rác thải trường</li>
                    </ul>
                  </div>
                </div>
              </div>
            )

            </div>
          )}

          {/* TAB 3: SUPPLIES / INVENTORY */}
          {activeTab === 'supplies' && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Micro inventory levels view */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Kho Vật tư Tạp vụ Vi mô</h3>
                  <button
                    onClick={() => setShowSupplyModal(true)}
                    className="flex items-center px-4 py-2 bg-[#2c5ea0] text-white border border-[#5c2525] text-xs uppercase tracking-widest font-bold shadow-[2px_2px_0px_#153460] hover:bg-[#663030] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none transition-all rounded-xl cursor-pointer"
                  >
                    <Plus className="w-4 h-4 mr-1.5" /> Tạo Đề xuất cấp vật tư
                  </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-white border border-[#b8c6d9] p-3 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-[#7b8a9e] uppercase tracking-wider font-bold">Giấy vệ sinh</p>
                    <p className="font-serif font-bold text-2xl text-[#1e2a3a] mt-1">12 <span className="text-xs font-sans text-[#7b8a9e]">cuộn</span></p>
                    <span className="text-[9px] font-bold text-[#2e6b8a] bg-[#2e6b8a]/10 px-2 py-0.5 rounded border border-[#2e6b8a]/20 mt-2 inline-block">Đủ dùng</span>
                  </div>
                  <div className="bg-white border border-[#b8c6d9] p-3 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-[#7b8a9e] uppercase tracking-wider font-bold">Nước lau sàn</p>
                    <p className="font-serif font-bold text-2xl text-rose-600 mt-1">1.5 <span className="text-xs font-sans text-rose-500">Lít</span></p>
                    <span className="text-[9px] font-bold text-rose-700 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded mt-2 inline-block">⚠️ Sắp hết</span>
                  </div>
                  <div className="bg-white border border-[#b8c6d9] p-3 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-[#7b8a9e] uppercase tracking-wider font-bold">Nước tẩy toilet</p>
                    <p className="font-serif font-bold text-2xl text-[#1e2a3a] mt-1">4.0 <span className="text-xs font-sans text-[#7b8a9e]">Lít</span></p>
                    <span className="text-[9px] font-bold text-[#2e6b8a] bg-[#2e6b8a]/10 px-2 py-0.5 rounded border border-[#2e6b8a]/20 mt-2 inline-block">Đủ dùng</span>
                  </div>
                  <div className="bg-white border border-[#b8c6d9] p-3 rounded-xl shadow-sm text-center">
                    <p className="text-[10px] text-[#7b8a9e] uppercase tracking-wider font-bold">Túi rác lớn</p>
                    <p className="font-serif font-bold text-2xl text-[#1e2a3a] mt-1">2.0 <span className="text-xs font-sans text-[#7b8a9e]">Kg</span></p>
                    <span className="text-[9px] font-bold text-[#2e6b8a] bg-[#2e6b8a]/10 px-2 py-0.5 rounded border border-[#2e6b8a]/20 mt-2 inline-block">Đủ dùng</span>
                  </div>
                </div>
              </div>

              {/* Lead view: approve supply requests */}
              {isChief && (
                <div className="bg-[#e8eef6]/50 border border-[#b8c6d9] p-4 rounded-2xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#2c5ea0]">Duyệt Đơn xin cấp Phát Vật tư</h3>
                    <p className="text-xs text-[#7b8a9e] mt-0.5">Phê duyệt hoặc từ chối các yêu cầu văn phòng phẩm, hóa chất vệ sinh của nhân viên dọn dẹp</p>
                  </div>
                  
                  <div className="space-y-2">
                    {supplies.filter(s => s.status === 'Chờ phê duyệt').length === 0 ? (
                      <p className="text-xs text-[#7b8a9e] italic text-center py-4">Hiện không có yêu cầu vật tư nào cần phê duyệt.</p>
                    ) : (
                      supplies.filter(s => s.status === 'Chờ phê duyệt').map(s => (
                        <div key={s.id} className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <span className="px-2 py-0.5 bg-[#a8c4e0] border border-[#b8c6d9] text-[#2c5ea0] font-bold text-[9px] uppercase tracking-widest rounded">{s.id}</span>
                            <h4 className="text-xs font-bold text-[#1e2a3a] mt-1">Đề xuất cấp: <span className="text-sm text-[#2c5ea0]">{s.supplyName}</span></h4>
                            <p className="text-xs text-[#4a5568] mt-0.5">Số lượng: <span className="font-serif font-bold text-base text-[#1e2a3a]">{s.quantityRequested}</span> | Người gửi: {s.requestedBy}</p>
                            <p className="text-[9px] text-[#7b8a9e] mt-0.5">Thời gian đề xuất: {s.requestedAt}</p>
                          </div>
                          
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => handleApproveSupply(s.id, 'Đã phê duyệt')}
                              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-[#2e6b8a] text-white border border-[#1e4f6a] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#324b3a] transition-all cursor-pointer"
                            >
                              <Check className="w-4.5 h-4.5 mr-1" /> Duyệt cấp
                            </button>
                            <button
                              onClick={() => handleApproveSupply(s.id, 'Đã từ chối')}
                              className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-rose-600 text-white border border-rose-700 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-all cursor-pointer"
                            >
                              <X className="w-4.5 h-4.5 mr-1" /> Từ chối
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Supplies request history */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Lịch sử xin cấp phát vật tư</h3>
                <div className="space-y-2">
                  {supplies.map(s => (
                    <div key={s.id} className="bg-white border border-[#b8c6d9] p-3.5 rounded-xl shadow-sm flex justify-between items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[#7b8a9e] font-bold">{s.id}</span>
                          <span className="text-xs font-bold text-[#1e2a3a]">{s.supplyName}</span>
                        </div>
                        <p className="text-[11px] text-[#4a5568] mt-1 font-semibold">
                          Số lượng: <span className="font-serif font-bold text-sm">{s.quantityRequested}</span> | Ngày gửi: {s.requestedAt}
                        </p>
                        {s.approvedBy && <p className="text-[9px] text-[#7b8a9e] mt-0.5">Người duyệt: {s.approvedBy} ({s.approvedAt})</p>}
                      </div>
                      
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${s.status === 'Đã cấp phát' ? 'bg-emerald-100 text-[#2e6b8a] border-emerald-200' : s.status === 'Đã phê duyệt' ? 'bg-[#a8c4e0]/20 text-[#2c5ea0] border-[#b8c6d9]/40' : s.status === 'Đã từ chối' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: REPORTS / INCIDENTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6 animate-fade-in">
              
              <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-2">
                <div>
                  <h3 className="text-xs font-bold text-[#4a5568] uppercase tracking-wider flex items-center gap-1.5">
                    <Megaphone className="w-4.5 h-4.5 text-[#2c5ea0]" /> Báo cáo sự cố vệ sinh / cơ sở vật chất
                  </h3>
                  <p className="text-[10px] text-[#7b8a9e] font-medium mt-0.5">Báo bóng đèn hỏng, vòi nước gãy, hư hỏng đột xuất ở các dãy phòng</p>
                </div>
                
                <button
                  onClick={() => setShowIncidentModal(true)}
                  className="flex items-center px-4 py-2 bg-rose-600 text-white border border-rose-700 text-xs uppercase tracking-widest font-bold shadow-[2px_2px_0px_#4a1414] hover:bg-rose-700 hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none transition-all rounded-xl cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Báo sự cố mới
                </button>
              </div>

              {/* Incidents tracking log */}
              <div className="space-y-3">
                {incidents.map(i => (
                  <div key={i.id} className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[9px] uppercase tracking-widest rounded">{i.id}</span>
                          <span className="text-xs text-[#7b8a9e] font-semibold">{i.reportedAt}</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1e2a3a] mt-1.5">{i.title}</h4>
                        <p className="text-xs font-semibold text-[#2e6b8a] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#7b8a9e]" /> {i.location}
                        </p>
                        <p className="text-xs text-[#4a5568] font-semibold mt-2">{i.description}</p>
                      </div>

                      {/* Incident status and supervisor action */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg border ${i.status === 'Đã khắc phục' ? 'bg-emerald-100 text-[#2e6b8a] border-emerald-200' : i.status === 'Đang sửa chữa' ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse' : 'bg-rose-100 text-rose-700 border-rose-200'}`}>
                          {i.status}
                        </span>

                        {isChief && i.status !== 'Đã khắc phục' && (
                          <select
                            value={i.status}
                            onChange={(e) => handleResolveIncident(i.id, e.target.value as any)}
                            className="p-1.5 bg-[#e8eef6] border border-[#b8c6d9] rounded-lg text-[10px] font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                          >
                            <option value="Mới">Mới</option>
                            <option value="Đã tiếp nhận">Đã tiếp nhận</option>
                            <option value="Đang sửa chữa">Đang sửa chữa</option>
                            <option value="Đã khắc phục">Đã khắc phục (Nghiệm thu)</option>
                          </select>
                        )}
                      </div>
                    </div>

                    {/* Incident photo preview */}
                    {i.photoUrl && (
                      <div className="flex items-center gap-3 bg-[#e8eef6]/30 p-2 rounded-lg border border-[#b8c6d9]/40">
                        <div className="w-16 h-12 rounded overflow-hidden border border-[#b8c6d9]">
                          <img src={i.photoUrl} alt="Incident" className="w-full h-full object-cover grayscale brightness-95" />
                        </div>
                        <span className="text-[10px] text-[#7b8a9e] font-bold uppercase flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> Hình ảnh đính kèm minh chứng</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Mobile touch-friendly bottom navigation bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#f5f8fc] border-t-[3px] border-double border-[#b8c6d9] h-20 flex items-center justify-around px-2 z-40 shadow-[0_-4px_12px_rgba(44,40,37,0.06)]">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); if (onSelectModule) onSelectModule('cleaner-' + item.id); }}
                className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-center transition-all ${isActive ? 'text-[#2c5ea0]' : 'text-[#7b8a9e]'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-[#e8eef6] scale-110 shadow-inner border border-[#b8c6d9]' : 'bg-transparent'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[9px] font-bold mt-1 tracking-wider uppercase ${isActive ? 'text-[#2c5ea0]' : 'text-[#7b8a9e]'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* MODAL 1: CREATE SUPPLY REQUEST (Counter-based large touch buttons, no keyboard) */}
        {showSupplyModal && (
          <div className="fixed inset-0 bg-[#1e2a3a]/60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
              <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-3">
                <h3 className="text-base font-bold text-[#2c5ea0] uppercase tracking-wide">Đề xuất cấp vật tư dọn dẹp</h3>
                <button onClick={() => setShowSupplyModal(false)} className="text-[#7b8a9e] hover:text-[#2c5ea0] p-1"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmitSupplyRequest} className="space-y-4">
                
                {/* Select Supply Item (Large touch targets) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Tên vật tư dọn dẹp</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-1 border border-[#b8c6d9] rounded-xl bg-white scrollbar-thin">
                    {SUPPLY_ITEMS.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSupplyForm(prev => ({ ...prev, name: item }))}
                        className={`p-2 border text-center rounded-lg text-xs font-bold transition-all ${supplyForm.name === item ? 'bg-[#2c5ea0] text-white border-[#5c2525] shadow-md' : 'bg-[#e8eef6]/50 border-[#b8c6d9] text-[#4a5568] hover:bg-[#e8eef6]'}`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Counter selection for quantity (Zero keyboard typing) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest text-center">Số lượng đề xuất</label>
                  <div className="flex items-center justify-center gap-4 bg-white border border-[#b8c6d9] p-2.5 rounded-xl">
                    <button
                      type="button"
                      disabled={supplyForm.qty <= 1}
                      onClick={() => setSupplyForm(prev => ({ ...prev, qty: prev.qty - 1 }))}
                      className="w-10 h-10 bg-[#e8eef6] border border-[#b8c6d9] flex items-center justify-center rounded-lg font-bold text-xl text-[#2c5ea0] hover:bg-[#efeae0] disabled:opacity-50 cursor-pointer"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="font-serif font-bold text-2xl text-[#1e2a3a] w-12 text-center">{supplyForm.qty}</span>
                    <button
                      type="button"
                      onClick={() => setSupplyForm(prev => ({ ...prev, qty: prev.qty + 1 }))}
                      className="w-10 h-10 bg-[#e8eef6] border border-[#b8c6d9] flex items-center justify-center rounded-lg font-bold text-xl text-[#2c5ea0] hover:bg-[#efeae0] cursor-pointer"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Optional Ghi chú */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Ghi chú (Nếu có)</label>
                  <input
                    type="text"
                    value={supplyForm.notes}
                    onChange={(e) => setSupplyForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Lau dãy phòng nào hoặc lý do cấp..."
                    className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-6 py-4 bg-[#2e6b8a] text-white border border-[#1e4f6a] rounded-xl text-xs uppercase tracking-widest font-bold shadow-[2px_2px_0px_#1a2a1f] hover:bg-[#324b3a] hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <Check className="w-4.5 h-4.5 mr-1.5" /> Gửi Đề xuất cấp vật tư
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: REPORT INCIDENT (Pre-defined types list, touch selection) */}
        {showIncidentModal && (
          <div className="fixed inset-0 bg-[#1e2a3a]/60 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
              <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-3">
                <h3 className="text-base font-bold text-[#2c5ea0] uppercase tracking-wide">Báo cáo Sự cố Vệ sinh / CSVC</h3>
                <button onClick={() => setShowIncidentModal(false)} className="text-[#7b8a9e] hover:text-[#2c5ea0] p-1"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmitIncidentReport} className="space-y-4">
                
                {/* Select Incident Title (predefined button selection, no typing) */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Loại Sự cố phát sinh</label>
                  <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-1 border border-[#b8c6d9] rounded-xl bg-white scrollbar-thin">
                    {INCIDENT_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setIncidentForm(prev => ({ ...prev, title: type }))}
                        className={`p-2 border text-center rounded-lg text-xs font-bold transition-all ${incidentForm.title === type ? 'bg-rose-600 text-white border-rose-700 shadow-md' : 'bg-[#e8eef6]/50 border-[#b8c6d9] text-[#4a5568] hover:bg-[#e8eef6]'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Predefined locations list */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Vị trí xảy ra sự cố</label>
                  <select
                    value={incidentForm.location}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                  >
                    {LOCATIONS.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                  </select>
                </div>

                {/* Optional description */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Mô tả chi tiết sự việc</label>
                  <input
                    type="text"
                    value={incidentForm.description}
                    onChange={(e) => setIncidentForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả mức độ rò rỉ, bóng đèn hỏng..."
                    className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                  />
                </div>

                {/* Touch photo simulator option */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Chụp ảnh minh chứng</label>
                  <button
                    type="button"
                    onClick={() => setIncidentForm(prev => ({ ...prev, photoAttached: !prev.photoAttached }))}
                    className={`w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-xl font-bold text-xs transition-all cursor-pointer ${incidentForm.photoAttached ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-[#e8eef6]/30 border-[#b8c6d9] text-[#7b8a9e] hover:bg-[#e8eef6]/60'}`}
                  >
                    <Camera className="w-5 h-5 shrink-0" />
                    {incidentForm.photoAttached ? '✓ Đã đính kèm ảnh chụp' : 'Bấm vào đây để giả lập chụp ảnh camera'}
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-6 py-4 bg-rose-600 text-white border border-rose-700 rounded-xl text-xs uppercase tracking-widest font-bold shadow-[2px_2px_0px_#4a1414] hover:bg-rose-700 hover:-translate-y-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                >
                  <Megaphone className="w-4.5 h-4.5 mr-1.5" /> Gửi Báo cáo Sự cố khẩn cấp
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </Panel>
  );
};
