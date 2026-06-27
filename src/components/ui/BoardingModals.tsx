import React, { useState } from 'react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { ChevronRight, ChevronLeft, Search, AlertTriangle, CheckCircle2, Utensils, Box, ShieldCheck, ClipboardCheck } from 'lucide-react';
import { ModalBase } from './Modals';

const getTodayFormatted = () => {
  const now = new Date();
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = days[now.getDay()];
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  return `${dayName} - ${dd}/${mm}/${yyyy}`;
};

export const MenuPlannerModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(getTodayFormatted());
  const [meal, setMeal] = useState('Bữa trưa');
  const [items, setItems] = useState('');
  const [sampleStatus, setSampleStatus] = useState('Đã lưu mẫu');
  const [qty, setQty] = useState(450);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: `MENU-${Date.now().toString().slice(-4)}`,
        date,
        meal,
        items,
        sampleStatus,
        qty: Number(qty)
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Lên Thực Đơn Bán Trú" subtitle="Quản lý suất ăn & Lưu mẫu ATVSTP" width="max-w-4xl" fixedHeight>
      <div className="bg-[#e8eef6] px-8 py-4 border-b border-[#b8c6d9] flex items-center justify-between overflow-x-auto shrink-0">
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
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Ngày áp dụng</label>
                <input type="text" value={date} onChange={e => setDate(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: T2 - 15/06/2026" />
              </div>
              <div>
                <BaseSelect
                  label="Bữa ăn"
                  value={meal}
                  options={[{value: 'Bữa trưa', label: 'Bữa trưa'}, {value: 'Bữa xế', label: 'Bữa xế'}]}
                  onChange={setMeal}
                />
              </div>
            </div>

            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2 mt-8 flex items-center"><Utensils className="w-4 h-4 mr-2" /> Thiết lập Combo Khay Cơm</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Món ăn chi tiết (các món cách nhau bằng dấu phẩy) *</label>
                <textarea rows={3} value={items} onChange={e => setItems(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Thịt kho trứng, Bắp cải xào, Canh chua, Chuối..." />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số lượng suất ăn dự kiến *</label>
                <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Hồ Sơ Lưu Mẫu Thức Ăn (Luật ATVSTP)</h4>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <BaseSelect
                    label="Người lấy mẫu *"
                    value="Trưởng Bếp: Nguyễn Văn Tài"
                    options={[{value: 'Trưởng Bếp: Nguyễn Văn Tài', label: 'Trưởng Bếp: Nguyễn Văn Tài'}, {value: 'Nhân viên: Lê Thị Hoa', label: 'Nhân viên: Lê Thị Hoa'}]}
                    onChange={() => {}}
                  />
               </div>
               <div>
                  <BaseDatePicker type="time" label="Giờ lấy mẫu & Niêm phong" value="10:30" onChange={() => {}} />
               </div>
               <div>
                  <BaseSelect
                    label="Trạng thái mẫu lưu"
                    value={sampleStatus}
                    options={[{value: 'Đã lưu mẫu', label: 'Đã lưu mẫu'}, {value: 'Đang chờ', label: 'Đang chờ'}]}
                    onChange={setSampleStatus}
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hạn hủy mẫu (Tự động tính 24h)</label>
                  <div className="w-full px-4 py-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#7b8a9e]">
                     10:30 ngày hôm sau
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
          <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#5c2a2a] shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-0.5 transition-all">Ban Hành Thực Đơn</button>
        )}
      </div>
    </ModalBase>
  );
};

