import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Check, AlertTriangle, XCircle, ArrowRight, ShieldAlert, 
  BookOpen, TrendingUp, UserCheck, RefreshCw, Lock, CheckCircle2, Award, 
  Sparkles, Clock, ArrowUpRight, HelpCircle, Save
} from 'lucide-react';
import { getStudents, updateStudent, Student } from '../../services/studentService';
import { getClasses, saveClassOnly, ClassData } from '../../services/dbService';
import { Pagination } from '../ui/Pagination';
import { ModalBase } from '../ui/Modals';
import { ReportCardData } from '../ui/PrintableReportCard';
import { GraduationPanel } from './GraduationPanel';
import { getAllReportCards, ReportCardDocument } from '../../services/reportCardService';
import { getPromotionEvaluations, savePromotionEvaluationsBulk, StudentPromotion } from '../../services/promotionService';
import { getGraduationStudents } from '../../services/graduationService';

// Helper to look up report cards from Firestore cache, falling back to a blank template (no mock scores)
const getReportCardData = (
  student: any,
  semester: string = 'Học Kỳ II',
  reportCardsCache: Map<string, ReportCardDocument>
): ReportCardData => {
  const cacheKey = `${student.id}_${semester}`;
  const cached = reportCardsCache.get(cacheKey);
  if (cached) {
    return {
      id: cached.studentId,
      name: cached.name,
      dob: cached.dob,
      gender: cached.gender,
      grade: cached.grade,
      gvcn: cached.gvcn,
      academicYear: cached.academicYear,
      scores: cached.scores,
      summary: cached.summary
    };
  }

  const gvcnMap: Record<string, string> = {
    '1A1': 'Cô Lê Thị Thảo',
    '1A5': 'Thầy Nguyễn Trọng Hoàng',
    '11B2': 'Cô Phạm Hồng Đào',
  };
  const gvcn = gvcnMap[student.grade] || 'Cô Lê Thị Thảo';

  if (semester === 'Cả Năm') {
    // Cả Năm: average HKI and HKII
    const rc1 = getReportCardData(student, 'Học Kỳ I', reportCardsCache);
    const rc2 = getReportCardData(student, 'Học Kỳ II', reportCardsCache);

    const scores = rc1.scores.map((s1: any, idx: number) => {
      const s2 = rc2.scores[idx];
      const isQualitative = typeof s1.average === 'string' || typeof s2.average === 'string';
      const average = isQualitative
        ? (s2.average === 'Đạt' ? 'Đạt' : 'Chưa đạt')
        : parseFloat(((Number(s1.average) + Number(s2.average)) / 2).toFixed(1));
      
      return {
        subject: s1.subject,
        multiplier1: [s1.average],
        multiplier2: [s2.average],
        multiplier3: 0,
        average,
        teacherComment: typeof average === 'string'
          ? (average === 'Đạt' ? 'Cả năm rèn luyện tốt, đạt yêu cầu môn học.' : 'Cần tích cực rèn luyện thêm.')
          : (average >= 8.5
              ? 'Cả năm hoàn thành xuất sắc, tiếp thu và vận dụng kiến thức tốt.'
              : 'Tiến độ học tập cả năm ổn định, cần phát huy thêm thế mạnh.')
      };
    });

    const numericScores = scores.filter(s => typeof s.average === 'number');
    const totalSum = numericScores.reduce((sum, s) => sum + (s.average as number), 0);
    const curGpa = numericScores.length > 0 ? parseFloat((totalSum / numericScores.length).toFixed(2)) : 0;

    return {
      id: student.id,
      name: student.name,
      dob: student.dob,
      gender: student.gender,
      grade: student.grade,
      gvcn,
      academicYear: '2025-2026',
      scores,
      summary: {
        gpa: curGpa,
        academicConduct: curGpa >= 8.0 ? 'Giỏi' : curGpa >= 6.5 ? 'Khá' : 'Trung Bình',
        moralConduct: 'Tốt',
        daysAbsent: rc1.summary.daysAbsent + rc2.summary.daysAbsent,
        daysAbsentExcused: rc1.summary.daysAbsentExcused + rc2.summary.daysAbsentExcused,
        generalComment: curGpa >= 8.0
          ? 'Học sinh gương mẫu, đạo đức tốt, có tinh thần tương thân tương ái, dẫn đầu phong trào học tập.'
          : 'Học sinh ngoan, lễ phép, hòa đồng với bạn bè. Đề nghị gia đình tiếp tục đôn đốc học tập thêm ở nhà!'
      }
    };
  }

  // Return blank template scores for quantitative and qualitative subjects
  const blankScores = [
    { subject: 'Toán Học', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Ngữ Văn', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Tiếng Anh', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Lịch Sử', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Địa Lý', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Vật Lý', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Hóa Học', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Sinh Học', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'KTPL (Kinh tế Pháp luật)', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Tin Học', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Công Nghệ', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Giáo dục quốc phòng và an ninh', multiplier1: [0, 0], multiplier2: [0], multiplier3: 0, average: 0, teacherComment: '' },
    { subject: 'Giáo dục thể chất', multiplier1: ['Đạt'], multiplier2: ['Đạt'], multiplier3: 'Đạt', average: 'Đạt', teacherComment: '' },
    { subject: 'Âm nhạc', multiplier1: ['Đạt'], multiplier2: ['Đạt'], multiplier3: 'Đạt', average: 'Đạt', teacherComment: '' },
    { subject: 'Mỹ thuật', multiplier1: ['Đạt'], multiplier2: ['Đạt'], multiplier3: 'Đạt', average: 'Đạt', teacherComment: '' },
    { subject: 'Hoạt động trải nghiệm', multiplier1: ['Đạt'], multiplier2: ['Đạt'], multiplier3: 'Đạt', average: 'Đạt', teacherComment: '' },
    { subject: 'Giáo dục địa phương', multiplier1: ['Đạt'], multiplier2: ['Đạt'], multiplier3: 'Đạt', average: 'Đạt', teacherComment: '' },
  ];

  return {
    id: student.id,
    name: student.name,
    dob: student.dob,
    gender: student.gender,
    grade: student.grade,
    gvcn,
    academicYear: '2025-2026',
    scores: blankScores,
    summary: {
      gpa: 0,
      academicConduct: 'Trung Bình',
      moralConduct: 'Tốt',
      daysAbsent: 0,
      daysAbsentExcused: 0,
      generalComment: 'Chưa có dữ liệu điểm. Vui lòng nhập điểm qua chức năng "Nhập Điểm & Đánh Giá".'
    }
  };
};


