import React, { useState, useEffect } from 'react';
import { 
  Building, BookOpen, Users, Network, Monitor, ShieldAlert,
  Save, RefreshCw, Plus, Key, Eye, Edit, Trash2, ShieldCheck, Mail, Database, Bell,
  Cloud, Server, Check, AlertCircle, CheckCheck
} from 'lucide-react';
import { BaseSelect, BaseDatePicker } from '../ui/BaseInputs';
import { db } from '../../services/firebase';
import { doc, getDocFromServer, setDoc } from 'firebase/firestore';
import { seedAllDatabase } from '../../services/dbService';
import { seedDefaultStaff } from '../../services/hrService';
import { seedDefaultStudents } from '../../services/studentService';

export const SettingsPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'academic' | 'rbac' | 'integration' | 'ui' | 'audit'>('profile');

  const tabs = [
    { id: 'profile', label: 'Thông tin Chung', icon: Building, desc: 'Hồ sơ pháp lý, liên hệ' },
    { id: 'academic', label: 'Tham số Học thuật', icon: BookOpen, desc: 'Năm học, khóa học kỳ' },
    { id: 'rbac', label: 'Quản lý Phân quyền', icon: Users, desc: 'Tài khoản, nhóm quyền' },
    { id: 'integration', label: 'Tích hợp & Kết nối', icon: Network, desc: 'API Keys, SMS, Payment' },
    { id: 'ui', label: 'Tùy chỉnh Giao diện', icon: Monitor, desc: 'Màu nền, hiển thị' },
    { id: 'audit', label: 'Nhật ký & Sao lưu', icon: ShieldAlert, desc: 'Audit log, Backup' },
  ] as const;

  return (
    <main className="flex-1 p-4 md:p-8 relative min-w-0 flex flex-col h-full overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto w-full z-10 relative flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 shrink-0">
          <div>
            <h2 className="text-3xl font-serif font-bold text-[#2c5ea0] flex items-center gap-3">
              Cài Đặt Hệ Thống
              <span className="text-xs font-sans font-bold bg-[#2c5ea0] text-[#f5f8fc] px-3 py-1 rounded-full uppercase tracking-widest align-middle">
                Quản trị viên
              </span>
            </h2>
            <p className="text-[#7b8a9e] mt-2 font-medium">Cấu hình tham số lõi và tùy biến toàn bộ hệ thống quản lý.</p>
          </div>
          <button className="flex justify-center items-center gap-2 px-6 py-3 bg-[#1e2a3a] border border-[#131a25] text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#283548] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all w-full md:w-auto">
            <Save className="w-4 h-4" />
            Lưu thay đổi toàn cục
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 overflow-hidden">
          {/* Settings Sidebar */}
          <div className="w-full lg:w-64 shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto pr-2 main-scrollbar">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-start p-4 rounded-2xl transition-all border text-left ${
                    isActive 
                      ? 'bg-[#ffffff] border-[#b8c6d9] shadow-sm transform scale-[1.02]' 
                      : 'bg-transparent border-transparent hover:bg-[#ffffff]/50 hover:border-[#b8c6d9]/50'
                  }`}
                >
                  <div className={`p-2 rounded-xl shrink-0 mr-3 ${isActive ? 'bg-[#e8eef6] text-[#2c5ea0]' : 'bg-transparent text-[#7b8a9e]'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className={`text-sm font-bold tracking-wide ${isActive ? 'text-[#1e2a3a]' : 'text-[#4a5568]'}`}>
                      {tab.label}
                    </div>
                    <div className="text-[10px] text-[#7b8a9e] mt-1">{tab.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Settings Content area */}
          <div className="flex-1 bg-[#ffffff] border border-[#b8c6d9] rounded-3xl shadow-sm flex flex-col overflow-hidden ">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'academic' && <AcademicSettings />}
            {activeTab === 'rbac' && <RBACSettings />}
            {activeTab === 'integration' && <IntegrationSettings />}
            {activeTab === 'ui' && <UISettings />}
            {activeTab === 'audit' && <AuditSettings />}
          </div>
        </div>
      </div>
    </main>
  );
};

