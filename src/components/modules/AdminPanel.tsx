import React, { useState, useEffect } from 'react';
import { 
  Filter, Plus, Search, FileText, Mail, Calendar, Archive, Printer, Ban, 
  ShieldAlert, Eye, CheckCircle, Clock, Trash2, Edit, Check, X, ArrowRight, 
  UserCheck, Inbox, AlertTriangle, FileSpreadsheet, Lock, Users, PlusCircle, 
  CheckCircle2, ChevronRight, FileUp, Send, CheckCheck
} from 'lucide-react';
import { ModalBase } from '../ui/Modals';
import { FilterSelect } from '../ui/BaseInputs';
import { Pagination } from '../ui/Pagination';
import { ActionMenu } from '../ui/ActionMenu';
import { 
  getAdminDocuments, saveAdminDocument, deleteAdminDocument,
  getSchedules, saveSchedule, deleteSchedule,
  getStorages, saveStorageItem, deleteStorageItem,
  AdminDocument, Schedule, StorageItem,
  getClericalRequests, saveClericalRequest, deleteClericalRequest,
  getClericalDegreeStocks, saveClericalDegreeStock, deleteClericalDegreeStock,
  getClericalDegreeAllocations, saveClericalDegreeAllocation, deleteClericalDegreeAllocation,
  getClericalAnnouncements, saveClericalAnnouncement, deleteClericalAnnouncement,
  getClericalTravelPapers, saveClericalTravelPaper, deleteClericalTravelPaper,
  AdminRequest, DegreeStock, DegreeAllocation, SchoolAnnouncement, TravelPaper
} from '../../services/dbService';

import { ModuleId } from '../../types';

