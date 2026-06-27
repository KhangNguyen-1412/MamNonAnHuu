import React, { useState, useEffect, useRef } from 'react';
import { BaseSelect } from '../ui/BaseInputs';
import { Panel } from '../layout/Panel';
import { LessonDetailModal } from '../ui/LessonDetailModal';
import { Filter, ChevronLeft, ChevronRight, ChevronDown, Printer, AlertTriangle, Check, X, Users, Loader2 } from 'lucide-react';
import { getTimetable, TimetableSlot, getClasses, ClassData, generateTimetable, getRooms, Room, getExamSchedule, generateExamSchedule, ExamSlot } from '../../services/dbService';
import { getStudents, Student } from '../../services/studentService';
import { getStaffList, Staff } from '../../services/hrService';
import { useUserRole } from '../../utils/role';

interface TimetablePanelProps {
  activeViewTab?: 'schedule' | 'exam';
}

export const TimetablePanel: React.FC<TimetablePanelProps> = ({ activeViewTab }) => {
  const [mainTab, setMainTab] = useState<'schedule' | 'exam'>(activeViewTab || 'schedule');
  const currentRole = useUserRole();

  useEffect(() => {
    if (activeViewTab) {
      setMainTab(activeViewTab);
    }
  }, [activeViewTab]);
  const [scheduleSubTab, setScheduleSubTab] = useState<'class' | 'teacher' | 'room'>('class');

  const view = mainTab === 'exam' ? 'exam' : scheduleSubTab;
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [examSlots, setExamSlots] = useState<ExamSlot[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('1A1');
  const [selectedGrade, setSelectedGrade] = useState<string>('Khối 1');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<ClassData[]>([]);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  const weekDropdownRef = useRef<HTMLDivElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExamCandidates, setSelectedExamCandidates] = useState<{ room: string; subject: string; list: Student[] } | null>(null);

  const handleSlotClick = (dayNum: number, periodNum: number) => {
    const slot = timetableSlots.find(s => 
      (s.semester ?? 1) === activeSemester &&
      s.day === dayNum &&
      s.period === periodNum &&
      (view === 'class' ? s.classId === selectedClass :
       view === 'teacher' ? s.teacher === selectedTeacher :
       s.room === selectedRoom)
    );
    if (slot) {
      setSelectedSlot(slot);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (weekDropdownRef.current && !weekDropdownRef.current.contains(event.target as Node)) {
        setIsWeekDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getWeekDateRange = (weekNum: number) => {
    const academicYearStr = typeof window !== 'undefined' && localStorage.getItem('active_academic_year_name')
      ? localStorage.getItem('active_academic_year_name')!
      : '2025 - 2026';
      
    let startYear = 2025;
    const match = academicYearStr.match(/(\d{4})/);
    if (match) {
      startYear = parseInt(match[1], 10);
    }
    
    const firstOfSept = new Date(startYear, 8, 1);
    let dayOfWeek = firstOfSept.getDay();
    let firstMondayOffset = 0;
    if (dayOfWeek !== 1) {
      firstMondayOffset = (8 - dayOfWeek) % 7;
    }
    
    const firstMonday = new Date(startYear, 8, 1 + firstMondayOffset);
    const startOfWeek = new Date(firstMonday.getTime() + (weekNum - 1) * 7 * 24 * 60 * 60 * 1000);
    const endOfWeek = new Date(startOfWeek.getTime() + 5 * 24 * 60 * 60 * 1000);
    
    const formatDate = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      return `${dd}/${mm}`;
    };
    
    return `${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}`;
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [cls, slots, rms, exams, stds, teachers] = await Promise.all([
          getClasses(),
          getTimetable(),
          getRooms(),
          getExamSchedule(),
          getStudents(),
          getStaffList()
        ]);
        setClassesList(cls);
        setTimetableSlots(slots);
        setRoomsList(rms);
        setExamSlots(exams);
        setStudents(stds);
        setStaffList(teachers);

        // Set default room
        const learningRooms = rms.filter(r => 
          r.type === 'Lớp Học Chuẩn' || 
          r.type === 'Phòng Máy Tính' || 
          r.type === 'Phòng TB Lý/Hóa/Sinh' ||
          r.type === 'Chuyên Đề Lý/Hóa' ||
          r.type === 'Phòng học chuẩn' ||
          r.type === 'Phòng học lý thuyết' ||
          r.type === 'Phòng học lý thuyết (Phòng học cơ bản)' ||
          r.type === 'Phòng máy tính (Tin học)' ||
          r.type === 'Phòng Ngoại ngữ (Lab)' ||
          r.type === 'Phòng Âm nhạc và Mỹ thuật'
        );
        if (learningRooms.length > 0) {
          setSelectedRoom(learningRooms[0].name);
        }
      } catch (err) {
        console.error("Failed to load initial data for timetable:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (view === 'room') {
      const learningRooms = roomsList.filter(r => 
        r.type === 'Lớp Học Chuẩn' || 
        r.type === 'Phòng Máy Tính' || 
        r.type === 'Phòng TB Lý/Hóa/Sinh' ||
        r.type === 'Chuyên Đề Lý/Hóa' ||
        r.type === 'Phòng học chuẩn' ||
        r.type === 'Phòng học lý thuyết' ||
        r.type === 'Phòng học lý thuyết (Phòng học cơ bản)' ||
        r.type === 'Phòng máy tính (Tin học)' ||
        r.type === 'Phòng Ngoại ngữ (Lab)' ||
        r.type === 'Phòng Âm nhạc và Mỹ thuật'
      );
      if (learningRooms.length > 0 && !learningRooms.some(r => r.name === selectedRoom)) {
        setSelectedRoom(learningRooms[0].name);
      }
    }
  }, [view, roomsList]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getGradeNumber = (gradeStr: string) => {
    return parseInt(gradeStr.replace('Khối ', ''), 10) || 1;
  };

  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    const gradeNum = parseInt(grade.replace('Khối ', ''), 10) || 1;
    const filtered = classesList.filter(c => c.grade === gradeNum);
    if (filtered.length > 0) {
      setSelectedClass(filtered[0].name);
    } else {
      setSelectedClass(`${gradeNum}A1`);
    }
  };

  const getClassOptions = () => {
    const gradeNum = getGradeNumber(selectedGrade);
    const filtered = classesList.filter(c => c.grade === gradeNum);
    if (filtered.length === 0) {
      if (selectedGrade === 'Khối 1') {
        return [
          { value: '1A1', label: '1A1' },
          { value: '1A2', label: '1A2' }
        ];
      } else if (selectedGrade === 'Khối 2') {
        return [{ value: '2A1', label: '2A1' }];
      } else {
        return [{ value: '5A1', label: '5A1' }];
      }
    }
    return filtered.map(c => ({
      value: c.name,
      label: `${c.name} (${c.room || 'Chưa xếp phòng'})`
    }));
  };

  useEffect(() => {
    if (classesList.length > 0) {
      const gradeNum = getGradeNumber(selectedGrade);
      const filtered = classesList.filter(c => c.grade === gradeNum);
      if (filtered.length > 0 && !filtered.some(c => c.name === selectedClass)) {
        setSelectedClass(filtered[0].name);
      }
    }
  }, [classesList, selectedGrade]);

  useEffect(() => {
    if (timetableSlots.length > 0 && !selectedTeacher) {
      const teachersList = Array.from(new Set(timetableSlots.map(slot => slot.teacher).filter(t => t && t !== 'BGH')));
      if (teachersList.length > 0) {
        setSelectedTeacher(teachersList[0]);
      }
    }
  }, [timetableSlots, selectedTeacher]);

  const handleAutoGenerate = async () => {
    setLoading(true);
    setIsConfirmOpen(false);
    try {
      await generateTimetable();
      const slots = await getTimetable();
      setTimetableSlots(slots);
      showToast("✨ Tự động tạo thời khóa biểu toàn trường thành công!");
    } catch (err) {
      console.error("Auto generate failed:", err);
      showToast("❌ Lỗi tự động tạo thời khóa biểu!");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateExams = async () => {
    setLoading(true);
    try {
      const sem = selectedWeek <= 18 ? 1 : 2;
      await generateExamSchedule(sem);
      const exams = await getExamSchedule();
      setExamSlots(exams);
      showToast(`✨ Xếp lịch thi tự động cho Học Kỳ ${sem === 1 ? 'I' : 'II'} thành công!`);
    } catch (err) {
      console.error("Failed to generate exam schedule:", err);
      showToast("❌ Lỗi xếp lịch thi tự động!");
    } finally {
      setLoading(false);
    }
  };

  const getPreschoolBlockInfo = (p: number) => {
    switch (p) {
      case 1: return { time: '07:30 - 08:30', name: 'Đón trẻ & Thể dục sáng' };
      case 2: return { time: '08:30 - 09:30', name: 'Hoạt động học' };
      case 3: return { time: '09:30 - 10:30', name: 'Chơi ngoài trời' };
      case 4: return { time: '10:30 - 11:30', name: 'Vệ sinh & Ăn trưa' };
      case 5: return { time: '11:30 - 14:00', name: 'Ngủ trưa' };
      case 6: return { time: '14:00 - 14:30', name: 'Ăn xế & Vận động' };
      case 7: return { time: '14:30 - 16:30', name: 'Trả trẻ & SH chiều' };
      default: return { time: '', name: '' };
    }
  };

  const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  const scheduleClass: Record<number, Record<number, { subject: string, teacher: string, room?: string }>> = {};
  for (let d = 1; d <= 5; d++) {
    scheduleClass[d] = {};
    for (let p = 1; p <= 7; p++) {
      scheduleClass[d][p] = { subject: '', teacher: '', room: '' };
    }
  }

  const activeSemester = selectedWeek <= 18 ? 1 : 2;

  const filteredSlots = (
    view === 'class' 
      ? timetableSlots.filter(slot => slot.classId === selectedClass)
      : view === 'teacher'
      ? timetableSlots.filter(slot => slot.teacher === selectedTeacher)
      : timetableSlots.filter(slot => slot.room === selectedRoom)
  ).filter(slot => (slot.semester ?? 1) === activeSemester);

  filteredSlots.forEach(slot => {
    if (scheduleClass[slot.day] && scheduleClass[slot.day][slot.period]) {
      scheduleClass[slot.day][slot.period] = {
        subject: slot.subject,
        teacher: view === 'room'
          ? `Lớp: ${slot.classId} • GV: ${slot.teacher}`
          : (view === 'class' ? slot.teacher : `Lớp: ${slot.classId}`),
        room: slot.room
      };
    }
  });

  const currentClassObj = classesList.find(c => c.name === selectedClass);
  const homeroomTeacher = currentClassObj ? currentClassObj.teacher : 'Chưa phân công';

  const currentTeacherObj = staffList.find(s => s.name === selectedTeacher);
  const teacherMajor = currentTeacherObj ? (currentTeacherObj.major || 'Sư phạm Giáo dục Mầm non') : '';

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showToast("❌ Không thể mở cửa sổ in! Vui lòng cho phép pop-up.");
      return;
    }

    const titleText = view === 'class' 
      ? `THỜI KHÓA BIỂU LỚP ${selectedClass}` 
      : `LỊCH GIẢNG DẠY - GIÁO VIÊN ${selectedTeacher}`;

    const subtitleText = view === 'class'
      ? `Giáo viên chủ nhiệm: ${homeroomTeacher}`
      : `Chuyên ngành đào tạo: ${teacherMajor || 'Sư phạm Giáo dục Mầm non'}`;

    const academicYearStr = typeof window !== 'undefined' && localStorage.getItem('active_academic_year_name')
      ? localStorage.getItem('active_academic_year_name')!
      : '2025 - 2026';

    const semesterStr = activeSemester === 1 ? 'HỌC KỲ I' : 'HỌC KỲ II';
    const weekStr = `Tuần ${selectedWeek} (${getWeekDateRange(selectedWeek)})`;

    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th style="width: 50px;">Buổi</th>
            <th style="width: 150px;">Thời Gian Hàng Ngày</th>
            ${days.map(d => `<th>${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
    `;

    periods.forEach(period => {
      tableHtml += `<tr>`;
      if (period === 1) {
        tableHtml += `<td rowspan="4" class="session-cell"><b>BUỔI SÁNG</b></td>`;
      } else if (period === 5) {
        tableHtml += `<td rowspan="3" class="session-cell"><b>BUỔI CHIỀU</b></td>`;
      }

      const block = getPreschoolBlockInfo(period);
      tableHtml += `<td class="period-cell" style="font-size: 10px; line-height: 1.3; text-align: center;"><b>${block.time}</b><div style="font-size: 8px; color: #555; font-weight: 500; margin-top: 2px;">${block.name}</div></td>`;

      days.forEach((day, dayIdx) => {
        const isSaturdayAfternoon = dayIdx === 5 && period >= 5;
        if (isSaturdayAfternoon) {
          tableHtml += `<td class="empty-cell">Nghỉ</td>`;
        } else {
          const entry = scheduleClass[dayIdx + 1]?.[period];
          if (entry && entry.subject) {
            const subjectClass = entry.subject.includes('Toán') ? 'slot-toan' :
                                 entry.subject.includes('Sinh hoạt dưới cờ') ? 'slot-chaoco' :
                                 entry.subject.includes('Giáo dục địa phương') ? 'slot-diaphuong' :
                                 entry.subject.includes('Hoạt động trải nghiệm') ? 'slot-trainghiem' :
                                 (['âm nhạc', 'mỹ thuật', 'nghệ thuật'].some(k => entry.subject.toLowerCase().includes(k))) ? 'slot-nghethuat' :
                                 'slot-default';
            const roomInfo = entry.room ? `<div class="room-label">📍 ${entry.room}</div>` : '';
            tableHtml += `
              <td class="slot-cell">
                <div class="slot-card ${subjectClass}">
                  <div class="slot-subject">${entry.subject}</div>
                  <div class="slot-teacher">${entry.teacher}</div>
                  ${roomInfo}
                </div>
              </td>
            `;
          } else {
            tableHtml += `<td class="empty-cell">-</td>`;
          }
        }
      });

      tableHtml += `</tr>`;
    });

    tableHtml += `
        </tbody>
      </table>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${titleText}</title>
        <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500;700&family=Playfair+Display:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: landscape;
            margin: 10mm;
          }
          body {
            font-family: 'Lora', serif;
            background-color: #f5f8fc;
            color: #1e2a3a;
            margin: 0;
            padding: 10px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-border {
            border: 3px double #b8c6d9;
            padding: 20px;
            min-height: calc(100vh - 26px);
            box-sizing: border-box;
            background-color: #f5f8fc;
          }
          .top-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 20px;
            font-size: 11px;
            font-weight: 700;
            color: #4a5568;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .top-left {
            text-align: center;
            line-height: 1.6;
          }
          .top-left-sub {
            border-bottom: 1px solid #b8c6d9;
            padding-bottom: 3px;
            margin-bottom: 3px;
          }
          .top-right {
            text-align: center;
            line-height: 1.6;
          }
          .top-right-sub {
            border-bottom: 1px solid #b8c6d9;
            padding-bottom: 3px;
            margin-bottom: 3px;
            letter-spacing: 1px;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
          }
          .main-title {
            font-family: 'Playfair Display', serif;
            font-size: 30px;
            font-weight: 800;
            text-transform: uppercase;
            margin: 15px 0 5px 0;
            color: #1e2a3a;
            letter-spacing: 2px;
          }
          .meta-info {
            font-size: 15px;
            font-weight: 600;
            color: #2c5ea0;
            margin: 5px 0;
            font-style: italic;
          }
          .meta-grid {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin-top: 15px;
          }
          .meta-item {
            background-color: #e8eef6;
            padding: 6px 18px;
            border: 1px solid #b8c6d9;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 4px;
            margin-bottom: 30px;
          }
          th {
            border: 1px solid #b8c6d9;
            background-color: #e8eef6;
            color: #1e2a3a;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            padding: 10px 4px;
            border-radius: 8px;
          }
          td {
            border: 1px solid #d4dde9;
            padding: 3px;
            text-align: center;
            vertical-align: middle;
            border-radius: 8px;
          }
          .session-cell {
            background-color: #e8eef6;
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 2px;
            color: #2c5ea0;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            transform: rotate(180deg);
            padding: 15px 4px;
            border: 1px solid #b8c6d9;
          }
          .period-cell {
            background-color: #f0f4fa;
            font-size: 13px;
            font-weight: bold;
            border: 1px solid #b8c6d9;
          }
          .empty-cell {
            color: #a3b3c8;
            font-style: italic;
            font-size: 10px;
            background-color: #fbfbf9;
            border: 1px dashed #d4dde9;
          }
          .slot-cell {
            padding: 2px;
            background-color: transparent;
          }
          .slot-card {
            padding: 10px 4px;
            border-radius: 8px;
            border: 1px solid #b8c6d9;
            box-shadow: 1px 1px 2px rgba(0,0,0,0.03);
            min-height: 70px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            box-sizing: border-box;
          }
          .slot-toan {
            background-color: #e2ede5 !important;
            border-left: 5px solid #2e6b8a !important;
          }
          .slot-chaoco {
            background-color: #fde8e8 !important;
            border-left: 5px solid #991b1b !important;
          }
          .slot-diaphuong {
            background-color: #fefcd0 !important;
            border-left: 5px solid #a16207 !important;
          }
          .slot-trainghiem {
            background-color: #f3e8f4 !important;
            border-left: 5px solid #2c5ea0 !important;
          }
          .slot-nghethuat {
            background-color: #f3e8ff !important;
            border-left: 5px solid #7e22ce !important;
          }
          .slot-default {
            background-color: #ffffff !important;
            border-left: 5px solid #7b8a9e !important;
          }
          .slot-subject {
            font-family: 'Playfair Display', serif;
            font-size: 13px;
            font-weight: 800;
            color: #1e2a3a;
            text-transform: uppercase;
            line-height: 1.25;
            letter-spacing: 0.25px;
          }
          .slot-teacher {
            font-size: 9px;
            color: #4a5568;
            font-weight: bold;
            margin-top: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .room-label {
            font-size: 9px;
            color: #2c5ea0;
            font-weight: bold;
            margin-top: 5px;
            background: #e8eef6;
            padding: 2px 7px;
            border: 1px solid #b8c6d9;
            border-radius: 4px;
            display: inline-block;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 35px;
            padding: 0 60px;
          }
          .signature-box {
            text-align: center;
            width: 220px;
          }
          .sig-title {
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 55px;
            color: #1e2a3a;
            letter-spacing: 0.5px;
          }
          .sig-name {
            font-weight: bold;
            font-size: 12px;
            color: #4a5568;
            border-top: 1px dashed #b8c6d9;
            padding-top: 6px;
          }
        </style>
      </head>
      <body>
        <div class="page-border">
          <div class="top-section">
            <div class="top-left">
              <div class="top-left-sub">SỞ GD&ĐT TỈNH ĐỒNG THÁP</div>
              <div><b>TRƯỜNG MẦM NON AN HỮU</b></div>
            </div>
            <div class="top-right">
              <div class="top-right-sub"><b>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</b></div>
              <div>Độc lập - Tự do - Hạnh phúc</div>
            </div>
          </div>

          <div class="header">
            <div class="main-title">${titleText}</div>
            <div class="meta-info">${subtitleText}</div>
            <div class="meta-grid">
              <span class="meta-item">Năm học: ${academicYearStr}</span>
              <span class="meta-item">${semesterStr}</span>
              <span class="meta-item">${weekStr}</span>
            </div>
          </div>

          ${tableHtml}

          <div class="signatures">
            <div class="signature-box">
              <div class="sig-title">Người lập bảng</div>
              <div class="sig-name">Ban chuyên môn</div>
            </div>
            <div class="signature-box">
              <div class="sig-title">Hiệu trưởng hiệu duyệt</div>
              <div class="sig-name">Ban Giám Hiệu</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 600);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const isExamWeek = selectedWeek === 17 || selectedWeek === 18 || selectedWeek === 34 || selectedWeek === 35;
  const examDays = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];
  const examSessions = [
    { name: 'Sáng', time: '07:30 - 09:00' },
    { name: 'Chiều', time: '14:00 - 15:30' }
  ] as const;

  const dayOffset = (selectedWeek === 17 || selectedWeek === 34) ? 0 : 5;

  const getExamSlotsForCell = (dayIdx: number, sessionName: 'Sáng' | 'Chiều') => {
    const targetDay = dayIdx + 1 + dayOffset;
    return examSlots.filter(s => 
      s.semester === activeSemester &&
      s.day === targetDay &&
      s.session === sessionName
    );
  };

  return (
    <Panel>
      {toast && (
        <div className="fixed top-20 right-8 z-50 bg-[#1e2a3a] text-[#f5f8fc] border border-[#b8c6d9] px-6 py-3 rounded-2xl shadow-lg flex items-center font-bold text-xs uppercase tracking-wider animate-in fade-in slide-in-from-top-4 duration-300">
          <Check className="w-4 h-4 mr-2 text-green-400 animate-bounce" /> {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 border-b-2 border-[#b8c6d9] mb-6">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#1e2a3a] tracking-tight">Lịch học & lịch thi</h2>
          <p className="text-sm text-[#4a5568] font-medium mt-2 italic">Trang trích lục phân bổ lịch giảng dạy toàn trường.</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-6 sm:mt-0">
          {currentRole !== 'department_head' && (
            <div className="flex bg-[#f5f8fc] p-1 border border-[#b8c6d9] shadow-inner rounded-full">
              <button 
                onClick={() => setMainTab('schedule')}
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition border rounded-full cursor-pointer ${mainTab === 'schedule' ? 'bg-[#e8eef6] shadow-[1px_1px_0px_#8e9eb4] text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#7b8a9e] border-transparent hover:text-[#1e2a3a]'}`}
              >
                Lịch Học
              </button>
              <button 
                onClick={() => setMainTab('exam')}
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-widest transition border rounded-full cursor-pointer ${mainTab === 'exam' ? 'bg-[#e8eef6] shadow-[1px_1px_0px_#8e9eb4] text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#7b8a9e] border-transparent hover:text-[#1e2a3a]'}`}
              >
                Lịch Thi
              </button>
            </div>
          )}
          <button className="flex items-center px-5 py-2.5 bg-[#f5f8fc] border border-[#b8c6d9] shadow-[2px_2px_0px_#b8c6d9] text-xs uppercase font-bold text-[#4a5568] hover:bg-[#e8eef6] transition active:translate-y-px active:translate-x-px rounded-full cursor-pointer">
            <Filter className="w-4 h-4 mr-2" />
            Sàng Lọc
          </button>
          {view === 'exam' ? (
            <button 
              onClick={handleGenerateExams}
              className="flex items-center px-6 py-2.5 bg-[#2c5ea0] text-[#f5f8fc] border border-[#6b3333] text-xs uppercase tracking-widest font-bold hover:bg-[#924b4b] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full cursor-pointer animate-pulse"
            >
              Xếp Lịch Thi Tự Động
            </button>
          ) : (
            <button 
              onClick={() => setIsConfirmOpen(true)}
              className="flex items-center px-6 py-2.5 bg-[#1e2a3a] text-[#f5f8fc] border border-[#131a25] text-xs uppercase tracking-widest font-bold hover:bg-[#283548] transition shadow-[2px_2px_0px_#4a5568] active:shadow-none active:translate-y-1 rounded-full cursor-pointer"
            >
              Thiết Lập Tự Động
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#f5f8fc] border-[3px] border-double border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col mt-4 rounded-3xl overflow-hidden min-w-0 w-full min-h-[650px]">
        <div className="p-5 border-b-2 border-[#b8c6d9] bg-[#e8eef6] flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center space-x-4">
            {mainTab === 'schedule' && (
              <div className="flex bg-[#f5f8fc] p-1 border border-[#b8c6d9] shadow-inner rounded-full mr-2">
                <button 
                  onClick={() => setScheduleSubTab('class')}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition border rounded-full cursor-pointer ${scheduleSubTab === 'class' ? 'bg-[#e8eef6] shadow-sm text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#7b8a9e] border-transparent hover:text-[#1e2a3a]'}`}
                >
                  Theo Lớp
                </button>
                <button 
                  onClick={() => setScheduleSubTab('teacher')}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition border rounded-full cursor-pointer ${scheduleSubTab === 'teacher' ? 'bg-[#e8eef6] shadow-sm text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#7b8a9e] border-transparent hover:text-[#1e2a3a]'}`}
                >
                  Theo Giáo Viên
                </button>
                <button 
                  onClick={() => setScheduleSubTab('room')}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition border rounded-full cursor-pointer ${scheduleSubTab === 'room' ? 'bg-[#e8eef6] shadow-sm text-[#2c5ea0] border-[#b8c6d9]' : 'text-[#7b8a9e] border-transparent hover:text-[#1e2a3a]'}`}
                >
                  Theo Phòng Học
                </button>
              </div>
            )}
            {view === 'class' && (
              <>
                <div className="w-32">
                  <BaseSelect
                    value={selectedGrade}
                    options={classesList.length > 0
                      ? Array.from(new Set(classesList.map(c => c.grade))).sort((a, b) => a - b).map(g => ({ value: `Khối ${g}`, label: `Khối ${g}` }))
                      : [{ value: 'Khối 1', label: 'Khối 1' }, { value: 'Khối 2', label: 'Khối 2' }, { value: 'Khối 5', label: 'Khối 5' }]
                    }
                    onChange={handleGradeChange}
                  />
                </div>
                <div className="w-48">
                  <BaseSelect
                    value={selectedClass}
                    options={getClassOptions()}
                    onChange={setSelectedClass}
                  />
                </div>
              </>
            )}
            {view === 'teacher' && (
              <div className="w-64">
                <BaseSelect
                  value={selectedTeacher}
                  options={Array.from(new Set(timetableSlots.map(s => s.teacher).filter(t => t && t !== 'BGH'))).map(t => ({ value: t as string, label: `GV: ${t}` }))}
                  onChange={setSelectedTeacher}
                />
              </div>
            )}
            {view === 'room' && (
              <div className="w-64">
                <BaseSelect
                  value={selectedRoom}
                  options={roomsList
                    .filter(r => {
                      const type = r.type;
                      return type === 'Lớp Học Chuẩn' || 
                             type === 'Phòng Máy Tính' || 
                             type === 'Phòng TB Lý/Hóa/Sinh' ||
                             type === 'Chuyên Đề Lý/Hóa' ||
                             type === 'Phòng học chuẩn' ||
                             type === 'Phòng học lý thuyết' ||
                             type === 'Phòng học lý thuyết (Phòng học cơ bản)' ||
                             type === 'Phòng máy tính (Tin học)' ||
                             type === 'Phòng Ngoại ngữ (Lab)' ||
                             type === 'Phòng Âm nhạc và Mỹ thuật';
                    })
                    .map(r => {
                      let displayType = r.type;
                      if (r.type === 'Lớp Học Chuẩn' || r.type === 'Phòng học chuẩn') displayType = 'Phòng học chuẩn';
                      else if (r.type === 'Phòng Máy Tính') displayType = 'Phòng máy tính';
                      else if (r.type === 'Phòng TB Lý/Hóa/Sinh') displayType = 'Phòng thí nghiệm';
                      else if (r.type === 'Chuyên Đề Lý/Hóa') displayType = 'Phòng chuyên đề';
                      else if (r.type === 'Phòng học lý thuyết' || r.type === 'Phòng học lý thuyết (Phòng học cơ bản)') displayType = 'Phòng học cơ bản';
                      else if (r.type === 'Phòng máy tính (Tin học)') displayType = 'Phòng máy tính';
                      else if (r.type === 'Phòng Ngoại ngữ (Lab)') displayType = 'Phòng Ngoại ngữ (Lab)';
                      else if (r.type === 'Phòng Âm nhạc và Mỹ thuật') displayType = 'Phòng Âm nhạc/Mỹ thuật';
                      return { value: r.name, label: `${r.name} (${displayType})` };
                    })
                  }
                  onChange={setSelectedRoom}
                />
              </div>
            )}
            {view !== 'exam' && (
              <span className="text-[11px] font-bold text-[#4a5568] uppercase tracking-widest bg-[#f5f8fc] px-4 py-2 border border-[#b8c6d9] hidden md:inline-block shadow-inner">
                {view === 'class' ? <>Lớp: {selectedClass} | Chủ nhiệm: {homeroomTeacher}</> :
                 view === 'teacher' ? <>Giáo viên: {selectedTeacher} | Chuyên ngành: {teacherMajor || 'Sư phạm Giáo dục Mầm non'}</> :
                 <>Phòng: {selectedRoom || 'Chưa chọn'}</>}
              </span>
            )}
          </div>
          
          <div className="flex items-center border border-[#b8c6d9] bg-[#f5f8fc] shadow-[2px_2px_0px_#b8c6d9] rounded-full overflow-visible relative">
            <button 
              onClick={() => setSelectedWeek(prev => Math.max(1, prev - 1))}
              disabled={selectedWeek === 1}
              className="px-4 py-3 rounded-l-full text-[10px] font-bold text-[#4a5568] hover:bg-[#e8eef6] transition-all border-r border-[#b8c6d9] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 uppercase tracking-widest cursor-pointer select-none"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {selectedWeek > 1 ? getWeekDateRange(selectedWeek - 1) : 'Đầu năm'}
            </button>
            
            <div className="px-4 py-3 flex items-center bg-[#f5f8fc] relative select-none" ref={weekDropdownRef}>
              <button 
                onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                className="bg-transparent border-none outline-none font-bold text-[10px] text-[#1e2a3a] uppercase tracking-widest cursor-pointer hover:text-[#2c5ea0] flex items-center gap-1.5 transition-colors select-none"
              >
                Tuần {selectedWeek} ({selectedWeek <= 18 ? 'HK I' : 'HK II'})
                <ChevronDown className={`w-3 h-3 text-[#7b8a9e] transition-transform ${isWeekDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isWeekDropdownOpen && (
                <div className="absolute top-[110%] left-1/2 -translate-x-1/2 w-64 bg-[#ffffff] border border-[#b8c6d9] rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-100 main-scrollbar">
                  {Array.from({ length: 37 }, (_, i) => i + 1).map(wk => {
                    const isActive = selectedWeek === wk;
                    return (
                      <button
                        key={wk}
                        onClick={() => {
                          setSelectedWeek(wk);
                          setIsWeekDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 transition-colors block border-b border-[#f0f4fa] last:border-0
                          ${isActive 
                            ? 'bg-[#2c5ea0] text-white font-bold' 
                            : 'text-[#1e2a3a] hover:bg-[#e8eef6] hover:text-[#2c5ea0] font-semibold'}
                        `}
                      >
                        <div className="text-xs">Tuần {wk}</div>
                        <div className={`text-[10px] mt-0.5 ${isActive ? 'text-white/80' : 'text-[#7b8a9e]'}`}>
                          {getWeekDateRange(wk)} ({wk <= 18 ? 'Học kỳ I' : 'Học kỳ II'})
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedWeek(prev => Math.min(37, prev + 1))}
              disabled={selectedWeek === 37}
              className={`px-4 py-3 text-[10px] font-bold text-[#4a5568] hover:bg-[#e8eef6] transition-all border-l border-[#b8c6d9] disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 uppercase tracking-widest cursor-pointer select-none ${view === 'exam' ? 'rounded-r-full' : ''}`}
            >
              {selectedWeek < 37 ? getWeekDateRange(selectedWeek + 1) : 'Cuối năm'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            {view !== 'exam' && (
              <button 
                onClick={handlePrint}
                className="p-3 bg-[#d4dde9] text-[#1e2a3a] hover:bg-[#b8c6d9] transition-colors border-l border-[#b8c6d9] shrink-0 rounded-r-full cursor-pointer" 
                title="In trang"
              >
                <Printer className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4 bg-[#f5f8fc] w-full">
          {loading ? (
            <div className="space-y-6 animate-pulse min-w-[1000px]">
              {/* Table skeleton with overlay loader */}
              <div className="relative border border-[#b8c6d9] outline outline-1 outline-offset-2 outline-[#b8c6d9] rounded-3xl overflow-hidden shadow-sm">
                
                {/* Vintage overlay banner loader */}
                <div className="absolute inset-0 bg-[#f5f8fc]/65 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 transition-all duration-300">
                  <div className="bg-[#f5f8fc] border border-[#b8c6d9] outline outline-1 outline-offset-2 outline-[#b8c6d9] p-8 rounded-3xl text-center space-y-4 max-w-sm shadow-[4px_4px_0px_#dce4ee] mx-4">
                    <div className="w-16 h-16 bg-[#e8eef6] border border-[#dce4ee] text-[#2c5ea0] flex items-center justify-center mx-auto rounded-2xl shadow-inner relative">
                      <div className="absolute inset-1.5 rounded-xl border border-dashed border-[#2c5ea0]/30 animate-[spin_8s_linear_infinite]" />
                      <Loader2 className="w-8 h-8 text-[#2c5ea0] animate-spin" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-serif font-bold text-[#1e2a3a] uppercase tracking-wider">Đang tải thời khóa biểu</h3>
                      <p className="text-[9px] font-bold text-[#7b8a9e] uppercase tracking-widest">Trường Mầm non An Hữu</p>
                    </div>
                    <div className="w-24 h-[1px] bg-[#b8c6d9] mx-auto"></div>
                    <p className="text-[11px] text-[#4a5568] font-medium leading-relaxed italic">
                      Hệ thống đang đồng bộ và cập nhật phân công giảng dạy cho giáo viên...
                    </p>
                  </div>
                </div>

                <table className="w-full text-left border-collapse table-fixed select-none opacity-40">
                  <thead>
                    <tr>
                      <th className="p-3 border-b-2 border-r border-[#b8c6d9] bg-[#d4dde9] text-center w-20">
                        <div className="h-3 w-10 bg-[#b8c6d9]/70 rounded mx-auto"></div>
                      </th>
                      <th className="p-3 border-b-2 border-r-2 border-[#b8c6d9] bg-[#d4dde9] text-center w-16">
                        <div className="h-3 w-6 bg-[#b8c6d9]/70 rounded mx-auto"></div>
                      </th>
                      {['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'].map((day, idx) => (
                        <th key={idx} className="p-3 border-b-2 border-r border-[#b8c6d9] bg-[#d4dde9] text-center">
                          <div className="h-3.5 w-16 bg-[#1e2a3a]/20 rounded mx-auto"></div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-[#f5f8fc]">
                    {[1, 2, 3, 4, 5, 6, 7].map((period) => {
                      const isLastPeriodOfMorning = period === 4;
                      return (
                        <tr key={period} className={`border-b border-[#dce4ee] last:border-0 ${isLastPeriodOfMorning ? 'border-b-2 border-[#b8c6d9]' : ''}`}>
                          {period === 1 && (
                            <td rowSpan={4} className="p-3 border-r border-[#b8c6d9] bg-[#e8eef6] text-center align-middle">
                              <div className="h-4 w-12 bg-[#4a5568]/20 rounded mx-auto mb-2"></div>
                              <div className="h-2 w-8 bg-[#7b8a9e]/20 rounded mx-auto"></div>
                            </td>
                          )}
                          {period === 5 && (
                            <td rowSpan={3} className="p-3 border-r border-[#b8c6d9] bg-[#e8eef6] text-center align-middle">
                              <div className="h-4 w-12 bg-[#4a5568]/20 rounded mx-auto mb-2"></div>
                              <div className="h-2 w-8 bg-[#7b8a9e]/20 rounded mx-auto"></div>
                            </td>
                          )}
                          
                          <td className="p-3 border-r-2 border-[#b8c6d9] bg-[#e8eef6] text-center">
                            <div className="h-4 w-5 bg-[#4a5568]/20 rounded mx-auto font-bold text-xs">{period}</div>
                          </td>

                          {[0, 1, 2, 3, 4].map((dayIdx) => {
                            // Generate dummy styling class names to resemble different subjects
                            const dummyBgColor = 
                              (dayIdx + period) % 5 === 0 ? 'bg-[#d8e0da]/40 border-l-[#2e6b8a]/40' :
                              (dayIdx + period) % 5 === 1 ? 'bg-[#fce5e5]/40 border-l-[#991b1b]/40' :
                              (dayIdx + period) % 5 === 2 ? 'bg-[#fef9c3]/40 border-l-[#a16207]/40' :
                              (dayIdx + period) % 5 === 3 ? 'bg-[#eadded]/40 border-l-[#2c5ea0]/40' :
                              'bg-[#f5f8fc]/40 border-l-[#7b8a9e]/30';

                            return (
                              <td key={dayIdx} className="p-2 border-r border-[#dce4ee] min-h-[90px] align-top relative last:border-r-0">
                                <div className={`h-[74px] p-3 border border-[#b8c6d9]/40 rounded-2xl flex flex-col justify-between ${dummyBgColor} border-l-4`}>
                                  <div className="space-y-1.5">
                                    <div className="h-2.5 w-16 bg-[#1e2a3a]/15 rounded"></div>
                                    <div className="h-2 w-12 bg-[#4a5568]/15 rounded"></div>
                                  </div>
                                  <div className="h-2 w-10 bg-[#2c5ea0]/15 rounded"></div>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : view === 'exam' && !isExamWeek ? (
            <div className="bg-[#fffdf9] border border-[#b8c6d9] p-8 rounded-3xl text-center space-y-4 max-w-2xl mx-auto my-8 shadow-sm">
              <div className="w-16 h-16 bg-[#e8eef6] border border-[#dce4ee] text-[#2c5ea0] flex items-center justify-center mx-auto rounded-2xl shadow-inner">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-lg font-serif font-bold text-[#1e2a3a]">Ngoài Thời Gian Thi Học Kỳ</h3>
              <p className="text-sm text-[#4a5568] max-w-md mx-auto leading-relaxed">
                Tuần hiện tại (Tuần {selectedWeek}) không phải thời gian thi học kỳ. Vui lòng chuyển sang tuần thi học kỳ để xem hoặc xếp lịch thi.
              </p>
              <div className="pt-2 flex justify-center gap-4">
                <button
                  onClick={() => setSelectedWeek(17)}
                  className="px-6 py-2.5 bg-[#2c5ea0] hover:bg-[#924b4b] text-white font-bold text-xs uppercase tracking-widest rounded-full transition-colors shadow-sm cursor-pointer"
                >
                  Chuyển đến Tuần 17 (Kỳ I)
                </button>
                <button
                  onClick={() => setSelectedWeek(34)}
                  className="px-6 py-2.5 bg-[#1e2a3a] hover:bg-[#3d3833] text-white font-bold text-xs uppercase tracking-widest rounded-full transition-colors shadow-sm cursor-pointer"
                >
                  Chuyển đến Tuần 34 (Kỳ II)
                </button>
              </div>
            </div>
          ) : view === 'exam' && isExamWeek ? (
            <>
              <div className="border border-[#b8c6d9] outline outline-1 outline-offset-2 outline-[#b8c6d9] min-w-[1000px] min-h-full h-max">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr>
                      <th className="p-3 border-b-2 border-r border-[#b8c6d9] bg-[#d4dde9] text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.1em] text-center w-28">Ca Thi</th>
                      <th className="p-3 border-b-2 border-r-2 border-[#b8c6d9] bg-[#d4dde9] text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.2em] text-center w-36">Thời Gian</th>
                      {examDays.map((day, idx) => (
                        <th key={idx} className="p-3 border-b-2 border-r border-[#b8c6d9] bg-[#d4dde9] text-[12px] font-bold text-[#1e2a3a] uppercase tracking-widest text-center">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-[#f5f8fc]">
                    {examSessions.map((sess, sIdx) => {
                      return (
                        <tr key={sIdx} className="group hover:bg-[#e8eef6] transition-colors border-b last:border-0 border-[#b8c6d9]">
                          <td className="p-3 border-r border-[#b8c6d9] bg-[#e8eef6] text-center text-xs font-bold text-[#2c5ea0] uppercase tracking-widest align-middle">
                            Ca {sess.name}
                          </td>
                          <td className="p-3 border-r-2 border-[#b8c6d9] bg-[#e8eef6] text-center text-xs font-serif font-bold text-[#4a5568] align-middle">
                            {sess.time}
                          </td>
                          {examDays.map((day, dayIdx) => {
                            const slots = getExamSlotsForCell(dayIdx, sess.name as 'Sáng' | 'Chiều');
                            return (
                              <td key={dayIdx} className={`p-4 border-b border-r border-[#dce4ee] min-h-[120px] align-middle relative ${dayIdx === examDays.length - 1 ? 'border-r-0' : ''}`}>
                                {slots.length > 0 ? (
                                  <div className="space-y-3">
                                    {slots.map(slot => {
                                      const candidateStudents = students.filter(std => slot.candidates?.includes(std.id));
                                      return (
                                        <div 
                                          key={slot.id}
                                          className="p-3 border border-[#b8c6d9] shadow-sm flex flex-col justify-center text-center rounded-2xl bg-[#f5f8fc] border-l-4 border-l-[#2c5ea0] transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                                        >
                                          <div className="font-bold font-serif text-[#2c5ea0] text-xs uppercase tracking-wide leading-snug">{slot.subject}</div>
                                          <div className="text-[9px] text-[#4a5568] font-bold mt-2 uppercase tracking-widest">
                                            👤 Giám thị: {slot.examiner}
                                          </div>
                                          <div className="text-[9px] text-[#7b8a9e] font-semibold mt-1 uppercase tracking-widest">
                                            📍 Phòng: {slot.room} • {slot.classId}
                                          </div>
                                          {slot.candidates && slot.candidates.length > 0 && (
                                            <button 
                                              onClick={() => setSelectedExamCandidates({
                                                room: slot.room,
                                                subject: slot.subject,
                                                list: candidateStudents
                                              })}
                                              className="mt-2 text-[9px] font-bold text-[#2c5ea0] hover:text-[#5c2b2b] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors bg-[#e8eef6] py-1 px-2 border border-[#b8c6d9] rounded-full self-center"
                                            >
                                              <Users className="w-3 h-3" />
                                              Thí sinh ({slot.candidates.length})
                                            </button>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="h-full min-h-[80px] flex items-center justify-center border-2 border-dashed border-transparent mx-1 opacity-20 select-none">
                                    <span className="text-[#8e9eb4] font-serif text-sm">Nghỉ thi</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Proctors List by Day Grid */}
              <div className="mt-8 bg-[#ffffff] border border-[#b8c6d9] p-6 rounded-3xl shadow-sm min-w-[1000px]">
                <h3 className="text-sm font-bold text-[#1e2a3a] mb-4 border-b border-[#b8c6d9] pb-2 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#2c5ea0]" />
                  Phân công Giám thị theo Ngày Thi (Tuần {selectedWeek})
                </h3>
                
                <div className="grid grid-cols-5 gap-4">
                  {examDays.map((day, dayIdx) => {
                    const targetDay = dayIdx + 1 + dayOffset;
                    const slotsForDay = examSlots.filter(s => 
                      s.semester === activeSemester && 
                      s.day === targetDay
                    );
                    
                    return (
                      <div key={dayIdx} className="bg-[#f0f4fa] border border-[#b8c6d9] rounded-2xl p-4 shadow-sm flex flex-col min-h-[180px]">
                        <h4 className="font-bold text-[#2c5ea0] uppercase tracking-wider text-[10px] border-b border-[#dce4ee] pb-2 text-center">
                          {day} (Ngày {targetDay})
                        </h4>
                        <div className="mt-3 space-y-2 flex-1 overflow-y-auto max-h-60 main-scrollbar">
                          {slotsForDay.length > 0 ? (
                            slotsForDay.map(slot => (
                              <div key={slot.id} className="p-2 bg-white border border-[#d4dde9] rounded-xl text-[9px] space-y-1">
                                <div className="font-bold text-[#1e2a3a] truncate">👤 {slot.examiner}</div>
                                <div className="text-[#7b8a9e] font-medium">
                                  📍 {slot.room} • {slot.session}
                                </div>
                                <div className="text-[#2e6b8a] font-bold truncate">
                                  📖 {slot.subject} ({slot.classId})
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-[9px] italic text-[#8e9eb4] py-4">Chưa xếp lịch thi</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="border border-[#b8c6d9] outline outline-1 outline-offset-2 outline-[#b8c6d9] min-w-[1000px] min-h-full h-max">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr>
                    <th className="p-3 border-b-2 border-r border-[#b8c6d9] bg-[#d4dde9] text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.1em] text-center w-24">Buổi</th>
                    <th className="p-3 border-b-2 border-r-2 border-[#b8c6d9] bg-[#d4dde9] text-[10px] font-bold text-[#4a5568] uppercase tracking-[0.1em] text-center w-48">Thời Gian Hàng Ngày</th>
                    {days.map((day, idx) => (
                      <th key={idx} className="p-3 border-b-2 border-r border-[#b8c6d9] bg-[#d4dde9] text-[12px] font-bold text-[#1e2a3a] uppercase tracking-widest text-center">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-[#f5f8fc]">
                  {periods.map(period => {
                    const isLastPeriodOfMorning = period === 4;
                    return (
                      <tr key={period} className={`group hover:bg-[#e8eef6] transition-colors ${isLastPeriodOfMorning ? 'border-b-2 border-[#b8c6d9]' : ''}`}>
                        {period === 1 && (
                          <td rowSpan={4} className="p-3 border-b-2 border-r border-[#b8c6d9] bg-[#e8eef6] text-center text-xs font-bold text-[#2c5ea0] uppercase tracking-widest align-middle">
                            Sáng
                          </td>
                        )}
                        {period === 5 && (
                          <td rowSpan={3} className="p-3 border-b border-r border-[#b8c6d9] bg-[#e8eef6] text-center text-xs font-bold text-[#7b8a9e] uppercase tracking-widest align-middle">
                            Chiều
                          </td>
                        )}
                        
                        <td className="p-3 border-b border-r-2 border-[#b8c6d9] bg-[#e8eef6] text-center text-xs font-bold text-[#4a5568] select-none">
                          <div className="font-mono text-[#2c5ea0] font-bold">{getPreschoolBlockInfo(period).time}</div>
                          <div className="text-[9px] text-[#7b8a9e] mt-1 font-medium leading-tight">{getPreschoolBlockInfo(period).name}</div>
                        </td>
                        {days.map((day, dayIdx) => {
                          const entry = scheduleClass[dayIdx + 1]?.[period];
                          return (
                            <td key={dayIdx} className={`p-2 border-b border-r border-[#dce4ee] min-h-[90px] align-top relative ${dayIdx === days.length - 1 ? 'border-r-0' : ''}`}>
                              {entry && entry.subject ? (
                                <div 
                                  onClick={() => handleSlotClick(dayIdx + 1, period)}
                                  className={`h-full p-3 border border-[#b8c6d9] shadow-sm flex flex-col justify-center text-center cursor-pointer rounded-2xl transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${
                                    entry.subject.includes('Toán') ? 'bg-[#d8e0da] border-l-4 border-l-[#2e6b8a]' : 
                                    entry.subject.includes('Sinh hoạt dưới cờ') ? 'bg-[#fce5e5] border-l-4 border-l-[#991b1b]' :
                                    entry.subject.includes('Giáo dục địa phương') ? 'bg-[#fef9c3] border-l-4 border-l-[#a16207]' :
                                    entry.subject.includes('Hoạt động trải nghiệm') ? 'bg-[#eadded] border-l-4 border-l-[#2c5ea0]' :
                                    (['âm nhạc', 'mỹ thuật', 'nghệ thuật'].some(k => entry.subject.toLowerCase().includes(k))) ? 'bg-[#f3e8ff] border-l-4 border-l-[#7e22ce]' :
                                    'bg-[#f5f8fc] border-l-4 border-l-[#7b8a9e]'
                                  }`}
                                >
                                  <div className="font-bold font-serif text-[#1e2a3a] text-xs uppercase tracking-wide leading-snug">{entry.subject}</div>
                                  <div className="text-[9px] text-[#4a5568] font-bold mt-1.5 uppercase tracking-widest truncate">{entry.teacher}</div>
                                  {entry.room && (
                                    <div className="text-[9px] text-[#2c5ea0] font-semibold mt-1 uppercase tracking-widest truncate">📍 {entry.room}</div>
                                  )}
                                </div>
                              ) : (
                                <div className="h-full min-h-[70px] flex items-center justify-center border-2 border-dashed border-transparent hover:border-[#b8c6d9] mx-1 opacity-20 hover:opacity-100 cursor-pointer transition-all">
                                  <span className="text-[#8e9eb4] font-serif text-xl">+</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex bg-[#f5f8fc] p-5 border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] items-start rounded-3xl border-l-8 border-l-[#2c5ea0]">
        <div className="w-12 h-12 bg-[#e8eef6] border border-[#dce4ee] text-[#2c5ea0] flex items-center justify-center flex-shrink-0 mr-5 shadow-inner rounded-2xl">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="pt-1">
          <div className="font-bold text-[#2c5ea0] mb-1.5 uppercase tracking-widest text-xs">Biên bản cảnh báo hệ thống</div>
          <p className="text-[#4a5568] text-sm font-medium leading-relaxed">Hệ thống ghi nhận thời khóa biểu hoàn chỉnh được tải trực tiếp từ cơ sở dữ liệu đám mây. Vui lòng liên hệ Admin nếu cần chỉnh sửa cấu hình.</p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4 relative">
            <h3 className="text-lg font-serif font-bold text-[#1e2a3a] border-b border-[#b8c6d9] pb-2">
              🗓️ Tự động tạo Thời khóa biểu
            </h3>
            <p className="text-sm text-[#4a5568] leading-relaxed font-medium">
              Hệ thống sẽ tiến hành xóa thời khóa biểu cũ của toàn trường và chạy thuật toán xếp lịch tự động dựa trên số tiết/tuần cùng phân công chuyên môn giáo viên.
            </p>
            <p className="text-xs text-[#2c5ea0] font-bold bg-[#fce5e5] p-3 rounded-lg border border-[#fccfcf]">
              ⚠️ Quá trình này sẽ mất một vài giây và thay thế toàn bộ dữ liệu thời khóa biểu hiện tại.
            </p>
            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 border border-[#b8c6d9] hover:bg-[#e8eef6] font-bold text-xs uppercase tracking-widest rounded-full transition-colors text-[#4a5568] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAutoGenerate}
                className="px-5 py-2 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] font-bold text-xs uppercase tracking-widest rounded-full transition-all shadow-sm cursor-pointer"
              >
                Xác nhận tạo
              </button>
            </div>
          </div>
        </div>
      )}

      <LessonDetailModal 
        isOpen={selectedSlot !== null}
        onClose={() => setSelectedSlot(null)}
        slot={selectedSlot}
        classesList={classesList}
        roomsList={roomsList}
      />

      {/* Candidates Modal */}
      {selectedExamCandidates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-[#f5f8fc] p-6 border-2 border-[#b8c6d9] rounded-2xl shadow-xl space-y-4 relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => setSelectedExamCandidates(null)}
              className="absolute top-4 right-4 text-[#7b8a9e] hover:text-[#2c5ea0] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="border-b border-[#b8c6d9] pb-2">
              <h3 className="text-lg font-serif font-bold text-[#1e2a3a]">
                Danh sách thí sinh phòng thi
              </h3>
              <p className="text-xs text-[#4a5568] font-bold uppercase tracking-wider mt-1">
                📍 {selectedExamCandidates.room} • 📖 Môn: {selectedExamCandidates.subject}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-[2px] border-[#b8c6d9] bg-[#e8eef6] text-[#4a5568] font-bold uppercase tracking-wider">
                    <th className="py-2 px-3">STT</th>
                    <th className="py-2 px-3">Mã HS</th>
                    <th className="py-2 px-3">Họ và Tên</th>
                    <th className="py-2 px-3 text-center">Lớp</th>
                    <th className="py-2 px-3 text-center">Giới tính</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dce4ee]/60">
                  {selectedExamCandidates.list.map((student, idx) => (
                    <tr key={student.id} className="hover:bg-[#e8eef6]/50">
                      <td className="py-2.5 px-3 font-semibold text-[#7b8a9e]">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-gray-650">{student.id}</td>
                      <td className="py-2.5 px-3 font-bold text-[#1e2a3a]">{student.name}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-700">{student.grade}</td>
                      <td className="py-2.5 px-3 text-center">{student.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedExamCandidates.list.length === 0 && (
                <p className="text-center text-xs italic text-[#7b8a9e] py-6">Không có thí sinh trong phòng thi này.</p>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-[#b8c6d9] pt-3 text-[11px] font-bold text-[#4a5568] uppercase tracking-wider">
              <span>Tổng số: {selectedExamCandidates.list.length} thí sinh</span>
              <button
                onClick={() => setSelectedExamCandidates(null)}
                className="px-5 py-2 bg-[#1e2a3a] hover:bg-[#283548] text-[#f5f8fc] rounded-full transition-all shadow-sm cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};

