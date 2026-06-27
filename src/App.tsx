import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewPanel } from './components/modules/OverviewPanel';
import { TimetablePanel } from './components/modules/TimetablePanel';
import { ClassesPanel } from './components/modules/ClassesPanel';
import { AssignmentsPanel } from './components/modules/AssignmentsPanel';
import { StudentsPanel } from './components/modules/StudentsPanel';
import { PersonnelPanel } from './components/modules/PersonnelPanel';
import { AcademicsPanel } from './components/modules/AcademicsPanel';
import { FacilitiesPanel } from './components/modules/FacilitiesPanel';
import { FinancePanel } from './components/modules/FinancePanel';
import { AdminPanel } from './components/modules/AdminPanel';
import { LibraryPanel } from './components/modules/LibraryPanel';
import { DepartmentsPanel } from './components/modules/DepartmentsPanel';
import { YouthUnionPanel } from './components/modules/YouthUnionPanel';
import { HealthPanel } from './components/modules/HealthPanel';
import { QualityAssurancePanel } from './components/modules/QualityAssurancePanel';
import { CounselingPanel } from './components/modules/CounselingPanel';
import { BoardingPanel } from './components/modules/BoardingPanel';
import { PartyUnionPanel } from './components/modules/PartyUnionPanel';
import { SettingsPanel } from './components/modules/SettingsPanel';
import { UserProfilePanel } from './components/modules/UserProfilePanel';
import { AdmissionsPanel } from './components/modules/AdmissionsPanel';
import { PromotionPanel } from './components/modules/PromotionPanel';
import { AlumniPanel } from './components/modules/AlumniPanel';
import { GraduationPanel } from './components/modules/GraduationPanel';
import { TeacherWorkspace } from './components/modules/TeacherWorkspace'; // Teacher workspace workspace view
import { SecurityPanel } from './components/modules/SecurityPanel';
import { CleanerPanel } from './components/modules/CleanerPanel';
import { SystemRosterPanel } from './components/modules/SystemRosterPanel';
import { StudentPortal } from './components/modules/StudentPortal';
import { ModuleId, UserRole } from './types';
import { auth } from './services/firebase';
import SystemLogo from './components/ui/SystemLogo';
import { Login } from './components/layout/Login';
import { LandingPage } from './components/layout/LandingPage';
import { ROLE_MODULES, ROLE_DEFAULT_MODULES } from './data/navigation';
import { getRoleFromEmail } from './utils/role';

interface ModuleConfig {
  path: string;
  title: string;
  description: string;
}

