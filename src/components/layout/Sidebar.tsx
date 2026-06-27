import React from 'react';
import { BookOpen, LogOut } from 'lucide-react';
import SystemLogo from '../ui/SystemLogo';
import { NavItem, ModuleId, UserRole } from '../../types';
import { ICONS, NAVIGATION, ROLE_MODULES, ROLE_DETAILS } from '../../data/navigation';
import { ROLE_THEMES } from '../../utils/role';
import { auth } from '../../services/firebase';

interface SidebarProps {
  activeModule: ModuleId;
  onSelectModule: (id: ModuleId) => void;
  onGoToLanding?: () => void;
  currentRole: UserRole;
}

const TRANSLATIONS: Record<string, string> = {
  'overview': 'System Overview',
  'personnel': 'Personnel',
  'admin': 'General Admin',
  'secretary-overview': 'Administrative Overview',
  'secretary-documents': 'Electronic Dispatches',
  'secretary-council': 'Council Operations',
  'secretary-storage': 'Storage & Issuance',
  'secretary-bulletin': 'School Bulletin',
  'party-union': 'Party & Unions',
  'academics': 'Curriculum & Training',
  'departments': 'Departments & Subjects',
  'assignments': 'Professional Assignment',
  'timetable': 'Timetable',
  'quality-assurance': 'Testing & Quality',
  'students': 'Children',
  'classes': 'Classes',
  'youth-union': 'Youth & Movements',
  'counseling': 'Careers & Psychology',
  'finance': 'Finance & Accounting',
  'facilities': 'Facilities',
  'health': 'School Health',
  'boarding': 'Boarding & Canteen',
  'settings': 'System Settings',
  'user-profile': 'User Profile',
  'graduation': 'Graduation Management',
  'dept-overview': 'Academic Overview',
  'dept-lesson-plans': 'Lesson Plan Review',
  'dept-assignments': 'Teaching Assignments',
  'dept-evaluation': 'Evaluation & Emulation',
  'dept-analytics': 'Academic Analytics',
  'timetable-schedule': 'Class Schedule',
  'timetable-exam': 'Assessment Schedule',
  'teacher-overview': 'Teacher Dashboard',
  'teacher-timetable': 'Timetable & Lesson Log',
  'teacher-lesson-plans': 'My Lesson Plans',
  'teacher-gradebook': 'Daily Assessment (Sổ Bé Ngoan)',
  'teacher-diary': 'E-Classbook Diary',
  'homeroom-profile': 'Homeroom Class Profile',
  'homeroom-attendance': 'Class Attendance',
  'homeroom-conduct': 'Daily Assessment',
  'teacher-profile': 'Teacher CV Profile',
  'teacher-evaluation': 'Professional Evaluation',
  'teacher-maintenance': 'Report Facilities Damage',
  'teacher-contacts': 'Internal Directory',
  'finance-overview': 'Finance Dashboard',
  'finance-fees': 'Fee Configuration',
  'finance-tuition': 'Tuition Debt Ledger',
  'finance-receipts': 'Receipts List',
  'finance-payroll': 'Payroll & Allowances',
  'finance-expenses': 'Operating Bills',
  'finance-maintenance': 'Maintenance Payments',
  'finance-ledger': 'Fund Book',
  'finance-reports': 'Income Statements',
  'finance-tax': 'Export Tax Forms',
  'finance-config': 'Rate Configuration',
  'finance-audit': 'Audit Trail',
  'security-overview': 'Security Overview',
  'security-access': 'Access Control',
  'security-assets': 'Asset Security',
  'security-parking': 'Parking Management',
  'security-incidents': 'Incident Reports',
  'security-schedule': 'Shift Scheduling',
  'security-attendance': 'Time & Leave',
  'security-reports': 'Monthly Reports',
  'student-portal': 'Parent Portal Home',
  'student-timetable': 'Daily Schedule',
  'student-grades': 'Daily Assessment (Sổ Bé Ngoan)',
  'student-conduct': 'Attendance',
  'student-leave': 'Request Leave Absence',
  'student-privilege': 'Pickup Information'
};

