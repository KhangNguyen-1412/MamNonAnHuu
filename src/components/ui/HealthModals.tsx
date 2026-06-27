import React, { useState, useEffect } from 'react';
import { BaseSelect } from './BaseInputs';
import { ChevronRight, ChevronLeft, Search, AlertTriangle, ShieldCheck, Pill, CheckCircle2, HeartPulse, Clock, FileText, Syringe, ShieldAlert, User, Plus } from 'lucide-react';
import { ModalBase } from './Modals';

export const MedicalIncidentModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [step, setStep] = useState(1);
  const [patientName, setPatientName] = useState('Phạm Minh Kha');
  const [patientId, setPatientId] = useState('HS-21-0492');
  const [reason, setReason] = useState('Sốt cao');
  const [temp, setTemp] = useState('38.5');
  const [bp, setBp] = useState('110/70');
  const [treatment, setTreatment] = useState('Nằm nghỉ tại giường, chườm ấm...');
  const [outcome, setOutcome] = useState('Đã khỏe và về lớp');

  const handleSave = () => {
    if (onSave) {
      onSave({
        patientName,
        patientId,
        reason,
        temp,
        bp,
        treatment,
        outcome
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Sổ Ghi Nhận Y Tế" subtitle="Báo cáo sơ cấp cứu & Cấp phát thuốc" width="max-w-4xl" fixedHeight>
      <div className="bg-[#e8eef6] px-8 py-4 border-b border-[#b8c6d9] flex items-center justify-between overflow-x-auto shrink-0">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#2c5ea0] text-white shadow-inner md:scale-110 transition-transform' : 'bg-[#dce4ee] text-[#7b8a9e]'}`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 md:w-24 h-1 mx-2 rounded ${step > s ? 'bg-[#2c5ea0]' : 'bg-[#dce4ee]'}`}></div>}
          </div>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Thông tin Bệnh nhân</h4>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
              <input 
                type="text" 
                placeholder="Tìm kiếm theo Mã Học sinh / Mã Giáo viên..." 
                className="w-full pl-12 pr-4 py-3 bg-[#ffffff] border border-[#2c5ea0] shadow-[4px_4px_0px_#dce4ee] rounded-xl text-sm font-bold text-[#1e2a3a] focus:outline-none" 
                value={patientId}
                onChange={(e) => {
                  setPatientId(e.target.value);
                  if (e.target.value.includes('0103')) {
                    setPatientName('Trần Thị Bảo Ngân');
                  } else {
                    setPatientName('Phạm Minh Kha');
                  }
                }}
              />
            </div>
            
            <div className="p-5 border border-[#b8c6d9] rounded-xl bg-[#f0f4fa] flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1e2a3a] text-white rounded-full flex items-center justify-center font-bold text-lg">{patientName.charAt(0)}</div>
                  <div>
                    <p className="text-lg font-bold text-[#1e2a3a]">{patientName}</p>
                    <p className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">Lớp 12A1 • {patientId}</p>
                  </div>
               </div>
               <span className="px-3 py-1 bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-[10px] font-bold uppercase tracking-widest rounded-full">BHYT: Còn hạn (&gt;6T)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="bg-[#fee2e2] border border-[#fecaca] p-4 rounded-xl">
                  <p className="text-xs font-bold text-[#991b1b] flex items-center mb-1"><AlertTriangle className="w-4 h-4 mr-1"/> Tiền sử bệnh lý (Lưu ý)</p>
                  <p className="text-sm font-bold text-[#7f1d1d]">{patientName === 'Phạm Minh Kha' ? 'Hen suyễn' : 'Không'}</p>
               </div>
               <div className="bg-[#fee2e2] border border-[#fecaca] p-4 rounded-xl">
                  <p className="text-xs font-bold text-[#991b1b] flex items-center mb-1"><AlertTriangle className="w-4 h-4 mr-1"/> Dị ứng báo cáo</p>
                  <p className="text-sm font-bold text-[#7f1d1d]">{patientName === 'Phạm Minh Kha' ? 'Dị ứng Penicillin' : 'Dị ứng Hải sản'}</p>
               </div>
            </div>

            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2 mt-8">Triệu chứng & Sinh hiệu lúc vào</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <BaseSelect
                  label="Lý do vào phòng y tế *"
                  value={reason}
                  options={[{value: 'Sốt cao', label: 'Sốt cao'}, {value: 'Đau bụng/Tiêu hoá', label: 'Đau bụng/Tiêu hoá'}, {value: 'Chấn thương (Khuôn viên trường)', label: 'Chấn thương (Khuôn viên trường)'}, {value: 'Cảm/Ho/Sổ mũi', label: 'Cảm/Ho/Sổ mũi'}, {value: 'Hạ đường huyết', label: 'Hạ đường huyết'}, {value: 'Khác', label: 'Khác'}]}
                  onChange={(val) => setReason(val)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nhiệt độ (°C)</label>
                    <input 
                      type="number" 
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                      value={temp} 
                      onChange={(e) => setTemp(e.target.value)}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Huyết áp (mmHg)</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
                      placeholder="VD: 110/70" 
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                    />
                 </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Biện pháp xử lý & Cấp thuốc</h4>
            <div className="grid grid-cols-1 gap-6">
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Chi tiết xử lý tại chỗ</label>
                  <textarea 
                    className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] min-h-[100px]" 
                    placeholder="Nằm nghỉ tại giường, chườm ấm..."
                    value={treatment}
                    onChange={(e) => setTreatment(e.target.value)}
                  />
               </div>
               
               <div className="border border-[#2c5ea0] shadow-[4px_4px_0px_#dce4ee] rounded-xl bg-[#f0f4fa] p-5">
                 <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-bold text-[#2c5ea0] flex items-center"><Pill className="w-4 h-4 mr-2"/> Chỉ định dùng thuốc</p>
                    <button className="text-[10px] font-bold uppercase tracking-widest text-[#1e2a3a] bg-white border border-[#b8c6d9] px-3 py-1.5 rounded hover:bg-[#dce4ee]">+ Thêm thuốc</button>
                 </div>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <div className="flex-1">
                          <BaseSelect
                            value="Paracetamol 500mg"
                            options={[{value: 'Paracetamol 500mg', label: 'Paracetamol 500mg'}, {value: 'Oresol', label: 'Oresol'}, {value: 'Băng gạc', label: 'Băng gạc'}]}
                            onChange={() => {}}
                          />
                       </div>
                       <input type="number" defaultValue="1" className="w-20 px-4 py-2 bg-[#ffffff] border border-[#b8c6d9] rounded-lg text-sm font-bold text-[#1e2a3a]" />
                       <span className="text-xs font-bold text-[#7b8a9e] w-12">Viên</span>
                    </div>
                    <p className="text-[10px] text-[#7b8a9e] italic">Ghi chú: Kho sẽ tự động cập nhật số lượng sau khi lưu biên bản.</p>
                 </div>
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
           <div className="space-y-6">
             <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Đánh giá Outcomes & Thông báo</h4>
             <div className="grid grid-cols-2 gap-6">
                <div>
                   <BaseSelect
                     label="Kết quả xử lý *"
                     value={outcome}
                     options={[{value: 'Đã khỏe và về lớp', label: 'Đã khỏe và về lớp'}, {value: 'Đang nằm nghỉ (Tiếp tục theo dõi)', label: 'Đang nằm nghỉ (Tiếp tục theo dõi)'}, {value: 'Xin phép nghỉ học về nhà', label: 'Xin phép nghỉ học về nhà'}, {value: 'Chuyển viện cấp cứu', label: 'Chuyển viện cấp cứu'}]}
                     onChange={(val) => setOutcome(val)}
                   />
                </div>
                <div>
                   <BaseSelect
                     label="Người phụ trách sơ cứu *"
                     value="NVYT: Trần Bích Châu"
                     options={[{value: 'NVYT: Trần Bích Châu', label: 'NVYT: Trần Bích Châu'}]}
                     onChange={() => {}}
                   />
                </div>
             </div>

             <div className="mt-6 p-5 border border-[#b8c6d9] bg-white rounded-xl">
                 <label className="flex items-center space-x-3 cursor-pointer mb-4">
                   <input type="checkbox" className="form-checkbox text-[#2c5ea0] w-5 h-5 rounded border-[#b8c6d9]" defaultChecked />
                   <span className="text-sm font-bold text-[#1e2a3a]">Đã liên hệ báo cho Phụ huynh / GVCN</span>
                 </label>
                 <textarea className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm text-[#1e2a3a] h-20" placeholder="Ghi chú phản hồi: Phụ huynh (Mẹ) sẽ đến đón lúc 10h..." defaultValue="Phụ huynh sẽ đến đón lúc 10h15"></textarea>
             </div>
           </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto shrink-0">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"><ChevronLeft className="w-4 h-4 mr-1"/> Quay Lại</button>
        ) : <div></div>}
        
        {step < 3 ? (
           <button onClick={() => setStep(step + 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e2a3a] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Tiếp Theo <ChevronRight className="w-4 h-4 ml-1"/></button>
        ) : (
           <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e2a3a] shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-0.5 transition-all">Lưu Biên Bản <CheckCircle2 className="w-4 h-4 ml-2"/></button>
        )}
      </div>
    </ModalBase>
  );
};

export const HealthRecordModal = ({ isOpen, onClose, onSave, editingRecord }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void; editingRecord?: any }) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [className, setClassName] = useState('1A1');
  const [height, setHeight] = useState('115');
  const [weight, setWeight] = useState('20');
  const [bg, setBg] = useState('O+');
  const [history, setHistory] = useState('Bình thường');
  const [allergy, setAllergy] = useState('Không');
  const [insStatus, setInsStatus] = useState('Còn hạn');
  const [eyes, setEyes] = useState('Mắt trái 10/10 • Mắt phải 10/10');

  useEffect(() => {
    if (editingRecord) {
      setName(editingRecord.name || '');
      setId(editingRecord.id || '');
      setClassName(editingRecord.class || '1A1');
      setHeight(editingRecord.height?.toString() || '115');
      setWeight(editingRecord.weight?.toString() || '20');
      setBg(editingRecord.bg || 'O+');
      setHistory(editingRecord.history || 'Bình thường');
      setAllergy(editingRecord.allergy || 'Không');
      setInsStatus(editingRecord.insStatus || 'Còn hạn');
      setEyes(editingRecord.eyes || 'Mắt trái 10/10 • Mắt phải 10/10');
    } else {
      setName('');
      setId(`HS-21-${Math.floor(Math.random() * 9000 + 1000)}`);
      setClassName('1A1');
      setHeight('115');
      setWeight('20');
      setBg('O+');
      setHistory('Bình thường');
      setAllergy('Không');
      setInsStatus('Còn hạn');
      setEyes('Mắt trái 10/10 • Mắt phải 10/10');
    }
  }, [editingRecord, isOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id,
        name,
        class: className,
        height: parseFloat(height) || 115,
        weight: parseFloat(weight) || 20,
        bmi: parseFloat((parseFloat(weight) / Math.pow(parseFloat(height) / 100, 2)).toFixed(1)) || 15.1,
        bg,
        history,
        allergy,
        insStatus,
        eyes,
        insurance: `GD${Math.floor(Math.random() * 9000000000 + 1000000000)}`
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={editingRecord ? "Cập Nhật Hồ Sơ Sức Khỏe" : "Thêm Mới Hồ Sơ Sức Khỏe"} subtitle="Hồ sơ quản lý sức khỏe & thể trạng học đường" width="max-w-3xl">
      <div className="p-8 space-y-6 bg-[#f5f8fc]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ và tên học sinh *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Nhập tên học sinh..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lớp học *</label>
            <BaseSelect
              value={className}
              options={[{value: '1A1', label: 'Lớp 1A1'}, {value: '1A2', label: 'Lớp 1A2'}, {value: '5A1', label: 'Lớp 5A1'}, {value: '10C2', label: 'Lớp 10C2'}, {value: '11B3', label: 'Lớp 11B3'}]}
              onChange={setClassName}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Chiều cao (cm)</label>
            <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Cân nặng (kg)</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nhóm máu</label>
            <BaseSelect
              value={bg}
              options={[{value: 'O+', label: 'O+'}, {value: 'O-', label: 'O-'}, {value: 'A+', label: 'A+'}, {value: 'A-', label: 'A-'}, {value: 'B+', label: 'B+'}, {value: 'B-', label: 'B-'}, {value: 'AB+', label: 'AB+'}, {value: 'AB-', label: 'AB-'}]}
              onChange={setBg}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tiền sử bệnh lý nền</label>
            <input type="text" value={history} onChange={e => setHistory(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Không, Hen suyễn, Tim mạch..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Dị ứng báo cáo</label>
            <input type="text" value={allergy} onChange={e => setAllergy(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Không, Hải sản, Penicillin..." />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Trạng thái BHYT</label>
            <BaseSelect
              value={insStatus}
              options={[{value: 'Còn hạn', label: 'Đã đóng (Còn hạn)'}, {value: 'Hết hạn', label: 'Chưa đóng (Hết hạn)'}]}
              onChange={setInsStatus}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Khám mắt / Thị lực</label>
            <input type="text" value={eyes} onChange={e => setEyes(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
        </div>
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 items-center">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest">Hủy</button>
        <button onClick={handleSave} disabled={!name} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e2a3a] disabled:opacity-50">Lưu Hồ Sơ</button>
      </div>
    </ModalBase>
  );
};

export const InventoryItemModal = ({ isOpen, onClose, onSave, editingItem }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void; editingItem?: any }) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [category, setCategory] = useState('Thuốc hạ sốt');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('5');
  const [unit, setUnit] = useState('Hộp');
  const [expDate, setExpDate] = useState('');
  const [status, setStatus] = useState('Bình thường');

  useEffect(() => {
    if (editingItem) {
      setName(editingItem.name || '');
      setId(editingItem.id || '');
      setCategory(editingItem.category || 'Thuốc hạ sốt');
      setStock(editingItem.stock?.toString() || '10');
      setMinStock(editingItem.minStock?.toString() || '5');
      setUnit(editingItem.unit || 'Hộp');
      setExpDate(editingItem.expDate || '');
      setStatus(editingItem.status || 'Bình thường');
    } else {
      setName('');
      setId(`MED-${Math.floor(Math.random() * 900 + 100)}`);
      setCategory('Thuốc hạ sốt');
      setStock('10');
      setMinStock('5');
      setUnit('Hộp');
      setExpDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN'));
      setStatus('Bình thường');
    }
  }, [editingItem, isOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id,
        name,
        category,
        stock: parseInt(stock) || 0,
        minStock: parseInt(minStock) || 0,
        unit,
        expDate,
        status
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={editingItem ? "Cập Nhật Dược Phẩm / Thiết Bị" : "Thêm Dược Phẩm / Thiết Bị Mới"} subtitle="Quản lý kho dược phẩm và dụng cụ y tế tồn kho" width="max-w-2xl">
      <div className="p-8 space-y-6 bg-[#f5f8fc]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên dược phẩm / vật tư *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Nhập tên dược phẩm..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Phân loại *</label>
            <BaseSelect
              value={category}
              options={[{value: 'Thuốc hạ sốt', label: 'Thuốc hạ sốt'}, {value: 'Thuốc tiêu hóa', label: 'Thuốc tiêu hóa'}, {value: 'Thuốc đặc trị', label: 'Thuốc đặc trị'}, {value: 'Dụng cụ sơ cứu', label: 'Dụng cụ sơ cứu'}, {value: 'Dung dịch rửa', label: 'Dung dịch rửa'}]}
              onChange={setCategory}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tồn kho hiện tại *</label>
            <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tồn kho tối thiểu *</label>
            <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Đơn vị tính *</label>
            <BaseSelect
              value={unit}
              options={[{value: 'Hộp', label: 'Hộp'}, {value: 'Viên', label: 'Viên'}, {value: 'Lọ', label: 'Lọ'}, {value: 'Chai', label: 'Chai'}, {value: 'Cuộn', label: 'Cuộn'}, {value: 'Cái', label: 'Cái'}]}
              onChange={setUnit}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hạn sử dụng (DD/MM/YYYY) *</label>
            <input type="text" value={expDate} onChange={e => setExpDate(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hiện trạng dược kho</label>
            <BaseSelect
              value={status}
              options={[{value: 'Bình thường', label: 'Bình thường'}, {value: 'Sắp hết', label: 'Sắp hết'}, {value: 'Sắp hết hạn', label: 'Sắp hết hạn'}, {value: 'Hết hạn', label: 'Hết hạn'}]}
              onChange={setStatus}
            />
          </div>
        </div>
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 items-center">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest">Hủy</button>
        <button onClick={handleSave} disabled={!name} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e2a3a] disabled:opacity-50">Lưu Dược Phẩm</button>
      </div>
    </ModalBase>
  );
};

export const EpidemicCaseModal = ({ isOpen, onClose, onSave, editingCase }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void; editingCase?: any }) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('1A1');
  const [disease, setDisease] = useState('Đau mắt đỏ');
  const [onsetDate, setOnsetDate] = useState('');
  const [status, setStatus] = useState('Đang điều trị tại nhà');

  useEffect(() => {
    if (editingCase) {
      setName(editingCase.name || '');
      setClassName(editingCase.class || '1A1');
      setDisease(editingCase.disease || 'Đau mắt đỏ');
      setOnsetDate(editingCase.onsetDate || '');
      setStatus(editingCase.status || 'Đang điều trị tại nhà');
    } else {
      setName('');
      setClassName('1A1');
      setDisease('Đau mắt đỏ');
      setOnsetDate(new Date().toLocaleDateString('vi-VN'));
      setStatus('Đang điều trị tại nhà');
    }
  }, [editingCase, isOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: editingCase?.id || `EPI-${Math.floor(Math.random() * 900 + 100)}`,
        name,
        class: className,
        disease,
        onsetDate,
        status
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={editingCase ? "Cập Nhật Ca Dịch Bệnh" : "Báo Cáo Ca Dịch Bệnh Mới"} subtitle="Giám sát và kiểm soát dịch bệnh truyền nhiễm trong học đường" width="max-w-2xl">
      <div className="p-8 space-y-6 bg-[#f5f8fc]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ và tên học sinh *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Nhập tên học sinh..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lớp học *</label>
            <BaseSelect
              value={className}
              options={[{value: '1A1', label: '1A1'}, {value: '1A2', label: '1A2'}, {value: '5A1', label: '5A1'}, {value: '10C2', label: '10C2'}]}
              onChange={setClassName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Dịch bệnh lây nhiễm *</label>
            <BaseSelect
              value={disease}
              options={[{value: 'Đau mắt đỏ', label: 'Đau mắt đỏ'}, {value: 'Cúm A / Sốt', label: 'Cúm A / Sốt'}, {value: 'Tay chân miệng', label: 'Tay chân miệng'}, {value: 'Sốt xuất huyết', label: 'Sốt xuất huyết'}, {value: 'Quai bị / Thủy đậu', label: 'Quai bị / Thủy đậu'}, {value: 'Khác', label: 'Khác'}]}
              onChange={setDisease}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Ngày phát hiện bệnh *</label>
            <input type="text" value={onsetDate} onChange={e => setOnsetDate(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Trạng thái cách ly & điều trị *</label>
          <BaseSelect
            value={status}
            options={[{value: 'Đang điều trị tại nhà', label: 'Đang cách ly & điều trị tại nhà'}, {value: 'Đang điều trị tại bệnh viện', label: 'Đang điều trị tại bệnh viện tuyến đầu'}, {value: 'Cách ly theo dõi', label: 'Cách ly theo dõi tại phòng y tế'}, {value: 'Đã khỏi bệnh - Đi học lại', label: 'Đã khỏi bệnh - Cho phép đi học lại'}]}
            onChange={setStatus}
          />
        </div>
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 items-center">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest">Hủy</button>
        <button onClick={handleSave} disabled={!name} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e2a3a] disabled:opacity-50">Lưu Báo Cáo</button>
      </div>
    </ModalBase>
  );
};

export const InsuranceCardModal = ({ isOpen, onClose, onSave, editingInsurance }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void; editingInsurance?: any }) => {
  const [name, setName] = useState('');
  const [id, setId] = useState('');
  const [className, setClassName] = useState('1A1');
  const [insuranceNum, setInsuranceNum] = useState('');
  const [insStatus, setInsStatus] = useState('Còn hạn');
  const [accidentIns, setAccidentIns] = useState('Đã đóng tự nguyện');

  useEffect(() => {
    if (editingInsurance) {
      setName(editingInsurance.name || '');
      setId(editingInsurance.id || '');
      setClassName(editingInsurance.class || '1A1');
      setInsuranceNum(editingInsurance.insurance || '');
      setInsStatus(editingInsurance.insStatus || 'Còn hạn');
    } else {
      setName('');
      setId(`HS-21-${Math.floor(Math.random() * 9000 + 1000)}`);
      setClassName('1A1');
      setInsuranceNum(`GD479${Math.floor(Math.random() * 9000000 + 1000000)}`);
      setInsStatus('Còn hạn');
    }
  }, [editingInsurance, isOpen]);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id,
        name,
        class: className,
        insurance: insuranceNum,
        insStatus,
        accidentIns
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={editingInsurance ? "Cập Nhật Thông Tin Bảo Hiểm" : "Khai Báo Thẻ Bảo Hiểm Y Tế"} subtitle="Kiểm soát bảo hiểm y tế và bảo hiểm tai nạn học sinh bắt buộc" width="max-w-2xl">
      <div className="p-8 space-y-6 bg-[#f5f8fc]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ và tên học sinh *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Nhập tên học sinh..." />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lớp học *</label>
            <BaseSelect
              value={className}
              options={[{value: '1A1', label: '1A1'}, {value: '1A2', label: '1A2'}, {value: '5A1', label: '5A1'}, {value: '10C2', label: '10C2'}]}
              onChange={setClassName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã số thẻ BHYT (GD...) *</label>
            <input type="text" value={insuranceNum} onChange={e => setInsuranceNum(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold font-mono text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hạn sử dụng thẻ</label>
            <input type="text" defaultValue="31/12/2026" className="w-full px-4 py-3 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#7b8a9e] cursor-not-allowed" disabled />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Trạng thái đóng phí BHYT *</label>
            <BaseSelect
              value={insStatus}
              options={[{value: 'Còn hạn', label: 'Đã đóng phí (Còn hạn)'}, {value: 'Hết hạn', label: 'Chưa đóng (Hết hạn)'}]}
              onChange={setInsStatus}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Bảo hiểm Tai nạn tự nguyện *</label>
            <BaseSelect
              value={accidentIns}
              options={[{value: 'Đã đóng tự nguyện', label: 'Đã đóng (Tự nguyện)'}, {value: 'Chưa đóng', label: 'Chưa đóng'}]}
              onChange={setAccidentIns}
            />
          </div>
        </div>
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 items-center">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest">Hủy</button>
        <button onClick={handleSave} disabled={!name || !insuranceNum} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e2a3a] disabled:opacity-50">Lưu Thông Tin</button>
      </div>
    </ModalBase>
  );
};

export const ReportGenerationModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [title, setTitle] = useState('Báo cáo Y tế Học đường Tháng 6');
  const [type, setType] = useState('Báo cáo tháng');
  const [reporter, setReporter] = useState('NVYT: Trần Bích Châu');
  const [period, setPeriod] = useState('Thống kê từ 01/06/2026 đến 30/06/2026');
  const [format, setFormat] = useState('PDF');
  const [summary, setSummary] = useState('Ghi nhận tốt về dịch bệnh đau mắt đỏ đã được dập dịch thành công, tủ thuốc và vật tư đã được bổ sung paracetamol...');

  const handleSave = () => {
    if (onSave) {
      onSave({
        title,
        type,
        reporter,
        period,
        format,
        summary
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Xuất Báo Cáo & Thống Kê Định Kỳ" subtitle="Kết xuất hồ sơ y tế, chấn thương và tồn kho y học" width="max-w-2xl">
      <div className="p-8 space-y-6 bg-[#f5f8fc]">
        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tiêu đề báo cáo kết xuất *</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Phân loại báo cáo *</label>
            <BaseSelect
              value={type}
              options={[{value: 'Báo cáo tháng', label: 'Báo cáo tháng định kỳ'}, {value: 'Báo cáo học kỳ', label: 'Báo cáo học kỳ'}, {value: 'Báo cáo dịch tễ', label: 'Báo cáo dịch tễ truyền nhiễm'}, {value: 'Báo cáo tồn kho dược', label: 'Báo cáo tồn kho dược'}]}
              onChange={setType}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Định dạng file xuất *</label>
            <BaseSelect
              value={format}
              options={[{value: 'PDF', label: 'Định dạng tài liệu PDF'}, {value: 'Excel', label: 'Bảng tính Excel (.xlsx)'}, {value: 'Word', label: 'Văn bản Word (.docx)'}]}
              onChange={setFormat}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Người lập báo cáo *</label>
            <input type="text" value={reporter} onChange={e => setReporter(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Chu kỳ thống kê *</label>
            <input type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nội dung tóm tắt & Khuyến nghị y tế</label>
          <textarea value={summary} onChange={e => setSummary(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-medium text-[#1e2a3a] h-24" />
        </div>
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 items-center">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest">Hủy</button>
        <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e2a3a]">Kết Xuất & Tải Về</button>
      </div>
    </ModalBase>
  );
};

