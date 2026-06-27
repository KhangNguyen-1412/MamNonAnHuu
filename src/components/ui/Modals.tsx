import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { X, CheckCircle2, ChevronRight, ChevronLeft, UploadCloud, FileText, FileDown, Search } from 'lucide-react';
import { fadeScaleVariants, buttonHoverVariants, containerVariants, itemVariants, slideUpVariants } from '../../utils/animations';

/* --- BASE MODAL --- */
interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
  fixedHeight?: boolean;
  centerY?: boolean;
}

export const ModalBase: React.FC<ModalBaseProps> = ({ isOpen, onClose, title, subtitle, children, width = 'max-w-2xl', fixedHeight = false, centerY = true }) => {
  const verticalAlignment = centerY ? 'items-center' : 'items-start';
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-50 flex ${verticalAlignment} justify-center p-4`}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
            className="fixed inset-0 bg-[#1e2a3a]/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.25 } }}
            exit={{ opacity: 0, scale: 0.95, y: 16, transition: { duration: 0.2 } }}
            className={`relative w-full ${width} ${fixedHeight ? 'h-[700px] max-h-[90vh]' : 'max-h-[90vh]'} bg-[#f5f8fc] rounded-3xl border-[3px] border-double border-[#b8c6d9] shadow-[8px_8px_0px_#1e2a3a] flex flex-col z-10 overflow-hidden`}
          >
            {/* Header */}
            <div className="px-8 py-6 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex justify-between items-start shrink-0">
              <div>
                <h3 className="text-2xl font-serif font-bold text-[#1e2a3a]">{title}</h3>
                {subtitle && <p className="text-[#7b8a9e] font-bold text-[10px] uppercase tracking-widest mt-1">{subtitle}</p>}
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-[#7b8a9e] hover:text-[#2c5ea0] hover:bg-[#dce4ee] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Body */}
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

/* --- 1. SIMPLE MODAL (Form Đơn Môn Học) --- */
export const SimpleModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Cấu Hình Môn Học" subtitle="Quản lý theo Chương trình GDPT 2018" width="max-w-3xl">
      <motion.div
        className="flex-1 min-h-0 overflow-y-auto p-8 space-y-6"
        initial="initial"
        animate="animate"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã Môn Học *</label>
            <input type="text" autoFocus className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: MH-TOAN" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên Viết Tắt / Tên Hiển Thị</label>
            <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: T.Anh, Toán" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên Môn Học *</label>
            <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Ngữ Văn" />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
          <div>
            <BaseSelect
              label="Phân Loại Nhóm Môn (GDPT 2018)"
              value="Bắt buộc"
              options={[
                { value: 'Bắt buộc', label: 'Bắt buộc' },
                { value: 'Chuyên biệt', label: 'Chuyên biệt' },
                { value: 'Trải nghiệm', label: 'Trải nghiệm' }
              ]}
              onChange={() => {}}
            />
          </div>
          <div>
            <BaseSelect
              label="Hình Thức Tính Điểm"
              value="Tính điểm số (0.0 - 10.0)"
              options={[{value: 'Tính điểm số (0.0 - 10.0)', label: 'Tính điểm số (0.0 - 10.0)'}, {value: 'Đánh giá (Đạt / Chưa đạt)', label: 'Đánh giá (Đạt / Chưa đạt)'}]}
              onChange={() => {}}
            />
          </div>
          <div className="col-span-2 flex items-center justify-between p-4 border border-[#b8c6d9] rounded-xl bg-[#f5f8fc]">
            <div>
              <div className="text-sm font-bold text-[#1e2a3a]">Môn Thuộc Cụm Chuyên Đề?</div>
              <div className="text-[11px] text-[#7b8a9e] font-medium">Bật nếu đây là nội dung chuyên đề học tập lựa chọn</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-[#b8c6d9] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-[#dce4ee] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2e6b8a]"></div>
            </label>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-4">
           <label className="block text-[10px] font-bold text-[#2c5ea0] uppercase tracking-widest mb-2 border-b border-[#b8c6d9] pb-2">Cấu Hình Số Tiết & Tổ Quản Lý</label>
           <div className="grid grid-cols-3 gap-4">
             <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Khối 1 (Tiết/tuần)</label>
               <input type="number" step="0.5" defaultValue="3" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Khối 2 (Tiết/tuần)</label>
               <input type="number" step="0.5" defaultValue="3" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Khối 5 (Tiết/tuần)</label>
               <input type="number" step="0.5" defaultValue="3" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
           </div>
           <div>
            <BaseSelect
              label="Tổ Chuyên Môn Quản Lý"
              value="Tổ Khoa Học Tự Nhiên"
              options={[{value: 'Tổ Khoa Học Tự Nhiên', label: 'Tổ Khoa Học Tự Nhiên'}, {value: 'Tổ Khoa Học Xã Hội', label: 'Tổ Khoa Học Xã Hội'}]}
              onChange={() => {}}
            />
          </div>
        </motion.div>
      </motion.div>
      <div className="p-6 border-t border-dashed border-[#b8c6d9] flex justify-end gap-3 bg-[#f5f8fc] shrink-0">
        <motion.button
          onClick={onClose}
          {...buttonHoverVariants}
          className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"
        >
          Hủy
        </motion.button>
        <motion.button
          {...buttonHoverVariants}
          className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition-all"
        >
          Lưu Định Dạng
        </motion.button>
      </div>
    </ModalBase>
  );
};

/* --- 2. WIZARD MODAL (Multi-step cho Nhân sự) --- */
export const WizardModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [step, setStep] = useState(1);
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Tiếp Nhận Nhân Sự Mới" subtitle="Quy Trình Tạo Hồ Sơ CB-GV-NV (Chuẩn PMIS)" width="max-w-4xl" fixedHeight>
      {/* Stepper */}
      <div className="bg-[#e8eef6] px-8 py-4 border-b border-[#b8c6d9] flex items-center justify-between overflow-x-auto shrink-0">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center flex-shrink-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step >= s ? 'bg-[#2c5ea0] border-[#2c5ea0] text-white' : 'bg-transparent border-[#b8c6d9] text-[#7b8a9e]'}`}>
              {s}
            </div>
            {s < 5 && <div className={`w-8 md:w-12 h-0.5 mx-2 ${step > s ? 'bg-[#2c5ea0]' : 'bg-[#b8c6d9]'}`}></div>}
          </div>
        ))}
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#2c5ea0] ml-4 whitespace-nowrap">
          {step === 1 ? '1. Định Danh' : step === 2 ? '2. Học Vị' : step === 3 ? '3. Phân Công' : step === 4 ? '4. Lương & Hậu Cần' : '5. Đoàn Thể & Thi Đua'}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto p-8 pb-4 min-h-[400px]">
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Thông tin Định danh & Cá nhân</h4>
            <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã định danh BGD&ĐT *</label>
                  <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Nhập mã định danh..." />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã nhân sự nội bộ</label>
                  <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: GV202601" disabled />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ & Tên *</label>
                  <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Nhập họ và tên" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <BaseDatePicker label="Ngày sinh" value="" onChange={() => {}} />
                  </div>
                  <div>
                    <BaseSelect
                      label="Giới tính"
                      value="Nam"
                      options={[{value: 'Nam', label: 'Nam'}, {value: 'Nữ', label: 'Nữ'}]}
                      onChange={() => {}}
                    />
                  </div>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số CCCD</label>
                  <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Nhập CCCD" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Email nội bộ trường cấp</label>
                  <input type="email" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: pvg@th.edu.vn" />
                </div>
             </div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Trình độ, Học vị & Chứng chỉ</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <BaseSelect
                  label="Trình độ học vấn cao nhất"
                  value="Đại học"
                  options={[{value: 'Đại học', label: 'Đại học'}, {value: 'Thạc sĩ', label: 'Thạc sĩ'}, {value: 'Tiến sĩ', label: 'Tiến sĩ'}]}
                  onChange={() => {}}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Trình độ chuyên môn (Trên bằng)</label>
                <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: Sư phạm Toán" />
              </div>
              <div>
                <BaseSelect
                  label="Chứng chỉ NV Sư phạm"
                  value="Đã có / Tốt nghiệp khối SP"
                  options={[{value: 'Đã có / Tốt nghiệp khối SP', label: 'Đã có / Tốt nghiệp khối SP'}, {value: 'Chưa có', label: 'Chưa có'}]}
                  onChange={() => {}}
                />
              </div>
              <div>
                <BaseSelect
                  label="Chức danh nghề nghiệp hiện tại"
                  value="Giáo viên Mầm non Hạng III"
                  options={[{value: 'Giáo viên Mầm non Hạng III', label: 'Giáo viên Mầm non Hạng III'}, {value: 'Giáo viên Mầm non Hạng II', label: 'Giáo viên Mầm non Hạng II'}, {value: 'Giáo viên Mầm non Hạng I', label: 'Giáo viên Mầm non Hạng I'}]}
                  onChange={() => {}}
                />
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Công tác, Chức vụ & Phân công</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <BaseSelect
                  label="Hình thức hợp đồng"
                  value="Viên chức (Biên chế)"
                  options={[{value: 'Viên chức (Biên chế)', label: 'Viên chức (Biên chế)'}, {value: 'Hợp đồng xác định thời hạn', label: 'Hợp đồng xác định thời hạn'}, {value: 'Hợp đồng thỉnh giảng', label: 'Hợp đồng thỉnh giảng'}]}
                  onChange={() => {}}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <BaseSelect
                    label="Tổ chuyên môn"
                    value="Toán - Tin"
                    options={[{value: 'Toán - Tin', label: 'Toán - Tin'}, {value: 'Ngữ Văn', label: 'Ngữ Văn'}, {value: 'Lý - Hóa - Sinh', label: 'Lý - Hóa - Sinh'}]}
                    onChange={() => {}}
                  />
                </div>
                <div>
                  <BaseSelect
                    label="Chức vụ C.Môn"
                    value="Giáo viên"
                    options={[{value: 'Giáo viên', label: 'Giáo viên'}, {value: 'Tổ trưởng', label: 'Tổ trưởng'}, {value: 'Tổ phó', label: 'Tổ phó'}]}
                    onChange={() => {}}
                  />
                </div>
              </div>
              <div className="col-span-2">
                 <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Chức năng, Đoàn thể nội bộ</label>
                 <div className="p-4 border border-[#b8c6d9] rounded-xl bg-[#f5f8fc] flex gap-4">
                   <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" className="w-4 h-4 text-[#2c5ea0]" />
                     <span className="text-sm font-bold text-[#1e2a3a]">Bí thư Chi bộ</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" className="w-4 h-4 text-[#2c5ea0]" />
                     <span className="text-sm font-bold text-[#1e2a3a]">Công đoàn</span>
                   </label>
                   <label className="flex items-center space-x-2 cursor-pointer">
                     <input type="checkbox" className="w-4 h-4 text-[#2c5ea0]" />
                     <span className="text-sm font-bold text-[#1e2a3a]">Đoàn thanh niên</span>
                   </label>
                 </div>
              </div>
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Lương, Ngạch bậc & Hậu cần</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã ngạch viên chức</label>
                <input type="text" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: V.07.05.15" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <BaseSelect
                     label="Bậc lương"
                     value="Bậc 1"
                     options={[{value: 'Bậc 1', label: 'Bậc 1'}, {value: 'Bậc 2', label: 'Bậc 2'}, {value: 'Bậc 3', label: 'Bậc 3'}]}
                     onChange={() => {}}
                   />
                 </div>
                 <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hệ số lương</label>
                   <input type="number" step="0.01" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="2.34" />
                 </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Phụ cấp thâm niên nhà giáo (%)</label>
                <input type="number" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="%" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Phụ cấp ưu đãi ngành (%)</label>
                 <input type="number" defaultValue={30} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="30%" />
              </div>
            </div>
          </div>
        )}
        {step === 5 && (
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Đảng, Đoàn thể & Lịch sử Thi đua</h4>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <BaseDatePicker label="Ngày vào Đảng" value="" onChange={() => {}} />
              </div>
              <div>
                <BaseSelect
                  label="Danh hiệu thi đua cao nhất đã đạt"
                  value="Chưa có"
                  options={[{value: 'Chưa có', label: 'Chưa có'}, {value: 'Lao động tiên tiến', label: 'Lao động tiên tiến'}, {value: 'Chiến sĩ thi đua cơ sở', label: 'Chiến sĩ thi đua cơ sở'}, {value: 'Bằng khen UBND Tỉnh', label: 'Bằng khen UBND Tỉnh'}]}
                  onChange={() => {}}
                />
              </div>
            </div>
            <div className="text-center pt-8 border-t border-dashed border-[#b8c6d9] mt-8">
              <CheckCircle2 className="w-16 h-16 text-[#2e6b8a] mx-auto mb-4" />
              <h4 className="text-xl font-serif font-bold text-[#1e2a3a]">Hoàn tất Hồ sơ Nhân sự</h4>
              <p className="text-sm font-medium text-[#4a5568]">Hồ sơ đã được số hóa và chuẩn bị đồng bộ PMIS.</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 pt-4 border-t border-dashed border-[#b8c6d9] bg-[#f5f8fc] flex justify-between shrink-0">
        {step > 1 ? (
          <button onClick={() => setStep(step - 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors"><ChevronLeft className="w-4 h-4 mr-1"/> Quay Lại</button>
        ) : <div></div>}
        
        {step < 5 ? (
          <button onClick={() => setStep(step + 1)} className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Tiếp Theo <ChevronRight className="w-4 h-4 ml-1"/></button>
        ) : (
          <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2e6b8a] text-white uppercase tracking-widest hover:bg-[#1e4f6a] shadow-[2px_2px_0px_#1e2a3a] active:shadow-none active:translate-y-0.5 transition-all">Hoàn Tất & Đồng Bộ</button>
        )}
      </div>
    </ModalBase>
  );
};

/* --- 3. TABBED MODAL (Quan hệ 1-N - Tổ Chuyên Môn) --- */
export const TabbedModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [tab, setTab] = useState<'info' | 'members' | 'add'>('info');
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Tổ Chuyên Môn" subtitle="Quản lý Thông Tin Cơ Bản & Ban Quản Lý Tổ" width="max-w-4xl" fixedHeight>
      <div className="flex border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-4 pt-2 gap-2">
        {[
          { id: 'info', label: 'Cấu hình Tổ & Ban BĐH' },
          { id: 'members', label: 'Danh sách Giáo viên' },
          { id: 'add', label: 'Phân bổ Cán bộ' }
        ].map(t => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-6 py-3 text-xs font-bold uppercase tracking-widest rounded-t-xl border border-b-0 ${tab === t.id ? 'bg-[#f5f8fc] text-[#2c5ea0] border-[#b8c6d9]' : 'bg-transparent text-[#7b8a9e] border-transparent hover:text-[#4a5568]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      <div className="flex-1 min-h-0 overflow-y-auto p-8 min-h-[400px]">
        {tab === 'info' && (
           <div className="space-y-6">
             <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã Tổ Chuyên Môn *</label>
                  <input type="text" defaultValue="TO-KHTN" disabled className="w-full px-4 py-3 bg-[#dce4ee] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#4a5568] cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên Tổ Chuyên Môn *</label>
                  <input type="text" defaultValue="Tổ Khoa Học Tự Nhiên" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                </div>
                <div>
                  <BaseSelect
                    label="Trạng Thái Hoạt Động"
                    value="Đang Hoạt Động"
                    options={[{value: 'Đang Hoạt Động', label: 'Đang Hoạt Động'}, {value: 'Dừng Hoạt Động / Sáp Nhập', label: 'Dừng Hoạt Động / Sáp Nhập'}]}
                    onChange={() => {}}
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Môn Học Phụ Trách (Chọn nhiều)</label>
                  <div className="p-3 border border-[#b8c6d9] rounded-xl bg-white flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-3 py-1 bg-[#e8eef6] text-[#1e2a3a] text-xs font-bold rounded-lg border border-[#b8c6d9]">Toán Học <button className="ml-2 text-[#2c5ea0] hover:text-[#4a5568]"><X className="w-3 h-3"/></button></span>
                    <span className="inline-flex items-center px-3 py-1 bg-[#e8eef6] text-[#1e2a3a] text-xs font-bold rounded-lg border border-[#b8c6d9]">Tin Học <button className="ml-2 text-[#2c5ea0] hover:text-[#4a5568]"><X className="w-3 h-3"/></button></span>
                    <button className="inline-flex items-center px-3 py-1 bg-[#f5f8fc] text-[#7b8a9e] text-xs font-bold rounded-lg border border-dashed border-[#b8c6d9] hover:bg-[#e8eef6] hover:text-[#4a5568]">+ Thêm Môn Phụ Trách</button>
                  </div>
                </div>
             </div>

             <div className="mt-8">
               <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2 text-[#2c5ea0]">Ban Quản Lý Tổ Theo Năm Học</h4>
               <div className="p-6 border border-[#b8c6d9] rounded-2xl bg-[#f5f8fc] space-y-4">
                  <div>
                    <BaseSelect
                      label="Năm Học Áp Dụng"
                      required
                      value="Năm học 2025 - 2026"
                      options={[{value: 'Năm học 2025 - 2026', label: 'Năm học 2025 - 2026'}, {value: 'Năm học 2024 - 2025', label: 'Năm học 2024 - 2025'}]}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <BaseSelect
                        label="Tổ Trưởng (MaGiaoVien_ToTruong)"
                        value="Thầy Phạm Văn C (GV01)"
                        options={[{value: 'Thầy Phạm Văn C (GV01)', label: 'Thầy Phạm Văn C (GV01)'}, {value: 'Cô Lê Thị D (GV02)', label: 'Cô Lê Thị D (GV02)'}]}
                        onChange={() => {}}
                      />
                    </div>
                    <div>
                      <BaseSelect
                        label="Tổ Phó (MaGiaoVien_ToPho)"
                        value="Cô Bùi Thị F (GV03)"
                        options={[{value: 'Cô Bùi Thị F (GV03)', label: 'Cô Bùi Thị F (GV03)'}, {value: 'Chưa Bổ Nhiệm', label: 'Chưa Bổ Nhiệm'}]}
                        onChange={() => {}}
                      />
                    </div>
                    <div className="col-span-2">
                       <BaseSelect
                         label="Thư Ký Tổ (MaGiaoVien_ThuKy)"
                         value="Cô Nguyễn Thị G (GV04)"
                         options={[{value: 'Cô Nguyễn Thị G (GV04)', label: 'Cô Nguyễn Thị G (GV04)'}, {value: 'Chưa Bổ Nhiệm', label: 'Chưa Bổ Nhiệm'}]}
                         onChange={() => {}}
                       />
                    </div>
                  </div>
               </div>
             </div>
           </div>
        )}
        {tab === 'members' && (
          <table className="w-full text-sm text-left">
            <thead className="bg-[#e8eef6] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b border-[#b8c6d9]">
              <tr>
                <th className="px-4 py-3">Mã GV</th>
                <th className="px-4 py-3">Họ Tên Cán Bộ</th>
                <th className="px-4 py-3">Môn Dạy Chính</th>
                <th className="px-4 py-3 text-right">Tác Vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dce4ee]">
              <tr><td className="px-4 py-3 font-bold text-[#1e2a3a]">GV01</td><td className="px-4 py-3 font-bold">Phạm Văn C <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-[#2c5ea0] text-[#f5f8fc] uppercase tracking-widest">Tổ Trưởng</span></td><td className="px-4 py-3">Toán Học</td><td className="px-4 py-3 text-right"><button className="text-[#2c5ea0] text-xs font-bold hover:underline">Rút khỏi tổ</button></td></tr>
              <tr><td className="px-4 py-3 font-bold text-[#1e2a3a]">GV02</td><td className="px-4 py-3 font-bold">Lê Thị D</td><td className="px-4 py-3">Vật Lý</td><td className="px-4 py-3 text-right"><button className="text-[#2c5ea0] text-xs font-bold hover:underline">Rút khỏi tổ</button></td></tr>
            </tbody>
          </table>
        )}
        {tab === 'add' && (
          <div className="space-y-4">
             <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#7b8a9e]" />
                <input type="text" placeholder="Tìm kiếm giáo viên ngoài tổ bằng Tên hoặc Mã hệ thống..." className="w-full pl-11 pr-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
             </div>
             <div className="p-4 border border-[#dce4ee] rounded-xl flex items-center justify-between hover:bg-[#e8eef6]">
               <div>
                  <div className="font-bold text-[#1e2a3a]">Trần Hữu E (GV05)</div>
                  <div className="text-[11px] text-[#7b8a9e] font-medium">Đang thuộc biên chế: Tổ Toán - Tin</div>
               </div>
               <button className="px-4 py-1.5 bg-[#a8c4e0] text-[#1e2a3a] text-[10px] uppercase tracking-widest font-bold rounded-full hover:bg-[#b8c6d9] transition-colors">Điều Động Vào Tổ</button>
             </div>
          </div>
        )}
      </div>
      {(tab === 'info') && (
      <div className="p-6 border-t border-dashed border-[#b8c6d9] flex justify-end shrink-0">
         <button  onClick={onClose}  className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none transition-all">Lưu Cơ Cấu Tổ</button>
      </div>)}
    </ModalBase>
  );
};



/* --- 5. BULK IMPORT MODAL (Upload) --- */
export const BulkImportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [file, setFile] = useState<boolean>(false);
  
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Nhập Dữ Liệu Hàng Loạt" subtitle="Tải lên File Excel/CSV (.xlsx, .csv)">
      <div className="flex-1 min-h-0 overflow-y-auto p-8">
        {!file ? (
          <div 
            className="border-[3px] border-dashed border-[#b8c6d9] rounded-3xl p-12 text-center bg-[#f5f8fc] hover:bg-[#e8eef6] transition-colors cursor-pointer"
            onClick={() => setFile(true)}
          >
            <div className="w-16 h-16 bg-[#dce4ee] rounded-full flex items-center justify-center mx-auto mb-4 text-[#2c5ea0]">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-2">Kéo thả file vào đây</h4>
            <p className="text-xs text-[#7b8a9e] font-medium">Hoặc click để chọn file từ máy tính. Hỗ trợ XLS, XLSX, CSV.</p>
            <div className="mt-6 flex justify-center">
               <button className="flex items-center text-xs font-bold text-[#2e6b8a] underline underline-offset-4 decoration-[#2e6b8a]/30 hover:decoration-[#2e6b8a]">
                 <FileDown className="w-4 h-4 mr-2" />
                 Tải Xuống File Mẫu Chuẩn
               </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#e8eef6] rounded-xl border border-[#b8c6d9]">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-[#4a5568]" />
                <div>
                  <div className="text-sm font-bold text-[#1e2a3a]">Danh_sach_nhap_diem_12A1.xlsx</div>
                  <div className="text-[10px] text-[#7b8a9e] uppercase tracking-widest font-bold">Quét thành công: 45 dòng | Bỏ qua: 0 lỗi</div>
                </div>
              </div>
              <button onClick={() => setFile(false)} className="text-[#2c5ea0] text-xs font-bold underline">Hủy Xóa</button>
            </div>
            
            <table className="w-full text-sm text-left opacity-60">
              <thead className="bg-[#f5f8fc] text-[#4a5568] text-[10px] font-bold uppercase tracking-widest border-b border-[#b8c6d9]">
                <tr>
                  <th className="px-4 py-2">Học Sinh</th>
                  <th className="px-4 py-2 text-center">Điểm 15p</th>
                  <th className="px-4 py-2 text-center">Giữa Kỳ</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="px-4 py-2">Nguyễn A</td><td className="px-4 py-2 text-center">8.0</td><td className="px-4 py-2 text-center">9.5</td></tr>
                <tr><td className="px-4 py-2">Trần B</td><td className="px-4 py-2 text-center">7.5</td><td className="px-4 py-2 text-center">8.0</td></tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="p-6 border-t border-[#b8c6d9] flex justify-end gap-3 bg-[#f5f8fc] shrink-0">
         <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
         <button disabled={!file} onClick={onClose} className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-[2px_2px_0px_#1e2a3a] transition-all ${file ? 'bg-[#2e6b8a] text-white hover:bg-[#1e4f6a] active:translate-y-0.5 active:shadow-none' : 'bg-[#dce4ee] text-[#7b8a9e] cursor-not-allowed shadow-none'}`}>
           Bắt đầu Nhập
         </button>
      </div>
    </ModalBase>
  );
};