const GROUP_TRANSLATIONS: Record<string, string> = {
  'Hành chính & Nhân sự': 'Admin & HR',
  'Đào tạo & Chuyên môn': 'Academic & Training',
  'Công tác Trẻ em': 'Child Affairs',
  'Tài chính & Hậu cần': 'Finance & Logistics',
  'Nghiệp vụ An ninh': 'Security Operations',
  'Quản lý An ninh': 'Security Management',
  'Cổng Phụ Huynh': 'Parent Portal',
  'Giám sát & Báo cáo': 'Monitoring & Reports',
  'Hồ sơ & Khám bệnh': 'Records & Diagnostics',
  'Dược phẩm & Vật tư': 'Medicine & Supplies',
  'Dịch tễ & Bảo hiểm': 'Epidemiology & Insurance'
};

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onSelectModule, onGoToLanding, currentRole }) => {
  const [language, setLanguage] = React.useState<'vi' | 'en'>(() => (localStorage.getItem('language') as any) || 'vi');

  React.useEffect(() => {
    const handleLangChange = () => {
      setLanguage((localStorage.getItem('language') as any) || 'vi');
    };
    window.addEventListener('language-changed', handleLangChange);
    return () => window.removeEventListener('language-changed', handleLangChange);
  }, []);

  const getLabel = (item: NavItem) => {
    return language === 'en' ? TRANSLATIONS[item.id] || item.label : item.label;
  };

  const getGroupLabel = (group: string) => {
    return language === 'en' ? GROUP_TRANSLATIONS[group] || group : group;
  };

  const email = auth.currentUser?.email;
  const isTechnician = email?.toLowerCase().trim().includes('@admin.');
  const currentDetails = React.useMemo(() => {
    return isTechnician 
      ? {
          name: 'Kỹ thuật viên',
          title: 'Nhân viên Kỹ thuật',
          subtitle: 'Tổ Kỹ thuật / CNTT',
          avatar: 'https://i.pravatar.cc/100?img=60'
        }
      : ROLE_DETAILS[currentRole];
  }, [isTechnician, currentRole]);

  // Resolve logged-in user profile from cached staff list
  const [userProfile, setUserProfile] = React.useState<{ name: string; title: string; avatar: string }>({
    name: currentDetails.name,
    title: currentDetails.title,
    avatar: currentDetails.avatar
  });

  React.useEffect(() => {
    const resolveProfile = () => {
      const userEmail = auth.currentUser?.email;
      if (!userEmail) {
        setUserProfile({
          name: currentDetails.name,
          title: currentDetails.title,
          avatar: currentDetails.avatar
        });
        return;
      }
      const cleanEmail = userEmail.toLowerCase().trim();

      if (currentRole === 'student') {
        const cachedStudents = localStorage.getItem('firestore_fallback_students');
        let student;
        if (cachedStudents) {
          try {
            const list = JSON.parse(cachedStudents);
            if (Array.isArray(list)) {
              student = list.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
            }
          } catch (e) {
            console.error(e);
          }
        }
        
        if (!student) {
          import('../../services/studentService').then(({ getStudents }) => {
            getStudents().then(list => {
              const found = list.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
              if (found) {
                setUserProfile({
                  name: found.name,
                  title: found.classRole || 'Phụ huynh',
                  avatar: currentDetails.avatar
                });
              }
            });
          }).catch(err => console.error(err));
        } else {
          setUserProfile({
            name: student.name,
            title: student.classRole || 'Phụ huynh',
            avatar: currentDetails.avatar
          });
          return;
        }
        return;
      }

      if (cleanEmail === 'to-truong-tapvu@cleaner.mnah.edu.vn') {
        setUserProfile({
          name: 'Cô Trần Thị B',
          title: 'Tổ trưởng Tạp vụ / Giám sát vệ sinh',
          avatar: 'https://i.pravatar.cc/100?img=28'
        });
        return;
      }
      if (cleanEmail === 'tapvu@cleaner.mnah.edu.vn') {
        setUserProfile({
          name: 'Cô Phạm Thị Cần',
          title: 'Nhân viên Tạp vụ',
          avatar: 'https://i.pravatar.cc/100?img=20'
        });
        return;
      }
      const userIsTechnician = cleanEmail.includes('@admin.');
      try {
        const cachedStaff = localStorage.getItem('firestore_fallback_staff');
        if (cachedStaff) {
          const staffList = JSON.parse(cachedStaff);
          if (Array.isArray(staffList)) {
            const staff = staffList.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
            if (staff) {
              const displayTitle = (userIsTechnician && (staff.role === 'Hiệu trưởng' || staff.department === 'Ban Giám Hiệu'))
                ? 'Nhân viên Kỹ thuật'
                : (staff.role || staff.jobRole || currentDetails.title);
              setUserProfile({
                name: staff.name,
                title: displayTitle,
                avatar: currentDetails.avatar
              });
              return;
            }
          }
        }
      } catch (e) {
        console.error("Error resolving sidebar profile:", e);
      }

      setUserProfile({
        name: currentDetails.name,
        title: currentDetails.title,
        avatar: currentDetails.avatar
      });
    };

    resolveProfile();
    const unsubscribe = auth.onAuthStateChanged(() => {
      resolveProfile();
    });

    window.addEventListener('storage', resolveProfile);
    window.addEventListener('role-changed', resolveProfile);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', resolveProfile);
      window.removeEventListener('role-changed', resolveProfile);
    };
  }, [currentRole, currentDetails]);

  const allowedModules = React.useMemo(() => {
    const baseModules = ROLE_MODULES[currentRole] || [];
    if (currentRole === 'security') {
      const isChief = (userProfile.title || '').toLowerCase().includes('tổ trưởng');
      if (!isChief) {
        return baseModules.filter(
          id => !['security-schedule', 'security-attendance', 'security-reports'].includes(id)
        );
      }
    }
    if (currentRole === 'student') {
      const isRegularStudent = !userProfile.title || userProfile.title === 'Phụ huynh' || userProfile.title === 'Trẻ' || userProfile.title === 'Bé';
      if (isRegularStudent) {
        return baseModules.filter(id => id !== 'student-privilege');
      }
    }
    return baseModules;
  }, [currentRole, userProfile.title]);

  const filteredNavigation = NAVIGATION.filter(item => allowedModules.includes(item.id));

  return (
    <div className="w-16 md:w-20 lg:w-72 hover:w-72 bg-[#2d251e] text-[#c2b5a5] h-screen flex flex-col flex-shrink-0 shadow-2xl z-20 border-r-[6px] border-double border-[#4a3d30] transition-all duration-300 overflow-hidden group">
      {onGoToLanding ? (
        <button
          onClick={onGoToLanding}
          title={language === 'en' ? 'Go to Landing Page' : 'Trang giới thiệu'}
          className="h-24 w-full flex items-center px-4 max-w-[288px] lg:px-6 shrink-0 border-b border-[#4a3d30] bg-[#201914] hover:bg-[#2d251e] cursor-pointer text-left transition-colors focus:outline-none group/logo overflow-hidden"
        >
          <div className="mr-4 shrink-0 group-hover/logo:scale-105 transition-transform duration-200">
            <SystemLogo size={44} color="#fdfbf7" />
          </div>
          <div className="flex flex-col opacity-0 lg:opacity-100 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-200">
            <span className="text-[#fdfbf7] font-serif font-bold tracking-wider text-2xl leading-tight group-hover/logo:text-inherit transition-colors duration-200">EduCore</span>
            <span className="text-[#f59e0b] text-[10px] font-bold tracking-[0.25em] uppercase mt-1">
              {language === 'en' ? 'PRESCHOOL SYSTEM' : 'Hệ Thống Mầm Non'}
            </span>
          </div>
        </button>
      ) : (
        <div className="h-24 flex items-center px-4 max-w-[288px] lg:px-6 shrink-0 border-b border-[#4a3d30] bg-[#201914] overflow-hidden">
          <div className="mr-4 shrink-0">
            <SystemLogo size={44} color="#fdfbf7" />
          </div>
          <div className="flex flex-col opacity-0 lg:opacity-100 group-hover:opacity-100 whitespace-nowrap transition-opacity">
            <span className="text-[#fdfbf7] font-serif font-bold tracking-wider text-2xl leading-tight">EduCore</span>
            <span className="text-[#f59e0b] text-[10px] font-bold tracking-[0.25em] uppercase mt-1">
              {language === 'en' ? 'PRESCHOOL SYSTEM' : 'Hệ Thống Mầm Non'}
            </span>
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto sidebar-scrollbar py-4 px-0 space-y-1 overflow-x-hidden">
        {filteredNavigation.filter(item => !item.group).map((item) => (
          <NavItemButton 
            key={item.id} 
            item={item} 
            label={getLabel(item)}
            isActive={activeModule === item.id} 
            onClick={() => onSelectModule(item.id)} 
            currentRole={currentRole}
          />
        ))}

        {Array.from(new Set(filteredNavigation.filter(item => item.group).map(item => item.group))).map(group => (
          <React.Fragment key={group as string}>
            <div className="text-[10px] font-bold text-[#b8ae9c] uppercase tracking-[0.2em] mb-3 px-6 mt-6 border-b border-[#4a3d30]/60 pb-2 mx-2 opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {getGroupLabel(group as string)}
            </div>
            {filteredNavigation.filter(item => item.group === group).map((item) => (
              <NavItemButton 
                key={item.id} 
                item={item} 
                label={getLabel(item)}
                isActive={activeModule === item.id} 
                onClick={() => onSelectModule(item.id)} 
                currentRole={currentRole}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div 
        className={`p-2 mb-4 mx-2 lg:mx-4 border flex items-center justify-between shadow-inner transition-all overflow-hidden whitespace-nowrap ${
          activeModule === 'user-profile' 
            ? 'bg-[#3d3025] border-l-[4px] border-[#f59e0b] border-y-[#4a3d30] border-r-[#4a3d30]' 
            : 'bg-[#201914] border-[#4a3d30]'
        }`}
      >
        <button 
          onClick={() => onSelectModule('user-profile')}
          className="flex items-center flex-1 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer focus:outline-none"
        >
          <div className="w-9 h-9 border border-[#f59e0b]/40 bg-[#2e6b8a] flex items-center justify-center overflow-hidden p-0.5 shrink-0 rounded-md">
            <img src={userProfile.avatar} alt={userProfile.name} className="w-full h-full object-cover grayscale brightness-90 sepia-[0.3]" />
          </div>
          <div className="ml-2.5 opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity truncate">
            <p className="text-xs font-bold text-[#fdfbf7] font-serif truncate">
              {userProfile.name}
            </p>
            <p className="text-[9px] text-[#c2b5a5] uppercase tracking-widest font-semibold mt-0.5 truncate">
              {userProfile.title}
            </p>
          </div>
        </button>

        <button
          onClick={async () => {
            if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
              try {
                const { logoutUser } = await import('../../services/firebase');
                await logoutUser();
              } catch (err) {
                alert('Không thể đăng xuất. Vui lòng thử lại.');
              }
            }
          }}
          title="Đăng xuất"
          className="p-1.5 text-[#c2b5a5] hover:text-[#f59e0b] hover:bg-[#2d251e] border border-transparent hover:border-[#4a3d30] transition-all ml-1 shrink-0 cursor-pointer hidden lg:block group-hover:block rounded-md"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

interface NavItemButtonProps {
  item: NavItem;
  label: string;
  isActive: boolean;
  onClick: () => void;
  currentRole: UserRole;
}

const NavItemButton: React.FC<NavItemButtonProps> = ({ item, label, isActive, onClick, currentRole }) => {
  const Icon = ICONS[item.icon];
  
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center px-4 md:px-6 py-3 text-sm font-semibold transition-all duration-200 border-l-4 rounded-r-full my-0.5 overflow-hidden whitespace-nowrap ${
        isActive 
          ? 'bg-[#f59e0b] text-[#2d251e] border-[#f59e0b] shadow-md font-bold' 
          : 'border-transparent text-[#c2b5a5] hover:bg-[#3d3025] hover:text-white hover:border-[#f59e0b]/40'
      }`}
    >
      {Icon && <Icon className={`mr-4 w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2d251e]' : 'text-[#c2b5a5]/70 group-hover:text-white'}`} />}
      <span className="truncate tracking-wide opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity">{label}</span>
    </button>
  );
};

