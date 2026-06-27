import React, { useState } from 'react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { ModalBase } from './Modals';
import { Save, BookOpen, PenTool, Flag, Calendar, Upload } from 'lucide-react';

export const SyllabusDistributionModal = ({ 
  isOpen, 
  onClose,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSave?: (data: any) => void;
}) => {
  const [grade, setGrade] = useState('Khối 1');
  const [subject, setSubject] = useState('Toán Học');
  const [intensity, setIntensity] = useState(3);
  const [total, setTotal] = useState(105);

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: `PL-${Date.now().toString().slice(-4)}`,
        grade,
        subject,
        intensity: Number(intensity),
        total: Number(total),
        status: 'Bản Nháp'
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Thiết lập Phân Phối Chương Trình" subtitle="Quản lý cấu hình giảng dạy Môn học" width="max-w-5xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <BookOpen className="w-4 h-4 mr-2" /> 1. Thông Tin Khung
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Năm học</label>
               <input type="text" defaultValue="2025 - 2026" className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#4a5568]" disabled />
            </div>
            <div>
               <BaseSelect
                 label="Học kỳ"
                 value="Cả năm"
                 options={[{value: 'Cả năm', label: 'Cả năm'}, {value: 'Học kỳ 1', label: 'Học kỳ 1'}, {value: 'Học kỳ 2', label: 'Học kỳ 2'}]}
                 onChange={() => {}}
               />
            </div>
            <div>
               <BaseSelect
                 label="Khối lớp"
                 value={grade}
                 options={[
                   {value: 'Khối 1', label: 'Khối 1'}, 
                   {value: 'Khối 2', label: 'Khối 2'},
                   {value: 'Khối 5', label: 'Khối 5'},
                 ]}
                 onChange={setGrade}
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Môn học *</label>
               <input 
                 type="text" 
                 value={subject} 
                 onChange={e => setSubject(e.target.value)}
                 className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
               />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2" /> 2. Cấu Hình Phân Bổ Tiết Dạy
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số tiết / Tuần *</label>
               <input 
                 type="number" 
                 value={intensity} 
                 onChange={e => setIntensity(Number(e.target.value))}
                 className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
               />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tổng số tiết / Năm học *</label>
               <input 
                 type="number" 
                 value={total} 
                 onChange={e => setTotal(Number(e.target.value))}
                 className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
               />
            </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Hủy</button>
        <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none transition-all">
          <Save className="w-4 h-4 mr-2" /> Lưu Cấu Hình
        </button>
      </div>
    </ModalBase>
  );
};

