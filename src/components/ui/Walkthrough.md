# Tài Liệu Hướng Dẫn Xác Minh Chức Năng & Giao Diện Cập Nhật

Hệ thống đã được cập nhật đồng bộ sang mô hình cấp **Mầm non (Khối 1 - Khối 5)** cho tính năng kết chuyển năm học, chuẩn hóa giao diện Sidebar và Logo sang **tông màu xanh dương chủ đạo**, đồng thời hoàn tất phân loại **Tổ chuyên môn** thành 2 loại riêng biệt và áp dụng ràng buộc tự động lọc/chuyển đổi tổ trong phân hệ **Nhân sự**.

---

## Các Thay Đổi Đã Thực Hiện

### 1. Đồng bộ dải Khối lớp Mầm non (Khối 1 - 5)
* **Tổ chức lên lớp (`PromotionPanel.tsx`):**
  * Đã chuyển đổi hoàn toàn logic kết chuyển từ khối THPT cũ (10, 11) sang **Khối 1, 2, 3, 4** cấp mầm non.
  * Bộ lọc khối trên giao diện hiện tại chỉ hiển thị từ Khối 1 đến Khối 4.
  * Logic tự động ánh xạ lớp học được tối ưu hóa cho mầm non (ví dụ: lớp `1A1` tự động tăng lên lớp `2A1`, lớp `4A4` tự động tăng lên lớp `5A4`).
  * Cập nhật tính năng phát hiện sự cố kết chuyển nhầm cho niên khóa 2025: phát hiện các em bị xếp nhầm lên khối 5 và cung cấp nút khôi phục về đúng khối 2.
  * Đã sửa tất cả nhãn hiển thị từ `Khối 1, 11` hoặc `Khối 10, 11` thành `Khối 1 - 4`.
* **Xét hoàn thành chương trình mầm non (`GraduationPanel.tsx`):**
  * Đã chuyển đổi đối tượng quản lý từ lớp 12 sang **Khối 5** (khối ra trường của mầm non).
  * Chuẩn hóa toàn bộ nhãn hiển thị, tiêu đề bảng điểm, công thức tính và bộ lọc sang Khối 5 (GPA Khối 5).
  * Sửa đổi mô tả quy chuẩn xét hoàn thành chương trình mầm non phù hợp hơn thay vì quy chế thi THPT Quốc gia cũ.
