import React, { useState } from 'react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { ChevronRight, ChevronLeft, Calendar, Info, Beaker, FileText, CheckCircle2 } from 'lucide-react';
import { ModalBase } from './Modals';

export const AppointmentModal = ({ 
  isOpen, 
  onClose,
  onSave
}: { 
  isOpen: boolean; 
  onClose: () => void;
  onSave?: (data: any) => void;
}) => {
  const [step, setStep] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [topic, setTopic] = useState('Áp lực học tập/thi cử');
  const [urgency, setUrgency] = useState('Bình thường');
  const [description, setDescription] = useState('');
  const [method, setMethod] = useState('Trực tiếp');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('Giờ ra chơi sáng (08:35 - 08:50)');

  const handleSubmit = () => {
    if (onSave) {
      onSave({
        studentName: isAnonymous ? 'Học sinh Ẩn danh' : studentName,
        studentClass: studentClass || 'Khối 5',
        topic,
        urgency,
        description,
        method,
        date: date || new Date().toLocaleDateString('vi-VN'),
        time
      });
    }
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Đặt Lịch Tham Vấn Tâm Lý" subtitle="Thông tin được bảo mật tuyệt đối" width="max-w-4xl" fixedHeight>
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
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Thông tin Cá nhân</h4>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="form-checkbox text-[#2c5ea0] rounded border-[#b8c6d9]" 
                  />
                  <span className="text-sm font-bold text-[#4a5568]">Đặt lịch ẩn danh (Bảo mật tuyệt đối danh tính)</span>
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ và Tên</label>
                <input 
                  type="text" 
                  value={studentName}
                  disabled={isAnonymous}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#ffffff] disabled:bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                  placeholder={isAnonymous ? "Học sinh ẩn danh" : "Nhập tên hoặc bí danh"} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lớp</label>
                <input 
                  type="text" 
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" 
                  placeholder="Khối/Lớp (Tùy chọn)" 
                />
              </div>
            </div>

            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2 mt-8">Nhu cầu tham vấn</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <BaseSelect
                  label="Chủ đề cần tư vấn *"
                  value={topic}
                  options={[
                    {value: 'Áp lực học tập/thi cử', label: 'Áp lực học tập/thi cử'}, 
                    {value: 'Mối quan hệ bạn bè', label: 'Mối quan hệ bạn bè (Bạo lực học đường)'}, 
                    {value: 'Mâu thuẫn gia đình', label: 'Mâu thuẫn gia đình'}, 
                    {value: 'Định hướng tương lai', label: 'Định hướng tương lai'}, 
                    {value: 'Tình cảm tuổi học trò', label: 'Tình cảm tuổi học trò'}, 
                    {value: 'Vấn đề tâm lý khác', label: 'Vấn đề tâm lý khác'}
                  ]}
                  onChange={setTopic}
                />
              </div>
              <div>
                <BaseSelect
                  label="Mức độ khẩn cấp *"
                  value={urgency}
                  options={[
                    {value: 'Bình thường', label: 'Bình thường - Cần lời khuyên'}, 
                    {value: 'Khẩn cấp', label: 'Khẩn cấp - Cần hỗ trợ ngay'}
                  ]}
                  onChange={setUrgency}
                />
              </div>
              <div className="col-span-2">
                 <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mô tả ngắn gọn vấn đề (Tùy chọn)</label>
                 <textarea 
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] min-h-[100px]" 
                   placeholder="Bạn có thể chia sẻ trước vấn đề ở đây..."
                 />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Thời gian & Hình thức</h4>
            <div className="grid grid-cols-2 gap-6">
               <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hình thức tham vấn</label>
                  <div className="space-y-3">
                    <label className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${method === 'Trực tiếp' ? 'border-[#2c5ea0] bg-[#f5f8fc] shadow-sm' : 'border-[#b8c6d9] bg-white hover:bg-[#e8eef6]'}`}>
                      <input 
                        type="radio" 
                        name="method" 
                        checked={method === 'Trực tiếp'}
                        onChange={() => setMethod('Trực tiếp')}
                        className="form-radio text-[#2c5ea0]" 
                      />
                      <div>
                        <p className="text-sm font-bold text-[#1e2a3a]">Trực tiếp tại Phòng Tâm lý</p>
                        <p className="text-xs text-[#7b8a9e]">Không gian riêng tư, đảm bảo bí mật</p>
                      </div>
                    </label>
                    <label className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${method === 'Chat trực tuyến' ? 'border-[#2c5ea0] bg-[#f5f8fc] shadow-sm' : 'border-[#b8c6d9] bg-white hover:bg-[#e8eef6]'}`}>
                      <input 
                        type="radio" 
                        name="method" 
                        checked={method === 'Chat trực tuyến'}
                        onChange={() => setMethod('Chat trực tuyến')}
                        className="form-radio text-[#2c5ea0]" 
                      />
                      <div>
                        <p className="text-sm font-bold text-[#1e2a3a]">Chat trực tuyến (Zalo/Teams)</p>
                        <p className="text-xs text-[#7b8a9e]">Tiện lợi nếu bạn cảm thấy e ngại</p>
                      </div>
                    </label>
                    <label className={`flex items-center space-x-3 p-3 border rounded-xl cursor-pointer transition-all ${method === 'Gọi điện thoại' ? 'border-[#2c5ea0] bg-[#f5f8fc] shadow-sm' : 'border-[#b8c6d9] bg-white hover:bg-[#e8eef6]'}`}>
                      <input 
                        type="radio" 
                        name="method" 
                        checked={method === 'Gọi điện thoại'}
                        onChange={() => setMethod('Gọi điện thoại')}
                        className="form-radio text-[#2c5ea0]" 
                      />
                      <div>
                        <p className="text-sm font-bold text-[#1e2a3a]">Gọi điện thoại</p>
                        <p className="text-xs text-[#7b8a9e]">Trao đổi nhanh qua hotline của tổ tư vấn</p>
                      </div>
                    </label>
                  </div>
               </div>
               <div className="space-y-6">
                 <div>
                    <BaseDatePicker label="Ngày mong muốn (Tùy chọn)" value={date} onChange={setDate} />
                 </div>
                 <div>
                    <BaseSelect
                      label="Khung giờ phù hợp"
                      value={time}
                      options={[
                        {value: 'Giờ ra chơi sáng (08:35 - 08:50)', label: 'Giờ ra chơi sáng (08:35 - 08:50)'}, 
                        {value: 'Giờ ra chơi chiều (15:05 - 15:20)', label: 'Giờ ra chơi chiều (15:05 - 15:20)'}, 
                        {value: 'Sau buổi học (17:00 - 18:00)', label: 'Sau buổi học (17:00 - 18:00)'}, 
                        {value: 'Thứ 7 (Cuối tuần)', label: 'Thứ 7 (Cuối tuần)'}
                      ]}
                      onChange={setTime}
                    />
                 </div>
                 <div className="p-4 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl">
                   <p className="text-xs font-bold text-[#2c5ea0] flex items-center mb-1"><Info className="w-4 h-4 mr-1"/> Lưu ý bảo mật</p>
                   <p className="text-xs text-[#4a5568]">Hệ thống áp dụng chính sách ẩn danh Document-level. Mọi thông tin chỉ được tiếp cận bởi đúng 1 chuyên viên phụ trách ca của bạn.</p>
                 </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"><ChevronLeft className="w-4 h-4 mr-1"/> Quay Lại</button>
        ) : <div></div>}
        
        {step < 2 ? (
          <button onClick={() => setStep(step + 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Tiếp Theo <ChevronRight className="w-4 h-4 ml-1"/></button>
        ) : (
          <button onClick={handleSubmit} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#5c2a2a] shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-0.5 transition-all">Gửi Yêu Cầu</button>
        )}
      </div>
    </ModalBase>
  );
};

