import React, { useState, useEffect } from 'react';
import { BaseSelect } from './BaseInputs';
import { ModalBase } from './Modals';
import { Save, Plus, Trash2, X, Download, Upload, Users, BookOpen } from 'lucide-react';
import { getStaffList, Staff } from '../../services/hrService';
import { getStudents, updateStudent, Student } from '../../services/studentService';
import { getClasses, ClassData, getRooms, getDepartments, Department } from '../../services/dbService';

export const ClassModal = ({ 
  isOpen, 
  onClose, 
  mode = 'edit', 
  classData, 
  onSave 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mode?: 'read' | 'edit';
  classData?: ClassData;
  onSave?: (updatedData: ClassData) => void;
}) => {
  const [tab, setTab] = useState<'info' | 'students'>('info');

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('Nhà trẻ');
  const [academicYear, setAcademicYear] = useState(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('active_academic_year_name') : null;
    return stored ? stored.replace(/^Năm học\s+/i, '').trim() : '2025 - 2026';
  });
  const [status, setStatus] = useState('Đang hoạt động');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');
  const [capacity, setCapacity] = useState('35');
  const [currentCount, setCurrentCount] = useState('42');

  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [nameModified, setNameModified] = useState(false);

  // Extract Year Prefix (e.g. '2025 - 2026' -> '2526')
  const getYearPrefix = (yearStr: string) => {
    const match = yearStr.match(/(\d{4})\s*-\s*(\d{4})/);
    if (match) {
      return match[1].slice(-2) + match[2].slice(-2);
    }
    const matchYears = yearStr.match(/\d{4}/g);
    if (matchYears && matchYears.length >= 2) {
      return matchYears[0].slice(-2) + matchYears[1].slice(-2);
    } else if (matchYears && matchYears.length === 1) {
      const yr = parseInt(matchYears[0], 10);
      return String(yr).slice(-2) + String(yr + 1).slice(-2);
    }
    return '2526';
  };

  // Calculate next sequential class name (e.g., 'Nhà trẻ 3' if 'Nhà trẻ 1' & 'Nhà trẻ 2' exist)
  const getNextClassName = (targetGrade: string, targetYear: string, list: ClassData[]) => {
    const filtered = list.filter(c => c.grade === targetGrade && c.academicYear === targetYear);
    
    let maxNum = 0;
    const pattern = new RegExp(`^${targetGrade}\\s*(\\d+)$`);
    
    filtered.forEach(c => {
      const match = c.name.match(pattern);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    });
    
    return `${targetGrade} ${maxNum + 1}`;
  };

  // Load all classes from DB on open to compute sequential names/IDs
  useEffect(() => {
    if (isOpen) {
      setLoadingClasses(true);
      getClasses().then(list => {
        setClassesList(list || []);
      }).catch(err => {
        console.error("Failed to load classes in ClassModal:", err);
      }).finally(() => {
        setLoadingClasses(false);
      });
    } else {
      setClassesList([]);
    }
  }, [isOpen]);

  // Reset modification tracker when closed or when grade dropdown changes
  useEffect(() => {
    if (!isOpen) {
      setNameModified(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!classData && isOpen) {
      setNameModified(false);
    }
  }, [grade]);

  // Auto-generate name and ID for new classes when year, grade, or classes list changes
  useEffect(() => {
    if (!classData && isOpen && !loadingClasses && !nameModified) {
      const defaultName = getNextClassName(grade, academicYear, classesList);
      setName(defaultName);
      const yrPrefix = getYearPrefix(academicYear);
      const idSafeName = defaultName.replace(/\s+/g, '');
      setId(`LH-${yrPrefix}-${idSafeName}`);
    }
  }, [grade, academicYear, classesList, classData, isOpen, loadingClasses, nameModified]);

  // Synchronize ID year prefix when academicYear changes, keeping custom names if modified
  useEffect(() => {
    if (!classData && isOpen) {
      const yrPrefix = getYearPrefix(academicYear);
      const cleanName = name.trim().toUpperCase().replace(/\s+/g, '');
      if (cleanName) {
        setId(`LH-${yrPrefix}-${cleanName}`);
      } else {
        setId(`LH-${yrPrefix}`);
      }
    }
  }, [academicYear]);

  const [rawStaffList, setRawStaffList] = useState<Staff[]>([]);
  const [departmentsList, setDepartmentsList] = useState<Department[]>([]);

  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [showAddStudentSelector, setShowAddStudentSelector] = useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [studentRoles, setStudentRoles] = useState<Record<string, string>>({});

  const [roomsList, setRoomsList] = useState<{value: string, label: string, type: string}[]>([]);

  useEffect(() => {
    if (isOpen) {
      getStaffList().then(list => {
        if (list && list.length > 0) {
          setRawStaffList(list);
        }
      }).catch(err => console.error("Failed to load staff list in ClassModal:", err));

      getDepartments().then(list => {
        if (list && list.length > 0) {
          setDepartmentsList(list);
        }
      }).catch(err => console.error("Failed to load departments list in ClassModal:", err));

      getRooms().then(list => {
        if (list && list.length > 0) {
          setRoomsList(list.map(r => ({ value: r.name, label: r.name, type: r.type })));
        }
      }).catch(err => console.error("Failed to load rooms list in ClassModal:", err));
    }
  }, [isOpen]);

  // Lọc danh sách giáo viên đủ điều kiện làm chủ nhiệm dựa trên khối lớp đang chọn
  const eligibleTeachers = React.useMemo(() => {
    // 1. Tìm các tổ chuyên môn (loại 'Tổ khối lớp') phụ trách khối lớp hiện tại
    const targetDepts = departmentsList.filter(d => 
      d.type === 'Tổ khối lớp' && 
      d.applicableGrades?.includes(grade)
    );
    const targetDeptNames = targetDepts.map(d => d.name);

    return rawStaffList.filter(s => {
      // Điều kiện 1: Phải thuộc tổ khối lớp phụ trách khối đó
      const belongsToTargetDept = targetDeptNames.includes(s.department || '');
      if (!belongsToTargetDept) return false;

      // Điều kiện 2: Không phải là cán bộ quản lý / Ban Giám hiệu
      const roleLower = (s.role || '').toLowerCase();
      const deptLower = (s.department || '').toLowerCase();
      const isManagerOrBgh = 
        deptLower.includes('ban giám hiệu') ||
        deptLower.includes('ban giam hieu') ||
        roleLower.includes('hiệu trưởng') ||
        roleLower.includes('hieu truong') ||
        roleLower.includes('hiệu phó') ||
        roleLower.includes('hieu pho') ||
        roleLower.includes('quản lý') ||
        roleLower.includes('quan ly') ||
        roleLower.includes('tổng phụ trách') ||
        roleLower.includes('tong phu trach');
      
      if (isManagerOrBgh) return false;

      // Điều kiện 3: Không phải là tổ trưởng chuyên môn
      const isDeptHead = 
        departmentsList.some(d => d.head === s.name) ||
        roleLower.includes('tổ trưởng') ||
        roleLower.includes('to truong');
      
      if (isDeptHead) return false;

      return true;
    });
  }, [rawStaffList, departmentsList, grade]);

  useEffect(() => {
    if (isOpen && classData) {
      setLoadingStudents(true);
      getStudents()
        .then(list => {
          setAllStudents(list);
          const classStudents = list.filter(s => s.grade === classData.name);
          setStudentsList(classStudents);
          setCurrentCount(String(classStudents.length));
        })
        .catch(err => console.error("Failed to load students in ClassModal:", err))
        .finally(() => setLoadingStudents(false));
    } else {
      setStudentsList([]);
      setAllStudents([]);
      setShowAddStudentSelector(false);
      setSelectedStudentToAdd('');
    }
  }, [isOpen, classData]);

  useEffect(() => {
    if (studentsList.length > 0) {
      setStudentRoles(prev => {
        const next = { ...prev };
        studentsList.forEach((hs, idx) => {
          if (!next[hs.id]) {
            next[hs.id] = hs.classRole || 'Trẻ';
          }
        });
        return next;
      });
    }
  }, [studentsList]);

  useEffect(() => {
    if (classData) {
      setId(classData.id);
      setName(classData.name);
      setGrade(String(classData.grade));
      setAcademicYear(classData.academicYear);
      setStatus(classData.status);
      setRoom(classData.room);
      setTeacher(classData.teacher);
      setCapacity(String(classData.capacity));
      setCurrentCount(String(classData.currentCount));
    } else {
      setId(`LH-${Date.now().toString().slice(-4)}`);
      setName('');
      setGrade('1');
      const headerYr = typeof window !== 'undefined' && localStorage.getItem('active_academic_year_name')
        ? localStorage.getItem('active_academic_year_name')!.replace(/^Năm học\s+/i, '').trim()
        : '2025 - 2026';
      setAcademicYear(headerYr);
      setStatus('Đang hoạt động');
      setRoom('');
      setTeacher('');
      setCapacity('35');
      setCurrentCount('0');
    }
  }, [classData, isOpen]);

  const handleSave = async () => {
    if (mode === 'read') return;
    
    // Save student roles to database
    try {
      await Promise.all(
        studentsList.map(hs => {
          const role = studentRoles[hs.id] || 'Học sinh';
          if (hs.classRole !== role) {
            return updateStudent(hs.id, { classRole: role });
          }
          return Promise.resolve();
        })
      );
    } catch (err) {
      console.error("Failed to save student roles in ClassModal:", err);
    }

    if (onSave) {
      onSave({
        id,
        name,
        grade: Number(grade),
        academicYear,
        status,
        topic: '',
        room,
        teacher,
        capacity: Number(capacity),
        currentCount: Number(currentCount)
      });
    }
    onClose();
  };

  const handleAddStudentSubmit = async () => {
    if (!selectedStudentToAdd || !classData) return;
    const targetStudent = allStudents.find(s => s.id === selectedStudentToAdd);
    if (!targetStudent) return;
    try {
      await updateStudent(targetStudent.id, { grade: classData.name });
      
      const updatedStudent = { ...targetStudent, grade: classData.name };
      setStudentsList(prev => [...prev, updatedStudent]);
      setAllStudents(prev => prev.map(s => s.id === targetStudent.id ? updatedStudent : s));
      setCurrentCount(String(studentsList.length + 1));
      
      setShowAddStudentSelector(false);
      setSelectedStudentToAdd('');
    } catch (err) {
      console.error("Failed to add student to class:", err);
      alert("Không thể thêm học sinh vào lớp học.");
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    const targetStudent = studentsList.find(s => s.id === studentId);
    if (!targetStudent) return;
    if (window.confirm(`Bạn có chắc chắn muốn cho học sinh ${targetStudent.name} rời lớp học này?`)) {
      try {
        await updateStudent(studentId, { grade: '' });
        
        setStudentsList(prev => prev.filter(s => s.id !== studentId));
        setAllStudents(prev => prev.map(s => s.id === studentId ? { ...s, grade: '' } : s));
        setCurrentCount(String(studentsList.length - 1));
      } catch (err) {
        console.error("Failed to remove student from class:", err);
        alert("Không thể xóa học sinh khỏi lớp.");
      }
    }
  };

  const maleCount = studentsList.filter(s => s.gender === 'Nam').length;
  const femaleCount = studentsList.filter(s => s.gender === 'Nữ').length;
  const activeStudents = studentsList.filter(s => s.status === 'Đang Học').length;
  const reservedStudents = studentsList.filter(s => s.status === 'Bảo Lưu').length;
  const suspendedStudents = studentsList.filter(s => s.status === 'Đình Chỉ').length;
  const malePercentage = studentsList.length > 0 ? Math.round((maleCount / studentsList.length) * 100) : 0;
  const femalePercentage = studentsList.length > 0 ? 100 - malePercentage : 0;

  return (
    <ModalBase 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'read' ? `Chi Tiết Lớp Học ${name || id}` : `Cấu Hình Lớp ${name || id}`} 
      subtitle="Thiết lập hành chính, phòng học & danh sách học sinh" 
      width="max-w-4xl"
      fixedHeight
    >
      <div className="flex border-b border-[#b8c6d9] bg-[#e8eef6] px-8 pt-4 space-x-8 text-sm font-bold uppercase tracking-widest text-[#7b8a9e]">
        <button 
          id="btn-tab-info"
          className={`pb-4 px-2 border-b-2 transition-colors ${tab === 'info' ? 'border-[#2c5ea0] text-[#2c5ea0]' : 'border-transparent hover:text-[#4a5568]'}`}
          onClick={() => setTab('info')}
        >
          Hồ Sơ Lớp Học
        </button>
        {classData && (
          <button 
            id="btn-tab-students"
            className={`pb-4 px-2 border-b-2 transition-colors ${tab === 'students' ? 'border-[#2c5ea0] text-[#2c5ea0]' : 'border-transparent hover:text-[#4a5568]'}`}
            onClick={() => setTab('students')}
          >
            Danh Sách Học Sinh
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-8">
        {tab === 'info' && (
          mode === 'read' ? (
            <div className="space-y-6">
              {/* Header card with background highlights */}
              <div className="bg-[#e8eef6] border border-[#b8c6d9] p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">
                    Mã Lớp Học: {id} • Khối {grade}
                  </span>
                  <h4 className="text-3xl font-serif font-bold text-[#1e2a3a] mt-1">Lớp {name}</h4>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <span className="inline-flex items-center px-3.5 py-1.5 bg-white border border-[#b8c6d9] rounded-full text-[10px] font-bold text-[#4a5568] uppercase tracking-widest shadow-sm">
                    Năm học: {academicYear}
                  </span>
                  <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm ${
                    status === 'Đang hoạt động' ? 'bg-[#2e6b8a] text-[#f5f8fc]' : 'bg-[#2c5ea0] text-[#f5f8fc]'
                  }`}>
                    {status}
                  </span>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Giáo viên chủ nhiệm */}
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between">
                  <div>
                    <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                      <Users className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                      Giáo viên chủ nhiệm
                    </h5>
                    {teacher ? (
                      <div className="flex items-center gap-4 py-2">
                        <div className="w-12 h-12 bg-[#2c5ea0] text-[#f5f8fc] font-bold font-serif text-lg rounded-full flex items-center justify-center shadow-sm">
                          {teacher.split(' ').slice(-1)[0][0]}
                        </div>
                        <div>
                          <p className="font-bold text-base text-[#1e2a3a]">{teacher}</p>
                          <p className="text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider mt-0.5">Giáo viên chủ nhiệm</p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Chưa phân công giáo viên</div>
                    )}
                  </div>
                </div>

                {/* 2. Phòng học cố định */}
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col justify-between">
                  <div>
                    <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1.5 text-[#2e6b8a]" />
                      Phòng học cố định
                    </h5>
                    {room ? (
                      <div className="py-2">
                        <p className="font-mono font-bold text-2xl text-[#2e6b8a]">{room}</p>
                        <p className="text-[10px] text-[#7b8a9e] font-medium mt-1">Phòng sinh hoạt lớp chính thức</p>
                      </div>
                    ) : (
                      <div className="text-sm font-medium text-[#7b8a9e] italic py-2">Chưa phân công phòng học</div>
                    )}
                  </div>
                </div>

                {/* 3. Sĩ số học sinh */}
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee]">
                  <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-[#4a5568]" />
                    Sĩ số học sinh
                  </h5>
                  <div className="py-1">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-serif font-bold text-[#2c5ea0]">{currentCount}</span>
                      <span className="text-xs text-[#7b8a9e] font-medium">/ {capacity} học sinh</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#e8eef6] h-2.5 rounded-full mt-3 overflow-hidden border border-[#b8c6d9]">
                      <div 
                        className="bg-[#2e6b8a] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (Number(currentCount) / Number(capacity)) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider">
                      <span>Độ lấp đầy</span>
                      <span>{Math.round((Number(currentCount) / Number(capacity)) * 100)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demographics & Statistics */}
              {studentsList.length > 0 && (
                <div className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4">
                  <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                    Phân tích cơ cấu lớp học
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Tỷ lệ giới tính */}
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center text-xs font-bold text-[#4a5568]">
                        <span>Cơ cấu giới tính</span>
                        <div className="flex gap-4">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2e6b8a]"></span> Nam: {maleCount} ({malePercentage}%)</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2c5ea0]"></span> Nữ: {femaleCount} ({femalePercentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-[#e8eef6] h-4 rounded-full overflow-hidden border border-[#b8c6d9] flex">
                        <div 
                          className="bg-[#2e6b8a] h-full transition-all duration-500" 
                          style={{ width: `${malePercentage}%` }}
                          title={`Nam: ${malePercentage}%`}
                        ></div>
                        <div 
                          className="bg-[#2c5ea0] h-full transition-all duration-500" 
                          style={{ width: `${femalePercentage}%` }}
                          title={`Nữ: ${femalePercentage}%`}
                        ></div>
                      </div>
                    </div>

                    {/* Trạng thái học sinh */}
                    <div className="space-y-2.5">
                      <span className="block text-xs font-bold text-[#4a5568]">Trạng thái học tập</span>
                      <div className="flex gap-3">
                        <div className="flex-1 bg-[#e5f0e8] border border-[#2e6b8a]/20 p-2 rounded-xl text-center">
                          <p className="text-[10px] font-bold text-[#2e6b8a] uppercase tracking-wider">Đang Học</p>
                          <p className="text-lg font-bold text-[#2e6b8a] mt-0.5">{activeStudents}</p>
                        </div>
                        <div className="flex-1 bg-[#fbf8f3] border border-[#b8c6d9] p-2 rounded-xl text-center">
                          <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Bảo Lưu</p>
                          <p className="text-lg font-bold text-[#4a5568] mt-0.5">{reservedStudents}</p>
                        </div>
                        <div className="flex-1 bg-[#fee2e2] border border-[#2c5ea0]/20 p-2 rounded-xl text-center">
                          <p className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider">Đình Chỉ</p>
                          <p className="text-lg font-bold text-[#2c5ea0] mt-0.5">{suspendedStudents}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Informative box */}
              <div className="p-5 border border-[#b8c6d9] rounded-2xl bg-[#f5f8fc] text-[#7b8a9e] text-xs shadow-inner">
                <h5 className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Thông tin quản trị</h5>
                <p className="leading-relaxed font-medium">
                  Hồ sơ lớp học được lưu trữ an toàn trong cơ sở dữ liệu. Mọi thay đổi liên quan đến cấu trúc hành chính, phân công phòng học hoặc điều chuyển Giáo viên chủ nhiệm cần được thực hiện qua chế độ **"Chỉnh sửa cấu hình"** hoặc trong mục phân công cán bộ chung của nhà trường.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <section>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2"/> 1. Thông Tin Cơ Bản & Hành Chính
                </h4>
                <div className="grid grid-cols-2 gap-6 bg-[#f5f8fc] p-6 border border-[#b8c6d9] rounded-2xl">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="class-id-input">Mã lớp học (Primary Key)*</label>
                    <input 
                      id="class-id-input"
                      type="text" 
                      value={id} 
                      onChange={e => setId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                      disabled 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <BaseSelect
                        label="Khối học"
                        required
                        value={grade}
                        options={[
                          {value: 'Nhà trẻ', label: 'Nhà trẻ (3-24 tháng)'}, 
                          {value: 'Mầm', label: 'Khối Mầm (3-4 tuổi)'}, 
                          {value: 'Chồi', label: 'Khối Chồi (4-5 tuổi)'}, 
                          {value: 'Lá', label: 'Khối Lá (5-6 tuổi)'}
                        ]}
                        disabled={false}
                        onChange={setGrade}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="class-name-input">Tên lớp học *</label>
                      <input 
                        id="class-name-input"
                        type="text" 
                        value={name} 
                        disabled={false}
                        onChange={e => {
                          const val = e.target.value;
                          setName(val);
                          if (!classData) {
                            setNameModified(true);
                            const yrPrefix = getYearPrefix(academicYear);
                            const cleanVal = val.trim().toUpperCase().replace(/\s+/g, '');
                            if (cleanVal) {
                              setId(`LH-${yrPrefix}-${cleanVal}`);
                            } else {
                              setId(`LH-${yrPrefix}`);
                            }
                          }
                        }}
                        className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none focus:border-[#2c5ea0]" 
                      />
                    </div>
                  </div>
                  <div>
                    <BaseSelect
                      label="Mã Năm Học"
                      required
                      value={academicYear}
                      options={[
                        { value: academicYear, label: academicYear },
                        { value: '2025 - 2026', label: '2025 - 2026' }, 
                        { value: '2024 - 2025', label: '2024 - 2025' }
                      ].filter((item, idx, self) => self.findIndex(t => t.value === item.value) === idx)}
                      disabled={true}
                      onChange={setAcademicYear}
                    />
                  </div>
                  <div>
                    <BaseSelect
                      label="Trạng Thái Lớp"
                      value={status}
                      options={[
                        {value: 'Đang hoạt động', label: 'Đang hoạt động'}, 
                        {value: 'Ngưng hoạt động', label: 'Ngưng hoạt động'}
                      ]}
                      disabled={false}
                      onChange={setStatus}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
                  <Users className="w-4 h-4 mr-2"/> 2. Nhân Sự Quản Lý, Phòng Học & Sĩ Số
                </h4>
                <div className="grid grid-cols-2 gap-6 bg-[#f5f8fc] p-6 border border-[#b8c6d9] rounded-2xl">
                  <div>
                    <BaseSelect
                      label="Giáo Viên Chủ Nhiệm"
                      required
                      value={teacher}
                      options={[
                        // Đảm bảo giáo viên chủ nhiệm hiện tại của lớp luôn xuất hiện trong danh sách lựa chọn
                        ...(teacher && !eligibleTeachers.some(t => t.name === teacher) 
                          ? [{ value: teacher, label: `${teacher} (GV Chủ nhiệm hiện tại)` }] 
                          : []
                        ),
                        ...eligibleTeachers.map(t => ({ 
                          value: t.name, 
                          label: `${t.name} (${t.role || 'Giáo viên'} - ${t.department})` 
                        }))
                      ].filter((item, idx, self) => {
                        // Khử trùng lặp
                        if (self.findIndex(t => t.value === item.value) !== idx) return false;
                        // Giữ lại giáo viên chủ nhiệm hiện tại của lớp
                        if (item.value === teacher) return true;
                        // Loại bỏ giáo viên đã làm chủ nhiệm lớp khác
                        const usedTeachers = classesList
                          .filter(c => c.id !== (classData?.id ?? ''))
                          .map(c => c.teacher)
                          .filter(Boolean);
                        return !usedTeachers.includes(item.value);
                      })}
                      disabled={false}
                      onChange={setTeacher}
                    />
                  </div>
                  <div>
                    <BaseSelect
                      label="Phòng học Cố định"
                      value={room}
                      options={roomsList.filter((item, idx, self) => {
                        // Chỉ hiển thị các loại phòng học chuẩn hoặc phòng học hiện tại của lớp
                        const isStandard = 
                          item.type === 'Phòng học chuẩn' || 
                          item.type === 'Lớp Học Chuẩn' || 
                          item.type === 'Phòng học lý thuyết' || 
                          item.type === 'Phòng học lý thuyết (Phòng học cơ bản)';
                        
                        if (!isStandard && item.value !== room) return false;

                        // Deduplicate
                        if (self.findIndex(r => r.value === item.value) !== idx) return false;
                        // Keep the current class's room so it stays selectable
                        if (item.value === room) return true;
                        // Exclude rooms already assigned to other classes
                        const usedRooms = classesList
                          .filter(c => c.id !== (classData?.id ?? ''))
                          .map(c => c.room)
                          .filter(Boolean);
                        return !usedRooms.includes(item.value);
                      })}
                      disabled={false}
                      onChange={setRoom}
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="class-capacity-input">Sĩ số tối đa</label>
                      <input 
                        id="class-capacity-input"
                        type="number" 
                        value={capacity} 
                        disabled={false}
                        onChange={e => setCapacity(e.target.value)}
                        className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] focus:outline-none focus:border-[#2c5ea0]" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="class-current-count-input">Sĩ số hiện tại</label>
                      <input 
                        id="class-current-count-input"
                        type="text" 
                        value={currentCount} 
                        disabled 
                        className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#7b8a9e] italic" 
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )
        )}

        {tab === 'students' && classData && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
               <div>
                 <h4 className="text-sm font-bold text-[#1e2a3a]">Danh Sách Học Sinh (Chi Tiết Lớp)</h4>
                 <p className="text-xs font-medium text-[#7b8a9e] mt-1">Được lấy từ dữ liệu học sinh thực tế trong hệ thống</p>
               </div>
               <div className="flex gap-2">
                 {mode === 'edit' && (
                   <button 
                     onClick={() => setShowAddStudentSelector(prev => !prev)}
                     className="px-4 py-2 bg-[#1e2a3a] text-white rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-[#131a25] transition-colors flex items-center shadow-[1px_1px_0px_#4a5568]"
                   >
                     <Plus className="w-4 h-4 mr-2" />
                     {showAddStudentSelector ? "Đóng chọn HS" : "Thêm Học Sinh"}
                   </button>
                 )}
               </div>
            </div>
            
            {showAddStudentSelector && (
              <div className="bg-[#e8eef6] p-4 rounded-xl border border-[#b8c6d9] mb-4 flex gap-4 items-end animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Chọn học sinh cần thêm</label>
                  <BaseSelect
                    value={selectedStudentToAdd}
                    options={allStudents
                      .filter(s => s.grade !== classData.name)
                      .map(s => ({
                        value: s.id,
                        label: `${s.name} (${s.id}${s.grade ? ` - Lớp: ${s.grade}` : ' - Chưa có lớp'})`
                      }))
                    }
                    onChange={setSelectedStudentToAdd}
                    placeholder="-- Chọn học sinh --"
                  />
                </div>
                <button 
                  onClick={handleAddStudentSubmit}
                  className="px-4 py-2.5 bg-[#2e6b8a] text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#1e4f6a] transition-colors"
                >
                  Xác nhận
                </button>
                <button 
                  onClick={() => { setShowAddStudentSelector(false); setSelectedStudentToAdd(''); }}
                  className="px-4 py-2.5 bg-white border border-[#b8c6d9] text-[#4a5568] text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-[#e8eef6] transition-colors"
                >
                  Hủy
                </button>
              </div>
            )}

            <div className="border border-[#b8c6d9] rounded-xl overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead className="bg-[#e8eef6] border-b border-[#b8c6d9]">
                   <tr>
                     <th className="p-3 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Mã HS</th>
                     <th className="p-3 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Họ & Tên</th>
                     <th className="p-3 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Chức vụ lớp</th>
                     <th className="p-3 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Thông tin</th>
                     <th className="p-3 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Trạng thái</th>
                     {mode === 'edit' && <th className="p-3 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest text-right">Lưu vết</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[#dce4ee] bg-white">
                   {loadingStudents ? (
                     <tr>
                       <td colSpan={mode === 'edit' ? 6 : 5} className="p-8 text-center text-sm font-bold text-[#7b8a9e]">
                         Đang tải danh sách học sinh...
                       </td>
                     </tr>
                   ) : studentsList.length === 0 ? (
                     <tr>
                       <td colSpan={mode === 'edit' ? 6 : 5} className="p-8 text-center text-sm font-bold text-[#7b8a9e] italic">
                         Lớp học chưa có học sinh nào.
                       </td>
                     </tr>
                   ) : (
                     studentsList.map((hs) => (
                       <tr key={hs.id} className="hover:bg-[#f5f8fc] transition-colors">
                         <td className="p-3 text-xs font-bold text-[#7b8a9e] font-mono">{hs.id}</td>
                         <td className="p-3 text-sm font-bold text-[#1e2a3a]">{hs.name}</td>
                           <td className="p-3">
                             {mode === 'read' ? (
                               <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                 studentRoles[hs.id] === 'Lớp trưởng' ? 'bg-[#2c5ea0] text-white shadow-sm' :
                                 studentRoles[hs.id] === 'Bí thư' ? 'bg-[#2e6b8a] text-white shadow-sm' :
                                 studentRoles[hs.id] && studentRoles[hs.id].startsWith('Lớp phó') ? 'bg-[#a8c4e0] text-[#1e2a3a] border border-[#8e9eb4]' :
                                 studentRoles[hs.id] === 'Tổ trưởng' ? 'bg-[#e8eef6] border border-[#b8c6d9] text-[#4a5568]' :
                                 'text-[#7b8a9e] font-medium'
                               }`}>
                                 {studentRoles[hs.id] || 'Học sinh'}
                               </span>
                             ) : (
                               <div className="w-36">
                                 <BaseSelect
                                   value={studentRoles[hs.id] || 'Học sinh'}
                                   options={[
                                     {value: 'Lớp trưởng', label: 'Lớp trưởng'}, 
                                     {value: 'Lớp phó học tập', label: 'Lớp phó học tập'}, 
                                     {value: 'Lớp phó văn nghệ', label: 'Lớp phó văn nghệ'}, 
                                     {value: 'Lớp phó lao động', label: 'Lớp phó lao động'}, 
                                     {value: 'Bí thư', label: 'Bí thư'}, 
                                     {value: 'Tổ trưởng', label: 'Tổ trưởng'}, 
                                     {value: 'Học sinh', label: 'Học sinh'}
                                   ]}
                                   disabled={false}
                                   onChange={(val) => setStudentRoles(prev => ({ ...prev, [hs.id]: val }))}
                                   wrapperClassName="w-full"
                                 />
                               </div>
                             )}
                           </td>
                         <td className="p-3 text-xs font-medium text-[#4a5568]">{hs.dob} - {hs.gender}</td>
                         <td className="p-3">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                             hs.status === 'Đang Học' ? 'bg-[#e5f0e8] text-[#2e6b8a]' : 'bg-[#a8c4e0] text-[#1e2a3a]'
                           }`}>{hs.status}</span>
                         </td>
                         {mode === 'edit' && (
                           <td className="p-3 text-right">
                             <button 
                               onClick={() => handleRemoveStudent(hs.id)}
                               className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest hover:underline"
                             >
                               Rời Lớp
                             </button>
                           </td>
                         )}
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 pt-4 border-t border-dashed border-[#b8c6d9] bg-[#f5f8fc] flex justify-between items-center rounded-b-3xl shrink-0">
        <button onClick={onClose} id="btn-close-class-modal" className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        {mode === 'edit' && (
          <button onClick={handleSave} id="btn-save-class-modal" className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition-all">
            <Save className="w-4 h-4 mr-2" /> Lưu Cấu Hình
          </button>
        )}
      </div>
    </ModalBase>
  );
};