const MODULE_ROUTES: Record<ModuleId, ModuleConfig> = {
  overview: {
    path: '/',
    title: 'Tổng quan - Trường Mầm non An Hữu',
    description: 'Hệ thống quản lý thông tin tổng quan trường Mầm non An Hữu.'
  },
  students: {
    path: '/hoc-sinh',
    title: 'Quản lý Trẻ | Mầm non An Hữu',
    description: 'Quản lý hồ sơ lý lịch trẻ, chuyên cần và đánh giá phát triển.'
  },
  classes: {
    path: '/lop-hoc',
    title: 'Quản lý Lớp học | Mầm non An Hữu',
    description: 'Danh sách và thông tin chi tiết các lớp học, giáo viên chủ nhiệm và trẻ các khối lớp.'
  },
  personnel: {
    path: '/nhan-su',
    title: 'Quản lý Nhân sự | Mầm non An Hữu',
    description: 'Danh sách giáo viên, nhân viên, cơ cấu tổ chức và ban giám hiệu nhà trường.'
  },
  academics: {
    path: '/chuyen-mon',
    title: 'Quản lý Chuyên môn | Mầm non An Hữu',
    description: 'Quản lý kế hoạch dạy học, chương trình học, đề án giáo dục địa phương và phân ban học tập.'
  },
  timetable: {
    path: '/thoi-khoa-bieu',
    title: 'Thời khóa biểu | Mầm non An Hữu',
    description: 'Xem, sắp xếp và xuất dữ liệu thời khóa biểu giảng dạy và học tập toàn trường.'
  },
  assignments: {
    path: '/phan-cong',
    title: 'Phân công giảng dạy | Mầm non An Hữu',
    description: 'Phân công chuyên môn, số tiết dạy, lớp phụ trách của từng cán bộ giáo viên.'
  },
  departments: {
    path: '/to-chuyen-mon',
    title: 'Tổ chuyên môn | Mầm non An Hữu',
    description: 'Quản lý tổ bộ môn khoa học tự nhiên, khoa học xã hội, văn thể mỹ.'
  },
  facilities: {
    path: '/co-so-vat-chat',
    title: 'Cơ sở vật chất | Mầm non An Hữu',
    description: 'Theo dõi tài sản học đường, thiết bị dạy học phòng thí nghiệm và kế hoạch bảo trì phòng học.'
  },
  finance: {
    path: '/tai-chinh',
    title: 'Quản lý Tài chính | Mầm non An Hữu',
    description: 'Theo dõi học phí, phiếu thu chi ngân sách nhà trường và quyết toán tài chính định kỳ.'
  },
  'finance-overview': {
    path: '/tai-chinh/tong-quan',
    title: 'Tổng quan Tài chính | Mầm non An Hữu',
    description: 'Thống kê tình hình tài chính tổng quan, số dư tiền mặt, ngân hàng và quỹ lương dự kiến.'
  },
  'finance-fees': {
    path: '/tai-chinh/cau-hinh-dot-thu',
    title: 'Cấu hình Đợt thu | Mầm non An Hữu',
    description: 'Thiết lập định mức thu học phí chính khóa, phí bán trú, bảo hiểm y tế và nước uống.'
  },
  'finance-tuition': {
    path: '/tai-chinh/cong-no-hoc-phi',
    title: 'Quản lý Công nợ Học phí | Mầm non An Hữu',
    description: 'Theo dõi tiến độ đóng học phí, công nợ và đối tượng miễn giảm học phí học sinh.'
  },
  'finance-receipts': {
    path: '/tai-chinh/bien-lai',
    title: 'Danh sách Biên lai | Mầm non An Hữu',
    description: 'Lịch sử phát hành biên lai điện tử, gạch nợ học phí và yêu cầu hủy biên lai lỗi.'
  },
  'finance-payroll': {
    path: '/tai-chinh/bang-luong',
    title: 'Bảng lương & Phụ cấp | Mầm non An Hữu',
    description: 'Tính toán lương, phụ cấp thâm niên và tiết dạy vượt giờ cho cán bộ giáo viên.'
  },
  'finance-expenses': {
    path: '/tai-chinh/chi-phi-van-hanh',
    title: 'Chi phí Vận hành & Mua sắm | Mầm non An Hữu',
    description: 'Quản lý các hóa đơn điện, nước, viễn thông và mua sắm vật tư thiết bị học đường.'
  },
  'finance-maintenance': {
    path: '/tai-chinh/thanh-toan-bao-tri',
    title: 'Duyệt Chi Sửa Chữa & Bảo Trì | Mầm non An Hữu',
    description: 'Duyệt chi thanh toán các phiếu báo hỏng cơ sở vật chất đã nghiệm thu hoàn thành.'
  },
  'finance-ledger': {
    path: '/tai-chinh/so-quy',
    title: 'Sổ quỹ Tiền mặt & Tiền gửi | Mầm non An Hữu',
    description: 'Theo dõi biến động số dư tài khoản ngân hàng và két sắt tiền mặt nhà trường.'
  },
  'finance-reports': {
    path: '/tai-chinh/bao-cao-thu-chi',
    title: 'Báo cáo Thu Chi & Quyết toán | Mầm non An Hữu',
    description: 'Báo cáo doanh thu học phí, chi phí hoạt động và cân đối kế toán định kỳ.'
  },
  'finance-tax': {
    path: '/tai-chinh/file-thong-ke',
    title: 'Đẩy File Thống kê & Thuế | Mầm non An Hữu',
    description: 'Kết xuất và tải xuống dữ liệu giao dịch chuẩn định dạng Kho bạc và MISA.'
  },
  'finance-config': {
    path: '/tai-chinh/cau-hinh-dinh-muc',
    title: 'Cấu hình Định mức Tài chính | Mầm non An Hữu',
    description: 'Kế toán trưởng cấu hình mức thu học phí khối lớp và hạn chế khóa sổ kế toán.'
  },
  'finance-audit': {
    path: '/tai-chinh/nhat-ky-kiem-toan',
    title: 'Nhật ký Kiểm toán Tài chính | Mầm non An Hữu',
    description: 'Kế toán trưởng giám sát lịch sử thao tác lập đề xuất, hủy biên lai của kế toán viên.'
  },
  admin: {
    path: '/hanh-chinh',
    title: 'Văn thư hành chính | Mầm non An Hữu',
    description: 'Quản lý công văn đi đến, văn bản chỉ đạo của sở GD-ĐT và lưu trữ hồ sơ pháp lý.'
  },
  secretary: {
    path: '/thu-ky',
    title: 'Thư ký hội đồng | Mầm non An Hữu',
    description: 'Quản lý công văn đi đến, văn bản chỉ đạo và công tác hội đồng trường.'
  },
  'secretary-overview': {
    path: '/thu-ky/tong-quan',
    title: 'Tổng quan Thư ký | Mầm non An Hữu',
    description: 'Bảng theo dõi tổng quan công văn, lịch trình họp và yêu cầu văn thư hành chính.'
  },
  'secretary-documents': {
    path: '/thu-ky/cong-van',
    title: 'Số công văn điện tử | Mầm non An Hữu',
    description: 'Sổ quản lý công văn đi, công văn đến, và trình ký văn bản nội bộ.'
  },
  'secretary-council': {
    path: '/thu-ky/hoi-dong',
    title: 'Công tác Hội đồng | Mầm non An Hữu',
    description: 'Quản lý lịch công tác tuần, biên bản họp và nghị quyết hội đồng trường.'
  },
  'secretary-storage': {
    path: '/thu-ky/luu-tru',
    title: 'Lưu trữ & Cấp phát | Mầm non An Hữu',
    description: 'Sổ gốc và phôi bằng tốt nghiệp, tiếp nhận xử lý yêu cầu cấp bản sao học bạ.'
  },
  'secretary-bulletin': {
    path: '/thu-ky/bang-tin',
    title: 'Bảng tin nhà trường | Mầm non An Hữu',
    description: 'Đăng tải thông báo chỉ đạo, kế hoạch hoạt động nội bộ và phạm vi phổ biến.'
  },
  'library-overview': {
    path: '/thu-vien/tong-quan',
    title: 'Tổng quan Thư viện | Mầm non An Hữu',
    description: 'Trang tổng quan hoạt động và các chỉ số kho tài nguyên thư viện.'
  },
  'library-circulation': {
    path: '/thu-vien/muon-tra',
    title: 'Nghiệp vụ Mượn - Trả sách | Mầm non An Hữu',
    description: 'Quy trình lưu thông sách mượn về, mượn tại chỗ và xử lý quá hạn.'
  },
  'library-inventory': {
    path: '/thu-vien/bien-muc',
    title: 'Biên mục & Quản lý Kho sách | Mầm non An Hữu',
    description: 'Biên mục đầu sách mới, nhập kho và tự động sinh nhãn mã vạch.'
  },
  'library-readers': {
    path: '/thu-vien/ban-doc',
    title: 'Quản lý Bạn đọc Thư viện | Mầm non An Hữu',
    description: 'Hồ sơ lý lịch mượn đọc của học sinh và giáo viên.'
  },
  'library-audit': {
    path: '/thu-vien/kiem-ke-tai-san',
    title: 'Kiểm kê Tài sản & Hao mòn | Mầm non An Hữu',
    description: 'Kiểm kê sách định kỳ, thanh lý ấn phẩm hỏng rách và đề xuất mua sắm.'
  },
  'youth-union': {
    path: '/doan-thanh-nien',
    title: 'Đoàn Thanh Niên & Phong Trào | Mầm non An Hữu',
    description: 'Quản lý điểm thi đua cờ đỏ các khối lớp, hồ sơ đoàn tịch đoàn viên và các chiến dịch thiện nguyện.'
  },
  health: {
    path: '/y-te',
    title: 'Y tế học đường | Mầm non An Hữu',
    description: 'Quản lý hồ sơ sức khỏe định kỳ học sinh, danh mục tủ thuốc và sự cố y tế.'
  },
  'quality-assurance': {
    path: '/khao-thi',
    title: 'Khảo thí & Đảm bảo chất lượng | Mầm non An Hữu',
    description: 'Quản lý ngân hàng đề thi, lên kế hoạch kiểm tra tập trung và báo cáo kiểm định chất lượng.'
  },
  counseling: {
    path: '/tu-van-tam-ly',
    title: 'Tư văn tâm lý & Hướng nghiệp | Mầm non An Hữu',
    description: 'Hỗ trợ tư vấn tâm lý học sinh học đường, hướng nghiệp đại học và các chuyên đề sinh hoạt.'
  },
  boarding: {
    path: '/ban-tru',
    title: 'Quản lý Bán trú | Mầm non An Hữu',
    description: 'Quản lý bếp ăn bán trú học sinh, danh sách phòng ngủ và định lượng suất ăn dinh dưỡng.'
  },
  'party-union': {
    path: '/dang-bo',
    title: 'Đảng bộ & Công đoàn | Mầm non An Hữu',
    description: 'Quản lý hồ sơ đảng viên, sinh hoạt chi bộ và hoạt động công đoàn nhà trường.'
  },
  settings: {
    path: '/cai-dat',
    title: 'Cấu hình hệ thống | Mầm non An Hữu',
    description: 'Thiết lập tham số toàn trường, sao lưu và phục hồi dữ liệu hệ thống.'
  },
  'user-profile': {
    path: '/thong-tin-tai-khoan',
    title: 'Thông tin cá nhân | Mầm non An Hữu',
    description: 'Xem và chỉnh sửa thông tin tài khoản người dùng, phân quyền truy cập hệ thống.'
  },
  admissions: {
    path: '/tuyen-sinh',
    title: 'Tuyển sinh Online | Mầm non An Hữu',
    description: 'Xem và phê duyệt danh sách hồ sơ tuyển sinh lớp 1 nộp trực tuyến.'
  },
  promotion: {
    path: '/ket-chuyen',
    title: 'Kết chuyển năm học | Mầm non An Hữu',
    description: 'Xử lý xét duyệt lên lớp, rèn luyện hè và phân lớp kết chuyển năm học mới.'
  },
  graduation: {
    path: '/tot-nghiep',
    title: 'Quản lý Tốt nghiệp | Mầm non An Hữu',
    description: 'Quản lý hồ sơ hoàn thành chương trình Mầm non lớp 12, xét duyệt điều kiện dự thi và cấp phát bằng tốt nghiệp.'
  },
  alumni: {
    path: '/cuu-hoc-sinh',
    title: 'Cựu học sinh | Mầm non An Hữu',
    description: 'Lưu trữ thông tin học sinh đã tốt nghiệp qua các niên khóa.'
  },
  'dept-overview': {
    path: '/to-chuyen-mon/tong-quan',
    title: 'Tổng quan chuyên môn | Mầm non An Hữu',
    description: 'Báo cáo tổng quan hoạt động và nhân sự tổ chuyên môn.'
  },
  'dept-lesson-plans': {
    path: '/to-chuyen-mon/duyet-giao-an',
    title: 'Duyệt Giáo án | Mầm non An Hữu',
    description: 'Phê duyệt giáo án của giáo viên trong tổ bộ môn.'
  },
  'dept-assignments': {
    path: '/to-chuyen-mon/phan-cong-giang-day',
    title: 'Phân công giảng dạy | Mầm non An Hữu',
    description: 'Quản lý ma trận phân công giảng dạy toàn tổ.'
  },
  'dept-evaluation': {
    path: '/to-chuyen-mon/danh-gia-thi-dua',
    title: 'Đánh giá & Thi đua | Mầm non An Hữu',
    description: 'Đánh giá chuẩn nghề nghiệp giáo viên và đề xuất thi đua.'
  },
  'dept-analytics': {
    path: '/to-chuyen-mon/pho-diem-chat-luong',
    title: 'Phổ điểm & Chất lượng | Mầm non An Hữu',
    description: 'Phân tích kết quả học tập và chất lượng giảng dạy môn học.'
  },
  'timetable-schedule': {
    path: '/thoi-khoa-bieu/lich-hoc',
    title: 'Lịch học | Mầm non An Hữu',
    description: 'Thời khóa biểu và lịch học chi tiết.'
  },
  'timetable-exam': {
    path: '/thoi-khoa-bieu/lich-thi',
    title: 'Lịch thi học kỳ | Mầm non An Hữu',
    description: 'Lịch thi học kỳ chi tiết.'
  },
  'teacher-overview': {
    path: '/giao-vien/tong-quan',
    title: 'Không gian Giáo viên | Mầm non An Hữu',
    description: 'Trang tổng quan trợ lý giảng dạy cho giáo viên Mầm non An Hữu.'
  },
  'teacher-timetable': {
    path: '/giao-vien/thoi-khoa-bieu',
    title: 'Thời khóa biểu & Báo giảng | Mầm non An Hữu',
    description: 'Thời khóa biểu và lịch báo giảng cá nhân của giáo viên.'
  },
  'teacher-lesson-plans': {
    path: '/giao-vien/giao-an',
    title: 'Kế hoạch bài dạy (Giáo án) | Mầm non An Hữu',
    description: 'Quản lý, nộp và xem phê duyệt kế hoạch bài dạy của giáo viên.'
  },
  'teacher-gradebook': {
    path: '/giao-vien/so-diem-dien-tu',
    title: 'Sổ điểm điện tử | Mầm non An Hữu',
    description: 'Nhập điểm chuyên cần, thường xuyên, giữa kỳ và cuối kỳ cho học sinh.'
  },
  'teacher-diary': {
    path: '/giao-vien/so-dau-bai',
    title: 'Sổ đầu bài điện tử | Mầm non An Hữu',
    description: 'Ghi nhận nhận xét tiết học, bài học và đánh giá thi đua học tập.'
  },
  'homeroom-profile': {
    path: '/giao-vien/lop-chu-nhiem',
    title: 'Hồ sơ lớp chủ nhiệm | Mầm non An Hữu',
    description: 'Danh sách và thông tin chi tiết học sinh lớp chủ nhiệm.'
  },
  'homeroom-attendance': {
    path: '/giao-vien/diem-danh-lop',
    title: 'Quản lý chuyên cần lớp chủ nhiệm | Mầm non An Hữu',
    description: 'Ghi nhận vắng trễ học sinh lớp chủ nhiệm hàng ngày.'
  },
  'homeroom-conduct': {
    path: '/giao-vien/danh-gia-hanh-kiem',
    title: 'Đánh giá hạnh kiểm | Mầm non An Hữu',
    description: 'Bình bầu đánh giá hạnh kiểm rèn luyện học kỳ và cuối năm.'
  },
  'teacher-profile': {
    path: '/giao-vien/ly-lich',
    title: 'Hồ sơ lý lịch cán bộ | Mầm non An Hữu',
    description: 'Lý lịch trích ngang, ngạch lương và bằng cấp giáo viên.'
  },
  'teacher-evaluation': {
    path: '/giao-vien/tu-danh-gia',
    title: 'Tự đánh giá chuẩn nghề nghiệp | Mầm non An Hữu',
    description: 'Bản tự đánh giá 15 tiêu chí năng lực nghề nghiệp giáo viên.'
  },
  'teacher-maintenance': {
    path: '/giao-vien/bao-hong',
    title: 'Báo hỏng cơ sở vật chất | Mầm non An Hữu',
    description: 'Báo cáo sự cố hư hỏng máy chiếu, điều hòa, trang thiết bị phòng học.'
  },
  'teacher-contacts': {
    path: '/giao-vien/danh-ba',
    title: 'Danh bạ nội bộ | Mầm non An Hữu',
    description: 'Tra cứu nhanh thông tin số điện thoại, email đồng nghiệp phụ huynh.'
  },
  'security-overview': {
    path: '/an-ninh/tong-quan',
    title: 'Tổng quan An ninh | Mầm non An Hữu',
    description: 'Báo cáo tình trạng an ninh và bàn giao ca trực phòng bảo vệ.'
  },
  'security-access': {
    path: '/an-ninh/kiem-soat-ra-vao',
    title: 'Kiểm soát Ra vào | Mầm non An Hữu',
    description: 'Quản lý ra vào của khách viếng thăm, học sinh và nhà thầu bảo trì.'
  },
  'security-assets': {
    path: '/an-ninh/an-ninh-tai-san',
    title: 'An ninh Tài sản | Mầm non An Hữu',
    description: 'Kiểm soát tài sản luân chuyển và nhật ký tuần tra phòng học.'
  },
  'security-parking': {
    path: '/an-ninh/quan-ly-bai-xe',
    title: 'Quản lý Bãi xe | Mầm non An Hữu',
    description: 'Đối chiếu thông tin biển số xe học sinh giáo viên.'
  },
  'security-incidents': {
    path: '/an-ninh/bao-cao-su-co',
    title: 'Báo cáo Sự cố | Mầm non An Hữu',
    description: 'Ghi nhận và báo cáo khẩn cấp các sự việc an ninh phát sinh.'
  },
  'security-schedule': {
    path: '/an-ninh/phan-ca-truc',
    title: 'Lịch trực bảo vệ | Mầm non An Hữu',
    description: 'Phân công ca trực tuần và ca trực gác cổng trường học.'
  },
  'security-attendance': {
    path: '/an-ninh/cham-cong-phep',
    title: 'Chấm công & Nghỉ phép bảo vệ | Mầm non An Hữu',
    description: 'Xét duyệt đơn xin nghỉ phép của nhân sự tổ bảo vệ.'
  },
  'security-reports': {
    path: '/an-ninh/bao-cao-thang',
    title: 'Báo cáo An ninh tháng | Mầm non An Hữu',
    description: 'Thống kê tổng hợp tình hình sự cố an ninh định kỳ hàng tháng.'
  },
  'security': {
    path: '/an-ninh',
    title: 'Phòng Bảo Vệ | Mầm non An Hữu',
    description: 'Không gian làm việc và trực ban của nhân viên bảo vệ.'
  },
  'cleaner-overview': {
    path: '/lao-cong',
    title: 'Trang chủ Lao công | Mầm non An Hữu',
    description: 'Màn hình theo dõi công việc và nhiệm vụ hàng ngày của lao công.'
  },
  'cleaner-schedule': {
    path: '/lao-cong/lich-trinh',
    title: 'Lịch trình Quét dọn | Mầm non An Hữu',
    description: 'Lịch biểu phân công các khu vực vệ sinh định kỳ trong trường.'
  },
  'cleaner-supplies': {
    path: '/lao-cong/vat-tu',
    title: 'Quản lý Vật tư Tạp vụ | Mầm non An Hữu',
    description: 'Xem số lượng tồn kho dụng cụ, hóa chất vệ sinh và yêu cầu cấp mới.'
  },
  'cleaner-reports': {
    path: '/lao-cong/bao-cao-su-co',
    title: 'Báo cáo sự cố vệ sinh | Mầm non An Hữu',
    description: 'Báo cáo nhanh các vấn đề hư hỏng cơ sở vật chất vệ sinh học đường.'
  },
  'system-roster': {
    path: '/quan-ly-lich-truc',
    title: 'Quản lý Lịch trực Hệ thống | Mầm non An Hữu',
    description: 'Ban Giám Hiệu quản lý lịch trực Bảo vệ, Tạp vụ và Thư viện toàn trường.'
  },
  'student-portal': {
    path: '/phu-huynh/trang-chu',
    title: 'Cổng Phụ Huynh | Mầm non An Hữu',
    description: 'Trang cá nhân phụ huynh, theo dõi lịch sinh hoạt, sổ bé ngoan và hoạt động của bé.'
  },
  'student-timetable': {
    path: '/phu-huynh/lich-sinh-hoat',
    title: 'Lịch sinh hoạt của bé | Mầm non An Hữu',
    description: 'Xem lịch sinh hoạt, học tập và vui chơi của bé.'
  },
  'student-grades': {
    path: '/phu-huynh/so-be-ngoan',
    title: 'Sổ Bé Ngoan | Mầm non An Hữu',
    description: 'Xem sổ bé ngoan, phiếu đánh giá sự phát triển và nhận xét từ giáo viên.'
  },
  'student-conduct': {
    path: '/phu-huynh/chuyen-can',
    title: 'Chuyên cần & Ăn uống | Mầm non An Hữu',
    description: 'Theo dõi chuyên cần, chế độ ăn uống và vệ sinh của bé.'
  },
  'student-leave': {
    path: '/phu-huynh/xin-nghi-phep',
    title: 'Xin nghỉ phép | Mầm non An Hữu',
    description: 'Tạo và theo dõi đơn xin nghỉ phép của bé.'
  },
  'student-privilege': {
    path: '/phu-huynh/dac-quyen',
    title: 'Đặc quyền Phụ huynh | Mầm non An Hữu',
    description: 'Các công cụ dành riêng cho phụ huynh để đồng hành cùng nhà trường.'
  },
  'health-dashboard': {
    path: '/y-te/tong-quan',
    title: 'Tổng quan Y tế | Mầm non An Hữu',
    description: 'Bảng giám sát sức khỏe học đường thời gian thực.'
  },
  'health-records': {
    path: '/y-te/ho-so-suc-khoe',
    title: 'Hồ sơ Sức khỏe | Mầm non An Hữu',
    description: 'Quản lý hồ sơ sức khỏe sinh lý học sinh.'
  },
  'health-log': {
    path: '/y-te/nhat-ky-kham',
    title: 'Nhật ký Khám & Sơ cứu | Mầm non An Hữu',
    description: 'Nhật ký chẩn đoán sơ cấp cứu hằng ngày.'
  },
  'health-inventory': {
    path: '/y-te/tu-thuoc',
    title: 'Tủ thuốc & Vật tư | Mầm non An Hữu',
    description: 'Quản lý kho dược phẩm và thiết bị y tế học đường.'
  },
  'health-epidemic': {
    path: '/y-te/dich-benh',
    title: 'Dịch bệnh & Tiêm chủng | Mầm non An Hữu',
    description: 'Theo dõi dịch bệnh truyền nhiễm và bao phủ tiêm chủng.'
  },
  'health-insurance': {
    path: '/y-te/bao-hiem',
    title: 'Bảo hiểm Y tế | Mầm non An Hữu',
    description: 'Kiểm soát thẻ bảo hiểm y tế và tai nạn học đường.'
  },
  'health-reports': {
    path: '/y-te/bao-cao-lien-lac',
    title: 'Liên lạc & Báo cáo | Mầm non An Hữu',
    description: 'Báo cáo y tế định kỳ và danh bạ liên lạc nội bộ.'
  },
  'boarding-dashboard': {
    path: '/ban-tru/tong-quan',
    title: 'Điều Phối Bếp | Mầm non An Hữu',
    description: 'Bảng tin theo dõi số liệu chốt trong ngày và cảnh báo y tế dị ứng học sinh.'
  },
  'boarding-communication': {
    path: '/ban-tru/truyen-tin',
    title: 'Báo Cáo & Truyền Tin | Mầm non An Hữu',
    description: 'Truyền trạng thái dây chuyền chế biến và ghi nhận chỉ số thức ăn thừa.'
  },
  'boarding-inventory': {
    path: '/ban-tru/kho-dinh-luong',
    title: 'Kho & Định Lượng | Mầm non An Hữu',
    description: 'Kiểm thực thực phẩm đầu ngày và công cụ tự động tính định lượng chế biến.'
  },
  'boarding-atvstp': {
    path: '/ban-tru/ve-sinh-luu-mau',
    title: 'Vệ Sinh & Lưu Mẫu | Mầm non An Hữu',
    description: 'Hồ sơ kiểm thực 3 bước điện tử và giám sát hộp mẫu thức ăn lưu trữ 24 giờ.'
  },
  'boarding-closing': {
    path: '/ban-tru/ca-truc-dong-ca',
    title: 'Ca Trực & Đóng Ca | Mầm non An Hữu',
    description: 'Bảng phân công trực ban và danh sách đóng ca an toàn phòng cháy chữa cháy.'
  },
  'boarding-rooms': {
    path: '/ban-tru/nghi-trua',
    title: 'Nghỉ Trưa Bán Trú | Mầm non An Hữu',
    description: 'Giám sát phân phòng ngủ và điểm danh nhanh học sinh nghỉ trưa bán trú.'
  }
};

