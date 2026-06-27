import React, { useState, useEffect, useCallback } from 'react';
import { Filter, Plus, Search, User, Clock, BookOpen, Shield, CheckSquare, Award, X, Edit, ShieldAlert, Check, Printer, FileText, FileDown, RefreshCw, LogIn, Sparkles, Trash2, Upload } from 'lucide-react';
import { StudentTableSkeleton } from '../ui/Skeletons';
import { StudentWizardModal, AttendanceModal, GradesModal, ConductModal, ExcelImportModal, GradeExcelImportModal } from '../ui/StudentsModals';
import { ExportModal } from '../ui/ExportModal';
import { BaseSelect, BaseDatePicker, FilterSelect } from '../ui/BaseInputs';
import { ActionMenu } from '../ui/ActionMenu';
import { ModalBase } from '../ui/Modals';
import { PrintableReportCard, ReportCardData } from '../ui/PrintableReportCard';
import { PrintableContactBook, ContactBookData } from '../ui/PrintableContactBook';
import { printElement } from '../../utils/printHelper';
import { ExportColumn } from '../../utils/exportHelper';
import { getStudents, updateStudent, deleteStudent, Student } from '../../services/studentService';
import { auth, loginWithGoogle } from '../../services/firebase';
import { Pagination } from '../ui/Pagination';
import { getAllReportCards, saveReportCard, ReportCardDocument } from '../../services/reportCardService';
import { useUserRole } from '../../utils/role';

const GVCN_MAP: Record<string, string> = {
  '1A1': 'Cô Lê Thị Thảo',
  '1A5': 'Thầy Nguyễn Trọng Hoàng',
  '11B2': 'Cô Phạm Hồng Đào',
};

