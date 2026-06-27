import React, { useState, useEffect } from 'react';
import { 
  Filter, Plus, Search, Bookmark, Users, Megaphone, FileText, Download, 
  Edit, Save, ArrowLeft, History, UserCheck, Sparkles, BookOpen, 
  Heart, Award, Printer, Clock, Check, ChevronDown, Share2, Clipboard, 
  Trash2, Send
} from 'lucide-react';
import { PartyMemberModal, TradeUnionModal, ParentsUnionModal } from '../ui/PartyUnionModals';
import { ActionMenu } from '../ui/ActionMenu';
import { BaseSelect, FilterSelect } from '../ui/BaseInputs';
import { getPartyUnionDocs, savePartyUnionDoc, deletePartyUnionDoc, ComplexDocument } from '../../services/dbService';
import { Pagination } from '../ui/Pagination';

export const PartyUnionPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'party' | 'tradeUnion' | 'parents'>('party');
  const [modalOpen, setModalOpen] = useState<'party' | 'tradeUnion' | 'parents' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [docStatusFilter, setDocStatusFilter] = useState('All');
  
  // Category 4 - Complex, long-form document database
  const [documents, setDocuments] = useState<ComplexDocument[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected document for full-screen reading/editing workspace
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form states for the active document in editor
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editStatus, setEditStatus] = useState<'Bản Nháp' | 'Đại diện Ký' | 'Đã Ban Hành'>('Bản Nháp');
  const [editSigner, setEditSigner] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await getPartyUnionDocs();
        setDocuments(data);
      } catch (err) {
        console.error("Failed to load party/union documents from firestore", err);
      }
    };
    loadData();
  }, []);

  // Help display alert toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const getButtonText = () => {
    switch (activeTab) {
      case 'party': return 'Nghị quyết Chi bộ';
      case 'tradeUnion': return 'Kế hoạch Công đoàn';
      case 'parents': return 'Biên bản Đại diện CMHS';
      default: return 'Tạo Văn Bản';
    }
  };

  // Create a new blank complex document and open the dedicated editor page
  const handleCreateDocument = async () => {
    const newDocId = `DOC-${Date.now().toString().slice(-4)}`;
    const newDoc: ComplexDocument = {
      id: newDocId,
      title: `Văn bản tạo mới: ${getButtonText()} chưa đặt tên`,
      category: activeTab,
      date: new Date().toLocaleDateString('vi-VN'),
      author: "Cán bộ Phụ trách",
      content: `TRƯỜNG th VÂN KHÁNH\n***\n\nCHỦ ĐỀ VĂN BẢN\n(Soạn thảo văn bản hành chính tại đây)\n\nCăn cứ nhiệm vụ công tác được giao...\n\n- Dự thảo biên bản nội bộ.\n- Đề nghị kiểm tra thông tin.\n\nĐỒNG CHÍ ĐẠI DIỆN\n(Ký và ghi rõ họ tên)`,
      status: "Bản Nháp",
      signer: "Đang cập nhật",
      attachments: [],
      views: 1,
      revisions: [
        { date: new Date().toLocaleString('vi-VN'), author: "Hệ thống", action: "Tạo mới bản ghi văn bản phức tạp." }
      ]
    };

    try {
      await savePartyUnionDoc(newDoc);
      setDocuments(prev => [newDoc, ...prev]);
      openDocWorkspace(newDoc, true);
    } catch (err) {
      showToast("❌ Không thể tạo văn bản.");
    }
  };

  // Open the dedicated full-screen page for reading or writing
  const openDocWorkspace = (doc: ComplexDocument, editMode = false) => {
    setSelectedDocId(doc.id);
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setEditStatus(doc.status);
    setEditSigner(doc.signer);
    setIsEditing(editMode);
  };

  const activeDoc = documents.find(doc => doc.id === selectedDocId);

  // Save changes from editor to the state
  const handleSaveDocument = async () => {
    if (!selectedDocId || !activeDoc) return;
    
    const changesDetected = activeDoc.content !== editContent || activeDoc.title !== editTitle || activeDoc.status !== editStatus;
    const newRevisions = [...activeDoc.revisions];
    
    if (changesDetected) {
      newRevisions.unshift({
        date: new Date().toLocaleString('vi-VN'),
        author: "Người dùng hiện tại",
        action: `Cập nhật văn bản${activeDoc.status !== editStatus ? ` (Trạng thái: ${editStatus})` : ''}`
      });
    }

    const updatedDoc: ComplexDocument = {
      ...activeDoc,
      title: editTitle,
      content: editContent,
      status: editStatus,
      signer: editSigner || activeDoc.signer,
      revisions: newRevisions
    };

    try {
      await savePartyUnionDoc(updatedDoc);
      setDocuments(prev => prev.map(doc => doc.id === selectedDocId ? updatedDoc : doc));
      setIsEditing(false);
      showToast("💾 Lưu trữ văn bản và tạo điểm khôi phục lịch sử thành công!");
    } catch (err) {
      showToast("❌ Không thể lưu văn bản.");
    }
  };

  // Delete a complex document from list
  const handleDeleteDocument = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa văn bản này khỏi tủ tài liệu?")) {
      try {
        await deletePartyUnionDoc(id);
        setDocuments(prev => prev.filter(doc => doc.id !== id));
        if (selectedDocId === id) {
          setSelectedDocId(null);
        }
        showToast("🗑️ Đã xóa bản ghi văn bản khỏi hệ thống lưu trữ.");
      } catch (err) {
        showToast("❌ Không thể xóa văn bản.");
      }
    }
  };

  // Simulated downloads which will push a real download notification
  const handleDownloadFile = (fileName: string) => {
    // Generate a file containing some mock school text
    const textContent = `HỆ THỐNG KIỂM ĐỊNH CLGD - TRƯỜNG th VÂN KHÁNH\nTên tệp số hóa: ${fileName}\n\nChúc mừng! Bản mô phỏng tài liệu văn bản này đã được máy chủ của trường biên dịch thành công dựa trên dữ liệu thật.`;
    const element = document.createElement("a");
    const file = new Blob([textContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    showToast(`📥 Tải xuống thành công tài liệu: ${fileName}`);
  };

  const getWordCount = (text: string) => {
    return text ? text.trim().split(/\s+/).length : 0;
  };

  const filteredDocs = documents.filter(doc => {
    const matchesCategory = doc.category === activeTab;
    const matchesQuery = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         doc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = docStatusFilter === 'All' || doc.status === docStatusFilter;
    return matchesCategory && matchesQuery && matchesStatus;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, docStatusFilter]);

  const totalPages = Math.ceil(filteredDocs.length / pageSize);
  const paginatedDocs = filteredDocs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-[#e8eef6]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-white px-6 py-3 rounded-xl border border-[#b8c6d9] shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 flex items-center font-bold text-xs uppercase tracking-wider">
          <Check className="w-4 h-4 mr-2 text-green-400" />
          {toastMessage}
        </div>
      )}
      
      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-h-0">
        
        {/* VIEW 1: Main List View with tabs */}
        {!selectedDocId && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
              <div>
                <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Văn bản & Đảng thể</h2>
                <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Lưu trữ sổ sách đảng bộ, công đoàn và phụ huynh học sinh</p>
              </div>
              
              <div className="flex items-center space-x-4 mt-6 sm:mt-0">
                <button 
                  onClick={handleCreateDocument}
                  className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Soạn thảo {getButtonText()}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
              {/* Category selector sidebar */}
              <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit">
                <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">Tổ Chức Chính Trị</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => { setActiveTab('party'); setSelectedDocId(null); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'party' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
                  >
                    <Bookmark className="w-5 h-5 mr-3" />
                    Chi Bộ Đảng
                  </button>
                  <button 
                    onClick={() => { setActiveTab('tradeUnion'); setSelectedDocId(null); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'tradeUnion' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
                  >
                    <Users className="w-5 h-5 mr-3" />
                    Công Đoàn Trường
                  </button>
                  <button 
                    onClick={() => { setActiveTab('parents'); setSelectedDocId(null); }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'parents' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
                  >
                    <Megaphone className="w-5 h-5 mr-3" />
                    Đại Diện CMHS
                  </button>
                </div>

                <div className="mt-8 pt-4 border-t border-[#b8c6d9]">
                  <h4 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-[10px] mb-3">Sổ Sách Thành Viên</h4>
                  <div className="space-y-2">
                    <button 
                      onClick={() => setModalOpen('party')} 
                      className="w-full text-left px-4 py-2 bg-white text-xs text-[#4a5568] font-bold border border-[#b8c6d9] rounded-full hover:bg-[#e8eef6] transition"
                    >
                      Danh sách Đảng viên
                    </button>
                    <button 
                      onClick={() => setModalOpen('tradeUnion')} 
                      className="w-full text-left px-4 py-2 bg-white text-xs text-[#4a5568] font-bold border border-[#b8c6d9] rounded-full hover:bg-[#e8eef6] transition"
                    >
                      Đoàn viên công đoàn
                    </button>
                    <button 
                      onClick={() => setModalOpen('parents')} 
                      className="w-full text-left px-4 py-2 bg-white text-xs text-[#4a5568] font-bold border border-[#b8c6d9] rounded-full hover:bg-[#e8eef6] transition"
                    >
                      Chi hội trưởng PHHS
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] rounded-3xl overflow-hidden relative min-h-0">
                <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
                  <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                    {activeTab === 'party' && 'Hồ Sơ Nghị quyết Chi bộ & Sinh Hoạt'}
                    {activeTab === 'tradeUnion' && 'Kế hoạch công tác & Phúc lợi đoàn viên'}
                    {activeTab === 'parents' && 'Nghị quyết, Thu chi Ban đại diện'}
                  </h3>
                  <div className="flex items-center space-x-3">
                     <div className="relative">
                       <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                       <input 
                         type="text" 
                         value={searchQuery}
                         onChange={e => setSearchQuery(e.target.value)}
                         placeholder="Tìm kiếm văn bản..."
                         className="pl-11 pr-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] text-sm font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[200px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                       />
                     </div>
                     <FilterSelect
                       label="Trạng thái"
                       value={docStatusFilter}
                       onChange={setDocStatusFilter}
                       options={[
                         { value: 'All', label: 'TẤT CẢ TRẠNG THÁI' },
                         { value: 'Bản Nháp', label: 'Bản Nháp' },
                         { value: 'Đại diện Ký', label: 'Đại diện Ký' },
                         { value: 'Đã Ban Hành', label: 'Đã Ban Hành' }
                       ]}
                       icon={Filter}
                     />
                  </div>
                </div>

                <div className="flex-1 overflow-auto w-full min-h-0">
                  <table className="w-full min-w-[900px] text-sm text-left">
                    <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-[0_1px_0_#b8c6d9]">
                      <tr>
                        <th className="px-6 py-4 w-28">Ký Hiệu</th>
                        <th className="px-6 py-4">Tên Văn Bản / Tài Liệu</th>
                        <th className="px-6 py-4 w-40">Đại diện Ký</th>
                        <th className="px-6 py-4 w-32">Ngày Ban Hành</th>
                        <th className="px-6 py-4 w-32">Trạng Thái</th>
                        <th className="px-6 py-4 w-24 text-center">Tác Vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#b8c6d9]">
                      {filteredDocs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-[#7b8a9e] font-medium font-serif italic bg-white/40">
                            Không tìm thấy tài liệu văn bản nào phù hợp.
                          </td>
                        </tr>
                      ) : (
                        paginatedDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-[#e8eef6] transition-colors group">
                            <td className="px-6 py-5">
                              <span className="font-mono text-xs text-[#7b8a9e] bg-[#e8eef6] border border-[#b8c6d9] px-2.5 py-1 rounded-md block text-center font-bold">
                                {doc.id}
                              </span>
                            </td>
                            <td className="px-6 py-5 max-w-sm">
                              <p 
                                onClick={() => openDocWorkspace(doc, false)}
                                className="font-bold text-[#1e2a3a] hover:text-[#2c5ea0] hover:underline cursor-pointer line-clamp-1"
                              >
                                {doc.title}
                              </p>
                              <div className="flex items-center text-xs text-[#7b8a9e] mt-1.5 space-x-3">
                                <span className="font-serif italic">Soạn: {doc.author}</span>
                                <span>•</span>
                                <span className="flex items-center"><FileText className="w-3.5 h-3.5 mr-1" /> {getWordCount(doc.content)} chữ</span>
                                <span>•</span>
                                <span>{doc.attachments.length} đính kèm</span>
                              </div>
                            </td>
                            <td className="px-6 py-5 text-xs font-bold text-[#4a5568]">{doc.signer}</td>
                            <td className="px-6 py-5 font-bold font-serif text-xs text-[#4a5568]">{doc.date}</td>
                            <td className="px-6 py-5">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest ${
                                doc.status === 'Đã Ban Hành' ? 'bg-[#2e6b8a]' :
                                doc.status === 'Đại diện Ký' ? 'bg-[#a8c4e0] border border-[#8e9eb4] text-black' : 'bg-[#7b8a9e]'
                              }`}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <ActionMenu 
                                primaryAction={{
                                  label: 'Đọc văn bản',
                                  icon: 'BookOpen',
                                  onClick: () => openDocWorkspace(doc, false)
                                }}
                                actions={[
                                  {
                                    label: 'Biên tập & Soạn thảo',
                                    icon: 'Edit',
                                    onClick: () => openDocWorkspace(doc, true)
                                  },
                                  ...doc.attachments.map(att => ({
                                    label: `Tải đính kèm: ${att.name}`,
                                    icon: 'Download' as const,
                                    onClick: () => handleDownloadFile(att.name)
                                  })),
                                  {
                                    label: 'Nhật ký revision',
                                    icon: 'History',
                                    onClick: () => openDocWorkspace(doc, false)
                                  },
                                  {
                                    label: 'Xóa tài liệu khỏi tủ',
                                    icon: 'Trash2',
                                    onClick: () => handleDeleteDocument(doc.id),
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

                <div className="px-8 py-5 border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex items-center justify-between shrink-0 z-10">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={filteredDocs.length}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DEDICATED FULL-PAGE READING/EDITING WORKSPACE (Navigate to full screen layout) */}
        {selectedDocId && activeDoc && (
          <div className="flex-1 flex flex-col bg-[#f5f8fc] border-[3px] border-[#b8c6d9] rounded-3xl overflow-hidden shadow-[4px_4px_0px_#dce4ee] h-[700px] animate-fade-in z-20">
            
            {/* Workspace Header */}
            <div className="px-6 py-4 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => { setSelectedDocId(null); setIsEditing(false); }}
                  className="p-2 bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-[#1e2a3a] rounded-full transition-all flex items-center justify-center shadow-sm"
                  title="Quay lại danh sách"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[10px] font-bold bg-[#a8c4e0] border border-[#8e9eb4] px-2 py-0.5 rounded text-[#1e2a3a]">
                      {activeDoc.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                      isEditing ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-green-100 text-[#2e6b8a] border border-green-200'
                    }`}>
                      {isEditing ? 'Đang Soạn Thảo' : 'Chế Độ Đọc'}
                    </span>
                  </div>
                  <h3 className="text-sm font-serif font-bold text-[#c0bfb6] mt-1 line-clamp-1 block md:hidden">
                    {isEditing ? editTitle : activeDoc.title}
                  </h3>
                  <h3 className="text-base font-serif font-bold text-[#1e2a3a] mt-1 line-clamp-1 hidden md:block">
                    {isEditing ? editTitle : activeDoc.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {!isEditing ? (
                  <>
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-[#1e2a3a] text-white border border-[#131a25] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#283548] flex items-center shadow-sm"
                    >
                      <Edit className="w-3.5 h-3.5 mr-1.5" /> Biên tập văn bản
                    </button>
                    <button 
                      onClick={() => handleDownloadFile(`${activeDoc.id}_van_ban_goc.docx`)}
                      className="px-4 py-2 bg-white border border-[#b8c6d9] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 flex items-center"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Tải Word (.docx)
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-white border border-[#b8c6d9] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-gray-50 flex items-center"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" /> In ấn PDF
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleSaveDocument}
                      className="px-5 py-2 bg-[#2e6b8a] text-white border border-[#1e4f6a] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#1e4f6a] flex items-center shadow-md shadow-[#2e6b8a]/20"
                    >
                      <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu bản ghi
                    </button>
                    <button 
                      onClick={() => {
                        setIsEditing(false);
                        setEditTitle(activeDoc.title);
                        setEditContent(activeDoc.content);
                        setEditStatus(activeDoc.status);
                        setEditSigner(activeDoc.signer);
                      }}
                      className="px-4 py-2 bg-white border border-red-200 text-red-700 text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-50 flex items-center"
                    >
                      Hủy biên dịch
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Split screen content layout */}
            <div className="flex-1 flex flex-col md:flex-row min-h-0 divide-x divide-[#b8c6d9]">
              
              {/* LEFT SIDE PANEL: Document Metadata Dashboard */}
              <div className="w-full md:w-80 bg-[#edf2f9] p-5 overflow-y-auto space-y-6 flex-shrink-0">
                
                {/* Status and Signer card */}
                <div className="bg-white border border-[#b8c6d9] rounded-2xl p-4 shadow-sm space-y-4">
                  <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#e8eef6] pb-2">
                    Kiểm soát Hành chính
                  </h4>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <BaseSelect
                          label="Quy định trạng thái"
                          value={editStatus}
                          options={[
                            {value: 'Bản Nháp', label: 'Bản Nháp'},
                            {value: 'Đại diện Ký', label: 'Chờ duyệt ký'},
                            {value: 'Đã Ban Hành', label: 'Đã Ban Hành'}
                          ]}
                          onChange={(val) => setEditStatus(val as any)}
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Chức danh / Trưởng phòng ký</label>
                        <input 
                          type="text"
                          value={editSigner}
                          onChange={e => setEditSigner(e.target.value)}
                          placeholder="VD: Huyện ủy duyệt"
                          className="w-full px-3 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] rounded-lg text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between items-center bg-[#f5f8fc] p-2 rounded-lg border border-[#dce4ee]">
                        <span className="text-[#7b8a9e] font-bold uppercase tracking-widest text-[9px]">Hiện trạng</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest bg-[#1e2a3a] text-[#f5f8fc]`}>
                          {activeDoc.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7b8a9e]">Đại diện ký số:</span>
                        <span className="font-bold text-[#1e2a3a]">{activeDoc.signer}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7b8a9e]">Lượt tham chiếu:</span>
                        <span className="font-bold font-serif">{activeDoc.views} lượt</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#7b8a9e]">Khởi tạo bởi:</span>
                        <span className="font-medium">{activeDoc.author}</span>
                      </div>
                    </div>
                  )}

                  {!isEditing && activeDoc.status !== 'Bản Nháp' && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-start">
                      <UserCheck className="w-4 h-4 text-green-600 mr-2 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-green-800 uppercase tracking-widest">KÝ SỐ THÀNH CÔNG</p>
                        <p className="text-[10px] text-green-700 mt-1">Được xác minh điện tử bởi Ban Công Tác Đảng Vân Khánh.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Attachments Section */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9] pb-2">
                    Tài Liệu Số Hóa Định Kèm
                  </h4>
                  {activeDoc.attachments.length === 0 ? (
                    <p className="text-[10px] italic text-[#7b8a9e] font-serif">Chưa tải lên minh chứng / quyết định số hóa đính kèm.</p>
                  ) : (
                    <div className="space-y-2">
                      {activeDoc.attachments.map((att, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleDownloadFile(att.name)}
                          className="flex items-center justify-between p-2.5 bg-white border border-[#b8c6d9] rounded-xl hover:border-[#2c5ea0] cursor-pointer transition shadow-sm group"
                        >
                          <div className="flex items-center min-w-0 max-w-[80%]">
                            <FileText className="w-4 h-4 text-[#2c5ea0] mr-2 shrink-0" />
                            <span className="text-xs text-[#1e2a3a] font-bold truncate group-hover:underline">
                              {att.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono font-bold text-[#7b8a9e] bg-[#e8eef6] px-1.5 py-0.5 rounded">
                            {att.size}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {isEditing && (
                    <div className="border border-dashed border-[#7b8a9e]/50 bg-white/40 p-3 rounded-xl text-center cursor-pointer hover:bg-[#e8eef6]/50 transition">
                      <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Tải Lên Thêm Văn Bản Scan (.pdf / .docx)</p>
                      <p className="text-[9px] text-[#8e9eb4] mt-1">Hỗ trợ tối đa 10MB tệp.</p>
                    </div>
                  )}
                </div>

                {/* Revision logs */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9] pb-2">
                    Nhật Ký Phiên Bản (Audit Log)
                  </h4>
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#b8c6d9]">
                    {activeDoc.revisions.map((rev, idx) => (
                      <div key={idx} className="flex gap-2 text-xs relative pl-6">
                        <div className="absolute left-2.5 top-1 w-2.5 h-2.5 bg-[#2c5ea0] rounded-full border border-white -translate-x-1/2"></div>
                        <div className="flex-1">
                          <p className="font-bold text-[#1e2a3a] text-[11px] leading-tight">{rev.action}</p>
                          <div className="flex justify-between text-[10px] text-[#7b8a9e] mt-1">
                            <span>Sửa: {rev.author}</span>
                            <span className="font-serif">{rev.date}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* RIGHT SIDE PANEL: Content Display or Editorial Field */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
                {isEditing ? (
                  // Markdown / Word rich editor mock
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-5 py-2.5 bg-[#edf2f9] border-b border-[#b8c6d9] flex gap-2 overflow-x-auto shrink-0 z-10">
                      {/* Editor Toolbar with responsive hints */}
                      <button className="p-1 px-2.5 bg-white border border-[#b8c6d9] font-bold text-xs rounded hover:bg-[#e8eef6]" onClick={() => setEditContent(p => p + '\n# Title')}>H1</button>
                      <button className="p-1 px-2.5 bg-white border border-[#b8c6d9] font-bold text-xs rounded hover:bg-[#e8eef6]" onClick={() => setEditContent(p => p + '\n## Subtitle')}>H2</button>
                      <button className="p-1 px-2 bg-white border border-[#b8c6d9] font-bold text-xs rounded hover:bg-[#e8eef6]" onClick={() => setEditContent(p => p + ' **text_đậm**')}>B</button>
                      <button className="p-1 px-2 bg-white border border-[#b8c6d9] italic text-xs rounded hover:bg-[#e8eef6]" onClick={() => setEditContent(p => p + ' *text_nghiêng*')}>I</button>
                      <button className="p-1 px-2 bg-white border border-[#b8c6d9] underline text-xs rounded hover:bg-[#e8eef6]" onClick={() => setEditContent(p => p + ' <u>text_gạch_chân</u>')}>U</button>
                      <span className="w-px bg-[#b8c6d9] my-1"></span>
                      <button className="p-1 px-2.5 bg-white border border-[#b8c6d9] font-sans text-[10px] font-bold uppercase tracking-wider rounded text-[#4a5568] hover:bg-[#e8eef6]" onClick={() => setEditContent(p => p + '\n- Mục danh sách')}>Danh sách</button>
                      <button className="p-1 px-2.5 bg-white border border-[#b8c6d9] font-sans text-[10px] font-bold uppercase tracking-wider rounded text-[#4a5568] hover:bg-[#e8eef6]" onClick={() => setEditContent(p => p + '\n- Căn cứ: Quyết định số... / Luật giáo dục... ')}>Chèn mẫu chung</button>
                    </div>

                    <div className="p-5 space-y-4 shrink-0 border-b border-[#e8eef6] bg-[#f5f8fc]">
                      <label className="block text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Tiêu đề văn bản văn kiện *</label>
                      <input 
                        type="text"
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        className="w-full px-4 py-2 border border-[#b8c6d9] rounded-lg text-sm font-serif font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
                      />
                    </div>

                    <div className="flex-1 p-5 min-h-0">
                      <textarea 
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        className="w-full h-full p-4 bg-white border border-[#b8c6d9] rounded-xl font-mono text-sm leading-relaxed text-[#1e2a3a] focus:outline-none focus:ring-1 focus:ring-[#2c5ea0] resize-none"
                        placeholder="Bắt đầu nhập nội dung pháp quy chi tiết..."
                      />
                    </div>

                    {/* Word indices metrics */}
                    <div className="px-5 py-2.5 bg-[#edf2f9] border-t border-[#b8c6d9] text-xs text-[#7b8a9e] uppercase tracking-wider font-bold flex justify-between shrink-0">
                      <span>Ký số: {editSigner || activeDoc.signer}</span>
                      <div className="flex space-x-4 font-mono text-[10px]">
                        <span>Chữ: {getWordCount(editContent)}</span>
                        <span>|</span>
                        <span>Đọc khoảng: {Math.max(1, Math.round(getWordCount(editContent) / 200))} phút</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Pure Reading layout styled as elegant school newspaper / docket
                  <div className="flex-1 flex flex-col min-h-0 relative select-text">
                    <div className="flex-1 overflow-y-auto p-8 md:p-12 space-y-8 max-w-3xl mx-auto">
                      
                      <div className="text-center space-y-6">
                        <div className="flex justify-between items-start text-xs font-serif uppercase tracking-wider border-b border-[#dce4ee] pb-4">
                          <div className="text-left">
                            <p className="font-bold">{activeDoc.category === 'party' ? 'Đảng Cộng sản Việt Nam' : 'Liên đoàn Lao động'}</p>
                            <p className="text-[10px] text-gray-500">{activeDoc.category === 'party' ? 'Chi bộ th Vân Khánh' : 'BCH Công Đoàn trường'}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">Mẫu ĐH/VC-GD3</p>
                            <p className="text-[10px] text-gray-500 font-sans">ID: {activeDoc.id}</p>
                          </div>
                        </div>

                        <h2 className="text-2xl font-serif font-bold text-[#2c5ea0] py-4 leading-tight">
                          {activeDoc.title}
                        </h2>
                      </div>

                      {/* Official Docket structured content render */}
                      <div className="text-sm leading-relaxed text-[#1e2a3a] font-serif space-y-4 whitespace-pre-line border-t border-dashed border-[#b8c6d9] pt-6">
                        {activeDoc.content}
                      </div>

                      <div className="w-32 h-0.5 bg-[#dce4ee] mx-auto my-8"></div>
                      
                      <div className="flex justify-between pt-8 text-xs font-serif">
                        <div className="italic text-gray-400">
                          Lưu văn khố trường Vân Khánh<br />
                          Mã số bí thư chuẩn y: TTH-V12
                        </div>
                        <div className="text-center space-y-8">
                          <p className="font-bold uppercase tracking-wider">Người Duyệt Ban Hành</p>
                          <div>
                            <p className="font-bold underline text-[#2c5ea0]">{activeDoc.signer}</p>
                            <p className="text-[10px] text-[#7b8a9e] mt-1 font-sans">(Ký số định danh thành công)</p>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      <PartyMemberModal isOpen={modalOpen === 'party'} onClose={() => setModalOpen(null)} />
      <TradeUnionModal isOpen={modalOpen === 'tradeUnion'} onClose={() => setModalOpen(null)} />
      <ParentsUnionModal isOpen={modalOpen === 'parents'} onClose={() => setModalOpen(null)} />
    </main>
  );
};

