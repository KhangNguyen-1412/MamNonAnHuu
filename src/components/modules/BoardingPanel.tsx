import React, { useState, useEffect, useRef } from 'react';
import { 
  Filter, Plus, Search, Coffee, Utensils, BedDouble, Receipt, Calendar, 
  ShieldCheck, CheckCircle2, AlertTriangle, Truck, Printer, Ban, 
  ShieldAlert, Eye, FileText, ClipboardCheck, Package, User, Clock, 
  AlertCircle, RefreshCw, LogOut, Check, ChevronRight, X, Sparkles, 
  Activity, Flame, UserCheck
} from 'lucide-react';
import { ModalBase } from '../ui/Modals';
import { 
  getInboundReceipts, saveInboundReceipt, deleteInboundReceipt, InboundReceipt,
  getMeals, saveMeal, deleteMeal, Meal,
  getBoardingRooms, saveBoardingRoom, deleteBoardingRoom, BoardingRoom,
  getSuppliers, saveSupplier, deleteSupplier, Supplier,
  getHealthRecords, HealthRecord
} from '../../services/dbService';

interface BoardingPanelProps {
  activeTab?: 'dashboard' | 'inventory' | 'atvstp' | 'closing' | 'communication' | 'rooms';
}

export const BoardingPanel: React.FC<BoardingPanelProps> = ({ activeTab: propActiveTab }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'atvstp' | 'closing' | 'communication' | 'rooms'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Sync state with activeTab prop driven by the main sidebar navigation
  useEffect(() => {
    if (propActiveTab) {
      setActiveTab(propActiveTab);
    }
  }, [propActiveTab]);

  // Core Datasets
  const [meals, setMeals] = useState<Meal[]>([]);
  const [rooms, setRooms] = useState<BoardingRoom[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inboundReceipts, setInboundReceipts] = useState<InboundReceipt[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);

  // 1. Dashboard States
  const [absentCount, setAbsentCount] = useState(15);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'breakfast' | 'lunch' | 'snack'>('lunch');
  const [allergiesConfirmed, setAllergiesConfirmed] = useState<Record<string, boolean>>({});
  const [printedLabel, setPrintedLabel] = useState<any | null>(null);
  const [portionGroup, setPortionGroup] = useState<'mau_giao' | 'nha_tre'>('mau_giao');

  // 2. Inventory & Portioning States
  const [deliveryChecklist, setDeliveryChecklist] = useState([
    { id: 'item-1', name: 'Thịt heo nạc (Vissan)', qty: '45.0 kg', checkedWeight: false, checkedSensory: false, checkedTemp: false },
    { id: 'item-2', name: 'Cải ngọt hữu cơ (HTX Đà Lạt)', qty: '25.0 kg', checkedWeight: false, checkedSensory: false, checkedTemp: false },
    { id: 'item-3', name: 'Bí đỏ hồ lô (HTX Đà Lạt)', qty: '15.0 kg', checkedWeight: false, checkedSensory: false, checkedTemp: false },
    { id: 'item-4', name: 'Hành lá & Gia vị thơm', qty: '2.0 kg', checkedWeight: false, checkedSensory: false, checkedTemp: false },
  ]);
  const [inboundHistoryModal, setInboundHistoryModal] = useState(false);

  // 3. ATVSTP States
  const [atvstpStep1, setAtvstpStep1] = useState([
    { id: 's1-1', label: 'Nguyên liệu tươi sống, không dập nát, ôi thiu', checked: false },
    { id: 's1-2', label: 'Có đầy đủ hóa đơn, chứng từ truy xuất nguồn gốc', checked: false },
    { id: 's1-3', label: 'Nhiệt độ bảo quản xe giao hàng đạt chuẩn (< 5°C)', checked: false }
  ]);
  const [atvstpStep2, setAtvstpStep2] = useState([
    { id: 's2-1', label: 'Khu vực sơ chế sạch sẽ, thớt sống/chín phân biệt rõ', checked: false },
    { id: 's2-2', label: 'Nhân viên mặc bảo hộ, đeo găng tay, mũ trùm tóc', checked: false },
    { id: 's2-3', label: 'Nguồn nước sạch kiểm định định kỳ đạt tiêu chuẩn', checked: false }
  ]);
  const [atvstpStep3, setAtvstpStep3] = useState([
    { id: 's3-1', label: 'Thức ăn chín đạt nhiệt độ trung tâm > 70°C', checked: false },
    { id: 's3-2', label: 'Cảm quan mùi vị đạt chuẩn ngon miệng học đường', checked: false },
    { id: 's3-3', label: 'Mẫu thức ăn đã được niêm phong lưu trữ đúng quy cách', checked: false }
  ]);
  const [isSigning, setIsSigning] = useState(false);
  const [chefSignature, setChefSignature] = useState<string | null>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Sample archiving states
  const [sampleForm, setSampleForm] = useState({
    mealName: 'Bữa trưa - Thịt kho trứng',
    sampler: 'Trưởng Bếp: Nguyễn Văn Tài',
    weight: '150g',
    sealTime: '10:30'
  });
  const [activeSamples, setActiveSamples] = useState([
    { id: 'SMP-01', meal: 'Bữa sáng - Cháo thịt bằm', sampler: 'Nguyễn Văn Tài', time: '07:15', date: '26/06/2026', secondsLeft: 12 * 3600 + 45 * 60 },
    { id: 'SMP-02', meal: 'Bữa trưa - Thịt kho, cải xào, canh chua', sampler: 'Nguyễn Văn Tài', time: '10:30', date: '26/06/2026', secondsLeft: 23 * 3600 + 58 * 60 }
  ]);

  // 4. Shifts & Closing States
  const [staffShifts, setStaffShifts] = useState([
    { role: 'Bếp trưởng (Đứng bếp chính)', name: 'Nguyễn Văn Tài', checkedIn: true, avatar: 'VT' },
    { role: 'Phụ bếp 1 (Sơ chế nguyên liệu)', name: 'Lê Thị Hoa', checkedIn: true, avatar: 'LH' },
    { role: 'Phụ bếp 2 (Nấu phụ, chia khay)', name: 'Trần Thị Mai', checkedIn: true, avatar: 'TM' },
    { role: 'Nhân viên Vệ sinh & Tiệt trùng', name: 'Phạm Văn Nam', checkedIn: false, avatar: 'VN' }
  ]);
  const [closingChecklist, setClosingChecklist] = useState([
    { id: 'c1', label: '🔒 Đã khóa hoàn toàn van gas trung tâm & tủ gas', checked: false },
    { id: 'c2', label: '🧹 Đã lau dọn sàn bếp & khử khuẩn mương thoát nước', checked: false },
    { id: 'c3', label: '🌡️ Đã sấy tiệt trùng 100% khay ăn, thìa đũa của học sinh', checked: false },
    { id: 'c4', label: '🔌 Đã ngắt điện tủ hấp cơm, tủ giữ ấm & thiết bị gia nhiệt', checked: false },
    { id: 'c5', label: '💨 Đã ngắt hệ thống hút mùi & quạt thông gió công nghiệp', checked: false }
  ]);

  // 5. Communication & Waste States
  const [kitchenStatus, setKitchenStatus] = useState<'preparing' | 'cooking' | 'ready' | 'completed'>('cooking');
  const [broadcastModal, setBroadcastModal] = useState(false);
  const [keypadTarget, setKeypadTarget] = useState<'rice' | 'meat' | 'soup' | null>(null);
  const [wasteValues, setWasteValues] = useState({ rice: '', meat: '', soup: '' });

  // Load Firebase collections & health records
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const [mealsData, roomsData, suppliersData, receiptsData, healthData] = await Promise.all([
          getMeals(),
          getBoardingRooms(),
          getSuppliers(),
          getInboundReceipts(),
          getHealthRecords()
        ]);
        setMeals(mealsData);
        setRooms(roomsData);
        setSuppliers(suppliersData);
        setInboundReceipts(receiptsData);
        setHealthRecords(healthData);
      } catch (err) {
        console.error("Failed to load kitchen workspace data", err);
        showToast("Có lỗi xảy ra khi đồng bộ dữ liệu từ hệ thống.");
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  // Countdown timer effect for food samples
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSamples(prev => 
        prev.map(sample => {
          if (sample.secondsLeft > 0) {
            return { ...sample, secondsLeft: sample.secondsLeft - 1 };
          }
          return sample;
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  // Real-time synchronization simulation (Firebase simulation)
  const handleRealtimeSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setAbsentCount(prev => prev + 3); // Simulate 3 more student absences
      showToast("🔄 Đã đồng bộ thời gian thực! Lớp Mầm 1 báo thêm 3 bé nghỉ cắt cơm trưa.");
    }, 1200);
  };

  // Print custom label for special diet students
  const handlePrintLabel = (student: any) => {
    setPrintedLabel({
      ...student,
      printTime: new Date().toLocaleTimeString('vi-VN'),
      printDate: new Date().toLocaleDateString('vi-VN')
    });
  };

  // Automatic portion calculator calculations
  const totalBasePortions = 520;
  const activeLunchPortions = totalBasePortions - absentCount;
  
  const calculateIngredient = (basePerPortionKg: number) => {
    return (activeLunchPortions * basePerPortionKg).toFixed(2);
  };

  // ATVSTP Signature Canvas simulation
  const startSigning = () => {
    setIsSigning(true);
    setTimeout(() => {
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = '#1e2a3a';
          ctx.lineWidth = 3;
          ctx.lineCap = 'round';
          
          // Animate a signature path
          let t = 0;
          const points = [
            { x: 30, y: 70 }, { x: 60, y: 40 }, { x: 80, y: 90 }, 
            { x: 110, y: 30 }, { x: 130, y: 80 }, { x: 160, y: 50 },
            { x: 190, y: 80 }, { x: 220, y: 75 }, { x: 250, y: 78 }
          ];
          
          const drawNext = () => {
            if (t < points.length - 1) {
              ctx.beginPath();
              ctx.moveTo(points[t].x, points[t].y);
              ctx.lineTo(points[t+1].x, points[t+1].y);
              ctx.stroke();
              t++;
              setTimeout(drawNext, 60);
            }
          };
          drawNext();
        }
      }
    }, 100);
  };

  const saveSignature = () => {
    setChefSignature('Nguyễn Văn Tài (Đã Ký)');
    setIsSigning(false);
    showToast("✍️ Chữ ký điện tử đã được nhúng vào biên bản kiểm thực thành công.");
  };

  const handleSaveATVSTPDoc = () => {
    if (!chefSignature) {
      showToast("⚠️ Vui lòng ký tên xác nhận trước khi lưu hồ sơ pháp lý.");
      return;
    }
    showToast("✅ Đã lưu hồ sơ Kiểm Thực 3 Bước thành công vào cơ sở dữ liệu pháp lý trường học!");
  };

  // Add a new food sample
  const handleAddSample = (e: React.FormEvent) => {
    e.preventDefault();
    const newSample = {
      id: `SMP-${Math.floor(10 + Math.random() * 90)}`,
      meal: sampleForm.mealName,
      sampler: sampleForm.sampler.replace('Trưởng Bếp: ', ''),
      time: sampleForm.sealTime,
      date: new Date().toLocaleDateString('vi-VN'),
      secondsLeft: 24 * 3600 // Full 24 hours
    };
    setActiveSamples([newSample, ...activeSamples]);
    showToast(`🧪 Đã niêm phong lưu mẫu thành công: ${sampleForm.mealName}`);
  };

  const formatTimer = (seconds: number) => {
    if (seconds <= 0) return 'CHO PHÉP HỦY';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}g ${m}p ${s}s`;
  };

  // Shift Check-in toggle
  const toggleShiftCheckIn = (index: number) => {
    const updated = [...staffShifts];
    updated[index].checkedIn = !updated[index].checkedIn;
    setStaffShifts(updated);
    showToast(`${updated[index].checkedIn ? '🟢 Đã điểm danh' : '🔴 Đã báo vắng'} nhân sự: ${updated[index].name}`);
  };

  // Closing checklist toggle
  const toggleClosingItem = (index: number) => {
    const updated = [...closingChecklist];
    updated[index].checked = !updated[index].checked;
    setClosingChecklist(updated);
  };

  const closingProgress = Math.round(
    (closingChecklist.filter(item => item.checked).length / closingChecklist.length) * 100
  );

  const handleSendClosingReport = () => {
    showToast("🔒 Đã hoàn thành đóng ca và gửi báo cáo an toàn phòng cháy chữa cháy tới BGH!");
  };

  // Broadcast Kitchen Status
  const handleBroadcastStatus = (status: typeof kitchenStatus) => {
    setKitchenStatus(status);
    setBroadcastModal(true);
  };

  // Keypad press handler for waste inputs
  const handleKeypress = (char: string) => {
    if (!keypadTarget) return;
    setWasteValues(prev => {
      const current = prev[keypadTarget];
      let updated = current;
      if (char === 'C') {
        updated = '';
      } else if (char === '.') {
        if (!current.includes('.')) {
          updated = current ? current + '.' : '0.';
        }
      } else {
        updated = current + char;
      }
      return { ...prev, [keypadTarget]: updated };
    });
  };

  const handleSaveWasteReport = () => {
    if (!wasteValues.rice && !wasteValues.meat && !wasteValues.soup) {
      showToast("⚠️ Vui lòng điền ít nhất một chỉ số thức ăn thừa.");
      return;
    }
    showToast(`📊 Đã ghi nhận chỉ số hao hụt thừa: Cơm ${wasteValues.rice || 0}kg, Mặn ${wasteValues.meat || 0}kg, Canh ${wasteValues.soup || 0}kg.`);
    setWasteValues({ rice: '', meat: '', soup: '' });
    setKeypadTarget(null);
  };

  // Boarding Room attendance quick actions
  const handleQuickRoomCheckIn = (roomId: string, present: boolean) => {
    setRooms(prev => 
      prev.map(r => {
        if (r.id === roomId) {
          const newPresent = present ? Math.min(r.capacity, r.present + 1) : Math.max(0, r.present - 1);
          const newAbsent = r.capacity - newPresent;
          return { ...r, present: newPresent, absent: newAbsent };
        }
        return r;
      })
    );
    showToast(`🛏️ Đã cập nhật điểm danh nhanh phòng ${roomId}`);
  };

  // Dynamic allergies data combining fetched and mock cases
  const defaultAllergies = [
    { id: 'STU-001', name: 'Nguyễn An Bình', class: 'Mầm 1', allergy: 'Dị ứng Đậu phộng (Rất nặng)', history: '⚠️ Tuyệt đối tránh dầu phộng, hạt', replacement: 'Thay dầu đậu nành' },
    { id: 'STU-002', name: 'Lê Thảo Vy', class: 'Chồi 2', allergy: 'Dị ứng Tôm & Hải sản', history: '🦐 Thay hải sản bằng thịt nạc heo', replacement: 'Món mặn thay thế: Thịt kho tiêu' },
    { id: 'STU-003', name: 'Trần Hoàng Nam', class: 'Lá 1', allergy: 'Kiêng ăn cứng (Nhai khó)', history: '🥣 Cần thức ăn băm nhỏ/cháo loãng', replacement: 'Món ăn: Thịt băm mềm & Canh bí nghiền' },
    { id: 'STU-004', name: 'Bùi Gia Huy', class: 'Nhà trẻ 2', allergy: 'Dị ứng Sữa bò / Đường Lactose', history: '🥛 Không uống sữa tươi xế chiều', replacement: 'Thay sữa bằng sữa hạt organic' }
  ];

  const displayAllergies = [
    ...defaultAllergies,
    ...healthRecords
      .filter(r => r.allergy && r.allergy.toLowerCase() !== 'không' && r.allergy.trim() !== '')
      .map(r => ({
        id: r.id,
        name: r.name,
        class: r.class,
        allergy: r.allergy,
        history: r.history || 'Cấp dưỡng lưu ý chuẩn bị riêng',
        replacement: 'Theo chỉ dẫn hồ sơ sức khỏe'
      }))
  ];

  const getTabHeaderInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return {
          title: 'Điều Phối Bếp',
          description: 'Bảng tin theo dõi số liệu chốt trong ngày và cảnh báo y tế dị ứng học sinh'
        };
      case 'inventory':
        return {
          title: 'Kho & Định Lượng',
          description: 'Kiểm thực thực phẩm đầu ngày và công cụ tự động tính định lượng chế biến'
        };
      case 'atvstp':
        return {
          title: 'Vệ Sinh & Lưu Mẫu',
          description: 'Hồ sơ kiểm thực 3 bước điện tử và giám sát hộp mẫu thức ăn lưu trữ 24 giờ'
        };
      case 'closing':
        return {
          title: 'Ca Trực & Đóng Ca',
          description: 'Bảng phân công trực ban và danh sách đóng ca an toàn phòng cháy chữa cháy'
        };
      case 'communication':
        return {
          title: 'Báo Cáo & Truyền Tin',
          description: 'Truyền trạng thái dây chuyền chế biến và ghi nhận chỉ số thức ăn thừa'
        };
      case 'rooms':
        return {
          title: 'Nghỉ Trưa Bán Trú',
          description: 'Giám sát phân phòng ngủ và điểm danh nhanh học sinh nghỉ trưa bán trú'
        };
      default:
        return {
          title: 'Điều Phối Bếp',
          description: 'Bảng tin theo dõi số liệu chốt trong ngày và cảnh báo y tế dị ứng học sinh'
        };
    }
  };

  const tabHeader = getTabHeaderInfo();

  return (
    <main className="flex-1 overflow-y-auto p-8 bg-[#edf2f9] scroll-smooth text-base relative">
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#2c5ea0] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto z-10 relative space-y-8">
        
        {/* UNIFIED PAGE HEADER WITH DOUBLE BORDER */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-[3px] border-double border-[#b8c6d9] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 bg-[#2c5ea0]/10 text-[#2c5ea0] text-[10px] font-bold uppercase tracking-widest rounded-full border border-[#b8c6d9] flex items-center">
                <Utensils className="w-3.5 h-3.5 mr-1 fill-[#2c5ea0] text-[#2c5ea0]" /> Vị trí công tác: Cấp dưỡng & Bán trú
              </span>
            </div>
            <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] mb-1.5 tracking-tight">{tabHeader.title}</h2>
            <p className="text-[#5a6a85] text-sm font-medium leading-relaxed">{tabHeader.description}</p>
          </div>
          
          <div className="flex items-center gap-3 mt-4 sm:mt-0 bg-[#e8eef6] border border-[#b8c6d9] px-5 py-2.5 rounded-full shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping"></span>
            <span className="text-xs font-bold text-[#1e2a3a] uppercase tracking-wider font-mono">
              Bếp: {kitchenStatus === 'preparing' ? 'Đang sơ chế' : kitchenStatus === 'cooking' ? 'Đang nấu nướng' : kitchenStatus === 'ready' ? 'Sẵn sàng phục vụ' : 'Đã hoàn thành'}
            </span>
          </div>
        </div>

        {/* FULL-WIDTH MAIN CONTENT PANEL */}
        <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col h-[780px] rounded-3xl overflow-hidden min-h-0">
          
          {/* CONTENT TITLE BAR */}
          <div className="p-5 border-b-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap gap-4 items-center justify-between">
            <h3 className="font-bold text-[#1e2a3a] uppercase tracking-widest text-xs">
              {activeTab === 'dashboard' && 'Bảng theo dõi số liệu chốt & cảnh báo y tế'}
              {activeTab === 'inventory' && 'Kiểm thực đầu vào & định lượng chế biến tiêu chuẩn'}
              {activeTab === 'atvstp' && 'Biên bản kiểm thực 3 bước & hộp mẫu lưu 24 giờ'}
              {activeTab === 'closing' && 'Phân công ca trực & an toàn đóng ca cuối ngày'}
              {activeTab === 'communication' && 'Truyền thông trạng thái bếp & ghi nhận hao hụt'}
              {activeTab === 'rooms' && 'Danh sách điểm danh phòng ngủ bán trú học sinh'}
            </h3>
          </div>

          {/* SCROLLABLE INNER CONTENT AREA */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-white">
            
            {/* TAB 1: DASHBOARD & ALLERGIES */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Real-time sync portion header */}
                <div className="bg-[#f5f8fc] border border-[#b8c6d9] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-[#1e2a3a] uppercase tracking-wide">Suất Ăn Chốt Thời Gian Thực</h4>
                    <p className="text-xs text-[#7b8a9e] font-bold mt-0.5">Số liệu được cập nhật tự động từ lớp học để tránh dư thừa</p>
                  </div>
                  <button
                    onClick={handleRealtimeSync}
                    disabled={isSyncing}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-[#1e2a3a] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black active:scale-95 transition disabled:opacity-50 select-none h-12"
                  >
                    <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Đồng bộ Điểm danh (Real-time)
                  </button>
                </div>

                {/* Portions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'breakfast', label: 'Bữa Sáng', count: 120, detail: '100 Học sinh • 20 Giáo viên', status: 'Đã hoàn thành', statusBg: 'bg-green-100 text-green-800' },
                    { id: 'lunch', label: 'Bữa Trưa', count: activeLunchPortions, detail: `${activeLunchPortions - 35} Học sinh • 35 Giáo viên`, status: 'Đang chế biến', statusBg: 'bg-orange-100 text-orange-800 animate-pulse', warn: absentCount > 0 ? `Giảm ${absentCount} suất vắng` : undefined },
                    { id: 'snack', label: 'Bữa Xế', count: 480, detail: '450 Học sinh • 30 Giáo viên', status: 'Chờ sơ chế', statusBg: 'bg-gray-100 text-gray-800' }
                  ].map(m => (
                    <div 
                      key={m.id}
                      onClick={() => setSelectedMealType(m.id as any)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer select-none text-left ${
                        selectedMealType === m.id 
                          ? 'border-[#2c5ea0] bg-[#e8eef6]/50 shadow-inner ring-2 ring-[#2c5ea0]/20' 
                          : 'border-[#b8c6d9] hover:bg-[#f5f8fc]'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-[#7b8a9e] uppercase tracking-wider">{m.label}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${m.statusBg}`}>{m.status}</span>
                      </div>
                      <p className="text-3xl font-black text-[#1e2a3a] mt-2">{m.count} <span className="text-xs font-bold text-[#7b8a9e]">suất</span></p>
                      <p className="text-[10px] font-bold text-[#4a5568] mt-2">{m.detail}</p>
                      {m.warn && <p className="text-[9px] text-red-600 font-bold mt-1">{m.warn}</p>}
                    </div>
                  ))}
                </div>

                {/* Menu details */}
                <div className="border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc]">
                  <div className="flex items-center gap-2 border-b border-[#b8c6d9] pb-3 mb-4">
                    <Coffee className="w-5 h-5 text-[#2c5ea0]" />
                    <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Thực Đơn Chi Tiết Bữa Trưa Hôm Nay</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { type: 'Món Mặn', name: 'Thịt Heo Kho Trứng', desc: 'Thịt đùi heo Vissan kho nước dừa xiêm nhạt' },
                      { type: 'Món Xào', name: 'Cải Ngọt Xào Tỏi', desc: 'Cải ngọt hữu cơ xào mềm dễ ăn' },
                      { type: 'Món Canh', name: 'Canh Bí Đỏ Thịt Bằm', desc: 'Bí đỏ HTX hữu cơ ninh nhừ nấu thịt nạc bằm' }
                    ].map((dish, i) => (
                      <div key={i} className="bg-white border border-[#b8c6d9] p-4 rounded-xl shadow-sm">
                        <span className="px-2 py-0.5 bg-[#e8eef6] text-[#2c5ea0] border border-[#b8c6d9] text-[9px] font-bold rounded uppercase tracking-wide">{dish.type}</span>
                        <h5 className="font-bold text-[#1e2a3a] text-sm mt-2">{dish.name}</h5>
                        <p className="text-xs text-[#7b8a9e] font-bold mt-1">{dish.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ALLERGY WARNING PANEL */}
                <div className="border-[3px] border-double border-red-300 rounded-2xl p-5 bg-red-50/20">
                  <div className="flex items-center justify-between border-b border-red-200 pb-3 mb-4">
                    <div className="flex items-center gap-2 text-red-800">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                      <h4 className="text-sm font-black uppercase tracking-wider">Cảnh Báo Y Tế & Dị Ứng Bữa Ăn</h4>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded border border-red-200 uppercase tracking-widest">Đặc biệt quan trọng</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayAllergies.map(student => {
                      const isConfirmed = allergiesConfirmed[student.id] || false;
                      return (
                        <div 
                          key={student.id} 
                          className={`p-4 rounded-xl border transition-all ${
                            isConfirmed 
                              ? 'bg-green-50 border-green-300 text-green-900' 
                              : 'bg-white border-red-200 hover:border-red-400 text-[#1e2a3a]'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-200 text-[9px] font-bold rounded-full">{student.class}</span>
                              <h5 className="font-bold text-sm mt-1.5">{student.name}</h5>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg border ${
                              isConfirmed 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-red-100 text-red-700 border-red-200 animate-pulse'
                            }`}>
                              {isConfirmed ? 'Đã chuẩn bị khay riêng' : 'Chờ chuẩn bị'}
                            </span>
                          </div>
                          <p className="text-xs font-black text-red-700 mt-2 bg-red-50 px-2 py-1.5 rounded-lg border border-red-100">
                            🔴 {student.allergy}
                          </p>
                          <p className="text-[10px] text-gray-500 font-bold mt-1.5 pl-1 leading-relaxed">
                            ↳ Ghi chú: {student.history} <br />
                            <span className="text-green-700 font-extrabold">↳ Món thay: {student.replacement}</span>
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-dashed border-gray-200">
                            <button
                              onClick={() => setAllergiesConfirmed(prev => ({ ...prev, [student.id]: !prev[student.id] }))}
                              className={`py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider border text-center transition select-none ${
                                isConfirmed 
                                  ? 'bg-white text-green-700 border-green-300 hover:bg-green-100' 
                                  : 'bg-red-600 hover:bg-red-800 text-white border-red-600'
                              }`}
                            >
                                {isConfirmed ? 'Hủy Xác Nhận' : 'Đã Làm Riêng'}
                            </button>
                            <button
                              onClick={() => handlePrintLabel(student)}
                              className="py-1.5 bg-white text-[#2c5ea0] border border-[#b8c6d9] hover:bg-[#e8eef6] rounded-lg font-bold text-[10px] uppercase tracking-wider transition select-none"
                            >
                              In nhãn dán khay
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: INVENTORY & PORTIONING */}
            {activeTab === 'inventory' && (
              <div className="space-y-6">
                
                {/* Delivery header */}
                <div className="bg-[#f5f8fc] border border-[#b8c6d9] p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-[#1e2a3a] uppercase tracking-wide">Nhận Thực Phẩm Sáng Sớm (05:30)</h4>
                    <p className="text-xs text-[#7b8a9e] font-bold mt-0.5">Kiểm tra chất lượng & số lượng thịt cá tươi sống từ nhà cung ứng</p>
                  </div>
                  <button
                    onClick={() => setInboundHistoryModal(true)}
                    className="px-4 py-2 bg-white text-[#2c5ea0] border border-[#b8c6d9] hover:bg-[#e8eef6] rounded-xl font-bold text-xs uppercase tracking-wider transition select-none flex items-center gap-1 h-10"
                  >
                    <FileText className="w-4 h-4" /> Nhật Ký Nhập Kho
                  </button>
                </div>

                {/* Delivery checklist */}
                <div className="space-y-3">
                  {deliveryChecklist.map((item, idx) => (
                    <div key={item.id} className="bg-[#f5f8fc] p-4 border border-[#b8c6d9] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-white border border-[#b8c6d9] flex items-center justify-center font-black text-[#2c5ea0] text-sm shadow-sm">{idx + 1}</span>
                        <div>
                          <h5 className="font-bold text-sm text-[#1e2a3a]">{item.name}</h5>
                          <p className="text-xs text-[#7b8a9e] font-bold">Số lượng yêu cầu: <span className="text-[#2c5ea0] font-black">{item.qty}</span></p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'checkedWeight', label: 'Cân đủ' },
                          { key: 'checkedSensory', label: 'Cảm quan tươi' },
                          { key: 'checkedTemp', label: 'Nhiệt độ xe lạnh' }
                        ].map(chk => {
                          const isChecked = (item as any)[chk.key];
                          return (
                            <button
                              key={chk.key}
                              onClick={() => {
                                const updated = [...deliveryChecklist];
                                (updated[idx] as any)[chk.key] = !isChecked;
                                setDeliveryChecklist(updated);
                              }}
                              className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition select-none flex items-center gap-1 ${
                                isChecked 
                                  ? 'bg-green-100 text-green-800 border-green-300' 
                                  : 'bg-white text-[#4a5568] border-[#b8c6d9] hover:bg-gray-50'
                              }`}
                            >
                              {isChecked && <Check className="w-3.5 h-3.5" />}
                              {chk.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      const allChecked = deliveryChecklist.every(item => item.checkedWeight && item.checkedSensory && item.checkedTemp);
                      if (!allChecked) {
                        showToast("⚠️ Vui lòng tick chọn kiểm tra đủ cả 3 tiêu chí cho các loại thực phẩm.");
                        return;
                      }
                      showToast("✅ Xác nhận kiểm nhận thực phẩm đạt chuẩn thành công!");
                    }}
                    className="px-6 py-3 bg-[#1e2a3a] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition select-none"
                  >
                    Xác Nhận Đạt & Đăng Ký Lưu Kho
                  </button>
                </div>

                 {/* Portioning calculator */}
                <div className="border border-[#e7e3d4] rounded-2xl p-6 bg-[#fdfbf7] space-y-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e7e3d4] pb-4">
                    <div>
                      <h4 className="text-sm font-bold text-[#2d251e] uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#f59e0b]" />
                        Định Lượng Nguyên Liệu & Cân Đối Dinh Dưỡng
                      </h4>
                      <p className="text-xs text-[#8c7d70] font-medium mt-1">Tính toán nguyên vật liệu và tỉ lệ Đạm - Đường - Béo cho {activeLunchPortions} trẻ</p>
                    </div>
                    {/* Portion Group Toggle */}
                    <div className="flex bg-[#fcf8f2] border border-[#e7e3d4] p-1 rounded-full shrink-0">
                      <button
                        onClick={() => setPortionGroup('mau_giao')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all select-none ${
                          portionGroup === 'mau_giao'
                            ? 'bg-[#f59e0b] text-white shadow-sm'
                            : 'text-[#5c4f43] hover:text-[#2d251e]'
                        }`}
                      >
                        Mẫu Giáo (Mầm/Chồi/Lá)
                      </button>
                      <button
                        onClick={() => setPortionGroup('nha_tre')}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all select-none ${
                          portionGroup === 'nha_tre'
                            ? 'bg-[#f59e0b] text-white shadow-sm'
                            : 'text-[#5c4f43] hover:text-[#2d251e]'
                        }`}
                      >
                        Nhà Trẻ (24-36 th)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Ingredients */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                      {portionGroup === 'mau_giao' ? (
                        [
                          { label: 'Thịt đùi heo kho', ratio: 0.08, material: 'Thịt heo nạc Vissan' },
                          { label: 'Rau cải ngọt xào', ratio: 0.05, material: 'Cải ngọt Đà Lạt' },
                          { label: 'Gạo tẻ nấu cơm', ratio: 0.12, material: 'Gạo thơm organic' },
                          { label: 'Bí đỏ ninh canh', ratio: 0.03, material: 'Bí đỏ hồ lô' }
                        ].map((ing, i) => (
                          <div key={i} className="bg-[#fdfbf7] border border-[#e7e3d4] p-4 rounded-xl text-left shadow-[2px_2px_0px_#e7e3d4]">
                            <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wide">{ing.material}</p>
                            <p className="text-xl font-black text-[#2d251e] my-1">{calculateIngredient(ing.ratio)} <span className="text-xs font-bold text-gray-500">kg</span></p>
                            <div className="flex justify-between items-center mt-1.5 text-[8px] font-bold text-[#8c7d70] uppercase">
                              <span>Định mức</span>
                              <span className="bg-[#fcf8f2] border border-[#e7e3d4] px-1.5 py-0.5 rounded text-[#d97706]">{ing.ratio * 1000}g/bé</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        [
                          { label: 'Thịt bằm nấu cháo', ratio: 0.06, material: 'Thịt thăn bằm nhuyễn' },
                          { label: 'Bí đỏ nghiền cháo', ratio: 0.04, material: 'Bí đỏ hồ lô hấp' },
                          { label: 'Gạo tẻ nấu cháo', ratio: 0.05, material: 'Gạo tẻ loại mềm thơm' },
                          { label: 'Sữa tươi/Sữa công thức', ratio: 0.02, material: 'Sữa bột chua/sữa tươi' }
                        ].map((ing, i) => (
                          <div key={i} className="bg-[#fdfbf7] border border-[#e7e3d4] p-4 rounded-xl text-left shadow-[2px_2px_0px_#e7e3d4]">
                            <p className="text-[9px] font-extrabold text-[#8c7d70] uppercase tracking-wide">{ing.material}</p>
                            <p className="text-xl font-black text-[#2d251e] my-1">{calculateIngredient(ing.ratio)} <span className="text-xs font-bold text-gray-500">kg/lít</span></p>
                            <div className="flex justify-between items-center mt-1.5 text-[8px] font-bold text-[#8c7d70] uppercase">
                              <span>Định mức</span>
                              <span className="bg-[#fcf8f2] border border-[#e7e3d4] px-1.5 py-0.5 rounded text-[#10b981]">{ing.ratio * 1000}g-ml/bé</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Right: Nutrition Balancing */}
                    <div className="bg-[#fcf8f2] border border-[#e7e3d4] p-5 rounded-2xl flex flex-col justify-between shadow-inner">
                      <div>
                        <div className="flex justify-between items-center border-b border-[#e7e3d4] pb-2 mb-3">
                          <span className="text-[10px] font-bold text-[#8c7d70] uppercase tracking-wider">Hàm lượng dinh dưỡng / Suất</span>
                          <span className="inline-flex items-center px-2 py-0.5 bg-green-100 text-green-800 text-[9px] font-bold rounded-full border border-green-200 uppercase tracking-wider">Đạt chuẩn Bộ GD</span>
                        </div>

                        {portionGroup === 'mau_giao' ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-black text-[#2d251e]">480 <span className="text-xs font-bold text-[#8c7d70]">Kcal</span></span>
                              <span className="text-[10px] text-gray-400 font-bold">Chuẩn: 450-550 Kcal</span>
                            </div>
                            
                            {/* Protid - Glucid - Lipid shares */}
                            <div className="space-y-2 pt-2">
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-[#5c4f43]">
                                  <span>Đạm (Protid): 14%</span>
                                  <span>16.8g</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="bg-[#f59e0b] h-full" style={{ width: '14%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-[#5c4f43]">
                                  <span>Béo (Lipid): 26%</span>
                                  <span>13.8g</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="bg-[#10b981] h-full" style={{ width: '26%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-[#5c4f43]">
                                  <span>Đường (Glucid): 60%</span>
                                  <span>72.0g</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="bg-[#2c5ea0] h-full" style={{ width: '60%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-black text-[#2d251e]">365 <span className="text-xs font-bold text-[#8c7d70]">Kcal</span></span>
                              <span className="text-[10px] text-gray-400 font-bold">Chuẩn: 340-400 Kcal</span>
                            </div>
                            
                            {/* Protid - Glucid - Lipid shares */}
                            <div className="space-y-2 pt-2">
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-[#5c4f43]">
                                  <span>Đạm (Protid): 15%</span>
                                  <span>13.7g</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="bg-[#f59e0b] h-full" style={{ width: '15%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-[#5c4f43]">
                                  <span>Béo (Lipid): 30%</span>
                                  <span>12.2g</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="bg-[#10b981] h-full" style={{ width: '30%' }}></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between text-[10px] font-bold text-[#5c4f43]">
                                  <span>Đường (Glucid): 55%</span>
                                  <span>50.2g</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div className="bg-[#2c5ea0] h-full" style={{ width: '55%' }}></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] text-[#8c7d70] font-bold text-center mt-3 border-t border-dashed border-[#e7e3d4] pt-2">
                        Tỉ lệ lý tưởng: Đạm (12-15%) • Béo (20-30%) • Đường (55-65%)
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 3: SAFETY & ARCHIVING */}
            {activeTab === 'atvstp' && (
              <div className="space-y-6">
                
                {/* 3-step checklist */}
                <div className="border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc] space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Kiểm Thực 3 Bước Điện Tử</h4>
                    <p className="text-xs text-[#7b8a9e] font-bold">Lưu vết số liệu kiểm định đảm bảo an toàn vệ sinh thực phẩm</p>
                  </div>

                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-[#2c5ea0] uppercase tracking-wider">Bước 1: Trước Chế Biến</span>
                      {atvstpStep1.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            const updated = [...atvstpStep1];
                            updated[idx].checked = !updated[idx].checked;
                            setAtvstpStep1(updated);
                          }}
                          className={`w-full p-3 rounded-xl border transition text-left flex items-center justify-between gap-3 ${
                            item.checked ? 'bg-green-50 border-green-300 text-green-800 font-bold' : 'bg-white border-[#b8c6d9] text-[#1e2a3a] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xs font-bold">{item.label}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            item.checked ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-[#b8c6d9]'
                          }`}>
                            {item.checked && <Check className="w-3 h-3" />}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-[#2c5ea0] uppercase tracking-wider">Bước 2: Trong Chế Biến</span>
                      {atvstpStep2.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            const updated = [...atvstpStep2];
                            updated[idx].checked = !updated[idx].checked;
                            setAtvstpStep2(updated);
                          }}
                          className={`w-full p-3 rounded-xl border transition text-left flex items-center justify-between gap-3 ${
                            item.checked ? 'bg-green-50 border-green-300 text-green-800 font-bold' : 'bg-white border-[#b8c6d9] text-[#1e2a3a] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xs font-bold">{item.label}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            item.checked ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-[#b8c6d9]'
                          }`}>
                            {item.checked && <Check className="w-3 h-3" />}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-2 pt-2">
                      <span className="text-xs font-bold text-[#2c5ea0] uppercase tracking-wider">Bước 3: Trước Khi Ăn</span>
                      {atvstpStep3.map((item, idx) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            const updated = [...atvstpStep3];
                            updated[idx].checked = !updated[idx].checked;
                            setAtvstpStep3(updated);
                          }}
                          className={`w-full p-3 rounded-xl border transition text-left flex items-center justify-between gap-3 ${
                            item.checked ? 'bg-green-50 border-green-300 text-green-800 font-bold' : 'bg-white border-[#b8c6d9] text-[#1e2a3a] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xs font-bold">{item.label}</span>
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            item.checked ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-[#b8c6d9]'
                          }`}>
                            {item.checked && <Check className="w-3 h-3" />}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Signature block */}
                  <div className="pt-4 border-t border-[#b8c6d9] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#b8c6d9] flex items-center justify-center font-black text-[#2c5ea0]">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[#7b8a9e] uppercase">Bếp Trưởng Xác Nhận</p>
                        <p className="text-sm font-bold text-[#1e2a3a]">{chefSignature || 'Chờ ký điện tử'}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      {!chefSignature && (
                        <button
                          onClick={startSigning}
                          className="px-4 py-2 bg-[#2c5ea0] text-white hover:bg-blue-800 rounded-xl font-bold text-xs uppercase tracking-wider select-none flex-1 sm:flex-initial text-center"
                        >
                          Ký Tên Số Hóa
                        </button>
                      )}
                      <button
                        onClick={handleSaveATVSTPDoc}
                        className="px-5 py-2.5 bg-[#1e2a3a] text-white hover:bg-black rounded-xl font-bold text-xs uppercase tracking-wider select-none flex-1 sm:flex-initial text-center"
                      >
                        Lưu Biên Bản Kiểm Thực
                      </button>
                    </div>
                  </div>
                </div>

                {/* Archive food samples */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Add Sample Form */}
                  <div className="md:col-span-1 border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc] h-fit">
                    <div className="border-b border-[#b8c6d9] pb-2 mb-4">
                      <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Lưu Mẫu Thức Ăn 24H</h4>
                    </div>
                    <form onSubmit={handleAddSample} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Món ăn lưu mẫu *</label>
                        <input
                          type="text"
                          value={sampleForm.mealName}
                          onChange={e => setSampleForm(prev => ({ ...prev, mealName: e.target.value }))}
                          className="w-full px-3 py-2 bg-white border border-[#b8c6d9] focus:outline-none focus:border-[#2c5ea0] rounded-xl text-xs font-bold text-[#1e2a3a]"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Trọng lượng *</label>
                          <input
                            type="text"
                            value={sampleForm.weight}
                            className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#4a5568] uppercase tracking-widest mb-1">Giờ lưu *</label>
                          <input
                            type="time"
                            value={sampleForm.sealTime}
                            onChange={e => setSampleForm(prev => ({ ...prev, sealTime: e.target.value }))}
                            className="w-full px-3 py-2 bg-white border border-[#b8c6d9] rounded-xl text-xs font-bold text-[#1e2a3a]"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#2c5ea0] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-blue-800 transition"
                      >
                        Lưu Mẫu Niêm Phong
                      </button>
                    </form>
                  </div>

                  {/* Active Samples List */}
                  <div className="md:col-span-2 border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc]">
                    <div className="border-b border-[#b8c6d9] pb-2 mb-4">
                      <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Hộp Mẫu Đang Giám Sát</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeSamples.map(sample => {
                        const isExpired = sample.secondsLeft <= 0;
                        const progressPercent = Math.min(100, Math.round((sample.secondsLeft / (24 * 3600)) * 100));
                        return (
                          <div key={sample.id} className="p-3 bg-white border border-[#b8c6d9] rounded-xl space-y-2 shadow-sm">
                            <div className="flex justify-between items-center">
                              <span className="px-2 py-0.5 bg-[#e8eef6] text-[#2c5ea0] text-[8px] font-black rounded-md">{sample.id}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${
                                isExpired ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'
                              }`}>
                                {isExpired ? 'Đủ 24h - Cho phép hủy' : 'Đang giám sát'}
                              </span>
                            </div>
                            <h5 className="font-bold text-xs text-[#1e2a3a] truncate">{sample.meal}</h5>
                            
                            <div className="space-y-1">
                              <div className="flex justify-between text-[9px] font-bold text-gray-500">
                                <span>Đếm ngược hủy:</span>
                                <span className={isExpired ? 'text-green-700 font-black' : 'text-orange-700 font-black'}>
                                  {formatTimer(sample.secondsLeft)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${isExpired ? 'bg-green-600' : 'bg-[#2c5ea0]'}`} 
                                  style={{ width: `${isExpired ? 100 : progressPercent}%` }}
                                ></div>
                              </div>
                            </div>

                            <p className="text-[8px] font-bold text-gray-400 uppercase">
                              Người lưu: {sample.sampler} • {sample.time}
                            </p>

                            {isExpired && (
                              <button
                                onClick={() => {
                                  setActiveSamples(prev => prev.filter(s => s.id !== sample.id));
                                  showToast(`🗑️ Đã hủy và làm sạch hộp mẫu lưu: ${sample.meal}`);
                                }}
                                className="w-full py-1 bg-green-600 text-white rounded text-[9px] font-bold uppercase tracking-wider text-center select-none hover:bg-green-700"
                              >
                                Hủy & Làm sạch hộp
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 4: SHIFTS & CLOSING */}
            {activeTab === 'closing' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Shifts Column */}
                <div className="border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc] h-fit">
                  <div className="border-b border-[#b8c6d9] pb-2 mb-4">
                    <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Phân Công Trực Nhật Hôm Nay</h4>
                  </div>
                  <div className="space-y-3">
                    {staffShifts.map((staff, idx) => (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          staff.checkedIn ? 'bg-white border-green-300' : 'bg-white border-gray-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-xs ${
                            staff.checkedIn ? 'bg-[#2c5ea0] text-white' : 'bg-gray-300 text-gray-500'
                          }`}>
                            {staff.avatar}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-[#1e2a3a]">{staff.name}</h5>
                            <p className="text-[9px] text-[#7b8a9e] font-bold">{staff.role}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleShiftCheckIn(idx)}
                          className={`px-2.5 py-1 rounded-lg text-[9px] font-black border transition ${
                            staff.checkedIn 
                              ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100' 
                              : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                          }`}
                        >
                          {staff.checkedIn ? 'Có mặt' : 'Báo vắng'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Closing checklist */}
                <div className="lg:col-span-2 border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc] space-y-6">
                  <div>
                    <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Checklist Đóng Ca & Phòng Chống Cháy Nổ</h4>
                    <p className="text-xs text-[#7b8a9e] font-bold">Các đầu việc bắt buộc hoàn thành để đảm bảo an toàn PCCC nhà bếp trước khi ra về</p>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white p-4 rounded-xl border border-[#b8c6d9] space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-[#1e2a3a]">
                      <span>Tiến độ kiểm tra đóng ca:</span>
                      <span className={closingProgress === 100 ? 'text-green-700 font-black' : 'text-[#2c5ea0] font-black'}>
                        {closingProgress}% Hoàn thành
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${closingProgress === 100 ? 'bg-green-600' : 'bg-[#2c5ea0]'}`} 
                        style={{ width: `${closingProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {closingChecklist.map((item, idx) => (
                      <button
                        key={item.id}
                        onClick={() => toggleClosingItem(idx)}
                        className={`w-full p-4 rounded-xl border transition text-left flex items-center justify-between gap-4 ${
                          item.checked 
                            ? 'bg-green-50/50 border-green-400 text-green-900 font-bold' 
                            : 'bg-white border-[#b8c6d9] text-[#1e2a3a] hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xs font-bold">{item.label}</span>
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          item.checked ? 'bg-green-600 border-green-600 text-white' : 'bg-white border-[#b8c6d9]'
                        }`}>
                          {item.checked && <Check className="w-3 h-3" />}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-[#b8c6d9]">
                    <button
                      onClick={handleSendClosingReport}
                      disabled={closingProgress !== 100}
                      className={`px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition ${
                        closingProgress === 100
                          ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer active:scale-95'
                          : 'bg-gray-300 text-gray-400 border border-gray-200 cursor-not-allowed'
                      }`}
                    >
                      Báo Cáo Hoàn Thành Đóng Ca An Toàn
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 5: COMMUNICATION & WASTE */}
            {activeTab === 'communication' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Status buttons */}
                <div className="border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc] space-y-4 h-fit">
                  <div className="border-b border-[#b8c6d9] pb-2">
                    <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Truyền Tin Trạng Thái Bếp</h4>
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { id: 'preparing', label: '🥣 Báo: Đang sơ chế nguyên liệu', color: 'bg-white text-[#2c5ea0] border-[#b8c6d9]' },
                      { id: 'cooking', label: '🍳 Báo: Bếp đang đỏ lửa nấu', color: 'bg-white text-[#2c5ea0] border-[#b8c6d9]' },
                      { id: 'ready', label: '🚚 Báo: Sẵn sàng phục vụ khay cơm', color: 'bg-white text-orange-700 border-orange-300 font-black animate-pulse' },
                      { id: 'completed', label: '✅ Báo: Đã hoàn thành bữa ăn', color: 'bg-white text-green-700 border-green-300' }
                    ].map(btn => (
                      <button
                        key={btn.id}
                        onClick={() => handleBroadcastStatus(btn.id as any)}
                        className={`py-3 px-4 rounded-xl border text-left text-xs font-bold uppercase tracking-wider transition select-none flex items-center justify-between ${btn.color} ${
                          kitchenStatus === btn.id ? 'ring-2 ring-[#2c5ea0] shadow-md bg-[#e8eef6]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span>{btn.label}</span>
                        {kitchenStatus === btn.id && <Check className="w-4 h-4 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leftover Keypad */}
                <div className="lg:col-span-2 border border-[#b8c6d9] rounded-2xl p-5 bg-[#f5f8fc] space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-wider">Ghi Nhận Thức Ăn Thừa Cuối Bữa</h4>
                    <p className="text-xs text-[#7b8a9e] font-bold">Lưu chỉ số hao hụt thừa để kiểm soát chất lượng ăn uống và định lượng kho</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Inputs */}
                    <div className="space-y-3">
                      {[
                        { id: 'rice', label: 'Cơm trắng thừa (kg)' },
                        { id: 'meat', label: 'Thức ăn mặn thừa (kg)' },
                        { id: 'soup', label: 'Canh rau thừa (kg)' }
                      ].map(fld => (
                        <button
                          key={fld.id}
                          type="button"
                          onClick={() => setKeypadTarget(fld.id as any)}
                          className={`w-full p-3 rounded-xl border text-left transition ${
                            keypadTarget === fld.id 
                              ? 'border-[#2c5ea0] bg-[#e8eef6]/30 shadow-inner font-bold' 
                              : 'bg-white border-[#b8c6d9] hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-[10px] font-bold text-[#7b8a9e] uppercase block">{fld.label}</span>
                          <div className="flex justify-between items-baseline mt-1">
                            <span className="text-xl font-black text-[#1e2a3a]">
                              {(wasteValues as any)[fld.id] || '0.0'}
                            </span>
                            <span className="text-xs font-bold text-gray-400">kg</span>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={handleSaveWasteReport}
                        className="w-full py-3 bg-[#1e2a3a] text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-black transition text-center"
                      >
                        Gửi Báo Cáo Hao Hụt
                      </button>
                    </div>

                    {/* Keypad Grid */}
                    <div className="bg-white border border-[#b8c6d9] p-3 rounded-xl flex flex-col justify-between">
                      <p className="text-[8px] font-bold text-gray-400 uppercase text-center mb-1">Bàn phím cảm ứng</p>
                      <div className="grid grid-cols-3 gap-1.5 flex-1">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'C'].map(char => (
                          <button
                            key={char}
                            type="button"
                            onClick={() => handleKeypress(char)}
                            disabled={!keypadTarget}
                            className={`py-3 text-sm font-black rounded-lg border transition select-none flex items-center justify-center ${
                              !keypadTarget 
                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' 
                                : char === 'C' 
                                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' 
                                  : 'bg-[#f5f8fc] text-[#1e2a3a] border-[#b8c6d9] hover:bg-[#e8eef6] active:bg-blue-100'
                            }`}
                          >
                            {char}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* TAB 6: ROOMS Attendance */}
            {activeTab === 'rooms' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {rooms.map(room => (
                  <div key={room.id} className="border border-[#b8c6d9] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between bg-[#f5f8fc]">
                    
                    {/* Room Header */}
                    <div className="bg-[#e8eef6] p-4 border-b border-[#b8c6d9] flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 bg-white border border-[#b8c6d9] rounded-xl flex items-center justify-center font-black text-[#1e2a3a] text-base shadow-sm">
                          {room.id}
                        </span>
                        <div>
                          <h5 className="font-bold text-sm text-[#1e2a3a]">{room.name}</h5>
                          <p className="text-[9px] font-bold text-gray-500 uppercase">Giám thị: {room.supervisor}</p>
                        </div>
                      </div>
                    </div>

                    {/* Counters */}
                    <div className="p-4 grid grid-cols-3 divide-x divide-[#b8c6d9] text-center bg-white">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase mb-0.5">Giường ngủ</p>
                        <p className="text-xl font-black text-[#1e2a3a]">{room.current} / {room.capacity}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-green-700 uppercase mb-0.5">Có mặt</p>
                        <p className="text-xl font-black text-green-700">{room.present}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-red-700 uppercase mb-0.5">Vắng</p>
                        <p className={`text-xl font-black ${room.absent > 0 ? 'text-red-700' : 'text-gray-400'}`}>
                          {room.absent}
                        </p>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="p-3 bg-[#f5f8fc] border-t border-[#b8c6d9] flex gap-2">
                      <button
                        onClick={() => handleQuickRoomCheckIn(room.id, true)}
                        className="flex-1 py-2 bg-white hover:bg-green-50 text-green-700 border border-green-200 font-bold text-xs uppercase tracking-wider rounded-lg text-center select-none active:scale-97 transition shadow-sm"
                      >
                        + 1 Có Mặt
                      </button>
                      <button
                        onClick={() => handleQuickRoomCheckIn(room.id, false)}
                        className="flex-1 py-2 bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-xs uppercase tracking-wider rounded-lg text-center select-none active:scale-97 transition shadow-sm"
                      >
                        - 1 Có Mặt
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* 1. PRINT SPECIAL DIET LABEL MODAL */}
      {printedLabel && (
        <ModalBase 
          isOpen={!!printedLabel} 
          onClose={() => setPrintedLabel(null)} 
          title="In Nhãn Decal Khay Ăn Đặc Biệt" 
          subtitle="Suất ăn riêng được dán định vị nhãn cảnh báo"
          width="max-w-md"
          centerY
        >
          <div className="p-6 space-y-6">
            <div className="border-4 border-double border-red-500 p-6 bg-white rounded-2xl text-center space-y-3 font-sans relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-red-600 text-white flex items-center justify-center font-black text-[10px] rotate-45 translate-x-7 -translate-y-7 uppercase">
                DỊ ỨNG
              </div>

              <p className="font-black text-[#1e2a3a] text-sm uppercase border-b border-black pb-2">MẦM NON AN HỮU • KHU BÁN TRÚ</p>
              
              <div className="space-y-1">
                <p className="text-[10px] text-[#7b8a9e] font-bold uppercase">Học sinh khay riêng</p>
                <h4 className="text-xl font-black text-red-600">{printedLabel.name}</h4>
                <p className="text-sm font-bold text-[#1e2a3a] bg-gray-100 py-1 px-4 rounded-lg inline-block">LỚP: {printedLabel.class}</p>
              </div>

              <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-left">
                <p className="text-[10px] font-black text-red-800 uppercase tracking-wide text-center mb-1">⚠️ CHỈ THỊ DỊ ỨNG & Y TẾ</p>
                <p className="text-sm font-bold text-red-900">{printedLabel.allergy}</p>
                <p className="text-xs text-gray-700 mt-1 pl-1 font-bold">Thay thế: {printedLabel.replacement}</p>
              </div>

              <div className="text-right text-[8px] font-bold text-gray-400 pt-2 border-t border-dashed border-gray-200">
                In lúc: {printedLabel.printDate} • {printedLabel.printTime}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setPrintedLabel(null)}
                className="px-4 py-2.5 border border-[#b8c6d9] hover:bg-[#e8eef6] rounded-xl text-xs font-bold uppercase tracking-wider text-[#4a5568] select-none"
              >
                Hủy In
              </button>
              <button
                onClick={() => {
                  alert("Dữ liệu đang được gửi tới máy in decal nhiệt tại khu vực dán nhãn khay ăn...");
                  setPrintedLabel(null);
                  showToast("🖨️ Đã gửi lệnh in decal nhãn khay ăn thành công.");
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider select-none text-center"
              >
                Gửi Lệnh In Nhãn
              </button>
            </div>
          </div>
        </ModalBase>
      )}

      {/* 2. ELECTRONIC SIGNATURE OVERLAY */}
      {isSigning && (
        <ModalBase 
          isOpen={isSigning} 
          onClose={() => setIsSigning(false)} 
          title="✍️ Ký Tên Xác Nhận Kiểm Thực" 
          subtitle="Tổ trưởng vẽ chữ ký điện tử trực tiếp trên màn hình"
          width="max-w-md"
          centerY
        >
          <div className="p-6 space-y-6">
            <div className="bg-[#f0f4fa] border border-[#b8c6d9] rounded-xl p-4 flex flex-col items-center justify-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Bảng vẽ chữ ký số hóa</p>
              <canvas 
                ref={signatureCanvasRef} 
                width={300} 
                height={120} 
                className="bg-white border border-[#b8c6d9] rounded-xl cursor-pointer shadow-inner"
              />
              <p className="text-[9px] text-[#7b8a9e] font-bold mt-2">Đang tự động hóa vẽ nháp nét ký Trưởng Bếp: Nguyễn Văn Tài...</p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsSigning(false)}
                className="px-4 py-2.5 border border-[#b8c6d9] hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-600"
              >
                Xóa chữ ký
              </button>
              <button
                onClick={saveSignature}
                className="px-5 py-2.5 bg-[#2c5ea0] text-white hover:bg-blue-800 rounded-xl font-black text-xs uppercase tracking-widest select-none text-center"
              >
                Chấp Nhận Chữ Ký
              </button>
            </div>
          </div>
        </ModalBase>
      )}

      {/* 3. BROADCAST PUSH NOTIFICATION SIMULATION */}
      {broadcastModal && (
        <ModalBase
          isOpen={broadcastModal}
          onClose={() => setBroadcastModal(false)}
          title="Truyền Tin Trạng Thái Bếp Ăn"
          subtitle="Hệ thống thông báo đẩy thông minh của nhà trường"
          width="max-w-md"
          centerY
        >
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 border border-green-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-base font-black text-[#1e2a3a] uppercase">ĐÃ PHÁT THÔNG BÁO THÀNH CÔNG!</h4>
              {kitchenStatus === 'preparing' && (
                <p className="text-xs text-[#4a5568] font-bold">
                  Báo cáo: <strong>Đang chuẩn bị & sơ chế thực phẩm</strong> đã được gửi tới BGH.
                </p>
              )}
              {kitchenStatus === 'cooking' && (
                <p className="text-xs text-[#4a5568] font-bold">
                  Báo cáo: <strong>Bếp đang đỏ lửa chế biến</strong> đã được cập nhật hệ thống.
                </p>
              )}
              {kitchenStatus === 'ready' && (
                <p className="text-xs text-[#4a5568] font-bold bg-teal-50 border border-teal-200 p-3 rounded-xl">
                  📢 Đã gửi tin nhắn đẩy tới <strong>15 Giáo viên chủ nhiệm & Bảo mẫu</strong>: <br />
                  <span className="text-teal-800 font-extrabold mt-1 block">"Cơm trưa đã sẵn sàng phục vụ! Đón học sinh xuống nhà ăn."</span>
                </p>
              )}
              {kitchenStatus === 'completed' && (
                <p className="text-xs text-[#4a5568] font-bold">
                  Báo cáo: <strong>Đã dọn dẹp & hoàn thành ca bếp</strong> đã được ghi nhận.
                </p>
              )}
            </div>

            <button
              onClick={() => setBroadcastModal(false)}
              className="w-full mt-4 py-2.5 bg-[#1e2a3a] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black select-none text-center"
            >
              Hoàn Tất & Đóng
            </button>
          </div>
        </ModalBase>
      )}

      {/* 4. INBOUND LOGS HISTORY MODAL */}
      {inboundHistoryModal && (
        <ModalBase
          isOpen={inboundHistoryModal}
          onClose={() => setInboundHistoryModal(false)}
          title="Lịch Sử Phiếu Nhập Kho & Giao Thực Phẩm"
          subtitle="Hồ sơ bàn giao phục vụ công tác thanh kiểm tra ATVSTP"
          width="max-w-4xl"
          fixedHeight
        >
          <div className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 bg-[#f5f8fc]">
            <div className="border border-[#b8c6d9] rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full border-collapse text-left text-xs font-sans">
                <thead>
                  <tr className="bg-[#e8eef6] border-b border-[#b8c6d9] font-bold text-[#1e2a3a] uppercase">
                    <th className="p-3">Mã phiếu</th>
                    <th className="p-3">Ngày giờ</th>
                    <th className="p-3">Nhà cung cấp</th>
                    <th className="p-3">Chi tiết mặt hàng</th>
                    <th className="p-3">Kiểm cảm quan</th>
                    <th className="p-3">Nhân sự nhận</th>
                    <th className="p-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee] font-medium text-[#1e2a3a]">
                  {inboundReceipts.map(rec => (
                    <tr key={rec.id} className="hover:bg-[#f5f8fc] transition">
                      <td className="p-3 font-mono font-black text-[#2c5ea0]">{rec.id}</td>
                      <td className="p-3 text-gray-500">{rec.date}</td>
                      <td className="p-3 font-bold">{rec.supplier}</td>
                      <td className="p-3">{rec.items}</td>
                      <td className="p-3 italic">"{rec.sensoryInspection}"</td>
                      <td className="p-3">{rec.inspector.replace('Trưởng Bếp: ', '')}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          rec.status.includes('Đạt') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {rec.status.replace(' (Nhập vào)', '')}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {inboundReceipts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400 font-bold uppercase">
                        Chưa có lịch sử nhập kho nào được ghi nhận.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t-[3px] border-double border-[#b8c6d9] bg-[#e8eef6] px-6 py-4 flex justify-end shrink-0 mt-auto">
            <button
              onClick={() => setInboundHistoryModal(false)}
              className="px-5 py-2 bg-[#1e2a3a] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black select-none text-center"
            >
              Đóng Phiếu Nhật Ký
            </button>
          </div>
        </ModalBase>
      )}

      {/* TOAST SYSTEM */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#1e2a3a] text-[#f5f8fc] border-2 border-[#2c5ea0] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
          <span className="text-sm font-bold tracking-wide">{toast}</span>
        </div>
      )}

    </main>
  );
};