/* --- 5. READ-ONLY MODAL (Chi tiết / Log) --- */
export const ReadOnlyModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Học Bạ Điện Tử" subtitle="Trích lục Dữ Liệu Lưu Trữ (Read-Only)" width="max-w-4xl">
      <div className="flex-1 min-h-0 overflow-y-auto p-8 bg-[#f5f8fc] font-serif">
         {/* Tờ giấy in concept */}
         <div className="border border-[#b8c6d9] p-10 bg-white shadow-sm rounded-sm">
           <div className="text-center mb-8 border-b-2 border-double border-[#1e2a3a] pb-6">
              <h1 className="text-xl font-bold uppercase mb-2">Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam</h1>
              <h2 className="text-sm font-bold uppercase underline underline-offset-4 mb-6">Độc lập - Tự do - Hạnh phúc</h2>
              <h3 className="text-2xl font-bold uppercase tracking-widest text-[#2c5ea0]">Phiếu Kết Quả Học Tập Điển Hình</h3>
           </div>
           
           <div className="space-y-4 text-[15px] leading-relaxed text-[#1e2a3a]">
             <div className="flex gap-4"><span className="font-bold w-32">Họ & Tên:</span> <span>Nguyễn Trần Tuấn Anh</span></div>
             <div className="flex gap-4"><span className="font-bold w-32">Ngày Sinh:</span> <span>15/08/2018</span></div>
             <div className="flex gap-4"><span className="font-bold w-32">Lớp:</span> <span>12A1 (Niên khóa 26-27)</span></div>
             <div className="flex gap-4"><span className="font-bold w-32">Hạnh kiểm:</span> <span className="font-bold uppercase text-[#2e6b8a]">Tốt</span></div>
             <div className="flex gap-4"><span className="font-bold w-32">Học lực:</span> <span className="font-bold uppercase text-[#2c5ea0]">Giỏi (9.4)</span></div>
           </div>
           
           <div className="mt-12 text-sm text-[#7b8a9e] flex justify-between">
              <div><span className="font-bold">Mã định danh:</span> HS_2026_0142</div>
              <div><span className="font-bold">Dấu Giáp Lai:</span> Đã ký số (Ban Giám Hiệu)</div>
           </div>
         </div>
      </div>
      <div className="p-6 border-t border-[#b8c6d9] flex justify-between bg-[#e8eef6] shrink-0">
         <div className="flex items-center text-[10px] text-[#2c5ea0] uppercase tracking-widest font-bold">
           🔒 Tài liệu Khóa thay đổi
         </div>
         <div className="flex gap-3">
           <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] bg-[#f5f8fc] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
           <button className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest shadow-[2px_2px_0px_#4a5568] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#4a5568]">Xuất Trích Lục (PDF)</button>
         </div>
      </div>
    </ModalBase>
  );
};


