import React from 'react';

export interface ContactBookData {
  id: string;
  name: string;
  dob: string;
  gender: string;
  grade: string;
  track: string;
  gvcn: string;
  academicYear: string;
  weeklyOffenses: string;
  weeklyRewards: string;
  moralConduct: string;
  averageScore: number;
  subjectAverages: { subject: string; score: number; status: string }[];
  comments: string;
}

interface PrintableContactBookProps {
  data: ContactBookData;
  selectedSemester?: string;
}

export const PrintableContactBook: React.FC<PrintableContactBookProps> = ({ data, selectedSemester = 'Học Kỳ II' }) => {
  return (
    <div className="bg-white p-8 font-sans text-gray-850 relative max-w-[210mm] mx-auto min-h-[297mm]">
      {/* Background Decorative border */}
      <div className="absolute inset-4 border-2 border-dashed border-[#4a5568] pointer-events-none rounded-lg" />

      {/* Watermark Emblem */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <div className="w-[450px] h-[450px] rounded-full border-[8px] border-dashed border-[#4a5568] flex items-center justify-center">
          <span className="text-6xl font-serif text-[#4a5568] font-bold">AN HỮU</span>
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* Header (Đầu trang) */}
        <div className="flex justify-between items-start border-b-2 border-double border-gray-300 pb-4">
          <div className="text-left">
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#2c5ea0]">HỆ THỐNG LIÊN LẠC CHẤT LƯỢNG CAO</p>
            <p className="text-xs font-serif font-bold text-[#1e2a3a] uppercase mt-1">TRƯỜNG TRUNG HỌC PHỔ THÔNG AN HỮU</p>
            <p className="text-[9px] text-gray-500 font-mono">AH-PORTAL: SLL-2026</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-800">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-[10px] font-bold text-[#2c5ea0] tracking-widest uppercase">Độc lập - Tự do - Hạnh phúc</p>
            <div className="h-[1px] bg-gray-300 w-16 ml-auto mt-1" />
          </div>
        </div>

        {/* Title (Chào Sổ liên lạc) */}
        <div className="text-center py-2 space-y-1">
          <h1 className="text-2xl font-serif font-bold text-[#1e2a3a] tracking-wide uppercase">
            SỔ LIÊN LẠC ĐIỆN TỬ {selectedSemester === 'Cả Năm' ? 'CẢ NĂM' : selectedSemester.toUpperCase()}
          </h1>
          <p className="text-xs text-gray-500 italic">Cập nhật chỉ số rèn luyện phối hợp giữa gia đình và nhà trường</p>
          <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-mono font-bold uppercase mt-2">
            Mã định danh lưu trữ: {data.id}
          </div>
        </div>

        {/* Student metadata Info Block */}
        <div className="grid grid-cols-2 gap-4 bg-[#edf2f9] border border-[#b8c6d9] p-4 rounded-xl text-xs">
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="font-bold text-gray-500 w-24">Họ và Tên:</span>
              <span className="font-bold text-[#2c5ea0] font-serif text-sm">{data.name}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-gray-500 w-24">Ngày sinh:</span>
              <span className="font-bold font-serif">{data.dob}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-bold text-gray-500 w-24">Giới tính:</span>
              <span className="font-bold">{data.gender}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="font-bold text-gray-500 w-24">Lớp hiện tại:</span>
              <span className="font-bold text-gray-800">{data.grade}</span>
            </div>

            <div className="flex gap-2">
              <span className="font-bold text-gray-500 w-24">GV Chủ nhiệm:</span>
              <span className="font-bold font-serif text-gray-800">{data.gvcn}</span>
            </div>
          </div>
        </div>

        {/* Dynamic score summary table (Bảng điểm học kỳ) */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-bold text-[#2c5ea0] uppercase tracking-widest font-mono">I. Kết quả điểm trung bình các phân môn</h3>
          <div className="border border-[#c5bcae] rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f5ebd6] text-gray-800 font-bold text-[10px] uppercase border-b border-[#c5bcae]">
                  <th className="p-2 border-r border-[#c5bcae]/40">MÔN HỌC BỘ MÔN</th>
                  <th className="p-2 border-r border-[#c5bcae]/40 text-center">ĐIỂM TRUNG BÌNH</th>
                  <th className="p-2 border-r border-[#c5bcae]/40">TIẾN ĐỘ HOÀN THÀNH</th>
                  <th className="p-2">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c5bcae]/30">
                {data.subjectAverages.map((sub, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="p-2 border-r border-[#c5bcae]/30 font-bold bg-[#edf2f9]/40">{sub.subject}</td>
                    <td className="p-2 border-r border-[#c5bcae]/30 text-center font-serif font-bold text-gray-800">{sub.score.toFixed(1)}</td>
                    <td className="p-2 border-r border-[#c5bcae]/30 text-[#4a5568] text-[11px] font-medium">
                      Đã kết khóa sổ điểm trực tuyến ({selectedSemester})
                    </td>
                    <td className="p-2">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold ${
                        sub.score >= 8.0 ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Conduct development & Discipline Box (Đánh giá nề nếp) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print-avoid-break">
          {/* Lời nhận xét */}
          <div className="border border-gray-300 rounded-xl p-4 bg-[#fdfbf6] space-y-2">
            <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider font-mono">II. Nhận xét Đạo đức & Học Lực</h4>
            <div className="p-3 bg-white rounded border border-[#b8c6d9] min-h-[80px] italic text-[11px] text-gray-700 leading-relaxed">
              "{data.comments}"
            </div>
          </div>

          {/* Vi phạm / Khen thưởng */}
          <div className="border border-gray-300 rounded-xl p-4 bg-[#fdfbf6] space-y-2">
            <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider font-mono">III. Điểm tích lũy & Nề nếp tuần</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between border-b border-[#dce4ee] pb-1">
                <span className="text-gray-500 font-medium">Khen thưởng thi đua:</span>
                <span className="font-bold text-green-700">{data.weeklyRewards || 'Không ghi nhận'}</span>
              </div>
              <div className="flex justify-between border-b border-[#dce4ee] pb-1">
                <span className="text-gray-500 font-medium font-sans">Vi phạm nề nếp:</span>
                <span className="font-bold text-red-700">{data.weeklyOffenses || 'Không có'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Hạnh kiểm học tập:</span>
                <span className="font-bold text-[#1e2a3a]">{data.moralConduct}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Educational Signature section (Chữ ký / Footer) */}
        <div className="grid grid-cols-3 gap-4 pt-10 text-center text-xs print-avoid-break border-t border-[#dce4ee] border-dashed">
          <div>
            <p className="font-bold text-gray-600 uppercase tracking-wider text-[9px] mb-12">PHỤ HUYNH HỌC SINH MỤC THỤ</p>
            <p className="italic text-[10px] text-gray-400 font-medium">(Ý kiến kiểm duyệt của gia đình)</p>
          </div>
          <div>
            <p className="font-bold text-gray-600 uppercase tracking-wider text-[9px] mb-12">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="font-bold text-gray-800 underline">{data.gvcn}</p>
            <p className="text-[10px] text-green-700 font-bold italic mt-0.5">(Đã gửi trực tuyến Portal An Hữu)</p>
          </div>
          <div>
            <p className="text-[10px] text-[#4a5568] font-bold tracking-tight italic mb-1">Cái Bè, ngày 11 tháng 06 năm 2026</p>
            <p className="font-bold text-[#2c5ea0] uppercase tracking-wider text-[9px] mb-12">BAN GIÁM HIỆU PHÊ DUYỆT</p>
            <p className="font-bold text-gray-800">ThS. Nguyễn Văn Trí</p>
            <div className="text-[9px] text-[#2c5ea0] font-bold border border-[#2c5ea0]/30 px-2 py-0.5 inline-block mt-1 font-serif rotate-[-1deg] rounded">
              Mầm non An Hữu Ban Giám Hiệu
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
