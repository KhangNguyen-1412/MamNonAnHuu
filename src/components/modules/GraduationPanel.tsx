import React, { useState, useEffect } from 'react';
import { 
  Search, Eye, Check, Filter, ShieldAlert, GraduationCap, ClipboardList, 
  CheckCircle2, AlertTriangle, XCircle, Clock, FileText, Award, BookOpen, 
  Printer, Download, Save, RefreshCw, Upload, User, RotateCcw, Trash2
} from 'lucide-react';
import { ModalBase } from '../ui/Modals';
import { getStudents, Student } from '../../services/studentService';
import { Pagination } from '../ui/Pagination';
import { getStaffList } from '../../services/hrService';
import { getAllReportCards, ReportCardDocument } from '../../services/reportCardService';
import { getGraduationStudents, saveGraduationStudentsBulk, deleteGraduationStudent, GraduationStudent } from '../../services/graduationService';


const ELECTIVE_SUBJECTS = [
  'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lý', 
  'GD Kinh tế & Pháp luật', 'Tin học', 'Công nghệ', 'Ngoại ngữ'
];

const LANGUAGE_TYPES = [
  'Tiếng Anh', 'Tiếng Pháp', 'Tiếng Trung', 'Tiếng Đức', 'Tiếng Nhật', 'Tiếng Hàn'
];

interface GraduationPanelProps {
  isEmbedded?: boolean;
  isLocked?: boolean;
}

