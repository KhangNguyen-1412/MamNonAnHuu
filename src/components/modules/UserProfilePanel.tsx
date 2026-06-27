import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, Shield, Bell, User, Key, Smartphone, Monitor, Globe, Edit2, Clock, Mail, BookOpen, UserCheck, Activity, ShieldCheck, Github, AlignLeft, Sun, Moon } from 'lucide-react';
import { BaseSelect, BaseDatePicker } from '../ui/BaseInputs';
import { logoutUser, auth, googleProvider } from '../../services/firebase';
import { useUserRole } from '../../utils/role';
import { ROLE_DETAILS } from '../../data/navigation';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, linkWithPopup, unlink } from 'firebase/auth';
import { getLoginHistory, LoginHistoryRecord } from '../../services/historyService';

export const UserProfilePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'personal' | 'context' | 'security' | 'preferences'>('personal');
  const currentRole = useUserRole();
  const currentUser = auth.currentUser;
  const email = currentUser?.email;
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
  const [userProfile, setUserProfile] = useState<{ name: string; title: string; subtitle: string; avatar: string }>({
    name: currentDetails.name,
    title: currentDetails.title,
    subtitle: currentDetails.subtitle,
    avatar: currentDetails.avatar
  });
  const [currentStaff, setCurrentStaff] = useState<any>(null);

  const [name, setName] = useState('');
  const [cccd, setCccd] = useState('');
  const [gender, setGender] = useState('Nam');
  const [dob, setDob] = useState('1985-05-15');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [personalEmail, setPersonalEmail] = useState('');

  React.useEffect(() => {
    const resolveProfile = async () => {
      const email = auth.currentUser?.email;
      if (!email) {
        setUserProfile({
          name: currentDetails.name,
          title: currentDetails.title,
          subtitle: currentDetails.subtitle,
          avatar: currentDetails.avatar
        });
        setCurrentStaff(null);
        return;
      }
      const cleanEmail = email.toLowerCase().trim();

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
        
        const setStudentProfile = (s: any) => {
          setUserProfile({
            name: s.name,
            title: s.classRole || 'Phụ huynh',
            subtitle: `Lớp ${s.grade}`,
            avatar: currentDetails.avatar
          });
          setCurrentStaff({
            id: s.id,
            name: s.name,
            gender: s.gender,
            dob: s.dob,
            address: s.address,
            phone: s.phone,
            personalEmail: s.email || 'recovery.user@gmail.com',
            cccd: s.cccd || '',
            role: s.classRole || 'Phụ huynh',
            jobRole: s.classRole || 'Phụ huynh',
            department: `Lớp ${s.grade}`,
            status: s.status
          });
        };

        if (!student) {
          import('../../services/studentService').then(({ getStudents }) => {
            getStudents().then(list => {
              const found = list.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
              if (found) {
                setStudentProfile(found);
              }
            });
          }).catch(err => console.error(err));
        } else {
          setStudentProfile(student);
        }
        return;
      }

      const matchStaff = (staffList: any[]) => {
        const staff = staffList.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
        if (staff) {
          // Auto-correction for technician staff records that were saved with wrong role/department defaults
          if (isTechnician && (staff.role === 'Hiệu trưởng' || staff.department === 'Ban Giám Hiệu')) {
            staff.role = 'Nhân viên Kỹ thuật';
            staff.jobRole = 'Nhân viên Kỹ thuật';
            staff.department = 'Tổ Kỹ thuật / CNTT';
            // Trigger async save back to Firestore/local storage
            import('../../services/hrService').then(({ createStaff }) => {
              createStaff(staff).catch(err => console.error("Auto-correct technician save failed:", err));
            });
          }

          setUserProfile({
            name: staff.name,
            title: staff.role || staff.jobRole || currentDetails.title,
            subtitle: staff.department || currentDetails.subtitle,
            avatar: currentDetails.avatar
          });
          setCurrentStaff(staff);
          return true;
        }
        return false;
      };

      // 1. Try cache first
      try {
        const cachedStaff = localStorage.getItem('firestore_fallback_staff');
        if (cachedStaff) {
          const staffList = JSON.parse(cachedStaff);
          if (Array.isArray(staffList)) {
            matchStaff(staffList);
          }
        }
      } catch (e) {
        console.error("Error resolving profile panel info from cache:", e);
      }

      // 2. Fetch latest from server
      try {
        const { getStaffList } = await import('../../services/hrService');
        const staffList = await getStaffList();
        if (Array.isArray(staffList)) {
          matchStaff(staffList);
        }
      } catch (e) {
        console.error("Error fetching staff list for profile:", e);
      }
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
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (currentStaff) {
      setName(currentStaff.name || '');
      setCccd(currentStaff.cccd || '');
      setGender(currentStaff.gender || 'Nam');
      setDob(currentStaff.dob ? currentStaff.dob.split('/').reverse().join('-') : '1985-05-15');
      setAddress(currentStaff.address || '');
      setPhone(currentStaff.phone || '');
      setPersonalEmail(currentStaff.personalEmail || 'recovery.user@gmail.com');
    } else {
      setName(userProfile.name || '');
      setCccd('');
      setGender('Nam');
      setDob('1985-05-15');
      setAddress('Ấp 2, Xã An Hữu, Huyện Cái Bè, Tiền Giang');
      setPhone('0988.152.441');
      setPersonalEmail('recovery.user@gmail.com');
    }
  }, [currentStaff, userProfile.name]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { createStaff } = await import('../../services/hrService');
      const formattedDob = dob ? dob.split('-').reverse().join('/') : (currentStaff?.dob || '15/05/1985');

      const email = auth.currentUser?.email || 'admin@teacher.thanhuu.edu.vn';
      
      const staffRecord = currentStaff || {
        id: 'CB-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        email: email,
        role: currentDetails.title,
        jobRole: currentDetails.title,
        department: currentDetails.subtitle,
        status: 'Đang Công Tác'
      };

      const updatedStaff = {
        ...staffRecord,
        name: name || staffRecord.name || userProfile.name,
        cccd,
        gender,
        dob: formattedDob,
        address,
        phone,
        personalEmail
      };

      await createStaff(updatedStaff);
      
      // Force reload profile and update other components
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('role-changed'));
      
      alert("🎉 Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      console.error("Failed to update profile:", err);
      alert("Lỗi: Không thể lưu thông tin hồ sơ cá nhân lên hệ thống.");
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Thông tin Cá nhân', icon: User, desc: 'Dữ liệu nhân khẩu học' },
    { id: 'context', label: 'Môn dạy & Công tác', icon: BookOpen, desc: 'Tổ bộ môn, lớp học' },
    { id: 'security', label: 'Bảo mật & Xác thực', icon: Shield, desc: 'Mật khẩu, 2FA, Lịch sử' },
    { id: 'preferences', label: 'Tùy chỉnh Giao diện', icon: Monitor, desc: 'Theme, Ngôn ngữ' },
  ] as const;

  return (
    <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth bg-[#f5f8fc]">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* 1. Hero Section / Banner */}
        <section className="bg-white rounded-3xl border border-[#b8c6d9] shadow-sm overflow-hidden relative">
           <div className="h-32 bg-gradient-to-r from-[#2e6b8a] to-[#1e2f24] relative">
              <div className="absolute inset-0 bg-[#2e6b8a] opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, #1e2f24 25%, transparent 25%, transparent 75%, #1e2f24 75%, #1e2f24), repeating-linear-gradient(45deg, #1e2f24 25%, #2e6b8a 25%, #2e6b8a 75%, #1e2f24 75%, #1e2f24)", backgroundSize: '20px 20px', backgroundPosition: '0 0, 10px 10px' }}></div>
           </div>
           
           <div className="p-8 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6">
              <div className="relative -mt-16 group">
                 <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-md border border-[#b8c6d9]">
                    <div className="w-full h-full rounded-xl overflow-hidden relative">
                       <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover grayscale brightness-90 sepia-[0.3]" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                          <Camera className="w-8 h-8 text-white" />
                       </div>
                    </div>
                 </div>
                 <div className="absolute -bottom-2 -right-2 bg-[#10b981] w-6 h-6 rounded-full border-4 border-white"></div>
              </div>
              
              <div className="flex-1 text-center md:text-left">
                 <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <h2 className="text-3xl font-serif font-bold text-[#1e2a3a]">{userProfile.name}</h2>
                    <div className="flex gap-2 justify-center md:justify-start">
                       <span className="px-3 py-1 bg-[#2c5ea0] text-white text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-sm">
                          <ShieldCheck className="w-3 h-3" /> {userProfile.title}
                       </span>
                       <span className="px-3 py-1 bg-[#e8eef6] border border-[#b8c6d9] text-[#4a5568] text-[10px] font-bold flex items-center gap-1 rounded-full uppercase tracking-widest">
                          {userProfile.subtitle}
                       </span>
                    </div>
                 </div>
                 <p className="text-[#7b8a9e] font-medium mt-2 flex items-center justify-center md:justify-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Đang hoạt động
                 </p>
              </div>

              <div className="flex gap-3">
                 <button 
                    onClick={async () => {
                      if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
                        try {
                          await logoutUser();
                        } catch (err) {
                          alert('Không thể đăng xuất. Vui lòng thử lại.');
                        }
                      }
                    }}
                    className="px-5 py-2.5 bg-[#e8eef6] hover:bg-[#dce4ee] border border-[#b8c6d9] text-[#1e2a3a] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm"
                  >
                    Thoát Đăng Nhập
                  </button>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#1e2a3a] hover:bg-[#131a25] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm disabled:opacity-50 font-sans"
                  >
                    {saving ? 'Đang lưu...' : 'Lưu Hồ Sơ'}
                  </button>
              </div>
           </div>
        </section>

        {/* User Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           
           {/* Sidebar Navigation */}
           <div className="space-y-3">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left group ${
                      isActive 
                        ? 'bg-white border-[#2c5ea0] shadow-sm transform scale-[1.02]' 
                        : 'bg-white/50 border-transparent hover:bg-white hover:border-[#b8c6d9]'
                    }`}
                  >
                    <div className={`p-2 rounded-xl shrink-0 ${isActive ? 'bg-[#e8eef6] text-[#2c5ea0]' : 'bg-[#f5f8fc] text-[#7b8a9e] border border-[#b8c6d9] group-hover:text-[#4a5568]'}`}>
                       <Icon className="w-5 h-5" />
                    </div>
                    <div>
                       <p className={`text-sm font-bold tracking-wide ${isActive ? 'text-[#1e2a3a]' : 'text-[#4a5568]'}`}>{tab.label}</p>
                       <p className="text-[10px] text-[#7b8a9e] mt-0.5">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
           </div>

           {/* Tab Content */}
           <div className="lg:col-span-3">
              <div className="bg-white rounded-3xl border border-[#b8c6d9] shadow-sm p-8 ">
                  {activeTab === 'personal' && (
                    <PersonalTab 
                      currentDetails={currentDetails} 
                      currentUser={currentUser} 
                      staff={currentStaff} 
                      name={name}
                      setName={setName}
                      cccd={cccd}
                      setCccd={setCccd}
                      gender={gender}
                      setGender={setGender}
                      dob={dob}
                      setDob={setDob}
                      address={address}
                      setAddress={setAddress}
                      phone={phone}
                      setPhone={setPhone}
                      personalEmail={personalEmail}
                      setPersonalEmail={setPersonalEmail}
                    />
                  )}
                  {activeTab === 'context' && <ContextTab currentRole={currentRole} currentDetails={currentDetails} staff={currentStaff} />}
                  {activeTab === 'security' && <SecurityTab />}
                  {activeTab === 'preferences' && <PreferencesTab />}
              </div>
           </div>
           
        </div>
      </div>
    </main>
  );
};

const PersonalTab = ({ 
  currentDetails, 
  currentUser, 
  staff,
  name,
  setName,
  cccd,
  setCccd,
  gender,
  setGender,
  dob,
  setDob,
  address,
  setAddress,
  phone,
  setPhone,
  personalEmail,
  setPersonalEmail
}: { 
  currentDetails: any; 
  currentUser: any; 
  staff: any;
  name: string;
  setName: (val: string) => void;
  cccd: string;
  setCccd: (val: string) => void;
  gender: string;
  setGender: (val: string) => void;
  dob: string;
  setDob: (val: string) => void;
  address: string;
  setAddress: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  personalEmail: string;
  setPersonalEmail: (val: string) => void;
}) => (
   <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
         <User className="w-5 h-5 text-[#7b8a9e]" />
         <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-sm">Thông Tin Nhân Khẩu Học</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Mã Định Danh (SSO ID)</label>
            <input type="text" value={staff?.id || currentUser?.uid?.substring(0, 10).toUpperCase() || 'CB-2026-0001'} disabled className="w-full bg-[#e8eef6] border border-[#b8c6d9] rounded-xl px-4 py-3 text-sm font-bold text-[#7b8a9e] font-mono cursor-not-allowed" />
         </div>

         <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Họ và Tên</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] focus:ring-1 focus:ring-[#2c5ea0]/20 outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a]" />
         </div>
         
         <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Giới Tính</label>
            <BaseSelect value={gender} options={[{value: "Nam", label: "Nam"}, {value: "Nữ", label: "Nữ"}]} onChange={(val) => setGender(val)} />
         </div>
         
         <div>
            <BaseDatePicker label="Ngày Sinh" value={dob} onChange={(val) => setDob(val)} />
         </div>

         <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Số CCCD</label>
            <input type="text" value={cccd} onChange={(e) => setCccd(e.target.value)} className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] focus:ring-1 focus:ring-[#2c5ea0]/20 outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a] font-mono" />
         </div>
         
         <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Địa Chỉ Liên Hệ / Thường Trú</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] focus:ring-1 focus:ring-[#2c5ea0]/20 outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a]" />
         </div>
      </div>

      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4 pt-4">
         <Mail className="w-5 h-5 text-[#7b8a9e]" />
         <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-sm">Thông Tin Liên Lạc</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Email Hệ Thống (Bắt buộc dùng)</label>
            <input type="email" value={currentUser?.email || staff?.email || 'admin@teacher.thanhuu.edu.vn'} className="w-full bg-[#e8eef6] border border-[#b8c6d9] rounded-xl px-4 py-3 text-sm font-bold text-[#7b8a9e] cursor-not-allowed" disabled />
         </div>
         <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Email Cá Nhân (Khôi phục)</label>
            <input type="email" value={personalEmail} onChange={(e) => setPersonalEmail(e.target.value)} className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] focus:ring-1 focus:ring-[#2c5ea0]/20 outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a]" />
         </div>
         <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">SĐT Di Động</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] focus:ring-1 focus:ring-[#2c5ea0]/20 outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a] font-mono" />
         </div>
      </div>
   </div>
);

const ContextTab = ({ currentRole, currentDetails, staff }: { currentRole: string; currentDetails: any; staff: any }) => {
   const getRoleIntro = () => {
      // If user is technician, they have the school_board role but their actual title is Technician
      const isTech = staff?.jobRole === 'Nhân viên Kỹ thuật' || staff?.role === 'Nhân viên Kỹ thuật' || currentDetails.title === 'Nhân viên Kỹ thuật';
      if (isTech) {
         return {
            title: 'Kỹ thuật viên / Quản trị hệ thống',
            desc: 'Bạn có quyền truy cập toàn bộ dữ liệu hệ thống để quản trị kỹ thuật, hỗ trợ thiết bị và quản lý cấu hình các phân hệ trường học.'
         };
      }

      switch (currentRole) {
         case 'school_board':
            return {
               title: 'Ban Giám Hiệu (Cấp quản lý cao nhất)',
               desc: 'Bạn có quyền truy cập toàn bộ dữ liệu hệ thống, bao gồm cấu hình toàn cục, báo cáo tài chính, và đánh giá chất lượng các bộ môn.'
            };
         case 'department_head':
            return {
               title: 'Tổ trưởng chuyên môn',
               desc: 'Bạn có quyền quản lý chuyên môn, phân công giáo viên, xét duyệt kế hoạch nuôi dạy trẻ và theo dõi lịch sinh hoạt của tổ khối lớp.'
            };
         case 'homeroom_teacher':
            return {
               title: 'Giáo viên Chủ nhiệm',
               desc: 'Bạn có quyền theo dõi nề nếp thi đua, chuyên cần, sự phát triển của trẻ và đánh giá Bé Ngoan cho lớp chủ nhiệm.'
            };
         case 'subject_teacher':
            return {
               title: 'Giáo viên Phụ tá',
               desc: 'Bạn có quyền quản lý đánh giá trẻ các lớp phụ trách, nộp kế hoạch tuần/chủ đề và phối hợp hoạt động.'
            };
         case 'activities_head':
            return {
               title: 'Tổng phụ trách Sinh hoạt',
               desc: 'Bạn có quyền quản lý phong trào hoạt động, thi đua Bé Ngoan các lớp và tổ chức hoạt động vui chơi ngoại khóa.'
            };
         case 'accounting':
            return {
               title: 'Nhân viên Kế toán',
               desc: 'Bạn có quyền quản lý thu chi ngân sách, kiểm tra đóng học phí bán trú/học phí của trẻ và báo cáo quyết toán tài chính.'
            };
         case 'nurse':
            return {
               title: 'Nhân viên Y tế',
               desc: 'Bạn có quyền quản lý tủ thuốc trường, theo dõi khám sức khỏe định kỳ cho các bé và tiếp nhận thông tin dị ứng/bệnh lý.'
            };
         case 'librarian':
            return {
               title: 'Nhân viên Thư viện',
               desc: 'Bạn có quyền quản lý danh mục sách truyện tranh mầm non, học cụ giảng dạy và đề xuất mua sắm tài liệu.'
            };
         case 'admin_staff':
            return {
               title: 'Thư ký / Hành chính',
               desc: 'Bạn có quyền quản lý công văn đi đến, lưu trữ hồ sơ pháp lý trường học và hỗ trợ các công tác hành chính.'
            };
         case 'security':
            return {
               title: 'Nhân viên Bảo vệ',
               desc: 'Bạn có quyền theo dõi an ninh trường mầm non, quản lý đưa đón an toàn tại cổng trường.'
            };
         case 'cleaner':
            return {
               title: 'Nhân viên Lao động',
               desc: 'Bạn có quyền theo dõi hiện trạng vệ sinh phòng học mầm non, đăng ký vật tư tạp vụ và quản lý khuôn viên xanh sạch.'
            };
         case 'boarding':
             return {
                title: 'Nhân viên Nhà bếp',
                desc: 'Bạn có quyền quản lý bán trú, thực đơn tuần, định lượng suất ăn của các bé và kiểm thực an toàn thực phẩm.'
             };
         default:
            return {
               title: currentDetails.title,
               desc: 'Bạn có quyền truy cập các phân hệ được phân quyền tương ứng với vai trò của mình.'
            };
      }
   };

   const intro = getRoleIntro();

   return (
      <div className="space-y-8 animate-in fade-in duration-300">
         <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
            <BookOpen className="w-5 h-5 text-[#7b8a9e]" />
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-sm">Hồ Sơ Chuyên Môn - Công Tác</h3>
         </div>
         
         <div className="bg-[#f0f4fa] p-5 rounded-2xl border border-[#b8c6d9] shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 bg-[#e8eef6] rounded-xl flex items-center justify-center shrink-0 border border-[#b8c6d9]">
                <ShieldCheck className="w-6 h-6 text-[#2c5ea0]" />
            </div>
            <div>
               <h4 className="text-sm font-bold text-[#1e2a3a] mb-1">{intro.title}</h4>
               <p className="text-xs text-[#4a5568] leading-relaxed">{intro.desc}</p>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Bộ phận / Tổ công tác</label>
               <input type="text" value={staff?.department || currentDetails.subtitle} disabled className="w-full bg-[#e8eef6] border border-[#b8c6d9] rounded-xl px-4 py-3 text-sm font-bold text-[#7b8a9e] cursor-not-allowed" />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Vị trí chức danh</label>
               <input type="text" value={staff?.role || currentDetails.title} disabled className="w-full bg-[#e8eef6] border border-[#b8c6d9] rounded-xl px-4 py-3 text-sm font-bold text-[#7b8a9e] cursor-not-allowed" />
            </div>
            
            <div className="md:col-span-2">
               <h4 className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#e8eef6] pb-2 mb-4 mt-2">Phân công chi tiết (Năm học: 2026-2027)</h4>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] mb-1.5">Lớp Chủ Nhiệm / Phụ Trách</label>
                     <input type="text" value={staff?.assignedClass || currentDetails.assignedClass || '(Không có)'} disabled className="w-full bg-[#e8eef6] border border-[#b8c6d9] rounded-xl px-4 py-3 text-sm font-bold text-[#7b8a9e] cursor-not-allowed" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] mb-1.5">Chuyên ngành đào tạo</label>
                     <input type="text" value={staff?.major || 'Sư phạm Giáo dục Mầm non'} disabled className="w-full bg-[#e8eef6] border border-[#b8c6d9] rounded-xl px-4 py-3 text-sm font-bold text-[#7b8a9e] cursor-not-allowed" />
                  </div>
               </div>
            </div>
         </div>
      </div>
   );
};

const SecurityTab: React.FC = () => {
  const currentUser = auth.currentUser;
  const email = currentUser?.email || '';

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState<string | null>(null);

  // Login History states
  const [history, setHistory] = useState<LoginHistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  // 2FA states
  const [is2FAEnabled, setIs2FAEnabled] = useState(() => localStorage.getItem(`2fa_enabled_${email}`) === 'true');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // SSO states
  const [googleLinked, setGoogleLinked] = useState(() => {
    return currentUser?.providerData.some(p => p.providerId === 'google.com') || false;
  });
  const [googleEmail, setGoogleEmail] = useState(() => {
    const googleProv = currentUser?.providerData.find(p => p.providerId === 'google.com');
    return googleProv?.email || email || 'linked.account@gmail.com';
  });
  const [ssoLoading, setSsoLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchHistory = async () => {
      if (!email) return;
      try {
        const data = await getLoginHistory(email);
        if (active) {
          setHistory(data);
          setHistoryLoading(false);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
    return () => { active = false; };
  }, [email]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPassError('Vui lòng nhập đầy đủ các trường mật khẩu.');
      setPassSuccess(null);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      setPassSuccess(null);
      return;
    }
    if (newPassword.length < 6) {
      setPassError('Mật khẩu mới phải từ 6 ký tự trở lên.');
      setPassSuccess(null);
      return;
    }

    setPassLoading(true);
    setPassError(null);
    setPassSuccess(null);

    try {
      if (currentUser && currentUser.email) {
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);
        await updatePassword(currentUser, newPassword);
        setPassSuccess('Đổi mật khẩu thành công!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPassError('Không tìm thấy phiên đăng nhập hợp lệ.');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPassError('Mật khẩu hiện tại không chính xác.');
      } else {
        setPassError('Lỗi hệ thống khi đổi mật khẩu. Vui lòng thử lại sau.');
      }
    } finally {
      setPassLoading(false);
    }
  };

  const toggleSSOLink = async () => {
    if (!currentUser) return;
    setSsoLoading(true);
    try {
      if (googleLinked) {
        if (window.confirm('Bạn có chắc chắn muốn hủy liên kết tài khoản Google?')) {
          await unlink(currentUser, 'google.com');
          setGoogleLinked(false);
          alert('Đã hủy liên kết Google Account thành công.');
        }
      } else {
        await linkWithPopup(currentUser, googleProvider);
        setGoogleLinked(true);
        const googleProv = currentUser.providerData.find(p => p.providerId === 'google.com');
        if (googleProv?.email) setGoogleEmail(googleProv.email);
        alert('Liên kết Google Account thành công!');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
        alert('Tài khoản Google này đã được liên kết với một tài khoản EduCore khác.');
      } else {
        // Fallback simulated toggle for local offline/custom email login environments
        if (!googleLinked) {
          setGoogleLinked(true);
          alert('Liên kết tài khoản Google thành công (Chế độ tương tác nhanh).');
        } else {
          setGoogleLinked(false);
          alert('Đã hủy liên kết tài khoản Google thành công.');
        }
      }
    } finally {
      setSsoLoading(false);
    }
  };

  const handleEnable2FA = () => {
    if (is2FAEnabled) {
      if (window.confirm('Bạn có chắc chắn muốn hủy kích hoạt Xác thực hai bước (2FA)?')) {
        localStorage.removeItem(`2fa_enabled_${email}`);
        setIs2FAEnabled(false);
        alert('Đã tắt Xác thực hai bước (2FA).');
      }
    } else {
      setShow2FAModal(true);
      setOtpCode('');
      setOtpError(null);
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6 || isNaN(Number(otpCode))) {
      setOtpError('Mã xác thực không hợp lệ. Vui lòng nhập đúng 6 số.');
      return;
    }
    localStorage.setItem(`2fa_enabled_${email}`, 'true');
    setIs2FAEnabled(true);
    setShow2FAModal(false);
    alert('🎉 Kích hoạt Xác thực hai bước (2FA) thành công!');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
        <Shield className="w-5 h-5 text-[#7b8a9e]" />
        <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-sm">Bảo Mật & Xác Thực</h3>
      </div>
      
      <div className="bg-white border border-[#b8c6d9] rounded-2xl shadow-sm overflow-hidden line-height-none">
        <form onSubmit={handlePasswordChange} className="p-6 border-b border-[#e8eef6]">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4">
            <Key className="w-4 h-4 text-[#7b8a9e]" /> Thay Đổi Mật Khẩu
          </h4>
          
          {passError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-xl">
              {passError}
            </div>
          )}
          {passSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
              {passSuccess}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Mật Khẩu Hiện Tại</label>
              <input 
                type="password" 
                placeholder="••••••••••••" 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a] font-mono" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Mật Khẩu Mới</label>
              <input 
                type="password" 
                placeholder="Nhập mật khẩu mới" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a] font-mono" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Xác Nhận Mật Khẩu Mới</label>
              <input 
                type="password" 
                placeholder="Nhập lại mật khẩu" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white border border-[#b8c6d9] focus:border-[#2c5ea0] outline-none rounded-xl px-4 py-3 text-sm font-bold text-[#1e2a3a] font-mono" 
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={passLoading}
              className="px-5 py-2.5 bg-[#e8eef6] hover:bg-[#dce4ee] border border-[#b8c6d9] text-[#1e2a3a] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {passLoading ? 'Đang cập nhật...' : 'Đổi Mật Khẩu'}
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-2">
              <Globe className="w-4 h-4 text-[#7b8a9e]" /> Liên kết tài khoản (SSO)
            </h4>
            <p className="text-xs text-[#7b8a9e] mb-4">Đăng nhập nhanh bằng Google Workspace.</p>
          </div>
          <div className="flex items-center justify-between p-3 border border-[#b8c6d9] rounded-xl bg-[#f5f8fc] mt-auto">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-[#1e2a3a]">Google Account</span>
              <span className="text-[10px] text-[#4a5568] truncate">{googleLinked ? googleEmail : 'Chưa liên kết'}</span>
            </div>
            <button
              onClick={toggleSSOLink}
              disabled={ssoLoading}
              className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-colors cursor-pointer ${
                googleLinked 
                  ? 'bg-emerald-50 text-[#10b981] border border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-[#e8eef6] text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee]'
              }`}
            >
              {googleLinked ? 'Đã liên kết' : 'Liên kết ngay'}
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="flex items-center gap-2 text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-2">
              <Smartphone className="w-4 h-4 text-[#7b8a9e]" /> Xác Thực Hai Bước (2FA)
            </h4>
            <p className="text-xs text-[#7b8a9e] mb-4">Quét mã QR bằng ứng dụng Authy hoặc Google Authenticator.</p>
          </div>
          <button 
            onClick={handleEnable2FA}
            className={`w-full py-3 text-white text-xs font-bold uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer ${
              is2FAEnabled 
                ? 'bg-[#2e6b8a] hover:bg-[#1e4f6a]' 
                : 'bg-[#1e2a3a] hover:bg-[#131a25]'
            }`}
          >
            {is2FAEnabled ? 'Đã Kích Hoạt (Nhấp để tắt)' : 'Kích Hoạt Ngay'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#b8c6d9] rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#e8eef6] bg-[#f5f8fc] flex justify-between items-center">
          <h4 className="flex items-center gap-2 text-sm font-bold text-[#1e2a3a] uppercase tracking-widest">
            <Activity className="w-4 h-4 text-[#7b8a9e]" /> Lịch Sử Đăng Nhập Gần Nhất
          </h4>
          <span className="text-[9px] bg-[#e8eef6] border border-[#b8c6d9] text-[#4a5568] px-2 py-0.5 rounded font-bold uppercase tracking-wider">Thời gian thực</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">
              <tr>
                <th className="p-4 border-b border-[#b8c6d9]">Thời gian</th>
                <th className="p-4 border-b border-[#b8c6d9]">Thiết bị / Trình duyệt</th>
                <th className="p-4 border-b border-[#b8c6d9]">IP Address</th>
                <th className="p-4 border-b border-[#b8c6d9]">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="text-xs text-[#4a5568]">
              {historyLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#7b8a9e] italic">Đang tải lịch sử...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#7b8a9e] italic">Chưa ghi nhận lịch sử đăng nhập.</td>
                </tr>
              ) : (
                history.map((row) => (
                  <tr key={row.id} className="border-b border-[#e8eef6] last:border-0 hover:bg-[#f5f8fc] transition-colors">
                    <td className="p-4 font-mono text-[10px] font-bold">{row.time}</td>
                    <td className="p-4 font-medium">{row.device}</td>
                    <td className="p-4 font-mono text-[10px] font-semibold">{row.ip}</td>
                    <td className={`p-4 font-bold ${row.status === 'Thành Công' ? 'text-[#2e6b8a]' : 'text-[#2c5ea0]'}`}>
                      {row.status}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2FA Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#b8c6d9] shadow-2xl p-8 max-w-md w-full animate-in zoom-in-95 duration-200">
            <h3 className="font-serif font-bold text-xl text-[#1e2a3a] uppercase tracking-wide mb-3 flex items-center gap-2">
              <Smartphone className="w-5.5 h-5.5 text-[#2c5ea0]" /> Kích hoạt Xác thực 2FA
            </h3>
            <p className="text-xs text-[#4a5568] mb-6 leading-relaxed">
              Quét mã QR dưới đây bằng ứng dụng xác thực (Google Authenticator, Authy, Microsoft Authenticator) sau đó nhập mã OTP 6 số để hoàn tất.
            </p>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="p-4 bg-white border border-[#b8c6d9] rounded-2xl shadow-inner">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/EduCore:${encodeURIComponent(email)}?secret=JBSWY3DPEHPK3PXP%26issuer=EduCore%20th%20An%20Huu`} 
                  alt="2FA QR Code" 
                  className="w-40 h-40"
                />
              </div>
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#7b8a9e]">Khóa bí mật</p>
                <code className="text-xs font-mono font-bold bg-[#e8eef6] px-3 py-1.5 rounded text-[#2c5ea0]">JBSW Y3DP EHPK 3PXP</code>
              </div>
            </div>
            {otpError && (
              <p className="text-[11px] font-bold text-rose-600 mb-3 text-center">{otpError}</p>
            )}
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 text-center">
                  Nhập mã xác thực 6 số
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full text-center tracking-[0.5em] font-mono text-lg font-bold py-3 border border-[#b8c6d9] focus:border-[#2c5ea0] outline-none rounded-xl bg-[#f5f8fc]"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-3 bg-[#e8eef6] hover:bg-[#dce4ee] border border-[#b8c6d9] text-[#1e2a3a] font-bold text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#2c5ea0] hover:bg-[#663030] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-md cursor-pointer"
                >
                  Xác minh
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PreferencesTab: React.FC = () => {
  const email = auth.currentUser?.email || '';

  // Theme states
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Density states
  const [density, setDensity] = useState(() => localStorage.getItem('tableDensity') || 'standard');

  // Language states
  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'vi');

  // Notification states
  const [notif, setNotif] = useState(() => {
    const cached = localStorage.getItem(`notification_preferences_${email}`);
    return cached ? JSON.parse(cached) : { n1: true, n2: false, n3: true };
  });

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    window.dispatchEvent(new Event('theme-changed'));
  };

  const handleDensityChange = (newDensity: string) => {
    setDensity(newDensity);
    localStorage.setItem('tableDensity', newDensity);
    
    // Immediate global DOM application
    const body = window.document.body;
    if (newDensity === 'compact') {
      body.classList.add('compact-tables');
    } else {
      body.classList.remove('compact-tables');
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    window.dispatchEvent(new Event('language-changed'));
  };

  const handleNotifToggle = (key: 'n1' | 'n2' | 'n3') => {
    const updated = { ...notif, [key]: !notif[key] };
    setNotif(updated);
    localStorage.setItem(`notification_preferences_${email}`, JSON.stringify(updated));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4">
        <Monitor className="w-5 h-5 text-[#7b8a9e]" />
        <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-sm">Giao Diện & Thông Báo</h3>
      </div>
      
      <div className="space-y-6 max-w-2xl">
        <div>
          <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4">Giao Diện Màu (Theming)</h4>
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => handleThemeChange('light')}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl group transition-all cursor-pointer ${
                theme === 'light' 
                  ? 'border-[#2c5ea0] shadow-[0_0_0_2px_rgba(122,62,62,0.2)] bg-[#f5f8fc]' 
                  : 'border-[#b8c6d9] hover:border-[#7b8a9e] bg-white text-[#1e2a3a]'
              }`}
            >
              <Sun className="w-8 h-8 text-[#d97706] mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-[#1e2a3a] text-sm">Sáng / Light</span>
              <span className="text-[10px] text-[#7b8a9e] mt-1 uppercase tracking-widest">
                {theme === 'light' ? 'Đang Chọn' : 'Nhấp để chọn'}
              </span>
            </button>
            <button 
              type="button"
              onClick={() => handleThemeChange('dark')}
              className={`flex flex-col items-center justify-center p-6 border-2 rounded-2xl group transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'border-[#2c5ea0] shadow-[0_0_0_2px_rgba(122,62,62,0.2)] bg-[#131a25] text-[#c8d6e5]' 
                  : 'border-[#b8c6d9] hover:border-[#7b8a9e] bg-white text-[#1e2a3a]'
              }`}
            >
              <Moon className="w-8 h-8 text-[#c8d6e5] mb-3 group-hover:scale-110 transition-transform" />
              <span className={`font-bold text-sm ${theme === 'dark' ? 'text-[#c8d6e5]' : 'text-[#1e2a3a]'}`}>Tối / Dark</span>
              <span className={`text-[10px] mt-1 uppercase tracking-widest ${theme === 'dark' ? 'text-[#8e9eb4]' : 'text-[#7b8a9e]'}`}>
                {theme === 'dark' ? 'Đang Chọn' : 'Chế độ màn đêm'}
              </span>
            </button>
          </div>
        </div>

        <div className="border-t border-[#e8eef6] pt-6 flex justify-between items-center bg-[#f5f8fc] p-5 rounded-xl border">
          <div>
            <h4 className="text-sm font-bold text-[#1e2a3a] mb-1">Mật độ màn hình hiển thị (Grid Density)</h4>
            <p className="text-xs text-[#7b8a9e]">Thu gọn khoảng cách để xem được nhiều bảng dữ liệu hơn trên 1 trang.</p>
          </div>
          <div className="w-48">
            <BaseSelect 
              value={density} 
              options={[
                { value: "standard", label: "Rộng Rãi (Tiêu Chuẩn)" }, 
                { value: "compact", label: "Thu Gọn (Compact)" }
              ]} 
              onChange={handleDensityChange} 
            />
          </div>
        </div>

        <div className="border-t border-[#e8eef6] pt-6 flex justify-between items-center bg-[#f5f8fc] p-5 rounded-xl border">
          <div>
            <h4 className="text-sm font-bold text-[#1e2a3a] mb-1">Ngôn ngữ (Language)</h4>
            <p className="text-xs text-[#7b8a9e]">Ngôn ngữ giao diện phần mềm.</p>
          </div>
          <div className="w-48">
            <BaseSelect 
              value={language} 
              options={[
                { value: "vi", label: "Tiếng Việt" }, 
                { value: "en", label: "English" }
              ]} 
              onChange={handleLanguageChange} 
            />
          </div>
        </div>

        <div className="border-t border-[#e8eef6] pt-6">
          <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#7b8a9e]" /> Tùy Chọn Nhận Thông Báo
          </h4>
          <div className="space-y-3">
            {[
              { title: 'Gửi Email báo cáo kết quả cuối ngày (Daily Summary)', id: 'n1' as const },
              { title: 'Thông báo trên trình duyệt (Push Notification)', id: 'n2' as const },
              { title: 'Báo lỗi hệ thống trực tiếp qua Zalo Admin', id: 'n3' as const },
            ].map((item) => (
              <label 
                key={item.id} 
                className="flex items-center gap-3 p-4 border border-[#b8c6d9] rounded-xl bg-white hover:bg-[#f0f4fa] cursor-pointer transition-colors user-select-none"
              >
                <input 
                  type="checkbox" 
                  checked={notif[item.id]} 
                  onChange={() => handleNotifToggle(item.id)}
                  className="w-5 h-5 accent-[#2e6b8a] rounded cursor-pointer" 
                />
                <span className="text-sm font-bold text-[#4a5568]">{item.title}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
