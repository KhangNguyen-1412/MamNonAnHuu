import React, { useState, useEffect } from 'react';
import { X, Clock, User, MapPin, School, Laptop, Check, Printer, Info, Calendar } from 'lucide-react';
import { TimetableSlot, ClassData, Room, Equipment, getEquipments } from '../../services/dbService';

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: TimetableSlot | null;
  classesList: ClassData[];
  roomsList: Room[];
}

export const LessonDetailModal: React.FC<LessonDetailModalProps> = ({
  isOpen,
  onClose,
  slot,
  classesList,
  roomsList
}) => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loadingEq, setLoadingEq] = useState(false);

  useEffect(() => {
    if (isOpen && slot && slot.room) {
      setLoadingEq(true);
      getEquipments()
        .then(eqs => {
          // Filter equipments by current slot room location
          const roomEqs = eqs.filter(e => e.location === slot.room);
          setEquipments(roomEqs);
        })
        .catch(err => {
          console.error("Failed to load equipments for room:", err);
        })
        .finally(() => {
          setLoadingEq(false);
        });
    } else {
      setEquipments([]);
    }
  }, [isOpen, slot]);

  if (!isOpen || !slot) return null;

  // Find class details
  const classDetails = classesList.find(c => c.name === slot.classId);
  // Find room details
  const roomDetails = roomsList.find(r => r.name === slot.room);

  // Period to Time mapping helper
  const getPeriodTime = (period: number) => {
    const times: Record<number, string> = {
      1: '07:00 - 07:45',
      2: '07:50 - 08:35',
      3: '08:50 - 09:35',
      4: '09:40 - 10:25',
      5: '13:30 - 14:15',
      6: '14:20 - 15:05',
      7: '15:20 - 16:05',
    };
    return times[period] || 'Chưa định giờ';
  };

  const getSessionName = (period: number) => {
    return period <= 4 ? 'Buổi Sáng' : 'Buổi Chiều';
  };

  const handlePrintCard = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const academicYearStr = typeof window !== 'undefined' && localStorage.getItem('active_academic_year_name')
      ? localStorage.getItem('active_academic_year_name')!
      : '2025 - 2026';

    const cardHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Thẻ Tiết Học - ${slot.subject}</title>
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
        <style>
          body {
            font-family: 'Lora', serif;
            background-color: #f5f8fc;
            color: #1e2a3a;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .ticket-card {
            width: 400px;
            border: 3px double #b8c6d9;
            background-color: #f0f4fa;
            padding: 25px;
            box-sizing: border-box;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            position: relative;
          }
          .ticket-card::before, .ticket-card::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            background-color: #f5f8fc;
            border-radius: 50%;
            top: 50%;
            transform: translateY(-50%);
            border: 1px solid #b8c6d9;
          }
          .ticket-card::before { left: -11px; border-right: none; }
          .ticket-card::after { right: -11px; border-left: none; }
          .header {
            text-align: center;
            border-bottom: 1px dashed #b8c6d9;
            padding-bottom: 15px;
            margin-bottom: 15px;
          }
          .school-name {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #7b8a9e;
          }
          .subject-title {
            font-family: 'Playfair Display', serif;
            font-size: 24px;
            font-weight: 700;
            color: #2c5ea0;
            margin: 5px 0;
            text-transform: uppercase;
          }
          .semester-tag {
            font-size: 9px;
            background: #e8eef6;
            padding: 3px 8px;
            border-radius: 12px;
            display: inline-block;
            font-weight: 700;
            border: 1px solid #dce4ee;
            color: #4a5568;
            text-transform: uppercase;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            font-size: 12px;
          }
          .info-label {
            font-weight: bold;
            color: #7b8a9e;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.5px;
          }
          .info-value {
            font-weight: 700;
            color: #1e2a3a;
            text-align: right;
          }
          .time-badge {
            background-color: #2c5ea0;
            color: #f5f8fc;
            text-align: center;
            font-weight: bold;
            padding: 8px;
            border-radius: 8px;
            font-size: 14px;
            margin-top: 15px;
            letter-spacing: 0.5px;
          }
          .footer {
            margin-top: 20px;
            text-align: center;
            font-size: 8px;
            color: #8e9eb4;
            border-top: 1px dashed #b8c6d9;
            padding-top: 10px;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="ticket-card">
          <div class="header">
            <div class="school-name">TRƯỜNG MẦM NON AN HỮU</div>
            <div class="subject-title">${slot.subject}</div>
            <div class="semester-tag">Học kỳ ${slot.semester ?? 1} • Năm học ${academicYearStr}</div>
          </div>
          
          <div class="info-row">
            <span class="info-label">Lớp học:</span>
            <span class="info-value">${slot.classId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Giáo viên:</span>
            <span class="info-value">${slot.teacher}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Địa điểm:</span>
            <span class="info-value">${slot.room || 'Lớp Học'} ${roomDetails ? `(${roomDetails.building})` : ''}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Thời gian:</span>
            <span class="info-value">Thứ ${slot.day + 1} • Tiết ${slot.period} (${getSessionName(slot.period)})</span>
          </div>
          
          <div class="time-badge">
            ${getPeriodTime(slot.period)}
          </div>
          
          <div class="footer">
            Trích xuất từ Hệ thống Quản lý Mầm non An Hữu lúc ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(cardHtml);
    printWindow.document.close();
  };

  // Determine card style based on subject
  const getSubjectColorStyle = (subject: string) => {
    if (subject.includes('Toán')) {
      return { bg: 'bg-[#e2ede5]', text: 'text-[#2e6b8a]', border: 'border-[#2e6b8a]' };
    }
    if (subject.includes('Sinh hoạt dưới cờ')) {
      return { bg: 'bg-[#fde8e8]', text: 'text-[#991b1b]', border: 'border-[#991b1b]' };
    }
    if (subject.includes('Giáo dục địa phương')) {
      return { bg: 'bg-[#fefcd0]', text: 'text-[#a16207]', border: 'border-[#a16207]' };
    }
    if (subject.includes('Hoạt động trải nghiệm')) {
      return { bg: 'bg-[#f3e8f4]', text: 'text-[#2c5ea0]', border: 'border-[#2c5ea0]' };
    }
    return { bg: 'bg-[#e8eef6]', text: 'text-[#4a5568]', border: 'border-[#7b8a9e]' };
  };

  const badgeStyle = getSubjectColorStyle(slot.subject);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="w-full max-w-2xl bg-[#f5f8fc] border-2 border-[#b8c6d9] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Banner */}
        <div className={`p-6 border-b border-[#b8c6d9] ${badgeStyle.bg} flex items-center justify-between relative`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl ${badgeStyle.bg} border-2 ${badgeStyle.border} flex items-center justify-center shadow-inner`}>
              <Calendar className={`w-6 h-6 ${badgeStyle.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b8a9e]">Tiết học chi tiết</span>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${badgeStyle.bg} border ${badgeStyle.border} ${badgeStyle.text}`}>
                  Học kỳ {slot.semester ?? 1}
                </span>
              </div>
              <h3 className={`text-2xl font-serif font-bold ${badgeStyle.text} mt-0.5 tracking-tight uppercase`}>
                {slot.subject}
              </h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-[#f5f8fc] hover:bg-[#e8eef6] text-[#7b8a9e] hover:text-[#1e2a3a] rounded-full transition-colors border border-[#b8c6d9] cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 main-scrollbar">
          {/* Main info cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* CARD 1: THỜI GIAN HỌC */}
            <div className="bg-[#f0f4fa] border border-[#dce4ee] p-4 rounded-2xl flex items-start space-x-3.5 shadow-sm">
              <div className="w-9 h-9 bg-[#e8eef6] rounded-xl flex items-center justify-center text-[#2c5ea0] shrink-0 border border-[#b8c6d9]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#7b8a9e] block mb-0.5">Khung giờ giảng dạy</span>
                <span className="text-sm font-bold text-[#1e2a3a] block font-serif">
                  Thứ {slot.day + 1} • Tiết {slot.period} ({getSessionName(slot.period)})
                </span>
                <span className="inline-flex items-center mt-1 px-3 py-1 bg-[#2c5ea0]/10 text-[#2c5ea0] text-[11px] font-bold tracking-wide rounded-lg font-mono">
                  {getPeriodTime(slot.period)}
                </span>
              </div>
            </div>

            {/* CARD 2: PHÒNG HỌC */}
            <div className="bg-[#f0f4fa] border border-[#dce4ee] p-4 rounded-2xl flex items-start space-x-3.5 shadow-sm">
              <div className="w-9 h-9 bg-[#e8eef6] rounded-xl flex items-center justify-center text-[#2e6b8a] shrink-0 border border-[#b8c6d9]">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#7b8a9e] block mb-0.5">Địa điểm lớp học</span>
                <span className="text-sm font-bold text-[#1e2a3a] block font-serif">
                  {slot.room || 'Lớp Học'}
                </span>
                <span className="text-xs text-[#4a5568] font-semibold block mt-0.5">
                  {roomDetails ? `${roomDetails.building} • Loại: ${roomDetails.type}` : 'Lớp học tiêu chuẩn'}
                </span>
              </div>
            </div>

            {/* CARD 3: GIÁO VIÊN */}
            <div className="bg-[#f0f4fa] border border-[#dce4ee] p-4 rounded-2xl flex items-start space-x-3.5 shadow-sm">
              <div className="w-9 h-9 bg-[#e8eef6] rounded-xl flex items-center justify-center text-[#1e2a3a] shrink-0 border border-[#b8c6d9]">
                <User className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#7b8a9e] block mb-0.5">Giáo viên phụ trách</span>
                <span className="text-sm font-bold text-[#1e2a3a] block font-serif">
                  {slot.teacher}
                </span>
                <span className="text-xs text-[#4a5568] font-semibold block mt-0.5">
                  Bộ môn {slot.subject.replace(/\s*\(CĐ\)\s*/i, '')} • Đạt chuẩn sư phạm
                </span>
              </div>
            </div>

            {/* CARD 4: LỚP HỌC */}
            <div className="bg-[#f0f4fa] border border-[#dce4ee] p-4 rounded-2xl flex items-start space-x-3.5 shadow-sm">
              <div className="w-9 h-9 bg-[#e8eef6] rounded-xl flex items-center justify-center text-[#8c672b] shrink-0 border border-[#b8c6d9]">
                <School className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#7b8a9e] block mb-0.5">Lớp học thụ hưởng</span>
                <span className="text-sm font-bold text-[#1e2a3a] block font-serif">
                  Lớp {slot.classId}
                </span>
                <span className="text-xs text-[#4a5568] font-semibold block mt-0.5">
                  Sức chứa: {classDetails?.currentCount ?? 40}/{classDetails?.capacity ?? 45} học sinh • CN: {classDetails?.teacher || 'Chưa phân công'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Equipment list in room (Custom Premium UI Feature) */}
          <div className="border border-[#b8c6d9] rounded-2xl bg-[#ffffff] p-5 shadow-sm">
            <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest mb-3 flex items-center">
              <Laptop className="w-4 h-4 mr-2 text-[#2c5ea0]" />
              Thiết bị & Vật tư tại phòng ({slot.room || 'Lớp học'})
            </h4>
            
            {loadingEq ? (
              <div className="py-4 text-center text-xs text-[#7b8a9e] font-bold animate-pulse">
                Đang đối soát thiết bị với phòng học...
              </div>
            ) : equipments.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {equipments.map(eq => (
                  <div key={eq.id} className="p-2.5 bg-[#f0f4fa] border border-[#dce4ee] rounded-xl flex items-center justify-between text-xs hover:border-[#2c5ea0] transition-colors">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-[#1e2a3a] truncate">{eq.name}</p>
                      <p className="text-[9px] text-[#7b8a9e] font-mono mt-0.5">{eq.id}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${
                      eq.status === 'Tốt' ? 'bg-[#2e6b8a]/10 text-[#2e6b8a]' : 
                      eq.status === 'Mới Nhập' ? 'bg-blue-50 text-blue-700' : 'bg-[#2c5ea0]/10 text-[#2c5ea0]'
                    }`}>
                      {eq.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 px-4 bg-[#f0f4fa] border border-dashed border-[#b8c6d9] rounded-xl text-center text-xs text-[#7b8a9e] font-medium flex items-center justify-center gap-2">
                <Info className="w-4 h-4 text-[#7b8a9e]" />
                Không ghi nhận thiết bị đặc thù lưu trữ tại phòng học này.
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#b8c6d9] bg-[#e8eef6] flex justify-between items-center shrink-0">
          <button 
            onClick={handlePrintCard}
            className="flex items-center px-4 py-2 bg-[#ffffff] hover:bg-[#f0f4fa] border border-[#b8c6d9] text-xs uppercase tracking-wider font-bold text-[#4a5568] rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Printer className="w-4 h-4 mr-2" />
            In Thẻ Tiết Học
          </button>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold rounded-xl transition-colors shadow-md cursor-pointer"
          >
            Đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
