export type ModuleId = 
  | 'overview'
  | 'students'
  | 'classes'
  | 'personnel'
  | 'academics'
  | 'facilities'
  | 'finance'
  | 'admin'
  | 'secretary'
  | 'secretary-overview'
  | 'secretary-documents'
  | 'secretary-council'
  | 'secretary-storage'
  | 'secretary-bulletin'
  | 'departments'
  | 'assignments'
  | 'timetable'
  | 'youth-union'
  | 'health'
  | 'health-dashboard'
  | 'health-records'
  | 'health-log'
  | 'health-inventory'
  | 'health-epidemic'
  | 'health-insurance'
  | 'health-reports'
  | 'quality-assurance'
  | 'counseling'
  | 'boarding'
  | 'boarding-dashboard'
  | 'boarding-communication'
  | 'boarding-inventory'
  | 'boarding-atvstp'
  | 'boarding-closing'
  | 'boarding-rooms'
  | 'party-union'
  | 'settings'
  | 'user-profile'
  | 'admissions'
  | 'graduation'
  | 'promotion'
  | 'alumni'
  | 'dept-overview'
  | 'dept-lesson-plans'
  | 'dept-assignments'
  | 'dept-evaluation'
  | 'dept-analytics'
  | 'timetable-schedule'
  | 'timetable-exam'
  | 'teacher-overview'
  | 'teacher-timetable'
  | 'teacher-lesson-plans'
  | 'teacher-gradebook'
  | 'teacher-diary'
  | 'homeroom-profile'
  | 'homeroom-attendance'
  | 'homeroom-conduct'
  | 'teacher-profile'
  | 'teacher-evaluation'
  | 'teacher-maintenance'
  | 'teacher-contacts'
  | 'finance-overview'
  | 'finance-fees'
  | 'finance-tuition'
  | 'finance-receipts'
  | 'finance-payroll'
  | 'finance-expenses'
  | 'finance-maintenance'
  | 'finance-ledger'
  | 'finance-reports'
  | 'finance-tax'
  | 'finance-config'
  | 'finance-audit'
  | 'library-overview'
  | 'library-circulation'
  | 'library-inventory'
  | 'library-readers'
  | 'library-audit'
  | 'security'
  | 'security-overview'
  | 'security-access'
  | 'security-assets'
  | 'security-parking'
  | 'security-incidents'
  | 'security-schedule'
  | 'security-attendance'
  | 'security-reports'
  | 'cleaner-overview'
  | 'cleaner-schedule'
  | 'cleaner-supplies'
  | 'cleaner-reports'
  | 'system-roster'
  | 'student-portal'
  | 'student-timetable'
  | 'student-grades'
  | 'student-conduct'
  | 'student-leave'
  | 'student-privilege';


export interface NavItem {
  id: ModuleId;
  label: string;
  icon: string;
  group?: string;
}

export interface Student {
  id: string;
  name: string;
  nickname?: string;
  dob: string;
  gender: string;
  grade: string; // Lớp hiện tại (Nhà trẻ 1, Mầm 1, Chồi 1, Lá 1)
  status: 'Đang Học' | 'Bảo Lưu' | 'Đình Chỉ' | 'Hoàn thành' | 'Đã tốt nghiệp';
  phone?: string;
  address: string;
  guardian?: string;
  cccd?: string;
  ethnicity?: string;
  classRole?: string;
  email?: string;
}

export interface Teacher {
  id: string;
  name: string;
  department: string;
  email: string;
  role: string;
}

export interface TimetableEntry {
  id: string;
  day: number; // 2-7 (Mon-Sat)
  period: number; // 1-10
  subject: string;
  teacherId: string;
  classId: string;
  room: string;
}

export type UserRole = 
  | 'school_board' 
  | 'department_head' 
  | 'homeroom_teacher' 
  | 'subject_teacher' 
  | 'activities_head'
  | 'accounting'
  | 'chief_accountant'
  | 'nurse'
  | 'librarian'
  | 'admin_staff'
  | 'security'
  | 'cleaner'
  | 'student'
  | 'boarding';

export interface UserProfile {
  name: string;
  role: UserRole;
  email: string;
  assignedClass?: string;
}


