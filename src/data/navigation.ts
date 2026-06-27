import {
  Users,
  UserCheck,
  BookOpen,
  Building,
  DollarSign,
  FileText,
  Network,
  CalendarCheck,
  CalendarDays,
  LayoutDashboard,
  LayoutList,
  Flag,
  HeartPulse,
  Award,
  Compass,
  Coffee,
  ShieldCheck,
  UserPlus,
  GraduationCap,
  TrendingUp,
  Inbox,
  Archive,
  Megaphone,
  User,
  Sparkles,
  Syringe,
  Pill,
  Stethoscope,
  Activity,
  Receipt,
  ClipboardCheck,
  BedDouble,
} from 'lucide-react';

import { ModuleId, NavItem, UserRole } from '../types';

export const NAVIGATION: NavItem[] = [
  { id: 'student-portal', label: 'Cổng Phụ Huynh', icon: 'LayoutDashboard', group: 'Cổng Phụ Huynh' },
  { id: 'student-timetable', label: 'Lịch sinh hoạt', icon: 'CalendarDays', group: 'Cổng Phụ Huynh' },
  { id: 'student-grades', label: 'Sổ Bé Ngoan', icon: 'Award', group: 'Cổng Phụ Huynh' },
  { id: 'student-conduct', label: 'Chuyên cần', icon: 'ShieldCheck', group: 'Cổng Phụ Huynh' },
  { id: 'student-leave', label: 'Xin nghỉ phép', icon: 'Inbox', group: 'Cổng Phụ Huynh' },
  { id: 'student-privilege', label: 'Thông tin Đưa rước', icon: 'Sparkles', group: 'Cổng Phụ Huynh' },
  { id: 'overview', label: 'Tổng quan Hệ thống', icon: 'LayoutDashboard' },
  { id: 'personnel', label: 'Nhân sự', icon: 'UserCheck', group: 'Hành chính & Nhân sự' },
  { id: 'system-roster', label: 'Quản lý Lịch trực Hệ thống', icon: 'CalendarDays', group: 'Hành chính & Nhân sự' },
  { id: 'secretary-overview', label: 'Tổng quan Hành chính', icon: 'LayoutDashboard', group: 'Hành chính & Nhân sự' },
  { id: 'secretary-documents', label: 'Số công văn điện tử', icon: 'Inbox', group: 'Hành chính & Nhân sự' },
  { id: 'secretary-council', label: 'Công tác Hội đồng', icon: 'Users', group: 'Hành chính & Nhân sự' },
  { id: 'secretary-storage', label: 'Lưu trữ & Cấp phát', icon: 'Archive', group: 'Hành chính & Nhân sự' },
  { id: 'secretary-bulletin', label: 'Bảng tin nhà trường', icon: 'Megaphone', group: 'Hành chính & Nhân sự' },
  { id: 'party-union', label: 'Đảng & Đoàn thể', icon: 'ShieldCheck', group: 'Hành chính & Nhân sự' },
  { id: 'academics', label: 'Chương trình Đào tạo', icon: 'BookOpen', group: 'Đào tạo & Chuyên môn' },
  { id: 'departments', label: 'Tổ chuyên môn & Môn học', icon: 'Network', group: 'Đào tạo & Chuyên môn' },
  { id: 'assignments', label: 'Phân công chuyên môn', icon: 'CalendarCheck', group: 'Đào tạo & Chuyên môn' },
  { id: 'timetable', label: 'Lịch sinh hoạt', icon: 'CalendarDays', group: 'Đào tạo & Chuyên môn' },
  { id: 'quality-assurance', label: 'Kiểm định Chất lượng', icon: 'Award', group: 'Đào tạo & Chuyên môn' },
  { id: 'students', label: 'Quản lý Trẻ', icon: 'Users', group: 'Công tác Trẻ em' },
  { id: 'classes', label: 'Lớp học', icon: 'LayoutList', group: 'Công tác Trẻ em' },
  { id: 'youth-union', label: 'Phong trào & Sự kiện', icon: 'Flag', group: 'Công tác Trẻ em' },
  { id: 'counseling', label: 'Tâm lý & Hỗ trợ', icon: 'Compass', group: 'Công tác Trẻ em' },
  { id: 'admissions', label: 'Tiếp nhận Trẻ', icon: 'UserPlus', group: 'Công tác Trẻ em' },
  { id: 'promotion', label: 'Kết chuyển năm học', icon: 'TrendingUp', group: 'Công tác Trẻ em' },
  { id: 'alumni', label: 'Cựu học viên', icon: 'GraduationCap', group: 'Công tác Trẻ em' },
  { id: 'finance', label: 'Tài chính - Kế toán', icon: 'DollarSign', group: 'Tài chính & Hậu cần' },
  { id: 'facilities', label: 'Cơ sở vật chất', icon: 'Building', group: 'Tài chính & Hậu cần' },
  { id: 'health', label: 'Y tế Học đường', icon: 'HeartPulse', group: 'Tài chính & Hậu cần' },
  
  // New grouped Boarding sub-modules
  { id: 'boarding-dashboard', label: 'Điều Phối Bếp', icon: 'Coffee', group: 'Giám sát & Điều phối' },
  { id: 'boarding-communication', label: 'Báo Cáo & Truyền Tin', icon: 'Activity', group: 'Giám sát & Điều phối' },
  { id: 'boarding-inventory', label: 'Kho & Định Lượng', icon: 'Receipt', group: 'Kho & Định lượng' },
  { id: 'boarding-atvstp', label: 'Vệ Sinh & Lưu Mẫu', icon: 'ShieldCheck', group: 'An toàn thực phẩm' },
  { id: 'boarding-closing', label: 'Ca Trực & Đóng Ca', icon: 'ClipboardCheck', group: 'Nhân sự & Ca trực' },
  { id: 'boarding-rooms', label: 'Nghỉ Trưa Bán Trú', icon: 'BedDouble', group: 'Nghỉ trưa bán trú' },

  { id: 'health-dashboard', label: 'Tổng quan Y tế', icon: 'LayoutDashboard', group: 'Giám sát & Báo cáo' },
  { id: 'health-records', label: 'Hồ sơ Sức khỏe', icon: 'HeartPulse', group: 'Hồ sơ & Khám bệnh' },
  { id: 'health-log', label: 'Nhật ký Khám/Sơ cứu', icon: 'Stethoscope', group: 'Hồ sơ & Khám bệnh' },
  { id: 'health-inventory', label: 'Tủ thuốc & Vật tư', icon: 'Pill', group: 'Dược phẩm & Vật tư' },
  { id: 'health-epidemic', label: 'Dịch bệnh & Tiêm chủng', icon: 'Syringe', group: 'Dịch tễ & Bảo hiểm' },
  { id: 'health-insurance', label: 'Bảo hiểm Y tế', icon: 'ShieldCheck', group: 'Dịch tễ & Bảo hiểm' },
  { id: 'health-reports', label: 'Liên lạc & Báo cáo', icon: 'FileText', group: 'Giám sát & Báo cáo' },
  { id: 'library-overview', label: 'Tổng quan Thư viện', icon: 'LayoutDashboard', group: 'Nghiệp vụ Thư viện' },
  { id: 'library-circulation', label: 'Lưu thông Tài liệu', icon: 'BookOpen', group: 'Nghiệp vụ Thư viện' },
  { id: 'library-inventory', label: 'Biên mục & Quản lý Kho', icon: 'Archive', group: 'Nghiệp vụ Thư viện' },
  { id: 'library-readers', label: 'Quản lý Bạn đọc', icon: 'Users', group: 'Nghiệp vụ Thư viện' },
  { id: 'library-audit', label: 'Tài sản & Kiểm kê', icon: 'FileText', group: 'Nghiệp vụ Thư viện' },
  { id: 'dept-overview', label: 'Tổng quan chuyên môn', icon: 'LayoutDashboard' },
  { id: 'dept-lesson-plans', label: 'Duyệt Giáo án', icon: 'FileText' },
  { id: 'dept-assignments', label: 'Phân công giảng dạy', icon: 'CalendarCheck' },
  { id: 'dept-evaluation', label: 'Đánh giá & Thi đua', icon: 'Award' },
  { id: 'dept-analytics', label: 'Phổ điểm & Chất lượng', icon: 'TrendingUp' },
  { id: 'timetable-schedule', label: 'Lịch sinh hoạt', icon: 'CalendarDays' },
  { id: 'timetable-exam', label: 'Lịch Đánh giá', icon: 'ShieldCheck' },
  { id: 'teacher-overview', label: 'Trang chủ', icon: 'LayoutDashboard' },
  { id: 'teacher-timetable', label: 'Thời khóa biểu / Lịch báo giảng', icon: 'CalendarDays', group: 'CÔNG TÁC GIẢNG DẠY' },
  { id: 'teacher-lesson-plans', label: 'Kế hoạch tuần / Chủ đề', icon: 'FileText', group: 'CÔNG TÁC GIẢNG DẠY' },
  { id: 'teacher-gradebook', label: 'Sổ Bé Ngoan', icon: 'Award', group: 'CÔNG TÁC GIẢNG DẠY' },
  { id: 'teacher-diary', label: 'Nhật ký lớp học', icon: 'BookOpen', group: 'CÔNG TÁC GIẢNG DẠY' },
  { id: 'homeroom-profile', label: 'Hồ sơ Lớp chủ nhiệm', icon: 'Users', group: 'CÔNG TÁC CHỦ NHIỆM' },
  { id: 'homeroom-attendance', label: 'Quản lý Chuyên cần', icon: 'UserCheck', group: 'CÔNG TÁC CHỦ NHIỆM' },
  { id: 'homeroom-conduct', label: 'Đánh giá Hạnh kiểm', icon: 'ShieldCheck', group: 'CÔNG TÁC CHỦ NHIỆM' },
  { id: 'teacher-profile', label: 'Lý lịch Cán bộ', icon: 'FileText', group: 'PHÁT TRIỂN CÁ NHÂN' },
  { id: 'teacher-evaluation', label: 'Đánh giá Chuẩn nghề nghiệp', icon: 'Award', group: 'PHÁT TRIỂN CÁ NHÂN' },
  { id: 'teacher-maintenance', label: 'Báo hỏng cơ sở vật chất', icon: 'Building', group: 'HỖ TRỢ & TIỆN ÍCH' },
  { id: 'teacher-contacts', label: 'Danh bạ nội bộ', icon: 'Users', group: 'HỖ TRỢ & TIỆN ÍCH' },
  { id: 'finance-overview', label: 'Tổng quan Tài chính', icon: 'LayoutDashboard' },
  { id: 'finance-fees', label: 'Cấu hình Đợt thu', icon: 'DollarSign', group: 'QUẢN LÝ KHOẢN THU' },
  { id: 'finance-tuition', label: 'Quản lý Công nợ Học phí', icon: 'Users', group: 'QUẢN LÝ KHOẢN THU' },
  { id: 'finance-receipts', label: 'Danh sách Biên lai', icon: 'FileText', group: 'QUẢN LÝ KHOẢN THU' },
  { id: 'finance-payroll', label: 'Bảng lương & Phụ cấp', icon: 'CalendarCheck', group: 'QUẢN LÝ CHI & LƯƠNG' },
  { id: 'finance-expenses', label: 'Chi phí Vận hành & Mua sắm', icon: 'DollarSign', group: 'QUẢN LÝ CHI & LƯƠNG' },
  { id: 'finance-maintenance', label: 'Thanh toán Sửa chữa/Bảo trì', icon: 'Building', group: 'QUẢN LÝ CHI & LƯƠNG' },
  { id: 'finance-ledger', label: 'Sổ quỹ (Tiền mặt/Ngân hàng)', icon: 'TrendingUp', group: 'SỔ SÁCH & BÁO CÁO' },
  { id: 'finance-reports', label: 'Báo cáo Thu - Chi', icon: 'FileText', group: 'SỔ SÁCH & BÁO CÁO' },
  { id: 'finance-tax', label: 'Xuất file Thống kê & Thuế', icon: 'Award', group: 'SỔ SÁCH & BÁO CÁO' },
  { id: 'finance-config', label: 'Cấu hình Định mức Thu-Chi', icon: 'Settings', group: 'THIẾT LẬP LUẬT CHƠI' },
  { id: 'finance-audit', label: 'Nhật ký kiểm toán', icon: 'ShieldCheck', group: 'THIẾT LẬP LUẬT CHƠI' },
  { id: 'security-overview', label: 'Tổng quan An ninh', icon: 'LayoutDashboard', group: 'Nghiệp vụ An ninh' },
  { id: 'security-access', label: 'Kiểm soát Ra vào', icon: 'UserCheck', group: 'Nghiệp vụ An ninh' },
  { id: 'security-assets', label: 'An ninh Tài sản', icon: 'ShieldCheck', group: 'Nghiệp vụ An ninh' },
  { id: 'security-parking', label: 'Quản lý Bãi xe', icon: 'Building', group: 'Nghiệp vụ An ninh' },
  { id: 'security-incidents', label: 'Báo cáo Sự cố', icon: 'Megaphone', group: 'Nghiệp vụ An ninh' },
  { id: 'security-schedule', label: 'Phân ca trực', icon: 'CalendarDays', group: 'Quản lý An ninh' },
  { id: 'security-attendance', label: 'Chấm công & Nghỉ phép', icon: 'CalendarCheck', group: 'Quản lý An ninh' },
  { id: 'security-reports', label: 'Báo cáo Tháng', icon: 'TrendingUp', group: 'Quản lý An ninh' },
  { id: 'cleaner-overview', label: 'Trang chủ Lao công', icon: 'LayoutDashboard', group: 'Nghiệp vụ Lao công' },
  { id: 'cleaner-schedule', label: 'Lịch làm việc', icon: 'CalendarDays', group: 'Nghiệp vụ Lao công' },
  { id: 'cleaner-supplies', label: 'Quản lý Vật tư', icon: 'Coffee', group: 'Nghiệp vụ Lao công' },
  { id: 'cleaner-reports', label: 'Báo cáo Sự cố', icon: 'Megaphone', group: 'Nghiệp vụ Lao công' },
];

