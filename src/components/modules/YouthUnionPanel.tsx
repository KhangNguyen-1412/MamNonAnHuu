import React, { useState, useEffect } from 'react';
import { BaseSelect } from '../ui/BaseInputs';
import { Filter, Plus, Search, MoreHorizontal, Flag, Star, Target, Users, BarChart as BarChartIcon, Settings, Eye } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { EmulationGradingModal, EmulationDetailModal, UnionMemberModal, CampaignModal, UnionMemberDetailModal } from '../ui/YouthUnionModals';
import { Pagination } from '../ui/Pagination';
import { getStudents, Student } from '../../services/studentService';

import { 
  getYouthUnionMembers, saveYouthUnionMember, deleteYouthUnionMember,
  getYouthUnionCampaigns, saveYouthUnionCampaign, deleteYouthUnionCampaign,
  getYouthUnionEmulations, saveYouthUnionEmulation, deleteYouthUnionEmulation,
  getYouthUnionStats, getClasses,
  YouthUnionMember, YouthUnionCampaign, YouthUnionEmulation, ClassData
} from '../../services/dbService';
import { useUserRole } from '../../utils/role';

const COLORS = ['#2c5ea0', '#a8c4e0', '#2e6b8a', '#7b8a9e'];

export const YouthUnionPanel: React.FC = () => {
  const currentRole = useUserRole();
  const [activeTab, setActiveTab] = useState<'members' | 'emulation' | 'campaigns'>('emulation');
  const [modalType, setModalType] = useState<'grading' | 'member' | 'campaign' | null>(null);
  const [selectedEmulation, setSelectedEmulation] = useState<YouthUnionEmulation | null>(null);
  const [selectedMember, setSelectedMember] = useState<YouthUnionMember | null>(null);
  const [selectedDetailMember, setSelectedDetailMember] = useState<any | null>(null);
  const [semesterFilter, setSemesterFilter] = useState<'all' | '1' | '2'>('all');

  const [selectedWeek, setSelectedWeek] = useState<number>(12);
  const [classesList, setClassesList] = useState<string[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>('All');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('All');

  const [members, setMembers] = useState<YouthUnionMember[]>([]);
  const [campaigns, setCampaigns] = useState<YouthUnionCampaign[]>([]);
  const [emulations, setEmulations] = useState<YouthUnionEmulation[]>([]);
  const [absenceData, setAbsenceData] = useState<any[]>([]);
  const [violationData, setViolationData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const loadUnionData = async () => {
      try {
        const [mList, cList, eList, statsList, cListReal, studentList] = await Promise.all([
          getYouthUnionMembers(),
          getYouthUnionCampaigns(),
          getYouthUnionEmulations(),
          getYouthUnionStats(),
          getClasses(),
          getStudents()
        ]);
        setMembers(mList);
        setCampaigns(cList);
        setEmulations(eList);
        setStudents(studentList);

        if (cListReal && cListReal.length > 0) {
          const names = cListReal.map(c => c.name || c.id).sort((a, b) => a.localeCompare(b, 'vi'));
          setClassesList(names);
        }

        const absenceStat = statsList.find(s => s.id === 'absence')?.data || [];
        const violationStat = statsList.find(s => s.id === 'violation')?.data || [];
        setAbsenceData(absenceStat);
        setViolationData(violationStat);
      } catch (err) {
        console.error("Failed to load youth union data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUnionData();
  }, []);

  const handleSaveMember = async (newData: YouthUnionMember) => {
    try {
      await saveYouthUnionMember(newData);
      setMembers(prev => {
        const exists = prev.some(m => m.id === newData.id);
        if (exists) return prev.map(m => m.id === newData.id ? newData : m);
        return [newData, ...prev];
      });
    } catch (err) {
      console.error("Failed to save member", err);
    }
  };

  const handleEditMember = (member: any) => {
    setSelectedMember(member);
    setModalType('member');
  };

  const handleDeleteMember = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa đoàn viên này?")) {
      try {
        await deleteYouthUnionMember(id);
        setMembers(prev => prev.filter(m => m.id !== id));
      } catch (err) {
        console.error("Failed to delete member", err);
      }
    }
  };

  const handleSaveCampaign = async (newData: YouthUnionCampaign) => {
    try {
      await saveYouthUnionCampaign(newData);
      setCampaigns(prev => {
        const exists = prev.some(c => c.id === newData.id);
        if (exists) return prev.map(c => c.id === newData.id ? newData : c);
        return [newData, ...prev];
      });
    } catch (err) {
      console.error("Failed to save campaign", err);
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa chiến dịch này?")) {
      try {
        await deleteYouthUnionCampaign(id);
        setCampaigns(prev => prev.filter(c => c.id !== id));
      } catch (err) {
        console.error("Failed to delete campaign", err);
      }
    }
  };

  const handleSaveEmulation = async (newData: YouthUnionEmulation) => {
    try {
      await saveYouthUnionEmulation(newData);
      setEmulations(prev => {
        const exists = prev.some(e => e.id === newData.id);
        if (exists) return prev.map(e => e.id === newData.id ? newData : e);
        return [newData, ...prev];
      });
    } catch (err) {
      console.error("Failed to save emulation", err);
    }
  };

  const handleDeleteEmulation = async (id: string) => {
    if (window.confirm("Bạn có chắc muốn xóa bản ghi thi đua này?")) {
      try {
        await deleteYouthUnionEmulation(id);
        setEmulations(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        console.error("Failed to delete emulation", err);
      }
    }
  };

  const handleAction = () => {
    if (activeTab === 'emulation') setModalType('grading');
    if (activeTab === 'members') setModalType('member');
    if (activeTab === 'campaigns') setModalType('campaign');
  };

  // Merge student list with custom youthUnionMembers registry
  const fullUnionMemberList = React.useMemo(() => {
    if (students.length === 0) {
      return members;
    }

    const memberMap = new Map<string, YouthUnionMember>();
    members.forEach(m => {
      const key = `${m.name.trim().toLowerCase()}_${m.class.trim().toLowerCase()}`;
      memberMap.set(key, m);
    });

    return students.map(student => {
      const classVal = student.grade || '';
      const key = `${student.name.trim().toLowerCase()}_${classVal.trim().toLowerCase()}`;
      const existingMember = memberMap.get(key);

      if (existingMember) {
        return {
          id: existingMember.id,
          name: student.name,
          class: classVal,
          dob: student.dob,
          date: existingMember.date || '26/03/2024',
          role: existingMember.role || 'Đoàn viên',
          status: existingMember.status || 'Đang giữ tại trường'
        };
      } else {
        // Fallback: If not in custom youthUnionMembers, they are "Đoàn viên" by default
        return {
          id: `HS-MEMBER-${student.id}`,
          name: student.name,
          class: classVal,
          dob: student.dob,
          date: '—',
          role: 'Đoàn viên',
          status: 'Chưa nộp sổ'
        };
      }
    });
  }, [students, members]);

  // Sort list by class name first, then by student name
  const sortedUnionMembers = React.useMemo(() => {
    return [...fullUnionMemberList].sort((a, b) => {
      const classCompare = a.class.localeCompare(b.class, 'vi');
      if (classCompare !== 0) return classCompare;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [fullUnionMemberList]);

  // Filter members by Search, Grade (Khối) and Class (Lớp)
  const filteredMembers = React.useMemo(() => {
    return sortedUnionMembers.filter(member => {
      if (currentRole === 'homeroom_teacher' && member.class !== '1A1') {
        return false;
      }
      
      const matchesSearch = member.name.toLowerCase().includes(searchText.toLowerCase()) ||
                            member.class.toLowerCase().includes(searchText.toLowerCase()) ||
                            member.role.toLowerCase().includes(searchText.toLowerCase());
      
      let matchesGrade = true;
      if (selectedGradeFilter !== 'All') {
        matchesGrade = member.class.startsWith(selectedGradeFilter);
      }
      
      let matchesClass = true;
      if (selectedClassFilter !== 'All') {
        matchesClass = member.class === selectedClassFilter;
      }
      
      return matchesSearch && matchesGrade && matchesClass;
    });
  }, [sortedUnionMembers, searchText, selectedGradeFilter, selectedClassFilter, currentRole]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchText]);

  const currentListLength = activeTab === 'members' ? filteredMembers.length : activeTab === 'campaigns' ? campaigns.length : 0;
  const totalPages = Math.ceil(currentListLength / pageSize);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedCampaigns = campaigns.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getMergedChartData = () => {
    // 1. Process baseline stats, ensuring semester is present (fallback for existing old documents in DB)
    const base = absenceData.map(d => {
      if (d.semester !== undefined) return { ...d };
      const name = d.name || '';
      let semester = 1;
      if (name.includes('9') || name.includes('10') || name.includes('11') || name.includes('12') || name.includes('1')) {
        semester = 1;
      } else {
        semester = 2;
      }
      return { ...d, semester };
    });

    // 2. Aggregate from real-time database emulations
    const realStats: Record<string, { late: number, absent: number }> = {};
    emulations.forEach(emu => {
      let monthVal = 0;
      if (emu.date) {
        // Parse date like DD/MM/YYYY or similar
        const parts = emu.date.split('/');
        if (parts.length === 3) {
          monthVal = parseInt(parts[1], 10);
        }
      } else if (emu.week) {
        // Map week to month approximate
        if (emu.week <= 4) monthVal = 9;
        else if (emu.week <= 8) monthVal = 10;
        else if (emu.week <= 12) monthVal = 11;
        else if (emu.week <= 16) monthVal = 12;
        else if (emu.week <= 20) monthVal = 1;
        else if (emu.week <= 24) monthVal = 2;
        else if (emu.week <= 28) monthVal = 3;
        else if (emu.week <= 32) monthVal = 4;
        else if (emu.week <= 36) monthVal = 5;
        else monthVal = 6;
      }

      if (monthVal > 0) {
        const key = `Tháng ${monthVal}`;
        if (!realStats[key]) {
          realStats[key] = { late: 0, absent: 0 };
        }
        
        if (emu.violations && emu.violations.length > 0) {
          emu.violations.forEach(v => {
            const t = (v.type || '').toLowerCase();
            if (t.includes('muộn') || t.includes('trễ')) {
              realStats[key].late += v.count || 0;
            }
            if (t.includes('vắng')) {
              realStats[key].absent += v.count || 0;
            }
          });
        } else {
          // fallback for mock/generic entries: calculate from score gap
          const baseVal = emu.baseScore || 100;
          if (emu.diem < baseVal) {
            const diff = baseVal - emu.diem;
            if (diff >= 10) {
              realStats[key].absent += 1;
            } else {
              realStats[key].late += 1;
            }
          }
        }
      }
    });

    // 3. Merge real-time counts into the baseline months
    const merged = base.map(item => {
      const key = item.name;
      if (realStats[key]) {
        return {
          ...item,
          'Đi Trễ': item['Đi Trễ'] + realStats[key].late,
          'Vắng': item['Vắng'] + realStats[key].absent
        };
      }
      return item;
    });

    return merged;
  };

  return (
    <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Đoàn Thanh Niên & Phong Trào</h1>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Quản lý thi đua học sinh và chiến dịch</p>
          </div>
          
          {['activities_head', 'school_board'].includes(currentRole) && (
            <div className="flex items-center space-x-4 mt-6 sm:mt-0">
              <button 
                onClick={handleAction}
                className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'emulation' ? 'Chấm Điểm Thi Đua' : activeTab === 'members' ? 'Thêm Đoàn Viên' : 'Tạo Chiến Dịch'}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">N nghiệp Vụ P.Trào</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('emulation')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'emulation' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <BarChartIcon className="w-5 h-5 mr-3" />
                Cờ Đỏ & Thi Đua
              </button>
              <button 
                onClick={() => setActiveTab('members')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'members' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Users className="w-5 h-5 mr-3" />
                Sổ Đoàn Viên
              </button>
              <button 
                onClick={() => setActiveTab('campaigns')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'campaigns' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Target className="w-5 h-5 mr-3" />
                Chiến Dịch - Sự Kiện
              </button>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] rounded-3xl overflow-hidden min-h-0">
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                {activeTab === 'members' && 'Danh Sách Phân Sinh Hoạt Đoàn'}
                {activeTab === 'emulation' && 'Thống Kê Nề Nếp & Xếp Hạng Thi Đua'}
                {activeTab === 'campaigns' && 'Kế Hoạch & Tiến Độ Chiến Dịch'}
              </h3>
              {activeTab === 'emulation' && (
                <button className="flex items-center text-[10px] font-bold text-[#4a5568] uppercase tracking-widest hover:underline">
                  <Settings className="w-3 h-3 mr-1" /> Cấu hình Barem
                </button>
              )}
            </div>
            
            {activeTab === 'emulation' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto">
                <div className="md:col-span-2 bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 border-b border-[#dce4ee] pb-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568]">Tỷ Lệ Học Sinh Vi Phạm Kỷ Luật Theo Tháng</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Xem Học Kỳ:</span>
                      <select
                        value={semesterFilter}
                        onChange={e => setSemesterFilter(e.target.value as any)}
                        className="px-3 py-1.5 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0] cursor-pointer"
                      >
                        <option value="all">Cả Năm Học</option>
                        <option value="1">Học Kỳ I</option>
                        <option value="2">Học Kỳ II</option>
                      </select>
                    </div>
                  </div>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={getMergedChartData().filter(d => semesterFilter === 'all' ? true : d.semester === Number(semesterFilter))} 
                        margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--chart-tooltip-text)' }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Line type="monotone" dataKey="Đi Trễ" stroke="#2c5ea0" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Vắng" stroke="#a8c4e0" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm w-full font-sans">
                  <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-2 border-b border-[#dce4ee] pb-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568]">Top Lớp Điểm Cao Nhất (Tuần)</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Xem Tuần:</span>
                      <select
                        value={selectedWeek}
                        onChange={e => setSelectedWeek(Number(e.target.value))}
                        className="px-3 py-1.5 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0] cursor-pointer"
                      >
                        {Array.from({ length: 37 }, (_, i) => i + 1).map(w => (
                          <option key={w} value={w}>Tuần {w}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto w-full">
                    {loading ? (
                      <p className="text-center py-4 text-xs font-bold text-[#7b8a9e]">Đang tải...</p>
                    ) : (
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-[3px] border-double border-[#b8c6d9]">
                            <th className="py-2 px-2 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Lớp</th>
                            <th className="py-2 px-2 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Điểm</th>
                            <th className="py-2 px-2 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Danh Hiệu</th>
                            <th className="py-2 px-2 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap text-right">Tác Vụ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {emulations.filter(cls => {
                             const matchesWeek = (cls.week || 12) === selectedWeek;
                             if (!matchesWeek) return false;
                             if (currentRole === 'homeroom_teacher') {
                               return cls.name === '1A1';
                             }
                             return true;
                           }).length > 0 ? (
                             emulations.filter(cls => {
                               const matchesWeek = (cls.week || 12) === selectedWeek;
                               if (!matchesWeek) return false;
                               if (currentRole === 'homeroom_teacher') {
                                 return cls.name === '1A1';
                               }
                               return true;
                             }).map((cls, idx) => (
                              <tr key={cls.id || idx} className="border-b border-dashed border-[#dce4ee] hover:bg-[#f0f4fa]/50 transition-colors">
                                <td className="py-3 px-2 font-bold text-[13px] text-[#1e2a3a]">{cls.name}</td>
                                <td className="py-3 px-2 font-bold text-[13px] text-[#2e6b8a]">{cls.diem}</td>
                                <td className="py-3 px-2 font-bold text-[11px] uppercase tracking-widest text-[#2c5ea0]">{cls.status}</td>
                                <td className="py-3 px-2 text-right">
                                  <div className="flex justify-end gap-1.5">
                                    <button 
                                      onClick={() => setSelectedEmulation(cls)} 
                                      className="text-[10px] text-[#2c5ea0] hover:text-[#5c2a2a] hover:bg-[#e8eef6] px-2 py-1 border border-[#d4dde9] rounded font-bold uppercase transition cursor-pointer flex items-center gap-0.5"
                                    >
                                      <Eye className="w-3 h-3" /> Chi Tiết
                                    </button>
                                    {['activities_head', 'school_board'].includes(currentRole) && (
                                      <button 
                                        onClick={() => handleDeleteEmulation(cls.id)} 
                                        className="text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 border border-red-100 rounded font-bold uppercase transition cursor-pointer"
                                      >
                                        Xóa
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-6 text-center text-xs italic text-[#8e9eb4]">
                                Chưa có dữ liệu chấm thi đua Tuần {selectedWeek}. Bấm "Chấm Điểm Thi Đua" để bắt đầu!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                <div className="bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm w-full">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-4 text-center">Cơ Cấu Lỗi Vi Phạm Phổ Biến</h4>
                  <div className="h-[200px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={violationData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={70}
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={2}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, value, name }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = 25 + innerRadius + (outerRadius - innerRadius);
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (
                              <text x={x} y={y} fill="#4a5568" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={10} fontWeight="bold">
                                {name} ({value}%)
                              </text>
                            );
                          }}
                        >
                          {violationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#f5f8fc', border: '1px solid #b8c6d9', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="p-6 overflow-y-auto">
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <input 
                    type="text" 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Tìm tên, lớp..." 
                    className="px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] flex-1 focus:outline-none focus:border-[#2c5ea0]" 
                  />
                  {currentRole !== 'homeroom_teacher' ? (
                    <div className="flex gap-2">
                      <select
                        value={selectedGradeFilter}
                        onChange={e => {
                          setSelectedGradeFilter(e.target.value);
                          setSelectedClassFilter('All');
                        }}
                        className="px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#4a5568] focus:outline-none focus:border-[#2c5ea0] cursor-pointer"
                      >
                        <option value="All">TẤT CẢ KHỐI</option>
                        <option value="10">KHỐI 1</option>
                        <option value="11">KHỐI 2</option>
                        <option value="12">KHỐI 5</option>
                      </select>

                      <select
                        value={selectedClassFilter}
                        onChange={e => setSelectedClassFilter(e.target.value)}
                        className="px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#4a5568] focus:outline-none focus:border-[#2c5ea0] cursor-pointer"
                      >
                        <option value="All">TẤT CẢ LỚP</option>
                        {classesList
                          .filter(cls => {
                            if (selectedGradeFilter === 'All') return true;
                            return cls.startsWith(selectedGradeFilter);
                          })
                          .map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))
                        }
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center px-4 py-2 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#2c5ea0]">
                      LỚP CHỦ NHIỆM: 10A1
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto w-full border border-[#b8c6d9] rounded-xl bg-[#ffffff]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6]">
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Đoàn Viên</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Ngày Kết Nạp</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Chức Vụ</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap">Trạng Thái Sổ</th>
                          <th className="py-3 px-4 text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedMembers.map((member) => (
                           <tr key={member.id} className="border-b border-dashed border-[#dce4ee] hover:bg-[#e8eef6] transition-colors">
                             <td className="py-3 px-4">
                                <p className="font-bold text-[13px] text-[#1e2a3a]">{member.name}</p>
                                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mt-0.5">{member.class} • {member.dob}</p>
                             </td>
                             <td className="py-3 px-4 font-bold text-[13px] text-[#4a5568]">{member.date}</td>
                             <td className="py-3 px-4 font-bold text-[12px] text-[#1e2a3a]">{member.role}</td>
                             <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest whitespace-nowrap 
                                  ${member.status === 'Đang giữ tại trường' ? 'bg-[#dcfce7] text-[#166534]' : 
                                    member.status === 'Chưa nộp sổ' ? 'bg-[#fef9c3] text-[#854d0e]' :
                                    'bg-[#fee2e2] text-[#991b1b]'}`}>
                                  {member.status}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end items-center gap-1.5">
                                  <button 
                                    onClick={() => setSelectedDetailMember(member)} 
                                    className="text-[10px] text-[#2c5ea0] hover:text-[#5c2a2a] hover:bg-[#e8eef6] px-2 py-1 border border-[#d4dde9] rounded font-bold uppercase transition cursor-pointer flex items-center gap-0.5"
                                  >
                                    <Eye className="w-3 h-3" /> Chi Tiết
                                  </button>
                                  {['activities_head', 'school_board'].includes(currentRole) && (
                                    <button 
                                      onClick={() => handleEditMember(member)} 
                                      className="text-[10px] text-[#4a5568] hover:text-[#1e2a3a] hover:bg-[#e8eef6] px-2 py-1 border border-[#d4dde9] rounded font-bold uppercase transition cursor-pointer"
                                    >
                                      Sửa
                                    </button>
                                  )}
                                  {['activities_head', 'school_board'].includes(currentRole) ? (
                                    !member.id.startsWith('HS-MEMBER-') ? (
                                      <button onClick={() => handleDeleteMember(member.id)} className="text-[10px] text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded font-bold uppercase transition cursor-pointer">Xóa</button>
                                    ) : (
                                      <span className="text-[10px] text-[#7b8a9e] italic font-medium">Hệ thống</span>
                                    )
                                  ) : null}
                                </div>
                              </td>
                           </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
              <div className="p-6 overflow-y-auto space-y-6">
                {paginatedCampaigns.map(camp => (
                  <div key={camp.id} className="bg-[#ffffff] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm flex flex-col gap-4">
                    <div className="flex justify-between items-start border-b border-[#b8c6d9] pb-4">
                      <div>
                        <h4 className="text-lg font-bold text-[#1e2a3a]">{camp.name}</h4>
                        <p className="text-[11px] font-bold text-[#7b8a9e] mt-1 tracking-widest uppercase">{camp.type} • {camp.time}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest 
                         ${camp.status === 'Lên kế hoạch' ? 'bg-[#dce4ee] text-[#4a5568]' : 
                           camp.status === 'Đang diễn ra' ? 'bg-[#dcfce7] text-[#166534]' : 
                           'bg-[#e8eef6] text-[#7b8a9e]'}`}>
                        {camp.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Quy mô sự kiện</p>
                        <p className="text-[13px] font-bold text-[#1e2a3a]">{camp.scale}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Giờ tình nguyện / Lợi ích</p>
                        <p className="text-[13px] font-bold text-[#2e6b8a]">{camp.hours} giờ / học sinh</p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2 border-t border-dashed border-[#b8c6d9] mt-2">
                       {['activities_head', 'school_board'].includes(currentRole) && (
                         <button onClick={() => handleDeleteCampaign(camp.id)} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-widest hover:bg-red-100 transition rounded-lg">Xóa</button>
                       )}
                       <button onClick={() => setModalType('campaign')} className="px-4 py-2 bg-[#e8eef6] text-[#4a5568] border border-[#b8c6d9] text-xs font-bold uppercase tracking-widest hover:bg-[#dce4ee] transition rounded-lg">Chi Tiết / Đăng ký</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab !== 'emulation' && !loading && (
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

      <EmulationGradingModal 
        isOpen={modalType === 'grading'} 
        onClose={() => setModalType(null)} 
        onSave={handleSaveEmulation}
        classes={classesList}
        defaultWeek={selectedWeek}
      />
      <EmulationDetailModal isOpen={selectedEmulation !== null} onClose={() => setSelectedEmulation(null)} emulation={selectedEmulation} />
      <UnionMemberModal 
        isOpen={modalType === 'member'} 
        onClose={() => {
          setModalType(null);
          setSelectedMember(null);
        }} 
        onSave={handleSaveMember} 
        member={selectedMember}
      />
      <CampaignModal isOpen={modalType === 'campaign'} onClose={() => setModalType(null)} onSave={handleSaveCampaign} />
      <UnionMemberDetailModal isOpen={selectedDetailMember !== null} onClose={() => setSelectedDetailMember(null)} member={selectedDetailMember} />
    </main>
  );
};