export const PromotionPanel: React.FC = () => {
  // Main Tab layout: promotion (1 - 4) or graduation (5)
  const [activeMainTab, setActiveMainTab] = useState<'promotion' | 'graduation'>('promotion');

  // Completed & Lock states for each tab
  const [isPromotionCompleted, setIsPromotionCompleted] = useState<boolean>(() => {
    return localStorage.getItem('is_promotion_completed') === 'true';
  });
  const [isGraduationCompleted, setIsGraduationCompleted] = useState<boolean>(() => {
    return localStorage.getItem('is_graduation_completed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('is_promotion_completed', String(isPromotionCompleted));
  }, [isPromotionCompleted]);

  useEffect(() => {
    localStorage.setItem('is_graduation_completed', String(isGraduationCompleted));
  }, [isGraduationCompleted]);

  const [students, setStudents] = useState<StudentPromotion[]>([]);
  const [dbClasses, setDbClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'review' | 'summer' | 'placement'>('review');
  const [toast, setToast] = useState<string | null>(null);
  const [accidentalStudents, setAccidentalStudents] = useState<any[]>([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<'All' | '1' | '2' | '3' | '4'>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Tab 3 mapping: class current name -> target class name
  const [classMapping, setClassMapping] = useState<Record<string, string>>({});
  
  // Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [transitionYear, setTransitionYear] = useState('2026 - 2027');

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, gradeFilter, statusFilter]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Helper: auto compute recommendation based on TT 22
  const computeRecommendation = (
    gpa: number, 
    conduct: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt', 
    absent: number
  ): StudentPromotion['recommendStatus'] => {
    if (absent > 45) {
      return 'Ở lại lớp (Lưu ban)';
    }

    let academic: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt' = 'Chưa đạt';
    if (gpa >= 8.0) academic = 'Tốt';
    else if (gpa >= 6.5) academic = 'Khá';
    else if (gpa >= 5.0) academic = 'Đạt';

    if (academic === 'Chưa đạt' && conduct === 'Chưa đạt') {
      return 'Ở lại lớp (Lưu ban)';
    }
    if (academic === 'Chưa đạt') {
      return 'Kiểm tra lại trong hè';
    }
    if (conduct === 'Chưa đạt') {
      return 'Rèn luyện lại trong hè';
    }
    return 'Được lên lớp thẳng';
  };

  // Fetch classes and students
  const loadData = async () => {
    try {
      setLoading(true);
      const allStudents = await getStudents();
      const classes = await getClasses();
      setDbClasses(classes);

      // Detect accidental promotion for Cohort 2025 in Grade 5
      const accidental = allStudents.filter(s => {
        const isCohort2025 = s.id.startsWith('HS2025') || s.id.includes('2025');
        const isInGrade5 = s.grade.startsWith('5');
        return isCohort2025 && isInGrade5;
      });
      setAccidentalStudents(accidental);

      // Filter out grade 1 to 4 students
      const targetStudents = allStudents.filter(s => {
        const gradeNum = parseInt(s.grade);
        return gradeNum >= 1 && gradeNum <= 4 && s.status === 'Đang Học';
      });

      // Fetch report cards from Firestore
      const allCards = await getAllReportCards();
      const reportCardsCache = new Map<string, ReportCardDocument>();
      allCards.forEach(card => reportCardsCache.set(card.id, card));

      // Load saved promotion states from Firestore
      const savedList = await getPromotionEvaluations();
      const savedMap = new Map(savedList.map(item => [item.id, item]));

      const mappedList: StudentPromotion[] = targetStudents.map(s => {
        const saved = savedMap.get(s.id);

        // Fetch Cả Năm report card using the Firestore cache lookup
        const rc = getReportCardData(s, 'Cả Năm', reportCardsCache);
        
        const activeGPA = rc.summary.gpa;
        
        // Map moralConduct: 'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu' -> 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt'
        let activeConduct: StudentPromotion['conductClass'] = 'Đạt';
        const mc = rc.summary.moralConduct;
        if (mc === 'Tốt') activeConduct = 'Tốt';
        else if (mc === 'Khá') activeConduct = 'Khá';
        else if (mc === 'Trung Bình') activeConduct = 'Đạt';
        else if (mc === 'Yếu') activeConduct = 'Chưa đạt';

        const activeAbsent = rc.summary.daysAbsent;

        const recommend = computeRecommendation(activeGPA, activeConduct, activeAbsent);
        const decision = saved ? saved.decisionStatus : (recommend === 'Được lên lớp thẳng' ? 'Được lên lớp' : 'Chờ duyệt');
        
        const charCodeSum = s.id.split('').reduce((sum: number, char: string) => sum + char.charCodeAt(0), 0);
        const wantsCombinationChange = charCodeSum % 15 === 7;

        return {
          id: s.id,
          name: s.name,
          grade: s.grade,
          gpa: activeGPA,
          academicClass: activeGPA >= 8.0 ? 'Tốt' : activeGPA >= 6.5 ? 'Khá' : activeGPA >= 5.0 ? 'Đạt' : 'Chưa đạt',
          conductClass: activeConduct,
          absentDays: activeAbsent,
          recommendStatus: recommend,
          decisionStatus: decision as any,
          approved: saved ? saved.approved : (recommend === 'Được lên lớp thẳng'),
          reTestSubject: saved ? saved.reTestSubject : (recommend === 'Kiểm tra lại trong hè' ? (charCodeSum % 2 === 0 ? 'Toán Học' : 'Hóa Học') : undefined),
          reTestScore: saved ? saved.reTestScore : undefined,
          reTrainTask: saved ? saved.reTrainTask : (recommend === 'Rèn luyện lại trong hè' ? 'Lao động dọn dẹp vệ sinh khuôn viên trường học và học tập nội quy học sinh' : undefined),
          reTrainEval: saved ? saved.reTrainEval : (recommend === 'Rèn luyện lại trong hè' ? 'Chưa đánh giá' : undefined),
          combinationChangeRequested: saved ? saved.combinationChangeRequested : wantsCombinationChange,
          targetClass: saved ? saved.targetClass : undefined
        };
      });

      // Initialize class mapping dynamically based on current classes
      const currentClassesList = Array.from(new Set(targetStudents.map(s => s.grade))).sort();
      const initialMap: Record<string, string> = {};
      currentClassesList.forEach(cls => {
        const gradeNum = parseInt(cls);
        if (gradeNum >= 1 && gradeNum <= 4) {
          const nextGradeNum = gradeNum + 1;
          initialMap[cls] = cls.replace(String(gradeNum), String(nextGradeNum));
        } else {
          initialMap[cls] = '';
        }
      });
      setClassMapping(initialMap);

      setStudents(mappedList);
    } catch (err) {
      console.error("Failed to load promotion data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevertPromotion = async () => {
    if (accidentalStudents.length === 0) return;
    if (!window.confirm(`Bạn có chắc chắn muốn khôi phục ${accidentalStudents.length} học sinh khóa 2025 này về lại khối 2?`)) {
      return;
    }

    try {
      setProcessing(true);
      const updatePromises = accidentalStudents.map(s => {
        const revertedGrade = s.grade.replace(/^5/, '2');
        return updateStudent(s.id, { 
          grade: revertedGrade,
          status: 'Đang Học'
        });
      });
      
      await Promise.all(updatePromises);
      showToast(`✅ Đã khôi phục thành công ${accidentalStudents.length} học sinh về khối 2!`);
      window.dispatchEvent(new CustomEvent('grades-updated'));
      await loadData();
    } catch (err) {
      console.error("Failed to revert promotion", err);
      showToast("❌ Không thể khôi phục học sinh. Vui lòng kiểm tra kết nối mạng.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleGradesUpdate = () => {
      loadData();
    };
    window.addEventListener('grades-updated', handleGradesUpdate);
    return () => window.removeEventListener('grades-updated', handleGradesUpdate);
  }, []);

  // Save changes to Firestore on local state updates (debounced to avoid excessive writes)
  useEffect(() => {
    if (loading || students.length === 0) return;
    
    const delayDebounce = setTimeout(async () => {
      try {
        await savePromotionEvaluationsBulk(students);
      } catch (err) {
        console.error('Failed to auto-save promotion evaluations to Firestore:', err);
      }
    }, 1000);

    return () => clearTimeout(delayDebounce);
  }, [students, loading]);

  // Bulk Approval for Tab 1
  const handleBulkApprove = () => {
    setStudents(prev => prev.map(s => {
      if (s.recommendStatus === 'Được lên lớp thẳng' && !s.approved) {
        return { ...s, approved: true, decisionStatus: 'Được lên lớp' };
      }
      return s;
    }));
    showToast("✅ Đã phê duyệt hàng loạt các học sinh được Lên lớp thẳng!");
  };

  // Filter students based on UI selections
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    
    const gradeLevel = String(parseInt(s.grade));
    const matchesGrade = gradeFilter === 'All' ? true : gradeLevel === gradeFilter;

    let matchesStatus = true;
    if (statusFilter !== 'All') {
      if (activeTab === 'review') {
        matchesStatus = s.recommendStatus === statusFilter;
      } else if (activeTab === 'summer') {
        matchesStatus = s.decisionStatus === statusFilter;
      }
    }

    return matchesSearch && matchesGrade && matchesStatus;
  });

  // Paginated Slices
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Tab 2 Summer Students
  const summerStudents = students.filter(s => 
    s.recommendStatus === 'Kiểm tra lại trong hè' || 
    s.recommendStatus === 'Rèn luyện lại trong hè'
  );

  const filteredSummerStudents = summerStudents.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.id.includes(searchQuery);
    const gradeLevel = String(parseInt(s.grade));
    const matchesGrade = gradeFilter === 'All' ? true : gradeLevel === gradeFilter;
    const matchesStatus = statusFilter === 'All' ? true : s.decisionStatus === statusFilter;
    return matchesSearch && matchesGrade && matchesStatus;
  });

  const paginatedSummerStudents = filteredSummerStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Statistics
  const stats = {
    total: students.length,
    straightPromotion: students.filter(s => s.recommendStatus === 'Được lên lớp thẳng').length,
    retest: students.filter(s => s.recommendStatus === 'Kiểm tra lại trong hè').length,
    retrain: students.filter(s => s.recommendStatus === 'Rèn luyện lại trong hè').length,
    stayback: students.filter(s => s.recommendStatus === 'Ở lại lớp (Lưu ban)').length,
    approved: students.filter(s => s.approved && s.decisionStatus === 'Được lên lớp').length,
    summerPending: students.filter(s => 
      (s.recommendStatus === 'Kiểm tra lại trong hè' || s.recommendStatus === 'Rèn luyện lại trong hè') &&
      s.decisionStatus === 'Chờ duyệt'
    ).length,
    summerPassed: students.filter(s => 
      (s.recommendStatus === 'Kiểm tra lại trong hè' || s.recommendStatus === 'Rèn luyện lại trong hè') &&
      s.decisionStatus === 'Được lên lớp'
    ).length,
    summerFailed: students.filter(s => 
      (s.recommendStatus === 'Kiểm tra lại trong hè' || s.recommendStatus === 'Rèn luyện lại trong hè') &&
      s.decisionStatus === 'Ở lại lớp'
    ).length,
  };

  // Perform Year-End Bulk Transition to Firestore database
  const executeTransition = async () => {
    setProcessing(true);
    try {
      // 1. Gather all student modifications
      const updatesPromises: Promise<void>[] = [];
      let countGraduated = 0;
      let countPromoted = 0;
      let countRetained = 0;

      // Handle Grade 1 to 4 from the current list
      students.forEach(s => {
        let nextGrade = s.grade;
        let nextStatus = 'Đang Học' as const;

        if (s.decisionStatus === 'Được lên lớp') {
          // If wants combinations change or targetClass is set manually
          if (s.targetClass) {
            nextGrade = s.targetClass;
          } else {
            nextGrade = classMapping[s.grade] || s.grade;
          }
          countPromoted++;
        } else {
          // Retention: keep same grade, optionally mapping to new class of same grade
          if (s.targetClass) {
            nextGrade = s.targetClass;
          }
          countRetained++;
        }

        updatesPromises.push(updateStudent(s.id, { 
          grade: nextGrade,
          status: nextStatus
        }));
      });
      // Handle Grade 5 students (Load outcome from Firestore)
      const gradStudents = await getGraduationStudents();
      
      gradStudents.forEach(gs => {
        if (gs.outcome === 'Đỗ Tốt nghiệp' || gs.outcome === 'Đặc cách') {
          // Grade 5 student completed primary education
          updatesPromises.push(updateStudent(gs.id, {
            grade: 'Đã tốt nghiệp',
            status: 'Đã tốt nghiệp'
          }));
          countGraduated++;
        } else {
          // Retained in grade 5
          countRetained++;
        }
      });

      await Promise.all(updatesPromises);

      // 2. Refresh class enrollment counts in database
      // Fetch latest students database to recalculate accurately
      const allStudentsLatest = await getStudents();
      const classStudentsCount: Record<string, number> = {};
      allStudentsLatest.forEach(s => {
        if (s.status === 'Đang Học') {
          classStudentsCount[s.grade] = (classStudentsCount[s.grade] || 0) + 1;
        }
      });

      const classesUpdatePromises = dbClasses.map(cls => {
        const newCount = classStudentsCount[cls.name] || 0;
        if (cls.currentCount !== newCount) {
          return saveClassOnly({
            ...cls,
            currentCount: newCount,
            academicYear: transitionYear
          });
        }
        return Promise.resolve();
      });
      await Promise.all(classesUpdatePromises);

      // Save system active year to local storage to simulate complete year rollover
      localStorage.setItem('active_academic_year_name', 'Năm học ' + transitionYear);
      window.dispatchEvent(new Event('term-changed'));

      setIsPromotionCompleted(false);
      setIsGraduationCompleted(false);

      showToast(`🎉 Kết chuyển thành công! Đã kết chuyển lên lớp ${countPromoted} HS, giữ lại ${countRetained} HS và tốt nghiệp ${countGraduated} HS khối 5.`);
      setIsConfirmModalOpen(false);
      
      // Reload page data to reflect new state
      await loadData();
      setActiveTab('review');
      setActiveMainTab('promotion');
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi trong quá trình kết chuyển năm học.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-[#f5f8fc] border border-[#b8c6d9] px-6 py-3 rounded-2xl shadow-lg flex items-center font-bold text-xs uppercase tracking-wider animate-in fade-in duration-300">
          <Check className="w-4 h-4 mr-2 text-green-400" /> {toast}
        </div>
      )}

      {/* Background radial highlights */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Xét Lên Lớp & Kết Chuyển Năm Học</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">Lập kế hoạch rollover niên khóa, phân lớp học sinh khối 1-4 & xét hoàn thành chương trình khối 5</p>
          </div>
          <button
            onClick={() => setIsConfirmModalOpen(true)}
            disabled={!(isPromotionCompleted && isGraduationCompleted) || stats.summerPending > 0}
            className={`mt-4 sm:mt-0 flex items-center gap-1.5 px-6 py-3 text-xs uppercase tracking-widest font-bold transition shadow-[2px_2px_0px_#131a25] active:shadow-none active:translate-y-1 rounded-full cursor-pointer border ${
              (!(isPromotionCompleted && isGraduationCompleted) || stats.summerPending > 0)
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none active:translate-y-0'
                : 'bg-[#2c5ea0] text-[#f5f8fc] border-[#5a2c2c] hover:bg-[#5a2c2c]'
            }`}
            title={
              stats.summerPending > 0 
                ? "Phải duyệt hết kết quả học sinh ôn hè trước khi khóa sổ" 
                : !(isPromotionCompleted && isGraduationCompleted)
                ? "Phải Khóa & Xác nhận Hoàn thành cả hai tab Lên lớp và Tốt nghiệp trước"
                : "Tiến hành chốt học vụ kết chuyển"
            }
          >
            <Lock className="w-4 h-4" /> Hoàn tất Kết chuyển
          </button>
        </div>

        {/* Main Tab Layout */}
        <div className="flex border-b-[3px] border-double border-[#b8c6d9] mb-6 gap-2 shrink-0">
          <button
            onClick={() => setActiveMainTab('promotion')}
            className={`px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all border-b-2 -mb-[3px] flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'promotion'
                ? 'border-[#2c5ea0] text-[#2c5ea0]'
                : 'border-transparent text-[#4a5568] hover:text-[#2c5ea0]'
            }`}
          >
            <span>1. Lên lớp (Khối 1 - 4)</span>
            {isPromotionCompleted && <span className="text-green-600 font-bold">✓</span>}
          </button>
          <button
            onClick={() => setActiveMainTab('graduation')}
            className={`px-6 py-3 text-xs uppercase tracking-widest font-bold transition-all border-b-2 -mb-[3px] flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'graduation'
                ? 'border-[#2c5ea0] text-[#2c5ea0]'
                : 'border-transparent text-[#4a5568] hover:text-[#2c5ea0]'
            }`}
          >
            <span>2. Tốt nghiệp (Khối 5)</span>
            {isGraduationCompleted && <span className="text-green-600 font-bold">✓</span>}
          </button>
        </div>

        {activeMainTab === 'promotion' && (
          <>
            {/* Status lock bar */}
            <div className="mb-4 bg-[#e8eef6] p-4 border border-[#b8c6d9] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {isPromotionCompleted ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e] shrink-0"></span>
                    <span className="text-xs font-bold text-green-700">Đã khóa kết quả xét lên lớp (Khối 1 - 4)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b] shrink-0"></span>
                    <span className="text-xs font-bold text-amber-700">Đang xét duyệt lên lớp (Khối 1 - 4)</span>
                  </>
                )}
              </div>
              <div>
                {isPromotionCompleted ? (
                  <button
                    onClick={() => setIsPromotionCompleted(false)}
                    className="px-4 py-2 bg-white text-[#2c5ea0] border border-[#b8c6d9] text-[10px] uppercase tracking-wider font-bold hover:bg-[#e8eef6] transition rounded-full cursor-pointer"
                  >
                    Mở khóa Xét lên lớp
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPromotionCompleted(true)}
                    className="px-4 py-2 bg-[#2c5ea0] text-white border border-[#5a2c2c] text-[10px] uppercase tracking-wider font-bold hover:bg-[#5a2c2c] transition rounded-full cursor-pointer shadow-sm"
                  >
                    Khóa & Xác nhận Hoàn thành
                  </button>
                )}
              </div>
            </div>

            <div className={`flex flex-col lg:flex-row gap-8 items-start min-h-0 ${isPromotionCompleted ? 'opacity-60 pointer-events-none' : ''}`}>
          
          {/* LEFT SIDEBAR NAVIGATION */}
          <div className="w-full lg:w-72 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] p-4 shadow-[4px_4px_0px_#dce4ee] shrink-0 rounded-2xl">
            <h4 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-3 px-2 border-b border-[#dce4ee] pb-1">Các bước kết chuyển</h4>
            <div className="space-y-1.5">
              <button
                onClick={() => {
                  setActiveTab('review');
                  setStatusFilter('All');
                }}
                className={`w-full flex items-center px-4 py-3 text-xs font-bold transition-all rounded-full cursor-pointer ${
                  activeTab === 'review' 
                    ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' 
                    : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'
                }`}
              >
                <Clock className="w-4 h-4 mr-2 text-[#2c5ea0]" />
                1. Đề xuất cuối năm
              </button>
              
              <button
                onClick={() => {
                  setActiveTab('summer');
                  setStatusFilter('All');
                }}
                className={`w-full flex items-center px-4 py-3 text-xs font-bold transition-all rounded-full cursor-pointer relative ${
                  activeTab === 'summer' 
                    ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' 
                    : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'
                }`}
              >
                <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
                2. Ôn tập & Rèn luyện hè
                {stats.summerPending > 0 && (
                  <span className="absolute right-3 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                    {stats.summerPending}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setActiveTab('placement');
                  setStatusFilter('All');
                }}
                className={`w-full flex items-center px-4 py-3 text-xs font-bold transition-all rounded-full cursor-pointer ${
                  activeTab === 'placement' 
                    ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' 
                    : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 mr-2 text-green-600" />
                3. Xếp lớp năm học mới
              </button>
            </div>
            
            <div className="mt-8 bg-[#e8eef6] p-4 border border-[#b8c6d9] rounded-xl text-[11px] text-[#4a5568] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#2c5ea0]">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Nghiệp vụ cốt lõi:</span>
              </div>
              <p className="leading-relaxed">
                Đánh giá điều kiện lên lớp dựa vào thông tư 22 (Điểm TB các môn, Rèn luyện và Nghỉ học dưới 45 ngày). Học sinh thi lại/rèn luyện hè đạt yêu cầu sẽ được chuyển đổi trạng thái thành công.
              </p>
            </div>
          </div>

          {/* RIGHT MAIN CONTAINER */}
          <div className="flex-1 w-full bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col rounded-3xl overflow-hidden min-h-[550px]">
            
            {/* Toolbar Filter */}
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
               <h3 className="font-bold text-[#2c5ea0] uppercase tracking-widest text-xs flex items-center">
                 <TrendingUp className="w-4 h-4 mr-2" />
                 {activeTab === 'review' && 'TỔNG HỢP & XÉT DUYỆT TỰ ĐỘNG CUỐI NĂM'}
                 {activeTab === 'summer' && 'DANH SÁCH RÈN LUYỆN & KIỂM TRA LẠI TRONG HÈ'}
                 {activeTab === 'placement' && 'THIẾT LẬP MAPPING & PHÂN BỔ LỚP MỚI'}
               </h3>
               
               <div className="flex flex-wrap items-center gap-3">
                  {/* Search bar */}
                  {activeTab !== 'placement' && (
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm học sinh, mã số..."
                        className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[180px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                      />
                    </div>
                  )}
                  
                  {/* Grade filter */}
                  {activeTab !== 'placement' && (
                    <select
                      value={gradeFilter}
                      onChange={e => setGradeFilter(e.target.value as any)}
                      className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full cursor-pointer"
                    >
                      <option value="All">Tất cả Khối</option>
                      <option value="1">Khối 1</option>
                      <option value="2">Khối 2</option>
                      <option value="3">Khối 3</option>
                      <option value="4">Khối 4</option>
                    </select>
                  )}

                  {/* Recommendation status filter */}
                  {activeTab === 'review' && (
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full cursor-pointer"
                    >
                      <option value="All">Tất cả đề xuất</option>
                      <option value="Được lên lớp thẳng">Lên lớp thẳng</option>
                      <option value="Kiểm tra lại trong hè">Kiểm tra hè (Học tập)</option>
                      <option value="Rèn luyện lại trong hè">Rèn luyện hè (Hạnh kiểm)</option>
                      <option value="Ở lại lớp (Lưu ban)">Ở lại lớp (Lưu ban)</option>
                    </select>
                  )}

                  {/* Summer status filter */}
                  {activeTab === 'summer' && (
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full cursor-pointer"
                    >
                      <option value="All">Tất cả quyết định</option>
                      <option value="Chờ duyệt">Chờ duyệt (Chưa ôn xong)</option>
                      <option value="Được lên lớp">Được lên lớp (Đạt sau hè)</option>
                      <option value="Ở lại lớp">Ở lại lớp (Không đạt)</option>
                    </select>
                  )}
               </div>
            </div>

            {/* TAB CONTENT COMPONENT RENDER */}
            <div className="flex-1 overflow-auto w-full p-6">
              {loading ? (
                <div className="h-full w-full flex flex-col items-center justify-center py-20 bg-[#f5f8fc]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5ea0]"></div>
                  <p className="mt-3 text-xs font-bold text-[#7b8a9e] uppercase tracking-widest animate-pulse">Đang nạp cơ sở dữ liệu học vụ...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: ANNUAL EVALUATION & DECI_STATUS RECOMMEND */}
                  {activeTab === 'review' && (
                    <div className="space-y-6">
                      
                      {/* Alert banner for accidental promo (Cohort 2025 in Grade 12) */}
                      {accidentalStudents.length > 0 && (
                        <div className="bg-[#fdf3f2] border-[2px] border-[#ebd1cf] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
                          <div className="flex gap-3 items-start">
                            <ShieldAlert className="w-5 h-5 text-[#2c5ea0] mt-0.5 shrink-0 animate-bounce" />
                            <div>
                              <h4 className="font-bold text-[#2c5ea0] text-sm">Phát hiện sự cố kết chuyển nhầm</h4>
                              <p className="text-xs text-[#4a5568] mt-1 leading-relaxed">
                                Phát hiện có <strong>{accidentalStudents.length}</strong> học sinh thuộc niên khóa 2025 (mã HS2025) đang bị xếp nhầm ở khối 5 (ví dụ: {accidentalStudents.slice(0, 3).map(s => `${s.name} - lớp ${s.grade}`).join(', ')}). 
                                Bạn có thể dễ dàng sửa chữa bằng cách bấm nút khôi phục các em về khối 2 đúng lớp ban đầu.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRevertPromotion}
                            disabled={processing}
                            className="px-5 py-2.5 bg-[#2c5ea0] hover:bg-[#633030] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow transition-all shrink-0 disabled:opacity-50 cursor-pointer"
                          >
                            {processing ? 'Đang khôi phục...' : 'Khôi phục về Khối 2'}
                          </button>
                        </div>
                      )}
                      
                      {/* Stats cards block */}
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                          <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Tổng học sinh Khối 1 - 4</p>
                          <p className="text-2xl font-serif font-bold text-[#1e2a3a] mt-1">{stats.total}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm border-l-4 border-l-green-600">
                          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Lên lớp thẳng</p>
                          <p className="text-2xl font-serif font-bold text-green-700 mt-1">{stats.straightPromotion}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Kiểm tra lại (Học tập)</p>
                          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">{stats.retest}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm border-l-4 border-l-indigo-500">
                          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Rèn luyện lại (Hạnh kiểm)</p>
                          <p className="text-2xl font-serif font-bold text-indigo-700 mt-1">{stats.retrain}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm border-l-4 border-l-rose-600">
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Ở lại lớp (Lưu ban)</p>
                          <p className="text-2xl font-serif font-bold text-rose-700 mt-1">{stats.stayback}</p>
                        </div>
                      </div>

                      {/* Bulk actions strip */}
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-amber-900 leading-normal">
                          <HelpCircle className="w-5 h-5 text-amber-700 shrink-0" />
                          <span>Hệ thống tự động đề xuất dựa trên quy tắc chuyên cần và điểm tổng kết cuối năm học. Nhấp phê duyệt hàng loạt để chốt nhanh nhóm đủ điều kiện lên lớp.</span>
                        </div>
                        <button
                          onClick={handleBulkApprove}
                          className="px-4 py-2 bg-[#2e6b8a] text-white border border-[#1e4f6a] text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#1e4f6a] cursor-pointer shadow-sm active:translate-y-0.5"
                        >
                          Phê duyệt lên lớp thẳng
                        </button>
                      </div>

                      {/* Main Table */}
                      <div className="bg-white border border-[#b8c6d9] rounded-xl overflow-x-auto shadow-inner">
                        <table className="w-full min-w-[950px] text-xs text-left">
                          <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold uppercase tracking-wider text-[#4a5568] text-[10px]">
                            <tr>
                              <th className="px-4 py-3">Mã HS</th>
                              <th className="px-4 py-3">Học sinh</th>
                              <th className="px-4 py-3">Lớp hiện tại</th>
                              <th className="px-4 py-3 text-center">Kết quả học tập</th>
                              <th className="px-4 py-3 text-center">Rèn luyện (Hạnh kiểm)</th>
                              <th className="px-4 py-3 text-center">Nghỉ học</th>
                              <th className="px-4 py-3 text-center">Đề xuất Hệ thống</th>
                              <th className="px-4 py-3 text-center">Trạng thái duyệt</th>
                              <th className="px-4 py-3 text-right">Tác vụ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#dce4ee]">
                            {paginatedStudents.length === 0 ? (
                              <tr>
                                <td colSpan={9} className="p-8 text-center text-sm font-bold text-[#7b8a9e] italic bg-[#f0f4fa]">
                                  Không tìm thấy học sinh nào khớp với điều kiện.
                                </td>
                              </tr>
                            ) : (
                              paginatedStudents.map(s => {
                                return (
                                  <tr key={s.id} className="hover:bg-[#f5f8fc]/50">
                                    <td className="px-4 py-4 font-mono text-[10px] text-[#7b8a9e]">{s.id}</td>
                                    <td className="px-4 py-4 font-bold text-[#1e2a3a]">{s.name}</td>
                                    <td className="px-4 py-4 font-semibold text-[#4a5568]">{s.grade}</td>
                                    <td className="px-4 py-4 text-center">
                                      <div className="space-y-0.5">
                                        <p className="font-semibold text-[#1e2a3a]">GPA: <strong className="font-serif">{s.gpa.toFixed(1)}</strong></p>
                                        <span className={`inline-block px-1.5 py-0.5 text-[9px] rounded font-bold ${
                                          s.academicClass === 'Chưa đạt' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-[#4a5568]'
                                        }`}>{s.academicClass}</span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                                        s.conductClass === 'Chưa đạt' 
                                          ? 'bg-red-50 text-red-700 border border-red-200' 
                                          : 'bg-green-50 text-green-700 border border-green-200'
                                      }`}>
                                        {s.conductClass}
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded font-bold ${
                                        s.absentDays > 45 
                                          ? 'bg-red-50 text-red-700 border border-red-200 animate-pulse' 
                                          : 'bg-gray-100 text-[#4a5568] border border-gray-200'
                                      }`}>
                                        {s.absentDays} ngày
                                      </span>
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      {s.recommendStatus === 'Được lên lớp thẳng' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase">
                                          <CheckCircle2 className="w-3 h-3 mr-1" /> Lên lớp thẳng
                                        </span>
                                      )}
                                      {s.recommendStatus === 'Kiểm tra lại trong hè' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                                          <AlertTriangle className="w-3 h-3 mr-1" /> Thi lại hè
                                        </span>
                                      )}
                                      {s.recommendStatus === 'Rèn luyện lại trong hè' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                                          <Clock className="w-3 h-3 mr-1" /> Rèn luyện hè
                                        </span>
                                      )}
                                      {s.recommendStatus === 'Ở lại lớp (Lưu ban)' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                                          <XCircle className="w-3 h-3 mr-1" /> Lưu ban
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      {s.approved ? (
                                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-green-50 text-green-700 rounded-full border border-green-200">
                                          Đã phê duyệt
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-gray-50 text-gray-500 rounded-full border border-gray-200">
                                          Chờ xem xét
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      {s.recommendStatus === 'Được lên lớp thẳng' ? (
                                        <button
                                          onClick={() => {
                                            setStudents(prev => prev.map(item => 
                                              item.id === s.id 
                                                ? { ...item, approved: !item.approved, decisionStatus: !item.approved ? 'Được lên lớp' : 'Chờ duyệt' } 
                                                : item
                                            ));
                                          }}
                                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                                            s.approved 
                                              ? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50' 
                                              : 'bg-green-600 text-white border-green-700 hover:bg-green-700'
                                          }`}
                                        >
                                          {s.approved ? 'Bỏ duyệt' : 'Duyệt lên lớp'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => {
                                            // Send to summer re-training or stayback approval
                                            setStudents(prev => prev.map(item => {
                                              if (item.id === s.id) {
                                                const nextApproved = !item.approved;
                                                const nextDecision = nextApproved 
                                                  ? (s.recommendStatus === 'Ở lại lớp (Lưu ban)' ? 'Ở lại lớp' : 'Chờ duyệt')
                                                  : 'Chờ duyệt';
                                                return { 
                                                  ...item, 
                                                  approved: nextApproved, 
                                                  decisionStatus: nextDecision as any 
                                                };
                                              }
                                              return item;
                                            }));
                                            showToast(`📂 Đã chuyển đổi trạng thái phê duyệt cho ${s.name}`);
                                          }}
                                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer border transition-colors ${
                                            s.approved 
                                              ? 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50' 
                                              : 'bg-[#2c5ea0] text-white border-[#5a2c2c] hover:bg-[#5a2c2c]'
                                          }`}
                                        >
                                          {s.approved ? 'Hủy chuyển' : s.recommendStatus === 'Ở lại lớp (Lưu ban)' ? 'Duyệt Lưu Ban' : 'Chuyển Ôn Hè'}
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SUMMER RE-ASSESSMENT & TRAINING */}
                  {activeTab === 'summer' && (
                    <div className="space-y-6">
                      
                      {/* Summer stats cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                          <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Tổng học sinh ôn tập hè</p>
                          <p className="text-2xl font-serif font-bold text-[#1e2a3a] mt-1">{summerStudents.length}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm border-l-4 border-l-amber-500">
                          <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Chờ xét duyệt kết quả</p>
                          <p className="text-2xl font-serif font-bold text-amber-700 mt-1">{stats.summerPending}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm border-l-4 border-l-green-600">
                          <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Cứu xét - Được lên lớp</p>
                          <p className="text-2xl font-serif font-bold text-green-700 mt-1">{stats.summerPassed}</p>
                        </div>
                        <div className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm border-l-4 border-l-rose-600">
                          <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Không đạt - Ở lại lớp</p>
                          <p className="text-2xl font-serif font-bold text-rose-700 mt-1">{stats.summerFailed}</p>
                        </div>
                      </div>

                      {/* Summer Table */}
                      <div className="bg-white border border-[#b8c6d9] rounded-xl overflow-x-auto shadow-inner">
                        <table className="w-full min-w-[950px] text-xs text-left">
                          <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold uppercase tracking-wider text-[#4a5568] text-[10px]">
                            <tr>
                              <th className="px-4 py-3">Học sinh</th>
                              <th className="px-4 py-3">Lớp hiện tại</th>
                              <th className="px-4 py-3">Nội dung ôn hè (Thi lại / Rèn luyện)</th>
                              <th className="px-4 py-3 text-center">Kết quả đánh giá hè</th>
                              <th className="px-4 py-3 text-center">Quyết định chốt sau hè</th>
                              <th className="px-4 py-3 text-right">Thao tác lưu nhanh</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#dce4ee]">
                            {paginatedSummerStudents.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="p-8 text-center text-sm font-bold text-[#7b8a9e] italic bg-[#f0f4fa]">
                                  Không có học sinh nào trong danh sách ôn hè hoặc rèn luyện phù hợp.
                                </td>
                              </tr>
                            ) : (
                              paginatedSummerStudents.map(s => {
                                const isRetest = s.recommendStatus === 'Kiểm tra lại trong hè';
                                return (
                                  <tr key={s.id} className="hover:bg-[#f5f8fc]/50">
                                    <td className="px-4 py-4 font-bold text-[#1e2a3a]">
                                      <p>{s.name}</p>
                                      <span className="text-[9px] font-mono text-[#7b8a9e]">{s.id}</span>
                                    </td>
                                    <td className="px-4 py-4 font-semibold text-[#4a5568]">{s.grade}</td>
                                    <td className="px-4 py-4">
                                      {isRetest ? (
                                        <div className="space-y-1">
                                          <p className="font-bold text-[#2c5ea0]">Thi lại môn: {s.reTestSubject}</p>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-gray-500 font-medium">Điểm thi lại:</span>
                                            <input 
                                              type="number"
                                              min="0"
                                              max="10"
                                              step="0.1"
                                              value={s.reTestScore === undefined ? '' : s.reTestScore}
                                              onChange={e => {
                                                const val = e.target.value === '' ? undefined : parseFloat(e.target.value) || 0;
                                                // Auto update decision status
                                                let decision: StudentPromotion['decisionStatus'] = 'Chờ duyệt';
                                                if (val !== undefined) {
                                                  decision = val >= 5.0 ? 'Được lên lớp' : 'Ở lại lớp';
                                                }
                                                setStudents(prev => prev.map(item => 
                                                  item.id === s.id 
                                                    ? { ...item, reTestScore: val, decisionStatus: decision } 
                                                    : item
                                                ));
                                              }}
                                              placeholder="Nhập điểm..."
                                              className="w-16 px-1.5 py-0.5 border border-[#b8c6d9] rounded text-center font-bold text-xs"
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="space-y-1">
                                          <p className="font-bold text-indigo-700">Rèn luyện hạnh kiểm:</p>
                                          <p className="text-[10px] text-gray-600 italic leading-snug">{s.reTrainTask}</p>
                                        </div>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      {isRetest ? (
                                        s.reTestScore === undefined ? (
                                          <span className="text-gray-400 italic">Chưa nhập điểm</span>
                                        ) : s.reTestScore >= 5.0 ? (
                                          <span className="inline-flex px-1.5 py-0.5 bg-green-50 text-green-700 font-bold border border-green-200 rounded">{"ĐẠT (>= 5.0)"}</span>
                                        ) : (
                                          <span className="inline-flex px-1.5 py-0.5 bg-red-50 text-red-700 font-bold border border-red-200 rounded">HỎNG (&lt; 5.0)</span>
                                        )
                                      ) : (
                                        <select
                                          value={s.reTrainEval || 'Chưa đánh giá'}
                                          onChange={e => {
                                            const val = e.target.value as any;
                                            let decision: StudentPromotion['decisionStatus'] = 'Chờ duyệt';
                                            if (val === 'Đạt') decision = 'Được lên lớp';
                                            else if (val === 'Chưa đạt') decision = 'Ở lại lớp';

                                            setStudents(prev => prev.map(item => 
                                              item.id === s.id 
                                                ? { ...item, reTrainEval: val, decisionStatus: decision } 
                                                : item
                                            ));
                                          }}
                                          className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                                        >
                                          <option value="Chưa đánh giá">Chưa đánh giá</option>
                                          <option value="Đạt">Đạt rèn luyện</option>
                                          <option value="Chưa đạt">Chưa đạt yêu cầu</option>
                                        </select>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      <select
                                        value={s.decisionStatus}
                                        onChange={e => {
                                          setStudents(prev => prev.map(item => 
                                            item.id === s.id 
                                              ? { ...item, decisionStatus: e.target.value as any } 
                                              : item
                                          ));
                                        }}
                                        className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                                      >
                                        <option value="Chờ duyệt">Chờ duyệt</option>
                                        <option value="Được lên lớp">Được lên lớp</option>
                                        <option value="Ở lại lớp">Ở lại lớp (Lưu ban)</option>
                                      </select>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                      <button 
                                        onClick={() => showToast(`💾 Đã lưu cục bộ đánh giá hè cho HS ${s.name}!`)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold text-[#2c5ea0] rounded-full cursor-pointer transition-colors shadow-sm"
                                      >
                                        <Save className="w-3.5 h-3.5" /> Ghi nhận
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PLACEMENT & ROLLOVERS */}
                  {activeTab === 'placement' && (
                    <div className="space-y-8">
                      
                      {/* Mapping section wrapper */}
                      <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#dce4ee] pb-3 mb-2">
                          <TrendingUp className="w-5 h-5 text-[#2c5ea0]" />
                          <h4 className="font-serif font-bold text-[#1e2a3a] text-sm">Thiết lập Quy tắc Ánh xạ Lớp học (Khối 1 - 4)</h4>
                        </div>
                        
                        <p className="text-xs text-[#4a5568] leading-normal">
                          Quy định lớp học ánh xạ tự động khi học sinh được duyệt lên lớp. Học sinh của các lớp cũ sẽ được chuyển giao thẳng sang lớp mới tương ứng (Ví dụ lớp 1A1 sẽ được chuyển toàn bộ lên lớp 2A1 của năm học mới).
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                          {Object.keys(classMapping).map(srcClass => (
                            <div key={srcClass} className="flex items-center gap-3 bg-[#f5f8fc] border border-[#b8c6d9] p-3 rounded-xl">
                              <span className="text-xs font-bold text-[#1e2a3a] w-20">Lớp {srcClass}:</span>
                              <ArrowRight className="w-4 h-4 text-[#7b8a9e] shrink-0" />
                              <select
                                value={classMapping[srcClass]}
                                onChange={e => {
                                  setClassMapping(prev => ({
                                    ...prev,
                                    [srcClass]: e.target.value
                                  }));
                                }}
                                className="flex-1 px-3 py-1.5 bg-white border border-[#b8c6d9] rounded-lg text-xs font-bold focus:outline-none cursor-pointer"
                              >
                                <option value="">Chọn lớp đích...</option>
                                {dbClasses.filter(c => c.status === 'Đang hoạt động').map(cls => (
                                  <option key={cls.name} value={cls.name}>Lớp {cls.name} ({cls.academicYear})</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Warnings: Combination change requests */}
                      <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#dce4ee] pb-3 mb-2">
                          <ShieldAlert className="w-5 h-5 text-amber-600" />
                          <h4 className="font-serif font-bold text-[#1e2a3a] text-sm">Cảnh báo Đổi Tổ Hợp Môn Lựa Chọn</h4>
                        </div>
                        
                        <p className="text-xs text-[#4a5568] leading-normal">
                          Những học sinh có đơn xin đổi Tổ hợp môn lựa chọn đã được duyệt. Hệ thống **chặn tự động kết chuyển** và bắt buộc bạn phải bố trí thủ công vào một lớp học mới có tổ hợp tương ứng.
                        </p>

                        <div className="border border-[#b8c6d9] rounded-xl overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase">
                              <tr>
                                <th className="p-3">Học sinh</th>
                                <th className="p-3">Lớp cũ</th>
                                <th className="p-3">Trạng thái cuối hè</th>
                                <th className="p-3">Nguyện vọng môn thay đổi</th>
                                <th className="p-3">Phân bổ lớp năm học mới</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#dce4ee]">
                              {students.filter(s => s.combinationChangeRequested && s.decisionStatus === 'Được lên lớp').length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center italic text-[#7b8a9e]">Không có học sinh đổi tổ hợp môn lựa chọn.</td>
                                </tr>
                              ) : (
                                students.filter(s => s.combinationChangeRequested && s.decisionStatus === 'Được lên lớp').map(s => (
                                  <tr key={s.id} className="hover:bg-[#f0f4fa]">
                                    <td className="p-3 font-bold text-[#1e2a3a]">
                                      {s.name}
                                      <span className="block text-[9px] font-mono font-normal text-[#7b8a9e]">{s.id}</span>
                                    </td>
                                    <td className="p-3 font-semibold text-[#4a5568]">{s.grade}</td>
                                    <td className="p-3">
                                      <span className="inline-flex px-1.5 py-0.5 bg-green-50 text-green-700 font-bold rounded">Lên lớp</span>
                                    </td>
                                    <td className="p-3">
                                      <span className="inline-flex px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded font-bold text-[10px]">
                                        Chuyển: Hóa, Sinh ➔ Lịch sử, Địa lý
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <select
                                        value={s.targetClass || ''}
                                        onChange={e => {
                                          setStudents(prev => prev.map(item => 
                                            item.id === s.id 
                                              ? { ...item, targetClass: e.target.value } 
                                              : item
                                          ));
                                          showToast(`📂 Đã đổi lớp phân bổ năm sau của ${s.name} thành ${e.target.value}`);
                                        }}
                                        className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                                      >
                                        <option value="">Chọn lớp mới...</option>
                                        {dbClasses.filter(c => c.status === 'Đang hoạt động').map(cls => (
                                          <option key={cls.name} value={cls.name}>Lớp {cls.name} ({cls.academicYear})</option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Retained (Lưu ban) students class layout */}
                      <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-sm space-y-4">
                        <div className="flex items-center gap-2 border-b border-[#dce4ee] pb-3 mb-2">
                          <XCircle className="w-5 h-5 text-rose-600" />
                          <h4 className="font-serif font-bold text-[#1e2a3a] text-sm">Bố Trí Học Sinh Lưu Ban (Ở Lại Lớp)</h4>
                        </div>
                        
                        <p className="text-xs text-[#4a5568] leading-normal">
                          Các học sinh không đạt điều kiện sau hè sẽ bị Lưu ban (ở lại lớp). Hãy xếp các em vào các lớp học khối dưới trong năm học mới.
                        </p>

                        <div className="border border-[#b8c6d9] rounded-xl overflow-hidden">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase">
                              <tr>
                                <th className="p-3">Học sinh</th>
                                <th className="p-3">Lớp cũ</th>
                                <th className="p-3">Lý do lưu ban</th>
                                <th className="p-3">Ghép vào lớp mới của khối</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#dce4ee]">
                              {students.filter(s => s.decisionStatus === 'Ở lại lớp').length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center italic text-[#7b8a9e]">Không có học sinh lưu ban.</td>
                                </tr>
                              ) : (
                                students.filter(s => s.decisionStatus === 'Ở lại lớp').map(s => (
                                  <tr key={s.id} className="hover:bg-[#f0f4fa]">
                                    <td className="p-3 font-bold text-[#1e2a3a]">
                                      {s.name}
                                      <span className="block text-[9px] font-mono font-normal text-[#7b8a9e]">{s.id}</span>
                                    </td>
                                    <td className="p-3 font-semibold text-[#4a5568]">{s.grade}</td>
                                    <td className="p-3">
                                      <span className="font-bold text-rose-600">
                                        {s.absentDays > 45 ? 'Nghỉ học > 45 ngày' : 'Điểm thi hè không đạt'}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <select
                                        value={s.targetClass || ''}
                                        onChange={e => {
                                          setStudents(prev => prev.map(item => 
                                            item.id === s.id 
                                              ? { ...item, targetClass: e.target.value } 
                                              : item
                                          ));
                                          showToast(`📂 Đã chọn lớp lưu ban năm học sau cho ${s.name} là ${e.target.value}`);
                                        }}
                                        className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold focus:outline-none cursor-pointer"
                                      >
                                        <option value="">Chọn lớp học lại...</option>
                                        {dbClasses.filter(c => c.status === 'Đang hoạt động').map(cls => (
                                          <option key={cls.name} value={cls.name}>Lớp {cls.name} ({cls.academicYear})</option>
                                        ))}
                                      </select>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                    </div>
                  )}
                </>
              )}
            </div>

            {/* Pagination Footer */}
            {!loading && activeTab !== 'placement' && (
              <div className="px-8 py-4 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10 rounded-b-[21px]">
                <Pagination
                  currentPage={currentPage}
                  totalPages={activeTab === 'review' ? Math.ceil(filteredStudents.length / pageSize) : Math.ceil(filteredSummerStudents.length / pageSize)}
                  onPageChange={setCurrentPage}
                  totalItems={activeTab === 'review' ? filteredStudents.length : filteredSummerStudents.length}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>

        </div>
          </>
        )}

        {activeMainTab === 'graduation' && (
          <>
            {/* Status lock bar */}
            <div className="mb-4 bg-[#e8eef6] p-4 border border-[#b8c6d9] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                {isGraduationCompleted ? (
                  <>
                    <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e] shrink-0"></span>
                    <span className="text-xs font-bold text-green-700">Đã khóa kết quả xét hoàn thành chương trình (Khối 5)</span>
                  </>
                ) : (
                  <>
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-[0_0_8px_#f59e0b] shrink-0"></span>
                    <span className="text-xs font-bold text-amber-700">Đang xét duyệt tốt nghiệp (Khối 5)</span>
                  </>
                )}
              </div>
              <div>
                {isGraduationCompleted ? (
                  <button
                    onClick={() => setIsGraduationCompleted(false)}
                    className="px-4 py-2 bg-white text-[#2c5ea0] border border-[#b8c6d9] text-[10px] uppercase tracking-wider font-bold hover:bg-[#e8eef6] transition rounded-full cursor-pointer"
                  >
                    Mở khóa Xét hoàn thành chương trình
                  </button>
                ) : (
                  <button
                    onClick={() => setIsGraduationCompleted(true)}
                    className="px-4 py-2 bg-[#2c5ea0] text-white border border-[#5a2c2c] text-[10px] uppercase tracking-wider font-bold hover:bg-[#5a2c2c] transition rounded-full cursor-pointer shadow-sm"
                  >
                    Khóa & Xác nhận Hoàn thành
                  </button>
                )}
              </div>
            </div>
            {/* Embedded Graduation Panel */}
            <div className={isGraduationCompleted ? 'opacity-60 pointer-events-none' : ''}>
              <GraduationPanel isEmbedded={true} isLocked={isGraduationCompleted} />
            </div>
          </>
        )}
      </div>

      {/* CONFIRMATION TRANSITION LOCK MODAL */}
      <ModalBase
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Xác Nhận Khóa Sổ & Kết Chuyển Năm Học"
        subtitle="Quy trình cán mốc niên khóa cực kỳ quan trọng"
        width="max-w-xl"
      >
        <div className="p-8 space-y-6 bg-[#f5f8fc] text-[#1e2a3a] text-xs leading-relaxed">
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold uppercase tracking-wider">Hành động không thể đảo ngược</p>
              <p className="mt-1">
                Khi thực hiện Kết chuyển niên khóa, hệ thống sẽ tự động cập nhật toàn bộ cơ sở dữ liệu học sinh lên khối mới và niên khóa mới. Dữ liệu học tập và học bạ của năm học cũ sẽ chính thức được khóa băng để đảm bảo tính minh chứng học vụ.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h5 className="font-bold uppercase tracking-wider text-[#2c5ea0]">Số liệu kết chuyển dự kiến:</h5>
            <table className="w-full border-collapse border border-[#b8c6d9]">
              <tbody>
                <tr className="bg-[#e8eef6] border-b border-[#b8c6d9]">
                  <td className="p-2.5 font-bold">Trạng thái</td>
                  <td className="p-2.5 text-center font-bold">Số lượng học sinh</td>
                </tr>
                <tr className="border-b border-[#dce4ee]">
                  <td className="p-2.5">Được lên lớp thẳng (Khối 1 - 4)</td>
                  <td className="p-2.5 text-center font-serif font-bold text-green-700">{stats.straightPromotion}</td>
                </tr>
                <tr className="border-b border-[#dce4ee]">
                  <td className="p-2.5">Đạt yêu cầu sau hè (Được lên lớp)</td>
                  <td className="p-2.5 text-center font-serif font-bold text-green-700">{stats.summerPassed}</td>
                </tr>
                <tr className="border-b border-[#dce4ee]">
                  <td className="p-2.5">Lưu ban / Ở lại lớp (Nghỉ học hoặc thi lại hỏng)</td>
                  <td className="p-2.5 text-center font-serif font-bold text-rose-700">{stats.stayback + stats.summerFailed}</td>
                </tr>
                <tr>
                  <td className="p-2.5">Hoàn tất hoàn thành chương trình ra trường (Khối 5)</td>
                  <td className="p-2.5 text-center font-serif font-bold text-indigo-700">
                    {JSON.parse(localStorage.getItem('graduation_students') || '[]').filter((item: any) => item.outcome === 'Đỗ Tốt nghiệp' || item.outcome === 'Đặc cách').length}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block">Năm học mới kích hoạt</label>
            <input 
              type="text" 
              value={transitionYear}
              onChange={e => setTransitionYear(e.target.value)}
              placeholder="Ví dụ: 2026 - 2027"
              className="w-full px-4 py-2 bg-white border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] rounded-xl"
            />
          </div>
        </div>

        {/* Modal controls */}
        <div className="p-8 pt-4 border-t border-dashed border-[#b8c6d9] flex justify-between items-center bg-[#f5f8fc] shrink-0 rounded-b-3xl">
          <button 
            type="button" 
            onClick={() => setIsConfirmModalOpen(false)}
            disabled={processing}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button 
            type="button"
            onClick={executeTransition}
            disabled={processing}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#2c5ea0] text-[#f5f8fc] border border-[#5a2c2c] text-xs uppercase tracking-widest font-bold hover:bg-[#5a2c2c] transition shadow-[2px_2px_0px_#131a25] active:shadow-none active:translate-y-1 rounded-full cursor-pointer disabled:opacity-50"
          >
            Khóa sổ kết chuyển
          </button>
        </div>
      </ModalBase>
    </main>
  );
};