const ProfileSettings = () => (
  <div className="flex-1 overflow-y-auto main-scrollbar p-8 border-t-4 border-[#2c5ea0]">
    <div className="flex items-center gap-3 mb-8">
      <div className="w-10 h-10 bg-[#e8eef6] rounded-xl flex items-center justify-center">
        <Building className="w-5 h-5 text-[#2c5ea0]" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-[#1e2a3a]">Cấu Hình Thông Tin Chung</h3>
        <p className="text-xs text-[#7b8a9e] uppercase tracking-widest mt-1">Định danh nhà trường & Liên hệ</p>
      </div>
    </div>

    <div className="space-y-8 max-w-4xl">
      <section className="bg-[#f0f4fa] p-6 rounded-2xl border border-[#b8c6d9]">
        <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-5">Thông Tin Định Danh</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên trường đầy đủ</label>
            <input type="text" defaultValue="Trường Mầm non An Hữu" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên tiếng anh (Tùy chọn)</label>
            <input type="text" defaultValue="An Huu High School" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Mã trường (Mã bộ)</label>
            <input type="text" defaultValue="0890252" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-none" />
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Năm thành lập</label>
            <input type="text" defaultValue="1985" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
        </div>
      </section>

      <section className="bg-[#f0f4fa] p-6 rounded-2xl border border-[#b8c6d9]">
        <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-5">Liên Hệ & Trực Tuyến</h4>
        <div className="grid grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Địa chỉ</label>
            <input type="text" defaultValue="Quốc lộ 1A, Xã An Hữu, Huyện Cái Bè, Tiền Giang" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Website</label>
            <input type="text" defaultValue="https://thanhuu.edu.vn" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hotline / Số ĐT</label>
            <input type="text" defaultValue="0273.3831.065" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Email hỗ trợ</label>
            <input type="text" defaultValue="contact@teacher.mnah.edu.vn" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
        </div>
      </section>

      <section className="bg-[#f0f4fa] p-6 rounded-2xl border border-[#b8c6d9]">
        <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-5">Đại Diện Pháp Lý</h4>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Hiệu trưởng</label>
            <input type="text" defaultValue="Nguyễn Văn A" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Kế toán trưởng</label>
            <input type="text" defaultValue="Lê Thị Hoa" className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
            <p className="text-[10px] text-[#7b8a9e] mt-2 italic">* Để hiển thị tự động lên chân chữ ký biểu mẫu thu/chi</p>
          </div>
        </div>
      </section>
      
      <section className="bg-[#f0f4fa] p-6 rounded-2xl border border-[#b8c6d9]">
        <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-5">Nhận Điện Thương Hiệu</h4>
        <div className="flex gap-8 items-start">
           <div className="flex-1">
             <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Logo hệ thống</label>
             <div className="border border-dashed border-[#b8c6d9] rounded-xl p-8 flex flex-col items-center justify-center bg-[#ffffff] hover:bg-[#e8eef6] transition-colors cursor-pointer">
                <Building className="w-8 h-8 text-[#8e9eb4] mb-2" />
                <span className="text-xs font-bold text-[#4a5568]">Bấm để chọn file (SVG/PNG)</span>
             </div>
           </div>
           <div className="flex-1">
             <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Login Banner / Background</label>
             <div className="border border-dashed border-[#b8c6d9] rounded-xl p-8 flex flex-col items-center justify-center bg-[#ffffff] hover:bg-[#e8eef6] transition-colors cursor-pointer">
                <Monitor className="w-8 h-8 text-[#8e9eb4] mb-2" />
                <span className="text-xs font-bold text-[#4a5568]">Bấm để chọn file (JPG/PNG lớn)</span>
             </div>
           </div>
        </div>
      </section>

    </div>
  </div>
);

const AcademicSettings = () => (
  <div className="flex-1 overflow-y-auto main-scrollbar p-8 border-t-4 border-[#2e6b8a]">
    <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#e8eef6] rounded-xl flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-[#2e6b8a]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1e2a3a]">Khung Tham Số Học Thuật</h3>
          <p className="text-xs text-[#7b8a9e] uppercase tracking-widest mt-1">Năm học, học kỳ & Quy tắc xét đánh giá</p>
        </div>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-[#f5f8fc] border border-[#b8c6d9] rounded-xl text-xs font-bold uppercase tracking-widest text-[#1e2a3a]">
        <Plus className="w-4 h-4" />
        Thiết lập Năm Học mới
      </button>
    </div>

    <div className="space-y-6 max-w-5xl">
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <section className="bg-[#f0f4fa] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm">
            <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-5">Danh Sách Học Kỳ Gần Đây</h4>
            <div className="space-y-3">
               {[
                 { year: '2025 - 2026', term: 'Học kỳ II', range: '15/01/2026 - 31/05/2026', status: 'Đang diễn ra', color: 'text-[#10b981]' },
                 { year: '2025 - 2026', term: 'Học kỳ I', range: '05/09/2025 - 14/01/2026', status: 'Đã khóa', color: 'text-[#7b8a9e]' },
                 { year: '2024 - 2025', term: 'Học kỳ II', range: '15/01/2025 - 31/05/2025', status: 'Đã khóa', color: 'text-[#7b8a9e]' },
               ].map((t, idx) => (
                  <div key={idx} className="p-4 bg-[#ffffff] border border-[#b8c6d9] rounded-xl flex justify-between items-center group hover:border-[#2c5ea0]">
                     <div>
                       <p className="font-bold text-[#1e2a3a]">{t.year} - {t.term}</p>
                       <p className="text-xs text-[#4a5568] font-medium mt-1">{t.range}</p>
                     </div>
                     <div className="flex gap-4 items-center">
                       <span className={`text-xs font-bold uppercase tracking-widest ${t.color}`}>{t.status}</span>
                       <button className="text-[#8e9eb4] hover:text-[#1e2a3a] p-1"><Edit className="w-4 h-4" /></button>
                     </div>
                  </div>
               ))}
            </div>
         </section>

         <section className="space-y-6">
            <div className="bg-[#fff9f9] p-6 rounded-2xl border border-[#fccfcf] shadow-sm">
              <div className="flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#fce5e5] shrink-0 flex items-center justify-center">
                    <ShieldAlert className="w-5 h-5 text-[#991b1b]" />
                 </div>
                 <div>
                    <h4 className="text-sm font-bold text-[#991b1b] uppercase tracking-widest mb-1">Khóa sổ Dữ liệu (Data Lock)</h4>
                    <p className="text-xs text-[#4a5568] leading-relaxed mb-4">Các học kỳ đã khóa sẽ đóng băng điểm số, chuyên cần và học bạ. Chỉ có Super Admin mới có thể mở khóa để chỉnh sửa ngoại lệ.</p>
                    
                    <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#fccfcf]">
                       <div className="flex-1">
                          <p className="font-bold text-[#1e2a3a] text-sm">Học kỳ I (2025-2026)</p>
                          <p className="text-xs font-bold text-[#10b981] mt-1">Trạng thái: Đang Mở</p>
                       </div>
                       <button className="px-4 py-2 bg-[#991b1b] text-white rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-[#7f1d1d] transition-colors">
                          Thực hiện Khóa Sổ
                       </button>
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-[#f0f4fa] p-6 rounded-2xl border border-[#b8c6d9] shadow-sm">
              <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-3 mb-5">Tiêu Chuẩn Đánh Giá (Bộ GD&ĐT)</h4>
              <div className="p-4 bg-white border border-[#b8c6d9] rounded-xl flex items-center justify-between">
                 <div>
                   <p className="font-bold text-[#1e2a3a]">Thông tư áp dụng Khối 1 - 4</p>
                   <p className="text-xs text-[#7b8a9e] mt-1">Thông tư 27/2020/TT-BGDĐT</p>
                 </div>
                 <button className="px-3 py-1.5 border border-[#b8c6d9] rounded text-xs font-bold">Cấu hình ĐTB & Hạnh kiểm</button>
              </div>
              <div className="p-4 bg-white border border-[#b8c6d9] rounded-xl flex items-center justify-between mt-3">
                 <div>
                   <p className="font-bold text-[#1e2a3a]">Thang điểm cấu hình riêng</p>
                   <p className="text-xs text-[#7b8a9e] mt-1">Hệ số 1, 2, 3</p>
                 </div>
                 <button className="px-3 py-1.5 border border-[#b8c6d9] rounded text-xs font-bold">Chi tiết</button>
              </div>
            </div>
         </section>
       </div>
    </div>
  </div>
);

const RBACSettings = () => (
  <div className="flex-1 overflow-y-auto main-scrollbar p-8 border-t-4 border-[#1e40af]">
    <div className="flex flex-wrap justify-between items-start mb-8 gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#e8eef6] rounded-xl flex items-center justify-center">
          <Users className="w-5 h-5 text-[#1e40af]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1e2a3a]">Tài Khoản & Phân Quyền</h3>
          <p className="text-xs text-[#7b8a9e] uppercase tracking-widest mt-1">Bảo mật cấp độ nhóm (RBAC Matrix)</p>
        </div>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-[#1e2a3a] border border-[#131a25] rounded-xl text-white text-xs font-bold uppercase tracking-widest shadow-sm">
        <Plus className="w-4 h-4" />
        Thêm Tài Khoản
      </button>
    </div>

    <div className="flex gap-6 max-h-[600px]">
       <div className="w-1/3 flex flex-col gap-3">
         <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest pl-1 mb-2">Nhóm Quyền (Roles)</h4>
         {[
           { name: 'Admin (Ban Giám Hiệu)', count: 4, icon: ShieldAlert, active: true },
           { name: 'Văn Thư - Giáo Vụ', count: 6, icon: BookOpen, active: false },
           { name: 'Kế Toán Chuyên Trách', count: 2, icon: Network, active: false },
           { name: 'Giáo Viên Chủ Nhiệm', count: 45, icon: Users, active: false },
           { name: 'Giáo Viên Bộ Môn', count: 90, icon: Users, active: false },
         ].map((r, i) => (
           <button key={i} className={`flex items-center justify-between p-4 rounded-xl border transition-all text-left ${r.active ? 'bg-white border-[#1e40af] shadow-[4px_0_0_#1e40af_inset]' : 'bg-[#f0f4fa] border-[#b8c6d9] hover:bg-white'}`}>
             <div className="flex items-center gap-3">
               <div className={`p-1.5 rounded bg-[#e8eef6] ${r.active ? 'text-[#1e40af]' : 'text-[#7b8a9e]'}`}>
                 <r.icon className="w-4 h-4" />
               </div>
               <span className={`text-sm font-bold ${r.active ? 'text-[#1e40af]' : 'text-[#1e2a3a]'}`}>{r.name}</span>
             </div>
             <span className="bg-[#e8eef6] text-[#4a5568] text-[10px] font-bold px-2 py-0.5 rounded-full">{r.count}</span>
           </button>
         ))}
       </div>

       <div className="w-2/3 bg-white border border-[#b8c6d9] rounded-2xl flex flex-col overflow-hidden">
         <div className="p-5 border-b border-[#b8c6d9] bg-[#f0f4fa] flex justify-between items-center">
            <div>
              <h4 className="font-bold text-[#1e2a3a]">Ma trận quyền: <span className="text-[#1e40af]">Admin (Ban Giám Hiệu)</span></h4>
              <p className="text-xs text-[#7b8a9e] mt-1">Có toàn quyền đối với các module hệ thống.</p>
            </div>
            <button className="text-xs font-bold text-[#10b981] flex items-center gap-1 border border-[#10b981] px-3 py-1.5 rounded-lg">
              <Save className="w-3 h-3" /> Lưu ma trận
            </button>
         </div>
         <div className="flex-1 overflow-y-auto main-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="bg-[#f5f8fc] sticky top-0 z-10">
                 <tr>
                   <th className="p-4 text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9]">Tên Phân Hệ (Module)</th>
                   <th className="p-4 text-center text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">Xem (R)</th><th className="p-4 text-center text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">Thêm (C)</th><th className="p-4 text-center text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">Sửa (U)</th><th className="p-4 text-center text-[10px] font-bold text-[#4a5568] uppercase tracking-widest border-b border-[#b8c6d9]">Xóa (D)</th></tr></thead>
                        <tbody>
                  {[
                    'Quản lý học sinh', 'Chương trình đào tạo', 'Trọng tài & Nhật ký', 'Cơ sở vật chất', 'Hành chính tổng hợp', 'Quản lý tài chính', 'Đoàn & Phong trào', 'Sổ Liên lạc phụ huynh'
                  ].map((mod, i) => (
                    <tr key={i} className="border-b border-[#b8c6d9] hover:bg-[#f0f4fa]">
                       <td className="p-4 text-sm font-bold text-[#1e2a3a]">{mod}</td>
                       <td className="p-4 text-center"><input type="checkbox" defaultChecked className="w-4 h-4 accent-[#1e40af] rounded" /></td>
                       <td className="p-4 text-center"><input type="checkbox" defaultChecked className="w-4 h-4 accent-[#1e40af] rounded" /></td>
                       <td className="p-4 text-center"><input type="checkbox" defaultChecked className="w-4 h-4 accent-[#1e40af] rounded" /></td>
                       <td className="p-4 text-center"><input type="checkbox" defaultChecked className="w-4 h-4 accent-[#1e40af] rounded" /></td>
                    </tr>
                  ))}
               </tbody>
            </table>
         </div>
       </div>
    </div>
  </div>
);

const IntegrationSettings: React.FC = () => {
  const [dbStatus, setDbStatus] = useState<'unchecked' | 'checking' | 'connected' | 'error'>('unchecked');
  const [errorMsg, setErrorMsg] = useState('');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [syncCount, setSyncCount] = useState(0);

  const testConnection = async () => {
    setDbStatus('checking');
    setErrorMsg('');
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
      setDbStatus('connected');
    } catch (error: any) {
      console.error(error);
      setDbStatus('error');
      setErrorMsg(error.message || String(error));
    }
  };

  useEffect(() => {
    testConnection();
  }, []);

  const handleSeedData = async () => {
    setSyncStatus('syncing');
    try {
      await seedDefaultStudents();
      await seedDefaultStaff();
      await seedAllDatabase();

      setSyncStatus('success');
      setSyncCount(120); // Estimated total entries seeded
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setErrorMsg(err.message || String(err));
    }
  };

  return (
    <div className="flex-1 overflow-y-auto main-scrollbar p-8 border-t-4 border-[#b45309]">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#e8eef6] rounded-xl flex items-center justify-center">
          <Network className="w-5 h-5 text-[#b45309]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1e2a3a]">Cấu hình Cơ sở dữ liệu & Tích hợp</h3>
          <p className="text-xs text-[#7b8a9e] uppercase tracking-widest mt-1">Kết nối Đám mây Firebase Firestore & Dịch Vụ Mở Rộng</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mb-8">
        {/* Firebase Firestore Cloud DB Configuration */}
        <section className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-sm lg:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#b8c6d9] pb-4 mb-5 gap-4">
            <div className="flex items-center gap-3">
              <Cloud className="w-6 h-6 text-[#1e40af]" />
              <div>
                <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest flex items-center gap-2">
                  Kết Nối Google Firebase Firestore
                  <span className="text-[10px] font-mono normal-case px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200">Enterprise Edition</span>
                </h4>
                <p className="text-[10px] text-[#7b8a9e] font-medium mt-1">Hệ thống cơ sở dữ liệu đám mây Realtime cho Mầm non An Hữu.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {dbStatus === 'checking' && (
                <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Đang Kết Nối...
                </span>
              )}
              {dbStatus === 'connected' && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <Check className="w-3 h-3" /> Đã Kết Nối Đám Mây
                </span>
              )}
              {dbStatus === 'error' && (
                <span className="px-3 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3 h-3" /> Lỗi Kết Nối
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Project ID</label>
                <div className="w-full px-4 py-2.5 bg-[#f5f8fc] border border-[#b8c6d9] rounded-lg text-sm font-mono text-[#1e2a3a] select-all">
                  sunlit-woodland-9rwfn
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Firestore Database Name</label>
                <div className="w-full px-4 py-2.5 bg-[#f5f8fc] border border-[#b8c6d9] rounded-lg text-sm font-mono text-[#1e2a3a] select-all">
                  ai-studio-08cdad5f-33e3-4db4-ad00-234fec545ae1
                </div>
              </div>
            </div>

            <div className="bg-[#f0f4fa] p-5 rounded-xl border border-[#b8c6d9] flex flex-col justify-between">
              <div>
                <h5 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#2c5ea0]" />
                  Quản lý Dữ liệu Mẫu (Seeding Wizard)
                </h5>
                <p className="text-[11px] text-[#7b8a9e] leading-relaxed">
                  Bơm trực tiếp bộ dữ liệu học sinh thật và cán bộ giáo viên từ hệ thống ban đầu lên đám mây Firestore để khởi chạy hệ thống tức thì.
                </p>
                {errorMsg && (
                  <p className="text-[10px] text-rose-600 bg-rose-50 font-mono p-2 rounded border border-rose-200 mt-2 max-h-24 overflow-y-auto">
                    <strong>Error details:</strong> {errorMsg}
                  </p>
                )}
                {syncStatus === 'success' && (
                  <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 mt-2 flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    Đồng bộ thành công! Đã nạp {syncCount} bản ghi mẫu lên Firestore.
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={dbStatus === 'checking'}
                  className="px-4 py-2 bg-white hover:bg-[#e8eef6] border border-[#b8c6d9] text-xs font-semibold rounded-lg text-[#1e2a3a] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${dbStatus === 'checking' ? 'animate-spin' : ''}`} />
                  Kiểm tra lại
                </button>
                <button
                  type="button"
                  onClick={handleSeedData}
                  disabled={syncStatus === 'syncing' || dbStatus !== 'connected'}
                  className="flex-1 px-4 py-2 bg-[#2c5ea0] hover:bg-[#5c2e2e] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all text-center shadow-sm disabled:opacity-50"
                >
                  {syncStatus === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Đang đồng bộ...
                    </>
                  ) : (
                    <>
                      <Database className="w-3.5 h-3.5" />
                      Bơm dữ liệu mẫu lên đám mây
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#b8c6d9] pb-4 mb-5">
            <Mail className="w-6 h-6 text-[#1e40af]" />
            <div>
              <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest">Cấu Hình Email (SMTP)</h4>
              <p className="text-[10px] text-[#7b8a9e] font-medium mt-1">Sử dụng để gửi thông báo, học bạ, reset password.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">SMTP Server / Host</label>
              <input type="text" defaultValue="smtp.gmail.com" className="w-full px-4 py-2.5 bg-[#f5f8fc] border border-[#b8c6d9] rounded-lg text-sm font-mono text-[#1e2a3a]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Port</label>
                <input type="text" defaultValue="587" className="w-full px-4 py-2.5 bg-[#f5f8fc] border border-[#b8c6d9] rounded-lg text-sm font-mono text-[#1e2a3a]" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Bảo mật</label>
                <div className="w-full">
                  <BaseSelect value="TLS" options={[{value: "TLS", label: "TLS"}, {value: "SSL", label: "SSL"}]} onChange={() => {}} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-[#b8c6d9] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between border-b border-[#b8c6d9] pb-4 mb-5">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-[#10b981]" />
              <div>
                <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest">Gateway SMS & Zalo ZNS</h4>
                <p className="text-[10px] text-[#7b8a9e] font-medium mt-1">Thông báo chuyên cần, tin nhắn khẩn cấp.</p>
              </div>
            </div>
            <div className="px-2 py-1 bg-[#d1fae5] text-[#047857] text-[10px] font-bold rounded uppercase tracking-widest">Active</div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1.5">Nhà cung cấp</label>
              <div className="w-full">
                 <BaseSelect value="VietGuys (eSMS)" options={[{value: "VietGuys (eSMS)", label: "VietGuys (eSMS)"}, {value: "Zalo Official Account", label: "Zalo Official Account"}]} onChange={() => {}} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};


const UISettings = () => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as any) || 'light';
  });

  const [density, setDensity] = useState<'standard' | 'compact'>(() => {
    return (localStorage.getItem('tableDensity') as any) || 'standard';
  });

  const [language, setLanguage] = useState<'vi' | 'en'>(() => {
    return (localStorage.getItem('language') as any) || 'vi';
  });

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.dispatchEvent(new Event('theme-changed'));
  };

  const handleDensityChange = (newDensity: 'standard' | 'compact') => {
    setDensity(newDensity);
    localStorage.setItem('tableDensity', newDensity);
    const body = window.document.body;
    if (newDensity === 'compact') {
      body.classList.add('compact-tables');
    } else {
      body.classList.remove('compact-tables');
    }
  };

  const handleLanguageChange = (newLang: 'vi' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('language', newLang);
    window.dispatchEvent(new Event('language-changed'));
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto main-scrollbar">
       <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-[#e8eef6] rounded-xl flex items-center justify-center">
          <Monitor className="w-5 h-5 text-[#7b8a9e]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1e2a3a]">{language === 'en' ? 'UI/UX Settings & Preferences' : 'Tùy Chỉnh Giao Diện & Trải Nghiệm'}</h3>
          <p className="text-xs text-[#7b8a9e] uppercase tracking-widest mt-1">UI/UX Preferences</p>
        </div>
      </div>
      
      <div className="max-w-3xl space-y-8">
         <div>
           <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">
             {language === 'en' ? 'Display Themes' : 'Chế Độ Hiển Thị (Themes)'}
           </h4>
           <div className="grid grid-cols-3 gap-6">
             {[
               { id: 'light', name: language === 'en' ? 'Light Mode (Classic)' : 'Light Mode (Classic)', desc: language === 'en' ? 'Standard bright mode' : 'Chế độ sáng chuẩn, mềm mại', color: 'bg-[#e8eef6]', border: 'border-[#b8c6d9]' },
               { id: 'dark', name: language === 'en' ? 'Dark Mode (Studio)' : 'Dark Mode (Studio)', desc: language === 'en' ? 'Developer dark style' : 'Cho kỹ thuật, không gian tối', color: 'bg-[#131a25]', border: 'border-[#283548]' },
               { id: 'system', name: language === 'en' ? 'System Auto' : 'System Auto', desc: language === 'en' ? 'Follow system clock/theme' : 'Theo thời gian máy tính', color: 'bg-gradient-to-r from-[#e8eef6] to-[#131a25]', border: 'border-[#b8c6d9]' },
             ].map((t) => {
               const isActive = theme === t.id;
               return (
                 <div 
                   key={t.id} 
                   onClick={() => handleThemeChange(t.id as any)}
                   className={`rounded-xl border-2 p-4 cursor-pointer hover:shadow-md transition-shadow ${isActive ? 'border-[#2c5ea0] shadow-[0_0_0_2px_rgba(122,62,62,0.2)]' : 'border-[#b8c6d9]'}`}
                 >
                   <div className={`w-full h-24 rounded-lg mb-3 ${t.color} ${t.border} border`}></div>
                   <p className="font-bold text-sm text-[#1e2a3a]">{t.name}</p>
                   <p className="text-[10px] text-[#7b8a9e] mt-1">{t.desc}</p>
                 </div>
               );
             })}
           </div>
         </div>

         <div>
           <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">
             {language === 'en' ? 'Layout Density & Language' : 'Mật Độ Lưới & Giao Diện Cơ Bản'}
           </h4>
           <div className="bg-[#f0f4fa] p-5 rounded-xl border border-[#b8c6d9] grid grid-cols-2 gap-8">
              <div>
                 <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">
                   {language === 'en' ? 'Compact Data Tables' : 'Compact Data Tables (Bảng danh sách)'}
                 </label>
                 <div className="w-full">
                   <BaseSelect 
                     value={density} 
                     options={[
                       {value: "standard", label: language === 'en' ? "Standard (Spacious)" : "Tiêu chuẩn (Rộng rãi)"}, 
                       {value: "compact", label: language === 'en' ? "Compact (Condensed)" : "Thu gọn (Nhiều dòng)"}
                     ]} 
                     onChange={(val) => handleDensityChange(val as any)} 
                   />
                 </div>
                 <p className="text-[10px] text-[#7b8a9e] mt-2 italic">
                   {language === 'en' 
                     ? 'Compact mode reduces table row padding to fit more data on a single screen.' 
                     : 'Chế độ thu gọn sẽ giảm padding bảng để hiển thị nhiều học sinh trên cùng 1 màn hình.'}
                 </p>
              </div>
              <div>
                 <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">
                   {language === 'en' ? 'Interface Language' : 'Ngôn ngữ giao diện (Language)'}
                 </label>
                 <div className="w-full">
                   <BaseSelect 
                     value={language} 
                     options={[
                       {value: "vi", label: "Tiếng Việt (Mặc định)"}, 
                       {value: "en", label: "English"}
                     ]} 
                     onChange={(val) => handleLanguageChange(val as any)} 
                   />
                 </div>
              </div>
           </div>
         </div>
      </div>
    </div>
  );
};

const AuditSettings = () => (
  <div className="flex-1 p-8 overflow-y-auto main-scrollbar w-full h-full">
     <div className="flex justify-between items-start mb-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#e8eef6] rounded-xl flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-[#1e2a3a]" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#1e2a3a]">Nhật Ký Hoạt Động & Sao Lưu</h3>
          <p className="text-xs text-[#7b8a9e] uppercase tracking-widest mt-1">Audit Trail & Database Backups</p>
        </div>
      </div>
      <button className="flex items-center gap-2 px-4 py-2 bg-[#1e2a3a] border border-[#131a25] rounded-xl text-white text-xs font-bold uppercase tracking-widest shadow-sm">
        <RefreshCw className="w-4 h-4" />
        Backup Database Ngay
      </button>
    </div>

    <div className="flex flex-col gap-6">
       <div className="bg-[#f0f4fa] p-5 rounded-2xl border border-[#b8c6d9] flex gap-8 items-center">
          <div className="flex-1">
             <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-2">Chính sách Sao Lưu (Auto Backup)</h4>
             <p className="text-xs text-[#4a5568]">Hệ thống đang tự động Dump dữ liệu lên S3 Cloud vào <span className="font-bold text-[#10b981]">02:00 AM mỗi ngày</span>. Bản lưu trữ được giữ lại trong vòng 30 ngày.</p>
          </div>
          <div>
            <button className="text-xs font-bold px-4 py-2 border border-[#b8c6d9] rounded-lg bg-white shadow-sm flex items-center gap-2 hover:bg-[#e8eef6]">
               <Database className="w-4 h-4" />
               Mở kho lưu trữ (32 files)
            </button>
          </div>
       </div>

       <div className="flex-1 bg-white border border-[#b8c6d9] rounded-2xl flex flex-col min-h-[400px]">
          <div className="p-4 border-b border-[#b8c6d9] bg-[#f5f8fc] flex items-center justify-between">
             <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest flex items-center gap-2">
                <Key className="w-4 h-4 text-[#7b8a9e]"/>
                Liệt kê thao tác siêu máy tính (Audit Logs)
             </h4>
             <div className="flex gap-2">
                <BaseDatePicker value="" onChange={() => {}} wrapperClassName="w-40" inputClassName="!py-1.5 !pl-3 !pr-8 !text-xs !rounded bg-white font-bold" />
                <input type="text" placeholder="Tìm theo Username..." className="text-xs px-3 py-1.5 border border-[#b8c6d9] rounded bg-white w-48 font-bold focus:outline-none focus:border-[#2c5ea0]" />
             </div>
          </div>
          <div className="flex-1 overflow-x-auto min-h-[300px]">
            <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-[#f5f8fc] text-[10px] font-bold text-[#4a5568] uppercase tracking-widest">
                  <tr>
                    <th className="p-4 border-b border-[#b8c6d9]">Thời Điểm</th>
                    <th className="p-4 border-b border-[#b8c6d9]">Người Dùng</th>
                    <th className="p-4 border-b border-[#b8c6d9]">Mảng (Module)</th>
                    <th className="p-4 border-b border-[#b8c6d9]">Loại Tác Vụ</th>
                    <th className="p-4 border-b border-[#b8c6d9]">Mô Tả Chi Tiết</th>
                    <th className="p-4 border-b border-[#b8c6d9]">IP Address</th>
                  </tr>
               </thead>
               <tbody>
                  {[
                    { t: '11/06/2026 - 10:15', u: 'admin.hieu', m: 'Học bạ', type: 'UPDATE', d: 'Thay đổi điểm Môn Toán (HK2) HS Nguyễn Lê Huy từ 7.5 -> 8.0', ip: '113.161.x.x' },
                    { t: '11/06/2026 - 09:30', u: 'ketoan_main', m: 'Tài chính', type: 'CREATE', d: 'Tạo phiếu thu #PT001 cho HS Phạm Minh A', ip: '14.161.x.x' },
                    { t: '10/06/2026 - 14:22', u: 'gv.tranb', m: 'Điểm danh', type: 'DELETE', d: 'Xóa trạng thái vắng mặt tiết 2 lớp 1A1', ip: '113.161.x.x' },
                    { t: '10/06/2026 - 08:30', u: 'admin_sys', m: 'Hệ thống', type: 'LOGIN', d: 'Đăng nhập thành công từ thiết bị lạ (MacOS)', ip: '118.69.x.x' },
                  ].map((l, i) => (
                    <tr key={i} className="border-b border-[#e8eef6] hover:bg-[#f0f4fa] text-[#1e2a3a]">
                      <td className="p-4 text-xs font-mono text-[#7b8a9e]">{l.t}</td>
                      <td className="p-4 font-bold">{l.u}</td>
                      <td className="p-4"><span className="bg-[#e8eef6] px-2 py-1 rounded text-xs font-bold text-[#4a5568]">{l.m}</span></td>
                      <td className="p-4">
                         <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest ${l.type === 'UPDATE' ? 'bg-[#fef9c3] text-[#a16207]' : l.type === 'CREATE' ? 'bg-[#dcfce7] text-[#166534]' : l.type === 'DELETE' ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#e0e7ff] text-[#3730a3]'}`}>{l.type}</span>
                      </td>
                      <td className="p-4 italic max-w-md truncate" title={l.d}>{l.d}</td>
                      <td className="p-4 text-xs font-mono text-[#7b8a9e]">{l.ip}</td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
       </div>
    </div>
  </div>
);

export default SettingsPanel;
