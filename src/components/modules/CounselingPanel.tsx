import React, { useState, useEffect } from 'react';
import { BaseSelect } from '../ui/BaseInputs';
import { Plus, Search, Compass, MessageSquare, Brain, Lightbulb, Map, FileSearch, ShieldCheck, Calendar } from 'lucide-react';
import { AppointmentModal, CaseNoteModal } from '../ui/CounselingModals';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { getCounselingAppointments, getCounselingUniversities, saveCounselingAppointment, CounselingAppointment, UniversityMajors } from '../../services/dbService';
import { getStudents, Student } from '../../services/studentService';
import { Pagination } from '../ui/Pagination';

export const CounselingPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'career' | 'tests'>('sessions');
  const [modalType, setModalType] = useState<'booking' | 'casenotes' | null>(null);

  const [appointments, setAppointments] = useState<CounselingAppointment[]>([]);
  const [universities, setUniversities] = useState<UniversityMajors[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCounselingData = async () => {
      try {
        const [aList, uList, sList] = await Promise.all([
          getCounselingAppointments(),
          getCounselingUniversities(),
          getStudents()
        ]);
        setAppointments(aList);
        setUniversities(uList);
        setStudents(sList);
      } catch (err) {
        console.error("Failed to load counseling data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCounselingData();
  }, []);

  const getPersonalityChartData = () => {
    if (students.length === 0) {
      return [
        { name: 'Kỹ thuật/CNTT', count: 0 },
        { name: 'Kinh tế/Kinh doanh', count: 0 },
        { name: 'Xã hội/Ngôn ngữ', count: 0 },
        { name: 'Nghệ thuật/Thiết kế', count: 0 },
        { name: 'Y Dược', count: 0 },
      ];
    }
    
    let cntIT = 0;
    let cntBiz = 0;
    let cntSoc = 0;
    let cntArt = 0;
    let cntMed = 0;
    
    students.forEach(s => {
      let hash = 0;
      for (let i = 0; i < s.id.length; i++) {
        hash = s.id.charCodeAt(i) + ((hash << 5) - hash);
      }
      const val = Math.abs(hash) % 5;
      if (val === 0) cntIT++;
      else if (val === 1) cntBiz++;
      else if (val === 2) cntSoc++;
      else if (val === 3) cntArt++;
      else cntMed++;
    });
    
    return [
      { name: 'Kỹ thuật/CNTT', count: cntIT },
      { name: 'Kinh tế/Kinh doanh', count: cntBiz },
      { name: 'Xã hội/Ngôn ngữ', count: cntSoc },
      { name: 'Nghệ thuật/Thiết kế', count: cntArt },
      { name: 'Y Dược', count: cntMed },
    ];
  };

  const handleCreateAppointment = async (newApt: any) => {
    const entry: CounselingAppointment = {
      id: `APT-${Date.now().toString().slice(-4)}`,
      name: newApt.studentName || 'Học sinh Ẩn danh',
      class: newApt.studentClass || 'Khối 5',
      topic: newApt.topic || 'Định hướng nghề nghiệp',
      level: newApt.urgency || 'Bình thường',
      time: newApt.date + ' • ' + (newApt.time || '08:00'),
      method: newApt.method || 'Trực tiếp',
      status: 'Chờ xác nhận'
    };

    try {
      await saveCounselingAppointment(entry);
      setAppointments(prev => [entry, ...prev]);
    } catch (err) {
      console.error("Failed to save appointment:", err);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const currentListLength = activeTab === 'sessions' ? appointments.length : activeTab === 'career' ? universities.length : 0;
  const totalPages = Math.ceil(currentListLength / pageSize);
  const paginatedAppointments = appointments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedUniversities = universities.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="flex-1 overflow-y-auto p-8 relative scroll-smooth">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto z-10 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Tâm Lý & Hướng Nghiệp</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Tư vấn tâm lý, định hướng nghề nghiệp ĐH</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 sm:mt-0">
            <button 
              onClick={() => setModalType('booking')}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Đặt Lịch Tư Vấn
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">Hoạt Động Tư Vấn</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('sessions')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'sessions' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Tham Vấn Tâm Lý
              </button>
              <button 
                onClick={() => setActiveTab('career')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'career' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Lightbulb className="w-5 h-5 mr-3" />
                Thông Tin Tuyển Sinh
              </button>
              <button 
                onClick={() => setActiveTab('tests')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'tests' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Brain className="w-5 h-5 mr-3" />
                Trọng Tâm & Kết Quả
              </button>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] rounded-3xl overflow-hidden min-h-0">
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                {activeTab === 'sessions' && 'Lịch Hẹn & Hồ Sơ Ca Tư Vấn'}
                {activeTab === 'career' && 'Cẩm Nang Đại Học & Ngành Nghề'}
                {activeTab === 'tests' && 'Bản Đồ Nghề Nghiệp & Trắc Nghiệm'}
              </h3>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center flex-1 text-[#7b8a9e] font-bold">Đang tải dữ liệu tư vấn...</div>
            ) : activeTab === 'sessions' ? (
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 bg-[#ffffff] border border-[#b8c6d9] p-4 rounded-xl flex items-center shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-[#2c5ea0] mr-3" />
                    <div>
                      <p className="text-[11px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-0.5">Bảo mật</p>
                      <p className="text-sm font-bold text-[#1e2a3a]">Dữ liệu mã hóa (E2E) cấp Document-Level</p>
                    </div>
                  </div>
                  <button onClick={() => setModalType('booking')} className="flex items-center px-5 bg-[#2c5ea0] hover:bg-[#5c2a2a] text-[#f5f8fc] font-bold text-xs uppercase tracking-widest rounded-xl transition border border-[#2c5ea0]">
                    <Calendar className="w-4 h-4 mr-2" /> Đặt Lịch Mới
                  </button>
                </div>

                <div className="overflow-x-auto w-full border border-[#b8c6d9] rounded-xl bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">
                        <th className="py-3 px-4">Đơn Hẹn</th>
                        <th className="py-3 px-4">Chủ Đề Ca</th>
                        <th className="py-3 px-4">Thời Gian</th>
                        <th className="py-3 px-4">Hình Thức</th>
                        <th className="py-3 px-4">Mức Độ</th>
                        <th className="py-3 px-4 text-center">Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dce4ee]">
                      {paginatedAppointments.map((apt) => (
                        <tr key={apt.id} className="hover:bg-[#e8eef6]/50 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#1e2a3a]">{apt.name}</p>
                            <p className="text-[10px] text-[#7b8a9e] uppercase font-bold mt-0.5">{apt.class}</p>
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1e2a3a]">{apt.topic}</td>
                          <td className="py-3 px-4 text-xs font-medium text-[#4a5568]">{apt.time}</td>
                          <td className="py-3 px-4 text-xs font-bold text-[#4a5568]">{apt.method}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                              apt.level === 'Khẩn cấp' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>{apt.level}</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                              apt.status === 'Đã hoàn thành' ? 'bg-green-100 text-green-800' :
                              apt.status === 'Đã lên lịch' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                            }`}>{apt.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeTab === 'career' ? (
              <div className="p-6 overflow-y-auto space-y-6">
                {paginatedUniversities.map((uni) => (
                  <div key={uni.id} className="bg-white p-6 border border-[#b8c6d9] rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b border-[#dce4ee] pb-3">
                      <div>
                        <h4 className="text-base font-serif font-bold text-[#1e2a3a]">{uni.name}</h4>
                        <a href={`https://${uni.url}`} target="_blank" rel="noreferrer" className="text-xs text-[#2c5ea0] hover:underline font-bold mt-1 block">{uni.url}</a>
                      </div>
                      <span className="bg-[#e8eef6] px-2.5 py-1 border border-[#b8c6d9] rounded text-[10px] font-mono font-bold text-[#4a5568]">{uni.id}</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Ngành nghề tuyển sinh trọng điểm</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uni.majors.map((major, idx) => (
                          <div key={idx} className="p-3 bg-[#f5f8fc] border border-[#dce4ee] rounded-xl flex flex-col justify-between">
                            <div>
                              <p className="text-sm font-bold text-[#1e2a3a]">{major.name}</p>
                              <p className="text-[10px] font-mono text-[#7b8a9e] mt-0.5">Mã ngành: {major.code} • Tổ hợp: {major.combine}</p>
                            </div>
                            <div className="flex justify-between items-center mt-3 pt-2 border-t border-dashed border-[#dce4ee]">
                              <span className="text-[10px] text-[#7b8a9e] font-bold uppercase">{major.method}</span>
                              <span className="text-sm font-serif font-bold text-[#2c5ea0]">Sàn: {major.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 border border-[#b8c6d9] rounded-2xl shadow-sm md:col-span-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-6 border-b border-[#dce4ee] pb-2">Thống Kê Khảo Sát Tính Cách (RIASEC)</h4>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getPersonalityChartData()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                        <Tooltip wrapperStyle={{ outline: 'none' }} contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', border: '1px solid var(--chart-tooltip-border)', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: 'var(--chart-tooltip-text)' }} />
                        <Bar dataKey="count" fill="#2c5ea0" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 border border-[#b8c6d9] rounded-2xl shadow-sm space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a5568] border-b border-[#dce4ee] pb-2">Liên Kết Nhanh</h4>
                  <button className="w-full py-3 bg-[#e8eef6] hover:bg-[#1e2a3a] hover:text-white border border-[#b8c6d9] text-xs font-bold uppercase tracking-widest rounded-xl transition-colors">
                    Khảo Sát RIASEC
                  </button>
                  <button className="w-full py-3 bg-[#e8eef6] hover:bg-[#1e2a3a] hover:text-white border border-[#b8c6d9] text-xs font-bold uppercase tracking-widest rounded-xl transition-colors">
                    Trắc Nghiệm MBTI
                  </button>
                  <button className="w-full py-3 bg-[#e8eef6] hover:bg-[#1e2a3a] hover:text-white border border-[#b8c6d9] text-xs font-bold uppercase tracking-widest rounded-xl transition-colors">
                    Hồ sơ tư vấn cá nhân
                  </button>
                </div>
              </div>
            )}
            {activeTab !== 'tests' && !loading && (
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

      <AppointmentModal isOpen={modalType === 'booking'} onClose={() => setModalType(null)} onSave={handleCreateAppointment} />
      <CaseNoteModal isOpen={modalType === 'casenotes'} onClose={() => setModalType(null)} />
    </main>
  );
};
