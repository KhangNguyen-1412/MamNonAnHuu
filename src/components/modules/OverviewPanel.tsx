import React, { useState, useEffect } from 'react';
import { Panel } from '../layout/Panel';
import { Users, UserCheck, Calendar, BookOpen, GraduationCap, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getStudents, Student } from '../../services/studentService';
import { getStaffList, Staff } from '../../services/hrService';
import { getClasses, getPartyUnionDocs, getAdminDocuments } from '../../services/dbService';
import { useUserRole, ROLE_THEMES, ROLE_CHART_COLORS, UserRole } from '../../utils/role';
import { ModuleId } from '../../types';

const COLORS = ['#f59e0b', '#10b981', '#f43f5e'];

const ROLE_SHORTCUTS: Record<UserRole, { label: string; action: ModuleId }[]> = {
  school_board: [
    { label: '+ Hồ sơ Học Sinh Mới', action: 'students' },
    { label: '+ Kế hoạch Báo giảng', action: 'academics' },
    { label: '+ Đăng ký Phòng máy', action: 'facilities' },
    { label: '+ Phân công chuyên môn', action: 'assignments' }
  ],
  department_head: [
    { label: '+ Phê duyệt Giáo án', action: 'academics' },
    { label: '+ Phân công chuyên môn', action: 'assignments' },
    { label: '+ Đăng ký Phòng họp tổ', action: 'facilities' },
    { label: '+ Báo cáo Tổ chuyên môn', action: 'departments' }
  ],
  homeroom_teacher: [
    { label: '+ Điểm danh Lớp 1A1', action: 'students' },
    { label: '+ Đánh giá Hạnh kiểm', action: 'students' },
    { label: '+ Điểm thi đua Lớp 1A1', action: 'youth-union' },
    { label: '+ Quản lý Bán trú Lớp', action: 'boarding' }
  ],
  subject_teacher: [
    { label: '+ Nhập điểm Tiếng Anh', action: 'students' },
    { label: '+ Nộp Kế hoạch Bài dạy', action: 'academics' },
    { label: '+ Đăng ký Phòng máy', action: 'facilities' },
    { label: '+ Xem Lịch dạy tuần', action: 'timetable' }
  ],
  activities_head: [
    { label: '+ Chấm điểm Thi đua tuần', action: 'youth-union' },
    { label: '+ Tạo Chiến dịch Đoàn mới', action: 'youth-union' },
    { label: '+ Hướng nghiệp học đường', action: 'counseling' },
    { label: '+ Lập Kế hoạch Ngoại khóa', action: 'youth-union' }
  ],
  accounting: [
    { label: '+ Lập Phiếu Thu Học Phí', action: 'finance' },
    { label: '+ Quyết Toán Ngân Sách', action: 'finance' },
    { label: '+ Đăng Ký Bảo Trì CSVC', action: 'facilities' },
    { label: '+ Kiểm Tra Suất Ăn', action: 'boarding' }
  ],
  chief_accountant: [
    { label: '+ Phê Duyệt Thu Chi', action: 'finance' },
    { label: '+ Cấu Hình Khóa Sổ', action: 'finance' },
    { label: '+ Xem Nhật Ký Kiểm Toán', action: 'finance' },
    { label: '+ Báo Cáo Quyết Toán', action: 'finance' }
  ],
  nurse: [
    { label: '+ Ghi Nhận Sự Cố Y Tế', action: 'health' },
    { label: '+ Cập Nhật Tủ Thuốc', action: 'health' },
    { label: '+ Xem Lịch Khám Sức Khỏe', action: 'health' },
    { label: '+ Kiểm Thực Thực Phẩm', action: 'boarding' }
  ],
  librarian: [
    { label: '+ Đăng Ký Mượn Trả Sách', action: 'facilities' },
    { label: '+ Nhập Sách Mới Thư Viện', action: 'facilities' },
    { label: '+ Kế hoạch Sách Học đường', action: 'academics' },
    { label: '+ Xem Thông Tin Tài Khoản', action: 'user-profile' }
  ],
  admin_staff: [
    { label: '+ Tiếp Nhận Công Văn Đến', action: 'secretary-documents' },
    { label: '+ Lập Lịch Họp Hội Đồng', action: 'secretary-council' },
    { label: '+ Cấp Phát Phôi Bằng', action: 'secretary-storage' },
    { label: '+ Đăng Tin Bảng Tin', action: 'secretary-bulletin' }
  ],
  security: [
    { label: '+ Báo Cáo Sự Cố An Ninh', action: 'facilities' },
    { label: '+ Đăng Ký Sửa Chữa Thiết Bị', action: 'facilities' },
    { label: '+ Tra Cứu Cán Bộ Nhân Viên', action: 'user-profile' },
    { label: '+ Xem Tin Tức Công Văn', action: 'overview' }
  ],
  cleaner: [
    { label: '+ Báo Cáo Hiện Trạng Vệ Sinh', action: 'facilities' },
    { label: '+ Kiểm Tra Bếp Ăn Bán Trú', action: 'boarding' },
    { label: '+ Đăng Ký Vật Tư Tạp Vụ', action: 'facilities' },
    { label: '+ Xem Tin Tức & Công Văn', action: 'overview' }
  ],
  student: [
    { label: 'Xin nghỉ phép trực tuyến', action: 'student-portal' },
    { label: 'Xem điểm số học tập', action: 'student-portal' },
    { label: 'Tra cứu thời khóa biểu', action: 'student-portal' },
    { label: 'Hồ sơ cá nhân học sinh', action: 'user-profile' }
  ],
  boarding: [
    { label: '+ Cập nhật Thực đơn tuần', action: 'boarding' },
    { label: '+ Báo cáo Suất ăn ngày', action: 'boarding' },
    { label: '+ Kiểm thực An toàn thực phẩm', action: 'boarding' },
    { label: '+ Xem Thông Tin Tài Khoản', action: 'user-profile' }
  ]
};