/* --- QUẢN LÝ KHẢO THÍ --- */
export const ExamPlanModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [name, setName] = useState('');
  const [time, setTime] = useState('20/12/2023 - 28/12/2023');
  const [scope, setScope] = useState('Toàn Trường');
  const [form, setForm] = useState('Trắc Nghiệm & Tự Luận');

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: `EX-${Date.now().toString().slice(-4)}`,
        name: name || 'Kỳ thi mới',
        time,
        scope,
        form,
        progress: 10
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Kế Hoạch Kỳ Thi Giai Đoạn" subtitle="Tổ chức thi & Kiểm tra tập trung" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <PenTool className="w-4 h-4 mr-2" /> 1. Kế Hoạch Tổ Chức (Exam Plan)
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2 md:col-span-1">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên kỳ thi *</label>
               <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Kiểm tra cuối HK1 Khối 1" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             <div className="col-span-2 md:col-span-1">
               <BaseSelect
                 label="Hình thức tổ chức"
                 required
                 value="Thi tập trung (Trộn thí sinh)"
                 options={[{value: 'Thi tập trung (Trộn thí sinh)', label: 'Thi tập trung (Trộn thí sinh)'}, {value: 'Thi tại lớp (Giáo viên quản lý)', label: 'Thi tại lớp (Giáo viên quản lý)'}]}
                 onChange={() => {}}
               />
             </div>
             <div className="grid grid-cols-2 gap-4 col-span-2">
                 <div>
                   <BaseDatePicker label="Khoảng TG: Ngày bắt đầu" value="" onChange={() => {}} />
                 </div>
                 <div>
                   <BaseDatePicker label="Ngày kết thúc" value="" onChange={() => {}} />
                 </div>
             </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <Calendar className="w-4 h-4 mr-2" /> 2. Cấu Hợp Lịch & Phòng Thi Chi Tiết
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lịch thi chi tiết (Nhập cấu hình nhanh)</label>
                <div className="p-4 border border-[#b8c6d9] rounded-xl bg-[#e8eef6] space-y-3">
                   <div className="flex gap-2">
                      <input type="text" placeholder="Môn thi..." className="w-1/4 px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs" />
                      <BaseDatePicker value="" onChange={() => {}} wrapperClassName="w-1/4" />
                      <input type="text" placeholder="Ca thi (VD: 07:30)" className="w-1/4 px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs" />
                      <input type="number" placeholder="Thời lượng (Phút)" className="w-1/4 px-3 py-2 bg-white border border-[#b8c6d9] rounded-lg text-xs" />
                   </div>
                   <div className="text-center text-xs text-[#7b8a9e] font-bold uppercase tracking-widest cursor-pointer hover:text-[#1e2a3a]">Thêm Lịch Thi +</div>
                </div>
             </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Upload className="w-4 h-4 mr-2" /> 3. Quản Lý Đề Thi & Bảo Mật
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Ngân Hàng Đề & Đáp Án (File)</label>
                <div className="border border-dashed border-[#7b8a9e] bg-[#e8eef6] rounded-xl p-4 text-center cursor-pointer hover:bg-[#dce4ee] transition">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Tải lên (PDF/Word/ZIP)</span>
                </div>
             </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none transition-all">
          <Save className="w-4 h-4 mr-2" /> Lưu Kế Hoạch Thi
        </button>
      </div>
    </ModalBase>
  );
};

/* --- HOẠT ĐỘNG NGOẠI KHÓA --- */
export const ExtracurricularModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [name, setName] = useState('');
  const [time, setTime] = useState('12/02/2024');
  const [scale, setScale] = useState('Toàn Trường');

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: `YUC-${Date.now().toString().slice(-4)}`,
        name: name || 'Hoạt động mới',
        type: 'Thiện nguyện',
        time,
        status: 'Lên kế hoạch',
        scale,
        hours: 10
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Cấu Hình Hoạt Động Ngoại Khóa" subtitle="Hoạt động trải nghiệm, định hướng nghề nghiệp" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <Flag className="w-4 h-4 mr-2" /> 1. Kế Hoạch Hoạt Động (Activity Plan)
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên hoạt động (Chủ đề) *</label>
               <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Hành trình về nguồn Củ Chi..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             
             <div className="col-span-2 md:col-span-1">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Đơn vị chủ trì</label>
               <input type="text" defaultValue="Đoàn Thanh Niên" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             <div className="col-span-2 md:col-span-1">
               <BaseSelect
                 label="Đối tượng bắt buộc tham gia"
                 value={scale}
                 options={[{value: 'Toàn trường', label: 'Toàn trường'}, {value: 'Khối 1', label: 'Khối 1'}, {value: 'Khối 2', label: 'Khối 2'}, {value: 'Khối 5', label: 'Khối 5'}]}
                 onChange={setScale}
               />
             </div>
             <div className="grid grid-cols-2 gap-4 col-span-2">
                 <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Thời gian diễn ra</label>
                   <input type="text" value={time} onChange={e => setTime(e.target.value)} placeholder="VD: 12/02/2024" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tiến độ thời gian (Phút / Giờ)</label>
                   <input type="text" placeholder="Ví dụ: 08:00 - 15:00" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                 </div>
             </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none transition-all">
          <Save className="w-4 h-4 mr-2" /> Lưu Ngoại Khóa
        </button>
      </div>
    </ModalBase>
  );
};
