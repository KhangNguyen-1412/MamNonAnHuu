import React from 'react';

export interface ReportCardData {
  id: string;
  name: string;
  dob: string;
  gender: string;
  grade: string;
  gvcn: string;
  academicYear: string;
  scores: {
    subject: string;
    multiplier1: (number | string)[]; // Miệng, 15p
    multiplier2: (number | string)[]; // 1 tiết, Giữa kỳ
    multiplier3: number | string;   // Thi Cuối kỳ
    average: number | string;
    teacherComment: string;
  }[];
  summary: {
    gpa: number;
    academicConduct: 'Xuất Sắc' | 'Giỏi' | 'Khá' | 'Trung Bình' | 'Yếu';
    moralConduct: 'Tốt' | 'Khá' | 'Trung Bình' | 'Yếu';
    daysAbsent: number;
    daysAbsentExcused: number;
    generalComment: string;
  };
}

interface PrintableReportCardProps {
  data: ReportCardData;
  selectedSemester?: string;
}

export const PrintableReportCard: React.FC<PrintableReportCardProps> = ({ data, selectedSemester = 'Học Kỳ II' }) => {
  return (
    <div className="bg-white p-8 font-sans text-gray-850 relative max-w-[210mm] mx-auto min-h-[297mm]">
      {/* Background Decorative Frame */}
      <div className="absolute inset-4 border-2 border-[#8c7e6b] pointer-events-none rounded-lg" />
      <div className="absolute inset-5 border border-[#c5bcae] pointer-events-none rounded-lg" />

      {/* Watermark Emblem (subtle circle vector logo) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
        <div className="w-96 h-96 rounded-full border-[10px] border-[#8c7e6b] flex items-center justify-center">
          <div className="text-center">
            <span className="text-5xl font-serif text-[#8c7e6b] font-bold block mb-2">AN HỮU</span>
            <span className="text-xs font-sans tracking-[0.2em] font-bold text-[#8c7e6b] uppercase block">MẦM NON</span>
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        {/* State/National Header */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b border-[#dce4ee]">
          <div className="text-left font-serif">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">SỞ GIÁO DỤC VÀ ĐÀO TẠO ĐỒNG THÁP</p>
            <p className="text-xs font-bold uppercase text-[#2c5ea0] tracking-widest mt-1">TRƯỜNG MẦM NON AN HỮU</p>
            <p className="text-[9px] text-[#7b8a9e] mt-1 italic">Mã số cơ sở: mn-AH-2026</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#1e2a3a]">CỘNG HÀA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-[10px] font-bold text-[#2c5ea0] tracking-widest uppercase">Độc lập - Tự do - Hạnh phúc</p>
            <div className="w-[120px] h-[1px] bg-[#8c7e6b] inline-block mt-1" />
          </div>
        </div>

        {/* School Document Title */}
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-serif font-bold text-[#1e2a3a] tracking-wide uppercase">PHIẾU ĐÁNH GIÁ SỰ PHÁT TRIỂN CỦA TRẺ</h3>
          <p className="text-xs text-[#4a5568] font-serif uppercase tracking-[0.2em] font-medium">BÁO CÁO KẾT QUẢ ĐỒNG BỘ HỌC VỤ</p>
          <p className="text-[11px] text-gray-500 italic mt-1">
            Năm học: {data.academicYear} — {selectedSemester}
          </p>
        </div>

        {/* Student Biographical Grid */}
        <div className="bg-[#fcfaf4] border border-[#dce4ee] rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-[#1e2a3a]">
          <div className="flex gap-2">
            <span className="font-bold text-[#4a5568] w-24">Họ và Tên Bé:</span>
            <span className="font-serif font-bold text-sm text-[#2c5ea0]">{data.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-[#4a5568] w-24">Mã định danh:</span>
            <span className="font-mono font-bold">{data.id}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-[#4a5568] w-24">Lớp:</span>
            <span className="font-bold text-[#1e2a3a]">{data.grade}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-[#4a5568] w-24">Ngày sinh:</span>
            <span className="font-bold font-serif">{data.dob}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold text-[#4a5568] w-24">Giới tính:</span>
            <span className="font-bold">{data.gender}</span>
          </div>

          <div className="col-span-1 md:col-span-3 flex gap-2 border-t border-[#dce4ee]/60 pt-2 mt-1">
            <span className="font-bold text-[#4a5568] w-24">Cô Chủ nhiệm:</span>
            <span className="font-serif font-bold text-[#1e2a3a]">{data.gvcn}</span>
          </div>
        </div>

        {/* Course Performance Table */}
        <div className="overflow-hidden border border-[#8c7e6b] rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f5ebd6] text-[#1e2a3a] border-b border-[#8c7e6b] font-bold text-[10px] uppercase tracking-wider">
                <th className="p-3 border-r border-[#8c7e6b]/40 w-[220px]">Lĩnh vực phát triển của trẻ</th>
                <th className="p-3 border-r border-[#8c7e6b]/40 text-center w-[160px]">Đánh giá chất lượng</th>
                <th className="p-3">Nhận xét chi tiết của Cô giáo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#8c7e6b]/30">
              {data.scores.map((score, sIdx) => (
                <tr key={sIdx} className="hover:bg-gray-50/50 print-avoid-break">
                  <td className="p-2.5 font-bold text-[#1e2a3a] border-r border-[#8c7e6b]/30 bg-[#edf2f9]/40">{score.subject}</td>
                  <td className={`p-2.5 text-center font-bold border-r border-[#8c7e6b]/30 ${
                    score.average === 'Đạt' ? 'text-[#166534]' : 'text-[#2c5ea0]'
                  }`}>
                    {score.average === 'Đạt' || score.average === 'Chưa đạt' ? score.average : 'Đạt'}
                  </td>
                  <td className="p-2.5 text-[11px] text-[#4a5568] italic leading-snug">{score.teacherComment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Academic Standings Summary Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print-avoid-break">
          {/* Standing Values */}
          <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#fdfbf6] space-y-2.5">
            <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">I. Kết quả đánh giá chung</h4>
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="font-semibold text-gray-500">Danh hiệu thi đua:</span>
              <span className="font-serif font-bold text-[#166534]">{data.summary.moralConduct || 'Đạt Bé Ngoan'}</span>

              <span className="font-semibold text-gray-500">Chuyên cần (Nghỉ học):</span>
              <span className="font-semibold text-gray-700">
                {data.summary.daysAbsent} buổi (Có phép: {data.summary.daysAbsentExcused})
              </span>
            </div>
          </div>

          {/* Teacher Comment */}
          <div className="border border-[#c5bcae] rounded-xl p-4 bg-[#fdfbf6] flex flex-col justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider border-b border-[#dce4ee] pb-1.5 font-mono">II. Ý kiến nhận xét tổng hợp của Cô</h4>
              <p className="text-[11px] font-sans font-medium text-gray-700 italic leading-relaxed mt-2 pl-2.5 border-l-2 border-[#2c5ea0]">
                "{data.summary.generalComment || 'Bé ngoan ngoãn, hòa đồng cùng bạn bè trong lớp, tiếp thu bài tốt.'}"
              </p>
            </div>
          </div>
        </div>

        {/* Certificate Section / Signatures */}
        <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs print-avoid-break border-t border-[#dce4ee] border-dashed">
          <div>
            <p className="font-bold text-[#4a5568] uppercase tracking-wider text-[9px] mb-12">PHỤ HUYNH HỌC SINH</p>
            <p className="italic text-[10px] text-gray-400">(Ký và ghi rõ họ tên)</p>
          </div>
          <div>
            <p className="font-bold text-[#4a5568] uppercase tracking-wider text-[9px] mb-12">GIÁO VIÊN CHỦ NHIỆM</p>
            <p className="font-bold text-[#1e2a3a] underline">{data.gvcn}</p>
            <p className="text-[10px] text-green-700 font-bold italic mt-0.5">(Đã ký điện tử lưu trữ)</p>
          </div>
          <div>
            <p className="text-[10px] text-[#4a5568] font-bold italic mb-1.5">Cái Bè, ngày 11 tháng 06 năm 2026</p>
            <p className="font-bold text-[#2c5ea0] uppercase tracking-wider text-[9px] mb-12">HIỆU TRƯỞNG DUYỆT</p>
            <p className="font-bold text-gray-800">ThS. Nguyễn Văn Trí</p>
            <div className="text-[9px] text-[#2c5ea0] font-bold border border-[#2c5ea0]/30 px-2 py-1 inline-block mt-1 font-serif rotate-[-2deg] rounded">
              MẦM NON AN HỮU - QUYẾT ĐỊNH ĐÃ BAN HÀNH
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
