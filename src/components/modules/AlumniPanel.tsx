import React, { useState, useEffect } from 'react';
import { Search, Eye, Filter, Check, GraduationCap, Award, FileText, RefreshCw, Mail, Phone, Calendar, Printer } from 'lucide-react';
import { getStudents, deleteStudent, Student } from '../../services/studentService';
import { ModalBase } from '../ui/Modals';
import { Pagination } from '../ui/Pagination';
import { FilterSelect } from '../ui/BaseInputs';
import { PrintableReportCard, ReportCardData } from '../ui/PrintableReportCard';
import { printElement } from '../../utils/printHelper';
import { ActionMenu } from '../ui/ActionMenu';
import { getAllReportCards, ReportCardDocument } from '../../services/reportCardService';

export const AlumniPanel: React.FC = () => {
  const [alumni, setAlumni] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cohortFilter, setCohortFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal states
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reportCardSemester, setReportCardSemester] = useState('Cả Năm');
  const [toast, setToast] = useState<string | null>(null);

  // Firestore-backed report cards cache
  const [reportCardsCache, setReportCardsCache] = useState<Map<string, ReportCardDocument>>(new Map());

  const loadAlumni = async () => {
    try {
      setLoading(true);
      const allStudents = await getStudents();
      // Filter for students who have graduated (grade is 'Đã tốt nghiệp')
      const graduated = allStudents.filter(s => s.grade === 'Đã tốt nghiệp');
      setAlumni(graduated);

      // Load all report cards from Firestore
      const allCards = await getAllReportCards();
      const cacheMap = new Map<string, ReportCardDocument>();
      allCards.forEach(card => cacheMap.set(card.id, card));
      setReportCardsCache(cacheMap);
    } catch (error) {
      console.error("Failed to load alumni list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlumni();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getAlumniCohort = (id: string) => {
    const match = id.match(/HS(\d{4})/);
    if (match) {
      const entryYear = parseInt(match[1], 10);
      return `${entryYear} - ${entryYear + 3}`;
    }
    return '2023 - 2026';
  };

  const getGraduationYear = (id: string) => {
    const match = id.match(/HS(\d{4})/);
    if (match) {
      const entryYear = parseInt(match[1], 10);
      return String(entryYear + 3);
    }
    return '2026';
  };

  const getReportCardData = (student: Student, semester: string = 'Cả Năm'): ReportCardData => {
    const cacheKey = `${student.id}_${semester}`;
    const cached = reportCardsCache.get(cacheKey);
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

    const match = student.id.match(/HS(\d{4})/);
    const entryYear = match ? parseInt(match[1], 10) : 2023;
    const gradYear = entryYear + 3;

    const gvcnMap: Record<string, string> = {
      '5A1': 'Thầy Trần Văn Cường',
      '12A2': 'Cô Lê Thị Lan'
    };
    const gvcn = gvcnMap[student.id] || 'Thầy Trần Văn Cường';

    if (semester === 'Cả Năm') {
      const rc1 = getReportCardData(student, 'Học Kỳ I');
      const rc2 = getReportCardData(student, 'Học Kỳ II');

      const scores = rc1.scores.map((s1, idx) => {
        const s2 = rc2.scores[idx];
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
                ? 'Cả năm hoàn thành xuất sắc, tiếp thu và vận dụng kiến thức tốt.'
                : 'Tiến độ học tập cả năm ổn định, cần phát huy thêm thế mạnh.')
        };
      });

      const numericScores = scores.filter(s => typeof s.average === 'number');
      const totalSum = numericScores.reduce((sum, s) => sum + (s.average as number), 0);
      const curGpa = numericScores.length > 0 ? parseFloat((totalSum / numericScores.length).toFixed(2)) : 0;

      return {
        id: student.id,
        name: student.name,
        dob: student.dob,
        gender: student.gender,
        grade: '12A1 (Đã tốt nghiệp)',
        gvcn,
        academicYear: `${entryYear + 2} - ${gradYear}`,
        scores,
        summary: {
          gpa: curGpa,
          academicConduct: curGpa >= 8.0 ? 'Giỏi' : curGpa >= 6.5 ? 'Khá' : 'Trung Bình',
          moralConduct: 'Tốt',
          daysAbsent: rc1.summary.daysAbsent + rc2.summary.daysAbsent,
          daysAbsentExcused: rc1.summary.daysAbsentExcused + rc2.summary.daysAbsentExcused,
          generalComment: 'Học sinh đã hoàn thành chương trình Mầm non. Chúc em luôn vững bước và gặt hái nhiều thành công trên chặng đường sắp tới!'
        }
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
      id: student.id,
      name: student.name,
      dob: student.dob,
      gender: student.gender,
      grade: '12A1 (Đã tốt nghiệp)',
      gvcn,
      academicYear: `${entryYear + 2} - ${gradYear}`,
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


  const handleDeleteAlumni = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ cựu học sinh của ${name}? Hành động này không thể hoàn tác.`)) {
      try {
        await deleteStudent(id);
        setAlumni(prev => prev.filter(s => s.id !== id));
        showToast(`🗑️ Đã xóa hồ sơ cựu học sinh của ${name}`);
      } catch (error) {
        showToast("❌ Không thể xóa hồ sơ");
      }
    }
  };

  const handleOpenDetail = (student: Student) => {
    setSelectedStudent(student);
    setReportCardSemester('Cả Năm');
    setIsModalOpen(true);
  };

  const handlePrintReportCard = () => {
    if (!selectedStudent) return;
    printElement('printable-alumni-card');
    showToast("🖨️ Đã gửi lệnh in học bạ của cựu học sinh");
  };

  // Filter & Search
  const filtered = alumni.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchQuery.toLowerCase());
    const cohort = getAlumniCohort(s.id);
    const matchesCohort = cohortFilter === 'All' ? true : cohort === cohortFilter;
    return matchesSearch && matchesCohort;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Stats
  const totalCount = alumni.length;
  const avgGpa = alumni.length > 0
    ? parseFloat((alumni.reduce((sum, s) => sum + getReportCardData(s, 'Cả Năm').summary.gpa, 0) / alumni.length).toFixed(2))
    : 0;
  const femaleCount = alumni.filter(s => s.gender === 'Nữ').length;
  const maleCount = alumni.filter(s => s.gender === 'Nam').length;

  const cohorts = Array.from(new Set(alumni.map(s => getAlumniCohort(s.id)))).sort();

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-[#f5f8fc] border border-[#b8c6d9] px-6 py-3 rounded-2xl shadow-lg flex items-center font-bold text-xs uppercase tracking-wider animate-in fade-in duration-300">
          <Check className="w-4 h-4 mr-2 text-green-400" /> {toast}
        </div>
      )}

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight font-playfair">Hồ sơ Cựu học sinh</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">Lưu trữ thông tin học sinh hoàn thành chương trình Mầm non An Hữu qua các niên khóa</p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8 shrink-0">
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Tổng cựu học sinh</p>
            <p className="text-3xl font-serif font-bold text-[#1e2a3a] mt-1">{totalCount}</p>
          </div>
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest">GPA Ra trường trung bình</p>
            <p className="text-3xl font-serif font-bold text-[#2c5ea0] mt-1">{avgGpa.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-[#2e6b8a] uppercase tracking-widest">Nam</p>
            <p className="text-3xl font-serif font-bold text-[#2e6b8a] mt-1">{maleCount}</p>
          </div>
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Nữ</p>
            <p className="text-3xl font-serif font-bold text-amber-700 mt-1">{femaleCount}</p>
          </div>
        </div>

        {/* Main Table Panel */}
        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col rounded-3xl overflow-hidden relative min-h-0 h-[600px]">
          
          {/* Table Toolbar */}
          <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
             <h3 className="font-bold text-[#2c5ea0] uppercase tracking-widest text-xs flex items-center">
               <GraduationCap className="w-4 h-4 mr-2" /> CỰU HỌC SINH TỐT NGHIỆP
             </h3>
             <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, mã học sinh..."
                    className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[240px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                  />
                </div>
                
                <select
                  value={cohortFilter}
                  onChange={e => setCohortFilter(e.target.value)}
                  className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full"
                >
                  <option value="All">Tất cả niên khóa</option>
                  {cohorts.map(c => (
                    <option key={c} value={c}>Niên khóa {c}</option>
                  ))}
                </select>
             </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 min-h-0 overflow-auto w-full">
            {loading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c5ea0]"></div>
              </div>
            ) : paginated.length > 0 ? (
              <table className="w-full min-w-[950px] text-sm text-left">
                <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-[0_1px_0_#b8c6d9]">
                  <tr>
                    <th className="px-6 py-4">Mã học sinh</th>
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4">Giới tính</th>
                    <th className="px-6 py-4">Ngày sinh</th>
                    <th className="px-6 py-4">Niên khóa</th>
                    <th className="px-6 py-4">Năm tốt nghiệp</th>
                    <th className="px-6 py-4 text-center">GPA Tốt nghiệp</th>
                    <th className="px-6 py-4 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                  {paginated.map(s => {
                    const cohort = getAlumniCohort(s.id);
                    const gradYear = getGraduationYear(s.id);
                    const rcData = getReportCardData(s, 'Cả Năm');
                    const gpa = rcData.summary.gpa;

                    return (
                      <tr key={s.id} className="hover:bg-[#e8eef6] transition-colors group">
                        <td className="px-6 py-5 font-mono text-xs text-[#7b8a9e]">{s.id}</td>
                        <td className="px-6 py-5">
                          <p className="font-bold text-[#1e2a3a]">{s.name}</p>
                        </td>
                        <td className="px-6 py-5 text-[#4a5568] font-bold">{s.gender}</td>
                        <td className="px-6 py-5 font-serif text-[#4a5568]">{s.dob}</td>
                        <td className="px-6 py-5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9]">
                            {cohort}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-serif font-bold text-[#1e2a3a]">{gradYear}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="font-serif text-lg font-bold text-[#2e6b8a]">
                            {gpa.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <ActionMenu
                            primaryAction={{
                              label: 'Học bạ tốt nghiệp',
                              icon: 'Eye',
                              onClick: () => handleOpenDetail(s)
                            }}
                            actions={[
                              {
                                label: 'Xóa cựu học sinh',
                                icon: 'Trash',
                                onClick: () => handleDeleteAlumni(s.id, s.name),
                                danger: true
                              }
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-8 text-[#7b8a9e]">
                <GraduationCap className="w-12 h-12 text-[#b8c6d9] mb-3" />
                <p className="text-sm font-bold uppercase tracking-wider">Không tìm thấy cựu học sinh nào</p>
              </div>
            )}
          </div>
          
          {/* Pagination Footer */}
          <div className="px-8 py-5 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        </div>
      </div>

      {/* DETAIL MODAL WITH PRINTABLE REPORT CARD */}
      <ModalBase
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Học Bạ Tốt Nghiệp th Điện Tử"
        subtitle="Hồ sơ thành tích học tập và rèn luyện cả năm lớp 12"
        width="max-w-4xl"
      >
        {selectedStudent && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#f5f8fc]">
            {/* Semester Select toolbar */}
            <div className="px-8 py-4 border-b border-dashed border-[#b8c6d9] bg-[#f5f8fc] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-bold text-[#4a5568] uppercase tracking-wider">Lọc xem học kỳ:</span>
                <select
                  value={reportCardSemester}
                  onChange={e => setReportCardSemester(e.target.value)}
                  className="px-4 py-2 bg-white border border-[#b8c6d9] text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0] rounded-full shadow-sm"
                >
                  <option value="Học Kỳ I">Học Kỳ I</option>
                  <option value="Học Kỳ II">Học Kỳ II</option>
                  <option value="Cả Năm">Cả Năm</option>
                </select>
              </div>
              <button
                onClick={handlePrintReportCard}
                className="flex items-center px-5 py-2 bg-[#2c5ea0] text-[#f5f8fc] border border-[#633030] text-xs font-bold uppercase tracking-widest hover:bg-[#633030] transition shadow-sm rounded-full"
              >
                <Printer className="w-4 h-4 mr-2" /> In học bạ cả lớp 12
              </button>
            </div>

            {/* Scrollable Printable area */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50 flex justify-center">
              <div id="printable-alumni-card" className="bg-white shadow-md rounded-xl p-2 max-w-[210mm] w-full">
                <PrintableReportCard
                  data={getReportCardData(selectedStudent, reportCardSemester)}
                  selectedSemester={reportCardSemester}
                />
              </div>
            </div>

            {/* Footer close */}
            <div className="p-6 border-t border-dashed border-[#b8c6d9] flex justify-end items-center bg-[#f5f8fc] shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </ModalBase>
    </main>
  );
};