export const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  Network,
  CalendarCheck,
  CalendarDays,
  LayoutList,
  Award,
  Flag,
  Compass,
  HeartPulse,
  Coffee,
  Building,
  DollarSign,
  FileText,
  ShieldCheck,
  UserPlus,
  GraduationCap,
  TrendingUp,
  Inbox,
  Archive,
  Megaphone,
  User,
  Sparkles,
  Syringe,
  Pill,
  Stethoscope,
  Activity,
  Receipt,
  ClipboardCheck,
  BedDouble,
};

export const ROLE_MODULES: Record<UserRole, ModuleId[]> = {
  school_board: [
    'overview', 'students', 'classes', 'personnel', 'system-roster', 'academics', 'facilities',
    'finance',
    'departments', 'assignments', 'timetable', 'youth-union',
    'health', 'quality-assurance', 'counseling', 'party-union',
    'boarding-dashboard', 'boarding-communication', 'boarding-inventory', 'boarding-atvstp', 'boarding-closing', 'boarding-rooms',
    'settings', 'user-profile', 'admissions', 'promotion', 'graduation', 'alumni',
    'library-overview', 'library-circulation', 'library-inventory', 'library-readers', 'library-audit'
  ],
  department_head: [
    'dept-overview', 'dept-lesson-plans', 'dept-assignments', 'dept-evaluation',
    'dept-analytics', 'timetable-schedule', 'timetable-exam', 'user-profile'
  ],
  homeroom_teacher: [
    'teacher-overview', 'teacher-timetable', 'teacher-lesson-plans', 'teacher-gradebook', 'teacher-diary',
    'homeroom-profile', 'homeroom-attendance', 'homeroom-conduct',
    'teacher-profile', 'teacher-evaluation', 'teacher-maintenance', 'teacher-contacts', 'user-profile'
  ],
  subject_teacher: [
    'teacher-overview', 'teacher-timetable', 'teacher-lesson-plans', 'teacher-gradebook', 'teacher-diary',
    'teacher-profile', 'teacher-evaluation', 'teacher-maintenance', 'teacher-contacts', 'user-profile'
  ],
  activities_head: [
    'overview', 'youth-union', 'counseling', 'health', 'user-profile'
  ],
  accounting: [
    'finance-overview', 'finance-tuition', 'finance-receipts', 'finance-payroll', 'finance-expenses',
    'finance-maintenance', 'finance-ledger', 'finance-reports', 'finance-tax', 'user-profile'
  ],
  chief_accountant: [
    'finance-overview', 'finance-fees', 'finance-tuition', 'finance-receipts', 'finance-payroll', 'finance-expenses',
    'finance-maintenance', 'finance-ledger', 'finance-reports', 'finance-tax', 'finance-config', 'finance-audit',
    'user-profile'
  ],
  nurse: [
    'health-dashboard', 'health-records', 'health-log', 'health-inventory', 'health-epidemic', 'health-insurance', 'health-reports', 'user-profile'
  ],
  librarian: [
    'library-overview', 'library-circulation', 'library-inventory', 'library-readers', 'library-audit', 'user-profile'
  ],
  admin_staff: [
    'secretary-overview', 'secretary-documents', 'secretary-council', 'secretary-storage', 'secretary-bulletin', 'system-roster', 'user-profile'
  ],
  security: [
    'security-overview', 'security-access', 'security-assets', 'security-parking', 'security-incidents',
    'security-schedule', 'security-attendance', 'security-reports',
    'user-profile'
  ],
  cleaner: [
    'cleaner-overview', 'cleaner-schedule', 'cleaner-supplies', 'cleaner-reports', 'user-profile'
  ],
  student: [
    'student-portal',
    'student-timetable',
    'student-grades',
    'student-conduct',
    'student-leave',
    'student-privilege',
    'user-profile',
    'settings'
  ],
  boarding: [
    'boarding-dashboard',
    'boarding-communication',
    'boarding-inventory',
    'boarding-atvstp',
    'boarding-closing',
    'boarding-rooms',
    'user-profile'
  ]
};

