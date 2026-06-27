import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutList, MoreHorizontal, Download, Edit, Eye, ShieldAlert, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { ClassModal } from '../ui/ClassModal';
import { ActionMenu } from '../ui/ActionMenu';
import { getClasses, saveClass, deleteClass } from '../../services/dbService';
import { FilterSelect } from '../ui/BaseInputs';
import { Pagination } from '../ui/Pagination';
import { getStudents, updateStudent, Student } from '../../services/studentService';
import { ModalBase } from '../ui/Modals';
import { useUserRole } from '../../utils/role';

interface ClassData {
  id: string;
  name: string;
  grade: number;
  academicYear: string;
  status: string;
  topic: string;
  room: string;
  teacher: string;
  capacity: number;
  currentCount: number;
}

export const ClassesPanel = () => {
  const currentRole = useUserRole();
  const [classes, setClasses] = useState<ClassData[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [size, setPageSize] = useState(10); // renamed local collision

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterGrade]);

  // Modal control state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAutoAssignOpen, setIsAutoAssignOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'read' | 'edit'>('edit');
  const [selectedClass, setSelectedClass] = useState<ClassData | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await getClasses();
      setClasses(data);
    } catch (err) {
      console.error("Failed to load classes from firestore", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const openClassModal = (cls?: ClassData, mode: 'read' | 'edit' = 'edit') => {
    setSelectedClass(cls);
    setModalMode(mode);
    setIsModalOpen(true);
  };

  const handleSaveClass = async (updatedData: ClassData) => {
    try {
      await saveClass(updatedData);
      setClasses(prev => {
        const exists = prev.some(c => c.id === updatedData.id);
        if (exists) {
          showToast(`💾 Cập nhật lớp học ${updatedData.name} thành công!`);
          return prev.map(c => c.id === updatedData.id ? updatedData : c);
        } else {
          showToast(`✨ Đã thêm lớp học mới ${updatedData.name} thành công!`);
          return [updatedData, ...prev];
        }
      });
    } catch (err) {
      showToast("❌ Không thể lưu lớp học.");
    }
  };

  const toggleClassStatus = async (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;
    const nextStatus = cls.status === 'Đang hoạt động' ? 'Ngưng hoạt động' : 'Đang hoạt động';
    try {
      await saveClass({ ...cls, status: nextStatus });
      setClasses(prev => prev.map(c => {
        if (c.id === id) {
          showToast(`🔄 Đã đổi trạng thái lớp ${c.name} sang: ${nextStatus}.`);
          return { ...c, status: nextStatus };
        }
        return c;
      }));
    } catch (err) {
      showToast("❌ Không thể đổi trạng thái lớp học.");
    }
  };

  const handleDeleteClass = async (id: string) => {
    const cls = classes.find(c => c.id === id);
    if (!cls) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn lớp học ${cls.name}? Hành động này không thể hoàn tác.`)) {
      try {
        await deleteClass(id);
        setClasses(prev => prev.filter(c => c.id !== id));
        showToast(`🗑️ Đã xóa lớp học ${cls.name} thành công!`);
      } catch (err) {
        showToast("❌ Không thể xóa lớp học.");
      }
    }
  };

  const filteredClasses = classes.filter(cls => {
    // Phân quyền
    if (currentRole === 'homeroom_teacher') {
      if (cls.name !== '1A1') return false;
    }

    const matchesSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cls.teacher.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          cls.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = filterGrade === 'all' ? true : cls.grade === filterGrade;
    return matchesSearch && matchesGrade;
  }).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

  const totalPages = Math.ceil(filteredClasses.length / size);
  const paginatedClasses = filteredClasses.slice((currentPage - 1) * size, currentPage * size);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f5f8fc]">
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-white px-6 py-3 rounded-xl border border-[#b8c6d9] shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 flex items-center font-bold text-xs uppercase tracking-wider">
          <Check className="w-4 h-4 mr-2 text-green-400" />
          {toastMessage}
        </div>
      )}

      <div className="p-8 border-b border-[#b8c6d9] bg-[#e8eef6] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1e2a3a] tracking-tight">Lớp học</h1>
            <p className="text-sm font-medium text-[#4a5568] mt-2">Cơ cấu tổ chức lớp học theo năm học</p>
          </div>
          {currentRole !== 'homeroom_teacher' && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsAutoAssignOpen(true)}
                className="flex items-center px-4 py-2.5 bg-[#2e6b8a] text-white text-sm font-bold uppercase tracking-widest rounded-full hover:bg-[#1e4f6a] transition-all shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Xếp Lớp Tự Động
              </button>
              <button 
                onClick={() => openClassModal(undefined, 'edit')}
                className="flex items-center px-4 py-2.5 bg-[#1e2a3a] text-white text-sm font-bold uppercase tracking-widest rounded-full hover:bg-[#131a25] transition-all shadow-[2px_2px_0px_#7b8a9e] active:shadow-none active:translate-y-0.5"
              >
                <Plus className="w-5 h-5 mr-2" />
                Tạo Lớp Mới
              </button>
            </div>
          )}
        </div>

        <div className="max-w-7xl mx-auto mt-8 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7b8a9e]" />
            <input 
              type="text" 
              placeholder="Tìm kiếm lớp học, GVCN, mã lớp..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#b8c6d9] rounded-2xl text-sm font-bold text-[#1e2a3a] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2c5ea0]/20 focus:border-[#2c5ea0]"
            />
          </div>
          {currentRole !== 'homeroom_teacher' && (
            <FilterSelect
              label="Chọn Khối"
              value={filterGrade.toString()}
              onChange={(val) => setFilterGrade(val === 'all' ? 'all' : Number(val))}
              options={[
                { value: 'all', label: 'TẤT CẢ' },
                { value: '0', label: 'NHÀ TRẺ (24-36 TH)' },
                { value: '1', label: 'KHỐI MẦM (3 TUỔI)' },
                { value: '2', label: 'KHỐI CHỒI (4 TUỔI)' },
                { value: '3', label: 'KHỐI LÁ (5 TUỔI)' }
              ]}
              icon={Filter}
            />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white border border-[#b8c6d9] rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#e8eef6] border-b border-[#b8c6d9]">
                    <th className="p-4 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Lớp Học / Mã</th>
                    <th className="p-4 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">Sĩ Số</th>
                    <th className="p-4 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">GVCN / Phòng</th>
                    <th className="p-4 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest text-center">Trạng Thái</th>
                    <th className="p-4 text-[10px] font-bold text-[#4a5568] uppercase tracking-widest text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]">
                  {paginatedClasses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm font-bold text-[#7b8a9e] italic">
                        Không tìm thấy lớp học nào khớp với điều kiện tra cứu.
                      </td>
                    </tr>
                  ) : (
                    paginatedClasses.map((cls) => (
                      <tr key={cls.id} className="hover:bg-[#f5f8fc] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#dce4ee] flex items-center justify-center border border-[#b8c6d9] group-hover:bg-white transition-colors">
                              <LayoutList className="w-5 h-5 text-[#2c5ea0]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[#1e2a3a]">{cls.name}</p>
                              <p className="text-xs font-medium text-[#7b8a9e] mt-0.5">{cls.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-bold text-[#1e2a3a]">{cls.currentCount} <span className="text-[#7b8a9e] font-medium text-xs">/ {cls.capacity}</span></p>
                            <div className="w-24 h-1.5 bg-[#dce4ee] rounded-full mt-2 overflow-hidden">
                              <div className="h-full bg-[#2e6b8a]" style={{ width: `${(cls.currentCount / cls.capacity) * 100}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-bold text-[#1e2a3a]">{cls.teacher}</p>
                          <p className="text-xs font-medium text-[#7b8a9e] mt-0.5">P.{cls.room} • {cls.academicYear}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                            cls.status === 'Đang hoạt động' ? 'bg-[#e5f0e8] text-[#2e6b8a]' : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {cls.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <ActionMenu 
                            primaryAction={{
                              label: 'Xem chi tiết',
                              icon: 'Eye',
                              onClick: () => openClassModal(cls, 'read')
                            }}
                            actions={currentRole === 'homeroom_teacher' ? [] : [
                              {
                                label: 'Biên tập lớp học',
                                icon: 'Edit',
                                onClick: () => openClassModal(cls, 'edit')
                              },
                              {
                                label: cls.status === 'Đang hoạt động' ? 'Khóa / Ngưng hoạt động' : 'Kích hoạt lại',
                                icon: cls.status === 'Đang hoạt động' ? 'ShieldAlert' : 'Check',
                                onClick: () => toggleClassStatus(cls.id),
                                danger: cls.status === 'Đang hoạt động'
                              },
                              {
                                label: 'Xóa lớp học',
                                icon: 'Trash2',
                                onClick: () => handleDeleteClass(cls.id),
                                danger: true
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={filteredClasses.length}
                pageSize={size}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </div>
      </div>

      <ClassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        mode={modalMode}
        classData={selectedClass}
        onSave={handleSaveClass}
      />

      <AutoAssignModal 
        isOpen={isAutoAssignOpen} 
        onClose={() => setIsAutoAssignOpen(false)} 
        onSuccess={loadData} 
      />
    </div>
  );
};

/* --- AUTO ASSIGN MODAL FOR GRADE 10 --- */
interface AutoAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AutoAssignModal: React.FC<AutoAssignModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [mode, setMode] = useState<'unassigned' | 'all'>('unassigned');

  // Stats
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState({
    totalClasses: 0,
    unassignedStudents: 0,
    assignedStudents: 0,
    totalStudents: 0,
  });

  const [previewList, setPreviewList] = useState<{ className: string; current: number; proposed: number; active: boolean }[]>([]);

  // Function to load stats & calculate preview
  const loadStatsAndPreview = async () => {
    setLoading(true);
    try {
      const allClassData = await getClasses();
      const allStudentData = await getStudents();

      const g10Classes = allClassData.filter(c => c.grade === 10 && c.status === 'Đang hoạt động');
      g10Classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

      const getSystemAcademicYear = (): number => {
        const stored = localStorage.getItem('active_academic_year_name');
        if (stored) {
          const match = stored.match(/\d{4}/);
          if (match) return parseInt(match[0], 10);
        }
        return 2025;
      };

      const currentYear = getSystemAcademicYear();
      const currentYearPrefix = String(currentYear % 100);
      const idPrefix = currentYearPrefix + '.';
      const oldIdPrefix = 'HS' + (2000 + (currentYear % 100)) + '.';

      const isGrade10Student = (s: Student) => {
        return s.grade === 'Khối 1' || s.id.startsWith(idPrefix) || s.id.startsWith(oldIdPrefix) || g10Classes.some(c => c.name === s.grade);
      };

      const g10Students = allStudentData.filter(s => s.status === 'Đang Học' && isGrade10Student(s));

      const unassigned = g10Students.filter(s => s.grade === 'Chưa xếp lớp' || s.grade === '' || s.grade === 'Khối 1' || !allClassData.some(c => c.name === s.grade));
      const assigned = g10Students.filter(s => allClassData.some(c => c.name === s.grade));

      setClasses(g10Classes);
      setStudents(allStudentData);
      setStats({
        totalClasses: g10Classes.length,
        unassignedStudents: unassigned.length,
        assignedStudents: assigned.length,
        totalStudents: g10Students.length,
      });

      // Calculate preview distribution using greedy simulation
      const N_total = g10Students.length;
      const N_assign = mode === 'unassigned' ? unassigned.length : g10Students.length;
      const M = g10Classes.length;

      if (M > 0) {
        let A = 0;
        if (N_total > 0) {
          A = Math.min(M, Math.max(1, Math.ceil(N_total / 47)));
        }

        const targets = g10Classes.map((_, idx) => {
          if (idx < A) {
            return Math.floor(N_total / A) + (idx < (N_total % A) ? 1 : 0);
          }
          return 0;
        });

        const currentCounts = g10Classes.map(cls => {
          if (mode === 'all') {
            return 0;
          } else {
            return allStudentData.filter(s => s.grade === cls.name && s.status === 'Đang Học').length;
          }
        });

        const deltas = g10Classes.map(() => 0);
        const simulatedCounts = [...currentCounts];

        for (let sIdx = 0; sIdx < N_assign; sIdx++) {
          let bestIdx = -1;
          let minDiff = Infinity;

          for (let idx = 0; idx < A; idx++) {
            const target = targets[idx];
            const diff = simulatedCounts[idx] - target;

            if (diff < minDiff) {
              minDiff = diff;
              bestIdx = idx;
            } else if (diff === minDiff) {
              if (simulatedCounts[idx] < simulatedCounts[bestIdx]) {
                bestIdx = idx;
              }
            }
          }

          if (bestIdx !== -1) {
            simulatedCounts[bestIdx]++;
            deltas[bestIdx]++;
          }
        }

        const preview = g10Classes.map((cls, idx) => {
          const active = idx < A;
          const current = allStudentData.filter(s => s.grade === cls.name && s.status === 'Đang Học').length;
          const proposed = simulatedCounts[idx];

          return {
            className: cls.name,
            current,
            proposed,
            active
          };
        });

        setPreviewList(preview);
      } else {
        setPreviewList([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatsAndPreview();
    }
  }, [isOpen, mode]);

  const executeSorting = async () => {
    setProcessing(true);
    try {
      const g10Classes = classes;
      const allStudentData = students;

      const getSystemAcademicYear = (): number => {
        const stored = localStorage.getItem('active_academic_year_name');
        if (stored) {
          const match = stored.match(/\d{4}/);
          if (match) return parseInt(match[0], 10);
        }
        return 2025;
      };

      const currentYear = getSystemAcademicYear();
      const currentYearPrefix = String(currentYear % 100);
      const idPrefix = currentYearPrefix + '.';
      const oldIdPrefix = 'HS' + (2000 + (currentYear % 100)) + '.';

      const isGrade10Student = (s: Student) => {
        return s.grade === 'Khối 1' || s.id.startsWith(idPrefix) || s.id.startsWith(oldIdPrefix) || g10Classes.some(c => c.name === s.grade);
      };

      const g10Students = allStudentData.filter(s => s.status === 'Đang Học' && isGrade10Student(s));
      const unassigned = g10Students.filter(s => s.grade === 'Chưa xếp lớp' || s.grade === '' || s.grade === 'Khối 1' || !g10Classes.some(c => c.name === s.grade));

      let studentsToAssign: Student[] = [];
      if (mode === 'unassigned') {
        studentsToAssign = [...unassigned];
      } else {
        studentsToAssign = [...g10Students];
      }

      if (studentsToAssign.length === 0) {
        alert("Không có học sinh nào cần xếp lớp!");
        setProcessing(false);
        return;
      }

      const N_total = g10Students.length;
      const N_assign = studentsToAssign.length;
      const M = g10Classes.length;

      if (M === 0) {
        alert("Không tìm thấy lớp học Khối 1 hoạt động nào!");
        setProcessing(false);
        return;
      }

      let A = 0;
      if (N_total > 0) {
        A = Math.min(M, Math.max(1, Math.ceil(N_total / 47)));
      }

      const targets = g10Classes.map((_, idx) => {
        if (idx < A) {
          return Math.floor(N_total / A) + (idx < (N_total % A) ? 1 : 0);
        }
        return 0;
      });

      const currentCounts = g10Classes.map(cls => {
        if (mode === 'all') {
          return 0;
        } else {
          return allStudentData.filter(s => s.grade === cls.name && s.status === 'Đang Học').length;
        }
      });

      const deltas = g10Classes.map(() => 0);
      const simulatedCounts = [...currentCounts];

      for (let sIdx = 0; sIdx < N_assign; sIdx++) {
        let bestIdx = -1;
        let minDiff = Infinity;

        for (let idx = 0; idx < A; idx++) {
          const target = targets[idx];
          const diff = simulatedCounts[idx] - target;

          if (diff < minDiff) {
            minDiff = diff;
            bestIdx = idx;
          } else if (diff === minDiff) {
            if (simulatedCounts[idx] < simulatedCounts[bestIdx]) {
              bestIdx = idx;
            }
          }
        }

        if (bestIdx !== -1) {
          simulatedCounts[bestIdx]++;
          deltas[bestIdx]++;
        }
      }

      studentsToAssign.sort((a, b) => a.name.localeCompare(b.name, 'vi', { sensitivity: 'base' }));

      let currentIndex = 0;
      const promises: Promise<any>[] = [];

      for (let idx = 0; idx < M; idx++) {
        const cls = g10Classes[idx];
        const delta = deltas[idx];
        const finalCount = simulatedCounts[idx];

        const assignedForThisClass = studentsToAssign.slice(currentIndex, currentIndex + delta);
        currentIndex += delta;

        assignedForThisClass.forEach(s => {
          if (s.grade !== cls.name) {
            promises.push(updateStudent(s.id, { grade: cls.name }));
          }
        });

        if (cls.currentCount !== finalCount) {
          promises.push(saveClass({ ...cls, currentCount: finalCount }));
        }
      }

      await Promise.all(promises);
      alert(`🎉 Xếp lớp thành công! Đã sắp xếp ${N_assign} học sinh vào các lớp học.`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Đã xảy ra lỗi trong quá trình tự động xếp lớp.");
    } finally {
      setProcessing(false);
    }
  };



  if (!isOpen) return null;

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Xếp Lớp Tự Động (Khối 1)" subtitle="Phân chia học sinh vào các lớp học đã thiết lập" width="max-w-3xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6 bg-[#f5f8fc]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#7b8a9e]">
            <Loader2 className="w-10 h-10 animate-spin text-[#2c5ea0]" />
            <p className="mt-4 text-xs font-bold uppercase tracking-wider">Đang phân tích số liệu tuyển sinh...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider block">Lớp Khối 1 có sẵn</span>
                <span className="text-2xl font-serif font-bold text-[#2c5ea0] mt-1 block">{stats.totalClasses}</span>
              </div>
              <div className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider block">Học sinh chưa xếp lớp</span>
                <span className="text-2xl font-serif font-bold text-[#2e6b8a] mt-1 block">{stats.unassignedStudents}</span>
              </div>
              <div className="bg-[#e8eef6] border border-[#b8c6d9] p-4 rounded-2xl shadow-sm text-center">
                <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider block">Học sinh đã xếp lớp</span>
                <span className="text-2xl font-serif font-bold text-gray-700 mt-1 block">{stats.assignedStudents}</span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block">Chế độ xếp lớp</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all ${mode === 'unassigned' ? 'bg-[#e8eef6] border-[#2c5ea0] shadow-sm' : 'bg-white border-[#b8c6d9] hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="assignMode" checked={mode === 'unassigned'} onChange={() => setMode('unassigned')} className="text-[#2c5ea0] focus:ring-[#2c5ea0]" />
                    <span className="text-sm font-bold text-[#1e2a3a]">Chỉ học sinh chưa xếp lớp</span>
                  </div>
                  <span className="text-[10px] text-[#7b8a9e] mt-2 block leading-relaxed">Xếp lớp cho {stats.unassignedStudents} học sinh mới nhận đơn, giữ nguyên danh sách học sinh đã xếp trước đó.</span>
                </label>
                <label className={`flex flex-col p-4 border rounded-2xl cursor-pointer transition-all ${mode === 'all' ? 'bg-[#e8eef6] border-[#2c5ea0] shadow-sm' : 'bg-white border-[#b8c6d9] hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-2">
                    <input type="radio" name="assignMode" checked={mode === 'all'} onChange={() => setMode('all')} className="text-[#2c5ea0] focus:ring-[#2c5ea0]" />
                    <span className="text-sm font-bold text-[#1e2a3a]">Xếp lại toàn bộ học sinh Khối 1</span>
                  </div>
                  <span className="text-[10px] text-[#7b8a9e] mt-2 block leading-relaxed">Thu hồi toàn bộ học sinh Khối 1 về hồ sơ chờ và thực hiện sắp xếp lại từ đầu cho {stats.totalStudents} em.</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest block">Dự kiến phân chia sĩ số các lớp</label>
              <div className="border border-[#b8c6d9] rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-sm text-left">
                  <thead className="bg-[#e8eef6] border-b border-[#b8c6d9] text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">
                    <tr>
                      <th className="p-4">Tên lớp</th>
                      <th className="p-4 text-center">Sĩ số hiện tại</th>
                      <th className="p-4 text-center">Sĩ số dự kiến</th>
                      <th className="p-4 text-right">Trạng thái lớp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dce4ee]">
                    {previewList.map((p) => (
                      <tr key={p.className} className={`hover:bg-[#f5f8fc] ${p.active ? '' : 'opacity-60 bg-gray-50/50'}`}>
                        <td className="p-4 font-bold text-[#1e2a3a]">{p.className}</td>
                        <td className="p-4 text-center font-serif text-gray-500">{p.current}</td>
                        <td className="p-4 text-center font-serif font-bold text-[#2c5ea0]">{p.proposed}</td>
                        <td className="p-4 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            p.active 
                              ? p.proposed > 35 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-[#e5f0e8] text-[#2e6b8a]'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {p.active ? p.proposed > 35 ? `Vượt hạn mức (+${p.proposed - 35})` : 'Hoạt động' : 'Để trống (unused)'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
              <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider">Lưu ý trước khi thực thi</p>
                <p className="mt-1">
                  Hành động này sẽ thực hiện cập nhật hàng loạt (bulk update) hồ sơ học sinh trên cơ sở dữ liệu Firestore.
                  Vui lòng kiểm tra kỹ sĩ số dự kiến và chắc chắn các lớp Khối 1 đã được tạo đúng.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="p-8 pt-4 border-t border-dashed border-[#b8c6d9] bg-[#f5f8fc] flex justify-between items-center rounded-b-3xl shrink-0">
        <button onClick={onClose} disabled={processing} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors disabled:opacity-50">Đóng</button>
        {!loading && (
          <button 
            onClick={executeSorting} 
            disabled={processing || previewList.length === 0} 
            className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition-all disabled:opacity-50"
          >
            {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Bắt đầu xếp lớp
          </button>
        )}
      </div>
    </ModalBase>
  );
};
