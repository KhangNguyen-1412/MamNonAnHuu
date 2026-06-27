import React from 'react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { ModalBase } from './Modals';
import { Save, User, FileText, Calendar, Heart, Award, Users, DollarSign, BookOpen } from 'lucide-react';

/* --- 1. CHI BỘ ĐẢNG --- */
export const PartyMemberModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Đảng Viên & Phát Triển Đảng" subtitle="Quản lý chi bộ và nhiệm vụ chính trị trọng tâm" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <User className="w-4 h-4 mr-2" /> 1. Hồ Sơ Đảng Viên
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="grid grid-cols-2 gap-4 col-span-2">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã Đảng viên</label>
                <input type="text" placeholder="VD: ĐV-00123" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số thẻ Đảng</label>
                <input type="text" placeholder="VD: 12345678" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
              </div>
            </div>
            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ và tên</label>
               <input type="text" placeholder="Nguyễn Văn A" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div>
               <BaseSelect
                 label="Chức vụ trong Chi bộ"
                 value="Đảng viên"
                 options={[{value: 'Đảng viên', label: 'Đảng viên'}, {value: 'Bí thư', label: 'Bí thư'}, {value: 'Phó Bí thư', label: 'Phó Bí thư'}, {value: 'Chi ủy viên', label: 'Chi ủy viên'}]}
                 onChange={() => {}}
               />
            </div>
            <div className="grid grid-cols-2 gap-4 col-span-2">
              <div>
                <BaseDatePicker label="Ngày vào Đảng (Dự bị)" value="" onChange={() => {}} />
              </div>
              <div>
                <BaseDatePicker label="Ngày chính thức" value="" onChange={() => {}} />
              </div>
            </div>
             <div className="grid grid-cols-2 gap-4 col-span-2">
              <div>
                <BaseDatePicker label="Ngày nhận huy hiệu Đảng" value="" onChange={() => {}} />
              </div>
              <div>
                <BaseSelect
                  label="Đánh giá phân loại (Năm nay)"
                  value="Xuất sắc nhiệm vụ"
                  options={[{value: 'Xuất sắc nhiệm vụ', label: 'Xuất sắc nhiệm vụ'}, {value: 'Tốt nhiệm vụ', label: 'Tốt nhiệm vụ'}, {value: 'Hoàn thành nhiệm vụ', label: 'Hoàn thành nhiệm vụ'}, {value: 'Không hoàn thành nhiệm vụ', label: 'Không hoàn thành nhiệm vụ'}]}
                  onChange={() => {}}
                />
              </div>
            </div>
             <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hồ sơ chuyển sinh hoạt Đảng (Nếu có)</label>
               <input type="text" placeholder="Chuyển đến từ / Chuyển đi..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <BookOpen className="w-4 h-4 mr-2" /> 2. Nghiệp Vụ Phát Triển Đảng
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Quần chúng ưu tú (Giáo viên / Học sinh Khối 5)</label>
              <input type="text" placeholder="VD: Học sinh Nguyễn Bá Đạo (12A1)" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
             <div className="col-span-2">
                <BaseSelect
                  label="Tiến độ hồ sơ (Pipeline)"
                  value="Quần chúng ưu tú"
                  options={[{value: 'Quần chúng ưu tú', label: 'Quần chúng ưu tú'}, {value: 'Học lớp Nhận thức về Đảng', label: 'Học lớp Nhận thức về Đảng'}, {value: 'Thử thách / Xác minh lý lịch', label: 'Thử thách / Xác minh lý lịch'}, {value: 'Đảng viên dự bị (12 tháng)', label: 'Đảng viên dự bị (12 tháng)'}, {value: 'Đảng viên chính thức', label: 'Đảng viên chính thức'}]}
                  onChange={() => {}}
                />
             </div>
             <div className="col-span-2">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Đảng viên giới thiệu / Đỡ đầu</label>
              <textarea rows={2} placeholder="Nhập tên 2 Đảng viên chính thức giới thiệu..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] resize-none"></textarea>
            </div>
          </div>
        </section>
        
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2" /> 3. Sinh Hoạt & Đảng Phí
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nghị quyết / Biên bản họp Chi bộ (Đính kèm)</label>
               <div className="border border-dashed border-[#7b8a9e] bg-[#e8eef6] rounded-xl p-4 text-center cursor-pointer hover:bg-[#dce4ee] transition">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Kéo thả file biên bản định kỳ</span>
               </div>
             </div>
             <div>
                <BaseDatePicker type="month" label="Tháng / Quý nộp phí" value="" onChange={() => {}} />
             </div>
             <div>
                <BaseSelect
                  label="Trạng thái đóng Đảng phí"
                  value="Chưa đóng"
                  options={[{value: 'Chưa đóng', label: 'Chưa đóng'}, {value: 'Đã đóng', label: 'Đã đóng'}]}
                  onChange={() => {}}
                />
             </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 rounded-b-3xl shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#1e4478] shadow-[2px_2px_0px_#4a5568] active:shadow-none transition-all">
          <Save className="w-4 h-4 mr-2" /> Lưu Hồ Sơ
        </button>
      </div>
    </ModalBase>
  );
};

