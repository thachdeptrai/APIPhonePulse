// types/userTypes.js

/**
 * @typedef {Object} User
 * @property {string} _id - ID của user
 * @property {string} name - Tên người dùng
 * @property {string} email - Email người dùng
 * @property {string} password - Mật khẩu đã mã hóa
 * @property {string} avatar_url - URL ảnh đại diện
 * @property {number} phone - Số điện thoại
 * @property {string} address - Địa chỉ
 * @property {string} gender - Giới tính
 * @property {Date} birthday - Ngày sinh
 * @property {boolean} role - false: user, true: admin
 * @property {boolean} status - true: hoạt động, false: không hoạt động
 * @property {boolean} is_verified - true: đã xác minh, false: chưa xác minh
 * @property {Date} created_date - Ngày tạo
 * @property {Date} modified_date - Ngày cập nhật
 */

/**
 * @typedef {Object} CreateUserRequest
 * @property {string} name - Tên người dùng
 * @property {string} email - Email người dùng
 * @property {string} password - Mật khẩu
 * @property {string} [avatar_url] - URL ảnh đại diện
 * @property {number} [phone] - Số điện thoại
 * @property {string} [address] - Địa chỉ
 * @property {string} [gender] - Giới tính
 * @property {Date} [birthday] - Ngày sinh
 */

/**
 * @typedef {Object} UpdateUserRequest
 * @property {string} [name] - Tên người dùng
 * @property {string} [email] - Email người dùng
 * @property {string} [avatar_url] - URL ảnh đại diện
 * @property {number} [phone] - Số điện thoại
 * @property {string} [address] - Địa chỉ
 * @property {string} [gender] - Giới tính
 * @property {Date} [birthday] - Ngày sinh
 * @property {boolean} [role] - Quyền của user
 * @property {boolean} [status] - Trạng thái hoạt động
 * @property {boolean} [is_verified] - Trạng thái xác minh
 */

/**
 * @typedef {Object} LoginRequest
 * @property {string} email - Email người dùng
 * @property {string} password - Mật khẩu
 */

/**
 * @typedef {Object} ChangePasswordRequest
 * @property {string} currentPassword - Mật khẩu hiện tại
 * @property {string} newPassword - Mật khẩu mới
 */

/**
 * @typedef {Object} QueryOptions
 * @property {number} [page] - Số trang (mặc định: 1)
 * @property {number} [limit] - Số lượng item mỗi trang (mặc định: 10)
 * @property {string} [sort] - Trường sắp xếp (mặc định: created_date)
 * @property {string} [order] - Thứ tự sắp xếp: 'asc' hoặc 'desc' (mặc định: 'desc')
 * @property {string} [search] - Từ khóa tìm kiếm
 * @property {boolean} [status] - Lọc theo trạng thái
 * @property {boolean} [role] - Lọc theo quyền
 * @property {boolean} [is_verified] - Lọc theo trạng thái xác minh
 */

/**
 * @typedef {Object} PaginationResult
 * @property {User[]} data - Danh sách user
 * @property {number} totalItems - Tổng số item
 * @property {number} totalPages - Tổng số trang
 * @property {number} currentPage - Trang hiện tại
 * @property {number} itemsPerPage - Số item mỗi trang
 */

module.exports = {
    // Exports for JSDoc usage
    User,
    CreateUserRequest,
    UpdateUserRequest,
    LoginRequest,
    ChangePasswordRequest,
    QueryOptions,
    PaginationResult    
};