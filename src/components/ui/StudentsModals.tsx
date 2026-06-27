import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { ChevronRight, ChevronLeft, User, FileText, CheckCircle2, Shield, Clock, BookOpen, Home, Users, CheckSquare, ListChecks, ArrowRight, Award, Upload, AlertTriangle, Loader2, Download, X, CheckCheck } from 'lucide-react';
import { ModalBase } from './Modals';
import { getStudents, batchCreateStudents, Student, createStudent } from '../../services/studentService';
import { getClasses, saveClassOnly, ClassData } from '../../services/dbService';
import { ReportCardData } from './PrintableReportCard';
import { saveReportCard, getReportCard, ReportCardDocument, ReportCardSummary } from '../../services/reportCardService';
import { useUserRole } from '../../utils/role';


/* --- 1. STUDENT WIZARD MODAL (Hồ sơ & Lý lịch) --- */
export const StudentWizardModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess?: () => void }) => {
  const [step, setStep] = useState(1);
  const [studentName, setStudentName] = useState('');
  const [nickname, setNickname] = useState('');
  const [gradeLevel, setGradeLevel] = useState('Nhà trẻ'); // Nhà trẻ | Mầm | Chồi | Lá
  const [gender, setGender] = useState('Nữ');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  
  // Health & Physiology
  const [bloodType, setBloodType] = useState('O');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');

  // Parent & Guardian details
  const [parentFather, setParentFather] = useState('');
  const [parentFatherPhone, setParentFatherPhone] = useState('');
  const [parentMother, setParentMother] = useState('');
  const [parentMotherPhone, setParentMotherPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');

  // Authorized pickup details
  const [pickupName, setPickupName] = useState('');
  const [pickupPhone, setPickupPhone] = useState('');
  const [pickupRelation, setPickupRelation] = useState('');

  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [assignedClass, setAssignedClass] = useState('Chưa xếp lớp');

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setStudentName('');
      setNickname('');
      setGender('Nữ');
      setDob('');
      setAddress('');
      setBloodType('O');
      setHeightCm('');
      setWeightKg('');
      setAllergies('');
      setMedicalHistory('');
      setParentFather('');
      setParentFatherPhone('');
      setParentMother('');
      setParentMotherPhone('');
      setGuardianName('');
      setGuardianPhone('');
      setGuardianRelation('');
      setPickupName('');
      setPickupPhone('');
      setPickupRelation('');

      getStudents().then(data => {
        setStudentsList(data || []);
      }).catch(err => {
        console.error("Failed to fetch students in wizard modal:", err);
      });

      getClasses().then(data => {
        setClassesList(data || []);
      }).catch(err => {
        console.error("Failed to fetch classes in wizard modal:", err);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    // Automatically match class names that belong to the selected grade level
    const filtered = classesList.filter(c => c.grade.includes(gradeLevel) && c.status === 'Đang hoạt động');
    if (filtered.length > 0) {
      setAssignedClass(filtered[0].name);
    } else {
      setAssignedClass('Chưa xếp lớp');
    }
  }, [gradeLevel, classesList]);

  const getFilteredClassesOptions = () => {
    const filtered = classesList.filter(c => c.grade.includes(gradeLevel) && c.status === 'Đang hoạt động');
    if (filtered.length === 0) {
      return [{ value: 'Chưa xếp lớp', label: 'Chưa có lớp học' }];
    }
    return filtered.map(c => ({ value: c.name, label: c.name }));
  };

  // Helper to extract system active year
  const getSystemAcademicYear = (): number => {
    const stored = localStorage.getItem('active_academic_year_name');
    if (stored) {
      const match = stored.match(/\d{4}/);
      if (match) {
        return parseInt(match[0], 10);
      }
    }
    return 2025; // fallback
  };

  const [currentYear, setCurrentYear] = useState(() => getSystemAcademicYear());

  useEffect(() => {
    const handleTermChange = () => {
      setCurrentYear(getSystemAcademicYear());
    };
    window.addEventListener('term-changed', handleTermChange);
    return () => window.removeEventListener('term-changed', handleTermChange);
  }, []);

  const getStaticStudentId = () => {
    const year = currentYear;
    let maxSeq = 0;
    studentsList.forEach(s => {
      if (s.id && s.id.startsWith(`MN${year}.`)) {
        const seqVal = parseInt(s.id.split('.')[1], 10);
        if (!isNaN(seqVal) && seqVal > maxSeq) {
          maxSeq = seqVal;
        }
      }
    });
    const nextSeq = maxSeq + 1;
    return `MN${year}.${String(nextSeq).padStart(3, '0')}`;
  };

  const handleSave = async () => {
    const contactsList = [];
    if (parentFather) {
      contactsList.push({
        name: parentFather,
        relationship: 'Ba',
        phone: parentFatherPhone,
        occupation: '',
        isPrimary: true
      });
    }
    if (parentMother) {
      contactsList.push({
        name: parentMother,
        relationship: 'Mẹ',
        phone: parentMotherPhone,
        occupation: '',
        isPrimary: contactsList.length === 0
      });
    }
    if (guardianName) {
      contactsList.push({
        name: guardianName,
        relationship: guardianRelation || 'Người giám hộ',
        phone: guardianPhone,
        occupation: '',
        isPrimary: contactsList.length === 0
      });
    }

    const newChild: Student = {
      id: getStaticStudentId(),
      name: studentName,
      nickname: nickname || undefined,
      dob: dob,
      gender: gender,
      grade: assignedClass,
      status: 'Đang Học',
      address: address,
      bloodType: bloodType,
      heightCm: heightCm ? Number(heightCm) : undefined,
      weightKg: weightKg ? Number(weightKg) : undefined,
      allergies: allergies ? allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
      medicalHistory: medicalHistory || undefined,
      contacts: contactsList,
      pickupAuthorized: pickupName ? [
        { name: pickupName, phone: pickupPhone, relationship: pickupRelation }
      ] : []
    };

    try {
      await createStudent(newChild);
      if (onSuccess) onSuccess();
      alert(`🎉 Đã khởi tạo hồ sơ bé ${studentName} thành công!`);
      onClose();
    } catch (err) {
      console.error(err);
      alert("Lỗi: Không thể lưu hồ sơ bé lên Firestore.");
    }
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Nhập Học Cho Trẻ - Mầm non An Hữu" subtitle="Hệ thống Cấu hình thông tin Toàn diện & Quản lý Đón trả" width="max-w-4xl" fixedHeight>
      <div className="bg-[#e8eef6] px-4 py-4 border-b border-[#b8c6d9] flex items-center justify-between shrink-0 overflow-x-auto">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-shrink-0">
             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#2c5ea0] text-white shadow-inner md:scale-110 transition-transform' : 'bg-[#dce4ee] text-[#7b8a9e]'}`}>
                {s}
             </div>
             {s < 4 && <div className={`w-6 md:w-12 h-1 mx-2 rounded ${step > s ? 'bg-[#2c5ea0]' : 'bg-[#dce4ee]'}`}></div>}
          </div>
        ))}
         <div className="text-[10px] font-bold uppercase tracking-widest text-[#2c5ea0] ml-4 whitespace-nowrap">
           {step === 1 ? '1. Định Danh' : step === 2 ? '2. Y Tế' : step === 3 ? '3. Gia Đình' : '4. Ủy Quyền & Hoàn Tất'}
         </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><User className="w-4 h-4 mr-2" /> Thông Tin Cơ Bản Của Bé</h4>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <BaseSelect
                    label="Khối lớp"
                    required
                    value={gradeLevel}
                    options={[
                      {value: 'Nhà trẻ', label: 'Khối Nhà trẻ (3-24 tháng)'},
                      {value: 'Mầm', label: 'Khối Mầm (3-4 tuổi)'},
                      {value: 'Chồi', label: 'Khối Chồi (4-5 tuổi)'},
                      {value: 'Lá', label: 'Khối Lá (5-6 tuổi)'}
                    ]}
                    onChange={(val) => setGradeLevel(val)}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã Bé (Tự phát sinh)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#2c5ea0] uppercase font-mono shadow-inner" 
                    value={getStaticStudentId()} 
                    readOnly 
                  />
               </div>
               <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ & Tên khai sinh *</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0] uppercase" 
                    placeholder="VD: NGUYỄN BẢO NGỌC"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
               </div>
               <div className="col-span-2 md:col-span-1">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên gọi ở nhà (Nickname)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                    placeholder="VD: Bông, Cua, Dâu..."
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                  />
               </div>
               <div>
                  <BaseSelect
                    label="Giới tính"
                    required
                    value={gender}
                    options={[
                      {value: 'Nữ', label: 'Nữ'},
                      {value: 'Nam', label: 'Nam'}
                    ]}
                    onChange={(val) => setGender(val)}
                  />
               </div>
               <div>
                  <BaseDatePicker
                    label="Ngày sinh"
                    required
                    value={dob}
                    onChange={(val) => setDob(val)}
                  />
               </div>
               <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lớp xếp theo khối</label>
                  <BaseSelect
                    label="Lớp học hoạt động"
                    value={assignedClass}
                    options={getFilteredClassesOptions()}
                    onChange={setAssignedClass}
                  />
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><Award className="w-4 h-4 mr-2" /> Hồ Sơ Sức Khỏe & Thể Trạng</h4>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <BaseSelect
                    label="Nhóm máu"
                    value={bloodType}
                    options={[
                      {value: 'O', label: 'Nhóm máu O'},
                      {value: 'A', label: 'Nhóm máu A'},
                      {value: 'B', label: 'Nhóm máu B'},
                      {value: 'AB', label: 'Nhóm máu AB'}
                    ]}
                    onChange={setBloodType}
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Chiều cao (cm)</label>
                     <input 
                       type="number" 
                       className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                       placeholder="cm"
                       value={heightCm}
                       onChange={(e) => setHeightCm(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Cân nặng (kg)</label>
                     <input 
                       type="number" 
                       className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                       placeholder="kg"
                       value={weightKg}
                       onChange={(e) => setWeightKg(e.target.value)}
                     />
                  </div>
               </div>
               <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tiền sử dị ứng (Nếu có)</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="VD: Dị ứng sữa bò, hải sản, thuốc kháng sinh... (ngăn cách bằng dấu phẩy)"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
               </div>
               <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Bệnh lý bẩm sinh / Cần lưu ý đặc biệt</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] h-24" 
                    placeholder="VD: Co giật khi sốt cao, hen suyễn, tim bẩm sinh..."
                    value={medicalHistory}
                    onChange={(e) => setMedicalHistory(e.target.value)}
                  />
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><Home className="w-4 h-4 mr-2" /> Gia Đình & Người Giám Hộ</h4>
            <div className="grid grid-cols-2 gap-6">
               <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Địa chỉ thường trú của gia đình</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="Số nhà, Tên đường, Xã An Hữu, Cái Bè, Tiền Giang..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ tên Cha</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="Họ và tên cha..."
                    value={parentFather}
                    onChange={(e) => setParentFather(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số điện thoại Cha</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="SĐT liên hệ..."
                    value={parentFatherPhone}
                    onChange={(e) => setParentFatherPhone(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ tên Mẹ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="Họ và tên mẹ..."
                    value={parentMother}
                    onChange={(e) => setParentMother(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số điện thoại Mẹ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                    placeholder="SĐT liên hệ..."
                    value={parentMotherPhone}
                    onChange={(e) => setParentMotherPhone(e.target.value)}
                  />
               </div>
               <div className="col-span-2 border-t border-[#b8c6d9] pt-4">
                  <span className="text-[10px] text-[#7b8a9e] block mb-4 uppercase tracking-wider font-bold">Người Giám Hộ Hợp Pháp Khác (Nếu có)</span>
                  <div className="grid grid-cols-3 gap-4">
                     <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ tên</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                          placeholder="VD: Bà ngoại..."
                          value={guardianName}
                          onChange={(e) => setGuardianName(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mối quan hệ</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                          placeholder="Bà ngoại, ông nội..."
                          value={guardianRelation}
                          onChange={(e) => setGuardianRelation(e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">SĐT liên hệ</label>
                        <input 
                          type="text" 
                          className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                          placeholder="SĐT..."
                          value={guardianPhone}
                          onChange={(e) => setGuardianPhone(e.target.value)}
                        />
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><Users className="w-4 h-4 mr-2" /> Ủy Quyền Đưa Rước & Xác Nhận</h4>
            <div className="bg-[#f0f4fa] p-5 border border-[#b8c6d9] rounded-2xl shadow-sm space-y-4">
               <label className="block text-xs font-bold text-[#2c5ea0] uppercase tracking-widest">Đăng ký người đưa đón (Ủy quyền pháp lý)</label>
               <p className="text-[10px] text-[#4a5568]">Hệ thống bảo vệ trẻ bằng việc đối chiếu ảnh chân dung của người được ủy quyền khi đến đón.</p>
               <div className="grid grid-cols-3 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ & Tên người ủy quyền</label>
                     <input 
                       type="text" 
                       className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                       placeholder="VD: Nguyễn Văn A..."
                       value={pickupName}
                       onChange={(e) => setPickupName(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số điện thoại</label>
                     <input 
                       type="text" 
                       className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                       placeholder="Số điện thoại..."
                       value={pickupPhone}
                       onChange={(e) => setPickupPhone(e.target.value)}
                     />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Quan hệ với Bé</label>
                     <input 
                       type="text" 
                       className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                       placeholder="Chú, dì, tài xế..."
                       value={pickupRelation}
                       onChange={(e) => setPickupRelation(e.target.value)}
                     />
                  </div>
               </div>
            </div>

            <div className="border border-[#b8c6d9] bg-white rounded-2xl p-6 shadow-sm space-y-4 max-w-2xl mx-auto font-sans">
              <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 text-center">Tóm tắt cấu hình hồ sơ bé</h4>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs">
                <div>
                  <span className="text-[#7b8a9e] block">Họ và Tên Bé:</span>
                  <strong className="text-sm text-[#1e2a3a] uppercase">{studentName || '(Chưa điền)'}</strong>
                </div>
                <div>
                  <span className="text-[#7b8a9e] block">Khối lớp nhập học:</span>
                  <strong className="text-sm text-[#1e2a3a]">{gradeLevel}</strong>
                </div>
                <div>
                  <span className="text-[#7b8a9e] block">Lớp phân công:</span>
                  <strong className="text-sm text-[#1e2a3a]">{assignedClass}</strong>
                </div>
                <div>
                  <span className="text-[#7b8a9e] block">Mã học vụ tự động:</span>
                  <strong className="text-sm font-mono text-[#2c5ea0]">{getStaticStudentId()}</strong>
                </div>
              </div>
              <div className="bg-[#fcf8e3] border border-[#faebcc] p-3 rounded-lg text-[10px] text-[#8a6d3b] leading-normal font-bold">
                ⚠️ Lưu ý: Vui lòng kiểm tra kỹ thông tin trước khi nhấn lưu để tránh sai lệch hồ sơ y tế và phân quyền đón bé.
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto shrink-0">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Quay Lại</button>
        ) : <div></div>}
        
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all flex items-center gap-1">Tiếp Theo <ChevronRight className="w-4 h-4" /></button>
        ) : (
          <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition-all">Lưu Hồ Sơ Bé</button>
        )}
      </div>
    </ModalBase>
  );
};

/* --- 2. ATTENDANCE MODAL (Quản lý Chuyên cần) --- */
export const AttendanceModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Nhật Ký Điểm Danh" subtitle="Báo cáo chuyên cần & Ghi nhận nghỉ học" width="max-w-4xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
         <div className="flex bg-[#e8eef6] p-4 rounded-xl border border-[#b8c6d9] justify-between items-center">
            <div>
               <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Mục Tiêu</p>
               <p className="font-bold text-[#1e2a3a]">Nguyễn Trần Bảo Dương (10A1)</p>
            </div>
            <div className="flex gap-4">
               <div>
                  <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1 text-center">Vắng Phép</p>
                  <p className="font-serif font-bold text-center text-[#4a5568] text-lg">2</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1 text-center">Không Phép</p>
                  <p className="font-serif font-bold text-center text-[#2c5ea0] text-lg">0</p>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1 text-center">Tổng Đi Trễ</p>
                  <p className="font-serif font-bold text-center text-[#d97706] text-lg">1</p>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><ListChecks className="w-4 h-4 mr-2" /> Ghi Nhận Mới</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="lg:col-span-1">
                  <BaseDatePicker label="Ngày Ghi Nhận" value="" onChange={() => {}} />
               </div>
               <div className="lg:col-span-1">
                  <BaseSelect
                    label="Buổi Học"
                    value="Sáng"
                    options={[{value: 'Sáng', label: 'Sáng'}, {value: 'Chiều', label: 'Chiều'}]}
                    onChange={() => {}}
                  />
               </div>
               <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Trạng Thái</label>
                  <div className="flex gap-2">
                     <label className="flex-1 flex text-center justify-center p-2 bg-white border border-[#b8c6d9] rounded-lg cursor-pointer hover:bg-[#e8eef6] transition">
                        <input type="radio" name="attStatus" className="mr-2 text-[#2e6b8a]" defaultChecked />
                        <span className="text-xs font-bold text-[#1e2a3a]">Có mặt</span>
                     </label>
                     <label className="flex-1 flex text-center justify-center p-2 bg-white border border-[#b8c6d9] rounded-lg cursor-pointer hover:bg-[#fee2e2] transition">
                        <input type="radio" name="attStatus" className="mr-2 text-[#2c5ea0]" />
                        <span className="text-xs font-bold text-[#991b1b]">Vắng (KP)</span>
                     </label>
                     <label className="flex-1 flex text-center justify-center p-2 bg-white border border-[#b8c6d9] rounded-lg cursor-pointer hover:bg-[#fef9c3] transition">
                        <input type="radio" name="attStatus" className="mr-2 text-[#d97706]" />
                        <span className="text-xs font-bold text-[#9a3412]">Trễ / Bỏ</span>
                     </label>
                  </div>
               </div>
               <div className="col-span-2 lg:col-span-4">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lý Do / Ghi Chú Của GV</label>
                  <input type="text" className="w-full px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Ví dụ: Ốm, bận việc gia đình..." />
               </div>
            </div>
            <button className="w-full py-3 bg-[#dce4ee] hover:bg-[#b8c6d9] text-[#1e2a3a] font-bold text-xs uppercase tracking-widest rounded-xl transition-colors">Lưu Ghi Nhận</button>
         </div>

         <div>
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center mb-4"><Clock className="w-4 h-4 mr-2" /> Lịch Sử Điểm Danh</h4>
            <table className="w-full text-sm text-left">
               <thead className="bg-[#e8eef6] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest">
                  <tr>
                     <th className="px-4 py-3 rounded-tl-xl">Thời Gian</th>
                     <th className="px-4 py-3">Buổi</th>
                     <th className="px-4 py-3">Trạng Thái</th>
                     <th className="px-4 py-3 rounded-tr-xl">Ghi Chú</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-[#b8c6d9]">
                  <tr>
                     <td className="px-4 py-3 font-mono text-xs">10/05/2026</td>
                     <td className="px-4 py-3 font-bold text-[#4a5568]">Sáng</td>
                     <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]">Đi Trễ</span>
                     </td>
                     <td className="px-4 py-3 text-xs text-[#4a5568]">Hỏng xe dọc đường</td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng Lại</button>
      </div>
    </ModalBase>
  );
};

/* --- 3. GRADES MODAL (Điểm số & Học bạ) --- */
export const GradesModal = ({ 
  isOpen, 
  onClose, 
  student, 
  getReportCardData 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  student?: Student | null; 
  getReportCardData?: (student: Student, semester: string) => ReportCardData; 
}) => {
  const currentRole = useUserRole();
  const [selectedSemester, setSelectedSemester] = useState('Học Kỳ I');

  const [isEditing, setIsEditing] = useState(false);
  const [editableScores, setEditableScores] = useState<any[]>([]);
  const [summaryGpa, setSummaryGpa] = useState(0);
  const [summaryConduct, setSummaryConduct] = useState<'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu'>('Tốt');
  const [summaryDaysAbsent, setSummaryDaysAbsent] = useState(0);
  const [summaryDaysAbsentExcused, setSummaryDaysAbsentExcused] = useState(0);
  const [summaryComment, setSummaryComment] = useState('');
  const [localToast, setLocalToast] = useState<string | null>(null);

  // Fallback / Mock Student if none provided
  const defaultStudent: Student = {
    id: 'HS2025.101',
    name: 'NGUYỄN VĂN MẪU',
    grade: '1A1',
    dob: '2020-05-15',
    gender: 'Nam',
    phone: '0987654321',
    address: 'Cái Bè, Tiền Giang',
    guardian: 'Nguyễn Văn Cha',
    status: 'Đang Học'
  };

  const currentStudent = student || defaultStudent;

  // Firestore-cached report card data, loaded asynchronously
  const [firestoreCache, setFirestoreCache] = useState<Map<string, ReportCardDocument>>(new Map());

  // Load report card from Firestore when modal opens or semester changes
  useEffect(() => {
    if (!isOpen || !currentStudent) return;
    const loadFromFirestore = async () => {
      const semesters = ['Học Kỳ I', 'Học Kỳ II', 'Cả Năm'];
      const newCache = new Map(firestoreCache);
      for (const sem of semesters) {
        const key = `${currentStudent.id}_${sem}`;
        if (!newCache.has(key)) {
          const card = await getReportCard(currentStudent.id, sem);
          if (card) newCache.set(key, card);
        }
      }
      setFirestoreCache(newCache);
    };
    loadFromFirestore();
  }, [isOpen, currentStudent]);

  // Return blank scores if no saved data exists (no auto-generation)
  const defaultGetReportCardData = (std: Student, sem: string): ReportCardData => {
    // Check Firestore cache first
    const cacheKey = `${std.id}_${sem}`;
    const cached = firestoreCache.get(cacheKey);
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
      id: std.id,
      name: std.name,
      dob: std.dob,
      gender: std.gender,
      grade: std.grade,
      gvcn: 'Cô Lê Thị Thảo',
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

  const fetchReportCard = getReportCardData || defaultGetReportCardData;
  const reportCard = fetchReportCard(currentStudent, selectedSemester);

  useEffect(() => {
    if (isOpen) {
      setSelectedSemester('Học Kỳ I');
      setIsEditing(false);
      setLocalToast(null);
    }
  }, [isOpen, student]);

  useEffect(() => {
    if (isOpen && currentStudent) {
      setIsEditing(false);
      setLocalToast(null);
      const activeCard = fetchReportCard(currentStudent, selectedSemester);
      setEditableScores(JSON.parse(JSON.stringify(activeCard.scores)));
      setSummaryGpa(activeCard.summary.gpa);
      setSummaryConduct(activeCard.summary.moralConduct);
      setSummaryDaysAbsent(activeCard.summary.daysAbsent);
      setSummaryDaysAbsentExcused(activeCard.summary.daysAbsentExcused);
      setSummaryComment(activeCard.summary.generalComment);
    }
  }, [selectedSemester, currentStudent, isOpen]);

  const getAcademicConduct = (gpaVal: number, scoresList: any[]): 'Xuất Sắc' | 'Giỏi' | 'Khá' | 'Trung Bình' | 'Yếu' => {
    const hasChuaDat = scoresList.some(s => {
      const isQual = typeof s.average === 'string' || ['Giáo dục thể chất', 'Âm nhạc', 'Mỹ thuật', 'Hoạt động trải nghiệm', 'Giáo dục địa phương'].includes(s.subject);
      return isQual && s.average === 'Chưa đạt';
    });
    if (hasChuaDat) return 'Yếu';
    if (gpaVal >= 9.0) return 'Xuất Sắc';
    if (gpaVal >= 8.0) return 'Giỏi';
    if (gpaVal >= 6.5) return 'Khá';
    if (gpaVal >= 5.0) return 'Trung Bình';
    return 'Yếu';
  };

  const recalculate = (updatedScores: any[]) => {
    const recalculated = updatedScores.map(score => {
      const isQualitative = typeof score.average === 'string' || 
                            ['Giáo dục thể chất', 'Âm nhạc', 'Mỹ thuật', 'Hoạt động trải nghiệm', 'Giáo dục địa phương'].includes(score.subject);
      if (isQualitative) return score;
      
      const m1Vals = score.multiplier1.map((v: any) => parseFloat(v)).filter((v: any) => !isNaN(v));
      const m2Vals = score.multiplier2.map((v: any) => parseFloat(v)).filter((v: any) => !isNaN(v));
      const m3Val = parseFloat(score.multiplier3);

      if (m1Vals.length === 0 && m2Vals.length === 0 && isNaN(m3Val)) return { ...score, average: 0 };

      const m1Sum = m1Vals.reduce((sum: number, v: number) => sum + v, 0);
      const m2Sum = m2Vals.reduce((sum: number, v: number) => sum + v, 0);
      const m3Sum = isNaN(m3Val) ? 0 : m3Val;
      const totalWeight = m1Vals.length + (m2Vals.length * 2) + (isNaN(m3Val) ? 0 : 3);
      const average = totalWeight > 0 ? (m1Sum + (m2Sum * 2) + (m3Sum * 3)) / totalWeight : 0;

      let comment = score.teacherComment;
      if (!comment || comment.startsWith('Có ý thức') || comment.startsWith('Tiến trình') || comment.startsWith('Cần tăng')) {
        comment = average >= 8.5 ? 'Có ý thức tự chủ xuất sắc, tư duy sáng tạo cao, tiếp thu rất tốt.' : average >= 7.0 ? 'Tiến trình học tập nghiêm túc, khả năng tự học tốt.' : 'Cần tăng cường luyện tập thêm các đề chuyên sâu để bứt phá.';
      }
      return { ...score, average: parseFloat(average.toFixed(1)), teacherComment: comment };
    });

    setEditableScores(recalculated);
    const numericScores = recalculated.filter(s => typeof s.average === 'number');
    const totalSum = numericScores.reduce((sum, s) => sum + s.average, 0);
    const newGpa = numericScores.length > 0 ? parseFloat((totalSum / numericScores.length).toFixed(2)) : 0;
    setSummaryGpa(newGpa);
  };

  const handleScoreChange = (scoreIdx: number, multiplierField: 'multiplier1' | 'multiplier2' | 'multiplier3', valIdx: number, val: string) => {
    const newScores = [...editableScores];
    if (multiplierField === 'multiplier1') { newScores[scoreIdx].multiplier1[valIdx] = val; }
    else if (multiplierField === 'multiplier2') { newScores[scoreIdx].multiplier2[valIdx] = val; }
    else { newScores[scoreIdx].multiplier3 = val; }
    recalculate(newScores);
  };

  const handleQualitativeChange = (scoreIdx: number, val: string) => {
    const newScores = [...editableScores];
    newScores[scoreIdx].average = val;
    newScores[scoreIdx].teacherComment = val === 'Đạt' ? 'Rèn luyện tốt, đạt yêu cầu môn học.' : 'Cần tích cực rèn luyện thêm.';
    recalculate(newScores);
  };

  const syncCaNamCard = async (studentId: string) => {
    const hkiCard = fetchReportCard(currentStudent, 'Học Kỳ I');
    const hkiiCard = fetchReportCard(currentStudent, 'Học Kỳ II');

    const scores = hkiCard.scores.map((s1: any, idx: number) => {
      const s2 = hkiiCard.scores[idx];
      const isQual = typeof s1.average === 'string' || typeof s2.average === 'string' || 
                     ['Giáo dục thể chất', 'Âm nhạc', 'Mỹ thuật', 'Hoạt động trải nghiệm', 'Giáo dục địa phương'].includes(s1.subject);
      const average = isQual ? (s2.average === 'Đạt' ? 'Đạt' : 'Chưa đạt') : parseFloat(((Number(s1.average) + Number(s2.average)) / 2).toFixed(1));
      return {
        subject: s1.subject,
        multiplier1: [s1.average],
        multiplier2: [s2.average],
        multiplier3: 0,
        average,
        teacherComment: typeof average === 'string' ? (average === 'Đạt' ? 'Cả năm rèn luyện tốt.' : 'Cần tích cực rèn luyện thêm.') : (average >= 8.5 ? 'Cả năm hoàn thành xuất sắc.' : 'Tiến độ học tập cả năm ổn định.')
      };
    });

    const numericScores = scores.filter((s: any) => typeof s.average === 'number');
    const gpa = numericScores.length > 0 ? parseFloat((numericScores.reduce((sum: number, s: any) => sum + s.average, 0) / numericScores.length).toFixed(2)) : 0;

    const caNamDoc: ReportCardDocument = {
      id: `${studentId}_Cả Năm`,
      studentId,
      semester: 'Cả Năm',
      name: currentStudent.name,
      dob: currentStudent.dob,
      gender: currentStudent.gender,
      grade: currentStudent.grade,
      gvcn: hkiCard.gvcn,
      academicYear: hkiCard.academicYear,
      scores,
      summary: { gpa, academicConduct: getAcademicConduct(gpa, scores), moralConduct: hkiiCard.summary.moralConduct, daysAbsent: hkiCard.summary.daysAbsent + hkiiCard.summary.daysAbsent, daysAbsentExcused: hkiCard.summary.daysAbsentExcused + hkiiCard.summary.daysAbsentExcused, generalComment: 'Hoàn thành tốt năm học.' }
    };

    try {
      await saveReportCard(caNamDoc);
      setFirestoreCache(prev => { const m = new Map(prev); m.set(caNamDoc.id, caNamDoc); return m; });
    } catch (error) {
      console.error('Failed to save Cả Năm report card to Firestore:', error);
    }
  };

  const handleSave = async () => {
    // Input validation
    for (let i = 0; i < editableScores.length; i++) {
      const score = editableScores[i];
      const isQual = typeof score.average === 'string' || ['Giáo dục thể chất', 'Âm nhạc', 'Mỹ thuật', 'Hoạt động trải nghiệm', 'Giáo dục địa phương'].includes(score.subject);
      if (!isQual) {
        for (let v of score.multiplier1) {
          const val = parseFloat(v);
          if (v !== '' && (isNaN(val) || val < 0 || val > 10)) {
            setLocalToast(`Môn ${score.subject}: Điểm Thường xuyên [0-10] không hợp lệ!`);
            return;
          }
        }
        for (let v of score.multiplier2) {
          const val = parseFloat(v);
          if (v !== '' && (isNaN(val) || val < 0 || val > 10)) {
            setLocalToast(`Môn ${score.subject}: Điểm Giữa kỳ [0-10] không hợp lệ!`);
            return;
          }
        }
        const val3 = parseFloat(score.multiplier3);
        if (score.multiplier3 !== '' && (isNaN(val3) || val3 < 0 || val3 > 10)) {
          setLocalToast(`Môn ${score.subject}: Điểm Cuối kỳ [0-10] không hợp lệ!`);
          return;
        }
      }
    }

    if (summaryDaysAbsent < 0 || summaryDaysAbsentExcused < 0 || summaryDaysAbsentExcused > summaryDaysAbsent) {
      setLocalToast('Số ngày vắng nghỉ không hợp lệ!');
      return;
    }

    const formattedScores = editableScores.map(score => {
      const isQual = typeof score.average === 'string' || ['Giáo dục thể chất', 'Âm nhạc', 'Mỹ thuật', 'Hoạt động trải nghiệm', 'Giáo dục địa phương'].includes(score.subject);
      if (isQual) return score;
      return {
        ...score,
        multiplier1: score.multiplier1.map((v: any) => v === '' ? 0 : parseFloat(parseFloat(v).toFixed(1))),
        multiplier2: score.multiplier2.map((v: any) => v === '' ? 0 : parseFloat(parseFloat(v).toFixed(1))),
        multiplier3: score.multiplier3 === '' ? 0 : parseFloat(parseFloat(score.multiplier3).toFixed(1)),
        average: typeof score.average === 'number' ? parseFloat(score.average.toFixed(1)) : score.average
      };
    });

    const activeCond = getAcademicConduct(summaryGpa, formattedScores);

    const reportCardDoc: ReportCardDocument = {
      id: `${currentStudent.id}_${selectedSemester}`,
      studentId: currentStudent.id,
      semester: selectedSemester,
      name: currentStudent.name,
      dob: currentStudent.dob,
      gender: currentStudent.gender,
      grade: currentStudent.grade,
      gvcn: reportCard.gvcn,
      academicYear: reportCard.academicYear,
      scores: formattedScores,
      summary: { gpa: summaryGpa, academicConduct: activeCond, moralConduct: summaryConduct, daysAbsent: summaryDaysAbsent, daysAbsentExcused: summaryDaysAbsentExcused, generalComment: summaryComment }
    };

    try {
      await saveReportCard(reportCardDoc);
      // Update local Firestore cache
      setFirestoreCache(prev => { const m = new Map(prev); m.set(reportCardDoc.id, reportCardDoc); return m; });
      await syncCaNamCard(currentStudent.id);
      window.dispatchEvent(new Event('grades-updated'));
      setLocalToast('✅ Lưu bảng điểm lên Firestore thành công!');
    } catch (error) {
      console.error('Failed to save report card to Firestore:', error);
      setLocalToast('❌ Không thể lưu bảng điểm lên Firestore!');
    }

    setTimeout(() => setLocalToast(null), 3000);
    setIsEditing(false);
  };

  const activeGpa = isEditing ? summaryGpa : reportCard.summary.gpa;
  const activeConduct = isEditing ? getAcademicConduct(summaryGpa, editableScores) : reportCard.summary.academicConduct;

  const getHonor = (gpa: number, conduct: string) => {
    if (conduct === 'Xuất Sắc') return 'Học sinh Xuất sắc';
    if (conduct === 'Giỏi') return 'Học sinh Giỏi';
    if (conduct === 'Khá') return 'Học sinh Khá';
    return 'Không xếp danh hiệu';
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={`Bảng Điểm Môn Học - ${currentStudent.name}`} subtitle={`Lớp: ${currentStudent.grade} | Mã học sinh: ${currentStudent.id}`} width="max-w-5xl" fixedHeight>
      <div className="flex flex-col h-full bg-[#f5f8fc] relative">
        {localToast && (
          <div className="absolute top-4 right-4 z-[999] bg-[#1e2a3a] border border-[#b8c6d9] text-[#f5f8fc] text-xs font-bold px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
             <div className="w-2 h-2 rounded-full bg-[#2c5ea0] animate-ping" />
             <span>{localToast}</span>
          </div>
        )}
        <div className="p-6 border-b border-[#b8c6d9] bg-[#e8eef6] flex gap-4 shrink-0 overflow-x-auto">
           <div className="w-[200px]"><BaseSelect value="Năm học 2025-2026" options={[{value: 'Năm học 2025-2026', label: 'Năm học 2025-2026'}]} onChange={() => {}} /></div>
           <div className="w-[150px]">
             <BaseSelect 
               value={selectedSemester} 
               options={[{value: 'Học Kỳ I', label: 'Học Kỳ I'}, {value: 'Học Kỳ II', label: 'Học Kỳ II'}, {value: 'Cả Năm', label: 'Cả Năm'}]} 
               onChange={(val) => { if (!isEditing || confirm('Thay đổi chưa lưu sẽ bị hủy. Bạn có tiếp tục?')) { setIsEditing(false); setSelectedSemester(val); } }} 
             />
           </div>
           {isEditing && (
             <div className="flex items-center text-xs font-bold text-[#2c5ea0] bg-[#fce8e6] px-3 py-1.5 rounded-lg border border-[#f5c2c2] animate-pulse">
               ⚠️ Bạn đang ở chế độ chỉnh sửa điểm
             </div>
           )}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0">
           <table className="w-full text-sm text-left">
              <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-sm">
                  <tr>
                     <th className="px-4 py-3 bg-[#f5f8fc]">Môn Học</th>
                     <th className="px-4 py-3 bg-[#f5f8fc] text-center">Đánh Giá</th>
                     <th className="px-4 py-3 bg-[#f5f8fc] text-center border-l border-[#b8c6d9]">{selectedSemester === 'Cả Năm' ? 'ĐTB HKI' : 'Thường Xuyên 1'}</th>
                     <th className="px-4 py-3 bg-[#f5f8fc] text-center">{selectedSemester === 'Cả Năm' ? 'ĐTB HKII' : 'Thường Xuyên 2'}</th>
                     <th className="px-4 py-3 bg-[#f5f8fc] text-center border-l border-[#b8c6d9]">Giữa Kỳ (HS2)</th>
                     <th className="px-4 py-3 bg-[#f5f8fc] text-center border-l border-[#b8c6d9]">Cuối Kỳ (HS3)</th>
                     <th className="px-4 py-3 bg-[#f5f8fc] text-center border-l-2 border-[#7b8a9e]">{selectedSemester === 'Cả Năm' ? 'ĐTB Cả Năm' : 'ĐTB Môn'}</th>
                     <th className="px-4 py-3 bg-[#f5f8fc] border-l border-[#b8c6d9]">Nhận xét của Giáo viên Bộ môn</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-[#b8c6d9]">
                {(isEditing ? editableScores : reportCard.scores).map((score, sIdx) => {
                  const isQual = typeof score.average === 'string' || ['Giáo dục thể chất', 'Âm nhạc', 'Mỹ thuật', 'Hoạt động trải nghiệm', 'Giáo dục địa phương'].includes(score.subject);
                  const evaluation = isQual ? score.average : '-';
                  const canEditSubject = currentRole === 'school_board' || currentRole === 'department_head' || (currentRole === 'subject_teacher' && score.subject === 'Tiếng Anh');

                  return (
                    <tr key={sIdx} className="hover:bg-[#e8eef6]">
                      <td className="px-4 py-3 font-bold text-[#1e2a3a]">{score.subject}</td>
                      <td className="px-4 py-3 text-center">
                        {isEditing && isQual && canEditSubject ? (
                          <select
                            value={score.average}
                            onChange={(e) => handleQualitativeChange(sIdx, e.target.value)}
                            className="px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs font-bold text-[#1e2a3a] focus:outline-none"
                          >
                            <option value="Đạt">Đạt</option>
                            <option value="Chưa đạt">Chưa đạt</option>
                          </select>
                        ) : (
                          <span className={`font-bold ${evaluation === 'Đạt' ? 'text-[#2e6b8a]' : evaluation === 'Chưa đạt' ? 'text-[#2c5ea0]' : 'text-gray-400'}`}>
                            {evaluation}
                          </span>
                        )}
                      </td>
                      
                      {/* Thường Xuyên 1 / ĐTB Học Kỳ I */}
                      <td className="px-4 py-3 text-center border-l border-[#b8c6d9] font-serif text-[15px] text-[#4a5568]">
                        {selectedSemester === 'Cả Năm' ? (
                          typeof score.multiplier1[0] === 'number' ? (score.multiplier1[0] as number).toFixed(1) : score.multiplier1[0]
                        ) : isQual ? 'Miễn' : isEditing && canEditSubject ? (
                          <input
                            type="text"
                            value={score.multiplier1[0] ?? ''}
                            onChange={(e) => handleScoreChange(sIdx, 'multiplier1', 0, e.target.value)}
                            className="w-14 px-1 py-0.5 text-center bg-white border border-[#b8c6d9] rounded text-xs font-semibold text-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0]"
                          />
                        ) : (
                          score.multiplier1[0] !== undefined && score.multiplier1[0] !== 0 ? (score.multiplier1[0] as number).toFixed(1) : ''
                        )}
                      </td>
                      
                      {/* Thường Xuyên 2 / ĐTB Học Kỳ II */}
                      <td className="px-4 py-3 text-center font-serif text-[15px] text-[#4a5568]">
                        {selectedSemester === 'Cả Năm' ? (
                          typeof score.multiplier2[0] === 'number' ? (score.multiplier2[0] as number).toFixed(1) : score.multiplier2[0]
                        ) : isQual ? 'Miễn' : isEditing && canEditSubject ? (
                          <input
                            type="text"
                            value={score.multiplier1[1] ?? ''}
                            onChange={(e) => handleScoreChange(sIdx, 'multiplier1', 1, e.target.value)}
                            className="w-14 px-1 py-0.5 text-center bg-white border border-[#b8c6d9] rounded text-xs font-semibold text-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0]"
                          />
                        ) : (
                          score.multiplier1[1] !== undefined && score.multiplier1[1] !== 0 ? (score.multiplier1[1] as number).toFixed(1) : ''
                        )}
                      </td>
                      
                      {/* Giữa Kỳ (HS2) */}
                      <td className="px-4 py-3 text-center border-l border-[#b8c6d9] font-serif text-[15px] font-bold text-[#1e2a3a]">
                        {selectedSemester === 'Cả Năm' ? '—' : isQual ? 'Miễn' : isEditing && canEditSubject ? (
                          <input
                            type="text"
                            value={score.multiplier2[0] ?? ''}
                            onChange={(e) => handleScoreChange(sIdx, 'multiplier2', 0, e.target.value)}
                            className="w-14 px-1 py-0.5 text-center bg-white border border-[#b8c6d9] rounded text-xs font-bold text-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0]"
                          />
                        ) : (
                          score.multiplier2[0] !== undefined && score.multiplier2[0] !== 0 ? (score.multiplier2[0] as number).toFixed(1) : ''
                        )}
                      </td>
                      
                      {/* Cuối Kỳ (HS3) */}
                      <td className="px-4 py-3 text-center border-l border-[#b8c6d9] font-serif text-[15px] font-bold text-[#2c5ea0]">
                        {selectedSemester === 'Cả Năm' ? '—' : isQual ? 'Miễn' : isEditing && canEditSubject ? (
                          <input
                            type="text"
                            value={score.multiplier3 ?? ''}
                            onChange={(e) => handleScoreChange(sIdx, 'multiplier3', 0, e.target.value)}
                            className="w-14 px-1 py-0.5 text-center bg-white border border-[#b8c6d9] rounded text-xs font-bold text-[#2c5ea0] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0]"
                          />
                        ) : (
                          typeof score.multiplier3 === 'number' && score.multiplier3 !== 0 ? (score.multiplier3 as number).toFixed(1) : score.multiplier3
                        )}
                      </td>
                      
                      {/* ĐTB Môn / ĐTB Cả Năm */}
                      <td className={`px-4 py-3 text-center border-l-2 border-[#7b8a9e] font-serif text-[15px] font-bold bg-[#f0f4fa] ${
                        typeof score.average === 'number' ? 'text-[#2e6b8a]' : (score.average === 'Đạt' ? 'text-[#2e6b8a]' : 'text-[#2c5ea0]')
                      }`}>
                        {typeof score.average === 'number' && score.average !== 0 ? score.average.toFixed(1) : (typeof score.average === 'number' ? '' : score.average)}
                      </td>
 
                      {/* Nhận xét bộ môn */}
                      <td className="px-4 py-3 text-[11px] text-[#4a5568] italic border-l border-[#b8c6d9]">
                        {isEditing && canEditSubject ? (
                          <input
                            type="text"
                            value={score.teacherComment}
                            onChange={(e) => {
                              const newScores = [...editableScores];
                              newScores[sIdx].teacherComment = e.target.value;
                              setEditableScores(newScores);
                            }}
                            className="w-full px-2 py-1 bg-white border border-[#b8c6d9] rounded text-xs text-[#4a5568] italic focus:outline-none focus:ring-1 focus:ring-[#2c5ea0]"
                            placeholder="Nhập nhận xét..."
                          />
                        ) : (
                          score.teacherComment
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
           </table>

           {/* General Evaluation Card Section */}
           {isEditing ? (
             <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6]/45 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-sans">
                <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#f5f8fc] space-y-3 shadow-sm">
                   <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">I. Đánh giá rèn luyện</h4>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-[#7b8a9e] uppercase block">Hạnh kiểm học sinh</label>
                      <select
                        value={summaryConduct}
                        onChange={(e) => setSummaryConduct(e.target.value as any)}
                        disabled={currentRole === 'subject_teacher'}
                        className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg font-bold text-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="Tốt">Tốt</option>
                        <option value="Khá">Khá</option>
                        <option value="Trung Bình">Trung Bình</option>
                        <option value="Yếu">Yếu</option>
                      </select>
                   </div>
                </div>
                <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#f5f8fc] space-y-3 shadow-sm">
                   <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">II. Chuyên cần học tập</h4>
                   <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                         <label className="text-[9px] font-bold text-[#7b8a9e] uppercase block">Tổng ngày nghỉ</label>
                         <input
                           type="number"
                           min="0"
                           value={summaryDaysAbsent}
                           onChange={(e) => setSummaryDaysAbsent(Math.max(0, parseInt(e.target.value) || 0))}
                           disabled={currentRole === 'subject_teacher'}
                           className="w-full px-3 py-1.5 bg-white border border-[#b8c6d9] rounded-lg font-bold text-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0] disabled:bg-gray-100 disabled:cursor-not-allowed"
                         />
                      </div>
                      <div className="space-y-1">
                         <label className="text-[9px] font-bold text-[#7b8a9e] uppercase block">Nghỉ có phép</label>
                         <input
                           type="number"
                           min="0"
                           value={summaryDaysAbsentExcused}
                           onChange={(e) => setSummaryDaysAbsentExcused(Math.max(0, parseInt(e.target.value) || 0))}
                           className="w-full px-3 py-1.5 bg-white border border-[#b8c6d9] rounded-lg font-bold text-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0]"
                         />
                      </div>
                   </div>
                </div>
                <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#fdfbf6] space-y-2 shadow-sm">
                   <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">III. Ý kiến nhận xét của GVCN</h4>
                   <textarea
                     rows={2}
                     value={summaryComment}
                     onChange={(e) => setSummaryComment(e.target.value)}
                     className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs font-semibold text-gray-700 italic focus:outline-none resize-none focus:ring-1 focus:ring-[#2c5ea0]"
                     placeholder="Nhập nhận xét tổng quát..."
                   />
                </div>
             </div>
           ) : (
             <div className="p-6 border-t border-[#b8c6d9] bg-[#f0f4fa] grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#4a5568] shrink-0 font-sans">
                <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#fdfbf6] space-y-2 shadow-sm">
                   <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">I. Kết quả rèn luyện</h4>
                   <div className="flex justify-between items-center mt-2 font-semibold">
                      <span>Hạnh kiểm học kỳ:</span>
                      <span className="font-bold text-[#2e6b8a] text-sm uppercase">{reportCard.summary.moralConduct}</span>
                   </div>
                </div>
                <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#fdfbf6] space-y-2 shadow-sm">
                   <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">II. Chuyên cần học tập</h4>
                   <div className="flex justify-between items-center mt-2 font-semibold">
                      <span>Tổng số buổi vắng học:</span>
                      <span className="font-bold text-[#1e2a3a]">{reportCard.summary.daysAbsent} buổi (Có phép: {reportCard.summary.daysAbsentExcused})</span>
                   </div>
                </div>
                <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#fdfbf6] flex flex-col justify-between shadow-sm">
                   <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">III. Nhận xét của giáo viên</h4>
                   <p className="text-[11px] font-sans font-medium text-gray-700 italic leading-relaxed mt-2 pl-2 border-l-2 border-[#2c5ea0]">
                      "{reportCard.summary.generalComment}"
                   </p>
                </div>
             </div>
           )}
        </div>
        <div className="p-6 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] shrink-0 sticky bottom-0 z-20 shadow-[0_-4px_6px_rgba(0,0,0,0.02)] flex justify-between items-center font-sans">
            <div className="flex gap-6">
                <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block mb-1 font-mono">
                      {selectedSemester === 'Cả Năm' ? 'Điểm TB Cả Năm (ĐTBcn)' : 'Điểm TB Các Môn (ĐTBcm)'}
                    </span>
                    <span className="font-serif text-2xl font-bold text-[#1e2a3a]">{activeGpa.toFixed(2)}</span>
                </div>
                <div className="border-l border-[#b8c6d9] pl-6">
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block mb-1 font-mono">Xếp Loại Học Lực</span>
                    <span className="font-bold text-[#2e6b8a] text-lg uppercase">{activeConduct}</span>
                </div>
                <div className="border-l border-[#b8c6d9] pl-6 hidden md:block">
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest block mb-1 font-mono">Danh Hiệu</span>
                    <span className="font-bold text-[#1e2a3a] text-lg">{getHonor(activeGpa, activeConduct)}</span>
                </div>
            </div>

            <div className="flex gap-3">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => {
                      if (confirm('Bạn có chắc chắn muốn hủy bỏ toàn bộ thay đổi vừa chỉnh sửa?')) {
                        setIsEditing(false);
                        const activeCard = fetchReportCard(currentStudent, selectedSemester);
                        setEditableScores(JSON.parse(JSON.stringify(activeCard.scores)));
                        setSummaryGpa(activeCard.summary.gpa);
                        setSummaryConduct(activeCard.summary.moralConduct);
                        setSummaryDaysAbsent(activeCard.summary.daysAbsent);
                        setSummaryDaysAbsentExcused(activeCard.summary.daysAbsentExcused);
                        setSummaryComment(activeCard.summary.generalComment);
                      }
                    }} 
                    className="px-5 py-2.5 rounded-full text-xs font-bold text-[#4a5568] bg-white border border-[#b8c6d9] hover:bg-gray-50 transition-all uppercase tracking-widest"
                  >
                    Hủy
                  </button>
                  <button 
                    onClick={handleSave} 
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-[#f5f8fc] bg-[#2c5ea0] hover:bg-[#683333] shadow-[2px_2px_0px_#4c2525] active:shadow-none active:translate-y-0.5 transition-all uppercase tracking-widest"
                  >
                    Lưu Điểm Số
                  </button>
                </>
              ) : (
                <>
                  {selectedSemester !== 'Cả Năm' && (
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="px-6 py-2.5 rounded-full text-xs font-bold text-[#f5f8fc] bg-[#2c5ea0] hover:bg-[#6b3535] shadow-[2px_2px_0px_#522727] active:shadow-none active:translate-y-0.5 transition-all uppercase tracking-widest animate-pulse"
                    >
                      Chỉnh Sửa Điểm Số
                    </button>
                  )}
                  <button 
                    onClick={onClose} 
                    className="px-6 py-2.5 rounded-full text-xs font-bold text-[#f5f8fc] bg-[#1e2a3a] hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none transition-all uppercase tracking-widest"
                  >
                    Đóng Bảng Điểm
                  </button>
                </>
              )}
            </div>
        </div>
      </div>
    </ModalBase>
  );
};;

/* --- 4. CONDUCT MODAL (Rèn luyện & Hạnh kiểm) --- */
export const ConductModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Hạnh Kiểm & Kỷ Luật" subtitle="Minh chứng đánh giá Rèn luyện" width="max-w-4xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
         <div className="flex gap-4">
             <div className="flex-1 bg-[#e8eef6] p-5 border border-[#b8c6d9] rounded-2xl flex flex-col justify-center items-center">
                 <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1 text-center">Đánh Giá Hạnh Kiểm HK1</p>
                 <p className="font-bold text-2xl text-[#1e2a3a] uppercase mt-2">Khá</p>
             </div>
             <div className="flex-1 bg-[#f0f4fa] p-5 border border-[#b8c6d9] rounded-2xl">
                 <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-3">Lời Phê Của GVCN</p>
                 <textarea rows={3} className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold text-[#1e2a3a] p-0 resize-none" defaultValue="Học lực tốt, có cố gắng. Nhưng cần chú ý chuyên cần và nội quy về đồng phục trong các tiết Thể dục." />
             </div>
         </div>

         <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b-2 border-[#2c5ea0] pb-2 flex items-center justify-between">
                  <span className="flex items-center"><Shield className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Sổ Kỷ Luật</span>
                  <button className="text-[10px] font-bold text-[#2c5ea0] bg-[#fee2e2] px-2 py-1 rounded">+ Thêm Vi Phạm</button>
               </h4>
               <div className="space-y-3">
                  <div className="p-4 border border-[#b8c6d9] bg-white rounded-xl shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#2c5ea0]"></div>
                      <p className="text-sm font-bold text-[#1e2a3a]">Quay cóp trong giờ kiểm tra 15p</p>
                      <p className="text-[10px] text-[#4a5568] mt-1 font-bold">Hình Thức: Nhắc nhở & Khiển trách</p>
                      <p className="text-[10px] text-[#7b8a9e] mt-2 font-mono">15/09/2025 • QĐ: 112/QD-KL</p>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b-2 border-[#2e6b8a] pb-2 flex items-center justify-between">
                  <span className="flex items-center"><Award className="w-4 h-4 mr-2 text-[#2e6b8a]" /> Sổ Khen Thưởng</span>
                  <button className="text-[10px] font-bold text-[#2e6b8a] bg-[#dcfce7] px-2 py-1 rounded">+ Thêm Khen Thưởng</button>
               </h4>
               <div className="space-y-3">
                  <div className="p-4 border border-[#b8c6d9] bg-white rounded-xl shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#2e6b8a]"></div>
                      <p className="text-sm font-bold text-[#1e2a3a]">Giải Khuyến khích IOE cấp Trường</p>
                      <p className="text-[10px] text-[#4a5568] mt-1 font-bold">Cấp QD: Ban Giám Hiệu</p>
                      <p className="text-[10px] text-[#7b8a9e] mt-2 font-mono">20/11/2025 • QĐ: 88/QD-KT</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng Lại</button>
        <button className="px-6 py-2.5 rounded-full text-xs font-bold text-white bg-[#1e2a3a] hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all uppercase tracking-widest">Lưu Đánh Giá</button>
      </div>
    </ModalBase>
  );
};

/* --- 5. EXCEL IMPORT MODAL --- */

// Column mapping (0-indexed, matches the 21-column template)
const COL = {
  grade: 0, className: 1, name: 2, gender: 3, dob: 4, cccd: 5,
  ethnicity: 6, address: 7, phone: 8, status: 9, admissionDate: 10,
  policyType: 11, parentFather: 12, parentFatherPhone: 13,
  parentMother: 14, parentMotherPhone: 15,
  guardianName: 16, guardianPhone: 17, guardianRelation: 18,
  insuranceCode: 19, medicalHistory: 20,
};

interface ParsedRow {
  rowNum: number;
  raw: any[];
  grade: number;
  className: string;
  name: string;
  gender: string;
  dob: string;
  cccd: string;
  ethnicity: string;
  address: string;
  phone: string;
  status: 'Đang Học' | 'Bảo Lưu' | 'Đình Chỉ';
  admissionDate: string;
  policyType: string;
  parentFather: string;
  parentFatherPhone: string;
  parentMother: string;
  parentMotherPhone: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  insuranceCode: string;
  medicalHistory: string;
  errors: string[];
  warnings: string[];
  proposedId?: string;
}

const STATUS_MAP: Record<string, 'Đang Học' | 'Bảo Lưu' | 'Đình Chỉ'> = {
  'đang học': 'Đang Học', 'bảo lưu': 'Bảo Lưu', 'đình chỉ': 'Đình Chỉ',
  'chuyển trường': 'Đình Chỉ',
};

function formatExcelDate(val: any): string {
  if (val === undefined || val === null || val === '') return '';

  if (val instanceof Date) {
    const day = String(val.getDate()).padStart(2, '0');
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const year = val.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle number (Excel serial date)
  if (typeof val === 'number') {
    if (val < 1) return '';
    const date = new Date((val - 25569) * 86400 * 1000);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  }

  // Handle string
  let str = String(val).trim();
  
  if (str.includes(' ')) {
    const parts = str.split(' ');
    if (parts[0].includes('/') || parts[0].includes('-')) {
      str = parts[0];
    }
  }

  // If it's a numeric string, try parsing as number
  if (/^\d+(\.\d+)?$/.test(str)) {
    const num = Number(str);
    if (num > 30000) { // likely excel serial date
      return formatExcelDate(num);
    }
  }

  // Handle standard date strings: YYYY-MM-DD or YYYY/MM/DD
  if (str.includes('-')) {
    const parts = str.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DD/MM/YYYY
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
  }

  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY/MM/DD -> DD/MM/YYYY
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
  }

  return str;
}

function parseRow(raw: any[], rowNum: number): ParsedRow {
  const str = (idx: number) => String(raw[idx] ?? '').trim();
  const grade = parseInt(str(COL.grade), 10) || 0;
  const rawStatus = str(COL.status).toLowerCase();
  const status = STATUS_MAP[rawStatus] ?? 'Đang Học';

  const dobStr = formatExcelDate(raw[COL.dob]);
  const admissionStr = formatExcelDate(raw[COL.admissionDate]);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!grade || ![10, 11, 12].includes(grade)) errors.push('Khối không hợp lệ (10/11/12)');
  if (!str(COL.name)) errors.push('Thiếu Họ và Tên');
  if (!['Nam', 'Nữ'].includes(str(COL.gender))) errors.push('Giới tính phải là Nam hoặc Nữ');
  if (!dobStr) errors.push('Thiếu Ngày sinh');
  if ((grade === 11 || grade === 12) && !str(COL.className)) errors.push('Khối 2/12 phải có cột Lớp');
  if (str(COL.policyType).toLowerCase() === 'mồ côi' && !str(COL.guardianName))
    warnings.push('Học sinh mồ côi chưa có tên người giám hộ');

  return {
    rowNum, raw, grade,
    className: str(COL.className),
    name: str(COL.name),
    gender: str(COL.gender),
    dob: dobStr,
    cccd: str(COL.cccd),
    ethnicity: str(COL.ethnicity) || 'Kinh',
    address: str(COL.address),
    phone: str(COL.phone),
    status,
    admissionDate: admissionStr,
    policyType: str(COL.policyType) || 'Không',
    parentFather: str(COL.parentFather),
    parentFatherPhone: str(COL.parentFatherPhone),
    parentMother: str(COL.parentMother),
    parentMotherPhone: str(COL.parentMotherPhone),
    guardianName: str(COL.guardianName),
    guardianPhone: str(COL.guardianPhone),
    guardianRelation: str(COL.guardianRelation),
    insuranceCode: str(COL.insuranceCode),
    medicalHistory: str(COL.medicalHistory),
    errors, warnings,
  };
}

function downloadTemplate() {
  const headers = [
    'Khối', 'Lớp', 'Họ và Tên', 'Giới Tính', 'Ngày Sinh', 'Số CCCD',
    'Dân Tộc', 'Địa Chỉ Thường Trú', 'Số Điện Thoại', 'Trạng Thái Học Vụ',
    'Ngày Nhập Học', 'Diện Chính Sách',
    'Họ Tên Cha', 'SĐT Cha', 'Họ Tên Mẹ', 'SĐT Mẹ',
    'Họ Tên Người Giám Hộ', 'SĐT Người Giám Hộ', 'Quan Hệ Với Học Sinh',
    'Mã Thẻ BHYT', 'Tiền Sử Bệnh Lý',
  ];
  const example1 = [
    10, '', 'NGUYỄN VĂN AN', 'Nam', '15/08/2018', '079208001234',
    'Kinh', 'An Hữu, Cái Bè, Tiền Giang', '0901234567', 'Đang học',
    '20/08/2025', 'Không',
    'Nguyễn Văn Hùng', '0911111111', 'Trần Thị Mai', '0922222222',
    '', '', '', 'HS4791000001', '',
  ];
  const example2 = [
    11, '2A1', 'LÊ THỊ BÍCH VÂN', 'Nữ', '20/01/2007', '079207009876',
    'Kinh', 'Hòa Khánh, Cái Bè, Tiền Giang', '0933333333', 'Đang học',
    '20/08/2024', 'Mồ côi',
    '', '', '', '',
    'Lê Văn Cường', '0944444444', 'Ông nội', 'HS4791000002', 'Không có',
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);
  ws['!cols'] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Học Sinh');
  XLSX.writeFile(wb, 'mau_nhap_hoc_sinh_th_An_Huu.xlsx');
}

const GRADE_IMPORT_COL = {
  studentId: 0,
  className: 1,
  name: 2,
  toan1: 3,
  toan2: 4,
  toanGK: 5,
  toanCK: 6,
  van1: 7,
  van2: 8,
  vanGK: 9,
  vanCK: 10,
  anh1: 11,
  anh2: 12,
  anhGK: 13,
  anhCK: 14,
  su1: 15,
  su2: 16,
  suGK: 17,
  suCK: 18,
  dia1: 19,
  dia2: 20,
  diaGK: 21,
  diaCK: 22,
  ly1: 23,
  ly2: 24,
  lyGK: 25,
  lyCK: 26,
  hoa1: 27,
  hoa2: 28,
  hoaGK: 29,
  hoaCK: 30,
  sinh1: 31,
  sinh2: 32,
  sinhGK: 33,
  sinhCK: 34,
  ktpl1: 35,
  ktpl2: 36,
  ktplGK: 37,
  ktplCK: 38,
  tin1: 39,
  tin2: 40,
  tinGK: 41,
  tinCK: 42,
  cn1: 43,
  cn2: 44,
  cnGK: 45,
  cnCK: 46,
  qpan1: 47,
  qpan2: 48,
  qpanGK: 49,
  qpanCK: 50,
  daysAbsent: 51,
  daysAbsentExcused: 52,
  moralConduct: 53,
  teacherComment: 54,
} as const;

const GRADE_IMPORT_SUBJECTS = [
  { subject: 'Toán Học', cols: [GRADE_IMPORT_COL.toan1, GRADE_IMPORT_COL.toan2, GRADE_IMPORT_COL.toanGK, GRADE_IMPORT_COL.toanCK] },
  { subject: 'Ngữ Văn', cols: [GRADE_IMPORT_COL.van1, GRADE_IMPORT_COL.van2, GRADE_IMPORT_COL.vanGK, GRADE_IMPORT_COL.vanCK] },
  { subject: 'Tiếng Anh', cols: [GRADE_IMPORT_COL.anh1, GRADE_IMPORT_COL.anh2, GRADE_IMPORT_COL.anhGK, GRADE_IMPORT_COL.anhCK] },
  { subject: 'Lịch Sử', cols: [GRADE_IMPORT_COL.su1, GRADE_IMPORT_COL.su2, GRADE_IMPORT_COL.suGK, GRADE_IMPORT_COL.suCK] },
  { subject: 'Địa Lý', cols: [GRADE_IMPORT_COL.dia1, GRADE_IMPORT_COL.dia2, GRADE_IMPORT_COL.diaGK, GRADE_IMPORT_COL.diaCK] },
  { subject: 'Vật Lý', cols: [GRADE_IMPORT_COL.ly1, GRADE_IMPORT_COL.ly2, GRADE_IMPORT_COL.lyGK, GRADE_IMPORT_COL.lyCK] },
  { subject: 'Hóa Học', cols: [GRADE_IMPORT_COL.hoa1, GRADE_IMPORT_COL.hoa2, GRADE_IMPORT_COL.hoaGK, GRADE_IMPORT_COL.hoaCK] },
  { subject: 'Sinh Học', cols: [GRADE_IMPORT_COL.sinh1, GRADE_IMPORT_COL.sinh2, GRADE_IMPORT_COL.sinhGK, GRADE_IMPORT_COL.sinhCK] },
  { subject: 'KTPL (Kinh tế Pháp luật)', cols: [GRADE_IMPORT_COL.ktpl1, GRADE_IMPORT_COL.ktpl2, GRADE_IMPORT_COL.ktplGK, GRADE_IMPORT_COL.ktplCK] },
  { subject: 'Tin Học', cols: [GRADE_IMPORT_COL.tin1, GRADE_IMPORT_COL.tin2, GRADE_IMPORT_COL.tinGK, GRADE_IMPORT_COL.tinCK] },
  { subject: 'Công Nghệ', cols: [GRADE_IMPORT_COL.cn1, GRADE_IMPORT_COL.cn2, GRADE_IMPORT_COL.cnGK, GRADE_IMPORT_COL.cnCK] },
  { subject: 'Giáo dục quốc phòng và an ninh', cols: [GRADE_IMPORT_COL.qpan1, GRADE_IMPORT_COL.qpan2, GRADE_IMPORT_COL.qpanGK, GRADE_IMPORT_COL.qpanCK] },
] as const;

interface ParsedGradeRow {
  rowNum: number;
  studentId: string;
  className: string;
  name: string;
  scores: {
    subject: string;
    multiplier1: [string, string];
    multiplier2: [string];
    multiplier3: string;
    average: number;
  }[];
  daysAbsent: number;
  daysAbsentExcused: number;
  moralConduct: 'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu';
  teacherComment: string;
  errors: string[];
  warnings: string[];
  matchedStudent?: Student;
}

function parseGradeNumeric(value: any): number {
  const str = String(value ?? '').trim().replace(',', '.');
  if (str === '') return NaN;
  const parsed = parseFloat(str);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function clampGrade(value: number): number {
  if (isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 10);
}

function calculateWeightedAverage(m1: number[], m2: number[], m3: number): number {
  const totalWeight = m1.filter(v => !isNaN(v)).length + m2.filter(v => !isNaN(v)).length * 2 + (isNaN(m3) ? 0 : 3);
  if (totalWeight === 0) return 0;
  const sum = m1.reduce((acc, v) => acc + (isNaN(v) ? 0 : v), 0)
    + m2.reduce((acc, v) => acc + (isNaN(v) ? 0 : v) * 2, 0)
    + (isNaN(m3) ? 0 : m3 * 3);
  return parseFloat((sum / totalWeight).toFixed(1));
}

function createGradeRow(raw: any[], rowNum: number, students: Student[]): ParsedGradeRow {
  const str = (idx: number) => String(raw[idx] ?? '').trim();
  const studentId = str(GRADE_IMPORT_COL.studentId);
  const className = str(GRADE_IMPORT_COL.className);
  const name = str(GRADE_IMPORT_COL.name);

  const matchedById = studentId ? students.find(s => s.id === studentId) : undefined;
  const matchedByName = !matchedById && name && className
    ? students.filter(s => s.name === name && s.grade === className)
    : [];
  const matchedStudent = matchedById || (matchedByName.length === 1 ? matchedByName[0] : undefined);

  const errors: string[] = [];
  const warnings: string[] = [];

  if (!studentId) errors.push('Thiếu Mã HS');
  if (!matchedStudent) {
    errors.push(`Không tìm thấy HS với Mã HS ${studentId || '(trống)'} và/lớp ${className}`);
  }

  if (matchedStudent && className && matchedStudent.grade !== className) {
    warnings.push(`Lớp file ${className} không trùng lớp hệ thống ${matchedStudent.grade}`);
  }

  const scores = GRADE_IMPORT_SUBJECTS.map((item) => {
    const values = item.cols.map((c) => parseGradeNumeric(raw[c]));
    const invalidValues = values.filter((v) => !isNaN(v) && (v < 0 || v > 10));
    if (invalidValues.length > 0) {
      errors.push(`Môn ${item.subject}: điểm phải trong khoảng 0-10`);
    }
    const multiplier1: [string, string] = [
      values[0] === 0 ? '' : String(clampGrade(values[0]).toFixed(1)),
      values[1] === 0 ? '' : String(clampGrade(values[1]).toFixed(1))
    ];
    const multiplier2: [string] = [values[2] === 0 ? '' : String(clampGrade(values[2]).toFixed(1))];
    const multiplier3 = values[3] === 0 ? '' : String(clampGrade(values[3]).toFixed(1));
    const average = calculateWeightedAverage(
      [parseGradeNumeric(multiplier1[0]), parseGradeNumeric(multiplier1[1])],
      [parseGradeNumeric(multiplier2[0])],
      parseGradeNumeric(multiplier3)
    );
    return { subject: item.subject, multiplier1, multiplier2, multiplier3, average };
  });

  const daysAbsent = parseInt(String(raw[GRADE_IMPORT_COL.daysAbsent] ?? ''), 10);
  const daysAbsentExcused = parseInt(String(raw[GRADE_IMPORT_COL.daysAbsentExcused] ?? ''), 10);
  const moralConductRaw = String(raw[GRADE_IMPORT_COL.moralConduct] ?? '').trim();
  const moralConduct = ['Tốt', 'Khá', 'Trung Bình', 'Yếu'].includes(moralConductRaw)
    ? (moralConductRaw as ParsedGradeRow['moralConduct'])
    : 'Tốt';
  const teacherComment = String(raw[GRADE_IMPORT_COL.teacherComment] ?? '').trim() || 'Đã nhập điểm từ file Excel.';

  if (!Number.isNaN(daysAbsent) && !Number.isNaN(daysAbsentExcused) && daysAbsentExcused > daysAbsent) {
    warnings.push('Số ngày nghỉ có phép lớn hơn tổng ngày nghỉ');
  }

  return {
    rowNum,
    studentId,
    className,
    name,
    scores,
    daysAbsent: Number.isNaN(daysAbsent) ? 0 : daysAbsent,
    daysAbsentExcused: Number.isNaN(daysAbsentExcused) ? 0 : daysAbsentExcused,
    moralConduct,
    teacherComment,
    errors,
    warnings,
    matchedStudent,
  };
}

function getAcademicConductFromGpa(gpa: number): ReportCardSummary['academicConduct'] {
  if (gpa >= 9.0) return 'Xuất Sắc';
  if (gpa >= 8.0) return 'Giỏi';
  if (gpa >= 6.5) return 'Khá';
  if (gpa >= 5.0) return 'Trung Bình';
  return 'Yếu';
}

export const GradeExcelImportModal = ({
  isOpen,
  onClose,
  onSuccess,
}: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedGradeRow[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number; warnings: number } | null>(null);
  const [selectedSemester, setSelectedSemester] = useState<'Học Kỳ I' | 'Học Kỳ II'>('Học Kỳ I');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFileName('');
      setRows([]);
      setResult(null);
      getStudents().then(setStudents).catch(err => {
        console.error('Failed to load students for grade import:', err);
      });
    }
  }, [isOpen]);

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      const dataRows = rawData.slice(1).filter(r => r.some(c => String(c).trim()));
      const parsed = dataRows.map((raw, i) => createGradeRow(raw, i + 2, students));
      setRows(parsed);
      setFileName(file.name);
    };
    reader.readAsArrayBuffer(file);
  }, [students]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const validRows = rows.filter(r => r.errors.length === 0);
  const errorRows = rows.filter(r => r.errors.length > 0);
  const warnRows = rows.filter(r => r.errors.length === 0 && r.warnings.length > 0);

  const downloadGradeTemplate = () => {
    const headers = [
      'Mã HS', 'Lớp', 'Họ và Tên',
      'Toán TX1', 'Toán TX2', 'Toán GK', 'Toán CK',
      'Ngữ Văn TX1', 'Ngữ Văn TX2', 'Ngữ Văn GK', 'Ngữ Văn CK',
      'Tiếng Anh TX1', 'Tiếng Anh TX2', 'Tiếng Anh GK', 'Tiếng Anh CK',
      'Lịch Sử TX1', 'Lịch Sử TX2', 'Lịch Sử GK', 'Lịch Sử CK',
      'Địa Lý TX1', 'Địa Lý TX2', 'Địa Lý GK', 'Địa Lý CK',
      'Vật Lý TX1', 'Vật Lý TX2', 'Vật Lý GK', 'Vật Lý CK',
      'Hóa Học TX1', 'Hóa Học TX2', 'Hóa Học GK', 'Hóa Học CK',
      'Sinh Học TX1', 'Sinh Học TX2', 'Sinh Học GK', 'Sinh Học CK',
      'KTPL TX1', 'KTPL TX2', 'KTPL GK', 'KTPL CK',
      'Tin Học TX1', 'Tin Học TX2', 'Tin Học GK', 'Tin Học CK',
      'Công Nghệ TX1', 'Công Nghệ TX2', 'Công Nghệ GK', 'Công Nghệ CK',
      'QPAN TX1', 'QPAN TX2', 'QPAN GK', 'QPAN CK',
      'Tổng ngày nghỉ', 'Ngày nghỉ có phép', 'Hạnh kiểm', 'Nhận xét chung',
    ];
    const example1 = [
      'HS2025.101', '1A1', 'NGUYỄN VĂN AN', 8.0, 7.5, 8.5, 9.0,
      7.0, 7.5, 8.0, 8.5,
      8.5, 8.0, 7.5, 8.0,
      7.0, 7.0, 7.5, 8.0,
      7.5, 7.0, 7.0, 7.5,
      8.5, 8.0, 8.0, 8.5,
      7.5, 7.0, 7.5, 7.5,
      8.0, 7.5, 8.0, 8.0,
      8.0, 8.0, 7.5, 8.0,
      8.0, 7.5, 8.0, 8.0,
      7, 2, 'Tốt', 'Học sinh có tinh thần học tập tích cực, tiếp thu nhanh.',
    ];
    const example2 = [
      'HS2025.102', '1A1', 'LÊ THỊ BÍCH VÂN', 7.5, 7.0, 7.5, 8.0,
      8.0, 7.5, 7.0, 7.5,
      8.5, 8.0, 7.5, 7.5,
      7.0, 7.0, 7.5, 7.5,
      7.5, 7.0, 7.0, 7.5,
      7.5, 7.5, 8.0, 8.0,
      7.0, 7.0, 7.5, 7.5,
      8.0, 8.0, 7.5, 8.0,
      7.0, 7.0, 7.5, 7.5,
      8.0, 8.0, 7.5, 7.5,
      6, 1, 'Khá', 'Cần bổ sung thêm bài tập về nhà để nâng cao.',
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2]);
    ws['!cols'] = headers.map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhập Điểm Học Kỳ');
    XLSX.writeFile(wb, 'mau_nhap_diem_hoc_ky.xlsx');
  };

  const getReportCardSummary = (scores: ParsedGradeRow['scores'], row: ParsedGradeRow): ReportCardSummary => {
    const numericScores = scores.filter(s => typeof s.average === 'number');
    const gpa = numericScores.length > 0 ? parseFloat((numericScores.reduce((sum, s) => sum + s.average, 0) / numericScores.length).toFixed(2)) : 0;
    return {
      gpa,
      academicConduct: getAcademicConductFromGpa(gpa),
      moralConduct: row.moralConduct,
      daysAbsent: row.daysAbsent,
      daysAbsentExcused: row.daysAbsentExcused,
      generalComment: row.teacherComment || 'Đã nhập từ file Excel.',
    };
  };

  const syncCaNamCard = async (student: Student, semester: 'Học Kỳ I' | 'Học Kỳ II', savedCard: ReportCardDocument) => {
    const otherSemester = semester === 'Học Kỳ I' ? 'Học Kỳ II' : 'Học Kỳ I';
    const otherCard = await getReportCard(student.id, otherSemester);
    if (!otherCard) return;

    const hk1 = semester === 'Học Kỳ I' ? savedCard : otherCard;
    const hk2 = semester === 'Học Kỳ II' ? savedCard : otherCard;
    const scores = hk1.scores.map((s1, index) => {
      const s2 = hk2.scores[index];
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
              ? 'Cả năm hoàn thành xuất sắc.'
              : 'Cần phát huy thêm để đạt mức 8.0+.'),
      };
    });
    const numericScores = scores.filter(s => typeof s.average === 'number');
    const gpa = numericScores.length > 0 ? parseFloat((numericScores.reduce((sum, s) => sum + (s.average as number), 0) / numericScores.length).toFixed(2)) : 0;
    const caNamDoc: ReportCardDocument = {
      id: `${student.id}_Cả Năm`,
      studentId: student.id,
      semester: 'Cả Năm',
      name: student.name,
      dob: student.dob,
      gender: student.gender,
      grade: student.grade,
      gvcn: savedCard.gvcn,
      academicYear: savedCard.academicYear,
      scores,
      summary: {
        gpa,
        academicConduct: getAcademicConductFromGpa(gpa),
        moralConduct: hk1.summary.moralConduct,
        daysAbsent: hk1.summary.daysAbsent + hk2.summary.daysAbsent,
        daysAbsentExcused: hk1.summary.daysAbsentExcused + hk2.summary.daysAbsentExcused,
        generalComment: gpa >= 8.0 ? 'Học lực vững, đủ điều kiện xét lên lớp.' : 'Cần bổ sung thêm kết quả học tập để quyết định cuối năm.',
      }
    };
    await saveReportCard(caNamDoc);
  };

  const handleImport = async () => {
    setProcessing(true);
    try {
      const importRows = validRows.filter(r => r.matchedStudent);
      let imported = 0;
      let skipped = 0;
      for (const row of importRows) {
        const student = row.matchedStudent!;
        const reportCardDoc: ReportCardDocument = {
          id: `${student.id}_${selectedSemester}`,
          studentId: student.id,
          semester: selectedSemester,
          name: student.name,
          dob: student.dob,
          gender: student.gender,
          grade: student.grade,
          gvcn: student.grade === '1A1' ? 'Cô Lê Thị Thảo' : 'Cô Lê Thị Thảo',
          academicYear: `2025-2026`,
          scores: row.scores.map(score => ({
            subject: score.subject,
            multiplier1: [score.multiplier1[0] === '' ? 0 : parseFloat(score.multiplier1[0]), score.multiplier1[1] === '' ? 0 : parseFloat(score.multiplier1[1])],
            multiplier2: [score.multiplier2[0] === '' ? 0 : parseFloat(score.multiplier2[0])],
            multiplier3: score.multiplier3 === '' ? 0 : parseFloat(score.multiplier3),
            average: score.average,
            teacherComment: 'Nhập điểm tự động từ file Excel.'
          })),
          summary: getReportCardSummary(row.scores, row),
        };

        try {
          await saveReportCard(reportCardDoc);
          await syncCaNamCard(student, selectedSemester, reportCardDoc);
          imported += 1;
        } catch (error) {
          console.error('Failed to save report card during grade import:', error);
          skipped += 1;
        }
      }

      setResult({ imported, skipped, errors: errorRows.length, warnings: warnRows.length });
      setStep(3);
      window.dispatchEvent(new Event('grades-updated'));
      onSuccess();
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Nhập Điểm Học Kỳ từ Excel" subtitle="Nhập theo từng môn, tự tính trung bình học kỳ và năm" width="max-w-5xl" fixedHeight>
      <div className="flex flex-col h-full bg-[#f5f8fc] relative">
        <div className="p-6 border-b border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center">
          <div className="w-[220px]">
            <BaseSelect
              label="Học kỳ"
              value={selectedSemester}
              options={[{ value: 'Học Kỳ I', label: 'Học Kỳ I' }, { value: 'Học Kỳ II', label: 'Học Kỳ II' }]}
              onChange={(val) => setSelectedSemester(val as 'Học Kỳ I' | 'Học Kỳ II')}
            />
          </div>
          <button
            onClick={downloadGradeTemplate}
            className="flex items-center px-4 py-2 rounded-full text-xs font-bold bg-[#e8eef6] border border-[#b8c6d9] text-[#4a5568] hover:bg-[#dce4ee] transition gap-2"
          >
            <Download className="w-3.5 h-3.5" /> Tải File Mẫu
          </button>
          <div className="text-xs text-[#4a5568] italic">File phải có cột Mã HS để ghép dữ liệu</div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {step === 1 && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragging ? 'border-[#2c5ea0] bg-[#fdf5f0]' : 'border-[#b8c6d9] hover:border-[#2c5ea0] hover:bg-[#fdf9f5]'}`}
              >
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
                <Upload className="w-10 h-10 mx-auto text-[#7b8a9e] mb-3" />
                {fileName ? (
                  <>
                    <p className="font-bold text-[#1e2a3a] text-sm">{fileName}</p>
                    <p className="text-xs text-[#2e6b8a] font-bold mt-1">Đã tải • {rows.length} dòng dữ liệu</p>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-[#4a5568] text-sm">Kéo thả file Excel vào đây</p>
                    <p className="text-xs text-[#7b8a9e] mt-1">hoặc nhấp để chọn file • .xlsx / .xls</p>
                  </>
                )}
              </div>

              {rows.length > 0 && (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Tổng dòng', val: rows.length, color: 'text-[#1e2a3a]' },
                      { label: 'Hợp lệ', val: validRows.length, color: 'text-[#2e6b8a]' },
                      { label: 'Cảnh báo', val: warnRows.length, color: 'text-amber-700' },
                      { label: 'Lỗi', val: errorRows.length, color: 'text-[#2c5ea0]' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#e8eef6] border border-[#b8c6d9] p-3 rounded-xl text-center">
                        <p className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-serif font-bold mt-0.5 ${s.color}`}>{s.val}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border border-[#b8c6d9] rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#e8eef6] border-b border-[#b8c6d9]">
                        <tr>
                          {['Dòng', 'Mã HS', 'Họ và Tên', 'Lớp', 'TB Môn', 'Lỗi / Cảnh báo'].map(h => (
                            <th key={h} className="p-2.5 text-[9px] font-bold text-[#4a5568] uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dce4ee] bg-white">
                        {rows.slice(0, 8).map((row) => (
                          <tr key={row.rowNum} className={row.errors.length > 0 ? 'bg-red-50' : row.warnings.length > 0 ? 'bg-amber-50' : 'hover:bg-[#f5f8fc]'}>
                            <td className="p-2.5 font-mono text-[#7b8a9e]">{row.rowNum}</td>
                            <td className="p-2.5 font-mono font-bold text-[#2c5ea0]">{row.studentId || '—'}</td>
                            <td className="p-2.5 font-bold text-[#1e2a3a]">{row.name || '—'}</td>
                            <td className="p-2.5 text-[#4a5568]">{row.className || '—'}</td>
                            <td className="p-2.5 font-semibold text-[#2e6b8a]">{row.scores.length ? row.scores[0].average.toFixed(1) : '0.0'}</td>
                            <td className="p-2.5 text-[11px] text-[#4a5568]">
                              {row.errors.length > 0 ? row.errors.join('; ') : row.warnings.join('; ') || 'OK'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 8 && <p className="text-center text-[10px] text-[#7b8a9e] py-2 bg-[#e8eef6] border-t border-[#b8c6d9]">Hiển thị 8/{rows.length} dòng • Tất cả sẽ được xử lý khi nhập</p>}
                  </div>
                </>
              )}
            </>
          )}

          {step === 2 && (
            <>
              {errorRows.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs text-red-800">
                  <p className="font-bold uppercase tracking-wider mb-2">{errorRows.length} dòng có lỗi sẽ không được nhập</p>
                  <ul className="space-y-1">
                    {errorRows.slice(0, 5).map(r => (
                      <li key={r.rowNum}><strong>Dòng {r.rowNum}:</strong> {r.errors.join(', ')}</li>
                    ))}
                    {errorRows.length > 5 && <li className="italic">...và {errorRows.length - 5} dòng lỗi khác</li>}
                  </ul>
                </div>
              )}

              {warnRows.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800">
                  <p className="font-bold uppercase tracking-wider mb-2">{warnRows.length} dòng có cảnh báo</p>
                  <ul className="space-y-1">
                    {warnRows.slice(0, 3).map(r => (
                      <li key={r.rowNum}><strong>Dòng {r.rowNum}:</strong> {r.warnings.join(', ')}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl text-xs">
                  <p className="font-bold uppercase tracking-wider text-[#4a5568] mb-2">Đã chuẩn bị</p>
                  <p className="text-3xl font-serif font-bold text-[#2e6b8a]">{validRows.length}</p>
                  <p className="text-[#7b8a9e]">dòng sẵn sàng nhập</p>
                </div>
                <div className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl text-xs">
                  <p className="font-bold uppercase tracking-wider text-[#4a5568] mb-2">Chưa hợp lệ</p>
                  <p className="text-3xl font-serif font-bold text-[#2c5ea0]">{errorRows.length}</p>
                  <p className="text-[#7b8a9e]">dòng bị bỏ qua</p>
                </div>
              </div>
            </>
          )}

          {step === 3 && result && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <CheckCircle2 className="w-16 h-16 text-[#2e6b8a]" />
              <div>
                <h3 className="text-xl font-serif font-bold text-[#1e2a3a]">Nhập Điểm Hoàn Tất!</h3>
                <p className="text-xs text-[#4a5568] mt-2">Hệ thống đã lưu bảng điểm học kỳ và cập nhật điểm trung bình cả năm khi có đủ HK I và HK II.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
                <div className="bg-[#e5f0e8] border border-[#2e6b8a]/20 p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#2e6b8a]">Nhập thành công</p>
                  <p className="text-3xl font-serif font-bold text-[#2e6b8a] mt-1">{result.imported}</p>
                </div>
                <div className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#7b8a9e]">Bỏ qua</p>
                  <p className="text-3xl font-serif font-bold text-[#4a5568] mt-1">{result.skipped + result.errors}</p>
                </div>
                <div className="bg-[#fff7ed] border border-[#f0c39a] p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#b45309]">Cảnh báo</p>
                  <p className="text-3xl font-serif font-bold text-[#b45309] mt-1">{result.warnings}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] shrink-0 flex justify-between items-center gap-3">
          <button onClick={onClose} disabled={processing}
            className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors disabled:opacity-50">
            Đóng
          </button>
          <div className="flex gap-3">
            {step === 1 && rows.length > 0 && (
              <button onClick={() => setStep(2)}
                className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] transition-all gap-2">
                Kiểm Tra <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {step === 2 && (
              <>
                <button onClick={() => setStep(1)}
                  className="flex items-center px-5 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors gap-1">
                  <ChevronLeft className="w-4 h-4" /> Quay Lại
                </button>
                <button onClick={handleImport} disabled={processing || validRows.length === 0}
                  className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] transition-all disabled:opacity-50 gap-2">
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {processing ? 'Đang nhập...' : `Nhập ${validRows.length} HS`}
                </button>
              </>
            )}
            {step === 3 && (
              <button onClick={onClose}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[#f5f8fc] bg-[#2c5ea0] hover:bg-[#683333] uppercase tracking-widest transition-all">
                Hoàn tất
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalBase>
  );
}

interface Grade10Preview {
  className: string;
  current: number;
  added: number;
  total: number;
  active: boolean;
}

export const ExcelImportModal = ({
  isOpen, onClose, onSuccess,
}: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [existingStudents, setExistingStudents] = useState<Student[]>([]);
  const [grade10Preview, setGrade10Preview] = useState<Grade10Preview[]>([]);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1); setFileName(''); setRows([]); setResult(null);
      Promise.all([getClasses(), getStudents()]).then(([cls, sts]) => {
        setClasses(cls || []);
        setExistingStudents(sts || []);
      });
    }
  }, [isOpen]);

  const assignProposedIds = (parsedRows: ParsedRow[]) => {
    const yr = getSystemAcademicYear();
    const usedIds = new Set<string>();

    const generateId = (gradeLevel: number): string => {
      const prefix = gradeLevel === 10 ? yr % 100 : gradeLevel === 11 ? (yr - 1) % 100 : (yr - 2) % 100;
      let seq = 1;
      const allIds = [...existingStudents.map(s => s.id), ...Array.from(usedIds)];
      allIds.forEach(id => {
        const p = `${prefix}.`;
        if (id.startsWith(p)) {
          const n = parseInt(id.slice(p.length), 10);
          if (!isNaN(n) && n >= seq) seq = n + 1;
        }
      });
      return `${prefix}.${String(seq).padStart(3, '0')}`;
    };

    const validRows = parsedRows.filter(r => r.errors.length === 0);
    const g10Rows = validRows.filter(r => r.grade === 10);
    const g11g12Rows = validRows.filter(r => r.grade === 11 || r.grade === 12);

    // Sort Grade 10 by name to match handleImport logic
    const sortedG10 = [...g10Rows].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    // Map to store proposed IDs
    const idMap = new Map<number, string>();

    // Assign Grade 10 IDs
    sortedG10.forEach(row => {
      const id = generateId(10);
      usedIds.add(id);
      idMap.set(row.rowNum, id);
    });

    // Assign Grade 11/12 IDs
    const validG11G12 = g11g12Rows.filter(r => classes.some(c => c.name === r.className));
    validG11G12.forEach(row => {
      const id = generateId(row.grade);
      usedIds.add(id);
      idMap.set(row.rowNum, id);
    });

    // Write proposedId back to parsedRows
    parsedRows.forEach(r => {
      if (idMap.has(r.rowNum)) {
        r.proposedId = idMap.get(r.rowNum);
      } else {
        r.proposedId = undefined;
      }
    });
  };

  const parseFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawData: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      // Skip header row
      const dataRows = rawData.slice(1).filter(r => r.some(c => String(c).trim()));
      const parsed = dataRows.map((r, i) => parseRow(r, i + 2));
      assignProposedIds(parsed);
      setRows(parsed);
      setFileName(file.name);
      // Build Grade 10 preview
      buildGrade10Preview(parsed, classes, existingStudents);
    };
    reader.readAsArrayBuffer(file);
  }, [classes, existingStudents]);

  const buildGrade10Preview = (
    parsedRows: ParsedRow[],
    allClasses: ClassData[],
    allStudents: Student[]
  ) => {
    const g10Students = parsedRows.filter(r => r.grade === 10 && r.errors.length === 0);
    const N_new = g10Students.length;
    const existingG10 = allStudents.filter(s => {
      const cls = allClasses.find(c => c.name === s.grade);
      return cls && cls.grade === 10;
    });
    const N_total = existingG10.length + N_new;
    const g10Classes = allClasses
      .filter(c => c.grade === 10 && c.status === 'Đang hoạt động')
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const M = g10Classes.length;
    if (M === 0) { setGrade10Preview([]); return; }
    const A = Math.min(M, Math.max(1, Math.ceil(N_total / 47)));
    const targets = g10Classes.map((_, i) =>
      i < A ? Math.floor(N_total / A) + (i < (N_total % A) ? 1 : 0) : 0
    );
    const preview: Grade10Preview[] = g10Classes.map((cls, i) => {
      const current = allStudents.filter(s => s.grade === cls.name).length;
      const total = targets[i];
      return { className: cls.name, current, added: Math.max(0, total - current), total, active: i < A };
    });
    setGrade10Preview(preview);
  };

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const validRows = rows.filter(r => r.errors.length === 0);
  const errorRows = rows.filter(r => r.errors.length > 0);
  const warnRows = rows.filter(r => r.errors.length === 0 && r.warnings.length > 0);
  const g10Rows = validRows.filter(r => r.grade === 10);
  const g11g12Rows = validRows.filter(r => r.grade === 11 || r.grade === 12);

  // Validate class names for 11/12
  const invalidClassRows = g11g12Rows.filter(r => !classes.some(c => c.name === r.className));

  const getSystemAcademicYear = () => {
    const stored = localStorage.getItem('active_academic_year_name');
    if (stored) { const m = stored.match(/\d{4}/); if (m) return parseInt(m[0], 10); }
    return 2025;
  };

  const generateStudentId = (gradeLevel: number, existingIds: Set<string>): string => {
    const yr = getSystemAcademicYear();
    const prefix = gradeLevel === 10 ? yr % 100 : gradeLevel === 11 ? (yr - 1) % 100 : (yr - 2) % 100;
    let seq = 1;
    const allIds = [...existingStudents.map(s => s.id), ...Array.from(existingIds)];
    allIds.forEach(id => {
      const p = `${prefix}.`;
      if (id.startsWith(p)) {
        const n = parseInt(id.slice(p.length), 10);
        if (!isNaN(n) && n >= seq) seq = n + 1;
      }
    });
    const idCandidate = `${prefix}.${String(seq).padStart(3, '0')}`;
    return idCandidate;
  };

  const handleImport = async () => {
    setProcessing(true);
    try {
      const usedIds = new Set<string>();
      // Sort grade 10 by name for stable assignment
      const sortedG10 = [...g10Rows].sort((a, b) => a.name.localeCompare(b.name, 'vi'));

      // For grade 10: assign classes using greedy algorithm
      const g10Classes = classes
        .filter(c => c.grade === 10 && c.status === 'Đang hoạt động')
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      const existingG10Count = existingStudents.filter(s => g10Classes.some(c => c.name === s.grade)).length;
      const N_total = existingG10Count + sortedG10.length;
      const M = g10Classes.length;
      const A = M > 0 ? Math.min(M, Math.max(1, Math.ceil(N_total / 47))) : 0;
      const targets = g10Classes.map((_, i) =>
        i < A ? Math.floor(N_total / A) + (i < (N_total % A) ? 1 : 0) : 0
      );
      const currentCounts = g10Classes.map(cls =>
        existingStudents.filter(s => s.grade === cls.name).length
      );
      const deltas = g10Classes.map(() => 0);
      const simCounts = [...currentCounts];
      sortedG10.forEach(() => {
        let best = -1, minDiff = Infinity;
        for (let i = 0; i < A; i++) {
          const diff = simCounts[i] - targets[i];
          if (diff < minDiff || (diff === minDiff && simCounts[i] < simCounts[best])) {
            minDiff = diff; best = i;
          }
        }
        if (best !== -1) { simCounts[best]++; deltas[best]++; }
      });

      // Build student records
      const studentsToCreate: Student[] = [];
      let g10Offset = 0;
      let g10ClassStudents: { cls: ClassData; students: ParsedRow[] }[] = g10Classes.map((cls, i) => ({
        cls,
        students: sortedG10.slice(
          g10Classes.slice(0, i).reduce((s, _, ii) => s + deltas[ii], 0),
          g10Classes.slice(0, i).reduce((s, _, ii) => s + deltas[ii], 0) + deltas[i]
        ),
      }));

      let offset = 0;
      for (let i = 0; i < g10Classes.length; i++) {
        const cls = g10Classes[i];
        const assigned = sortedG10.slice(offset, offset + deltas[i]);
        offset += deltas[i];
        for (const row of assigned) {
          const id = generateStudentId(10, usedIds);
          usedIds.add(id);
          const email = `${id.replace('.', '')}@student.mnah.edu.vn`;
          studentsToCreate.push({
            id, name: row.name, dob: row.dob, gender: row.gender,
            grade: cls.name, status: row.status, phone: row.phone,
            address: row.address, guardian: row.guardianName || row.parentFather || '',
            cccd: row.cccd, ethnicity: row.ethnicity, admissionDate: row.admissionDate,
            policyType: row.policyType, parentFather: row.parentFather,
            parentFatherPhone: row.parentFatherPhone, parentMother: row.parentMother,
            parentMotherPhone: row.parentMotherPhone, guardianPhone: row.guardianPhone,
            guardianRelation: row.guardianRelation, insuranceCode: row.insuranceCode,
            medicalHistory: row.medicalHistory, email,
          });
        }
      }

      // Grade 11/12 students
      for (const row of g11g12Rows) {
        if (!classes.some(c => c.name === row.className)) continue;
        const id = generateStudentId(row.grade, usedIds);
        usedIds.add(id);
        const email = `${id.replace('.', '')}@student.mnah.edu.vn`;
        studentsToCreate.push({
          id, name: row.name, dob: row.dob, gender: row.gender,
          grade: row.className, status: row.status, phone: row.phone,
          address: row.address, guardian: row.guardianName || row.parentFather || '',
          cccd: row.cccd, ethnicity: row.ethnicity, admissionDate: row.admissionDate,
          policyType: row.policyType, parentFather: row.parentFather,
          parentFatherPhone: row.parentFatherPhone, parentMother: row.parentMother,
          parentMotherPhone: row.parentMotherPhone, guardianPhone: row.guardianPhone,
          guardianRelation: row.guardianRelation, insuranceCode: row.insuranceCode,
          medicalHistory: row.medicalHistory, email,
        });
      }

      const res = await batchCreateStudents(studentsToCreate);

      // Update currentCount for all affected classes
      const countMap = new Map<string, number>();
      studentsToCreate.forEach(s => {
        if (!res.skipped.includes(s.id)) {
          countMap.set(s.grade, (countMap.get(s.grade) || 0) + 1);
        }
      });
      await Promise.all(
        Array.from(countMap.entries()).map(async ([clsName, added]) => {
          const cls = classes.find(c => c.name === clsName);
          if (cls) {
            const existCount = existingStudents.filter(s => s.grade === clsName).length;
            await saveClassOnly({ ...cls, currentCount: existCount + added });
          }
        })
      );

      setResult(res);
      setStep(3);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi trong quá trình nhập. Vui lòng thử lại.');
    } finally {
      setProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose}
      title="Nhập Học Sinh Từ File Excel"
      subtitle="Hỗ trợ định dạng .xlsx — Tải file mẫu để bắt đầu"
      width="max-w-4xl" fixedHeight>

      {/* Stepper */}
      <div className="flex items-center bg-[#e8eef6] px-8 py-4 border-b border-[#b8c6d9] gap-3 shrink-0">
        {[{ n: 1, label: 'Tải Lên & Xem Trước' }, { n: 2, label: 'Kiểm Tra & Xác Nhận' }, { n: 3, label: 'Hoàn Tất' }].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= s.n ? 'bg-[#2c5ea0] text-white' : 'bg-[#dce4ee] text-[#7b8a9e]'}`}>{s.n}</div>
              <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${step >= s.n ? 'text-[#2c5ea0]' : 'text-[#7b8a9e]'}`}>{s.label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 rounded ${step > s.n ? 'bg-[#2c5ea0]' : 'bg-[#dce4ee]'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 bg-[#f5f8fc]">

        {/* STEP 1: Upload */}
        {step === 1 && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest">Tải Lên Danh Sách</h4>
                <p className="text-xs text-[#7b8a9e] mt-1">File Excel cần theo đúng cấu trúc 21 cột quy định</p>
              </div>
              <button onClick={downloadTemplate}
                className="flex items-center px-4 py-2 rounded-full text-xs font-bold bg-[#e8eef6] border border-[#b8c6d9] text-[#4a5568] hover:bg-[#dce4ee] transition gap-2">
                <Download className="w-3.5 h-3.5" /> Tải File Mẫu
              </button>
            </div>

            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                isDragging ? 'border-[#2c5ea0] bg-[#fdf5f0]' : 'border-[#b8c6d9] hover:border-[#2c5ea0] hover:bg-[#fdf9f5]'
              }`}
            >
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileInput} />
              <Upload className="w-10 h-10 mx-auto text-[#7b8a9e] mb-3" />
              {fileName ? (
                <>
                  <p className="font-bold text-[#1e2a3a] text-sm">{fileName}</p>
                  <p className="text-xs text-[#2e6b8a] font-bold mt-1">Đã tải • {rows.length} dòng dữ liệu</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-[#4a5568] text-sm">Kéo thả file Excel vào đây</p>
                  <p className="text-xs text-[#7b8a9e] mt-1">hoặc nhấp để chọn file • .xlsx / .xls</p>
                </>
              )}
            </div>

            {rows.length > 0 && (
              <>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Tổng dòng', val: rows.length, color: 'text-[#1e2a3a]' },
                    { label: 'Hợp lệ', val: validRows.length, color: 'text-[#2e6b8a]' },
                    { label: 'Cảnh báo', val: warnRows.length, color: 'text-amber-700' },
                    { label: 'Lỗi', val: errorRows.length, color: 'text-[#2c5ea0]' },
                  ].map(s => (
                    <div key={s.label} className="bg-[#e8eef6] border border-[#b8c6d9] p-3 rounded-xl text-center">
                      <p className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider">{s.label}</p>
                      <p className={`text-2xl font-serif font-bold mt-0.5 ${s.color}`}>{s.val}</p>
                    </div>
                  ))}
                </div>

                <div className="border border-[#b8c6d9] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#e8eef6] border-b border-[#b8c6d9]">
                      <tr>
                        {['Dòng', 'Mã HS dự kiến', 'Khối', 'Lớp', 'Họ và Tên', 'Giới Tính', 'Ngày Sinh', 'Diện CS', 'Tình trạng'].map(h => (
                          <th key={h} className="p-2.5 text-[9px] font-bold text-[#4a5568] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce4ee] bg-white">
                      {rows.slice(0, 8).map(r => (
                        <tr key={r.rowNum} className={r.errors.length > 0 ? 'bg-red-50' : r.warnings.length > 0 ? 'bg-amber-50' : 'hover:bg-[#f5f8fc]'}>
                          <td className="p-2.5 font-mono text-[#7b8a9e]">{r.rowNum}</td>
                          <td className="p-2.5 font-mono font-bold text-[#2c5ea0]">{r.proposedId || '—'}</td>
                          <td className="p-2.5 font-bold">{r.grade || '—'}</td>
                          <td className="p-2.5">{r.className || <span className="text-[#7b8a9e] italic">tự xếp</span>}</td>
                          <td className="p-2.5 font-bold text-[#1e2a3a]">{r.name || '—'}</td>
                          <td className="p-2.5">{r.gender}</td>
                          <td className="p-2.5 font-mono">{r.dob}</td>
                          <td className="p-2.5">{r.policyType}</td>
                          <td className="p-2.5">
                            {r.errors.length > 0
                              ? <span className="text-[#2c5ea0] font-bold flex items-center gap-1"><X className="w-3 h-3" />Lỗi</span>
                              : r.warnings.length > 0
                                ? <span className="text-amber-700 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Cảnh báo</span>
                                : <span className="text-[#2e6b8a] font-bold flex items-center gap-1"><CheckCheck className="w-3 h-3" />OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 8 && <p className="text-center text-[10px] text-[#7b8a9e] py-2 bg-[#e8eef6] border-t border-[#b8c6d9]">Hiển thị 8/{rows.length} dòng • Tất cả sẽ được xử lý khi nhập</p>}
                </div>
              </>
            )}
          </>
        )}

        {/* STEP 2: Validation */}
        {step === 2 && (
          <>
            {errorRows.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-2"><X className="w-4 h-4" />{errorRows.length} dòng có lỗi sẽ bị bỏ qua</p>
                <ul className="space-y-1">
                  {errorRows.slice(0, 5).map(r => (
                    <li key={r.rowNum} className="text-xs text-red-700"><strong>Dòng {r.rowNum}:</strong> {r.name || '(trống)'} — {r.errors.join(', ')}</li>
                  ))}
                  {errorRows.length > 5 && <li className="text-xs text-red-600 italic">...và {errorRows.length - 5} dòng lỗi khác</li>}
                </ul>
              </div>
            )}

            {warnRows.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />{warnRows.length} dòng có cảnh báo (vẫn được nhập)</p>
                <ul className="space-y-1">
                  {warnRows.slice(0, 3).map(r => (
                    <li key={r.rowNum} className="text-xs text-amber-700"><strong>Dòng {r.rowNum}:</strong> {r.name} — {r.warnings.join(', ')}</li>
                  ))}
                </ul>
              </div>
            )}

            {invalidClassRows.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                <p className="text-xs font-bold text-red-800 uppercase tracking-wider mb-2">{invalidClassRows.length} học sinh khối 2/12 có tên lớp không tồn tại trong hệ thống — sẽ bị bỏ qua</p>
                {invalidClassRows.slice(0, 3).map(r => (
                  <p key={r.rowNum} className="text-xs text-red-700">Dòng {r.rowNum}: {r.name} → Lớp "{r.className}" không tìm thấy</p>
                ))}
              </div>
            )}

            {g10Rows.length > 0 && grade10Preview.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Dự Kiến Phân Chia Lớp Khối 1 ({g10Rows.length} học sinh mới)</p>
                <div className="border border-[#b8c6d9] rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#e8eef6] border-b border-[#b8c6d9]">
                      <tr>
                        {['Lớp', 'Sĩ số hiện tại', 'Thêm mới', 'Tổng dự kiến', 'Trạng thái'].map(h => (
                          <th key={h} className="p-3 text-[9px] font-bold text-[#4a5568] uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce4ee] bg-white">
                      {grade10Preview.map(p => (
                        <tr key={p.className} className={!p.active ? 'opacity-50 bg-gray-50' : 'hover:bg-[#f5f8fc]'}>
                          <td className="p-3 font-bold text-[#1e2a3a]">{p.className}</td>
                          <td className="p-3 text-center font-serif text-[#4a5568]">{p.current}</td>
                          <td className="p-3 text-center font-serif font-bold text-[#2e6b8a]">{p.active ? `+${p.added}` : '—'}</td>
                          <td className="p-3 text-center font-serif font-bold text-[#2c5ea0]">{p.total}</td>
                          <td className="p-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              !p.active ? 'bg-gray-100 text-gray-500' :
                              p.total > 45 ? 'bg-amber-100 text-amber-800' :
                              'bg-[#e5f0e8] text-[#2e6b8a]'
                            }`}>
                              {!p.active ? 'Để trống' : p.total > 45 ? `Vượt (+${p.total - 45})` : 'Bình thường'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Khối 1 sẽ nhập', val: g10Rows.length, color: 'text-[#2c5ea0]' },
                { label: 'Khối 2 & 12 sẽ nhập', val: g11g12Rows.filter(r => classes.some(c => c.name === r.className)).length, color: 'text-[#2e6b8a]' },
                { label: 'Bỏ qua (lỗi)', val: errorRows.length + invalidClassRows.length, color: 'text-[#7b8a9e]' },
              ].map(s => (
                <div key={s.label} className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl text-center">
                  <p className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-serif font-bold mt-0.5 ${s.color}`}>{s.val}</p>
                </div>
              ))}
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
              <strong>Lưu ý:</strong> Mỗi học sinh sẽ được cấp Mã HS và email trường tự động. Tài khoản đăng nhập mặc định dùng mật khẩu <strong>123456</strong>.
            </div>
          </>
        )}

        {/* STEP 3: Done */}
        {step === 3 && result && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <CheckCircle2 className="w-16 h-16 text-[#2e6b8a]" />
            <div>
              <h3 className="text-xl font-serif font-bold text-[#1e2a3a]">Nhập Dữ Liệu Hoàn Tất!</h3>
              <p className="text-xs text-[#4a5568] mt-2">Hệ thống đã cập nhật Firestore và phân chia lớp học thành công.</p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
              <div className="bg-[#e5f0e8] border border-[#2e6b8a]/20 p-4 rounded-2xl text-center">
                <p className="text-[9px] font-bold text-[#2e6b8a] uppercase tracking-wider">Đã tạo hồ sơ</p>
                <p className="text-3xl font-serif font-bold text-[#2e6b8a] mt-1">{result.created}</p>
              </div>
              <div className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl text-center">
                <p className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider">Bỏ qua (trùng)</p>
                <p className="text-3xl font-serif font-bold text-[#4a5568] mt-1">{result.skipped.length}</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="p-6 pt-4 border-t border-dashed border-[#b8c6d9] bg-[#f5f8fc] flex justify-between items-center shrink-0">
        <button onClick={onClose} disabled={processing}
          className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors disabled:opacity-50">
          Đóng
        </button>
        <div className="flex gap-3">
          {step === 1 && rows.length > 0 && (
            <button onClick={() => setStep(2)}
              className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none transition-all gap-2">
              Kiểm Tra <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {step === 2 && (
            <>
              <button onClick={() => setStep(1)}
                className="flex items-center px-5 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors gap-1">
                <ChevronLeft className="w-4 h-4" /> Quay Lại
              </button>
              <button onClick={handleImport} disabled={processing || (validRows.length === 0)}
                className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none transition-all disabled:opacity-50 gap-2">
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {processing ? 'Đang nhập...' : `Bắt Đầu Nhập (${validRows.length} HS)`}
              </button>
            </>
          )}
        </div>
      </div>
    </ModalBase>
  );
};
