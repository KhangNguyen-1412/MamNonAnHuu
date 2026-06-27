import React, { useState, useEffect } from 'react';
import { 
  User, Clock, BookOpen, Shield, CheckSquare, Award, X, Check, Printer, 
  FileText, FileDown, RefreshCw, Sparkles, Calendar, Send, Camera, 
  Info, CheckCircle2, AlertTriangle, ClipboardList, Trash, Plus, 
  Users, Flag, Flame
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { getStudents, Student } from '../../services/studentService';
import { getReportCard, ReportCardDocument } from '../../services/reportCardService';
import { useUserRole } from '../../utils/role';
import { ModuleId } from '../../types';

// Helper to simulate QR Code SVG
const QRCodeSVG: React.FC<{ value: string }> = ({ value }) => {
  return (
    <svg className="w-24 h-24 text-[#1e2a3a] dark:text-[#f5f8fc]" viewBox="0 0 100 100" fill="currentColor">
      {/* Outer Border */}
      <rect x="0" y="0" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="4" />
      {/* Top Left Finder Pattern */}
      <rect x="10" y="10" width="30" height="30" />
      <rect x="15" y="15" width="20" height="20" fill="white" />
      <rect x="20" y="20" width="10" height="10" />
      
      {/* Top Right Finder Pattern */}
      <rect x="60" y="10" width="30" height="30" />
      <rect x="65" y="15" width="20" height="20" fill="white" />
      <rect x="70" y="20" width="10" height="10" />
      
      {/* Bottom Left Finder Pattern */}
      <rect x="10" y="60" width="30" height="30" />
      <rect x="15" y="65" width="20" height="20" fill="white" />
      <rect x="20" y="70" width="10" height="10" />
      
      {/* Simulated Databits */}
      <rect x="45" y="10" width="5" height="5" />
      <rect x="50" y="20" width="5" height="5" />
      <rect x="45" y="30" width="5" height="5" />
      <rect x="50" y="45" width="5" height="5" />
      <rect x="45" y="50" width="5" height="5" />
      <rect x="60" y="50" width="5" height="5" />
      <rect x="80" y="60" width="5" height="5" />
      <rect x="70" y="75" width="5" height="5" />
      <rect x="85" y="85" width="5" height="5" />
      <rect x="60" y="80" width="5" height="5" />
      <rect x="45" y="75" width="5" height="5" />
      <rect x="50" y="85" width="5" height="5" />
      <rect x="15" y="45" width="5" height="5" />
      <rect x="25" y="50" width="5" height="5" />
      <rect x="35" y="45" width="5" height="5" />
    </svg>
  );
};

// Helper to simulate Barcode SVG
const BarcodeSVG: React.FC<{ value: string }> = ({ value }) => {
  return (
    <svg className="w-full h-10 text-[#1e2a3a]" viewBox="0 0 100 40" preserveAspectRatio="none">
      <rect x="0" y="0" width="1" height="40" fill="currentColor" />
      <rect x="3" y="0" width="2" height="40" fill="currentColor" />
      <rect x="7" y="0" width="1" height="40" fill="currentColor" />
      <rect x="10" y="0" width="3" height="40" fill="currentColor" />
      <rect x="15" y="0" width="1" height="40" fill="currentColor" />
      <rect x="18" y="0" width="2" height="40" fill="currentColor" />
      <rect x="22" y="0" width="4" height="40" fill="currentColor" />
      <rect x="28" y="0" width="1" height="40" fill="currentColor" />
      <rect x="31" y="0" width="2" height="40" fill="currentColor" />
      <rect x="35" y="0" width="1" height="40" fill="currentColor" />
      <rect x="38" y="0" width="3" height="40" fill="currentColor" />
      <rect x="43" y="0" width="1" height="40" fill="currentColor" />
      <rect x="46" y="0" width="2" height="40" fill="currentColor" />
      <rect x="50" y="0" width="4" height="40" fill="currentColor" />
      <rect x="56" y="0" width="1" height="40" fill="currentColor" />
      <rect x="59" y="0" width="2" height="40" fill="currentColor" />
      <rect x="63" y="0" width="1" height="40" fill="currentColor" />
      <rect x="66" y="0" width="3" height="40" fill="currentColor" />
      <rect x="71" y="0" width="1" height="40" fill="currentColor" />
      <rect x="74" y="0" width="2" height="40" fill="currentColor" />
      <rect x="78" y="0" width="4" height="40" fill="currentColor" />
      <rect x="84" y="0" width="1" height="40" fill="currentColor" />
      <rect x="87" y="0" width="2" height="40" fill="currentColor" />
      <rect x="91" y="0" width="1" height="40" fill="currentColor" />
      <rect x="94" y="0" width="3" height="40" fill="currentColor" />
      <rect x="99" y="0" width="1" height="40" fill="currentColor" />
    </svg>
  );
};

export interface StudentPortalProps {
  initialTab?: 'dashboard' | 'timetable' | 'grades' | 'conduct' | 'leave' | 'privilege';
  onSelectModule?: (id: ModuleId) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ initialTab = 'dashboard', onSelectModule }) => {
  const currentRole = useUserRole();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timetable' | 'grades' | 'conduct' | 'leave' | 'privilege'>(initialTab);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // Student Profiles & Auth states
  const [student, setStudent] = useState<Student | null>(null);
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportCard, setReportCard] = useState<ReportCardDocument | null>(null);
  
  // Leave request form states
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveDuration, setLeaveDuration] = useState('Cả ngày');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  // Time simulation
  const [currentTime, setCurrentTime] = useState(new Date('2026-06-22T06:55:00+07:00'));

  // Privilege Widgets States (Simulations & DB syncs)
  // 1. Lớp trưởng
  const [sisoPresent, setSisoPresent] = useState(43);
  const [sisoAbsent, setSisoAbsent] = useState(2);
  const [sisoReported, setSisoReported] = useState(false);
  const [remindedList, setRemindedList] = useState<Record<string, boolean>>({});

  // 2. Lớp phó Học tập
  const [sodauBaiContent, setSodauBaiContent] = useState('');
  const [sodauBaiPeriod, setSodauBaiPeriod] = useState('1');
  const [sodauBaiSubject, setSodauBaiSubject] = useState('Toán Học');
  const [sodauBaiAttentive, setSodauBaiAttentive] = useState('A');
  const [sodauBaiHistory, setSodauBaiHistory] = useState<any[]>([]);
  const [homeworkViolations, setHomeworkViolations] = useState<Record<string, string>>({});

  // 3. Lớp phó Lao động
  const [cleaningSchedule, setCleaningSchedule] = useState<Record<string, string>>({
    'Thứ 2': 'Tổ 1',
    'Thứ 3': 'Tổ 2',
    'Thứ 4': 'Tổ 3',
    'Thứ 5': 'Tổ 4',
    'Thứ 6': 'Tổ 1',
    'Thứ 7': 'Tổ 2'
  });
  const [incidentCategory, setIncidentCategory] = useState('Thiết bị điện');
  const [incidentDesc, setIncidentDesc] = useState('');
  const [incidentPhoto, setIncidentPhoto] = useState<string | null>(null);
  const [incidentHistory, setIncidentHistory] = useState<any[]>([]);

  // 4. Lớp phó Văn nghệ
  const [miniSurveys, setMiniSurveys] = useState<any[]>([
    { id: 1, title: 'Đăng ký Ngày hội Thể thao Bé khỏe Bé ngoan', options: ['Tham gia chạy bộ', 'Tham gia kéo co', 'Cổ vũ'], votes: { 0: 12, 1: 20, 2: 3 }, userVote: null },
    { id: 2, title: 'Bình bầu bài hát tốp ca diễn văn nghệ 20/11', options: ['Bụi Phấn', 'Người Thầy', 'Lá thư gửi Thầy'], votes: { 0: 18, 1: 15, 2: 8 }, userVote: null }
  ]);
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyOptionText, setSurveyOptionText] = useState('');
  const [extracurricularAttendance, setExtracurricularAttendance] = useState<Record<string, boolean>>({});

  // 5. Bí thư Chi đoàn
  const [unionMembers, setUnionMembers] = useState<Record<string, boolean>>({});
  const [unionFees, setUnionFees] = useState<Record<string, string>>({}); // paid / unpaid
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeReason, setNomineeReason] = useState('');
  const [nomineeList, setNomineeList] = useState<any[]>([]);

  // 6. Tổ trưởng
  const [morningChecklist, setMorningChecklist] = useState<Record<string, { late: boolean; noBadge: boolean; wrongShoes: boolean }>>({});
  const [morningReportSubmitted, setMorningReportSubmitted] = useState(false);

  // Load active student and classmates
  useEffect(() => {
    const loadPortalData = async () => {
      setLoading(true);
      const email = auth.currentUser?.email;
      if (!email) {
        setLoading(false);
        return;
      }
      const cleanEmail = email.toLowerCase().trim();

      try {
        const studentList = await getStudents();
        const activeStudent = studentList.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
        
        if (activeStudent) {
          setStudent(activeStudent);
          
          // Get classmates in the same grade
          const friends = studentList.filter(s => s.grade === activeStudent.grade && s.id !== activeStudent.id);
          setClassmates(friends);

          // Get personal grades/report card
          const rc = await getReportCard(activeStudent.id, 'Học Kỳ II');
          setReportCard(rc);

          // Load local leave requests
          const savedLeaves = localStorage.getItem(`student_leaves_${activeStudent.id}`);
          if (savedLeaves) {
            setLeaveRequests(JSON.parse(savedLeaves));
          } else {
            const defaults = [
              { id: 'L-01', date: '2026-05-12', duration: 'Cả ngày', reason: 'Em bị sốt xuất huyết nhập viện Cái Bè', status: 'Đã duyệt' }
            ];
            setLeaveRequests(defaults);
            localStorage.setItem(`student_leaves_${activeStudent.id}`, JSON.stringify(defaults));
          }

          // Load local incidents (LP Lao dong)
          const savedIncidents = localStorage.getItem(`student_incidents_${activeStudent.grade}`);
          if (savedIncidents) {
            setIncidentHistory(JSON.parse(savedIncidents));
          } else {
            const defaultIncidents = [
              { id: 'INC-01', category: 'Thiết bị điện', desc: 'Cháy 2 bóng đèn tuýp ở cuối lớp học', date: '2026-06-15', status: 'Đã hoàn thành', image: 'https://images.unsplash.com/photo-1595914619412-fbf3be69e6b4?w=200' }
            ];
            setIncidentHistory(defaultIncidents);
            localStorage.setItem(`student_incidents_${activeStudent.grade}`, JSON.stringify(defaultIncidents));
          }

          // Load Sổ đầu bài điện tử (LP Học tập)
          const savedSodauBai = localStorage.getItem(`student_sodaubai_${activeStudent.grade}`);
          if (savedSodauBai) {
            setSodauBaiHistory(JSON.parse(savedSodauBai));
          } else {
            const defaultSodauBai = [
              { id: 'SDB-01', period: '1', subject: 'Toán Học', content: 'Phương trình mũ và lôgarit nâng cao', attentive: 'A', status: 'Đã xác nhận (Ký số)' },
              { id: 'SDB-02', period: '2', subject: 'Ngữ Văn', content: 'Đọc hiểu bài thơ Đất Nước - Nguyễn Khoa Điềm', attentive: 'A', status: 'Đã xác nhận (Ký số)' }
            ];
            setSodauBaiHistory(defaultSodauBai);
            localStorage.setItem(`student_sodaubai_${activeStudent.grade}`, JSON.stringify(defaultSodauBai));
          }

          // Seed default checklists / values for classmates
          const initialUnion: Record<string, boolean> = {};
          const initialFees: Record<string, string> = {};
          const initialMorning: Record<string, { late: boolean; noBadge: boolean; wrongShoes: boolean }> = {};
          friends.forEach((friend, idx) => {
            initialUnion[friend.id] = idx % 2 === 0;
            initialFees[friend.id] = idx % 3 === 0 ? 'Chưa đóng' : 'Đã đóng';
            initialMorning[friend.id] = { late: false, noBadge: false, wrongShoes: false };
          });
          setUnionMembers(initialUnion);
          setUnionFees(initialFees);
          setMorningChecklist(initialMorning);
        }
      } catch (err) {
        console.error('Failed to load student portal data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPortalData();
  }, []);

  // Time simulator ticket
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(prev => new Date(prev.getTime() + 1000 * 60)); // speed up time (1 minute per second)
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const formatSimTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - Thứ Hai (22/06/2026)';
  };

  const getSimPeriod = (date: Date) => {
    const hour = date.getHours();
    const min = date.getMinutes();
    const totalMin = hour * 60 + min;

    if (totalMin < 7 * 60) return { label: 'Đầu giờ (Báo cáo sĩ số)', current: 'Truy bài đầu giờ' };
    if (totalMin < 7 * 60 + 45) return { label: 'Tiết 1: 07h00 - 07h45', current: 'Toán Học (Cô Thảo)' };
    if (totalMin < 8 * 60 + 35) return { label: 'Tiết 2: 07h50 - 08h35', current: 'Ngữ Văn (Thầy Minh)' };
    if (totalMin < 9 * 60 + 35) return { label: 'Tiết 3: 08h50 - 09h35', current: 'Tiếng Anh (Cô Đào)' };
    if (totalMin < 10 * 60 + 25) return { label: 'Tiết 4: 09h40 - 10h25', current: 'Vật Lý (Thầy Hùng)' };
    return { label: 'Ra về / Trực nhật', current: 'Kết thúc buổi học' };
  };

  const activePeriod = getSimPeriod(currentTime);

  // Submit leave request handler
  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || !leaveDate || !leaveReason) return;
    setSubmittingLeave(true);
    
    const newRequest = {
      id: 'L-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      date: leaveDate,
      duration: leaveDuration,
      reason: leaveReason,
      status: 'Chờ duyệt'
    };

    const updated = [newRequest, ...leaveRequests];
    setLeaveRequests(updated);
    localStorage.setItem(`student_leaves_${student.id}`, JSON.stringify(updated));

    // Simulate database write
    setTimeout(() => {
      setSubmittingLeave(false);
      setLeaveSuccess(true);
      setLeaveDate('');
      setLeaveReason('');
      setTimeout(() => setLeaveSuccess(false), 3000);
    }, 8000);
  };

  // Lớp trưởng: Chốt sĩ số
  const handleReportSiso = () => {
    setSisoReported(true);
    alert('🎉 Đã chốt sĩ số đầu ngày gửi Giám thị thành công vào lúc 7h00 sáng!');
  };

  // Lớp phó Học tập: Gửi sổ đầu bài
  const handleSubmitSodauBai = () => {
    if (!sodauBaiContent || !student) return;
    const newRecord = {
      id: 'SDB-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      period: sodauBaiPeriod,
      subject: sodauBaiSubject,
      content: sodauBaiContent,
      attentive: sodauBaiAttentive,
      status: 'Chờ giáo viên ký số'
    };
    const updated = [newRecord, ...sodauBaiHistory];
    setSodauBaiHistory(updated);
    localStorage.setItem(`student_sodaubai_${student.grade}`, JSON.stringify(updated));
    setSodauBaiContent('');
    alert('📝 Đã lưu nội dung Sổ đầu bài điện tử. Vui lòng nhắc Giáo viên bộ môn đăng nhập ký số xác nhận!');
  };

  // Lớp phó Lao động: Báo hỏng cơ sở vật chất
  const handleIncidentSubmit = () => {
    if (!incidentDesc || !student) return;
    const newIncident = {
      id: 'INC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      category: incidentCategory,
      desc: incidentDesc,
      date: new Date().toISOString().split('T')[0],
      status: 'Chờ xử lý',
      image: incidentPhoto || 'https://images.unsplash.com/photo-1595914619412-fbf3be69e6b4?w=200'
    };
    const updated = [newIncident, ...incidentHistory];
    setIncidentHistory(updated);
    localStorage.setItem(`student_incidents_${student.grade}`, JSON.stringify(updated));
    
    // Auto-update global facilities database fallback
    try {
      const globalKey = 'firestore_fallback_facilities';
      const cachedGlob = localStorage.getItem(globalKey);
      const globList = cachedGlob ? JSON.parse(cachedGlob) : [];
      globList.push({
        id: newIncident.id,
        name: `${incidentCategory} lớp ${student.grade}`,
        location: `Phòng học ${student.grade}`,
        status: 'Chờ Sửa Chữa',
        details: incidentDesc,
        reportedBy: student.name,
        reportedDate: newIncident.date,
        cost: 0
      });
      localStorage.setItem(globalKey, JSON.stringify(globList));
    } catch(err) {
      console.error(err);
    }

    setIncidentDesc('');
    setIncidentPhoto(null);
    alert('⚡ Phiếu báo hỏng đã được gửi đi siêu tốc! Đã tự động đẩy phiếu trực tiếp lên Ban Giám Hiệu và Tạp vụ để tiếp nhận.');
  };

  const handleSimulatePhoto = () => {
    setIncidentPhoto('https://images.unsplash.com/photo-1595914619412-fbf3be69e6b4?w=200'); // simulated photo
  };

  // Lớp phó Văn nghệ: Tạo biểu mẫu khảo sát mini
  const handleCreateSurvey = () => {
    if (!surveyTitle || !surveyOptionText) return;
    const options = surveyOptionText.split(',').map(o => o.trim());
    if (options.length < 2) {
      alert('Vui lòng nhập tối thiểu 2 phương án khảo sát, cách nhau bằng dấu phẩy.');
      return;
    }
    const votes: Record<number, number> = {};
    options.forEach((_, idx) => votes[idx] = 0);

    const newSurvey = {
      id: miniSurveys.length + 1,
      title: surveyTitle,
      options,
      votes,
      userVote: null
    };

    setMiniSurveys([...miniSurveys, newSurvey]);
    setSurveyTitle('');
    setSurveyOptionText('');
    alert('📊 Tạo biểu mẫu khảo sát lớp thành công! Khảo sát đang hiển thị trực tuyến trên bảng điều khiển của cả lớp.');
  };

  const handleVote = (surveyId: number, optionIdx: number) => {
    setMiniSurveys(prev => prev.map(s => {
      if (s.id === surveyId) {
        if (s.userVote !== null) return s; // already voted
        const newVotes = { ...s.votes };
        newVotes[optionIdx] = (newVotes[optionIdx] || 0) + 1;
        return { ...s, votes: newVotes, userVote: optionIdx };
      }
      return s;
    }));
  };

  // Bí thư: Nộp hồ sơ xét duyệt "Học sinh 3 tốt"
  const handleNomineeSubmit = () => {
    if (!nomineeName || !nomineeReason) return;
    const newNominee = {
      id: 'N-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      name: nomineeName,
      reason: nomineeReason,
      date: new Date().toLocaleDateString('vi-VN')
    };
    setNomineeList([newNominee, ...nomineeList]);
    setNomineeName('');
    setNomineeReason('');
    alert('🚩 Đã nộp hồ sơ xét duyệt danh hiệu "Học sinh 3 tốt" cấp Trường thành công!');
  };

  // Tổ trưởng: Gửi báo cáo thi đua tổ
  const handleSendMorningReport = () => {
    setMorningReportSubmitted(true);
    alert('👥 Đã gửi checklist thi đua nề nếp của Tổ 1 lên hệ thống. Dữ liệu đã tự động cộng dồn lên cho Lớp trưởng và Giáo viên chủ nhiệm!');
  };

  if (loading) {
    return (
      <div className="h-[500px] flex flex-col items-center justify-center text-[#2c5ea0]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2c5ea0]"></div>
        <p className="mt-4 text-xs font-bold text-[#7b8a9e] uppercase tracking-widest animate-pulse">Đang tải cổng thông tin phụ huynh...</p>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-8 bg-rose-50 border border-rose-200 text-rose-800 text-center rounded-3xl m-8">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h3 className="font-serif font-bold text-xl">Không tìm thấy tài khoản trẻ!</h3>
        <p className="text-sm mt-2 text-rose-900">Vui lòng đăng nhập bằng một tài khoản email của phụ huynh để truy cập Không gian cá nhân.</p>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative bg-[#e8eef6]">
      {/* Background micro grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#b8c6d9_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex flex-col min-h-full">
        {/* Banner Section */}
        <section className="bg-white rounded-3xl border border-[#b8c6d9] shadow-sm p-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 flex items-center justify-center text-[#2c5ea0] rounded-2xl shrink-0">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-2xl text-[#1e2a3a]">Chào buổi sáng, {student.name}!</h1>
              <p className="text-[#4a5568] text-xs mt-1 font-sans">
                Lớp <strong className="text-[#2c5ea0]">{student.grade}</strong> • Chức vụ: <strong className="text-[#2c5ea0]">{student.classRole || 'Học sinh'}</strong>
              </p>
              <p className="text-[#7b8a9e] text-[10px] mt-1 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#2c5ea0]" /> {formatSimTime(currentTime)}
              </p>
            </div>
          </div>

          <div className="bg-[#e8eef6] px-4 py-3 rounded-2xl border border-[#b8c6d9] text-sm flex flex-col gap-1 w-full md:w-fit min-w-[240px] shadow-inner font-sans">
            <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Tiết học hiện tại:</span>
            <span className="font-bold text-[#1e2a3a]">{activePeriod.current}</span>
            <span className="text-[11px] text-[#2c5ea0] font-medium">{activePeriod.label}</span>
          </div>
        </section>

        {/* Dashboard 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          {/* Left / Navigation & Core Modules */}
          <div className="lg:col-span-3 flex flex-col gap-8 min-w-0">
            {/* Tab content panels */}
            <div className="flex-1">
              {/* Tab 1: Dashboard Home */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Warning reminder */}
                  <div className="bg-[#fff9e6] border border-[#ffe0b2] p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs font-bold text-amber-950 leading-normal">
                      Nhắc nhở học tập: <span className="underline">Ngày mai (23/06/2026) có bài Kiểm tra 15 phút môn Toán</span> bài phương trình mũ. Các em chú ý chuẩn bị bài đầy đủ!
                    </p>
                  </div>

                  {/* Privilege widgets shortcut banner on dashboard */}
                  {student.classRole && student.classRole !== 'Học sinh' && (
                    <div className="bg-gradient-to-r from-[#a8c4e0] to-[#e8eef6] border border-[#a3b3c8] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-serif font-bold text-[#1e2a3a] text-lg flex items-center gap-2">
                          <Award className="w-5 h-5 text-[#2c5ea0]" /> Bàn Làm Việc: {student.classRole}
                        </h3>
                        <p className="text-xs text-[#4a5568] mt-1 font-medium">Báo cáo sĩ số, xếp lịch trực nhật hoặc công tác lớp đang chờ bạn xử lý ở phân hệ quản lý đặc quyền.</p>
                      </div>
                      <button 
                        onClick={() => onSelectModule ? onSelectModule('student-privilege') : setActiveTab('privilege')}
                        className="px-5 py-2.5 bg-[#2c5ea0] hover:bg-[#663030] text-white text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-sm"
                      >
                        Mở Bảng Quản Lý
                      </button>
                    </div>
                  )}

                  {/* Quick dashboard grid widgets */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Timetable widget */}
                    <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                      <h4 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#2c5ea0]" /> Thời Khóa Biểu Hôm Nay
                      </h4>
                      <div className="space-y-3 font-sans">
                        <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#f5f8fc] border border-[#f0eae1]">
                          <span className="font-bold text-[#7b8a9e]">07h00 - 07h45</span>
                          <span className="font-bold text-[#1e2a3a]">Toán Học (10A1)</span>
                          <span className="text-[10px] text-[#2e6b8a] bg-[#e5f0e8] px-2 py-0.5 rounded font-black">Tiết 1</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#f5f8fc] border border-[#f0eae1]">
                          <span className="font-bold text-[#7b8a9e]">07h50 - 08h35</span>
                          <span className="font-bold text-[#1e2a3a]">Ngữ Văn (10A1)</span>
                          <span className="text-[10px] text-[#2e6b8a] bg-[#e5f0e8] px-2 py-0.5 rounded font-black">Tiết 2</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#f5f8fc] border border-[#f0eae1]">
                          <span className="font-bold text-[#7b8a9e]">08h50 - 09h35</span>
                          <span className="font-bold text-[#1e2a3a]">Tiếng Anh (10A1)</span>
                          <span className="text-[10px] text-[#2e6b8a] bg-[#e5f0e8] px-2 py-0.5 rounded font-black">Tiết 3</span>
                        </div>
                        <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-[#f5f8fc] border border-[#f0eae1]">
                          <span className="font-bold text-[#7b8a9e]">09h40 - 10h25</span>
                          <span className="font-bold text-[#1e2a3a]">Vật Lý (10A1)</span>
                          <span className="text-[10px] text-[#2e6b8a] bg-[#e5f0e8] px-2 py-0.5 rounded font-black">Tiết 4</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal grades preview */}
                    <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm flex flex-col">
                      <h4 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                        <Award className="w-4 h-4 text-[#2c5ea0]" /> Kết Quả Học Tập Kỳ II (Sổ điểm)
                      </h4>
                      {reportCard ? (
                        <div className="flex-1 flex flex-col justify-between space-y-4">
                          <div className="grid grid-cols-3 gap-2 text-center font-sans">
                            <div className="bg-[#f0f4fa] p-3 border border-[#b8c6d9] rounded-2xl">
                              <span className="text-[9px] font-bold text-[#7b8a9e] uppercase block">Điểm TB</span>
                              <span className="text-xl font-bold font-serif text-[#1e2a3a] mt-1 block">{reportCard.summary.gpa.toFixed(1)}</span>
                            </div>
                            <div className="bg-[#f0f4fa] p-3 border border-[#b8c6d9] rounded-2xl">
                              <span className="text-[9px] font-bold text-[#7b8a9e] uppercase block">Học Lực</span>
                              <span className="text-base font-bold text-[#2e6b8a] mt-1 block">{reportCard.summary.academicConduct}</span>
                            </div>
                            <div className="bg-[#f0f4fa] p-3 border border-[#b8c6d9] rounded-2xl">
                              <span className="text-[9px] font-bold text-[#7b8a9e] uppercase block">Hạnh Kiểm</span>
                              <span className="text-base font-bold text-[#2c5ea0] mt-1 block">{reportCard.summary.moralConduct}</span>
                            </div>
                          </div>
                          <button 
                            onClick={() => onSelectModule ? onSelectModule('student-grades') : setActiveTab('grades')}
                            className="w-full text-center py-2 bg-[#e8eef6] hover:bg-[#efeae0] border border-[#b8c6d9] text-[11px] font-bold text-[#2c5ea0] uppercase tracking-wider rounded-xl transition-all"
                          >
                            Xem Chi Tiết Bảng Điểm
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-[#7b8a9e] py-6 font-sans">
                          <Info className="w-8 h-8 mb-2 opacity-60" />
                          <p className="text-xs text-center font-medium">Chưa cập nhật dữ liệu điểm số kỳ này.</p>
                        </div>
                      )}
                    </div>

                    {/* Surveys widget for classroom */}
                    <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm md:col-span-2">
                      <h4 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#2c5ea0]" /> Bảng Khảo Sát Lớp Học trực tuyến
                      </h4>
                      <div className="space-y-4">
                        {miniSurveys.map(s => {
                          const totalVotes = Object.values(s.votes).reduce((a: any, b: any) => a + b, 0) as number;
                          return (
                            <div key={s.id} className="p-4 border border-[#dce4ee] rounded-2xl bg-[#f5f8fc] font-sans">
                              <p className="text-xs font-bold text-[#1e2a3a] mb-3">{s.title}</p>
                              <div className="space-y-2">
                                {s.options.map((opt: string, idx: number) => {
                                  const votes = s.votes[idx] || 0;
                                  const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                                  const voted = s.userVote === idx;
                                  return (
                                    <button
                                      key={idx}
                                      onClick={() => handleVote(s.id, idx)}
                                      disabled={s.userVote !== null}
                                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all relative overflow-hidden flex justify-between items-center ${
                                        voted 
                                          ? 'border-[#2c5ea0] bg-[#2c5ea0]/5' 
                                          : 'border-[#b8c6d9] bg-white hover:bg-gray-50'
                                      }`}
                                    >
                                      {/* Percent progress bar */}
                                      <div 
                                        className="absolute left-0 top-0 bottom-0 bg-[#2c5ea0]/10 transition-all"
                                        style={{ width: `${pct}%` }}
                                      ></div>
                                      <span className="z-10 font-medium text-[#4a5568] flex items-center gap-2">
                                        {voted && <Check className="w-4.5 h-4.5 text-[#2c5ea0]" />} {opt}
                                      </span>
                                      <span className="z-10 font-bold text-[#7b8a9e] font-mono">{pct}% ({votes} phiếu)</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Timetable full */}
              {activeTab === 'timetable' && (
                <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="font-serif font-bold text-[#1e2a3a] text-lg mb-6 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#2c5ea0]" /> Thời Khóa Biểu & Lịch Thi
                  </h3>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-sans border-collapse">
                      <thead>
                        <tr className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[#7b8a9e] uppercase tracking-wider font-bold">
                          <th className="p-3">Tiết</th>
                          <th className="p-3">Thứ 2</th>
                          <th className="p-3">Thứ 3</th>
                          <th className="p-3">Thứ 4</th>
                          <th className="p-3">Thứ 5</th>
                          <th className="p-3">Thứ 6</th>
                          <th className="p-3">Thứ 7</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce4ee] font-medium text-[#1e2a3a]">
                        <tr>
                          <td className="p-3 bg-[#f5f8fc] font-bold text-[#7b8a9e]">Tiết 1 (7h00)</td>
                          <td className="p-3 bg-[#2c5ea0]/5 text-[#2c5ea0] font-bold">Toán Học</td>
                          <td className="p-3">Sinh Học</td>
                          <td className="p-3">Toán Học</td>
                          <td className="p-3">Địa Lý</td>
                          <td className="p-3">Tiếng Anh</td>
                          <td className="p-3">Tin Học</td>
                        </tr>
                        <tr>
                          <td className="p-3 bg-[#f5f8fc] font-bold text-[#7b8a9e]">Tiết 2 (7h50)</td>
                          <td className="p-3">Ngữ Văn</td>
                          <td className="p-3">Hóa Học</td>
                          <td className="p-3">Vật Lý</td>
                          <td className="p-3">Địa Lý</td>
                          <td className="p-3">Ngữ Văn</td>
                          <td className="p-3">KTPL</td>
                        </tr>
                        <tr>
                          <td className="p-3 bg-[#f5f8fc] font-bold text-[#7b8a9e]">Tiết 3 (8h50)</td>
                          <td className="p-3">Tiếng Anh</td>
                          <td className="p-3">Hóa Học</td>
                          <td className="p-3">Vật Lý</td>
                          <td className="p-3">Lịch Sử</td>
                          <td className="p-3">QPAN</td>
                          <td className="p-3">Thể chất</td>
                        </tr>
                        <tr>
                          <td className="p-3 bg-[#f5f8fc] font-bold text-[#7b8a9e]">Tiết 4 (9h40)</td>
                          <td className="p-3">Vật Lý</td>
                          <td className="p-3">Công nghệ</td>
                          <td className="p-3">Ngữ Văn</td>
                          <td className="p-3">Lịch Sử</td>
                          <td className="p-3">SH Lớp</td>
                          <td className="p-3">Thể chất</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-8">
                    <h4 className="font-bold text-[#2c5ea0] uppercase tracking-widest text-xs mb-4 border-b border-[#dce4ee] pb-2">
                      Lịch kiểm tra & khảo thí kỳ II
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-[#f5f8fc] border border-[#b8c6d9] rounded-2xl flex justify-between items-center font-sans">
                        <div>
                          <p className="text-xs font-bold text-[#1e2a3a]">Kiểm tra 15p - môn Toán</p>
                          <p className="text-[10px] text-[#7b8a9e] mt-0.5">Thời gian: Tiết 1 - Ngày mai (23/06)</p>
                        </div>
                        <span className="text-[9px] bg-red-100 text-[#2c5ea0] px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">Quan Trọng</span>
                      </div>
                      <div className="p-4 bg-[#f5f8fc] border border-[#b8c6d9] rounded-2xl flex justify-between items-center font-sans">
                        <div>
                          <p className="text-xs font-bold text-[#1e2a3a]">Khảo sát tập trung - môn Tiếng Anh</p>
                          <p className="text-[10px] text-[#7b8a9e] mt-0.5">Thời gian: Thứ Sáu tuần này (26/06)</p>
                        </div>
                        <span className="text-[9px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full uppercase tracking-wider font-bold">Kế Hoạch</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Individual grades */}
              {activeTab === 'grades' && (
                <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="font-serif font-bold text-[#1e2a3a] text-lg mb-6 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#2c5ea0]" /> Sổ Điểm Học Tập Cá Nhân
                  </h3>
                  
                  {reportCard ? (
                    <div className="space-y-6">
                      <div className="bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl p-4 flex flex-col md:flex-row justify-between text-xs gap-4 font-sans font-medium text-[#4a5568]">
                        <p>Họ tên: <strong className="text-[#1e2a3a]">{reportCard.name}</strong></p>
                        <p>Lớp: <strong className="text-[#1e2a3a]">{reportCard.grade}</strong></p>
                        <p>GVCN: <strong className="text-[#1e2a3a]">{reportCard.gvcn}</strong></p>
                        <p>Học kỳ: <strong className="text-[#2c5ea0]">Học Kỳ II</strong></p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-sans border-collapse">
                          <thead>
                            <tr className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[#7b8a9e] uppercase tracking-wider font-bold">
                              <th className="p-3">Môn học</th>
                              <th className="p-3 text-center">Hệ số 1 (15p)</th>
                              <th className="p-3 text-center">Hệ số 2 (1 Tiết)</th>
                              <th className="p-3 text-center">Học kỳ</th>
                              <th className="p-3 text-center">Điểm TB</th>
                              <th className="p-3">Nhận xét của Giáo viên</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#dce4ee] font-sans">
                            {reportCard.scores.map((score, idx) => {
                              const isQual = typeof score.average === 'string';
                              return (
                                <tr key={idx} className="hover:bg-[#f0f4fa] transition-colors">
                                  <td className="p-3 font-bold text-[#1e2a3a]">{score.subject}</td>
                                  <td className="p-3 text-center text-[#7b8a9e] font-mono">{score.multiplier1.join(', ')}</td>
                                  <td className="p-3 text-center text-[#7b8a9e] font-mono">{score.multiplier2.join(', ')}</td>
                                  <td className="p-3 text-center text-[#7b8a9e] font-mono">{score.multiplier3}</td>
                                  <td className="p-3 text-center font-bold font-serif text-sm">
                                    <span className={!isQual && Number(score.average) >= 8 ? 'text-[#2e6b8a]' : ''}>
                                      {score.average}
                                    </span>
                                  </td>
                                  <td className="p-3 text-[#4a5568] italic">{score.teacherComment || 'Hoàn thành tốt nhiệm vụ.'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 font-sans">
                      <Info className="w-12 h-12 text-[#7b8a9e] mx-auto mb-3 opacity-60" />
                      <p className="text-sm text-[#4a5568] font-bold">Chưa có kết quả học kỳ này.</p>
                      <p className="text-xs text-[#7b8a9e] mt-1">Vui lòng quay lại sau khi giáo viên bộ môn hoàn tất công tác nhập sổ điểm điện tử.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Attendance & Conduct */}
              {activeTab === 'conduct' && (
                <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm space-y-8 font-sans">
                  <div>
                    <h3 className="font-serif font-bold text-[#1e2a3a] text-lg mb-6 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#2c5ea0]" /> Lịch Sử Nề Nếp & Chuyên Cần Cá Nhân
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-[#7b8a9e] uppercase block">Tổng ngày nghỉ</span>
                        <span className="text-2xl font-bold font-serif text-[#2c5ea0] mt-1.5 block">
                          {reportCard ? reportCard.summary.daysAbsent : 1} ngày
                        </span>
                      </div>
                      <div className="p-5 bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-[#7b8a9e] uppercase block">Có xin phép</span>
                        <span className="text-2xl font-bold font-serif text-[#2e6b8a] mt-1.5 block">
                          {reportCard ? reportCard.summary.daysAbsentExcused : 1} ngày
                        </span>
                      </div>
                      <div className="p-5 bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl text-center">
                        <span className="text-[10px] font-bold text-[#7b8a9e] uppercase block">Không phép (Đi trễ)</span>
                        <span className="text-2xl font-bold font-serif text-amber-700 mt-1.5 block">0 ngày</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#dce4ee] pb-2">
                      Lịch sử ghi nhận nội quy cờ đỏ lớp
                    </h4>
                    <div className="p-4 border border-[#dce4ee] bg-[#f5f8fc] rounded-2xl space-y-4">
                      <div className="flex justify-between items-center text-xs border-b border-[#e8eef6] pb-2.5">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#2e6b8a]" />
                          <div>
                            <p className="font-bold text-[#1e2a3a]">Được tuyên dương tuần 34</p>
                            <p className="text-[10px] text-[#7b8a9e] mt-0.5">Tích cực tham gia dọn dẹp vệ sinh khuôn viên lớp học</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#2e6b8a]">+5 điểm</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#2e6b8a]" />
                          <div>
                            <p className="font-bold text-[#1e2a3a]">Hoàn thành đầy đủ bài tập chuẩn bị</p>
                            <p className="text-[10px] text-[#7b8a9e] mt-0.5">Được giáo viên Tiếng Anh cộng điểm chuyên cần tuần</p>
                          </div>
                        </div>
                        <span className="font-bold text-[#2e6b8a]">+2 điểm</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Leave requests */}
              {activeTab === 'leave' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-sans">
                  {/* Leave form */}
                  <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                    <h3 className="font-serif font-bold text-[#1e2a3a] text-lg mb-6 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                      <Send className="w-5 h-5 text-[#2c5ea0]" /> Viết Đơn Xin Nghỉ Phép
                    </h3>

                    {leaveSuccess && (
                      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Gửi đơn xin nghỉ phép lên GVCN thành công! Đơn đang ở trạng thái chờ duyệt.
                      </div>
                    )}

                    <form onSubmit={handleSubmitLeave} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Ngày nghỉ dự kiến</label>
                        <input 
                          type="date" 
                          required
                          value={leaveDate}
                          onChange={e => setLeaveDate(e.target.value)}
                          className="w-full bg-[#f5f8fc] border border-[#b8c6d9] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Thời lượng</label>
                        <select 
                          value={leaveDuration}
                          onChange={e => setLeaveDuration(e.target.value)}
                          className="w-full bg-[#f5f8fc] border border-[#b8c6d9] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                        >
                          <option>Cả ngày</option>
                          <option>Buổi sáng</option>
                          <option>Buổi chiều</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Lý do xin nghỉ</label>
                        <textarea 
                          required
                          rows={3}
                          placeholder="Ví dụ: Em bị ốm sốt đau đầu..."
                          value={leaveReason}
                          onChange={e => setLeaveReason(e.target.value)}
                          className="w-full bg-[#f5f8fc] border border-[#b8c6d9] rounded-xl px-4 py-2.5 text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0] resize-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 p-2.5 border border-dashed border-[#b8c6d9] rounded-xl bg-[#f0f4fa] text-[10px] text-[#7b8a9e]">
                        <input type="checkbox" required id="parent_confirm" className="rounded border-[#b8c6d9]" />
                        <label htmlFor="parent_confirm" className="font-bold">Tôi xác nhận đã trao đổi với phụ huynh đồng ý làm đơn này.</label>
                      </div>

                      <button
                        type="submit"
                        disabled={submittingLeave}
                        className="w-full py-3 bg-[#2c5ea0] hover:bg-[#663030] text-white border border-[#5c2525] text-xs uppercase tracking-widest font-bold rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submittingLeave ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang gửi đơn...
                          </>
                        ) : 'Gửi Đơn Lên GVCN'}
                      </button>
                    </form>
                  </div>

                  {/* Leave history */}
                  <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                    <h3 className="font-serif font-bold text-[#1e2a3a] text-lg mb-6 border-b border-[#dce4ee] pb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#2c5ea0]" /> Lịch Sử Yêu Cầu Nghỉ Phép
                    </h3>
                    <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 main-scrollbar">
                      {leaveRequests.map((req, idx) => (
                        <div key={idx} className="p-4 border border-[#dce4ee] bg-[#f5f8fc] rounded-xl text-xs space-y-2">
                          <div className="flex justify-between items-center font-bold">
                            <span className="text-[#1e2a3a]">{req.date} ({req.duration})</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-black ${
                              req.status === 'Đã duyệt' 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>{req.status}</span>
                          </div>
                          <p className="text-[#4a5568] italic font-medium">Lý do: "{req.reason}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Special Privilege Widget Panel */}
              {activeTab === 'privilege' && (
                <div className="bg-white border border-[#b8c6d9] rounded-3xl p-6 shadow-sm font-sans">
                  
                  {/* 🌟 ROLE 1: Lớp trưởng */}
                  {student.classRole === 'Lớp trưởng' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
                        <Users className="w-6 h-6 text-[#2c5ea0]" />
                        <div>
                          <h3 className="font-serif font-bold text-[#1e2a3a] text-lg">Quản lý Lớp học - Lớp trưởng</h3>
                          <p className="text-[#7b8a9e] text-xs">Phân hệ thống kê, báo cáo sĩ số giám thị và nhắc nhở nề nếp thi đua.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Sĩ số widget */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4 shadow-inner">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Báo cáo sĩ số hàng ngày</h4>
                          <div className="grid grid-cols-3 gap-2 text-center text-xs">
                            <div className="bg-white p-2 border border-[#b8c6d9] rounded-xl">
                              <span className="text-[#7b8a9e] block">Sĩ số lớp</span>
                              <span className="text-xl font-bold font-serif text-[#1e2a3a] mt-1 block">45</span>
                            </div>
                            <div className="bg-white p-2 border border-[#b8c6d9] rounded-xl">
                              <span className="text-[#7b8a9e] block">Hiện diện</span>
                              <span className="text-xl font-bold font-serif text-[#2e6b8a] mt-1 block">{sisoPresent}</span>
                            </div>
                            <div className="bg-white p-2 border border-[#b8c6d9] rounded-xl">
                              <span className="text-[#7b8a9e] block">Vắng mặt</span>
                              <span className="text-xl font-bold font-serif text-[#2c5ea0] mt-1 block">{sisoAbsent}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setSisoPresent(p => p - 1); setSisoAbsent(a => a + 1); }}
                              disabled={sisoPresent <= 40}
                              className="flex-1 py-2 bg-white hover:bg-gray-50 border border-[#b8c6d9] rounded-xl text-[10px] font-bold text-[#1e2a3a] uppercase transition-all"
                            >
                              - Giảm hiện diện
                            </button>
                            <button
                              onClick={() => { setSisoPresent(p => p + 1); setSisoAbsent(a => a - 1); }}
                              disabled={sisoAbsent <= 0}
                              className="flex-1 py-2 bg-white hover:bg-gray-50 border border-[#b8c6d9] rounded-xl text-[10px] font-bold text-[#1e2a3a] uppercase transition-all"
                            >
                              + Tăng hiện diện
                            </button>
                          </div>

                          <button
                            onClick={handleReportSiso}
                            disabled={sisoReported}
                            className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm ${
                              sisoReported 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-not-allowed' 
                                : 'bg-[#2c5ea0] text-white hover:bg-[#663030] border border-[#5c2525]'
                            }`}
                          >
                            {sisoReported ? '✓ Đã Báo Cáo Thành Công' : 'Báo Cáo Sĩ Số Cho Giám Thị (7h00)'}
                          </button>
                        </div>

                        {/* Violating students list */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Nội quy thi đua: Các bạn bị ghi nhận vi phạm tuần</h4>
                          <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 main-scrollbar text-xs">
                            {classmates.slice(0, 3).map((friend, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white p-2.5 border border-[#b8c6d9] rounded-xl">
                                <div>
                                  <p className="font-bold text-[#1e2a3a]">{friend.name}</p>
                                  <p className="text-[10px] text-[#7b8a9e] mt-0.5 font-medium">Ghi chú: {idx === 0 ? 'Quên mang bình nước cá nhân' : idx === 1 ? 'Chưa cắt móng tay' : 'Quên mang mũ/nón che nắng'}</p>
                                </div>
                                <button
                                  onClick={() => setRemindedList(prev => ({ ...prev, [friend.id]: !prev[friend.id] }))}
                                  className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-all ${
                                    remindedList[friend.id]
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] hover:bg-[#efeae0]'
                                  }`}
                                >
                                  {remindedList[friend.id] ? 'Đã nhắc' : 'Đôn đốc'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 📚 ROLE 2: Lớp phó Học tập */}
                  {student.classRole === 'Lớp phó học tập' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
                        <BookOpen className="w-6 h-6 text-[#2c5ea0]" />
                        <div>
                          <h3 className="font-serif font-bold text-[#1e2a3a] text-lg">Sổ Đầu Bài & Bài Tập - Lớp phó Học tập</h3>
                          <p className="text-[#7b8a9e] text-xs">Theo dõi và phối hợp rèn luyện các thói quen sinh hoạt cho bé.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* E-SodauBai form */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Nhập nội dung Sổ đầu bài điện tử</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Tiết học</label>
                              <select 
                                value={sodauBaiPeriod}
                                onChange={e => setSodauBaiPeriod(e.target.value)}
                                className="w-full bg-white border border-[#b8c6d9] rounded-xl px-2 py-1.5 text-xs font-bold text-[#1e2a3a]"
                              >
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4</option>
                              </select>
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Môn học</label>
                              <select
                                value={sodauBaiSubject}
                                onChange={e => setSodauBaiSubject(e.target.value)}
                                className="w-full bg-white border border-[#b8c6d9] rounded-xl px-2 py-1.5 text-xs font-bold text-[#1e2a3a]"
                              >
                                <option>Toán Học</option>
                                <option>Ngữ Văn</option>
                                <option>Tiếng Anh</option>
                                <option>Vật Lý</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Nội dung bài học dạy thực tế</label>
                            <input 
                              type="text" 
                              required
                              placeholder="Ví dụ: Luyện tập phương trình mũ..."
                              value={sodauBaiContent}
                              onChange={e => setSodauBaiContent(e.target.value)}
                              className="w-full bg-white border border-[#b8c6d9] rounded-xl px-3 py-1.5 text-xs font-bold text-[#1e2a3a]"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Đánh giá mức độ chú ý lớp</label>
                            <div className="flex gap-2">
                              {['A', 'B', 'C', 'D'].map(grade => (
                                <button
                                  key={grade}
                                  type="button"
                                  onClick={() => setSodauBaiAttentive(grade)}
                                  className={`flex-1 py-1.5 font-serif font-bold text-sm rounded-xl border transition-all ${
                                    sodauBaiAttentive === grade
                                      ? 'bg-[#2c5ea0] text-white border-[#5a2e2e]'
                                      : 'bg-white border-[#b8c6d9] text-[#4a5568] hover:bg-gray-50'
                                  }`}
                                >
                                  Loại {grade}
                                </button>
                              ))}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleSubmitSodauBai}
                            className="w-full py-2 bg-[#1e2a3a] hover:bg-[#131a25] text-white border border-[#131a25] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-sm"
                          >
                            Đẩy Lên Giáo Viên Ký Số
                          </button>
                        </div>

                        {/* Homework offenders logs */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Sổ theo dõi bài tập đầu giờ</h4>
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 main-scrollbar text-xs">
                            {classmates.map((friend, idx) => (
                              <div key={friend.id} className="flex justify-between items-center bg-white p-2.5 border border-[#b8c6d9] rounded-xl">
                                <div>
                                  <p className="font-bold text-[#1e2a3a]">{friend.name}</p>
                                  <p className="text-[10px] text-[#7b8a9e] mt-0.5 font-medium">
                                    Lỗi: {homeworkViolations[friend.id] || 'Đầy đủ bài tập'}
                                  </p>
                                </div>
                                <select
                                  onChange={e => {
                                    const val = e.target.value;
                                    setHomeworkViolations(prev => ({ ...prev, [friend.id]: val }));
                                  }}
                                  className="bg-[#e8eef6] border border-[#b8c6d9] text-[10px] font-bold text-[#1e2a3a] px-2 py-1 rounded"
                                >
                                  <option value="">Đầy đủ bài</option>
                                  <option value="Thiếu bài tập Toán">Thiếu bài Toán</option>
                                  <option value="Thiếu bài tập Văn">Thiếu bài Văn</option>
                                  <option value="Chưa chuẩn bị bài mới">Không soạn bài</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🧹 ROLE 3: Lớp phó Lao động */}
                  {student.classRole === 'Lớp phó lao động' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
                        <Users className="w-6 h-6 text-[#2c5ea0]" />
                        <div>
                          <h3 className="font-serif font-bold text-[#1e2a3a] text-lg">Trực Nhật & Tài Sản - Lớp phó Lao động</h3>
                          <p className="text-[#7b8a9e] text-xs">Thiết lập phân công lịch trực nhật tổ và báo cáo sự cố cơ sở vật chất phòng học.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Duty roster setup */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Phân công Trực nhật tuần</h4>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {Object.entries(cleaningSchedule).map(([day, team]) => (
                              <div key={day} className="flex justify-between items-center bg-white p-2.5 border border-[#b8c6d9] rounded-xl font-sans font-medium text-[#1e2a3a]">
                                <span>{day}:</span>
                                <select
                                  value={team}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setCleaningSchedule(prev => ({ ...prev, [day]: val }));
                                  }}
                                  className="bg-[#e8eef6] border border-[#b8c6d9] text-[10px] font-bold text-[#2c5ea0] px-2 py-1 rounded"
                                >
                                  <option>Tổ 1</option>
                                  <option>Tổ 2</option>
                                  <option>Tổ 3</option>
                                  <option>Tổ 4</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Super fast issue report form */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Báo hỏng siêu tốc cơ sở vật chất</h4>
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase mb-1">Loại thiết bị hỏng</label>
                              <select
                                value={incidentCategory}
                                onChange={e => setIncidentCategory(e.target.value)}
                                className="w-full bg-white border border-[#b8c6d9] rounded-xl px-3 py-2 text-xs font-bold text-[#1e2a3a]"
                              >
                                <option>Thiết bị điện</option>
                                <option>Quạt trần / Quạt treo tường</option>
                                <option>Máy chiếu / projector</option>
                                <option>Bàn ghế mầm non</option>
                                <option>Cửa kính / Rèm cửa</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase mb-1">Mô tả sự cố chi tiết</label>
                              <textarea
                                rows={2}
                                placeholder="Mô tả sự cố để tạp vụ nắm bắt..."
                                value={incidentDesc}
                                onChange={e => setIncidentDesc(e.target.value)}
                                className="w-full bg-white border border-[#b8c6d9] rounded-xl px-3 py-2 text-xs font-bold text-[#1e2a3a] resize-none focus:outline-none focus:border-[#2c5ea0]"
                              />
                            </div>

                            <div className="flex justify-between items-center gap-3">
                              <button
                                type="button"
                                onClick={handleSimulatePhoto}
                                className="flex-1 py-2 bg-white border border-[#b8c6d9] text-[10px] font-bold text-[#1e2a3a] hover:bg-gray-50 transition-all rounded-xl flex items-center justify-center gap-1.5"
                              >
                                <Camera className="w-4 h-4 text-[#7b8a9e]" /> {incidentPhoto ? '✓ Đã chụp ảnh' : 'Chụp ảnh sự cố'}
                              </button>
                              
                              <button
                                type="button"
                                onClick={handleIncidentSubmit}
                                className="flex-1 py-2 bg-[#2c5ea0] text-white border border-[#5c2525] text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                              >
                                Gửi Phiếu Khẩn Cấp
                              </button>
                            </div>

                            {incidentPhoto && (
                              <div className="w-20 h-20 rounded-xl overflow-hidden border border-[#b8c6d9] relative mt-2">
                                <img src={incidentPhoto} alt="Broken fan" className="w-full h-full object-cover" />
                                <button onClick={() => setIncidentPhoto(null)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🎵 ROLE 4: Lớp phó Văn nghệ */}
                  {student.classRole === 'Lớp phó văn nghệ' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
                        <Flag className="w-6 h-6 text-[#2c5ea0]" />
                        <div>
                          <h3 className="font-serif font-bold text-[#1e2a3a] text-lg">Hoạt động Ngoại khóa - Lớp phó Văn nghệ</h3>
                          <p className="text-[#7b8a9e] text-xs">Tạo khảo sát nội bộ lớp và ghi nhận điểm danh tập dượt văn nghệ, thể thao.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Create survey */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Tạo phiếu khảo sát ý kiến lớp</h4>
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase mb-1">Tiêu đề khảo sát</label>
                              <input 
                                type="text" 
                                placeholder="Ví dụ: Ai đăng ký đá bóng ngày hội thao?"
                                value={surveyTitle}
                                onChange={e => setSurveyTitle(e.target.value)}
                                className="w-full bg-white border border-[#b8c6d9] rounded-xl px-3 py-2 text-xs font-bold text-[#1e2a3a]"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase mb-1">Các phương án (Cách nhau bằng dấu phẩy)</label>
                              <input 
                                type="text" 
                                placeholder="Có tham gia, Làm cổ động viên, Bận việc bồi dưỡng"
                                value={surveyOptionText}
                                onChange={e => setSurveyOptionText(e.target.value)}
                                className="w-full bg-white border border-[#b8c6d9] rounded-xl px-3 py-2 text-xs font-bold text-[#1e2a3a]"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleCreateSurvey}
                              className="w-full py-2 bg-[#1e2a3a] hover:bg-[#131a25] text-white border border-[#131a25] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-sm"
                            >
                              Phát Hành Khảo Sát Lớp
                            </button>
                          </div>
                        </div>

                        {/* Extracurricular attendance check */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Điểm danh tập văn nghệ / thể thao lớp</h4>
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 main-scrollbar text-xs">
                            {classmates.map(friend => (
                              <div key={friend.id} className="flex justify-between items-center bg-white p-2.5 border border-[#b8c6d9] rounded-xl font-sans text-xs">
                                <span className="font-bold text-[#1e2a3a]">{friend.name}</span>
                                <button
                                  onClick={() => setExtracurricularAttendance(prev => ({ ...prev, [friend.id]: !prev[friend.id] }))}
                                  className={`px-3 py-1 font-bold rounded-lg text-[10px] uppercase tracking-wider border transition-all ${
                                    extracurricularAttendance[friend.id]
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                      : 'bg-[#e8eef6] text-[#4a5568] border-[#b8c6d9] hover:bg-gray-50'
                                  }`}
                                >
                                  {extracurricularAttendance[friend.id] ? '✓ Có mặt' : 'Vắng mặt'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 🚩 ROLE 5: Bí thư Chi đoàn */}
                  {student.classRole === 'Bí thư' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 border-b border-[#0056B3] pb-4">
                        <Flag className="w-6 h-6 text-[#0056B3]" />
                        <div>
                          <h3 className="font-serif font-bold text-[#0056B3] text-lg">Công tác Đoàn Thanh niên - Bí thư Chi đoàn</h3>
                          <p className="text-[#7b8a9e] text-xs">Đoàn tịch, đoàn phí đoàn viên và xét chuẩn danh hiệu "Học sinh 3 tốt".</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Member list & Fees tracker */}
                        <div className="bg-[#f0f4f8] border border-[#bcd0e4] p-5 rounded-2xl space-y-4 shadow-sm">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#0056B3]">Danh sách Đoàn viên & Đoàn phí</h4>
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 main-scrollbar text-xs">
                            {classmates.map(friend => (
                              <div key={friend.id} className="flex justify-between items-center bg-white p-2.5 border border-[#bcd0e4] rounded-xl font-sans">
                                <div>
                                  <p className="font-bold text-[#1e2a3a]">{friend.name}</p>
                                  <button
                                    onClick={() => setUnionMembers(prev => ({ ...prev, [friend.id]: !prev[friend.id] }))}
                                    className={`text-[9px] font-bold mt-1 uppercase px-2 py-0.5 rounded ${
                                      unionMembers[friend.id]
                                        ? 'bg-[#0056B3] text-white'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}
                                  >
                                    {unionMembers[friend.id] ? 'Đoàn viên' : 'Học sinh phổ thông'}
                                  </button>
                                </div>
                                
                                {unionMembers[friend.id] && (
                                  <button
                                    onClick={() => {
                                      setUnionFees(prev => ({ 
                                        ...prev, 
                                        [friend.id]: prev[friend.id] === 'Đã đóng' ? 'Chưa đóng' : 'Đã đóng' 
                                      }));
                                    }}
                                    className={`px-3 py-1 font-bold rounded-lg text-[9px] uppercase tracking-wider ${
                                      unionFees[friend.id] === 'Đã đóng'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {unionFees[friend.id] || 'Đã đóng'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* "Học sinh 3 tốt" nomination form */}
                        <div className="bg-[#f0f4f8] border border-[#bcd0e4] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#0056B3]">Đề cử danh hiệu "Học sinh 3 tốt"</h4>
                          <div className="space-y-3 text-xs">
                            <div>
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase mb-1">Học sinh được đề cử</label>
                              <select
                                value={nomineeName}
                                onChange={e => setNomineeName(e.target.value)}
                                className="w-full bg-white border border-[#bcd0e4] rounded-xl px-3 py-2 text-xs font-bold text-[#1e2a3a] focus:outline-none"
                              >
                                <option value="">-- Chọn bé ngoan xuất sắc --</option>
                                {classmates.map(c => (
                                  <option key={c.id} value={c.name}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-[#7b8a9e] uppercase mb-1">Thành tích nổi bật (Học tập tốt, Đạo đức tốt, Thể lực tốt)</label>
                              <textarea
                                rows={2}
                                placeholder="Ghi nhận thành tích thi đua..."
                                value={nomineeReason}
                                onChange={e => setNomineeReason(e.target.value)}
                                className="w-full bg-white border border-[#bcd0e4] rounded-xl px-3 py-2 text-xs font-bold text-[#1e2a3a] resize-none focus:outline-none"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handleNomineeSubmit}
                              className="w-full py-2.5 bg-[#0056B3] hover:bg-[#004085] text-white border border-[#003366] text-xs uppercase tracking-wider font-bold rounded-xl transition-all shadow-sm"
                            >
                              Gửi Hồ Sơ Lên Đoàn Trường
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 👥 ROLE 6: Tổ trưởng */}
                  {student.classRole === 'Tổ trưởng' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
                        <Users className="w-6 h-6 text-[#2c5ea0]" />
                        <div>
                          <h3 className="font-serif font-bold text-[#1e2a3a] text-lg">Quản lý Tổ 1 - Tổ trưởng</h3>
                          <p className="text-[#7b8a9e] text-xs">Check-list nhanh nề nếp đầu giờ cho các thành viên trong tổ và so sánh thi đua.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Morning check-list ticks */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Check-list đầu giờ Tổ 1</h4>
                          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 main-scrollbar text-xs">
                            {classmates.slice(0, 5).map(friend => {
                              const check = morningChecklist[friend.id] || { late: false, noBadge: false, wrongShoes: false };
                              return (
                                <div key={friend.id} className="p-3 bg-white border border-[#b8c6d9] rounded-xl space-y-2 font-sans">
                                  <p className="font-bold text-[#1e2a3a]">{friend.name}</p>
                                  <div className="flex gap-4">
                                    <label className="flex items-center gap-1.5 text-[10px] text-[#4a5568] font-semibold cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={check.late}
                                        onChange={e => {
                                          const val = e.target.checked;
                                          setMorningChecklist(prev => ({
                                            ...prev,
                                            [friend.id]: { ...check, late: val }
                                          }));
                                        }}
                                        className="rounded border-[#b8c6d9] text-[#2c5ea0]"
                                      />
                                      Đi trễ
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[10px] text-[#4a5568] font-semibold cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={check.noBadge}
                                        onChange={e => {
                                          const val = e.target.checked;
                                          setMorningChecklist(prev => ({
                                            ...prev,
                                            [friend.id]: { ...check, noBadge: val }
                                          }));
                                        }}
                                        className="rounded border-[#b8c6d9] text-[#2c5ea0]"
                                      />
                                      Không thẻ
                                    </label>
                                    <label className="flex items-center gap-1.5 text-[10px] text-[#4a5568] font-semibold cursor-pointer">
                                      <input 
                                        type="checkbox"
                                        checked={check.wrongShoes}
                                        onChange={e => {
                                          const val = e.target.checked;
                                          setMorningChecklist(prev => ({
                                            ...prev,
                                            [friend.id]: { ...check, wrongShoes: val }
                                          }));
                                        }}
                                        className="rounded border-[#b8c6d9] text-[#2c5ea0]"
                                      />
                                      Giày sai quy chế
                                    </label>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <button
                            type="button"
                            onClick={handleSendMorningReport}
                            disabled={morningReportSubmitted}
                            className={`w-full py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm ${
                              morningReportSubmitted
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 cursor-not-allowed'
                                : 'bg-[#2c5ea0] text-white hover:bg-[#663030] border border-[#5c2525]'
                            }`}
                          >
                            {morningReportSubmitted ? '✓ Đã Gửi Báo Cáo Thi Đua' : 'Gửi Báo Cáo Cho Lớp Trưởng & GVCN'}
                          </button>
                        </div>

                        {/* Group points comparison */}
                        <div className="bg-[#f0f4fa] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                          <h4 className="font-bold text-xs uppercase tracking-widest text-[#2c5ea0]">Xếp hạng thi đua các Tổ tuần này</h4>
                          <div className="space-y-4 font-sans text-xs">
                            {[
                              { label: 'Tổ 1 (Tổ của em)', points: 95, color: '#2e6b8a' },
                              { label: 'Tổ 2', points: 88, color: '#7b8a9e' },
                              { label: 'Tổ 3', points: 92, color: '#2c5ea0' },
                              { label: 'Tổ 4', points: 85, color: '#a8c4e0' }
                            ].map((group, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between font-bold text-[#1e2a3a]">
                                  <span>{group.label}</span>
                                  <span className="font-mono">{group.points} điểm</span>
                                </div>
                                <div className="w-full bg-white border border-[#b8c6d9] h-3 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${group.points}%`, backgroundColor: group.color }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>

          {/* Right Column / Digital Student Card */}
          <div className="col-span-1 flex flex-col gap-6">
            
            {/* Digital Student Card (Mockup PVC) */}
            <div className="bg-gradient-to-br from-[#f5f8fc] to-[#d4dde9] border-[3px] border-double border-[#b8c6d9] rounded-3xl p-5 shadow-lg flex flex-col items-center relative overflow-hidden select-none group">
              {/* Holographic light effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#f5f8fc]/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>
              
              {/* School Header */}
              <div className="w-full text-center border-b border-[#b8c6d9] pb-3 mb-4 font-sans">
                <span className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider block">SỞ GD&ĐT TIỀN GIANG</span>
                <span className="text-xs font-serif font-black text-[#2c5ea0] uppercase tracking-wide block mt-0.5">TRƯỜNG MẦM NON AN HỮU</span>
                <span className="text-[8px] font-bold text-[#4a5568] uppercase tracking-widest block mt-0.5">THẺ HỌC SINH ĐIỆN TỬ</span>
              </div>

              {/* Photo & Basic details */}
              <div className="flex flex-col items-center space-y-3 font-sans w-full">
                <div className="w-24 h-32 border border-[#7b8a9e] bg-[#2e6b8a] p-0.5 overflow-hidden rounded-xl shadow-inner relative">
                  <img 
                    src={student.gender === 'Nữ' ? 'https://i.pravatar.cc/150?img=47' : 'https://i.pravatar.cc/150?img=12'} 
                    alt={student.name} 
                    className="w-full h-full object-cover grayscale brightness-90 sepia-[0.2]"
                  />
                  <div className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-[#10b981] border border-white"></div>
                </div>

                <div className="text-center w-full">
                  <h4 className="font-serif font-bold text-[#1e2a3a] text-base truncate">{student.name}</h4>
                  <p className="text-[10px] text-[#4a5568] font-bold tracking-widest uppercase mt-0.5">
                    LỚP: {student.grade} • NIÊN KHÓA: 2025 - 2028
                  </p>
                  <p className="text-[9px] text-[#7b8a9e] font-mono mt-0.5 font-bold">
                    MSSH: {student.id}
                  </p>
                </div>
              </div>

              {/* QR Code / Barcode Scanner */}
              <div className="w-full border-t border-[#b8c6d9] pt-4 mt-4 flex flex-col items-center gap-3">
                <div className="p-2.5 bg-white border border-[#b8c6d9] rounded-2xl shadow-sm">
                  <QRCodeSVG value={student.id} />
                </div>
                <div className="w-full">
                  <BarcodeSVG value={student.id} />
                  <p className="text-[8px] text-center font-mono font-bold text-[#7b8a9e] tracking-widest mt-1">
                    * Đưa mã này trước cổng bảo vệ hoặc quầy thư viện để quét tự động *
                  </p>
                </div>
              </div>
            </div>

            {/* Quick action / leave checklist info */}
            <div className="bg-white border border-[#b8c6d9] rounded-3xl p-5 shadow-sm font-sans text-xs space-y-3">
              <h5 className="font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5">Trạng thái nghỉ phép của em</h5>
              <div className="space-y-2">
                {leaveRequests.length > 0 ? (
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-[#7b8a9e]">Đơn phép gần nhất:</span>
                    <span className={`px-2 py-0.5 rounded uppercase tracking-wider ${
                      leaveRequests[0].status === 'Đã duyệt' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>{leaveRequests[0].status}</span>
                  </div>
                ) : (
                  <p className="text-[#7b8a9e] italic">Chưa có đơn xin phép nào.</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};
