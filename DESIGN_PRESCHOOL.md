# Hướng Dẫn Phong Cách Thiết Kế & Hệ Thống Màu Sắc: Phân Hệ Mầm Non (Preschool Design System)

Tài liệu này định hình triết lý thẩm mỹ, bảng màu và ngôn ngữ thiết kế dành riêng cho giao diện web/ứng dụng **Mầm non (Preschool)**. Giao diện mầm non đòi hỏi sự cân bằng tuyệt đối giữa **sự tin cậy, an toàn đối với phụ huynh** và **sự ấm áp, sinh động, dễ chịu đối với giáo viên và trẻ nhỏ**.

---

## 1. Triết Lý Thiết Kế: "Ấm Áp - Phát Triển - An Tâm"

Trái ngược với phong cách chuyên nghiệp, sắc bén của phân hệ Tiểu học (sử dụng tông màu xanh thép/Navy thâm trầm), không gian thiết kế Mầm non hướng tới cảm giác **tự nhiên, thân thiện và giàu năng lượng tích cực**.

*   **Sự Thân Thuộc (Warmth & Comfort)**: Sử dụng các góc bo tròn lớn, các đường viền mềm mại và tông nền màu kem/giấy ấm để tạo cảm giác gần gũi như ở nhà.
*   **Trực Quan Sinh Động (Visual Simplicity)**: Các nút bấm lớn, hình ảnh minh họa sinh động, biểu tượng nét dày thân thiện giúp giảm tải áp lực công việc cho giáo viên mầm non (những người thường rất bận rộn chăm sóc trẻ).
*   **Độ Tin Cậy Cao (Trust & Safety)**: Dù mang tính chất trẻ thơ, giao diện vẫn phải giữ cấu trúc thông tin rõ ràng, minh bạch để phụ huynh cảm thấy an tâm khi theo dõi nhật ký sinh hoạt, bữa ăn và sức khỏe của con.

---

## 2. Hệ Thống Màu Sắc (Color Palette)

Hệ màu mầm non ưu tiên các tông màu **Pastel ấm áp, dịu mắt** nhưng vẫn có điểm nhấn tươi vui, tránh các màu nguyên bản quá sặc sỡ gây mỏi mắt.

### 2.1. Màu Chủ Đạo (Primary Color): Vàng Mặt Trời / Vàng Hướng Dương
*   **Mã màu**: `#f59e0b` (Amber-500) đến `#d97706` (Amber-600)
*   **Ý nghĩa**: Tượng trưng cho năng lượng buổi sáng, sự thông minh, năng động và tiếng cười của trẻ thơ.
*   **Ứng dụng**: Dùng cho các nút hành động chính, tiêu đề quan trọng, trạng thái tích cực hoặc các điểm nhấn thu hút thị giác đầu tiên.

### 2.2. Màu Phụ Đạo (Secondary Color): Xanh Bạc Hà / Xanh Lá Non
*   **Mã màu**: `#10b981` (Emerald-500) hoặc `#a7f3d0` (Emerald-100)
*   **Ý nghĩa**: Tượng trưng cho sự phát triển tự nhiên, sức khỏe an toàn, rau củ quả dinh dưỡng và sự mát mẻ.
*   **Ứng dụng**: Sử dụng trong phân hệ nhà bếp/dinh dưỡng, trạng thái kiểm thực an toàn, điểm danh trẻ đến lớp hoặc các chỉ số BMI đạt chuẩn.

### 2.3. Màu Nhấn (Accent Color): Hồng San Hô / Cam Đào
*   **Mã màu**: `#f43f5e` (Rose-500) hoặc `#fda4af` (Rose-300)
*   **Ý nghĩa**: Mang lại cảm giác ngọt ngào, tình yêu thương, sự chăm sóc y tế nhẹ nhàng và các hoạt động vui chơi.
*   **Ứng dụng**: Dùng cho các cảnh báo y tế dị ứng, lịch hoạt động vui chơi đặc biệt, hoặc thông tin khẩn cấp cần phụ huynh tương tác ngay.

### 2.4. Màu Nền & Màu Trung Tính (Neutrals)
*   **Nền sáng ấm (Neutral Light)**: `#fdfbf7` (Warm Off-white) hoặc `#fcf8f2` (Soft Cream).
    *   *Lý do*: Thay thế hoàn toàn màu trắng tinh lâm sàng bằng màu kem sữa mịn để tạo giao diện dịu mắt, mang hơi hướng organic và tạo cảm giác ấm cúng như trang sách tranh.
