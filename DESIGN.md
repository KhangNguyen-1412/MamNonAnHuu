# 🔵 DESIGN SYSTEM — Classic Blue Scholastic

> **Phong cách:** Xanh Dương Cổ Điển & Học Thuật (Classic Blue Scholastic)
> Giữ nguyên triết lý sang trọng, nghệ thuật của bản gốc Warm Editorial, nhưng chuyển toàn bộ sang gam xanh dương sâu, trầm ấm.

---

## 📑 MỤC LỤC

1. [Bảng Màu (Color Palette)](#-1-bảng-màu-color-palette)
2. [Typography (Phông chữ)](#-2-typography-phông-chữ)
3. [Layout (Bố cục)](#-3-layout-bố-cục)
4. [Components (Thành phần)](#-4-components-thành-phần)
5. [Animations & Transitions](#-5-animations--transitions)
6. [Dark Mode](#-6-dark-mode)
7. [Bảng Ánh Xạ Màu (Mapping Table)](#-7-bảng-ánh-xạ-màu-warm--blue)
8. [Tổng Quan Phân Hệ (Modules Overview)](#-8-tổng-quan-phân-hệ-modules-overview)
9. [Cấu Trúc Modal CRUD (CRUD Modals Structure)](#-9-cấu-trúc-modal-crud-crud-modals-structure)

---

## 🎨 1. Bảng Màu (Color Palette)

### 1.1. Light Mode — Backgrounds

| Token / Vai trò                  | HEX         | Mô tả                                      | Tương đương bản gốc |
| -------------------------------- | ----------- | ------------------------------------------- | -------------------- |
| `--bg-body`                      | `#e8eef6`   | Xanh dương xám kem — nền body chính        | `#f4efe6`            |
| `--bg-card`                      | `#f5f8fc`   | Trắng xanh mềm — nền thẻ nội dung         | `#fdfbf7`            |
| `--bg-surface`                   | `#ffffff`   | Trắng thuần — nền input, khung card        | `#ffffff`            |
| `--bg-hover`                     | `#f0f4fa`   | Trắng xanh nhạt — hover nhẹ               | `#fcfaf5`            |
| `--bg-hover-alt`                 | `#edf2f9`   | Xanh lam mờ — hover alternative           | `#fbf9f4`            |
| `--bg-sidebar`                   | `#d4dde9`   | Xanh xám kem — sidebar, divider           | `#eae3d2`            |
| `--bg-sidebar-header`            | `#b8c6d9`   | Xanh xám đậm hơn — header sidebar         | `#d4cbb3`            |
| `--bg-disabled`                  | `#e8eef6`   | Nền disabled (giống body)                  | `#f4efe6`            |
| `--bg-muted`                     | `#dce4ee`   | Nền muted / hover sidebar item            | `#e5dfd3`            |
| `--bg-filter-btn`                | `#a8c4e0`   | Nền nút filter pill                        | `#dfccaa`            |
| `--bg-filter-btn-hover`          | `#bdd4ec`   | Nền nút filter pill hover                  | `#ebd9bc`            |

### 1.2. Light Mode — Text

| Token / Vai trò                  | HEX         | Mô tả                                      | Tương đương bản gốc |
| -------------------------------- | ----------- | ------------------------------------------- | -------------------- |
| `--text-primary`                 | `#1e2a3a`   | Xanh navy đậm — chữ chính                 | `#2c2825`            |
| `--text-secondary`               | `#4a5568`   | Xanh xám trung tính — chữ phụ / mô tả    | `#5c544d`            |
| `--text-muted`                   | `#7b8a9e`   | Xanh thép nhạt — label, placeholder       | `#8c8274`            |
| `--text-disabled`                | `#8e9eb4`   | Xanh xám mờ — chữ disabled               | `#a49a8c`            |

### 1.3. Light Mode — Primary Accent (Màu nhấn chủ đạo)

| Token / Vai trò                  | HEX                          | Mô tả                              | Tương đương bản gốc              |
| -------------------------------- | ---------------------------- | ----------------------------------- | -------------------------------- |
| `--accent-primary`               | `#2c5ea0`                    | Xanh dương đậm trầm — nút chính   | `#7a3e3e`                        |
| `--accent-primary-hover`         | `#1e4478`                    | Xanh navy sẫm — hover nút chính   | `#5c2f2f`                        |
| `--accent-primary-deep`          | `#153460`                    | Xanh cực đậm — shadow / deep      | `#4a2424`                        |
| `--accent-focus-ring`            | `rgba(44, 94, 160, 0.12)`    | Focus ring shadow                  | `rgba(122, 62, 62, 0.12)`       |

### 1.4. Light Mode — Secondary Accent (Màu phụ — Success / Action)

| Token / Vai trò                  | HEX         | Mô tả                                      | Tương đương bản gốc |
| -------------------------------- | ----------- | ------------------------------------------- | -------------------- |
| `--accent-secondary`             | `#2e6b8a`   | Xanh teal đậm — nút lưu, xác nhận        | `#3e5c47`            |
| `--accent-secondary-hover`       | `#1e4f6a`   | Xanh teal sẫm — hover                     | `#2e4535`            |

### 1.5. Light Mode — Neutral Accent (Nút trung tính — Dark Button)

| Token / Vai trò                  | HEX         | Mô tả                                      | Tương đương bản gốc |
| -------------------------------- | ----------- | ------------------------------------------- | -------------------- |
| `--btn-dark`                     | `#1e2a3a`   | Xanh navy đậm — nút "Tiếp Theo"           | `#2c2825`            |
| `--btn-dark-hover`               | `#131a25`   | Xanh đêm — hover                          | `#1a1714`            |

### 1.6. Light Mode — Borders & Dividers

| Token / Vai trò                  | HEX         | Mô tả                                      | Tương đương bản gốc |
| -------------------------------- | ----------- | ------------------------------------------- | -------------------- |
| `--border-primary`               | `#b8c6d9`   | Xanh xám nhạt — viền chính                | `#d4cbb3`            |
| `--border-light`                 | `#d4dde9`   | Xanh kem nhạt — viền nhẹ, divider         | `#eae3d2`            |
| `--border-hover`                 | `#8e9eb4`   | Xanh thép — viền hover input              | `#a49a8c`            |
| `--border-sidebar`               | `#a3b3c8`   | Xanh xám — viền sidebar (border double)   | `#c2b69d`            |

### 1.7. Light Mode — Scrollbar

| Token / Vai trò                  | HEX         | Tương đương bản gốc |
| -------------------------------- | ----------- | -------------------- |
| `--scrollbar-track`              | `#dce4ee`   | `#eae3d2`            |
| `--scrollbar-thumb`              | `#a3b3c8`   | `#c2b69d`            |
| `--scrollbar-thumb-hover`        | `#2c5ea0`   | `#7a3e3e`            |

### 1.8. Light Mode — Chart Variables

| Token                            | HEX         | Tương đương bản gốc |
| -------------------------------- | ----------- | -------------------- |
| `--chart-grid`                   | `#d4dde9`   | `#e5dfd3`            |
| `--chart-tooltip-bg`             | `#f5f8fc`   | `#fdfbf7`            |
| `--chart-tooltip-border`         | `#b8c6d9`   | `#d4cbb3`            |
| `--chart-tooltip-text`           | `#1e2a3a`   | `#2c2825`            |
| `--chart-cursor-fill`            | `#e8eef6`   | `#f4efe6`            |
| `--chart-axis-text`              | `#7b8a9e`   | `#8c8274`            |

### 1.9. Light Mode — Status / Alert Colors

| Trạng thái | Background     | Border         | Text chính     | Text phụ       |
| ---------- | -------------- | -------------- | -------------- | -------------- |
| **Warning (Amber)** | `#fef9e7` | `#fde68a`  | `#92400e`      | `#b45309`      |
| **Error (Red)**     | `#fef2f2` | `#fecaca`  | `#991b1b`      | `#dc2626`      |
| **Success (Green)** | `#ecfdf5` | `#a7f3d0`  | `#065f46`      | `#059669`      |
| **Info (Blue)**     | `#eff6ff` | `#bfdbfe`  | `#1e40af`      | `#2563eb`      |

### 1.10. Light Mode — Creative & Artistic Accent (Màu sắc nghệ thuật & Sáng tạo — Purple)

| Token / Vai trò                  | HEX         | Mô tả                                      |
| -------------------------------- | ----------- | ------------------------------------------- |
| `--accent-creative`              | `#7e22ce`   | Tím đậm — màu nhãn môn học nghệ thuật/sáng tạo |
| `--bg-creative`                  | `#f3e8ff`   | Tím pastel nhẹ — màu nền nhãn sáng tạo      |
| `--border-creative`              | `#e9d5ff`   | Tím nhạt — màu viền nhãn sáng tạo           |

> **Mục tiêu:** Màu tím đóng vai trò là sắc độ bổ sung phụ trợ (Analogous), đại diện cho trí tưởng tượng, năng khiếu và hoạt động sáng tạo của học sinh tiểu học (ví dụ: bộ môn Âm nhạc, Mỹ thuật).

---

## 🔤 2. Typography (Phông chữ)

### 2.1. Font Families

```css
--font-sans: "Lora", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
--font-serif: "Playfair Display", ui-serif, Georgia, Cambria, "Times New Roman", Times, serif;
--font-mono: "ui-monospace", SFMono-Regular, Menlo, Monaco, Consolas, monospace;
```

> **Lưu ý:** Giữ nguyên bộ font Lora + Playfair Display để duy trì phong cách cổ điển học thuật.
> Có thể thay thế bằng `Merriweather` (serif heading) + `Source Serif Pro` (body) nếu muốn hướng hiện đại hơn.

### 2.2. Font Sizes & Weights

| Vai trò                 | Size          | Weight    | Thuộc tính khác                           |
| ----------------------- | ------------- | --------- | ----------------------------------------- |
| **Tiêu đề trang (H1)** | `text-2xl`    | `bold`    | `font-serif`, `uppercase`, `tracking-wide` |
| **Tiêu đề modal (H3)** | `text-2xl`    | `bold`    | `font-serif`                              |
| **Section heading**     | `text-sm`     | `bold`    | `uppercase`, `tracking-widest`            |
| **Label**               | `text-[10px]` | `bold`    | `uppercase`, `tracking-widest`            |
| **Body text**           | `text-sm`     | `bold`    | —                                         |
| **Caption / Subtitle**  | `text-[10px]` | `bold`    | `uppercase`, `tracking-[0.2em]`           |
| **Muted text**          | `text-[11px]` | `medium`  | —                                         |
| **Badge / Tag**         | `text-[9px]`  | `bold`    | `uppercase`, `tracking-widest`            |
| **Button**              | `text-xs`     | `bold`    | `uppercase`, `tracking-widest`            |
| **Group label sidebar** | `text-[10px]` | `bold`    | `uppercase`, `tracking-[0.2em]`           |

---

## 📐 3. Layout (Bố cục)

### 3.1. Cấu trúc tổng thể (App Shell)

```
┌─────────────────────────────────────────────────────────┐
│ [SIDEBAR]  │           [MAIN CONTENT AREA]              │
│            │  ┌──────────────────────────────────────┐  │
│  w-16 →    │  │            [HEADER]                  │  │
│  w-72      │  │  h-20, border-b double               │  │
│  (hover    │  ├──────────────────────────────────────┤  │
│   expand)  │  │                                      │  │
│            │  │       [MODULE PANEL]                  │  │
│  h-screen  │  │    (AnimatePresence fade/slide)       │  │
│  fixed     │  │                                      │  │
│            │  │    max-w-7xl mx-auto                  │  │
│            │  │    p-4 lg:p-8                         │  │
│            │  │    gap-6                              │  │
│            │  │                                      │  │
│            │  └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 3.2. Sidebar

| Thuộc tính           | Giá trị                                                  |
| -------------------- | -------------------------------------------------------- |
| **Width (collapsed)**| `w-16` (mobile) → `w-20` (md)                           |
| **Width (expanded)** | `w-72` (lg) hoặc khi hover (`hover:w-72` group)          |
| **Background**       | `--bg-sidebar` (`#d4dde9` / dark: `#131a25`)             |
| **Border right**     | `border-r-[6px] border-double` sử dụng `--border-sidebar` (`#a3b3c8` / dark: `#283548`) |
| **Shadow**           | `shadow-2xl`                                             |
| **Z-index**          | `z-20`                                                   |
| **Transition**       | `transition-all duration-300`                            |
| **Overflow**         | `overflow-hidden` (ẩn nội dung và chữ khi co lại)        |

**Cơ chế Phân nhóm Điều hướng & Đa Ngôn Ngữ:**
- **Localization (Đa ngôn ngữ):** Lắng nghe custom event `language-changed` từ window để tự động render ngôn ngữ (VI/EN) đồng bộ với toàn hệ thống. Ngôn ngữ lưu trong `localStorage` với key `language`.
- **Hiển thị có điều kiện (Responsive Text/Groups):**
  - Tên phân hệ và nhãn nhóm (Group Label) có class `opacity-0 lg:opacity-100 group-hover:opacity-100 transition-opacity` để ẩn đi khi sidebar thu nhỏ và chỉ hiện lên đầy đủ khi hover hoặc trên màn hình lớn.
  - Các nhóm điều hướng chính gồm: *Hành chính & Nhân sự*, *Đào tạo & Chuyên môn*, *Công tác Học sinh*, và *Tài chính & Hậu cần*.

**Sidebar Header (Logo Area):**
- Height: `h-24`
- Background: `--bg-sidebar-header` (`#b8c6d9` / dark: `#0c1018`)
- Icon box: `bg-[--accent-primary]` (`#2c5ea0`), shadow `2px 2px 0px --accent-primary-deep`
- Brand text: `font-serif font-bold text-2xl tracking-wider`
- Subtitle: `text-[10px] uppercase tracking-[0.25em]`
- Hỗ trợ sự kiện `onGoToLanding` để click chuyển nhanh về trang giới thiệu hệ thống.

**Nav Item (Active):**
- Background: `--bg-body` (`#e8eef6` / dark: `#231f1c`)
- Text color: `--accent-primary` (`#2c5ea0` / dark: `#fdfbf7`)
- Border-left: `4px solid --accent-primary` (`#2c5ea0` / dark: `#5a8ec4`)
- `shadow-inner`, `rounded-r-full`

**Nav Item (Inactive):**
- `border-transparent`
- Text: `--text-secondary` (`#4a5568` / dark: `#978e80`)
- Hover: `bg-[--bg-card]`, text `--text-primary`, border `--border-sidebar`

**Group Label:**
- `text-[10px]`, `uppercase`, `tracking-[0.2em]`
- Color: `--text-muted` (`#7b8a9e` / dark: `#4a5568`)
- `border-b` sử dụng `--border-sidebar`

**UserProfile Card (Chân trang Sidebar):**
- Vị trí: Cố định ở dưới cùng (`flex-col` bottom)
- Background: Thẻ thông tin `bg-[--bg-card]` (`#f5f8fc` / dark: `#131a25`), viền `border-[--border-sidebar]`, margin `mx-2 lg:mx-4` để tạo độ nổi.
- Trạng thái Active: Khi đang ở phân hệ `user-profile`, card đổi sang nền `--bg-body` và viền `--accent-primary`.
- Avatar: Kích thước `w-10 h-10`, viền `border-[--text-muted]`, ảnh pravatar dùng bộ lọc CSS `grayscale brightness-90 sepia-[0.3]` tạo chiều sâu cổ điển.
- Chức danh: Hiển thị dạng chữ Serif cổ điển (ví dụ: "Hiệu trưởng" / "Ban Giám Hiệu").

### 3.3. Header

| Thuộc tính           | Giá trị                                                  |
| -------------------- | -------------------------------------------------------- |
| **Height**           | `h-20`                                                   |
| **Background**       | `--bg-card` (`#f5f8fc` / dark: `#131a25`)                |
| **Border bottom**    | `border-b-[3px] border-double` sử dụng `--border-primary` (`#b8c6d9` / dark: `#283548`) |
| **Shadow**           | `shadow-[0_4px_10px_rgba(30,42,58,0.03)]`                |
| **Z-index**          | `z-30`                                                   |
| **Padding X**        | `px-4 md:px-8`                                           |

**Cơ cấu thành phần chính:**
- **School Title:** `font-serif font-bold text-sm sm:text-xl md:text-2xl uppercase tracking-wide`, color `--accent-primary` (`#2c5ea0`). Sử dụng `line-clamp-2` trên thiết bị nhỏ để tránh vỡ bố cục.
- **Subtitle:** `text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.2em]`, color `--text-muted` (`#7b8a9e`).
- **Term Selector (Học kỳ):** Component `TermSelector` hiển thị cạnh đèn báo trạng thái. Cho phép chọn học kỳ hiện tại (Học kỳ I, Học kỳ II, Cả năm) để áp dụng bộ lọc dữ liệu toàn cục.
- **Search Input (Tìm kiếm):** Ẩn trên mobile (`hidden lg:block`), thiết kế bo tròn `rounded-full`, nền trong suốt, viền dưới `border-b-2 --border-primary`. Khi focus: đổi viền sang `--accent-primary` và đổi nền sang `--bg-body`.
- **Notification Badge (Thông báo):** Nút tròn `Bell`, hover sẽ đổi sang màu chữ `--accent-primary` và nền `--bg-body`. Điểm tròn đỏ báo có thông báo mới dùng màu `--accent-primary`.
- **System Settings Toggle:** Nút cài đặt (răng cưa) đổi màu tương ứng khi active/hover. Liên kết trực tiếp đến phân hệ cấu hình hệ thống.
- **Online Indicator:** Chấm trạng thái trực tuyến màu lục `#10b981` (Emerald) đi kèm hiệu ứng `animate-pulse` và đổ bóng nhạt `shadow-[0_0_8px_#10b981]`.

### 3.4. Main Content Panel

| Thuộc tính           | Giá trị                                                  |
| -------------------- | -------------------------------------------------------- |
| **Background**       | `--bg-body` (`#e8eef6`)                                  |
| **Padding**          | `p-4 lg:p-8`                                            |
| **Max width**        | `max-w-7xl mx-auto`                                     |
| **Flex layout**      | `flex flex-col gap-6`                                   |
| **Overflow**         | `overflow-auto`                                          |

---

## 🧩 4. Components (Thành phần)

### 4.1. Modal (ModalBase)

```
┌──────────────────────────────────────────┐  ← rounded-3xl
│  [HEADER]  px-8 py-6                     │  ← bg: --bg-body (#e8eef6)
│  border-b-[3px] border-double            │     border: --border-primary
│  Title: font-serif font-bold text-2xl    │
│  Subtitle: text-[10px] uppercase         │
├──────────────────────────────────────────┤
│                                          │
│  [BODY]  flex-1 overflow-y-auto          │  ← bg: --bg-card (#f5f8fc)
│  p-8                                     │
│                                          │
├──────────────────────────────────────────┤
│  [FOOTER]  p-6                           │  ← border-t dashed --border-primary
│  flex justify-end gap-3                  │     bg: --bg-card (#f5f8fc)
└──────────────────────────────────────────┘
```

| Thuộc tính           | Giá trị                                                               |
| -------------------- | --------------------------------------------------------------------- |
| **Backdrop**         | `bg-[--text-primary]/60 backdrop-blur-sm` (`#1e2a3a` with 60% opacity) |
| **Border**           | `border-[3px] border-double` sử dụng `--border-primary` (`#b8c6d9`)  |
| **Shadow**           | `shadow-[8px_8px_0px_--text-primary]` (`#1e2a3a`)                     |
| **Width options**     | `max-w-2xl`, `max-w-3xl`, `max-w-4xl`                                |
| **Fixed height**     | `h-[700px] max-h-[90vh]` (khi `fixedHeight=true`)                    |
| **Close button**     | Hover: `text-[--accent-primary]`, `bg-[--bg-muted]`                  |

### 4.2. Buttons

**Primary Button (Accent):**
```
bg-[--accent-primary] (#2c5ea0)
text-white
hover:bg-[--accent-primary-hover] (#1e4478)
shadow-[2px_2px_0px_--accent-primary-deep] (#153460)
active:shadow-none active:translate-y-0.5
rounded-full
text-xs font-bold uppercase tracking-widest
```

**Secondary Button (Success/Confirm):**
```
bg-[--accent-secondary] (#2e6b8a)
text-white
hover:bg-[--accent-secondary-hover] (#1e4f6a)
shadow-[2px_2px_0px_--text-primary] (#1e2a3a)
```

**Dark Button (Neutral Action):**
```
bg-[--btn-dark] (#1e2a3a)
text-white
hover:bg-[--btn-dark-hover] (#131a25)
shadow-[2px_2px_0px_--text-secondary] (#4a5568)
```

**Ghost Button (Cancel/Close):**
```
text-[--text-secondary] (#4a5568)
hover:bg-[--bg-muted] (#dce4ee)
border border-[--border-primary] (optional)
rounded-full
```

**Filter Pill Button:**
```
bg-[--bg-filter-btn] (#a8c4e0)
hover:bg-[--bg-filter-btn-hover] (#bdd4ec)
border border-[--text-muted] (#7b8a9e)
text-[--text-primary] (#1e2a3a)
rounded-full
text-[10px] uppercase tracking-widest
```

### 4.3. Inputs & Form Controls

**Text Input:**
```
bg-[--bg-surface] (#ffffff)
border border-[--border-primary] (#b8c6d9)
rounded-xl
px-4 py-3
text-sm font-bold text-[--text-primary] (#1e2a3a)
placeholder: text-[--text-muted] (#7b8a9e) font-normal

Focus:
  border-[--accent-primary] (#2c5ea0)
  ring-2 ring-[--accent-focus-ring]

Hover:
  border-[--border-hover] (#8e9eb4)

Disabled:
  bg-[--bg-disabled] (#e8eef6)
  text-[--text-disabled] (#8e9eb4)
  cursor-not-allowed
```

**Label:**
```
text-[10px] font-bold text-[--text-secondary] (#4a5568)
uppercase tracking-widest mb-2
```

**Required Marker:** `text-[--accent-primary]` (`#2c5ea0`)

**Error Text:** `text-xs text-[--accent-primary] font-medium` (`#2c5ea0`)

**Select (BaseSelect) - Dropdown:**
```
Trigger: Same as Text Input
Dropdown: bg-[--bg-surface] (#ffffff), border-[--border-primary], rounded-xl, shadow-lg
Selected Item: bg-[--bg-body] (#e8eef6), text-[--accent-primary], font-bold
Hover Item: bg-[--bg-card] (#f5f8fc), text-[--text-primary]
Search Header: bg-[--bg-card] (#f5f8fc)
```

**Toggle Switch:**
```
Track (off):  bg-[--border-primary] (#b8c6d9)
Track (on):   bg-[--accent-secondary] (#2e6b8a)
Thumb:        bg-white, border-[--bg-muted]
```

**Checkbox:** `w-4 h-4 text-[--accent-primary]` (`#2c5ea0`)

### 4.4. Tables

**Table Header:**
```
bg-[--bg-body] (#e8eef6)
text-[--text-secondary] (#4a5568)
text-[10px] font-bold uppercase tracking-widest
border-b border-[--border-primary] (#b8c6d9)
px-4 py-3
```

**Table Row Divider:** `divide-y divide-[--bg-muted]` (`#dce4ee`)

**Table Cell:** `px-4 py-3 font-bold text-[--text-primary]` (`#1e2a3a`)

**Compact Tables (Tùy chọn mật độ):**
```
td, th { padding: 0.5rem 0.75rem; }
```

### 4.5. Badges & Tags

**Primary Badge:**
```
bg-[--accent-primary] (#2c5ea0) text-white
text-[9px] font-bold uppercase tracking-widest
px-2 py-0.5 rounded
```

**Chip / Tag (Removable):**
```
bg-[--bg-body] (#e8eef6) text-[--text-primary] (#1e2a3a)
text-xs font-bold rounded-lg
border border-[--border-primary] (#b8c6d9)
px-3 py-1
Close icon: text-[--accent-primary] hover:text-[--text-secondary]
```

**Add Chip:**
```
bg-[--bg-card] (#f5f8fc) text-[--text-muted] (#7b8a9e)
border-dashed border-[--border-primary]
hover:bg-[--bg-body] hover:text-[--text-secondary]
```

### 4.6. Wizard / Stepper

**Step Circle (Active/Complete):**
```
bg-[--accent-primary] (#2c5ea0)
border-[--accent-primary]
text-white
w-8 h-8 rounded-full
```

**Step Circle (Inactive):**
```
bg-transparent
border-[--border-primary] (#b8c6d9)
text-[--text-muted] (#7b8a9e)
```

**Step Connector (Active):** `bg-[--accent-primary]` (`#2c5ea0`), `h-0.5`
**Step Connector (Inactive):** `bg-[--border-primary]` (`#b8c6d9`)

**Current Step Label:** `text-[10px] font-bold uppercase tracking-widest text-[--accent-primary]`

### 4.7. Tabs (TabbedModal)

**Tab (Active):**
```
bg-[--bg-card] (#f5f8fc)
text-[--accent-primary] (#2c5ea0)
border border-[--border-primary] border-b-0
rounded-t-xl
px-6 py-3
text-xs font-bold uppercase tracking-widest
```

**Tab (Inactive):**
```
bg-transparent
text-[--text-muted] (#7b8a9e)
border-transparent
hover: text-[--text-secondary]
```

### 4.8. Upload / Drag-and-Drop Zone

```
border-[3px] border-dashed border-[--border-primary] (#b8c6d9)
rounded-3xl p-12 text-center
bg-[--bg-card] (#f5f8fc)
hover:bg-[--bg-body] (#e8eef6)

Icon Circle: bg-[--bg-muted] (#dce4ee), text-[--accent-primary] (#2c5ea0)
w-16 h-16 rounded-full
```

### 4.9. Section Dividers

**Section Title:**
```
text-sm font-bold text-[--accent-primary] (#2c5ea0)
uppercase tracking-widest
border-b border-[--border-primary] (#b8c6d9) pb-2
```

**Dashed Divider:** `border-t border-dashed border-[--border-primary]`

**Double Border:** `border-[3px] border-double border-[--border-primary]`

### 4.10. User Profile Card (Sidebar Footer)

```
bg-[--bg-card] (#f5f8fc)
border border-[--border-sidebar] (#a3b3c8)
p-2 lg:p-4 mx-2 lg:mx-4

Avatar: border border-[--text-muted], bg-[--accent-secondary] (#2e6b8a)
Name: font-serif font-bold text-sm text-[--text-primary]
Role: text-[10px] text-[--text-muted] uppercase tracking-widest

Active state: bg-[--bg-body], border-[--accent-primary]
```

---

## ✨ 5. Animations & Transitions

### 5.1. Page Transition (AnimatePresence)

```javascript
// Module panel transition
initial:  { opacity: 0, y: 16 }
animate:  { opacity: 1, y: 0, duration: 0.25, ease: "easeOut" }
exit:     { opacity: 0, y: -16, duration: 0.2, ease: "easeIn" }
```

### 5.2. Modal

```javascript
// Backdrop
initial:  { opacity: 0 }
animate:  { opacity: 1, duration: 0.2 }
exit:     { opacity: 0, duration: 0.15 }

// Modal Content
initial:  { opacity: 0, scale: 0.95, y: 16 }
animate:  { opacity: 1, scale: 1, y: 0, duration: 0.25 }
exit:     { opacity: 0, scale: 0.95, y: 16, duration: 0.2 }
```

### 5.3. Dropdown (slideDown)

```javascript
initial:  { opacity: 0, y: -8, scaleY: 0.95 }
animate:  { opacity: 1, y: 0, scaleY: 1 }
exit:     { opacity: 0, y: -8, scaleY: 0.95 }
```

### 5.4. Sidebar

```css
transition-all duration-300  /* width expand/collapse */
```

### 5.5. Global Transition Classes

```css
transition-colors   /* cho hover trên buttons, links */
transition-all      /* cho buttons với shadow + translate */
```

---

## 🌙 6. Dark Mode

### 6.1. Dark Mode — Backgrounds

| Token / Vai trò                  | HEX         | Tương đương Light               | Tương đương bản gốc (dark) |
| -------------------------------- | ----------- | -------------------------------- | --------------------------- |
| `--bg-body`                      | `#0c1018`   | `#e8eef6`                        | `#12100e`                   |
| `--bg-card`                      | `#131a25`   | `#f5f8fc`                        | `#1a1714`                   |
| `--bg-surface`                   | `#131a25`   | `#ffffff`                        | `#1a1714`                   |
| `--bg-hover`                     | `#1a2332`   | `#f0f4fa`                        | `#231f1c`                   |
| `--bg-sidebar`                   | `#131a25`   | `#d4dde9`                        | `#1a1714`                   |
| `--bg-sidebar-header`            | `#0c1018`   | `#b8c6d9`                        | `#12100e`                   |
| `--bg-disabled`                  | `#1a2332`   | `#e8eef6`                        | `#231f1c`                   |
| `--bg-muted`                     | `#1a2332`   | `#dce4ee`                        | `#231f1c`                   |

### 6.2. Dark Mode — Text

| Token / Vai trò                  | HEX         | Tương đương Light               | Tương đương bản gốc (dark) |
| -------------------------------- | ----------- | -------------------------------- | --------------------------- |
| `--text-primary`                 | `#c8d6e5`   | `#1e2a3a`                        | `#e0d6c8`                   |
| `--text-secondary`               | `#7b8a9e`   | `#4a5568`                        | `#a49a8c`                   |
| `--text-muted`                   | `#5a6e85`   | `#7b8a9e`                        | `#7e7364`                   |
| `--text-disabled`                | `#4a5568`   | `#8e9eb4`                        | `#5c544d`                   |

### 6.3. Dark Mode — Accent

| Token / Vai trò                  | HEX                           | Tương đương bản gốc (dark)       |
| -------------------------------- | ----------------------------- | -------------------------------- |
| `--accent-primary`               | `#5a8ec4`                     | `#9e5a5a`                        |
| `--accent-focus-ring`            | `rgba(90, 142, 196, 0.15)`    | `rgba(158, 90, 90, 0.15)`       |
| `--accent-gold` (sidebar brand)  | `#6fa8d6`                     | `#c6a87c`                        |

### 6.4. Dark Mode — Borders

| Token / Vai trò                  | HEX         | Tương đương bản gốc (dark) |
| -------------------------------- | ----------- | --------------------------- |
| `--border-primary`               | `#283548`   | `#3a352e`                   |
| `--border-light`                 | `#1e2a3a`   | `#2c2825`                   |

### 6.5. Dark Mode — Scrollbar

| Token / Vai trò                  | HEX         | Tương đương bản gốc (dark) |
| -------------------------------- | ----------- | --------------------------- |
| `--scrollbar-track`              | `#0c1018`   | `#12100e`                   |
| `--scrollbar-thumb`              | `#1e2a3a`   | `#2c2825`                   |
| `--scrollbar-thumb-hover`        | `#2c5ea0`   | `#7a3e3e`                   |

### 6.6. Dark Mode — Chart Variables

| Token                            | HEX         | Tương đương bản gốc (dark) |
| -------------------------------- | ----------- | --------------------------- |
| `--chart-grid`                   | `#1e2a3a`   | `#2c2825`                   |
| `--chart-tooltip-bg`             | `#131a25`   | `#1a1714`                   |
| `--chart-tooltip-border`         | `#283548`   | `#3a352e`                   |
| `--chart-tooltip-text`           | `#c8d6e5`   | `#e0d6c8`                   |
| `--chart-cursor-fill`            | `#1a2332`   | `#231f1c`                   |
| `--chart-axis-text`              | `#5a6e85`   | `#7e7364`                   |

### 6.7. Dark Mode — Status / Alert Colors

| Trạng thái          | Dark BG      | Dark Border  | Dark Text     |
| ------------------- | ------------ | ------------ | ------------- |
| **Warning (Amber)** | `#1a1f10`    | `#4a3415`    | `#fbd38d`     |
| **Error (Red)**     | `#1c1216`    | `#4c1c1c`    | `#feb2b2`     |
| **Success (Green)** | `#0c1a12`    | `#1b3d2b`    | `#98d8be`     |
| **Info (Blue)**     | `#0c1525`    | `#1b2e4c`    | `#a3bffa`     |

### 6.8. Dark Mode — Inputs

```css
html.dark input, html.dark textarea {
  background-color: #131a25;   /* --bg-card */
  border-color: #283548;       /* --border-primary */
  color: #c8d6e5;              /* --text-primary */
}

html.dark ::placeholder {
  color: #4a5568;              /* --text-disabled */
}
```

---

## 🗺️ 7. Bảng Ánh Xạ Màu (Warm → Blue)

> Bảng tra cứu nhanh 1-1 giữa mã màu hiện tại (Warm) và mã màu mới (Blue).

### Light Mode

| Warm (Hiện tại)                  | Blue (Mới)                       | Vai trò                          |
| -------------------------------- | -------------------------------- | -------------------------------- |
| `#f4efe6`                        | `#e8eef6`                        | Body background                  |
| `#fdfbf7`                        | `#f5f8fc`                        | Card / Modal background          |
| `#ffffff`                        | `#ffffff`                        | Input / Surface background       |
| `#fcfaf5`                        | `#f0f4fa`                        | Hover background                 |
| `#fbf9f4`                        | `#edf2f9`                        | Hover alt background             |
| `#eae3d2`                        | `#d4dde9`                        | Sidebar / Divider background     |
| `#e5dfd3`                        | `#dce4ee`                        | Muted background                 |
| `#e6ddc5`                        | `#d4dde9`                        | Sidebar alt background           |
| `#d4cbb3`                        | `#b8c6d9`                        | Border primary                   |
| `#c2b69d`                        | `#a3b3c8`                        | Sidebar border / Scrollbar thumb |
| `#a49a8c`                        | `#8e9eb4`                        | Hover border / Disabled text     |
| `#dfccaa`                        | `#a8c4e0`                        | Filter button bg                 |
| `#ebd9bc`                        | `#bdd4ec`                        | Filter button hover              |
| `#2c2825`                        | `#1e2a3a`                        | Primary text / Dark button       |
| `#5c544d`                        | `#4a5568`                        | Secondary text / Label           |
| `#8c8274`                        | `#7b8a9e`                        | Muted text / Placeholder         |
| `#7a3e3e`                        | `#2c5ea0`                        | **Primary accent**               |
| `#5c2f2f`                        | `#1e4478`                        | Primary accent hover             |
| `#4a2424`                        | `#153460`                        | Primary accent deep/shadow       |
| `#3e5c47`                        | `#2e6b8a`                        | Secondary accent (success)       |
| `#2e4535`                        | `#1e4f6a`                        | Secondary accent hover           |
| `#1a1714`                        | `#131a25`                        | Dark button hover                |
| `rgba(122,62,62,0.12)`           | `rgba(44,94,160,0.12)`           | Focus ring shadow                |

### Dark Mode

| Warm Dark (Hiện tại)             | Blue Dark (Mới)                  | Vai trò                          |
| -------------------------------- | -------------------------------- | -------------------------------- |
| `#12100e`                        | `#0c1018`                        | Body background                  |
| `#1a1714`                        | `#131a25`                        | Card / Surface background        |
| `#231f1c`                        | `#1a2332`                        | Hover / Muted background         |
| `#3a352e`                        | `#283548`                        | Border primary                   |
| `#2c2825`                        | `#1e2a3a`                        | Border light                     |
| `#e0d6c8`                        | `#c8d6e5`                        | Primary text                     |
| `#a49a8c`                        | `#7b8a9e`                        | Secondary text                   |
| `#7e7364`                        | `#5a6e85`                        | Muted text                       |
| `#5c544d`                        | `#4a5568`                        | Disabled text / Placeholder      |
| `#62594d`                        | `#4a5568`                        | Group label muted                |
| `#978e80`                        | `#6b7d95`                        | Inactive nav text                |
| `#9e5a5a`                        | `#5a8ec4`                        | Accent primary                   |
| `rgba(158,90,90,0.15)`           | `rgba(90,142,196,0.15)`          | Focus ring shadow                |
| `#c6a87c`                        | `#6fa8d6`                        | Accent gold (sidebar brand)      |
| `#cfc8bc`                        | `#8fa8c4`                        | Sidebar text / icon border       |

---

## 🏛️ 8. Chi Tiết Thông Tin Quản Lý Của Từng Phân Hệ (Modules Managed Data)

Dưới đây là chi tiết các trường dữ liệu cần quản lý và cách thức trình bày Modal Chi tiết đối với từng phân hệ trong hệ thống EduCore THPT:

### 8.1. Nhóm Hành chính & Nhân sự

- **`overview` — Tổng quan Hệ thống (OverviewPanel):**
  - *Thông tin quản lý:* Số liệu tổng hợp toàn trường (sĩ số học sinh, sĩ số bán trú, tổng số lớp học, số lượng GV, chỉ tiêu tuyển sinh), danh sách công việc cần làm của BGH, biểu đồ xu hướng sĩ số và doanh thu học phí, các thông báo khẩn từ Sở Giáo dục & Đào tạo.
  - *Cách trình bày Modal Chi tiết:* Khi xem chi tiết một thông báo khẩn: Sử dụng Modal kích thước trung bình (`max-w-2xl`). Header hiển thị tiêu đề thông báo và độ khẩn. Body hiển thị nội dung thông báo đầy đủ, ngày gửi, người ký duyệt và danh mục tệp đính kèm dạng link tải về.

- **`personnel` — Nhân sự & Giáo viên (PersonnelPanel):**
  - *Thông tin quản lý:* Mã định danh cán bộ (`id`), Họ tên, Giới tính, Ngày sinh, CCCD, Số điện thoại, Email, Quê quán, Địa chỉ thường trú, Chuyên môn đào tạo (Môn học/Khối học), Chức vụ/Vai trò (Ban Giám Hiệu, Giáo viên chủ nhiệm, Giáo viên bộ môn, Nhân viên hành chính), Lớp phụ trách (`assignedClass`), Trạng thái hoạt động, Lịch sử khen thưởng/Kỷ luật.
  - *Cách trình bày Modal Chi tiết:* Sử dụng Modal lớn (`max-w-4xl`) chia làm 2 cột. Cột bên trái hiển thị ảnh chân dung của nhân sự và thông tin liên hệ. Cột bên phải hiển thị thông tin công tác, tổ chuyên môn, định mức tiết dạy, danh sách các lớp chủ nhiệm được phân công và lịch sử công tác.

- **`admin` — Hành chính Tổng hợp (AdminPanel):**
  - *Thông tin quản lý:* Số hiệu văn bản, Loại văn bản (Quyết định, Thông tư, Công văn, tờ trình), Trích yếu nội dung, Ngày ban hành, Ngày nhận/gửi, Người ký, Cơ quan ban hành, Độ mật (Thường, Mật, Tối mật), Độ khẩn (Thường, Khẩn, Hỏa tốc), Trạng thái xử lý (Đã xử lý, Đang chờ duyệt, Trả lại), File PDF đính kèm.
  - *Cách trình bày Modal Chi tiết:* Modal rộng (`max-w-5xl`) chia làm hai nửa dọc. Nửa bên trái hiển thị đầy đủ thông tin metadata của văn bản (Số hiệu, Trích yếu, Ngày ban hành, Lịch sử luân chuyển). Nửa bên phải tích hợp trực tiếp trình xem trước file PDF (PDF Previewer) giúp văn thư xem nhanh nội dung văn bản mà không cần tải về.

- **`party-union` — Đảng & Đoàn thể (PartyUnionPanel):**
  - *Thông tin quản lý:* Danh sách Đảng viên/Đoàn viên công đoàn, Lịch sử sinh hoạt chi bộ, Biên bản cuộc họp, Quỹ công đoàn trường, Danh sách Ban chấp hành Hội cha mẹ học sinh đại diện các lớp.
  - *Cách trình bày Modal Chi tiết:* Modal trung bình (`max-w-3xl`) dạng Tabs. Tab 1: Thông tin chung (Mục đích cuộc họp, thời gian, địa điểm, chủ trì). Tab 2: Danh sách đại biểu tham gia và ý kiến phát biểu đóng góp. Tab 3: Các tài liệu/nghị quyết được thông qua.

### 8.2. Nhóm Đào tạo & Chuyên môn

- **`academics` — Chương trình Đào tạo (AcademicsPanel):**
  - *Thông tin quản lý:* Khung chương trình GDPT cấp THPT, Phân phối chương trình chi tiết của từng môn học theo tuần (37 tuần thực học), Kế hoạch bài dạy (Giáo án) của giáo viên nộp lên chờ duyệt, Ý kiến phản hồi của Tổ trưởng/BGH.
  - *Cách trình bày Modal Chi tiết:* Modal lớn (`max-w-4xl`). Phần trên hiển thị thông tin Khối, Môn học, Tuần học, Tên bài học. Phần dưới hiển thị bảng phân phối chi tiết các hoạt động học tập trong bài học đó và khung nhận xét/phê duyệt của BGH kèm chữ ký số.

- **`departments` — Tổ chuyên môn & Môn học (DepartmentsPanel):**
  - *Thông tin quản lý:* Tên tổ chuyên môn (Toán, Ngữ Văn, Tiếng Anh, Vật Lý-Hóa Học, Sinh Học-Địa Lý, Tin Học-Công Nghệ, Giáo Dục Thể Chất, Lịch Sử-KTPL), Danh sách giáo viên thành viên, Tổ trưởng tổ khối, Tổ phó tổ khối, Danh mục môn học phụ trách của tổ và định mức số tiết chuẩn.
  - *Cách trình bày Modal Chi tiết:* Modal dạng thẻ (`max-w-3xl`). Header hiển thị tên tổ bộ môn và thông tin Trưởng/Phó tổ. Body chia làm 2 tab: Tab 1 hiển thị danh sách toàn bộ giáo viên thuộc tổ dạng lưới thẻ (Avatar, họ tên, lớp chủ nhiệm). Tab 2 hiển thị các môn học tổ phụ trách giảng dạy.

- **`assignments` — Phân công chuyên môn (AssignmentsPanel):**
  - *Thông tin quản lý:* Bảng phân công giảng dạy chi tiết: Giáo viên, Lớp học, Môn học đảm nhận, Học kỳ áp dụng. Hệ thống định mức tiết dạy tiêu chuẩn của từng GV và số tiết đã phân công thực tế (assigned hours).
  - *Cách trình bày Modal Chi tiết:* Modal trung bình (`max-w-2xl`). Hiển thị chi tiết định mức giờ dạy của giáo viên dưới dạng thanh tiến trình trực quan (Progress Bar): Tổng số tiết tiêu chuẩn, số tiết đã giao dạy (nếu quá tải thanh sẽ chuyển sang màu đỏ cảnh báo) và danh sách lớp học được phân công.

- **`timetable` — Lịch học & Lịch thi (TimetablePanel):**
  - *Thông tin quản lý:* Lưới thời khóa biểu (Thứ 2 - Thứ 7): Lớp học, Tiết học (1-10), Môn học, Giáo viên, Phòng học thực tế. Lịch thi học kỳ: Môn thi, Ngày thi, Phòng thi, Cặp giám thị coi thi, Danh sách thí sinh trong phòng.
  - *Cách trình bày Modal Chi tiết:* Đối với Thời khóa biểu lớp: Modal hiển thị lưới thời gian biểu 6 ngày trong tuần dạng thời khóa biểu truyền thống. Đối với Lịch thi: Modal hiển thị sơ đồ phòng thi, danh sách học sinh ngồi thi theo số báo danh và thông tin 2 giám thị coi thi.

- **`quality-assurance` — Khảo thí & Kiểm định (QualityAssurancePanel):**
  - *Thông tin quản lý:* Bảng kế hoạch tự đánh giá trường chuẩn quốc gia, Danh mục Tiêu chuẩn (1-5) và Tiêu chí kiểm định, Danh sách hồ sơ minh chứng (Mã minh chứng, Tên văn bản minh chứng, Nguồn thu thập, Ngày lưu trữ, Người quản lý).
  - *Cách trình bày Modal Chi tiết:* Modal dạng cây thư mục (`max-w-4xl`). Cột trái hiển thị sơ đồ Tiêu chuẩn - Tiêu chí. Khi click vào một tiêu chí, cột phải sẽ hiển thị danh sách các hồ sơ minh chứng đã nộp, trạng thái duyệt và đường link xem nhanh tài liệu gốc.

### 8.3. Nhóm Công tác Học sinh

- **`students` — Học sinh & Học tập (StudentsPanel):**
  - *Thông tin quản lý:* Hồ sơ lý lịch học sinh (Mã HS, Họ tên, Ngày sinh, Giới tính, Lớp, CCCD học sinh, Dân tộc, Hộ khẩu thường trú), Liên hệ cha mẹ (Họ tên cha/mẹ, SĐT, Email), Chuyên cần (số buổi nghỉ có phép/không phép), Điểm số môn học định kỳ (Điểm đánh giá thường xuyên, Giữa kỳ, Cuối kỳ) và kết quả học lực, hạnh kiểm, Nhận xét cuối kỳ của GVCN.
  - *Cách trình bày Modal Chi tiết (Sổ Học Bạ / Sổ Liên Lạc điện tử):* Modal kích thước cực đại (`max-w-5xl` hoặc full màn hình) sử dụng thanh điều hướng Tabs bên trái:
    - *Tab 1: Lý lịch học sinh:* Ảnh chân dung, thông tin cơ bản, thông tin cha mẹ và thông tin liên hệ khẩn cấp.
    - *Tab 2: Chuyên cần:* Bảng lịch sử điểm danh chi tiết từng ngày nghỉ học kèm lý do.
    - *Tab 3: Kết quả học tập:* Bảng điểm các môn học (Toán, Vật Lý, Hóa Học, Ngữ Văn, Tiếng Anh, Lịch Sử, Địa Lý, Sinh Học, Tin Học, KTPL, Công Nghệ) và điểm trung bình học kỳ (GPA).
    - *Tab 4: Nhận xét & Đánh giá:* Các nhận xét về học tập, rèn luyện hạnh kiểm và thi đua.

- **`classes` — Lớp học (ClassesPanel):**
  - *Thông tin quản lý:* Danh sách lớp (ví dụ: Lớp 10A1, 11B2, 12C3), Khối học, Phòng học, Sĩ số hiện tại, Sĩ số tối đa, Giáo viên chủ nhiệm, Danh sách học sinh lớp học.
  - *Cách trình bày Modal Chi tiết:* Modal lớn (`max-w-4xl`). Header hiển thị tên lớp và GVCN. Body hiển thị bảng danh sách học sinh trong lớp (Mã HS, Họ tên, Giới tính, Trạng thái) và biểu đồ tròn thống kê tỷ lệ Nam/Nữ, học lực.

- **`youth-union` — Đoàn & Phong trào (YouthUnionPanel):**
  - *Thông tin quản lý:* Danh sách Đoàn viên (Họ tên, Ngày kết nạp Đoàn, Chức vụ trong Đoàn), Bảng chấm điểm thi đua nề nếp tuần của các lớp (đồng phục, chuyên cần, xếp hàng, vệ sinh, giữ trật tự).
  - *Cách trình bày Modal Chi tiết:* Modal trung bình (`max-w-3xl`). Khi xem chi tiết điểm thi đua của lớp: Hiển thị bảng tổng hợp điểm thi đua tuần, danh sách các điểm cộng và các lỗi bị trừ điểm chi tiết theo ngày kèm tên học sinh vi phạm.

- **`counseling` — Hướng nghiệp & Tâm lý (CounselingPanel):**
  - *Thông tin quản lý:* Danh sách học sinh cần hỗ trợ tâm lý, Lịch hẹn tham vấn, Dữ liệu ngành học và điểm chuẩn các trường Đại học/Cao đẳng, thông tin tổ hợp xét tuyển.
  - *Cách trình bày Modal Chi tiết:* Thiết kế bảo mật nghiêm ngặt (`max-w-3xl`). Chỉ hiển thị cho tài khoản chuyên gia tâm lý và BGH trường. Trình bày dưới dạng biên bản tham vấn hoặc chi tiết thông tin hướng nghiệp cho học sinh (gợi ý tổ hợp môn học).

- **`admissions` — Tuyển sinh Online (AdmissionsPanel):**
  - *Thông tin quản lý:* Hồ sơ học sinh đăng ký tuyển sinh vào lớp 10 (Họ tên, Ngày sinh, Học bạ THCS, Điểm thi tuyển sinh lớp 10), Trạng thái hồ sơ (Chờ duyệt, Đã tiếp nhận, Thiếu hồ sơ, Từ chối), Chỉ tiêu tuyển sinh của trường.
  - *Cách trình bày Modal Chi tiết:* Modal lớn (`max-w-4xl`). Phần bên trái hiển thị ảnh chụp học bạ/bảng điểm thi lớp 10 của học sinh để đối chiếu. Phần bên phải hiển thị thông tin điền biểu mẫu, hệ thống tự động kiểm tra điểm chuẩn nộp vào trường.

- **`promotion` — Kết chuyển năm học (PromotionPanel):**
  - *Thông tin quản lý:* Kế hoạch kết chuyển năm học mới, Danh sách học sinh lên lớp/lưu ban/chuyển trường, Danh sách học sinh khối 12 tốt nghiệp THPT.
  - *Cách trình bày Modal Chi tiết:* Modal dạng bảng so sánh (`max-w-4xl`). Hiển thị danh sách học sinh của lớp cũ cùng kết quả học lực, đề xuất lớp mới và phê duyệt kết chuyển.

- **`alumni` — Cựu học sinh (AlumniPanel):**
  - *Thông tin quản lý:* Thông tin liên lạc cựu học sinh, Khóa học (năm tốt nghiệp lớp 12), Trường Đại học/Cơ quan công tác hiện tại.
  - *Cách trình bày Modal Chi tiết:* Modal đơn giản (`max-w-2xl`) hiển thị hồ sơ cá nhân cựu học sinh, quá trình học tập sau khi tốt nghiệp cấp 3.

### 8.4. Nhóm Tài chính & Hậu cần

- **`finance` — Tài chính - Kế toán (FinancePanel):**
  - *Thông tin quản lý:* Danh sách hóa đơn/biên lai học phí định kỳ của học sinh, Sổ thu chi nội bộ của nhà trường (mua sắm thiết bị dạy học, sửa chữa, khen thưởng).
  - *Cách trình bày Modal Chi tiết:* Modal dạng hóa đơn biên lai điện tử (`max-w-3xl`). Hiển thị chi tiết mã biên lai, thông tin học sinh nộp tiền, bảng kê chi tiết các khoản thu học phí, học kỳ áp dụng, mã QR thanh toán ngân hàng và lịch sử đóng tiền.

- **`facilities` — Cơ sở vật chất (FacilitiesPanel):**
  - *Thông tin quản lý:* Danh mục phòng học (Phòng học chuẩn, Phòng máy tính, Thư viện, Nhà đa năng), Thiết bị dạy học gắn với từng phòng, Phiếu yêu cầu sửa chữa cơ sở vật chất (nội dung hỏng, vị trí, người báo, tiến độ sửa chữa).
  - *Cách trình bày Modal Chi tiết:* Khi xem chi tiết phiếu sửa chữa: Modal trung bình (`max-w-2xl`). Header hiển thị mức độ nghiêm trọng (Đỏ: Nghiêm trọng, Vàng: Trung bình). Body hiển thị mô tả hỏng hóc kèm hình ảnh thực tế, tên phòng học xảy ra sự cố, nhật ký khắc phục và nút nghiệm thu.

- **`health` — Y tế Học đường (HealthPanel):**
  - *Thông tin quản lý:* Sổ theo dõi sức khỏe học sinh định kỳ (chiều cao, cân nặng, BMI, thị lực, tiền sử bệnh, dị ứng thuốc), Nhật ký ca khám tại phòng y tế (học sinh, lớp, triệu chứng, thuốc cấp phát, người khám, trạng thái báo phụ huynh).
  - *Cách trình bày Modal Chi tiết:* Modal lớn (`max-w-4xl`) hiển thị chỉ số sinh trắc học hiện tại, lịch sử tiêm chủng và danh sách các lần khám tại phòng y tế trường học.

- **`boarding` — Bán trú & Căn-tin (BoardingPanel):**
  - *Thông tin quản lý:* Thực đơn bữa trưa của học sinh bán trú, Nhật ký lưu mẫu thức ăn 24h, Danh sách học sinh ăn bán trú, Sơ đồ phòng ngủ bán trú, Sĩ số có mặt/vắng mặt, Danh sách nhà cung cấp thực phẩm.
  - *Cách trình bày Modal Chi tiết:* Modal hiển thị chi tiết thực đơn tuần, giấy chứng nhận an toàn vệ sinh thực phẩm của nhà cung cấp hoặc sơ đồ quản lý sĩ số phòng ngủ bán trú.

### 8.5. Nhóm Cấu hình & Cá nhân

- **`settings` — Cài đặt hệ thống (SettingsPanel):**
  - *Thông tin quản lý:* Cấu hình giao diện (Theme sáng/tối), Ngôn ngữ (VI/EN), Mật độ lưới bảng biểu, Danh sách người dùng hệ thống và phân quyền truy cập chức năng chi tiết cho từng nhóm vai trò (BGH, Giáo viên, Kế toán, Y tế, Văn thư).
  - *Cách trình bày Modal Chi tiết:* Modal cấu hình nhóm quyền (`max-w-3xl`) hiển thị danh sách các phân hệ và các nút toggle cho phép Đọc/Ghi/Xóa tương ứng với nhóm vai trò đang chọn.

- **`user-profile` — Thông tin cá nhân (UserProfilePanel):**
  - *Thông tin quản lý:* Hồ sơ cá nhân của người dùng hiện tại (họ tên, email, ảnh đại diện), thiết lập mật khẩu đăng nhập, danh sách các thiết bị đã đăng nhập tài khoản.
  - *Cách trình bày Modal Chi tiết:* Modal đổi mật khẩu (`max-w-md`) hiển thị các ô nhập mật khẩu hiện tại, mật khẩu mới và nút xác nhận.

---

## 📝 9. Cấu Trúc Modal CRUD & Quy Chuẩn Modal Chi Tiết (CRUD & Detail Modals Structure)

Hệ thống EduCore sử dụng các Modal để thực hiện các thao tác Tạo mới (Create), Đọc chi tiết (Read), Cập nhật (Update) và Xóa (Delete). Dưới đây là đặc tả chi tiết cấu trúc dữ liệu, giao diện và quy chuẩn trình bày:

### 9.1. Tiêu Chuẩn Trình Bày Modal Chi Tiết (Detailed View Modal Standards)
Để đảm bảo tính đồng bộ và trải nghiệm người dùng cao cấp, tất cả các Modal Chi Tiết (Detailed View Modals) trong hệ thống EduCore phải tuân thủ nghiêm ngặt các quy tắc thiết kế dưới đây:
- **Phân Cấp Bố Cục (Layout Hierarchy):**
  - *Header:* Tiêu đề Modal sử dụng phông chữ Serif (`Playfair Display`), cỡ chữ `text-2xl`, in đậm. Phụ đề hiển thị mã thực thể (ví dụ: `Mã HS: HS.2025.0012`) sử dụng phông chữ Mono (`ui-monospace`), cỡ chữ `text-[10px]` uppercase, tracking rộng. Tích hợp Badge chỉ thị trạng thái của thực thể (ví dụ: Đang hoạt động, Chờ duyệt) ở góc trên bên phải.
  - *Body:* Sử dụng hệ thống Grid 2 cột (`grid grid-cols-1 md:grid-cols-2 gap-6`) cho các thông tin thông thường. Các nhãn thông tin (Labels) sử dụng cỡ chữ `text-[10px]` in đậm, in hoa, tracking-widest, màu xám `--text-secondary`. Giá trị dữ liệu hiển thị bằng màu `--text-primary`, in đậm.
  - *Footer:* Đường chia ngăn nét đứt màu `--border-primary`. Nút đóng chính hoặc nút chuyển sang chế độ Sửa (Edit) nằm phía bên phải.
- **Quy Chuẩn Đa Ngôn Ngữ & Responsive:**
  - Tất cả các nhãn và tiêu đề trong Modal chi tiết phải tự động thay đổi ngôn ngữ hiển thị theo trạng thái `language` toàn cục.
  - Trên thiết bị di động (màn hình nhỏ hơn 768px), các bố cục chia cột dọc hoặc chia tab ngang phải tự động co dãn, chuyển sang dạng một cột đơn để tránh hiện tượng tràn viền.

### 9.2. Modal Tiếp Nhận Học Sinh (StudentWizardModal)
- **Thiết kế:** Dạng Wizard gồm 3 bước riêng biệt:
  - *Bước 1: Thông tin học tập & Cơ bản:* Họ và tên học sinh (`name`): Textbox, bắt buộc; Ngày sinh (`dob`): Date picker (`BaseDatePicker`), định dạng `YYYY-MM-DD`, bắt buộc; Giới tính (`gender`): Dropdown (`BaseSelect`): Nam / Nữ; Lớp học (`grade`): Dropdown chọn lớp học; Trạng thái (`status`): Dropdown mặc định là "Đang Học".
  - *Bước 2: Thông tin liên hệ & Gia đình:* Số điện thoại (`phone`): Textbox; Địa chỉ thường trú (`address`): Textbox dài hoặc Textarea; Họ tên phụ huynh/giám hộ (`guardian`): Textbox, bắt buộc.
  - *Bước 3: Thông tin định danh:* Số CCCD/Định danh (`cccd`): Textbox, 12 số; Dân tộc (`ethnicity`): Textbox (mặc định Kinh).

### 9.3. Modal Hồ Sơ Giáo Viên (StaffModal)
- **Thiết kế:** Modal một cột hoặc chia hai cột đối xứng.
- **Các trường thông tin:** Họ và tên (`name`): Textbox, bắt buộc; Mã định danh cán bộ (`id`): Tự động sinh (GVxxxx); Giới tính (`gender`): Dropdown Nam/Nữ; Ngày sinh (`dob`): Date picker; Email (`email`): Textbox, bắt buộc nhập đúng định dạng; Số điện thoại (`phone`): Textbox; Tổ chuyên môn (`department`): Dropdown; Vai trò/Nhiệm vụ (`role`): Dropdown; Môn giảng dạy chính (`mainSubject`): Dropdown/Textbox; Trạng thái công tác (`status`): Dropdown.

### 9.4. Modal Văn Bản Hành Chính (AdminDocModal)
- **Thiết kế:** Modal kích thước `max-w-3xl`.
- **Các trường thông tin:** Số hiệu/Ký hiệu văn bản (`symbol`): Textbox, bắt buộc; Trích yếu nội dung (`trichYeu`): Textarea rộng, bắt buộc; Cơ quan ban hành (`issuingBody`): Textbox; Loại văn bản (`docType`): Dropdown; Độ khẩn (`urgency`): Dropdown; Độ mật (`security`): Dropdown; Ngày ban hành/Ngày nhận (`issueDate`): Date picker; Tệp đính kèm (`attachments`): Vùng thả kéo file.

### 9.5. Modal Nhật Ký Ca Bệnh Y Tế (HealthIncidentModal)
- **Thiết kế:** Modal gọn `max-w-2xl` hỗ trợ ghi nhận ca bệnh nhanh.
- **Các trường thông tin:** Tên bệnh nhân/học sinh (`patient`): Dropdown/Tìm kiếm; Lớp học (`class`): Điền tự động; Lý do khám (`reason`): Textbox; Thân nhiệt (`temp`): Textbox; Huyết áp (`bp`): Textbox; Hướng điều trị/Thuốc cấp phát (`treatment`): Textarea; Kết quả xử lý (`outcome`): Dropdown; Cán bộ y tế phụ trách (`staff`): Textbox; Thông báo phụ huynh (`parentNotified`): Toggle switch; Ghi chú phụ huynh (`parentNote`): Textarea.

### 9.6. Modal Giao Dịch Tài Chính (TuitionReceiptModal)
- **Thiết kế:** Modal hóa đơn tài chính chuyên nghiệp.
- **Các trường thông tin:** Họ tên học sinh (`name`): Tìm kiếm tự động; Lớp học (`className`): Điền tự động; Số tiền đóng học phí (`amount`): Nhập số; Học kỳ đóng (`semester`): Chọn Học kỳ I / Học kỳ II / Cả năm; Trạng thái đóng (`status`): Dropdown; Lý do hủy biên lai (`voidReason`): Textarea; Người thu ngân (`cashier`): Điền tự động.

### 9.7. Modal Kế Hoạch Bảo Trì Thiết Bị (MaintenanceModal)
- **Thiết kế:** Modal phục vụ hậu cần cơ sở vật chất.
- **Các trường thông tin:** Nội dung sự cố/bảo trì (`detail`): Textarea chi tiết; Vị trí hỏng hóc (`location`): Dropdown; Độ nghiêm trọng (`severity`): Dropdown; Trạng thái xử lý (`status`): Dropdown; Chi phí ước tính (`cost`): Nhập số.

---

> **Ghi chú:** Tài liệu này chỉ mô tả hệ thống thiết kế tone xanh dương, chưa được áp dụng vào mã nguồn.
> Để áp dụng, cần thay thế tất cả mã màu trong `index.css` và các component theo bảng ánh xạ ở mục 7.
