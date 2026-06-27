import React, { useState, useEffect } from 'react';
import { 
  Filter, Plus, Search, CheckCircle2, AlertTriangle, Stethoscope, 
  Clock, ShieldCheck, HeartPulse, Pill, SearchX, Printer, Ban, 
  ShieldAlert, Eye, FileText, CheckCircle, Activity, Phone, 
  Download, Calendar, Users, AlertCircle, Info, Syringe, Heart, Sparkles, BookOpen, Edit, Trash
} from 'lucide-react';
import { 
  MedicalIncidentModal, 
  HealthRecordModal, 
  InventoryItemModal, 
  EpidemicCaseModal, 
  InsuranceCardModal, 
  ReportGenerationModal 
} from '../ui/HealthModals';
import { ActionMenu } from '../ui/ActionMenu';
import { ModalBase } from '../ui/Modals';
import { FilterSelect } from '../ui/BaseInputs';
import { Pagination } from '../ui/Pagination';
import { 
  getHealthRecords, getHealthInventory, getHealthIncidents, 
  saveHealthIncident, saveHealthRecord, deleteHealthRecord,
  saveHealthInventoryItem, deleteHealthInventoryItem, deleteHealthIncident,
  HealthRecord, HealthInventoryItem, HealthIncident 
} from '../../services/dbService';

interface HealthPanelProps {
  activeTab: 'dashboard' | 'records' | 'incidents' | 'inventory' | 'epidemic' | 'insurance' | 'reports';
}

