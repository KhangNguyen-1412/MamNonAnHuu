import React, { useState, useEffect } from 'react';
import {
  Filter, Plus, Search, MoreHorizontal, Eye, Edit, ShieldAlert, Check,
  BookOpen, Users, Trash, Mail, Phone, UserCheck, FileText,
  Calculator, Atom, Compass, Palette, Activity, Briefcase, Globe, School,
  X, AlertCircle, FileCheck, FileWarning, ArrowUpRight, BarChart2, Award, ClipboardCheck, Calendar, Lock, Unlock, Send
} from 'lucide-react';
import { ActionMenu } from '../ui/ActionMenu';
import { ModalBase } from '../ui/Modals';
import { Pagination } from '../ui/Pagination';
import { 
  getDepartments, saveDepartment, deleteDepartment,
  getSubjects, saveSubject, deleteSubject,
  Department, Subject,
  getPlans, savePlan, getTeacherAssignments, saveTeacherAssignment,
  getClasses, ClassData
} from '../../services/dbService';
import { getStaffList, Staff, updateStaff } from '../../services/hrService';
import { useUserRole } from '../../utils/role';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { auth } from '../../services/firebase';
import { getAllReportCards, ReportCardDocument } from '../../services/reportCardService';

interface LessonPlan {
  id: string;
  type: 'lesson_plan';
  title: string;
  teacher: string;
  grade: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  content: {
    objectives: string;
    materials: string;
    activities: string;
  };
  department: string;
}

interface CriteriaAssessment {
  id: number;
  name: string;
  selfScore: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
  deptScore: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';
}

const seedPlansIfEmpty = async (existingPlans: any[], resolvedDept: string): Promise<LessonPlan[]> => {
  const departmentLessonPlans = existingPlans.filter(p => p.type === 'lesson_plan' && p.department === resolvedDept);
  if (departmentLessonPlans.length === 0) {
    const defaultLessonPlans: LessonPlan[] = [
      {
        id: 'GA-01',
        type: 'lesson_plan',
        title: 'Đạo hàm cấp hai và ứng dụng thực tiễn - Đại số 11',
        teacher: 'Thầy Nguyễn Trung Nghĩa',
        grade: '11B2',
        date: '20/06/2026',
        status: 'pending',
        content: {
          objectives: 'Giúp học sinh nắm vững định nghĩa đạo hàm cấp hai, quy tắc tính và ý nghĩa cơ học của đạo hàm cấp hai trong chuyển động thẳng biến đổi đều.',
          materials: 'Phiếu học tập cá nhân, máy tính cầm tay Casio, máy chiếu slide bài giảng, hình ảnh minh họa quỹ đạo rơi tự do.',
          activities: '1. Khởi động (5 phút): Nhắc lại đạo hàm cấp một và bài toán vận tốc.\n2. Hình thành kiến thức (20 phút): Định nghĩa đạo hàm cấp hai thông qua gia tốc.\n3. Luyện tập (15 phút): Giải các bài tập SGK về tính đạo hàm cấp hai.\n4. Vận dụng (5 phút): Mô phỏng chuyển động của con lắc đơn.'
        },
        department: resolvedDept
      },
      {
        id: 'GA-02',
        type: 'lesson_plan',
        title: 'Cấu trúc lặp và vòng lặp for - Tin học 10',
        teacher: 'Cô Trần Thị Kim Oanh',
        grade: '1A1',
        date: '19/06/2026',
        status: 'pending',
        content: {
          objectives: 'Học sinh hiểu được cấu trúc lặp với số lần biết trước (vòng lặp for) trong Python, viết được các chương trình đơn giản.',
          materials: 'Phòng thực hành máy tính, IDE Python (Thonny/PyCharm), slide lý thuyết, bài tập thực hành trên Google Classroom.',
          activities: '1. Kiểm tra bài cũ (5 phút): Cấu trúc rẽ nhánh if-else.\n2. Đặt vấn đề (5 phút): Bài toán tính tổng từ 1 đến 100.\n3. Khám phá kiến thức (15 phút): Cú pháp vòng lặp for i in range().\n4. Thực hành (15 phút): Học sinh gõ code trực tiếp trên máy.\n5. Tổng kết & Dặn dò (5 phút).'
        },
        department: resolvedDept
      },
      {
        id: 'GA-03',
        type: 'lesson_plan',
        title: 'Phương trình lượng giác cơ bản - Toán 11',
        teacher: 'Cô Nguyễn Thanh Vy',
        grade: '11B2',
        date: '18/06/2026',
        status: 'approved',
        content: {
          objectives: 'Học sinh giải thành thạo phương trình sin x = a và cos x = a, biểu diễn được các nghiệm trên đường tròn lượng giác.',
          materials: 'Thước kẻ bản lớn vẽ đường tròn lượng giác, phấn màu, phiếu câu hỏi trắc nghiệm nhanh.',
          activities: 'Dạy học theo phương pháp thảo luận nhóm. Luyện tập giải toán trắc nghiệm trực quan.'
        },
        department: resolvedDept
      },
      {
        id: 'GA-04',
        type: 'lesson_plan',
        title: 'Phương trình mũ và phương trình logarit - Toán 12',
        teacher: 'Thầy Trần Minh Triết',
        grade: '5A1',
        date: '15/06/2026',
        status: 'approved',
        content: {
          objectives: 'Nắm được các phương pháp giải phương trình mũ: đưa về cùng cơ số, đặt ẩn phụ, mũ hóa.',
          materials: 'Sách giáo khoa Toán 12, bảng phụ nhóm.',
          activities: 'Học sinh tự nghiên cứu bài học trước ở nhà, lên lớp thảo luận và giải bài tập nâng cao.'
        },
        department: resolvedDept
      }
    ];

    for (const plan of defaultLessonPlans) {
      await savePlan(plan as any);
    }
    return defaultLessonPlans;
  }
  return departmentLessonPlans;
};

const seedAssignmentsIfEmpty = async (existingAssigns: any[], deptStaff: Staff[], resolvedDept: string): Promise<any[]> => {
  const assignmentMap = new Map(existingAssigns.map(a => [a.id || a.name, a]));
  const mergedAssigns = deptStaff.map((s: Staff) => {
    const existing = assignmentMap.get(s.id) || assignmentMap.get(s.name);
    const isToan = s.mainSubject?.toLowerCase().includes('toán') || s.name.toLowerCase().includes('vy') || s.name.toLowerCase().includes('nghĩa') || s.name.toLowerCase().includes('triết');
    const subject = isToan ? 'Toán học' : 'Tin học';
    
    if (existing) {
      return {
        ...existing,
        id: s.id,
        name: s.name,
        dept: s.department || resolvedDept,
        role: s.role || 'Giáo viên',
        subject: subject
      };
    }
    
    // Default assignment template for staff members set by BGH
    const isHead = s.role?.includes('Tổ trưởng') || s.role?.includes('Trưởng');
    const isDeputy = s.role?.includes('Tổ phó') || s.role?.includes('Phó');
    const quota = isHead ? 16 : isDeputy ? 17 : 17;
    const baseHours = s.name.includes('Triết') ? 8 : 10;

    return {
      id: s.id,
      name: s.name,
      dept: s.department || resolvedDept,
      role: s.role || 'Giáo viên',
      quota: quota,
      assigned: baseHours,
      classes: [],
      subject: subject
    };
  });

  return mergedAssigns;
};

interface DepartmentHeadDashboardProps {
  activeViewTab?: 'overview' | 'lesson_plans' | 'assignments' | 'evaluation' | 'analytics';
}

