import React, { useState, useEffect } from 'react';
import { 
  Search, Eye, Edit, Trash, Check, UserPlus, Filter, ShieldAlert,
  GraduationCap, ClipboardList, CheckCircle2, AlertTriangle, XCircle, Clock, FileText, Mail, Phone, MapPin, Info
} from 'lucide-react';
import { ModalBase } from '../ui/Modals';
import { Pagination } from '../ui/Pagination';
import { ActionMenu } from '../ui/ActionMenu';
import { getAdmissions, saveAdmission, deleteAdmission, AdmissionRecord } from '../../services/dbService';

export const AdmissionsPanel: React.FC = () => {
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AdmissionRecord | null>(null);
  const [editStatus, setEditStatus] = useState<AdmissionRecord['status']>('Chờ Duyệt');
  const [adminNotes, setAdminNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdmissions();
      setAdmissions(data);
    } catch (error) {
      console.error("Failed to load admissions", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenDetail = (record: AdmissionRecord) => {
    setSelectedRecord(record);
    setEditStatus(record.status);
    setAdminNotes(record.notes || '');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    try {
      const updated = {
        ...selectedRecord,
        status: editStatus,
        notes: adminNotes
      };
      await saveAdmission(updated);
      setAdmissions(prev => prev.map(r => r.id === selectedRecord.id ? updated : r));
      showToast(`💾 Đã cập nhật trạng thái hồ sơ của: ${selectedRecord.fullName}`);
      setIsModalOpen(false);
    } catch (error) {
      showToast("❌ Lỗi cập nhật hồ sơ");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ tuyển sinh của ${name}?`)) {
      try {
        await deleteAdmission(id);
        setAdmissions(prev => prev.filter(r => r.id !== id));
        showToast(`🗑️ Đã xóa hồ sơ của ${name}`);
      } catch (error) {
        showToast("❌ Không thể xóa hồ sơ");
      }
    }
  };

  // Filter & Search
  const filtered = admissions.filter(r => {
    const matchesSearch = r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.phone.includes(searchQuery) ||
                          r.secondarySchool.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' ? true : r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const totalPages = Math.ceil(filtered.length / pageSize);

  // Stats
  const totalCount = admissions.length;
  const pendingCount = admissions.filter(r => r.status === 'Chờ Duyệt').length;
  const acceptedCount = admissions.filter(r => r.status === 'Đã Tiếp Nhận').length;
  const additionalCount = admissions.filter(r => r.status === 'Cần Bổ Sung').length;

  const getStatusBadge = (status: AdmissionRecord['status']) => {
    switch (status) {
      case 'Đã Tiếp Nhận':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Đã tiếp nhận
          </span>
        );
      case 'Cần Bổ Sung':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 mr-1" /> Cần bổ sung
          </span>
        );
      case 'Từ Chối':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" /> Từ chối
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3 mr-1" /> Chờ duyệt
          </span>
        );
    }
  };


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
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Tuyển sinh Online</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold font-sans">Xem và quản lý hồ sơ đăng ký nhập học lớp 1 trực tuyến</p>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8 shrink-0">
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Tổng số hồ sơ</p>
            <p className="text-3xl font-serif font-bold text-[#1e2a3a] mt-1">{totalCount}</p>
          </div>
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Chờ phê duyệt</p>
            <p className="text-3xl font-serif font-bold text-blue-700 mt-1">{pendingCount}</p>
          </div>
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Đã tiếp nhận</p>
            <p className="text-3xl font-serif font-bold text-green-700 mt-1">{acceptedCount}</p>
          </div>
          <div className="bg-white border border-[#b8c6d9] p-4 rounded-2xl shadow-[2px_2px_0_rgba(0,0,0,0.02)]">
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Cần bổ sung</p>
            <p className="text-3xl font-serif font-bold text-amber-700 mt-1">{additionalCount}</p>
          </div>
        </div>

        {/* Main Table Panel */}
        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col rounded-3xl overflow-hidden relative min-h-0 h-[600px]">
          
          {/* Table Toolbar */}
          <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
             <h3 className="font-bold text-[#2c5ea0] uppercase tracking-widest text-xs flex items-center">
               <UserPlus className="w-4 h-4 mr-2" /> DANH SÁCH ĐĂNG KÝ TUYỂN SINH
             </h3>
             <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                  <input 
                    type="text" 
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên, sđt, trường cũ..."
                    className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[240px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] rounded-full"
                >
                  <option value="All">Tất cả trạng thái</option>
                  <option value="Chờ Duyệt">Chờ duyệt</option>
                  <option value="Đã Tiếp Nhận">Đã tiếp nhận</option>
                  <option value="Cần Bổ Sung">Cần bổ sung</option>
                  <option value="Từ Chối">Từ chối</option>
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
                    <th className="px-6 py-4">Mã hồ sơ</th>
                    <th className="px-6 py-4">Họ và tên</th>
                    <th className="px-6 py-4">Thông tin liên lạc</th>
                    <th className="px-6 py-4">Trường Mầm non</th>
                    <th className="px-6 py-4 text-center">Hồ sơ đính kèm</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                  {paginated.map(r => (
                    <tr key={r.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs text-[#7b8a9e]">{r.id}</td>
                      <td className="px-6 py-5">
                        <div>
                          <p className="font-bold text-[#1e2a3a]">{r.fullName}</p>
                          <p className="text-[10px] text-[#7b8a9e] mt-0.5 font-bold uppercase tracking-wide">
                            {r.gender} · {r.dob}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-[#4a5568] flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#7b8a9e]" /> {r.phone}
                        </p>
                        <p className="text-xs text-[#7b8a9e] flex items-center gap-1.5 mt-0.5">
                          <Mail className="w-3.5 h-3.5" /> {r.email}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="font-bold text-[#4a5568]">{r.secondarySchool || 'Chưa cập nhật'}</p>
                        {r.isFromAnHuu && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded bg-green-50 text-[10px] text-green-700 font-bold border border-green-200 uppercase tracking-wider">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Hồ sơ liên kết
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center">
                        {r.isFromAnHuu ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">
                            Miễn nộp
                          </span>
                        ) : (
                          <>
                            <span className="font-serif text-base font-bold text-[#2c5ea0]">
                              {([r.gpa6 || 0, r.gpa7 || 0, r.gpa8 || 0, r.gpa9 || 0].filter(v => v === 1).length)}/4
                            </span>
                            <span className="text-[10px] text-[#7b8a9e] block font-medium">giấy tờ</span>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        {getStatusBadge(r.status)}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionMenu
                          primaryAction={{
                            label: 'Chi tiết hồ sơ',
                            icon: 'Eye',
                            onClick: () => handleOpenDetail(r)
                          }}
                          actions={[
                            {
                              label: 'Phê duyệt trạng thái',
                              icon: 'Edit',
                              onClick: () => handleOpenDetail(r)
                            },
                            {
                              label: 'Xóa hồ sơ đăng ký',
                              icon: 'Trash',
                              onClick: () => handleDelete(r.id, r.fullName),
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center p-8 text-[#7b8a9e]">
                <ClipboardList className="w-12 h-12 text-[#b8c6d9] mb-3" />
                <p className="text-sm font-bold uppercase tracking-wider">Không tìm thấy hồ sơ nào</p>
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

      {/* DETAIL & REVIEW MODAL */}
      <ModalBase
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chi Tiết Hồ Sơ Tuyển Sinh Lớp 1"
        subtitle="Thông tin khai lý lịch & hồ sơ nhập học trực tuyến"
        width="max-w-2xl"
      >
        {selectedRecord && (
          <form onSubmit={handleUpdateStatus} className="flex flex-col flex-1 min-h-0 overflow-hidden bg-[#f5f8fc]">
            <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6">
              
              {/* Profile Card Summary */}
              <div className="bg-[#e8eef6] border border-[#b8c6d9] p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#2c5ea0] text-[#f5f8fc] font-serif font-bold text-lg rounded-full flex items-center justify-center shadow-sm">
                    {selectedRecord.fullName.split(' ').slice(-1)[0][0]}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Mã đăng ký: {selectedRecord.id}</span>
                    <h4 className="text-xl font-serif font-bold text-[#1e2a3a] mt-0.5">{selectedRecord.fullName}</h4>
                  </div>
                </div>
                {getStatusBadge(selectedRecord.status)}
              </div>

              {/* Grid 1: Personal Background */}
              <div>
                <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                  I. Sơ yếu lý lịch học sinh
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-[#7b8a9e] font-medium">Họ tên học sinh:</p>
                    <p className="font-bold text-[#1e2a3a] mt-0.5">{selectedRecord.fullName}</p>
                  </div>
                  <div>
                    <p className="text-[#7b8a9e] font-medium">Giới tính / Ngày sinh:</p>
                    <p className="font-bold text-[#1e2a3a] mt-0.5">{selectedRecord.gender} · {selectedRecord.dob}</p>
                  </div>
                  <div>
                    <p className="text-[#7b8a9e] font-medium">Quê quán:</p>
                    <p className="font-bold text-[#1e2a3a] mt-0.5">{selectedRecord.hometown}</p>
                  </div>
                  <div>
                    <p className="text-[#7b8a9e] font-medium">Địa chỉ thường trú:</p>
                    <p className="font-bold text-[#1e2a3a] mt-0.5">{selectedRecord.address}</p>
                  </div>
                  <div>
                    <p className="text-[#7b8a9e] font-medium">Họ tên phụ huynh:</p>
                    <p className="font-bold text-[#1e2a3a] mt-0.5">{selectedRecord.parentName}</p>
                  </div>
                  <div>
                    <p className="text-[#7b8a9e] font-medium">Số điện thoại liên hệ:</p>
                    <p className="font-bold text-[#1e2a3a] mt-0.5">{selectedRecord.parentPhone} (Di động)</p>
                  </div>
                </div>
              </div>

              {/* Grid 2: Kindergarten & Admission Checklist */}
              <div>
                <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-4 flex items-center">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                  II. Trường mầm non &amp; Hồ sơ tuyển sinh
                </h5>
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-inner space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-3 border-b border-[#dce4ee]">
                    <div>
                      <p className="text-[#7b8a9e] font-medium">Trường mầm non đã tốt nghiệp:</p>
                      <p className="font-bold text-[#1e2a3a] mt-0.5">
                        {selectedRecord.secondarySchool || 'Chưa rõ'}
                        {selectedRecord.isFromAnHuu && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-[9px] text-green-700 font-bold border border-green-200">
                            Liên kết
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#7b8a9e] font-medium">Đối tượng tuyển sinh:</p>
                      <p className="font-bold text-[#2c5ea0] mt-0.5">
                        Trẻ 6 tuổi vào Lớp 1
                        {selectedRecord.isFromAnHuu && selectedRecord.thcsStudentCode && (
                          <span className="text-neutral-500 font-mono font-normal block mt-0.5">
                            Mã liên kết: {selectedRecord.thcsStudentCode}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider mb-3">Danh sách hồ sơ, giấy tờ đính kèm:</p>
                    {selectedRecord.isFromAnHuu ? (
                      <div className="bg-green-50/50 border border-green-200 p-4 rounded-xl flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                        <div>
                          <h6 className="font-bold text-xs text-green-800 uppercase tracking-wide">Hồ sơ đã được liên kết tự động trực tuyến</h6>
                          <p className="text-[11px] text-green-700 leading-relaxed mt-1">
                            Bé đã hoàn thành chương trình tại Mầm non An Hữu. Toàn bộ hồ sơ cần thiết (Bản sao khai sinh, Đơn nhập học, Xác nhận cư trú, Chứng nhận mầm non) đã được đồng bộ trực tuyến và xác thực gốc từ dữ liệu liên kết. <strong>Học sinh được miễn nộp bản cứng khi nhập học trực tiếp.</strong>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Bản sao Giấy khai sinh (hợp lệ)', val: selectedRecord.gpa6 },
                          { label: 'Đơn xin nhập học (theo mẫu trường mầm non)', val: selectedRecord.gpa7 },
                          { label: 'Giấy xác nhận cư trú / CCCD phụ huynh', val: selectedRecord.gpa8 },
                          { label: 'Giấy chứng nhận hoàn thành mầm non', val: selectedRecord.gpa9 }
                        ].map((doc, idx) => {
                          const isSubmitted = doc.val === 1;
                          return (
                            <div 
                              key={idx} 
                              className={`flex items-center gap-2.5 p-3 border rounded-xl transition-all ${
                                isSubmitted 
                                  ? 'bg-green-50/50 border-green-200 text-[#1e2a3a]' 
                                  : 'bg-neutral-50/50 border-[#b8c6d9] text-neutral-500'
                              }`}
                            >
                              {isSubmitted ? (
                                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-neutral-400 shrink-0" />
                              )}
                              <span className="text-xs font-bold">{doc.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-start gap-2 p-3.5 bg-[#e8eef6]/50 border border-[#b8c6d9] rounded-xl text-xs text-[#4a5568] leading-relaxed">
                    <Info className="w-4 h-4 text-[#2c5ea0] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[#2c5ea0]">Lưu ý hồ sơ:</strong> Bậc mầm non không bắt buộc nộp Học bạ điện tử đối với bé đăng ký nhập học mầm non. Hướng dẫn liên kết sẽ được tự động thực hiện khi phụ huynh nộp tờ khai.
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update section */}
              <div className="bg-[#f5f8fc] border border-[#b8c6d9] p-5 rounded-2xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="col-span-1">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="record-status-select">Cập nhật trạng thái</label>
                  <select
                    id="record-status-select"
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:outline-none"
                  >
                    <option value="Chờ Duyệt">Chờ duyệt</option>
                    <option value="Đã Tiếp Nhận">Đã tiếp nhận</option>
                    <option value="Cần Bổ Sung">Cần bổ sung</option>
                    <option value="Từ Chối">Từ chi</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2" htmlFor="record-notes-input">Ghi chú tuyển sinh / phản hồi</label>
                  <input
                    id="record-notes-input"
                    type="text"
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    placeholder="Nhập ghi chú phản hồi cho phụ huynh..."
                    className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                  />
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-dashed border-[#b8c6d9] flex justify-between items-center bg-[#f5f8fc] shrink-0">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="flex items-center px-6 py-2.5 bg-[#2e6b8a] text-[#f5f8fc] border border-[#1e4f6a] text-xs uppercase tracking-widest font-bold hover:bg-[#1e4f6a] transition shadow-[2px_2px_0px_#131a25] active:shadow-none active:translate-y-1 rounded-full"
              >
                Lưu trạng thái
              </button>
            </div>
          </form>
        )}
      </ModalBase>
    </main>
  );
};
