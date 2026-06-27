import React, { useState, useEffect } from 'react';
import { BaseSelect, FilterSelect } from '../ui/BaseInputs';
import { Filter, Plus, Search, MoreHorizontal, Award, FileSearch, ShieldAlert, BarChart as BarChartIcon, UploadCloud, FileText } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BulkImportModal, ReadOnlyModal } from '../ui/Modals';
import { getQAInspections, getQAEvidence, saveQAInspection, saveQAEvidenceItem, QAInspection, QAEvidence, ClassData, getClasses } from '../../services/dbService';
import { Pagination } from '../ui/Pagination';
import { getStudents, Student } from '../../services/studentService';

const COLORS = ['#2e6b8a', '#a8c4e0', '#7b8a9e', '#2c5ea0'];

export const QualityAssurancePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inspections' | 'accreditation' | 'reports'>('reports');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isReadOnlyOpen, setIsReadOnlyOpen] = useState(false);

  const [inspections, setInspections] = useState<QAInspection[]>([]);
  const [evidence, setEvidence] = useState<QAEvidence[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedGrade, setSelectedGrade] = useState('Khối 5');
  const [selectedClass, setSelectedClass] = useState('Tất cả lớp');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả môn');
  const [selectedYear, setSelectedYear] = useState('Năm học 2025 - 2026');
  const [selectedSemester, setSelectedSemester] = useState('Học kỳ 1');

  const SUBJECT_COLORS: Record<string, string> = {
    'Toán': '#2c5ea0',
    'Ngữ Văn': '#2e6b8a',
    'Tiếng Anh': '#7b8a9e',
    'Vật Lý': '#ca8a04',
    'Hóa Học': '#0284c7',
    'Sinh Học': '#16a34a',
    'Lịch Sử': '#b45309',
    'Địa Lý': '#0d9488',
  };

  const activeSubjectsList = selectedSubject === 'Tất cả môn'
    ? Object.keys(SUBJECT_COLORS)
    : [selectedSubject];

  const [evidenceSearchQuery, setEvidenceSearchQuery] = useState('');
  const [evidenceStatusFilter, setEvidenceStatusFilter] = useState('All');

  const handleGradeChange = (val: string) => {
    setSelectedGrade(val);
    setSelectedClass('Tất cả lớp');
  };

  const getClassOptions = () => {
    const gradeNum = selectedGrade.replace('Khối ', '');
    const set = new Set<string>();
    
    classesList.forEach(c => {
      if (c.grade?.toString() === gradeNum || c.name?.startsWith(gradeNum)) {
        set.add(c.name);
      }
    });
    
    students.forEach(s => {
      if (s.grade && s.grade.startsWith(gradeNum)) {
        set.add(s.grade);
      }
    });

    const uniqueClasses = Array.from(set).sort();
    
    return [
      { value: 'Tất cả lớp', label: 'Tất cả lớp' },
      ...uniqueClasses.map(clsName => ({ value: clsName, label: clsName }))
    ];
  };

  const getStudentScore = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = 3.0 + (Math.abs(hash) % 66) / 10;
    return score;
  };

  const getStudentSubjectScore = (studentId: string, subject: string) => {
    let hash = 0;
    const key = studentId + subject;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = 4.0 + (Math.abs(hash) % 56) / 10;
    return score;
  };

  const getPerformancePieData = () => {
    const filtered = students.filter(s => {
      const matchesGrade = selectedGrade === 'Tất cả khối' || s.grade.startsWith(selectedGrade.replace('Khối ', ''));
      const matchesClass = selectedClass === 'Tất cả lớp' || s.grade === selectedClass;
      return matchesGrade && matchesClass && s.status === 'Đang Học';
    });

    if (filtered.length === 0) {
      return [
        { name: 'Giỏi', value: 0 },
        { name: 'Khá', value: 0 },
        { name: 'Đạt', value: 0 },
        { name: 'Chưa Đạt', value: 0 },
      ];
    }

    let gioiorig = 0;
    let khaorig = 0;
    let datorig = 0;
    let chuadatorig = 0;

    filtered.forEach(s => {
      const score = selectedSubject === 'Tất cả môn'
        ? getStudentScore(s.id)
        : getStudentSubjectScore(s.id, selectedSubject);
      if (score >= 8.0) gioiorig++;
      else if (score >= 6.5) khaorig++;
      else if (score >= 5.0) datorig++;
      else chuadatorig++;
    });

    return [
      { name: 'Giỏi', value: gioiorig },
      { name: 'Khá', value: khaorig },
      { name: 'Đạt', value: datorig },
      { name: 'Chưa Đạt', value: chuadatorig },
    ];
  };

  const getTrendData = () => {
    const filtered = students.filter(s => {
      const matchesGrade = selectedGrade === 'Tất cả khối' || s.grade.startsWith(selectedGrade.replace('Khối ', ''));
      const matchesClass = selectedClass === 'Tất cả lớp' || s.grade === selectedClass;
      return matchesGrade && matchesClass && s.status === 'Đang Học';
    });

    const subjectsToInclude = Object.keys(SUBJECT_COLORS);

    if (filtered.length === 0) {
      return [
        { name: 'Giữa K1' },
        { name: 'Cuối K1' },
        { name: 'Giữa K2' },
        { name: 'Cuối K2' },
      ].map(item => {
        const row: any = { ...item };
        subjectsToInclude.forEach(sub => {
          row[sub] = 0;
        });
        return row;
      });
    }

    const periods = [
      { name: 'Giữa K1', factor: 0.88 },
      { name: 'Cuối K1', factor: 0.91 },
      { name: 'Giữa K2', factor: 0.94 },
      { name: 'Cuối K2', factor: 0.98 },
    ];

    return periods.map(p => {
      const row: any = { name: p.name };
      subjectsToInclude.forEach((sub, subIdx) => {
        const subFactor = p.factor + ((subIdx % 3 - 1) * 0.03); 
        const totalScore = filtered.reduce((sum, s) => {
          const baseScore = getStudentSubjectScore(s.id, sub);
          return sum + baseScore * subFactor;
        }, 0);
        const avg = totalScore / filtered.length;
        row[sub] = Number(Math.min(10, Math.max(0, avg)).toFixed(1));
      });
      return row;
    });
  };

  const getHistogramData = () => {
    const filtered = students.filter(s => {
      const matchesGrade = selectedGrade === 'Tất cả khối' || s.grade.startsWith(selectedGrade.replace('Khối ', ''));
      const matchesClass = selectedClass === 'Tất cả lớp' || s.grade === selectedClass;
      return matchesGrade && matchesClass && s.status === 'Đang Học';
    });

    const buckets = [
      { score: '0-1', count: 0 },
      { score: '1-2', count: 0 },
      { score: '2-3', count: 0 },
      { score: '3-4', count: 0 },
      { score: '4-5', count: 0 },
      { score: '5-6', count: 0 },
      { score: '6-7', count: 0 },
      { score: '7-8', count: 0 },
      { score: '8-9', count: 0 },
      { score: '9-10', count: 0 },
    ];

    filtered.forEach(s => {
      const score = selectedSubject === 'Tất cả môn'
        ? getStudentScore(s.id)
        : getStudentSubjectScore(s.id, selectedSubject);
      const idx = Math.min(9, Math.floor(score));
      buckets[idx].count++;
    });

    return buckets;
  };

  const getClassRankingData = () => {
    const gradePrefix = selectedGrade.replace('Khối ', '');
    const filtered = students.filter(s => s.grade.startsWith(gradePrefix) && s.status === 'Đang Học');
    
    const classGroups: Record<string, number[]> = {};
    filtered.forEach(s => {
      if (!classGroups[s.grade]) {
        classGroups[s.grade] = [];
      }
      const score = selectedSubject === 'Tất cả môn'
        ? getStudentScore(s.id)
        : getStudentSubjectScore(s.id, selectedSubject);
      classGroups[s.grade].push(score);
    });

    const list = Object.keys(classGroups).map(className => {
      const scores = classGroups[className];
      const avg = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
      const passRate = Math.round((scores.filter(s => s >= 5.0).length / scores.length) * 100);
      return { class: className, avg, passRate };
    });

    list.sort((a, b) => b.avg - a.avg);
    return list.length > 0 ? list : [
      { class: 'Chưa có lớp', avg: 0, passRate: 0 }
    ];
  };

  const filteredEvidence = evidence.filter(ev => {
    const matchesSearch = ev.name.toLowerCase().includes(evidenceSearchQuery.toLowerCase()) ||
                          ev.code.toLowerCase().includes(evidenceSearchQuery.toLowerCase()) ||
                          ev.standard.toLowerCase().includes(evidenceSearchQuery.toLowerCase());
    const matchesStatus = evidenceStatusFilter === 'All' || ev.status === evidenceStatusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    const loadQAData = async () => {
      try {
        const [iList, eList, sList, cList] = await Promise.all([
          getQAInspections(),
          getQAEvidence(),
          getStudents(),
          getClasses()
        ]);
        setInspections(iList);
        setEvidence(eList);
        setStudents(sList);
        setClassesList(cList);
      } catch (err) {
        console.error("Failed to load QA data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadQAData();
  }, []);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, evidenceSearchQuery, evidenceStatusFilter]);

  const currentListLength = activeTab === 'inspections' ? inspections.length : activeTab === 'accreditation' ? filteredEvidence.length : 0;
  const totalPages = Math.ceil(currentListLength / pageSize);
  const paginatedInspections = inspections.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedEvidence = filteredEvidence.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
      <BulkImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
      <ReadOnlyModal isOpen={isReadOnlyOpen} onClose={() => setIsReadOnlyOpen(false)} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Khảo Thí & Kiểm Định</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Thống kê học lực & thanh tra nội bộ</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 sm:mt-0">
            <button 
              onClick={() => setIsReadOnlyOpen(true)}
              className="flex items-center px-4 py-2.5 bg-[#f5f8fc] text-[#4a5568] border border-[#b8c6d9] text-xs uppercase tracking-widest font-bold hover:bg-[#dce4ee] transition shadow-[2px_2px_0px_#dce4ee] active:shadow-none rounded-full"
            >
              <FileText className="w-4 h-4 mr-2" />
              Xem Học Bạ ĐT
            </button>
            <button 
              onClick={() => setIsImportOpen(true)}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Nhập Điểm Hàng Loạt
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">Hệ Thống Đánh Giá</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'reports' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <BarChartIcon className="w-5 h-5 mr-3" />
                Thống Kê Học Lực
              </button>
              <button 
                onClick={() => setActiveTab('inspections')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'inspections' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <ShieldAlert className="w-5 h-5 mr-3" />
                Thanh Tra Nội Bộ
              </button>
              <button 
                onClick={() => setActiveTab('accreditation')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'accreditation' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <FileSearch className="w-5 h-5 mr-3" />
                Hồ Sơ Minh Chứng
              </button>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] rounded-3xl overflow-hidden min-h-0">
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                {activeTab === 'inspections' && 'Dự Giờ & Biên Bản Thanh Tra'}
                {activeTab === 'accreditation' && 'Số Liệu Tự Đánh Giá - Kiểm Định'}
                {activeTab === 'reports' && 'Báo Cáo Tổng Hợp Chất Lượng Giáo Dục'}
              </h3>
              {activeTab === 'accreditation' && (
                <div className="flex items-center space-x-3">
                   <div className="relative">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                    <input 
                      type="text" 
                      value={evidenceSearchQuery}
                      onChange={e => setEvidenceSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm minh chứng..."
                      className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                    />
                  </div>
                  <FilterSelect
                    label="Trạng thái"
                    value={evidenceStatusFilter}
                    onChange={setEvidenceStatusFilter}
                    options={[
                      { value: 'All', label: 'TẤT CẢ' },
                      { value: 'Đã thu thập', label: 'Đã thu thập' },
                      { value: 'Đang chờ', label: 'Đang chờ' },
                      { value: 'Cần bổ sung', label: 'Cần bổ sung' }
                    ]}
                    icon={Filter}
                  />
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center flex-1 text-[#7b8a9e] font-bold">Đang tải dữ liệu QA...</div>
            ) : activeTab === 'reports' ? (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                <div className="md:col-span-2 flex flex-wrap gap-4 items-center mb-2 bg-[#f5f8fc] p-4 rounded-xl border border-[#b8c6d9] shadow-sm">
                  <div className="flex-1 min-w-[120px]">
                    <BaseSelect
                      value={selectedGrade}
                      options={[{value: 'Khối 5', label: 'Khối 5'}, {value: 'Khối 2', label: 'Khối 2'}, {value: 'Khối 1', label: 'Khối 1'}]}
                      onChange={handleGradeChange}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <BaseSelect
                      value={selectedClass}
                      options={getClassOptions()}
                      onChange={setSelectedClass}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <BaseSelect
                      value={selectedSubject}
                      options={[
                        {value: 'Tất cả môn', label: 'Tất cả môn'}, 
                        {value: 'Toán', label: 'Toán'}, 
                        {value: 'Ngữ Văn', label: 'Ngữ Văn'}, 
                        {value: 'Tiếng Anh', label: 'Tiếng Anh'},
                        {value: 'Vật Lý', label: 'Vật Lý'},
                        {value: 'Hóa Học', label: 'Hóa Học'},
                        {value: 'Sinh Học', label: 'Sinh Học'},
                        {value: 'Lịch Sử', label: 'Lịch Sử'},
                        {value: 'Địa Lý', label: 'Địa Lý'}
                      ]}
                      onChange={setSelectedSubject}
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <BaseSelect
                      value={selectedYear}
                      options={(() => {
                        const years = new Set<string>();
                        classesList.forEach(c => {
                          if (c.academicYear) {
                            years.add(c.academicYear);
                          }
                        });
                        if (years.size === 0) {
                          years.add("2025 - 2026");
                        }
                        return Array.from(years).sort().map(y => ({
                          value: `Năm học ${y}`,
                          label: `Năm học ${y}`
                        }));
                      })()}
                      onChange={setSelectedYear}
                    />
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <BaseSelect
                      value={selectedSemester}
                      options={[{value: 'Học kỳ 1', label: 'Học kỳ 1'}, {value: 'Học kỳ 2', label: 'Học kỳ 2'}]}
                      onChange={setSelectedSemester}
                    />
                  </div>
                  <button className="px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-xl">
                    Lọc Dữ Liệu
                  </button>
                </div>

                <div className="md:col-span-2 bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm w-full">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-4 text-center">
                    Xu Hướng Điểm Trung Bình - {selectedGrade} {selectedClass !== 'Tất cả lớp' ? `(${selectedClass})` : ''}
                  </h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={getTrendData()} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <YAxis domain={[5, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--chart-tooltip-text)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        {activeSubjectsList.map(sub => (
                          <Line
                            key={sub}
                            type="monotone"
                            dataKey={sub}
                            stroke={SUBJECT_COLORS[sub] || '#7b8a9e'}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm w-full">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-4 text-center">Phân Phối Học Lực Tổng Quan (%)</h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getPerformancePieData()} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {getPerformancePieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--chart-tooltip-text)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm w-full">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-4 text-center">Phổ Điểm Chi Tiết (Grade Histogram)</h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getHistogramData()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--chart-tooltip-text)' }} />
                        <Bar dataKey="count" fill="#7b8a9e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="md:col-span-2 bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm w-full">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-4 text-center">Bảng Xếp Hạng Lớp (Theo Khối)</h4>
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-[3px] border-double border-[#b8c6d9]">
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Lớp</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Điểm TB Lớp</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Tỷ lệ {">"} 5.0</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getClassRankingData().map((cls, idx) => (
                          <tr key={idx} className="border-b border-dashed border-[#dce4ee] hover:bg-[#e8eef6] transition-colors">
                            <td className="py-4 px-4 text-sm font-bold text-[#1e2a3a]">{cls.class}</td>
                            <td className="py-4 px-4 text-sm font-bold text-[#2c5ea0]">{cls.avg}</td>
                            <td className="py-4 px-4 text-sm font-bold text-[#2e6b8a]">{cls.passRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : activeTab === 'inspections' ? (
              <div className="p-6 overflow-y-auto space-y-6">
                {paginatedInspections.map(ins => (
                  <div key={ins.id} className="bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-[#b8c6d9] pb-4">
                      <div>
                        <h4 className="text-lg font-bold text-[#1e2a3a]">{ins.plan}</h4>
                        <p className="text-xs font-bold text-[#7b8a9e] mt-1">{ins.target} • {ins.time}</p>
                      </div>
                      <span className="px-3 py-1 bg-[#dce4ee] text-[#4a5568] rounded-full text-[10px] font-bold uppercase tracking-widest">Đang thực hiện</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="col-span-1 border-b md:border-b-0 md:border-r border-dashed border-[#b8c6d9] pb-4 md:pb-0 md:pr-4">
                        <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Thành phần đoàn</p>
                        <p className="text-sm font-bold text-[#1e2a3a]">{ins.team}</p>
                      </div>
                      <div className="col-span-1 border-b md:border-b-0 md:border-r border-dashed border-[#b8c6d9] pb-4 md:pb-0 md:pr-4">
                        <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Hồ sơ Dự giờ</p>
                        <p className="text-sm font-bold text-[#2e6b8a]">{ins.observation}</p>
                      </div>
                      <div className="col-span-1">
                        <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Kiểm tra Hồ sơ sổ sách</p>
                        <p className="text-sm font-bold text-[#2c5ea0]">{ins.records}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                       <button className="px-4 py-2 bg-[#e8eef6] text-[#4a5568] border border-[#b8c6d9] text-xs font-bold uppercase tracking-widest hover:bg-[#dce4ee] transition rounded-lg">Xem Biên Bản</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               <div className="p-6 overflow-y-auto">
                  <div className="overflow-x-auto w-full">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6]">
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Tiêu chuẩn / Tiêu chí</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Mã MC</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest min-w-[250px]">Tên & Nội dung Minh chứng</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Định vị lưu trữ</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedEvidence.map((ev, idx) => (
                           <React.Fragment key={idx}>
                           {idx === 0 || paginatedEvidence[idx-1].standard !== ev.standard ? (
                             <tr className="bg-[#f0f4fa] border-b border-[#dce4ee]">
                               <td colSpan={5} className="py-2 px-4 text-xs font-bold text-[#4a5568] uppercase tracking-wider">{ev.standard}</td>
                             </tr>
                           ) : null}
                           <tr className="border-b border-dashed border-[#dce4ee] hover:bg-[#e8eef6] transition-colors">
                             <td className="py-4 px-4 text-xs font-bold text-[#7b8a9e]">{ev.criteria}</td>
                             <td className="py-4 px-4 text-xs font-bold text-[#1e2a3a]"><span className="bg-[#dce4ee] px-2 py-1 rounded text-xs">{ev.code}</span></td>
                             <td className="py-4 px-4">
                                <p className="text-sm font-bold text-[#1e2a3a]">{ev.name}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <p className="text-[10px] text-[#7b8a9e] uppercase tracking-widest">Ban hành: {ev.issuer} • {ev.date}</p>
                                  {ev.status === 'Đã thu thập' ? (
                                    <button className="flex items-center text-[10px] font-bold text-[#2e6b8a] uppercase tracking-widest hover:underline font-sans">
                                      <FileText className="w-3 h-3 mr-1" />
                                      Xem File Số Hóa (PDF)
                                    </button>
                                  ) : (
                                    <button className="flex items-center text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest hover:underline font-sans">
                                      <UploadCloud className="w-3 h-3 mr-1" />
                                      Tải lên (PDF)
                                    </button>
                                  )}
                                </div>
                             </td>
                             <td className="py-4 px-4 text-sm font-bold text-[#4a5568]">{ev.location}</td>
                             <td className="py-4 px-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                                   ev.status === 'Đã thu thập' ? 'bg-[#dcfce7] text-[#166534] border border-[#bbf7d0]' : 
                                   ev.status === 'Đang chờ' ? 'bg-[#fef9c3] text-[#854d0e] border border-[#fef08a]' : 
                                   'bg-[#fee2e2] text-[#991b1b] border border-[#fecaca]'
                                }`}>{ev.status}</span>
                             </td>
                           </tr>
                           </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            )}
            {activeTab !== 'reports' && !loading && (
              <div className="px-8 py-5 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={currentListLength}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
