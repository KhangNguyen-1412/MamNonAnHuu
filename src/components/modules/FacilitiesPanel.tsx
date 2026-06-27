import React, { useState, useEffect } from 'react';
import { Filter, Plus, Search, Eye, Edit, ShieldAlert, Check, Building, MonitorSmartphone, Wrench, Package } from 'lucide-react';
import { RoomModal, EquipmentModal, MaintenanceModal } from '../ui/FacilitiesModals';
import { ActionMenu } from '../ui/ActionMenu';
import { FilterSelect } from '../ui/BaseInputs';
import { Pagination } from '../ui/Pagination';
import { 
  getRooms, saveRoom, deleteRoom,
  getEquipments, saveEquipment, deleteEquipment,
  getMaintenances, saveMaintenance, deleteMaintenance,
  Room, Equipment, Maintenance
} from '../../services/dbService';


const getInitialEquipmentsForRoomType = (roomType: string, roomName: string): Omit<Equipment, 'id'>[] => {
  switch (roomType) {
    case 'Phòng sinh hoạt chung':
      return [
        { name: 'Bàn ghế mầm non: Bàn ghế nhựa/gỗ thấp phù hợp lứa tuổi, xếp theo nhóm hoặc hình chữ U cho hoạt động góc.', category: 'Nội thất phòng học', location: roomName, status: 'Tốt' },
        { name: 'Thảm trải nệm ngủ trưa: Bộ nệm gấp/cuộn dùng trải sau giờ ăn trưa để trẻ ngủ nghỉ tại lớp.', category: 'Nội thất phòng học', location: roomName, status: 'Tốt' },
        { name: 'Giá kệ góc hoạt động: Kệ gỗ nhiều tầng chứa đồ chơi, sách truyện, dụng cụ tạo hình cho các góc hoạt động (Xây dựng, Phân vai, Nghệ thuật, Thiên nhiên).', category: 'Nội thất phòng học', location: roomName, status: 'Tốt' },
        { name: 'Tủ đựng đồ cá nhân: Tủ ngăn có nhãn tên từng bé để cất ba lô, bình nước, khăn mặt cá nhân.', category: 'Nội thất phòng học', location: roomName, status: 'Tốt' },
        { name: 'Tivi thông minh / Màn hình tương tác: Dùng để chiếu bài giảng điện tử, video giáo dục và nhạc thiếu nhi.', category: 'Nghe Nhìn - Trình Chiếu', location: roomName, status: 'Tốt' },
        { name: 'Hệ thống làm mát: Quạt trần, quạt treo tường hoặc điều hòa không khí lắp cố định.', category: 'Thiết bị phòng chức năng', location: roomName, status: 'Tốt' }
      ];
    case 'Phòng Chức năng':
      return [
        { name: 'Thảm / Sàn gỗ vận động: Sàn mềm an toàn cho trẻ tập thể dục, aerobic và vận động thô.', category: 'Thiết bị phòng chức năng', location: roomName, status: 'Tốt' },
        { name: 'Đàn organ / Piano điện: Nhạc cụ phục vụ giờ học Âm nhạc và các buổi biểu diễn văn nghệ.', category: 'Thiết bị âm thanh và sự kiện', location: roomName, status: 'Tốt' },
        { name: 'Giá vẽ & dụng cụ tạo hình: Bảng vẽ cá nhân, cọ, màu nước, đất nặn phục vụ giờ Nghệ thuật / Thẩm mỹ.', category: 'Nội thất phòng học', location: roomName, status: 'Tốt' },
        { name: 'Dụng cụ vận động: Bóng gai, cột ném bóng, thang leo, đường hầm chui, vòng nhảy.', category: 'Thiết bị phòng chức năng', location: roomName, status: 'Tốt' }
      ];
    case 'Khu vực Bếp':
      return [
        { name: 'Hệ thống bếp công nghiệp: Bếp gas đôi/ba, chảo gang lớn, nồi hấp cơm inox phục vụ nấu ăn bán trú.', category: 'Thiết bị bếp bán trú', location: roomName, status: 'Tốt' },
        { name: 'Tủ đông & Tủ mát: Bảo quản thực phẩm sống (thịt, cá) và sữa hộp theo đúng quy chuẩn ATTP.', category: 'Thiết bị bếp bán trú', location: roomName, status: 'Tốt' },
        { name: 'Xe đẩy chia cơm inox: Xe đẩy kín nhiều tầng dùng chia khẩu phần ăn theo từng lớp.', category: 'Thiết bị bếp bán trú', location: roomName, status: 'Tốt' }
      ];
    case 'Hành chính & Hỗ trợ':
      return [
        { name: 'Thiết bị y tế sơ cứu: Tủ thuốc sơ cứu, cân sức khỏe điện tử, nhiệt kế, giường nghỉ cho trẻ bị ốm/sốt.', category: 'Thiết bị y tế', location: roomName, status: 'Tốt' },
        { name: 'Hệ thống camera giám sát: Camera quan sát khu vực cổng, sân chơi và các phòng sinh hoạt chung.', category: 'Thiết bị an ninh', location: roomName, status: 'Tốt' }
      ];
    default:
      return [];
  }
};

