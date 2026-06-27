import { useState, useEffect } from 'react';

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

export const ROLE_LABELS: Record<UserRole, string> = {
  school_board: 'Ban Giám Hiệu (BGH)',
  department_head: 'Tổ trưởng chuyên môn',
  homeroom_teacher: 'Giáo viên Chủ nhiệm',
  subject_teacher: 'Giáo viên Bộ môn',
  activities_head: 'Tổng phụ trách',
  accounting: 'Nhân viên Kế toán (Maker)',
  chief_accountant: 'Kế toán trưởng (Checker)',
  nurse: 'Nhân viên Y tế',
  librarian: 'Nhân viên Thư viện',
  admin_staff: 'Thư ký / Hành chính',
  security: 'Nhân viên Bảo vệ',
  cleaner: 'Nhân viên Lao động',
  student: 'Phụ huynh',
  boarding: 'Nhân viên Nhà bếp',
};

export function getSelectedRole(): UserRole {
  if (typeof window === 'undefined') return 'school_board';
  return (localStorage.getItem('current_user_role') as UserRole) || 'school_board';
}

export function setSelectedRole(role: UserRole) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('current_user_role', role);
  window.dispatchEvent(new Event('role-changed'));
  window.dispatchEvent(new Event('userRoleChanged'));
}

export function useUserRole() {
  const [role, setRole] = useState<UserRole>(getSelectedRole());

  useEffect(() => {
    const handleRoleChange = () => {
      setRole(getSelectedRole());
    };
    window.addEventListener('role-changed', handleRoleChange);
    window.addEventListener('userRoleChanged', handleRoleChange);
    window.addEventListener('storage', handleRoleChange);
    return () => {
      window.removeEventListener('role-changed', handleRoleChange);
      window.removeEventListener('userRoleChanged', handleRoleChange);
      window.removeEventListener('storage', handleRoleChange);
    };
  }, []);

  return role;
}

export interface RoleTheme {
  primaryText: string;
  primaryBorder: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
  sidebarBg: string;
  logoBg: string;
  logoIconBg: string;
  headerBorder: string;
  badgeBg: string;
  badgeText: string;
  borderDouble: string;
}

export const ADMIN_THEME: RoleTheme = {
  primaryText: 'text-[#2c5ea0]',
  primaryBorder: 'border-[#2c5ea0]',
  activeBg: 'bg-[#e8eef6] dark:bg-[#1a2332]',
  activeText: 'text-[#2c5ea0] dark:text-[#f5f8fc]',
  activeBorder: 'border-[#2c5ea0]',
  sidebarBg: 'bg-[#d4dde9] dark:bg-[#131a25]',
  logoBg: 'bg-[#b8c6d9] dark:bg-[#0c1018] hover:bg-[#a3b3c8] dark:hover:bg-[#1e1b18]',
  logoIconBg: 'bg-[#2c5ea0]',
  headerBorder: 'border-[#b8c6d9] dark:border-[#283548]',
  badgeBg: 'bg-[#2c5ea0]/10',
  badgeText: 'text-[#2c5ea0]',
  borderDouble: 'border-[#a3b3c8] dark:border-[#283548]'
};

export const ROLE_THEMES: Record<UserRole, RoleTheme> = {
  school_board: ADMIN_THEME,
  department_head: ADMIN_THEME,
  homeroom_teacher: ADMIN_THEME,
  subject_teacher: ADMIN_THEME,
  activities_head: ADMIN_THEME,
  accounting: ADMIN_THEME,
  chief_accountant: ADMIN_THEME,
  nurse: ADMIN_THEME,
  librarian: ADMIN_THEME,
  admin_staff: ADMIN_THEME,
  security: ADMIN_THEME,
  cleaner: ADMIN_THEME,
  student: ADMIN_THEME,
  boarding: ADMIN_THEME
};

export const ADMIN_CHART_COLORS = ['#2c5ea0', '#a8c4e0', '#2e6b8a'];