export const HealthPanel: React.FC<HealthPanelProps> = ({ activeTab }) => {
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [isEpidemicModalOpen, setIsEpidemicModalOpen] = useState(false);
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCase, setEditingCase] = useState<any>(null);
  const [editingInsurance, setEditingInsurance] = useState<any>(null);

  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Filters
  const [classFilter, setClassFilter] = useState('All');
  const [invCategoryFilter, setInvCategoryFilter] = useState('All');
  const [invStatusFilter, setInvStatusFilter] = useState('All');
  const [incidentClassFilter, setIncidentClassFilter] = useState('All');
  const [incidentStatusFilter, setIncidentStatusFilter] = useState('All');
  const [insuranceStatusFilter, setInsuranceStatusFilter] = useState('All');
  const [epidemicClassFilter, setEpidemicClassFilter] = useState('All');

  // Core Datasets
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [inventoryData, setInventoryData] = useState<HealthInventoryItem[]>([]);
  const [incidents, setIncidents] = useState<HealthIncident[]>([]);
  const [loading, setLoading] = useState(true);

  // Interaction States
  const [selectedRecord, setSelectedRecord] = useState<HealthRecord | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<HealthIncident | null>(null);
  const [printedIncident, setPrintedIncident] = useState<HealthIncident | null>(null);
  const [voidTargetId, setVoidTargetId] = useState<string | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoidOpen, setIsVoidOpen] = useState(false);
  
  // Call simulation overlay
  const [activeCall, setActiveCall] = useState<{ name: string; role: string; phone: string } | null>(null);
  
  // Export simulation state
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  // Mock Epidemic & Vaccine Data (made reactive)
  const [epidemics, setEpidemics] = useState([
    { id: 'EPI-001', name: 'Trần Thảo Nguyên', class: 'Mầm 1', disease: 'Đau mắt đỏ', onsetDate: '24/06/2026', status: 'Đang điều trị tại nhà' },
    { id: 'EPI-002', name: 'Lê Thảo Vy', class: 'Mầm 1', disease: 'Cúm A / Sốt', onsetDate: '25/06/2026', status: 'Đang điều trị tại nhà' },
    { id: 'EPI-003', name: 'Nguyễn Lâm Anh', class: 'Mầm 1', disease: 'Cúm A / Sốt', onsetDate: '26/06/2026', status: 'Cách ly theo dõi' },
    { id: 'EPI-004', name: 'Vũ Hoàng Bách', class: 'Lá 1', disease: 'Tay chân miệng', onsetDate: '22/06/2026', status: 'Đã khỏi bệnh - Đi học lại' },
    { id: 'EPI-005', name: 'Bùi Gia Huy', class: 'Nhà trẻ 2', disease: 'Sốt xuất huyết', onsetDate: '20/06/2026', status: 'Đang điều trị tại bệnh viện' }
  ]);

  const vaccineCoverage = [
    { grade: 'Khối Nhà Trẻ', vaccine: 'Sởi - Quai bị - Rubella (MMR)', total: 120, vaccinated: 116, rate: 96.6 },
    { grade: 'Khối Mầm (3 tuổi)', vaccine: 'Bạch hầu - Ho gà - Uốn ván - Bại liệt (5 trong 1)', total: 115, vaccinated: 110, rate: 95.6 },
    { grade: 'Khối Chồi (4 tuổi)', vaccine: 'Viêm não Nhật Bản', total: 110, vaccinated: 104, rate: 94.5 },
    { grade: 'Khối Lá (5 tuổi)', vaccine: 'Cúm mùa định kỳ', total: 105, vaccinated: 88, rate: 83.8 }
  ];

  const workSchedule = [
    { id: 'SCH-001', title: 'Khám sức khỏe định kỳ Khối 1 & 2', date: '28/06/2026', time: '08:00 - 11:30', status: 'Đã lên lịch', type: 'Định kỳ' },
    { id: 'SCH-002', title: 'Tiêm chủng vắc xin Sởi bổ sung', date: '05/07/2026', time: '08:00 - 16:30', status: 'Đã lên lịch', type: 'Tiêm chủng' },
    { id: 'SCH-003', title: 'Phun thuốc diệt muỗi phòng Sốt xuất huyết', date: '12/07/2026', time: '17:00 - 19:30', status: 'Chờ duyệt', type: 'Phòng dịch' },
    { id: 'SCH-004', title: 'Tập huấn kỹ năng sơ cứu sơ bộ cho GVCN', date: '20/07/2026', time: '14:00 - 16:30', status: 'Đã lên lịch', type: 'Tập huấn' }
  ];

  // Dynamic Page Header Info
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'records':
        return {
          title: 'Hồ Sơ Sức Khỏe',
          description: 'Quản lý hồ sơ bệnh lý, thể trạng và chỉ số BMI của học sinh',
          btn1Label: 'Xuất Excel',
          btn2Label: 'Thêm Hồ Sơ',
          onBtn1: () => triggerExportSimulation('Báo cáo Excel Hồ sơ Sức khỏe'),
          onBtn2: () => { setEditingRecord(null); setIsRecordModalOpen(true); }
        };
      case 'incidents':
        return {
          title: 'Nhật Ký Khám/Sơ Cứu',
          description: 'Báo cáo chẩn đoán sơ cấp cứu hằng ngày và cấp phát thuốc',
          btn1Label: 'Xuất Báo Cáo',
          btn2Label: 'Ghi Nhận Sơ Cứu',
          onBtn1: () => triggerExportSimulation('Báo cáo Nhật ký Sơ cấp cứu'),
          onBtn2: () => setIsIncidentModalOpen(true)
        };
      case 'inventory':
        return {
          title: 'Tủ Thuốc & Vật Tư',
          description: 'Quản lý kho thuốc, vật tư y tế và hạn sử dụng tồn kho',
          btn1Label: 'Nhập Phiếu',
          btn2Label: 'Thêm Vật Tư',
          onBtn1: () => triggerExportSimulation('Phiếu nhập kho dược phẩm'),
          onBtn2: () => { setEditingItem(null); setIsInventoryModalOpen(true); }
        };
      case 'epidemic':
        return {
          title: 'Dịch Bệnh & Tiêm Chủng',
          description: 'Theo dõi bệnh truyền nhiễm và bản đồ bao phủ vắc xin học đường',
          btn1Label: 'Lịch Tiêm Chủng',
          btn2Label: 'Khai Báo Ca Bệnh',
          onBtn1: () => triggerExportSimulation('Kế hoạch tiêm chủng vaccine'),
          onBtn2: () => { setEditingCase(null); setIsEpidemicModalOpen(true); }
        };
      case 'insurance':
        return {
          title: 'Bảo Hiểm Y Tế',
          description: 'Giám sát thẻ BHYT học sinh và các chính sách bảo hiểm tai nạn',
          btn1Label: 'Rà Soát Thẻ',
          btn2Label: 'Khai Báo Thẻ BHYT',
          onBtn1: () => triggerExportSimulation('Báo cáo đối soát đóng BHYT'),
          onBtn2: () => { setEditingInsurance(null); setIsInsuranceModalOpen(true); }
        };
      case 'reports':
        return {
          title: 'Liên Lạc & Báo Cáo',
          description: 'Xuất báo cáo định kỳ và danh bạ liên hệ nhanh trong hệ thống',
          btn1Label: 'Tạo Lịch Thống Kê',
          btn2Label: 'Xuất Báo Cáo',
          onBtn1: () => triggerExportSimulation('Lịch biểu thống kê sức khỏe'),
          onBtn2: () => setIsReportModalOpen(true)
        };
      case 'dashboard':
      default:
        return {
          title: 'Tổng Quan Y Tế',
          description: 'Bảng giám sát sức khỏe học sinh và vật tư y tế thời gian thực',
          btn1Label: 'Xuất Báo Cáo',
          btn2Label: 'Ghi Nhận Sơ Cứu',
          onBtn1: () => triggerExportSimulation('Báo cáo Tổng quan Y tế học đường'),
          onBtn2: () => setIsIncidentModalOpen(true)
        };
    }
  };

  const headerInfo = getHeaderInfo();

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Bình thường':
      case 'Tốt':
      case 'Còn hạn':
      case 'Đã đóng':
        return 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9]';
      case 'Sắp hết':
      case 'Sắp hết hạn':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'Hết hạn':
      case 'Chưa đóng':
      case 'Hư Hỏng':
      case 'Đang điều trị tại bệnh viện':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'Đang điều trị tại nhà':
      case 'Cách ly theo dõi':
        return 'bg-[#edf2f9] text-[#4a5568] border border-[#b8c6d9]';
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-200';
    }
  };

  const loadData = async () => {
    try {
      const [records, inventory, incList] = await Promise.all([
        getHealthRecords(),
        getHealthInventory(),
        getHealthIncidents()
      ]);
      setHealthRecords(records);
      setInventoryData(inventory);
      setIncidents(incList);
    } catch (err) {
      console.error("Failed to load health data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchText, classFilter, invCategoryFilter, invStatusFilter, incidentClassFilter, incidentStatusFilter, insuranceStatusFilter, epidemicClassFilter]);

  // Filters and searches
  const filteredRecords = healthRecords.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          rec.id.toLowerCase().includes(searchText.toLowerCase()) ||
                          rec.class.toLowerCase().includes(searchText.toLowerCase()) ||
                          (rec.history && rec.history.toLowerCase().includes(searchText.toLowerCase())) ||
                          (rec.allergy && rec.allergy.toLowerCase().includes(searchText.toLowerCase()));
    const matchesClass = classFilter === 'All' || rec.class === classFilter;
    return matchesSearch && matchesClass;
  });

  const filteredIncidents = incidents.filter(inc => {
    const matchesSearch = inc.patient.toLowerCase().includes(searchText.toLowerCase()) ||
                          inc.idCode.toLowerCase().includes(searchText.toLowerCase()) ||
                          inc.reason.toLowerCase().includes(searchText.toLowerCase());
    const matchesClass = incidentClassFilter === 'All' || inc.class === incidentClassFilter;
    const matchesStatus = incidentStatusFilter === 'All' || inc.status === incidentStatusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = invCategoryFilter === 'All' || item.category === invCategoryFilter;
    const matchesStatus = invStatusFilter === 'All' || item.status === invStatusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredEpidemics = epidemics.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          c.disease.toLowerCase().includes(searchText.toLowerCase());
    const matchesClass = epidemicClassFilter === 'All' || c.class === epidemicClassFilter;
    return matchesSearch && matchesClass;
  });

  const filteredInsurance = healthRecords.filter(rec => {
    const matchesSearch = rec.name.toLowerCase().includes(searchText.toLowerCase()) ||
                          rec.id.toLowerCase().includes(searchText.toLowerCase()) ||
                          rec.insurance.toLowerCase().includes(searchText.toLowerCase());
    const matchesClass = classFilter === 'All' || rec.class === classFilter;
    const matchesStatus = insuranceStatusFilter === 'All' || rec.insStatus === insuranceStatusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const currentListLength = 
    activeTab === 'records' ? filteredRecords.length :
    activeTab === 'incidents' ? filteredIncidents.length :
    activeTab === 'inventory' ? filteredInventory.length :
    activeTab === 'epidemic' ? filteredEpidemics.length :
    activeTab === 'insurance' ? filteredInsurance.length : 0;

  const totalPages = Math.max(1, Math.ceil(currentListLength / pageSize));

  const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedInventory = filteredInventory.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedIncidents = filteredIncidents.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedEpidemics = filteredEpidemics.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedInsurance = filteredInsurance.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleOpenVoid = (id: string) => {
    setVoidTargetId(id);
    setVoidReason('');
    setIsVoidOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!voidReason.trim() || !voidTargetId) return;
    const target = incidents.find(i => i.id === voidTargetId);
    if (!target) return;

    const updated = {
      ...target,
      status: 'Đã Hủy',
      parentNote: `${target.parentNote || ''} (Lý do hủy: ${voidReason.trim()})`
    };

    try {
      await saveHealthIncident(updated);
      setIncidents(prev => prev.map(item => item.id === voidTargetId ? updated : item));
    } catch (err) {
      console.error("Failed to void incident:", err);
    } finally {
      setIsVoidOpen(false);
      setVoidTargetId(null);
    }
  };

  const handleSaveIncomingRecord = async (newInc: any) => {
    const entry: HealthIncident = {
      id: `INC-${Math.floor(Math.random() * 9000 + 1000)}`,
      date: new Date().toLocaleDateString('vi-VN') + ' • ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      patient: newInc.patientName || 'Phạm Minh Kha',
      idCode: newInc.patientId || 'HS-21-0492',
      class: newInc.class || '5A1',
      bg: newInc.bg || 'O+',
      reason: newInc.reason || 'Sốt cao',
      temp: parseFloat(newInc.temp) || 38.5,
      bp: newInc.bp || '115/75',
      treatment: newInc.treatment || 'Nằm nghỉ tại giường, xử lý cơ bản',
      outcome: newInc.outcome || 'Đã khỏe và về lớp',
      staff: 'Cô Lê Hải Yến',
      status: 'Ký nhận',
      parentNotified: true,
      parentNote: 'Phụ huynh đã ghi nhận thông tin.'
    };

    try {
      await saveHealthIncident(entry);
      setIncidents(prev => [entry, ...prev]);
    } catch (err) {
      console.error("Failed to save incident:", err);
    }
  };

  const triggerCallSimulation = (name: string, role: string, phone: string) => {
    setActiveCall({ name, role, phone });
    setTimeout(() => {
      setActiveCall(null);
    }, 4000);
  };

  const triggerExportSimulation = (reportName: string) => {
    setExportSuccess(reportName);
    setTimeout(() => {
      setExportSuccess(null);
    }, 3000);
  };

  // CRUD Save & Delete Handlers
  const handleSaveRecord = async (newRec: any) => {
    try {
      await saveHealthRecord(newRec);
      setHealthRecords(prev => {
        const exists = prev.some(r => r.id === newRec.id);
        if (exists) {
          return prev.map(r => r.id === newRec.id ? newRec : r);
        }
        return [newRec, ...prev];
      });
    } catch (err) {
      console.error("Failed to save health record:", err);
    }
  };

  const handleSaveInventory = async (newItem: any) => {
    try {
      await saveHealthInventoryItem(newItem);
      setInventoryData(prev => {
        const exists = prev.some(i => i.id === newItem.id);
        if (exists) {
          return prev.map(i => i.id === newItem.id ? newItem : i);
        }
        return [newItem, ...prev];
      });
    } catch (err) {
      console.error("Failed to save inventory item:", err);
    }
  };

  const handleSaveEpidemic = (newCase: any) => {
    setEpidemics(prev => {
      const exists = prev.some(c => c.id === newCase.id);
      if (exists) {
        return prev.map(c => c.id === newCase.id ? newCase : c);
      }
      return [newCase, ...prev];
    });
  };

  const handleSaveInsurance = async (newIns: any) => {
    try {
      const targetRecord = healthRecords.find(r => r.id === newIns.id);
      if (targetRecord) {
        const updatedRecord = {
          ...targetRecord,
          name: newIns.name,
          class: newIns.class,
          insurance: newIns.insurance,
          insStatus: newIns.insStatus
        };
        await saveHealthRecord(updatedRecord);
        setHealthRecords(prev => prev.map(r => r.id === newIns.id ? updatedRecord : r));
      } else {
        const newRecord: HealthRecord = {
          id: newIns.id,
          name: newIns.name,
          class: newIns.class,
          height: 115,
          weight: 20,
          bmi: 15.1,
          bg: 'O+',
          eyes: 'Mắt trái 10/10 • Mắt phải 10/10',
          history: 'Bình thường',
          allergy: 'Không',
          insurance: newIns.insurance,
          insStatus: newIns.insStatus
        };
        await saveHealthRecord(newRecord);
        setHealthRecords(prev => [newRecord, ...prev]);
      }
    } catch (err) {
      console.error("Failed to save insurance info:", err);
    }
  };

  const handleSaveReport = (newReport: any) => {
    triggerExportSimulation(`${newReport.title} (${newReport.format})`);
  };

  const handleDeleteRecord = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa hồ sơ sức khỏe này?')) {
      try {
        await deleteHealthRecord(id);
        setHealthRecords(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error("Failed to delete health record:", err);
      }
    }
  };

  const handleDeleteInventory = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thuốc/vật tư này khỏi kho?')) {
      try {
        await deleteHealthInventoryItem(id);
        setInventoryData(prev => prev.filter(item => item.id !== id));
      } catch (err) {
        console.error("Failed to delete inventory item:", err);
      }
    }
  };

  const handleDeleteEpidemic = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa báo cáo ca bệnh dịch tễ này?')) {
      setEpidemics(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleDeleteInsurance = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông tin bảo hiểm y tế của học sinh này?')) {
      try {
        const targetRecord = healthRecords.find(r => r.id === id);
        if (targetRecord) {
          const updatedRecord = {
            ...targetRecord,
            insurance: '',
            insStatus: 'Hết hạn'
          };
          await saveHealthRecord(updatedRecord);
          setHealthRecords(prev => prev.map(r => r.id === id ? updatedRecord : r));
        }
      } catch (err) {
        console.error("Failed to delete insurance info:", err);
      }
    }
  };

  // Helper stats for Dashboard
  const activeIncidentsCount = incidents.filter(i => i.status !== 'Đã Hủy').length;
  const restingStudentsCount = incidents.filter(i => i.status !== 'Đã Hủy' && i.outcome.includes('Nằm nghỉ')).length;
  const lowStockCount = inventoryData.filter(i => i.status === 'Sắp hết' || i.status === 'Sắp hết hạn').length;
  const insurancePaymentRate = Math.round((healthRecords.filter(r => r.insStatus === 'Còn hạn').length / Math.max(1, healthRecords.length)) * 100);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative scroll-smooth bg-[#edf2f9]">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto z-10 relative">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-[#2c5ea0]/10 text-[#2c5ea0] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#b8c6d9] flex items-center">
                <Heart className="w-3.5 h-3.5 mr-1 fill-[#2c5ea0] text-[#2c5ea0]" /> Vị trí công tác: Nhân viên Y tế
              </span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-1.5 tracking-tight">{headerInfo.title}</h2>
            <p className="text-[#5a6a85] text-sm font-medium leading-relaxed">{headerInfo.description}</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 md:mt-0">
            <button 
              onClick={headerInfo.onBtn1}
              className="flex items-center px-4 py-2 bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-[#4a5568] text-xs uppercase tracking-widest font-bold transition rounded-full shadow-sm">
              <Download className="w-4 h-4 mr-2 text-[#7b8a9e]" />
              {headerInfo.btn1Label}
            </button>
            <button 
              onClick={headerInfo.onBtn2}
              className="flex items-center px-6 py-2.5 bg-[#2c5ea0] hover:bg-[#1e2a3a] text-white text-xs uppercase tracking-widest font-bold transition shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              {headerInfo.btn2Label}
            </button>
          </div>
        </div>

        {/* Main Display Panel - Native Full Width, Sidebar Removed */}
        <div className="w-full bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col min-h-[600px] rounded-3xl overflow-hidden mb-8">
          
          {/* Header of Active Tab */}
          <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2c5ea0]" />
              {activeTab === 'dashboard' && 'Bảng giám sát y tế học đường thời gian thực'}
              {activeTab === 'records' && 'Hồ sơ sức khỏe & chỉ số sinh học học sinh'}
              {activeTab === 'incidents' && 'Nhật ký chẩn đoán sơ cấp cứu hằng ngày'}
              {activeTab === 'inventory' && 'Quản lý tủ thuốc, vật tư y tế tồn kho'}
              {activeTab === 'epidemic' && 'Theo dõi dịch bệnh truyền nhiễm và bao phủ tiêm chủng'}
              {activeTab === 'insurance' && 'Kiểm soát bảo hiểm y tế & bảo hiểm tai nạn học đường'}
              {activeTab === 'reports' && 'Hệ thống báo cáo & danh bạ liên lạc nội bộ'}
            </h3>

            {/* Search & filters for non-dashboard tabs */}
            {activeTab !== 'dashboard' && activeTab !== 'reports' && (
              <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                  <input 
                    type="text" 
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    placeholder="Tìm kiếm dữ liệu..."
                    className="pl-11 pr-4 py-1.5 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold focus:outline-none focus:border-[#2c5ea0] w-full sm:min-w-[180px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.03)] placeholder:text-[#8e9eb4] rounded-full"
                  />
                </div>

                {activeTab === 'records' && (
                  <FilterSelect
                    label="Lớp"
                    value={classFilter}
                    onChange={setClassFilter}
                    options={[
                      { value: 'All', label: 'TẤT CẢ LỚP' },
                      { value: '1A1', label: '1A1' },
                      { value: '1A2', label: '1A2' },
                      { value: '5A1', label: '5A1' },
                      { value: '10C2', label: '10C2' },
                      { value: '11B3', label: '11B3' }
                    ]}
                    icon={Filter}
                  />
                )}

                {activeTab === 'incidents' && (
                  <>
                    <FilterSelect
                      label="Lớp"
                      value={incidentClassFilter}
                      onChange={setIncidentClassFilter}
                      options={[
                        { value: 'All', label: 'TẤT CẢ LỚP' },
                        { value: '1A1', label: '1A1' },
                        { value: '5A1', label: '5A1' }
                      ]}
                      icon={Filter}
                    />
                    <FilterSelect
                      label="Trạng thái"
                      value={incidentStatusFilter}
                      onChange={setIncidentStatusFilter}
                      options={[
                        { value: 'All', label: 'TRẠNG THÁI' },
                        { value: 'Ký nhận', label: 'Ký nhận' },
                        { value: 'Đã Hủy', label: 'Đã Hủy' }
                      ]}
                      icon={Filter}
                    />
                  </>
                )}

                {activeTab === 'inventory' && (
                  <>
                    <FilterSelect
                      label="Phân loại"
                      value={invCategoryFilter}
                      onChange={setInvCategoryFilter}
                      options={[
                        { value: 'All', label: 'TẤT CẢ PHÂN LOẠI' },
                        { value: 'Thuốc hạ sốt', label: 'Thuốc hạ sốt' },
                        { value: 'Thuốc tiêu hóa', label: 'Thuốc tiêu hóa' },
                        { value: 'Thuốc đặc trị', label: 'Thuốc đặc trị' },
                        { value: 'Dụng cụ sơ cứu', label: 'Dụng cụ sơ cứu' },
                        { value: 'Dung dịch rửa', label: 'Dung dịch rửa' }
                      ]}
                      icon={Filter}
                    />
                    <FilterSelect
                      label="Hiện trạng"
                      value={invStatusFilter}
                      onChange={setInvStatusFilter}
                      options={[
                        { value: 'All', label: 'TRẠNG THÁI' },
                        { value: 'Bình thường', label: 'Bình thường' },
                        { value: 'Sắp hết', label: 'Sắp hết' },
                        { value: 'Sắp hết hạn', label: 'Sắp hết hạn' }
                      ]}
                      icon={Filter}
                    />
                  </>
                )}

                {activeTab === 'epidemic' && (
                  <FilterSelect
                    label="Lớp"
                    value={epidemicClassFilter}
                    onChange={setEpidemicClassFilter}
                    options={[
                      { value: 'All', label: 'TẤT CẢ LỚP' },
                      { value: '1A1', label: '1A1' },
                      { value: '1A2', label: '1A2' },
                      { value: '5A1', label: '5A1' }
                    ]}
                    icon={Filter}
                  />
                )}

                {activeTab === 'insurance' && (
                  <>
                    <FilterSelect
                      label="Lớp"
                      value={classFilter}
                      onChange={setClassFilter}
                      options={[
                        { value: 'All', label: 'TẤT CẢ LỚP' },
                        { value: '1A1', label: '1A1' },
                        { value: '1A2', label: '1A2' },
                        { value: '5A1', label: '5A1' }
                      ]}
                      icon={Filter}
                    />
                    <FilterSelect
                      label="Trạng thái"
                      value={insuranceStatusFilter}
                      onChange={setInsuranceStatusFilter}
                      options={[
                        { value: 'All', label: 'TRẠNG THÁI' },
                        { value: 'Còn hạn', label: 'Đã đóng (Còn hạn)' },
                        { value: 'Hết hạn', label: 'Chưa đóng (Hết hạn)' }
                      ]}
                      icon={Filter}
                    />
                  </>
                )}
              </div>
            )}
          </div>

          {/* TAB CONTENT: 1. DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              
              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-[#b8c6d9] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Lượt khám hôm nay</p>
                    <h4 className="text-2xl font-bold text-[#1e2a3a] mt-0.5">{activeIncidentsCount} ca</h4>
                    <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Tất cả đã xử lý xong</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#b8c6d9] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Đang nằm nghỉ</p>
                    <h4 className="text-2xl font-bold text-[#1e2a3a] mt-0.5">{restingStudentsCount} học sinh</h4>
                    <p className="text-[10px] text-blue-600 font-bold mt-0.5">Yêu cầu theo dõi nhiệt độ</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#b8c6d9] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Cần nhập bổ sung</p>
                    <h4 className="text-2xl font-bold text-[#1e2a3a] mt-0.5">{lowStockCount} loại vật tư</h4>
                    <p className="text-[10px] text-amber-600 font-bold mt-0.5">HSD sắp đến hạn hoặc sắp hết</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#b8c6d9] shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
                  <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-wider">Tỷ lệ bao phủ BHYT</p>
                    <h4 className="text-2xl font-bold text-[#1e2a3a] mt-0.5">{insurancePaymentRate}%</h4>
                    <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Chỉ còn 1 học sinh chưa đóng</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Alerts and Warnings */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="bg-white p-5 rounded-3xl border border-[#b8c6d9] shadow-sm">
                    <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" /> Trung tâm cảnh báo y tế & dịch bệnh
                    </h3>
                    
                    <div className="space-y-3">
                      {/* Outbreak Watch */}
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-rose-800 uppercase">Cảnh báo dịch sốt & đau mắt đỏ</span>
                            <span className="px-2 py-0.5 bg-rose-200 text-rose-950 text-[9px] font-bold uppercase rounded-full">Khẩn cấp</span>
                          </div>
                          <p className="text-xs text-rose-900 mt-1">
                            Lớp <strong>Mầm 1</strong> ghi nhận cụm <strong>3 bé</strong> biểu hiện sốt cao và đau mắt đỏ trong tuần này. Đã thông báo khử khuẩn phòng học và cách ly theo dõi bé tại nhà để tránh lây nhiễm chéo diện rộng.
                          </p>
                        </div>
                      </div>

                      {/* Medicine Expiring Alert */}
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-xs text-amber-800 uppercase">Cảnh báo vật tư sắp cạn kiệt / Hết hạn</span>
                          <div className="mt-1.5 space-y-1 text-xs text-amber-900">
                            <p>• <strong>Salbutamol Xịt (Hen suyễn):</strong> Hạn sử dụng sắp đến ngày <strong>10/06/2026</strong>. Cần liên hệ trạm y tế cấp phát thuốc mới.</p>
                            <p>• <strong>Paracetamol 500mg:</strong> Lượng tồn kho thực tế chỉ còn <strong>2 hộp</strong> (dưới định mức tối thiểu 5 hộp).</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Calendar / Work Schedule */}
                <div className="col-span-1">
                  <div className="bg-white p-5 rounded-3xl border border-[#b8c6d9] shadow-sm h-full">
                    <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" /> Lịch công tác y tế
                    </h3>
                    
                    <div className="space-y-4">
                      {workSchedule.map(sched => (
                        <div key={sched.id} className="flex gap-3 items-start">
                          <div className="p-2 bg-[#edf2f9] rounded-xl text-emerald-700 text-xs font-bold shrink-0">
                            {sched.type === 'Định kỳ' && <Users className="w-4 h-4" />}
                            {sched.type === 'Tiêm chủng' && <Syringe className="w-4 h-4" />}
                            {sched.type === 'Phòng dịch' && <ShieldCheck className="w-4 h-4" />}
                            {sched.type === 'Tập huấn' && <BookOpen className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-xs text-[#1e2a3a] leading-tight">{sched.title}</h4>
                            <p className="text-[10px] text-[#7b8a9e] mt-1 font-mono">{sched.date} • {sched.time}</p>
                            <div className="flex justify-between items-center mt-1.5">
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#edf2f9] text-[#4a5568] border border-[#b8c6d9] rounded font-bold">{sched.type}</span>
                              <span className={`text-[9px] font-bold ${sched.status === 'Đã lên lịch' ? 'text-emerald-600' : 'text-amber-600'}`}>{sched.status}</span>
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

          {/* TAB CONTENT: 2. HEALTH RECORDS */}
          {activeTab === 'records' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto flex-1 min-h-0">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 w-32">Mã HS</th>
                      <th className="px-6 py-4">Họ Tên</th>
                      <th className="px-6 py-4 w-24">Lớp</th>
                      <th className="px-6 py-4 w-32">Thể trạng (H/W)</th>
                      <th className="px-6 py-4 w-20 text-center">Nhóm Máu</th>
                      <th className="px-6 py-4">Tiền sử bệnh</th>
                      <th className="px-6 py-4">Dị ứng</th>
                      <th className="px-6 py-4 w-24 text-center">BHYT</th>
                      <th className="px-6 py-4 w-24 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b8c6d9] bg-white">
                    {paginatedRecords.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-400 font-bold">
                          <SearchX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          Không tìm thấy học sinh khớp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      paginatedRecords.map(rec => (
                        <tr key={rec.id} className="hover:bg-[#e8eef6] transition-colors">
                          <td className="px-6 py-5 font-mono text-xs font-bold text-[#7b8a9e]">{rec.id}</td>
                          <td className="px-6 py-5 font-bold text-[#1e2a3a]">{rec.name}</td>
                          <td className="px-6 py-5 font-bold text-[#4a5568]">{rec.class}</td>
                          <td className="px-6 py-5 text-xs text-[#4a5568]">
                            <span className="font-bold">{rec.height}cm</span> / <span className="font-bold">{rec.weight}kg</span>
                            <span className="block text-[9px] font-bold text-[#7b8a9e] uppercase font-mono mt-0.5">BMI: {rec.bmi}</span>
                          </td>
                          <td className="px-6 py-5 font-mono text-xs font-bold text-red-700 text-center">{rec.bg}</td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              rec.history !== 'Bình thường' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>{rec.history}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                              rec.allergy !== 'Không' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 font-bold' 
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>{rec.allergy}</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${getStatusBadgeClass(rec.insStatus)}`}>
                              {rec.insStatus}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <ActionMenu 
                              primaryAction={{
                                label: 'Xem chi tiết',
                                icon: 'Eye',
                                onClick: () => setSelectedRecord(rec)
                              }}
                              actions={[
                                {
                                  label: 'Chỉnh sửa hồ sơ',
                                  icon: 'Edit',
                                  onClick: () => { setEditingRecord(rec); setIsRecordModalOpen(true); }
                                },
                                {
                                  label: 'Xóa hồ sơ',
                                  icon: 'Trash',
                                  onClick: () => handleDeleteRecord(rec.id),
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
                  totalItems={currentListLength}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT: 3. Daily Medical Log & Incidents */}
          {activeTab === 'incidents' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto flex-1 min-h-0">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 w-32">Mã vụ</th>
                      <th className="px-6 py-4">Thời gian</th>
                      <th className="px-6 py-4">Học Sinh</th>
                      <th className="px-6 py-4">Triệu chứng / Chẩn đoán</th>
                      <th className="px-6 py-4">Xử lý y tế</th>
                      <th className="px-6 py-4">Kết Quả Lâm Sàng</th>
                      <th className="px-6 py-4 text-center">Trạng Thái</th>
                      <th className="px-6 py-4 text-center">Tác Vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b8c6d9] bg-white">
                    {paginatedIncidents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400 font-bold">
                          <SearchX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          Không tìm thấy hồ sơ sơ cứu nào.
                        </td>
                      </tr>
                    ) : (
                      paginatedIncidents.map(inc => (
                        <tr key={inc.id} className={`hover:bg-[#e8eef6] transition-colors ${inc.status === 'Đã Hủy' ? 'line-through text-gray-400 opacity-60' : ''}`}>
                          <td className="px-6 py-5 font-mono text-xs font-bold text-[#7b8a9e]">{inc.id}</td>
                          <td className="px-6 py-5 text-xs text-[#4a5568] font-medium">{inc.date}</td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-[#1e2a3a]">{inc.patient}</p>
                            <p className="text-[9px] text-[#7b8a9e] uppercase tracking-wider font-mono mt-0.5">{inc.idCode} • {inc.class}</p>
                          </td>
                          <td className="px-6 py-5 text-xs font-bold text-rose-700">{inc.reason}</td>
                          <td className="px-6 py-5 text-xs text-[#4a5568] font-medium">{inc.treatment}</td>
                          <td className="px-6 py-5 text-xs text-[#4a5568] font-bold">{inc.outcome}</td>
                          <td className="px-6 py-5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusBadgeClass(inc.status)}`}>
                              {inc.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <ActionMenu 
                              primaryAction={{
                                label: 'Xem chi tiết',
                                icon: 'Eye',
                                onClick: () => setSelectedIncident(inc)
                              }}
                              actions={[
                                {
                                  label: 'In phiếu chẩn đoán y tế',
                                  icon: 'Printer',
                                  onClick: () => setPrintedIncident(inc)
                                },
                                {
                                  label: 'Hủy/Gạch xóa hồ sơ',
                                  icon: 'Ban',
                                  onClick: () => handleOpenVoid(inc.id),
                                  danger: true,
                                  ...(inc.status === 'Đã Hủy' ? { roles: [] } : {})
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
                  totalItems={currentListLength}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT: 4. INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="flex-1 flex flex-col min-h-0">
              
              {/* Fast Medicine category filter bar */}
              <div className="p-4 bg-[#edf2f9] border-b border-[#b8c6d9] flex gap-2 overflow-x-auto shrink-0">
                <button 
                  onClick={() => { setInvCategoryFilter('All'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${invCategoryFilter === 'All' ? 'bg-[#10b981] text-white border-transparent' : 'bg-white text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6]'}`}>
                  Tất cả tủ thuốc
                </button>
                <button 
                  onClick={() => { setInvCategoryFilter('Thuốc hạ sốt'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${invCategoryFilter === 'Thuốc hạ sốt' ? 'bg-[#10b981] text-white border-transparent' : 'bg-white text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6]'}`}>
                  Thuốc hạ sốt
                </button>
                <button 
                  onClick={() => { setInvCategoryFilter('Thuốc tiêu hóa'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${invCategoryFilter === 'Thuốc tiêu hóa' ? 'bg-[#10b981] text-white border-transparent' : 'bg-white text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6]'}`}>
                  Thuốc tiêu hóa
                </button>
                <button 
                  onClick={() => { setInvCategoryFilter('Dụng cụ sơ cứu'); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${invCategoryFilter === 'Dụng cụ sơ cứu' ? 'bg-[#10b981] text-white border-transparent' : 'bg-white text-[#4a5568] border-[#b8c6d9] hover:bg-[#e8eef6]'}`}>
                  Bông băng / Sơ cứu
                </button>
              </div>

              <div className="overflow-x-auto flex-1 min-h-0">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 w-32">Ký hiệu</th>
                      <th className="px-6 py-4">Tên Thuốc / Vật tư</th>
                      <th className="px-6 py-4">Phân Loại</th>
                      <th className="px-6 py-4 text-center">Tồn Kho Hiện Tại</th>
                      <th className="px-6 py-4 text-center">Tồn Kho Tối Thiểu</th>
                      <th className="px-6 py-4">Hạn Sử Dụng</th>
                      <th className="px-6 py-4">Hiện trạng</th>
                      <th className="px-6 py-4 w-24 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b8c6d9] bg-white">
                    {paginatedInventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-bold">
                          <SearchX className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                          Không tìm thấy thuốc / vật tư nào.
                        </td>
                      </tr>
                    ) : (
                      paginatedInventory.map(item => (
                        <tr key={item.id} className="hover:bg-[#e8eef6] transition-colors">
                          <td className="px-6 py-5 font-mono text-xs font-bold text-[#7b8a9e]">{item.id}</td>
                          <td className="px-6 py-5">
                            <p className="font-bold text-[#1e2a3a]">{item.name}</p>
                            <p className="text-[9px] text-[#7b8a9e] uppercase font-bold mt-0.5">Đơn vị: {item.unit}</p>
                          </td>
                          <td className="px-6 py-5 text-xs font-bold text-[#4a5568]">{item.category}</td>
                          <td className="px-6 py-5 text-center">
                            <div className="flex flex-col items-center">
                              <span className="font-serif text-base font-bold text-[#2e6b8a]">{item.stock} {item.unit}</span>
                              {/* Small visual progress indicator */}
                              <div className="w-24 bg-gray-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                                <div 
                                  style={{ width: `${Math.min(100, (item.stock / Math.max(1, item.minStock * 2)) * 100)}%` }}
                                  className={`h-full ${item.status === 'Sắp hết' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center text-xs font-bold text-[#7b8a9e]">{item.minStock} {item.unit}</td>
                          <td className="px-6 py-5 font-mono text-xs font-bold text-[#4a5568]">{item.expDate}</td>
                          <td className="px-6 py-5">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getStatusBadgeClass(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <ActionMenu 
                              primaryAction={{
                                label: 'Chỉnh sửa',
                                icon: 'Edit',
                                onClick: () => { setEditingItem(item); setIsInventoryModalOpen(true); }
                              }}
                              actions={[
                                {
                                  label: 'Xóa vật tư',
                                  icon: 'Trash',
                                  onClick: () => handleDeleteInventory(item.id),
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
                  totalItems={currentListLength}
                  pageSize={pageSize}
                  onPageSizeChange={setPageSize}
                />
              </div>
            </div>
          )}

          {/* TAB CONTENT: 5. EPIDEMIC & VACCINE */}
          {activeTab === 'epidemic' && (
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Epidemic tracker */}
                <div className="bg-white p-5 rounded-3xl border border-[#b8c6d9] shadow-sm flex flex-col">
                  <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" /> Sổ theo dõi học sinh mắc dịch bệnh truyền nhiễm
                  </h3>
                  
                  <div className="overflow-x-auto flex-1">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#f5f8fc] text-[#4a5568] font-bold uppercase border-b border-[#b8c6d9]">
                        <tr>
                          <th className="px-4 py-2.5">Học Sinh</th>
                          <th className="px-4 py-2.5">Lớp</th>
                          <th className="px-4 py-2.5">Dịch Bệnh</th>
                          <th className="px-4 py-2.5">Ngày Phát Hiện</th>
                          <th className="px-4 py-2.5">Trạng Thái</th>
                          <th className="px-4 py-2.5 text-center">Tác vụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#b8c6d9]/60">
                        {paginatedEpidemics.map(c => (
                          <tr key={c.id} className="hover:bg-[#e8eef6]/40">
                            <td className="px-4 py-3 font-bold text-[#1e2a3a]">{c.name}</td>
                            <td className="px-4 py-3 font-bold text-[#4a5568]">{c.class}</td>
                            <td className="px-4 py-3 font-bold text-rose-700">{c.disease}</td>
                            <td className="px-4 py-3 font-mono">{c.onsetDate}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${getStatusBadgeClass(c.status)}`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <ActionMenu 
                                primaryAction={{
                                  label: 'Chỉnh sửa',
                                  icon: 'Edit',
                                  onClick: () => { setEditingCase(c); setIsEpidemicModalOpen(true); }
                                }}
                                actions={[
                                  {
                                    label: 'Xóa ca bệnh',
                                    icon: 'Trash',
                                    onClick: () => handleDeleteEpidemic(c.id),
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
                </div>

                {/* Vaccine coverages */}
                <div className="bg-white p-5 rounded-3xl border border-[#b8c6d9] shadow-sm flex flex-col">
                  <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-2">
                    <Syringe className="w-4 h-4 text-emerald-600" /> Bao phủ tiêm chủng vaccine theo khối lớp
                  </h3>

                  <div className="space-y-4 flex-1">
                    {vaccineCoverage.map((item, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <div className="flex justify-between font-bold text-[#1e2a3a]">
                          <span>{item.grade} - {item.vaccine}</span>
                          <span className="font-mono text-[#2c5ea0]">{item.rate}% ({item.vaccinated}/{item.total} em)</span>
                        </div>
                        
                        {/* Rich progress bar */}
                        <div className="w-full bg-[#edf2f9] h-2.5 rounded-full overflow-hidden border border-[#b8c6d9]/60">
                          <div 
                            style={{ width: `${item.rate}%` }}
                            className={`h-full rounded-full ${
                              item.rate > 95 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                              item.rate > 90 ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-start gap-2 mt-4">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <p>
                        <strong>Ghi chú y tế:</strong> Tỷ lệ bao phủ vaccine phòng dịch cơ bản bắt buộc (MMR, 5 trong 1) tại trường hiện đều vượt chỉ tiêu an toàn 95% của phòng giáo dục và y tế huyện đề ra.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: 6. HEALTH INSURANCE */}
          {activeTab === 'insurance' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="overflow-x-auto flex-1 min-h-0">
                <table className="w-full min-w-[900px] text-sm text-left">
                  <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-6 py-4 w-32">Mã HS</th>
                      <th className="px-6 py-4">Họ Tên</th>
                      <th className="px-6 py-4 w-24">Lớp</th>
                      <th className="px-6 py-4">Mã số Bảo hiểm Y tế</th>
                      <th className="px-6 py-4 w-40 text-center">Trạng thái BHYT</th>
                      <th className="px-6 py-4 w-40 text-center">Bảo hiểm Tai nạn</th>
                      <th className="px-6 py-4 text-center">Hạn sử dụng thẻ</th>
                      <th className="px-6 py-4 w-24 text-center">Tác vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#b8c6d9] bg-white">
                    {paginatedInsurance.map(rec => (
                      <tr key={rec.id} className="hover:bg-[#e8eef6] transition-colors">
                        <td className="px-6 py-5 font-mono text-xs font-bold text-[#7b8a9e]">{rec.id}</td>
                        <td className="px-6 py-5 font-bold text-[#1e2a3a]">{rec.name}</td>
                        <td className="px-6 py-5 font-bold text-[#4a5568]">{rec.class}</td>
                        <td className="px-6 py-5 font-mono text-xs font-bold text-[#2e6b8a]">{rec.insurance}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rec.insStatus === 'Còn hạn' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}>{rec.insStatus === 'Còn hạn' ? 'Đã đóng' : 'Chưa đóng'}</span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-[10px] font-bold uppercase">Đã đóng tự nguyện</span>
                        </td>
                        <td className="px-6 py-5 font-mono text-xs text-center text-[#4a5568] font-bold">
                          {rec.insStatus === 'Còn hạn' ? '31/12/2026' : 'Đã hết hạn'}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <ActionMenu 
                            primaryAction={{
                              label: 'Cập nhật',
                              icon: 'Edit',
                              onClick: () => { setEditingInsurance(rec); setIsInsuranceModalOpen(true); }
                            }}
                            actions={[
                              {
                                  label: 'Xóa BHYT',
                                  icon: 'Trash',
                                  onClick: () => handleDeleteInsurance(rec.id),
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
            </div>
          )}

          {/* TAB CONTENT: 7. REPORTS & CONTACTS */}
          {activeTab === 'reports' && (
            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Homeroom teacher directory */}
                <div className="bg-white p-5 rounded-3xl border border-[#b8c6d9] shadow-sm">
                  <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" /> Danh bạ nhanh Giáo viên chủ nhiệm
                  </h3>

                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center py-2 border-b border-[#edf2f9]">
                      <div>
                        <p className="font-bold text-xs text-[#1e2a3a]">Cô Lê Thị Thảo (Lớp 1A1)</p>
                        <p className="text-[10px] text-[#7b8a9e] font-mono mt-0.5">SĐT: 0983-291-092</p>
                      </div>
                      <button 
                        onClick={() => triggerCallSimulation('Cô Lê Thị Thảo', 'GVCN Lớp 1A1', '0983-291-092')}
                        className="p-2 bg-[#e8eef6] text-[#2c5ea0] rounded-full hover:bg-[#10b981] hover:text-white transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-[#edf2f9]">
                      <div>
                        <p className="font-bold text-xs text-[#1e2a3a]">Thầy Trần Minh Triết (Lớp 1A2)</p>
                        <p className="text-[10px] text-[#7b8a9e] font-mono mt-0.5">SĐT: 0912-392-104</p>
                      </div>
                      <button 
                        onClick={() => triggerCallSimulation('Thầy Trần Minh Triết', 'GVCN Lớp 1A2', '0912-392-104')}
                        className="p-2 bg-[#e8eef6] text-[#2c5ea0] rounded-full hover:bg-[#10b981] hover:text-white transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-[#edf2f9]">
                      <div>
                        <p className="font-bold text-xs text-[#1e2a3a]">Cô Phạm Hồng Đào (Lớp 5A1)</p>
                        <p className="text-[10px] text-[#7b8a9e] font-mono mt-0.5">SĐT: 0976-192-281</p>
                      </div>
                      <button 
                        onClick={() => triggerCallSimulation('Cô Phạm Hồng Đào', 'GVCN Lớp 5A1', '0976-192-281')}
                        className="p-2 bg-[#e8eef6] text-[#2c5ea0] rounded-full hover:bg-[#10b981] hover:text-white transition-all">
                        <Phone className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Emergency Hotline Card */}
                <div className="bg-white p-5 rounded-3xl border border-[#b8c6d9] shadow-sm">
                  <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-rose-500 animate-pulse" /> Đường dây nóng khẩn cấp
                  </h3>
                  
                  <div className="space-y-3.5">
                    <div className="flex justify-between items-center py-2 border-b border-[#edf2f9]">
                      <div>
                        <p className="font-bold text-xs text-[#1e2a3a]">Trạm Y tế xã An Hữu</p>
                        <p className="text-[10px] text-[#7b8a9e] font-mono mt-0.5">SĐT: 0273-3829-115</p>
                      </div>
                      <button 
                        onClick={() => triggerCallSimulation('Trạm Y Tế Xã An Hữu', 'Trực Cấp Cứu', '0273-3829-115')}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[10px] font-bold uppercase transition-all">
                        Gọi cấp cứu
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-[#edf2f9]">
                      <div>
                        <p className="font-bold text-xs text-[#1e2a3a]">Bệnh viện Huyện Cái Bè</p>
                        <p className="text-[10px] text-[#7b8a9e] font-mono mt-0.5">SĐT: 0273-3829-999</p>
                      </div>
                      <button 
                        onClick={() => triggerCallSimulation('Bệnh Viện Huyện Cái Bè', 'Phòng Cấp Cứu', '0273-3829-999')}
                        className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-[10px] font-bold uppercase transition-all">
                        Gọi cấp cứu
                      </button>
                    </div>
                  </div>
                </div>

                {/* Report summary builder */}
                <div className="bg-white p-5 rounded-3xl border border-[#b8c6d9] shadow-sm flex flex-col">
                  <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2c5ea0]" /> Báo cáo y tế học đường định kỳ
                  </h3>
                  
                  <div className="border border-[#b8c6d9] p-4 rounded-2xl bg-[#f5f8fc] space-y-4 flex-1 text-xs">
                    <div className="text-center font-serif space-y-0.5 border-b border-[#b8c6d9]/60 pb-2">
                      <h4 className="font-bold uppercase text-[#1e2a3a]">BÁO CÁO THÁNG 6/2026</h4>
                      <p className="text-[9px] font-sans text-[#7b8a9e]">Trường Mầm non An Hữu • Y tá Lê Hải Yến</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white border border-[#b8c6d9]/40 rounded-lg">
                        <p className="text-[#7b8a9e] font-bold text-[8px] uppercase">Lượt sơ cứu</p>
                        <p className="font-bold text-[#1e2a3a]">{incidents.length} lượt</p>
                      </div>
                      <div className="p-2 bg-white border border-[#b8c6d9]/40 rounded-lg">
                        <p className="text-[#7b8a9e] font-bold text-[8px] uppercase">Chấn thương</p>
                        <p className="font-bold text-rose-700">
                          {incidents.filter(i => i.reason.includes('Ngã') || i.reason.includes('xước')).length} ca
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-[#b8c6d9]/40">
                      <button 
                        onClick={() => triggerExportSimulation('Báo cáo thống kê Excel')}
                        className="px-3 py-1 bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] rounded-full font-bold text-[9px] uppercase text-[#4a5568]">Excel</button>
                      <button 
                        onClick={() => triggerExportSimulation('Báo cáo y tế học học đường PDF')}
                        className="px-4 py-1 bg-[#1e2a3a] text-white rounded-full font-bold text-[9px] uppercase hover:bg-black">PDF</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic CRUD Modals */}
      <MedicalIncidentModal 
        isOpen={isIncidentModalOpen} 
        onClose={() => setIsIncidentModalOpen(false)} 
        onSave={handleSaveIncomingRecord} 
      />

      <HealthRecordModal 
        isOpen={isRecordModalOpen} 
        onClose={() => { setIsRecordModalOpen(false); setEditingRecord(null); }} 
        onSave={handleSaveRecord} 
        editingRecord={editingRecord}
      />

      <InventoryItemModal 
        isOpen={isInventoryModalOpen} 
        onClose={() => { setIsInventoryModalOpen(false); setEditingItem(null); }} 
        onSave={handleSaveInventory} 
        editingItem={editingItem}
      />

      <EpidemicCaseModal 
        isOpen={isEpidemicModalOpen} 
        onClose={() => { setIsEpidemicModalOpen(false); setEditingCase(null); }} 
        onSave={handleSaveEpidemic} 
        editingCase={editingCase}
      />

      <InsuranceCardModal 
        isOpen={isInsuranceModalOpen} 
        onClose={() => { setIsInsuranceModalOpen(false); setEditingInsurance(null); }} 
        onSave={handleSaveInsurance} 
        editingInsurance={editingInsurance}
      />

      <ReportGenerationModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        onSave={handleSaveReport} 
      />

      {/* Drawer: Detailed Student Health Record */}
      {selectedRecord && (
        <ModalBase isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="HỒ SƠ SỨC KHỎE CHI TIẾT HỌC SINH" subtitle="Hồ sơ y khoa học đường chính thức">
          <div className="p-6 md:p-8 space-y-6 bg-[#f5f8fc] text-sm overflow-y-auto max-h-[85vh]">
            <div className="flex flex-col md:flex-row gap-6 pb-6 border-b border-[#b8c6d9]">
              {/* Profile details */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Họ và tên</p>
                    <p className="text-lg font-bold text-[#1e2a3a]">{selectedRecord.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Mã Học Sinh</p>
                    <p className="font-mono text-sm font-bold text-[#1e2a3a]">{selectedRecord.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Lớp học</p>
                    <p className="text-sm font-bold text-[#4a5568]">{selectedRecord.class}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Nhóm Máu</p>
                    <p className="font-mono text-sm font-bold text-red-700">{selectedRecord.bg}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Mã Thẻ BHYT</p>
                    <p className="font-mono text-xs font-bold text-[#2e6b8a]">{selectedRecord.insurance}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Hạn dùng BHYT</p>
                    <p className="text-xs font-bold text-emerald-700">{selectedRecord.insStatus === 'Còn hạn' ? '31/12/2026' : 'Đã hết hạn'}</p>
                  </div>
                </div>
              </div>

              {/* Development stats (Height, Weight, BMI) & Growth trajectory chart simulation */}
              <div className="w-full md:w-64 bg-[#edf2f9] p-4 rounded-2xl border border-[#b8c6d9] space-y-3">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase border-b border-[#b8c6d9]/60 pb-1 flex items-center justify-between">
                  <span>Chỉ số phát triển cơ thể</span>
                  <span className="text-emerald-700">BMI: {selectedRecord.bmi}</span>
                </p>
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-[#b8c6d9]/60">
                    <p className="text-[9px] text-[#7b8a9e] uppercase">Chiều cao</p>
                    <p className="font-bold text-base text-[#1e2a3a] mt-0.5">{selectedRecord.height} cm</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-[#b8c6d9]/60">
                    <p className="text-[9px] text-[#7b8a9e] uppercase">Cân nặng</p>
                    <p className="font-bold text-base text-[#1e2a3a] mt-0.5">{selectedRecord.weight} kg</p>
                  </div>
                </div>

                {/* BMI interpretation badge */}
                <div className={`p-2 rounded-xl text-center text-[10px] font-bold uppercase border ${
                  selectedRecord.bmi < 15 ? 'bg-amber-50 text-amber-800 border-amber-200' :
                  selectedRecord.bmi > 22 ? 'bg-rose-50 text-rose-800 border-rose-200' :
                  'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}>
                  Thể trạng: {selectedRecord.bmi < 15 ? 'Suy dinh dưỡng nhẹ' : selectedRecord.bmi > 22 ? 'Thừa cân' : 'Bình thường'}
                </div>

                {/* Grow curve simulation with SVG */}
                <div className="pt-2">
                  <p className="text-[9px] font-bold text-[#7b8a9e] uppercase mb-1.5">Biểu đồ tăng trưởng (1 năm qua)</p>
                  <div className="bg-white p-2 rounded-xl border border-[#b8c6d9]/60 h-20 flex items-end justify-between">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path d="M 10 35 Q 30 25, 50 20 T 90 10" fill="none" stroke="#10b981" strokeWidth="2" />
                      <circle cx="10" cy="35" r="2" fill="#2c5ea0" />
                      <circle cx="50" cy="20" r="2" fill="#2c5ea0" />
                      <circle cx="90" cy="10" r="2" fill="#2c5ea0" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Pathologies & Allergies HIGHLIGHTED IN CRIMSON RED to prevent anaphylaxis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-4.5 h-4.5 text-rose-600" />
                  <p className="font-bold text-xs text-rose-800 uppercase">Tiền sử bệnh lý nền</p>
                </div>
                <p className="text-xs font-bold text-rose-900 leading-relaxed">
                  {selectedRecord.history === 'Bình thường' 
                    ? 'Không ghi nhận bệnh lý nền nguy hiểm.' 
                    : `CẢNH BÁO: Học sinh có tiền sử bệnh ${selectedRecord.history.toUpperCase()}. Nhân viên y tế và GVCN cần lưu ý chế độ vận động và túc trực thuốc đặc trị kịp thời.`}
                </p>
              </div>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-4.5 h-4.5 text-rose-600" />
                  <p className="font-bold text-xs text-rose-800 uppercase">Tiền sử Dị ứng cơ địa</p>
                </div>
                <p className="text-xs font-bold text-rose-900 leading-relaxed">
                  {selectedRecord.allergy === 'Không' 
                    ? 'Không có tiền sử dị ứng thực phẩm hoặc dược phẩm.' 
                    : `CỰC KỲ QUAN TRỌNG: Học sinh dị ứng với ${selectedRecord.allergy.toUpperCase()}. Tuyệt đối không cho sử dụng các loại thực phẩm hoặc thuốc có chứa thành phần này.`}
                </p>
              </div>
            </div>

            {/* Specialized checkups: Vision, Dental, ENT */}
            <div className="bg-white p-5 rounded-2xl border border-[#b8c6d9]">
              <h4 className="font-bold text-xs text-[#1e2a3a] uppercase tracking-wider mb-3.5 flex items-center gap-1">
                <Stethoscope className="w-4 h-4 text-emerald-600" /> Kết quả khám chuyên khoa lâm sàng
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-[#edf2f9] rounded-xl border border-[#b8c6d9]/60">
                  <p className="font-bold text-[#7b8a9e] uppercase text-[9px]">Chuyên khoa Mắt (Thị lực)</p>
                  <p className="font-bold text-[#1e2a3a] mt-1">{selectedRecord.eyes}</p>
                </div>
                <div className="p-3 bg-[#edf2f9] rounded-xl border border-[#b8c6d9]/60">
                  <p className="font-bold text-[#7b8a9e] uppercase text-[9px]">Nha khoa (Răng hàm mặt)</p>
                  <p className="font-bold text-[#1e2a3a] mt-1">
                    {selectedRecord.id === 'HS-21-0004' || selectedRecord.id === 'HS-21-0002' ? 'Sâu răng hàm số 6 nhẹ' : 'Răng đều, không sâu'}
                  </p>
                </div>
                <div className="p-3 bg-[#edf2f9] rounded-xl border border-[#b8c6d9]/60">
                  <p className="font-bold text-[#7b8a9e] uppercase text-[9px]">Tai mũi họng (ENT)</p>
                  <p className="font-bold text-[#1e2a3a] mt-1">Bình thường, niêm mạc họng sạch</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                onClick={() => triggerCallSimulation(selectedRecord.name, 'Giáo viên Chủ nhiệm', '0983-291-092')}
                className="px-5 py-2 bg-white border border-[#b8c6d9] text-[#4a5568] hover:bg-[#e8eef6] rounded-full text-xs font-bold uppercase flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#7b8a9e]" /> Gọi GVCN
              </button>
              <button onClick={() => setSelectedRecord(null)} className="px-6 py-2 bg-[#1e2a3a] hover:bg-black text-white rounded-full text-xs font-bold uppercase">Đóng hồ sơ</button>
            </div>
          </div>
        </ModalBase>
      )}

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <ModalBase isOpen={!!selectedIncident} onClose={() => setSelectedIncident(null)} title="Hồ Sơ Cấp Cứu Chi Tiết" subtitle="Trích xuất chi tiết bệnh án sơ cứu lâm thời">
          <div className="p-6 md:p-8 space-y-6 bg-[#f5f8fc] text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Học sinh sơ cứu</p>
                <p className="text-base font-bold text-[#1e2a3a]">{selectedIncident.patient}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Mã Học Sinh</p>
                <p className="font-mono text-sm font-bold text-[#1e2a3a]">{selectedIncident.idCode}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Lớp học</p>
                <p className="text-sm font-bold text-[#4a5568]">{selectedIncident.class}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Chỉ số sinh tồn</p>
                <p className="text-sm font-bold text-red-700">{selectedIncident.temp}°C / Huyết áp {selectedIncident.bp}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Triệu chứng / Chẩn đoán</p>
                <p className="text-sm font-bold text-[#1e2a3a]">{selectedIncident.reason}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Biện pháp xử lý / Cấp phát thuốc</p>
                <p className="text-sm font-medium text-[#1e2a3a]">{selectedIncident.treatment}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Kết quả sơ cứu</p>
                <p className="text-sm font-bold text-emerald-700">{selectedIncident.outcome}</p>
              </div>
              <div className="col-span-2 border-t border-[#b8c6d9] pt-4">
                <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Ý kiến phụ huynh / Phản hồi</p>
                <p className="text-xs italic text-[#4a5568]">{selectedIncident.parentNote || 'Chưa có phản hồi từ gia đình.'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
              <button 
                onClick={() => triggerCallSimulation(selectedIncident.patient, 'Phụ Huynh Học Sinh', '0912-832-104')}
                className="px-5 py-2 bg-white border border-[#b8c6d9] text-[#4a5568] hover:bg-[#e8eef6] rounded-full text-xs font-bold uppercase flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#7b8a9e]" /> Gọi Phụ Huynh
              </button>
              <button onClick={() => setSelectedIncident(null)} className="px-6 py-2 bg-[#1e2a3a] text-white rounded-full text-xs font-bold uppercase">Đóng</button>
            </div>
          </div>
        </ModalBase>
      )}

      {/* Incident Print Preview Dialog */}
      {printedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 print:bg-white print:p-0">
          <div className="w-full max-w-lg bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] rounded-3xl overflow-hidden shadow-2xl flex flex-col print:border-none print:shadow-none print:bg-white animate-in zoom-in-95 duration-250">
            <div className="p-8 space-y-6 flex-1 font-serif print:p-4 text-[#1e2a3a]">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-xs uppercase">SỞ GD&ĐT TỈNH TIỀN GIANG</h4>
                <h4 className="font-bold text-xs uppercase">TRƯỜNG MẦM NON AN HỮU - Y TẾ HỌC ĐƯỜNG</h4>
                <div className="w-24 h-0.5 bg-[#b8c6d9] mx-auto my-3" />
                <h3 className="font-bold text-lg text-[#2c5ea0] uppercase tracking-wider pt-2">PHIẾU CHẨN ĐOÁN & XỬ LÝ SƠ CỨU</h3>
                <p className="text-[10px] font-sans text-[#7b8a9e] font-mono mt-1">Mã số: {printedIncident.id}</p>
              </div>

              <div className="space-y-3.5 pt-4 border-t border-dashed border-[#b8c6d9] text-xs font-sans">
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Học sinh:</span><span className="font-bold">{printedIncident.patient}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Mã số:</span><span className="font-mono font-bold">{printedIncident.idCode}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Lớp học:</span><span className="font-bold">{printedIncident.class}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Thời gian:</span><span>{printedIncident.date}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Chẩn đoán / Lý do:</span><span className="font-bold text-rose-700">{printedIncident.reason}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Sinh hiệu lâm sàng:</span><span className="font-bold">{printedIncident.temp}°C • HA {printedIncident.bp}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Biện pháp xử lý:</span><span>{printedIncident.treatment}</span></div>
                <div className="flex justify-between border-b border-gray-100 pb-1"><span>Kết quả sơ cứu:</span><span className="font-bold text-emerald-700">{printedIncident.outcome}</span></div>
              </div>

              <div className="grid grid-cols-2 text-center pt-8 text-xs font-sans">
                <div className="space-y-12"><p className="font-bold uppercase">Xác nhận học sinh</p><p className="italic text-gray-400 text-[10px]">(Ký, ghi rõ họ tên)</p></div>
                <div className="space-y-12"><p className="font-bold uppercase">Cán bộ y tế</p><p className="font-bold underline text-[#2c5ea0]">{printedIncident.staff}</p></div>
              </div>
            </div>
            <div className="p-4 bg-[#e8eef6] border-t-[3px] border-double border-[#b8c6d9] flex gap-3 justify-end print:hidden">
              <button onClick={() => setPrintedIncident(null)} className="px-5 py-2.5 bg-white border border-[#b8c6d9] font-bold text-xs uppercase tracking-widest rounded-full text-[#4a5568]">Đóng</button>
              <button onClick={() => window.print()} className="px-6 py-2.5 bg-[#10b981] hover:bg-[#0ea5e9] text-white font-bold text-xs uppercase tracking-widest rounded-full transition-all flex items-center shadow-md">In phiếu</button>
            </div>
          </div>
        </div>
      )}

      {/* Void Confirmation Modal */}
      {isVoidOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-serif font-bold text-rose-700 flex items-center border-b border-[#b8c6d9] pb-2">
              <ShieldAlert className="w-5 h-5 mr-2" /> HỦY HỒ SƠ BỆNH ÁN Y TẾ
            </h3>
            <p className="text-xs text-[#4a5568]">Hành động này sẽ đánh dấu bản ghi y tế này là "Đã Hủy" và không còn giá trị báo cáo y tế học đường.</p>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#4a5568] uppercase block">Lý do hủy bỏ bắt buộc</label>
              <textarea
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="Nhập lý do chẩn đoán sai, nhập nhầm..."
                rows={3}
                className="w-full p-3 bg-white border border-[#b8c6d9] rounded-xl text-sm text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0]"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setIsVoidOpen(false)} className="px-4 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] font-bold text-xs uppercase rounded-full text-[#4a5568]">Hủy</button>
              <button onClick={handleConfirmVoid} disabled={!voidReason.trim()} className="px-5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold text-xs uppercase rounded-full">Xác nhận hủy</button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Phone Call Overlay */}
      {activeCall && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1e2a3a] text-white p-5 border border-emerald-500 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-300 w-80">
          <div className="p-3 bg-emerald-600 rounded-full animate-bounce">
            <Phone className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 text-xs">
            <p className="font-bold text-emerald-400 uppercase tracking-widest text-[9px]">Đang thực hiện cuộc gọi...</p>
            <h4 className="font-bold text-base mt-0.5">{activeCall.name}</h4>
            <p className="text-[10px] text-gray-300">{activeCall.role} • {activeCall.phone}</p>
          </div>
        </div>
      )}

      {/* Export success toast */}
      {exportSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-emerald-400 font-bold text-xs uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle className="w-5 h-5" /> Đã xuất thành công: {exportSuccess}
        </div>
      )}
    </main>
  );
};