export const CaseNoteModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Nhật Ký Ca Tư Vấn" subtitle="Dành riêng cho Chuyên viên / Giáo viên tâm lý" width="max-w-4xl" fixedHeight>
       <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
          <div className="p-4 bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1e2a3a] text-[#f5f8fc] rounded-full flex items-center justify-center font-bold text-lg">A</div>
                <div>
                  <p className="text-lg font-bold text-[#1e2a3a]">Học sinh Ẩn danh #304</p>
                  <p className="text-xs font-bold text-[#7b8a9e] uppercase tracking-widest">Khối 5 • Chuyên viên: Lê Thị Tâm</p>
                </div>
             </div>
             <span className="px-3 py-1 bg-[#fee2e2] text-[#991b1b] border border-[#fecaca] text-[10px] font-bold uppercase tracking-widest rounded-full">Khẩn cấp</span>
          </div>

          <div className="space-y-6">
             <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Biên bản Tham vấn (Từng buổi)</h4>
             <div className="space-y-4">
               <div className="p-4 border border-[#b8c6d9] rounded-xl bg-white">
                  <div className="flex justify-between items-center mb-2 border-b border-dashed border-[#dce4ee] pb-2">
                     <p className="text-sm font-bold text-[#2c5ea0]">Buổi 1: Xây dựng lòng tin</p>
                     <p className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest">15/10/2023</p>
                  </div>
                  <p className="text-sm text-[#1e2a3a] leading-relaxed">Học sinh chia sẻ áp lực lớn từ kỳ vọng của gia đình trong kỳ thi tới. Tâm trạng lo âu, rối bời, thi thoảng mất ngủ. Đã thực hiện bài tập xoa dịu cảm xúc tại chỗ.</p>
               </div>
               
               <div className="p-4 border border-[#2c5ea0] shadow-[4px_4px_0px_#dce4ee] rounded-xl bg-[#f0f4fa]">
                  <div className="flex items-center mb-2 border-b border-dashed border-[#b8c6d9] pb-2">
                     <p className="text-sm font-bold text-[#2c5ea0]">Thêm Ghi chú Buổi mới</p>
                  </div>
                  <textarea className="w-full mt-2 px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm text-[#1e2a3a] min-h-[100px]" placeholder="Tóm tắt vấn đề cốt lõi, diễn biến tâm lý..."></textarea>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div>
                <BaseSelect
                  label="Đánh giá rủi ro chuyên sâu"
                  value="Rủi ro thấp - Có thể tự kiểm soát"
                  options={[{value: 'Rủi ro thấp - Có thể tự kiểm soát', label: 'Rủi ro thấp - Có thể tự kiểm soát'}, {value: 'Rủi ro trung bình - Cần quan tâm', label: 'Rủi ro trung bình - Cần quan tâm'}, {value: 'Rủi ro cao - Trầm cảm/Lo âu (Cần báo BGH/Y tế)', label: 'Rủi ro cao - Trầm cảm/Lo âu (Cần báo BGH/Y tế)'}]}
                  onChange={() => {}}
                />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hướng giải quyết</label>
                <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Giao bài tập CBT, tư vấn gia đình..." />
             </div>
          </div>
       </div>
       
       <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto">
         <div className="w-48">
           <BaseSelect
             value="Đang theo dõi"
             options={[{value: 'Đang theo dõi', label: 'Đang theo dõi'}, {value: 'Hoàn thành (Đóng ca)', label: 'Hoàn thành (Đóng ca)'}]}
             onChange={() => {}}
           />
         </div>
         <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Lưu Hồ Sơ</button>
       </div>
    </ModalBase>
  );
};
