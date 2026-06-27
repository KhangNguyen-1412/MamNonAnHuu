import React, { useState } from 'react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { ModalBase } from './Modals';
import { Save, Plus, X, Upload, Calendar, Search, Paperclip, Mail, FileText, Archive } from 'lucide-react';

/* --- 1. VĂN BẢN ĐẾN / ĐI --- */
export const DocumentModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [docType, setDocType] = useState('Văn bản Đến');
  const [symbol, setSymbol] = useState('');
  const [issueDate, setIssueDate] = useState('11/06/2026');
  const [trichYeu, setTrichYeu] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [urgency, setUrgency] = useState('Thường');
  const [security, setSecurity] = useState('Thường');

  const handleSave = () => {
    if (!symbol.trim() || !trichYeu.trim() || !issuingBody.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }
    if (onSave) {
      onSave({
        symbol,
        docType,
        issueDate,
        trichYeu,
        issuingBody,
        urgency,
        security
      });
    }
    // Reset state
    setSymbol('');
    setTrichYeu('');
    setIssuingBody('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Soạn / Cập Nhật Công Văn" subtitle="Quản lý văn bản đến và đi (Nghiệp vụ văn thư)" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2" /> 1. Thông Tin Chung (Metadata)
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2 font-mono">Mã hệ thống</label>
                <input type="text" value="AUTO-GEN-VB" className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#7b8a9e] font-mono" disabled />
              </div>
              <div>
                <BaseSelect
                  label="Phân loại"
                  required
                  value={docType}
                  options={[{value: 'Văn bản Đến', label: 'Văn bản Đến'}, {value: 'Văn bản Đi', label: 'Văn bản Đi'}]}
                  onChange={(val) => setDocType(val)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số / Ký hiệu *</label>
              <input 
                type="text" 
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="VD: 125/CV-SGDĐT" 
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <BaseDatePicker label="Ngày ban hành" value={issueDate} onChange={(val) => setIssueDate(val)} />
              </div>
              <div>
                <BaseDatePicker label="Ngày tiếp nhận/gửi đi" value={issueDate} onChange={() => {}} />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Trích yếu nội dung *</label>
              <textarea 
                rows={2} 
                value={trichYeu}
                onChange={(e) => setTrichYeu(e.target.value)}
                placeholder="Tóm tắt nội dung văn bản..." 
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] resize-none"
              ></textarea>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Mail className="w-4 h-4 mr-2" /> 2. Luân Chuyển & Xử Lý (Workflow)
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Cơ quan ban hành / Nơi nhận *</label>
              <input 
                type="text" 
                value={issuingBody}
                onChange={(e) => setIssuingBody(e.target.value)}
                placeholder="VD: Sở GD&ĐT TPHCM" 
                className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <BaseSelect
                  label="Độ khẩn"
                  value={urgency}
                  options={[{value: 'Thường', label: 'Thường'}, {value: 'Khẩn', label: 'Khẩn'}, {value: 'Thượng khẩn', label: 'Thượng khẩn'}, {value: 'Hỏa tốc', label: 'Hỏa tốc'}]}
                  onChange={(val) => setUrgency(val)}
                />
              </div>
              <div>
                <BaseSelect
                  label="Độ mật"
                  value={security}
                  options={[{value: 'Thường', label: 'Thường'}, {value: 'Mật', label: 'Mật'}, {value: 'Tối mật', label: 'Tối mật'}]}
                  onChange={(val) => setSecurity(val)}
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Người ký duyệt</label>
              <input type="text" placeholder="VD: Giám đốc Sở" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div>
              <BaseDatePicker label="Hạn xử lý (Deadline)" value="" onChange={() => {}} />
            </div>
            <div>
              <BaseSelect
                label="Người/Bộ phận xử lý chính"
                value="Ban Giám Hiệu"
                options={[{value: 'Ban Giám Hiệu', label: 'Ban Giám Hiệu'}, {value: 'Tổ Toán - Tin', label: 'Tổ Toán - Tin'}, {value: 'Đoàn Thanh Niên', label: 'Đoàn Thanh Niên'}, {value: 'Bộ phận Văn thư', label: 'Bộ phận Văn thư'}]}
                onChange={() => {}}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Ý kiến chỉ đạo của BGH</label>
              <textarea rows={2} placeholder="VD: Giao phó hiệu trưởng chuyên môn chỉ đạo..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] resize-none"></textarea>
            </div>
            <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2 flex items-center"><Paperclip className="w-3 h-3 mr-1" /> File đính kèm</label>
               <div className="border border-dashed border-[#7b8a9e] bg-[#e8eef6] rounded-xl p-4 text-center cursor-pointer hover:bg-[#dce4ee] transition">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Kéo thả hoặc nhấp để tải lên (PDF, Word, Excel)</span>
               </div>
            </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-3 rounded-b-3xl shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#5a2e2e] shadow-[2px_2px_0px_#7b8a9e] active:shadow-none active:translate-y-0.5 transition-all">
          <Save className="w-4 h-4 mr-2" /> Lưu Văn Bản
        </button>
      </div>
    </ModalBase>
  );
};

