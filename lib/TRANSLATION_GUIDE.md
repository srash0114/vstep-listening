# Hướng Dẫn Quản Lý Bản Dịch (Translation Management Guide)

## Cơ Sở Dữ Liệu Bản Dịch (Translation Database)

Tất cả các bản dịch được lưu trữ tập trung trong file `lib/i18n.ts`. Điều này giúp dễ dàng quản lý, cập nhật và tái sử dụng bản dịch trên toàn ứng dụng.

## Cách Sử Dụng

### 1. Sử dụng Hook `useLang()` với Hàm `tx()` (Cách Mới - Được Khuyến Nghị)

```tsx
import { useLang } from "@/lib/lang";

export default function MyComponent() {
  const { tx, lang } = useLang();

  return (
    <div>
      <h1>{tx("signIn")}</h1>
      <p>{tx("loadExamsFailed")}</p>
      <button>{tx("save")}</button>
    </div>
  );
}
```

**Ưu điểm:**
- ✅ Type-safe (IDE sẽ gợi ý các key hợp lệ)
- ✅ Dễ bảo trì (tất cả bản dịch ở một chỗ)
- ✅ Tránh lặp lại bản dịch giống nhau
- ✅ Dễ tìm kiếm và thay thế

### 2. Sử dụng Hook `useLang()` với Hàm `t()` (Cách Cũ)

Nếu bạn có bản dịch cần viết inline:

```tsx
import { useLang } from "@/lib/lang";

export default function MyComponent() {
  const { t } = useLang();

  return (
    <div>
      <h1>{t("Đăng nhập", "Sign in")}</h1>
    </div>
  );
}
```

## Thêm Bản Dịch Mới

### Bước 1: Mở file `lib/i18n.ts`

### Bước 2: Thêm key bản dịch vào object `translations`

```typescript
const translations = {
  // ... existing translations
  
  // Thêm bản dịch mới
  myNewFeature: { 
    vi: "Tính năng mới của tôi", 
    en: "My New Feature" 
  },
  
  // Hoặc bản dịch động với placeholder
  deleteConfirm: {
    vi: 'Xóa "{title}"? Hành động này không thể hoàn tác.',
    en: 'Delete "{title}"? This action cannot be undone.',
  },
};
```

### Bước 3: Sử dụng trong component

```tsx
const { tx, t } = useLang();

// Cách 1: Dùng key từ i18n.ts
<button>{tx("myNewFeature")}</button>

// Cách 2: Nếu cần placeholder, dùng hàm t()
<p>{t(
  `Xóa "${title}"? Hành động này không thể hoàn tác.`,
  `Delete "${title}"? This action cannot be undone.`
)}</p>
```

## Cấu Trúc File `lib/i18n.ts`

```typescript
const translations = {
  // Nhóm: Navigation & Auth
  signIn: { vi: "...", en: "..." },
  
  // Nhóm: Main Pages
  tests: { vi: "...", en: "..." },
  
  // ... và cứ thế
} as const;
```

**Tổ chức theo nhóm** giúp dễ dàng tìm và quản lý:
- Navigation & Auth
- Main Pages
- Form & Validations
- Messages
- Admin Related
- và các nhóm khác...

## Hàm Tiện Ích

### `getTranslation(key, lang)`

Lấy bản dịch theo key và ngôn ngữ:

```typescript
import { getTranslation } from "@/lib/i18n";

const text = getTranslation("signIn", "vi"); // "Đăng nhập"
```

### `getTranslationsByLang(lang)`

Lấy tất cả bản dịch cho một ngôn ngữ:

```typescript
import { getTranslationsByLang } from "@/lib/i18n";

const viTranslations = getTranslationsByLang("vi");
// { signIn: "Đăng nhập", tests: "Đề thi", ... }
```

## Ví Dụ: Cập Nhật Một Component

### Trước (Cách Cũ)

```tsx
export default function AdminPage() {
  const { t } = useLang();

  return (
    <div>
      <h1>{t("Bảng quản trị", "Admin Dashboard")}</h1>
      <button>{t("Lưu", "Save")}</button>
      <p>{t("Không thể tạo đề thi", "Cannot create exam")}</p>
    </div>
  );
}
```

### Sau (Cách Mới)

```tsx
export default function AdminPage() {
  const { tx } = useLang();

  return (
    <div>
      <h1>{tx("adminDashboard")}</h1>
      <button>{tx("save")}</button>
      <p>{tx("cannotCreateExam")}</p>
    </div>
  );
}
```

## Những Lợi Ích

| Yếu Tố | Trước | Sau |
|--------|-------|-----|
| **Quản Lý** | Bản dịch rải rác khắp nơi | Tập trung 1 file |
| **Tái Sử Dụng** | Dễ bị lặp lại | Được dùng lại từ i18n.ts |
| **Bảo Trì** | Khó tìm kiếm thay thế | Dễ dàng cập nhật |
| **An Toàn Kiểu** | Không có gợi ý | Có gợi ý từ IDE |
| **Performance** | Bình thường | Tốt hơn (tái sử dụng string) |

## Checklist Khi Thêm Tính Năng Mới

- [ ] Thêm bản dịch vào `lib/i18n.ts`
- [ ] Sử dụng `const { tx } = useLang()`
- [ ] Gọi hàm như `tx("yourKey")`
- [ ] Kiểm tra IDE gợi ý key có sẵn không
- [ ] Không viết bản dịch inline nữa (trừ khi cần placeholder động)