/* --- 2. CÔNG ĐOÀN TRƯỜNG --- */
export const TradeUnionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Công Đoàn & Phúc Lợi" subtitle="Chăm lo đời sống CB-GV-NV và Thi đua" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Users className="w-4 h-4 mr-2" /> 1. Hồ Sơ Công Đoàn Viên
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
            <div className="col-span-2 md:col-span-1">
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ & Tên Công đoàn viên</label>
               <input type="text" placeholder="VD: Trần Thị B" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            </div>
            <div className="col-span-2 md:col-span-1">
               <BaseSelect
                 label="Chức vụ (BCH)"
                 value="Đoàn viên"
                 options={[{value: 'Đoàn viên', label: 'Đoàn viên'}, {value: 'Tổ trưởng Công đoàn', label: 'Tổ trưởng Công đoàn'}, {value: 'Ủy viên BCH', label: 'Ủy viên BCH'}, {value: 'Phó Chủ tịch', label: 'Phó Chủ tịch'}, {value: 'Chủ tịch', label: 'Chủ tịch'}]}
                 onChange={() => {}}
               />
            </div>
            <div className="col-span-2">
                <BaseDatePicker label="Ngày gia nhập Công đoàn" value="" onChange={() => {}} />
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <Heart className="w-4 h-4 mr-2" /> 2. Phúc Lợi & Chăm Lo Đời Sống
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nhật ký Hiếu - Hỷ - Thăm hỏi</label>
                <textarea rows={2} placeholder="Nội dung, thời gian thăm ốm đau, hiếu hỷ..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] resize-none"></textarea>
             </div>
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Điều dưỡng & Nghỉ dưỡng (Khám sức khỏe, Du lịch)</label>
                <input type="text" placeholder="Đợt tham gia..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Quà tặng lễ tết (20/11, Tết, 8/3, Trung thu...)</label>
                <input type="text" placeholder="Chi tiết phần quà..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
            <Award className="w-4 h-4 mr-2" /> 3. Thi Đua & Khen Thưởng Nội Bộ
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
                <BaseSelect
                  label="Danh hiệu đạt được"
                  value="Không có"
                  options={[{value: 'Không có', label: 'Không có'}, {value: 'Giỏi việc trường - Đảm việc nhà', label: 'Giỏi việc trường - Đảm việc nhà'}, {value: 'Gia đình nhà giáo văn hóa', label: 'Gia đình nhà giáo văn hóa'}, {value: 'Đoàn viên Xuất sắc', label: 'Đoàn viên Xuất sắc'}]}
                  onChange={() => {}}
                />
             </div>
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Sáng kiến kinh nghiệm cấp Công đoàn (Nếu có)</label>
                 <input type="text" placeholder="Tên sáng kiến..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 rounded-b-3xl">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#7b8a9e] active:shadow-none transition-all">
          <Save className="w-4 h-4 mr-2" /> Cập Nhật Hồ Sơ
        </button>
      </div>
    </ModalBase>
  );
};

/* --- 3. ĐẠI DIỆN CMHS --- */
export const ParentsUnionModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Ban Đại Diện Cha Mẹ Học Sinh" subtitle="Thông tin liên hệ & Quản lý kinh phí hoạt động" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
        <section>
          <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <Users className="w-4 h-4 mr-2" /> 1. Sơ Đồ Tổ Chức Ban Đại Diện
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div>
               <BaseSelect
                 label="Cấp quản lý"
                 value="Ban đại diện cấp Lớp"
                 options={[{value: 'Ban đại diện cấp Lớp', label: 'Ban đại diện cấp Lớp'}, {value: 'Ban đại diện cấp Trường', label: 'Ban đại diện cấp Trường'}]}
                 onChange={() => {}}
               />
             </div>
             <div>
               <BaseSelect
                 label="Chức vụ trong Ban"
                 value="Trưởng ban"
                 options={[{value: 'Trưởng ban', label: 'Trưởng ban'}, {value: 'Phó ban', label: 'Phó ban'}, {value: 'Ủy viên', label: 'Ủy viên'}]}
                 onChange={() => {}}
               />
             </div>
             <div className="col-span-2 grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ & Tên Phụ huynh *</label>
                   <input type="text" placeholder="VD: Lê Thị C" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số điện thoại *</label>
                   <input type="text" placeholder="Ghi chú SDT liên hệ..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                 </div>
             </div>
             <div className="col-span-2 grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Email</label>
                   <input type="email" placeholder="Email liên lạc..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Đại diện cho học sinh (Mã HS/Tên HS)</label>
                   <input type="text" placeholder="Mã HS & Tên HS..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                 </div>
             </div>
             <div className="col-span-2">
                 <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Thuộc lớp</label>
                 <input type="text" placeholder="VD: 10A1" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
          </div>
        </section>

        <section>
          <h4 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 mb-4 flex items-center">
             <DollarSign className="w-4 h-4 mr-2" /> 2. Quản Lý Kinh Phí / Kế Hoạch
          </h4>
          <div className="grid grid-cols-2 gap-6 p-6 border border-[#b8c6d9] rounded-2xl bg-white">
             <div className="col-span-2">
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Kế hoạch chi tiêu năm học (Đã duyệt)</label>
               <textarea rows={2} placeholder="Hạng mục dự chi, khen thưởng đợt..." className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] resize-none"></textarea>
             </div>
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Sổ thu chi (Cập nhật khoản đóng góp / Phiếu chi)</label>
                <div className="border border-dashed border-[#7b8a9e] bg-[#e8eef6] rounded-xl p-4 text-center cursor-pointer hover:bg-[#dce4ee] transition">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Tải lên hóa đơn / biên nhận số hóa (Hình ảnh, PDF)</span>
                </div>
             </div>
             <div className="col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Biên bản phối hợp (Với BGH Từng Học kỳ)</label>
                <div className="border border-dashed border-[#7b8a9e] bg-[#e8eef6] rounded-xl p-4 text-center cursor-pointer hover:bg-[#dce4ee] transition">
                  <span className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Kéo thả biên bản (PDF)</span>
                </div>
             </div>
          </div>
        </section>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-end gap-4 rounded-b-3xl">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
        <button className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none transition-all">
          <Save className="w-4 h-4 mr-2" /> Lưu Báo Cáo
        </button>
      </div>
    </ModalBase>
  );
};
