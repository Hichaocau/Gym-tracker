# Gym Tracker

App ghi lại buổi tập gym và thống kê theo tuần / tháng / năm, dùng chung cho nhiều người trên một máy.

## Chạy trên máy

```bash
npm install
npm run dev
```

- Máy tính: mở http://localhost:5173
- Điện thoại cùng Wi-Fi: mở địa chỉ `Network` mà lệnh trên in ra (vd. `http://192.168.1.25:5173`)

## Tính năng

- Nhiều hồ sơ (chọn người như Netflix), mỗi người có nhóm cơ, thói quen, mục tiêu tuần, bài tự thêm riêng
- Hôm nay: đánh dấu đã tập, chọn nhiều nhóm cơ, bấm giờ, tick thói quen
- Ghi chi tiết: bài tập từ thư viện ~150 bài (tên tiếng Việt), set × rep × kg (kg một bên), bài tính giờ, cardio (phút, km); tự điền số lần trước
- Lịch tháng: màu theo người, chạm ngày để xem / sửa
- Thống kê: số buổi, thời gian, so với kỳ trước, mục tiêu tuần, nhóm cơ, cảnh báo nhóm cơ lâu chưa tập, bài tập nhiều nhất, biểu đồ mức tạ, so sánh giữa các người
- Xuất / nhập dữ liệu JSON (Cài đặt)

## Dữ liệu

Lưu trong `localStorage` của trình duyệt (khoá `gym-tracker:v1`). Xoá app hoặc dữ liệu trình duyệt là mất, nên app nhắc sao lưu mỗi 30 ngày (Cài đặt → Xuất file sao lưu; trên iPhone mở bảng chia sẻ để lưu vào Tệp).

## Cài như app (PWA)

- `vite-plugin-pwa` tạo service worker: app mở được khi không có mạng, ảnh bài tập đã xem cũng được giữ lại.
- Service worker chỉ có ở bản build (`npm run build && npm run preview`) và chỉ chạy trên HTTPS hoặc localhost, nên trên iPhone phải dùng bản đã deploy.
- Icon sinh từ `public/logo.svg`: chạy `npx pwa-assets-generator` sau khi sửa logo.

## Cấu trúc

- `src/types.ts` – kiểu dữ liệu
- `src/lib/store.tsx` – lưu / đọc state
- `src/lib/stats.ts`, `src/lib/exercises.ts` – tính thống kê, tra cứu bài tập
- `src/data/exercises.ts` – thư viện bài tập, sinh từ [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (Unlicense) bằng `scripts/gen_exercises.py`; hướng dẫn tiếng Việt nằm trong `scripts/exercise-vi/*.json`
- `src/screens/*` – các màn hình

## Bước tiếp theo (chưa làm)

- Đưa lên GitHub cá nhân và deploy Vercel
- Thông báo nhắc tập
- Đồng bộ nhiều thiết bị (Supabase)