export const StudentsPanel: React.FC = () => {
  const currentRole = useUserRole();
  const [activeTab, setActiveTab] = useState<'profiles' | 'attendance' | 'grades' | 'conduct'>('profiles');
  const [modalOpen, setModalOpen] = useState<'profiles' | 'attendance' | 'grades' | 'conduct' | null>(null);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showGradeExcelImport, setShowGradeExcelImport] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // State for students list (Real & Fallback Data)
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, gradeFilter]);

  // Adjust active tab when role changes to avoid unauthorized tabs
  useEffect(() => {
    if (currentRole === 'subject_teacher' && (activeTab === 'attendance' || activeTab === 'conduct')) {
      setActiveTab('profiles');
    } else if (currentRole === 'activities_head' && (activeTab === 'attendance' || activeTab === 'grades')) {
      setActiveTab('profiles');
    }
  }, [currentRole, activeTab]);

  const filteredStudents = students.filter(student => {
    if (student.grade === 'Đã tốt nghiệp') return false;

    // Phân quyền theo vai trò
    if (currentRole === 'homeroom_teacher') {
      // Chỉ xem lớp chủ nhiệm 10A1
      if (student.grade !== '1A1') return false;
    } else if (currentRole === 'subject_teacher') {
      // Chỉ xem các lớp được phân công dạy (Ví dụ: 10A1 và 10A5)
      if (student.grade !== '1A1' && student.grade !== '1A5') return false;
    }

    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          student.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === 'All' || student.grade === gradeFilter;
    return matchesSearch && matchesGrade;
  });


  const totalPages = Math.ceil(filteredStudents.length / pageSize);
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Monitor Auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch real students from Firebase
  const loadStudents = async () => {
    if (!auth.currentUser) {
      setStudents([]);
      setLoading(false);
      setIsError(false);
      setErrorNotice(null);
      return;
    }
    setLoading(true);
    setErrorNotice(null);
    setIsError(false);
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (err: any) {
      console.error("Firebase fetch error, using local fallback state", err);
      setIsError(true);
      setErrorNotice('Không thể tải dữ liệu thời gian thực từ Cloud Firestore. Hệ thống đang sử dụng dữ liệu đệm ngoại tuyến.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [activeTab, currentUser]);

  const handleRefresh = () => {
    loadStudents();
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      loadStudents();
    } catch (err) {
      alert("Đăng nhập thất bại. Vui lòng thử lại!");
    }
  };

  // New Print Center states
  const [selectedPrintStudent, setSelectedPrintStudent] = useState<Student | null>(null);
  const [selectedPrintType, setSelectedPrintType] = useState<'học-bạ' | 'sổ-liên-lạc'>('học-bạ');
  const [showPrintCenter, setShowPrintCenter] = useState(false);
  const [listSemester, setListSemester] = useState('Học Kỳ II');
  const [printSemester, setPrintSemester] = useState('Học Kỳ II');

  // State for selected student in grades modal
  const [selectedGradeStudent, setSelectedGradeStudent] = useState<Student | null>(null);

  // Firestore-backed report cards cache
  const [reportCardsCache, setReportCardsCache] = useState<Map<string, ReportCardDocument>>(new Map());

  const loadReportCards = useCallback(async () => {
    try {
      const allCards = await getAllReportCards();
      const cacheMap = new Map<string, ReportCardDocument>();
      allCards.forEach(card => cacheMap.set(card.id, card));
      setReportCardsCache(cacheMap);
    } catch (error) {
      console.error('Failed to load report cards from Firestore:', error);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadReportCards();
    }
  }, [currentUser, loadReportCards]);

  // Listen for grades-updated event to reload cache
  useEffect(() => {
    const handler = () => loadReportCards();
    window.addEventListener('grades-updated', handler);
    return () => window.removeEventListener('grades-updated', handler);
  }, [loadReportCards]);

  // Helper generators for high-fidelity printable data
  const getReportCardData = (student: Student, semester: string = 'Học Kỳ II'): ReportCardData => {
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

    const gvcn = GVCN_MAP[student.grade] || 'Cô Lê Thị Thảo';

    if (semester === 'Cả Năm') {
      // Cả Năm: average HKI and HKII from saved data
      const rc1 = getReportCardData(student, 'Học Kỳ I');
      const rc2 = getReportCardData(student, 'Học Kỳ II');

      const scores = rc1.scores.map((s1, idx) => {
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

    // HKI or HKII with no saved data: return blank scores (all zeros)
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

  const getContactBookData = (student: Student, semester: string = 'Học Kỳ II'): ContactBookData => {
    const rc = getReportCardData(student, semester);

    return {
      id: student.id,
      name: student.name,
      dob: student.dob,
      gender: student.gender,
      grade: student.grade,
      track: '',
      gvcn: rc.gvcn,
      academicYear: '2025-2026',
      weeklyOffenses: student.id === 'MN2025.002' ? 'Bé ăn còn hơi chậm, cần cô dỗ dành thêm' : 'Chăm ngoan, biết vâng lời cô, tự giác cất dọn đồ chơi',
      weeklyRewards: 'Đạt danh hiệu Bé Ngoan của tuần',
      moralConduct: 'Đạt Bé Ngoan',
      averageScore: rc.summary.gpa,
      subjectAverages: rc.scores.slice(0, 5).map(s => {
        const isNum = typeof s.average === 'number';
        return {
          subject: s.subject,
          score: typeof s.average === 'number' ? s.average : 0,
          status: isNum 
            ? ((s.average as number) >= 8.0 ? 'Đạt loại Giỏi' : 'Đạt yêu cầu') 
            : (s.average === 'Đạt' ? 'Đạt yêu cầu' : 'Chưa đạt yêu cầu')
        };
      }),
      comments: rc.summary.generalComment
    };
  };

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'read' | 'edit'>('read');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Local edit states
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editGrade, setEditGrade] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGuardian, setEditGuardian] = useState('');

  const openDrawer = (student: Student, mode: 'read' | 'edit') => {
    setSelectedStudent(student);
    setDrawerMode(mode);
    setEditName(student.name);
    setEditDob(student.dob);
    setEditGender(student.gender);
    setEditGrade(student.grade);
    setEditPhone(student.phone);
    setEditAddress(student.address);
    setEditGuardian(student.guardian);
    setDrawerOpen(true);
  };

  const handleSaveDrawer = async () => {
    if (!selectedStudent) return;
    
    const updatedFields: Partial<Student> = {
      name: editName,
      dob: editDob,
      gender: editGender,
      grade: editGrade,
      phone: editPhone,
      address: editAddress,
      guardian: editGuardian,
    };

    // Optimistic local update
    setStudents(prev => prev.map(s => {
      if (s.id === selectedStudent.id) {
        return { ...s, ...updatedFields };
      }
      return s;
    }));

    try {
      await updateStudent(selectedStudent.id, updatedFields);
    } catch (err: any) {
      console.error(err);
      alert('Không thể lưu cập nhật lên Firebase Firestore (Cần phân quyền hoặc kết nối mạng). Dữ liệu đã đổi tạm thời trên giao diện.');
    }

    setDrawerOpen(false);
    setSelectedStudent(null);
  };

  const toggleDeactivateStatus = async (id: string) => {
    const target = students.find(s => s.id === id);
    if (!target) return;

    const nextStatus = target.status === 'Đang Học' ? 'Đình Chỉ' : 'Đang Học';

    // Optimistic local update
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: nextStatus };
      }
      return s;
    }));

    try {
      await updateStudent(id, { status: nextStatus });
    } catch (err: any) {
      console.error(err);
      alert('Không thể lưu cập nhật trạng thái lên Firebase Firestore.');
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ học sinh này? Hành động này không thể hoàn tác.')) {
      return;
    }

    // Optimistic local update
    setStudents(prev => prev.filter(s => s.id !== id));

    try {
      await deleteStudent(id);
    } catch (err: any) {
      console.error(err);
      alert('Không thể xóa hồ sơ học sinh trên Firebase.');
    }
  };

  // Export columns definitions
  const getExportColumns = (tab: 'profiles' | 'attendance' | 'grades' | 'conduct'): ExportColumn[] => {
    switch (tab) {
      case 'profiles':
        return [
          { key: 'id', label: 'Mã Học Sinh', getValue: (row: Student) => row.id },
          { key: 'name', label: 'Họ và Tên', getValue: (row: Student) => row.name },
          { key: 'dob', label: 'Ngày Sinh', getValue: (row: Student) => row.dob },
          { key: 'gender', label: 'Giới Tính', getValue: (row: Student) => row.gender },
          { key: 'grade', label: 'Lớp Học', getValue: (row: Student) => row.grade },
          { key: 'status', label: 'Trạng Thái', getValue: (row: Student) => row.status },
          { key: 'guardian', label: 'Phụ Huynh/Giám Hộ', getValue: (row: Student) => row.guardian },
          { key: 'phone', label: 'Điện Thoại Liên Hệ', getValue: (row: Student) => row.phone },
          { key: 'address', label: 'Địa Chỉ', getValue: (row: Student) => row.address },
          { key: 'cccd', label: 'CCCD', getValue: (row: Student) => row.cccd || '' },
          { key: 'ethnicity', label: 'Dân Tộc', getValue: (row: Student) => row.ethnicity || '' },
        ];
      case 'attendance':
        return [
          { key: 'name', label: 'Họ và Tên', getValue: (row: Student) => row.name },
          { key: 'id', label: 'Mã Học Sinh', getValue: (row: Student) => row.id },
          { key: 'grade', label: 'Lớp Học', getValue: (row: Student) => row.grade },
          { key: 'daysAbsent', label: 'Tổng Ngày Vắng', getValue: (row: any) => row.daysAbsent || 0 },
          { key: 'daysAbsentExcused', label: 'Vắng Có Phép', getValue: (row: any) => row.daysAbsentExcused || 0 },
          { key: 'daysAbsentUnexcused', label: 'Vắng Không Phép', getValue: (row: any) => (row.daysAbsent || 0) - (row.daysAbsentExcused || 0) },
        ];
      case 'grades':
        return [
          { key: 'name', label: 'Họ và Tên', getValue: (row: Student) => row.name },
          { key: 'id', label: 'Mã Học Sinh', getValue: (row: Student) => row.id },
          { key: 'grade', label: 'Lớp Học', getValue: (row: Student) => row.grade },
          { key: 'math', label: 'Toán', getValue: (row: any) => row.mathScore || '' },
          { key: 'literature', label: 'Ngữ Văn', getValue: (row: any) => row.literatureScore || '' },
          { key: 'english', label: 'Tiếng Anh', getValue: (row: any) => row.englishScore || '' },
          { key: 'history', label: 'Lịch Sử', getValue: (row: any) => row.historyScore || '' },
          { key: 'geography', label: 'Địa Lý', getValue: (row: any) => row.geographyScore || '' },
          { key: 'physics', label: 'Vật Lý', getValue: (row: any) => row.physicsScore || '' },
          { key: 'chemistry', label: 'Hóa Học', getValue: (row: any) => row.chemistryScore || '' },
          { key: 'biology', label: 'Sinh Học', getValue: (row: any) => row.biologyScore || '' },
          { key: 'gpa', label: 'Điểm TB', getValue: (row: any) => row.gpa || '' },
        ];
      case 'conduct':
        return [
          { key: 'name', label: 'Họ và Tên', getValue: (row: Student) => row.name },
          { key: 'id', label: 'Mã Học Sinh', getValue: (row: Student) => row.id },
          { key: 'grade', label: 'Lớp Học', getValue: (row: Student) => row.grade },
          { key: 'moralConduct', label: 'Hạnh Kiểm', getValue: (row: any) => row.moralConduct || '' },
        ];
    }
  };

  // Get export data based on active tab
  const getExportData = () => {
    const baseData = filteredStudents;
    
    if (activeTab === 'attendance') {
      return baseData.map(student => ({
        ...student,
        daysAbsent: getReportCardData(student).summary.daysAbsent,
        daysAbsentExcused: getReportCardData(student).summary.daysAbsentExcused,
      }));
    }
    
    if (activeTab === 'grades') {
      return baseData.map(student => {
        const rc = getReportCardData(student, listSemester);
        const subjectMap = new Map(rc.scores.map(s => [s.subject, s.average]));
        return {
          ...student,
          mathScore: subjectMap.get('Toán Học') || '',
          literatureScore: subjectMap.get('Ngữ Văn') || '',
          englishScore: subjectMap.get('Tiếng Anh') || '',
          historyScore: subjectMap.get('Lịch Sử') || '',
          geographyScore: subjectMap.get('Địa Lý') || '',
          physicsScore: subjectMap.get('Vật Lý') || '',
          chemistryScore: subjectMap.get('Hóa Học') || '',
          biologyScore: subjectMap.get('Sinh Học') || '',
          gpa: rc.summary.gpa,
        };
      });
    }
    
    if (activeTab === 'conduct') {
      return baseData.map(student => {
        const cb = getContactBookData(student);
        return {
          ...student,
          moralConduct: cb.moralConduct,
        };
      });
    }
    
    return baseData;
  };

  const renderTopButton = () => {
    const isPowerUser = currentRole === 'school_board' || currentRole === 'department_head';

    switch (activeTab) {
      case 'profiles':
        return (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 mr-2" /> Tải Về
            </button>
            {isPowerUser && (
              <>
                <button 
                  onClick={() => setShowExcelImport(true)} 
                  className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
                >
                  <Upload className="w-4 h-4 mr-2" /> Nhập từ Excel
                </button>
                <button onClick={() => setModalOpen('profiles')} className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
                  <Plus className="w-4 h-4 mr-2" /> Tiếp Nhận Học Sinh
                </button>
              </>
            )}
          </div>
        );
      case 'attendance':
        const canAttend = isPowerUser || currentRole === 'homeroom_teacher';
        return (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 mr-2" /> Tải Về
            </button>
            {canAttend && (
              <button onClick={() => setModalOpen('attendance')} className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
                <CheckSquare className="w-4 h-4 mr-2" /> Điểm Danh Mới
              </button>
            )}
          </div>
        );
      case 'grades':
        const canGrade = isPowerUser || currentRole === 'subject_teacher';
        return (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 mr-2" /> Tải Về
            </button>
            {canGrade && (
              <>
                <button onClick={() => setShowGradeExcelImport(true)} className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
                  <Upload className="w-4 h-4 mr-2" /> Nhập Điểm Excel
                </button>
                <button onClick={() => setModalOpen('grades')} className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
                  <BookOpen className="w-4 h-4 mr-2" /> Nhập Điểm & Đánh Giá
                </button>
              </>
            )}
          </div>
        );
      case 'conduct':
        const canConduct = isPowerUser || currentRole === 'homeroom_teacher';
        return (
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 mr-2" /> Tải Về
            </button>
            {canConduct && (
              <button onClick={() => setModalOpen('conduct')} className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
                <Award className="w-4 h-4 mr-2" /> Hồ Sơ Rèn Luyện
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
      <StudentWizardModal isOpen={modalOpen === 'profiles'} onClose={() => setModalOpen(null)} />
      <AttendanceModal isOpen={modalOpen === 'attendance'} onClose={() => setModalOpen(null)} />
      <GradesModal 
        isOpen={modalOpen === 'grades'} 
        onClose={() => setModalOpen(null)} 
        student={selectedGradeStudent}
        getReportCardData={getReportCardData}
      />
      <ConductModal isOpen={modalOpen === 'conduct'} onClose={() => setModalOpen(null)} />
      <ExcelImportModal isOpen={showExcelImport} onClose={() => setShowExcelImport(false)} onSuccess={loadStudents} />
      <GradeExcelImportModal isOpen={showGradeExcelImport} onClose={() => setShowGradeExcelImport(false)} onSuccess={loadReportCards} />
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={
          activeTab === 'profiles' ? 'Hồ Sơ Của Trẻ' :
          activeTab === 'attendance' ? 'Điểm Danh & Chuyên Cần' :
          activeTab === 'grades' ? 'Hồ Sơ Đánh Giá Phát Triển' :
          'Sổ Bé Ngoan'
        }
        data={getExportData()}
        availableColumns={getExportColumns(activeTab)}
        filename={
          activeTab === 'profiles' ? 'ho-so-cua-tre' :
          activeTab === 'attendance' ? 'diem-danh-chuyen-can' :
          activeTab === 'grades' ? 'ho-so-danh-gia-phat-trien' :
          'so-be-ngoan'
        }
      />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Quản lý Trẻ</h1>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Quản lý hồ sơ, chuyên cần và đánh giá phát triển của bé</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 sm:mt-0">
            {renderTopButton()}
          </div>
        </div>

        {/* Role-Specific Banners/Info Cards */}
        {currentRole === 'homeroom_teacher' && (
          <div className="mb-6 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-[4px_4px_0px_#dce4ee] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 flex items-center justify-center text-[#2c5ea0] rounded-2xl shrink-0">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-[#1e2a3a]">Cổng Thông Tin Giáo Viên Chủ Nhiệm</h4>
                <p className="text-[#4a5568] text-xs mt-1">
                  Đang quản lý lớp chủ nhiệm: <strong className="text-[#2c5ea0]">10A1</strong> • Sĩ số: <strong className="text-[#2c5ea0]">3 học sinh</strong>
                </p>
                <p className="text-[#7b8a9e] text-[11px] mt-1 font-serif">
                  * Hệ thống tự động kích hoạt chế độ xem thông tin liên hệ phụ huynh chi tiết ở bảng danh sách học sinh bên dưới.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-[#e8eef6] px-4 py-2.5 rounded-2xl border border-[#b8c6d9] text-center">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Học sinh vắng</p>
                <p className="text-xl font-bold font-serif text-[#2c5ea0] mt-0.5">1</p>
              </div>
              <div className="bg-[#e8eef6] px-4 py-2.5 rounded-2xl border border-[#b8c6d9] text-center">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Học lực Giỏi</p>
                <p className="text-xl font-bold font-serif text-[#2e6b8a] mt-0.5">1</p>
              </div>
              <div className="bg-[#e8eef6] px-4 py-2.5 rounded-2xl border border-[#b8c6d9] text-center">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Hạnh kiểm Tốt</p>
                <p className="text-xl font-bold font-serif text-[#1e2a3a] mt-0.5">3</p>
              </div>
            </div>
          </div>
        )}

        {currentRole === 'subject_teacher' && (
          <div className="mb-6 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-[4px_4px_0px_#dce4ee] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 flex items-center justify-center text-[#2c5ea0] rounded-2xl shrink-0">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-lg text-[#1e2a3a]">Cổng Thông Tin Giáo Viên Bộ Môn</h4>
                <p className="text-[#4a5568] text-xs mt-1">
                  Môn học phụ trách: <strong className="text-[#2c5ea0]">Tiếng Anh</strong> • Các lớp giảng dạy: <strong className="text-[#2c5ea0]">10A1, 10A5</strong>
                </p>
                <p className="text-[#7b8a9e] text-[11px] mt-1 font-serif">
                  * Hệ thống hiển thị nhanh Giáo viên chủ nhiệm của từng lớp để thuận tiện trao đổi tình hình học tập khi cần thiết.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="bg-[#e8eef6] px-4 py-2.5 rounded-2xl border border-[#b8c6d9] text-center">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Lớp phụ trách</p>
                <p className="text-xl font-bold font-serif text-[#2c5ea0] mt-0.5">2 Lớp</p>
              </div>
              <div className="bg-[#e8eef6] px-4 py-2.5 rounded-2xl border border-[#b8c6d9] text-center">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Tổng học sinh</p>
                <p className="text-xl font-bold font-serif text-[#2e6b8a] mt-0.5">4</p>
              </div>
              <div className="bg-[#e8eef6] px-4 py-2.5 rounded-2xl border border-[#b8c6d9] text-center">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Đạt yêu cầu</p>
                <p className="text-xl font-bold font-serif text-[#1e2a3a] mt-0.5">4</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit overflow-y-auto shrink-0 min-w-0">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">Phân Hệ Nghiệp Vụ</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('profiles')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'profiles' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <User className="w-5 h-5 mr-3" />
                Hồ sơ & Lý lịch trẻ
              </button>
              
              {currentRole !== 'subject_teacher' && currentRole !== 'activities_head' && (
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'attendance' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
                >
                  <Clock className="w-5 h-5 mr-3" />
                  Điểm danh & Chuyên cần
                </button>
              )}

              {currentRole !== 'activities_head' && (
                <button 
                  onClick={() => setActiveTab('grades')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'grades' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
                >
                  <BookOpen className="w-5 h-5 mr-3" />
                  Đánh giá Phát triển
                </button>
              )}

              {currentRole !== 'subject_teacher' && (
                <button 
                  onClick={() => setActiveTab('conduct')}
                  className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'conduct' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Sổ Bé Ngoan
                </button>
              )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] min-w-0 rounded-3xl overflow-hidden relative min-h-0">
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                {activeTab === 'profiles' && 'Danh sách Hồ sơ của Trẻ'}
                {activeTab === 'attendance' && 'Điểm danh & Chuyên cần hàng ngày'}
                {activeTab === 'grades' && 'Hồ sơ Đánh giá phát triển trẻ mầm non'}
                {activeTab === 'conduct' && 'Sổ Bé Ngoan & Nhận xét của cô'}
              </h3>
              <div className="flex items-center space-x-3">
                 <div className="relative">
                   <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder="Tra cứu..."
                     className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                   />
                 </div>
                 {activeTab === 'grades' && (
                   <FilterSelect
                     label="Học Kỳ"
                     value={listSemester}
                     onChange={setListSemester}
                     options={[
                       { value: 'Học Kỳ I', label: 'HỌC KỲ I' },
                       { value: 'Học Kỳ II', label: 'HỌC KỲ II' },
                       { value: 'Cả Năm', label: 'CẢ NĂM' }
                     ]}
                     icon={BookOpen}
                   />
                 )}
                 <FilterSelect
                   label="Lớp"
                   value={gradeFilter}
                   onChange={setGradeFilter}
                   options={[
                     { value: 'All', label: 'TẤT CẢ' },
                     ...Array.from(new Set(students.map(s => s.grade).filter((g): g is string => !!g && g !== 'Đã tốt nghiệp'))).sort().map(cls => ({
                       value: cls as string,
                       label: cls as string
                     }))
                   ]}
                   icon={Filter}
                 />
                <button 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center text-[10px] font-bold text-[#1e2a3a] bg-[#f5f8fc] border border-[#b8c6d9] px-4 py-2 hover:bg-[#e8eef6] transition-colors shadow-sm uppercase tracking-widest rounded-full disabled:opacity-75"
                  title="Tải lại danh sách"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin text-[#2c5ea0]' : ''}`} /> Tải Lại
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto w-full main-scrollbar">
              {errorNotice && (
                <div className={`border-b px-6 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shrink-0 transition-all duration-300 ${isError ? 'bg-[#fdf3f2] border-[#ebd1cf] text-[#2c5ea0]' : 'bg-amber-50 border-[#b8c6d9] text-amber-800'}`}>
                  <div className="flex items-center gap-3">
                    {isError ? (
                      <ShieldAlert className="w-4.5 h-4.5 text-[#2c5ea0] animate-bounce shrink-0" />
                    ) : (
                      <Sparkles className="w-4.5 h-4.5 text-amber-600 animate-pulse shrink-0" />
                    )}
                    <div>
                      <p className="font-bold">{isError ? 'Cảnh Báo Ngoại Tuyến (Offline Mode)' : 'Hệ Thống Đang Kết Nối...'}</p>
                      <p className="opacity-90 mt-0.5">{errorNotice}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <button 
                      onClick={loadStudents}
                      disabled={loading}
                      className="px-3 py-1.5 bg-[#f5f8fc] hover:bg-[#e8eef6] text-[#1e2a3a] border border-[#b8c6d9] font-bold rounded-full flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 text-[11px]"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Thử Lại
                    </button>
                    {!currentUser ? (
                      <button 
                        onClick={handleGoogleLogin} 
                        className="px-3 py-1.5 bg-[#2c5ea0] hover:bg-[#5c2b2b] text-white font-bold rounded-full flex items-center gap-1.5 transition shadow-sm text-[11px]"
                      >
                        <LogIn className="w-3.5 h-3.5" /> Đồng bộ Cloud
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 text-[11px]">
                        <Check className="w-3 h-3" /> Trực tuyến: {currentUser.email}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <table className={`w-full text-sm text-left ${activeTab === 'grades' ? 'min-w-[1200px]' : 'min-w-[800px]'}`}>
                <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-[0_1px_0_#b8c6d9]">
                  {activeTab === 'profiles' && (
                    <tr>
                      <th className="px-4 py-2.5">Mã trẻ</th>
                      <th className="px-4 py-2.5">Họ và Tên</th>
                      <th className="px-4 py-2.5">Lớp H.Tại</th>
                      {currentRole === 'homeroom_teacher' && <th className="px-4 py-2.5">Phụ huynh & SĐT</th>}
                      {currentRole === 'subject_teacher' && <th className="px-4 py-2.5">Cô Chủ Nhiệm</th>}
                      <th className="px-4 py-2.5">Trạng Thái</th>
                      <th className="px-4 py-2.5 text-center">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'attendance' && (
                    <tr>
                      <th className="px-4 py-2.5">Họ và Tên</th>
                      <th className="px-4 py-2.5">Lớp</th>
                      <th className="px-4 py-2.5 text-center">Có Phép</th>
                      <th className="px-4 py-2.5 text-center">Không Phép</th>
                      <th className="px-4 py-2.5">Đánh Giá Tuần</th>
                      <th className="px-4 py-2.5 text-center">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'grades' && (
                    <tr>
                      <th className="px-4 py-2.5 sticky left-0 bg-[#f5f8fc] z-20">Họ và Tên</th>
                      <th className="px-3 py-2.5">Lớp</th>
                      <th className="px-2 py-2.5 text-center">Thể chất</th>
                      <th className="px-2 py-2.5 text-center">Nhận thức</th>
                      <th className="px-2 py-2.5 text-center">Thẩm mỹ</th>
                      <th className="px-2 py-2.5 text-center">Ngôn ngữ</th>
                      <th className="px-2 py-2.5 text-center">KN Xã hội</th>
                      <th className="px-3 py-2.5 text-center font-black">Nhận xét chung</th>
                      <th className="px-3 py-2.5 text-center">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'conduct' && (
                    <tr>
                      <th className="px-4 py-2.5">Họ và Tên</th>
                      <th className="px-4 py-2.5">Lớp</th>
                      <th className="px-4 py-2.5">Đánh giá hành vi</th>
                      <th className="px-4 py-2.5">Danh hiệu tuần</th>
                      <th className="px-4 py-2.5 text-center">Phiếu Bé Ngoan</th>
                      <th className="px-4 py-2.5 text-center">Tác Vụ</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                  {loading ? (
                    <StudentTableSkeleton activeTab={activeTab} rows={4} currentRole={currentRole} />
                  ) : (
                    <>
                      {activeTab === 'profiles' && paginatedStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-[#e8eef6] transition-colors group">
                          <td className="px-4 py-2.5 font-mono text-xs text-[#7b8a9e]">{student.id}</td>
                          <td className="px-4 py-2.5">
                            <p className="font-bold text-[#1e2a3a]">{student.name}</p>
                            <p className="text-xs text-[#7b8a9e] mt-0.5 font-serif">{student.dob} - {student.gender}</p>
                          </td>
                          <td className="px-4 py-2.5 font-bold text-[#4a5568]">{student.grade}</td>
                          {currentRole === 'homeroom_teacher' && (
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-[#1e2a3a]">{student.guardian}</p>
                              <p className="text-xs text-[#7b8a9e] mt-0.5 font-mono">{student.phone}</p>
                            </td>
                          )}
                          {currentRole === 'subject_teacher' && (
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-[#1e2a3a]">{GVCN_MAP[student.grade] || 'Cô Lê Thị Thảo'}</p>
                              <p className="text-xs text-[#7b8a9e] mt-0.5 font-serif">Chủ nhiệm lớp</p>
                            </td>
                          )}
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold text-[#f5f8fc] uppercase tracking-widest ${
                              student.status === 'Đang Học' ? 'bg-[#2e6b8a]' :
                              student.status === 'Bảo Lưu' ? 'bg-[#7b8a9e]' : 'bg-[#2c5ea0]'
                            }`}>
                              {student.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <ActionMenu 
                              primaryAction={{
                                label: 'Xem',
                                icon: 'User',
                                onClick: () => openDrawer(student, 'read')
                              }}
                              actions={[
                                {
                                  label: 'Sửa lý lịch (Drawer)',
                                  icon: 'Edit',
                                  onClick: () => openDrawer(student, 'edit'),
                                  roles: ['school_board', 'department_head']
                                },
                                {
                                  label: student.status === 'Đang Học' ? 'Đình chỉ / Khóa (Deactivate)' : 'Phục hồi tài khoản',
                                  icon: student.status === 'Đang Học' ? 'ShieldAlert' : 'Check',
                                  onClick: () => toggleDeactivateStatus(student.id),
                                  danger: student.status === 'Đang Học',
                                  roles: ['school_board']
                                },
                                {
                                  label: 'Xóa hồ sơ học sinh',
                                  icon: 'Trash2',
                                  onClick: () => handleDeleteStudent(student.id),
                                  danger: true,
                                  roles: ['school_board']
                                }
                              ]}
                            />
                          </td>
                        </tr>
                      ))}

                      {activeTab === 'attendance' && paginatedStudents.map((student) => {
                        const rc = getReportCardData(student);
                        return (
                          <tr key={student.id} className="hover:bg-[#e8eef6] transition-colors group">
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-[#1e2a3a]">{student.name}</p>
                              <p className="text-xs text-[#7b8a9e] mt-0.5 font-mono">{student.id}</p>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-[#4a5568]">{student.grade}</td>
                            <td className="px-4 py-2.5 text-center font-serif text-lg text-[#4a5568]">{rc.summary.daysAbsentExcused}</td>
                            <td className="px-4 py-2.5 text-center font-serif text-lg text-[#2c5ea0]">{rc.summary.daysAbsent - rc.summary.daysAbsentExcused}</td>
                            <td className="px-4 py-2.5 font-bold text-[#4a5568]">
                              {rc.summary.daysAbsent > 1 ? 'Nguy cơ (GVCN Lưu ý)' : 'Đạt yêu cầu'}
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <ActionMenu
                                primaryAction={{ label: 'Điểm danh', icon: 'CheckSquare', onClick: () => setModalOpen('attendance') }}
                                actions={[]}
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {activeTab === 'grades' && paginatedStudents.map((student) => {
                        const rc = getReportCardData(student, listSemester);
                        const subjectMap = new Map(rc.scores.map(s => [s.subject, s.average]));
                        const SUBJECT_KEYS = ['Thể chất', 'Nhận thức', 'Thẩm mỹ', 'Ngôn ngữ', 'Kỹ năng xã hội'];
                        return (
                          <tr key={student.id} className="hover:bg-[#e8eef6] transition-colors group">
                            <td className="px-4 py-2.5 sticky left-0 bg-[#f5f8fc] group-hover:bg-[#e8eef6] z-10 transition-colors">
                              <p className="font-bold text-[#1e2a3a] text-xs whitespace-nowrap">{student.name}</p>
                              <p className="text-[10px] text-[#7b8a9e] mt-0.5 font-mono">{student.id}</p>
                            </td>
                            <td className="px-3 py-2.5 font-bold text-[#4a5568] text-xs">{student.grade}</td>
                            {SUBJECT_KEYS.map(subj => {
                              const val = subjectMap.get(subj) || 'Đạt';
                              return (
                                <td key={subj} className="px-2 py-2.5 text-center">
                                  <span className={`text-xs font-bold ${val === 'Đạt' ? 'text-[#2e6b8a]' : 'text-amber-600'}`}>
                                    {val}
                                  </span>
                                </td>
                              );
                            })}
                            <td className="px-3 py-2.5 text-center">
                              <span className="font-serif text-[11px] font-bold text-[#1e2a3a] bg-[#e8eef6] px-2 py-0.5 rounded-lg border border-[#b8c6d9] block truncate max-w-[150px]">
                                {rc.summary.generalComment || 'Đạt yêu cầu phát triển'}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <ActionMenu
                                primaryAction={{ 
                                  label: 'In Phiếu đánh giá', 
                                  icon: 'Printer', 
                                  onClick: () => {
                                    setSelectedPrintStudent(student);
                                    setSelectedPrintType('học-bạ');
                                    setShowPrintCenter(true);
                                  } 
                                }}
                                actions={[
                                  {
                                    label: 'Xem chi tiết đánh giá',
                                    icon: 'BookOpen',
                                    onClick: () => {
                                      setSelectedGradeStudent(student);
                                      setModalOpen('grades');
                                    }
                                  },
                                  {
                                    label: 'Xem & In Phiếu đánh giá',
                                    icon: 'Printer',
                                    onClick: () => {
                                      setSelectedPrintStudent(student);
                                      setSelectedPrintType('học-bạ');
                                      setShowPrintCenter(true);
                                    }
                                  },
                                  {
                                    label: 'Xem & In Phiếu liên lạc',
                                    icon: 'FileText',
                                    onClick: () => {
                                      setSelectedPrintStudent(student);
                                      setSelectedPrintType('sổ-liên-lạc');
                                      setShowPrintCenter(true);
                                    }
                                  }
                                ]}
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {activeTab === 'conduct' && paginatedStudents.map((student) => {
                        const rc = getReportCardData(student);
                        const cb = getContactBookData(student);
                        return (
                          <tr key={student.id} className="hover:bg-[#e8eef6] transition-colors group">
                            <td className="px-4 py-2.5">
                              <p className="font-bold text-[#1e2a3a]">{student.name}</p>
                              <p className="text-xs text-[#7b8a9e] mt-0.5 font-mono">{student.id}</p>
                            </td>
                            <td className="px-4 py-2.5 font-bold text-[#4a5568]">{student.grade}</td>
                            <td className="px-4 py-2.5 text-[#2c5ea0] font-serif text-xs italic">{cb.weeklyOffenses}</td>
                            <td className="px-4 py-2.5 text-[#2e6b8a] font-serif text-xs italic">{cb.weeklyRewards}</td>
                            <td className="px-4 py-2.5 text-center font-bold text-[#1e2a3a]">{cb.moralConduct}</td>
                            <td className="px-4 py-2.5 text-center">
                              <ActionMenu
                                primaryAction={{ 
                                  label: 'Sổ liên lạc', 
                                  icon: 'Printer', 
                                  onClick: () => {
                                    setSelectedPrintStudent(student);
                                    setSelectedPrintType('sổ-liên-lạc');
                                    setShowPrintCenter(true);
                                  } 
                                }}
                                actions={[
                                  {
                                    label: 'Xem & In Sổ liên lạc',
                                    icon: 'FileText',
                                    onClick: () => {
                                      setSelectedPrintStudent(student);
                                      setSelectedPrintType('sổ-liên-lạc');
                                      setShowPrintCenter(true);
                                    }
                                  },
                                  {
                                    label: 'Xem & In Học bạ',
                                    icon: 'BookOpen',
                                    onClick: () => {
                                      setSelectedPrintStudent(student);
                                      setSelectedPrintType('học-bạ');
                                      setShowPrintCenter(true);
                                    }
                                  }
                                ]}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-8 py-5 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredStudents.length}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Drawer for Master Data Details and Action flow */}
      {drawerOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-[#f5f8fc] h-full shadow-2xl border-l-[3px] border-[#b8c6d9] flex flex-col relative animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-6 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#2c5ea0] px-2.5 py-1 bg-[#a8c4e0] border border-[#7b8a9e] rounded-full">
                  {selectedStudent.id}
                </span>
                <h3 className="text-xl font-serif font-bold text-[#1e2a3a] mt-2">
                  {drawerMode === 'read' ? 'Chi tiết Hồ sơ Học sinh' : 'Cập nhật Thông tin Học sinh'}
                </h3>
              </div>
              <button 
                onClick={() => { setDrawerOpen(false); setSelectedStudent(null); }}
                className="p-2 text-[#7b8a9e] hover:text-[#2c5ea0] hover:bg-[#e8eef6] rounded-full border border-transparent hover:border-[#b8c6d9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content scroll area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerMode === 'read' ? (
                // READ ONLY MODE
                <div className="space-y-4">
                  <div className="bg-[#e8eef6] border border-[#b8c6d9] rounded-2xl p-4 shadow-inner space-y-3">
                    <div className="flex justify-between border-b border-[#dce4ee] pb-2 text-xs">
                      <span className="text-[#7b8a9e] font-bold uppercase tracking-wider">Họ và Tên</span>
                      <span className="text-[#1e2a3a] font-bold">{selectedStudent.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#dce4ee] pb-2 text-xs">
                      <span className="text-[#7b8a9e] font-bold uppercase tracking-wider">Ngày sinh</span>
                      <span className="text-[#1e2a3a] font-bold font-serif">{selectedStudent.dob}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#dce4ee] pb-2 text-xs">
                      <span className="text-[#7b8a9e] font-bold uppercase tracking-wider">Giới tính</span>
                      <span className="text-[#1e2a3a] font-bold">{selectedStudent.gender}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#7b8a9e] font-bold uppercase tracking-wider">Lớp học hiện tại</span>
                      <span className="text-[#1e2a3a] font-bold">{selectedStudent.grade}</span>
                    </div>
                  </div>

                  <div className="bg-[#f5f8fc] border border-[#b8c6d9] rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#b8c6d9] pb-2">Liên lạc & Phụ huynh</h4>
                    <div className="flex justify-between border-b border-[#dce4ee] pb-2 text-xs">
                      <span className="text-[#7b8a9e] font-bold uppercase tracking-wider">Phụ huynh/Giám hộ</span>
                      <span className="text-[#1e2a3a] font-bold">{selectedStudent.guardian}</span>
                    </div>
                    <div className="flex justify-between border-b border-[#dce4ee] pb-2 text-xs">
                      <span className="text-[#7b8a9e] font-bold uppercase tracking-wider">Điện thoại liên hệ</span>
                      <span className="text-[#1e2a3a] font-bold font-serif">{selectedStudent.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[#7b8a9e] font-bold uppercase tracking-wider">Địa chỉ thường trú</span>
                      <span className="text-[#1e2a3a] font-bold text-right max-w-xs">{selectedStudent.address}</span>
                    </div>
                  </div>

                  <div className="p-4 border-2 border-dashed border-[#b8c6d9] rounded-2xl bg-[#e8eef6]/50 text-[#7b8a9e] text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[#4a5568]">
                      <Shield className="w-4 h-4 text-[#2c5ea0]" />
                      <span>RÀO CẢN BẢO MẬT & PHÁP LÝ (ADMIN LOG)</span>
                    </div>
                    <p className="leading-relaxed">Hồ sơ danh mục học sinh thuộc quyền tự trị cơ sở. Các hành động thay đổi, cập nhật hoặc deactive trạng thái đình chỉ học tập phải đồng bộ trực tiếp với phòng số liệu và có biên bản chính quy ký duyệt từ Ban giám hiệu nhà trường.</p>
                  </div>
                </div>
              ) : (
                // EDIT MODE
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Họ và Tên học sinh</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a] focus:outline-none focus:ring-2 focus:ring-[#2c5ea0]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <BaseDatePicker
                        label="Ngày sinh"
                        value={editDob}
                        onChange={(val) => setEditDob(val)}
                        inputClassName="!py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <BaseSelect
                        label="Giới tính"
                        value={editGender}
                        options={[
                          {value: 'Nam', label: 'Nam'},
                          {value: 'Nữ', label: 'Nữ'}
                        ]}
                        onChange={(val) => setEditGender(val)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Lớp học hiện tại</label>
                    <input 
                      type="text" 
                      value={editGrade}
                      onChange={e => setEditGrade(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a] focus:outline-none focus:ring-2 focus:ring-[#2c5ea0]/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Người giám hộ</label>
                    <input 
                      type="text" 
                      value={editGuardian}
                      onChange={e => setEditGuardian(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Điện thoại liên hệ</label>
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-mono text-[#1e2a3a] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Địa chỉ thường trú</label>
                      <textarea 
                        rows={2}
                        value={editAddress}
                        onChange={e => setEditAddress(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a] focus:outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer containing quick operations like deactivation instead of deleting */}
            <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between">
              {drawerMode === 'read' ? (
                <div className="flex w-full justify-between items-center">
                  <button
                    onClick={() => setDrawerMode('edit')}
                    className="px-5 py-2.5 bg-[#2c5ea0] text-white border border-[#5a2e2e] text-xs uppercase tracking-widest font-bold hover:bg-[#8c4e4e] transition-all rounded-full flex items-center shadow-md shadow-[#2c5ea0]/20"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Biên tập Lý lịch
                  </button>
                  <button
                    onClick={() => {
                      toggleDeactivateStatus(selectedStudent.id);
                      setDrawerOpen(false);
                    }}
                    className={`px-5 py-2.5 text-xs uppercase tracking-widest font-bold border transition-all rounded-full ${
                      selectedStudent.status === 'Đang Học'
                        ? 'bg-[#ffebee] text-red-700 border-red-300 hover:bg-[#ffcdd2]'
                        : 'bg-[#e8f5e9] text-[#2e6b8a] border-green-300 hover:bg-[#c8e6c9]'
                    }`}
                  >
                    {selectedStudent.status === 'Đang Học' ? 'Đình chỉ học (Deactivate)' : 'Phục hồi đang học'}
                  </button>
                </div>
              ) : (
                <div className="flex w-full gap-4">
                  <button
                    onClick={() => setDrawerMode('read')}
                    className="flex-1 px-5 py-2.5 bg-white border border-[#b8c6d9] text-[#4a5568] text-xs uppercase tracking-widest font-bold hover:bg-gray-50 transition-all rounded-full text-center"
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleSaveDrawer}
                    className="flex-1 px-5 py-2.5 bg-[#1e2a3a] text-white border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition-all rounded-full text-center shadow-md shadow-black/10"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showPrintCenter && selectedPrintStudent && (
        <ModalBase 
          isOpen={showPrintCenter} 
          onClose={() => { setShowPrintCenter(false); setSelectedPrintStudent(null); }} 
          title="Trung Tâm Cấp Học Bản & Sổ Liên Lạc" 
          subtitle="Hệ thống chuẩn quản lý bản in và xuất bản kỹ thuật số" 
          width="max-w-5xl"
        >
          <div className="flex-1 min-h-0 flex flex-col md:flex-row bg-[#efeae0]">
            {/* Sidebar settings & info control panel */}
            <div className="w-full md:w-80 bg-[#f5f8fc] p-6 border-r border-[#b8c6d9] flex flex-col justify-between shrink-0">
              <div className="space-y-6 overflow-y-auto flex-1 pr-2 min-h-0">
                <div>
                  <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest mb-2 font-mono">I. Lựa chọn tài liệu in</h4>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => setSelectedPrintType('học-bạ')}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border text-left flex items-center transition-all ${
                        selectedPrintType === 'học-bạ'
                          ? 'bg-[#2c5ea0] text-[#f5f8fc] border-[#5a2e2e] shadow-sm'
                          : 'bg-[#e8eef6]/50 text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6]'
                      }`}
                    >
                      <BookOpen className="w-4 h-4 mr-2.5 shrink-0" />
                      Học Bạ Điện Tử Chính Quy
                    </button>
                    <button 
                      onClick={() => setSelectedPrintType('sổ-liên-lạc')}
                      className={`px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border text-left flex items-center transition-all ${
                        selectedPrintType === 'sổ-liên-lạc'
                          ? 'bg-[#2c5ea0] text-[#f5f8fc] border-[#5a2e2e] shadow-sm'
                          : 'bg-[#e8eef6]/50 text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6]'
                      }`}
                    >
                      <FileText className="w-4 h-4 mr-2.5 shrink-0" />
                      Sổ Liên Lạc Điện Tử HK
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest mb-2 font-mono">II. Lựa chọn Học Kỳ</h4>
                  <div className="w-full">
                    <BaseSelect
                      value={printSemester}
                      options={[
                        { value: 'Học Kỳ I', label: 'Học Kỳ I' },
                        { value: 'Học Kỳ II', label: 'Học Kỳ II' },
                        { value: 'Cả Năm', label: 'Cả Năm' }
                      ]}
                      onChange={(val) => setPrintSemester(val)}
                    />
                  </div>
                </div>

                <div className="space-y-3 bg-[#fdfbf6] p-4 border border-[#b8c6d9] rounded-xl text-xs">
                  <h5 className="font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-sans">
                    Thuộc tính trang in
                  </h5>
                  <div className="space-y-2 text-[#4a5568] font-bold">
                    <div className="flex justify-between">
                      <span>Khổ giấy:</span>
                      <span className="font-mono text-[11px] text-[#2c5ea0]">A4 Portrait</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Lề bảo vệ:</span>
                      <span className="font-mono text-[11px] text-[#2c2852]">15mm (ISO)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Hiệu ứng in:</span>
                      <span className="font-mono text-[11px] text-[#166534]">Exact Colors</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Phân trang (Break):</span>
                      <span className="font-mono text-[11px] text-gray-500">Chống cắt vỡ dòng</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#fff9e6] border border-[#ffe0b2] p-4 rounded-xl text-[11px] text-amber-950 space-y-1.5 font-sans leading-relaxed">
                  <p className="font-bold uppercase tracking-wide text-amber-900">💡 HƯỚNG DẪN IN A4 CHUẨN:</p>
                  <p>Mở hộp thoại in, chọn <strong>"In màu"</strong> (Color), bật tùy chọn <strong>"Đồ họa nền"</strong> (Background graphics) và điều chỉnh lề về <strong>"Mặc định"</strong> (Default margin) để hiển thị đồng bộ hoàn hảo dải màu, viền xám ấm, con dấu bảo an mờ của nhà trường.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#b8c6d9] space-y-4 shrink-0">
                <button 
                  onClick={() => printElement('printable-document-container', `${selectedPrintType === 'học-bạ' ? 'Hoc-Ba' : 'So-Lien-Lac'}_${selectedPrintStudent.name}`)}
                  className="w-full flex items-center justify-center py-3 bg-[#1e2a3a] hover:bg-[#3d3834] text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-[3px_3px_0px_#2c5ea0] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Kích Hoạt Lệnh In Màu
                </button>
                <button 
                  onClick={() => { setShowPrintCenter(false); setSelectedPrintStudent(null); }}
                  className="w-full text-center py-2 text-xs text-gray-500 hover:text-gray-800 font-bold uppercase tracking-wider transition-colors"
                >
                  Thoát giao diện
                </button>
              </div>
            </div>

            {/* Document mockup area with lifelike A4 paper preview and scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
              <div 
                id="printable-document-container" 
                className="bg-white text-black p-2 md:p-8 rounded-lg shadow-[10px_10px_30px_rgba(44,40,37,0.15)] border border-[#b8c6d9] w-full max-w-[210mm] min-h-[297mm]"
              >
                {selectedPrintType === 'học-bạ' ? (
                  <PrintableReportCard data={getReportCardData(selectedPrintStudent, printSemester)} selectedSemester={printSemester} />
                ) : (
                  <PrintableContactBook data={getContactBookData(selectedPrintStudent, printSemester)} selectedSemester={printSemester} />
                )}
              </div>
            </div>
          </div>
        </ModalBase>
      )}
    </main>
  );
};