export default function App() {
  const [activeModule, setActiveModule] = useState<ModuleId>(() => {
    const currentPath = window.location.pathname;
    const match = Object.keys(MODULE_ROUTES).find(
      (key) => MODULE_ROUTES[key as ModuleId].path === currentPath
    );
    if (match) {
      return match as ModuleId;
    }
    const stored = localStorage.getItem('activeModule');
    return (stored as ModuleId) || 'overview';
  });
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showLanding, setShowLanding] = useState(() => {
    if (window.location.pathname !== '/' && window.location.pathname !== '') {
      return false;
    }
    const stored = localStorage.getItem('show_landing');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    localStorage.setItem('show_landing', String(showLanding));
  }, [showLanding]);

  const [currentRole, setCurrentRole] = useState<UserRole>(() => (localStorage.getItem('current_user_role') as UserRole) || 'school_board');

  // Listen for role changes from outside (if any)
  useEffect(() => {
    const handleRoleChanged = () => {
      const stored = localStorage.getItem('current_user_role') as UserRole;
      if (stored && stored !== currentRole) {
        setCurrentRole(stored);
      }
    };
    window.addEventListener('role-changed', handleRoleChanged);
    return () => window.removeEventListener('role-changed', handleRoleChanged);
  }, [currentRole]);

  const handleChangeRole = (role: UserRole) => {
    setCurrentRole(role);
    localStorage.setItem('current_user_role', role);
    window.dispatchEvent(new Event('role-changed'));

    // Check module permissions
    const allowed = ROLE_MODULES[role] || [];
    if (!allowed.includes(activeModule)) {
      const nextModule = ROLE_DEFAULT_MODULES[role] || allowed[0] || 'overview';
      setActiveModule(nextModule);
      const config = MODULE_ROUTES[nextModule];
      if (config) {
        window.history.pushState(null, '', config.path);
      }
    }
  };

  // Sync state to URL and SEO Meta tags on activeModule change
  useEffect(() => {
    const config = MODULE_ROUTES[activeModule];
    if (config) {
      // 1. Update document title
      document.title = config.title;

      // 2. Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', config.description);

      // 3. Update OG title
      let ogTitle = document.querySelector('meta[property="og:title"]');
      if (!ogTitle) {
        ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitle);
      }
      ogTitle.setAttribute('content', config.title);

      // 4. Update OG description
      let ogDesc = document.querySelector('meta[property="og:description"]');
      if (!ogDesc) {
        ogDesc = document.createElement('meta');
        ogDesc.setAttribute('property', 'og:description');
        document.head.appendChild(ogDesc);
      }
      ogDesc.setAttribute('content', config.description);
    }
    localStorage.setItem('activeModule', activeModule);
  }, [activeModule]);

  // Synchronize browser backward/forward navigation with active module
  useEffect(() => {
    const handlePopState = () => {
      const currentPath = window.location.pathname;
      const match = Object.keys(MODULE_ROUTES).find(
        (key) => MODULE_ROUTES[key as ModuleId].path === currentPath
      );
      if (match) {
        setActiveModule(match as ModuleId);
      } else if (currentPath === '/' || currentPath === '') {
        setActiveModule('overview');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectModule = (moduleId: ModuleId) => {
    setActiveModule(moduleId);
    const config = MODULE_ROUTES[moduleId];
    if (config) {
      window.history.pushState(null, '', config.path);
    }
  };

  useEffect(() => {
    let firebaseUnsubscribe: (() => void) | null = null;

    const syncAuth = (currentUser: any) => {
      setUser(currentUser);
      if (currentUser) {
        // Retain any manually switched role in localStorage, or fall back to the account's default role
        const cleanEmail = currentUser.email?.toLowerCase().trim();
        const storedEmail = localStorage.getItem('current_user_email');
        let storedRole = localStorage.getItem('current_user_role') as UserRole | null;

        if (storedEmail !== cleanEmail) {
          localStorage.removeItem('current_user_role');
          storedRole = null;
          localStorage.setItem('current_user_email', cleanEmail || '');
        }

        let role = storedRole || getRoleFromEmail(currentUser.email);
        if (currentUser.email && (currentUser.email.toLowerCase().includes('@student.') || currentUser.email.toLowerCase().includes('student'))) {
          role = 'student';
        }
        setCurrentRole(role);
        localStorage.setItem('current_user_role', role);

        // Check if user just logged in (from Login screen)
        const justLoggedIn = localStorage.getItem('just_logged_in');
        if (justLoggedIn === 'true') {
          localStorage.removeItem('just_logged_in');
          const defaultModule = ROLE_DEFAULT_MODULES[role] || 'overview';
          setActiveModule(defaultModule);
          const config = MODULE_ROUTES[defaultModule];
          if (config) {
            window.history.pushState(null, '', config.path);
          }
        }

        // Async resolve real role if not manually set (only for staff, skip for students)
        if (!storedRole && getRoleFromEmail(currentUser.email) !== 'student') {
          (async () => {
            try {
              const { getStaffList } = await import('./services/hrService');
              const staffList = await getStaffList();
              if (staffList && staffList.length > 0) {
                const cleanEmail = currentUser.email?.toLowerCase().trim();
                const staff = staffList.find(s => s && s.email && s.email.toLowerCase().trim() === cleanEmail);
                if (staff) {
                  const job = (staff.jobRole || '').toLowerCase().trim();
                  const role = (staff.role || '').toLowerCase().trim();
                  let resolvedRole: UserRole = getRoleFromEmail(currentUser.email);
                  
                  if (job.includes('giám hiệu') || job.includes('hiệu trưởng') || job.includes('bgh') || role.includes('hiệu trưởng') || role.includes('giám hiệu')) {
                    resolvedRole = 'school_board';
                  } else if (role.includes('tổng phụ trách')) {
                    resolvedRole = 'activities_head';
                  } else if (job.includes('tổ trưởng chuyên môn') || job.includes('tổ trưởng cm') || role.includes('tổ trưởng chuyên môn') || role.includes('tổ trưởng cm')) {
                    resolvedRole = 'department_head';
                  } else if (job.includes('kế toán') || role.includes('kế toán')) {
                    resolvedRole = (role.includes('trưởng') || job.includes('trưởng')) ? 'chief_accountant' : 'accounting';
                  } else if (job.includes('y tế') || role.includes('y tế')) {
                    resolvedRole = 'nurse';
                  } else if (job.includes('thư viện') || role.includes('thư viện')) {
                    resolvedRole = 'librarian';
                  } else if (job.includes('kỹ thuật') || role.includes('kỹ thuật')) {
                    resolvedRole = 'school_board';
                  } else if (job.includes('thư ký') || job.includes('văn thư') || role.includes('thư ký') || role.includes('văn thư') || job.includes('hành chính') || role.includes('hành chính')) {
                    resolvedRole = 'admin_staff';
                  } else if (job.includes('bảo vệ') || role.includes('bảo vệ')) {
                    resolvedRole = 'security';
                  } else if (job.includes('tạp vụ') || job.includes('lao cong') || role.includes('tạp vụ') || role.includes('lao cong') || job.includes('lao động') || role.includes('lao động')) {
                    resolvedRole = 'cleaner';
                  } else if (job.includes('giáo viên') || role.includes('giáo viên')) {
                    if (role.includes('chủ nhiệm') || staff.assignedClass) {
                      resolvedRole = 'homeroom_teacher';
                    } else {
                      resolvedRole = 'subject_teacher';
                    }
                  }
                  
                  setCurrentRole(resolvedRole);
                  localStorage.setItem('current_user_role', resolvedRole);
                }
              }
            } catch (err) {
              console.error("Error resolving user role from staff list:", err);
            }
          })();
        }
      } else {
        localStorage.removeItem('current_user_role');
      }
      setAuthLoading(false);
    };

    const handleAuthCheck = () => {
      // Cleanup previous listener
      if (firebaseUnsubscribe) {
        firebaseUnsubscribe();
        firebaseUnsubscribe = null;
      }

      const mockUserEmail = localStorage.getItem('mock_user_email');
      if (mockUserEmail) {
        syncAuth({ email: mockUserEmail, uid: `mock_uid_${mockUserEmail.split('@')[0]}` });
      } else {
        firebaseUnsubscribe = auth.onAuthStateChanged((currentUser) => {
          if (localStorage.getItem('mock_user_email')) return; // Ignore if mock login happened in the meantime
          syncAuth(currentUser);
        });
      }
    };

    handleAuthCheck();

    window.addEventListener('mock-login-changed', handleAuthCheck);
    return () => {
      if (firebaseUnsubscribe) firebaseUnsubscribe();
      window.removeEventListener('mock-login-changed', handleAuthCheck);
    };
  }, []);

  // Separate effect to enforce module permissions on route / role changes
  useEffect(() => {
    if (user) {
      const allowed = ROLE_MODULES[currentRole] || [];
      if (!allowed.includes(activeModule)) {
        const nextModule = ROLE_DEFAULT_MODULES[currentRole] || allowed[0] || 'overview';
        setActiveModule(nextModule);
        const config = MODULE_ROUTES[nextModule];
        if (config) {
          window.history.pushState(null, '', config.path);
        }
      }
    }
  }, [currentRole, activeModule, user]);

  useEffect(() => {
    // 1. Sync theme preference
    const storedTheme = localStorage.getItem('theme') || 'light';
    const root = window.document.documentElement;
    const applyTheme = (theme: string) => {
      if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    applyTheme(storedTheme);

    const syncTheme = () => {
      const activeTheme = localStorage.getItem('theme') || 'light';
      applyTheme(activeTheme);
    };
    window.addEventListener('theme-changed', syncTheme);

    // 2. Sync table density preference
    const storedDensity = localStorage.getItem('tableDensity') || 'standard';
    const body = window.document.body;
    if (storedDensity === 'compact') {
      body.classList.add('compact-tables');
    } else {
      body.classList.remove('compact-tables');
    }

    return () => {
      window.removeEventListener('theme-changed', syncTheme);
    };
  }, []);

  // One-time startup cleanup of old mock fallback data from localStorage
  useEffect(() => {
    const CLEANUP_KEY = 'mock_fallback_cleanup_done_v3';
    if (!localStorage.getItem(CLEANUP_KEY)) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith('firestore_fallback_') ||
          key.startsWith('student_report_card_') ||
          key === 'graduation_students' ||
          key === 'promotion_evaluations'
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(CLEANUP_KEY, 'true');
    }
  }, []);

  const renderModule = () => {
    switch (activeModule) {
      case 'overview':
        return <OverviewPanel onSelectModule={handleSelectModule} />;
      case 'students':
        return <StudentsPanel />;
      case 'classes':
        return <ClassesPanel />;
      case 'personnel':
        return <PersonnelPanel />;
      case 'academics':
        return <AcademicsPanel />;
      case 'timetable':
        return <TimetablePanel />;
      case 'timetable-schedule':
        return <TimetablePanel activeViewTab="schedule" />;
      case 'timetable-exam':
        return <TimetablePanel activeViewTab="exam" />;
      case 'assignments':
        return <AssignmentsPanel />;
      case 'departments':
        return <DepartmentsPanel />;
      case 'dept-overview':
        return <DepartmentsPanel activeViewTab="overview" />;
      case 'dept-lesson-plans':
        return <DepartmentsPanel activeViewTab="lesson_plans" />;
      case 'dept-assignments':
        return <DepartmentsPanel activeViewTab="assignments" />;
      case 'dept-evaluation':
        return <DepartmentsPanel activeViewTab="evaluation" />;
      case 'dept-analytics':
        return <DepartmentsPanel activeViewTab="analytics" />;
      case 'facilities':
        return <FacilitiesPanel />;
      case 'finance':
        return <FinancePanel activeViewTab="overview" />;
      case 'finance-overview':
        return <FinancePanel activeViewTab="overview" />;
      case 'finance-fees':
        return <FinancePanel activeViewTab="fees" />;
      case 'finance-tuition':
        return <FinancePanel activeViewTab="tuition" />;
      case 'finance-receipts':
        return <FinancePanel activeViewTab="receipts" />;
      case 'finance-payroll':
        return <FinancePanel activeViewTab="payroll" />;
      case 'finance-expenses':
        return <FinancePanel activeViewTab="expenses" />;
      case 'finance-maintenance':
        return <FinancePanel activeViewTab="maintenance" />;
      case 'finance-ledger':
        return <FinancePanel activeViewTab="ledger" />;
      case 'finance-reports':
        return <FinancePanel activeViewTab="reports" />;
      case 'finance-tax':
        return <FinancePanel activeViewTab="tax" />;
      case 'finance-config':
        return <FinancePanel activeViewTab="config" />;
      case 'finance-audit':
        return <FinancePanel activeViewTab="audit" />;
      case 'admin':
        return <AdminPanel initialTab="overview" onSelectModule={handleSelectModule} />;
      case 'secretary':
        return <AdminPanel initialTab="overview" onSelectModule={handleSelectModule} />;
      case 'secretary-overview':
        return <AdminPanel initialTab="overview" onSelectModule={handleSelectModule} />;
      case 'secretary-documents':
        return <AdminPanel initialTab="documents" onSelectModule={handleSelectModule} />;
      case 'secretary-council':
        return <AdminPanel initialTab="council" onSelectModule={handleSelectModule} />;
      case 'secretary-storage':
        return <AdminPanel initialTab="storage" onSelectModule={handleSelectModule} />;
      case 'secretary-bulletin':
        return <AdminPanel initialTab="bulletin" onSelectModule={handleSelectModule} />;
      case 'library-overview':
        return <LibraryPanel initialTab="overview" onSelectModule={handleSelectModule} />;
      case 'library-circulation':
        return <LibraryPanel initialTab="circulation" onSelectModule={handleSelectModule} />;
      case 'library-inventory':
        return <LibraryPanel initialTab="inventory" onSelectModule={handleSelectModule} />;
      case 'library-readers':
        return <LibraryPanel initialTab="readers" onSelectModule={handleSelectModule} />;
      case 'library-audit':
        return <LibraryPanel initialTab="audit" onSelectModule={handleSelectModule} />;
      case 'youth-union':
        return <YouthUnionPanel />;
      case 'health':
        return <HealthPanel activeTab="dashboard" />;
      case 'health-dashboard':
        return <HealthPanel activeTab="dashboard" />;
      case 'health-records':
        return <HealthPanel activeTab="records" />;
      case 'health-log':
        return <HealthPanel activeTab="incidents" />;
      case 'health-inventory':
        return <HealthPanel activeTab="inventory" />;
      case 'health-epidemic':
        return <HealthPanel activeTab="epidemic" />;
      case 'health-insurance':
        return <HealthPanel activeTab="insurance" />;
      case 'health-reports':
        return <HealthPanel activeTab="reports" />;
      case 'quality-assurance':
        return <QualityAssurancePanel />;
      case 'counseling':
        return <CounselingPanel />;
      case 'boarding':
      case 'boarding-dashboard':
        return <BoardingPanel activeTab="dashboard" />;
      case 'boarding-communication':
        return <BoardingPanel activeTab="communication" />;
      case 'boarding-inventory':
        return <BoardingPanel activeTab="inventory" />;
      case 'boarding-atvstp':
        return <BoardingPanel activeTab="atvstp" />;
      case 'boarding-closing':
        return <BoardingPanel activeTab="closing" />;
      case 'boarding-rooms':
        return <BoardingPanel activeTab="rooms" />;
      case 'party-union':
        return <PartyUnionPanel />;
      case 'settings':
        return <SettingsPanel />;
      case 'user-profile':
        return <UserProfilePanel />;
      case 'admissions':
        return <AdmissionsPanel />;
      case 'promotion':
        return <PromotionPanel />;
      case 'graduation':
        return <GraduationPanel />;
      case 'alumni':
        return <AlumniPanel />;
      case 'teacher-overview':
        return <TeacherWorkspace activeViewTab="overview" />;
      case 'teacher-timetable':
        return <TeacherWorkspace activeViewTab="timetable" />;
      case 'teacher-lesson-plans':
        return <TeacherWorkspace activeViewTab="lesson-plans" />;
      case 'teacher-gradebook':
        return <TeacherWorkspace activeViewTab="gradebook" />;
      case 'teacher-diary':
        return <TeacherWorkspace activeViewTab="diary" />;
      case 'homeroom-profile':
        return <TeacherWorkspace activeViewTab="homeroom-profile" />;
      case 'homeroom-attendance':
        return <TeacherWorkspace activeViewTab="homeroom-attendance" />;
      case 'homeroom-conduct':
        return <TeacherWorkspace activeViewTab="homeroom-conduct" />;
      case 'teacher-profile':
        return <TeacherWorkspace activeViewTab="profile" />;
      case 'teacher-evaluation':
        return <TeacherWorkspace activeViewTab="evaluation" />;
      case 'teacher-maintenance':
        return <TeacherWorkspace activeViewTab="maintenance" />;
      case 'teacher-contacts':
        return <TeacherWorkspace activeViewTab="contacts" />;
      case 'security':
        return <SecurityPanel initialTab="overview" onSelectModule={handleSelectModule} />;
      case 'security-overview':
        return <SecurityPanel initialTab="overview" onSelectModule={handleSelectModule} />;
      case 'security-access':
        return <SecurityPanel initialTab="access" onSelectModule={handleSelectModule} />;
      case 'security-assets':
        return <SecurityPanel initialTab="assets" onSelectModule={handleSelectModule} />;
      case 'security-parking':
        return <SecurityPanel initialTab="parking" onSelectModule={handleSelectModule} />;
      case 'security-incidents':
        return <SecurityPanel initialTab="incidents" onSelectModule={handleSelectModule} />;
      case 'security-schedule':
        return <SecurityPanel initialTab="schedule" onSelectModule={handleSelectModule} />;
      case 'security-attendance':
        return <SecurityPanel initialTab="attendance" onSelectModule={handleSelectModule} />;
      case 'security-reports':
        return <SecurityPanel initialTab="reports" onSelectModule={handleSelectModule} />;
      case 'cleaner-overview':
        return <CleanerPanel initialTab="overview" onSelectModule={handleSelectModule} />;
      case 'cleaner-schedule':
        return <CleanerPanel initialTab="schedule" onSelectModule={handleSelectModule} />;
      case 'cleaner-supplies':
        return <CleanerPanel initialTab="supplies" onSelectModule={handleSelectModule} />;
      case 'cleaner-reports':
        return <CleanerPanel initialTab="reports" onSelectModule={handleSelectModule} />;
      case 'system-roster':
        return <SystemRosterPanel />;
      case 'student-portal':
        return <StudentPortal initialTab="dashboard" onSelectModule={handleSelectModule} />;
      case 'student-timetable':
        return <StudentPortal initialTab="timetable" onSelectModule={handleSelectModule} />;
      case 'student-grades':
        return <StudentPortal initialTab="grades" onSelectModule={handleSelectModule} />;
      case 'student-conduct':
        return <StudentPortal initialTab="conduct" onSelectModule={handleSelectModule} />;
      case 'student-leave':
        return <StudentPortal initialTab="leave" onSelectModule={handleSelectModule} />;
      case 'student-privilege':
        return <StudentPortal initialTab="privilege" onSelectModule={handleSelectModule} />;
      default:
        return <div>Not found</div>;
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-[#e8eef6] flex flex-col items-center justify-center text-[#2c5ea0]">
        <SystemLogo size={64} loading={true} className="animate-pulse" />
        <p className="mt-4 text-xs font-bold text-[#7b8a9e] uppercase tracking-widest animate-pulse">Đang tải cấu hình bảo mật...</p>
      </div>
    );
  }

  if (showLanding) {
    return <LandingPage onEnterSystem={() => setShowLanding(false)} />;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-[#e8eef6] font-sans text-[#1e2a3a] overflow-hidden">
      <Sidebar activeModule={activeModule} onSelectModule={handleSelectModule} onGoToLanding={() => setShowLanding(true)} currentRole={currentRole} />
      
      <div className="flex-1 flex flex-col min-w-0 bg-[#e8eef6]">
        <Header activeModule={activeModule} onSelectModule={handleSelectModule} currentRole={currentRole} onChangeRole={handleChangeRole} />
        <div className="flex-1 relative overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeModule}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } }}
              exit={{ opacity: 0, y: -16, transition: { duration: 0.2, ease: "easeIn" } }}
              className="w-full flex-1 flex flex-col min-h-0"
            >
              {renderModule()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}


