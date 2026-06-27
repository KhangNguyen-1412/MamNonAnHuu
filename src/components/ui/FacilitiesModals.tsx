import React, { useState, useEffect } from 'react';
import { BaseSelect } from './BaseInputs';
import { ChevronRight, ChevronLeft, Building, MonitorSmartphone, Wrench, ShieldCheck, QrCode, Tag, CheckCircle2, Plus, Trash } from 'lucide-react';
import { ModalBase } from './Modals';
import { getClasses, ClassData } from '../../services/dbService';

const getBuildingCode = (b: string): string => {
  const norm = b.toLowerCase().trim();
  if (norm.includes('dãy a') || norm === 'a') return 'A';
  if (norm.includes('dãy b') || norm === 'b') return 'B';
  if (norm.includes('dãy c') || norm === 'c') return 'C';
  if (norm.includes('đa năng')) return 'NĐN';
  if (norm.includes('thực hành')) return 'TTH';
  if (norm.includes('trung tâm')) return 'TTT';
  return 'A';
};

const getFloorCode = (f: string): string => {
  const norm = f.toLowerCase().trim();
  if (norm.includes('trệt') || norm === 'tầng 1' || norm === '1') return '1';
  if (norm.includes('tầng 2') || norm === '2') return '2';
  if (norm.includes('tầng 3') || norm === '3') return '3';
  if (norm.includes('tầng 4') || norm === '4') return '4';
  const match = norm.match(/\d+/);
  return match ? match[0] : '1';
};

const getInitialAssetsPreview = (roomType: string): string[] => {
  switch (roomType) {
    case 'Phòng sinh hoạt chung':
      return [
        'Bàn ghế mầm non: Bàn ghế nhựa/gỗ thấp phù hợp lứa tuổi, xếp theo nhóm cho hoạt động góc.',
        'Thảm trải nệm ngủ trưa: Bộ nệm gấp/cuộn dùng trải cho trẻ ngủ nghỉ tại lớp.',
        'Giá kệ góc hoạt động: Kệ gỗ nhiều tầng chứa đồ chơi, sách truyện, dụng cụ tạo hình.',
        'Tủ đựng đồ cá nhân: Tủ ngăn có nhãn tên từng bé để cất ba lô, bình nước.',
        'Tivi thông minh / Màn hình tương tác: Chiếu bài giảng điện tử, video giáo dục.',
        'Hệ thống làm mát: Quạt trần, quạt treo tường hoặc điều hòa không khí.'
      ];
    case 'Phòng Chức năng':
      return [
        'Thảm / Sàn gỗ vận động: Sàn mềm an toàn cho trẻ tập thể dục, aerobic.',
        'Đàn organ / Piano điện: Nhạc cụ phục vụ giờ Âm nhạc.',
        'Giá vẽ & dụng cụ tạo hình: Bảng vẽ cá nhân, cọ, màu nước, đất nặn.',
        'Dụng cụ vận động: Bóng gai, cột ném bóng, thang leo, đường hầm chui.'
      ];
    case 'Khu vực Bếp':
      return [
        'Hệ thống bếp công nghiệp: Bếp gas đôi/ba, chảo gang, nồi hấp cơm inox.',
        'Tủ đông & Tủ mát: Bảo quản thực phẩm sống theo quy chuẩn ATTP.',
        'Xe đẩy chia cơm inox: Dùng chia khẩu phần ăn theo từng lớp.'
      ];
    case 'Hành chính & Hỗ trợ':
      return [
        'Thiết bị y tế sơ cứu: Tủ thuốc, cân sức khỏe, nhiệt kế, giường nghỉ.',
        'Hệ thống camera giám sát: Camera quan sát cổng, sân chơi, phòng sinh hoạt.'
      ];
    default:
      return [];
  }
};

