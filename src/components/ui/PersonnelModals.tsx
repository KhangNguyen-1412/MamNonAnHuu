import React, { useState, useEffect } from 'react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { User, FileText, CheckCircle2, Shield, Clock, BookOpen, Home, ArrowRight, Award, Plus, Upload, Link, AlertTriangle, FileSpreadsheet, AlertCircle, Sparkles } from 'lucide-react';
import { ModalBase } from './Modals';
import { getDepartments, Department, getSubjects, Subject, syncAllStaffRoles, getClasses, ClassData } from '../../services/dbService';
import { createStaff, getStaffList, checkRoleQuota, Staff, StaffEvaluation } from '../../services/hrService';

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

/* --- 1. STAFF PROFILE MODAL (Hồ sơ Nhân sự) --- */
export const StaffProfileModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [id, setId] = useState(() => 'CB' + Math.floor(1000 + Math.random() * 9000));
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('Nam');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cccd, setCccd] = useState('');
  
  // Extended States
  const [partyJoinDateReserved, setPartyJoinDateReserved] = useState('');
  const [partyJoinDateOfficial, setPartyJoinDateOfficial] = useState('');
  const [politicalTheory, setPoliticalTheory] = useState('Không');
  const [contractType, setContractType] = useState('Biên chế (Viên chức)');
  const [workStatus, setWorkStatus] = useState('Đang công tác');
  const [professionalTitle, setProfessionalTitle] = useState('Giáo viên Mầm non hạng III (Mã V.07.05.15)');
  const [salaryGrade, setSalaryGrade] = useState('Bậc 1');
  const [salaryFactor, setSalaryFactor] = useState('2.34');
  const [seniorityAllowance, setSeniorityAllowance] = useState('');
  const [preferentialAllowance, setPreferentialAllowance] = useState('30');
  
  // Cascading choices
  const [jobRole, setJobRole] = useState('Giáo viên bộ môn'); // Job Role
  const [jobTitle, setJobTitle] = useState('Giáo viên bộ môn'); // Job Title
  const [assignedClass, setAssignedClass] = useState('Không phân công'); // Homeroom class
  const [department, setDepartment] = useState('');
  const [mainSubject, setMainSubject] = useState('');
  const [major, setMajor] = useState('Sư phạm Giáo dục Mầm non');
  const [educationLevel, setEducationLevel] = useState('Cử nhân / Đại học');

  // Database list
  const [departments, setDepartments] = useState<Department[]>([]);
  const [currentStaffs, setCurrentStaffs] = useState<Staff[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [classesList, setClassesList] = useState<ClassData[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setId('CB' + Math.floor(1000 + Math.random() * 9000));
      setFullName('');
      setGender('Nữ');
      setBirthDate('');
      setPhone('');
      setAddress('');
      setCccd('');
      setPartyJoinDateReserved('');
      setPartyJoinDateOfficial('');
      setPoliticalTheory('Không');
      setContractType('Biên chế (Viên chức)');
      setWorkStatus('Đang công tác');
      setProfessionalTitle('Giáo viên Mầm non hạng III (Mã V.07.05.15)');
      setSalaryGrade('Bậc 1');
      setSalaryFactor('2.34');
      setSeniorityAllowance('');
      setPreferentialAllowance('30');
      setJobRole('Giáo viên bộ môn');
      setJobTitle('Giáo viên bộ môn');
      setAssignedClass('Không phân công');
      setDepartment('');
      setMainSubject('Toán học');
      setMajor('Sư phạm Giáo dục Mầm non');
      setEducationLevel('Cử nhân / Đại học');
      setEmailStrategy('standard');
      setIsEmailCustomized(false);
      setCustomEmailPrefix('');
      
      getDepartments().then(setDepartments).catch(() => {});
      getStaffList().then(setCurrentStaffs).catch(() => {});
      getSubjects().then(setSubjectsList).catch(() => {});
      getClasses().then(setClassesList).catch(() => {});
    }
  }, [isOpen]);

  // Roles that are non-teaching (hide assignment block)
  const NON_TEACHING_ROLES = [
    'Nhân viên Kế toán',
    'Nhân viên Y tế',
    'Nhân viên Thư viện',
    'Nhân viên Thư ký / Hành chính',
    'Nhân viên Bảo vệ',
    'Nhân viên Lao công',
    'Nhân viên Kỹ thuật',
    'Nhân viên Nhà bếp'
  ];
  const isNonTeachingRole = NON_TEACHING_ROLES.includes(jobRole);

  // Email strategy states
  const [emailStrategy, setEmailStrategy] = useState<'standard' | 'birthyear'>('standard');
  const [isEmailCustomized, setIsEmailCustomized] = useState(false);
  const [customEmailPrefix, setCustomEmailPrefix] = useState('');

  // Collision Mock database
  const COLLISION_DATABASE = [
    'hoangnn',
    'namnv',
    'linhtm',
    'tranthib',
    'phongpv',
    'vietdq'
  ];

  // Accent and space remover helper
  const removeDiacritics = (str: string) => {
    return str
      .normalize('NFD') // Normal Form Decomposition (splits accents into separate combining characters)
      .replace(/[\u0300-\u036f]/g, '') // strip combining character marks
      .replace(/[đĐ]/g, 'd')
      .toLowerCase();
  };

  // Email Prefix calculator
  const getRawEmailPrefix = () => {
    if (!fullName) return '';
    const clean = removeDiacritics(fullName).trim();
    if (!clean) return '';
    const parts = clean.split(/\s+/);
    if (parts.length === 0) return '';
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, parts.length - 1).map(p => p[0] || '').join('');
    return `${lastName}${initials}`;
  };

  const getEmailDomain = () => {
    switch (jobRole) {
      case 'Cán bộ Quản lý (BGH)':
      case 'Giáo viên bộ môn':
        return '@teacher.mnah.edu.vn';
      case 'Nhân viên Kế toán':
        return '@account.thah.edu.vn';
      case 'Nhân viên Y tế':
        return '@nurse.thah.edu.vn';
      case 'Nhân viên Thư viện':
        return '@library.thah.edu.vn';
      case 'Nhân viên Thư ký / Hành chính':
        return '@secretary.thah.edu.vn';
      case 'Nhân viên Kỹ thuật':
        return '@admin.mnah.edu.vn';
      case 'Nhân viên Bảo vệ':
        return '@secure.thah.edu.vn';
      case 'Nhân viên Lao công':
        return '@clean.thah.edu.vn';
      case 'Nhân viên Nhà bếp':
        return '@boarding.thah.edu.vn';
      default:
        return '@school.edu.vn';
    }
  };

  // Multi-strategy Email generation and collision warning
  const getComputedEmailPrefix = () => {
    if (isEmailCustomized) return customEmailPrefix;
    const raw = getRawEmailPrefix();
    if (!raw) return '';

    const hasCollision = COLLISION_DATABASE.includes(raw);
    if (!hasCollision) return raw;

    if (emailStrategy === 'birthyear' && birthDate) {
      // Suffix with last 2 digits of birth year
      const birthYear = birthDate.substring(0, 4);
      if (birthYear && birthYear.length === 4) {
        const lastTwoDigits = birthYear.substring(2, 4);
        return `${raw}${lastTwoDigits}`;
      }
    }
    
    // Default / standard suffix: append '1' (or next available integer suffix)
    return `${raw}1`;
  };

  const getFullEmailAddress = () => {
    const prefix = getComputedEmailPrefix();
    if (!prefix) return '';
    return `${prefix}${getEmailDomain()}`;
  };

  // Determine cascading job titles
  const getJobTitlesForRole = () => {
    switch (jobRole) {
      case 'Cán bộ Quản lý (BGH)':
        return ['Hiệu trưởng', 'Phó Hiệu trưởng', 'Tổng phụ trách Đội/Đoàn'];
      case 'Giáo viên bộ môn':
        return ['Giáo viên bộ môn', 'Tổ trưởng chuyên môn', 'Tổ phó chuyên môn'];
      case 'Nhân viên Kế toán':
        return ['Kế toán trưởng', 'Kế toán viên'];
      case 'Nhân viên Y tế':
        return ['Y tế học đường'];
      case 'Nhân viên Thư viện':
        return ['Cán bộ Thư viện'];
      case 'Nhân viên Thư ký / Hành chính':
        return ['Thư ký hội đồng', 'Văn thư chuyên trách'];
      case 'Nhân viên Kỹ thuật':
        return ['Kỹ thuật viên CNTT', 'Nhân viên thiết bị/thí nghiệm', 'Quản trị hệ thống'];
      case 'Nhân viên Bảo vệ':
        return ['Tổ trưởng bảo vệ', 'Nhân viên bảo vệ'];
      case 'Nhân viên Lao công':
        return ['Nhân viên tạp vụ'];
      case 'Nhân viên Nhà bếp':
        return ['Bếp trưởng', 'Bếp phó', 'Bếp viên'];
      default:
        return ['Nhân viên thường'];
    }
  };

  // Handle cascading dropdown assignment & constraints
  const handleJobRoleChange = (role: string) => {
    setJobRole(role);
    // Auto reset title to first item of new array
    const titles = (() => {
      switch (role) {
        case 'Cán bộ Quản lý (BGH)': return 'Hiệu trưởng';
        case 'Giáo viên bộ môn': return 'Giáo viên bộ môn';
        case 'Nhân viên Kế toán': return 'Kế toán trưởng';
        case 'Nhân viên Y tế': return 'Y tế học đường';
        case 'Nhân viên Kỹ thuật': return 'Kỹ thuật viên CNTT';
        case 'Nhân viên Nhà bếp': return 'Bếp trưởng';
        default: return 'Nhân viên thường';
      }
    })();
    setJobTitle(titles);

    // Dynamic education level defaulting
    const CORE_ROLES = [
      'Giáo viên bộ môn',
      'Cán bộ Quản lý (BGH)',
      'Nhân viên Thư viện',
      'Nhân viên Thư ký / Hành chính'
    ];
    if (!CORE_ROLES.includes(role)) {
      setEducationLevel('Không');
    } else {
      setEducationLevel('Cử nhân / Đại học');
    }
  };

  // Check homeroom disabled condition
  const isHomeroomDisabled = 
    !(jobTitle === 'Giáo viên bộ môn' || jobTitle === 'Tổ phó chuyên môn');

  const handleSave = async () => {
    if (!fullName) {
      alert("Họ & tên cán bộ không được để trống!");
      return;
    }
    if (!cccd) {
      alert("Số CCCD không được để trống!");
      return;
    }
    if (!phone) {
      alert("Số điện thoại không được để trống!");
      return;
    }

    // Check BGH / Staff limits
    const quotaError = checkRoleQuota(jobTitle, currentStaffs);
    if (quotaError) {
      alert(`⚠️ Hạn mức nhân sự vượt giới hạn:\n${quotaError}`);
      return;
    }

    // Map workStatus to system status
    let mappedStatus: 'Đang Công Tác' | 'Nghỉ Phép' | 'Bình Chỉ / Khóa' = 'Đang Công Tác';
    if (workStatus === 'Nghỉ chế độ / Thai sản' || workStatus === 'Làm việc bán thời gian') {
      mappedStatus = 'Nghỉ Phép';
    } else if (workStatus === 'Đã thuyên chuyển / Nghỉ việc') {
      mappedStatus = 'Bình Chỉ / Khóa';
    }

    const isTeachingOrBgh = jobRole === 'Giáo viên bộ môn' || jobRole === 'Cán bộ Quản lý (BGH)';
    const newStaff: Staff = {
      id,
      name: fullName,
      dob: birthDate,
      gender,
      role: jobTitle,
      department: isNonTeachingRole ? 'Hành Chính' : (department || 'Chưa phân công'),
      phone,
      email: getFullEmailAddress(),
      status: mappedStatus,
      cccd,
      address,
      partyJoinDateReserved,
      partyJoinDateOfficial,
      politicalTheory,
      educationLevel,
      major: isTeachingOrBgh ? major : '',
      jobRole,
      contractType,
      workStatus,
      professionalTitle,
      salaryGrade,
      salaryFactor: Number(salaryFactor) || 2.34,
      seniorityAllowance: Number(seniorityAllowance) || 0,
      preferentialAllowance: Number(preferentialAllowance) || 0,
      assignedClass: isNonTeachingRole ? 'Không phân công' : assignedClass
    };

    try {
      await createStaff(newStaff);
      await syncAllStaffRoles();
      alert(`🎉 Ban hành hồ sơ cán bộ ${fullName} thành công!`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Lỗi: Không thể lưu hồ sơ cán bộ lên Firestore.");
    }
  };

  const subjectsArray = mainSubject.split(',').map(s => s.trim()).filter(Boolean);
  const primarySubject = subjectsArray[0] || '';
  const additionalSubjects = subjectsArray.slice(1);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Cán Bộ & Giáo Viên - Mầm non An Hữu" subtitle="Hệ thống tự động hóa hồ sơ pháp lý & Cấp phát tài khoản công vụ" width="max-w-4xl" fixedHeight>
      <div className="bg-[#e8eef6] px-8 py-4 border-b border-[#b8c6d9] flex items-center justify-between shrink-0 overflow-x-auto">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#2c5ea0] text-white shadow-inner md:scale-110 transition-transform' : 'bg-[#dce4ee] text-[#7b8a9e]'}`}>
                {s}
             </div>
             {s < 3 && <div className={`w-12 md:w-32 h-1 mx-2 rounded ${step > s ? 'bg-[#2c5ea0]' : 'bg-[#dce4ee]'}`}></div>}
          </div>
        ))}
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#2c5ea0] ml-4 whitespace-nowrap">
          {step === 1 ? '1. Cá Nhân & Hành Chính' : step === 2 ? '2. Chuyên Môn & Chức Vụ' : '3. Hợp Đồng & Lương'}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><User className="w-4 h-4 mr-2" /> Hồ Sơ & Lý Lịch Cá Nhân</h4>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã Cán Bộ (Nội Bộ) *</label>
                  <input type="text" className="w-full px-4 py-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#2c5ea0] uppercase font-mono shadow-inner" value={id} readOnly />
               </div>
               <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số Hiệu Viên Chức (Bộ GD&ĐT) *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                    placeholder="Mã định danh PMIS quốc gia..." 
                    value={id}
                    onChange={(e) => setId(e.target.value.toUpperCase())}
                    required
                  />
               </div>
               
               <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ & Tên cán bộ *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0] uppercase" 
                    placeholder="VD: Nguyễn Nhật Hoàng"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
               </div>
               <div>
                  <BaseSelect
                    label="Giới Tính"
                    required
                    value={gender}
                    options={[{value: 'Nam', label: 'Nam'}, {value: 'Nữ', label: 'Nữ'}]}
                    onChange={(val) => setGender(val)}
                  />
               </div>
               <div>
                  <BaseDatePicker
                    label="Ngày Sinh"
                    required
                    value={birthDate}
                    onChange={(val) => setBirthDate(val)}
                  />
               </div>
               <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số CCCD / CMND *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="Số căn cước công dân..."
                    value={cccd}
                    onChange={(e) => setCccd(e.target.value)}
                  />
               </div>
               <div className="lg:col-span-3">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Địa Chỉ Thường Trú</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
               </div>
               <div className="lg:col-span-1">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số Điện Thoại Di Động *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="VD: 0912..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
               </div>

               <div className="lg:col-span-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="block text-[10px] font-bold text-[#2e6b8a] uppercase tracking-widest">
                       Email Công Vụ Cấp Phát (Tự Động)
                    </label>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsEmailCustomized(!isEmailCustomized);
                        if (!isEmailCustomized) setCustomEmailPrefix(getComputedEmailPrefix());
                      }}
                      className="text-[10px] font-bold text-[#2c5ea0] underline hover:text-[#4a5568] flex items-center"
                    >
                      {isEmailCustomized ? '[Hủy tùy chỉnh]' : '[✍️ Sửa thủ công]'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                     {isEmailCustomized ? (
                       <input 
                         type="text" 
                         className="px-4 py-3 bg-white border-2 border-amber-300 rounded-xl text-sm font-mono font-bold text-amber-800 focus:ring-2 focus:ring-[#2c5ea0]"
                         value={customEmailPrefix}
                         onChange={(e) => setCustomEmailPrefix(e.target.value)}
                       />
                     ) : (
                       <input 
                         type="text" 
                         className="w-full px-4 py-3 bg-[#f5fbf7] border border-[#166534]/30 rounded-xl text-sm font-mono font-bold text-[#166534] shadow-inner" 
                         value={getComputedEmailPrefix()} 
                         readOnly 
                       />
                     )}
                     <span className="px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-mono font-bold text-[#4a5568] shrink-0">
                       {getEmailDomain()}
                     </span>
                  </div>
               </div>

               <div className="lg:col-span-3">
                 {/* Realtime Collision Preview block */}
                 {fullName && (
                   <div className="p-4 bg-white border border-[#b8c6d9] rounded-2xl shadow-sm space-y-3">
                      <div className="flex items-center gap-2">
                         <span className="w-2.5 h-2.5 rounded-full bg-[#166534] animate-pulse"></span>
                         <span className="text-[11px] font-bold text-[#1e2a3a] uppercase tracking-wider">
                           Bộ Đề Xuất & Phòng Tránh Trùng Email (Real-time Preview)
                         </span>
                      </div>
                      
                      <div className="text-xs text-[#4a5568] space-y-2">
                         <p>Tên không dấu gốc: <code className="bg-[#e8eef6] px-1 py-0.5 rounded font-bold font-mono">{getRawEmailPrefix() || '(Trống)'}</code></p>
                         
                         {COLLISION_DATABASE.includes(getRawEmailPrefix()) ? (
                           <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg space-y-2">
                              <p className="font-bold flex items-center gap-1">
                                ⚠️ Trùng địa chỉ trùng lắp! <code className="font-mono bg-amber-100 px-1 rounded">{getRawEmailPrefix()}{getEmailDomain()}</code> đã được sử dụng.
                              </p>
                              <div>
                                <span className="block text-[10px] uppercase font-bold text-amber-800">Chọn giải pháp khắc phục tự động:</span>
                                <div className="mt-1 flex items-center gap-4">
                                  <label className="inline-flex items-center gap-1 cursor-pointer font-bold">
                                    <input 
                                      type="radio" 
                                      name="emailStrategy" 
                                      checked={emailStrategy === 'standard'} 
                                      onChange={() => setEmailStrategy('standard')} 
                                    />
                                    Hậu tố tịnh tiến (+1): <code className="font-mono bg-white px-1.5 py-0.5 rounded">{getRawEmailPrefix()}1</code>
                                  </label>
                                  <label className="inline-flex items-center gap-1 cursor-pointer font-bold">
                                    <input 
                                      type="radio" 
                                      name="emailStrategy" 
                                      checked={emailStrategy === 'birthyear'} 
                                      onChange={() => setEmailStrategy('birthyear')} 
                                    />
                                    Hậu tố năm sinh: {birthDate ? <code className="font-mono bg-white px-1.5 py-0.5 rounded">{getRawEmailPrefix()}{birthDate.substring(2, 4)}</code> : <span className="italic text-[#2c5ea0]">(Yêu cầu nhập ngày sinh)</span>}
                                  </label>
                                </div>
                              </div>
                           </div>
                         ) : (
                           <p className="text-green-700 bg-green-50 p-2 rounded-lg font-bold">
                             ✓ Hộp thư công vụ khả dụng! Không phát hiện trùng lắp dữ liệu.
                           </p>
                         )}
                      </div>
                   </div>
                 )}
               </div>
            </div>

            <div className="bg-[#f0f4fa] p-5 border border-[#b8c6d9] rounded-2xl shadow-sm space-y-4">
               <div>
                  <label className="block text-xs font-bold text-[#2c5ea0] uppercase tracking-widest mb-4">Thông Tin Đảng & Đoàn Thể</label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                     <div>
                        <BaseDatePicker label="Ngày vào Đảng (Dự bị)" value={partyJoinDateReserved} onChange={setPartyJoinDateReserved} />
                     </div>
                     <div>
                        <BaseDatePicker label="Ngày vào Đảng (Chính thức)" value={partyJoinDateOfficial} onChange={setPartyJoinDateOfficial} />
                     </div>
                     <div>
                        <BaseSelect
                          label="Trình độ LL Chính Trị"
                          value={politicalTheory}
                          options={[{value: 'Không', label: 'Không'}, {value: 'Sơ cấp', label: 'Sơ cấp'}, {value: 'Trung cấp', label: 'Trung cấp'}, {value: 'Cao cấp', label: 'Cao cấp'}]}
                          onChange={setPoliticalTheory}
                        />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><BookOpen className="w-4 h-4 mr-2" /> Trình Độ & Vị Trí Việc Làm</h4>
            
            <div className="grid grid-cols-2 gap-6 font-sans">
               <div className="col-span-2 md:col-span-1">
                  <BaseSelect
                    label="Trình Độ Đào Tạo Cao Nhất"
                    required={[
                      'Giáo viên bộ môn',
                      'Cán bộ Quản lý (BGH)',
                      'Nhân viên Thư viện',
                      'Nhân viên Thư ký / Hành chính'
                    ].includes(jobRole)}
                    value={educationLevel}
                    options={[
                      {value: 'Cử nhân / Đại học', label: 'Cử nhân / Đại học'},
                      {value: 'Thạc sĩ', label: 'Thạc sĩ'},
                      {value: 'Tiến sĩ', label: 'Tiến sĩ'},
                      {value: 'Cao đẳng', label: 'Cao đẳng'},
                      {value: 'Không', label: 'Không'}
                    ]}
                    onChange={(val) => setEducationLevel(val)}
                  />
                </div>
                {(jobRole === 'Giáo viên bộ môn' || jobRole === 'Cán bộ Quản lý (BGH)') && (
                  <div className="col-span-2 md:col-span-1">
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Chuyên Ngành Đào Tạo Chính *</label>
                     <input 
                       type="text" 
                       className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                       value={major} 
                       onChange={(e) => setMajor(e.target.value)}
                     />
                  </div>
                )}

                {/* Dropdown 1: Vị trí việc làm */}
                <div className="col-span-2 md:col-span-1">
                  <BaseSelect
                    label="Vị Trí Việc Làm"
                    required
                    value={jobRole}
                    options={[
                      {value: 'Giáo viên bộ môn', label: 'Giáo viên bộ môn'},
                      {value: 'Cán bộ Quản lý (BGH)', label: 'Cán bộ Quản lý (BGH)'},
                      {value: 'Nhân viên Kế toán', label: 'Nhân viên Kế toán (Kế toán, Hậu cần)'},
                      {value: 'Nhân viên Y tế', label: 'Nhân viên Y tế'},
                      {value: 'Nhân viên Thư viện', label: 'Nhân viên Thư viện'},
                      {value: 'Nhân viên Thư ký / Hành chính', label: 'Nhân viên Thư ký / Hành chính'},
                      {value: 'Nhân viên Kỹ thuật', label: 'Nhân viên Kỹ thuật (Công nghệ, Thiết bị)'},
                      {value: 'Nhân viên Bảo vệ', label: 'Nhân viên Bảo vệ'},
                      {value: 'Nhân viên Lao công', label: 'Nhân viên Lao công'},
                      {value: 'Nhân viên Nhà bếp', label: 'Nhân viên Nhà bếp'}
                    ]}
                    onChange={(val) => handleJobRoleChange(val)}
                  />
                </div>

                {/* Dropdown 2: Chức vụ hiện tại (Cascading) */}
                <div className="col-span-2 md:col-span-1">
                  <BaseSelect
                    label="Chức vụ / Chức danh hiện tại"
                    required
                    value={jobTitle}
                    options={getJobTitlesForRole().map(t => ({value: t, label: t}))}
                    onChange={(val) => setJobTitle(val)}
                  />
                </div>

                {/* Dynamic Homeroom block - only for teaching roles */}
                {!isNonTeachingRole && (
                <div className="col-span-2">
                   <div className="bg-[#f0f4fa] p-5 border border-[#b8c6d9] rounded-2xl shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                         <div>
                           <label className="block text-xs font-bold text-[#2c5ea0] uppercase tracking-widest mb-1">Cấu hình phân công Chủ nhiệm &amp; Tổ khối</label>
                           <p className="text-[10px] text-[#4a5568]">Rà soát phòng chống kiêm nhiệm theo quy định của trường.</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          {isHomeroomDisabled ? (
                            <div className="space-y-2">
                              <BaseSelect
                                label="Đảm nhiệm Lớp Chủ nhiệm"
                                disabled
                                value="Không phân công"
                                options={[{value: 'Không phân công', label: 'Không phân công (Khóa tự động)'}]}
                                onChange={() => {}}
                              />
                              <div className="text-[10px] text-[#c2410c] bg-[#fff7ed] border border-[#ffedd5] p-2 rounded-lg font-bold">
                                ⚠️ Chỉ có Giáo viên mới được phân công vai trò Giáo viên Chủ nhiệm. Hiệu trưởng, Phó Hiệu trưởng và các chức vụ nhân viên khác không được làm chủ nhiệm.
                              </div>
                            </div>
                          ) : (
                            <BaseSelect
                              label="Đảm nhiệm Lớp Chủ nhiệm"
                              value={assignedClass}
                              options={[
                                {value: 'Không phân công', label: 'Không phân công'},
                                ...classesList
                                  .filter(c => {
                                    if (c.status !== 'Đang hoạt động') return false;
                                    const deptObj = departments.find(d => d.name === department);
                                    if (deptObj) {
                                      const allowedGrades = deptObj.applicableGrades || [];
                                      return allowedGrades.some(g => String(c.grade).includes(g));
                                    }
                                    return true;
                                  })
                                  .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                                  .map(c => ({ value: c.name, label: `Chủ nhiệm lớp ${c.name}` }))
                              ]}
                              onChange={(val) => setAssignedClass(val)}
                            />
                          )}
                        </div>

                        <div>
                          <BaseSelect
                            label="Trực thuộc Tổ Khối Lớp"
                            value={department}
                            placeholder="-- Chưa phân công --"
                            options={departments.map(d => ({ value: d.name, label: d.name }))}
                            onChange={(val) => setDepartment(val)}
                          />
                          {departments.length === 0 && (
                            <p className="text-[10px] text-[#7b8a9e] mt-1">Không tìm thấy tổ chuyên môn.</p>
                          )}
                        </div>
                      </div>
                   </div>
                </div>
                )}
                {isNonTeachingRole && (
                  <div className="col-span-2">
                    <div className="p-4 bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl flex items-start gap-3">
                      <span className="text-xl mt-0.5">🏫</span>
                      <div>
                        <p className="text-xs font-bold text-[#166534] uppercase tracking-widest mb-0.5">Nhân viên không giảng dạy</p>
                        <p className="text-[10px] text-[#15803d]">Vị trí này không có phân công chủ nhiệm lớp và không trực thuộc tổ khối lớp.</p>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><Award className="w-4 h-4 mr-2" /> Hợp Đồng, Ngạch Bậc & Lương</h4>

            <div className="grid grid-cols-2 gap-6 font-sans">
               <div className="col-span-2 md:col-span-1">
                  <BaseSelect
                    label="Hình Thức Hợp Đồng *"
                    value={contractType}
                    options={[{value: 'Biên chế (Viên chức)', label: 'Biên chế (Viên chức)'}, {value: 'Hợp đồng dài hạn (Có BHXH)', label: 'Hợp đồng dài hạn (Có BHXH)'}, {value: 'Thỉnh giảng / Thời vụ', label: 'Thỉnh giảng / Thời vụ'}]}
                    onChange={setContractType}
                  />
               </div>
               <div className="col-span-2 md:col-span-1">
                  <BaseSelect
                    label="Trạng thái công tác"
                    value={workStatus}
                    options={[{value: 'Đang công tác', label: 'Đang công tác'}, {value: 'Nghỉ chế độ / Thai sản', label: 'Nghỉ chế độ / Thai sản'}, {value: 'Làm việc bán thời gian', label: 'Làm việc bán thời gian'}, {value: 'Đã thuyên chuyển / Nghỉ việc', label: 'Đã thuyên chuyển / Nghỉ việc'}]}
                    onChange={setWorkStatus}
                  />
               </div>
            </div>

            <div className="bg-[#f0f4fa] p-5 border border-[#b8c6d9] rounded-2xl shadow-sm space-y-4">
               <div>
                  <label className="block text-xs font-bold text-[#2c5ea0] uppercase tracking-widest mb-4">Cấu Hình Lương & Phụ Cấp (Dành cho Kế toán)</label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                     <div className="lg:col-span-2">
                        <BaseSelect
                          label="Chức danh nghề nghiệp (Ngạch)"
                          value={professionalTitle}
                          options={[{value: 'Giáo viên Mầm non hạng III (Mã V.07.05.15)', label: 'Giáo viên Mầm non hạng III (Mã V.07.05.15)'}, {value: 'Giáo viên Mầm non hạng II (Mã V.07.05.14)', label: 'Giáo viên Mầm non hạng II (Mã V.07.05.14)'}, {value: 'Giáo viên Mầm non hạng I (Mã V.07.05.13)', label: 'Giáo viên Mầm non hạng I (Mã V.07.05.13)'}, {value: 'Ngạch Chuyên viên Kế toán', label: 'Ngạch Chuyên viên Kế toán'}]}
                          onChange={setProfessionalTitle}
                        />
                     </div>
                     <div className="lg:col-span-1">
                        <BaseSelect
                          label="Bậc Lương"
                          value={salaryGrade}
                          options={[{value: 'Bậc 1', label: 'Bậc 1'}, {value: 'Bậc 2', label: 'Bậc 2'}, {value: 'Bậc 3', label: 'Bậc 3'}, {value: 'Bậc 4', label: 'Bậc 4'}, {value: 'Bậc 5', label: 'Bậc 5'}]}
                          onChange={setSalaryGrade}
                        />
                     </div>
                     <div className="lg:col-span-1">
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hệ Số Lương</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-serif font-bold text-[#1e2a3a]" 
                          value={salaryFactor}
                          onChange={(e) => setSalaryFactor(e.target.value)}
                        />
                     </div>
                     <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">% Phụ Cấp Thâm Niên (Nếu có)</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                          placeholder="15" 
                          value={seniorityAllowance}
                          onChange={(e) => setSeniorityAllowance(e.target.value)}
                        />
                     </div>
                     <div className="lg:col-span-2">
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">% Phụ Cấp Ưu Đãi Nghề</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                          value={preferentialAllowance}
                          onChange={(e) => setPreferentialAllowance(e.target.value)}
                        />
                     </div>
                  </div>
               </div>
            </div>
            
            <div className="bg-[#eef2ff] border border-[#c7d2fe] p-4 rounded-xl flex gap-3 items-start font-sans">
               <Clock className="w-5 h-5 text-[#4f46e5] shrink-0" />
               <div>
                  <p className="text-xs font-bold text-[#3730a3] uppercase tracking-widest mb-1">Mốc Nâng Lương Định Kỳ</p>
                  <p className="text-[10px] text-[#4f46e5]">Dựa trên cấu hình, đợt xét duyệt nâng bậc lương (thường xuyên) tiếp theo cho cán bộ này dự kiến vào <span className="font-bold">Tháng 09/2026</span>.</p>
               </div>
            </div>
         </div>
        )}
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto shrink-0 font-sans">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Quay Lại</button>
        ) : <div></div>}
        
        {step < 3 ? (
          <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Tiếp Theo</button>
        ) : (
          <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition-all">Ban Hành Hồ Sơ & Sinh TK</button>
        )}
      </div>
    </ModalBase>
  );
};