interface AdminPanelProps {
  initialTab?: 'overview' | 'documents' | 'council' | 'storage' | 'bulletin';
  onSelectModule?: (moduleId: ModuleId) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ initialTab, onSelectModule }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'council' | 'storage' | 'bulletin'>(initialTab || 'overview');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const navigateToTab = (tabId: 'overview' | 'documents' | 'council' | 'storage' | 'bulletin', extraAction?: () => void) => {
    if (onSelectModule) {
      const moduleMap: Record<string, ModuleId> = {
        overview: 'secretary-overview',
        documents: 'secretary-documents',
        council: 'secretary-council',
        storage: 'secretary-storage',
        bulletin: 'secretary-bulletin'
      };
      const targetModule = moduleMap[tabId];
      if (targetModule) {
        onSelectModule(targetModule);
      }
    } else {
      setActiveTab(tabId);
    }
    if (extraAction) {
      extraAction();
    }
  };
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore DB states
  const [documents, setDocuments] = useState<AdminDocument[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [storages, setStorages] = useState<StorageItem[]>([]);

  // Firestore DB states
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [degreeStocks, setDegreeStocks] = useState<DegreeStock[]>([]);
  const [degreeAllocations, setDegreeAllocations] = useState<DegreeAllocation[]>([]);
  const [announcements, setAnnouncements] = useState<SchoolAnnouncement[]>([]);
  const [travelPapers, setTravelPapers] = useState<TravelPaper[]>([]);

  // Active Modals & Operations
  const [modalOpen, setModalOpen] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<AdminDocument | null>(null);
  const [printedDoc, setPrintedDoc] = useState<AdminDocument | null>(null);
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  const [docToVoid, setDocToVoid] = useState<AdminDocument | null>(null);
  const [voidReason, setVoidReason] = useState('');

  // Sub tab filters
  const [docTypeTab, setDocTypeTab] = useState<'All' | 'Văn bản Đến' | 'Văn bản Đi' | 'Trình ký Nội bộ'>('All');
  const [docUrgencyFilter, setDocUrgencyFilter] = useState('All');
  const [councilFolder, setCouncilFolder] = useState<'All' | 'Tuyển sinh' | 'Thi đua' | 'Kỷ luật'>('All');
  const [storageSubTab, setStorageSubTab] = useState<'stock' | 'requests'>('stock');

  // Forms state
  const [docForm, setDocForm] = useState({
    docType: 'Văn bản Đến',
    symbol: '',
    issueDate: '21/06/2026',
    trichYeu: '',
    issuingBody: '',
    urgency: 'Thường',
    security: 'Thường',
    signee: '',
    routingRoles: [] as string[]
  });

  const [schForm, setSchForm] = useState({
    title: '',
    date: '22/06/2026',
    startTime: '08:00',
    endTime: '11:00',
    location: 'Phòng họp 1',
    leader: 'Hiệu Trưởng',
    category: 'Lịch Ban giám hiệu',
    notes: '',
    attendees: 'Ban Giám Hiệu'
  });

  const [travelForm, setTravelForm] = useState({
    type: 'Giấy Giới Thiệu' as 'Giấy Đi Đường' | 'Giấy Giới Thiệu',
    name: '',
    role: '',
    purpose: '',
    destination: '',
    vehicle: 'Xe máy cá nhân',
    startDate: '22/06/2026',
    endDate: '23/06/2026'
  });

  const [degreeForm, setDegreeForm] = useState({
    studentName: '',
    dob: '',
    gradYear: '2026',
    serial: '',
    recipient: 'Học sinh tự nhận',
    date: '21/06/2026'
  });

  const [bulletinForm, setBulletinForm] = useState({
    title: '',
    content: '',
    scope: 'Tất cả' as 'Tất cả' | 'Giáo viên' | 'Học sinh & Phụ huynh',
    priority: 'Thường' as 'Khẩn' | 'Thường'
  });

  const [requestForm, setRequestForm] = useState({
    studentName: '',
    className: '1A1',
    type: 'Bản sao Học bạ' as 'Bản sao Học bạ' | 'Thẻ học sinh cấp lại' | 'Giấy xác nhận học sinh',
    reason: ''
  });

  const [activeRequest, setActiveRequest] = useState<AdminRequest | null>(null);
  const [activeTravelPaper, setActiveTravelPaper] = useState<TravelPaper | null>(null);
  const [rejectReasonText, setRejectReasonText] = useState('');

  // Load Firestore collections
  const loadFirestoreData = async () => {
    try {
      const [
        docsData,
        schedData,
        storData,
        reqsData,
        degStocksData,
        degAllocsData,
        annsData,
        travelsData
      ] = await Promise.all([
        getAdminDocuments(),
        getSchedules(),
        getStorages(),
        getClericalRequests(),
        getClericalDegreeStocks(),
        getClericalDegreeAllocations(),
        getClericalAnnouncements(),
        getClericalTravelPapers()
      ]);
      setDocuments(docsData);
      setSchedules(schedData);
      setStorages(storData);
      setRequests(reqsData);
      setDegreeStocks(degStocksData);
      setDegreeAllocations(degAllocsData);
      setAnnouncements(annsData);
      setTravelPapers(travelsData);
    } catch (err) {
      console.error("Failed to load clerical data from firestore", err);
    }
  };

  useEffect(() => {
    loadFirestoreData();
  }, []);

  // Auto-increment Outgoing dispatch symbol
  const handleDocTypeChangeInForm = (type: string) => {
    setDocForm(prev => {
      let symbolVal = prev.symbol;
      if (type === 'Văn bản Đi') {
        const outgoingDocs = documents.filter(d => d.docType === 'Văn bản Đi');
        let maxNum = 145; // Default start
        outgoingDocs.forEach(d => {
          const match = d.symbol.match(/^(\d+)\/QĐ-thAH/);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (num > maxNum) maxNum = num;
          }
        });
        symbolVal = `${maxNum + 1}/QĐ-thAH`;
      } else {
        symbolVal = '';
      }
      return { ...prev, docType: type, symbol: symbolVal };
    });
  };

  // Submit new dispatch
  const handleSaveDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.symbol.trim() || !docForm.trichYeu.trim() || !docForm.issuingBody.trim()) {
      alert("Vui lòng nhập đầy đủ các thông tin bắt buộc (*)");
      return;
    }

    const formatted: AdminDocument = {
      id: `VB-${Math.floor(Math.random() * 900000 + 100000)}`,
      symbol: docForm.symbol.trim(),
      issueDate: docForm.issueDate,
      trichYeu: docForm.trichYeu.trim(),
      issuingBody: docForm.issuingBody.trim(),
      docType: docForm.docType,
      urgency: docForm.urgency,
      security: docForm.security,
      status: docForm.docType === 'Trình ký Nội bộ' ? 'Chờ Phê Duyệt' : (docForm.urgency === 'Thường' ? 'Đã Lưu Trữ' : 'Khẩn Ưu Tiên'),
      voidReason: ''
    };

    try {
      await saveAdminDocument(formatted);
      setDocuments(prev => [formatted, ...prev]);
      setModalOpen(null);
      // Reset form
      setDocForm({
        docType: 'Văn bản Đến',
        symbol: '',
        issueDate: '21/06/2026',
        trichYeu: '',
        issuingBody: '',
        urgency: 'Thường',
        security: 'Thường',
        signee: '',
        routingRoles: []
      });
    } catch (err) {
      console.error("Failed to save dispatch", err);
    }
  };

  // Approve dispatch internally (Trình ký)
  const handleApproveInternalDoc = async (doc: AdminDocument) => {
    const updated: AdminDocument = {
      ...doc,
      status: 'Đã Ký Ban Hành'
    };
    try {
      await saveAdminDocument(updated);
      setDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
      if (selectedDoc && selectedDoc.id === doc.id) {
        setSelectedDoc(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke/Void dispatch
  const handleConfirmVoidDoc = async () => {
    if (!docToVoid || !voidReason.trim()) return;
    const updated: AdminDocument = {
      ...docToVoid,
      status: 'Đã Hủy Hợp Pháp',
      voidReason: voidReason.trim()
    };
    try {
      await saveAdminDocument(updated);
      setDocuments(prev => prev.map(d => d.id === docToVoid.id ? updated : d));
      setIsVoidOpen(false);
      setDocToVoid(null);
      setVoidReason('');
    } catch (err) {
      console.error(err);
    }
  };

  // Create meeting schedule
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schForm.title.trim() || !schForm.location.trim()) {
      alert("Vui lòng điền tiêu đề và địa điểm họp");
      return;
    }

    const newSch: Schedule = {
      id: `SCH-${Date.now().toString().slice(-4)}`,
      time: `${schForm.startTime} (${schForm.date})`,
      title: schForm.title.trim(),
      leader: schForm.leader,
      location: schForm.location.trim(),
      status: 'Sắp Diễn Ra'
    };

    try {
      await saveSchedule(newSch);
      setSchedules(prev => [newSch, ...prev]);
      setModalOpen(null);
      setSchForm({
        title: '',
        date: '22/06/2026',
        startTime: '08:00',
        endTime: '11:00',
        location: 'Phòng họp 1',
        leader: 'Hiệu Trưởng',
        category: 'Lịch Ban giám hiệu',
        notes: '',
        attendees: 'Ban Giám Hiệu'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Generate travel permits
  const handleSaveTravelPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!travelForm.name.trim() || !travelForm.destination.trim() || !travelForm.purpose.trim()) {
      alert("Vui lòng điền đầy đủ các mục yêu cầu");
      return;
    }
    const newPaper: TravelPaper = {
      id: `${travelForm.type === 'Giấy Giới Thiệu' ? 'GT' : 'DD'}-${Math.floor(Math.random() * 900 + 100)}`,
      type: travelForm.type,
      name: travelForm.name.trim(),
      role: travelForm.role.trim(),
      purpose: travelForm.purpose.trim(),
      destination: travelForm.destination.trim(),
      vehicle: travelForm.type === 'Giấy Đi Đường' ? travelForm.vehicle : undefined,
      startDate: travelForm.startDate,
      endDate: travelForm.endDate,
      dateCreated: '21/06/2026',
      status: 'Đã ký'
    };
    try {
      await saveClericalTravelPaper(newPaper);
      setTravelPapers(prev => [newPaper, ...prev]);
      setModalOpen(null);
      setTravelForm({
        type: 'Giấy Giới Thiệu',
        name: '',
        role: '',
        purpose: '',
        destination: '',
        vehicle: 'Xe máy cá nhân',
        startDate: '22/06/2026',
        endDate: '23/06/2026'
      });
      setActiveTravelPaper(newPaper);
    } catch (err) {
      console.error("Failed to save travel paper", err);
    }
  };

  // Process certificate copy request
  const handleProcessRequest = async (status: 'Đã cấp' | 'Từ chối') => {
    if (!activeRequest) return;
    if (status === 'Từ chối' && !rejectReasonText.trim()) {
      alert("Vui lòng điền lý do từ chối giải quyết");
      return;
    }
    const updatedRequest: AdminRequest = {
      ...activeRequest,
      status,
      rejectReason: status === 'Từ chối' ? rejectReasonText.trim() : undefined,
      processedDate: '21/06/2026'
    };
    try {
      await saveClericalRequest(updatedRequest);
      setRequests(prev => prev.map(r => r.id === activeRequest.id ? updatedRequest : r));
      setActiveRequest(null);
      setRejectReasonText('');
    } catch (err) {
      console.error("Failed to process request", err);
    }
  };

  // Create clerical request manually
  const handleSaveRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.studentName.trim() || !requestForm.reason.trim()) {
      alert("Vui lòng điền đầy đủ thông tin yêu cầu");
      return;
    }
    const newRequest: AdminRequest = {
      id: `REQ-${Math.floor(Math.random() * 900 + 100)}`,
      studentName: requestForm.studentName.trim(),
      className: requestForm.className,
      type: requestForm.type,
      date: '21/06/2026',
      reason: requestForm.reason.trim(),
      status: 'Chờ xử lý'
    };
    try {
      await saveClericalRequest(newRequest);
      setRequests(prev => [newRequest, ...prev]);
      setModalOpen(null);
      setRequestForm({
        studentName: '',
        className: '1A1',
        type: 'Bản sao Học bạ',
        reason: ''
      });
    } catch (err) {
      console.error("Failed to save request", err);
    }
  };

  // Graduate degree template allocations (issue log)
  const handleIssueDegree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!degreeForm.studentName.trim() || !degreeForm.serial.trim()) {
      alert("Vui lòng nhập tên học sinh và số hiệu bằng");
      return;
    }
    const stock = degreeStocks.find(s => s.year === degreeForm.gradYear);
    if (!stock || stock.remaining <= 0) {
      alert("Lỗi: Đã hết phôi bằng dự trữ cho khóa tốt nghiệp này!");
      return;
    }

    // Decrement stock template count
    const updatedStock: DegreeStock = {
      ...stock,
      issued: stock.issued + 1,
      remaining: stock.remaining - 1
    };

    // Add log item
    const newAlloc: DegreeAllocation = {
      id: `DG-${degreeForm.gradYear}-${Math.floor(Math.random() * 900 + 100)}`,
      studentName: degreeForm.studentName.trim(),
      dob: degreeForm.dob,
      gradYear: degreeForm.gradYear,
      serial: degreeForm.serial.trim(),
      recipient: degreeForm.recipient.trim(),
      date: degreeForm.date,
      status: 'Đã nhận'
    };

    try {
      await Promise.all([
        saveClericalDegreeStock(updatedStock),
        saveClericalDegreeAllocation(newAlloc)
      ]);
      setDegreeStocks(prev => prev.map(s => s.year === degreeForm.gradYear ? updatedStock : s));
      setDegreeAllocations(prev => [newAlloc, ...prev]);
      setModalOpen(null);
      // Reset form
      setDegreeForm({
        studentName: '',
        dob: '',
        gradYear: '2026',
        serial: '',
        recipient: 'Học sinh tự nhận',
        date: '21/06/2026'
      });
    } catch (err) {
      console.error("Failed to issue degree", err);
    }
  };

  // Publish Announcement Bulletin
  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulletinForm.title.trim() || !bulletinForm.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung bảng tin");
      return;
    }
    const newAnn: SchoolAnnouncement = {
      id: `ANN-${Math.floor(Math.random() * 900 + 100)}`,
      title: bulletinForm.title.trim(),
      content: bulletinForm.content.trim(),
      scope: bulletinForm.scope,
      priority: bulletinForm.priority,
      date: '21/06/2026',
      author: 'Bộ phận Văn thư'
    };
    try {
      await saveClericalAnnouncement(newAnn);
      setAnnouncements(prev => [newAnn, ...prev]);
      setBulletinForm({
        title: '',
        content: '',
        scope: 'Tất cả',
        priority: 'Thường'
      });
    } catch (err) {
      console.error("Failed to publish announcement", err);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id: string) => {
    if (window.confirm("Bạn có chắc chắn muốn gỡ bỏ thông báo này khỏi bảng tin?")) {
      try {
        await deleteClericalAnnouncement(id);
        setAnnouncements(prev => prev.filter(a => a.id !== id));
      } catch (err) {
        console.error("Failed to delete announcement", err);
      }
    }
  };

  // Filter elements
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.trichYeu.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          doc.issuingBody.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = docTypeTab === 'All' ? true 
                       : docTypeTab === 'Trình ký Nội bộ' ? doc.status === 'Chờ Phê Duyệt'
                       : doc.docType === docTypeTab;
    const matchesUrgency = docUrgencyFilter === 'All' ? true : doc.urgency === docUrgencyFilter;
    return matchesSearch && matchesTab && matchesUrgency;
  });

  const filteredSchedules = schedules.filter(sch => {
    const matchesSearch = sch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sch.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sch.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredRequests = requests.filter(r => {
    return r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
           r.className.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredAllocations = degreeAllocations.filter(a => {
    return a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
           a.serial.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-[#f0f4fa] text-[#1e2a3a] main-scrollbar">
      {/* Background micro grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#b8c6d9_1px,transparent_1px)] [background-size:20px_20px] opacity-10 pointer-events-none"></div>
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#2c5ea0] opacity-[0.02] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 gap-4">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] flex items-center gap-3">
              Thư Ký Hội Đồng & Văn Thư
              <span className="text-xs font-sans font-bold bg-[#2c5ea0] text-[#f5f8fc] px-3 py-1 rounded-full uppercase tracking-wider">
                Văn phòng Hội đồng
              </span>
            </h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold mt-2">Văn thư lưu trữ công văn, thư ký sự kiện và phôi bằng gốc</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setModalOpen('dispatch_permits')}
              className="flex items-center px-4 py-2 border border-[#b8c6d9] bg-white text-[#1e2a3a] text-xs uppercase tracking-widest font-bold hover:bg-[#e8eef6] transition rounded-full shadow-sm"
            >
              <Printer className="w-3.5 h-3.5 mr-2" />
              Lập Giấy Đi Đường / Giới Thiệu
            </button>
            <button 
              onClick={() => {
                if (activeTab === 'documents') setModalOpen('create_doc');
                else if (activeTab === 'council') setModalOpen('create_sch');
                else if (activeTab === 'storage') {
                  if (storageSubTab === 'stock') setModalOpen('create_degree');
                  else setModalOpen('create_request');
                }
                else setModalOpen('create_doc');
              }}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 rounded-full whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'council' ? 'Thêm Lịch Họp' 
                : activeTab === 'storage' && storageSubTab === 'stock' ? 'Cấp phát Bằng'
                : 'Nhập Công Văn Mới'}
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        {!initialTab && (
          <div className="flex flex-wrap border-b border-[#b8c6d9] mb-8 gap-1">
            {[
              { id: 'overview', label: 'Tổng quan Hành chính', icon: Inbox },
              { id: 'documents', label: 'Sổ Công văn Điện tử', icon: Mail },
              { id: 'council', label: 'Công tác Hội đồng', icon: Calendar },
              { id: 'storage', label: 'Lưu trữ & Cấp phát', icon: Archive },
              { id: 'bulletin', label: 'Bảng tin Nhà trường', icon: FileText }
            ].map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setSearchQuery('');
                  }}
                  className={`flex items-center gap-2 px-6 py-3 text-xs uppercase tracking-wider font-bold border-t-2 border-x transition-all rounded-t-xl -mb-[1px] ${
                    isSelected 
                      ? 'bg-[#f5f8fc] border-t-[#2c5ea0] border-x-[#b8c6d9] text-[#2c5ea0] shadow-sm font-extrabold'
                      : 'bg-transparent border-t-transparent border-x-transparent text-[#4a5568] hover:text-[#2c5ea0] hover:bg-[#e8eef6]/50'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Search Strip (except for Overview and Bulletin) */}
        {activeTab !== 'overview' && activeTab !== 'bulletin' && (
          <div className="flex flex-wrap gap-4 items-center justify-between bg-[#e8eef6] border border-[#b8c6d9] rounded-2xl p-4 mb-6 shadow-inner">
            <div className="flex items-center gap-2 text-xs font-bold text-[#4a5568] uppercase tracking-wider">
              <Search size={16} />
              Bộ lọc & Tìm kiếm nhanh
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Nhập thông tin tra cứu..."
                  className="pl-11 pr-4 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] min-w-[240px] shadow-sm rounded-full placeholder:text-[#8e9eb4]"
                />
              </div>

              {activeTab === 'documents' && (
                <>
                  <FilterSelect
                    label="Độ Khẩn"
                    value={docUrgencyFilter}
                    onChange={setDocUrgencyFilter}
                    options={[
                      { value: 'All', label: 'Tất cả độ khẩn' },
                      { value: 'Thường', label: 'Bình thường' },
                      { value: 'Khẩn', label: 'Công văn khẩn' },
                      { value: 'Hỏa tốc', label: 'Hỏa tốc khẩn' }
                    ]}
                    icon={Filter}
                  />
                </>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 1: OVERVIEW ─── */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            {/* Status Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Công văn Hỏa tốc */}
              <div className="bg-red-50/70 border-[2px] border-red-200 hover:border-red-400 rounded-3xl p-6 shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded uppercase tracking-wider">Mức độ khẩn</span>
                    <h4 className="text-base font-bold text-red-950 font-serif mt-1">Công văn khẩn & Hỏa tốc</h4>
                    <p className="text-xs text-red-800 font-medium">Cần Ban Giám Hiệu xử lý khẩn cấp trong ngày.</p>
                  </div>
                  <ShieldAlert className="text-red-700 w-8 h-8 shrink-0" />
                </div>
                <div className="mt-6 pt-4 border-t border-red-100 flex items-end justify-between">
                  <div className="font-serif font-bold text-red-800 text-3xl">
                    {documents.filter(d => (d.urgency === 'Khẩn' || d.urgency === 'Hỏa tốc') && d.status !== 'Đã Hủy Hợp Pháp').length}
                  </div>
                  <button 
                    onClick={() => { navigateToTab('documents', () => { setDocTypeTab('Văn bản Đến'); setDocUrgencyFilter('Khẩn'); }); }}
                    className="text-xs font-bold text-red-700 flex items-center gap-1 hover:underline"
                  >
                    Xem danh sách <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 2: Công văn chờ trình ký */}
              <div className="bg-amber-50/70 border-[2px] border-amber-200 hover:border-amber-400 rounded-3xl p-6 shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">Trình BGH</span>
                    <h4 className="text-base font-bold text-amber-950 font-serif mt-1">Văn bản chờ Trình ký</h4>
                    <p className="text-xs text-amber-800 font-medium">Báo cáo, tờ trình chờ chữ ký của Ban Giám Hiệu.</p>
                  </div>
                  <Clock className="text-amber-700 w-8 h-8 shrink-0" />
                </div>
                <div className="mt-6 pt-4 border-t border-amber-100 flex items-end justify-between">
                  <div className="font-serif font-bold text-amber-800 text-3xl">
                    {documents.filter(d => d.status === 'Chờ Phê Duyệt').length}
                  </div>
                  <button 
                    onClick={() => { navigateToTab('documents', () => { setDocTypeTab('Trình ký Nội bộ'); }); }}
                    className="text-xs font-bold text-amber-700 flex items-center gap-1 hover:underline"
                  >
                    Xem và duyệt ký <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Card 3: Yêu cầu hành chính học sinh/phụ huynh */}
              <div className="bg-emerald-50/70 border-[2px] border-emerald-200 hover:border-emerald-400 rounded-3xl p-6 shadow-sm transition-all flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">Hành chính</span>
                    <h4 className="text-base font-bold text-emerald-950 font-serif mt-1">Yêu cầu cấp sao & Xác nhận</h4>
                    <p className="text-xs text-emerald-800 font-medium">Hồ sơ xin học bạ sao y, thẻ học sinh, giấy xác nhận.</p>
                  </div>
                  <UserCheck className="text-emerald-700 w-8 h-8 shrink-0" />
                </div>
                <div className="mt-6 pt-4 border-t border-emerald-100 flex items-end justify-between">
                  <div className="font-serif font-bold text-emerald-800 text-3xl">
                    {requests.filter(r => r.status === 'Chờ xử lý').length}
                  </div>
                  <button 
                    onClick={() => { navigateToTab('storage', () => { setStorageSubTab('requests'); }); }}
                    className="text-xs font-bold text-emerald-700 flex items-center gap-1 hover:underline"
                  >
                    Mở cổng in ấn <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column (2/3 width) - Events Timeline & Recent dispatches */}
              <div className="lg:col-span-2 space-y-8">
                {/* Timeline */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5 flex items-center justify-between">
                    <span>Lịch trình sự kiện & Cuộc họp trong tuần</span>
                    <span className="text-xs font-sans normal-case text-gray-500 font-medium">Được cập nhật bởi Thư ký</span>
                  </h3>
                  
                  <div className="space-y-4">
                    {schedules.slice(0, 4).map((sch, i) => (
                      <div key={sch.id} className="flex gap-4 relative">
                        {i < schedules.length - 1 && (
                          <div className="absolute top-8 bottom-0 left-[21px] w-0.5 bg-[#b8c6d9]"></div>
                        )}
                        <div className="w-11 h-11 rounded-full bg-[#e8eef6] border border-[#b8c6d9] flex items-center justify-center text-[#2c5ea0] shrink-0 font-bold text-xs shadow-sm">
                          {sch.time.slice(0, 5)}
                        </div>
                        <div className="flex-1 bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl p-4 flex justify-between items-center hover:shadow-sm transition-shadow">
                          <div>
                            <span className="text-[9px] font-bold text-[#7b8a9e] bg-[#dce4ee] px-2 py-0.5 rounded uppercase tracking-wider">{sch.time.split(' ')[1] || 'Hôm nay'}</span>
                            <h4 className="font-bold text-sm text-[#1e2a3a] mt-1.5">{sch.title}</h4>
                            <p className="text-xs text-[#4a5568] mt-1">Chủ trì: <strong>{sch.leader}</strong> | Địa điểm: <strong>{sch.location}</strong></p>
                          </div>
                          <span className="text-[9px] font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">ĐÃ GỬI LỜI MỜI</span>
                        </div>
                      </div>
                    ))}
                    {schedules.length === 0 && (
                      <div className="text-center py-6 text-xs font-bold text-gray-500 uppercase tracking-widest">Không có cuộc họp nào được ghi nhận</div>
                    )}
                  </div>
                </div>

                {/* Recent Dispatches table */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-4 flex items-center justify-between">
                    <span>Công văn mới cập nhật</span>
                    <button 
                      onClick={() => { navigateToTab('documents', () => { setDocTypeTab('All'); }); }}
                      className="text-xs font-bold text-[#2c5ea0] flex items-center gap-1 hover:underline"
                    >
                      Xem toàn bộ sổ công văn <ArrowRight size={14} />
                    </button>
                  </h3>
                  
                  <div className="overflow-x-auto max-h-[300px] main-scrollbar">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9] sticky top-0 z-10">
                        <tr>
                          <th className="p-3">Số ký hiệu</th>
                          <th className="p-3">Ngày nhận</th>
                          <th className="p-3">Trích yếu nội dung</th>
                          <th className="p-3">Cơ quan ban hành</th>
                          <th className="p-3 text-center">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.slice(0, 5).map(doc => {
                          const isKhank = doc.urgency === 'Khẩn' || doc.urgency === 'Hỏa tốc';
                          return (
                            <tr key={doc.id} className={`border-b border-[#e8eef6] hover:bg-[#f0f4fa] transition-colors ${isKhank ? 'bg-red-50/20' : ''}`}>
                              <td className="p-3 font-mono font-bold text-[#7b8a9e]">{doc.symbol}</td>
                              <td className="p-3 font-bold text-[#4a5568]">{doc.issueDate}</td>
                              <td className="p-3 font-bold text-[#1e2a3a] max-w-xs truncate">{doc.trichYeu}</td>
                              <td className="p-3 font-semibold text-[#4a5568]">{doc.issuingBody}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  doc.status === 'Đã Hủy Hợp Pháp' ? 'bg-red-100 text-red-700' :
                                  isKhank ? 'bg-red-600 text-white' : 'bg-[#a8c4e0] text-gray-800'
                                }`}>
                                  {doc.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column (1/3 width) - Quick actions menu & Degree stock summaries */}
              <div className="space-y-8">
                {/* Fast actions list */}
                <div className="bg-[#e8eef6] border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-5">Thao tác nhanh</h3>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => { handleDocTypeChangeInForm('Văn bản Đến'); setModalOpen('create_doc'); }}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#f5f8fc] border border-[#b8c6d9] rounded-2xl text-xs font-bold text-[#1e2a3a] transition-all hover:translate-x-1 shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle size={16} className="text-[#2c5ea0]" />
                        Nhập số Công văn đến
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setModalOpen('create_sch')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#f5f8fc] border border-[#b8c6d9] rounded-2xl text-xs font-bold text-[#1e2a3a] transition-all hover:translate-x-1 shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle size={16} className="text-[#2e6b8a]" />
                        Tạo Lịch họp mới
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                    <button 
                      onClick={() => setModalOpen('dispatch_permits')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-[#f5f8fc] border border-[#b8c6d9] rounded-2xl text-xs font-bold text-[#1e2a3a] transition-all hover:translate-x-1 shadow-sm"
                    >
                      <span className="flex items-center gap-2">
                        <Printer size={16} className="text-[#b38c5d]" />
                        Lập Giấy đi đường / Giới thiệu
                      </span>
                      <ChevronRight size={14} className="text-gray-400" />
                    </button>
                  </div>
                </div>

                {/* Stock summary card */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-4 flex items-center justify-between">
                    <span>Kho phôi bằng tốt nghiệp</span>
                    <button 
                      onClick={() => { navigateToTab('storage', () => { setStorageSubTab('stock'); }); }}
                      className="text-[10px] font-bold text-[#2c5ea0] hover:underline"
                    >
                      Chi tiết <ChevronRight size={10} className="inline" />
                    </button>
                  </h3>
                  
                  <div className="space-y-4">
                    {degreeStocks.map(s => (
                      <div key={s.id} className="p-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl">
                        <div className="flex justify-between items-center border-b border-dashed border-[#b8c6d9] pb-1.5 mb-2">
                          <span className="font-bold text-xs text-[#1e2a3a]">Niên khóa {s.year}</span>
                          <span className="text-[10px] font-bold text-[#7b8a9e] bg-[#dce4ee] px-2 py-0.5 rounded">Tồn kho: {s.remaining}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-bold text-[#4a5568]">
                          <div>
                            <p className="text-[#7b8a9e]">Nhập</p>
                            <p className="text-[#1e2a3a] text-xs font-bold mt-0.5">{s.total}</p>
                          </div>
                          <div>
                            <p className="text-green-700">Đã cấp</p>
                            <p className="text-[#1e2a3a] text-xs font-bold mt-0.5">{s.issued}</p>
                          </div>
                          <div>
                            <p className="text-red-700">Hỏng</p>
                            <p className="text-[#1e2a3a] text-xs font-bold mt-0.5">{s.damaged}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: DOCUMENTS ─── */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start animate-fade-in">
            {/* Left Pane - List of dispatches (3/5 width) */}
            <div className="lg:col-span-3 space-y-4 flex flex-col h-[650px] min-h-0">
              {/* Inner Tab Selection */}
              <div className="flex border-b border-[#b8c6d9] bg-[#e8eef6] rounded-xl p-1 shrink-0 gap-1">
                {[
                  { id: 'All', label: 'Tất cả' },
                  { id: 'Văn bản Đến', label: 'Công văn Đến' },
                  { id: 'Văn bản Đi', label: 'Công văn Đi' },
                  { id: 'Trình ký Nội bộ', label: 'Trình ký Nội bộ' }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => { setDocTypeTab(subTab.id as any); setSelectedDoc(null); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                      docTypeTab === subTab.id 
                        ? 'bg-white text-[#2c5ea0] shadow-sm font-extrabold'
                        : 'text-[#4a5568] hover:text-[#2c5ea0]'
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {/* Data Table */}
              <div className="flex-1 bg-white border-[3px] border-double border-[#b8c6d9] shadow-sm rounded-3xl overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-auto main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap table-fixed">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10">
                      <tr>
                        <th className="p-4 w-1/4">Số / Ký hiệu</th>
                        <th className="p-4 w-1/6">Ngày lập</th>
                        <th className="p-4 w-1/3">Trích yếu nội dung</th>
                        <th className="p-4 w-1/4 text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {filteredDocs.map(doc => {
                        const isSelected = selectedDoc && selectedDoc.id === doc.id;
                        const isVoided = doc.status === 'Đã Hủy Hợp Pháp';
                        return (
                          <tr 
                            key={doc.id}
                            onClick={() => setSelectedDoc(doc)}
                            className={`cursor-pointer transition-colors group ${
                              isSelected ? 'bg-[#e8eef6] hover:bg-[#e8eef6]' : 'hover:bg-[#f0f4fa]'
                            } ${isVoided ? 'bg-red-50/10 opacity-75' : ''}`}
                          >
                            <td className="p-4 font-mono font-bold text-[#7b8a9e]">
                              <div className={isVoided ? 'line-through text-red-900' : ''}>{doc.symbol}</div>
                              <div className="text-[9px] text-gray-400 font-normal mt-0.5">{doc.id}</div>
                            </td>
                            <td className="p-4 font-semibold text-[#4a5568]">{doc.issueDate}</td>
                            <td className="p-4 font-bold text-[#1e2a3a] truncate max-w-0" title={doc.trichYeu}>
                              <div className={isVoided ? 'line-through text-gray-400' : ''}>{doc.trichYeu}</div>
                              <div className="text-[9px] text-[#7b8a9e] font-medium truncate">{doc.issuingBody}</div>
                            </td>
                            <td className="p-4 text-center">
                              {isVoided ? (
                                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">ĐÃ THU HỒI</span>
                              ) : (
                                <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                  doc.urgency === 'Khẩn' || doc.urgency === 'Hỏa tốc' ? 'bg-[#2c5ea0] text-[#f5f8fc]' : 
                                  doc.status === 'Chờ Phê Duyệt' ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-green-100 text-green-700 border border-green-300'
                                }`}>
                                  {doc.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredDocs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-xs font-bold text-gray-500 uppercase tracking-widest">Không tìm thấy công văn nào</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {/* Pagination */}
                <div className="px-6 py-4 border-t border-[#b8c6d9] bg-[#f0f4fa] shrink-0">
                  <p className="text-[10px] text-[#7b8a9e] font-bold uppercase tracking-wider">Tổng cộng: {filteredDocs.length} công văn lưu trữ</p>
                </div>
              </div>
            </div>

            {/* Right Pane - Simulated PDF Document Viewer (2/5 width) */}
            <div className="lg:col-span-2 h-[650px] flex flex-col min-h-0 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-sm rounded-3xl p-4 overflow-hidden">
              <div className="border-b border-[#b8c6d9] pb-3 mb-4 flex items-center justify-between shrink-0">
                <span className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={16} className="text-[#2c5ea0]" />
                  Bản xem điện tử PDF chính thống
                </span>
                
                {selectedDoc && (
                  <div className="flex gap-2">
                    {selectedDoc.status === 'Chờ Phê Duyệt' && (
                      <button 
                        onClick={() => handleApproveInternalDoc(selectedDoc)}
                        className="px-3 py-1 bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm"
                      >
                        <CheckCheck size={12} /> Phê Duyệt
                      </button>
                    )}
                    {selectedDoc.status !== 'Đã Hủy Hợp Pháp' && (
                      <button 
                        onClick={() => { setDocToVoid(selectedDoc); setIsVoidOpen(true); }}
                        className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center gap-1 shadow-sm"
                      >
                        <Ban size={12} /> Hủy Quyết Định
                      </button>
                    )}
                  </div>
                )}
              </div>

              {selectedDoc ? (
                /* PDF Viewer Component */
                <div className="flex-1 overflow-auto main-scrollbar">
                  <div className="bg-white border border-gray-300 p-6 rounded-2xl shadow-inner font-serif text-[11px] leading-relaxed text-[#1e2a3a] relative select-text">
                    {/* Red Star Stamp */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08] pointer-events-none select-none">
                      <svg width="220" height="220" viewBox="0 0 100 100" className="text-red-700 fill-current">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
                        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 1" />
                        <path d="M 50,22 L 58,40 L 78,40 L 62,52 L 68,70 L 50,58 L 32,70 L 38,52 L 22,40 L 42,40 Z" />
                      </svg>
                    </div>

                    {/* Header Grid */}
                    <div className="grid grid-cols-2 gap-4 border-b border-black pb-4 mb-4 font-sans text-[9px] uppercase font-bold tracking-tight">
                      <div>
                        <p className="text-red-700 tracking-wider">
                          {selectedDoc.docType === 'Văn bản Đến' ? selectedDoc.issuingBody : 'SỞ GD&ĐT TỈNH TIỀN GIANG'}
                        </p>
                        <p className="text-gray-900 border-b border-gray-900 pb-1 w-fit">
                          {selectedDoc.docType === 'Văn bản Đến' ? 'PHÒNG HÀNH CHÍNH' : 'TRƯỜNG MẦM NON AN HỮU'}
                        </p>
                        <p className="normal-case text-gray-500 font-mono mt-1 font-bold">Số: {selectedDoc.symbol}</p>
                        <p className="normal-case text-gray-500 font-mono">Mã số: {selectedDoc.id}</p>
                      </div>
                      <div className="text-center font-sans">
                        <p className="text-red-700 tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                        <p className="text-gray-900 underline underline-offset-4 decoration-1 lowercase first-letter:uppercase">Độc lập - Tự do - Hạnh phúc</p>
                        <p className="normal-case text-gray-500 font-semibold italic mt-4">Cái Bè, ngày {selectedDoc.issueDate}</p>
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-center my-6 space-y-1">
                      <h4 className="font-sans font-bold text-xs tracking-wide uppercase text-red-700">
                        {selectedDoc.docType === 'Trình ký Nội bộ' ? 'TỜ TRÌNH PHÊ DUYỆT' : 'QUYẾT ĐỊNH'}
                      </h4>
                      <p className="italic text-[10px] font-sans font-bold text-gray-600">
                        V/v: {selectedDoc.trichYeu}
                      </p>
                    </div>

                    {/* Body */}
                    <div className="space-y-3 text-justify pl-2 pr-2 font-serif text-[10px]">
                      <p className="font-bold">- Căn cứ Kế hoạch tổ chức cán bộ và điều hành chuyên môn trường Mầm non An Hữu năm học 2025 - 2026;</p>
                      <p className="font-bold">- Căn cứ chức năng, nhiệm vụ và quyền hạn của bộ phận Văn phòng nhà trường;</p>
                      <p className="font-bold">- Xét đề nghị của Văn phòng Hội đồng trường Mầm non An Hữu,</p>
                      
                      <div className="font-bold text-center uppercase my-3 font-sans text-[10px]">HIỆU TRƯỞNG TRƯỜNG MẦM NON AN HỮU QUYẾT ĐỊNH:</div>
                      
                      <p><strong>Điều 1.</strong> Tiếp nhận và chỉ đạo phân phối văn bản số <strong>{selectedDoc.symbol}</strong> do đơn vị <strong>{selectedDoc.issuingBody}</strong> ban hành về việc: "{selectedDoc.trichYeu}".</p>
                      <p><strong>Điều 2.</strong> Giao trách nhiệm chính cho Ban Giám hiệu phối hợp với các tổ chuyên môn, ban ngành đoàn thể trực thuộc tổ chức triển khai nghiêm túc nội dung chỉ thị.</p>
                      <p><strong>Điều 3.</strong> Bộ phận Thư ký văn phòng chịu trách nhiệm giám sát tiến độ thực hiện, tổng hợp báo cáo kết quả lên Hiệu trưởng trước ngày quy định.</p>
                    </div>

                    {/* Signatures & Seal */}
                    <div className="grid grid-cols-2 gap-4 mt-8 pt-4 border-t border-dashed border-gray-300 font-sans text-[9px]">
                      <div>
                        <p className="font-bold italic text-gray-500 underline uppercase">Nơi nhận:</p>
                        <p className="text-[8px] text-gray-600 mt-1">- Như Điều 2 (để thực hiện);</p>
                        <p className="text-[8px] text-gray-600">- Lưu văn thư nhà trường;</p>
                        <p className="text-[8px] text-gray-600">- Công bố bảng tin chung.</p>
                      </div>
                      <div className="text-center relative">
                        <p className="font-bold uppercase text-red-700">HIỆU TRƯỞNG</p>
                        <p className="text-[8px] text-gray-500 italic mt-0.5">
                          {selectedDoc.status === 'Chờ Phê Duyệt' ? '(Chưa ký)' : '(Đã ký đóng dấu số)'}
                        </p>
                        
                        {selectedDoc.status !== 'Chờ Phê Duyệt' && (
                          <div className="w-14 h-14 border-2 border-red-600 rounded-full flex items-center justify-center text-center text-red-600 font-sans font-bold text-[6px] uppercase tracking-tighter opacity-80 rotate-12 mx-auto mt-2 relative">
                            <span className="absolute inset-1.5 border border-red-600 border-dashed rounded-full pointer-events-none"></span>
                            th<br />AN HỮU
                          </div>
                        )}
                        <p className="font-bold text-[#1e2a3a] mt-2 font-serif">Nguyễn Văn Hiệu</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-white border border-dashed border-[#b8c6d9] rounded-2xl">
                  <Inbox className="w-12 h-12 text-[#8e9eb4] mb-3 animate-pulse" />
                  <h4 className="font-bold text-xs uppercase tracking-widest text-[#1e2a3a]">CHỌN CÔNG VĂN ĐỂ XEM NHANH BẢN ĐIỆN TỬ</h4>
                  <p className="text-xs text-[#7b8a9e] mt-2 leading-relaxed max-w-[280px]">
                    Nhấp vào bất kỳ dòng nào trong sổ công văn để hiển thị văn bản PDF trực tiếp tại đây mà không cần tải về máy tính.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: COUNCIL ─── */}
        {activeTab === 'council' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start animate-fade-in">
            {/* Left Sidebar - Directories Folders */}
            <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-sm rounded-3xl h-fit">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-1.5">
                <Archive size={14} className="text-[#2c5ea0]" />
                Hội đồng Chuyên trách
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'All', label: 'Tất cả biên bản' },
                  { id: 'Tuyển sinh', label: 'Hội đồng Tuyển sinh' },
                  { id: 'Thi đua', label: 'Hội đồng Thi đua' },
                  { id: 'Kỷ luật', label: 'Hội đồng Kỷ luật' }
                ].map(folder => (
                  <button
                    key={folder.id}
                    onClick={() => setCouncilFolder(folder.id as any)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-xs font-bold transition-all rounded-xl border ${
                      councilFolder === folder.id 
                        ? 'bg-[#e8eef6] border-[#b8c6d9] text-[#2c5ea0] shadow-inner font-extrabold'
                        : 'bg-white border-transparent hover:bg-[#e8eef6]/50 hover:border-[#b8c6d9]'
                    }`}
                  >
                    <span>{folder.label}</span>
                    <ChevronRight size={12} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Pane - Content (3/4 width) */}
            <div className="col-span-1 lg:col-span-3 space-y-8">
              {/* Meeting Minutes list */}
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                  Kho lưu trữ số hóa Biên bản & Nghị quyết
                </h3>
                
                <div className="overflow-x-auto max-h-[450px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã số</th>
                        <th className="p-4">Ngày họp</th>
                        <th className="p-4">Nội dung biên bản / Nghị quyết</th>
                        <th className="p-4">Hội đồng phụ trách</th>
                        <th className="p-4 text-center">Tác vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {[
                        { id: 'BB-001', date: '15/06/2026', title: 'Biên bản thống nhất phương án tuyển sinh lớp 1 năm học 2026 - 2027', group: 'Tuyển sinh', author: 'Vũ Văn Hành' },
                        { id: 'BB-002', date: '12/06/2026', title: 'Quyết định kỷ luật học sinh vi phạm quy chế kiểm tra cuối cấp', group: 'Kỷ luật', author: 'Nguyễn Văn Hiệu' },
                        { id: 'BB-003', date: '30/05/2026', title: 'Biên bản bình xét và đề cử danh hiệu thi đua giáo viên xuất sắc cuối năm', group: 'Thi đua', author: 'Trần Minh Triết' },
                        { id: 'BB-004', date: '25/05/2026', title: 'Quyết định công nhận kết quả xét duyệt học bổng học sinh nghèo vượt khó', group: 'Thi đua', author: 'Lê Văn Tám' }
                      ]
                        .filter(item => councilFolder === 'All' ? true : item.group === councilFolder)
                        .map(item => (
                          <tr key={item.id} className="hover:bg-[#f0f4fa] transition-colors">
                            <td className="p-4 font-mono font-bold text-[#7b8a9e]">{item.id}</td>
                            <td className="p-4 font-bold text-[#4a5568]">{item.date}</td>
                            <td className="p-4 font-bold text-[#1e2a3a] max-w-sm truncate" title={item.title}>{item.title}</td>
                            <td className="p-4">
                              <span className="px-2 py-0.5 bg-[#e8eef6] text-[#2c5ea0] font-bold rounded text-[9px] border border-[#b8c6d9]">HĐ {item.group}</span>
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => alert(`Đang tải tệp tin biên bản quét gốc ${item.id} dạng scan PDF từ hệ thống lưu trữ...`)}
                                className="px-3 py-1 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] text-[10px] font-bold uppercase rounded shadow-sm"
                              >
                                Tải văn bản
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: STORAGE ─── */}
        {activeTab === 'storage' && (
          <div className="space-y-6 animate-fade-in">
            {/* Sub-tab selections */}
            <div className="flex border-b border-[#b8c6d9] shrink-0 gap-4 mb-4">
              <button
                onClick={() => setStorageSubTab('stock')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  storageSubTab === 'stock' ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                }`}
              >
                Sổ gốc & Phôi bằng tốt nghiệp
                {storageSubTab === 'stock' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
              </button>
              <button
                onClick={() => setStorageSubTab('requests')}
                className={`pb-3 text-sm font-bold transition-all relative ${
                  storageSubTab === 'requests' ? 'text-[#2c5ea0] font-extrabold' : 'text-[#7b8a9e] hover:text-[#2c5ea0]'
                }`}
              >
                Cấp bản sao & Giấy tờ (Yêu cầu)
                {storageSubTab === 'requests' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2c5ea0]"></div>}
              </button>
            </div>

            {/* Sub-tab 1: Stock list */}
            {storageSubTab === 'stock' && (
              <div className="space-y-8">
                {/* Stock Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {degreeStocks.map(stock => (
                    <div key={stock.id} className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                      <div className="flex justify-between items-center border-b border-[#b8c6d9] pb-3 mb-4">
                        <span className="font-serif font-bold text-base text-[#1e2a3a]">Khóa tốt nghiệp năm {stock.year}</span>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          stock.remaining > 0 ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-red-100 text-red-700 border border-red-300'
                        }`}>
                          {stock.remaining > 0 ? `Còn phôi: ${stock.remaining}` : 'Hết phôi bằng'}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-3 bg-[#f0f4fa] rounded-2xl border border-[#b8c6d9]">
                          <p className="text-[10px] text-[#7b8a9e] font-bold uppercase">Tổng phôi</p>
                          <p className="text-xl font-bold text-[#1e2a3a] mt-1">{stock.total}</p>
                        </div>
                        <div className="p-3 bg-[#f0f4fa] rounded-2xl border border-[#b8c6d9]">
                          <p className="text-[10px] text-green-700 font-bold uppercase">Đã cấp</p>
                          <p className="text-xl font-bold text-green-800 mt-1">{stock.issued}</p>
                        </div>
                        <div className="p-3 bg-[#f0f4fa] rounded-2xl border border-[#b8c6d9]">
                          <p className="text-[10px] text-red-700 font-bold uppercase">Hỏng/Hủy</p>
                          <p className="text-xl font-bold text-red-800 mt-1">{stock.damaged}</p>
                        </div>
                        <div className="p-3 bg-[#f0f4fa] rounded-2xl border border-[#b8c6d9]">
                          <p className="text-[10px] text-amber-700 font-bold uppercase">Còn lại</p>
                          <p className="text-xl font-bold text-[#2c5ea0] mt-1">{stock.remaining}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Issuance Registry Logs */}
                <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
                  <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                    Sổ gốc cấp phát bằng hoàn thành chương trình Mầm non
                  </h3>
                  <div className="overflow-x-auto max-h-[450px] main-scrollbar">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                        <tr>
                          <th className="p-4">Số hiệu</th>
                          <th className="p-4">Họ và tên học sinh</th>
                          <th className="p-4">Ngày sinh</th>
                          <th className="p-4">Khóa thi</th>
                          <th className="p-4">Số hiệu Bằng TN</th>
                          <th className="p-4">Người nhận bằng</th>
                          <th className="p-4">Ngày nhận</th>
                          <th className="p-4 text-center">Ký nhận</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8eef6]">
                        {filteredAllocations.map(alloc => (
                          <tr key={alloc.id} className="hover:bg-[#f0f4fa] transition-colors">
                            <td className="p-4 font-mono font-bold text-[#7b8a9e]">{alloc.id}</td>
                            <td className="p-4 font-bold text-[#1e2a3a]">{alloc.studentName}</td>
                            <td className="p-4 font-semibold text-[#4a5568]">{alloc.dob}</td>
                            <td className="p-4 text-[#4a5568] font-bold">{alloc.gradYear}</td>
                            <td className="p-4 font-mono text-[#2c5ea0] font-bold">{alloc.serial}</td>
                            <td className="p-4 text-[#4a5568] font-bold">{alloc.recipient}</td>
                            <td className="p-4 text-[#4a5568]">{alloc.date}</td>
                            <td className="p-4 text-center">
                              <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 rounded text-[9px] font-bold uppercase tracking-wider">{alloc.status}</span>
                            </td>
                          </tr>
                        ))}
                        {filteredAllocations.length === 0 && (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-xs font-bold text-gray-500 uppercase tracking-widest">Không tìm thấy bản ghi cấp bằng nào</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Requests Queue */}
            {storageSubTab === 'requests' && (
              <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm animate-fade-in">
                <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5">
                  Hồ sơ yêu cầu xin cấp bản sao học bạ & giấy tờ hành chính
                </h3>
                
                <div className="overflow-x-auto max-h-[450px] main-scrollbar">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-[#f0f4fa] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">
                      <tr>
                        <th className="p-4">Mã hồ sơ</th>
                        <th className="p-4">Học sinh / Lớp</th>
                        <th className="p-4">Loại văn bản xin cấp</th>
                        <th className="p-4">Ngày yêu cầu</th>
                        <th className="p-4">Lý do giải trình</th>
                        <th className="p-4 text-center">Tình trạng</th>
                        <th className="p-4 text-center">Tác vụ xử lý</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8eef6]">
                      {filteredRequests.map(req => (
                        <tr key={req.id} className="hover:bg-[#f0f4fa] transition-colors">
                          <td className="p-4 font-mono font-bold text-[#7b8a9e]">{req.id}</td>
                          <td className="p-4">
                            <div className="font-bold text-[#1e2a3a]">{req.studentName}</div>
                            <div className="text-[10px] text-gray-400 font-bold">Lớp: {req.className}</div>
                          </td>
                          <td className="p-4 font-bold text-[#2c5ea0]">{req.type}</td>
                          <td className="p-4 text-[#4a5568]">{req.date}</td>
                          <td className="p-4 text-[#4a5568] max-w-xs truncate" title={req.reason}>{req.reason}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              req.status === 'Chờ xử lý' ? 'bg-amber-50 text-amber-700 border-amber-300' :
                              req.status === 'Đã cấp' ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => setActiveRequest(req)}
                              className="px-4 py-1.5 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] text-[10px] font-bold uppercase rounded-lg shadow-sm"
                            >
                              {req.status === 'Chờ xử lý' ? 'Xem & Xử lý' : 'Xem lại'}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredRequests.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-xs font-bold text-gray-500 uppercase tracking-widest">Không có yêu cầu nào trong danh sách</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 5: BULLETIN ─── */}
        {activeTab === 'bulletin' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-fade-in">
            {/* Editor composer Form (1/3 width) */}
            <div className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm">
              <h3 className="text-base font-serif font-bold text-[#1e2a3a] uppercase tracking-wider border-b border-[#b8c6d9] pb-3 mb-5 flex items-center gap-1.5">
                <Edit size={16} className="text-[#2c5ea0]" />
                Soạn thông báo bảng tin trường
              </h3>
              
              <form onSubmit={handlePublishAnnouncement} className="space-y-4 font-sans text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Tiêu đề thông báo *</label>
                  <input 
                    type="text" 
                    value={bulletinForm.title}
                    onChange={e => setBulletinForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nhập tiêu đề thông báo ngắn gọn..." 
                    className="w-full px-4 py-2.5 bg-[#ffffff] border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Nội dung chi tiết *</label>
                  <textarea 
                    rows={6}
                    value={bulletinForm.content}
                    onChange={e => setBulletinForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Soạn thảo nội dung thông báo đầy đủ của văn phòng..." 
                    className="w-full px-4 py-2.5 bg-[#ffffff] border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Đối tượng nhận tin</label>
                    <select 
                      value={bulletinForm.scope}
                      onChange={e => setBulletinForm(prev => ({ ...prev, scope: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                    >
                      <option value="Tất cả">Tất cả</option>
                      <option value="Giáo viên">Giáo viên</option>
                      <option value="Học sinh & Phụ huynh">Học sinh & Phụ huynh</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Độ khẩn cấp</label>
                    <select 
                      value={bulletinForm.priority}
                      onChange={e => setBulletinForm(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                    >
                      <option value="Thường">Bình thường</option>
                      <option value="Khẩn">Thông báo khẩn</option>
                    </select>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2c5ea0] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#5c2e2e] shadow-[2px_2px_0px_#7b8a9e] active:shadow-none active:translate-y-0.5 transition-all mt-4"
                >
                  <Send size={14} /> Đăng bảng tin trường
                </button>
              </form>
            </div>

            {/* List of Published Announcements (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {announcements.map(ann => (
                <div key={ann.id} className="bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6 shadow-sm relative group">
                  <div className="flex justify-between items-start border-b border-[#b8c6d9] pb-3 mb-4">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                        ann.priority === 'Khẩn' ? 'bg-red-600 text-white' : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        Hạng mục: {ann.priority}
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#1e2a3a] mt-2 leading-snug">{ann.title}</h4>
                    </div>
                    <button 
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="text-gray-400 hover:text-red-700 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Gỡ tin"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-xs text-[#4a5568] leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  <div className="mt-6 pt-4 border-t border-[#e8eef6] flex justify-between text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider font-mono">
                    <span>Đăng ngày: {ann.date}</span>
                    <span>Phạm vi: {ann.scope}</span>
                    <span>Tác giả: {ann.author}</span>
                  </div>
                </div>
              ))}
              {announcements.length === 0 && (
                <div className="text-center py-12 text-xs font-bold text-gray-500 uppercase tracking-widest bg-white border-[3px] border-double border-[#b8c6d9] rounded-3xl p-6">Bảng tin trường hiện chưa có thông báo nào</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL: SOẠN CÔNG VĂN MỚI (DISPATCH CREATE) ─── */}
      {modalOpen === 'create_doc' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Nhập hồ sơ công văn số" subtitle="Lưu trữ công văn đến, đi và luân chuyển trình ký" width="max-w-3xl" centerY>
          <form onSubmit={handleSaveDocument} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Phân loại văn bản *</label>
                <select 
                  value={docForm.docType}
                  onChange={e => handleDocTypeChangeInForm(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                >
                  <option value="Văn bản Đến">Văn bản Đến (Từ bên ngoài gửi tới)</option>
                  <option value="Văn bản Đi">Văn bản Đi (Nhà trường ban hành)</option>
                  <option value="Trình ký Nội bộ">Trình ký Nội bộ (Hồ sơ cần BGH ký)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Số / Ký hiệu *</label>
                <input 
                  type="text" 
                  value={docForm.symbol}
                  onChange={e => setDocForm(prev => ({ ...prev, symbol: e.target.value }))}
                  placeholder="VD: 146/QĐ-thAH" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Cơ quan ban hành / Nơi nhận *</label>
                <input 
                  type="text" 
                  value={docForm.issuingBody}
                  onChange={e => setDocForm(prev => ({ ...prev, issuingBody: e.target.value }))}
                  placeholder="VD: Sở Giáo dục và Đào tạo Tiền Giang" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Độ khẩn</label>
                  <select 
                    value={docForm.urgency}
                    onChange={e => setDocForm(prev => ({ ...prev, urgency: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Khẩn">Khẩn</option>
                    <option value="Hỏa tốc">Hỏa tốc</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Độ mật</label>
                  <select 
                    value={docForm.security}
                    onChange={e => setDocForm(prev => ({ ...prev, security: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  >
                    <option value="Thường">Thường</option>
                    <option value="Mật">Mật</option>
                    <option value="Tối mật">Tối mật</option>
                  </select>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Trích yếu nội dung văn bản *</label>
                <textarea 
                  rows={3} 
                  value={docForm.trichYeu}
                  onChange={e => setDocForm(prev => ({ ...prev, trichYeu: e.target.value }))}
                  placeholder="Mô tả tóm tắt chỉ thị hoặc mục đích văn bản..." 
                  className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] resize-none"
                />
              </div>
            </div>

            {/* Routing Multi-select Selector */}
            <div className="bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2 font-mono">
                Luồng phân phối xử lý (Routing Workflow)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  'Ban Giám Hiệu (Để biết)',
                  'Tổ Toán - Tin (Thực hiện)',
                  'Tổ Ngữ văn (Thực hiện)',
                  'Đoàn Thanh niên (Thực hiện)',
                  'Đội Bảo vệ (Thực hiện)',
                  'Bếp ăn Bán trú (Thực hiện)'
                ].map(role => {
                  const isChecked = docForm.routingRoles.includes(role);
                  return (
                    <label key={role} className="flex items-center gap-2 font-bold text-[#4a5568] cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setDocForm(prev => {
                            const newRoles = isChecked 
                              ? prev.routingRoles.filter(r => r !== role)
                              : [...prev.routingRoles, role];
                            return { ...prev, routingRoles: newRoles };
                          });
                        }}
                        className="w-4 h-4 accent-[#2c5ea0] rounded"
                      />
                      <span>{role}</span>
                    </label>
                  );
                })}
              </div>
              <p className="text-[10px] text-gray-500 italic mt-3">* Hệ thống sẽ tự động gửi thông báo nhắc việc đến tài khoản tương ứng.</p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#2c5ea0] hover:bg-[#5c2e2e] text-white text-xs font-bold uppercase rounded-lg shadow-sm"
              >
                Lưu vào Sổ công văn
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: LẬP LỊCH HỌP HỘI ĐỒNG (SCHEDULE CREATE) ─── */}
      {modalOpen === 'create_sch' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Thiết lập sự kiện & Lịch họp" subtitle="Tổ chức họp Hội đồng sư phạm hoặc họp BGH giao ban tuần" width="max-w-2xl" centerY>
          <form onSubmit={handleSaveSchedule} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-2 gap-6 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Tiêu đề lịch họp *</label>
                <input 
                  type="text" 
                  value={schForm.title}
                  onChange={e => setSchForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="VD: Họp Hội đồng Sư phạm sơ kết tháng 5" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Người chủ trì cuộc họp *</label>
                <input 
                  type="text" 
                  value={schForm.leader}
                  onChange={e => setSchForm(prev => ({ ...prev, leader: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Địa điểm họp *</label>
                <input 
                  type="text" 
                  value={schForm.location}
                  onChange={e => setSchForm(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 col-span-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Ngày tổ chức</label>
                  <input 
                    type="text" 
                    value={schForm.date}
                    onChange={e => setSchForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Giờ bắt đầu</label>
                  <input 
                    type="text" 
                    value={schForm.startTime}
                    onChange={e => setSchForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Giờ kết thúc</label>
                  <input 
                    type="text" 
                    value={schForm.endTime}
                    onChange={e => setSchForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#2e6b8a] hover:bg-[#1e4f6a] text-white text-xs font-bold uppercase rounded-lg shadow-sm"
              >
                Đăng lịch họp tuần
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: LẬP PHIẾU GIẤY ĐI ĐƯỜNG / GIỚI THIỆU (QUICK PERMITS GENERATOR) ─── */}
      {modalOpen === 'dispatch_permits' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Thiết lập Giấy đi đường / Giới thiệu" subtitle="Mẫu hành chính hỗ trợ giáo viên cán bộ đi công tác" width="max-w-2xl" centerY>
          <form onSubmit={handleSaveTravelPaper} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-2 gap-6 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Chọn loại giấy *</label>
                <select 
                  value={travelForm.type}
                  onChange={e => setTravelForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                >
                  <option value="Giấy Giới Thiệu">Giấy Giới Thiệu</option>
                  <option value="Giấy Đi Đường">Giấy Đi Đường (Kèm thanh toán)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Họ tên cán bộ cử đi *</label>
                <input 
                  type="text" 
                  value={travelForm.name}
                  onChange={e => setTravelForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="VD: Thầy Nguyễn Hữu D" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Chức vụ / Tổ bộ môn *</label>
                <input 
                  type="text" 
                  value={travelForm.role}
                  onChange={e => setTravelForm(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="VD: Tổ trưởng tổ Toán - Tin" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Nơi đến công tác *</label>
                <input 
                  type="text" 
                  value={travelForm.destination}
                  onChange={e => setTravelForm(prev => ({ ...prev, destination: e.target.value }))}
                  placeholder="VD: Trường th Chuyên Tiền Giang" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Mục đích / Nhiệm vụ cử đi *</label>
                <input 
                  type="text" 
                  value={travelForm.purpose}
                  onChange={e => setTravelForm(prev => ({ ...prev, purpose: e.target.value }))}
                  placeholder="VD: Coi thi chọn học sinh giỏi cấp tỉnh năm học 2025-2026..." 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Ngày đi công tác</label>
                  <input 
                    type="text" 
                    value={travelForm.startDate}
                    onChange={e => setTravelForm(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Ngày về dự kiến</label>
                  <input 
                    type="text" 
                    value={travelForm.endDate}
                    onChange={e => setTravelForm(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
              </div>

              {travelForm.type === 'Giấy Đi Đường' && (
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Phương tiện di chuyển</label>
                  <input 
                    type="text" 
                    value={travelForm.vehicle}
                    onChange={e => setTravelForm(prev => ({ ...prev, vehicle: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#1e2a3a] text-white text-xs font-bold uppercase rounded-lg shadow-sm"
              >
                Lập văn bản hành chính
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: CẤP PHÁT BẰNG TỐT NGHIỆP TRÊN SỔ GỐC (DEGREE ALLOCATION) ─── */}
      {modalOpen === 'create_degree' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Sổ gốc cấp phát bằng tốt nghiệp" subtitle="Quy trình số hóa quản lý phôi bằng & người nhận thực" width="max-w-2xl" centerY>
          <form onSubmit={handleIssueDegree} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-2 gap-6 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Khóa tốt nghiệp *</label>
                <select 
                  value={degreeForm.gradYear}
                  onChange={e => setDegreeForm(prev => ({ ...prev, gradYear: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                >
                  <option value="2026">Niên khóa tốt nghiệp 2026</option>
                  <option value="2025">Niên khóa tốt nghiệp 2025</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Số hiệu Bằng tốt nghiệp *</label>
                <input 
                  type="text" 
                  value={degreeForm.serial}
                  onChange={e => setDegreeForm(prev => ({ ...prev, serial: e.target.value }))}
                  placeholder="VD: A-2026-9875" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Họ tên học sinh được cấp *</label>
                <input 
                  type="text" 
                  value={degreeForm.studentName}
                  onChange={e => setDegreeForm(prev => ({ ...prev, studentName: e.target.value }))}
                  placeholder="Nhập họ và tên học sinh..." 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Ngày tháng năm sinh học sinh</label>
                <input 
                  type="text" 
                  value={degreeForm.dob}
                  onChange={e => setDegreeForm(prev => ({ ...prev, dob: e.target.value }))}
                  placeholder="VD: 15/10/2018" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Đại diện người nhận bằng *</label>
                <input 
                  type="text" 
                  value={degreeForm.recipient}
                  onChange={e => setDegreeForm(prev => ({ ...prev, recipient: e.target.value }))}
                  placeholder="VD: Bố đẻ nhận thay / Học sinh tự nhận..." 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Ngày cấp phát thực tế</label>
                <input 
                  type="text" 
                  value={degreeForm.date}
                  onChange={e => setDegreeForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold uppercase rounded-lg shadow-sm"
              >
                Xác nhận cấp phát bằng
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: XỬ LÝ PHÊ DUYỆT TICKET CẤP BẢN SAO / GIẤY TỜ ─── */}
      {activeRequest && (
        <ModalBase isOpen={true} onClose={() => setActiveRequest(null)} title="Phê duyệt đơn đề nghị hành chính" subtitle="Hồ sơ xử lý xin cấp sao lục học bạ hoặc xác nhận" width="max-w-2xl" centerY>
          <div className="p-6 space-y-6 text-xs font-sans">
            <div className="bg-[#f0f4fa] p-5 border border-[#b8c6d9] rounded-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-bold uppercase text-[9px] text-[#7b8a9e]">MÃ TICKET HỒ SƠ</p>
                  <p className="font-mono font-bold text-sm text-[#1e2a3a] mt-1">{activeRequest.id}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold uppercase text-[9px] text-[#7b8a9e]">NGÀY ĐĂNG KÝ</p>
                  <p className="font-bold text-[#1e2a3a] mt-1">{activeRequest.date}</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-dashed border-[#b8c6d9] grid grid-cols-2 gap-4 text-xs font-bold">
                <div>Học sinh yêu cầu: <span className="text-[#1e2a3a] font-extrabold">{activeRequest.studentName}</span></div>
                <div>Lớp hiện tại: <span className="text-[#1e2a3a] font-extrabold">{activeRequest.className}</span></div>
                <div className="col-span-2">Nghiệp vụ xin cấp: <span className="text-[#2c5ea0] font-extrabold">{activeRequest.type}</span></div>
                <div className="col-span-2">Lý do giải trình: <p className="font-medium italic text-gray-600 mt-1">"{activeRequest.reason}"</p></div>
              </div>
            </div>

            {activeRequest.status === 'Chờ xử lý' ? (
              <div className="space-y-4">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest font-mono">Giải trình từ chối (Chỉ điền khi bác bỏ đơn)</label>
                <textarea 
                  value={rejectReasonText}
                  onChange={e => setRejectReasonText(e.target.value)}
                  placeholder="Ghi rõ lý do như: Học sinh chưa nộp học bạ gốc, hoặc thông tin lớp học không chính xác..."
                  className="w-full px-4 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] resize-none"
                  rows={2}
                />
                
                <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
                  <button 
                    onClick={() => handleProcessRequest('Từ chối')}
                    disabled={!rejectReasonText.trim()}
                    className={`px-5 py-2 text-xs font-bold uppercase rounded-lg ${
                      rejectReasonText.trim() ? 'bg-red-700 hover:bg-red-800 text-white' : 'bg-red-200 text-red-500 cursor-not-allowed'
                    }`}
                  >
                    Bác bỏ từ chối
                  </button>
                  <button 
                    onClick={() => handleProcessRequest('Đã cấp')}
                    className="px-6 py-2 bg-green-700 hover:bg-green-800 text-white text-xs font-bold uppercase rounded-lg shadow-sm"
                  >
                    Duyệt & In chứng nhận
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 bg-white p-4 border border-[#b8c6d9] rounded-2xl">
                <div className="flex items-center gap-2 text-green-700 font-bold uppercase text-[10px]">
                  <CheckCircle2 size={16} /> Hồ sơ đã được hoàn thành đóng dấu
                </div>
                <p className="text-xs text-gray-500">
                  Đơn đề nghị cấp giấy tờ này đã được xử lý thành công vào ngày <strong>{activeRequest.processedDate || '21/06/2026'}</strong>.
                </p>
                {activeRequest.status === 'Từ chối' && (
                  <p className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                    Lý do từ chối: {activeRequest.rejectReason}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
                  {activeRequest.status === 'Đã cấp' && (
                    <button
                      onClick={() => {
                        alert(`Đang khởi động cổng in ấn mẫu phôi số chứng nhận hành chính cho học sinh ${activeRequest.studentName}...`);
                      }}
                      className="px-4 py-2 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center gap-2 hover:bg-gray-800"
                    >
                      <Printer size={14} /> In bản sao ngay
                    </button>
                  )}
                  <button 
                    onClick={() => setActiveRequest(null)}
                    className="px-4 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg"
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            )}
          </div>
        </ModalBase>
      )}

      {/* ─── MODAL: THÊM YÊU CẦU CẤP PHÁT MỚI (CREATE REQUEST) ─── */}
      {modalOpen === 'create_request' && (
        <ModalBase isOpen={true} onClose={() => setModalOpen(null)} title="Tạo yêu cầu cấp phát giấy tờ" subtitle="Nhập yêu cầu cấp học bạ, thẻ học sinh hoặc giấy xác nhận học sinh" width="max-w-2xl" centerY>
          <form onSubmit={handleSaveRequest} className="p-6 space-y-6 text-xs font-sans">
            <div className="grid grid-cols-2 gap-6 bg-white p-5 border border-[#b8c6d9] rounded-2xl shadow-inner">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Tên học sinh *</label>
                <input 
                  type="text" 
                  value={requestForm.studentName}
                  onChange={e => setRequestForm(prev => ({ ...prev, studentName: e.target.value }))}
                  placeholder="Nhập tên học sinh..." 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Lớp học *</label>
                <input 
                  type="text" 
                  value={requestForm.className}
                  onChange={e => setRequestForm(prev => ({ ...prev, className: e.target.value }))}
                  placeholder="VD: 10A1" 
                  className="w-full px-3 py-2.5 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Loại giấy tờ *</label>
                <select 
                  value={requestForm.type}
                  onChange={e => setRequestForm(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a]"
                >
                  <option value="Bản sao Học bạ">Bản sao Học bạ</option>
                  <option value="Thẻ học sinh cấp lại">Thẻ học sinh cấp lại</option>
                  <option value="Giấy xác nhận học sinh">Giấy xác nhận học sinh</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5 font-mono">Lý do yêu cầu *</label>
                <textarea 
                  rows={3} 
                  value={requestForm.reason}
                  onChange={e => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Nhập lý do chi tiết..." 
                  className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl font-bold text-[#1e2a3a] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                type="button" 
                onClick={() => setModalOpen(null)}
                className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase rounded-lg"
              >
                Hủy bỏ
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-[#2c5ea0] hover:bg-[#5c2e2e] text-white text-xs font-bold uppercase rounded-lg shadow-sm"
              >
                Lưu yêu cầu
              </button>
            </div>
          </form>
        </ModalBase>
      )}

      {/* ─── MODAL: XEM VÀ IN GIẤY TỜ HÀNH CHÍNH CẤP PHÁT (TRAVEL PAPERS PRINT SIMULATOR) ─── */}
      {activeTravelPaper && (
        <ModalBase isOpen={true} onClose={() => setActiveTravelPaper(null)} title="Bản In Văn Bản Hành Chính" subtitle="Mẫu in chính thống phục vụ lưu trữ văn phòng" width="max-w-2xl" centerY>
          <div className="p-8 space-y-6 bg-white border-2 border-dashed border-[#7b8a9e] m-4 rounded-xl font-sans text-xs text-[#1e2a3a] select-text">
            {/* Header */}
            <div className="grid grid-cols-2 gap-4 border-b border-black pb-4 mb-4 uppercase font-bold tracking-tight">
              <div>
                <p className="text-gray-900 tracking-wider">SỞ GD&ĐT TỈNH TIỀN GIANG</p>
                <p className="text-gray-900 border-b border-gray-900 pb-1 w-fit">TRƯỜNG MẦM NON AN HỮU</p>
                <p className="normal-case text-gray-500 font-mono mt-1 font-bold">Số: {activeTravelPaper.id}/thAH</p>
              </div>
              <div className="text-center">
                <p className="text-gray-900 tracking-wide text-[10px]">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="text-gray-900 underline underline-offset-4 decoration-1 lowercase first-letter:uppercase">Độc lập - Tự do - Hạnh phúc</p>
                <p className="normal-case text-gray-500 font-semibold italic mt-4">Cái Bè, ngày {activeTravelPaper.dateCreated}</p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center my-6 space-y-1">
              <h3 className="font-bold text-sm tracking-wide uppercase text-black font-sans">
                {activeTravelPaper.type}
              </h3>
              <div className="w-16 h-[1px] bg-black mx-auto"></div>
            </div>

            {/* Document Body */}
            {activeTravelPaper.type === 'Giấy Giới Thiệu' ? (
              <div className="space-y-3 leading-relaxed text-justify">
                <p className="font-bold">TRƯỜNG TRUNG HỌC PHỔ THÔNG AN HỮU TRÂN TRỌNG GIỚI THIỆU:</p>
                <p>- Ông/Bà: <strong>{activeTravelPaper.name}</strong></p>
                <p>- Chức vụ: <strong>{activeTravelPaper.role}</strong></p>
                <p>- Được cử đến công tác tại: <strong>{activeTravelPaper.destination}</strong></p>
                <p>- Về việc nhiệm vụ: <strong>{activeTravelPaper.purpose}</strong></p>
                <p>- Thời gian công tác: Từ ngày <strong>{activeTravelPaper.startDate}</strong> đến ngày <strong>{activeTravelPaper.endDate}</strong>.</p>
                <p>Đề nghị quý cơ quan, đơn vị tạo điều kiện giúp đỡ để cán bộ nêu trên hoàn thành nhiệm vụ.</p>
              </div>
            ) : (
              <div className="space-y-3 leading-relaxed text-justify">
                <p className="font-bold">TRƯỜNG TRUNG HỌC PHỔ THÔNG AN HỮU CẤP GIẤY ĐI ĐƯỜNG CHO:</p>
                <p>- Ông/Bà: <strong>{activeTravelPaper.name}</strong></p>
                <p>- Chức vụ: <strong>{activeTravelPaper.role}</strong></p>
                <p>- Đi công tác tại: <strong>{activeTravelPaper.destination}</strong></p>
                <p>- Theo quyết định cử đi công tác số: <strong>{activeTravelPaper.id}/thAH</strong></p>
                <p>- Nhiệm vụ chi tiết: <strong>{activeTravelPaper.purpose}</strong></p>
                <p>- Thời gian công tác: Từ ngày <strong>{activeTravelPaper.startDate}</strong> đến ngày <strong>{activeTravelPaper.endDate}</strong>.</p>
                <p>- Phương tiện di chuyển: <strong>{activeTravelPaper.vehicle}</strong></p>
                <p>Giấy đi đường này được cấp làm căn cứ thanh toán chế độ công tác phí theo quy định hiện hành.</p>
              </div>
            )}

            {/* Signatures & Seal */}
            <div className="grid grid-cols-2 gap-4 mt-12 pt-6 border-t border-dashed border-gray-300">
              <div className="text-center space-y-12">
                <p className="font-bold uppercase text-[9px]">CƠ QUAN NƠI ĐẾN XÁC NHẬN</p>
                <p className="text-[9px] text-gray-400 italic">(Ký tên và đóng dấu xác nhận ngày đến, ngày đi)</p>
              </div>
              <div className="text-center relative">
                <p className="font-bold uppercase text-black text-[9px]">HIỆU TRƯỞNG</p>
                <p className="text-[9px] text-gray-500 italic mt-0.5">(Ký, đóng dấu số đỏ)</p>
                
                <div className="w-16 h-16 border-2 border-red-600 rounded-full flex items-center justify-center text-center text-red-600 font-sans font-bold text-[7px] uppercase tracking-tighter opacity-80 rotate-12 mx-auto mt-4 relative">
                  <span className="absolute inset-2 border border-red-600 border-dashed rounded-full pointer-events-none"></span>
                  th<br />AN HỮU
                </div>
                <p className="font-bold text-[#1e2a3a] mt-2 font-serif">Nguyễn Văn Hiệu</p>
              </div>
            </div>

            {/* Print Trigger Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-300">
              <button 
                type="button" 
                onClick={() => {
                  alert("Đang gửi chỉ thị in giấy tờ đến hệ thống máy in văn phòng hành chính Mầm non An Hữu qua mạng LAN...");
                  setActiveTravelPaper(null);
                }}
                className="px-5 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded hover:bg-gray-800"
              >
                Gửi lệnh in
              </button>
              <button 
                type="button" 
                onClick={() => setActiveTravelPaper(null)}
                className="px-4 py-2 border border-gray-300 text-[10px] font-bold uppercase rounded hover:bg-gray-100"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </ModalBase>
      )}

      {/* ─── VOID DIALOG FOR DISPATCH ─── */}
      {isVoidOpen && docToVoid && (
        <ModalBase isOpen={isVoidOpen} onClose={() => setIsVoidOpen(false)} title="Thu Hồi & Hủy Hiệu Lực Công Văn" subtitle="Cập nhật tình trạng thu hồi văn bản lưu trữ" width="max-w-md" centerY>
          <div className="p-6 space-y-4 text-xs font-sans">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
              <ShieldAlert className="w-6 h-6 text-red-700 shrink-0" />
              <div>
                <p className="text-xs font-bold text-red-900 uppercase tracking-wider font-sans">Quy trình pháp lý lưu trữ</p>
                <p className="text-[11px] text-red-700 font-semibold leading-relaxed mt-1">
                  Số hiệu công văn <strong>{docToVoid.symbol}</strong> sẽ lập tức đổi trạng thái sang "ĐÃ THU HỒI", gạch chéo hiển thị đỏ trong sổ công văn số của nhà trường. Lý do hủy giải trình sẽ được lưu vĩnh viễn trong nhật ký hành chính.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2 font-mono">Lý do thu hồi / hủy hiệu lực *</label>
              <textarea 
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Ví dụ: Công văn hết hiệu lực thi hành theo chỉ thị mới của Bộ Giáo dục, hoặc ghi nhận sai số hiệu sai lệch cơ quan..."
                className="w-full px-4 py-3 bg-[#ffffff] border-2 border-[#b8c6d9] focus:border-red-600 focus:outline-none rounded-xl text-xs font-bold text-[#1e2a3a] font-sans min-h-[90px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setIsVoidOpen(false)}
                className="px-4 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase tracking-widest text-[#4a5568] rounded-lg"
              >
                Quay lại
              </button>
              <button 
                onClick={handleConfirmVoidDoc}
                disabled={!voidReason.trim()}
                className={`px-5 py-2 text-white text-xs font-bold uppercase tracking-widest rounded-lg flex items-center transition ${
                  voidReason.trim() ? 'bg-red-700 hover:bg-red-900 cursor-pointer' : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                Xác nhận thu hồi
              </button>
            </div>
          </div>
        </ModalBase>
      )}
    </main>
  );
};