export const ROLE_DEFAULT_MODULES: Record<UserRole, ModuleId> = {
  school_board: 'overview',
  department_head: 'dept-overview',
  homeroom_teacher: 'teacher-overview',
  subject_teacher: 'teacher-overview',
  activities_head: 'youth-union',
  accounting: 'finance-overview',
  chief_accountant: 'finance-overview',
  nurse: 'health-dashboard',
  librarian: 'library-overview',
  admin_staff: 'secretary-overview',
  security: 'security-overview',
  cleaner: 'cleaner-overview',
  student: 'student-portal',
  boarding: 'boarding-dashboard'
};

export const ROLE_DETAILS: Record<UserRole, { name: string; title: string; subtitle: string; assignedClass?: string; avatar: string }> = {
  school_board: {
    name: 'Nguyễn Văn Hiệu',
    title: 'Hiệu trưởng',
    subtitle: 'Ban Giám Hiệu',
    avatar: 'https://i.pravatar.cc/100?img=11'
  },
  department_head: {
    name: 'Cô Lê Thị Thảo',
    title: 'Tổ trưởng chuyên môn',
    subtitle: 'Tổ Khối Nhà Trẻ',
    avatar: 'https://i.pravatar.cc/100?img=5'
  },
  homeroom_teacher: {
    name: 'Cô Nguyễn Thị Hoa',
    title: 'Giáo viên chủ nhiệm',
    subtitle: 'Lớp Mầm 1',
    assignedClass: 'Mầm 1',
    avatar: 'https://i.pravatar.cc/100?img=9'
  },
  subject_teacher: {
    name: 'Cô Phạm Hồng Đào',
    title: 'Giáo viên',
    subtitle: 'Khối Mầm',
    avatar: 'https://i.pravatar.cc/100?img=47'
  },
  activities_head: {
    name: 'Thầy Lê Văn Tám',
    title: 'Tổng phụ trách',
    subtitle: 'Đoàn - Đội',
    avatar: 'https://i.pravatar.cc/100?img=15'
  },
  accounting: {
    name: 'Cô Nguyễn Thị Mai',
    title: 'Nhân viên Kế toán',
    subtitle: 'Tổ Hành chính - Tài vụ',
    avatar: 'https://i.pravatar.cc/100?img=47'
  },
  chief_accountant: {
    name: 'Thầy Phan Văn F',
    title: 'Kế toán trưởng',
    subtitle: 'Phòng Kế toán - Tài vụ',
    avatar: 'https://i.pravatar.cc/100?img=68'
  },
  nurse: {
    name: 'Cô Lê Hải Yến',
    title: 'Nhân viên Y tế',
    subtitle: 'Phòng Y tế học đường',
    avatar: 'https://i.pravatar.cc/100?img=43'
  },
  librarian: {
    name: 'Cô Trịnh Thị Thư',
    title: 'Nhân viên Thư viện',
    subtitle: 'Thư viện trường',
    avatar: 'https://i.pravatar.cc/100?img=38'
  },
  admin_staff: {
    name: 'Thầy Vũ Văn Hành',
    title: 'Thư ký / Hành chính',
    subtitle: 'Văn phòng Nhà trường',
    avatar: 'https://i.pravatar.cc/100?img=60'
  },
  security: {
    name: 'Bác Nguyễn Văn Bảo',
    title: 'Nhân viên Bảo vệ',
    subtitle: 'Tổ Bảo vệ',
    avatar: 'https://i.pravatar.cc/100?img=68'
  },
  cleaner: {
    name: 'Cô Phạm Thị Cần',
    title: 'Nhân viên Lao động',
    subtitle: 'Tổ tạp vụ',
    avatar: 'https://i.pravatar.cc/100?img=20'
  },
  student: {
    name: 'Nguyễn Văn Hùng',
    title: 'Phụ huynh',
    subtitle: 'Bé Bông — Lớp Nhà trẻ 1',
    avatar: 'https://i.pravatar.cc/100?img=11'
  },
  boarding: {
    name: 'Cô Nguyễn Thị Bếp',
    title: 'Nhân viên Nhà bếp',
    subtitle: 'Tổ Nhà bếp - Bán trú',
    avatar: 'https://i.pravatar.cc/100?img=49'
  }
};

