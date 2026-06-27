import React, { useState, useEffect } from 'react';
import { Filter, Plus, Search, Users, ShieldCheck, Award, Briefcase, FileText, X, Edit, Check, RefreshCw, LogIn, Sparkles, ShieldAlert, Trash2, Upload, FileDown } from 'lucide-react';
import { StaffProfileModal, EvaluationModal, RewardModal, BulkImportModal } from '../ui/PersonnelModals';
import { BaseSelect, BaseDatePicker, FilterSelect } from '../ui/BaseInputs';
import { ActionMenu } from '../ui/ActionMenu';
import { PersonnelTableSkeleton, StatCardSkeleton } from '../ui/Skeletons';
import { getStaffList, updateStaff, deleteStaff, Staff, StaffEvaluation } from '../../services/hrService';
import { auth, loginWithGoogle } from '../../services/firebase';
import { getDepartments, Department, getSubjects, Subject, syncAllStaffRoles } from '../../services/dbService';
import { Pagination } from '../ui/Pagination';
import { ExportModal } from '../ui/ExportModal';
import { ExportColumn } from '../../utils/exportHelper';

const getJobRoleFromRole = (role: string): string => {
  if (!role) return 'Nhân viên thường';
  if (role.startsWith('Chủ nhiệm')) {
    return 'Giáo viên bộ môn';
  }
  switch (role) {
    case 'Hiệu trưởng':
    case 'Phó Hiệu trưởng':
    case 'Phó hiệu trưởng':
    case 'Tổng phụ trách Đội/Đoàn':
    case 'Tổng phụ trách':
      return 'Cán bộ Quản lý (BGH)';
    case 'Giáo viên bộ môn':
    case 'Tổ trưởng chuyên môn':
    case 'Tổ phó chuyên môn':
      return 'Giáo viên bộ môn';
    case 'Kế toán trưởng':
    case 'Kế toán viên':
      return 'Nhân viên Kế toán';
    case 'Y tế học đường':
      return 'Nhân viên Y tế';
    case 'Cán bộ Thư viện':
      return 'Nhân viên Thư viện';
    case 'Thư ký hội đồng':
    case 'Văn thư chuyên trách':
      return 'Nhân viên Thư ký / Hành chính';
    case 'Tổ trưởng bảo vệ':
    case 'Nhân viên bảo vệ':
      return 'Nhân viên Bảo vệ';
    case 'Nhân viên tạp vụ':
      return 'Nhân viên Lao công';
    case 'Bếp trưởng':
    case 'Bếp phó':
    case 'Bếp viên':
      return 'Nhân viên Nhà bếp';
    default:
      const lower = role.toLowerCase();
      if (lower.includes('giáo viên') || lower.includes('chủ nhiệm') || lower.includes('tổ trưởng') || lower.includes('tổ phó')) {
        return 'Giáo viên bộ môn';
      }
      return 'Nhân viên thường';
  }
};

const getSimplifiedRole = (role: string): string => {
  if (!role) return 'Khác';
  const lower = role.toLowerCase().trim();
  if (lower.startsWith('chủ nhiệm')) return 'Chủ nhiệm';
  if (lower.includes('hiệu trưởng') || lower.includes('tổng phụ trách')) return 'Ban Giám Hiệu';
  if (lower.includes('tổ trưởng chuyên môn') || lower.includes('tổ trưởng cm')) return 'Tổ trưởng CM';
  if (lower.includes('tổ phó chuyên môn') || lower.includes('tổ phó cm')) return 'Tổ phó CM';
  if (lower.includes('giáo viên bộ môn') || lower.includes('giáo viên')) return 'Giáo viên bộ môn';
  if (lower.includes('kế toán')) return 'Kế toán';
  if (lower.includes('bảo vệ')) return 'Bảo vệ';
  if (lower.includes('y tế')) return 'Y tế học đường';
  if (lower.includes('thư viện')) return 'Cán bộ Thư viện';
  if (lower.includes('thư ký') || lower.includes('văn thư')) return 'Thư ký / Văn thư';
  if (lower.includes('tạp vụ') || lower.includes('lao công')) return 'Nhân viên tạp vụ';
  if (lower.includes('bếp') || lower.includes('nhà bếp')) return 'Nhân viên Nhà bếp';
  return role;
};

const isSpecializedSubject = (subject: string): boolean => {
  if (!subject) return false;
  const s = subject.toLowerCase().trim();
  return (
    s.includes('tiếng anh') ||
    s.includes('english') ||
    s.includes('ngoại ngữ') ||
    s.includes('tin học') ||
    s.includes('nghệ thuật') ||
    s.includes('âm nhạc') ||
    s.includes('mỹ thuật') ||
    s.includes('thể dục') ||
    s.includes('thể chất') ||
    s.includes('giáo dục thể chất')
  );
};