export const ROLE_CHART_COLORS: Record<UserRole, string[]> = {
  school_board: ADMIN_CHART_COLORS,
  department_head: ADMIN_CHART_COLORS,
  homeroom_teacher: ADMIN_CHART_COLORS,
  subject_teacher: ADMIN_CHART_COLORS,
  activities_head: ADMIN_CHART_COLORS,
  accounting: ADMIN_CHART_COLORS,
  chief_accountant: ADMIN_CHART_COLORS,
  nurse: ADMIN_CHART_COLORS,
  librarian: ADMIN_CHART_COLORS,
  admin_staff: ADMIN_CHART_COLORS,
  security: ADMIN_CHART_COLORS,
  cleaner: ADMIN_CHART_COLORS,
  student: ADMIN_CHART_COLORS,
  boarding: ADMIN_CHART_COLORS
};

export function getRoleFromEmail(email: string | null | undefined): UserRole {
  if (!email) return 'school_board';
  const cleanEmail = email.toLowerCase().trim();
  
  // Try to find in cached staff list from localStorage
  try {
    const cachedStaff = localStorage.getItem('firestore_fallback_staff');
    if (cachedStaff) {
      const staffList = JSON.parse(cachedStaff);
      if (Array.isArray(staffList)) {
        const staff = staffList.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
        if (staff) {
          const job = (staff.jobRole || '').toLowerCase().trim();
          const role = (staff.role || '').toLowerCase().trim();
          
          if (job.includes('giám hiệu') || job.includes('hiệu trưởng') || job.includes('bgh') || role.includes('hiệu trưởng') || role.includes('giám hiệu')) {
            return 'school_board';
          }
          if (role.includes('tổng phụ trách')) {
            return 'activities_head';
          }
          if (job.includes('tổ trưởng chuyên môn') || job.includes('tổ trưởng cm') || role.includes('tổ trưởng chuyên môn') || role.includes('tổ trưởng cm')) {
            return 'department_head';
          }
          if (job.includes('kế toán') || role.includes('kế toán')) {
            return (role.includes('trưởng') || job.includes('trưởng')) ? 'chief_accountant' : 'accounting';
          }
          if (job.includes('y tế') || role.includes('y tế')) {
            return 'nurse';
          }
          if (job.includes('thư viện') || role.includes('thư viện')) {
            return 'librarian';
          }
          if (job.includes('kỹ thuật') || role.includes('kỹ thuật')) {
            return 'school_board';
          }
          if (job.includes('thư ký') || job.includes('văn thư') || role.includes('thư ký') || role.includes('văn thư') || job.includes('hành chính') || role.includes('hành chính')) {
            return 'admin_staff';
          }
          if (job.includes('bảo vệ') || role.includes('bảo vệ')) {
            return 'security';
          }
          if (job.includes('tạp vụ') || job.includes('lao cong') || role.includes('tạp vụ') || role.includes('lao cong') || job.includes('lao động') || role.includes('lao động')) {
            return 'cleaner';
          }
          if (job.includes('bếp') || role.includes('bếp') || job.includes('nhà bếp') || role.includes('nhà bếp') || job.includes('căng tin') || role.includes('căng tin') || role.includes('boarding')) {
            return 'boarding';
          }
          if (job.includes('giáo viên') || role.includes('giáo viên')) {
            if (role.includes('chủ nhiệm') || staff.assignedClass) {
              return 'homeroom_teacher';
            }
            return 'subject_teacher';
          }
        }
      }
    }
  } catch (e) {
    console.error("Error looking up role from cached staff list:", e);
  }

  // Fallback checks
  // 1. Check subdomains (new emails)
  if (cleanEmail.includes('@student.') || cleanEmail.includes('student')) {
    return 'student';
  }
  if (cleanEmail.includes('@teacher.')) {
    if (cleanEmail.includes('hieutruong') || cleanEmail.includes('bgh') || cleanEmail.includes('nguyen.van.hieu') || cleanEmail.includes('manager') || cleanEmail.includes('school_board')) {
      return 'school_board';
    }
    if (cleanEmail.includes('totruong') || cleanEmail.includes('triet.tran')) {
      return 'department_head';
    }
    if (cleanEmail.includes('chunhiem') || cleanEmail.includes('thao.le')) {
      return 'homeroom_teacher';
    }
    if (cleanEmail.includes('tongphutrach') || cleanEmail.includes('tam.le')) {
      return 'activities_head';
    }
    return 'subject_teacher';
  }
  if (cleanEmail.includes('@account.')) {
    if (cleanEmail.includes('truong') || cleanEmail.includes('chief') || cleanEmail.includes('phan.van')) {
      return 'chief_accountant';
    }
    return 'accounting';
  }
  if (cleanEmail.includes('@nurse.')) {
    return 'nurse';
  }
  if (cleanEmail.includes('@library.')) {
    return 'librarian';
  }
  if (cleanEmail.includes('@admin.')) {
    return 'school_board';
  }
  if (cleanEmail.includes('@secretary.')) {
    return 'admin_staff';
  }
  if (cleanEmail.includes('@secure.') || cleanEmail.includes('@security.')) {
    return 'security';
  }
  if (cleanEmail.includes('@clean.') || cleanEmail.includes('@cleaner.')) {
    return 'cleaner';
  }
  if (cleanEmail.includes('@chief.') || cleanEmail.includes('@boarding.')) {
    return 'boarding';
  }

  // 2. Check keywords (old/demo emails)
  if (cleanEmail.includes('phan.van') || cleanEmail.includes('chief_accountant') || cleanEmail.includes('ketoantruong')) {
    return 'chief_accountant';
  }
  if (cleanEmail.includes('mai.nguyen') || cleanEmail.includes('accounting') || cleanEmail.includes('ketoan') || cleanEmail.includes('ke.toan')) {
    return 'accounting';
  }
  if (cleanEmail.includes('y.te') || cleanEmail.includes('yte') || cleanEmail.includes('nurse')) {
    return 'nurse';
  }
  if (cleanEmail.includes('thu.vien') || cleanEmail.includes('thuvien') || cleanEmail.includes('librarian')) {
    return 'librarian';
  }
  if (cleanEmail.includes('thu.ky') || cleanEmail.includes('thuky') || cleanEmail.includes('van.thu') || cleanEmail.includes('vanthu') || cleanEmail.includes('secretary')) {
    return 'admin_staff';
  }
  if (cleanEmail.includes('bao.ve') || cleanEmail.includes('baove') || cleanEmail.includes('security')) {
    return 'security';
  }
  if (cleanEmail.includes('tap.vu') || cleanEmail.includes('tapvu') || cleanEmail.includes('cleaner') || cleanEmail.includes('lao.cong') || cleanEmail.includes('laocong')) {
    return 'cleaner';
  }
  if (cleanEmail.includes('nha.bep') || cleanEmail.includes('nhabep') || cleanEmail.includes('boarding') || cleanEmail.includes('chief') || cleanEmail.includes('canteen')) {
    return 'boarding';
  }
  if (cleanEmail.includes('totruong') || cleanEmail.includes('triet.tran') || cleanEmail.includes('department_head')) {
    return 'department_head';
  }
  if (cleanEmail.includes('chunhiem') || cleanEmail.includes('thao.le') || cleanEmail.includes('homeroom_teacher')) {
    return 'homeroom_teacher';
  }
  if (cleanEmail.includes('bomon') || cleanEmail.includes('dao.pham') || cleanEmail.includes('subject_teacher')) {
    return 'subject_teacher';
  }
  if (cleanEmail.includes('tongphutrach') || cleanEmail.includes('tam.le') || cleanEmail.includes('activities_head')) {
    return 'activities_head';
  }
  
  return 'school_board';
}