/* --- 2. EVALUATION MODAL (Đánh giá Chuẩn NN) --- */
const isTeacher = (role: string = '', jobRole: string = '', department: string = '') => {
  const rLower = role.toLowerCase();
  const jLower = jobRole.toLowerCase();
  const dLower = department.toLowerCase();
  return rLower.includes('giáo viên') || 
         jLower.includes('giáo viên') || 
         (department && !dLower.includes('hành chính') && !dLower.includes('bảo vệ') && !dLower.includes('y tế') && !dLower.includes('kế toán'));
};

const getStaffEvaluation = (staff: Staff) => {
  const seed = staff.id.charCodeAt(staff.id.length - 1) + staff.name.charCodeAt(0);
  const teaching = isTeacher(staff.role, staff.jobRole, staff.department);

  if (!teaching) {
    return {
      isTeacher: false,
      c1_self: 'N/A', c1_group: 'N/A', c1_bgh: 'N/A',
      c2_self: 'N/A', c2_group: 'N/A', c2_bgh: 'N/A',
      c3_self: 'N/A', c3_group: 'N/A', c3_bgh: 'N/A',
      c5_self: 'N/A', c5_group: 'N/A', c5_bgh: 'N/A',
      initiative: 'Không áp dụng',
      ratingText: 'Hành chính / N/A',
      generalRating: 'Chưa đánh giá',
      comment: 'Cán bộ thuộc tổ hành chính/hỗ trợ, không thuộc đối tượng đánh giá theo Chuẩn nghề nghiệp giáo viên (Thông tư 20/2018/TT-BGDĐT).',
      status: 'Hiệu Trưởng Đã Duyệt'
    };
  }

  let rating: 'Tốt' | 'Khá' | 'Đạt' = 'Khá';
  if (seed % 3 === 0) rating = 'Tốt';
  else if (seed % 3 === 1) rating = 'Khá';
  else rating = 'Đạt';

  const c1_self = rating === 'Tốt' ? 'Tốt' : 'Khá';
  const c1_group = rating === 'Tốt' ? 'Tốt' : 'Khá';
  const c1_bgh = rating === 'Tốt' ? 'Tốt' : rating === 'Khá' ? 'Khá' : 'Đạt';

  const c2_self = 'Tốt';
  const c2_group = rating === 'Tốt' ? 'Tốt' : 'Khá';
  const c2_bgh = rating === 'Tốt' ? 'Tốt' : 'Khá';

  const c3_self = rating === 'Tốt' ? 'Tốt' : 'Khá';
  const c3_group = rating === 'Tốt' ? 'Tốt' : 'Khá';
  const c3_bgh = rating === 'Tốt' ? 'Tốt' : rating === 'Khá' ? 'Khá' : 'Đạt';

  const c5_self = rating === 'Tốt' ? 'Tốt' : 'Khá';
  const c5_group = 'Tốt';
  const c5_bgh = rating === 'Tốt' ? 'Tốt' : 'Khá';

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

  return {
    isTeacher: true,
    c1_self, c1_group, c1_bgh,
    c2_self, c2_group, c2_bgh,
    c3_self, c3_group, c3_bgh,
    c5_self, c5_group, c5_bgh,
    initiative,
    ratingText,
    generalRating: rating,
    comment: `Giáo viên chấp hành tốt kỷ luật. Năng lực sư phạm đạt loại ${rating}. Đề nghị Tổ chuyên môn tăng cường bồi dưỡng để thi GVG cấp tỉnh trong năm học tới.`,
    status: 'Hiệu Trưởng Đã Duyệt'
  };
};