*   **Chữ & Đường viền tối (Neutral Dark)**: `#4a3f35` (Warm Charcoal) hoặc `#2d251e` (Cocoa Brown).
    *   *Lý do*: Tránh dùng màu đen thuần khiết `#000000` vốn quá nặng nề. Tông nâu đất/nâu cacao ấm giúp chữ hiển thị tương phản tốt nhưng cực kỳ mềm mại, dễ chịu khi đọc văn bản dài.

---

## 3. Kiểu Chữ & Typography

Giao diện mầm non khuyến khích sử dụng các phông chữ **Rounded (bo tròn góc nét)** để tăng tính thân thiện nhưng vẫn đảm bảo khả năng hiển thị tiếng Việt hoàn hảo.

*   **Phông chữ Tiêu đề (Headings)**: **Quicksand** hoặc **Nunito** (Google Fonts).
    *   *Đặc điểm*: Nét chữ bo tròn nhẹ nhàng ở các góc, tạo cảm giác vô cùng đáng yêu, mềm mại nhưng vẫn gọn gàng, rõ ràng khi hiển thị ở kích thước lớn (`text-2xl` đến `text-4xl`).
*   **Phông chữ Nội dung (Body Text)**: **Nunito** hoặc **Inter**.
    *   *Đặc điểm*: Khoảng cách chữ vừa phải, bo góc nhẹ, cực kỳ dễ đọc trên màn hình máy tính bảng hoặc điện thoại di động khi giáo viên cập nhật nhật ký cho trẻ.

---

## 4. Ngôn Ngữ Hình Khối & Thành Phần UI (UI Components)

Mầm non là thế giới của sự tròn trịa, mềm mại và an toàn:

*   **Góc bo tròn cực đại (Max Rounded)**:
    *   Sử dụng `rounded-2xl` hoặc `rounded-3xl` cho các thẻ thông tin (Cards) và Modals.
    *   Nút bấm sử dụng dạng viên thuốc (`rounded-full`) hoặc bo góc lớn để tạo cảm giác an toàn (tránh các góc nhọn thô cứng).
*   **Đường viền đôi & Nét vẽ tay (Playful Borders)**:
    *   Sử dụng viền kép nhạt (`border-[3px] border-double border-[#e7e3d4]`) tạo cảm giác như khung ảnh thủ công vintage.
    *   Đổ bóng dạng khối phẳng nhẹ (`shadow-[4px_4px_0px_#e7e3d4]`) tạo chiều sâu 2.5D giống như những mảnh ghép hình bằng gỗ của trẻ nhỏ.
*   **Biểu tượng (Iconography)**:
    *   Sử dụng nét biểu tượng dày dặn (`stroke-width: 2` hoặc `2.5`) từ thư viện Lucide.
    *   Kết hợp các biểu tượng vui nhộn như: `Heart` (chăm sóc), `Compass` (khám phá), `Sparkles` (khen thưởng), `Sun` (hoạt động ngoài trời), `Baby` (thông tin trẻ).

---

## 5. Trải Nghiệm Người Dùng (UX) Đặc Thù Cho Mầm Non

*   **Bảng Tin Giao Việc Siêu Nhanh (Teacher Quick-actions)**:
    *   Thiết kế các nút bấm "Điểm danh nhanh", "Báo ăn nhanh", "Báo ngủ nhanh" bằng một chạm (Touch target tối thiểu 56px x 56px) vì giáo viên mầm non phải thao tác một tay khi đang trông trẻ.
*   **Nhật Ký Bằng Hình Ảnh (Visual Diary)**:
    *   Hệ thống cho phép hiển thị các album ảnh hoạt động trong ngày của bé một cách trực quan, dễ dàng chia sẻ nhanh cho phụ huynh qua cổng liên lạc.
*   **Hệ Thống Huy Hiệu Khen Thưởng (Gamification)**:
    *   Tích hợp các huy hiệu đáng yêu như "Bé Ngoan Tuần", "Dũng Sĩ Ăn Ngoan", "Ngôi Sao Chăm Chỉ" để giáo viên trao tặng trực tuyến, giúp kết nối tương tác vui vẻ giữa nhà trường và gia đình.

---

## 6. Hướng Dẫn Thiết Kế & Tông Màu Cho Logo Mầm Non

Thiết kế logo trong môi trường mầm non yêu cầu tính **nhận diện cao, dễ ứng dụng vật lý** (thêu lên đồng phục, in trên ba lô, bình nước, bảng hiệu cổng trường) và truyền tải được thông điệp nhân văn về sự chăm sóc giáo dục.