export const InboundInventoryModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [supplier, setSupplier] = useState('Công ty Cổ phần Thực phẩm Vissan');
  const [items, setItems] = useState('');
  const [sensory, setSensory] = useState('');
  const [status, setStatus] = useState('Đạt (Nhập vào)');
  const [certExpiry, setCertExpiry] = useState('12/08/2026');

  const handleSave = () => {
    if (onSave) {
      onSave({
        supplier,
        items,
        sensoryInspection: sensory,
        status,
        certExpiry,
        id: `NK-${new Date().getFullYear() % 100}${(new Date().getMonth()+1).toString().padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 90 + 10)}`
      });
    }
    onClose();
  };
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Nhập Kho & Kiểm Thực" subtitle="Kiểm duyệt và truy xuất vật tư đầu vào" width="max-w-4xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2">Thông tin Hóa Đơn - Đối tác</h4>
              <div>
                  <BaseSelect
                    label="Nhà Cung Cấp"
                    value={supplier}
                    options={[
                      {value: 'Công ty Cổ phần Thực phẩm Vissan', label: 'Công ty Cổ phần Thực phẩm Vissan'}, 
                      {value: 'HTX Rau Sạch Đà Lạt', label: 'HTX Rau Sạch Đà Lạt'}
                    ]}
                    onChange={setSupplier}
                  />
              </div>
              <div className="bg-[#fef9c3] border border-[#fef08a] p-4 rounded-xl flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-[#a16207] shrink-0" />
                 <div>
                    <p className="text-xs font-bold text-[#854d0e] uppercase tracking-widest">Chứng nhận ATVSTP Của Đối Tác</p>
                    <p className="text-sm font-bold text-[#713f12]">Còn hạn 45 ngày (12/08/2026)</p>
                 </div>
              </div>
           </div>
           <div className="space-y-4">
              <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2">Thời gian & Trách nhiệm</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Phiếu Trừ Kho</label>
                  <input type="text" className="w-full px-4 py-3 bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#7b8a9e]" defaultValue="NK-260611-01" readOnly/>
                </div>
                <div>
                  <BaseDatePicker type="time" label="Giờ Kiểm Bước 1" value="05:30" onChange={() => {}} />
                </div>
              </div>
           </div>
        </div>

        <div className="space-y-4 border-t-[3px] border-double border-[#b8c6d9] pt-6">
           <div className="flex items-center justify-between">
             <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest flex items-center"><ClipboardCheck className="w-4 h-4 mr-2"/> Chi tiết Vật tư & Kiểm cảm quan (B1)</h4>
             <button className="text-[10px] font-bold uppercase tracking-widest text-[#1e2a3a] bg-white border border-[#b8c6d9] px-3 py-1.5 rounded hover:bg-[#dce4ee] transition">+ Thêm Mặt Hàng</button>
           </div>
           
           <div className="space-y-3">
              <div className="bg-[#f0f4fa] p-4 border border-[#b8c6d9] rounded-xl shadow-sm flex flex-col md:flex-row gap-4 items-center">
                 <div className="flex-1">
                   <p className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Chi tiết mặt hàng (Tên & Khối lượng)</p>
                   <input 
                     type="text" 
                     value={items} 
                     onChange={e => setItems(e.target.value)} 
                     placeholder="VD: Thịt heo nạc dăm - 20 Kg" 
                     className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a]" 
                   />
                 </div>
                 <div className="flex-1">
                   <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest mb-1">Cảm quan (Màu, Mùi, Tươi...)</p>
                   <input 
                     type="text" 
                     value={sensory} 
                     onChange={e => setSensory(e.target.value)} 
                     placeholder="VD: Thịt tươi, đàn hồi tốt..." 
                     className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a]" 
                   />
                 </div>
                 <div className="w-48">
                   <BaseSelect
                     label="Đánh giá nhanh"
                     value={status}
                     options={[{value: 'Đạt (Nhập vào)', label: 'Đạt (Nhập vào)'}, {value: 'Không đạt (Trả về)', label: 'Không đạt (Trả về)'}]}
                     onChange={setStatus}
                   />
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto shrink-0">
        <button className="text-xs font-bold text-[#7b8a9e] hover:text-[#4a5568] uppercase tracking-widest p-2">Tải Phiếu Chữ Ký Tay Lên (.pdf/.jpg)</button>
        <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Lưu Phiếu Nhập & Kho</button>
      </div>
    </ModalBase>
  );
};

export const BoardingRoomModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(40);
  const [supervisor, setSupervisor] = useState('');

  const handleSave = () => {
    if (!id.trim() || !name.trim() || !supervisor.trim()) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (onSave) {
      onSave({
        id,
        name,
        capacity,
        current: 0,
        supervisor,
        present: 0,
        absent: 0
      });
    }
    // Reset state
    setId('');
    setName('');
    setSupervisor('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Thêm Phòng Nghỉ Bán Trú" subtitle="Quản lý phòng nghỉ học sinh" width="max-w-md">
      <div className="p-6 space-y-4 bg-[#f5f8fc]">
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã phòng *</label>
          <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: D103" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên phòng *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: Phòng nghỉ Nam 3" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Sức chứa (Giường) *</label>
          <input type="number" value={capacity} onChange={e => setCapacity(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Giám thị phụ trách *</label>
          <input type="text" value={supervisor} onChange={e => setSupervisor(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: Nguyễn Văn C" />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
          <button onClick={onClose} className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase tracking-widest text-[#4a5568] rounded-lg">Đóng</button>
          <button onClick={handleSave} className="px-5 py-2 bg-[#2c5ea0] hover:bg-[#5c2a2a] text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-sm">Lưu Phòng</button>
        </div>
      </div>
    </ModalBase>
  );
};

export const SupplierModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Thịt, cá tươi sống');
  const [certStatus, setCertStatus] = useState('Hợp lệ');
  const [expDate, setExpDate] = useState('12/08/2026');

  const handleSave = () => {
    if (!id.trim() || !name.trim()) {
      alert("Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (onSave) {
      onSave({
        id,
        name,
        category,
        certStatus,
        expDate
      });
    }
    // Reset state
    setId('');
    setName('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Thêm Đối Tác Liên Kết" subtitle="Đối tác cung cấp thực phẩm căn-tin" width="max-w-md">
      <div className="p-6 space-y-4 bg-[#f5f8fc]">
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã đối tác *</label>
          <input type="text" value={id} onChange={e => setId(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: SUP-03" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên đối tác *</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: Công ty TNHH Vissan" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Phân loại *</label>
          <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full px-4 py-3 bg-white border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: Rau, củ, quả hữu cơ" />
        </div>
        <div>
          <BaseSelect
            label="Trạng thái chứng nhận"
            value={certStatus}
            options={[{value: 'Hợp lệ', label: 'Hợp lệ'}, {value: 'Gần hết hạn', label: 'Gần hết hạn'}, {value: 'Hết hạn', label: 'Hết hạn'}]}
            onChange={setCertStatus}
          />
        </div>
        <div>
          <BaseDatePicker label="Hạn chứng nhận" value={expDate} onChange={setExpDate} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#b8c6d9]">
          <button onClick={onClose} className="px-5 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold uppercase tracking-widest text-[#4a5568] rounded-lg">Đóng</button>
          <button onClick={handleSave} className="px-5 py-2 bg-[#2c5ea0] hover:bg-[#5c2a2a] text-white text-xs font-bold uppercase tracking-widest rounded-lg shadow-sm">Lưu Đối Tác</button>
        </div>
      </div>
    </ModalBase>
  );
};

