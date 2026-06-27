import React, { useState, useEffect } from 'react';
import { Panel } from '../layout/Panel';
import { Search, Plus, Filter, MoreHorizontal } from 'lucide-react';
import { FilterSelect } from '../ui/BaseInputs';
import { Pagination } from '../ui/Pagination';
import { getTeacherAssignments, TeacherAssignment } from '../../services/dbService';
import { getStaffList, Staff } from '../../services/hrService';

export const AssignmentsPanel = () => {
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [loadFilter, setLoadFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        const [data, staffList] = await Promise.all([
          getTeacherAssignments(),
          getStaffList()
        ]);

        // Merge: tất cả nhân viên từ hrService đều phải xuất hiện
        // Nếu đã có trong teacherAssignments thì dùng dữ liệu đó, ngược lại tạo bản ghi mặc định
        const assignmentMap = new Map(data.map(a => [a.id, a]));

        const merged: TeacherAssignment[] = staffList.map((s: Staff) => {
          if (assignmentMap.has(s.id)) {
            return assignmentMap.get(s.id)!;
          }
          // Nhân viên không phải giáo viên hoặc chưa được phân công dạy
          return {
            id: s.id,
            name: s.name,
            dept: s.department || 'Hành chính',
            role: s.role || 'Nhân viên',
            quota: 0,
            assigned: 0,
            classes: []
          };
        });

        // Thêm những người trong teacherAssignments nhưng không có trong staffList (dữ liệu cũ)
        for (const assign of data) {
          if (!staffList.some((s: Staff) => s.id === assign.id)) {
            merged.push(assign);
          }
        }

        setAssignments(merged);
      } catch (err) {
        console.error("Failed to load teaching assignments:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAssignments();
  }, []);


  const filteredTeachers = assignments.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.dept.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = deptFilter === 'All' || t.dept === deptFilter;
    
    const isNonTeaching = t.quota === 0;
    let matchesLoad = true;
    if (loadFilter === 'Vượt định mức') {
      matchesLoad = !isNonTeaching && t.assigned > t.quota;
    } else if (loadFilter === 'Dưới định mức') {
      matchesLoad = !isNonTeaching && t.assigned < t.quota - 2;
    } else if (loadFilter === 'Đầy Đủ') {
      matchesLoad = !isNonTeaching && t.assigned >= t.quota - 2 && t.assigned <= t.quota;
    } else if (loadFilter === 'Không giảng dạy') {
      matchesLoad = isNonTeaching;
    }

    return matchesSearch && matchesDept && matchesLoad;
  });

  // Tính danh sách tổ chuyên môn động từ dữ liệu thực
  const deptOptions: { value: string; label: string }[] = [
    { value: 'All', label: 'TỔ CHUYÊN MÔN' },
    ...(Array.from(new Set(assignments.map(t => t.dept))) as string[])
      .filter(d => d && d.length > 0)
      .sort((a, b) => a.localeCompare(b, 'vi'))
      .map(dept => ({ value: dept, label: dept }))
  ];



  const teachingStaff = assignments.filter(t => t.quota > 0);
  const totalTeachers = assignments.length;
  const targetQuota = teachingStaff.filter(t => t.assigned >= t.quota - 2 && t.assigned <= t.quota).length;
  const overloadCount = teachingStaff.filter(t => t.assigned > t.quota).length;
  const underloadCount = teachingStaff.filter(t => t.assigned < t.quota - 2).length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, deptFilter, loadFilter]);

  const totalPages = Math.ceil(filteredTeachers.length / pageSize);
  const paginatedTeachers = filteredTeachers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <Panel>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b-2 border-[#b8c6d9] mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] tracking-tight">Kỷ Lục Phân Công Chuyên Môn</h2>
          <p className="text-sm text-[#4a5568] font-medium mt-2 italic">Trang quản lý biên chế giảng dạy và định mức công tác sư phạm.</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-6 sm:mt-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8e9eb4] font-bold" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tra cứu sổ điểm, tên giáo viên..."
              className="pl-11 pr-4 py-2.5 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[280px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
            />
          </div>
          <button className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:translate-y-1 active:shadow-none whitespace-nowrap rounded-full">
            <Plus className="w-4 h-4 mr-2" />
            Thêm Quyết Định
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-2">
        <div className="bg-[#f5f8fc] p-6 border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex items-center rounded-3xl">
          <div className="w-14 h-14 bg-[#e8eef6] border border-[#b8c6d9] flex items-center justify-center mr-5 shadow-inner rounded-full">
             <span className="text-[#1e2a3a] font-serif font-bold text-2xl">{loading ? '...' : totalTeachers}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e2a3a]">Sĩ Số Giáo Viên</p>
            <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mt-1">Biên chế phân công</p>
          </div>
        </div>
        <div className="bg-[#f5f8fc] p-6 border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex items-center rounded-3xl">
          <div className="w-14 h-14 bg-[#d8e0da] border border-[#a4bba8] flex items-center justify-center mr-5 shadow-inner rounded-full">
             <span className="text-[#2e6b8a] font-serif font-bold text-2xl">{loading ? '...' : targetQuota}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e2a3a]">Đạt Định Mức</p>
            <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mt-1">Từ 15-18 Tiết/Tuần</p>
          </div>
        </div>
        <div className="bg-[#f5f8fc] p-6 border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex items-center relative overflow-hidden rounded-3xl">
          <div className="w-14 h-14 bg-[#eadded] border border-[#cbb3b3] flex items-center justify-center mr-5 shadow-inner rounded-full">
             <span className="text-[#2c5ea0] font-serif font-bold text-2xl">{loading ? '...' : overloadCount}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e2a3a]">Quá Biên Chế</p>
            <p className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest mt-1">Vượt định mức</p>
          </div>
        </div>
         <div className="bg-[#f5f8fc] p-6 border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex items-center relative overflow-hidden rounded-3xl">
          <div className="w-14 h-14 bg-[#d4dde9] border border-[#b8c6d9] flex items-center justify-center mr-5 shadow-inner rounded-full">
             <span className="text-[#8c672b] font-serif font-bold text-2xl">{loading ? '...' : underloadCount}</span>
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e2a3a]">Khuyết Hiện Diện</p>
            <p className="text-[10px] font-bold text-[#8c672b] uppercase tracking-widest mt-1">Dưới định mức</p>
          </div>
        </div>
      </div>

      <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] mt-8 flex flex-col flex-1 rounded-3xl overflow-hidden min-h-0">
        <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between">
          <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">Sổ Điền Phiếu Phân Công Giáo Viên</h3>
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="Tổ"
              value={deptFilter}
              onChange={setDeptFilter}
              options={deptOptions}
              icon={Filter}
            />
            <FilterSelect
              label="Định mức"
              value={loadFilter}
              onChange={setLoadFilter}
              options={[
                { value: 'All', label: 'ĐỊNH MỨC' },
                { value: 'Đầy Đủ', label: 'Đầy Đủ' },
                { value: 'Vượt định mức', label: 'Vượt định mức' },
                { value: 'Dưới định mức', label: 'Dưới định mức' },
                { value: 'Không giảng dạy', label: 'Không giảng dạy' }
              ]}
              icon={Filter}
            />
          </div>
        </div>
        
        <div className="overflow-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-[#7b8a9e] font-bold">Đang tải phân công...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#b8c6d9] bg-[#d4dde9]">
                  <th className="px-6 py-5 text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.2em]">Danh Xưng / Vai Trò</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.2em] border-l border-[#b8c6d9]">Tổ Chuyên Môn</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.2em] border-l border-[#b8c6d9] text-center w-28">Định Mức</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.2em] border-l border-[#b8c6d9] text-center w-36">Tình Trạng</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.2em] border-l border-[#b8c6d9]">Cơ Cấu Lớp Phụ Trách</th>
                  <th className="px-6 py-5 text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.2em] border-l border-[#b8c6d9] text-center w-20">Trình Cấp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#b8c6d9] bg-[#f5f8fc]">
                {paginatedTeachers.map((teacher, idx) => {
                  const isNonTeaching = teacher.quota === 0;
                  const overload = !isNonTeaching && teacher.assigned > teacher.quota;
                  const underload = !isNonTeaching && teacher.assigned < teacher.quota - 2;
                  const statusColor = isNonTeaching
                    ? 'text-[#4a5568] bg-[#e8eef6] border-[#b8c6d9]'
                    : overload ? 'text-[#2c5ea0] bg-[#eadded] border-[#cbb3b3]'
                    : underload ? 'text-[#8c672b] bg-[#d4dde9] border-[#b8c6d9]'
                    : 'text-[#2e6b8a] bg-[#d8e0da] border-[#a4bba8]';
                  const statusText = isNonTeaching ? 'Hành chính'
                    : overload ? 'Vượt quá'
                    : underload ? 'Khuyết'
                    : 'Đầy Đủ';

                  return (
                    <tr key={idx} className="hover:bg-[#e8eef6] transition-colors">
                      <td className="px-6 py-5 align-top">
                        <div className="font-serif font-bold text-[#1e2a3a] text-lg">{teacher.name}</div>
                        <div className="text-[10px] font-bold tracking-widest text-[#7b8a9e] mt-1.5 uppercase">{teacher.id} - {teacher.role}</div>
                      </td>
                      <td className="px-6 py-5 align-top border-l border-[#b8c6d9]">
                        <span className="inline-flex items-center px-3 py-1.5 bg-[#e8eef6] text-[#4a5568] border border-[#b8c6d9] text-[10px] font-bold tracking-widest uppercase shadow-[1px_1px_0px_#dce4ee]">
                          {teacher.dept}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center align-top border-l border-[#b8c6d9]">
                        <div className="font-serif font-bold text-[#1e2a3a] text-2xl leading-none">
                          {isNonTeaching
                            ? <span className="text-sm font-sans text-[#8e9eb4] italic">—</span>
                            : <>{teacher.assigned} <span className="text-[#8e9eb4] font-sans text-sm ml-1">/ {teacher.quota}</span></>
                          }
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center align-top border-l border-[#b8c6d9]">
                        <span className={`inline-flex items-center px-4 py-1.5 text-[10px] font-bold tracking-widest uppercase border ${statusColor} shadow-inner`}>
                          {statusText}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top border-l border-[#b8c6d9]">
                        <div className="flex flex-wrap gap-2 max-w-xs">
                          {teacher.classes.map((c, i) => (
                            <span key={i} className="inline-block px-2.5 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] text-[10px] font-bold text-[#1e2a3a] shadow-sm uppercase tracking-wide">
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center align-top border-l border-[#b8c6d9]">
                        <button className="text-[#7b8a9e] hover:bg-[#d4dde9] hover:text-[#1e2a3a] transition-colors p-2 border border-transparent hover:border-[#b8c6d9] rounded-full">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
        
        <div className="px-8 py-5 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredTeachers.length}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </div>
      </div>
    </Panel>
  );
};