### 6.1. Các Phối Màu Logo Khuyên Dùng (Color Combinations)

```
[ Phối màu Logo Mầm non ]
├── Combo 1: Mặt Trời & Đất Nâng Niu ──> Vàng Hướng Dương (#f59e0b) + Xanh Lá Non (#10b981)
├── Combo 2: Trí Tuệ & Ước Mơ         ──> Xanh Da Trời Dịu (#60a5fa) + Hồng San Hô (#f43f5e)
└── Combo 3: Truyền Thống & Gần Gũi   ──> Nâu Đất Trầm (#4a3f35)     + Vàng Mặt Trời (#f59e0b)
```

*   **Combo 1: Mặt Trời & Đất Nâng Niu (Vàng Mặt Trời `#f59e0b` + Xanh Lá Non `#10b981`)**
    *   *Ý nghĩa*: Tượng trưng cho chồi non mầm mọc lên từ đất lành, được sưởi ấm dưới ánh mặt trời sáng suốt. Đây là phối màu kinh điển và phù hợp nhất cho **Logo chính thức của trường mầm non**.
    *   *Tính chất*: Tạo cảm giác tươi mới, đầy sức sống, biểu thị sự phát triển thể chất khỏe mạnh và môi trường sư phạm an toàn.
*   **Combo 2: Trí Tuệ & Ước Mơ (Xanh Da Trời Dịu `#60a5fa` + Hồng San Hô `#f43f5e`)**
    *   *Ý nghĩa*: Sự kết hợp giữa bao dung, trí tưởng tượng bay cao (Xanh da trời) và tình yêu thương, sự chăm sóc ân cần (Hồng san hô).
    *   *Tính chất*: Cực kỳ phù hợp cho **Logo của các Câu lạc bộ năng khiếu, Tiếng Anh nghệ thuật, hoặc phân hệ Sách/Thư viện tranh mầm non**.
*   **Combo 3: Truyền Thống & Gần Gũi (Nâu Đất Trầm `#4a3f35` + Vàng Mặt Trời `#f59e0b`)**
    *   *Ý nghĩa*: Màu nâu đất đại diện cho gốc rễ vững chắc, sự giáo dục có nền tảng và tính bền bỉ, kết hợp màu vàng tạo điểm nhấn sáng lạng.
    *   *Tính chất*: Thích hợp cho các ấn phẩm hành chính chính thức của trường (giấy mời, phong bì thư, huy hiệu thêu trên ngực áo khoác đồng phục mùa đông) để tạo cảm giác trang trọng, cổ điển mà vẫn ấm áp.

### 6.2. Nguyên Tắc Thiết Kế Kỹ Thuật Cho Logo

1.  **Sử dụng màu phẳng (Flat/Solid Colors)**:
    *   *Nguyên tắc*: Tuyệt đối tránh sử dụng các hiệu ứng chuyển màu (gradients) phức tạp, hiệu ứng bóng đổ 3D hay chất liệu kim loại trong thiết kế logo gốc.
    *   *Lý do*: Logo mầm non sẽ được ứng dụng rất nhiều trên các chất liệu vật lý có độ phân giải in thấp như thêu chỉ lên vải đồng phục, in lụa lên ba lô học sinh, hoặc khắc laser lên đồ chơi gỗ. Màu phẳng giúp logo hiển thị sắc nét, không bị nhòe và tiết kiệm chi phí in ấn tối đa.
2.  **Khả năng tương thích đơn sắc (Monochrome Compatibility)**:
    *   *Nguyên tắc*: Logo phải đảm bảo hiển thị rõ ràng và đẹp mắt ngay cả khi chuyển hoàn toàn sang **màu trắng thuần** (khi in trên nền áo tối màu) hoặc **màu đen/nâu đất thuần** (khi đóng dấu mộc văn bản hành chính hoặc in decal một màu).
3.  **Tỷ lệ tương phản & Khoảng trống**:
    *   Các chi tiết trong logo (như hình chiếc lá, khuôn mặt cười, trang sách) cần có khoảng cách đủ rộng để khi thu nhỏ xuống kích thước cực tiểu (như làm biểu tượng favicon 16x16px trên thanh trình duyệt web), logo vẫn không bị dính nét vào nhau.