const DepartmentHeadDashboard: React.FC<DepartmentHeadDashboardProps> = ({ activeViewTab }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'lesson_plans' | 'assignments' | 'evaluation' | 'analytics'>(activeViewTab || 'overview');

  useEffect(() => {
    if (activeViewTab) {
      setActiveTab(activeViewTab);
    }
  }, [activeViewTab]);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Database States
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [reportCards, setReportCards] = useState<ReportCardDocument[]>([]);
  const [activeDept, setActiveDept] = useState('Tổ Toán - Tin');
  const [classesList, setClassesList] = useState<ClassData[]>([]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Load database content on mount
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [allStaff, allAssignments, allPlans, allReportCards, allClasses] = await Promise.all([
          getStaffList(),
          getTeacherAssignments(),
          getPlans(),
          getAllReportCards(),
          getClasses()
        ]);

        // Resolve active department
        const currentUser = auth.currentUser;
        const currentStaffRecord = allStaff.find(s => s.email?.toLowerCase().trim() === currentUser?.email?.toLowerCase().trim());
        const resolvedDept = currentStaffRecord?.department || 'Tổ Toán - Tin';
        setActiveDept(resolvedDept);

        const cleanResolved = resolvedDept.trim().replace(/^Tổ\s+/i, '');
        const deptStaffList = allStaff.filter(s => {
          const dName = s.department || '';
          return dName.trim().replace(/^Tổ\s+/i, '') === cleanResolved;
        });
        setStaffList(allStaff);

        // Load or seed Lesson Plans
        const seededPlans = await seedPlansIfEmpty(allPlans, resolvedDept);
        setLessonPlans(seededPlans);

        // Load or seed Teacher Assignments
        const seededAssigns = await seedAssignmentsIfEmpty(allAssignments, deptStaffList, resolvedDept);
        setAssignments(seededAssigns);

        // Set report cards
        setReportCards(allReportCards);

        // Set classes list
        setClassesList(allClasses);

        // Set default selected teacher for evaluation
        if (deptStaffList.length > 0) {
          setSelectedEvalTeacherId(deptStaffList[0].id);
          setSelectedTeacherThiduadua(deptStaffList[0].name);
        }
      } catch (err) {
        console.error("Error loading department head dashboard data", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const deptStaff = staffList.filter(s => {
    const dName = s.department || '';
    const cleanActive = activeDept.trim().replace(/^Tổ\s+/i, '');
    return dName.trim().replace(/^Tổ\s+/i, '') === cleanActive;
  });

  // Tab 2 (Lesson Plans) State & Actions
  const [selectedPlanId, setSelectedPlanId] = useState<string>('GA-01');
  const [feedbackText, setFeedbackText] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [weekFilter, setWeekFilter] = useState('All');

  const filteredPlans = lessonPlans.filter(plan => {
    const matchesGrade = gradeFilter === 'All' || plan.grade.includes(gradeFilter);
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'pending' && plan.status === 'pending') ||
      (statusFilter === 'approved' && plan.status === 'approved') ||
      (statusFilter === 'rejected' && plan.status === 'rejected');
    
    let matchesWeek = true;
    if (weekFilter === 'Tuần này') {
      matchesWeek = plan.date.includes('20/06') || plan.date.includes('19/06');
    } else if (weekFilter === 'Tuần trước') {
      matchesWeek = plan.date.includes('18/06') || plan.date.includes('15/06');
    }
    
    return matchesGrade && matchesStatus && matchesWeek;
  });

  const selectedPlan = filteredPlans.find(p => p.id === selectedPlanId) || filteredPlans[0];

  const handleApprovePlan = async (id: string) => {
    const plan = lessonPlans.find(p => p.id === id);
    if (!plan) return;

    const updatedPlan: LessonPlan = {
      ...plan,
      status: 'approved',
      feedback: ''
    };

    try {
      await savePlan(updatedPlan as any);
      setLessonPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
      showToast('✔️ Đã phê duyệt giáo án thành công!');
    } catch (err) {
      console.error("Failed to approve plan", err);
      showToast("❌ Không thể phê duyệt giáo án.");
    }
  };

  const handleRejectPlan = async (id: string) => {
    if (!feedbackText.trim()) {
      alert('Vui lòng nhập lý do/góp ý yêu cầu chỉnh sửa!');
      return;
    }
    const plan = lessonPlans.find(p => p.id === id);
    if (!plan) return;

    const updatedPlan: LessonPlan = {
      ...plan,
      status: 'rejected',
      feedback: feedbackText
    };

    try {
      await savePlan(updatedPlan as any);
      setLessonPlans(prev => prev.map(p => p.id === id ? updatedPlan : p));
      showToast('⚠️ Đã trả hồ sơ giáo án, yêu cầu giáo viên chỉnh sửa!');
      setFeedbackText('');
    } catch (err) {
      console.error("Failed to reject plan", err);
      showToast("❌ Không thể từ chối giáo án.");
    }
  };

  // Tab 3 (Assignments) State & Actions
  const [assignmentStatus, setAssignmentStatus] = useState<'draft' | 'pending' | 'approved'>(() => {
    return (localStorage.getItem(`assignment_status_${activeDept}`) as 'draft' | 'pending' | 'approved') || 'draft';
  });

  const handleToggleClass = async (teacherId: string, className: string) => {
    if (assignmentStatus !== 'draft') return;

    const assign = assignments.find(a => a.id === teacherId);
    if (!assign) return;

    const hasClass = assign.classes.some((c: string) => c === className || c.split(' ')[0] === className);
    
    let nextClasses: string[];
    const staffMember = deptStaff.find(s => s.id === teacherId);
    const isToan = staffMember?.mainSubject?.toLowerCase().includes('toán') || staffMember?.name.toLowerCase().includes('vy') || staffMember?.name.toLowerCase().includes('nghĩa') || staffMember?.name.toLowerCase().includes('triết');
    
    if (hasClass) {
      nextClasses = assign.classes.filter((c: string) => c !== className && c.split(' ')[0] !== className);
    } else {
      const suffix = isToan ? 'Toán' : 'Tin học';
      const classWithSuffix = `${className} (${suffix})`;
      nextClasses = [...assign.classes, classWithSuffix];
    }
    
    const factor = isToan ? 4 : 2;
    const baseHours = staffMember?.name.includes('Triết') ? 8 : 10;
    const nextHours = baseHours + nextClasses.length * factor;

    const updatedAssign = {
      ...assign,
      classes: nextClasses,
      assigned: nextHours
    };

    try {
      await saveTeacherAssignment(updatedAssign);
      setAssignments(prev => prev.map(a => a.id === teacherId ? updatedAssign : a));
      showToast(`🔄 Đã cập nhật phân công lớp ${className} cho ${assign.name}`);
    } catch (err) {
      console.error("Failed to update teacher assignment", err);
      showToast("❌ Không thể cập nhật phân công.");
    }
  };

  const handleAssignClassSubject = async (teacherId: string, className: string, subject: string) => {
    if (assignmentStatus !== 'draft') return;

    const assign = assignments.find(a => a.id === teacherId);
    if (!assign) return;

    let nextClasses = assign.classes.filter((c: string) => c !== className && c.split(' ')[0] !== className);
    
    if (subject) {
      nextClasses = [...nextClasses, `${className} (${subject})`].sort();
    }
    
    const staffMember = deptStaff.find(s => s.id === teacherId);
    const isToan = staffMember?.mainSubject?.toLowerCase().includes('toán') || staffMember?.name.toLowerCase().includes('vy') || staffMember?.name.toLowerCase().includes('nghĩa') || staffMember?.name.toLowerCase().includes('triết');
    
    let toanCount = 0;
    let tinCount = 0;
    nextClasses.forEach((c: string) => {
      if (c.includes('(Toán)')) toanCount++;
      else if (c.includes('(Tin học)')) tinCount++;
      else {
        if (isToan) toanCount++;
        else tinCount++;
      }
    });
    
    const baseHours = staffMember?.name.includes('Triết') ? 8 : 10;
    const nextHours = baseHours + (toanCount * 4) + (tinCount * 2);

    const updatedAssign = {
      ...assign,
      classes: nextClasses,
      assigned: nextHours
    };

    try {
      await saveTeacherAssignment(updatedAssign);
      setAssignments(prev => prev.map(a => a.id === teacherId ? updatedAssign : a));
      showToast(`🔄 Đã cập nhật phân công lớp ${className} cho ${assign.name}`);
    } catch (err) {
      console.error("Failed to update teacher assignment", err);
      showToast("❌ Không thể cập nhật phân công.");
    }
  };

  const handleTrinhDuyet = () => {
    setAssignmentStatus('pending');
    localStorage.setItem(`assignment_status_${activeDept}`, 'pending');
    showToast('📤 Đã trình phân công giảng dạy lên BGH phê duyệt! Hệ thống đã khóa chỉnh sửa.');
  };

  // Tab 4 (Evaluation) State & Actions
  const [selectedEvalTeacherId, setSelectedEvalTeacherId] = useState<string>('');
  const selectedTeacher = deptStaff.find(s => s.id === selectedEvalTeacherId);
  const [criteria, setCriteria] = useState<CriteriaAssessment[]>([]);

  useEffect(() => {
    if (selectedTeacher) {
      const evalObj = selectedTeacher.evaluation;
      const initialCriteria: CriteriaAssessment[] = [
        { id: 1, name: 'Tiêu chí 1: Đạo đức nhà giáo', selfScore: (evalObj?.c1Self || 'Tốt') as any, deptScore: (evalObj?.c1Group || 'Tốt') as any },
        { id: 2, name: 'Tiêu chí 2: Phong cách nhà giáo', selfScore: (evalObj?.c2Self || 'Tốt') as any, deptScore: (evalObj?.c2Group || 'Tốt') as any },
        { id: 3, name: 'Tiêu chí 3: Phát triển chuyên môn bản thân', selfScore: (evalObj?.c3Self || 'Khá') as any, deptScore: (evalObj?.c3Group || 'Tốt') as any },
        { id: 4, name: 'Tiêu chí 4: Xây dựng kế hoạch dạy học & giáo dục', selfScore: ((evalObj as any)?.c4Self || 'Tốt') as any, deptScore: ((evalObj as any)?.c4Group || 'Khá') as any },
        { id: 5, name: 'Tiêu chí 5: Sử dụng phương pháp dạy học & giáo dục', selfScore: (evalObj?.c5Self || 'Tốt') as any, deptScore: (evalObj?.c5Group || 'Tốt') as any },
        { id: 6, name: 'Tiêu chí 6: Kiểm tra, đánh giá kết quả học tập & rèn luyện', selfScore: ((evalObj as any)?.c6Self || 'Khá') as any, deptScore: ((evalObj as any)?.c6Group || 'Khá') as any },
        { id: 7, name: 'Tiêu chí 7: Tư vấn và hỗ trợ học sinh', selfScore: ((evalObj as any)?.c7Self || 'Đạt') as any, deptScore: ((evalObj as any)?.c7Group || 'Khá') as any }
      ];
      setCriteria(initialCriteria);
    }
  }, [selectedEvalTeacherId, staffList]);

  const handleCriteriaChange = (id: number, score: 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt') => {
    setCriteria(prev => prev.map(c => c.id === id ? { ...c, deptScore: score } : c));
  };

  const handleSaveAssessment = async () => {
    if (!selectedTeacher) return;

    let ratingText = 'Hoàn Thành Nhiệm Vụ';
    const c1Group = criteria.find(c => c.id === 1)?.deptScore || 'Tốt';
    const c2Group = criteria.find(c => c.id === 2)?.deptScore || 'Tốt';
    const c3Group = criteria.find(c => c.id === 3)?.deptScore || 'Tốt';
    const c5Group = criteria.find(c => c.id === 5)?.deptScore || 'Tốt';

    const hasUnsatisfactory = criteria.some(c => c.deptScore === 'Chưa đạt');
    const allExcellent = criteria.every(c => c.deptScore === 'Tốt');
    const mostlyGoodOrExcellent = criteria.every(c => c.deptScore === 'Tốt' || c.deptScore === 'Khá');

    let generalRating = 'Khá';
    if (hasUnsatisfactory) {
      generalRating = 'Chưa đạt';
      ratingText = 'Chưa Hoàn Thành';
    } else if (allExcellent) {
      generalRating = 'Tốt';
      ratingText = 'Hoàn Thành Xuất Sắc';
    } else if (mostlyGoodOrExcellent) {
      generalRating = 'Khá';
      ratingText = 'Hoàn Thành Tốt';
    } else {
      generalRating = 'Đạt';
      ratingText = 'Hoàn Thành Nhiệm Vụ';
    }

    const updatedEval = {
      ...selectedTeacher.evaluation,
      c1Self: criteria.find(c => c.id === 1)?.selfScore || 'Tốt',
      c1Group: c1Group,
      c1Bgh: selectedTeacher.evaluation?.c1Bgh || c1Group,

      c2Self: criteria.find(c => c.id === 2)?.selfScore || 'Tốt',
      c2Group: c2Group,
      c2Bgh: selectedTeacher.evaluation?.c2Bgh || c2Group,

      c3Self: criteria.find(c => c.id === 3)?.selfScore || 'Khá',
      c3Group: c3Group,
      c3Bgh: selectedTeacher.evaluation?.c3Bgh || c3Group,

      c5Self: criteria.find(c => c.id === 5)?.selfScore || 'Tốt',
      c5Group: c5Group,
      c5Bgh: selectedTeacher.evaluation?.c5Bgh || c5Group,

      c4Self: criteria.find(c => c.id === 4)?.selfScore || 'Tốt',
      c4Group: criteria.find(c => c.id === 4)?.deptScore || 'Khá',
      c6Self: criteria.find(c => c.id === 6)?.selfScore || 'Khá',
      c6Group: criteria.find(c => c.id === 6)?.deptScore || 'Khá',
      c7Self: criteria.find(c => c.id === 7)?.selfScore || 'Đạt',
      c7Group: criteria.find(c => c.id === 7)?.deptScore || 'Khá',

      initiative: selectedTeacher.evaluation?.initiative || 'Hoàn thành chuyên đề cấp trường',
      ratingText,
      generalRating,
      comment: 'Đã lưu kết quả đánh giá cấp Tổ chuyên môn.',
      status: 'Tổ Trưởng Đã Duyệt'
    };

    try {
      await updateStaff(selectedTeacher.id, { evaluation: updatedEval });
      setStaffList(prev => prev.map(s => s.id === selectedTeacher.id ? { ...s, evaluation: updatedEval } : s));
      showToast(`💾 Đã lưu kết quả đánh giá chuẩn nghề nghiệp cho ${selectedTeacher.name}`);
    } catch (err) {
      console.error("Failed to save staff evaluation", err);
      showToast("❌ Không thể lưu kết quả đánh giá.");
    }
  };

  // Thi đua state
  const [selectedTeacherThiduadua, setSelectedTeacherThiduadua] = useState('');
  const [thiduaTitle, setThiduaTitle] = useState('Chiến sĩ thi đua cơ sở');
  const [evidence, setEvidence] = useState('');
  const [thiduaList, setThiduaList] = useState<any[]>([]);

  useEffect(() => {
    if (activeDept) {
      const cached = localStorage.getItem(`emulations_list_${activeDept}`);
      if (cached) {
        setThiduaList(JSON.parse(cached));
      } else {
        setThiduaList([
          { teacher: 'Thầy Nguyễn Trung Nghĩa', title: 'Lao động tiên tiến', status: 'Đã đề xuất', evidence: 'Hoàn thành tốt nhiệm vụ giảng dạy và bồi dưỡng HSG lớp 12.' }
        ]);
      }
    }
  }, [activeDept]);

  const handleAddThidua = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidence.trim()) {
      alert('Vui lòng nhập lý do & minh chứng thành tích!');
      return;
    }
    const newItem = {
      teacher: selectedTeacherThiduadua,
      title: thiduaTitle,
      status: 'Đã đề xuất',
      evidence
    };
    const nextList = [...thiduaList, newItem];
    setThiduaList(nextList);
    localStorage.setItem(`emulations_list_${activeDept}`, JSON.stringify(nextList));
    setEvidence('');
    showToast('🏆 Đã thêm đề xuất thi đua thành công!');
  };

  // Dynamic calculations for Tab 5: Analytics & Tab 1 Stats
  const analyticsData = React.useMemo(() => {
    const grades = ['10', '11', '12'];
    const subjects = ['Toán học', 'Tin học'];
    
    const distributionMap: Record<string, { gioichu: number; khachu: number; tbchu: number; yeuchu: number }> = {};
    
    subjects.forEach(subj => {
      grades.forEach(g => {
        const key = `${subj === 'Toán học' ? 'Toán' : 'Tin'} ${g}`;
        distributionMap[key] = { gioichu: 0, khachu: 0, tbchu: 0, yeuchu: 0 };
      });
    });
    
    reportCards.forEach(card => {
      const cardGrade = card.grade || '';
      let gradeNum = '';
      if (cardGrade.includes('10')) gradeNum = '10';
      else if (cardGrade.includes('11')) gradeNum = '11';
      else if (cardGrade.includes('12')) gradeNum = '12';
      
      if (!gradeNum) return;
      
      card.scores?.forEach(score => {
        const sName = score.subject || '';
        let matchedSubj = '';
        if (sName.toLowerCase().includes('toán')) matchedSubj = 'Toán học';
        else if (sName.toLowerCase().includes('tin')) matchedSubj = 'Tin học';
        
        if (!matchedSubj) return;
        
        const key = `${matchedSubj === 'Toán học' ? 'Toán' : 'Tin'} ${gradeNum}`;
        const avg = parseFloat(score.average as string);
        if (isNaN(avg)) return;
        
        if (avg >= 8.0) distributionMap[key].gioichu++;
        else if (avg >= 6.5) distributionMap[key].khachu++;
        else if (avg >= 5.0) distributionMap[key].tbchu++;
        else distributionMap[key].yeuchu++;
      });
    });
    
    const scoreDistribution = Object.entries(distributionMap).map(([name, counts]) => ({
      name,
      'Giỏi (8-10)': counts.gioichu,
      'Khá (6.5-7.9)': counts.khachu,
      'TB (5.0-6.4)': counts.tbchu,
      'Yếu (<5.0)': counts.yeuchu,
    }));
    
    const totalRecords = scoreDistribution.reduce((acc, curr) => acc + curr['Giỏi (8-10)'] + curr['Khá (6.5-7.9)'] + curr['TB (5.0-6.4)'] + curr['Yếu (<5.0)'], 0);
    const finalScoreDistribution = totalRecords > 0 ? scoreDistribution : [
      { name: 'Toán 10', 'Giỏi (8-10)': 12, 'Khá (6.5-7.9)': 24, 'TB (5.0-6.4)': 8, 'Yếu (<5.0)': 2 },
      { name: 'Toán 11', 'Giỏi (8-10)': 15, 'Khá (6.5-7.9)': 20, 'TB (5.0-6.4)': 10, 'Yếu (<5.0)': 1 },
      { name: 'Toán 12', 'Giỏi (8-10)': 8, 'Khá (6.5-7.9)': 28, 'TB (5.0-6.4)': 14, 'Yếu (<5.0)': 3 },
      { name: 'Tin 10', 'Giỏi (8-10)': 22, 'Khá (6.5-7.9)': 18, 'TB (5.0-6.4)': 5, 'Yếu (<5.0)': 0 },
      { name: 'Tin 11', 'Giỏi (8-10)': 18, 'Khá (6.5-7.9)': 22, 'TB (5.0-6.4)': 7, 'Yếu (<5.0)': 1 },
    ];

    const teacherPerformance = deptStaff.map(teacher => {
      const assign = assignments.find(a => a.id === teacher.id || a.name === teacher.name);
      const classesList = assign?.classes || [];
      const isToan = teacher.mainSubject?.toLowerCase().includes('toán') || teacher.name.toLowerCase().includes('vy') || teacher.name.toLowerCase().includes('nghĩa') || teacher.name.toLowerCase().includes('triết');
      const subject = isToan ? 'Toán học' : 'Tin học';
      
      const teacherScores: number[] = [];
      let passCount = 0;
      let totalCount = 0;
      
      reportCards.forEach(card => {
        const isClassMatch = classesList.some(cls => {
          if (!card.grade) return false;
          const cleanCls = cls.split(' ')[0].toLowerCase();
          return cleanCls === card.grade.toLowerCase();
        });
        if (isClassMatch) {
          const score = card.scores?.find(s => s.subject.toLowerCase().includes(subject.toLowerCase()));
          if (score) {
            const avg = parseFloat(score.average as string);
            if (!isNaN(avg)) {
              teacherScores.push(avg);
              totalCount++;
              if (avg >= 5.0) passCount++;
            }
          }
        }
      });
      
      const averageScore = teacherScores.length > 0 ? (teacherScores.reduce((sum, s) => sum + s, 0) / teacherScores.length) : 0;
      const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;
      
      let finalAvg = averageScore > 0 ? parseFloat(averageScore.toFixed(1)) : 7.5;
      let finalPass = totalCount > 0 ? passRate : 96;
      if (teacher.name.includes('Triết')) { finalAvg = averageScore > 0 ? finalAvg : 7.9; finalPass = totalCount > 0 ? finalPass : 98; }
      else if (teacher.name.includes('Vy')) { finalAvg = averageScore > 0 ? finalAvg : 8.1; finalPass = totalCount > 0 ? finalPass : 100; }
      else if (teacher.name.includes('Nghĩa')) { finalAvg = averageScore > 0 ? finalAvg : 7.2; finalPass = totalCount > 0 ? finalPass : 95; }
      else if (teacher.name.includes('Nhân')) { finalAvg = averageScore > 0 ? finalAvg : 8.4; finalPass = totalCount > 0 ? finalPass : 100; }
      else if (teacher.name.includes('Oanh')) { finalAvg = averageScore > 0 ? finalAvg : 7.8; finalPass = totalCount > 0 ? finalPass : 97; }

      return {
        teacher: teacher.name,
        subject: isToan ? 'Toán học' : 'Tin học',
        classes: classesList.join(', ') || 'Chưa phân công',
        average: finalAvg,
        passRate: finalPass
      };
    });

    const discrepancies: { name: string; class: string; subject: string; score: number; gpa: number; difference: number; reason: string }[] = [];
    
    reportCards.forEach(card => {
      const gpa = card.summary?.gpa || 0;
      if (gpa === 0) return;
      
      card.scores?.forEach(score => {
        const sName = score.subject || '';
        let matchedSubj = '';
        if (sName.toLowerCase().includes('toán')) matchedSubj = 'Toán học';
        else if (sName.toLowerCase().includes('tin')) matchedSubj = 'Tin học';
        
        if (!matchedSubj) return;
        
        const scoreVal = parseFloat(score.average as string);
        if (isNaN(scoreVal)) return;
        
        const diff = scoreVal - gpa;
        if (Math.abs(diff) >= 1.5) {
          discrepancies.push({
            name: card.name,
            class: card.grade,
            subject: matchedSubj,
            score: scoreVal,
            gpa: gpa,
            difference: parseFloat(diff.toFixed(1)),
            reason: diff > 0 
              ? `${matchedSubj} xuất sắc vượt trội so với học lực chung`
              : `${matchedSubj} thấp bất thường so với học lực chung`
          });
        }
      });
    });
    
    discrepancies.sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference));
    
    const finalDiscrepancies = discrepancies.length > 0 ? discrepancies.slice(0, 4) : [
      { name: 'Lê Hoàng Long', class: '1A1', subject: 'Toán học', score: 4.5, gpa: 8.2, difference: -3.7, reason: 'Toán học thấp bất thường so với học lực chung' },
      { name: 'Nguyễn Minh Quân', class: '1A5', subject: 'Tin học', score: 9.8, gpa: 6.2, difference: 3.6, reason: 'Tin học xuất sắc vượt trội so với các môn khác' },
      { name: 'Phạm Thanh Thảo', class: '11B2', subject: 'Toán học', score: 3.8, gpa: 7.5, difference: -3.7, reason: 'Toán học thấp bất thường so với học lực chung' }
    ];

    return {
      scoreDistribution: finalScoreDistribution,
      teacherPerformance,
      scoreDiscrepancies: finalDiscrepancies
    };
  }, [reportCards, deptStaff, assignments]);

  const pendingPlansCount = lessonPlans.filter(p => p.status === 'pending').length;
  const totalAssignedHours = assignments.reduce((sum, a) => sum + (a.assigned || 0), 0);
  const staffOnLeaveCount = deptStaff.filter(s => s.status === 'Nghỉ Phép').length;
  const staffWorkingCount = deptStaff.length - staffOnLeaveCount;
  const underloadedTeachers = assignments.filter(a => a.assigned < a.quota);

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center bg-[#f5f8fc]">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-[#2c5ea0] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#7b8a9e]">Đang tải dữ liệu thực từ hệ thống...</p>
        </div>
      </main>
    );
  }

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
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Tổ {activeDept}</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">Bảng điều khiển học thuật & đảm bảo chất lượng giảng dạy (Tổ trưởng)</p>
          </div>


        </div>

        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col rounded-3xl overflow-hidden relative min-h-[500px]">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-8">
              {/* Emergency Action Required */}
              {(pendingPlansCount > 0 || assignmentStatus === 'draft') && (
                <div className="bg-[#ebd1cf]/20 border-2 border-[#2c5ea0] p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Hành động khẩn cấp / Việc cần làm ngay
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingPlansCount > 0 && (
                      <div className="bg-white border border-[#ebd1cf] p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#1e2a3a]">Duyệt Kế hoạch bài dạy</p>
                          <p className="text-[11px] text-[#7b8a9e]">Có <strong className="text-[#2c5ea0]">{pendingPlansCount} giáo án mới</strong> đang chờ phê duyệt để kịp lên lớp.</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('lesson_plans')}
                          className="px-4 py-2 bg-[#2c5ea0] hover:bg-[#5c2b2b] text-[#f5f8fc] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ml-4 shrink-0"
                        >
                          Duyệt ngay
                        </button>
                      </div>
                    )}
                    {assignmentStatus === 'draft' && (
                      <div className="bg-white border border-[#ebd1cf] p-4 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-[#1e2a3a]">Trình phân công giảng dạy</p>
                          <p className="text-[11px] text-[#7b8a9e]">Phân công chuyên môn Học kỳ II chưa được gửi lên Ban Giám Hiệu.</p>
                        </div>
                        <button
                          onClick={() => setActiveTab('assignments')}
                          className="px-4 py-2 bg-[#1e2a3a] hover:bg-black text-[#f5f8fc] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors ml-4 shrink-0"
                        >
                          Phân công ngay
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stats Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Nhân sự hôm nay</span>
                  <div className="flex items-baseline gap-2 mt-2 flex-wrap">
                    <span className="text-4xl font-serif font-bold text-[#2c5ea0]">{deptStaff.length - staffOnLeaveCount}/{deptStaff.length}</span>
                    <span className="text-[10px] text-[#2e6b8a] font-bold uppercase">
                      {staffOnLeaveCount > 0 ? `Có ${staffOnLeaveCount} ca nghỉ phép` : 'Đủ quân số'}
                    </span>
                  </div>
                </div>

                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Chờ phê duyệt</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-serif font-bold text-red-600">{pendingPlansCount}</span>
                    <span className="text-[10px] text-[#7b8a9e] font-bold uppercase">Yêu cầu duyệt mới</span>
                  </div>
                </div>

                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Định mức giờ giảng dạy</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-serif font-bold text-[#1e2a3a]">{totalAssignedHours}</span>
                    <span className="text-xs text-[#7b8a9e] font-bold">tiết/tuần toàn tổ</span>
                  </div>
                </div>

                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block">Cảnh báo tiến độ</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-4xl font-serif font-bold text-amber-700">2</span>
                    <span className="text-[10px] text-amber-800 font-bold uppercase">Lớp trễ chương trình</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Department Progress Chart */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4">
                    <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2 flex items-center justify-between">
                      <span>Biểu đồ Tiến độ Giảng dạy thành viên</span>
                      <span className="text-[9px] text-[#7b8a9e] font-bold uppercase">Tiến trình dạy học học kỳ</span>
                    </h4>
                    <div className="space-y-4.5">
                      {deptStaff.map((teacher, idx) => {
                        const assign = assignments.find(a => a.id === teacher.id);
                        const assignedClassesCount = assign?.classes?.length || 0;
                        const isBehind = teacher.name.includes('Nghĩa') || teacher.name.includes('Trang');
                        const progress = isBehind ? 68 : Math.min(100, 78 + (idx * 3));
                        
                        return (
                          <div key={teacher.id} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <div>
                                <span className="font-bold text-[#1e2a3a]">{teacher.name}</span>
                                <span className="text-[9px] text-[#7b8a9e] ml-2">({teacher.mainSubject || 'Toán'} • {assignedClassesCount} lớp)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {isBehind && (
                                  <span className="text-[8px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                                    Đứng yên &gt; 1 tuần
                                  </span>
                                )}
                                <span className={`font-serif font-bold ${isBehind ? 'text-red-600' : 'text-[#2e6b8a]'}`}>
                                  {progress}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-[#e8eef6] h-2.5 rounded-full overflow-hidden border border-[#b8c6d9]">
                              <div 
                                className={`h-full transition-all duration-500 ${isBehind ? 'bg-red-500' : 'bg-[#2e6b8a]'}`} 
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Side: Department Calendar & Observations */}
                <div className="lg:col-span-5">
                  <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-[2px_2px_0px_#dce4ee] h-full flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4">
                        Lịch Sinh hoạt Chuyên môn & Dự giờ
                      </h4>
                      <div className="space-y-4">
                        {/* Event 1 */}
                        <div className="flex gap-3 items-start border-l-4 border-blue-500 pl-3 py-1">
                          <div className="text-center shrink-0 w-10">
                            <span className="block text-[9px] font-bold uppercase text-[#7b8a9e]">Thứ 2</span>
                            <span className="block text-lg font-serif font-bold text-[#1e2a3a] leading-none">22</span>
                          </div>
                          <div className="space-y-1">
                            <span className="inline-flex px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 text-[8px] font-bold uppercase rounded">Họp tổ chuyên môn</span>
                            <p className="text-xs font-bold text-[#1e2a3a] leading-tight">Triển khai kế hoạch hoàn thành chương trình Mầm non</p>
                            <p className="text-[9px] text-[#7b8a9e]">14:00 • Văn phòng Tổ Toán-Tin</p>
                          </div>
                        </div>

                        {/* Event 2 */}
                        <div className="flex gap-3 items-start border-l-4 border-amber-500 pl-3 py-1">
                          <div className="text-center shrink-0 w-10">
                            <span className="block text-[9px] font-bold uppercase text-[#7b8a9e]">Thứ 4</span>
                            <span className="block text-lg font-serif font-bold text-[#1e2a3a] leading-none">24</span>
                          </div>
                          <div className="space-y-1">
                            <span className="inline-flex px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-[8px] font-bold uppercase rounded">Chuyên đề PP</span>
                            <p className="text-xs font-bold text-[#1e2a3a] leading-tight">Ứng dụng Tích phân xác định diện tích thiết kế Stem</p>
                            <p className="text-[9px] text-[#7b8a9e]">08:30 • Phòng Học đa năng NĐN.101</p>
                          </div>
                        </div>

                        {/* Event 3 */}
                        <div className="flex gap-3 items-start border-l-4 border-[#2e6b8a] pl-3 py-1">
                          <div className="text-center shrink-0 w-10">
                            <span className="block text-[9px] font-bold uppercase text-[#7b8a9e]">Thứ 5</span>
                            <span className="block text-lg font-serif font-bold text-[#1e2a3a] leading-none">25</span>
                          </div>
                          <div className="space-y-1">
                            <span className="inline-flex px-1.5 py-0.5 bg-[#e5f0e8] text-[#2e6b8a] border border-[#c2ded0] text-[8px] font-bold uppercase rounded">Dự giờ chéo</span>
                            <p className="text-xs font-bold text-[#1e2a3a] leading-tight">Cô Nguyễn Thanh Vy dự giờ Thầy Trần Minh Triết</p>
                            <p className="text-[9px] text-[#7b8a9e]">Lớp 12A1 • Tiết 2-3 sáng</p>
                          </div>
                        </div>

                        {/* Event 4 */}
                        <div className="flex gap-3 items-start border-l-4 border-purple-500 pl-3 py-1">
                          <div className="text-center shrink-0 w-10">
                            <span className="block text-[9px] font-bold uppercase text-[#7b8a9e]">Thứ 6</span>
                            <span className="block text-lg font-serif font-bold text-[#1e2a3a] leading-none">26</span>
                          </div>
                          <div className="space-y-1">
                            <span className="inline-flex px-1.5 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 text-[8px] font-bold uppercase rounded">Dự giờ chéo</span>
                            <p className="text-xs font-bold text-[#1e2a3a] leading-tight">Thầy Vũ Quang Đạt dự giờ Cô Bùi Bích Trang</p>
                            <p className="text-[9px] text-[#7b8a9e]">Lớp 10A3 • Tiết 4 sáng</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-dashed border-[#dce4ee] flex justify-between items-center text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">
                      <span>Năm Học: 2025-2026</span>
                      <span>Tuần 35</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LESSON PLANS (GIÁO ÁN) */}
          {activeTab === 'lesson_plans' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[500px]">
              {/* Left Column: Lesson Plans List */}
              <div className="lg:col-span-5 border-r border-[#b8c6d9] flex flex-col min-h-0 bg-[#f5f8fc]">
                <div className="p-4 border-b border-[#b8c6d9] bg-[#e8eef6] flex justify-between items-center shrink-0">
                  <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest">
                    Kế hoạch bài dạy chờ phê duyệt
                  </h4>
                </div>
                {/* Filters */}
                <div className="p-3 bg-[#f5f8fc] border-b border-[#dce4ee] grid grid-cols-3 gap-2 shrink-0">
                  <div>
                    <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Tuần</label>
                    <select
                      value={weekFilter}
                      onChange={e => setWeekFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#b8c6d9] rounded-lg text-[10px] font-bold text-[#1e2a3a] focus:outline-none"
                    >
                      <option value="All">Tất cả</option>
                      <option value="Tuần này">Tuần này</option>
                      <option value="Tuần trước">Tuần trước</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Khối lớp</label>
                    <select
                      value={gradeFilter}
                      onChange={e => setGradeFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#b8c6d9] rounded-lg text-[10px] font-bold text-[#1e2a3a] focus:outline-none"
                    >
                      <option value="All">Tất cả</option>
                      <option value="10">Khối 1</option>
                      <option value="11">Khối 2</option>
                      <option value="12">Khối 5</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-wider mb-1">Trạng thái</label>
                    <select
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-[#b8c6d9] rounded-lg text-[10px] font-bold text-[#1e2a3a] focus:outline-none"
                    >
                      <option value="All">Tất cả</option>
                      <option value="pending">Chờ duyệt</option>
                      <option value="approved">Đã duyệt</option>
                      <option value="rejected">Yêu cầu sửa</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-[#dce4ee] max-h-[500px]">
                  {filteredPlans.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => { setSelectedPlanId(plan.id); setFeedbackText(''); }}
                      className={`w-full p-4 text-left transition-colors flex flex-col gap-2 ${
                        selectedPlanId === plan.id ? 'bg-[#e8eef6]/70' : 'hover:bg-[#e8eef6]/30'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[9px] font-bold text-[#2c5ea0] bg-[#2c5ea0]/10 px-2 py-0.5 rounded border border-[#2c5ea0]/20 font-mono shrink-0">
                          {plan.id}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border shrink-0 ${
                          plan.status === 'approved' ? 'bg-[#e5f0e8] text-[#2e6b8a] border-[#c2ded0]' :
                          plan.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {plan.status === 'approved' ? 'Đã duyệt' : plan.status === 'rejected' ? 'Trả sửa đổi' : 'Chờ duyệt'}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-[#1e2a3a] leading-snug truncate-2-lines">{plan.title}</h5>
                      <div className="flex justify-between text-[10px] text-[#7b8a9e] font-medium mt-1">
                        <span>{plan.teacher}</span>
                        <span>{plan.date}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Review Workspace */}
              <div className="lg:col-span-7 flex flex-col min-h-0 bg-[#edf2f9] p-6 justify-between">
                {selectedPlan ? (
                  <div className="flex flex-col h-full justify-between gap-6">
                    <div className="space-y-4">
                      {/* Paper Preview Mockup */}
                      <div className="bg-white border-2 border-[#b8c6d9] p-6 rounded-xl shadow-sm relative overflow-y-auto max-h-[320px] font-serif text-sm leading-relaxed text-gray-900">
                        {/* Protection watermark */}
                        <div className="absolute top-4 right-4 pointer-events-none opacity-20 border-2 border-dashed border-[#2c5ea0] px-2 py-1 text-[8px] font-sans font-bold text-[#2c5ea0] uppercase rounded">
                          Xem trước tài liệu
                        </div>
                        <h4 className="font-bold text-[#1e2a3a] text-center border-b border-[#dce4ee] pb-2 font-serif text-base mb-4">
                          KẾ HOẠCH BÀI DẠY (GIÁO ÁN CHUẨN)
                        </h4>
                        <div className="space-y-3 font-sans text-xs text-[#4a5568] mb-4 bg-[#f5f8fc] p-3 rounded-lg border border-[#dce4ee]">
                          <p><strong>Tên bài dạy:</strong> {selectedPlan.title}</p>
                          <p><strong>Giáo viên trình:</strong> {selectedPlan.teacher}</p>
                          <p><strong>Lớp áp dụng:</strong> {selectedPlan.grade} • <strong>Ngày trình:</strong> {selectedPlan.date}</p>
                        </div>
                        
                        <div className="space-y-4 font-serif text-xs leading-relaxed text-[#1e2a3a]">
                          <div>
                            <p className="font-bold text-sm text-[#2c5ea0] border-b border-[#ebd1cf] pb-1 mb-1.5 uppercase font-sans">I. Mục tiêu bài học</p>
                            <p>{selectedPlan.content.objectives}</p>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#2c5ea0] border-b border-[#ebd1cf] pb-1 mb-1.5 uppercase font-sans">II. Thiết bị dạy học và học liệu</p>
                            <p>{selectedPlan.content.materials}</p>
                          </div>
                          <div>
                            <p className="font-bold text-sm text-[#2c5ea0] border-b border-[#ebd1cf] pb-1 mb-1.5 uppercase font-sans">III. Tiến trình dạy học chi tiết</p>
                            <p className="whitespace-pre-line">{selectedPlan.content.activities}</p>
                          </div>
                        </div>
                      </div>

                      {/* Display feedback if any */}
                      {selectedPlan.feedback && (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-950 leading-relaxed">
                          <p className="font-bold flex items-center"><FileWarning className="w-4 h-4 mr-1 text-red-700" /> Lý do yêu cầu chỉnh sửa cũ:</p>
                          <p className="mt-1 opacity-90 italic">"{selectedPlan.feedback}"</p>
                        </div>
                      )}

                      {/* Feedback action form */}
                      {selectedPlan.status === 'pending' && (
                        <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest" htmlFor="feedback-input">
                            Ý kiến đóng góp / Nội dung góp ý phê duyệt
                          </label>
                          <textarea
                            id="feedback-input"
                            rows={2}
                            placeholder="Nhập lý do yêu cầu chỉnh sửa hoặc ghi chú phê duyệt tại đây..."
                            value={feedbackText}
                            onChange={e => setFeedbackText(e.target.value)}
                            className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0] resize-none"
                          />
                        </div>
                      )}
                    </div>

                    {/* Actions block */}
                    <div className="flex justify-between items-center gap-4 border-t border-dashed border-[#b8c6d9] pt-4 shrink-0">
                      <span className="text-[10px] font-bold text-[#7b8a9e] font-mono">Bài kiểm duyệt: {selectedPlan.id}</span>
                      {selectedPlan.status === 'pending' ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleRejectPlan(selectedPlan.id)}
                            className="px-4 py-2 bg-[#ffcdd2] hover:bg-[#ffebee] text-red-800 border border-red-300 text-xs font-bold uppercase tracking-wider rounded-full transition-all"
                          >
                            Yêu cầu chỉnh sửa
                          </button>
                          <button
                            onClick={() => handleApprovePlan(selectedPlan.id)}
                            className="px-5 py-2 bg-[#2e6b8a] hover:bg-[#1e4f6a] text-white border border-[#1e4f6a] text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1.5 transition-all shadow-sm"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> Phê duyệt giáo án
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#2e6b8a] bg-[#e5f0e8] border border-[#c2ded0] px-3.5 py-1.5 rounded-full text-xs font-bold">
                          <Check className="w-4 h-4" /> Giáo án ở trạng thái: <strong>{selectedPlan.status === 'approved' ? 'ĐÃ DUYỆT' : 'ĐÃ YÊU CẦU SỬA'}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-20 text-[#7b8a9e] h-full">
                    <FileText className="w-12 h-12 mb-2 stroke-1 opacity-70" />
                    <p className="text-xs font-bold uppercase tracking-wider">Vui lòng chọn một giáo án ở danh sách bên trái để kiểm duyệt</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TEACHING HOURS ASSIGNMENT (PHÂN CÔNG) */}
          {activeTab === 'assignments' && (
            <div className="p-6 space-y-8">
              {/* Teaching hours limit summary */}
              <div className="bg-[#fdfbf6] border border-[#b8c6d9] p-4 rounded-2xl flex flex-wrap gap-6 items-center justify-between shadow-inner">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 text-[#2c5ea0] flex items-center justify-center rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider">Khung Định Mức Quy Định</h5>
                    <p className="text-[10px] text-[#7b8a9e] mt-0.5">Tiêu chuẩn Giáo viên Mầm non: <strong>15 - 19 tiết / tuần</strong> (GDPT 2018)</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {assignmentStatus === 'draft' ? (
                    <button
                      onClick={handleTrinhDuyet}
                      className="px-6 py-2.5 bg-[#1e2a3a] hover:bg-[#3d3834] text-white border border-black text-xs font-bold uppercase tracking-widest rounded-full shadow-[2px_2px_0px_#2c5ea0] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Trình BGH phê duyệt
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-full">
                      <Lock className="w-3.5 h-3.5" /> Phân công đã trình BGH (Chờ duyệt)
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment matrix grid */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                  Ma trận phân công môn học cho các lớp khối
                </h4>
                <div className="overflow-x-auto border border-[#b8c6d9] rounded-2xl bg-white shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                      <tr>
                        <th className="p-4">Giáo viên</th>
                        <th className="p-4">Môn dạy chính</th>
                        <th className="p-4 text-center">Tổng tiết / Tuần</th>
                        {classesList.map(cls => (
                          <th key={cls.id} className="p-4 text-center">Lớp {cls.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce4ee] text-xs">
                      {assignments.map(teacher => {
                        const isOverloaded = teacher.assigned > 19;
                        const isUnderloaded = teacher.assigned < 15;
                        return (
                          <tr key={teacher.name} className="hover:bg-[#f5f8fc] transition-colors">
                            <td className="p-4 font-bold text-[#1e2a3a]">{teacher.name}</td>
                            <td className="p-4 font-medium text-[#4a5568]">{teacher.subject}</td>
                            <td className="p-4 text-center">
                              <span className={`inline-flex px-2.5 py-1 rounded-full font-serif font-bold text-xs border ${
                                isOverloaded ? 'bg-red-50 text-red-700 border-red-200' :
                                isUnderloaded ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                'bg-[#e5f0e8] text-[#2e6b8a] border-[#c2ded0]'
                              }`} title={isOverloaded ? 'Quá tải giờ dạy' : isUnderloaded ? 'Thiếu tiết dạy quy định' : 'Giờ dạy lý tưởng'}>
                                {teacher.assigned} tiết
                              </span>
                            </td>
                            {classesList.map(cls => {
                              const assignedClassStr = teacher.classes.find((c: string) => c === cls.name || c.split(' ')[0] === cls.name) || '';
                              const assignedSubject = assignedClassStr.includes('(')
                                ? assignedClassStr.substring(assignedClassStr.indexOf('(') + 1, assignedClassStr.indexOf(')'))
                                : '';
                              return (
                                <td key={cls.id} className="p-2 text-center border-l border-[#b8c6d9]">
                                  <select
                                    value={assignedSubject}
                                    onChange={(e) => handleAssignClassSubject(teacher.id, cls.name, e.target.value)}
                                    disabled={assignmentStatus !== 'draft'}
                                    className={`px-2 py-1 rounded-xl text-[10px] font-extrabold uppercase border focus:outline-none cursor-pointer transition-all ${
                                      assignedSubject === 'Toán' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                      assignedSubject === 'Tin học' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                      'bg-[#f5f8fc] text-[#7b8a9e] border-[#dce4ee] hover:border-[#a3b3c8]'
                                    }`}
                                  >
                                    <option value="">—</option>
                                    <option value="Toán">Toán</option>
                                    <option value="Tin học">Tin học</option>
                                  </select>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-[#7b8a9e] italic leading-relaxed">
                  * Ghi chú: Toán học tính định mức 4 tiết/lớp/tuần. Tin học tính định mức 2 tiết/lớp/tuần. Mỗi giáo viên mặc định có thêm giờ nghiên cứu/chuẩn bị giáo án (Toán: 8 tiết, Tin: 10 tiết).
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: EVALUATION & COMPETENCY (ĐÁNH GIÁ & THI ĐUA) */}
          {activeTab === 'evaluation' && (
            <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: 15 Standards Criteria list */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                    Đối chiếu Đánh giá chuẩn nghề nghiệp (Tổ Chuyên Môn)
                  </h4>

                  {/* Select Teacher for Evaluation */}
                  <div className="bg-[#e8eef6]/50 border border-[#b8c6d9] p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between shadow-sm mb-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-[#2c5ea0]" />
                      <div>
                        <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Chọn Giáo viên Đánh giá</label>
                        <select
                          value={selectedEvalTeacherId}
                          onChange={e => setSelectedEvalTeacherId(e.target.value)}
                          className="mt-1 px-3 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none"
                        >
                          {deptStaff.map(t => (
                            <option key={t.id} value={t.id}>{t.name} ({t.role || 'Giáo viên'})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block font-sans">Trạng thái đánh giá</span>
                      <span className={`inline-flex px-2.5 py-0.5 border text-[9px] font-bold uppercase rounded-md mt-1 ${
                        selectedTeacher?.evaluation?.status === 'Hiệu Trưởng Đã Duyệt' ? 'bg-[#e5f0e8] text-[#2e6b8a] border-[#c2ded0]' :
                        selectedTeacher?.evaluation?.status === 'Tổ Trưởng Đã Duyệt' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {selectedTeacher?.evaluation?.status || 'Chưa đánh giá'}
                      </span>
                    </div>
                  </div>

                  <div className="border border-[#b8c6d9] rounded-2xl bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Tiêu chí đánh giá</th>
                          <th className="p-4 text-center">GV Tự ĐG</th>
                          <th className="p-4 text-center">Tổ Chuyên môn đánh giá</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce4ee] text-xs">
                        {criteria.map(c => (
                          <tr key={c.id} className="hover:bg-[#f5f8fc] transition-colors">
                            <td className="p-4 font-bold text-[#1e2a3a]">{c.name}</td>
                            <td className="p-4 text-center">
                              <span className="px-2.5 py-1 bg-gray-100 text-gray-700 font-bold rounded-lg">
                                {c.selfScore}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <select
                                value={c.deptScore}
                                onChange={e => handleCriteriaChange(c.id, e.target.value as any)}
                                className="px-3 py-1.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] focus:outline-none"
                              >
                                <option value="Tốt">Tốt</option>
                                <option value="Khá">Khá</option>
                                <option value="Đạt">Đạt</option>
                                <option value="Chưa đạt">Chưa đạt</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveAssessment}
                      className="px-6 py-2.5 bg-[#2e6b8a] hover:bg-[#1e4f6a] text-white border border-[#1e4f6a] text-xs font-bold uppercase tracking-widest rounded-full shadow-sm transition-all"
                    >
                      Lưu kết quả đánh giá
                    </button>
                  </div>
                </div>

                {/* Right Side: Thi đua recommendation form & List */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Recommend Form */}
                  <form onSubmit={handleAddThidua} className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4">
                    <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#dce4ee] pb-2 flex items-center">
                      <Award className="w-4 h-4 mr-2" />
                      Đề xuất danh hiệu thi đua tổ
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Giáo viên đề cử</label>
                        <select
                          value={selectedTeacherThiduadua}
                          onChange={e => setSelectedTeacherThiduadua(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none"
                        >
                          <option value="">-- Chọn giáo viên --</option>
                          {deptStaff.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Danh hiệu kiến nghị</label>
                        <select
                          value={thiduaTitle}
                          onChange={e => setThiduaTitle(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none"
                        >
                          <option value="Chiến sĩ thi đua cơ sở">Chiến sĩ thi đua cơ sở</option>
                          <option value="Lao động tiên tiến">Lao động tiên tiến</option>
                          <option value="Bằng khen của Bộ GD&ĐT">Bằng khen của Bộ GD&ĐT</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Minh chứng & Thành tích lập được</label>
                        <textarea
                          rows={2}
                          placeholder="Nhập chi tiết các thành tích nổi bật của giáo viên đạt được trong năm học..."
                          value={evidence}
                          onChange={e => setEvidence(e.target.value)}
                          className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none resize-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-[#1e2a3a] hover:bg-[#3d3834] text-white border border-black text-xs font-bold uppercase tracking-wider rounded-full shadow-sm transition-all text-center"
                    >
                      Đăng ký Đề xuất thi đua
                    </button>
                  </form>

                  {/* Recommendations list */}
                  <div className="bg-[#fdfbf6] border border-[#b8c6d9] p-5 rounded-2xl shadow-inner space-y-3.5">
                    <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2">
                      Danh sách đã đề xuất năm học này
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {thiduaList.map((item, idx) => (
                        <div key={idx} className="bg-white border border-[#dce4ee] p-3 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-[#1e2a3a]">{item.teacher}</span>
                            <span className="px-2 py-0.5 bg-[#e5f0e8] text-[#2e6b8a] border border-[#c2ded0] text-[8px] font-bold uppercase rounded">
                              {item.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-[#2c5ea0] font-bold">{item.title}</p>
                          <p className="text-[10px] text-[#7b8a9e] italic leading-normal">"{item.evidence}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ANALYTICS (PHỔ ĐIỂM & CHẤT LƯỢNG) */}
          {activeTab === 'analytics' && (
            <div className="p-6 space-y-8">
              {/* Score Distribution Chart */}
              <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4">
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                  Phổ điểm thi học kỳ II bộ môn Toán & Tin học (Khối 1 - 5)
                </h4>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.scoreDistribution} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#dce4ee" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#4a5568', fontWeight: 'bold' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#4a5568', fontWeight: 'bold' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#f5f8fc', border: '1px solid #b8c6d9', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#1e2a3a' }} />
                      <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#4a5568' }} />
                      <Bar dataKey="Giỏi (8-10)" fill="#2e6b8a" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Khá (6.5-7.9)" fill="#a8c4e0" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="TB (5.0-6.4)" fill="#4a5568" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="Yếu (<5.0)" fill="#2c5ea0" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Quality comparison */}
                <div className="lg:col-span-7 space-y-4">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                    Bảng đối chiếu hiệu quả giảng dạy các lớp phụ trách
                  </h4>
                  <div className="border border-[#b8c6d9] rounded-2xl bg-white overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                        <tr>
                          <th className="p-4">Giáo viên</th>
                          <th className="p-4">Lớp dạy</th>
                          <th className="p-4 text-center">Điểm TB môn</th>
                          <th className="p-4 text-center">Tỷ lệ đạt (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce4ee] text-xs">
                        {analyticsData.teacherPerformance.map(t => (
                          <tr key={t.teacher} className="hover:bg-[#f5f8fc] transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-[#1e2a3a]">{t.teacher}</p>
                              <p className="text-[10px] text-[#7b8a9e]">{t.subject}</p>
                            </td>
                            <td className="p-4 font-bold text-[#4a5568]">{t.classes}</td>
                            <td className="p-4 text-center font-serif font-bold text-sm text-[#2c5ea0]">{t.average}</td>
                            <td className="p-4 text-center font-serif font-bold text-sm text-[#2e6b8a]">{t.passRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Right Side: Score discrepancy warnings */}
                <div className="lg:col-span-5 space-y-4">
                  <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#dce4ee] pb-2">
                    Báo cáo học sinh lệch điểm bất thường ({activeDept})
                  </h4>
                  <div className="space-y-3">
                    {analyticsData.scoreDiscrepancies.map((student, idx) => (
                      <div key={idx} className="p-4 bg-red-50/75 border border-red-200/80 rounded-2xl text-xs space-y-2 relative shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-[#1e2a3a] block">{student.name}</span>
                            <span className="text-[9px] text-[#7b8a9e] font-semibold uppercase tracking-wider">Lớp {student.class} • Môn {student.subject}</span>
                          </div>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-serif bg-red-100 text-red-700`}>
                            {student.difference > 0 ? `+${student.difference}` : student.difference}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-dashed border-[#dce4ee] pt-2 text-[10px] text-[#4a5568]">
                          <p>Điểm môn tổ: <strong className="text-sm font-serif text-[#2c5ea0]">{student.score}</strong></p>
                          <p>GPA chung: <strong className="text-sm font-serif text-[#1e2a3a]">{student.gpa}</strong></p>
                        </div>
                        <p className="text-[10px] text-red-955 leading-normal italic">
                          * Nhận định: "{student.reason}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const getDepartmentIcon = (logoKey: string = '') => {
  switch ((logoKey || '').toLowerCase()) {
    case 'math':
    case 'calculator':
      return Calculator;
    case 'literature':
    case 'book':
      return BookOpen;
    case 'languages':
    case 'globe':
      return Globe;
    case 'science':
    case 'atom':
      return Atom;
    case 'social':
    case 'compass':
      return Compass;
    case 'art':
    case 'palette':
      return Palette;
    case 'sport':
    case 'activity':
      return Activity;
    case 'office':
    case 'briefcase':
      return Briefcase;
    default:
      return School;
  }
};

const isImageUrl = (url: string = '') => {
  return url.startsWith('http://') || 
         url.startsWith('https://') || 
         url.startsWith('/') || 
         url.startsWith('data:image/') ||
         /\.(jpeg|jpg|gif|png|svg|webp)($|\?)/i.test(url);
};

interface DepartmentsPanelProps {
  activeViewTab?: 'overview' | 'lesson_plans' | 'assignments' | 'evaluation' | 'analytics';
}

export const DepartmentsPanel: React.FC<DepartmentsPanelProps> = ({ activeViewTab }) => {
  const currentRole = useUserRole();

  if (currentRole === 'department_head') {
    return <DepartmentHeadDashboard activeViewTab={activeViewTab} />;
  }

  return <DepartmentsPanelContent />;
};

const DepartmentsPanelContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'subjects' | 'departments'>('departments');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 1. STATEFUL DEPARTMENTS (MASTER DATA)
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);

  // 2. STATEFUL SUBJECTS (MASTER DATA)
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classesList, setClassesList] = useState<ClassData[]>([]);

  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = React.useState<'read' | 'edit'>('edit');
  const isReadMode = (modalMode as 'read' | 'edit') === 'read';
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Form State managers
  const [deptForm, setDeptForm] = useState<Partial<Department>>({});
  const [subForm, setSubForm] = useState<Partial<Subject>>({});

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [deptsData, subsData, staffData, classesData] = await Promise.all([
          getDepartments(),
          getSubjects(),
          getStaffList(),
          getClasses()
        ]);
        setDepartments(deptsData);
        setSubjects(subsData);
        setStaffList(staffData);
        setClassesList(classesData);
      } catch (err) {
        console.error("Failed to load departments data from firestore", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getSubjectTeacherCount = (subjectName: string) => {
    const subObj = subjects.find(s => s.name.toLowerCase().trim() === subjectName.toLowerCase().trim());
    if (subObj && subObj.type === 'Trải nghiệm') {
      return staffList.filter(staff => staff.assignedClass && staff.assignedClass !== 'Không phân công' && staff.assignedClass.trim() !== '').length;
    }
    return staffList.filter(staff => {
      if (!staff.mainSubject) return false;
      const cleanStaffSub = staff.mainSubject.trim().toLowerCase().replace(/í/g, 'y').replace(/ /g, '');
      const cleanDbSub = subjectName.trim().toLowerCase().replace(/í/g, 'y').replace(/ /g, '');
      return cleanStaffSub === cleanDbSub || cleanStaffSub.split(',').includes(cleanDbSub);
    }).length;
  };

  const handleOpenCreateModal = () => {
    setSelectedItem(null);
    setModalMode('edit');
    if (activeTab === 'departments') {
      setDeptForm({
        id: `T${Date.now().toString().slice(-4)}`,
        name: '',
        description: '',
        head: '',
        staffCount: 0,
        status: 'Hoạt Động',
        logo: 'school',
        type: 'Tổ khối lớp',
        applicableGrades: []
      });
    } else {
      setSubForm({
        id: `M-${Date.now().toString().slice(-4)}`,
        name: '',
        type: 'Bắt buộc',
        hoursPerWeek: 2,
        status: 'Đang Giảng Dạy',
        applicableClasses: [],
        hoursPerGrade: { '1': 2, '2': 2, '3': 2, '4': 2, '5': 2 }
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenReadOrEditModal = (item: any, mode: 'read' | 'edit') => {
    setSelectedItem(item);
    setModalMode(mode);
    if (activeTab === 'departments') {
      setDeptForm({
        type: 'Tổ khối lớp',
        applicableGrades: [],
        ...item
      });
    } else {
      setSubForm({ ...item });
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadMode) return;

    if (activeTab === 'departments') {
      try {
        const computedCount = staffList.filter(s => s.department === deptForm.name).length;
        const finalDeptForm = {
          ...deptForm,
          staffCount: computedCount
        };
        await saveDepartment(finalDeptForm as Department);
        setDepartments(prev => {
          const idx = prev.findIndex(d => d.id === deptForm.id);
          if (idx > -1) {
            showToast(`💾 Đã cập nhật tổ chuyên môn: ${deptForm.name}`);
            return prev.map(d => d.id === deptForm.id ? (finalDeptForm as Department) : d);
          } else {
            showToast(`✨ Đã tạo tổ chuyên môn mới: ${deptForm.name}`);
            return [...prev, finalDeptForm as Department];
          }
        });
      } catch (err) {
        showToast("❌ Không thể lưu tổ chuyên môn.");
      }
    } else if (activeTab === 'subjects') {
      try {
        await saveSubject(subForm as Subject);
        setSubjects(prev => {
          const idx = prev.findIndex(s => s.id === subForm.id);
          if (idx > -1) {
            showToast(`💾 Đã cập nhật môn học: ${subForm.name}`);
            return prev.map(s => s.id === subForm.id ? (subForm as Subject) : s);
          } else {
            showToast(`✨ Đã thêm môn học mới: ${subForm.name}`);
            return [...prev, subForm as Subject];
          }
        });
      } catch (err) {
        showToast("❌ Không thể lưu môn học.");
      }
    }
    setIsModalOpen(false);
  };

  const toggleDeactivate = async (id: string, type: 'dept' | 'sub') => {
    if (type === 'dept') {
      const dept = departments.find(d => d.id === id);
      if (!dept) return;
      const next = dept.status === 'Hoạt Động' ? 'Ngừng Hoạt Động' : 'Hoạt Động';
      try {
        await saveDepartment({ ...dept, status: next });
        setDepartments(prev => prev.map(d => {
          if (d.id === id) {
            showToast(`🔄 Đổi trạng thái ${d.name} -> ${next}`);
            return { ...d, status: next };
          }
          return d;
        }));
      } catch (err) {
        showToast("❌ Lỗi đổi trạng thái.");
      }
    } else if (type === 'sub') {
      const sub = subjects.find(s => s.id === id);
      if (!sub) return;
      const next = sub.status === 'Đang Giảng Dạy' ? 'Ngưng Giảng Dạy' : 'Đang Giảng Dạy';
      try {
        await saveSubject({ ...sub, status: next });
        setSubjects(prev => prev.map(s => {
          if (s.id === id) {
            showToast(`🔄 Đổi trạng thái ${s.name} -> ${next}`);
            return { ...s, status: next };
          }
          return s;
        }));
      } catch (err) {
        showToast("❌ Lỗi đổi trạng thái.");
      }
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa tổ chuyên môn ${dept.name}?`)) {
      try {
        await deleteDepartment(id);
        setDepartments(prev => prev.filter(d => d.id !== id));
        showToast(`🗑️ Đã xóa tổ chuyên môn ${dept.name} thành công!`);
      } catch (err) {
        showToast("❌ Không thể xóa tổ chuyên môn.");
      }
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const sub = subjects.find(s => s.id === id);
    if (!sub) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa môn học ${sub.name}?`)) {
      try {
        await deleteSubject(id);
        setSubjects(prev => prev.filter(s => s.id !== id));
        showToast(`🗑️ Đã xóa môn học ${sub.name} thành công!`);
      } catch (err) {
        showToast("❌ Không thể xóa môn học.");
      }
    }
  };

  const isSubjectInDept = (subjName: string) => {
    if (!deptForm.description) return false;
    const cleanDesc = deptForm.description.toLowerCase();
    const cleanName = subjName.toLowerCase();
    
    if (cleanDesc.includes(cleanName)) return true;
    
    if (cleanName === 'vật lý' && (cleanDesc.includes('lý') || cleanDesc.includes('vật lí') || cleanDesc.includes('lí'))) return true;
    if (cleanName === 'tin học' && cleanDesc.includes('tin')) return true;
    if (cleanName === 'toán học' && cleanDesc.includes('toán')) return true;
    if (cleanName === 'ngữ văn' && (cleanDesc.includes('văn') || cleanDesc.includes('ngữ văn'))) return true;
    
    return false;
  };

  const handleToggleSubjectInDept = (subjName: string) => {
    if (isReadMode) return;
    
    const currentlySelected = isSubjectInDept(subjName);
    
    let newSelectedList: string[] = [];
    subjects.forEach(s => {
      const isSelected = s.name === subjName ? !currentlySelected : isSubjectInDept(s.name);
      if (isSelected) {
        newSelectedList.push(s.name);
      }
    });
    
    setDeptForm(prev => ({
      ...prev,
      description: newSelectedList.join(', ')
    }));
  };

  const renderReadDetailView = () => {
    if (activeTab === 'departments') {
      const d = deptForm;
      const members = staffList.filter(s => s.department === d.name);
      const subjectsInCharge = d.description
        ? d.description.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const LogoIcon = getDepartmentIcon(d.logo);

      return (
        <div className="space-y-6">
          {/* Header info */}
          <div className="bg-[#e8eef6] border border-[#b8c6d9] p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 text-[#2c5ea0] flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden">
                {d.logo && isImageUrl(d.logo) ? (
                  <img src={d.logo} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <LogoIcon className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Mã tổ chuyên môn: {d.id}</span>
                <h4 className="text-2xl font-serif font-bold text-[#1e2a3a] mt-1">{d.name}</h4>
              </div>
            </div>
            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              d.status === 'Hoạt Động' ? 'bg-[#2e6b8a] text-[#f5f8fc]' : 'bg-[#2c5ea0] text-[#f5f8fc]'
            }`}>
              {d.status === 'Hoạt Động' ? 'Hoạt Động (Active)' : 'Tạm Khóa (Locked)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Card: Head of Dept */}
            <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
              <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                Tổ trưởng chuyên môn
              </h5>
              {d.head ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2c5ea0] text-[#f5f8fc] font-bold font-serif text-lg rounded-full flex items-center justify-center shadow-sm">
                    {d.head.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#1e2a3a]">{d.head}</p>
                    <p className="text-xs text-[#7b8a9e] font-medium mt-0.5">Giáo viên tổ trưởng</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Chưa bổ nhiệm tổ trưởng</div>
              )}
            </div>

            {/* Middle Card: Deputy Head of Dept */}
            <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
              <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                <UserCheck className="w-3.5 h-3.5 mr-1.5 text-[#2e6b8a]" />
                Tổ phó chuyên môn
              </h5>
              {d.deputyHead ? (
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2e6b8a] text-[#f5f8fc] font-bold font-serif text-lg rounded-full flex items-center justify-center shadow-sm">
                    {d.deputyHead.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <p className="font-bold text-base text-[#1e2a3a]">{d.deputyHead}</p>
                    <p className="text-xs text-[#7b8a9e] font-medium mt-0.5">Giáo viên tổ phó</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Chưa bổ nhiệm tổ phó</div>
              )}
            </div>

            {/* Right Card: Stats */}
            <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
              <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                <Users className="w-3.5 h-3.5 mr-1.5 text-[#2e6b8a]" />
                Sĩ số giáo viên / nhân sự
              </h5>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif font-bold text-[#2c5ea0]">{members.length}</span>
                <span className="text-xs text-[#7b8a9e] font-bold uppercase tracking-wider">Nhân sự chính thức thuộc tổ</span>
              </div>
            </div>
          </div>

          {/* Subjects or Grades in charge */}
          <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
            <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1.5 text-[#4a5568]" />
              {d.type === 'Tổ khối lớp' ? 'Khối lớp phụ trách giảng dạy' : 'Môn học phụ trách giảng dạy'}
            </h5>
            {d.type === 'Tổ khối lớp' ? (
              d.applicableGrades && d.applicableGrades.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {d.applicableGrades.map((g, idx) => (
                    <span key={idx} className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full text-xs font-bold text-indigo-700 flex items-center">
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                      Khối {g}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Chưa phân công khối lớp phụ trách.</div>
              )
            ) : (
              subjectsInCharge.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {subjectsInCharge.map((s, idx) => {
                    const count = getSubjectTeacherCount(s);
                    return (
                      <span key={idx} className="px-3.5 py-1.5 bg-[#e8eef6] border border-[#b8c6d9] rounded-full text-xs font-bold text-[#2c5ea0] flex items-center">
                        <span className="w-1.5 h-1.5 bg-[#2e6b8a] rounded-full mr-2"></span>
                        {s} ({count} GV)
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Không có môn học trực thuộc phụ trách.</div>
              )
            )}
          </div>

          {/* Members list */}
          <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
            <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
              Danh sách thành viên tổ chuyên môn ({members.length})
            </h5>
            {members.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-1">
                {members.map(m => (
                  <div key={m.id} className="p-3 bg-[#f5f8fc] border border-[#dce4ee] hover:border-[#b8c6d9] rounded-xl flex items-center gap-3 transition-colors">
                    <div className="w-9 h-9 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] font-serif font-bold text-sm rounded-full flex items-center justify-center flex-shrink-0">
                      {m.name.split(' ').slice(-1)[0][0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-[#1e2a3a] truncate">{m.name}</p>
                      <p className="text-[10px] text-[#7b8a9e] mt-0.5 truncate">{m.role || 'Giáo viên'}</p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      m.status === 'Đang Công Tác' ? 'bg-[#2e6b8a]' : m.status === 'Nghỉ Phép' ? 'bg-[#a8c4e0]' : 'bg-[#2c5ea0]'
                    }`} title={m.status}></span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Chưa cập nhật danh sách thành viên thuộc tổ này.</div>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 'subjects') {
      const s = subForm;
      const deptsInCharge = departments.filter(d => 
        d.description && d.description.toLowerCase().includes(s.name?.toLowerCase() || '')
      );

      return (
        <div className="space-y-6">
          {/* Header info */}
          <div className="bg-[#e8eef6] border border-[#b8c6d9] p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Mã môn học: {s.id}</span>
              <h4 className="text-2xl font-serif font-bold text-[#1e2a3a] mt-1">{s.name}</h4>
            </div>
            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              s.status === 'Đang Giảng Dạy' ? 'bg-[#2e6b8a] text-[#f5f8fc]' : 'bg-[#2c5ea0] text-[#f5f8fc]'
            }`}>
              {s.status === 'Đang Giảng Dạy' ? 'Đang Giảng Dạy (Active)' : 'Ngưng Giảng Dạy (Suspended)'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Card: Type */}
            <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between">
              <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                <FileText className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                Phân Loại GDPT 2018
              </h5>
              <div className="py-2">
                <span className="px-4 py-2 bg-[#e8eef6] border border-[#b8c6d9] text-[#2c5ea0] font-bold text-xs uppercase tracking-widest rounded-lg">
                  {s.type}
                </span>
              </div>
            </div>

            {/* Right Card: Hours */}
            <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
              <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                <BookOpen className="w-3.5 h-3.5 mr-1.5 text-[#2e6b8a]" />
                Thời lượng giảng dạy
              </h5>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-serif font-bold text-[#2c5ea0]">{s.hoursPerWeek}</span>
                <span className="text-xs text-[#7b8a9e] font-bold uppercase tracking-wider">Tiết học / tuần</span>
              </div>
            </div>
          </div>

          {/* Departments teaching this */}
          <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
            <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
              <Users className="w-3.5 h-3.5 mr-1.5 text-[#2e6b8a]" />
              Tổ chuyên môn chịu trách nhiệm ({s.type === 'Trải nghiệm' ? 0 : deptsInCharge.length})
            </h5>
            {s.type === 'Trải nghiệm' ? (
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-4 leading-relaxed">
                ℹ️ Môn học thuộc hoạt động trải nghiệm do Giáo viên chủ nhiệm các lớp tự đảm nhiệm giảng dạy, không trực thuộc tổ chuyên môn riêng biệt nào.
              </div>
            ) : deptsInCharge.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {deptsInCharge.map(d => (
                  <div key={d.id} className="p-4 bg-[#f5f8fc] border border-[#dce4ee] hover:border-[#b8c6d9] rounded-xl flex flex-col justify-between transition-colors">
                    <div>
                      <p className="font-bold text-sm text-[#1e2a3a]">{d.name}</p>
                      <p className="text-xs text-[#7b8a9e] mt-1 font-medium truncate">Tổ trưởng: {d.head || 'Chưa bổ nhiệm'}</p>
                    </div>
                    <div className="mt-3 pt-3 border-t border-dashed border-[#dce4ee] flex justify-between items-center text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">
                      <span>Mã Tổ: {d.id}</span>
                      <span className="text-[#2c5ea0]">{d.staffCount} Giáo viên</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Hiện chưa gán tổ chuyên môn nào chịu trách nhiệm giảng dạy môn học này.</div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  // Filters logic
  const filteredDepts = departments.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.head.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubs = subjects.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentListLength = activeTab === 'departments' ? filteredDepts.length 
                            : filteredSubs.length;

  const totalPages = Math.ceil(currentListLength / pageSize);

  const paginatedDepts = filteredDepts.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedSubs = filteredSubs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Filter out subjects already assigned to other departments
  const assignedToOtherDepts = departments
    .filter(d => d.id !== deptForm.id)
    .reduce((acc, d) => {
      if (d.description) {
        const parts = d.description.split(',').map(s => s.trim().toLowerCase());
        parts.forEach(p => {
          if (p) acc.add(p);
        });
      }
      return acc;
    }, new Set<string>());

  const availableSubjectsForDept = subjects.filter(s => {
    // Chỉ hiển thị môn chuyên biệt trong danh mục môn học phụ trách của tổ chuyên môn
    if (s.type !== 'Chuyên biệt') return false;
    // Keep it if it is already selected in the current department OR not assigned to any other
    return isSubjectInDept(s.name) || !assignedToOtherDepts.has(s.name.toLowerCase());
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative ">
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-[#f5f8fc] border border-[#b8c6d9] px-6 py-3 rounded-2xl shadow-lg flex items-center font-bold text-xs uppercase tracking-wider animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 mr-2 text-green-400" /> {toast}
        </div>
      )}

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Tổ chuyên môn & Môn học</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">Quản lý định hình cơ cấu học thuật nhà trường</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 sm:mt-0">
            <div className="flex bg-[#f5f8fc] p-1 border border-[#b8c6d9] shadow-inner rounded-full">
              <button 
                onClick={() => setActiveTab('departments')}
                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition rounded-full border ${activeTab === 'departments' ? 'bg-[#e8eef6] shadow-[1px_1px_0px_#8e9eb4] text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#7b8a9e] border-transparent hover:text-[#1e2a3a]'}`}
              >
                Tổ Chuyên Môn
              </button>
              <button 
                onClick={() => setActiveTab('subjects')}
                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition rounded-full border ${activeTab === 'subjects' ? 'bg-[#e8eef6] shadow-[1px_1px_0px_#8e9eb4] text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#7b8a9e] border-transparent hover:text-[#1e2a3a]'}`}
              >
                Môn Học
              </button>
            </div>
            
            <button 
              onClick={handleOpenCreateModal}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'departments' ? 'Thêm Tổ Mới' : 'Thêm Môn Mới'}
            </button>
          </div>
        </div>

        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col rounded-3xl overflow-hidden relative min-h-0 h-[600px]">
          <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
             <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-[#2c5ea0] text-xs flex items-center">
               {activeTab === 'departments' && <Users className="w-4 h-4 mr-2" />}
               {activeTab === 'subjects' && <BookOpen className="w-4 h-4 mr-2" />}
               Danh Sách {activeTab === 'departments' ? 'TỔ CHUYÊN MÔN' : 'MÔN HỌC'}
             </h3>
             <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tra cứu nhanh..."
                    className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                  />
                </div>
             </div>
          </div>

          <div className="flex-1 min-h-0 overflow-auto w-full">
            <table className="w-full min-w-[850px] text-sm text-left">
              <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-[0_1px_0_#b8c6d9]">
                {activeTab === 'departments' && (
                  <tr>
                    <th className="px-6 py-4">Mã Tổ</th>
                    <th className="px-6 py-4">Tên Tổ Chuyên Môn</th>
                    <th className="px-6 py-4">Tổ Trưởng</th>
                    <th className="px-6 py-4 text-center">Sĩ Số Giáo Viên</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4 text-right">Tác Vụ</th>
                  </tr>
                )}
                {activeTab === 'subjects' && (
                  <tr>
                    <th className="px-6 py-4">Mã Môn</th>
                    <th className="px-6 py-4">Tên Môn Học</th>
                    <th className="px-6 py-4">Phân Loại GDPT</th>
                    <th className="px-6 py-4 text-center">Số Tiết / Tuần</th>
                    <th className="px-6 py-4 text-center">Khối Áp Dụng</th>
                    <th className="px-6 py-4 text-center">Số lượng GV</th>
                    <th className="px-6 py-4">Trạng Thái</th>
                    <th className="px-6 py-4 text-right">Tác Vụ</th>
                  </tr>
                )}

              </thead>
              <tbody className="divide-y divide-[#b8c6d9]">
                {/* 1. DEPARTMENTS */}
                {activeTab === 'departments' && paginatedDepts.map(d => {
                  const LogoIcon = getDepartmentIcon(d.logo);
                  return (
                    <tr key={d.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs text-[#7b8a9e]">{d.id}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 text-[#2c5ea0] flex items-center justify-center rounded-full flex-shrink-0 overflow-hidden">
                            {d.logo && isImageUrl(d.logo) ? (
                              <img src={d.logo} alt="" className="w-full h-full object-cover rounded-full" />
                            ) : (
                              <LogoIcon className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-[#1e2a3a]">{d.name}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                                Tổ khối lớp
                              </span>
                              {d.applicableGrades && d.applicableGrades.length > 0 ? (
                                d.applicableGrades.map((g, idx) => (
                                  <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">
                                    Khối {g}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-[#7b8a9e] italic">Chưa gán khối</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-[#4a5568]">{d.head || 'Chưa bổ nhiệm'}</p>
                        {d.deputyHead && <p className="text-xs text-[#7b8a9e] mt-0.5">Phó: {d.deputyHead}</p>}
                      </td>
                      <td className="px-6 py-5 text-center font-serif text-lg font-bold text-[#2c5ea0]">
                        {staffList.filter(s => s.department === d.name).length}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          d.status === 'Hoạt Động' ? 'bg-[#2e6b8a] text-[#f5f8fc]' : 'bg-[#2c5ea0] text-[#f5f8fc]'
                        }`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionMenu
                          primaryAction={{
                            label: 'Xem chi tiết',
                            icon: 'Eye',
                            onClick: () => handleOpenReadOrEditModal(d, 'read')
                          }}
                          actions={[
                            {
                              label: 'Cập nhật Tổ chuyên môn',
                              icon: 'Edit',
                              onClick: () => handleOpenReadOrEditModal(d, 'edit')
                            },
                            {
                              label: d.status === 'Hoạt Động' ? 'Ngưng hoạt động (Lock)' : 'Kích hoạt',
                              icon: d.status === 'Hoạt Động' ? 'ShieldAlert' : 'Check',
                              onClick: () => toggleDeactivate(d.id, 'dept'),
                              danger: d.status === 'Hoạt Động'
                            },
                            {
                              label: 'Xóa tổ chuyên môn',
                              icon: 'Trash',
                              onClick: () => handleDeleteDepartment(d.id),
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}

                {/* 2. SUBJECTS */}
                {activeTab === 'subjects' && paginatedSubs.map(s => {
                  const teacherCount = s.type === 'Trải nghiệm'
                    ? staffList.filter(staff => staff.assignedClass && staff.assignedClass !== 'Không phân công' && staff.assignedClass.trim() !== '').length
                    : staffList.filter(staff => {
                        if (!staff.mainSubject) return false;
                        const cleanStaffSub = staff.mainSubject.trim().toLowerCase().replace(/í/g, 'y').replace(/ /g, '');
                        const cleanDbSub = s.name.trim().toLowerCase().replace(/í/g, 'y').replace(/ /g, '');
                        return cleanStaffSub === cleanDbSub || cleanStaffSub.split(',').includes(cleanDbSub);
                      }).length;

                  return (
                    <tr key={s.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs text-[#7b8a9e]">{s.id}</td>
                      <td className="px-6 py-5 font-bold text-[#1e2a3a]">{s.name}</td>
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{s.type}</td>
                      <td className="px-6 py-5 text-center">
                        <div className="flex flex-col gap-1 items-center justify-center">
                          <div className="flex flex-wrap gap-1 justify-center max-w-[200px]">
                            {['1', '2', '3', '4', '5'].map((g) => {
                              const hours = s.hoursPerGrade?.[g] ?? 0;
                              if (hours === 0) return null;
                              return (
                                <span key={g} className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 text-[9px] font-bold text-[#2c5ea0]">
                                  K{g}: {hours}t
                                </span>
                              );
                            })}
                          </div>
                          {(!s.hoursPerGrade || Object.values(s.hoursPerGrade).every(h => h === 0)) && (
                            <span className="font-serif text-sm font-bold text-[#2c5ea0]">{s.hoursPerWeek} tiết</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        {s.hoursPerGrade && Object.values(s.hoursPerGrade).some(h => h > 0) ? (
                          <div className="flex flex-wrap gap-1 justify-center max-w-[200px] mx-auto">
                            {['1', '2', '3', '4', '5'].map((g) => {
                              const hours = s.hoursPerGrade?.[g] ?? 0;
                              if (hours === 0) return null;
                              return (
                                <span key={g} className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-bold text-gray-600">
                                  Khối {g}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-gray-100 text-gray-500 border border-gray-200">
                            Tất cả các khối
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center font-serif text-lg font-bold text-[#2c5ea0]">
                        {teacherCount}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          s.status === 'Đang Giảng Dạy' ? 'bg-[#2e6b8a] text-[#f5f8fc]' : 'bg-[#2c5ea0] text-[#f5f8fc]'
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionMenu
                          primaryAction={{
                            label: 'Xem chi tiết',
                            icon: 'Eye',
                            onClick: () => handleOpenReadOrEditModal(s, 'read')
                          }}
                          actions={[
                            {
                              label: 'Biên tập môn học',
                              icon: 'Edit',
                              onClick: () => handleOpenReadOrEditModal(s, 'edit')
                            },
                            {
                              label: s.status === 'Đang Giảng Dạy' ? 'Đổi sang ngưng giảng dạy' : 'Cho phép giảng dạy lại',
                              icon: s.status === 'Đang Giảng Dạy' ? 'ShieldAlert' : 'Check',
                              onClick: () => toggleDeactivate(s.id, 'sub'),
                              danger: s.status === 'Đang Giảng Dạy'
                            },
                            {
                              label: 'Xóa môn học',
                              icon: 'Trash',
                              onClick: () => handleDeleteSubject(s.id),
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}

              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={currentListLength}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>

      {/* DYNAMIC MODAL (For simple master data entities) */}
      <ModalBase
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={
          isReadMode ? `Chi Tiết Thông Tin - ${activeTab === 'departments' ? 'Tổ Chuyên Môn' : 'Môn Học'}` : 
          selectedItem ? `Biên Tập / Cập Nhật Danh Mục` : `Tạo Mới Danh Mục`
        }
        subtitle="Hệ thống cấu trúc hành chính số th Vân Khánh"
        width={isReadMode ? "max-w-2xl" : "max-w-xl"}
      >
        {isReadMode ? (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#f5f8fc]">
            <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6">
              {renderReadDetailView()}
            </div>
            <div className="p-6 border-t border-dashed border-[#b8c6d9] flex justify-end items-center bg-[#f5f8fc] shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveModal} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
              {activeTab === 'departments' && (
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="dept-code-input">Mã ID Tổ Chuyên Môn</label>
                    <input 
                      id="dept-code-input"
                      type="text" 
                      value={deptForm.id || ''} 
                      disabled 
                      className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="dept-name-input">Tên Tổ Chuyên Môn *</label>
                    <input 
                      id="dept-name-input"
                      type="text" 
                      value={deptForm.name || ''} 
                      onChange={e => setDeptForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      disabled={isReadMode}
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none focus:border-[#2c5ea0]" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Phân Loại Tổ Chuyên Môn</label>
                    <input 
                      type="text" 
                      value="Tổ khối lớp" 
                      disabled 
                      className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#4a5568]" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1"></div>

                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Khối Phụ Trách *</label>
                    <div className="p-4 border border-[#b8c6d9] rounded-xl bg-white grid grid-cols-2 sm:grid-cols-4 gap-3 shadow-inner">
                      {['Nhà trẻ', 'Mầm', 'Chồi', 'Lá'].map(g => {
                        const isChecked = deptForm.applicableGrades?.includes(g) || false;
                        return (
                          <label key={g} className="flex items-center space-x-3 cursor-pointer group py-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setDeptForm(prev => {
                                  const current = prev.applicableGrades || [];
                                  const next = current.includes(g)
                                    ? current.filter(item => item !== g)
                                    : [...current, g];
                                  return { ...prev, applicableGrades: next };
                                });
                              }}
                              disabled={isReadMode}
                              className="w-4 h-4 rounded text-[#2c5ea0] border-[#b8c6d9] focus:ring-[#2c5ea0]/20 cursor-pointer disabled:opacity-50"
                            />
                            <span className={`text-xs font-bold transition-colors ${isChecked ? 'text-[#2c5ea0]' : 'text-[#4a5568] group-hover:text-[#1e2a3a]'} ${isReadMode ? 'cursor-not-allowed opacity-75' : ''}`}>
                              Khối {g}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-[#7b8a9e] mt-1.5 font-medium">Tích chọn các khối lớp mầm non mà tổ chuyên môn này phụ trách chính.</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="dept-head-select">Tổ Trưởng Chuyên Môn</label>
                    <select 
                      id="dept-head-select"
                      value={deptForm.head || ''} 
                      onChange={e => setDeptForm(prev => ({ ...prev, head: e.target.value }))}
                      disabled={isReadMode}
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none focus:border-[#2c5ea0]"
                    >
                      <option value="">-- Chọn tổ trưởng --</option>
                      {staffList.filter(s => s.department === deptForm.name && s.name !== deptForm.deputyHead).map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.role || 'Giáo viên'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="dept-deputy-select">Tổ Phó Chuyên Môn</label>
                    <select 
                      id="dept-deputy-select"
                      value={deptForm.deputyHead || ''} 
                      onChange={e => setDeptForm(prev => ({ ...prev, deputyHead: e.target.value }))}
                      disabled={isReadMode}
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none focus:border-[#2c5ea0]"
                    >
                      <option value="">-- Chọn tổ phó --</option>
                      {staffList.filter(s => s.department === deptForm.name && s.name !== deptForm.head).map(s => (
                        <option key={s.id} value={s.name}>{s.name} ({s.role || 'Giáo viên'})</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="dept-count-input">Số Lượng Nhân Sự</label>
                    <input 
                      id="dept-count-input"
                      type="number" 
                      value={deptForm.name ? staffList.filter(s => s.department === deptForm.name).length : 0} 
                      disabled
                      className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:outline-none" 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="dept-status-select">Trạng Thái Toàn Hệ Thống</label>
                    <select
                      id="dept-status-select"
                      value={deptForm.status || 'Hoạt Động'}
                      onChange={e => setDeptForm(prev => ({ ...prev, status: e.target.value as any }))}
                      disabled={isReadMode}
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none"
                    >
                      <option value="Hoạt Động">Hoạt Động (Active)</option>
                      <option value="Ngừng Hoạt Động">Ngừng Hoạt Động (Inactive / Locked)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="dept-logo-select">Biểu trưng / Logo đại diện</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="block text-[9px] text-[#7b8a9e] mb-1 font-bold">Chọn từ biểu tượng có sẵn</span>
                        <select
                          id="dept-logo-select"
                          value={isImageUrl(deptForm.logo) ? 'custom' : (deptForm.logo || 'school')}
                          onChange={e => {
                            const val = e.target.value;
                            if (val !== 'custom') {
                              setDeptForm(prev => ({ ...prev, logo: val }));
                            } else {
                              setDeptForm(prev => ({ ...prev, logo: '' }));
                            }
                          }}
                          disabled={isReadMode}
                          className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none"
                        >
                          <option value="calculator">Toán - Tin (Máy tính)</option>
                          <option value="book">Ngữ Văn (Cuốn sách)</option>
                          <option value="globe">Ngoại Ngữ (Địa cầu)</option>
                          <option value="science">Khoa học Tự nhiên (Nguyên tử)</option>
                          <option value="social">Khoa học Xã hội (La bàn)</option>
                          <option value="art">Nghệ thuật (Bảng màu)</option>
                          <option value="sport">Thể chất / Thể dục (Nhịp động)</option>
                          <option value="office">Hành chính / Văn phòng (Cặp tài liệu)</option>
                          <option value="school">Mặc định (Ngôi trường)</option>
                          <option value="custom">-- URL biểu tượng tùy chỉnh --</option>
                        </select>
                      </div>
                      <div>
                        <span className="block text-[9px] text-[#7b8a9e] mb-1 font-bold">Hoặc nhập URL hình ảnh (Icon URL)</span>
                        <input
                          id="dept-logo-url"
                          type="text"
                          placeholder="https://example.com/logo.png"
                          value={isImageUrl(deptForm.logo) ? deptForm.logo : ''}
                          onChange={e => setDeptForm(prev => ({ ...prev, logo: e.target.value }))}
                          disabled={isReadMode}
                          className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none focus:border-[#2c5ea0]"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-[#7b8a9e] mt-1.5 font-medium">
                      Bạn có thể chọn biểu tượng Lucide mặc định hoặc dán trực tiếp đường dẫn hình ảnh (URL) để làm logo riêng cho tổ.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'subjects' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5" htmlFor="sub-code-input">Mã Môn Học</label>
                    <input 
                      id="sub-code-input"
                      type="text" 
                      value={subForm.id || ''} 
                      disabled 
                      className="w-full px-3.5 py-2 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5" htmlFor="sub-name-input">Tên Môn Học *</label>
                    <input 
                      id="sub-name-input"
                      type="text" 
                      value={subForm.name || ''} 
                      onChange={e => setSubForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                      disabled={isReadMode}
                      className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none focus:border-[#2c5ea0]" 
                    />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5" htmlFor="sub-type-select">Phân Loại GDPT 2018</label>
                    <select
                      id="sub-type-select"
                      value={subForm.type || 'Bắt buộc'}
                      onChange={e => setSubForm(prev => ({ ...prev, type: e.target.value as any }))}
                      disabled={isReadMode}
                      className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none"
                    >
                      <option value="Bắt buộc">Bắt buộc</option>
                      <option value="Chuyên biệt">Chuyên biệt</option>
                      <option value="Trải nghiệm">Trải nghiệm</option>
                    </select>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5" htmlFor="sub-status-select">Trạng Thái Giảng Dạy</label>
                    <select
                      id="sub-status-select"
                      value={subForm.status || 'Đang Giảng Dạy'}
                      onChange={e => setSubForm(prev => ({ ...prev, status: e.target.value as any }))}
                      disabled={isReadMode}
                      className="w-full px-3.5 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none"
                    >
                      <option value="Đang Giảng Dạy">Đang Giảng Dạy (Active)</option>
                      <option value="Ngưng Giảng Dạy">Ngưng Giảng Dạy (Inactive / Locked)</option>
                    </select>
                  </div>

                  {/* Khối Áp Dụng & Số Tiết/Tuần */}
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">
                      Khối Áp Dụng & Số Tiết / Tuần
                    </label>
                    {isReadMode ? (
                      <div className="flex flex-wrap gap-1.5">
                        {['1', '2', '3', '4', '5'].map((grade) => {
                          const hours = subForm.hoursPerGrade?.[grade] ?? 0;
                          if (hours === 0) return null;
                          return (
                            <div key={grade} className="bg-[#e8eef6] border border-[#b8c6d9] rounded-xl px-3 py-1.5 text-center flex items-center gap-1.5 font-bold">
                              <span className="text-xs text-[#2c5ea0]">Khối {grade}</span>
                              <span className="w-1 h-1 bg-[#b8c6d9] rounded-full"></span>
                              <span className="text-xs text-[#1e2a3a]">{hours} tiết/tuần</span>
                            </div>
                          );
                        })}
                        {(!subForm.hoursPerGrade || Object.values(subForm.hoursPerGrade).every(h => h === 0)) && (
                          <span className="text-xs text-[#7b8a9e] italic p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl w-full text-center">
                            Chưa cấu hình khối áp dụng (Mặc định: Tất cả các khối, {subForm.hoursPerWeek || 2} tiết/tuần)
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-5 gap-2">
                          {['1', '2', '3', '4', '5'].map((grade) => {
                            const hours = subForm.hoursPerGrade?.[grade] ?? 0;
                            const isEnabled = hours > 0;
                            return (
                              <div key={grade} className={`p-2 rounded-xl border transition-all flex flex-col gap-1.5 ${
                                isEnabled 
                                  ? 'bg-[#2c5ea0]/5 border-[#2c5ea0]/40 shadow-sm' 
                                  : 'bg-white border-gray-200 opacity-80 hover:opacity-100'
                              }`}>
                                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                  <input 
                                    type="checkbox"
                                    checked={isEnabled}
                                    onChange={(e) => {
                                      const nextHours = { ...(subForm.hoursPerGrade || {}) };
                                      if (e.target.checked) {
                                        nextHours[grade] = subForm.hoursPerWeek || 2;
                                      } else {
                                        nextHours[grade] = 0;
                                      }
                                      setSubForm(prev => ({ 
                                        ...prev, 
                                        hoursPerGrade: nextHours 
                                      }));
                                    }}
                                    className="rounded text-[#2c5ea0] focus:ring-[#2c5ea0] w-3.5 h-3.5"
                                  />
                                  <span className="text-xs font-bold text-[#1e2a3a]">K{grade}</span>
                                </label>
                                
                                {isEnabled && (
                                  <div className="flex items-center gap-1">
                                    <input 
                                      type="number" 
                                      min="1"
                                      max="20"
                                      value={hours} 
                                      onChange={(e) => {
                                        const val = Math.max(1, Number(e.target.value));
                                        const nextHours = { ...(subForm.hoursPerGrade || {}) };
                                        nextHours[grade] = val;
                                        setSubForm(prev => ({ 
                                          ...prev, 
                                          hoursPerGrade: nextHours,
                                          hoursPerWeek: val
                                        }));
                                      }}
                                      className="w-full px-1.5 py-0.5 bg-white border border-[#b8c6d9] rounded-lg text-xs font-bold text-center text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]" 
                                    />
                                    <span className="text-[8px] font-bold text-[#7b8a9e] whitespace-nowrap">tiết</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-[#7b8a9e] font-medium leading-relaxed">
                          Mẹo: Tích chọn các khối lớp học môn này và điều chỉnh số tiết giảng dạy mỗi tuần cho khối đó.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}


            </div>

            <div className="p-6 border-t border-dashed border-[#b8c6d9] flex justify-between items-center bg-[#f5f8fc] shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"
              >
                Hủy
              </button>
              {modalMode === 'edit' && (
                <button 
                  type="submit"
                  className="flex items-center px-6 py-2.5 bg-[#2e6b8a] text-[#f5f8fc] border border-[#1e4f6a] text-xs uppercase tracking-widest font-bold hover:bg-[#1e4f6a] transition shadow-[2px_2px_0px_#131a25] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
                >
                  Lưu Danh Mục
                </button>
              )}
            </div>
          </form>
        )}
      </ModalBase>
    </main>
  );
};
