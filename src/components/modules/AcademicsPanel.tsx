import React, { useState, useRef, useEffect } from 'react';
import { Filter, Plus, Search, BookOpen, PenTool, Flag, GraduationCap, ChevronDown, Upload, Layers, Check, X, ShieldAlert, RotateCcw } from 'lucide-react';
import { SyllabusDistributionModal, ExamPlanModal, ExtracurricularModal } from '../ui/AcademicsModals';
import { ActionMenu } from '../ui/ActionMenu';
import { Pagination } from '../ui/Pagination';
import { 
  getPlans, savePlan, deletePlan, CurriculumPlan,
  getExamPlans, saveExamPlan, deleteExamPlan, ExamPlan,
  getYouthUnionCampaigns, saveYouthUnionCampaign, deleteYouthUnionCampaign, YouthUnionCampaign
} from '../../services/dbService';
import { useUserRole } from '../../utils/role';

export const AcademicsPanel: React.FC = () => {
  const currentRole = useUserRole();
  const [activeTab, setActiveTab] = useState<'curriculum' | 'exams' | 'extracurricular'>('curriculum');
  const [modalOpen, setModalOpen] = useState<'curriculum' | 'exams' | 'extracurricular' | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Category 2 - Stateful list of Syllabus Plans (Workflow Data)
  const [plans, setPlans] = useState<CurriculumPlan[]>([]);
  const [exams, setExams] = useState<ExamPlan[]>([]);
  const [extracurriculars, setExtracurriculars] = useState<YouthUnionCampaign[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal of Directive / Rejection comment
  const [workflowCommentModal, setWorkflowCommentModal] = useState<{
    isOpen: boolean;
    planId: string;
    actionType: 'approve' | 'reject';
    comment: string;
  } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [plansData, examData, extraData] = await Promise.all([
          getPlans(),
          getExamPlans(),
          getYouthUnionCampaigns()
        ]);
        setPlans(plansData);
        setExams(examData);
        setExtracurriculars(extraData);
      } catch (err) {
        console.error("Failed to load academics data from firestore", err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setActionMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openModal = (type: 'curriculum' | 'exams' | 'extracurricular') => {
    setModalOpen(type);
    setActionMenuOpen(false);
  };

  // Workflow triggers
  const submitForApproval = async (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    const updated = { ...plan, status: 'Chờ Duyệt' as const };
    try {
      await savePlan(updated);
      setPlans(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.error("Failed to submit plan", err);
    }
  };

  const revokeApproval = async (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    const updated = { ...plan, status: 'Bản Nháp' as const };
    try {
      await savePlan(updated);
      setPlans(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err) {
      console.error("Failed to revoke plan", err);
    }
  };

  const handleDeletePlan = async (id: string) => {
    const plan = plans.find(p => p.id === id);
    if (!plan) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn chương trình dạy ${plan.subject} (${plan.grade})? Hành động này không thể hoàn tác.`)) {
      try {
        await deletePlan(id);
        setPlans(prev => prev.filter(p => p.id !== id));
      } catch (err) {
        console.error("Failed to delete plan", err);
      }
    }
  };

  const openWorkflowDialog = (id: string, actionType: 'approve' | 'reject') => {
    setWorkflowCommentModal({
      isOpen: true,
      planId: id,
      actionType,
      comment: actionType === 'approve' ? 'Thông qua khung chương trình. Yêu cầu triển khai đúng phân bổ lý thuyết.' : ''
    });
  };

  const handleSaveWorkflowComment = async () => {
    if (!workflowCommentModal) return;
    const { planId, actionType, comment } = workflowCommentModal;

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const updated: CurriculumPlan = {
      ...plan,
      status: actionType === 'approve' ? 'Đã Phê Duyệt' : 'Từ Chối',
      lastComment: comment || undefined,
      approver: actionType === 'approve' ? 'Ban Giám Hiệu' : undefined
    };

    try {
      await savePlan(updated);
      setPlans(prev => prev.map(p => p.id === planId ? updated : p));
    } catch (err) {
      console.error("Failed to update plan workflow", err);
    }

    setWorkflowCommentModal(null);
  };

  const handleSavePlan = async (newPlan: CurriculumPlan) => {
    try {
      await savePlan(newPlan);
      setPlans(prev => [newPlan, ...prev]);
    } catch (err) {
      console.error("Failed to save plan", err);
    }
  };



  const handleSaveExamPlan = async (newExam: ExamPlan) => {
    try {
      await saveExamPlan(newExam);
      setExams(prev => [newExam, ...prev]);
    } catch (err) {
      console.error("Failed to save exam plan", err);
    }
  };

  const handleDeleteExamPlan = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa kế hoạch thi này?")) {
      try {
        await deleteExamPlan(id);
        setExams(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        console.error("Failed to delete exam plan", err);
      }
    }
  };

  const handleSaveExtracurricular = async (newExtra: YouthUnionCampaign) => {
    try {
      await saveYouthUnionCampaign(newExtra);
      setExtracurriculars(prev => [newExtra, ...prev]);
    } catch (err) {
      console.error("Failed to save extracurricular activity", err);
    }
  };

  const handleDeleteExtracurricular = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa hoạt động ngoại khóa này?")) {
      try {
        await deleteYouthUnionCampaign(id);
        setExtracurriculars(prev => prev.filter(e => e.id !== id));
      } catch (err) {
        console.error("Failed to delete extracurricular activity", err);
      }
    }
  };


  // Searching and filtering logic
  const filteredPlans = plans.filter(p => {
    if ((p as any).type === 'lesson_plan') return false;
    const query = searchQuery.toLowerCase();
    return p.grade.toLowerCase().includes(query) ||
           p.subject.toLowerCase().includes(query) ||
           p.status.toLowerCase().includes(query);
  });

  const filteredExams = exams.filter(e => {
    const query = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(query) ||
           e.time.toLowerCase().includes(query) ||
           e.scope.toLowerCase().includes(query) ||
           e.form.toLowerCase().includes(query);
  });

  const filteredExtracurriculars = extracurriculars.filter(e => {
    const query = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(query) ||
           e.time.toLowerCase().includes(query) ||
           e.scale.toLowerCase().includes(query) ||
           e.status.toLowerCase().includes(query);
  });

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const currentListLength = activeTab === 'curriculum' ? filteredPlans.length 
                            : activeTab === 'exams' ? filteredExams.length 
                            : filteredExtracurriculars.length;

  const totalPages = Math.ceil(currentListLength / pageSize);

  const paginatedPlans = filteredPlans.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedExams = filteredExams.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedExtracurriculars = filteredExtracurriculars.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-[#e8eef6]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto z-10 relative flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Chương trình Đào tạo</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Quản lý nội dung học, thi cử và ngoại khóa</p>
          </div>
          
          {((activeTab === 'curriculum' && ['school_board', 'department_head', 'subject_teacher'].includes(currentRole)) ||
            (activeTab === 'exams' && ['school_board', 'department_head'].includes(currentRole)) ||
            (activeTab === 'extracurricular' && ['school_board'].includes(currentRole))) && (
            <div className="flex items-center space-x-4 mt-6 sm:mt-0 relative" ref={actionMenuRef}>
              <button 
                onClick={() => setActionMenuOpen(!actionMenuOpen)}
                className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
                Thiết Lập Mới
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              {actionMenuOpen && (
                <div className="absolute top-12 right-0 w-64 bg-[#f5f8fc] border-2 border-[#b8c6d9] rounded-xl shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 space-y-1">
                    {activeTab === 'curriculum' && (
                      <>
                        <button onClick={() => openModal('curriculum')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1e2a3a] hover:bg-[#e8eef6] rounded-lg transition-colors flex items-center">
                          <Plus className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Nhập cấu hình PPCT
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1e2a3a] hover:bg-[#e8eef6] rounded-lg transition-colors flex items-center">
                          <Upload className="w-4 h-4 mr-2 text-[#4a5568]" /> Import PPCT từ Excel
                        </button>
                      </>
                    )}

                    {activeTab === 'exams' && (
                      <>
                        <button onClick={() => openModal('exams')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1e2a3a] hover:bg-[#e8eef6] rounded-lg transition-colors flex items-center">
                          <Plus className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Thêm kỳ thi mới
                        </button>
                      </>
                    )}
                    {activeTab === 'extracurricular' && (
                      <>
                        <button onClick={() => openModal('extracurricular')} className="w-full text-left px-4 py-2.5 text-xs font-bold text-[#1e2a3a] hover:bg-[#e8eef6] rounded-lg transition-colors flex items-center">
                          <Plus className="w-4 h-4 mr-2 text-[#2c5ea0]" /> Lên KH Hoạt động mới
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8 flex-1 min-h-0">
          <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">Phân Hệ Nghiệp Vụ</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('curriculum')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'curriculum' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <BookOpen className="w-5 h-5 mr-3" />
                Khung chương trình dạy học
              </button>
              <button 
                onClick={() => setActiveTab('exams')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'exams' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <PenTool className="w-5 h-5 mr-3" />
                Quản Lý Khảo Thí
              </button>
              <button 
                onClick={() => setActiveTab('extracurricular')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'extracurricular' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Flag className="w-5 h-5 mr-3" />
                Hoạt Động Ngoại Khóa
              </button>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#b8c6d9]">
              <div className="bg-[#e8eef6] p-4 rounded-2xl border border-[#b8c6d9]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Năm Học</span>
                  <span className="font-serif font-bold text-[#2c5ea0] text-xl">2025-2026</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Tiến Độ</span>
                  <span className="font-serif font-bold text-[#1e2a3a] text-lg">Tuần 12</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] rounded-3xl overflow-hidden min-h-0">
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                {activeTab === 'curriculum' && 'Phân Phối Chương Trình (Workflow & Phê duyệt)'}
                {activeTab === 'exams' && 'Kế Hoạch Thi Đua Khảo Thí'}
                {activeTab === 'extracurricular' && 'Danh Sách Hoạt Động'}
              </h3>
              <div className="flex items-center space-x-3">
                 <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tra cứu..."
                    className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-auto min-h-0 w-full">
              <table className="w-full min-w-[1000px] text-sm text-left">
                <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-sm">
                  {activeTab === 'curriculum' && (
                    <tr>
                      <th className="px-6 py-4">Khối / Ban</th>
                      <th className="px-6 py-4">Môn Học</th>
                      <th className="px-6 py-4 text-center">Số Tiết / Tuần</th>
                      <th className="px-6 py-4 text-center">Tổng Tiết Năm</th>
                      <th className="px-6 py-4">Ý kiến chỉ đạo / Chỉ thị</th>
                      <th className="px-6 py-4">Trạng Thái</th>
                      <th className="px-6 py-4 text-center">Tác Vụ</th>
                    </tr>
                  )}

                  {activeTab === 'exams' && (
                    <tr>
                      <th className="px-6 py-4">Kỳ Thi / Đợt Khảo Thí</th>
                      <th className="px-6 py-4">Thời Gian</th>
                      <th className="px-6 py-4">Phạm Vi</th>
                      <th className="px-6 py-4">Hình Thức</th>
                      <th className="px-6 py-4 text-center">Tiến Độ</th>
                      <th className="px-6 py-4 text-center">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'extracurricular' && (
                    <tr>
                      <th className="px-6 py-4">Tên Hoạt Động</th>
                      <th className="px-6 py-4">Ngày Tổ Chức</th>
                      <th className="px-6 py-4">Đơn Vị Phụ Trách</th>
                      <th className="px-6 py-4">Quy Mô</th>
                      <th className="px-6 py-4 text-center">Trạng Thái</th>
                      <th className="px-6 py-4 text-center">Tác Vụ</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                  {activeTab === 'curriculum' && paginatedPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#1e2a3a]">{plan.grade}</td>
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{plan.subject}</td>
                      <td className="px-6 py-5 text-center font-serif text-lg text-[#2c5ea0] font-bold">{plan.intensity}</td>
                      <td className="px-6 py-5 text-center font-serif text-lg text-[#4a5568] font-bold">{plan.total}</td>
                      <td className="px-6 py-5 max-w-xs text-xs">
                        {plan.lastComment ? (
                          <div className="bg-[#e8eef6] border border-[#b8c6d9] p-2 rounded-lg italic text-[#4a5568] font-bold">
                            " {plan.lastComment} "
                          </div>
                        ) : (
                          <span className="text-gray-400 font-serif italic">— chưa có chỉ đạo —</span>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest ${
                          plan.status === 'Đã Phê Duyệt' ? 'bg-[#2e6b8a]' :
                          plan.status === 'Chờ Duyệt' ? 'bg-blue-600 animate-pulse' :
                          plan.status === 'Từ Chối' ? 'bg-red-700' : 'bg-[#7b8a9e]'
                        }`}>
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <ActionMenu
                          primaryAction={{
                            label: 'Chi tiết',
                            icon: 'BookOpen',
                            onClick: () => {}
                          }}
                          actions={[
                            {
                              label: 'Trình Duyệt (Submit)',
                              icon: 'Check',
                              onClick: () => submitForApproval(plan.id),
                              roles: ['subject_teacher', 'department_head', 'school_board'],
                              danger: false,
                              // only show if Draft or Rejected
                              ...(plan.status !== 'Bản Nháp' && plan.status !== 'Từ Chối' ? { roles: [] } : {})
                            },
                            {
                              label: '⚡ Phê Duyệt (Approve)',
                              icon: 'Check',
                              onClick: () => openWorkflowDialog(plan.id, 'approve'),
                              roles: ['department_head', 'school_board'],
                              // only show if Pending
                              ...(plan.status !== 'Chờ Duyệt' ? { roles: [] } : {})
                            },
                            {
                              label: '❌ Từ Chối (Reject)',
                              icon: 'X',
                              onClick: () => openWorkflowDialog(plan.id, 'reject'),
                              roles: ['department_head', 'school_board'],
                              danger: true,
                              // only show if Pending
                              ...(plan.status !== 'Chờ Duyệt' ? { roles: [] } : {})
                            },
                            {
                              label: 'Thu hồi hồ sơ (Revoke)',
                              icon: 'RotateCcw',
                              onClick: () => revokeApproval(plan.id),
                              roles: ['subject_teacher', 'department_head', 'school_board'],
                              // only show if Pending
                              ...(plan.status !== 'Chờ Duyệt' ? { roles: [] } : {})
                            },
                            {
                              label: 'Xóa chương trình dạy',
                              icon: 'Trash2',
                              onClick: () => handleDeletePlan(plan.id),
                              roles: ['department_head', 'school_board'],
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}


                  {activeTab === 'exams' && paginatedExams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#1e2a3a]">{exam.name}</td>
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{exam.time}</td>
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{exam.scope}</td>
                      <td className="px-6 py-5">
                        <span className="text-xs font-bold text-[#7b8a9e]">{exam.form}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="w-full bg-[#d4dde9] rounded-full h-1.5 mt-2">
                           <div className="bg-[#2c5ea0] h-1.5 rounded-full" style={{ width: `${exam.progress}%` }}></div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <ActionMenu
                          primaryAction={{ label: 'Lịch thi', icon: 'PenTool', onClick: () => {} }}
                          actions={[
                            {
                              label: 'Xóa kỳ thi',
                              icon: 'Trash2',
                              onClick: () => handleDeleteExamPlan(exam.id),
                              roles: ['school_board', 'department_head'],
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                  {activeTab === 'extracurricular' && paginatedExtracurriculars.map((extra) => (
                    <tr key={extra.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#1e2a3a]">{extra.name}</td>
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{extra.time}</td>
                      <td className="px-6 py-5 text-[#4a5568] text-sm font-bold">Đoàn Thanh Niên</td>
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{extra.scale}</td>
                      <td className="px-6 py-5 text-center">
                         <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#a8c4e0] text-[#1e2a3a] uppercase tracking-widest">{extra.status}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <ActionMenu
                          primaryAction={{ label: 'Chi tiết', icon: 'Flag', onClick: () => {} }}
                          actions={[
                            {
                              label: 'Xóa hoạt động',
                              icon: 'Trash2',
                              onClick: () => handleDeleteExtracurricular(extra.id),
                              roles: ['school_board'],
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-8 py-5 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between mt-auto shrink-0 z-10">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={currentListLength}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Category 2 Dialouge: Phê duyệt / Từ chối with comment input */}
      {workflowCommentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4 relative">
            <h3 className="text-lg font-serif font-bold text-[#1e2a3a] border-b border-[#b8c6d9] pb-2">
              {workflowCommentModal.actionType === 'approve' ? '✔️ Phê Duyệt Chương Trình Đào Tạo' : '❌ Từ Chối Chương Trình Đào Tạo'}
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4a5568] uppercase tracking-wider block">
                {workflowCommentModal.actionType === 'approve' ? 'Ý kiến chỉ đạo / Chỉ thị (BGH)' : 'Lý do từ chối hồ sơ (Yêu cầu nhập)'}
              </label>
              <textarea
                value={workflowCommentModal.comment}
                onChange={e => setWorkflowCommentModal(prev => prev ? { ...prev, comment: e.target.value } : null)}
                placeholder={workflowCommentModal.actionType === 'approve' ? 'Ghi chú chỉ đạo cho giáo viên triển khai...' : 'Vui lòng ghi rõ phần thiếu sót hoặc lý do từ chối...'}
                rows={4}
                className="w-full p-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-semibold text-[#1e2a3a] focus:outline-none focus:ring-2 focus:ring-[#2c5ea0]/20 resize-none"
              />
            </div>
            
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setWorkflowCommentModal(null)}
                className="px-4 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] font-bold text-xs uppercase tracking-widest rounded-full transition-colors text-[#4a5568]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSaveWorkflowComment}
                disabled={workflowCommentModal.actionType === 'reject' && !workflowCommentModal.comment.trim()}
                className={`px-5 py-2 text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all shadow-sm ${
                  workflowCommentModal.actionType === 'approve'
                    ? 'bg-[#2e6b8a] hover:bg-[#4d7258] disabled:opacity-50'
                    : 'bg-red-700 hover:bg-red-800 disabled:opacity-50'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <SyllabusDistributionModal isOpen={modalOpen === 'curriculum'} onClose={() => setModalOpen(null)} onSave={handleSavePlan} />
      <ExamPlanModal isOpen={modalOpen === 'exams'} onClose={() => setModalOpen(null)} onSave={handleSaveExamPlan} />
      <ExtracurricularModal isOpen={modalOpen === 'extracurricular'} onClose={() => setModalOpen(null)} onSave={handleSaveExtracurricular} />
    </main>
  );
};