* **Cập nhật các màn hình khác:**
  * [LandingPage.tsx](file:///c:/Users/nhpk1/Documents/Code/TH%20An%20H%E1%BB%AFu/src/components/layout/LandingPage.tsx): Sửa mô tả kế hoạch khai giảng áp dụng cho học sinh **từ Khối 1 đến Khối 5**.
  * [DepartmentsPanel.tsx](file:///c:/Users/nhpk1/Documents/Code/TH%20An%20H%E1%BB%AFu/src/components/modules/DepartmentsPanel.tsx): Cập nhật tiêu đề biểu đồ phổ điểm học kỳ II môn Toán & Tin học áp dụng cho **Khối 1 - 5**.
  * [SettingsPanel.tsx](file:///c:/Users/nhpk1/Documents/Code/TH%20An%20H%E1%BB%AFu/src/components/modules/SettingsPanel.tsx): Cập nhật nhãn tiêu chuẩn đánh giá sang **Thông tư áp dụng Khối 1 - 4** theo **Thông tư 27/2020/TT-BGDĐT** (thay thế Thông tư 22 cũ).

### 2. Thiết kế lại Sidebar & Logo sang tông màu Xanh Dương
* **Đồng bộ màu sắc Sidebar (`Sidebar.tsx`):**
  * Chuyển đổi màu sắc của mục lục khi được chọn (active) từ màu xanh lá cây sang **màu xanh dương sáng (`#3b82f6`)** để làm nổi bật rõ nét.
  * Biểu tượng (icon) và đường viền bên trái của mục đang active cũng được chuyển sang màu xanh dương.
  * Tên nhãn phụ **"Hệ Thống Tiểu Học"** ở đầu Sidebar được chuyển từ màu xanh lá sang màu xanh dương, mang lại cảm giác đồng nhất, chuyên nghiệp.
  * Khu vực thẻ thông tin cá nhân (User Profile) ở góc dưới Sidebar cũng được đổi viền và điểm nhấn sang màu xanh dương.
* **Chuẩn hóa Logo Trường (`SystemLogo.tsx`):**
  * Đã thay thế toàn bộ dải màu xanh lá cây trong logo bằng các dải màu xanh dương hài hòa (từ xanh da trời sáng đến xanh navy đậm) kết hợp với các chi tiết vàng gold sang trọng.
  * Sự thay đổi này áp dụng đồng bộ cho tất cả các vị trí hiển thị logo trên toàn hệ thống (Landing Page, Sidebar, Header và favicon).

### 3. Phân loại Tổ chuyên môn & Ràng buộc Nhân sự
* **Cơ sở dữ liệu và Hiển thị (`dbService.ts`, `DepartmentsPanel.tsx`):**
  * Tách biệt cấu trúc **Tổ chuyên môn** thành 2 nhóm: **Tổ khối lớp** (chỉ gán khối lớp, không gán môn) và **Tổ chuyên biệt** (gán môn học đặc thù).
  * Trong bảng danh sách tổ chuyên môn, bổ sung hiển thị badge phân loại rõ ràng: Badge màu hổ phách cho `Tổ khối lớp` kèm các khối phụ trách (badge màu indigo), và Badge màu xanh dương cho `Tổ chuyên biệt` kèm các môn phụ trách (badge màu xanh dương nhạt).
* **Ràng buộc logic Nhân sự (`PersonnelModals.tsx`, `PersonnelPanel.tsx`):**
  * Thêm hàm helper `isSpecializedSubject` để nhận diện các môn chuyên biệt: Tiếng Anh, Tin học, Nghệ thuật (Âm nhạc, Mỹ thuật), và Giáo dục thể chất (Thể dục).
  * **Tại Modal thêm nhân sự mới & Drawer chỉnh sửa nhân sự:** Tự động lọc danh sách trong dropdown **Tổ chuyên môn** dựa trên **Môn Giảng Dạy Chính** của giáo viên:
    - Nếu dạy môn chuyên biệt: Chỉ hiển thị các Tổ chuyên biệt tương ứng.
    - Nếu dạy các môn phổ thông khác: Chỉ hiển thị các Tổ khối lớp tương ứng.
  * **Tự động chuyển đổi/reset:** Khi thay đổi Môn Giảng Dạy Chính trên giao diện, hệ thống tự động so sánh và reset trường Tổ chuyên môn đang chọn về trạng thái trống (hoặc Chưa phân công) nếu không khớp với loại môn học mới, nhằm loại bỏ hoàn toàn khả năng sai lệch dữ liệu.

---

## Hướng Dẫn Xác Minh (Manual Verification)

### Bước 1: Kiểm tra tông màu xanh dương trên Sidebar & Logo
1. Quan sát logo ở đầu Sidebar: Logo trường hiện tại đã chuyển sang tông xanh dương/vàng gold cực kỳ sang trọng và đồng bộ.
2. Nhãn phụ dưới chữ **EduCore** hiện tại hiển thị **Hệ Thống Tiểu Học** với tông màu xanh dương.
3. Nhấp vào các mục khác nhau trên Sidebar: Hiệu ứng nổi bật (Active Item) hiện tại có viền bên trái và chữ màu xanh dương sáng, không còn màu xanh lá cây.

### Bước 2: Kiểm tra chức năng Kết chuyển năm học
1. Vào **Công tác Học sinh** -> **Kết chuyển năm học**:
   - Kiểm tra Tab 1 hiển thị rõ: `1. Lên lớp (Khối 1 - 4)`.
   - Bấm vào bộ chọn **Khối** để kiểm tra các tùy chọn hiển thị: `Khối 1`, `Khối 2`, `Khối 3`, `Khối 4`.
   - Kiểm tra tổng số học sinh ở thẻ thống kê hiển thị: `Tổng học sinh Khối 1 - 4`.
2. Kiểm tra Tab 2: `2. Tốt nghiệp (Khối 5)` (hoặc xét hoàn thành chương trình):
   - Đảm bảo toàn bộ văn bản đều hiển thị cho học sinh Khối 5.
   - Công thức tính điểm xét hoàn thành hiển thị chính xác tham số `GPA Khối 5`.
3. Kiểm tra Tab 3 (Xếp lớp năm học mới):
   - Mục thiết lập quy tắc hiển thị: `Thiết lập Quy tắc Ánh xạ Lớp học (Khối 1 - 4)`.
   - Danh sách lớp học hiển thị đúng quy tắc ánh xạ tăng lớp (ví dụ lớp 1A1 tăng lên lớp 2A1).

### Bước 3: Kiểm tra phân loại Tổ chuyên môn & Ràng buộc Nhân sự
1. Vào **Tổ chuyên môn & Môn học**:
   - Kiểm tra bảng danh sách tổ chuyên môn. Đảm bảo hiển thị đầy đủ các badge phân loại trực quan (ví dụ: `Tổ khối lớp` và `Khối 1` cho Tổ Khối 1, hoặc `Tổ chuyên biệt` và `Tiếng Anh` cho Tổ Ngoại Ngữ).
   - Nhấn **Xem chi tiết** hoặc chỉnh sửa để xác minh giao diện chi tiết hiển thị đúng thuộc tính tương ứng với từng loại tổ.
2. Vào **Cán bộ & Nhân sự**:
   - **Xác minh khi thêm mới:** Bấm **Thêm Nhân Sự Mới** -> chuyển bước 2 (Chuyên môn). 
     - Để **Môn Giảng Dạy Chính** là **Toán học** -> Kiểm tra dropdown **Trực thuộc Tổ Chuyên Môn** chỉ hiển thị các tổ khối lớp (Tổ Khối 1 đến Khối 5).
     - Thay đổi **Môn Giảng Dạy Chính** thành **Tiếng Anh** -> Dropdown tự động reset về trống và chỉ cho phép chọn các tổ chuyên biệt (Ngoại Ngữ, Tin Học, Nghệ Thuật, Thể Dục).
   - **Xác minh khi chỉnh sửa:** Chọn một giáo viên bất kỳ trên bảng -> **Sửa hồ sơ (Drawer)**.
     - Kiểm tra logic lọc của dropdown Tổ chuyên môn hoạt động chuẩn xác theo môn giảng dạy chính của giáo viên.
     - Thay đổi môn giảng dạy chính của giáo viên đó sang môn lệch chuẩn (ví dụ từ Toán sang Tin học) -> Kiểm tra xem trường Tổ chuyên môn có tự động chuyển thành `-- Chưa phân công --` hay không.
