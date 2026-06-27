import React, { useState } from 'react';
import { BaseSelect, BaseDatePicker } from './BaseInputs';
import { Camera, ChevronRight, ChevronLeft, Upload, Save, Award, AlertTriangle, ThumbsUp, Calendar, User, ClipboardList, Info, HelpCircle, Printer, BookOpen, MapPin, CreditCard, Shield, Clock, Heart } from 'lucide-react';
import { ModalBase } from './Modals';
import { YouthUnionEmulation } from '../../services/dbService';
import { getStudents } from '../../services/studentService';
import { printElement } from '../../utils/printHelper';

export const EmulationGradingModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  classes = [], 
  defaultWeek = 12 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave?: (data: any) => void; 
  classes?: string[]; 
  defaultWeek?: number 
}) => {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState(new Date().toLocaleDateString('vi-VN'));
  const [week, setWeek] = useState(defaultWeek);
  const [session, setSession] = useState('Sáng');
  const [className, setClassName] = useState('1A1');
  const [baseScore, setBaseScore] = useState(100);
  const [grader, setGrader] = useState('Tổng phụ trách');
  const [notes, setNotes] = useState('');

  // Sync state when modal opens or props change
  React.useEffect(() => {
    if (isOpen) {
      setWeek(defaultWeek);
      setGrader('Tổng phụ trách');
      if (classes && classes.length > 0) {
        setClassName(classes[0]);
      }
    }
  }, [isOpen, defaultWeek, classes]);

  // Counters for violations
  const [lateCount, setLateCount] = useState(0); // Đi học muộn, không khăn quàng, quên bảng tên (-2 / -20)
  const [uniformCount, setUniformCount] = useState(0); // Đồng phục sai, nội quy truy bài (-5 / -50)
  const [noiseCount, setNoiseCount] = useState(0); // Vệ sinh kém, làm ồn tự quản (-10 / -100)

  // Counters for rewards
  const [saluteReward, setSaluteReward] = useState(0); // Tuyên dương chào cờ (+10 / +100)
  const [contestReward, setContestReward] = useState(0); // Giải văn nghệ, thể thao (+20 / +200)
  const [goodDeedReward, setGoodDeedReward] = useState(0); // Xung kích, hành động đẹp (+5 / +50)

  // Math helper
  const k = baseScore === 1000 ? 10 : 1;
  const totalDeductions = (lateCount * 2 + uniformCount * 5 + noiseCount * 10) * k;
  const totalAdditions = (saluteReward * 10 + contestReward * 20 + goodDeedReward * 5) * k;
  const finalScore = Math.max(0, baseScore - totalDeductions + totalAdditions);

  // Classification
  const ratio = (finalScore / baseScore) * 100;
  let rank: 'A' | 'B' | 'C' = 'C';
  let rankLabel = 'Trung bình';
  let rankBg = 'bg-red-50 text-red-700 border-red-200';
  if (ratio >= 95) {
    rank = 'A';
    rankLabel = 'Xuất sắc';
    rankBg = 'bg-green-50 text-green-700 border-green-200';
  } else if (ratio >= 80) {
    rank = 'B';
    rankLabel = 'Khá';
    rankBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
  }

  const handleSave = () => {
    if (onSave) {
      onSave({
        id: `YUE-${Date.now().toString().slice(-4)}`,
        name: className,
        diem: finalScore,
        status: rankLabel,
        week,
        baseScore,
        violations: [
          { type: 'Đi học muộn, không đeo khăn quàng, quên bảng tên', count: lateCount, points: lateCount * 2 * k },
          { type: 'Đồng phục sai quy định, vi phạm nội quy truy bài', count: uniformCount, points: uniformCount * 5 * k },
          { type: 'Vệ sinh lớp học kém, làm ồn trong giờ tự quản', count: noiseCount, points: noiseCount * 10 * k }
        ].filter(v => v.count > 0),
        rewards: [
          { type: 'Tuyên dương trong tiết chào cờ', count: saluteReward, points: saluteReward * 10 * k },
          { type: 'Đạt giải văn nghệ, thể thao', count: contestReward, points: contestReward * 20 * k },
          { type: 'Xung kích, giúp đỡ bạn, hành động đẹp', count: goodDeedReward, points: goodDeedReward * 5 * k }
        ].filter(r => r.count > 0),
        grader,
        date,
        rank
      });
    }
    
    // Reset state
    setStep(1);
    setLateCount(0);
    setUniformCount(0);
    setNoiseCount(0);
    setSaluteReward(0);
    setContestReward(0);
    setGoodDeedReward(0);
    setNotes('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Tính Điểm Thi Đua Lớp" subtitle="Nhập biên bản trực cờ đỏ & tính điểm tự động" width="max-w-4xl" fixedHeight>
      {/* Progress steps bar */}
      <div className="bg-[#e8eef6] px-8 py-4 border-b border-[#b8c6d9] flex items-center justify-between overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${step >= 1 ? 'bg-[#2c5ea0] text-white shadow-inner scale-110' : 'bg-[#dce4ee] text-[#7b8a9e]'}`}>
            1
          </div>
          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">Thông tin chung</span>
        </div>
        <div className="w-16 h-0.5 bg-[#b8c6d9]"></div>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${step >= 2 ? 'bg-[#2c5ea0] text-white shadow-inner scale-110' : 'bg-[#dce4ee] text-[#7b8a9e]'}`}>
            2
          </div>
          <span className="text-[10px] font-bold text-[#4a5568] uppercase tracking-wider">Biên bản lỗi & Điểm thưởng</span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-[#f5f8fc]">
        {step === 1 && (
          <div className="space-y-6">
            <h4 className="text-xs font-bold text-[#1e2a3a] uppercase tracking-widest border-b border-[#b8c6d9] pb-2 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-[#2c5ea0]" />
              Thiết lập thông tin tuần trực
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <BaseDatePicker label="Ngày chấm điểm" value={date} onChange={setDate} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tuần thứ *</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="37"
                    value={week} 
                    disabled
                    className="w-full px-4 py-3 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#7b8a9e] cursor-not-allowed select-none" 
                  />
                </div>
                <div>
                  <BaseSelect
                    label="Ca Trực"
                    value={session}
                    options={[{value: 'Sáng', label: 'Sáng'}, {value: 'Chiều', label: 'Chiều'}]}
                    onChange={setSession}
                  />
                </div>
              </div>

              <div>
                <BaseSelect
                  label="Lớp đánh giá *"
                  value={className}
                  options={classes && classes.length > 0 ? classes.map(c => ({ value: c, label: c })) : [
                    {value: '1A1', label: '1A1'},
                    {value: '1A2', label: '1A2'},
                    {value: '10A3', label: '10A3'},
                    {value: '10A4', label: '10A4'},
                    {value: '2A1', label: '2A1'},
                    {value: '11A2', label: '11A2'},
                    {value: '11B1', label: '11B1'},
                    {value: '11B3', label: '11B3'},
                    {value: '5A1', label: '5A1'},
                    {value: '12A2', label: '12A2'},
                    {value: '12A4', label: '12A4'}
                  ]}
                  onChange={setClassName}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Thang điểm gốc *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setBaseScore(100)}
                    className={`py-3 px-4 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${baseScore === 100 ? 'bg-[#2c5ea0] text-white border-[#2c5ea0] shadow-md' : 'bg-[#ffffff] text-[#4a5568] border-[#b8c6d9] hover:bg-[#f0f4fa]'}`}
                  >
                    100 Điểm (Cá nhân/Chuẩn)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaseScore(1000)}
                    className={`py-3 px-4 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${baseScore === 1000 ? 'bg-[#2c5ea0] text-white border-[#2c5ea0] shadow-md' : 'bg-[#ffffff] text-[#4a5568] border-[#b8c6d9] hover:bg-[#f0f4fa]'}`}
                  >
                    1000 Điểm (Tập thể Lớp)
                  </button>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Người ghi nhận / Cờ đỏ phụ trách</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-[#7b8a9e]"><User className="w-4 h-4" /></span>
                  <input 
                    type="text" 
                    value={grader} 
                    disabled
                    className="w-full pl-11 pr-4 py-3 bg-[#e8eef6] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#7b8a9e] cursor-not-allowed select-none" 
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-[#e8eef6]/50 border border-[#d4dde9] p-4 rounded-2xl flex items-start gap-3 mt-4 text-[#4a5568] text-xs">
              <Info className="w-4 h-4 text-[#2c5ea0] shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Nguyên tắc chấm điểm:</strong> Điểm xếp hạng cuối tuần được tính theo công thức: 
                <span className="block font-bold text-[#2c5ea0] mt-1">Tổng điểm = Điểm gốc - Điểm vi phạm + Điểm thưởng thành tích.</span>
                Kết quả xếp loại: <strong>Loại A (Xuất sắc)</strong> từ 95% điểm gốc trở lên, <strong>Loại B (Khá)</strong> từ 80% đến dưới 95%, còn lại là <strong>Loại C (Trung bình)</strong>.
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Violations */}
              <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#b8c6d9] shadow-sm space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2c5ea0] pb-2 border-b border-[#dce4ee] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Các lỗi vi phạm (Bị trừ)
                </h4>
                
                <div className="space-y-4">
                  {/* Late Violation */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f0f4fa]">
                    <div>
                      <div className="text-xs font-bold text-[#1e2a3a]">Đi muộn, không khăn quàng, quên bảng tên</div>
                      <div className="text-[10px] text-[#7b8a9e] font-semibold mt-0.5">Trừ: -{2 * k} điểm / lần vi phạm</div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#f0f4fa] border border-[#b8c6d9]/70 rounded-full px-2.5 py-1">
                      <button 
                        type="button" 
                        onClick={() => setLateCount(prev => Math.max(0, prev - 1))}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-[#1e2a3a]">{lateCount}</span>
                      <button 
                        type="button" 
                        onClick={() => setLateCount(prev => prev + 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Uniform Violation */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f0f4fa]">
                    <div>
                      <div className="text-xs font-bold text-[#1e2a3a]">Sai đồng phục, vi phạm nội quy truy bài</div>
                      <div className="text-[10px] text-[#7b8a9e] font-semibold mt-0.5">Trừ: -{5 * k} điểm / lần vi phạm</div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#f0f4fa] border border-[#b8c6d9]/70 rounded-full px-2.5 py-1">
                      <button 
                        type="button" 
                        onClick={() => setUniformCount(prev => Math.max(0, prev - 1))}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-[#1e2a3a]">{uniformCount}</span>
                      <button 
                        type="button" 
                        onClick={() => setUniformCount(prev => prev + 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Noise/Cleanliness Violation */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f0f4fa]">
                    <div>
                      <div className="text-xs font-bold text-[#1e2a3a]">Vệ sinh lớp kém, làm ồn giờ tự quản</div>
                      <div className="text-[10px] text-[#7b8a9e] font-semibold mt-0.5">Trừ: -{10 * k} điểm / lần vi phạm</div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#f0f4fa] border border-[#b8c6d9]/70 rounded-full px-2.5 py-1">
                      <button 
                        type="button" 
                        onClick={() => setNoiseCount(prev => Math.max(0, prev - 1))}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-[#1e2a3a]">{noiseCount}</span>
                      <button 
                        type="button" 
                        onClick={() => setNoiseCount(prev => prev + 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Rewards */}
              <div className="bg-[#ffffff] p-5 rounded-2xl border border-[#b8c6d9] shadow-sm space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#2e6b8a] pb-2 border-b border-[#dce4ee] flex items-center gap-1.5">
                  <ThumbsUp className="w-4 h-4" />
                  Điểm thưởng thành tích (Cộng)
                </h4>
                
                <div className="space-y-4">
                  {/* Flag Ceremony Salut */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f0f4fa]">
                    <div>
                      <div className="text-xs font-bold text-[#1e2a3a]">Tuyên dương trong tiết chào cờ</div>
                      <div className="text-[10px] text-[#7b8a9e] font-semibold mt-0.5">Cộng: +{10 * k} điểm / lần</div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#f0f4fa] border border-[#b8c6d9]/70 rounded-full px-2.5 py-1">
                      <button 
                        type="button" 
                        onClick={() => setSaluteReward(prev => Math.max(0, prev - 1))}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-[#1e2a3a]">{saluteReward}</span>
                      <button 
                        type="button" 
                        onClick={() => setSaluteReward(prev => prev + 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Contest Achievement */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f0f4fa]">
                    <div>
                      <div className="text-xs font-bold text-[#1e2a3a]">Đạt giải phong trào văn nghệ, thể thao</div>
                      <div className="text-[10px] text-[#7b8a9e] font-semibold mt-0.5">Cộng: +{20 * k} điểm / lần</div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#f0f4fa] border border-[#b8c6d9]/70 rounded-full px-2.5 py-1">
                      <button 
                        type="button" 
                        onClick={() => setContestReward(prev => Math.max(0, prev - 1))}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-[#1e2a3a]">{contestReward}</span>
                      <button 
                        type="button" 
                        onClick={() => setContestReward(prev => prev + 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Good Deed */}
                  <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-[#f0f4fa]">
                    <div>
                      <div className="text-xs font-bold text-[#1e2a3a]">Xung kích, giúp đỡ bạn, hành động đẹp</div>
                      <div className="text-[10px] text-[#7b8a9e] font-semibold mt-0.5">Cộng: +{5 * k} điểm / lần</div>
                    </div>
                    <div className="flex items-center gap-2.5 bg-[#f0f4fa] border border-[#b8c6d9]/70 rounded-full px-2.5 py-1">
                      <button 
                        type="button" 
                        onClick={() => setGoodDeedReward(prev => Math.max(0, prev - 1))}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        -
                      </button>
                      <span className="font-bold text-xs w-5 text-center text-[#1e2a3a]">{goodDeedReward}</span>
                      <button 
                        type="button" 
                        onClick={() => setGoodDeedReward(prev => prev + 1)}
                        className="w-6 h-6 rounded-full bg-white border border-[#b8c6d9] hover:bg-[#e8eef6] text-xs font-bold flex items-center justify-center transition-colors cursor-pointer select-none"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Scoring Summary Board */}
            <div className="bg-[#fffdf9] border border-[#b8c6d9] outline outline-1 outline-offset-2 outline-[#b8c6d9] rounded-2xl p-6 shadow-sm">
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#4a5568] mb-4 text-center border-b border-[#dce4ee] pb-2">
                Bảng tổng hợp điểm thực tế (Lớp {className} - Tuần {week})
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-[#f0f4fa] border border-[#d4dde9] rounded-xl">
                  <div className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-wider">Điểm Gốc</div>
                  <div className="text-xl font-bold font-serif text-[#1e2a3a] mt-1">{baseScore}</div>
                </div>
                <div className="p-3 bg-[#fdf2f2] border border-red-100 rounded-xl">
                  <div className="text-[9px] font-bold text-red-400 uppercase tracking-wider">Tổng Bị Trừ</div>
                  <div className="text-xl font-bold font-serif text-red-600 mt-1">-{totalDeductions}</div>
                </div>
                <div className="p-3 bg-[#f0fdf4] border border-green-100 rounded-xl">
                  <div className="text-[9px] font-bold text-green-500 uppercase tracking-wider">Tổng Được Cộng</div>
                  <div className="text-xl font-bold font-serif text-green-700 mt-1">+{totalAdditions}</div>
                </div>
                <div className={`p-3 border rounded-xl ${rankBg} flex flex-col justify-center`}>
                  <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Điểm Cuối Tuần / Xếp loại</div>
                  <div className="text-xl font-bold font-serif mt-1">{finalScore} ({rankLabel})</div>
                </div>
              </div>
            </div>

            {/* Evidence & Additional Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Ảnh minh chứng sự vụ (Bắt buộc nếu bị trừ hơn {15 * k}đ)</label>
                <div className="flex items-center justify-center p-5 border-2 border-[#b8c6d9] border-dashed rounded-xl bg-white hover:bg-[#f0f4fa] cursor-pointer transition">
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-[#7b8a9e] mx-auto mb-1" />
                    <span className="text-[10px] font-bold text-[#2c5ea0] uppercase tracking-wider block">Chụp ảnh / Tải tệp lên</span>
                    <span className="text-[8px] text-[#7b8a9e] uppercase tracking-widest font-semibold block mt-0.5">PNG, JPG dưới 5MB</span>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Ghi chú & Biên bản chi tiết</label>
                <textarea 
                  value={notes} 
                  onChange={e => setNotes(e.target.value)} 
                  className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a] focus:outline-none focus:border-[#2c5ea0] min-h-[78px]"
                  placeholder="Ghi nhận cụ thể tên học sinh hoặc sự việc chi tiết..."
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-between items-center mt-auto shrink-0 select-none">
        {step > 1 ? (
          <button 
            onClick={() => setStep(step - 1)} 
            className="flex items-center px-5 py-2 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] bg-white hover:bg-[#e8eef6] uppercase tracking-widest transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Quay Lại
          </button>
        ) : <div />}
        
        {step < 2 ? (
          <button 
            onClick={() => setStep(step + 1)} 
            className="flex items-center px-5 py-2 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all cursor-pointer"
          >
            Tiếp Theo <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        ) : (
          <button 
            onClick={handleSave} 
            className="flex items-center px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white uppercase tracking-widest hover:bg-[#5c2a2a] shadow-[2px_2px_0px_#b8c6d9] active:shadow-none active:translate-y-0.5 transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" /> Lưu & Xếp Hạng Thi Đua
          </button>
        )}
      </div>
    </ModalBase>
  );
};

export const EmulationDetailModal = ({ isOpen, onClose, emulation }: { isOpen: boolean; onClose: () => void; emulation: YouthUnionEmulation | null }) => {
  if (!emulation) return null;

  const week = emulation.week || 12;
  const baseScore = emulation.baseScore || 100;
  const grader = emulation.grader || 'Nguyễn Văn A (Đội Cờ Đỏ)';
  const date = emulation.date || '15/06/2026';
  const notes = emulation.grader ? 'Thông tin biên bản thi đua lớp học tự động đồng bộ.' : 'Bản ghi cũ chưa được phân loại chi tiết lỗi.';

  // Standard multiplier
  const k = baseScore === 1000 ? 10 : 1;

  // Compute values from parsed fields or fallback for legacy emulations
  const violations = emulation.violations || [
    { type: 'Tổng lỗi vi phạm đã quy đổi', count: emulation.diem < baseScore ? 1 : 0, points: Math.max(0, baseScore - emulation.diem) }
  ].filter(v => v.points > 0);

  const rewards = emulation.rewards || [
    { type: 'Tổng thành tích cộng thưởng đã quy đổi', count: emulation.diem > baseScore ? 1 : 0, points: Math.max(0, emulation.diem - baseScore) }
  ].filter(r => r.points > 0);

  const totalDeducted = violations.reduce((sum, v) => sum + v.points, 0);
  const totalAdded = rewards.reduce((sum, r) => sum + r.points, 0);

  // Classification styling
  const ratio = (emulation.diem / baseScore) * 100;
  let rankLabel = emulation.status || 'Khá';
  let rankBg = 'bg-yellow-50 text-yellow-700 border-yellow-200';
  if (ratio >= 95) {
    rankLabel = 'Xuất sắc';
    rankBg = 'bg-green-50 text-green-700 border-green-200';
  } else if (ratio < 80) {
    rankLabel = 'Trung bình';
    rankBg = 'bg-red-50 text-red-700 border-red-200';
  }

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Chi Tiết Điểm Thi Đua Lớp" subtitle={`Xem chi tiết biên bản lỗi & thành tích của lớp ${emulation.name}`} width="max-w-3xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-[#f5f8fc]">
        {/* Certificate / Record Sheet Style Container */}
        <div className="border-[4px] border-double border-[#b8c6d9] p-6 bg-[#fffdf9] rounded-2xl shadow-sm relative">
          {/* Header watermark */}
          <div className="absolute top-4 right-6 text-[10px] font-bold text-[#b8c6d9] tracking-widest uppercase opacity-40 select-none">MẦM NON AN HỮU</div>

          <div className="text-center pb-4 border-b border-[#dce4ee] mb-6">
            <h3 className="text-xl font-serif font-bold text-[#2c5ea0] uppercase">Biên Bản Thi Đua Nề Nếp</h3>
            <p className="text-[10px] font-bold text-[#7b8a9e] tracking-[0.2em] uppercase mt-1">Lớp: {emulation.name} — Tuần: {week}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs font-sans text-[#4a5568] mb-6 bg-[#f0f4fa] p-3 border border-[#d4dde9] rounded-xl">
            <div>
              <span className="font-bold text-[#1e2a3a]">Thành viên trực ban:</span> {grader}
            </div>
            <div>
              <span className="font-bold text-[#1e2a3a]">Ngày lập biên bản:</span> {date}
            </div>
            <div>
              <span className="font-bold text-[#1e2a3a]">Thang điểm gốc:</span> {baseScore} Điểm
            </div>
            <div>
              <span className="font-bold text-[#1e2a3a]">Kỳ xếp hạng:</span> Học kỳ {week <= 18 ? 'I' : 'II'}
            </div>
          </div>

          {/* Detailed Lists */}
          <div className="space-y-6">
            {/* Violations section */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#2c5ea0] mb-3 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Các lỗi vi phạm (Điểm trừ)
              </h4>
              {violations.length > 0 ? (
                <div className="border border-[#dce4ee] rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f0f4fa] border-b border-[#dce4ee] text-[9px] font-bold uppercase tracking-wider text-[#7b8a9e]">
                        <th className="py-2 px-3">Nội dung lỗi vi phạm</th>
                        <th className="py-2 px-3 text-center w-20">Số lần</th>
                        <th className="py-2 px-3 text-right w-24">Điểm trừ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {violations.map((v, i) => (
                        <tr key={i} className="border-b border-dashed border-[#dce4ee] last:border-0 hover:bg-[#f0f4fa]/50">
                          <td className="py-2.5 px-3 font-semibold text-[#1e2a3a]">{v.type}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#4a5568]">{v.count || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-red-600">-{v.points} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs italic text-[#8e9eb4] p-3 text-center bg-[#f0f4fa] border border-dashed border-[#dce4ee] rounded-xl">
                  Không ghi nhận lỗi vi phạm nào trong tuần.
                </div>
              )}
            </div>

            {/* Rewards section */}
            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#2e6b8a] mb-3 flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" />
                Thành tích & Tuyên dương (Điểm thưởng)
              </h4>
              {rewards.length > 0 ? (
                <div className="border border-[#dce4ee] rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f0f4fa] border-b border-[#dce4ee] text-[9px] font-bold uppercase tracking-wider text-[#7b8a9e]">
                        <th className="py-2 px-3">Thành tích / Khen thưởng</th>
                        <th className="py-2 px-3 text-center w-20">Số lần</th>
                        <th className="py-2 px-3 text-right w-24">Điểm cộng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rewards.map((r, i) => (
                        <tr key={i} className="border-b border-dashed border-[#dce4ee] last:border-0 hover:bg-[#f0f4fa]/50">
                          <td className="py-2.5 px-3 font-semibold text-[#1e2a3a]">{r.type}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-[#4a5568]">{r.count || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-green-600">+{r.points} đ</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs italic text-[#8e9eb4] p-3 text-center bg-[#f0f4fa] border border-dashed border-[#dce4ee] rounded-xl">
                  Không có thành tích cộng thưởng nào trong tuần này.
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {notes && (
            <div className="mt-5 pt-4 border-t border-dashed border-[#dce4ee]">
              <span className="block text-[9px] font-bold uppercase tracking-wider text-[#7b8a9e] mb-1">Ghi chú chi tiết từ đội sao đỏ</span>
              <p className="text-xs text-[#4a5568] italic leading-relaxed bg-[#f0f4fa] p-2.5 rounded-lg border border-[#d4dde9]">{notes}</p>
            </div>
          )}
          
          {/* Final Score Report Summary Box */}
          <div className="mt-6 pt-5 border-t-2 border-double border-[#b8c6d9] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b8a9e]">Xếp loại tuần:</span>
              <span className={`px-4 py-1.5 border rounded-full text-xs font-bold uppercase tracking-widest shadow-sm ${rankBg}`}>
                Hạng {rankLabel}
              </span>
            </div>
            
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#7b8a9e] block">Điểm thi đua tổng kết</span>
              <div className="text-3xl font-bold font-serif text-[#2c5ea0] mt-1">
                {emulation.diem} <span className="text-sm font-sans font-normal text-[#4a5568]">/ {baseScore} đ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-6 py-4 flex justify-end gap-3 shrink-0">
        <button 
          onClick={onClose} 
          className="px-6 py-2 rounded-full text-xs font-bold bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
        >
          Đóng phiếu
        </button>
      </div>
    </ModalBase>
  );
};

export const UnionMemberModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  member = null 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSave?: (data: any) => void;
  member?: any | null;
}) => {
  const [name, setName] = useState('');
  const [className, setClassName] = useState('1A1');
  const [dob, setDob] = useState('15/05/2007');
  const [role, setRole] = useState('Đoàn viên');
  const [joinDate, setJoinDate] = useState('26/03/2024');
  const [cardNumber, setCardNumber] = useState('');
  const [joinPlace, setJoinPlace] = useState('Mầm non An Hữu');
  const [status, setStatus] = useState('Đang giữ tại trường');

  const isSystemStudent = !!(member && member.id && member.id.startsWith('HS-MEMBER-'));

  React.useEffect(() => {
    if (isOpen) {
      if (member) {
        setName(member.name || '');
        setClassName(member.class || '');
        setDob(member.dob || '');
        setRole(member.role || 'Đoàn viên');
        setJoinDate(member.date && member.date !== '—' ? member.date : '26/03/2024');
        setStatus(member.status || 'Đang giữ tại trường');
        setCardNumber('');
        setJoinPlace('Mầm non An Hữu');
      } else {
        setName('');
        setClassName('1A1');
        setDob('15/05/2007');
        setRole('Đoàn viên');
        setJoinDate('26/03/2024');
        setCardNumber('');
        setJoinPlace('Mầm non An Hữu');
        setStatus('Đang giữ tại trường');
      }
    }
  }, [isOpen, member]);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên đoàn viên");
      return;
    }
    if (onSave) {
      onSave({
        id: member ? member.id : `YUM-${Date.now().toString().slice(-4)}`,
        name,
        class: className,
        dob,
        date: joinDate,
        role,
        status
      });
    }
    // Reset state
    setName('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title={member ? "Cập Nhật Đoàn Tịch" : "Hồ Sơ Đoàn Viên"} subtitle="Thông tin kết nạp & Sinh hoạt" width="max-w-4xl" fixedHeight>
       <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
          <div className="grid grid-cols-2 gap-8">
             <div className="space-y-6">
                <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Thông tin Cá nhân</h4>
                <div className="grid grid-cols-1 gap-4">
                   <div>
                     <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Họ và Tên đoàn viên *</label>
                     <input 
                       type="text" 
                       value={name} 
                       onChange={e => setName(e.target.value)} 
                       disabled={isSystemStudent} 
                       className={`w-full px-4 py-3 border rounded-xl text-sm font-bold ${isSystemStudent ? 'bg-[#e8eef6] text-[#7b8a9e] cursor-not-allowed select-none border-[#b8c6d9]' : 'bg-white text-[#1e2a3a] border-[#b8c6d9]'}`} 
                       placeholder="VD: Nguyễn Văn A" 
                     />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lớp *</label>
                       <input 
                         type="text" 
                         value={className} 
                         onChange={e => setClassName(e.target.value)} 
                         disabled={isSystemStudent} 
                         className={`w-full px-4 py-3 border rounded-xl text-sm font-bold ${isSystemStudent ? 'bg-[#e8eef6] text-[#7b8a9e] cursor-not-allowed select-none border-[#b8c6d9]' : 'bg-white text-[#1e2a3a] border-[#b8c6d9]'}`} 
                         placeholder="VD: 12A1" 
                       />
                     </div>
                     <div>
                       <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Ngày sinh *</label>
                       <input 
                         type="text" 
                         value={dob} 
                         onChange={e => setDob(e.target.value)} 
                         disabled={isSystemStudent} 
                         className={`w-full px-4 py-3 border rounded-xl text-sm font-bold ${isSystemStudent ? 'bg-[#e8eef6] text-[#7b8a9e] cursor-not-allowed select-none border-[#b8c6d9]' : 'bg-white text-[#1e2a3a] border-[#b8c6d9]'}`} 
                         placeholder="VD: 15/05/2006" 
                       />
                     </div>
                   </div>
                </div>
                <div>
                   <BaseSelect
                     label="Chức vụ Đoàn"
                     value={role}
                     options={[
                       {value: 'Đoàn viên', label: 'Đoàn viên'},
                       {value: 'Bí thư Chi đoàn', label: 'Bí thư Chi đoàn'},
                       {value: 'Phó Bí thư Chi đoàn', label: 'Phó Bí thư Chi đoàn'},
                       {value: 'Ủy viên Ban chấp hành', label: 'Ủy viên Ban chấp hành'}
                     ]}
                     onChange={setRole}
                   />
                </div>
             </div>
             
             <div className="space-y-6">
                <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest mb-4 border-b border-[#b8c6d9] pb-2">Hồ Sơ Đoàn</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <BaseDatePicker label="Ngày kết nạp" value={joinDate} onChange={setJoinDate} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Số thẻ</label>
                    <input type="text" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="VD: 12345678" />
                  </div>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Nơi kết nạp</label>
                   <input type="text" value={joinPlace} onChange={e => setJoinPlace(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" />
                </div>
                <div>
                   <BaseSelect
                     label="Trạng thái Sổ Đoàn"
                     value={status}
                     options={[
                       {value: 'Đang giữ tại trường', label: 'Đang giữ tại trường'},
                       {value: 'Nộp cho trường', label: 'Nộp cho trường'},
                       {value: 'Chưa nộp sổ', label: 'Chưa nộp sổ'},
                       {value: 'Đã rút', label: 'Đã rút'}
                     ]}
                     onChange={setStatus}
                   />
                </div>
             </div>
          </div>
       </div>
       <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-4 mt-auto">
         <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
         <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Lưu Hồ Sơ</button>
       </div>
    </ModalBase>
  );
};

export const CampaignModal = ({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave?: (data: any) => void }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Thiện nguyện');
  const [scale, setScale] = useState('Cấp Trường');
  const [status, setStatus] = useState('Lên kế hoạch');
  const [startDate, setStartDate] = useState('01/06/2026');
  const [endDate, setEndDate] = useState('15/06/2026');
  const [hours, setHours] = useState(10);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên sự kiện");
      return;
    }
    if (onSave) {
      onSave({
        id: `YUC-${Date.now().toString().slice(-4)}`,
        name,
        type,
        time: `${startDate} - ${endDate}`,
        status,
        scale,
        hours: Number(hours)
      });
    }
    // Reset state
    setName('');
    onClose();
  };

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Sự Kiện & Phong Trào" subtitle="Chi tiết chiến dịch và hoạt động" width="max-w-4xl" fixedHeight>
       <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-8 bg-[#f5f8fc]">
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Tên sự kiện / Chiến dịch *</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a] focus:ring-2 focus:ring-[#2c5ea0]" placeholder="VD: Chiến dịch Hoa Phượng Đỏ" />
              </div>
              <div>
                <BaseSelect
                  label="Phân loại"
                  value={type}
                  options={[
                    {value: 'Thiện nguyện', label: 'Thiện nguyện'},
                    {value: 'Văn nghệ - Thể thao', label: 'Văn nghệ - Thể thao'},
                    {value: 'Giáo dục truyền thống', label: 'Giáo dục truyền thống'},
                    {value: 'Hoạt động ngoại khóa', label: 'Hoạt động ngoại khóa'}
                  ]}
                  onChange={setType}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <BaseSelect
                      label="Quy mô"
                      value={scale}
                      options={[
                        {value: 'Cấp Trường', label: 'Cấp Trường'},
                        {value: 'Cấp Cụm', label: 'Cấp Cụm'},
                        {value: 'Cấp Tỉnh/Thành phố', label: 'Cấp Tỉnh/Thành phố'}
                      ]}
                      onChange={setScale}
                    />
                 </div>
                 <div>
                    <BaseSelect
                      label="Trạng thái"
                      value={status}
                      options={[
                        {value: 'Lên kế hoạch', label: 'Lên kế hoạch'},
                        {value: 'Đang mở đăng ký', label: 'Đang mở đăng ký'},
                        {value: 'Đang diễn ra', label: 'Đang diễn ra'},
                        {value: 'Đã kết thúc', label: 'Đã kết thúc'}
                      ]}
                      onChange={setStatus}
                    />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <BaseDatePicker label="Từ ngày" value={startDate} onChange={setStartDate} />
                  </div>
                  <div>
                    <BaseDatePicker label="Đến ngày" value={endDate} onChange={setEndDate} />
                 </div>
              </div>
            </div>

            <div>
               <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-2">Lợi ích & Giờ tình nguyện viên</label>
               <input type="number" value={hours} onChange={e => setHours(Number(e.target.value))} className="w-full px-4 py-3 bg-[#ffffff] border border-[#b8c6d9] rounded-xl text-sm font-bold text-[#1e2a3a]" placeholder="Số giờ tình nguyện tính cho học sinh mang lại. VD: 20" />
            </div>
         </div>
       </div>
       <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-4 mt-auto">
         <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors">Đóng</button>
         <button onClick={handleSave} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#1e2a3a] text-white uppercase tracking-widest hover:bg-[#131a25] shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5 transition-all">Lưu Chiến Dịch</button>
       </div>
    </ModalBase>
  );
};

export const UnionMemberDetailModal = ({
  isOpen,
  onClose,
  member
}: {
  isOpen: boolean;
  onClose: () => void;
  member: any | null;
}) => {
  const [studentDetails, setStudentDetails] = useState<any | null>(null);
  const printRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen && member) {
      const fetchStudent = async () => {
        try {
          const list = await getStudents();
          const match = list.find(s => 
            s.name.trim().toLowerCase() === member.name.trim().toLowerCase() && 
            (s.grade || '').trim().toLowerCase() === member.class.trim().toLowerCase()
          );
          if (match) {
            setStudentDetails(match);
          } else {
            setStudentDetails(null);
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchStudent();
    }
  }, [isOpen, member]);

  if (!member) return null;

  const handlePrint = () => {
    if (printRef.current) {
      printElement(printRef.current, `Ly_lich_doan_vien_${member.name}`);
    }
  };

  const isSystemStudent = member.id.startsWith('HS-MEMBER-');
  const gender = studentDetails?.gender || (member.name.toLowerCase().includes('thị') || member.name.toLowerCase().includes('ngọc') || member.name.toLowerCase().includes('hải') ? 'Nữ' : 'Nam');
  const phone = studentDetails?.phone || '0901234567';
  const address = studentDetails?.address || 'Cái Bè, Tiền Giang';
  const guardian = studentDetails?.guardian || 'Trần Văn Hùng';

  // Generate volunteer activities with logged hours
  const activities = [
    { name: 'Chiến dịch tình nguyện Hoa Phượng Đỏ', role: 'Chiến sĩ tình nguyện', hours: 15, date: 'Mùa hè 2025' },
    { name: 'Ngày Chủ nhật xanh dọn dẹp vệ sinh trường học', role: 'Đoàn viên', hours: 5, date: '12/10/2025' },
    { name: 'Quyên góp vở viết, SGK cũ cho học sinh khó khăn', role: 'Đoàn viên', hours: 8, date: 'Tháng 11/2025' }
  ];
  const totalHours = activities.reduce((sum, act) => sum + act.hours, 0);

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} title="Hồ Sơ Lý Lịch Đoàn Viên" subtitle={`Xem thông tin chi tiết đoàn tịch của ${member.name}`} width="max-w-4xl" fixedHeight>
      <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-6 bg-[#f5f8fc]">
        {/* Printable Booklet Container */}
        <div ref={printRef} className="border-[4px] border-double border-[#b8c6d9] p-8 bg-[#fffdf9] rounded-2xl shadow-sm relative font-serif text-[#1e2a3a]">
          {/* School Badge watermark */}
          <div className="absolute top-4 right-6 text-[10px] font-sans font-bold text-[#b8c6d9] tracking-widest uppercase opacity-45 select-none">
            MẦM NON AN HỮU • ĐOÀN TNCS HỒ CHÍ MINH
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y-2 md:divide-y-0 md:divide-x-2 divide-dashed divide-[#b8c6d9]">
            {/* Page 1: Ly Lich Ca Nhan */}
            <div className="space-y-6 md:pr-4">
              <div className="text-center pb-4 border-b border-[#dce4ee]">
                <h3 className="text-lg font-bold text-[#2c5ea0] uppercase font-serif tracking-wide">Trang Lý Lịch Cá Nhân</h3>
                <p className="text-[9px] font-sans font-bold text-[#7b8a9e] tracking-wider uppercase mt-1">Sổ Sinh Hoạt Đoàn Viên</p>
              </div>

              {/* Passport photo styling */}
              <div className="relative w-28 h-36 border-2 border-dashed border-[#b8c6d9] bg-[#f0f4fa] rounded-xl flex flex-col items-center justify-center mx-auto mb-6 shadow-inner select-none">
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#2c5ea0]"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#2c5ea0]"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#2c5ea0]"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#2c5ea0]"></div>
                <User className="w-10 h-10 text-[#b8c6d9]" />
                <span className="text-[8px] font-sans font-bold text-[#7b8a9e] uppercase tracking-widest mt-1.5">Ảnh 3x4</span>
                {/* Stamp watermark */}
                <div className="absolute bottom-2 right-2 border border-red-500/30 rounded-full w-9 h-9 flex items-center justify-center text-[6px] text-red-500/35 font-bold uppercase tracking-wider rotate-12 pointer-events-none select-none">
                  BCH ĐOÀN
                </div>
              </div>

              {/* Info columns */}
              <div className="space-y-3.5 text-xs text-[#4a5568] font-sans">
                <div className="flex items-end border-b border-dotted border-[#dce4ee] pb-1">
                  <span className="font-bold text-[#1e2a3a] w-24 shrink-0 uppercase text-[9px] tracking-wider">Họ và Tên:</span>
                  <span className="font-serif font-bold text-sm text-[#2c5ea0] ml-2 leading-none">{member.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-end border-b border-dotted border-[#dce4ee] pb-1">
                    <span className="font-bold text-[#1e2a3a] w-16 shrink-0 uppercase text-[9px] tracking-wider">Lớp:</span>
                    <span className="font-serif font-bold text-sm text-[#1e2a3a] ml-2 leading-none">{member.class}</span>
                  </div>
                  <div className="flex items-end border-b border-dotted border-[#dce4ee] pb-1">
                    <span className="font-bold text-[#1e2a3a] w-16 shrink-0 uppercase text-[9px] tracking-wider">Ngày sinh:</span>
                    <span className="font-bold text-[#1e2a3a] ml-2 leading-none">{member.dob}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-end border-b border-dotted border-[#dce4ee] pb-1">
                    <span className="font-bold text-[#1e2a3a] w-16 shrink-0 uppercase text-[9px] tracking-wider">Giới tính:</span>
                    <span className="font-bold text-[#1e2a3a] ml-2 leading-none">{gender}</span>
                  </div>
                  <div className="flex items-end border-b border-dotted border-[#dce4ee] pb-1">
                    <span className="font-bold text-[#1e2a3a] w-16 shrink-0 uppercase text-[9px] tracking-wider">SĐT:</span>
                    <span className="font-bold text-[#1e2a3a] ml-2 leading-none">{phone}</span>
                  </div>
                </div>
                <div className="flex items-end border-b border-dotted border-[#dce4ee] pb-1">
                  <span className="font-bold text-[#1e2a3a] w-24 shrink-0 uppercase text-[9px] tracking-wider">Địa chỉ:</span>
                  <span className="font-bold text-[#1e2a3a] ml-2 truncate leading-none">{address}</span>
                </div>
                <div className="flex items-end border-b border-dotted border-[#dce4ee] pb-1">
                  <span className="font-bold text-[#1e2a3a] w-24 shrink-0 uppercase text-[9px] tracking-wider">Người Giám Hộ:</span>
                  <span className="font-bold text-[#1e2a3a] ml-2 leading-none">{guardian}</span>
                </div>
              </div>

              {/* Signature section */}
              <div className="mt-8 text-center text-[10px] font-sans text-[#7b8a9e] uppercase tracking-widest leading-relaxed pt-2 grid grid-cols-2">
                <div>
                  <p className="font-bold">Đoàn viên ký tên</p>
                  <p className="text-[8px] font-normal italic lowercase mt-10 text-[#8e9eb4]">Chữ ký điện tử</p>
                </div>
                <div>
                  <p className="font-bold">Xác nhận BCH Đoàn</p>
                  <p className="text-[8px] font-bold text-red-600/70 font-serif uppercase rotate-3 border-2 border-red-500/50 border-double py-0.5 px-2 w-fit mx-auto mt-6">Đã Duyệt</p>
                </div>
              </div>
            </div>

            {/* Page 2: Thong tin doan tich & Hoat dong phong trao */}
            <div className="space-y-6 md:pl-8 pt-6 md:pt-0">
              <div className="text-center pb-4 border-b border-[#dce4ee]">
                <h3 className="text-lg font-bold text-[#2c5ea0] uppercase font-serif tracking-wide">Quá Trình Hoạt Động</h3>
                <p className="text-[9px] font-sans font-bold text-[#7b8a9e] tracking-wider uppercase mt-1">Thông Tin Kết Nạp & Khen Thưởng</p>
              </div>

              {/* Union credentials details */}
              <div className="bg-[#f0f4fa] p-4 border border-[#d4dde9] rounded-2xl grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs text-[#4a5568] font-sans relative">
                {/* Total Volunteer Hours Badge stamp */}
                <div className="absolute top-4 right-4 bg-[#e8eef6] border-2 border-double border-[#b8c6d9] rounded-full w-14 h-14 flex flex-col items-center justify-center text-center shadow-sm pointer-events-none select-none">
                  <span className="text-[7px] font-bold text-[#7b8a9e] uppercase leading-none">Tích lũy</span>
                  <span className="text-sm font-bold font-serif text-[#2e6b8a] mt-0.5">{totalHours}h</span>
                </div>

                <div>
                  <span className="font-bold text-[#1e2a3a] uppercase text-[9px] tracking-wider block mb-0.5">Ngày Kết Nạp:</span>
                  <span className="font-serif font-bold text-sm text-[#1e2a3a]">{member.date}</span>
                </div>
                <div>
                  <span className="font-bold text-[#1e2a3a] uppercase text-[9px] tracking-wider block mb-0.5">Chức vụ:</span>
                  <span className="font-serif font-bold text-xs text-[#2c5ea0]">{member.role}</span>
                </div>
                <div className="col-span-2 border-t border-[#d4dde9] pt-2">
                  <span className="font-bold text-[#1e2a3a] uppercase text-[9px] tracking-wider block mb-0.5">Nơi kết nạp:</span>
                  <span className="font-medium">{member.joinPlace || 'Chi đoàn trường Mầm non An Hữu'}</span>
                </div>
                <div>
                  <span className="font-bold text-[#1e2a3a] uppercase text-[9px] tracking-wider block mb-0.5">Số thẻ Đoàn:</span>
                  <span className="font-mono text-xs font-bold">{member.cardNumber || 'AH-987123'}</span>
                </div>
                <div>
                  <span className="font-bold text-[#1e2a3a] uppercase text-[9px] tracking-wider block mb-0.5">Trạng thái Sổ:</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest mt-1
                     ${member.status === 'Đang giữ tại trường' ? 'bg-[#dcfce7] text-[#166534]' : 
                       member.status === 'Chưa nộp sổ' ? 'bg-[#fef9c3] text-[#854d0e]' :
                       'bg-[#fee2e2] text-[#991b1b]'}`}>
                     {member.status}
                  </span>
                </div>
              </div>

              {/* Movement Logs / Volunteer records */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#2c5ea0] flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  Khen thưởng & Phong trào tình nguyện
                </h4>

                <div className="border border-[#dce4ee] rounded-xl overflow-hidden bg-white">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#f0f4fa] border-b border-[#dce4ee] text-[9px] font-bold uppercase tracking-wider text-[#7b8a9e]">
                        <th className="py-2 px-3">Tên phong trào</th>
                        <th className="py-2 px-3 text-center w-16">Thời gian</th>
                        <th className="py-2 px-3 text-right w-16">Tích lũy</th>
                      </tr>
                    </thead>
                    <tbody className="font-sans text-[11px]">
                      {activities.map((act, idx) => (
                        <tr key={idx} className="border-b border-dashed border-[#dce4ee] last:border-0 hover:bg-[#f0f4fa]/50">
                          <td className="py-2.5 px-3">
                            <p className="font-bold text-[#1e2a3a]">{act.name}</p>
                            <p className="text-[9px] text-[#7b8a9e] mt-0.5">{act.role}</p>
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#4a5568] whitespace-nowrap">{act.date}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#2e6b8a] font-serif">+{act.hours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-8 py-4 flex justify-end gap-3 shrink-0">
        <button onClick={onClose} className="px-6 py-2.5 rounded-full text-xs font-bold text-[#4a5568] border border-[#b8c6d9] hover:bg-[#dce4ee] uppercase tracking-widest transition-colors cursor-pointer">
          Đóng
        </button>
        <button onClick={handlePrint} className="px-6 py-2.5 rounded-full text-xs font-bold bg-[#2c5ea0] text-white hover:bg-[#5c2a2a] uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1.5 shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-0.5">
          <Printer className="w-4 h-4" /> In Lý Lịch
        </button>
      </div>
    </ModalBase>
  );
};