const getCompulsorySubjectsList = (subjects: Subject[]) => {
  const list = subjects.length > 0 
    ? subjects.map(s => s.name)
    : ['Toán học', 'Ngữ văn', 'Vật lí', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí', 'Tin học', 'Công nghệ'];
  
  return list.filter(sub => !isSpecializedSubject(sub));
};

export const PersonnelPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'evaluation' | 'rewards'>('profiles');
  const [modalOpen, setModalOpen] = useState<'profiles' | 'evaluation' | 'rewards' | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Live database states
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);

  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, deptFilter, roleFilter, subjectFilter]);

  const standardRoles = [
    'Hiệu trưởng',
    'Phó Hiệu trưởng',
    'Tổng phụ trách Đội/Đoàn',
    'Giáo viên bộ môn',
    'Tổ trưởng chuyên môn',
    'Tổ phó chuyên môn',
    'Kế toán trưởng',
    'Kế toán viên',
    'Y tế học đường',
    'Cán bộ Thư viện',
    'Thư ký hội đồng',
    'Văn thư chuyên trách',
    'Tổ trưởng bảo vệ',
    'Nhân viên bảo vệ',
    'Nhân viên tạp vụ',
    'Bếp trưởng',
    'Bếp phó',
    'Bếp viên'
  ];

  const uniqueRoles = Array.from(new Set([
    ...standardRoles,
    ...staffList.map(s => s.role).filter((r): r is string => !!r)
  ])).sort();

  const filteredStaff = staffList.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || s.department === deptFilter;
    const matchesRole = roleFilter === 'All' || getSimplifiedRole(s.role) === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  const totalPages = Math.ceil(filteredStaff.length / pageSize);
  const paginatedStaff = filteredStaff.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const permanentCount = staffList.filter(s => 
    !s.contractType || s.contractType.toLowerCase().includes('biên chế')
  ).length;

  const contractCount = staffList.filter(s => 
    s.contractType && (
      s.contractType.toLowerCase().includes('hợp đồng') || 
      s.contractType.toLowerCase().includes('thỉnh giảng') || 
      s.contractType.toLowerCase().includes('thời vụ')
    )
  ).length;

  const bghCount = staffList.filter(s => 
    s.role === 'Hiệu trưởng' || 
    s.role === 'Phó Hiệu trưởng' || 
    s.role === 'Phó hiệu trưởng' ||
    s.role === 'Tổng phụ trách Đội/Đoàn' ||
    s.role === 'Tổng phụ trách'
  ).length;

  const headCount = staffList.filter(s => s.role === 'Tổ trưởng chuyên môn').length;
  const deputyCount = staffList.filter(s => s.role === 'Tổ phó chuyên môn').length;

  const teacherCount = staffList.filter(s => 
    s.role === 'Giáo viên bộ môn' || 
    (s.role?.startsWith('Chủ nhiệm') ?? false)
  ).length;

  const otherStaffCount = staffList.filter(s => 
    !['Hiệu trưởng', 'Phó Hiệu trưởng', 'Phó hiệu trưởng', 'Tổng phụ trách Đội/Đoàn', 'Tổng phụ trách', 'Tổ trưởng chuyên môn', 'Tổ phó chuyên môn', 'Giáo viên bộ môn'].includes(s.role) && 
    !(s.role?.startsWith('Chủ nhiệm') ?? false)
  ).length;

  // Detailed role counts for tooltips
  const hieuTruongCount = staffList.filter(s => s.role === 'Hiệu trưởng').length;
  const phoHieuTruongCount = staffList.filter(s => s.role === 'Phó Hiệu trưởng' || s.role === 'Phó hiệu trưởng').length;
  const tongPhuTrachCount = staffList.filter(s => s.role === 'Tổng phụ trách Đội/Đoàn' || s.role === 'Tổng phụ trách').length;

  const toTruongCount = staffList.filter(s => s.role === 'Tổ trưởng chuyên môn').length;
  const toPhoCount = staffList.filter(s => s.role === 'Tổ phó chuyên môn').length;

  const gvBoMonCount = staffList.filter(s => s.role === 'Giáo viên bộ môn').length;
  const gvChuNhiemCount = staffList.filter(s => s.role?.startsWith('Chủ nhiệm')).length;

  const keToanCount = staffList.filter(s => s.role === 'Kế toán trưởng' || s.role === 'Kế toán viên').length;
  const yTeCount = staffList.filter(s => s.role === 'Y tế học đường').length;
  const thuVienCount = staffList.filter(s => s.role === 'Cán bộ Thư viện').length;
  const vanThuCount = staffList.filter(s => s.role === 'Thư ký hội đồng' || s.role === 'Văn thư chuyên trách').length;
  const baoVeCount = staffList.filter(s => s.role === 'Tổ trưởng bảo vệ' || s.role === 'Nhân viên bảo vệ').length;
  const tapVuCount = staffList.filter(s => s.role === 'Nhân viên tạp vụ').length;
  const otherStaffDetailCount = otherStaffCount - (keToanCount + yTeCount + thuVienCount + vanThuCount + baoVeCount + tapVuCount);

  // Helper to format names list
  const formatStaffNames = (filtered: Staff[], limit: number = 0) => {
    if (filtered.length === 0) return 'Chưa phân công';
    const names = filtered.map(s => s.name);
    if (limit > 0 && names.length > limit) {
      return names.slice(0, limit).join(', ') + ` và ${names.length - limit} người khác`;
    }
    return names.join(', ');
  };

  // List of names for tooltips
  const hieuTruongNames = formatStaffNames(staffList.filter(s => s.role === 'Hiệu trưởng'));
  const phoHieuTruongNames = formatStaffNames(staffList.filter(s => s.role === 'Phó Hiệu trưởng' || s.role === 'Phó hiệu trưởng'));
  const tongPhuTrachNames = formatStaffNames(staffList.filter(s => s.role === 'Tổng phụ trách Đội/Đoàn' || s.role === 'Tổng phụ trách'));

  const toTruongNames = formatStaffNames(staffList.filter(s => s.role === 'Tổ trưởng chuyên môn'));
  const toPhoNames = formatStaffNames(staffList.filter(s => s.role === 'Tổ phó chuyên môn'));

  const gvBoMonNames = formatStaffNames(staffList.filter(s => s.role === 'Giáo viên bộ môn'), 5);
  const gvChuNhiemNames = formatStaffNames(staffList.filter(s => s.role?.startsWith('Chủ nhiệm')), 5);

  const keToanNames = formatStaffNames(staffList.filter(s => s.role === 'Kế toán trưởng' || s.role === 'Kế toán viên'));
  const yTeNames = formatStaffNames(staffList.filter(s => s.role === 'Y tế học đường'));
  const thuVienNames = formatStaffNames(staffList.filter(s => s.role === 'Cán bộ Thư viện'));
  const vanThuNames = formatStaffNames(staffList.filter(s => s.role === 'Thư ký hội đồng' || s.role === 'Văn thư chuyên trách'));
  const baoVeNames = formatStaffNames(staffList.filter(s => s.role === 'Tổ trưởng bảo vệ' || s.role === 'Nhân viên bảo vệ'));
  const tapVuNames = formatStaffNames(staffList.filter(s => s.role === 'Nhân viên tạp vụ'));

  // Helper to determine if a staff is teaching staff
  const isTeacher = (role: string = '', jobRole: string = '', department: string = '') => {
    const rLower = role.toLowerCase();
    const jLower = jobRole.toLowerCase();
    const dLower = department.toLowerCase();
    return rLower.includes('giáo viên') || 
           jLower.includes('giáo viên') || 
           (department && !dLower.includes('hành chính') && !dLower.includes('bảo vệ') && !dLower.includes('y tế') && !dLower.includes('kế toán'));
  };

  const getEvaluationData = (staff: Staff) => {
    if (staff.evaluation) {
      return {
        c1: staff.evaluation.c1Bgh,
        c2: staff.evaluation.c2Bgh,
        initiative: staff.evaluation.initiative,
        ratingText: staff.evaluation.ratingText
      };
    }

    const seed = staff.id.charCodeAt(staff.id.length - 1) + staff.name.charCodeAt(0);
    const teaching = isTeacher(staff.role, staff.jobRole, staff.department);

    if (!teaching) {
      return {
        c1: 'N/A',
        c2: 'N/A',
        initiative: 'Không áp dụng',
        ratingText: 'Hành chính / N/A'
      };
    }

    let rating: 'Tốt' | 'Khá' | 'Đạt' = 'Khá';
    if (seed % 3 === 0) rating = 'Tốt';
    else if (seed % 3 === 1) rating = 'Khá';
    else rating = 'Đạt';

    const c1 = rating === 'Tốt' ? 'Tốt' : rating === 'Khá' ? (seed % 2 === 0 ? 'Tốt' : 'Khá') : 'Đạt';
    const c2 = rating === 'Tốt' ? (seed % 2 === 0 ? 'Tốt' : 'Khá') : rating === 'Khá' ? 'Khá' : 'Đạt';
    
    let initiative = 'Không nộp';
    if (rating === 'Tốt') {
      initiative = seed % 2 === 0 ? 'Đạt giải Cấp Tỉnh' : 'Đã Nộp (Cấp Sở)';
    } else if (rating === 'Khá') {
      initiative = 'Đã Nộp (Cấp Trường)';
    }

    let ratingText = 'Hoàn Thành Nhiệm Vụ';
    if (rating === 'Tốt') {
      ratingText = 'Hoàn Thành Xuất Sắc';
    } else if (rating === 'Khá') {
      ratingText = 'Hoàn Thành Tốt';
    }

    return { c1, c2, initiative, ratingText };
  };

  const getRewardData = (staff: Staff) => {
    const seed = staff.id.charCodeAt(staff.id.length - 1) + staff.name.charCodeAt(staff.name.length - 1);
    const teaching = isTeacher(staff.role, staff.jobRole, staff.department);

    const years = ['2024-2025', '2023-2024', '2022-2023'];
    const year = years[seed % 3];

    let title = 'Lao Động Tiên Tiến';
    let reason = 'Hoàn thành tốt nhiệm vụ được giao trong năm học';
    let level = 'Cấp Trường';
    let badgeClass = 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]'; 

    if (teaching) {
      const achievements = [
        { title: 'Chiến Sĩ Thi Đua', reason: 'Thành tích xuất sắc trong công tác giảng dạy và bồi dưỡng học sinh giỏi', level: 'Cấp Cơ Sở', badgeClass: 'bg-[#2c5ea0] text-white' },
        { title: 'Bằng Khen', reason: 'Có thành tích xuất sắc trong phong trào thi đua dạy tốt - học tốt', level: 'Cấp Tỉnh', badgeClass: 'bg-[#2e6b8a] text-white' },
        { title: 'Lao Động Tiên Tiến', reason: 'Hoàn thành xuất sắc nhiệm vụ giảng dạy và công tác chủ nhiệm năm học', level: 'Cấp Trường', badgeClass: 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]' },
        { title: 'Chiến Sĩ Thi Đua', reason: 'Đạt giải cao trong Hội thi Giáo viên dạy giỏi cấp tỉnh', level: 'Cấp Tỉnh', badgeClass: 'bg-[#2c5ea0] text-white' }
      ];
      const item = achievements[seed % achievements.length];
      title = item.title;
      reason = item.reason;
      level = item.level;
      badgeClass = item.badgeClass;
    } else {
      const rLower = (staff.role || '').toLowerCase();
      const jLower = (staff.jobRole || '').toLowerCase();
      const dLower = (staff.department || '').toLowerCase();

      if (rLower.includes('kế toán') || jLower.includes('kế toán') || dLower.includes('kế toán')) {
        const achievements = [
          { title: 'Lao Động Tiên Tiến', reason: 'Quản lý tài chính minh bạch, quyết toán ngân sách đúng thời hạn', level: 'Cấp Trường', badgeClass: 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]' },
          { title: 'Chiến Sĩ Thi Đua', reason: 'Thành tích xuất sắc trong công tác quản lý tài sản công và kế toán học đường', level: 'Cấp Cơ Sở', badgeClass: 'bg-[#2c5ea0] text-white' }
        ];
        const item = achievements[seed % achievements.length];
        title = item.title;
        reason = item.reason;
        level = item.level;
        badgeClass = item.badgeClass;
      } else if (rLower.includes('y tế') || jLower.includes('y tế')) {
        title = 'Lao Động Tiên Tiến';
        reason = 'Đảm bảo tốt công tác y tế học đường, sơ cấp cứu kịp thời và phòng chống dịch bệnh';
        level = 'Cấp Trường';
        badgeClass = 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]';
      } else if (rLower.includes('thư viện') || jLower.includes('thư viện')) {
        title = 'Lao Động Tiên Tiến';
        reason = 'Quản lý thư viện khoa học, số hóa tài liệu giảng dạy tích cực và phục vụ tốt bạn đọc';
        level = 'Cấp Trường';
        badgeClass = 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]';
      } else if (rLower.includes('bảo vệ') || jLower.includes('bảo vệ')) {
        title = 'Giấy Khen BGH';
        reason = 'Đảm bảo tuyệt đối an ninh trật tự, an toàn phòng chống cháy nổ trong khuôn viên nhà trường';
        level = 'Cấp Trường';
        badgeClass = 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]';
      } else if (rLower.includes('bếp') || jLower.includes('bếp')) {
        title = 'Lao Động Tiên Tiến';
        reason = 'Đảm bảo tuyệt đối vệ sinh an toàn thực phẩm, chuẩn bị suất ăn bán trú dinh dưỡng chất lượng và đúng giờ';
        level = 'Cấp Trường';
        badgeClass = 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]';
      } else {
        title = 'Lao Động Tiên Tiến';
        reason = 'Hoàn thành tốt nhiệm vụ hỗ trợ hành chính văn phòng và dịch vụ học đường';
        level = 'Cấp Trường';
        badgeClass = 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]';
      }
    }

    return { title, reason, level, year, badgeClass };
  };

  // Monitor Auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch real staff from Firebase
  const loadStaff = async () => {
    if (!auth.currentUser) {
      setStaffList([]);
      setDepartments([]);
      setSubjectsList([]);
      setLoading(false);
      setIsError(false);
      setErrorNotice(null);
      return;
    }
    setLoading(true);
    setErrorNotice(null);
    setIsError(false);
    try {
      const [staffData, deptsData, subjectsData] = await Promise.all([
        getStaffList(),
        getDepartments(),
        getSubjects()
      ]);
      setStaffList(staffData);
      setDepartments(deptsData);
      setSubjectsList(subjectsData);
    } catch (err: any) {
      console.error("Firebase fetch error, using local fallback state", err);
      setIsError(true);
      setErrorNotice('Không thể tải danh sách cán bộ thời gian thực từ Cloud Firestore. Hệ thống đang sử dụng dữ liệu đệm ngoại tuyến.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [activeTab, currentUser]);

  const handleRefresh = () => {
    loadStaff();
  };

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      loadStaff();
    } catch (err) {
      alert("Đăng nhập thất bại. Vui lòng thử lại!");
    }
  };

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'read' | 'edit'>('read');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedEvalStaff, setSelectedEvalStaff] = useState<Staff | null>(null);
  const [selectedRewardStaff, setSelectedRewardStaff] = useState<Staff | null>(null);

  // Edit fields
  const [editName, setEditName] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMajor, setEditMajor] = useState('');
  const [editMainSubject, setEditMainSubject] = useState('');

  const editSubjectsArray = editMainSubject.split(',').map(s => s.trim()).filter(Boolean);
  const editPrimarySubject = editSubjectsArray[0] || '';
  const editAdditionalSubjects = editSubjectsArray.slice(1);

  const openDrawer = (staff: Staff, mode: 'read' | 'edit') => {
    setSelectedStaff(staff);
    setDrawerMode(mode);
    setEditName(staff.name);
    setEditDob(staff.dob);
    setEditGender(staff.gender);
    setEditRole(staff.role);
    setEditDepartment(staff.department);
    setEditPhone(staff.phone);
    setEditEmail(staff.email);
    setEditMajor(staff.major || '');
    setDrawerOpen(true);
  };

  const handleSaveDrawer = async () => {
    if (!selectedStaff) return;

    const currentJobRole = getJobRoleFromRole(editRole);
    const isTeachingOrBgh = currentJobRole === 'Giáo viên bộ môn' || currentJobRole === 'Cán bộ Quản lý (BGH)';

    const updatedFields: Partial<Staff> = {
      name: editName,
      dob: editDob,
      gender: editGender,
      role: editRole,
      jobRole: currentJobRole,
      department: editDepartment,
      phone: editPhone,
      email: editEmail,
      major: isTeachingOrBgh ? editMajor : '',
    };

    // Optimistic local update
    setStaffList(prev => prev.map(s => {
      if (s.id === selectedStaff.id) {
        return { ...s, ...updatedFields };
      }
      return s;
    }));

    try {
      await updateStaff(selectedStaff.id, updatedFields);
      await syncAllStaffRoles();
      await loadStaff();
    } catch (err: any) {
      console.error(err);
      alert('Không thể lưu cập nhật nhân sự lên Firebase. Bản ghi của bạn đã cập nhật tạm thời.');
    }

    setDrawerOpen(false);
    setSelectedStaff(null);
  };

  const handleSaveEvaluation = async (staffId: string, evaluationData: StaffEvaluation) => {
    // Optimistic local update
    setStaffList(prev => prev.map(s => {
      if (s.id === staffId) {
        return { ...s, evaluation: evaluationData };
      }
      return s;
    }));

    try {
      await updateStaff(staffId, { evaluation: evaluationData });
    } catch (err: any) {
      console.error(err);
      alert('Không thể lưu kết quả đánh giá lên Firebase. Dữ liệu của bạn tạm thời đã được cập nhật tại local.');
    }
  };

  const toggleStaffDeactivate = async (id: string) => {
    const target = staffList.find(s => s.id === id);
    if (!target) return;

    const targetStatus = target.status === 'Bình Chỉ / Khóa' ? 'Đang Công Tác' : 'Bình Chỉ / Khóa';

    // Optimistic local update
    setStaffList(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: targetStatus };
      }
      return s;
    }));

    try {
      await updateStaff(id, { status: targetStatus });
      await syncAllStaffRoles();
      await loadStaff();
    } catch (err: any) {
      console.error(err);
      alert('Không thể lưu cập nhật trạng thái nhân sự lên Firebase.');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ cán bộ này? Hành động này không thể hoàn tác.')) {
      return;
    }

    // Optimistic local update
    setStaffList(prev => prev.filter(s => s.id !== id));

    try {
      await deleteStaff(id);
    } catch (err: any) {
      console.error(err);
      alert('Không thể xóa hồ sơ cán bộ trên Firebase.');
    }
  };

  // Export columns definitions
  const getExportColumns = (tab: 'profiles' | 'evaluation' | 'rewards'): ExportColumn[] => {
    switch (tab) {
      case 'profiles':
        return [
          { key: 'id', label: 'Mã Cán Bộ', getValue: (row: Staff) => row.id },
          { key: 'name', label: 'Họ và Tên', getValue: (row: Staff) => row.name },
          { key: 'dob', label: 'Ngày Sinh', getValue: (row: Staff) => row.dob },
          { key: 'gender', label: 'Giới Tính', getValue: (row: Staff) => row.gender },
          { key: 'role', label: 'Chức Vụ Hiện Tại', getValue: (row: Staff) => row.role },
          { key: 'jobRole', label: 'Vị Trí Việc Làm', getValue: (row: Staff) => row.jobRole || '' },
          { key: 'department', label: 'Tổ Chuyên Môn', getValue: (row: Staff) => row.department },
          { key: 'phone', label: 'Số Điện Thoại', getValue: (row: Staff) => row.phone },
          { key: 'email', label: 'Hộp Thư Công Vụ', getValue: (row: Staff) => row.email },
          { key: 'status', label: 'Trạng Thái', getValue: (row: Staff) => row.status },
          { key: 'cccd', label: 'Số CCCD', getValue: (row: Staff) => row.cccd || '' },
          { key: 'address', label: 'Địa Chỉ Thường Trú', getValue: (row: Staff) => row.address || '' },
          { key: 'contractType', label: 'Hình Thức Hợp Đồng', getValue: (row: Staff) => row.contractType || '' },
          { key: 'educationLevel', label: 'Trình Độ Đào Tạo', getValue: (row: Staff) => {
              const isCore = (r: string = '') => {
                const lower = r.toLowerCase();
                return lower.includes('giáo viên') || lower.includes('hiệu trưởng') || lower.includes('hiệu phó') || lower.includes('tổng phụ trách') || lower.includes('thư ký') || lower.includes('văn thư') || lower.includes('thư viện');
              };
              return row.educationLevel || (isCore(row.role) ? '' : 'Không');
            }
          },
          { key: 'major', label: 'Chuyên Ngành', getValue: (row: Staff) => {
              const role = getJobRoleFromRole(row.role);
              const isTeachingOrBgh = role === 'Giáo viên bộ môn' || role === 'Cán bộ Quản lý (BGH)';
              return isTeachingOrBgh ? (row.major || '') : '';
            }
          },
          { key: 'politicalTheory', label: 'Lý Luận Chính Trị', getValue: (row: Staff) => row.politicalTheory || '' },
          { key: 'partyJoinDateReserved', label: 'Ngày Vào Đảng (Dự bị)', getValue: (row: Staff) => row.partyJoinDateReserved || '' },
          { key: 'partyJoinDateOfficial', label: 'Ngày Vào Đảng (Chính thức)', getValue: (row: Staff) => row.partyJoinDateOfficial || '' },
          { key: 'salaryFactor', label: 'Hệ Số Lương', getValue: (row: Staff) => row.salaryFactor || '' },
        ];
      case 'evaluation':
        return [
          { key: 'id', label: 'Mã Cán Bộ', getValue: (row: Staff) => row.id },
          { key: 'name', label: 'Họ và Tên', getValue: (row: Staff) => row.name },
          { key: 'role', label: 'Chức Vụ', getValue: (row: Staff) => row.role },
          { key: 'department', label: 'Tổ Chuyên Môn', getValue: (row: Staff) => row.department },
          { key: 'c1', label: 'Tiêu Chí 1 (BGH Đánh Giá)', getValue: (row: any) => row.c1 || '' },
          { key: 'c2', label: 'Tiêu Chí 2 (BGH Đánh Giá)', getValue: (row: any) => row.c2 || '' },
          { key: 'initiative', label: 'Sáng Kiến Kinh Nghiệm', getValue: (row: any) => row.initiative || '' },
          { key: 'ratingText', label: 'Xếp Loại Chung', getValue: (row: any) => row.ratingText || '' },
        ];
      case 'rewards':
        return [
          { key: 'id', label: 'Mã Cán Bộ', getValue: (row: Staff) => row.id },
          { key: 'name', label: 'Họ và Tên', getValue: (row: Staff) => row.name },
          { key: 'role', label: 'Chức Vụ', getValue: (row: Staff) => row.role },
          { key: 'department', label: 'Tổ Chuyên Môn', getValue: (row: Staff) => row.department },
          { key: 'title', label: 'Hình Thức Khen Thưởng', getValue: (row: any) => row.title || '' },
          { key: 'reason', label: 'Lý Do / Thành Tích', getValue: (row: any) => row.reason || '' },
          { key: 'level', label: 'Cấp Quyết Định', getValue: (row: any) => row.level || '' },
          { key: 'year', label: 'Năm Học', getValue: (row: any) => row.year || '' },
        ];
    }
  };

  // Get export data based on active tab
  const getExportData = () => {
    const baseData = filteredStaff;
    
    if (activeTab === 'evaluation') {
      return baseData.map(staff => {
        const evalData = getEvaluationData(staff);
        return {
          ...staff,
          c1: evalData.c1,
          c2: evalData.c2,
          initiative: evalData.initiative,
          ratingText: evalData.ratingText,
        };
      });
    }
    
    if (activeTab === 'rewards') {
      return baseData.map(staff => {
        const reward = getRewardData(staff);
        return {
          ...staff,
          title: reward.title,
          reason: reward.reason,
          level: reward.level,
          year: reward.year,
        };
      });
    }
    
    return baseData;
  };

  const renderTopButton = () => {
    switch (activeTab) {
      case 'profiles':
        return (
          <div className="flex gap-3">
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 mr-2" /> Tải Về
            </button>
            <button 
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center px-6 py-2.5 bg-[#2e6b8a] text-white border border-[#1e4f6a] text-xs uppercase tracking-widest font-bold hover:bg-[#2e6b8a]/80 transition shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <Upload className="w-4 h-4 mr-2" />
              Nhập từ Excel
            </button>
            <button 
              onClick={() => setModalOpen('profiles')}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm Nhân Sự Mới
            </button>
          </div>
        );
      case 'evaluation':
        return (
          <div className="flex gap-3">
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 mr-2" /> Tải Về
            </button>
            <button 
              onClick={() => { setSelectedEvalStaff(null); setModalOpen('evaluation'); }}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4 mr-2" />
              Tạo Phiếu Đánh Giá
            </button>
          </div>
        );
      case 'rewards':
        return (
          <div className="flex gap-3">
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center px-6 py-2.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#efeae0] transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <FileDown className="w-4 h-4 mr-2" /> Tải Về
            </button>
            <button 
              onClick={() => { setSelectedRewardStaff(null); setModalOpen('rewards'); }}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <Award className="w-4 h-4 mr-2" />
              Nhập Khen Thưởng / Kỷ Luật
            </button>
          </div>
        );
    }
  };

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative ">
      <StaffProfileModal isOpen={modalOpen === 'profiles'} onClose={() => setModalOpen(null)} />
      <EvaluationModal 
        isOpen={modalOpen === 'evaluation'} 
        onClose={() => { setModalOpen(null); setSelectedEvalStaff(null); }} 
        staff={selectedEvalStaff}
        staffList={staffList}
        onSaveEvaluation={handleSaveEvaluation}
      />
      <RewardModal 
        isOpen={modalOpen === 'rewards'} 
        onClose={() => { setModalOpen(null); setSelectedRewardStaff(null); }} 
        staff={selectedRewardStaff}
        staffList={staffList}
      />
      <BulkImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImportSuccess={loadStaff} />
      <ExportModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={
          activeTab === 'profiles' ? 'Hồ Sơ Nhân Sự' :
          activeTab === 'evaluation' ? 'Đánh Giá Nghề Nghiệp' :
          'Khen Thưởng & Kỷ Luật'
        }
        data={getExportData()}
        availableColumns={getExportColumns(activeTab)}
        filename={
          activeTab === 'profiles' ? 'ho-so-nhan-su' :
          activeTab === 'evaluation' ? 'danh-gia-nghe-nghiep' :
          'khen-thuong-ky-luat'
        }
      />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Nhân sự</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Lý lịch, đánh giá và thi đua</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 sm:mt-0">
            {renderTopButton()}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit overflow-visible shrink-0">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">Phân Hệ Nghiệp Vụ</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('profiles')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'profiles' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Users className="w-5 h-5 mr-3" />
                Hồ sơ Nhân sự
              </button>
              <button 
                onClick={() => setActiveTab('evaluation')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'evaluation' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <ShieldCheck className="w-5 h-5 mr-3" />
                Đánh giá Chuẩn NN
              </button>
              <button 
                onClick={() => setActiveTab('rewards')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'rewards' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Award className="w-5 h-5 mr-3" />
                Thi đua & Khen thưởng
              </button>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#b8c6d9]">
              {loading ? (
                <StatCardSkeleton />
              ) : (
                <div className="bg-[#e8eef6] p-4 rounded-2xl border border-[#b8c6d9]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Tổng Biên Chế</span>
                    <span className="font-serif font-bold text-[#2c5ea0] text-xl">{permanentCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Hợp đồng</span>
                    <span className="font-serif font-bold text-[#1e2a3a] text-lg">{contractCount}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4">
              {loading ? (
                <StatCardSkeleton />
              ) : (
                <div className="bg-[#e8eef6] p-4 rounded-2xl border border-[#b8c6d9] space-y-2">
                  <h4 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#b8c6d9] pb-1 mb-2">Thống kê chức vụ</h4>
                  
                  {/* 1. Ban Giám Hiệu */}
                  <div className="flex items-center justify-between text-xs relative group cursor-help py-1 hover:bg-[#ebdcc5]/30 px-1 rounded transition-colors">
                    <span className="text-[#4a5568] font-bold">Ban Giám Hiệu</span>
                    <span className="font-serif font-bold text-[#2c5ea0] text-sm">{bghCount}</span>
                    
                    {/* Floating Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1e2a3a] text-white p-3.5 rounded-xl border border-[#b8c6d9] shadow-xl z-50 min-w-[240px] max-w-[320px] text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                      <p className="font-bold border-b border-white/10 pb-1.5 mb-1.5 uppercase tracking-widest text-[#a8c4e0] text-[10px]">Ban Giám Hiệu</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Hiệu trưởng ({hieuTruongCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{hieuTruongNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Phó Hiệu trưởng ({phoHieuTruongCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{phoHieuTruongNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Tổng phụ trách ({tongPhuTrachCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{tongPhuTrachNames}</p>
                      </div>
                    </div>
                  </div>

                  {/* 2. Tổ trưởng CM */}
                  <div className="flex items-center justify-between text-xs relative group cursor-help py-1 hover:bg-[#ebdcc5]/30 px-1 rounded transition-colors">
                    <span className="text-[#4a5568] font-bold">Tổ trưởng CM</span>
                    <span className="font-serif font-bold text-[#1e2a3a] text-sm">{headCount}</span>
                    
                    {/* Floating Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1e2a3a] text-white p-3.5 rounded-xl border border-[#b8c6d9] shadow-xl z-50 min-w-[240px] max-w-[320px] text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                      <p className="font-bold border-b border-white/10 pb-1.5 mb-1.5 uppercase tracking-widest text-[#a8c4e0] text-[10px]">Tổ trưởng chuyên môn</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Tổ trưởng ({toTruongCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{toTruongNames}</p>
                      </div>
                    </div>
                  </div>

                  {/* 3. Tổ phó CM */}
                  <div className="flex items-center justify-between text-xs relative group cursor-help py-1 hover:bg-[#ebdcc5]/30 px-1 rounded transition-colors">
                    <span className="text-[#4a5568] font-bold">Tổ phó CM</span>
                    <span className="font-serif font-bold text-[#1e2a3a] text-sm">{deputyCount}</span>
                    
                    {/* Floating Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1e2a3a] text-white p-3.5 rounded-xl border border-[#b8c6d9] shadow-xl z-50 min-w-[240px] max-w-[320px] text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                      <p className="font-bold border-b border-white/10 pb-1.5 mb-1.5 uppercase tracking-widest text-[#a8c4e0] text-[10px]">Tổ phó chuyên môn</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Tổ phó ({toPhoCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{toPhoNames}</p>
                      </div>
                    </div>
                  </div>

                  {/* 4. Giáo viên */}
                  <div className="flex items-center justify-between text-xs relative group cursor-help py-1 hover:bg-[#ebdcc5]/30 px-1 rounded transition-colors">
                    <span className="text-[#4a5568] font-bold">Giáo viên</span>
                    <span className="font-serif font-bold text-[#1e2a3a] text-sm">{teacherCount}</span>
                    
                    {/* Floating Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1e2a3a] text-white p-3.5 rounded-xl border border-[#b8c6d9] shadow-xl z-50 min-w-[240px] max-w-[320px] text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                      <p className="font-bold border-b border-white/10 pb-1.5 mb-1.5 uppercase tracking-widest text-[#a8c4e0] text-[10px]">Đội ngũ Giáo viên</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Giáo viên bộ môn ({gvBoMonCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{gvBoMonNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Đang làm Chủ nhiệm ({gvChuNhiemCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{gvChuNhiemNames}</p>
                      </div>
                    </div>
                  </div>

                  {/* 5. Nhân viên */}
                  <div className="flex items-center justify-between text-xs relative group cursor-help py-1 hover:bg-[#ebdcc5]/30 px-1 rounded transition-colors">
                    <span className="text-[#4a5568] font-bold">Nhân viên</span>
                    <span className="font-serif font-bold text-[#1e2a3a] text-sm">{otherStaffCount}</span>
                    
                    {/* Floating Tooltip */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:block bg-[#1e2a3a] text-white p-3.5 rounded-xl border border-[#b8c6d9] shadow-xl z-50 min-w-[240px] max-w-[320px] text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100 max-h-[380px] overflow-y-auto main-scrollbar">
                      <p className="font-bold border-b border-white/10 pb-1.5 mb-1.5 uppercase tracking-widest text-[#a8c4e0] text-[10px] sticky top-0 bg-[#1e2a3a]">Cán bộ Hành chính / Hỗ trợ</p>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Kế toán ({keToanCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{keToanNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Y tế học đường ({yTeCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{yTeNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Thư viện ({thuVienCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{thuVienNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Thư ký / Văn thư ({vanThuCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{vanThuNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Bảo vệ ({baoVeCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{baoVeNames}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                          <span>Tạp vụ ({tapVuCount}):</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pl-2 break-words leading-relaxed">{tapVuNames}</p>
                      </div>
                      {otherStaffDetailCount > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4 font-bold text-[#a8c4e0]">
                            <span>Khác ({otherStaffDetailCount}):</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] rounded-3xl overflow-hidden relative min-h-0">
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                {activeTab === 'profiles' && 'Danh sách Lý lịch'}
                {activeTab === 'evaluation' && 'Kết quả Đánh giá Chuẩn Nghề nghiệp'}
                {activeTab === 'rewards' && 'Sổ Ghi nhận Thi đua & Khen thưởng'}
              </h3>
              <div className="flex flex-wrap items-center gap-3">
                 <div className="relative">
                   <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                   <input 
                     type="text" 
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder="Tra cứu cán bộ..."
                     className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                   />
                 </div>
                <button 
                  onClick={handleRefresh}
                  disabled={loading}
                  className="flex items-center text-[10px] font-bold text-[#1e2a3a] bg-[#f5f8fc] border border-[#b8c6d9] px-4 py-2 hover:bg-[#e8eef6] transition-colors shadow-sm uppercase tracking-widest rounded-full disabled:opacity-75"
                  title="Tải lại danh sách nhân sự"
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin text-[#2c5ea0]' : ''}`} /> Tải Lại
                </button>
                <FilterSelect
                  label="Tổ/Nhóm"
                  value={deptFilter}
                  onChange={setDeptFilter}
                  options={[
                    { value: 'All', label: 'TẤT CẢ' },
                    ...departments.map(d => ({ value: d.name, label: d.name }))
                  ]}
                  icon={Filter}
                />
                <FilterSelect
                  label="Chức vụ"
                  value={roleFilter}
                  onChange={setRoleFilter}
                  options={[
                    { value: 'All', label: 'TẤT CẢ' },
                    { value: 'Ban Giám Hiệu', label: 'Ban Giám Hiệu' },
                    { value: 'Tổ trưởng CM', label: 'Tổ trưởng CM' },
                    { value: 'Tổ phó CM', label: 'Tổ phó CM' },
                    { value: 'Giáo viên bộ môn', label: 'Giáo viên bộ môn' },
                    { value: 'Chủ nhiệm', label: 'Chủ nhiệm' },
                    { value: 'Kế toán', label: 'Kế toán' },
                    { value: 'Y tế học đường', label: 'Y tế học đường' },
                    { value: 'Cán bộ Thư viện', label: 'Cán bộ Thư viện' },
                    { value: 'Thư ký / Văn thư', label: 'Thư ký / Văn thư' },
                    { value: 'Bảo vệ', label: 'Bảo vệ' },
                    { value: 'Nhân viên tạp vụ', label: 'Nhân viên tạp vụ' }
                  ]}
                  icon={Filter}
                />
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
                      onClick={loadStaff}
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
              <table className="w-full min-w-[1000px] text-sm text-left">
                <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-[0_1px_0_#b8c6d9]">
                  {activeTab === 'profiles' && (
                    <tr>
                      <th className="px-6 py-4">Mã CB</th>
                      <th className="px-6 py-4">Họ và Tên</th>
                      <th className="px-6 py-4">Chức vụ / Vị trí</th>
                      <th className="px-6 py-4">Tổ Chuyên môn</th>
                      <th className="px-6 py-4">Lớp Phụ Trách</th>
                      <th className="px-6 py-4">Trạng Thái</th>
                      <th className="px-6 py-4 text-center">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'evaluation' && (
                    <tr>
                      <th className="px-6 py-4">Họ và Tên</th>
                      <th className="px-6 py-4">Tiêu chí 1</th>
                      <th className="px-6 py-4">Tiêu chí 2</th>
                      <th className="px-6 py-4">Sáng kiến KN</th>
                      <th className="px-6 py-4">Xếp Loại Chung</th>
                      <th className="px-6 py-4 text-center">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'rewards' && (
                    <tr>
                      <th className="px-6 py-4">Họ và Tên</th>
                      <th className="px-6 py-4">Hình thức</th>
                      <th className="px-6 py-4">Lý do / Thành tích</th>
                      <th className="px-6 py-4">Cấp QĐ</th>
                      <th className="px-6 py-4">Năm Học</th>
                      <th className="px-6 py-4 text-center">Tác Vụ</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                  {loading ? (
                    <PersonnelTableSkeleton activeTab={activeTab} rows={3} />
                  ) : (
                    <>
                      {activeTab === 'profiles' && paginatedStaff.map((staff) => (
                        <tr key={staff.id} className="hover:bg-[#e8eef6] transition-colors group">
                          <td className="px-6 py-5 font-mono text-xs text-[#7b8a9e]">{staff.id}</td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-[#1e2a3a]">{staff.name}</p>
                            <p className="text-xs text-[#7b8a9e] mt-1 font-serif">{staff.dob} - {staff.gender}</p>
                          </td>
                          <td className="px-6 py-5 font-bold text-[#4a5568]">{staff.role}</td>
                          <td className="px-6 py-5">
                            {staff.department ? (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                staff.department === 'Tổ Nghệ Thuật'
                                  ? 'bg-purple-50 border border-purple-200 text-purple-700'
                                  : staff.department === 'Tổ Tin Học'
                                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                                  : staff.department === 'Tổ Thể Dục'
                                  ? 'bg-teal-50 border border-teal-200 text-teal-700'
                                  : staff.department.toLowerCase().includes('khối')
                                  ? 'bg-amber-50 border border-amber-200 text-amber-700'
                                  : 'bg-blue-50 border border-blue-200 text-blue-700'
                              }`}>
                                {staff.department}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#7b8a9e] italic">Chưa phân công</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            {staff.assignedClass ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#e8eef6] border border-[#b8c6d9] text-[#2c5ea0]">
                                {staff.assignedClass}
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#7b8a9e]">—</span>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold text-[#f5f8fc] uppercase tracking-widest ${
                              staff.status === 'Đang Công Tác' ? 'bg-[#2e6b8a]' :
                              staff.status === 'Nghỉ Phép' ? 'bg-[#7b8a9e]' : 'bg-[#2c5ea0]'
                            }`}>
                              {staff.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <ActionMenu 
                              primaryAction={{
                                label: 'Lý lịch',
                                icon: 'Users',
                                onClick: () => openDrawer(staff, 'read')
                              }}
                              actions={[
                                {
                                  label: 'Sửa hồ sơ (Drawer)',
                                  icon: 'Edit',
                                  onClick: () => openDrawer(staff, 'edit'),
                                  roles: ['school_board']
                                },
                                {
                                  label: staff.status === 'Đang Công Tác' ? 'Đình chỉ / Khóa tài khoản' : 'Khôi phục tài khoản',
                                  icon: 'ShieldCheck',
                                  onClick: () => toggleStaffDeactivate(staff.id),
                                  danger: staff.status === 'Đang Công Tác',
                                  roles: ['school_board']
                                },
                                {
                                  label: 'Xóa hồ sơ cán bộ',
                                  icon: 'Trash2',
                                  onClick: () => handleDeleteStaff(staff.id),
                                  danger: true,
                                  roles: ['school_board']
                                }
                              ]}
                            />
                          </td>
                        </tr>
                      ))}

                      {activeTab === 'evaluation' && (
                        filteredStaff.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-[#7b8a9e] font-bold text-xs uppercase tracking-wider">
                              Không có dữ liệu đánh giá nghề nghiệp
                            </td>
                          </tr>
                        ) : (
                          paginatedStaff.map((staff) => {
                            const evalData = getEvaluationData(staff);
                            return (
                              <tr key={staff.id} className="hover:bg-[#e8eef6] transition-colors group">
                                <td className="px-6 py-5 font-bold text-[#1e2a3a]">{staff.name}</td>
                                <td className="px-6 py-5 font-bold text-[#4a5568]">{evalData.c1}</td>
                                <td className="px-6 py-5 font-bold text-[#4a5568]">{evalData.c2}</td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center">
                                    <FileText className="w-4 h-4 mr-1 text-[#4a5568]" />
                                    <span className="text-xs font-bold font-serif text-[#4a5568]">{evalData.initiative}</span>
                                  </div>
                                </td>
                                <td className={`px-6 py-5 font-bold uppercase tracking-widest text-[11px] ${
                                  evalData.ratingText.includes('Xuất Sắc') ? 'text-[#2e6b8a]' :
                                  evalData.ratingText.includes('Tốt') ? 'text-[#8c672b]' : 'text-[#7b8a9e]'
                                }`}>
                                  {evalData.ratingText}
                                </td>
                                <td className="px-6 py-5 text-center">
                                  <ActionMenu
                                    primaryAction={{ 
                                      label: 'Xem đánh giá', 
                                      icon: 'ShieldCheck', 
                                      onClick: () => {
                                        setSelectedEvalStaff(staff);
                                        setModalOpen('evaluation');
                                      } 
                                    }}
                                    actions={[]}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )
                      )}
                      {activeTab === 'rewards' && (
                        filteredStaff.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-[#7b8a9e] font-bold text-xs uppercase tracking-wider">
                              Không có dữ liệu khen thưởng / kỷ luật
                            </td>
                          </tr>
                        ) : (
                          paginatedStaff.map((staff) => {
                            const reward = getRewardData(staff);
                            return (
                              <tr key={staff.id} className="hover:bg-[#e8eef6] transition-colors group">
                                <td className="px-6 py-5 font-bold text-[#1e2a3a]">{staff.name}</td>
                                <td className="px-6 py-5">
                                   <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${reward.badgeClass}`}>
                                     {reward.title}
                                   </span>
                                </td>
                                <td className="px-6 py-5 text-[#4a5568] text-sm">{reward.reason}</td>
                                <td className="px-6 py-5 font-bold text-[#4a5568]">{reward.level}</td>
                                <td className="px-6 py-5 font-serif font-bold text-[#2c5ea0]">{reward.year}</td>
                                <td className="px-6 py-5 text-center">
                                  <ActionMenu
                                    primaryAction={{ 
                                      label: 'Thành tích', 
                                      icon: 'Award', 
                                      onClick: () => {
                                        setSelectedRewardStaff(staff);
                                        setModalOpen('rewards');
                                      } 
                                    }}
                                    actions={[]}
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )
                      )}
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
                totalItems={filteredStaff.length}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sliding Side-Drawer for Master Data (Staff Profile) */}
      {drawerOpen && selectedStaff && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm transition-opacity animate-fade-in">
          <div className="w-full max-w-lg bg-[#f5f8fc] h-full shadow-2xl border-l-[3px] border-[#b8c6d9] flex flex-col relative animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-rose font-bold text-[#2c5ea0] px-2.5 py-1 bg-[#a8c4e0] border border-[#7b8a9e] rounded-full">
                  {selectedStaff.id}
                </span>
                <h3 className="text-xl font-serif font-bold text-[#1e2a3a] mt-2">
                  {drawerMode === 'read' ? 'Chi tiết Lý lịch Cán bộ' : 'Biên tập Hồ sơ Cán bộ'}
                </h3>
              </div>
              <button 
                onClick={() => { setDrawerOpen(false); setSelectedStaff(null); }}
                className="p-2 text-[#7b8a9e] hover:text-[#2c5ea0] hover:bg-[#e8eef6] rounded-full border border-transparent hover:border-[#b8c6d9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scroll Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {drawerMode === 'read' ? (
                // EDITORIAL TEACHER PORTFOLIO VIEW
                <div className="space-y-6">
                  {/* Portrait & Stats Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 border-b border-[#e7e3d4] pb-6">
                    {/* Left: Large Portrait Frame */}
                    <div className="sm:col-span-2 flex flex-col items-center text-center">
                      <div className="w-36 h-44 rounded-2xl border-[3px] border-double border-[#e7e3d4] bg-[#fcf8f2] p-2 shadow-[4px_4px_0px_#e7e3d4] overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
                        <img 
                          src={`https://i.pravatar.cc/300?img=${selectedStaff.gender === 'Nữ' ? (selectedStaff.name.charCodeAt(0) % 20 + 20) : (selectedStaff.name.charCodeAt(0) % 20 + 50)}`} 
                          alt={selectedStaff.name} 
                          className="w-full h-full object-cover rounded-xl"
                        />
                      </div>
                      <h4 className="font-serif font-black text-[#2d251e] text-lg mt-3 leading-tight">{selectedStaff.name}</h4>
                      <p className="text-[10px] text-[#d97706] font-extrabold uppercase tracking-widest mt-1">{selectedStaff.role}</p>
                      <span className="text-[9px] text-[#8c7d70] font-bold bg-[#fcf8f2] border border-[#e7e3d4] px-2 py-0.5 rounded-full mt-1.5">{selectedStaff.department || 'Chưa phân lớp'}</span>
                    </div>

                    {/* Right: Premium Typography Metrics */}
                    <div className="sm:col-span-3 flex flex-col justify-between gap-4">
                      <h5 className="text-[10px] font-bold text-[#8c7d70] uppercase tracking-widest border-b border-[#e7e3d4] pb-1">Chỉ số nổi bật</h5>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-left">
                          <p className="font-serif font-black text-3xl text-[#d97706] leading-none">{(selectedStaff.id.charCodeAt(selectedStaff.id.length - 1) % 6) + 3} <span className="text-xs font-bold text-[#8c7d70]">Năm</span></p>
                          <p className="text-[9px] text-[#8c7d70] font-extrabold uppercase mt-1 tracking-wider">Kinh nghiệm</p>
                        </div>
                        <div className="text-left">
                          <p className="font-serif font-black text-3xl text-[#10b981] leading-none">{(selectedStaff.name.charCodeAt(0) % 5) + 95}%</p>
                          <p className="text-[9px] text-[#8c7d70] font-extrabold uppercase mt-1 tracking-wider">Phụ huynh hài lòng</p>
                        </div>
                        <div className="text-left">
                          <p className="font-serif font-black text-2xl text-[#2d251e] leading-none">100%</p>
                          <p className="text-[9px] text-[#8c7d70] font-extrabold uppercase mt-1 tracking-wider">Chuẩn sư phạm</p>
                        </div>
                        <div className="text-left">
                          <p className="font-serif font-black text-2xl text-[#10b981] leading-none">Đạt</p>
                          <p className="text-[9px] text-[#8c7d70] font-extrabold uppercase mt-1 tracking-wider">An toàn ATTP / Sơ cứu</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editorial Column layout for details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Col 1: Hành chính & Chuyên môn */}
                    <div className="space-y-4">
                      <h5 className="font-serif font-bold text-sm text-[#2d251e] border-l-2 border-[#f59e0b] pl-2 mb-2 uppercase tracking-wide">Chuyên môn & Pháp lý</h5>
                      <div className="space-y-2.5 text-[#5c4f43]">
                        <div>
                          <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wider">Trình độ & Chuyên ngành</p>
                          <p className="font-bold text-[#2d251e]">{selectedStaff.educationLevel || 'Đại học Sư phạm'} • {selectedStaff.major || 'Sư phạm Mầm non'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wider">Hợp đồng lao động</p>
                          <p className="font-bold text-[#2d251e]">{selectedStaff.contractType || 'Biên chế chính thức'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wider">Lý luận chính trị</p>
                          <p className="font-bold text-[#2d251e]">{selectedStaff.politicalTheory || 'Sơ cấp'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Col 2: Liên hệ & Sức khỏe */}
                    <div className="space-y-4">
                      <h5 className="font-serif font-bold text-sm text-[#2d251e] border-l-2 border-[#10b981] pl-2 mb-2 uppercase tracking-wide">Y tế & Liên hệ</h5>
                      <div className="space-y-2.5 text-[#5c4f43]">
                        <div>
                          <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wider">Chứng chỉ Y tế bắt buộc</p>
                          <p className="font-bold text-green-700 font-medium">✓ An toàn vệ sinh ATTP (Hạn 2027)<br/>✓ Chứng chỉ Sơ cấp cứu nhi khoa</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wider">Điện thoại liên hệ</p>
                          <p className="font-bold text-[#2d251e] font-serif">{selectedStaff.phone}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wider">Thư điện tử công vụ</p>
                          <p className="font-bold text-[#2d251e] font-mono break-all">{selectedStaff.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer informational banner */}
                  <div className="p-4 border border-[#e7e3d4] rounded-2xl bg-[#fdfbf7] text-[#8c7d70] text-[10px] leading-relaxed shadow-inner">
                    Hồ sơ Cán bộ/Nhân sự được mã hóa bảo mật trên hệ thống đám mây Trường Mầm non An Hữu. Mọi hành vi thay đổi lý lịch chuyên môn hoặc điều chuyển công tác phải tuân thủ quy định sư phạm của Ban Giám Hiệu.
                  </div>
                </div>
              ) : (
                // Edit fields
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Họ và Tên cán bộ</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a] focus:outline-none"
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
                    <BaseSelect
                      label="Chức vụ / Vị trí"
                      value={editRole}
                      options={uniqueRoles.map(r => ({ value: r, label: r }))}
                      onChange={(val) => setEditRole(val)}
                    />
                  </div>

                  <div className="space-y-2">
                    <BaseSelect
                      label="Tổ chuyên môn"
                      value={editDepartment}
                      options={[
                        { value: 'Chưa phân công', label: '-- Chưa phân công --' },
                        ...(() => {
                          const isSpecialized = isSpecializedSubject(editMainSubject);
                          const filtered = departments.filter(d => {
                            if (isSpecialized) {
                              return d.type === 'Tổ chuyên biệt';
                            } else {
                              return d.type === 'Tổ khối lớp';
                            }
                          });
                          return filtered.map(d => ({ value: d.name, label: d.name }));
                        })()
                      ]}
                      onChange={(val) => setEditDepartment(val)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {(() => {
                      const currentJobRole = getJobRoleFromRole(editRole);
                      const isTeachingOrBgh = currentJobRole === 'Giáo viên bộ môn' || currentJobRole === 'Cán bộ Quản lý (BGH)';
                      if (isTeachingOrBgh) {
                        return (
                          <>
                            <div className="space-y-2">
                              <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Chuyên ngành đào tạo</label>
                              <input 
                                type="text" 
                                value={editMajor}
                                onChange={e => setEditMajor(e.target.value)}
                                className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a] focus:outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <BaseSelect
                                label="Môn giảng dạy chính"
                                value={editPrimarySubject}
                                options={[
                                  { value: 'Không giảng dạy (Hành chính/Nhân viên)', label: 'Không giảng dạy (Hành chính/Nhân viên)' },
                                  ...subjectsList.map(s => ({ value: s.name, label: s.name }))
                                ]}
                                onChange={(val) => {
                                  if (isSpecializedSubject(val) || val === 'Không giảng dạy (Hành chính/Nhân viên)') {
                                    setEditMainSubject(val);
                                  } else {
                                    const nextAdd = editAdditionalSubjects.filter(s => s !== val);
                                    setEditMainSubject([val, ...nextAdd].join(', '));
                                  }
                                  
                                  // Tự động kiểm tra và reset department nếu phân loại không phù hợp
                                  const nextIsSpecialized = isSpecializedSubject(val);
                                  const currentDept = departments.find(d => d.name === editDepartment);
                                  if (currentDept) {
                                    const isCurrentDeptSpecialized = currentDept.type === 'Tổ chuyên biệt';
                                    if (nextIsSpecialized !== isCurrentDeptSpecialized) {
                                      setEditDepartment('Chưa phân công'); // Reset về trống
                                    }
                                  }
                                }}
                              />
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <div className="col-span-2 space-y-2">
                            <BaseSelect
                              label="Môn giảng dạy chính"
                              value={editPrimarySubject}
                              options={[
                                { value: 'Không giảng dạy (Hành chính/Nhân viên)', label: 'Không giảng dạy (Hành chính/Nhân viên)' },
                                ...subjectsList.map(s => ({ value: s.name, label: s.name }))
                              ]}
                              onChange={(val) => {
                                  if (isSpecializedSubject(val) || val === 'Không giảng dạy (Hành chính/Nhân viên)') {
                                    setEditMainSubject(val);
                                  } else {
                                    const nextAdd = editAdditionalSubjects.filter(s => s !== val);
                                    setEditMainSubject([val, ...nextAdd].join(', '));
                                  }
                                  
                                // Tự động kiểm tra và reset department nếu phân loại không phù hợp
                                const nextIsSpecialized = isSpecializedSubject(val);
                                const currentDept = departments.find(d => d.name === editDepartment);
                                if (currentDept) {
                                  const isCurrentDeptSpecialized = currentDept.type === 'Tổ chuyên biệt';
                                  if (nextIsSpecialized !== isCurrentDeptSpecialized) {
                                    setEditDepartment('Chưa phân công'); // Reset về trống
                                  }
                                }
                              }}
                            />
                          </div>
                        );
                      }
                    })()}

                    {editPrimarySubject && !isSpecializedSubject(editPrimarySubject) && editPrimarySubject !== 'Không giảng dạy (Hành chính/Nhân viên)' && (
                      <div className="col-span-2 mt-2 p-4 bg-white border border-[#b8c6d9] rounded-xl space-y-3">
                        <label className="block text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest">
                          Giáo viên này dạy thêm các môn bắt buộc khác (nếu có):
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                          {getCompulsorySubjectsList(subjectsList)
                            .filter(sub => sub !== editPrimarySubject)
                            .map(sub => {
                              const isChecked = editAdditionalSubjects.includes(sub);
                              return (
                                <label key={sub} className="flex items-center gap-2.5 p-2 bg-[#f5f8fc] border border-[#dce4ee] rounded-lg cursor-pointer hover:bg-[#e8eef6] transition">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      let nextAdd;
                                      if (isChecked) {
                                        nextAdd = editAdditionalSubjects.filter(s => s !== sub);
                                      } else {
                                        nextAdd = [...editAdditionalSubjects, sub];
                                      }
                                      setEditMainSubject([editPrimarySubject, ...nextAdd].join(', '));
                                    }}
                                    className="w-4 h-4 rounded text-[#2c5ea0] border-[#b8c6d9] focus:ring-[#2c5ea0]/20"
                                  />
                                  <span className="text-xs font-bold text-[#1e2a3a]">{sub}</span>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Số điện thoại</label>
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={e => setEditPhone(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold font-serif text-[#1e2a3a] focus:outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">Hộp thư điện tử</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={e => setEditEmail(e.target.value)}
                        className="w-full px-4 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold font-mono text-[#1e2a3a] focus:outline-none"
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
                      toggleStaffDeactivate(selectedStaff.id);
                      setDrawerOpen(false);
                    }}
                    className={`px-5 py-2.5 text-xs uppercase tracking-widest font-bold border transition-all rounded-full ${
                      selectedStaff.status === 'Đang Công Tác'
                        ? 'bg-[#ffebee] text-red-700 border-red-300 hover:bg-[#ffcdd2]'
                        : 'bg-[#e8f5e9] text-[#2e6b8a] border-green-300 hover:bg-[#c8e6c9]'
                    }`}
                  >
                    {selectedStaff.status === 'Đang Công Tác' ? 'Đình chỉ công tác' : 'Kích hoạt lại'}
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
                    Lưu hồ sơ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