interface OverviewPanelProps {
  onSelectModule?: (id: ModuleId) => void;
}

export const OverviewPanel: React.FC<OverviewPanelProps> = ({ onSelectModule }) => {
  const currentRole = useUserRole();
  const theme = ROLE_THEMES[currentRole];
  const roleColors = ROLE_CHART_COLORS[currentRole] || COLORS;
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [classCount, setClassCount] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [studs, staff, classes, unionDocs, adminDocs] = await Promise.all([
          getStudents(),
          getStaffList(),
          getClasses(),
          getPartyUnionDocs(),
          getAdminDocuments()
        ]);
        setStudents(studs);
        setStaffList(staff);

        // Filter metrics dynamically based on currentRole
        if (currentRole === 'homeroom_teacher') {
          setStudentCount(studs.filter(s => s.status === 'Đang Học' && s.grade === '1A1').length);
          setClassCount(1); // Locked homeroom class
        } else if (currentRole === 'subject_teacher') {
          setStudentCount(studs.filter(s => s.status === 'Đang Học' && (s.grade === '1A1' || s.grade === '1A5')).length);
          setClassCount(2); // Teach two classes
        } else {
          setStudentCount(studs.filter(s => s.status === 'Đang Học').length);
          setClassCount(classes.length);
        }

        if (currentRole === 'department_head') {
          setStaffCount(staff.filter(s => s.department === 'Tổ Toán - Tin').length);
        } else {
          setStaffCount(staff.length);
        }

        const parseDate = (dStr: string) => {
          const parts = dStr.split(/[/\s•:]+/);
          if (parts.length >= 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const hour = parts[3] ? parseInt(parts[3], 10) : 0;
            const minute = parts[4] ? parseInt(parts[4], 10) : 0;
            return new Date(year, month, day, hour, minute).getTime();
          }
          return 0;
        };

        const mergedDocs = [
          ...unionDocs.map(d => ({ 
            id: d.id,
            title: d.title,
            desc: d.content.substring(0, 150) + (d.content.length > 150 ? '...' : ''),
            date: d.date,
            tag: d.category === 'party' ? 'Đảng' : d.category === 'tradeUnion' ? 'CĐ' : 'PH',
            color: d.category === 'party' ? '#2c5ea0' : d.category === 'tradeUnion' ? '#2e6b8a' : '#4a5568',
            sortKey: parseDate(d.date)
          })),
          ...adminDocs.map(d => ({
            id: d.id,
            title: d.trichYeu,
            desc: `Số ký hiệu: ${d.symbol} • Cơ quan ban hành: ${d.issuingBody} • Độ khẩn: ${d.urgency}`,
            date: d.issueDate,
            tag: d.docType === 'Văn bản Đến' ? 'Đến' : 'Đi',
            color: d.docType === 'Văn bản Đến' ? '#2e6b8a' : '#4a5568',
            sortKey: parseDate(d.issueDate)
          }))
        ];

        mergedDocs.sort((a, b) => b.sortKey - a.sortKey);
        setDocuments(mergedDocs.slice(0, 3));
      } catch (err) {
        console.error("Failed to load overview data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [currentRole]);

  const getStudentChartData = (): any[] => {
    if (currentRole === 'homeroom_teacher') {
      const classStudents = students.filter(s => s.grade === '1A1');
      const activeClass = classStudents.filter(s => s.status === 'Đang Học');
      const nam = activeClass.filter(s => s.gender === 'Nam').length;
      const nu = activeClass.filter(s => s.gender === 'Nữ').length;
      const vang = classStudents.filter(s => s.status !== 'Đang Học').length;
      return [
        { name: 'Nam', 'Học sinh': nam },
        { name: 'Nữ', 'Học sinh': nu },
        { name: 'Nghỉ/Bảo lưu', 'Học sinh': vang }
      ];
    }
    if (currentRole === 'subject_teacher') {
      const class10A1 = students.filter(s => s.grade === '1A1' && s.status === 'Đang Học');
      const class10A5 = students.filter(s => s.grade === '1A5' && s.status === 'Đang Học');
      return [
        { name: 'Lớp 1A1', 'Nam': class10A1.filter(s => s.gender === 'Nam').length, 'Nữ': class10A1.filter(s => s.gender === 'Nữ').length },
        { name: 'Lớp 1A5', 'Nam': class10A5.filter(s => s.gender === 'Nam').length, 'Nữ': class10A5.filter(s => s.gender === 'Nữ').length }
      ];
    }

    const grades = {
      '1': { Nam: 0, Nữ: 0 },
      '2': { Nam: 0, Nữ: 0 },
      '3': { Nam: 0, Nữ: 0 },
      '4': { Nam: 0, Nữ: 0 },
      '5': { Nam: 0, Nữ: 0 }
    };
    students.filter(s => s.status === 'Đang Học').forEach(s => {
      const gradePrefix = s.grade.substring(0, 1);
      if (gradePrefix in grades) {
        const key = s.gender === 'Nam' ? 'Nam' : 'Nữ';
        grades[gradePrefix as '1' | '2' | '3' | '4' | '5'][key]++;
      }
    });
    return [
      { name: 'Khối 1', 'Nam': grades['1'].Nam, 'Nữ': grades['1'].Nữ },
      { name: 'Khối 2', 'Nam': grades['2'].Nam, 'Nữ': grades['2'].Nữ },
      { name: 'Khối 3', 'Nam': grades['3'].Nam, 'Nữ': grades['3'].Nữ },
      { name: 'Khối 4', 'Nam': grades['4'].Nam, 'Nữ': grades['4'].Nữ },
      { name: 'Khối 5', 'Nam': grades['5'].Nam, 'Nữ': grades['5'].Nữ },
    ];
  };

  const getStaffChartData = () => {
    let teachers = 0;
    let administrative = 0;
    let managers = 0;
    staffList.forEach(s => {
      if (s.role?.includes('Giáo viên')) {
        teachers++;
      } else if (s.role?.includes('Tổ trưởng') || s.role?.includes('Tổ phó') || s.role?.includes('Hiệu trưởng') || s.role?.includes('Hiệu phó') || s.role?.includes('Quản lý')) {
        managers++;
      } else {
        administrative++;
      }
    });
    return [
      { name: 'Giáo viên', value: teachers },
      { name: 'Nhân viên HC', value: administrative },
      { name: 'CB Quản lý', value: managers },
    ];
  };

  const getRightCardData = () => {
    if (currentRole === 'school_board') {
      return {
        title: 'Tổng Cán bộ/GV/NV',
        value: staffCount,
        icon: <UserCheck className="w-6 h-6 text-[#7b8a9e] opacity-50" />,
        chart: (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getStaffChartData()}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {getStaffChartData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981', '#f43f5e'][index % 3]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#2d251e', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#fdfbf7' }} itemStyle={{ color: '#fdfbf7' }} />
            </PieChart>
          </ResponsiveContainer>
        ),
        legend: (
          <div className="flex gap-4 mt-2 justify-center">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Giáo viên</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">HC</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">QL</span></div>
          </div>
        )
      };
    }
    
    if (currentRole === 'department_head') {
      const deptStaff = staffList.filter(s => s.department === 'Tổ Toán - Tin');
      const count = deptStaff.length || 8;
      const positions = {
        'Tổ trưởng': deptStaff.filter(s => s.role.includes('Tổ trưởng')).length || 1,
        'Tổ phó': deptStaff.filter(s => s.role.includes('Tổ phó')).length || 1,
        'Giáo viên': deptStaff.filter(s => !s.role.includes('Tổ trưởng') && !s.role.includes('Tổ phó')).length || (count - 2 > 0 ? count - 2 : 6)
      };
      const chartData = [
        { name: 'Tổ trưởng', value: positions['Tổ trưởng'] },
        { name: 'Tổ phó', value: positions['Tổ phó'] },
        { name: 'Giáo viên', value: positions['Giáo viên'] }
      ];
      return {
        title: 'Thành viên Tổ Toán - Tin',
        value: count,
        icon: <UserCheck className="w-6 h-6 text-[#7b8a9e] opacity-50" />,
        chart: (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981', '#f43f5e'][index % 3]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#2d251e', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#fdfbf7' }} />
            </PieChart>
          </ResponsiveContainer>
        ),
        legend: (
          <div className="flex gap-4 mt-2 justify-center">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Tổ trưởng</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Tổ phó</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Giáo viên</span></div>
          </div>
        )
      };
    }
    
    if (currentRole === 'homeroom_teacher') {
      const classStudents = students.filter(s => s.grade === '1A1');
      const count = classStudents.length || 38;
      const conductData = [
        { name: 'Tốt', value: Math.round(count * 0.85) || 32 },
        { name: 'Khá', value: Math.round(count * 0.12) || 5 },
        { name: 'Trung bình', value: Math.round(count * 0.03) || 1 }
      ];
      return {
        title: 'Sĩ số Lớp 1A1 (Chủ nhiệm)',
        value: count,
        icon: <GraduationCap className="w-6 h-6 text-[#7b8a9e] opacity-50" />,
        chart: (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={conductData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {conductData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981', '#f43f5e'][index % 3]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#2d251e', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#fdfbf7' }} />
            </PieChart>
          </ResponsiveContainer>
        ),
        legend: (
          <div className="flex gap-4 mt-2 justify-center">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Tốt (85%)</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Khá (12%)</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">TB (3%)</span></div>
          </div>
        )
      };
    }
    
    if (currentRole === 'subject_teacher') {
      const lectureHours = 18; // hours per week
      const workloadData = [
        { name: 'Dạy Lớp 1A1', value: 8 },
        { name: 'Dạy Lớp 1A5', value: 8 },
        { name: 'Soạn bài/Họp', value: 2 }
      ];
      return {
        title: 'Định mức dạy (Tiết/Tuần)',
        value: lectureHours,
        icon: <BookOpen className="w-6 h-6 text-[#7b8a9e] opacity-50" />,
        chart: (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={workloadData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {workloadData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#f59e0b', '#10b981', '#f43f5e'][index % 3]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#2d251e', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#fdfbf7' }} />
            </PieChart>
          </ResponsiveContainer>
        ),
        legend: (
          <div className="flex gap-4 mt-2 justify-center">
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">10A1 (8t)</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">10A5 (8t)</span></div>
             <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Họp (2t)</span></div>
          </div>
        )
      };
    }
    
    // activities_head
    const campCount = 4; // active campaigns
    const campParticipants = [
      { name: 'Tiếp sức mùa thi', value: 45 },
      { name: 'Mùa hè xanh', value: 30 },
      { name: 'Tình nguyện An Hữu', value: 25 }
    ];
    return {
      title: 'Hoạt động Phong trào',
      value: campCount,
      icon: <Award className="w-6 h-6 text-[#7b8a9e] opacity-50" />,
      chart: (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={campParticipants}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={65}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {campParticipants.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#2d251e', border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold', color: '#fdfbf7' }} />
          </PieChart>
        </ResponsiveContainer>
      ),
      legend: (
        <div className="flex gap-4 mt-2 justify-center">
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Tiếp sức</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#10b981]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Mùa hè</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-[#f43f5e]"></div><span className="text-[9px] font-bold uppercase tracking-widest text-[#c2b5a5]">Khác</span></div>
        </div>
      )
    };
  };

  const getAbsentCount = () => {
    if (currentRole === 'homeroom_teacher') {
      return students.filter(s => s.status !== 'Đang Học' && s.grade === '1A1').length;
    }
    if (currentRole === 'subject_teacher') {
      return students.filter(s => s.status !== 'Đang Học' && (s.grade === '1A1' || s.grade === '1A5')).length;
    }
    return students.filter(s => s.status !== 'Đang Học' && s.grade !== 'Đã tốt nghiệp').length;
  };

  const getClassesStatusLabel = () => {
    if (currentRole === 'homeroom_teacher') return 'Lớp Chủ nhiệm';
    if (currentRole === 'subject_teacher') return 'Lớp giảng dạy';
    return 'Lớp học Đang dạy';
  };

  const absentStudentsCount = getAbsentCount();
  const getLeaveStaffCount = () => {
    if (currentRole === 'department_head') {
      return staffList.filter(s => s.status === 'Nghỉ Phép' && s.department === 'Tổ Toán - Tin').length;
    }
    return staffList.filter(s => s.status === 'Nghỉ Phép').length;
  };

  const leaveStaffCount = getLeaveStaffCount();
  const rightCard = getRightCardData();

  return (
    <Panel>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* Row 1 Stats & Charts */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-[#fdfbf7] rounded-3xl border border-[#c2b5a5] shadow-[4px_4px_0px_#f5ede0] p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f5ede0] border border-[#c2b5a5] flex items-center justify-center text-[#f59e0b] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl font-serif font-bold text-[#2d251e] tracking-tight">
                    {loading ? '...' : studentCount}
                  </div>
                  <div className="text-[#4a3f35] font-bold text-[10px] uppercase tracking-widest">
                    {currentRole === 'homeroom_teacher' ? 'Học sinh Lớp 1A1' : currentRole === 'subject_teacher' ? 'Học sinh phụ trách' : 'Tổng Học Sinh'}
                  </div>
                </div>
              </div>
              <span className="text-[#f43f5e] text-[10px] font-bold tracking-wider uppercase border-b-2 border-[#f43f5e] pb-0.5">+2.4% vs T.TRƯỚC</span>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getStudentChartData()} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--chart-axis-text)', fontWeight: 'bold' }} />
                  <Tooltip wrapperStyle={{ outline: 'none' }} cursor={{ fill: 'var(--chart-cursor-fill)' }} contentStyle={{ backgroundColor: '#fdfbf7', border: '1px solid #c2b5a5', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', color: '#2d251e' }} />
                  {currentRole !== 'homeroom_teacher' && <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#4a3f35' }} />}
                  
                  {currentRole === 'homeroom_teacher' ? (
                    <Bar dataKey="Học sinh" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  ) : currentRole === 'subject_teacher' ? (
                    <>
                      <Bar dataKey="Nam" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Nữ" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar dataKey="Nam" stackId="a" fill="#f59e0b" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="Nữ" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </>
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#2d251e] rounded-3xl border border-[#4a3f35] p-8 text-[#fdfbf7] flex flex-col justify-between shadow-[4px_4px_0px_#c2b5a5]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-3xl font-serif font-bold text-[#f59e0b]">
                  {loading ? '...' : rightCard.value}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[#c2b5a5] font-bold mt-1">{rightCard.title}</div>
              </div>
              {rightCard.icon}
            </div>
            <div className="h-[180px] w-full flex items-center justify-center">
              {rightCard.chart}
            </div>
            {rightCard.legend}
          </div>
        </div>
        
        <div className="lg:col-span-4 bg-[#fdfbf7] rounded-3xl border border-[#c2b5a5] shadow-[4px_4px_0px_#f5ede0] p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#4a3f35] border-b border-[#c2b5a5] pb-1">Trạng thái Nhanh</h3>
            <div className="flex -space-x-1">
              <div className="w-8 h-8 bg-[#e8eef6] border border-[#b8c6d9] flex items-center justify-center text-[10px] font-bold text-[#2c5ea0]">T2</div>
            </div>
          </div>
          <div className="mt-8 space-y-6">
            <div className="flex items-center justify-between border-b border-dashed border-[#b8c6d9] pb-4">
              <span className="text-[#7b8a9e] font-bold text-xs uppercase tracking-widest">Học sinh vắng</span>
              <span className="text-xl font-serif font-bold text-[#2c5ea0]">{loading ? '...' : absentStudentsCount}</span>
            </div>
             <div className="flex items-center justify-between border-b border-dashed border-[#b8c6d9] pb-4">
              <span className="text-[#7b8a9e] font-bold text-xs uppercase tracking-widest">GV nghỉ phép</span>
              <span className="text-xl font-serif font-bold text-[#4a5568]">{loading ? '...' : leaveStaffCount}</span>
            </div>
             <div className="flex items-center justify-between">
              <span className="text-[#7b8a9e] font-bold text-xs uppercase tracking-widest">{getClassesStatusLabel()}</span>
              <span className="text-xl font-serif font-bold text-[#2e6b8a]">{loading ? '...' : `${classCount}/${classCount}`}</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t-[3px] border-double border-[#b8c6d9]">
             <button className="w-full py-3 bg-[#d4dde9] text-[#4a5568] font-bold text-xs tracking-widest uppercase border border-[#b8c6d9] hover:bg-[#b8c6d9] hover:text-[#1e2a3a] transition-colors shadow-[2px_2px_0px_rgba(43,38,32,0.1)] rounded-full">Báo cáo Trực Đầu Giờ</button>
          </div>
        </div>

        {/* Row 2 */}
        <div className="lg:col-span-8 bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] flex flex-col overflow-hidden">
          <div className={`px-8 py-5 border-b-[3px] border-double ${theme.headerBorder} bg-[#e8eef6] flex justify-between items-center`}>
            <h3 className="text-sm font-bold text-[#1e2a3a] uppercase tracking-widest">Tin tức & Công văn Mới</h3>
            <span className="text-[10px] bg-[#1e2a3a] text-[#a8c4e0] px-3 py-1 font-bold tracking-widest uppercase border border-[#131a25]">{documents.length} Mới</span>
          </div>
          <div className="flex-1 p-6 flex flex-col gap-0 divide-y justify-center divide-[#b8c6d9]">
            {documents.length === 0 ? (
              <div className="text-center py-8 text-[#7b8a9e] font-medium text-xs uppercase tracking-wider">Không có tin tức hay công văn mới nào.</div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className={`flex gap-6 items-start py-4 group cursor-pointer hover:${theme.activeBg}/50 px-2 transition-colors`}>
                  <div 
                    className="w-12 h-12 flex-shrink-0 bg-[#f5f8fc] border border-[#b8c6d9] flex items-center justify-center font-bold text-xs shadow-[2px_2px_0px_#dce4ee] rotate-1 group-hover:rotate-0 transition-transform font-serif uppercase"
                    style={{ color: doc.color }}
                  >
                    {doc.tag.substring(0, 2)}
                  </div>
                  <div className="flex-1 pt-1 min-w-0">
                    <div className={`text-base font-serif font-bold text-[#1e2a3a] group-hover:${theme.primaryText} transition-colors leading-snug truncate`} title={doc.title}>
                      {doc.title}
                    </div>
                    <div className="text-[13px] text-[#4a5568] mt-1.5 leading-relaxed font-medium line-clamp-2" title={doc.desc}>
                      {doc.desc}
                    </div>
                  </div>
                  <div className="text-[10px] font-bold text-[#7b8a9e] uppercase tracking-widest whitespace-nowrap pt-2">{doc.date.split(' • ')[0]}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="flex-1 bg-[#f5f8fc] rounded-3xl border border-[#b8c6d9] shadow-[4px_4px_0px_#dce4ee] p-8 flex flex-col">
            <h3 className={`text-sm font-bold text-[#1e2a3a] mb-6 uppercase tracking-widest border-b-[3px] border-double ${theme.headerBorder} pb-3`}>Phím Tắt Tiện Ích</h3>
            <div className="space-y-4 my-auto">
              {ROLE_SHORTCUTS[currentRole].map((shortcut, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectModule && onSelectModule(shortcut.action)}
                  className={`w-full text-left px-5 py-3.5 bg-[#e8eef6] hover:${theme.activeBg} hover:${theme.primaryText} text-[#4a5568] font-bold text-xs tracking-widest uppercase transition-colors border ${theme.headerBorder} shadow-[2px_2px_0px_#dce4ee] hover:shadow-none group flex items-center justify-between rounded-full hover:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] cursor-pointer`}
                >
                  <span>{shortcut.label}</span>
                  <span className={`font-serif italic font-normal text-lg group-hover:${theme.primaryText}`}>&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Panel>
  );
};
