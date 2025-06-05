# 📱 PhonePluse Backend API

> Dự án API bán điện thoại được xây dựng bằng **Node.js**, **Express**, và **MongoDB**.
> Tách module rõ ràng theo chuẩn MVCS (Model - View - Controller - Service nếu có).
> Tối ưu để scale, mở rộng thêm chức năng như: thanh toán, quản lý đơn hàng, admin panel...

---

## 🚀 Tính năng

- ✅ API CRUD cho người dùng, sản phẩm, đơn hàng,...
- ✅ Kết nối MongoDB Atlas hoặc MongoDB local
- ✅ Sử dụng middleware để kiểm tra token, log lỗi
- ✅ Cấu trúc thư mục rõ ràng, dễ maintain
- ✅ Viết theo chuẩn RESTful API
- ✅ Dễ mở rộng các module mới

---

## 🏗️ Công nghệ sử dụng

| Công nghệ       | Mô tả                     |
|----------------|---------------------------|
| Node.js        | Runtime JS phía server     |
| Express        | Framework xây dựng API    |
| MongoDB        | Cơ sở dữ liệu NoSQL       |
| Mongoose       | ORM cho MongoDB           |
| Dotenv         | Quản lý biến môi trường   |
| Cors           | Cho phép gọi API cross-origin |
| Nodemon        | Tự động reload server khi code thay đổi |

---

## 📁 Cấu trúc thư mục

```bash
.
├── server.js
├── .env
├── package.json
    ├── app.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   └── user.controller.js
    ├── models/
    │   └── user.model.js
    ├── routes/
    │   └── user.route.js
    ├── middlewares/
    │   ├── error.middleware.js
    │   └── auth.middleware.js
    ├── utils/
    │   └── token.util.js
    └── types/
        └── user.types.js

# 1. Clone repo
git clone https://github.com/thachdeptrai/APIPhonePulse.git

# 2. Cài dependencies
npm install

# 3. Tạo file .env
cp .env.example .env
# rồi điền các giá trị cần thiết như:
# MONGO_URI=mongodb://localhost:27017/phonepluse
# PORT=5000
# JWT_SECRET=banhtrangtron

# 4. Chạy server
npm run dev