export const GraduationPanel: React.FC<GraduationPanelProps> = ({
  isEmbedded = false,
  isLocked = false
}) => {
  const [students, setStudents] = useState<GraduationStudent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'eligibility' | 'registration' | 'priorities' | 'scores' | 'diploma'>('eligibility');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState<GraduationStudent | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [principalName, setPrincipalName] = useState('Nguyễn Văn Thành');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, classFilter, statusFilter]);

  useEffect(() => {
    const loadPrincipal = async () => {
      try {
        const staff = await getStaffList();
        const principal = staff.find(s => s.role && (s.role === 'Hiệu trưởng' || (s.role.includes('Hiệu trưởng') && !s.role.toLowerCase().includes('phó'))));
        if (principal) {
          setPrincipalName(principal.name);
        }
      } catch (error) {
        console.error("Failed to load principal from database", error);
      }
    };
    loadPrincipal();
  }, []);

  const loadRealData = async () => {
    try {
      setLoading(true);
      const dbStudents = await getStudents();
      const grade12Students = dbStudents.filter(s => s.grade && (s.grade.toLowerCase().includes('lá') || s.grade.startsWith('3') || s.grade.includes('K3')));
      
      // Load saved settings from Firestore
      const savedList = await getGraduationStudents();
      const savedMap = new Map(savedList.map(item => [item.id, item]));

      // Fetch all report cards from Firestore to retrieve real GPAs
      const allCards = await getAllReportCards();
      const reportCardsCache = new Map<string, ReportCardDocument>();
      allCards.forEach(card => reportCardsCache.set(card.id, card));

      if (grade12Students.length > 0) {
        const mappedList: GraduationStudent[] = grade12Students.map(s => {
          const saved = savedMap.get(s.id);
          
          // Get real GPA and moral conduct from report card
          const cacheKey = `${s.id}_Cả Năm`;
          const cachedRc = reportCardsCache.get(cacheKey) || reportCardsCache.get(`${s.id}_Học Kỳ II`);
          const gpa = cachedRc ? cachedRc.summary.gpa : 0.0;
          const academic = cachedRc 
            ? (gpa >= 8.0 ? 'Giỏi' : gpa >= 6.5 ? 'Khá' : gpa >= 5.0 ? 'Trung bình' : gpa >= 3.5 ? 'Yếu' : 'Kém')
            : 'Trung bình';
          const moral = cachedRc ? cachedRc.summary.moralConduct : 'Tốt';

          if (saved) {
            return {
              ...saved,
              name: s.name,
              dob: s.dob || saved.dob || '15/08/2018',
              classId: s.grade,
              gpa12: gpa > 0.0 ? gpa : saved.gpa12,
              academicClass12: gpa > 0.0 ? academic as any : saved.academicClass12,
              conductClass12: cachedRc ? moral as any : saved.conductClass12
            };
          }
          
          // Default graduation parameters for student (if no saved data exists)
          const charCodeSum = s.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);

          return {
            id: s.id,
            name: s.name,
            dob: s.dob || '15/08/2018',
            classId: s.grade,
            gpa12: gpa,
            academicClass12: academic as any,
            conductClass12: moral as any,
            absentDays: cachedRc ? cachedRc.summary.daysAbsent : (charCodeSum % 8),
            hasBirthCert: true,
            hasPhoto3x4: true,
            hasTranscript: true,
            registeredElectives: ['Vật lý', 'Hóa học'],
            foreignLanguageType: 'Tiếng Anh',
            exemptLanguage: false,
            policyType: 'Diện 1',
            incentiveVocational: 'Không',
            incentiveAward: 'Không',
            isSpecialExemption: false,
            scores: { 'Toán': 0, 'Ngữ văn': 0, 'Vật lý': 0, 'Hóa học': 0 },
            diplomaStatus: 'Chưa nhận'
          };
        });
        setStudents(mappedList);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Failed to load real students for graduation panel", error);
      const savedList = await getGraduationStudents();
      setStudents(savedList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRealData();
  }, []);

  // Save changes to Firestore on local state updates (debounced to avoid excessive writes)
  useEffect(() => {
    if (loading || students.length === 0) return;

    const delayDebounce = setTimeout(async () => {
      try {
        await saveGraduationStudentsBulk(students);
      } catch (err) {
        console.error('Failed to auto-save graduation students to Firestore:', err);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [students, loading]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleResetGraduationData = () => {
    setIsResetModalOpen(true);
  };

  const confirmResetGraduationData = async () => {
    try {
      setLoading(true);
      const savedList = await getGraduationStudents();
      const deletePromises = savedList.map(s => deleteGraduationStudent(s.id));
      await Promise.all(deletePromises);
      await loadRealData();
      showToast("🔄 Đã đặt lại toàn bộ dữ liệu tốt nghiệp khối 5 về mặc định!");
      setIsResetModalOpen(false);
    } catch (error) {
      console.error("Failed to reset graduation data", error);
      showToast("❌ Không thể đặt lại dữ liệu tốt nghiệp!");
    } finally {
      setLoading(false);
    }
  };

  // Helper calculation functions
  const checkEligibility = (s: GraduationStudent) => {
    if (s.academicClass12 === 'Kém' || s.conductClass12 === 'Yếu' || s.absentDays > 45) {
      return { status: 'Không đủ điều kiện', reason: 'Học lực Kém, Hạnh kiểm Yếu hoặc vắng > 45 ngày' };
    }
    if (!s.hasBirthCert || !s.hasPhoto3x4 || !s.hasTranscript) {
      const missing = [];
      if (!s.hasBirthCert) missing.push('Khai sinh');
      if (!s.hasPhoto3x4) missing.push('Ảnh thẻ');
      if (!s.hasTranscript) missing.push('Học bạ');
      return { status: 'Thiếu hồ sơ', reason: `Thiếu: ${missing.join(', ')}` };
    }
    return { status: 'Đủ điều kiện', reason: '' };
  };

  const getPriorityScore = (policy: GraduationStudent['policyType']) => {
    if (policy === 'Diện 2') return 0.25;
    if (policy === 'Diện 3') return 0.5;
    return 0;
  };

  const getIncentiveScore = (vocational: GraduationStudent['incentiveVocational'], award: GraduationStudent['incentiveAward']) => {
    let score = 0;
    if (vocational === 'Giỏi') score += 2.0;
    else if (vocational === 'Khá') score += 1.5;
    else if (vocational === 'Trung bình') score += 1.0;

    if (award === 'Nhất') score += 2.0;
    else if (award === 'Nhì') score += 1.5;
    else if (award === 'Ba') score += 1.0;
    else if (award === 'Khuyến khích') score += 0.5;

    return score;
  };

  // Run outcome calculation
  const calculateResult = (s: GraduationStudent) => {
    const eligibility = checkEligibility(s).status;
    if (eligibility === 'Không đủ điều kiện') {
      return { gradScore: 0, outcome: 'Trượt' as const };
    }

    if (s.isSpecialExemption && s.specialExemptionStatus === 'Sở đã duyệt') {
      return { gradScore: 0, outcome: 'Đặc cách' as const };
    }

    // Determine exam scores
    const examValues = Object.entries(s.scores).map(([subj, val]) => {
      // If language exempt and subject is Ngoại ngữ, default to 10
      if (s.exemptLanguage && subj === 'Ngoại ngữ') {
        return 10.0;
      }
      return val || 0;
    });

    const totalExamScore = examValues.reduce((sum, v) => sum + v, 0);
    const avgExamScore = totalExamScore / 4;
    
    // Check for "Điểm liệt" (any score <= 1.0)
    const hasScoreLiệt = examValues.some(v => v <= 1.0);

    // Score formula
    const priority = getPriorityScore(s.policyType);
    const incentive = getIncentiveScore(s.incentiveVocational, s.incentiveAward);
    
    // ĐXTN = ((Tổng thi / 4) * 7 + GPA12 * 3) / 10 + Điểm ưu tiên + (Điểm khuyến khích / 4)
    const scoreVal = parseFloat((((avgExamScore * 7) + (s.gpa12 * 3)) / 10 + priority + (incentive / 4)).toFixed(2));

    let outcome: 'Đỗ Tốt nghiệp' | 'Trượt' | 'Đặc cách' = 'Trượt';
    if (!hasScoreLiệt && scoreVal >= 5.0) {
      outcome = 'Đỗ Tốt nghiệp';
    }

    return { gradScore: scoreVal, outcome };
  };

  // Update a single student record
  const updateStudentData = (id: string, updates: Partial<GraduationStudent>) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      const merged = { ...s, ...updates };
      
      // Auto-recalculate graduation score if scores, GPAs, or priorities changed
      const calculation = calculateResult(merged);
      return {
        ...merged,
        gradScore: calculation.gradScore,
        outcome: calculation.outcome
      };
    }));
  };

  // Mock scoring simulation
  const handleImportMockScores = () => {
    setStudents(prev => prev.map(s => {
      const eligibility = checkEligibility(s).status;
      if (eligibility === 'Không đủ điều kiện') {
        return {
          ...s,
          scores: { 'Toán': 0, 'Ngữ văn': 0, [s.registeredElectives[0]]: 0, [s.registeredElectives[1]]: 0 },
          gradScore: 0,
          outcome: 'Trượt'
        };
      }

      if (s.isSpecialExemption && s.specialExemptionStatus === 'Sở đã duyệt') {
        return {
          ...s,
          scores: { 'Toán': 0, 'Ngữ văn': 0, [s.registeredElectives[0]]: 0, [s.registeredElectives[1]]: 0 },
          gradScore: 0,
          outcome: 'Đặc cách'
        };
      }

      // Generate realistic randomized scores
      const randToán = parseFloat((5.5 + Math.random() * 4).toFixed(1));
      const randVăn = parseFloat((6.0 + Math.random() * 3.5).toFixed(1));
      const randSubj1 = parseFloat((5.0 + Math.random() * 4.5).toFixed(1));
      const randSubj2 = s.exemptLanguage && s.registeredElectives[1] === 'Ngoại ngữ'
        ? 10.0
        : parseFloat((4.5 + Math.random() * 5).toFixed(1));

      const scores: Record<string, number> = {
        'Toán': randToán,
        'Ngữ văn': randVăn,
        [s.registeredElectives[0]]: randSubj1,
        [s.registeredElectives[1]]: randSubj2
      };

      const merged = { ...s, scores };
      const calculation = calculateResult(merged);
      
      // Seed prefilled diploma numbers if they passed
      let diplomaUpdates = {};
      if (calculation.outcome === 'Đỗ Tốt nghiệp' || calculation.outcome === 'Đặc cách') {
        diplomaUpdates = {
          diplomaNo: s.diplomaNo || `BGD/${100000 + Math.floor(Math.random() * 900000)}`,
          registryNo: s.registryNo || `Sổ: 2026-thAH-${s.id.split('.').slice(-1)[0]}`,
          decisionDate: s.decisionDate || '2026-07-10'
        };
      }

      return {
        ...merged,
        ...diplomaUpdates,
        gradScore: calculation.gradScore,
        outcome: calculation.outcome
      };
    }));
    showToast("⚡ Đã nhập điểm thi giả lập và tính toán kết quả tốt nghiệp cho tất cả học sinh!");
  };

  // Filter list
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    const matchesClass = classFilter === 'All' ? true : s.classId === classFilter;
    
    let matchesStatus = true;
    if (statusFilter !== 'All') {
      if (activeTab === 'eligibility') {
        matchesStatus = checkEligibility(s).status === statusFilter;
      } else if (activeTab === 'scores') {
        matchesStatus = (s.outcome || 'Trượt') === statusFilter;
      } else if (activeTab === 'diploma') {
        matchesStatus = s.diplomaStatus === statusFilter;
      }
    }
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Paginated student lists
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  
  const graduatedStudents = filteredStudents.filter(s => s.outcome === 'Đỗ Tốt nghiệp' || s.outcome === 'Đặc cách');
  const paginatedGraduatedStudents = graduatedStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Tab stats
  const totalEligible = students.filter(s => checkEligibility(s).status === 'Đủ điều kiện').length;
  const totalIneligible = students.filter(s => checkEligibility(s).status === 'Không đủ điều kiện').length;
  const totalMissingDocs = students.filter(s => checkEligibility(s).status === 'Thiếu hồ sơ').length;

  const totalRegisteredElective = (subject: string) => {
    return students.filter(s => s.registeredElectives.includes(subject)).length;
  };

  const tabs = [
    { id: 'eligibility', label: '1. Rà Soát Điều Kiện', icon: ClipboardList },
    { id: 'registration', label: '2. Đăng Ký Môn Thi', icon: BookOpen },
    { id: 'priorities', label: '3. Ưu Tiên & Đặc Cách', icon: Award },
    { id: 'scores', label: '4. Điểm Thi & Xét Duyệt', icon: GraduationCap },
    { id: 'diploma', label: '5. Sổ Cấp Phát Bằng', icon: FileText }
  ] as const;

  return (
    <main className={`flex-1 overflow-y-auto relative ${isEmbedded ? 'p-0' : 'p-4 md:p-8'}`}>
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-[#f5f8fc] border border-[#b8c6d9] px-6 py-3 rounded-2xl shadow-lg flex items-center font-bold text-xs uppercase tracking-wider animate-in fade-in duration-300">
          <Check className="w-4 h-4 mr-2 text-green-400" /> {toast}
        </div>
      )}

      {!isEmbedded && <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>}

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        
        {/* Page Header */}
        {!isEmbedded ? (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
            <div>
              <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Quản Lý Tốt Nghiệp Khối 5</h2>
              <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">Hồ sơ hoàn thành chương trình Mầm non theo chương trình GDPT 2018</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
              {activeTab === 'scores' && (
                <button
                  onClick={handleImportMockScores}
                  disabled={isLocked}
                  className={`flex items-center gap-1.5 px-5 py-2.5 text-xs uppercase tracking-widest font-bold transition shadow-[2px_2px_0px_#131a25] active:shadow-none active:translate-y-1 rounded-full cursor-pointer border ${
                    isLocked
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none active:translate-y-0'
                      : 'bg-[#2c5ea0] text-[#f5f8fc] border-[#5a2c2c] hover:bg-[#5a2c2c]'
                  }`}
                >
                  <RefreshCw className="w-4 h-4" /> Import Điểm Thi Giả Lập
                </button>
              )}
              <button
                onClick={handleResetGraduationData}
                disabled={isLocked}
                className={`flex items-center gap-1.5 px-5 py-2.5 text-xs uppercase tracking-widest font-bold transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full cursor-pointer border ${
                  isLocked
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none active:translate-y-0'
                    : 'bg-white text-[#2c5ea0] border-[#b8c6d9] hover:bg-[#e8eef6]'
                }`}
              >
                <RotateCcw className="w-4 h-4" /> Đặt Lại Dữ Liệu
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 mb-4 shrink-0">
            {activeTab === 'scores' && (
              <button
                onClick={handleImportMockScores}
                disabled={isLocked}
                className={`flex items-center gap-1.5 px-4 py-2 border text-xs uppercase tracking-wider font-bold transition rounded-full cursor-pointer ${
                  isLocked
                    ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                    : 'bg-[#2c5ea0] text-[#f5f8fc] border-[#5a2c2c] hover:bg-[#5a2c2c] shadow-sm'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Import Điểm Thi Giả Lập
              </button>
            )}
            <button
              onClick={handleResetGraduationData}
              disabled={isLocked}
              className={`flex items-center gap-1.5 px-4 py-2 border text-xs uppercase tracking-wider font-bold transition rounded-full cursor-pointer ${
                isLocked
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-[#2c5ea0] border-[#b8c6d9] hover:bg-[#e8eef6]'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" /> Đặt Lại Dữ Liệu
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 items-start min-h-0">
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <div className="w-full lg:w-72 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] p-4 shadow-[4px_4px_0px_#dce4ee] shrink-0 rounded-2xl">
            <h4 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-3 px-2 border-b border-[#dce4ee] pb-1">Phân hệ quy trình</h4>
            <div className="space-y-1.5">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setStatusFilter('All');
                    }}
                    className={`w-full flex items-center px-4 py-3 text-xs font-bold transition-all rounded-full cursor-pointer ${
                      activeTab === tab.id 
                        ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' 
                        : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'
                    }`}
                  >
                    <TabIcon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
            
            {/* Short quick info block */}
            <div className="mt-8 bg-[#e8eef6] p-4 border border-[#b8c6d9] rounded-xl text-[11px] text-[#4a5568] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#2c5ea0]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Quy chuẩn 2025:</span>
              </div>
              <p className="leading-relaxed">Xét hoàn thành chương trình mầm non dựa trên kết quả đánh giá cuối năm học của Khối 5 và hồ sơ minh chứng học sinh.</p>
            </div>
          </div>

          {/* RIGHT MAIN CONTAINER */}
          <div className="flex-1 w-full bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col rounded-3xl overflow-hidden min-h-0 min-h-[550px]">
            
            {/* Toolbar Filter */}
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
               <h3 className="font-bold text-[#2c5ea0] uppercase tracking-widest text-xs flex items-center">
                 <GraduationCap className="w-4 h-4 mr-2" />
                 {activeTab === 'eligibility' && 'BẢNG XÉT DUYỆT ĐIỀU KIỆN DỰ THI'}
                 {activeTab === 'registration' && 'SỔ ĐĂNG KÝ MÔN THI TỐT NGHIỆP'}
                 {activeTab === 'priorities' && 'DIỆN ƯU TIÊN & ĐẶC CÁCH TỐT NGHIỆP'}
                 {activeTab === 'scores' && 'CẬP NHẬT ĐIỂM THI & XÉT DUYỆT TỐT NGHIỆP'}
                 {activeTab === 'diploma' && 'SỔ GỐC CẤP PHÁT BẰNG TỐT NGHIỆP'}
               </h3>
               
               <div className="flex flex-wrap items-center gap-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Tìm tên học sinh, mã số..."
                      className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                    />
                  </div>
                  
                  {/* Class selection dropdown */}
                  <select
                    value={classFilter}
                    onChange={e => setClassFilter(e.target.value)}
                    className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full cursor-pointer"
                  >
                    <option value="All">Tất cả lớp</option>
                    {Array.from(new Set(students.map(s => s.classId).filter((g): g is string => !!g))).sort().map(cls => (
                      <option key={cls} value={cls}>Lớp {cls}</option>
                    ))}
                  </select>

                  {/* Dynamic Status filter depending on tab */}
                  {activeTab === 'eligibility' && (
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full cursor-pointer"
                    >
                      <option value="All">Tất cả điều kiện</option>
                      <option value="Đủ điều kiện">Đủ điều kiện</option>
                      <option value="Không đủ điều kiện">Không đủ điều kiện</option>
                      <option value="Thiếu hồ sơ">Thiếu hồ sơ</option>
                    </select>
                  )}

                  {activeTab === 'scores' && (
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full cursor-pointer"
                    >
                      <option value="All">Tất cả kết quả</option>
                      <option value="Đỗ Tốt nghiệp">Đỗ Tốt nghiệp</option>
                      <option value="Trượt">Trượt</option>
                      <option value="Đặc cách">Đặc cách</option>
                    </select>
                  )}

                  {activeTab === 'diploma' && (
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full cursor-pointer"
                    >
                      <option value="All">Tất cả nhận bằng</option>
                      <option value="Chưa nhận">Chưa nhận</option>
                      <option value="Đã nhận">Đã nhận</option>
                      <option value="Ủy quyền nhận">Ủy quyền nhận</option>
                    </select>
                  )}
               </div>
            </div>

            {/* TAB CONTENT COMPONENT RENDER */}
            <div className="flex-1 overflow-auto w-full p-6">
              {loading ? (
                <div className="h-full w-full flex flex-col items-center justify-center py-20 bg-[#f5f8fc]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5ea0]"></div>
                  <p className="mt-3 text-xs font-bold text-[#7b8a9e] uppercase tracking-widest animate-pulse">Đang tải dữ liệu học sinh Khối 5...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="h-full w-full flex flex-col items-center justify-center py-16 bg-[#f5f8fc] text-center max-w-md mx-auto">
                  <div className="p-4 bg-[#e8eef6] rounded-full text-[#2c5ea0] mb-4 border border-[#b8c6d9] shadow-sm">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-[#1e2a3a] mb-2">Không Có Học Sinh Khối 5</h4>
                  <p className="text-xs text-[#4a5568] leading-relaxed">
                    Không tìm thấy học sinh Khối 5 nào theo bộ lọc hoặc cơ sở dữ liệu hiện tại. Vui lòng thêm học sinh Khối 5 hoặc thực hiện kết chuyển năm học từ khối dưới lên.
                  </p>
                </div>
              ) : (
                <>
                  {/* TAB 1: ELIGIBILITY CHECK */}
                  {activeTab === 'eligibility' && (
                    <div className="space-y-6">
                      {/* Stats Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                          <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Tổng số học sinh Khối 5</p>
                          <p className="text-2xl font-serif font-bold text-[#1e2a3a] mt-1">{students.length}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Đủ điều kiện thi</p>
                          <p className="text-2xl font-serif font-bold text-green-700 mt-1">{totalEligible}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Thiếu minh chứng hồ sơ</p>
                          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">{totalMissingDocs}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Không đủ điều kiện (Cấm thi)</p>
                          <p className="text-2xl font-serif font-bold text-rose-700 mt-1">{totalIneligible}</p>
                        </div>
                      </div>

                  {/* Student Table */}
                  <div className="bg-white border border-[#b8c6d9] rounded-xl overflow-x-auto shadow-inner">
                    <table className="w-full min-w-[950px] text-xs text-left">
                      <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold uppercase tracking-wider text-[#4a5568] text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Mã HS</th>
                          <th className="px-4 py-3">Học sinh</th>
                          <th className="px-4 py-3">Lớp</th>
                          <th className="px-4 py-3">Kết quả học tập (Khối 5)</th>
                          <th className="px-4 py-3 text-center">Nghỉ học</th>
                          <th className="px-4 py-3 text-center">Hồ sơ minh chứng</th>
                          <th className="px-4 py-3 text-center">Trạng thái duyệt thi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce4ee]">
                        {paginatedStudents.map(s => {
                          const eligibility = checkEligibility(s);
                          return (
                            <tr key={s.id} className="hover:bg-[#f5f8fc]/50">
                              <td className="px-4 py-4 font-mono text-[10px] text-[#7b8a9e]">{s.id}</td>
                              <td className="px-4 py-4 font-bold text-[#1e2a3a]">{s.name}</td>
                              <td className="px-4 py-4 font-semibold text-[#4a5568]">{s.classId}</td>
                              <td className="px-4 py-4">
                                <div className="space-y-0.5">
                                  <p>Học lực: <span className={`font-bold ${s.academicClass12 === 'Kém' ? 'text-red-600' : 'text-[#1e2a3a]'}`}>{s.academicClass12}</span> (GPA: <strong>{s.gpa12}</strong>)</p>
                                  <p>Rèn luyện: <span className={`font-bold ${s.conductClass12 === 'Yếu' ? 'text-red-600' : 'text-[#1e2a3a]'}`}>{s.conductClass12}</span></p>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded font-bold ${s.absentDays > 45 ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                  {s.absentDays} ngày
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex justify-center gap-4">
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={s.hasBirthCert}
                                      onChange={e => updateStudentData(s.id, { hasBirthCert: e.target.checked })}
                                      className="rounded text-[#2c5ea0] focus:ring-[#2c5ea0]"
                                    />
                                    <span className="text-[10px] text-[#7b8a9e]">Khai sinh</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={s.hasPhoto3x4}
                                      onChange={e => updateStudentData(s.id, { hasPhoto3x4: e.target.checked })}
                                      className="rounded text-[#2c5ea0] focus:ring-[#2c5ea0]"
                                    />
                                    <span className="text-[10px] text-[#7b8a9e]">Ảnh 3x4</span>
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      checked={s.hasTranscript}
                                      onChange={e => updateStudentData(s.id, { hasTranscript: e.target.checked })}
                                      className="rounded text-[#2c5ea0] focus:ring-[#2c5ea0]"
                                    />
                                    <span className="text-[10px] text-[#7b8a9e]">Học bạ</span>
                                  </label>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                {eligibility.status === 'Đủ điều kiện' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Đủ điều kiện
                                  </span>
                                )}
                                {eligibility.status === 'Thiếu hồ sơ' && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                      <AlertTriangle className="w-3 h-3 mr-1" /> Thiếu hồ sơ
                                    </span>
                                    <p className="text-[9px] text-amber-700 font-medium">{eligibility.reason}</p>
                                  </div>
                                )}
                                {eligibility.status === 'Không đủ điều kiện' && (
                                  <div className="space-y-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                      <XCircle className="w-3 h-3 mr-1" /> Cấm thi
                                    </span>
                                    <p className="text-[9px] text-rose-600 font-bold">{eligibility.reason}</p>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: EXAM REGISTRATION */}
              {activeTab === 'registration' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Table Panel */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-[#b8c6d9] rounded-xl overflow-x-auto shadow-inner">
                      <table className="w-full min-w-[850px] text-xs text-left">
                        <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold uppercase tracking-wider text-[#4a5568] text-[10px]">
                          <tr>
                            <th className="px-4 py-3">Học sinh</th>
                            <th className="px-4 py-3">Bắt buộc</th>
                            <th className="px-4 py-3">Môn Lựa chọn 1</th>
                            <th className="px-4 py-3">Môn Lựa chọn 2</th>
                            <th className="px-4 py-3">Miễn thi Ngoại ngữ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dce4ee]">
                          {paginatedStudents.map(s => {
                            const eligibility = checkEligibility(s).status;
                            const isEligible = eligibility !== 'Không đủ điều kiện';
                            return (
                              <tr key={s.id} className="hover:bg-[#f5f8fc]/50">
                                <td className="px-4 py-4 font-bold text-[#1e2a3a] whitespace-nowrap">
                                  <p>{s.name}</p>
                                  <span className="text-[10px] font-normal text-[#7b8a9e]">{s.classId}</span>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <span className="inline-block px-2 py-1 bg-gray-100 text-[#4a5568] rounded font-bold text-[10px]">Toán, Văn</span>
                                </td>
                                
                                {/* Choice 1 */}
                                <td className="px-4 py-4">
                                  <select
                                    disabled={!isEligible}
                                    value={s.registeredElectives[0]}
                                    onChange={e => {
                                      const next = [...s.registeredElectives];
                                      next[0] = e.target.value;
                                      updateStudentData(s.id, { registeredElectives: next });
                                    }}
                                    className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none disabled:bg-gray-100 disabled:opacity-50 cursor-pointer"
                                  >
                                    {ELECTIVE_SUBJECTS.map(subj => (
                                      <option key={subj} value={subj} disabled={subj === s.registeredElectives[1]}>{subj}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Choice 2 */}
                                <td className="px-4 py-4">
                                  <div className="space-y-1.5">
                                    <select
                                      disabled={!isEligible}
                                      value={s.registeredElectives[1]}
                                      onChange={e => {
                                        const next = [...s.registeredElectives];
                                        next[1] = e.target.value;
                                        const updates: Partial<GraduationStudent> = { registeredElectives: next };
                                        if (e.target.value !== 'Ngoại ngữ') {
                                          updates.exemptLanguage = false;
                                        }
                                        updateStudentData(s.id, updates);
                                      }}
                                      className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none disabled:bg-gray-100 disabled:opacity-50 cursor-pointer"
                                    >
                                      {ELECTIVE_SUBJECTS.map(subj => (
                                        <option key={subj} value={subj} disabled={subj === s.registeredElectives[0]}>{subj}</option>
                                      ))}
                                    </select>
                                    
                                    {/* Foreign Language Details dropdown if chosen */}
                                    {s.registeredElectives.includes('Ngoại ngữ') && (
                                      <select
                                        disabled={!isEligible}
                                        value={s.foreignLanguageType}
                                        onChange={e => updateStudentData(s.id, { foreignLanguageType: e.target.value })}
                                        className="block px-2 py-0.5 bg-[#f5f8fc] border border-[#b8c6d9] text-[10px] rounded focus:outline-none cursor-pointer font-bold"
                                      >
                                        <option value="Tiếng Anh">Tiếng Anh</option>
                                        <option value="Tiếng Pháp">Tiếng Pháp</option>
                                        <option value="Tiếng Trung">Tiếng Trung</option>
                                      </select>
                                    )}
                                  </div>
                                </td>

                                {/* Foreign language exemption certificates */}
                                <td className="px-4 py-4">
                                  {s.registeredElectives.includes('Ngoại ngữ') ? (
                                    <div className="space-y-1.5">
                                      <label className="flex items-center gap-1 cursor-pointer">
                                        <input 
                                          type="checkbox"
                                          disabled={!isEligible}
                                          checked={s.exemptLanguage}
                                          onChange={e => updateStudentData(s.id, { 
                                            exemptLanguage: e.target.checked,
                                            exemptLanguageCertificate: e.target.checked ? 'IELTS 4.0' : ''
                                          })}
                                          className="rounded text-[#2c5ea0] focus:ring-[#2c5ea0]"
                                        />
                                        <span className="text-[10px] font-bold text-[#2c5ea0]">Miễn thi (Đổi điểm 10)</span>
                                      </label>
                                      {s.exemptLanguage && (
                                        <div className="flex items-center gap-1">
                                          <input 
                                            type="text"
                                            value={s.exemptLanguageCertificate || ''}
                                            onChange={e => updateStudentData(s.id, { exemptLanguageCertificate: e.target.value })}
                                            placeholder="IELTS 6.5"
                                            className="px-1.5 py-0.5 bg-white border border-[#b8c6d9] text-[9px] w-20 rounded"
                                          />
                                          <button 
                                            onClick={() => showToast(`📁 Đã cập nhật minh chứng cho học sinh ${s.name}`)}
                                            className="p-1 bg-[#e8eef6] border border-[#b8c6d9] rounded text-[#2c5ea0] hover:bg-[#dce4ee]"
                                            title="Upload certificate file"
                                          >
                                            <Upload className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-[#7b8a9e] italic text-[10px]">Không thi Ngoại ngữ</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Statistics Box */}
                  <div className="space-y-6">
                    <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] p-6 shadow-[2px_2px_0px_rgba(0,0,0,0.02)] rounded-2xl">
                      <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4">THỐNG KÊ MÔN LỰA CHỌN</h5>
                      <div className="space-y-4">
                        {ELECTIVE_SUBJECTS.map(subj => {
                          const count = totalRegisteredElective(subj);
                          const percentage = Math.round((count / students.length) * 100);
                          return (
                            <div key={subj} className="space-y-1">
                              <div className="flex justify-between text-xs font-semibold text-[#4a5568]">
                                <span>{subj}</span>
                                <span><strong>{count}</strong> đăng ký ({percentage}%)</span>
                              </div>
                              <div className="w-full bg-[#e8eef6] h-2 rounded-full overflow-hidden border border-[#dce4ee]">
                                <div 
                                  className="bg-[#2c5ea0] h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRIORITIES & INCENTIVES */}
              {activeTab === 'priorities' && (
                <div className="bg-white border border-[#b8c6d9] rounded-xl overflow-x-auto shadow-inner">
                  <table className="w-full min-w-[950px] text-xs text-left">
                    <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold uppercase tracking-wider text-[#4a5568] text-[10px]">
                      <tr>
                        <th className="px-4 py-3">Học sinh</th>
                        <th className="px-4 py-3">Diện chính sách (Điểm Ưu Tiên)</th>
                        <th className="px-4 py-3">Nghề phổ thông (Điểm Khuyến Khích)</th>
                        <th className="px-4 py-3">Giải HSG Tỉnh/QG (Khuyến Khích)</th>
                        <th className="px-4 py-3">Hồ sơ Đặc cách Tốt nghiệp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce4ee]">
                      {paginatedStudents.map(s => {
                        const eligibility = checkEligibility(s).status;
                        const isEligible = eligibility !== 'Không đủ điều kiện';
                        return (
                          <tr key={s.id} className="hover:bg-[#f5f8fc]/50">
                            <td className="px-4 py-4 font-bold text-[#1e2a3a] whitespace-nowrap">
                              <p>{s.name}</p>
                              <span className="text-[10px] font-normal text-[#7b8a9e]">{s.classId}</span>
                            </td>

                            {/* Priority select box */}
                            <td className="px-4 py-4">
                              <select
                                disabled={!isEligible}
                                value={s.policyType}
                                onChange={e => updateStudentData(s.id, { policyType: e.target.value as any })}
                                className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                              >
                                <option value="Diện 1">Diện 1 (+0 đ)</option>
                                <option value="Diện 2">Diện 2 (+0.25 đ)</option>
                                <option value="Diện 3">Diện 3 (+0.5 đ)</option>
                              </select>
                            </td>

                            {/* Vocational points select box */}
                            <td className="px-4 py-4">
                              <select
                                disabled={!isEligible}
                                value={s.incentiveVocational}
                                onChange={e => updateStudentData(s.id, { incentiveVocational: e.target.value as any })}
                                className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                              >
                                <option value="Không">Không (+0 đ)</option>
                                <option value="Trung bình">Trung bình (+1.0 đ)</option>
                                <option value="Khá">Khá (+1.5 đ)</option>
                                <option value="Giỏi">Giỏi (+2.0 đ)</option>
                              </select>
                            </td>

                            {/* HSG awards points select box */}
                            <td className="px-4 py-4">
                              <select
                                disabled={!isEligible}
                                value={s.incentiveAward}
                                onChange={e => updateStudentData(s.id, { incentiveAward: e.target.value as any })}
                                className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                              >
                                <option value="Không">Không (+0 đ)</option>
                                <option value="Khuyến khích">Khuyến khích (+0.5 đ)</option>
                                <option value="Ba">Giải Ba (+1.0 đ)</option>
                                <option value="Nhì">Giải Nhì (+1.5 đ)</option>
                                <option value="Nhất">Giải Nhất (+2.0 đ)</option>
                              </select>
                            </td>

                            {/* Special Exemptions (Đặc cách) */}
                            <td className="px-4 py-4">
                              <div className="space-y-1.5">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={s.isSpecialExemption}
                                    onChange={e => updateStudentData(s.id, { 
                                      isSpecialExemption: e.target.checked,
                                      specialExemptionStatus: e.target.checked ? 'Chờ duyệt' : undefined
                                    })}
                                    className="rounded text-[#2c5ea0] focus:ring-[#2c5ea0]"
                                  />
                                  <span className="text-[10px] font-bold text-rose-700">Đặc cách tốt nghiệp</span>
                                </label>
                                
                                {s.isSpecialExemption && (
                                  <div className="space-y-1.5">
                                    <input 
                                      type="text"
                                      placeholder="Lý do y tế..."
                                      value={s.specialExemptionDesc || ''}
                                      onChange={e => updateStudentData(s.id, { specialExemptionDesc: e.target.value })}
                                      className="px-1.5 py-0.5 bg-white border border-[#b8c6d9] text-[9px] w-full max-w-[150px] rounded"
                                    />
                                    <div className="flex items-center gap-2">
                                      <select
                                        value={s.specialExemptionStatus}
                                        onChange={e => updateStudentData(s.id, { specialExemptionStatus: e.target.value as any })}
                                        className="px-1 py-0.5 bg-white border border-[#b8c6d9] text-[9px] rounded font-semibold cursor-pointer"
                                      >
                                        <option value="Chờ duyệt">Chờ duyệt</option>
                                        <option value="Sở đã duyệt">Sở đã duyệt</option>
                                      </select>
                                      <button 
                                        onClick={() => showToast(`📁 Đã upload Bệnh án y tế cho học sinh ${s.name}`)}
                                        className="p-0.5 bg-[#e8eef6] border border-[#b8c6d9] rounded text-[#2c5ea0] hover:bg-[#dce4ee]"
                                        title="Tải hồ sơ bệnh án"
                                      >
                                        <Upload className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: SCORE ENTRY & GRADUATION CALCULATION */}
              {activeTab === 'scores' && (
                <div className="space-y-6">
                  {/* Formula and stats display */}
                  <div className="bg-[#e8eef6] border border-[#b8c6d9] p-5 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2 text-[#2c5ea0]">
                      <FileText size={18} />
                      <h4 className="font-serif font-bold text-sm">Công thức tính Điểm xét hoàn thành chương trình (ĐXTN) năm 2025 trở đi:</h4>
                    </div>
                    <div className="bg-white border border-[#b8c6d9] p-3 rounded-lg text-xs font-mono text-[#2c5ea0] overflow-x-auto text-center font-bold">
                      ĐXTN = ( (Tổng điểm 4 môn thi / 4) * 7 + GPA Khối 5 * 3 ) / 10 + Điểm Ưu tiên + (Điểm Khuyến khích / 4)
                    </div>
                    <p className="text-[11px] text-[#4a5568] leading-relaxed">
                      * <strong>Điều kiện đỗ tốt nghiệp</strong>: ĐXTN đạt từ 5.0 trở lên, không có môn thi nào bị điểm liệt (từ 1.0 điểm trở xuống) và đủ điều kiện dự thi.
                    </p>
                  </div>

                  {/* Student Table */}
                  <div className="bg-white border border-[#b8c6d9] rounded-xl overflow-x-auto shadow-inner">
                    <table className="w-full min-w-[1000px] text-xs text-left">
                      <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold uppercase tracking-wider text-[#4a5568] text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Học sinh</th>
                          <th className="px-4 py-3 text-center">GPA Khối 5</th>
                          <th className="px-4 py-3 text-center">Toán</th>
                          <th className="px-4 py-3 text-center">Văn</th>
                          <th className="px-4 py-3 text-center">Môn tự chọn 1</th>
                          <th className="px-4 py-3 text-center">Môn tự chọn 2</th>
                          <th className="px-4 py-3 text-center">Điểm Xét Tốt Nghiệp</th>
                          <th className="px-4 py-3 text-center">Kết Quả</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce4ee]">
                        {paginatedStudents.map(s => {
                          const eligibility = checkEligibility(s).status;
                          const isEligible = eligibility === 'Đủ điều kiện' || eligibility === 'Thiếu hồ sơ';
                          const outcomes = s.outcome || 'Trượt';
                          
                          return (
                            <tr key={s.id} className="hover:bg-[#f5f8fc]/50">
                              <td className="px-4 py-4 font-bold text-[#1e2a3a] whitespace-nowrap">
                                <p>{s.name}</p>
                                <span className="text-[10px] font-normal text-[#7b8a9e]">{s.classId}</span>
                              </td>
                              
                              {/* GPA 12 prefilled */}
                              <td className="px-4 py-4 text-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  value={s.gpa12}
                                  onChange={e => updateStudentData(s.id, { gpa12: parseFloat(e.target.value) || 0 })}
                                  className="w-12 px-1 py-0.5 border border-[#b8c6d9] rounded text-center font-bold text-xs"
                                />
                              </td>

                              {/* Toán score */}
                              <td className="px-4 py-4 text-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  disabled={!isEligible || s.isSpecialExemption}
                                  value={s.scores['Toán'] || ''}
                                  onChange={e => {
                                    const next = { ...s.scores, 'Toán': parseFloat(e.target.value) || 0 };
                                    updateStudentData(s.id, { scores: next });
                                  }}
                                  className={`w-12 px-1 py-0.5 border border-[#b8c6d9] rounded text-center font-bold text-xs ${s.scores['Toán'] <= 1.0 && s.scores['Toán'] > 0 ? 'bg-red-50 text-red-700 border-red-300' : ''}`}
                                />
                              </td>

                              {/* Văn score */}
                              <td className="px-4 py-4 text-center">
                                <input
                                  type="number"
                                  step="0.1"
                                  min="0"
                                  max="10"
                                  disabled={!isEligible || s.isSpecialExemption}
                                  value={s.scores['Ngữ văn'] || ''}
                                  onChange={e => {
                                    const next = { ...s.scores, 'Ngữ văn': parseFloat(e.target.value) || 0 };
                                    updateStudentData(s.id, { scores: next });
                                  }}
                                  className={`w-12 px-1 py-0.5 border border-[#b8c6d9] rounded text-center font-bold text-xs ${s.scores['Ngữ văn'] <= 1.0 && s.scores['Ngữ văn'] > 0 ? 'bg-red-50 text-red-700 border-red-300' : ''}`}
                                />
                              </td>

                              {/* Choice 1 score */}
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-[9px] text-[#7b8a9e] font-bold block mb-1">{s.registeredElectives[0]}</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="10"
                                    disabled={!isEligible || s.isSpecialExemption}
                                    value={s.scores[s.registeredElectives[0]] || ''}
                                    onChange={e => {
                                      const next = { ...s.scores, [s.registeredElectives[0]]: parseFloat(e.target.value) || 0 };
                                      updateStudentData(s.id, { scores: next });
                                    }}
                                    className={`w-12 px-1 py-0.5 border border-[#b8c6d9] rounded text-center font-bold text-xs ${s.scores[s.registeredElectives[0]] <= 1.0 && s.scores[s.registeredElectives[0]] > 0 ? 'bg-red-50 text-red-700 border-red-300' : ''}`}
                                  />
                                </div>
                              </td>

                              {/* Choice 2 score */}
                              <td className="px-4 py-4 text-center whitespace-nowrap">
                                <div className="inline-flex flex-col items-center">
                                  <span className="text-[9px] text-[#7b8a9e] font-bold block mb-1">{s.registeredElectives[1]}</span>
                                  {s.exemptLanguage && s.registeredElectives[1] === 'Ngoại ngữ' ? (
                                    <span className="inline-block px-1.5 py-1 bg-green-50 text-green-700 font-bold border border-green-200 rounded text-[10px]">
                                      Miễn (10đ)
                                    </span>
                                  ) : (
                                    <input
                                      type="number"
                                      step="0.1"
                                      min="0"
                                      max="10"
                                      disabled={!isEligible || s.isSpecialExemption}
                                      value={s.scores[s.registeredElectives[1]] || ''}
                                      onChange={e => {
                                        const next = { ...s.scores, [s.registeredElectives[1]]: parseFloat(e.target.value) || 0 };
                                        updateStudentData(s.id, { scores: next });
                                      }}
                                      className={`w-12 px-1 py-0.5 border border-[#b8c6d9] rounded text-center font-bold text-xs ${s.scores[s.registeredElectives[1]] <= 1.0 && s.scores[s.registeredElectives[1]] > 0 ? 'bg-red-50 text-red-700 border-red-300' : ''}`}
                                    />
                                  )}
                                </div>
                              </td>

                              {/* Calculated Graduation Score */}
                              <td className="px-4 py-4 text-center font-serif text-base font-bold text-[#2c5ea0]">
                                {s.isSpecialExemption ? '—' : (s.gradScore || 0).toFixed(2)}
                              </td>

                              {/* Final Outcome Badge */}
                              <td className="px-4 py-4 text-center">
                                {eligibility === 'Không đủ điều kiện' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                                    Không xét hoàn thành chương trình
                                  </span>
                                ) : s.isSpecialExemption && s.specialExemptionStatus === 'Sở đã duyệt' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                    Đặc cách TN
                                  </span>
                                ) : outcomes === 'Đỗ Tốt nghiệp' ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase">
                                    Đỗ Tốt Nghiệp
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                                    Trượt tốt nghiệp
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: DIPLOMA ISSUANCE & PRINTING */}
              {activeTab === 'diploma' && (
                <div className="space-y-4">
                  <div className="bg-[#f5f8fc] border border-[#b8c6d9] p-4 rounded-xl flex items-center justify-between text-xs text-[#4a5568]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Danh sách này chỉ lọc học sinh đã <strong>Đỗ Tốt nghiệp</strong> hoặc <strong>Đặc cách tốt nghiệp</strong> để làm thủ tục cấp phát Bằng.</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#b8c6d9] rounded-xl overflow-x-auto shadow-inner">
                    <table className="w-full min-w-[1000px] text-xs text-left">
                      <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold uppercase tracking-wider text-[#4a5568] text-[10px]">
                        <tr>
                          <th className="px-4 py-3">Học sinh</th>
                          <th className="px-4 py-3 text-center">ĐXTN / Xếp loại</th>
                          <th className="px-4 py-3">Số hiệu bằng chính thức</th>
                          <th className="px-4 py-3">Số vào sổ cấp bằng</th>
                          <th className="px-4 py-3">Trạng thái nhận</th>
                          <th className="px-4 py-3 text-right">Tác vụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce4ee]">
                        {paginatedGraduatedStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-[#7b8a9e] italic font-semibold">
                              Chưa có học sinh đỗ tốt nghiệp hoặc đặc cách tốt nghiệp. Vui lòng nhập điểm thi và xét hoàn thành chương trình tại Tab 4.
                            </td>
                          </tr>
                        ) : (
                          paginatedGraduatedStudents.map(s => {
                            let classification = 'Trung bình';
                            if (s.outcome === 'Đặc cách') classification = 'Đặc cách';
                            else if (s.gradScore >= 8.0 && s.academicClass12 === 'Giỏi') classification = 'Giỏi';
                            else if (s.gradScore >= 6.5) classification = 'Khá';

                            return (
                              <tr key={s.id} className="hover:bg-[#f5f8fc]/50">
                                <td className="px-4 py-4 font-bold text-[#1e2a3a] whitespace-nowrap">
                                  <p>{s.name}</p>
                                  <span className="text-[10px] font-normal text-[#7b8a9e]">{s.classId}</span>
                                </td>
                                
                                <td className="px-4 py-4 text-center">
                                  <div className="space-y-0.5">
                                    <p className="font-bold font-serif text-sm text-[#2c5ea0]">{s.outcome === 'Đặc cách' ? '—' : s.gradScore.toFixed(2)}</p>
                                    <span className="text-[9px] font-bold text-[#4a5568] uppercase bg-gray-100 px-1.5 py-0.5 rounded">
                                      {classification}
                                    </span>
                                  </div>
                                </td>

                                {/* Diploma No. input */}
                                <td className="px-4 py-4">
                                  <input
                                    type="text"
                                    value={s.diplomaNo || ''}
                                    onChange={e => updateStudentData(s.id, { diplomaNo: e.target.value })}
                                    placeholder="BGD/123456"
                                    className="px-2 py-1 bg-white border border-[#b8c6d9] rounded w-28 text-xs font-mono font-bold"
                                  />
                                </td>

                                {/* Registry No. input */}
                                <td className="px-4 py-4">
                                  <input
                                    type="text"
                                    value={s.registryNo || ''}
                                    onChange={e => updateStudentData(s.id, { registryNo: e.target.value })}
                                    placeholder="Số vào sổ"
                                    className="px-2 py-1 bg-white border border-[#b8c6d9] rounded w-36 text-xs font-bold"
                                  />
                                </td>

                                {/* Receipt Status select */}
                                <td className="px-4 py-4">
                                  <div className="space-y-1.5">
                                    <select
                                      value={s.diplomaStatus}
                                      onChange={e => updateStudentData(s.id, { diplomaStatus: e.target.value as any })}
                                      className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                                    >
                                      <option value="Chưa nhận">Chưa nhận</option>
                                      <option value="Đã nhận">Đã nhận (Ký nhận)</option>
                                      <option value="Ủy quyền nhận">Ủy quyền nhận</option>
                                    </select>
                                    
                                    {s.diplomaStatus === 'Ủy quyền nhận' && (
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="text"
                                          value={s.recipientName || ''}
                                          onChange={e => updateStudentData(s.id, { recipientName: e.target.value })}
                                          placeholder="Tên người nhận thay"
                                          className="px-1.5 py-0.5 border border-[#b8c6d9] rounded text-[9px] w-24"
                                        />
                                        <button 
                                          onClick={() => showToast(`📁 Đã upload Giấy ủy quyền nhận bằng của học sinh ${s.name}`)}
                                          className="p-1 bg-[#e8eef6] border border-[#b8c6d9] rounded text-[#2c5ea0] hover:bg-[#dce4ee]"
                                          title="Tải tệp ủy quyền"
                                        >
                                          <Upload className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Action printer preview trigger */}
                                <td className="px-4 py-4 text-right">
                                  <button
                                    onClick={() => {
                                      setSelectedStudent(s);
                                      setIsPrintModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold text-[#2c5ea0] rounded-full cursor-pointer shadow-sm transition-colors"
                                  >
                                    <Printer className="w-3.5 h-3.5" /> In GCN Tạm thời
                                  </button>
                                </td>
                              </tr>
                            );
                          }))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                </>
              )}
            </div>

            {/* Pagination Footer */}
            {!loading && (
              <div className="px-8 py-4 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10 rounded-b-[21px]">
                <Pagination
                  currentPage={currentPage}
                  totalPages={activeTab === 'diploma' ? Math.ceil(graduatedStudents.length / pageSize) : Math.ceil(filteredStudents.length / pageSize)}
                  onPageChange={setCurrentPage}
                  totalItems={activeTab === 'diploma' ? graduatedStudents.length : filteredStudents.length}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* PRINT CERTIFICATE PREVIEW MODAL */}
      <ModalBase
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Xem Trước Giấy Chứng Nhận Tốt Nghiệp Tạm Thời"
        subtitle="Mẫu in ấn chuẩn pháp lý của Sở GD&ĐT cấp"
        width="max-w-3xl"
      >
        {selectedStudent && (
          <div className="flex flex-col bg-[#e8eef6]">
            
            {/* Style override to inject critical CSS rules for print layout */}
            <style>{`
              @page {
                size: A4 landscape;
                margin: 10mm;
              }
              @media print {
                /* Hide everything except the certificate area */
                body * {
                  visibility: hidden !important;
                }
                
                /* Reset height, overflow, transform and positioning on all parent elements to prevent clipping */
                html, body, #root,
                *:has(#certificate-print-area) {
                  height: auto !important;
                  max-height: none !important;
                  min-height: 0 !important;
                  overflow: visible !important;
                  position: static !important;
                  transform: none !important;
                  box-shadow: none !important;
                  border: none !important;
                  background: transparent !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  display: block !important;
                  width: auto !important;
                }

                #certificate-print-area, #certificate-print-area * {
                  visibility: visible !important;
                }

                #certificate-print-area {
                  visibility: visible !important;
                  position: relative !important; /* Keep relative for correct stamp/watermark offset placement */
                  width: 277mm !important; /* Fit within standard Landscape A4 margins */
                  height: 185mm !important;
                  border: 6px double #b8c6d9 !important;
                  background: #ffffff !important;
                  color: #1e2a3a !important;
                  margin: 0 auto !important;
                  padding: 1.2cm !important;
                  box-shadow: none !important;
                  box-sizing: border-box !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  page-break-inside: avoid !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* Printable Paper Area */}
            <div className="p-8 overflow-y-auto max-h-[500px]">
              <div 
                id="certificate-print-area" 
                className="bg-[#f5f8fc] p-10 border-[6px] border-double border-[#b8c6d9] text-[#1e2a3a] font-sans shadow-lg rounded-2xl relative max-w-2xl mx-auto ring-1 ring-[#2c5ea0]/20 transition-all duration-300 overflow-hidden"
              >
                {/* Background Watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] print:opacity-[0.02] pointer-events-none select-none">
                  <GraduationCap size={280} className="text-[#2c5ea0] print:text-black" />
                </div>

                {/* Header structure */}
                <div className="flex justify-between items-start text-center border-b border-[#b8c6d9] print:border-black pb-4 mb-6 relative z-10">
                  <div>
                    <h6 className="text-[10px] font-bold text-[#7b8a9e] print:text-black uppercase tracking-widest">SỞ GD&ĐT TỈNH TIỀN GIANG</h6>
                    <h5 className="text-[12px] font-serif font-bold tracking-wider text-[#2c5ea0] print:text-black mt-1">TRƯỜNG MẦM NON AN HỮU</h5>
                    <p className="text-[9px] text-[#7b8a9e] print:text-black font-serif italic mt-1">Số: {selectedStudent.id}/GCN-AH</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <h5 className="text-[10px] uppercase font-bold tracking-widest text-[#1e2a3a] print:text-black">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h5>
                    <h6 className="text-[9px] uppercase font-bold text-[#4a5568] print:text-black border-b border-[#b8c6d9] print:border-black pb-1 tracking-widest mt-1">Độc lập - Tự do - Hạnh phúc</h6>
                    <p className="text-[9px] text-[#7b8a9e] print:text-black font-serif italic mt-2">An Hữu, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8 relative z-10">
                  <h3 className="text-xl uppercase font-serif font-bold tracking-widest text-[#2c5ea0] print:text-black">
                    GIẤY CHỨNG NHẬN HOÀN THÀNH CHƯƠNG TRÌNH MẦM NON
                  </h3>
                  <p className="text-xs tracking-wider italic font-semibold text-[#4a5568] print:text-black mt-0.5">
                    (DÀNH CHO TRẺ 5 TUỔI)
                  </p>
                </div>

                {/* Body Content */}
                <div className="space-y-4 text-xs text-[#1e2a3a] print:text-black leading-relaxed relative z-10 font-sans">
                  <p className="font-bold italic text-[#4a5568] print:text-black uppercase tracking-wider text-[10px]">
                    HIỆU TRƯỞNG TRƯỜNG MẦM NON AN HỮU
                  </p>
                  
                  <p className="indent-4">Căn cứ Quy chế đánh giá sự phát triển của trẻ em mầm non hiện hành của Bộ Giáo dục và Đào tạo;</p>
                  
                  <p className="indent-4">Xét đề nghị của Hội đồng xét duyệt hoàn thành chương trình giáo dục mầm non của nhà trường;</p>
                  
                  <div className="pt-2">
                    <p className="uppercase font-serif font-bold text-center tracking-widest text-[13px] text-[#2c5ea0] print:text-black mb-3">
                      CHỨNG NHẬN
                    </p>
                    
                    <table className="w-full table-fixed space-y-2 text-xs border-collapse">
                      <tbody>
                        <tr className="border-b border-[#dce4ee] print:border-black/10">
                          <td className="w-1/3 py-2.5 text-[#4a5568] print:text-black font-semibold">Họ và tên Bé:</td>
                          <td className="w-2/3 py-2.5 font-serif font-bold text-[#2c5ea0] print:text-black uppercase text-[13px]">{selectedStudent.name}</td>
                        </tr>
                        <tr className="border-b border-[#dce4ee] print:border-black/10">
                          <td className="py-2.5 text-[#4a5568] print:text-black font-semibold">Ngày, tháng, năm sinh:</td>
                          <td className="py-2.5 font-bold text-[#1e2a3a] print:text-black">{selectedStudent.dob}</td>
                        </tr>
                        <tr className="border-b border-[#dce4ee] print:border-black/10">
                          <td className="py-2.5 text-[#4a5568] print:text-black font-semibold">Lớp học (Khối Lá):</td>
                          <td className="py-2.5 text-[#1e2a3a] print:text-black font-semibold">{selectedStudent.classId}</td>
                        </tr>
                        <tr className="border-b border-[#dce4ee] print:border-black/10">
                          <td className="py-2.5 text-[#4a5568] print:text-black font-semibold">Kết quả đánh giá 5 lĩnh vực:</td>
                          <td className="py-2.5 font-serif font-bold text-[#2c5ea0] print:text-black">
                            {selectedStudent.outcome === 'Đặc cách' ? 'Đặc cách hoàn thành' : 'Đạt chuẩn phát triển trẻ 5 tuổi'}
                          </td>
                        </tr>
                        <tr className="border-b border-[#dce4ee] print:border-black/10">
                          <td className="py-2.5 text-[#4a5568] print:text-black font-semibold">Đánh giá chung:</td>
                          <td className="py-2.5 font-bold text-[#1e2a3a] print:text-black">
                            {selectedStudent.outcome === 'Đặc cách' ? 'Đặc cách' : 'Hoàn thành tốt'}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 text-[#4a5568] print:text-black font-semibold">Quyết định phê duyệt số:</td>
                          <td className="py-2.5 font-mono text-xs text-[#1e2a3a] print:text-black">{selectedStudent.registryNo || 'Đang cập nhật...'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="pt-2 text-justify">
                    Bé được công nhận hoàn thành Chương trình giáo dục mầm non cho trẻ 5 tuổi theo quy định của Bộ Giáo dục và Đào tạo, đủ điều kiện vào học Lớp 1 Tiểu học.
                  </p>
                </div>

                {/* Sign-off & Stamp Section */}
                <div className="flex justify-between items-end mt-10 pt-4 border-t border-dashed border-[#b8c6d9] print:border-black/20 relative">
                  {/* Photo area */}
                  <div className="w-28 h-36 border-2 border-double border-[#b8c6d9] print:border-black flex flex-col items-center justify-center text-[9px] text-[#7b8a9e] print:text-black font-normal italic bg-[#f0f4fa] print:bg-white rounded-lg relative overflow-hidden z-10 shadow-sm">
                    <User className="w-8 h-8 mb-2 opacity-30 text-[#2c5ea0] print:text-black" />
                    <span className="text-center px-1.5 leading-tight">Ảnh 3x4 giáp lai</span>
                  </div>

                  {/* Red stamp & Signature Area */}
                  <div className="text-center w-64 relative min-h-[144px] flex flex-col justify-between z-10">
                    <div>
                      <p className="font-bold text-[10px] uppercase tracking-wider text-[#1e2a3a] print:text-black">HIỆU TRƯỞNG</p>
                      <p className="text-[9px] text-[#7b8a9e] print:text-black italic mt-0.5">(Ký tên, ghi rõ họ tên và đóng dấu)</p>
                    </div>
                    
                    {/* Stylized Red Circular Stamp */}
                    <div className="absolute right-4 bottom-2 w-28 h-28 border-[3px] border-red-600 rounded-full flex items-center justify-center text-center opacity-85 pointer-events-none select-none rotate-[-12deg] font-sans font-bold text-red-600 leading-none">
                      <div className="border border-dashed border-red-600 rounded-full w-[100px] h-[100px] flex flex-col items-center justify-center p-1.5">
                        <p className="uppercase tracking-widest text-[6px] mb-0.5">SỞ GD&ĐT TIỀN GIANG</p>
                        <p className="uppercase text-[8px] font-extrabold my-0.5">TRƯỜNG th</p>
                        <p className="uppercase text-[9px] font-black my-0.5 tracking-wider">AN HỮU</p>
                        <div className="w-12 h-[1px] bg-red-600 my-0.5"></div>
                        <p className="uppercase text-[6px] tracking-wider mt-0.5">ĐÃ CẤP</p>
                      </div>
                    </div>

                    <div className="mt-16 relative z-20">
                      {/* Fake signature font/underlined */}
                      <p className="font-serif font-bold underline text-sm text-[#2c5ea0] print:text-black tracking-widest uppercase">
                        {principalName.startsWith('ThS.') || principalName.startsWith('Thầy') || principalName.startsWith('Cô') ? principalName : `ThS. ${principalName}`}
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal footer controls */}
            <div className="p-6 border-t border-dashed border-[#b8c6d9] flex justify-between items-center bg-[#f5f8fc] shrink-0 no-print">
              <button 
                type="button" 
                onClick={() => setIsPrintModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors cursor-pointer"
              >
                Hủy
              </button>
              <button 
                type="button"
                onClick={() => {
                  window.print();
                  showToast(`🖨️ Đã thực hiện gửi lệnh in Giấy chứng nhận cho học sinh: ${selectedStudent.name}`);
                }}
                className="flex items-center gap-1.5 px-6 py-2.5 bg-[#2e6b8a] text-[#f5f8fc] border border-[#1e4f6a] text-xs uppercase tracking-widest font-bold hover:bg-[#1e4f6a] transition shadow-[2px_2px_0px_#131a25] active:shadow-none active:translate-y-1 rounded-full cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Bắt đầu in
              </button>
            </div>

          </div>
        )}
      </ModalBase>

      {/* RESET GRADUATION DATA CONFIRMATION MODAL */}
      <ModalBase
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Đặt Lại Dữ Liệu Xét Tốt Nghiệp Khối 5"
        subtitle="Hệ thống chuẩn bị học vụ Mầm non An Hữu"
        width="max-w-md"
      >
        <div className="p-6 bg-[#f5f8fc] text-[#1e2a3a] font-sans">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-red-50 rounded-full text-[#2c5ea0] border border-red-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#2c5ea0] uppercase tracking-wider">Cảnh báo quan trọng</h4>
              <p className="text-xs text-[#4a5568] leading-relaxed mt-1">
                Hành động này sẽ xóa toàn bộ dữ liệu tốt nghiệp đã lưu cục bộ (gồm điểm thi th, đăng ký môn thi, diện ưu tiên và trạng thái cấp bằng) của tất cả học sinh Khối 5.
              </p>
              <p className="text-xs text-[#4a5568] leading-relaxed mt-2 font-bold">
                Nếu trong hệ thống không còn học sinh Khối 5, bảng tốt nghiệp sẽ được xóa trống hoàn toàn.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-dashed border-[#b8c6d9] mt-6">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="px-5 py-2 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={confirmResetGraduationData}
              className="flex items-center gap-1.5 px-5 py-2 bg-[#2c5ea0] text-[#f5f8fc] border border-[#5a2c2c] text-xs uppercase tracking-widest font-bold hover:bg-[#5a2c2c] transition rounded-full cursor-pointer shadow-[2px_2px_0px_#131a25] active:shadow-none active:translate-y-1"
            >
              <Trash2 className="w-4 h-4" /> Xác nhận Xóa & Đặt lại
            </button>
          </div>
        </div>
      </ModalBase>
    </main>
  );
};