export const RoomModal = ({ 
  isOpen, 
  onClose,
  mode = 'edit',
  entityData,
  onSave,
  rooms = [],
  equipments = [],
  maintenances = []
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mode?: 'read' | 'edit';
  entityData?: any;
  onSave?: (data: any) => void;
  rooms?: any[];
  equipments?: any[];
  maintenances?: any[];
}) => {
  const [step, setStep] = useState(1);
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [building, setBuilding] = useState('Khối Dãy A');
  const [floor, setFloor] = useState('1');
  const [type, setType] = useState('Phòng học chuẩn');
  const [capacity, setCapacity] = useState(45);
  const [status, setStatus] = useState<'Đang Sử Dụng' | 'Bảo Trì Định Kỳ' | 'Ngừng Sử Dụng'>('Đang Sử Dụng');
  const [block, setBlock] = useState<'sinh_hoat_chung' | 'phuc_vu_hoc_tap' | 'to_chuc_an' | 'hanh_chinh_ho_tro'>('sinh_hoat_chung');
  const [assignedClassId, setAssignedClassId] = useState('');
  const [hasRestroom, setHasRestroom] = useState(true);
  const [hasPlayground, setHasPlayground] = useState(true);
  const [functionType, setFunctionType] = useState('Phòng Giáo dục Thể chất (Gym/Aerobic)');
  const [kitchenZone, setKitchenZone] = useState('Khu chế biến');
  const [adminType, setAdminType] = useState('Phòng Y tế');
  const [classesList, setClassesList] = useState<ClassData[]>([]);

  const isReadOnly = mode === 'read';

  useEffect(() => {
    if (isOpen) {
      getClasses().then(setClassesList).catch(err => console.error(err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (entityData) {
      setId(entityData.id || '');
      setName(entityData.name || '');
      setBuilding(entityData.building || 'Khối Dãy A');
      setType(entityData.type || 'Phòng học chuẩn');
      setCapacity(entityData.capacity || 45);
      setStatus(entityData.status || 'Đang Sử Dụng');
      setBlock(entityData.block || 'sinh_hoat_chung');
      setAssignedClassId(entityData.assignedClassId || '');
      setHasRestroom(entityData.hasRestroom !== undefined ? entityData.hasRestroom : true);
      setHasPlayground(entityData.hasPlayground !== undefined ? entityData.hasPlayground : true);
      setFunctionType(entityData.functionType || 'Phòng Giáo dục Thể chất (Gym/Aerobic)');
      setKitchenZone(entityData.kitchenZone || 'Khu chế biến');
      setAdminType(entityData.adminType || 'Phòng Y tế');
      
      const codePart = (entityData.id || '').replace(/^Phòng\s+/i, '');
      const match = codePart.match(/\.(\d)\d{2}$/);
      if (match) {
        setFloor(match[1]);
      } else {
        setFloor('1');
      }
    } else {
      setId('');
      setName('');
      setBuilding('Khối Dãy A');
      setType('Phòng học chuẩn');
      setCapacity(45);
      setStatus('Đang Sử Dụng');
      setFloor('1');
      setBlock('sinh_hoat_chung');
      setAssignedClassId('');
      setHasRestroom(true);
      setHasPlayground(true);
      setFunctionType('Phòng Giáo dục Thể chất (Gym/Aerobic)');
      setKitchenZone('Khu chế biến');
      setAdminType('Phòng Y tế');
    }
    setStep(1);
  }, [entityData, isOpen]);

  useEffect(() => {
    if (!entityData && isOpen) {
      const bCode = getBuildingCode(building);
      const fCode = getFloorCode(floor);
      
      const prefix = `${bCode}.${fCode}`;
      let maxSeq = 0;
      rooms.forEach(r => {
        const rId = r.id || '';
        const rName = r.name || '';
        const cleanId = rId.replace(/^Phòng\s+/i, '').trim();
        const cleanName = rName.replace(/^Phòng\s+/i, '').trim();
        
        [cleanId, cleanName].forEach(code => {
          if (code.startsWith(prefix)) {
            const seqStr = code.slice(prefix.length);
            if (/^\d{2}$/.test(seqStr)) {
              const seq = parseInt(seqStr, 10);
              if (seq > maxSeq) {
                maxSeq = seq;
              }
            }
          }
        });
      });
      
      const nextSeq = String(maxSeq + 1).padStart(2, '0');
      const generatedId = `${bCode}.${fCode}${nextSeq}`;
      const generatedName = `Phòng ${generatedId}`;
      
      setId(generatedId);
      setName(generatedName);
    }
  }, [building, floor, entityData, isOpen, rooms]);

  const roomEqs = (equipments || []).filter(e => {
    const loc = e.location || '';
    return loc === name || loc === id || loc === `Phòng ${id}` || loc === `Phòng ${name}`;
  });

  const roomMaint = (maintenances || []).filter(m => {
    const loc = m.location || '';
    return loc === name || loc === id || loc === `Phòng ${id}` || loc === `Phòng ${name}`;
  });

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: id || `Phòng ${name || Date.now().toString().slice(-4)}`,
        building,
        name: name || id,
        type: block === 'sinh_hoat_chung' ? 'Phòng sinh hoạt chung' : block === 'phuc_vu_hoc_tap' ? 'Phòng Chức năng' : block === 'to_chuc_an' ? 'Khu vực Bếp' : 'Hành chính & Hỗ trợ',
        capacity: Number(capacity),
        status,
        block,
        assignedClassId: block === 'sinh_hoat_chung' ? assignedClassId : undefined,
        hasRestroom: block === 'sinh_hoat_chung' ? hasRestroom : undefined,
        hasPlayground: block === 'sinh_hoat_chung' ? hasPlayground : undefined,
        functionType: block === 'phuc_vu_hoc_tap' ? functionType : undefined,
        kitchenZone: block === 'to_chuc_an' ? kitchenZone : undefined,
        adminType: block === 'hanh_chinh_ho_tro' ? adminType : undefined,
        bookings: entityData?.bookings || []
      });
    }
    onClose();
  };

  if (mode === 'read') {
    return (
      <ModalBase isOpen={isOpen} onClose={onClose} title="Chi Tiết Phòng Ban" subtitle="Hệ thống cơ cấu không gian học thuật" width="max-w-5xl" fixedHeight>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f5f8fc]">
          
          {/* Room Header Banner */}
          <div className="bg-[#e8eef6] border border-[#b8c6d9] p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Mã phòng: {id}</span>
              <h4 className="text-2xl font-serif font-bold text-[#1e2a3a] mt-1">{name || id}</h4>
              <p className="text-xs text-[#7b8a9e] font-semibold mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#2c5ea0]" />
                {building} &nbsp;&bull;&nbsp; Tầng {floor}
              </p>
            </div>
            <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
              status === 'Đang Sử Dụng' ? 'bg-[#2e6b8a] text-white shadow-sm' : 
              status === 'Bảo Trì Định Kỳ' ? 'bg-[#a8c4e0] text-black border border-[#8e9eb4]' : 'bg-[#2c5ea0] text-white shadow-sm'
            }`}>
              {status}
            </span>
          </div>

          {/* Two-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: General Info & Specifications (5/12 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Technical Specifications Card */}
              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4">
                <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                  Thông tin phân loại
                </h5>
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Khối không gian</span>
                    <p className="text-sm font-bold text-[#1e2a3a] mt-0.5">{
                      block === 'sinh_hoat_chung' ? '1. Phòng sinh hoạt chung (Lớp học chính)' :
                      block === 'phuc_vu_hoc_tap' ? '2. Phòng phục vụ học tập (Chức năng)' :
                      block === 'to_chuc_an' ? '3. Khu vực Tổ chức ăn (Bếp)' :
                      '4. Hành chính & Hỗ trợ'
                    }</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Loại phòng</span>
                    <p className="text-sm font-bold text-[#1e2a3a] mt-0.5">{type}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Tòa nhà & Vị trí</span>
                    <p className="text-sm font-bold text-[#4a5568] mt-0.5">{building} (Tầng {floor})</p>
                  </div>
                </div>
              </div>

              {/* Block-specific detail card */}
              {block === 'sinh_hoat_chung' && (
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-3">
                  <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2">🏠 Thông tin Lớp học gắn kết</h5>
                  <div>
                    <span className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">Lớp được gán (Assign)</span>
                    <p className="text-sm font-bold text-[#2c5ea0] mt-0.5">{assignedClassId || 'Chưa gán lớp'}</p>
                  </div>
                  <div className="flex gap-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${hasRestroom ? 'text-[#2e6b8a]' : 'text-[#7b8a9e]'}`}>
                      {hasRestroom ? '✅' : '❌'} Phòng Vệ sinh khép kín
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${hasPlayground ? 'text-[#2e6b8a]' : 'text-[#7b8a9e]'}`}>
                      {hasPlayground ? '✅' : '❌'} Hiên chơi / Hành lang
                    </span>
                  </div>
                </div>
              )}
              {block === 'phuc_vu_hoc_tap' && functionType && (
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-3">
                  <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2">🎯 Phòng Chức năng</h5>
                  <p className="text-sm font-bold text-[#1e2a3a]">{functionType}</p>
                  <p className="text-[10px] text-[#7b8a9e] italic">Phòng dùng chung cho toàn trường. Các lớp luân phiên theo lịch đặt phòng.</p>
                </div>
              )}
              {block === 'to_chuc_an' && kitchenZone && (
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-3">
                  <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2">🍳 Khu vực Bếp bán trú</h5>
                  <p className="text-sm font-bold text-[#1e2a3a]">{kitchenZone}</p>
                  <p className="text-[10px] text-[#7b8a9e] italic">Quy trình 1 chiều: Sơ chế → Chế biến → Chia thức ăn.</p>
                </div>
              )}
              {block === 'hanh_chinh_ho_tro' && adminType && (
                <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-3">
                  <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2">🏥 Hành chính & Hỗ trợ</h5>
                  <p className="text-sm font-bold text-[#1e2a3a]">{adminType}</p>
                </div>
              )}

              {/* Sức chứa Card */}
              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] space-y-4">
                <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 flex items-center">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-[#2e6b8a]" />
                  Sức chứa
                </h5>
                <div className="flex items-baseline gap-2 py-1">
                  <span className="text-4xl font-serif font-bold text-[#2c5ea0]">{capacity}</span>
                  <span className="text-xs text-[#7b8a9e] font-bold uppercase tracking-wider">{block === 'sinh_hoat_chung' ? 'Trẻ tối đa' : 'Người tối đa'}</span>
                </div>
              </div>

            </div>

            {/* Right Column: Assets & Maintenance (7/12 cols) */}
            <div className="lg:col-span-7 space-y-6">

              {/* Assets & Equipment Card */}
              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col">
                <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-3 flex items-center shrink-0">
                  <MonitorSmartphone className="w-3.5 h-3.5 mr-1.5 text-[#2e6b8a]" />
                  Vật tư & Thiết bị trong phòng ({roomEqs.length || getInitialAssetsPreview(type).length})
                </h5>
                <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                   {roomEqs.length > 0 ? (
                     roomEqs.map(eq => (
                       <div key={eq.id} className="p-3 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold text-[#4a5568] rounded-xl flex items-center justify-between transition-colors hover:bg-[#e8eef6]">
                         <div className="flex items-center gap-2">
                           <span className={`w-2 h-2 rounded-full ${eq.status === 'Tốt' || eq.status === 'Mới Nhập' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                           <span>{eq.name}</span>
                         </div>
                         <span className="text-[10px] text-[#7b8a9e] font-mono">{eq.id}</span>
                       </div>
                     ))
                   ) : (
                     getInitialAssetsPreview(type).map((asset, index) => (
                       <div key={index} className="p-3 bg-[#f5f8fc] border border-[#b8c6d9] text-xs font-bold text-[#4a5568] rounded-xl flex items-center gap-2 opacity-80 transition-colors hover:bg-[#e8eef6]">
                         <span className="w-2 h-2 rounded-full bg-green-500"></span>
                         <span>{asset} (Mặc định)</span>
                       </div>
                     ))
                   )}
                </div>
              </div>

              {/* Maintenance History Card */}
              <div className="bg-white border border-[#b8c6d9] p-5 rounded-2xl shadow-[2px_2px_0px_#dce4ee] flex flex-col">
                <h5 className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest border-b border-[#dce4ee] pb-2 mb-3 flex items-center shrink-0">
                  <Wrench className="w-3.5 h-3.5 mr-1.5 text-[#2c5ea0]" />
                  Lịch sử bảo trì & Sự cố ({roomMaint.length})
                </h5>
                <div className="max-h-[160px] overflow-y-auto pr-1">
                  {roomMaint.length > 0 ? (
                    <div className="space-y-2.5">
                      {roomMaint.map(m => (
                        <div key={m.id} className="p-3 bg-[#f5f8fc] border border-[#dce4ee] rounded-xl flex justify-between items-center transition-colors hover:bg-[#e8eef6]">
                          <div>
                            <p className="font-bold text-xs text-[#1e2a3a]">{m.detail}</p>
                            <span className="inline-block text-[9px] font-bold text-[#2c5ea0] mt-1 bg-red-50 px-1.5 py-0.5 rounded">Mức độ: {m.severity}</span>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            m.status === 'Đã Hoàn Thành' ? 'bg-[#2e6b8a] text-white' : 
                            m.status === 'Đang Sửa Chữa' ? 'bg-orange-100 text-orange-700' : 'bg-[#a8c4e0] text-black border border-[#8e9eb4]'
                          }`}>
                            {m.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-[#7b8a9e] italic py-4 text-center">Không ghi nhận sự cố hay hoạt động bảo trì nào tại phòng này.</div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end shrink-0">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Đóng</button>
        </div>
      </ModalBase>
    );
  }

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Thiết Lập Phòng Ban" subtitle="Định vị & Phân loại không gian" width="max-w-4xl" fixedHeight>
      <div className="bg-[#e8eef6] px-8 py-4 border-b border-[#b8c6d9] flex items-center justify-between shrink-0 overflow-x-auto">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#2c5ea0] text-white shadow-inner md:scale-110 transition-transform' : 'bg-[#dce4ee] text-[#7b8a9e]'}`}>
              {s}
            </div>
            {s < 2 && <div className={`w-12 md:w-24 h-1 mx-2 rounded ${step > s ? 'bg-[#2c5ea0]' : 'bg-[#dce4ee]'}`}></div>}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2 flex items-center"><Building className="w-4 h-4 mr-2"/> Thông tin Định vị & Phân loại</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã Phòng / Tên ID *</label>
                <input 
                  type="text" 
                  value={id}
                  disabled={isReadOnly || !!entityData}
                  onChange={e => setId(e.target.value)}
                  className="w-full px-4 py-3 bg-[#ffffff] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                  placeholder="VD: Phòng A.101" 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên Phòng Hiển Thị</label>
                <input 
                  type="text" 
                  value={name}
                  disabled={isReadOnly}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#ffffff] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                  placeholder="VD: Phòng A.101" 
                />
              </div>
              <div>
                <BaseSelect
                  label="Tòa Nhà / Dãy *"
                  value={building}
                  options={[
                    {value: 'Khối Dãy A', label: 'Khối Dãy A'}, 
                    {value: 'Khối Dãy B', label: 'Khối Dãy B'}, 
                    {value: 'Khu Bếp Bán Trú', label: 'Khu Bếp Bán Trú'}, 
                    {value: 'Khối Đa Năng', label: 'Khối Đa Năng'}, 
                    {value: 'Cổng Trường', label: 'Cổng Trường'}
                  ]}
                  disabled={isReadOnly}
                  onChange={setBuilding}
                />
              </div>
              <div>
                <BaseSelect
                  label="Tầng"
                  value={floor}
                  options={[
                    {value: '1', label: 'Tầng 1'}, 
                    {value: '2', label: 'Tầng 2'}, 
                    {value: '3', label: 'Tầng 3'}, 
                    {value: '4', label: 'Tầng 4'}
                  ]}
                  disabled={isReadOnly}
                  onChange={setFloor}
                />
              </div>
              <div className="col-span-2">
                <BaseSelect
                  label="Khối Không Gian chức năng *"
                  value={block}
                  options={[
                    {value: 'sinh_hoat_chung', label: '1. Khối phòng sinh hoạt chung (Lớp học chính)'},
                    {value: 'phuc_vu_hoc_tap', label: '2. Khối phòng phục vụ học tập (Phòng Chức năng)'},
                    {value: 'to_chuc_an', label: '3. Khối phòng Tổ chức ăn (Khu vực Bếp)'},
                    {value: 'hanh_chinh_ho_tro', label: '4. Khối phòng Hành chính & Hỗ trợ'}
                  ]}
                  disabled={isReadOnly}
                  onChange={(val: any) => setBlock(val)}
                />
              </div>

              {block === 'sinh_hoat_chung' && (
                <div className="col-span-2 grid grid-cols-2 gap-6 bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
                  <div>
                    <BaseSelect
                      label="Lớp học được Gán (Assign) *"
                      value={assignedClassId}
                      options={[
                        {value: '', label: '-- Chọn lớp học mầm non --'},
                        ...classesList.map(c => ({ value: c.name, label: c.name }))
                      ]}
                      disabled={isReadOnly}
                      onChange={setAssignedClassId}
                    />
                  </div>
                  <div className="flex flex-col justify-center space-y-2 pl-4">
                    <label className="flex items-center gap-2.5 font-bold text-xs text-[#1e2a3a] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasRestroom}
                        disabled={isReadOnly}
                        onChange={e => setHasRestroom(e.target.checked)}
                        className="rounded text-[#2c5ea0] border-[#b8c6d9] focus:ring-[#2c5ea0]/20"
                      />
                      Có phòng Vệ sinh khép kín đi kèm
                    </label>
                    <label className="flex items-center gap-2.5 font-bold text-xs text-[#1e2a3a] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasPlayground}
                        disabled={isReadOnly}
                        onChange={e => setHasPlayground(e.target.checked)}
                        className="rounded text-[#2c5ea0] border-[#b8c6d9] focus:ring-[#2c5ea0]/20"
                      />
                      Có Hiên chơi / Hành lang an toàn
                    </label>
                  </div>
                </div>
              )}

              {block === 'phuc_vu_hoc_tap' && (
                <div className="col-span-2 bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
                  <BaseSelect
                    label="Loại Phòng Chức Năng *"
                    value={functionType}
                    options={[
                      {value: 'Phòng Giáo dục Thể chất (Gym/Aerobic)', label: 'Phòng Giáo dục Thể chất (Gym/Aerobic) - Thảm, gương, dụng cụ vận động'},
                      {value: 'Phòng Nghệ thuật / Âm nhạc', label: 'Phòng Nghệ thuật / Âm nhạc - Đàn organ, piano, giá vẽ'},
                      {value: 'Phòng Ngoại ngữ / Tin học', label: 'Phòng Ngoại ngữ / Tin học - Màn hình tương tác, máy tính nhóm'},
                      {value: 'Phòng Đa năng (Hội trường lớn)', label: 'Phòng Đa năng (Hội trường lớn) - Sân khấu, khai giảng, trông muộn'}
                    ]}
                    disabled={isReadOnly}
                    onChange={setFunctionType}
                  />
                </div>
              )}

              {block === 'to_chuc_an' && (
                <div className="col-span-2 bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
                  <BaseSelect
                    label="Phân khu Khu vực Bếp (Quy trình 1 chiều) *"
                    value={kitchenZone}
                    options={[
                      {value: 'Khu giao nhận & Sơ chế', label: 'Khu 1: Giao nhận & Sơ chế thực phẩm sống'},
                      {value: 'Khu chế biến', label: 'Khu 2: Chế biến & Nấu chín thức ăn'},
                      {value: 'Khu chia thức ăn', label: 'Khu 3: Phân chia khẩu phần & Soạn khay ăn'},
                      {value: 'Kho thực phẩm khô', label: 'Kho 1: Lưu trữ sữa, gạo, gia vị đồ khô'},
                      {value: 'Kho thực phẩm lạnh', label: 'Kho 2: Tủ cấp đông, bảo quản thịt cá'}
                    ]}
                    disabled={isReadOnly}
                    onChange={setKitchenZone}
                  />
                </div>
              )}

              {block === 'hanh_chinh_ho_tro' && (
                <div className="col-span-2 bg-[#f8fafc] p-4 rounded-xl border border-[#e2e8f0]">
                  <BaseSelect
                    label="Loại phòng Hành chính & Hỗ trợ *"
                    value={adminType}
                    options={[
                      {value: 'Phòng Y tế', label: 'Phòng Y tế học đường - Giường nằm, tủ thuốc sơ cứu'},
                      {value: 'Phòng BGH & Họp chuyên môn', label: 'Phòng Ban Giám hiệu & Phòng họp chuyên môn'},
                      {value: 'Phòng Bảo vệ & Lễ tân', label: 'Phòng Bảo vệ & Lễ tân - camera trực cổng, đón trả trẻ'}
                    ]}
                    disabled={isReadOnly}
                    onChange={setAdminType}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2 flex items-center"><ShieldCheck className="w-4 h-4 mr-2"/> Sức chứa & Tài sản gắn liền</h4>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Sức chứa tối đa (Trẻ / Người) *</label>
                  <input 
                    type="number" 
                    value={capacity}
                    disabled={isReadOnly}
                    onChange={e => setCapacity(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-[#ffffff] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                  />
                  <p className="text-[10px] text-[#7b8a9e] mt-1 font-bold">Thuật toán TKB sẽ cảnh báo nếu phân lớp &gt; sức chứa.</p>
               </div>
               <div>
                  <BaseSelect
                    label="Trạng thái Hoạt động"
                    value={status}
                    options={[
                      {value: 'Đang Sử Dụng', label: 'Đang Sử Dụng'}, 
                      {value: 'Bảo Trì Định Kỳ', label: 'Bảo Trì Định Kỳ'}, 
                      {value: 'Ngừng Sử Dụng', label: 'Ngừng Sử Dụng'}
                    ]}
                    disabled={isReadOnly}
                    onChange={(val: any) => setStatus(val)}
                  />
               </div>
               <div className="col-span-2">
                 <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tài sản Cố định (Sẽ được tự động gán khi tạo mới)</label>
                 <div className="space-y-3 bg-[#f0f4fa] p-4 border border-[#b8c6d9] rounded-xl shadow-sm">
                    <div className="flex flex-col gap-2">
                       {getInitialAssetsPreview(type).map((asset, index) => (
                         <div key={index} className="px-3 py-2.5 bg-white border border-[#b8c6d9] text-xs font-bold text-[#4a5568] rounded-xl flex items-center gap-2">
                           <span className="w-2 h-2 rounded-full bg-green-500"></span>
                           <span>{asset}</span>
                         </div>
                       ))}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto shrink-0">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"><ChevronLeft className="w-4 h-4 mr-1"/> Quay Lại</button>
        ) : <div></div>}
        
        {step < 2 ? (
          <button onClick={() => setStep(step + 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Tiếp Theo <ChevronRight className="w-4 h-4 ml-1"/></button>
        ) : (
          !isReadOnly ? (
            <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#5c2a2a] shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-0.5 transition-all">Lưu Hồ Sơ Phòng</button>
          ) : (
            <button onClick={onClose} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Đóng</button>
          )
        )}
      </div>
    </ModalBase>
  );
};

export const EquipmentModal = ({ 
  isOpen, 
  onClose,
  mode = 'edit',
  entityData,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mode?: 'read' | 'edit';
  entityData?: any;
  onSave?: (data: any) => void;
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Công Nghệ Thông Tin');
  const [location, setLocation] = useState('Phòng Máy Tính 1');
  const [status, setStatus] = useState<'Tốt' | 'Hư Hỏng' | 'Mới Nhập' | 'Ngưng Sử Dụng'>('Tốt');

  useEffect(() => {
    if (entityData) {
      setId(entityData.id || '');
      setName(entityData.name || '');
      setCategory(entityData.category || 'Công Nghệ Thông Tin');
      setLocation(entityData.location || 'Phòng Máy Tính 1');
      setStatus(entityData.status || 'Tốt');
    } else {
      setId(`EQ-${Date.now().toString().slice(-4)}`);
      setName('');
      setCategory('Công Nghệ Thông Tin');
      setLocation('Phòng Máy Tính 1');
      setStatus('Mới Nhập');
    }
  }, [entityData, isOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id,
        name: name || id,
        category,
        location,
        status
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={mode === 'read' ? "Chi Tiết Thiết Bị" : "Cấu Hình Thiết Bị / Vật Tư"} subtitle="Định danh & Thông số thiết bị" width="max-w-4xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
             <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><Tag className="w-4 h-4 mr-2"/> Cấu hình Định danh</h4>
             <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên Thiết Bị / Vật Tư *</label>
                <input 
                  type="text" 
                  value={name}
                  disabled={mode === 'read'}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#ffffff] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                  placeholder="VD: Máy chiếu Panasonic PT-LB386" 
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <BaseSelect
                     label="Danh mục"
                     value={category}
                     options={[
                       {value: 'Công Nghệ Thông Tin', label: 'Công Nghệ Thông Tin'}, 
                       {value: 'Nghe Nhìn - Trình Chiếu', label: 'Nghe Nhìn - Trình Chiếu'}, 
                       {value: 'Âm Thanh', label: 'Âm Thanh'}, 
                       {value: 'Dụng cụ Thí nghiệm', label: 'Dụng cụ Thí nghiệm'}, 
                       {value: 'Nội thất (Bàn/Ghế)', label: 'Nội thất (Bàn/Ghế)'},
                       {value: 'Thiết bị CNTT', label: 'Thiết bị CNTT'},
                       {value: 'Thiết bị phòng chức năng', label: 'Thiết bị phòng chức năng'},
                       {value: 'Thiết bị âm thanh và sự kiện', label: 'Thiết bị âm thanh và sự kiện'},
                       {value: 'Nội thất phòng học', label: 'Nội thất phòng học'},
                       {value: 'Nội thất văn phòng', label: 'Nội thất văn phòng'},
                       {value: 'Thiết bị thư viện', label: 'Thiết bị thư viện'},
                       {value: 'Thiết bị y tế', label: 'Thiết bị y tế'},
                       {value: 'Thiết bị bếp ăn', label: 'Thiết bị bếp ăn'},
                       {value: 'Thể thao quốc phòng', label: 'Thể thao quốc phòng'},
                       {value: 'Vật tư phòng cháy', label: 'Vật tư phòng cháy'},
                       {value: 'Vật tư bảo trì', label: 'Vật tư bảo trì'}
                     ]}
                     disabled={mode === 'read'}
                     onChange={setCategory}
                   />
                </div>
                <div>
                   <BaseSelect
                     label="Trạng thái"
                     value={status}
                     options={[
                       {value: 'Tốt', label: 'Tốt'}, 
                       {value: 'Hư Hỏng', label: 'Hư Hỏng'}, 
                       {value: 'Mới Nhập', label: 'Mới Nhập'}, 
                       {value: 'Ngưng Sử Dụng', label: 'Ngưng Sử Dụng'}
                     ]}
                     disabled={mode === 'read'}
                     onChange={(val: any) => setStatus(val)}
                   />
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Vị trí Hiện tại / Cấp phát</label>
                <BaseSelect
                  label="Vị trí"
                  value={location}
                  options={[
                    {value: 'Kho chứa', label: 'Kho chứa (Kho chung)'},
                    {value: 'Sân vận động', label: 'Sân vận động'},
                    {value: 'Phòng y tế', label: 'Phòng y tế'},
                    {value: 'Khu vực Bếp ăn', label: 'Khu vực Bếp ăn'},
                    {value: 'Thư Viện', label: 'Thư Viện'},
                    {value: 'Văn phòng BGH', label: 'Văn phòng BGH'},
                    {value: 'Phòng Hành Chính', label: 'Phòng Hành Chính'},
                    {value: 'Phòng Máy Tính 1', label: 'Phòng Máy Tính 1'}, 
                    {value: 'Phòng Máy Tính 2', label: 'Phòng Máy Tính 2'}, 
                    {value: 'Phòng Thí Nghiệm Lý', label: 'Phòng Thí Nghiệm Lý'},
                    {value: 'Phòng Thí Nghiệm Hóa', label: 'Phòng Thí Nghiệm Hóa'},
                    {value: 'Phòng Thí Nghiệm Sinh', label: 'Phòng Thí Nghiệm Sinh'},
                    {value: 'Hội Trường Lớn', label: 'Hội Trường Lớn'}, 
                    {value: 'Phòng A.101', label: 'Phòng A.101'}, 
                    {value: 'Phòng A.102', label: 'Phòng A.102'}, 
                    {value: 'Phòng B.101', label: 'Phòng B.101'}, 
                    {value: 'Phòng B.302', label: 'Phòng B.302'},
                    {value: 'Kho Nhập (Chưa Phân Phối)', label: 'Kho Nhập (Chưa Phân Phối)'}
                  ]}
                  disabled={mode === 'read'}
                  onChange={setLocation}
                />
             </div>
           </div>

           <div className="space-y-6">
             <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center"><QrCode className="w-4 h-4 mr-2"/> Quản lý Mã vạch & Vị trí</h4>
             
             <div className="bg-[#e8eef6] border border-[#b8c6d9] p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                <QrCode className="w-20 h-20 text-[#1e2a3a] mb-2 opacity-50" />
                <p className="font-mono text-sm font-bold text-[#1e2a3a]">{id}</p>
                <p className="text-[10px] text-[#7b8a9e] font-bold uppercase tracking-widest mt-1">Mã định danh thiết bị</p>
             </div>
           </div>
        </div>
      </div>
      
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-4 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#7b8a9e] hover:text-[#4a5568] uppercase tracking-widest transition-colors">Đóng</button>
        {mode === 'edit' && (
          <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Lưu Tài Sản</button>
        )}
      </div>
    </ModalBase>
  );
};

export const MaintenanceModal = ({ 
  isOpen, 
  onClose,
  mode = 'edit',
  entityData,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  mode?: 'read' | 'edit';
  entityData?: any;
  onSave?: (data: any) => void;
}) => {
  const [id, setId] = useState('');
  const [detail, setDetail] = useState('');
  const [location, setLocation] = useState('Phòng A.101');
  const [severity, setSeverity] = useState<'Nghiêm Trọng' | 'Trung Bình' | 'Thấp'>('Trung Bình');
  const [status, setStatus] = useState<'Chờ Xếp Lịch' | 'Đang Sửa Chữa' | 'Đã Hoàn Thành' | 'Hủy Bỏ'>('Chờ Xếp Lịch');

  useEffect(() => {
    if (entityData) {
      setId(entityData.id || '');
      setDetail(entityData.detail || '');
      setLocation(entityData.location || 'Phòng A.101');
      setSeverity(entityData.severity || 'Trung Bình');
      setStatus(entityData.status || 'Chờ Xếp Lịch');
    } else {
      setId(`REQ-${Date.now().toString().slice(-4)}`);
      setDetail('');
      setLocation('Phòng A.101');
      setSeverity('Trung Bình');
      setStatus('Chờ Xếp Lịch');
    }
  }, [entityData, isOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id,
        detail: detail || 'Báo cáo sự cố cơ sở vật chất',
        location,
        severity,
        status
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={mode === 'read' ? "Chi Tiết Yêu Cầu Sửa Chữa" : "Lập Phiếu Yêu Cầu Sửa Chữa"} subtitle="Helpdesk & Sự cố CSVC" width="max-w-4xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
             <div className="flex items-center gap-4 bg-[#e8eef6] p-4 rounded-xl border border-[#b8c6d9]">
                <div className="flex-1">
                   <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Mã Phiếu</p>
                   <p className="font-mono font-bold text-[#1e2a3a]">{id}</p>
                </div>
                <div className="flex-1">
                   <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Trạng thái xử lý</p>
                   <div className="w-36">
                     <BaseSelect
                       value={status}
                       options={[
                         {value: 'Chờ Xếp Lịch', label: 'Chờ Xếp Lịch'},
                         {value: 'Đang Sửa Chữa', label: 'Đang Sửa Chữa'},
                         {value: 'Đã Hoàn Thành', label: 'Đã Hoàn Thành'},
                         {value: 'Hủy Bỏ', label: 'Hủy Bỏ'}
                       ]}
                       disabled={mode === 'read'}
                       onChange={(val: any) => setStatus(val)}
                       wrapperClassName="w-full"
                     />
                   </div>
                </div>
             </div>

             <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Người Yêu Cầu</label>
                <input type="text" className="w-full px-4 py-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" defaultValue="GV. Nguyễn Tấn Phong (Tổ Vật Lý)" readOnly />
             </div>

             <div>
                <BaseSelect
                  label="Vị Trí Cụ Thể (Phòng / Khu vực) *"
                  value={location}
                  options={[
                    {value: 'Phòng A.101', label: 'Phòng A.101'}, 
                    {value: 'Phòng B.302', label: 'Phòng B.302'}, 
                    {value: 'Hội Trường Lớn', label: 'Hội Trường Lớn'}, 
                    {value: 'Sân trường chính', label: 'Sân trường chính'}
                  ]}
                  disabled={mode === 'read'}
                  onChange={setLocation}
                />
             </div>
           </div>

           <div className="space-y-6">
             <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mô tả Sự Cố *</label>
                <textarea 
                  rows={4} 
                  value={detail}
                  disabled={mode === 'read'}
                  onChange={e => setDetail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#ffffff] disabled:bg-[#e8eef6] disabled:text-[#8e9eb4] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                  placeholder="Mô tả chi tiết tình trạng lỗi... VD: Máy chiếu bật không lên nguồn, đèn LED báo đỏ." 
                />
             </div>

             <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-3">Mức Độ Ưu Tiên (Cần xử lý ngay?)</label>
                <div className="flex gap-4">
                   {['Thấp', 'Trung Bình', 'Nghiêm Trọng'].map((sev: any) => (
                     <label 
                       key={sev} 
                       className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition ${
                         severity === sev 
                           ? 'bg-[#fef9c3] border-[#fef08a] shadow-sm font-bold text-[#854d0e]' 
                           : 'bg-white border-[#b8c6d9] text-[#1e2a3a]'
                       }`}
                     >
                        <input 
                          type="radio" 
                          name="priority" 
                          checked={severity === sev}
                          disabled={mode === 'read'}
                          onChange={() => setSeverity(sev)}
                          className="mb-2 text-[#2c5ea0]" 
                        />
                        <span className="text-xs">{sev}</span>
                     </label>
                   ))}
                </div>
             </div>
           </div>
        </div>
      </div>
      
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-4 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#7b8a9e] hover:text-[#4a5568] uppercase tracking-widest transition-colors">Đóng</button>
        {mode === 'edit' && (
          <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#991b1b] text-white uppercase tracking-widest hover:bg-[#7f1d1d] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Lưu Phiếu</button>
        )}
      </div>
    </ModalBase>
  );
};