4.  **Ngôn ngữ hình khối bo tròn**:
    *   Ưu tiên các hình khối tròn trịa, hình chiếc lá tự nhiên, hình chiếc khiên bảo vệ bo góc mềm. Tránh các góc nhọn sắc bén (như hình sao sắc cạnh, hình tam giác sắc) nhằm tạo cảm giác an toàn tuyệt đối ngay từ thị giác.

Viewed DESIGN_PRESCHOOL.md:1-117

Dựa trên tài liệu [DESIGN_PRESCHOOL.md](file:///c:/Users/nhpk1/Documents/Code/TH%20An%20H%E1%BB%AFu/DESIGN_PRESCHOOL.md), sự kết hợp giữa phong cách thiết kế **Editorial (báo chí/tạp chí/sách ảnh)** và **phân hệ Mầm non** có thể được tối ưu hóa thông qua các nhóm màu cụ thể sau:

### 1. Tông màu nền chính (Tương đương màu giấy in - Paper Tone)
Phong cách Editorial ưu tiên cảm giác chân thực, trực quan giống như đọc một cuốn sách hoặc tạp chí giấy. Việc sử dụng các tông màu nền sáng ấm trong tài liệu là lựa chọn phù hợp nhất:
*   **Soft Cream (`#fcf8f2`)** hoặc **Warm Off-white (`#fdfbf7`)**: Thay thế cho màu trắng tinh (`#ffffff`) vốn mang tính chất kỹ thuật số hoặc lâm sàng. Tông màu kem sữa này đóng vai trò như bề mặt giấy mỹ thuật chất lượng cao, tạo cảm giác dịu mắt, ấm áp và mang hơi hướng organic.

### 2. Tông màu chữ và đường viền (Tương đương màu mực in - Ink Tone)
Để duy trì tính nghiêm túc, tinh tế của phong cách Editorial nhưng vẫn thân thiện với trẻ nhỏ và giáo viên:
*   **Cocoa Brown (`#2d251e`)** hoặc **Warm Charcoal (`#4a3f35`)**: Thay thế hoàn toàn cho màu đen thuần (`#000000`). Tông nâu đất ấm này đại diện cho màu mực in tự nhiên, giúp các đoạn văn bản dài có độ tương phản tốt, dễ đọc nhưng mềm mại và tinh tế hơn.

### 3. Tông màu điểm nhấn và nhận diện (Editorial Highlights)
Để thể hiện năng lượng năng động của cấp mầm non mà không làm mất đi bố cục sạch sẽ, thoáng đãng của Editorial, các tông màu sáng nên được dùng làm điểm nhấn có kiểm soát (accent lines, background tints, badges) thay vì tô màu mảng lớn:
*   **Vàng Mặt Trời (`#f59e0b` / Amber-500)**: Dùng cho các nút hành động quan trọng, các trích dẫn nổi bật (pull quotes) hoặc tiêu đề chương mục lớn để tạo năng lượng tích cực của ánh nắng buổi sáng.
*   **Xanh Bạc Hà (`#10b981` / Emerald-500)**: Dùng để làm nổi bật các thông tin liên quan đến sức khỏe, dinh dưỡng, hoặc các chỉ số tích cực trong các bảng biểu dạng tạp chí.
*   **Hồng San Hô (`#f43f5e` / Rose-500)**: Dùng cho các ghi chú đặc biệt, thông tin y tế hoặc các hoạt động tương tác cần sự chú ý của phụ huynh.

---

### Phối màu khuyên dùng cho bố cục Editorial Mầm non

Sự kết hợp tối ưu nhất để đạt được cả hai tiêu chí là **Combo 3** trong tài liệu kết hợp với hệ màu nền giấy:

*   **Nền chủ đạo**: Soft Cream (`#fcf8f2`) làm nền trang.
*   **Màu văn bản & Khung lưới**: Cocoa Brown (`#2d251e`) để định hình các cột văn bản, tiêu đề và đường kẻ phân cách mảnh (grid dividers).
*   **Màu nhấn chính**: Vàng Mặt Trời (`#f59e0b`) cho các khối thông tin nổi bật (callout boxes) hoặc nút bấm.
*   **Màu nhấn phụ**: Xanh Bạc Hà (`#10b981`) cho các biểu tượng trực quan hoặc nhãn phân loại (tags).

Sự kết hợp này tạo ra một giao diện web giống như một cuốn sách tranh thiếu nhi cao cấp hoặc một tạp chí giáo dục hiện đại, đáp ứng được sự tin cậy đối với phụ huynh và tính trực quan đối với giáo viên.