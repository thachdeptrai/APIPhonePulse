const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { 
  authenticateAdmin, 
  authorizeAdmin, 
  validatePagination, 
  validateDateRange,
  rateLimitAdmin 
} = require('../middlewares/admin.middleware');

// =============================================================================
// ADMIN STATISTICS ROUTES - Routes cho thống kê dành cho admin
// =============================================================================

// GET /api/admin/stats/sales - Lấy thống kê doanh thu theo tháng
// Query params: ?year=2024
router.get('/stats/sales', 
  authenticateAdmin,                    // Xác thực admin
  authorizeAdmin(['ADMIN']), // Chỉ admin mới xem được
  rateLimitAdmin(50, 15 * 60 * 1000),  // Giới hạn 50 request/15 phút
  AdminController.getSalesStats         // Controller xử lý
);

// GET /api/admin/stats/top-products - Lấy top sản phẩm bán chạy nhất
// Query params: ?limit=10
router.get('/stats/top-products',
  authenticateAdmin,                    // Xác thực admin
  authorizeAdmin(['ADMIN', 'MANAGER']), // Chỉ admin và manager mới xem được
  rateLimitAdmin(50, 15 * 60 * 1000),  // Giới hạn 50 request/15 phút
  AdminController.getTopProducts        // Controller xử lý
);

// =============================================================================
// ADMIN LOGS ROUTES - Routes cho nhật ký hoạt động
// =============================================================================

// GET /api/admin/logs - Lấy nhật ký hoạt động của admin
// Query params: ?page=1&limit=20&adminId=xxx&action=CREATE&module=PRODUCT&startDate=2024-01-01&endDate=2024-12-31
router.get('/logs',
  authenticateAdmin,                    // Xác thực admin
  authorizeAdmin(['ADMIN']),            // Chỉ admin cấp cao mới xem được logs
  validatePagination,                   // Validate tham số phân trang
  validateDateRange,                    // Validate khoảng thời gian
  rateLimitAdmin(30, 15 * 60 * 1000),  // Giới hạn 30 request/15 phút (ít hơn vì logs nhạy cảm)
  AdminController.getLogs               // Controller xử lý
);

// =============================================================================
// ADMIN PRODUCTS ROUTES - Routes cho quản lý sản phẩm nâng cao
// =============================================================================

// GET /api/admin/products - Lấy danh sách sản phẩm với filter nâng cao
// Query params: ?page=1&limit=20&sort=desc&filter=category&category=xxx&minPrice=100&maxPrice=1000&inStock=true
router.get('/products',
  authenticateAdmin,                    // Xác thực admin
  authorizeAdmin(['ADMIN', 'MANAGER', 'STAFF']), // Tất cả admin role đều có thể xem
  validatePagination,                   // Validate tham số phân trang
  rateLimitAdmin(100, 15 * 60 * 1000), // Giới hạn 100 request/15 phút
  AdminController.getProductsAdvanced   // Controller xử lý
);

// =============================================================================
// ADMIN DASHBOARD ROUTES - Routes tổng hợp cho dashboard (tùy chọn mở rộng)
// =============================================================================

// GET /api/admin/dashboard - Lấy tổng quan dashboard (có thể mở rộng thêm)
router.get('/dashboard',
  authenticateAdmin,
  authorizeAdmin(['ADMIN', 'MANAGER']),
  rateLimitAdmin(20, 15 * 60 * 1000),
  async (req, res) => {
    try {
      // Có thể tổng hợp nhiều thống kê trong một endpoint
      const currentYear = new Date().getFullYear();
      
      // Gọi các service song song để tối ưu performance
      const [salesData, topProducts] = await Promise.all([
        require('../services/admin.service').getMonthlySales(currentYear),
        require('../services/admin.service').getTopProducts(5)
      ]);

      // Tính một số chỉ số tổng quan
      const totalRevenue = salesData.reduce((sum, month) => sum + month.totalRevenue, 0);
      const totalOrders = salesData.reduce((sum, month) => sum + month.totalOrders, 0);
      const currentMonth = new Date().getMonth(); // 0-11
      const currentMonthRevenue = salesData[currentMonth]?.totalRevenue || 0;
      
      res.json({
        success: true,
        data: {
          overview: {
            totalRevenue,
            totalOrders,
            currentMonthRevenue,
            averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0
          },
          monthlySales: salesData,
          topProducts: topProducts.slice(0, 5), // Top 5 cho dashboard
          lastUpdated: new Date()
        },
        message: 'Dashboard data loaded successfully'
      });

      // Log activity
      if (req.admin && req.admin._id) {
        await require('../services/admin.service').createLog(
          req.admin._id,
          'VIEW',
          'STATS',
          'Xem dashboard tổng quan'
        );
      }

    } catch (error) {
      console.error('Lỗi khi lấy dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy dashboard',
        error: error.message
      });
    }
  }
);

// =============================================================================
// ERROR HANDLING - Xử lý lỗi cho các routes không tồn tại
// =============================================================================

// Middleware xử lý route không tồn tại trong /api/admin/*
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Admin API endpoint ${req.originalUrl} không tồn tại`,
    availableEndpoints: [
      'GET /api/admin/stats/sales',
      'GET /api/admin/stats/top-products', 
      'GET /api/admin/logs',
      'GET /api/admin/products',
      'GET /api/admin/dashboard'
    ]
  });
});

module.exports = router;