/* --- 2. LỊCH CÔNG TÁC --- */
export const ScheduleModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('15/12/2023');
  const [startTime, setStartTime] = useState('08:00');
  const [location, setLocation] = useState('Hội Trường Lớn');
  const [leader, setLeader] = useState('Hiệu Trưởng');
  const [status, setStatus] = useState('Sắp Diễn Ra');

  const handleSave = () => {
    if (!title.trim() || !location.trim() || !leader.trim()) {
      alert("Vui lòng điền đầy đủ các thông tin bắt buộc (*)");
      return;
    }
    if (onSave) {
      onSave({
        id: `SCH-${Date.now().toString().slice(-4)}`,
        time: `${startTime} (${date})`,
        title,
        leader,
        location,
        status
      });
    }
    setTitle('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Cập Nhật Lịch Công Tác" subtitle="Lịch tuần học tập & Hội đồng sư phạm" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Calendar className="w-4 h-4 mr-2" /> 1. Thông Tin Sự Kiện
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tiêu đề lịch *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="VD: Họp giao ban Ban giám hiệu đầu tuần" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div className="col-span-2 md:col-span-1">
              <BaseSelect
                label="Phân loại lịch"
                value="Lịch chung toàn trường"
                options={[{value: 'Lịch chung toàn trường', label: 'Lịch chung toàn trường'}, {value: 'Lịch Ban giám hiệu', label: 'Lịch Ban giám hiệu'}, {value: 'Lịch chuyên môn (Tổ)', label: 'Lịch chuyên môn (Tổ)'}, {value: 'Lịch Đoàn thanh niên', label: 'Lịch Đoàn thanh niên'}]}
                onChange={() => {}}
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nội dung chi tiết / Ghi chú</label>
              <textarea rows={3} placeholder="Mô tả kỹ chương trình, nội dung chuẩn bị..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] resize-none"></textarea>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <Calendar className="w-4 h-4 mr-2" /> 2. Thời Gian & Địa Điểm
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="grid grid-cols-2 gap-4 col-span-2">
               <div>
                 <BaseDatePicker label="Ngày thực hiện *" required value={date} onChange={setDate} />
               </div>
               <div>
                  <BaseSelect
                    label="Thuộc Tuần CM"
                    value="Tuần 14"
                    options={[{value: 'Tuần 14', label: 'Tuần 14'}, {value: 'Tuần 15', label: 'Tuần 15'}]}
                    onChange={() => {}}
                  />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 col-span-2">
              <div>
                <BaseDatePicker type="time" label="Giờ bắt đầu *" value={startTime} onChange={setStartTime} />
              </div>
              <div>
                <BaseDatePicker type="time" label="Giờ kết thúc" value="" onChange={() => {}} />
              </div>
            </div>
            <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Địa điểm *</label>
               <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Phòng họp A, Hội trường, Link meet..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Search className="w-4 h-4 mr-2" /> 3. Thành Phần & Nhân Sự
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Người chủ trì *</label>
              <input type="text" value={leader} onChange={e => setLeader(e.target.value)} placeholder="VD: Thầy Hiệu trưởng" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div>
               <BaseSelect
                 label="Thành phần tham dự"
                 value="Toàn thể giáo viên"
                 options={[{value: 'Toàn thể giáo viên', label: 'Toàn thể giáo viên'}, {value: 'Chỉ nhóm Giáo viên chủ nhiệm', label: 'Chỉ nhóm Giáo viên chủ nhiệm'}, {value: 'Học sinh khối 5', label: 'Học sinh khối 5'}, {value: 'Ban Giám Hiệu', label: 'Ban Giám Hiệu'}]}
                 onChange={() => {}}
               />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Bộ phận chuẩn bị</label>
              <input type="text" placeholder="VD: Tổ Văn phòng chuẩn bị..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div>
              <BaseSelect
                label="Trạng thái lịch"
                value={status}
                options={[
                  {value: 'Sắp Diễn Ra', label: 'Sắp Diễn Ra'},
                  {value: 'Lên Lịch', label: 'Lên Lịch'},
                  {value: 'Đã Hủy', label: 'Đã Hủy'}
                ]}
                onChange={setStatus}
              />
            </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 rounded-b-3xl">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition-all">
          <Save className="w-4 h-4 mr-2" /> Lưu Sự Kiện
        </button>
      </div>
    </ModalBase>
  );
};