const getStaffReward = (staff: Staff) => {
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
    } else {
      title = 'Lao Động Tiên Tiến';
      reason = 'Hoàn thành tốt nhiệm vụ hỗ trợ hành chính văn phòng và dịch vụ học đường';
      level = 'Cấp Trường';
      badgeClass = 'bg-[#a8c4e0] border border-[#8e9eb4] text-[#1e2a3a]';
    }
  }

  return { title, reason, level, year, badgeClass };
};

export const EvaluationModal = ({ 
  isOpen, 
  onClose, 
  staff, 
  staffList = [],
  onSaveEvaluation
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  staff?: Staff | null; 
  staffList?: Staff[]; 
  onSaveEvaluation?: (staffId: string, evaluation: StaffEvaluation) => Promise<void>;
}) => {
  const [selectedId, setSelectedId] = useState<string>('');

  // Form states
  const [c1Self, setC1Self] = useState('Khá');
  const [c1Group, setC1Group] = useState('Khá');
  const [c1Bgh, setC1Bgh] = useState('Khá');

  const [c2Self, setC2Self] = useState('Khá');
  const [c2Group, setC2Group] = useState('Khá');
  const [c2Bgh, setC2Bgh] = useState('Khá');

  const [c3Self, setC3Self] = useState('Khá');
  const [c3Group, setC3Group] = useState('Khá');
  const [c3Bgh, setC3Bgh] = useState('Khá');

  const [c5Self, setC5Self] = useState('Khá');
  const [c5Group, setC5Group] = useState('Khá');
  const [c5Bgh, setC5Bgh] = useState('Khá');

  const [initiative, setInitiative] = useState('Không nộp');
  const [generalRating, setGeneralRating] = useState('Khá');
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('Hiệu Trưởng Đã Duyệt');

  useEffect(() => {
    if (isOpen) {
      if (staff) {
        setSelectedId(staff.id);
      } else if (staffList && staffList.length > 0) {
        setSelectedId(staffList[0].id);
      }
    }
  }, [staff, staffList, isOpen]);

  const activeStaff = staff || staffList.find(s => s.id === selectedId) || null;
  const evalData = activeStaff ? getStaffEvaluation(activeStaff) : null;

  useEffect(() => {
    if (evalData) {
      setC1Self(evalData.c1_self);
      setC1Group(evalData.c1_group);
      setC1Bgh(evalData.c1_bgh);

      setC2Self(evalData.c2_self);
      setC2Group(evalData.c2_group);
      setC2Bgh(evalData.c2_bgh);

      setC3Self(evalData.c3_self);
      setC3Group(evalData.c3_group);
      setC3Bgh(evalData.c3_bgh);

      setC5Self(evalData.c5_self);
      setC5Group(evalData.c5_group);
      setC5Bgh(evalData.c5_bgh);

      setInitiative(evalData.initiative);
      setGeneralRating(evalData.generalRating);
      setComment(evalData.comment);
      setStatus(evalData.status);
    }
  }, [activeStaff, isOpen]);

  const handleSave = () => {
    if (!activeStaff || !onSaveEvaluation) return;

    let ratingText = 'Hoàn Thành Nhiệm Vụ';
    if (generalRating === 'Tốt') {
      ratingText = 'Hoàn Thành Xuất Sắc';
    } else if (generalRating === 'Khá') {
      ratingText = 'Hoàn Thành Tốt';
    } else if (generalRating === 'Đạt') {
      ratingText = 'Hoàn Thành Nhiệm Vụ';
    } else if (generalRating === 'Chưa đạt') {
      ratingText = 'Chưa Hoàn Thành';
    } else if (generalRating === 'Chưa đánh giá') {
      ratingText = 'Hành chính / N/A';
    }

    onSaveEvaluation(activeStaff.id, {
      c1Self,
      c1Group,
      c1Bgh,
      c2Self,
      c2Group,
      c2Bgh,
      c3Self,
      c3Group,
      c3Bgh,
      c5Self,
      c5Group,
      c5Bgh,
      initiative,
      ratingText,
      generalRating,
      comment,
      status
    });
    onClose();
  };

  const getRatingClass = (val: string) => {
    if (val === 'Tốt') return 'text-[#2e6b8a] font-bold';
    if (val === 'Khá') return 'text-[#1e2a3a] font-bold';
    if (val === 'Đạt') return 'text-[#8c672b] font-bold';
    return 'text-[#7b8a9e]';
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Phiếu Đánh Giá Chuẩn Nghề Nghiệp" subtitle="Thông tư 20/2018/TT-BGDĐT" width="max-w-5xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
         <div className="flex bg-[#e8eef6] p-4 rounded-xl border border-[#b8c6d9] justify-between items-center">
            {staff ? (
               <div>
                  <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Mã NV: {activeStaff?.id}</p>
                  <p className="font-bold text-[#1e2a3a]">{activeStaff?.name} ({activeStaff?.department || activeStaff?.role})</p>
               </div>
            ) : (
               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full">
                  <div className="w-full md:w-80">
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Chọn Cán bộ / Nhân viên</label>
                     <BaseSelect
                       value={selectedId}
                       options={staffList.map(s => ({ value: s.id, label: `${s.name} (${s.id} - ${s.role})` }))}
                       onChange={setSelectedId}
                     />
                  </div>
                  {activeStaff && (
                     <div className="mt-2 md:mt-4">
                        <p className="text-xs font-bold text-[#4a5568]">Bộ phận: <span className="text-[#1e2a3a]">{activeStaff.department}</span></p>
                     </div>
                  )}
               </div>
            )}
            <div className="flex gap-4 items-center">
               <div className="w-64">
                 <BaseSelect
                   value="Kỳ Đánh Giá: Năm Học 2025-2026"
                   options={[{value: 'Kỳ Đánh Giá: Năm Học 2025-2026', label: 'Kỳ Đánh Giá: Năm Học 2025-2026'}, {value: 'Kỳ Đánh Giá: Năm Học 2024-2025', label: 'Kỳ Đánh Giá: Năm Học 2024-2025'}]}
                   onChange={() => {}}
                 />
               </div>
               <select 
                 value={status} 
                 onChange={(e) => setStatus(e.target.value)}
                 className={`inline-flex items-center px-4 py-2.5 rounded-lg text-xs font-bold border cursor-pointer focus:outline-none uppercase tracking-widest font-sans ${
                   status === 'Hiệu Trưởng Đã Duyệt' 
                     ? 'bg-[#2e6b8a] text-[#f5f8fc] border-[#1e4f6a]' 
                     : 'bg-amber-100 text-amber-800 border-amber-300'
                 }`}
               >
                 <option value="Hiệu Trưởng Đã Duyệt">Hiệu Trưởng Đã Duyệt</option>
                 <option value="Chưa Duyệt">Chưa Duyệt</option>
               </select>
            </div>
         </div>

         <div className="overflow-x-auto border border-[#b8c6d9] rounded-xl">
             <table className="w-full text-sm text-left">
                <thead className="bg-[#e8eef6] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b border-[#b8c6d9]">
                   <tr>
                      <th className="px-4 py-3 min-w-[200px]">Tiêu Chuẩn / Tiêu Chí</th>
                      <th className="px-4 py-3 text-center border-l border-[#b8c6d9] w-28">Tự Đánh Giá</th>
                      <th className="px-4 py-3 text-center border-l border-[#b8c6d9] w-28">Tổ Chuyên Môn</th>
                      <th className="px-4 py-3 text-center border-l border-[#b8c6d9] bg-[#f0f4fa] text-[#1e2a3a] w-28">Kết Luận BGH</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                   <tr className="bg-[#dce4ee]">
                      <td colSpan={4} className="px-4 py-2 font-bold text-[#1e2a3a] text-xs uppercase tracking-widest">Tiêu Chuẩn 1. Phẩm Chất Nhà Giáo</td>
                   </tr>
                   <tr className="hover:bg-[#e8eef6] bg-white">
                      <td className="px-4 py-3 font-bold text-[#4a5568]">Tiêu chí 1: Đạo đức nhà giáo</td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c1Self}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC1Self(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c1Group}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC1Group(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9] bg-[#f0f4fa]">
                         <select
                           value={c1Bgh}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC1Bgh(e.target.value)}
                           className={`px-2 py-1 bg-[#f0f4fa] border border-[#b8c6d9] rounded text-xs focus:outline-none font-bold w-24 mx-auto block ${getRatingClass(c1Bgh)}`}
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                   </tr>
                   <tr className="hover:bg-[#e8eef6] bg-white">
                      <td className="px-4 py-3 font-bold text-[#4a5568]">Tiêu chí 2: Phong cách nhà giáo</td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c2Self}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC2Self(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c2Group}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC2Group(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9] bg-[#f0f4fa]">
                         <select
                           value={c2Bgh}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC2Bgh(e.target.value)}
                           className={`px-2 py-1 bg-[#f0f4fa] border border-[#b8c6d9] rounded text-xs focus:outline-none font-bold w-24 mx-auto block ${getRatingClass(c2Bgh)}`}
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                   </tr>
                   
                   <tr className="bg-[#dce4ee]">
                      <td colSpan={4} className="px-4 py-2 font-bold text-[#1e2a3a] text-xs uppercase tracking-widest">Tiêu Chuẩn 2. Phát Triển Chuyên Môn Bổn Thân</td>
                   </tr>
                   <tr className="hover:bg-[#e8eef6] bg-white">
                      <td className="px-4 py-3 font-bold text-[#4a5568]">Tiêu chí 3: Phát triển chuyên môn</td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c3Self}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC3Self(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c3Group}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC3Group(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9] bg-[#f0f4fa]">
                         <select
                           value={c3Bgh}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC3Bgh(e.target.value)}
                           className={`px-2 py-1 bg-[#f0f4fa] border border-[#b8c6d9] rounded text-xs focus:outline-none font-bold w-24 mx-auto block ${getRatingClass(c3Bgh)}`}
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                   </tr>
                   <tr className="hover:bg-[#e8eef6] bg-white">
                      <td className="px-4 py-3 font-bold text-[#4a5568]">Tiêu chí 5: Sử dụng ngoại ngữ / CNTT</td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c5Self}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC5Self(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9]">
                         <select
                           value={c5Group}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC5Group(e.target.value)}
                           className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs focus:outline-none w-24 mx-auto block"
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                      <td className="px-4 py-2 text-center border-l border-[#b8c6d9] bg-[#f0f4fa]">
                         <select
                           value={c5Bgh}
                           disabled={!evalData?.isTeacher}
                           onChange={(e) => setC5Bgh(e.target.value)}
                           className={`px-2 py-1 bg-[#f0f4fa] border border-[#b8c6d9] rounded text-xs focus:outline-none font-bold w-24 mx-auto block ${getRatingClass(c5Bgh)}`}
                         >
                           <option value="Tốt">Tốt</option>
                           <option value="Khá">Khá</option>
                           <option value="Đạt">Đạt</option>
                           <option value="Chưa đạt">Chưa đạt</option>
                           <option value="N/A">N/A</option>
                         </select>
                      </td>
                   </tr>
                </tbody>
             </table>
         </div>

         <div className="grid grid-cols-2 gap-6">
            <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2 border-b border-[#b8c6d9] pb-2">Hồ Sơ Minh Chứng Đính Kèm (Link / Files)</label>
               <div className="flex gap-4 flex-wrap items-center">
                  {evalData?.isTeacher ? (
                     <>
                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-[#e8eef6] text-[#1e2a3a] border border-[#b8c6d9] cursor-pointer hover:bg-[#dce4ee]"><FileText className="w-3.5 h-3.5 mr-2 text-[#2c5ea0]" /> Chung_Chi_MOS.pdf</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#4a5568]">Sáng kiến:</span>
                          <select
                            value={initiative}
                            onChange={(e) => setInitiative(e.target.value)}
                            className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold text-[#1e2a3a] focus:outline-none"
                          >
                            <option value="Không nộp">Không nộp sáng kiến</option>
                            <option value="Đã Nộp (Cấp Trường)">Đã Nộp (Cấp Trường)</option>
                            <option value="Đã Nộp (Cấp Sở)">Đã Nộp (Cấp Sở)</option>
                            <option value="Đạt giải Cấp Tỉnh">Đạt giải Cấp Tỉnh</option>
                            <option value="Không áp dụng">Không áp dụng</option>
                          </select>
                        </div>
                     </>
                  ) : (
                     <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-[#7b8a9e] bg-[#e8eef6] text-[#7b8a9e] border border-[#b8c6d9] border-dashed"><FileText className="w-3.5 h-3.5 mr-2 text-[#7b8a9e]" /> Không áp dụng minh chứng chuẩn nghề nghiệp</span>
                  )}
                  <button className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-bold bg-white text-[#2c5ea0] border border-[#2c5ea0] border-dashed hover:bg-[#fee2e2]"><Upload className="w-3 h-3 mr-1" /> Thêm File</button>
               </div>
            </div>

            <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nhận Xét / Góp Ý Của Hiệu Trưởng</label>
               <textarea rows={3} className="w-full px-4 py-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" defaultValue={evalData?.comment} key={activeStaff?.id || ''} />
            </div>

            <div className="col-span-2 flex items-center justify-between p-5 bg-[#dce4ee] rounded-xl border border-[#b8c6d9]">
               <div>
                  <p className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Kết Quả Đánh Giá Xếp Loại Chung (Thông Tư 20)</p>
                  <p className="font-serif font-bold text-[#1e2a3a] text-xl">ĐẠT CHUẨN: {evalData?.generalRating.toUpperCase()}</p>
               </div>
               <div className="w-48">
                 <BaseSelect
                   value={evalData?.generalRating || 'Khá'}
                   options={[{value: 'Tốt', label: 'Tốt'}, {value: 'Khá', label: 'Khá'}, {value: 'Đạt', label: 'Đạt'}, {value: 'Chưa đạt', label: 'Chưa đạt'}, {value: 'Chưa đánh giá', label: 'N/A'}]}
                   onChange={() => {}}
                 />
               </div>
            </div>
         </div>
      </div>
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end shrink-0 gap-3">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Lưu Phiếu Đánh Giá</button>
      </div>
    </ModalBase>
  );
};

/* --- 3. REWARD MODAL (Thi đua Khen thưởng) --- */
export const RewardModal = ({ 
  isOpen, 
  onClose, 
  staff, 
  staffList = [] 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  staff?: Staff | null; 
  staffList?: Staff[]; 
}) => {
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      if (staff) {
        setSelectedId(staff.id);
      } else if (staffList && staffList.length > 0) {
        setSelectedId(staffList[0].id);
      }
    }
  }, [staff, staffList, isOpen]);

  const activeStaff = staff || staffList.find(s => s.id === selectedId) || null;
  const reward = activeStaff ? getStaffReward(activeStaff) : null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Khen Thưởng & Kỷ Luật" subtitle="Minh chứng phục vụ xét nâng lương" width="max-w-4xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
         <div className="flex bg-[#e8eef6] p-4 rounded-xl border border-[#b8c6d9] justify-between items-center">
            {staff ? (
               <div>
                  <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Mã NV: {activeStaff?.id}</p>
                  <p className="font-bold text-[#1e2a3a]">{activeStaff?.name} ({activeStaff?.department || activeStaff?.role})</p>
               </div>
            ) : (
               <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full justify-between">
                  <div className="w-full md:w-80">
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Chọn Cán bộ / Nhân viên</label>
                     <BaseSelect
                       value={selectedId}
                       options={staffList.map(s => ({ value: s.id, label: `${s.name} (${s.id} - ${s.role})` }))}
                       onChange={setSelectedId}
                     />
                  </div>
                  {activeStaff && (
                     <div>
                        <p className="text-xs font-bold text-[#4a5568]">Tổ chuyên môn: <span className="text-[#1e2a3a]">{activeStaff.department}</span></p>
                     </div>
                  )}
               </div>
            )}
            {reward && (
               <div className="flex gap-4 items-center">
                  <span className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold bg-[#2e6b8a] text-[#f5f8fc] uppercase tracking-widest">Năm Học {reward.year}</span>
               </div>
            )}
         </div>

         <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b-2 border-[#2e6b8a] pb-2 flex items-center justify-between">
                  <span className="flex items-center"><Award className="w-4 h-4 mr-2 text-[#2e6b8a]" /> Sổ Khen Thưởng</span>
                  <button className="text-[10px] font-bold text-[#2e6b8a] bg-[#dcfce7] px-2 py-1 rounded">+ Khởi Tạo Mới</button>
               </h4>
               <div className="space-y-4">
                  {reward ? (
                     <div className="p-5 border border-[#b8c6d9] bg-white rounded-xl shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#2e6b8a]"></div>
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-xs font-bold text-[#2e6b8a] uppercase tracking-widest">{reward.title}</p>
                            <span className="text-[10px] font-mono text-[#7b8a9e]">{reward.year}</span>
                          </div>
                          <p className="text-sm font-bold text-[#1e2a3a] mt-1">{reward.reason}</p>
                          <div className="flex justify-between items-end mt-4">
                             <p className="text-[10px] text-[#4a5568] font-bold">QĐ Số: {activeStaff ? (activeStaff.id.charCodeAt(0) * 3) : '124'}/QD-UBND • Cấp QĐ: {reward.level}</p>
                             <button className="text-[10px] text-[#1e2a3a] font-bold underline">Xem Bản Scan</button>
                          </div>
                     </div>
                  ) : (
                     <div className="p-8 border border-dashed border-[#b8c6d9] bg-[#f0f4fa] rounded-xl flex flex-col items-center justify-center text-center">
                        <Award className="w-8 h-8 text-[#b8c6d9] mb-3" />
                        <p className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">Chưa Ghi Nhận Khen Thưởng</p>
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b-2 border-[#2c5ea0] pb-2 flex items-center justify-between">
                  <span className="flex items-center"><Shield className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Hồ Sơ Kỷ Luật</span>
                  <button className="text-[10px] font-bold text-[#2c5ea0] bg-[#fee2e2] px-2 py-1 rounded">+ Thêm Vi Phạm</button>
               </h4>
               
               {/* Empty State */}
               <div className="p-8 border border-dashed border-[#b8c6d9] bg-[#f0f4fa] rounded-xl flex flex-col items-center justify-center text-center">
                  <AlertTriangle className="w-8 h-8 text-[#b8c6d9] mb-3" />
                  <p className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">Chưa Ghi Nhận Kỷ Luật</p>
                  <p className="text-[10px] text-[#8e9eb4] mt-1">Cán bộ hiện không có vi phạm trong kỳ xét duyệt này.</p>
               </div>
            </div>
         </div>
      </div>
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng Lại</button>
      </div>
    </ModalBase>
  );
};

/* --- 4. BULK IMPORT MODAL (Nhập từ Excel/CSV) --- */
export const BulkImportModal = ({ 
  isOpen, 
  onClose, 
  onImportSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onImportSuccess?: () => void;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [currentStaff, setCurrentStaff] = useState<Staff[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedRows([]);
      setValidationError(null);
      getStaffList().then(setCurrentStaff).catch(() => {});
    }
  }, [isOpen]);

  // Accent and space remover helper for email prefix
  const removeDiacritics = (str: string) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .toLowerCase();
  };

  const getEmailDomain = (jobRole: string, role: string) => {
    const jr = (jobRole || '').trim().toLowerCase();
    const r = (role || '').trim().toLowerCase();

    // Check for management/BGH first
    if (
      jr.includes('quản lý') || jr.includes('bgh') || jr.includes('hiệu trưởng') || jr.includes('hiệu phó') ||
      r.includes('quản lý') || r.includes('bgh') || r.includes('hiệu trưởng') || r.includes('hiệu phó') || r.includes('tổng phụ trách')
    ) {
      return '@teacher.thanhuu.edu.vn';
    }

    // Check for teaching staff
    if (
      jr.includes('giáo viên') || jr.includes('dạy') || 
      r.includes('giáo viên') || r.includes('tổ trưởng chuyên môn') || r.includes('tổ phó chuyên môn') || r.includes('chủ nhiệm')
    ) {
      return '@teacher.thanhuu.edu.vn';
    }

    // Check for accountant
    if (jr.includes('kế toán') || r.includes('kế toán')) {
      return '@account.thanhuu.edu.vn';
    }

    // Check for nurse/medical staff
    if (jr.includes('y tế') || r.includes('y tế') || jr.includes('bác sĩ') || r.includes('bác sĩ')) {
      return '@nurse.thanhuu.edu.vn';
    }

    // Check for librarian
    if (jr.includes('thư viện') || r.includes('thư viện')) {
      return '@library.thanhuu.edu.vn';
    }

    // Check for administrative/secretary
    if (
      jr.includes('thư ký') || jr.includes('văn thư') || jr.includes('hành chính') || 
      r.includes('thư ký') || r.includes('văn thư') || r.includes('hành chính')
    ) {
      return '@secretary.thah.edu.vn';
    }

    // Check for technician
    if (
      jr.includes('kỹ thuật') || jr.includes('thiết bị') || jr.includes('thí nghiệm') || jr.includes('cntt') || jr.includes('công nghệ') ||
      r.includes('kỹ thuật') || r.includes('thiết bị') || r.includes('thí nghiệm') || r.includes('cntt') || r.includes('công nghệ')
    ) {
      return '@admin.mnah.edu.vn';
    }

    // Check for security
    if (jr.includes('bảo vệ') || r.includes('bảo vệ')) {
      return '@secure.thah.edu.vn';
    }

    // Check for cleaner/janitor
    if (
      jr.includes('lao công') || jr.includes('tạp vụ') || jr.includes('dọn dẹp') || 
      r.includes('lao công') || r.includes('tạp vụ') || r.includes('dọn dẹp')
    ) {
      return '@clean.thah.edu.vn';
    }

    // Check for kitchen staff
    if (
      jr.includes('bếp') || jr.includes('căng tin') || jr.includes('nhà bếp') ||
      r.includes('bếp') || r.includes('căng tin') || r.includes('nhà bếp')
    ) {
      return '@boarding.thah.edu.vn';
    }

    // Fallbacks based on exact match or default
    switch (jobRole) {
      case 'Cán bộ Quản lý (BGH)':
      case 'Giáo viên bộ môn':
        return '@teacher.mnah.edu.vn';
      case 'Nhân viên Kế toán':
        return '@account.thah.edu.vn';
      case 'Nhân viên Y tế':
        return '@nurse.thah.edu.vn';
      case 'Nhân viên Thư viện':
        return '@library.thah.edu.vn';
      case 'Nhân viên Thư ký / Hành chính':
        return '@secretary.thah.edu.vn';
      case 'Nhân viên Kỹ thuật':
        return '@admin.mnah.edu.vn';
      case 'Nhân viên Bảo vệ':
        return '@secure.thah.edu.vn';
      case 'Nhân viên Lao công':
        return '@clean.thah.edu.vn';
      case 'Nhân viên Nhà bếp':
        return '@boarding.thah.edu.vn';
      default:
        return '@school.edu.vn';
    }
  };

  const generateEmail = (fullName: string, jobRole: string, role: string) => {
    if (!fullName) return '';
    const clean = removeDiacritics(fullName).trim();
    if (!clean) return '';
    const parts = clean.split(/\s+/);
    const lastName = parts[parts.length - 1];
    const initials = parts.slice(0, parts.length - 1).map(p => p[0] || '').join('');
    const prefix = `${lastName}${initials}`;
    return `${prefix}${getEmailDomain(jobRole, role)}`;
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const handleDownloadTemplate = () => {
    const csvContent = 
      "Số hiệu viên chức,Họ và tên cán bộ,Giới tính,Ngày sinh,Số cccd,Địa chỉ thường trú,Số điện thoại di động,Ngày vào đảng (dự bị),Ngày vào đảng (chính thức),Trình độ lý luận chính trị,Trình độ đào tạo cao nhất,Chuyên ngành đào tạo chính,Môn giảng dạy chính,Vị trí việc làm,Chức vụ / chức danh hiện tại,Tổ chuyên môn,Hình thức hợp đồng,Trạng thái công tác,Chức danh nghề nghiệp,Bậc lương,Hệ số lương,% phụ cấp thâm niên (nếu có),% phụ cấp ưu đãi nghề\n" +
      "CB1005,Nguyễn Hữu D,Nam,15/04/1988,079188000123,\"An Hữu, Cái Bè, Tiền Giang\",0905556667,01/05/2015,01/05/2016,Trung cấp,Cử nhân,Sư phạm Toán học,Toán học,Giáo viên bộ môn,Giáo viên bộ môn,Toán - tin,Biên chế,Đang công tác,Giáo viên Mầm non hạng III (Mã V.07.05.15),Bậc 2,2.67,5,30\n" +
      "CB1006,Lê Thị E,Nữ,20/09/1992,079292000456,\"Mỹ Tho, Tiền Giang\",0918882233,,,Không,Thạc sĩ,Sư phạm Ngữ văn,Ngữ văn,Giáo viên bộ môn,Giáo viên bộ môn,Ngữ văn,Biên chế,Đang công tác,Giáo viên Mầm non hạng III (Mã V.07.05.15),Bậc 1,2.34,,30\n" +
      "CB1007,Phan Văn F,Nam,10/10/1985,079185000789,\"Cái Bè, Tiền Giang\",0922334466,,,Không,Cử nhân,Kế toán doanh nghiệp,Không giảng dạy (Hành chính/Nhân viên),Nhân viên Kế toán,Kế toán trưởng,Hành chính,Hợp đồng dài hạn,Đang công tác,Ngạch Chuyên viên Kế toán,Bậc 1,2.34,,\n";
    
    // Create a Blob with UTF-8 and BOM (BOM makes Excel open Vietnamese accents correctly)
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "mau_danh_sach_nhan_su.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setValidationError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) {
        setValidationError("Không thể đọc tệp tin. Tệp tin trống.");
        return;
      }
      try {
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length <= 1) {
          setValidationError("Tệp tin không chứa bản ghi dữ liệu nào (chỉ có tiêu đề hoặc trống).");
          return;
        }

        const headers = parseCSVLine(lines[0]);
        if (headers.length < 16) {
          setValidationError("Cấu trúc tiêu đề tệp tin không chính xác hoặc thiếu trường thông tin bắt buộc.");
          return;
        }

        const normalizeQuotaRole = (r: string): string => {
          const norm = (r || '').trim().toLowerCase();
          if (norm === 'hiệu trưởng') return 'hiệu trưởng';
          if (norm.includes('phó hiệu trưởng')) return 'phó hiệu trưởng';
          if (norm.includes('tổng phụ trách')) return 'tổng phụ trách';
          if (norm === 'kế toán trưởng') return 'kế toán trưởng';
          if (norm === 'tổ trưởng bảo vệ') return 'tổ trưởng bảo vệ';
          return '';
        };

        // Initialize database counts (case-insensitive & trimmed)
        const dbCounts: Record<string, number> = {};
        currentStaff.forEach(s => {
          if (s.role && s.status !== 'Bình Chỉ / Khóa') {
            const qKey = normalizeQuotaRole(s.role);
            if (qKey) {
              dbCounts[qKey] = (dbCounts[qKey] || 0) + 1;
            }
          }
        });

        // Track counts added by the CSV so far
        const csvCounts: Record<string, number> = {};

        const rows: any[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          if (cols.length < 16) continue; // Skip incomplete lines

          // Skip completely empty or blank lines (e.g. trailing comma lines from Excel)
          const isRowEmpty = cols.every(val => val.trim() === "");
          if (isRowEmpty) continue;

          const id = cols[0];
          const name = cols[1];
          if (!id.trim() && !name.trim()) continue; // Skip rows that have no ID and no Name
          const gender = cols[2];
          const dob = cols[3];
          const cccd = cols[4];
          const address = cols[5];
          const phone = cols[6];
          const partyJoinDateReserved = cols[7] || '';
          const partyJoinDateOfficial = cols[8] || '';
          const politicalTheory = cols[9] || 'Không';
          const jobRole = cols[13];
          const role = cols[14];
          const isCoreRole = (r: string = '') => {
            const lower = r.toLowerCase().trim();
            return lower.includes('giáo viên') || 
                   lower.includes('hiệu trưởng') || 
                   lower.includes('hiệu phó') || 
                   lower.includes('tổng phụ trách') || 
                   lower.includes('thư ký') || 
                   lower.includes('văn thư') || 
                   lower.includes('thư viện');
          };
          const educationLevel = cols[10] || (isCoreRole(role) ? 'Cử nhân' : 'Không');
          const major = cols[11] || '';
          const department = cols[15];
          const contractType = cols[16] || 'Biên chế (Viên chức)';
          const workStatus = cols[17] || 'Đang công tác';
          const professionalTitle = cols[18] || '';
          const salaryGrade = cols[19] || 'Bậc 1';
          const salaryFactor = cols[20] || '2.34';
          const seniorityAllowance = cols[21] || '';
          const preferentialAllowance = cols[22] || '0';

          const errors: string[] = [];
          if (!id) errors.push("Thiếu Số hiệu viên chức");
          if (!name) errors.push("Thiếu Họ và tên");
          if (!phone) errors.push("Thiếu Số điện thoại");
          if (!cccd) errors.push("Thiếu Số CCCD");

          // Quota validation
          const existingStaff = currentStaff.find(s => s.id === id);
          const prevRoleNorm = existingStaff && existingStaff.status !== 'Bình Chỉ / Khóa'
            ? (existingStaff.role || '').toLowerCase().trim()
            : null;

          const quotaKey = normalizeQuotaRole(role);
          if (quotaKey) {
            const quotas: Record<string, number> = {
              'hiệu trưởng': 1,
              'phó hiệu trưởng': 2,
              'tổng phụ trách': 1,
              'kế toán trưởng': 1,
              'tổ trưởng bảo vệ': 1
            };
            const quotaLimit = quotas[quotaKey];

            // Count how many currently hold this role (db + csv so far)
            const currentDbCount = dbCounts[quotaKey] || 0;
            const currentCsvCount = csvCounts[quotaKey] || 0;

            let activeCount = currentDbCount + currentCsvCount;

            // Deduct 1 if the current staff member is already counted in the DB for this role
            if (prevRoleNorm && normalizeQuotaRole(prevRoleNorm) === quotaKey) {
              activeCount = Math.max(0, activeCount - 1);
            }

            if (activeCount + 1 > quotaLimit) {
              errors.push(`Vượt giới hạn: Vai trò này tối đa ${quotaLimit} người (hiện tại có ${activeCount} người).`);
            } else {
              // Increment CSV count for this role
              csvCounts[quotaKey] = (csvCounts[quotaKey] || 0) + 1;
            }
          }

          let inferredMainSubject = cols[12] || '';
          if (!inferredMainSubject) {
            if (jobRole && jobRole !== 'Giáo viên bộ môn') {
              inferredMainSubject = 'Không giảng dạy (Hành chính/Nhân viên)';
            } else if (major) {
              const m = major.toLowerCase();
              if (m.includes('toán')) inferredMainSubject = 'Toán học';
              else if (m.includes('văn')) inferredMainSubject = 'Ngữ văn';
              else if (m.includes('anh') || m.includes('ngoại ngữ')) inferredMainSubject = 'Tiếng Anh';
              else if (m.includes('lý') || m.includes('lí')) inferredMainSubject = 'Vật lí';
              else if (m.includes('hóa')) inferredMainSubject = 'Hóa học';
              else if (m.includes('sinh')) inferredMainSubject = 'Sinh học';
              else if (m.includes('sử')) inferredMainSubject = 'Lịch sử';
              else if (m.includes('địa')) inferredMainSubject = 'Địa lí';
              else if (m.includes('tin')) inferredMainSubject = 'Tin học';
              else if (m.includes('công nghệ')) inferredMainSubject = 'Công nghệ';
              else if (m.includes('thể chất') || m.includes('thể dục')) inferredMainSubject = 'Thể dục';
              else if (m.includes('quốc phòng')) inferredMainSubject = 'Giáo dục Quốc phòng - An ninh';
            } else if (department) {
              const d = department.toLowerCase();
              if (d.includes('tin')) inferredMainSubject = 'Tin học';
              else if (d.includes('toán')) inferredMainSubject = 'Toán học';
              else if (d.includes('văn')) inferredMainSubject = 'Ngữ văn';
              else if (d.includes('ngoại ngữ') || d.includes('tiếng anh')) inferredMainSubject = 'Tiếng Anh';
            }
            if (!inferredMainSubject) {
              inferredMainSubject = 'Toán học';
            }
          }

          const email = generateEmail(name, jobRole, role);
          const isTeachingOrBgh = jobRole === 'Giáo viên bộ môn' || jobRole === 'Cán bộ Quản lý (BGH)';

          rows.push({
            id,
            name,
            gender,
            dob,
            cccd,
            address,
            phone,
            partyJoinDateReserved,
            partyJoinDateOfficial,
            politicalTheory,
            educationLevel,
            major: isTeachingOrBgh ? major : '',
            mainSubject: inferredMainSubject,
            jobRole,
            role,
            department,
            contractType,
            workStatus,
            professionalTitle,
            salaryGrade,
            salaryFactor,
            seniorityAllowance,
            preferentialAllowance,
            email,
            errors,
            isUpdate: !!existingStaff
          });
        }
        setParsedRows(rows);
      } catch (err) {
        setValidationError("Lỗi đọc cấu trúc file. Vui lòng đảm bảo file CSV mã hóa UTF-8 đúng định dạng.");
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      processFile(droppedFile);
    } else {
      setValidationError("Chỉ chấp nhận tệp tin định dạng CSV (.csv) được xuất từ Excel.");
    }
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;
    const errorCount = parsedRows.reduce((acc, row) => acc + row.errors.length, 0);
    if (errorCount > 0) {
      alert("Vui lòng khắc phục các dòng dữ liệu bị lỗi trước khi tiến hành nhập.");
      return;
    }

    setLoading(true);
    let successCount = 0;
    try {
      for (const row of parsedRows) {
        let mappedStatus: 'Đang Công Tác' | 'Nghỉ Phép' | 'Bình Chỉ / Khóa' = 'Đang Công Tác';
        if (row.workStatus === 'Nghỉ chế độ / Thai sản' || row.workStatus === 'Làm việc bán thời gian') {
          mappedStatus = 'Nghỉ Phép';
        } else if (row.workStatus === 'Đã thuyên chuyển / Nghỉ việc') {
          mappedStatus = 'Bình Chỉ / Khóa';
        }

        const isTeachingOrBgh = row.jobRole === 'Giáo viên bộ môn' || row.jobRole === 'Cán bộ Quản lý (BGH)';
        const newStaff: Staff = {
          id: row.id,
          name: row.name,
          dob: row.dob,
          gender: row.gender,
          role: row.role,
          department: row.department || 'Chưa phân công',
          phone: row.phone,
          email: row.email,
          status: mappedStatus,
          cccd: row.cccd,
          address: row.address,
          partyJoinDateReserved: row.partyJoinDateReserved,
          partyJoinDateOfficial: row.partyJoinDateOfficial,
          politicalTheory: row.politicalTheory,
          educationLevel: row.educationLevel,
          major: isTeachingOrBgh ? row.major : '',
          jobRole: row.jobRole,
          contractType: row.contractType,
          workStatus: row.workStatus,
          professionalTitle: row.professionalTitle,
          salaryGrade: row.salaryGrade,
          salaryFactor: Number(row.salaryFactor) || 2.34,
          seniorityAllowance: Number(row.seniorityAllowance) || 0,
          preferentialAllowance: Number(row.preferentialAllowance) || 0,
          assignedClass: 'Không phân công'
        };

        await createStaff(newStaff);
        successCount++;
      }
      await syncAllStaffRoles();
      alert(`🎉 Đã nhập thành công ${successCount} hồ sơ nhân sự lên Firestore!`);
      if (onImportSuccess) onImportSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Đã có lỗi xảy ra trong quá trình nhập. Đã nhập thành công ${successCount} dòng.`);
    } finally {
      setLoading(false);
    }
  };

  const totalErrors = parsedRows.reduce((acc, r) => acc + r.errors.length, 0);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Nhập danh sách nhân sự từ Excel" subtitle="Bulk Import & Quota Verification Engine" width="max-w-5xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 bg-[#f5f8fc]">
        {/* Top Info Alert */}
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold uppercase tracking-wider">Lưu ý về định dạng tệp tin & Hạn ngạch nhân sự</p>
            <p>Hệ thống hỗ trợ nhập danh sách qua tệp tin CSV (UTF-8). Vui lòng lưu bảng tính Excel dưới dạng <b>CSV UTF-8 (Comma delimited) (*.csv)</b> để bảo toàn font chữ tiếng Việt.</p>
            <p>Hệ thống tự động thực thi luật hạn ngạch của trường: Hiệu trưởng (tối đa 1), Phó hiệu trưởng (tối đa 2), Kế toán trưởng (tối đa 1), Tổ trưởng bảo vệ (tối đa 1), Y tế (tối đa 3), Thư viện (tối đa 1), Thư ký hội đồng (tối đa 1).</p>
          </div>
        </div>

        {/* Upload Block */}
        {!file ? (
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-3 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${dragActive ? 'border-[#2c5ea0] bg-[#e8eef6]' : 'border-[#b8c6d9] bg-[#f0f4fa] hover:bg-[#e8eef6]/50'}`}
          >
            <FileSpreadsheet className="w-16 h-16 text-[#7b8a9e] mb-4" />
            <p className="text-sm font-bold text-[#1e2a3a]">Kéo thả file CSV chứa danh sách nhân sự tại đây</p>
            <p className="text-xs text-[#7b8a9e] mt-1">hoặc click nút bên dưới để chọn file từ máy tính</p>
            <div className="mt-4 flex gap-3">
              <label className="px-5 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] cursor-pointer rounded-full shadow-md transition">
                Chọn tệp tin
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
              </label>
              <button 
                onClick={handleDownloadTemplate}
                className="px-5 py-2.5 bg-white text-[#4a5568] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-gray-50 rounded-full shadow-sm transition"
              >
                Tải tệp mẫu (.CSV)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File info */}
            <div className="p-4 bg-white border border-[#b8c6d9] rounded-2xl flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-700" />
                <div>
                  <p className="text-sm font-bold text-[#1e2a3a]">{file.name}</p>
                  <p className="text-xs text-[#7b8a9e]">{(file.size / 1024).toFixed(1)} KB • {parsedRows.length} dòng dữ liệu</p>
                </div>
              </div>
              <button 
                onClick={() => { setFile(null); setParsedRows([]); }}
                className="text-xs font-bold text-red-600 uppercase tracking-widest hover:underline"
              >
                Hủy chọn file
              </button>
            </div>

            {/* Validation warning */}
            {totalErrors > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-start gap-3 text-xs">
                <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <p className="font-bold uppercase">Phát hiện {totalErrors} lỗi dữ liệu!</p>
                  <p className="mt-0.5">Vui lòng kiểm tra lại cột Chức vụ & Vị trí việc làm hoặc số hiệu viên chức trùng lắp. Nút nhập dữ liệu đã bị khóa cho tới khi toàn bộ lỗi được sửa.</p>
                </div>
              </div>
            )}

            {/* Bảng phân tích thống kê xem trước */}
            {parsedRows.length > 0 && (
              <div className="bg-white border border-[#b8c6d9] rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-[#e8eef6] pb-3">
                  <Sparkles className="w-5 h-5 text-[#2c5ea0]" />
                  <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">
                    Phân tích cơ cấu nhân sự xem trước ({parsedRows.length} thành viên)
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cột 1: Tổ chuyên môn */}
                  <div className="bg-[#f8fafc] border border-[#dce4ee] rounded-xl p-4 flex flex-col h-[200px]">
                    <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-wider border-b border-[#dce4ee] pb-2 mb-2 block shrink-0">
                      Tổ Chuyên Môn
                    </span>
                    <div className="flex-1 overflow-y-auto main-scrollbar pr-1 space-y-1.5">
                      {Object.entries(
                        parsedRows.reduce((acc, row) => {
                          const dept = row.department || 'Chưa phân công';
                          acc[dept] = (acc[dept] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([dept, count]) => (
                        <div key={dept} className="flex items-center justify-between text-xs p-1.5 bg-white border border-[#e8eef6] rounded-lg hover:border-[#b8c6d9] transition">
                          <span className="font-bold text-[#4a5568] truncate pr-2" title={dept}>{dept}</span>
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-[#2c5ea0]/10 border border-[#2c5ea0]/20 text-[10px] font-bold text-[#2c5ea0]">
                            {count as number} thành viên
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cột 2: Chức vụ / Chức danh */}
                  <div className="bg-[#f8fafc] border border-[#dce4ee] rounded-xl p-4 flex flex-col h-[200px]">
                    <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-wider border-b border-[#dce4ee] pb-2 mb-2 block shrink-0">
                      Chức Vụ / Chức Danh
                    </span>
                    <div className="flex-1 overflow-y-auto main-scrollbar pr-1 space-y-1.5">
                      {Object.entries(
                        parsedRows.reduce((acc, row) => {
                          const role = row.role || 'Chưa phân công';
                          acc[role] = (acc[role] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([role, count]) => (
                        <div key={role} className="flex items-center justify-between text-xs p-1.5 bg-white border border-[#e8eef6] rounded-lg hover:border-[#b8c6d9] transition">
                          <span className="font-bold text-[#4a5568] truncate pr-2" title={role}>{role}</span>
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700">
                            {count as number} nhân sự
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cột 3: Vị trí việc làm */}
                  <div className="bg-[#f8fafc] border border-[#dce4ee] rounded-xl p-4 flex flex-col h-[200px]">
                    <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-wider border-b border-[#dce4ee] pb-2 mb-2 block shrink-0">
                      Vị Trí Việc Làm
                    </span>
                    <div className="flex-1 overflow-y-auto main-scrollbar pr-1 space-y-1.5">
                      {Object.entries(
                        parsedRows.reduce((acc, row) => {
                          const jobRole = row.jobRole || 'Chưa rõ';
                          acc[jobRole] = (acc[jobRole] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([jobRole, count]) => (
                        <div key={jobRole} className="flex items-center justify-between text-xs p-1.5 bg-white border border-[#e8eef6] rounded-lg hover:border-[#b8c6d9] transition">
                          <span className="font-bold text-[#4a5568] truncate pr-2" title={jobRole}>{jobRole}</span>
                          <span className="shrink-0 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                            {count as number} vị trí
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border border-[#b8c6d9] rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[350px] main-scrollbar">
                <table className="min-w-[3000px] text-left text-xs table-fixed">
                  <thead className="bg-[#e8eef6] text-[#4a5568] font-bold uppercase tracking-wider sticky top-0 border-b border-[#b8c6d9] z-10">
                    <tr>
                      <th className="p-3 w-32">Số hiệu viên chức</th>
                      <th className="p-3 w-48">Họ và Tên</th>
                      <th className="p-3 w-64">Email dự kiến</th>
                      <th className="p-3 w-20">Giới tính</th>
                      <th className="p-3 w-28">Ngày sinh</th>
                      <th className="p-3 w-32">Số CCCD</th>
                      <th className="p-3 w-64">Địa chỉ thường trú</th>
                      <th className="p-3 w-32">Số điện thoại</th>
                      <th className="p-3 w-28">Đảng (Dự bị)</th>
                      <th className="p-3 w-28">Đảng (Chính thức)</th>
                      <th className="p-3 w-32">Trình độ LLCT</th>
                      <th className="p-3 w-36">Trình độ đào tạo</th>
                      <th className="p-3 w-48">Chuyên ngành</th>
                      <th className="p-3 w-36">Môn giảng dạy</th>
                      <th className="p-3 w-48">Vị trí việc làm</th>
                      <th className="p-3 w-48">Chức vụ / Chức danh</th>
                      <th className="p-3 w-48">Tổ chuyên môn</th>
                      <th className="p-3 w-48">Hình thức hợp đồng</th>
                      <th className="p-3 w-36">Trạng thái công tác</th>
                      <th className="p-3 w-56">Chức danh nghề nghiệp</th>
                      <th className="p-3 w-24">Bậc lương</th>
                      <th className="p-3 w-24">Hệ số lương</th>
                      <th className="p-3 w-28">% PC Thâm niên</th>
                      <th className="p-3 w-28">% PC Ưu đãi</th>
                      <th className="p-3 w-28">Trạng thái tệp</th>
                      <th className="p-3 w-64">Chẩn đoán lỗi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce4ee] bg-white">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className={`hover:bg-[#f5f8fc] ${row.errors.length > 0 ? 'bg-red-50/50' : ''}`}>
                        <td className="p-3 font-mono font-bold text-gray-600 truncate">{row.id}</td>
                        <td className="p-3 font-bold text-[#1e2a3a] truncate">{row.name}</td>
                        <td className="p-3 text-emerald-800 font-bold font-mono truncate" title={row.email}>{row.email}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.gender}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.dob}</td>
                        <td className="p-3 text-gray-500 font-medium font-mono truncate">{row.cccd}</td>
                        <td className="p-3 text-gray-500 font-medium truncate" title={row.address}>{row.address}</td>
                        <td className="p-3 text-gray-500 font-medium font-serif truncate">{row.phone}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.partyJoinDateReserved}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.partyJoinDateOfficial}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.politicalTheory}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.educationLevel}</td>
                        <td className="p-3 text-gray-500 font-medium truncate" title={row.major}>{row.major}</td>
                        <td className="p-3 font-bold text-[#2c5ea0] truncate">{row.mainSubject}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.jobRole}</td>
                        <td className="p-3 font-bold text-[#4a5568] truncate">{row.role}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">
                          {row.department} {row.department && `(${currentStaff.filter(s => s.department === row.department && s.status !== 'Bình Chỉ / Khóa').length} người)`}
                        </td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.contractType}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.workStatus}</td>
                        <td className="p-3 text-gray-500 font-medium truncate" title={row.professionalTitle}>{row.professionalTitle}</td>
                        <td className="p-3 text-gray-500 font-medium truncate">{row.salaryGrade}</td>
                        <td className="p-3 text-gray-500 font-medium font-serif truncate">{row.salaryFactor}</td>
                        <td className="p-3 text-gray-500 font-medium font-serif truncate">{row.seniorityAllowance}</td>
                        <td className="p-3 text-gray-500 font-medium font-serif truncate">{row.preferentialAllowance}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            row.errors.length > 0 ? 'bg-red-100 text-red-800' :
                            row.isUpdate ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {row.errors.length > 0 ? 'Lỗi' : row.isUpdate ? 'Cập nhật' : 'Mới'}
                          </span>
                        </td>
                        <td className="p-3 text-red-600 font-bold truncate" title={row.errors.join("; ")}>
                          {row.errors.length > 0 ? row.errors.join("; ") : "✓ Hợp lệ"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {validationError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-900 rounded-2xl flex items-center gap-3 text-xs">
            <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
            <p className="font-bold">{validationError}</p>
          </div>
        )}
      </div>
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center shrink-0">
        <button 
          onClick={onClose} 
          disabled={loading}
          className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition disabled:opacity-50"
        >
          Hủy bỏ
        </button>
        {file && (
          <button 
            onClick={handleImport}
            disabled={loading || totalErrors > 0 || parsedRows.length === 0}
            className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang xử lý nhập..." : `Tiến hành nhập (${parsedRows.length} dòng)`}
          </button>
        )}
      </div>
    </ModalBase>
  );
};