export const FacilitiesPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'equipment' | 'maintenance' | 'warehouse'>('rooms');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [buildingFilter, setBuildingFilter] = useState('All');
  const [roomTypeFilter, setRoomTypeFilter] = useState('All');
  const [eqCategoryFilter, setEqCategoryFilter] = useState('All');
  const [eqStatusFilter, setEqStatusFilter] = useState('All');
  const [maintSeverityFilter, setMaintSeverityFilter] = useState('All');
  const [maintStatusFilter, setMaintStatusFilter] = useState('All');

  // 1. STATEFUL ROOMS (MASTER DATA)
  const [rooms, setRooms] = useState<Room[]>([]);

  // 2. STATEFUL EQUIPMENT (MASTER DATA)
  const [equipments, setEquipments] = useState<Equipment[]>([]);

  // 3. STATEFUL MAINTENANCE (MASTER DATA)
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);

  // MODAL SWITCHES
  const [modalType, setModalType] = useState<'room' | 'equipment' | 'maintenance' | null>(null);
  const [modalMode, setModalMode] = useState<'read' | 'edit'>('edit');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic filter options based on real data
  const buildingOptions = [
    { value: 'All', label: 'TẤT CẢ TÒA' },
    ...Array.from(new Set(rooms.map(r => r.building))).filter(Boolean).map((b: any): { value: string; label: string } => ({ value: String(b), label: String(b) }))
  ];

  const roomTypeOptions = [
    { value: 'All', label: 'TẤT CẢ LOẠI' },
    ...Array.from(new Set(rooms.map(r => r.type))).filter(Boolean).map((t: any): { value: string; label: string } => ({ value: String(t), label: String(t) }))
  ];

  const eqCategoryOptions = [
    { value: 'All', label: 'TẤT CẢ DANH MỤC' },
    ...Array.from(new Set(equipments.map(e => e.category))).filter(Boolean).map((c: any): { value: string; label: string } => ({ value: String(c), label: String(c) }))
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const [roomsData, eqData, maintData] = await Promise.all([
          getRooms(),
          getEquipments(),
          getMaintenances()
        ]);
        setRooms(roomsData);
        setEquipments(eqData);
        setMaintenances(maintData);
      } catch (err) {
        console.error("Failed to load facilities data from firestore", err);
      }
    };
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case 'rooms': return 'Thêm Phòng Mới';
      case 'equipment':
      case 'warehouse': return 'Thêm Thiết Bị/Vật Tư';
      case 'maintenance': return 'Báo Cáo Sự Cố';
    }
  };

  const handleAddClick = () => {
    setSelectedEntity(null);
    setModalMode('edit');
    setModalType(activeTab === 'rooms' ? 'room' : (activeTab === 'equipment' || activeTab === 'warehouse') ? 'equipment' : 'maintenance');
  };

  const handleOpenReadOrEdit = (item: any, mode: 'read' | 'edit') => {
    setSelectedEntity(item);
    setModalMode(mode);
    setModalType(activeTab === 'rooms' ? 'room' : (activeTab === 'equipment' || activeTab === 'warehouse') ? 'equipment' : 'maintenance');
  };

  const toggleStatus = async (id: string, type: 'room' | 'eq' | 'maint') => {
    if (type === 'room') {
      const r = rooms.find(item => item.id === id);
      if (!r) return;
      const nextS = r.status === 'Ngừng Sử Dụng' ? 'Đang Sử Dụng' : 'Ngừng Sử Dụng';
      try {
        const updated = { ...r, status: nextS as any };
        await saveRoom(updated);
        setRooms(prev => prev.map(item => item.id === id ? updated : item));
        showToast(`🔄 Đã chuyển trạng thái phòng ${r.name} sang: ${nextS}`);
      } catch (err) {
        showToast("❌ Không thể cập nhật trạng thái phòng.");
      }
    } else if (type === 'eq') {
      const e = equipments.find(item => item.id === id);
      if (!e) return;
      const nextS = e.status === 'Ngưng Sử Dụng' ? 'Tốt' : 'Ngưng Sử Dụng';
      try {
        const updated = { ...e, status: nextS as any };
        await saveEquipment(updated);
        setEquipments(prev => prev.map(item => item.id === id ? updated : item));
        showToast(`🔄 Đã chuyển trạng thái thiết bị ${e.name} sang: ${nextS}`);
      } catch (err) {
        showToast("❌ Không thể cập nhật trạng thái thiết bị.");
      }
    } else {
      const m = maintenances.find(item => item.id === id);
      if (!m) return;
      const nextS = m.status === 'Hủy Bỏ' ? 'Chờ Xếp Lịch' : 'Hủy Bỏ';
      try {
        const updated = { ...m, status: nextS as any };
        await saveMaintenance(updated);
        setMaintenances(prev => prev.map(item => item.id === id ? updated : item));
        showToast(`🔄 Đã chuyển trạng thái sự cố ${m.id} sang: ${nextS}`);
      } catch (err) {
        showToast("❌ Không thể cập nhật trạng thái sự cố.");
      }
    }
  };

  const handleDeleteRoom = async (id: string) => {
    const r = rooms.find(room => room.id === id);
    if (!r) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng học ${r.name}?`)) {
      try {
        await deleteRoom(id);
        setRooms(prev => prev.filter(room => room.id !== id));
        showToast(`🗑️ Đã xóa phòng học ${r.name} thành công!`);
      } catch (err) {
        showToast("❌ Không thể xóa phòng học.");
      }
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    const eq = equipments.find(e => e.id === id);
    if (!eq) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa thiết bị ${eq.name}?`)) {
      try {
        await deleteEquipment(id);
        setEquipments(prev => prev.filter(e => e.id !== id));
        showToast(`🗑️ Đã xóa thiết bị ${eq.name} thành công!`);
      } catch (err) {
        showToast("❌ Không thể xóa thiết bị.");
      }
    }
  };

  const handleDeleteMaintenance = async (id: string) => {
    const mn = maintenances.find(m => m.id === id);
    if (!mn) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa báo cáo sự cố ${mn.id}?`)) {
      try {
        await deleteMaintenance(id);
        setMaintenances(prev => prev.filter(m => m.id !== id));
        showToast(`🗑️ Đã xóa báo cáo sự cố ${mn.id} thành công!`);
      } catch (err) {
        showToast("❌ Không thể xóa báo cáo sự cố.");
      }
    }
  };

  const handleSaveRoom = async (updated: Room) => {
    try {
      await saveRoom(updated);
      
      const isNew = !rooms.some(r => r.id === updated.id);
      let createdEqs: Equipment[] = [];
      
      if (isNew) {
        const roomName = updated.name || updated.id;
        const initialEqs = getInitialEquipmentsForRoomType(updated.type, roomName);
        const promises = initialEqs.map(async (eq, index) => {
          const uniqueId = `EQ-${Date.now().toString().slice(-4)}-${index}-${Math.floor(100 + Math.random() * 900)}`;
          const newEq: Equipment = {
            ...eq,
            id: uniqueId
          };
          await saveEquipment(newEq);
          return newEq;
        });
        createdEqs = await Promise.all(promises);
      }

      setRooms(prev => {
        const exists = prev.some(r => r.id === updated.id);
        if (exists) {
          showToast(`💾 Đã cập nhật phòng học ${updated.name}!`);
          return prev.map(r => r.id === updated.id ? updated : r);
        } else {
          showToast(`✨ Đã thêm phòng học mới và gán tài sản cố định cho ${updated.name}!`);
          return [updated, ...prev];
        }
      });

      if (createdEqs.length > 0) {
        setEquipments(prev => [...createdEqs, ...prev]);
      }
    } catch (err) {
      showToast("❌ Không thể lưu phòng học.");
    }
  };

  const handleSaveEquipment = async (updated: Equipment) => {
    try {
      await saveEquipment(updated);
      setEquipments(prev => {
        const exists = prev.some(e => e.id === updated.id);
        if (exists) {
          showToast(`💾 Đã cập nhật thiết bị ${updated.name}!`);
          return prev.map(e => e.id === updated.id ? updated : e);
        } else {
          showToast(`✨ Đã thêm thiết bị mới ${updated.name}!`);
          return [updated, ...prev];
        }
      });
    } catch (err) {
      showToast("❌ Không thể lưu thiết bị.");
    }
  };

  const handleSaveMaintenance = async (updated: Maintenance) => {
    try {
      await saveMaintenance(updated);
      setMaintenances(prev => {
        const exists = prev.some(m => m.id === updated.id);
        if (exists) {
          showToast(`💾 Đã cập nhật sự cố ${updated.id}!`);
          return prev.map(m => m.id === updated.id ? updated : m);
        } else {
          showToast(`✨ Đã tạo phiếu sự cố ${updated.id}!`);
          return [updated, ...prev];
        }
      });
    } catch (err) {
      showToast("❌ Không thể lưu phiếu bảo trì.");
    }
  };

  // Searching and filtering logic
  const filteredRooms = rooms
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.building.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            r.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBuilding = buildingFilter === 'All' || r.building === buildingFilter;
      const matchesType = roomTypeFilter === 'All' || r.type === roomTypeFilter;
      return matchesSearch && matchesBuilding && matchesType;
    })
    .sort((a, b) => {
      const codeA = (a.id || '').replace(/^Phòng\s+/i, '').trim();
      const codeB = (b.id || '').replace(/^Phòng\s+/i, '').trim();
      return codeA.localeCompare(codeB, undefined, { numeric: true, sensitivity: 'base' });
    });

  const isWarehouseItem = (e: Equipment) => {
    const loc = e.location || '';
    const cat = e.category || '';
    return loc === 'Kho chứa' || 
           loc === 'Sân vận động' || 
           cat === 'Thiết bị bếp ăn' || 
           cat === 'Thể thao quốc phòng' || 
           cat === 'Vật tư phòng cháy' || 
           cat === 'Vật tư bảo trì';
  };

  const filteredEquipments = equipments.filter(e => {
    const matchesTab = activeTab === 'warehouse' ? isWarehouseItem(e) : !isWarehouseItem(e);
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = eqCategoryFilter === 'All' || e.category === eqCategoryFilter;
    const matchesStatus = eqStatusFilter === 'All' || e.status === eqStatusFilter;
    return matchesTab && matchesSearch && matchesCategory && matchesStatus;
  });

  const filteredMaintenances = maintenances.filter(m => {
    const matchesSearch = m.detail.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = maintSeverityFilter === 'All' || m.severity === maintSeverityFilter;
    const matchesStatus = maintStatusFilter === 'All' || m.status === maintStatusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, buildingFilter, roomTypeFilter, eqCategoryFilter, eqStatusFilter, maintSeverityFilter, maintStatusFilter]);

  const currentListLength = activeTab === 'rooms' ? filteredRooms.length 
                            : (activeTab === 'equipment' || activeTab === 'warehouse') ? filteredEquipments.length 
                            : filteredMaintenances.length;

  const totalPages = Math.ceil(currentListLength / pageSize);

  const paginatedRooms = filteredRooms.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedEquipments = filteredEquipments.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedMaintenances = filteredMaintenances.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 relative ">
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-white px-6 py-3 rounded-2xl border border-[#b8c6d9] shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 flex items-center font-bold text-xs uppercase tracking-wider">
          <Check className="w-4 h-4 mr-2 text-green-400" /> {toastMessage}
        </div>
      )}

      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 border-b-[3px] border-double border-[#b8c6d9] pb-6 shrink-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-2 tracking-tight">Cơ Sở Vật Chất</h2>
            <p className="text-[#4a5568] text-sm uppercase tracking-widest font-bold">Quản lý phòng học, thiết bị và bảo trì</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-6 sm:mt-0">
            <button onClick={handleAddClick} className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              {getAddButtonText()}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-1 min-h-0">
          <div className="col-span-1 border-[3px] border-double border-[#b8c6d9] bg-[#f5f8fc] p-4 shadow-[4px_4px_0px_#dce4ee] rounded-3xl h-fit overflow-y-auto shrink-0">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs mb-4 border-b border-[#b8c6d9] pb-2">Phân Hệ Nghiệp Vụ</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('rooms')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'rooms' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Building className="w-5 h-5 mr-3" />
                Danh Mục Phòng Ban
              </button>
              <button 
                onClick={() => setActiveTab('equipment')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'equipment' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <MonitorSmartphone className="w-5 h-5 mr-3" />
                Vật Tư & Thiết Bị
              </button>
              <button 
                onClick={() => setActiveTab('warehouse')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'warehouse' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Package className="w-5 h-5 mr-3" />
                Kho Chứa
              </button>
              <button 
                onClick={() => setActiveTab('maintenance')}
                className={`w-full flex items-center px-4 py-3 text-sm font-bold transition-all rounded-full ${activeTab === 'maintenance' ? 'bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] shadow-inner' : 'text-[#4a5568] border border-transparent hover:bg-[#e8eef6] hover:border-[#b8c6d9]'}`}
              >
                <Wrench className="w-5 h-5 mr-3" />
                Sửa Chữa & Bảo Trì
              </button>
            </div>
            
            <div className="mt-8 pt-4 border-t border-[#b8c6d9]">
              <div className="bg-[#e8eef6] p-4 rounded-2xl border border-[#b8c6d9]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Phòng Thực Tế</span>
                  <span className="font-serif font-bold text-[#2c5ea0] text-xl">{rooms.length}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Thiết bị phân phối</span>
                  <span className="font-serif font-bold text-[#1e2a3a] text-lg">{equipments.filter(e => !isWarehouseItem(e)).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Thiết bị lưu kho</span>
                  <span className="font-serif font-bold text-[#2c5ea0] text-lg">{equipments.filter(e => isWarehouseItem(e)).length}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-3 bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[600px] rounded-3xl overflow-hidden relative min-h-0">
            <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between shrink-0">
              <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
                {activeTab === 'rooms' && 'Sổ Ghi Nhận Phòng Học Tòa Nhà'}
                {activeTab === 'equipment' && 'Danh Sách Vật Tư Thiết Bị Số'}
                {activeTab === 'warehouse' && 'Sổ Quản Lý Thiết Bị Lưu Kho'}
                {activeTab === 'maintenance' && 'Kế Hoạch Bảo Trì Ghi Nhận'}
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
                {activeTab === 'rooms' && (
                  <>
                    <FilterSelect
                      label="Tòa"
                      value={buildingFilter}
                      onChange={setBuildingFilter}
                      options={buildingOptions}
                      icon={Filter}
                    />
                    <FilterSelect
                      label="Loại"
                      value={roomTypeFilter}
                      onChange={setRoomTypeFilter}
                      options={roomTypeOptions}
                      icon={Filter}
                    />
                  </>
                )}
                {(activeTab === 'equipment' || activeTab === 'warehouse') && (
                  <>
                    <FilterSelect
                      label="Danh mục"
                      value={eqCategoryFilter}
                      onChange={setEqCategoryFilter}
                      options={eqCategoryOptions}
                      icon={Filter}
                    />
                    <FilterSelect
                      label="Trạng thái"
                      value={eqStatusFilter}
                      onChange={setEqStatusFilter}
                      options={[
                        { value: 'All', label: 'TRẠNG THÁI' },
                        { value: 'Tốt', label: 'Tốt' },
                        { value: 'Mới Nhập', label: 'Mới Nhập' },
                        { value: 'Hư Hỏng', label: 'Hư Hỏng' },
                        { value: 'Ngưng Sử Dụng', label: 'Ngưng Sử Dụng' }
                      ]}
                      icon={Filter}
                    />
                  </>
                )}
                {activeTab === 'maintenance' && (
                  <>
                    <FilterSelect
                      label="Mức độ"
                      value={maintSeverityFilter}
                      onChange={setMaintSeverityFilter}
                      options={[
                        { value: 'All', label: 'MỨC ĐỘ' },
                        { value: 'Nghiêm Trọng', label: 'Nghiêm Trọng' },
                        { value: 'Trung Bình', label: 'Trung Bình' },
                        { value: 'Thấp', label: 'Thấp' }
                      ]}
                      icon={Filter}
                    />
                    <FilterSelect
                      label="Trạng thái"
                      value={maintStatusFilter}
                      onChange={setMaintStatusFilter}
                      options={[
                        { value: 'All', label: 'TRẠNG THÁI' },
                        { value: 'Chờ Xếp Lịch', label: 'Chờ Xếp Lịch' },
                        { value: 'Đang Sửa Chữa', label: 'Đang Sửa Chữa' },
                        { value: 'Đã Hoàn Thành', label: 'Đã Hoàn Thành' },
                        { value: 'Hủy Bỏ', label: 'Hủy Bỏ' }
                      ]}
                      icon={Filter}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto w-full">
              <table className="w-full min-w-[900px] text-sm text-left">
                <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b-[3px] border-double border-[#b8c6d9] sticky top-0 z-10 shadow-[0_1px_0_#b8c6d9]">
                  {activeTab === 'rooms' && (
                    <tr>
                      <th className="px-6 py-4">Tòa Nhà</th>
                      <th className="px-6 py-4">Tên Phòng</th>
                      <th className="px-6 py-4">Khối Không Gian</th>
                      <th className="px-6 py-4">Lớp / Chức năng gán</th>
                      <th className="px-6 py-4 text-center">Sức Chứa</th>
                      <th className="px-6 py-4">Trạng Thái</th>
                      <th className="px-6 py-4 text-right">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'equipment' && (
                    <tr>
                      <th className="px-6 py-4">Mã Thiết Bị</th>
                      <th className="px-6 py-4">Tên Tài Sản</th>
                      <th className="px-6 py-4">Danh Mục</th>
                      <th className="px-6 py-4">Vị Trí Cấp Phát</th>
                      <th className="px-6 py-4">Hoạt Động</th>
                      <th className="px-6 py-4 text-right">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'warehouse' && (
                    <tr>
                      <th className="px-6 py-4">Mã Thiết Bị</th>
                      <th className="px-6 py-4">Tên Tài Sản</th>
                      <th className="px-6 py-4">Danh Mục</th>
                      <th className="px-6 py-4">Vị Trí Lưu Kho</th>
                      <th className="px-6 py-4">Trạng Thái</th>
                      <th className="px-6 py-4 text-right">Tác Vụ</th>
                    </tr>
                  )}
                  {activeTab === 'maintenance' && (
                    <tr>
                      <th className="px-6 py-4">Mã Báo Cáo</th>
                      <th className="px-6 py-4">Chi Tiết Sự Cố</th>
                      <th className="px-6 py-4">Vị Trí</th>
                      <th className="px-6 py-4">Mức Độ</th>
                      <th className="px-6 py-4 text-center">Cập Nhật</th>
                      <th className="px-6 py-4 text-right">Tác Vụ</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-[#b8c6d9]">
                  {activeTab === 'rooms' && paginatedRooms.map(room => (
                    <tr key={room.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{room.building}</td>
                      <td className="px-6 py-5 font-bold text-[#1e2a3a]">{room.name}</td>
                      <td className="px-6 py-5 text-[#4a5568] font-bold">{room.type}</td>
                      <td className="px-6 py-5 text-xs font-bold text-[#2c5ea0]">
                        {(room as any).assignedClassId || (room as any).functionType || (room as any).kitchenZone || (room as any).adminType || '—'}
                      </td>
                      <td className="px-6 py-5 text-center font-serif text-lg text-[#4a5568] font-bold">{room.capacity}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          room.status === 'Đang Sử Dụng' ? 'bg-[#2e6b8a] text-white' : 
                          room.status === 'Bảo Trì Định Kỳ' ? 'bg-[#a8c4e0] text-black border border-[#8e9eb4]' : 'bg-[#2c5ea0] text-white'
                        }`}>
                          {room.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionMenu 
                          primaryAction={{
                            label: 'Chi tiết phòng',
                            icon: 'Eye',
                            onClick: () => handleOpenReadOrEdit(room, 'read')
                          }}
                          actions={[
                            {
                              label: 'Sửa cấu hình phòng',
                              icon: 'Edit',
                              onClick: () => handleOpenReadOrEdit(room, 'edit')
                            },
                            {
                              label: room.status === 'Ngừng Sử Dụng' ? 'Đưa vào sử dụng' : 'Khóa / Ngừng sử dụng',
                              icon: room.status === 'Ngừng Sử Dụng' ? 'Check' : 'ShieldAlert',
                              onClick: () => toggleStatus(room.id, 'room'),
                              danger: room.status !== 'Ngừng Sử Dụng'
                            },
                            {
                              label: 'Xóa phòng học',
                              icon: 'Trash2',
                              onClick: () => handleDeleteRoom(room.id),
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}

                  {(activeTab === 'equipment' || activeTab === 'warehouse') && paginatedEquipments.map(eq => (
                    <tr key={eq.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs text-[#7b8a9e]">{eq.id}</td>
                      <td className="px-6 py-5 font-bold text-[#1e2a3a]">{eq.name}</td>
                      <td className="px-6 py-5 text-[#4a5568] font-bold">{eq.category}</td>
                      <td className="px-6 py-5 font-bold text-[#4a5568]">{eq.location}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          eq.status === 'Tốt' ? 'bg-[#2e6b8a] text-[#f5f8fc]' : 
                          eq.status === 'Mới Nhập' ? 'bg-blue-100 text-blue-700' : 'bg-[#2c5ea0] text-white'
                        }`}>
                          {eq.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionMenu 
                          primaryAction={{
                            label: 'Chi tiết thiết bị',
                            icon: 'Eye',
                            onClick: () => handleOpenReadOrEdit(eq, 'read')
                          }}
                          actions={[
                            {
                              label: 'Cập nhật phân loại',
                              icon: 'Edit',
                              onClick: () => handleOpenReadOrEdit(eq, 'edit')
                            },
                            {
                              label: eq.status === 'Ngưng Sử Dụng' ? 'Kích hoạt lại' : 'Ngưng sử dụng (Khóa)',
                              icon: eq.status === 'Ngưng Sử Dụng' ? 'Check' : 'ShieldAlert',
                              onClick: () => toggleStatus(eq.id, 'eq'),
                              danger: eq.status !== 'Ngưng Sử Dụng'
                            },
                            {
                              label: 'Xóa thiết bị',
                              icon: 'Trash2',
                              onClick: () => handleDeleteEquipment(eq.id),
                              danger: true
                            }
                          ]}
                        />
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'maintenance' && paginatedMaintenances.map(mn => (
                    <tr key={mn.id} className="hover:bg-[#e8eef6] transition-colors group">
                      <td className="px-6 py-5 font-mono text-xs text-[#7b8a9e]">{mn.id}</td>
                      <td className="px-6 py-5 font-bold text-[#1e2a3a]">{mn.detail}</td>
                      <td className="px-6 py-5 text-[#4a5568] font-bold">{mn.location}</td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          mn.severity === 'Nghiêm Trọng' ? 'text-[#2c5ea0]' : 'text-[#8c672b]'
                        }`}>
                          {mn.severity}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          mn.status === 'Đang Sửa Chữa' ? 'bg-orange-100 text-orange-700' : 'bg-[#a8c4e0] text-black border border-[#8e9eb4]'
                        }`}>
                          {mn.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <ActionMenu 
                          primaryAction={{
                            label: 'Xem yêu cầu',
                            icon: 'Eye',
                            onClick: () => handleOpenReadOrEdit(mn, 'read')
                          }}
                          actions={[
                            {
                              label: 'Cập nhật xử lý',
                              icon: 'Edit',
                              onClick: () => handleOpenReadOrEdit(mn, 'edit')
                            },
                            {
                              label: mn.status === 'Hủy Bỏ' ? 'Khôi phục yêu cầu' : 'Hủy bỏ báo cáo',
                              icon: mn.status === 'Hủy Bỏ' ? 'Check' : 'ShieldAlert',
                              onClick: () => toggleStatus(mn.id, 'maint'),
                              danger: mn.status !== 'Hủy Bỏ'
                            },
                            {
                              label: 'Xóa báo cáo sự cố',
                              icon: 'Trash2',
                              onClick: () => handleDeleteMaintenance(mn.id),
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
        </div>
      </div>

      <RoomModal 
        isOpen={modalType === 'room'} 
        onClose={() => setModalType(null)} 
        mode={modalMode}
        entityData={selectedEntity}
        onSave={handleSaveRoom}
        rooms={rooms}
        equipments={equipments}
        maintenances={maintenances}
      />
      <EquipmentModal 
        isOpen={modalType === 'equipment'} 
        onClose={() => setModalType(null)} 
        mode={modalMode}
        entityData={selectedEntity}
        onSave={handleSaveEquipment}
      />
      <MaintenanceModal 
        isOpen={modalType === 'maintenance'} 
        onClose={() => setModalType(null)} 
        mode={modalMode}
        entityData={selectedEntity}
        onSave={handleSaveMaintenance}
      />
    </main>
  );
};