/* --- 3. KHO LƯU TRỮ HS --- */
export const StorageModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Thư Mục Mật');
  const [date, setDate] = useState('11/06/2026');
  const [access, setAccess] = useState('Hạn Chế BGH');

  const handleSave = () => {
    if (!id.trim() || !name.trim()) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc (*)");
      return;
    }
    if (onSave) {
      onSave({
        id,
        name,
        type: category,
        date,
        access
      });
    }
    setId('');
    setName('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Lưu Trữ" subtitle="Kho lưu trữ hồ sơ, tài liệu, văn bản giấy" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Archive className="w-4 h-4 mr-2" /> 1. Định Vị Vật Lý
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã hồ sơ / Mã hộp *</label>
              <input type="text" value={id} onChange={e => setId(e.target.value)} placeholder="VD: HS-2023-PC" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Vị trí lưu trữ vật lý</label>
               <input type="text" placeholder="VD: Tủ A - Kệ 3, Phòng Văn thư" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <Archive className="w-4 h-4 mr-2" /> 2. Thuộc Tính Phân Loại
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tiêu đề tập hồ sơ *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="VD: Hồ Sơ Cán Bộ Giáo Viên (Khóa Số)" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             <div>
                <BaseSelect
                  label="Nhóm danh mục"
                  required
                  value={category}
                  options={[
                    {value: 'Thư Mục Mật', label: 'Thư Mục Mật'},
                    {value: 'PDF - 12MB', label: 'PDF - 12MB'},
                    {value: 'Word - 5MB', label: 'Word - 5MB'},
                    {value: 'Excel - 3MB', label: 'Excel - 3MB'}
                  ]}
                  onChange={setCategory}
                />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                  <BaseSelect
                    label="Năm học / G.Đoạn"
                    value="2023 - 2024"
                    options={[{value: '2023 - 2024', label: '2023 - 2024'}, {value: '2024 - 2025', label: '2024 - 2025'}, {value: '2025 - 2026', label: '2025 - 2026'}]}
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <BaseSelect
                    label="Thời hạn lưu trữ"
                    value="5 năm"
                    options={[{value: '5 năm', label: '5 năm'}, {value: '10 năm', label: '10 năm'}, {value: '20 năm', label: '20 năm'}, {value: 'Vĩnh viễn', label: 'Vĩnh viễn'}]}
                    onChange={() => {}}
                  />
                </div>
             </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Upload className="w-4 h-4 mr-2" /> 3. Dữ Liệu Số Hóa & Quyền Truy Cập
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2 flex items-center">Danh sách tệp đính kèm (Bản scan PDF)</label>
               <div className="border border-dashed border-[#7b8a9e] bg-[#e8eef6] rounded-xl p-4 text-center cursor-pointer hover:bg-[#dce4ee] transition">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Kéo thả hồ sơ số hóa vào đây</span>
               </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Người lập hồ sơ</label>
              <input type="text" placeholder="Tên NV Văn thư..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div>
              <BaseDatePicker label="Ngày lưu kho" value={date} onChange={setDate} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <BaseSelect
                label="Phân quyền tiếp cận (Privacy)"
                value={access}
                options={[
                  {value: 'Hạn Chế BGH', label: 'Hạn Chế BGH'},
                  {value: 'Toàn Thể G/V', label: 'Toàn Thể G/V'},
                  {value: 'Công khai', label: 'Công khai'}
                ]}
                onChange={setAccess}
              />
            </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 rounded-b-3xl">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button onClick={handleSave} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#7b8a9e] active:shadow-none active:translate-y-0.5 transition-all">
          <Archive className="w-4 h-4 mr-2" /> Nhập Kho
        </button>
      </div>
    </ModalBase>
  );
};
