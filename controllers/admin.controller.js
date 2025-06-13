const AdminService = require('../services/admin.service');

// Controller xử lý các API endpoints cho admin
class AdminController {

  // GET /api/admin/stats/sales - Lấy doanh thu theo tháng
  static async getSalesStats(req, res) {
    try {
      // Lấy năm từ query parameter, mặc định là năm hiện tại
      const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
      
      // Validate năm
      if (year < 2000 || year > new Date().getFullYear() + 1) {
        return res.status(400).json({
          success: false,
          message: 'Năm không hợp lệ'
        });
      }

      // Gọi service để lấy dữ liệu doanh thu
      const salesData = await AdminService.getMonthlySales(year);
      
      // Tính tổng doanh thu cả năm
      const totalYearlyRevenue = salesData.reduce((sum, month) => sum + month.totalRevenue, 0);
      const totalYearlyOrders = salesData.reduce((sum, month) => sum + month.totalOrders, 0);

      res.json({
        success: true,
        data: {
          year,
          monthlySales: salesData,
          summary: {
            totalRevenue: totalYearlyRevenue,
            totalOrders: totalYearlyOrders,
            averageMonthlyRevenue: totalYearlyRevenue / 12
          }
        },
        message: `Doanh thu năm ${year} được tải thành công`
      });

      // Log hoạt động admin
      if (req.admin && req.admin.id) {
        await AdminService.createLog(
          req.admin.id,
          'VIEW',
          'STATS',
          `Xem thống kê doanh thu năm ${year}`
        );
      }

    } catch (error) {
      console.error('Lỗi khi lấy thống kê doanh thu:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy thống kê doanh thu',
        error: error.message
      });
    }
  }

  // GET /api/admin/stats/top-products - Lấy top sản phẩm bán chạy
  static async getTopProducts(req, res) {
    try {
      // Lấy số lượng sản phẩm muốn hiển thị, mặc định là 10
      const limit = req.query.limit ? parseInt(req.query.limit) : 10;
      
      // Validate limit
      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          message: 'Số lượng sản phẩm phải từ 1 đến 100'
        });
      }

      // Gọi service để lấy top sản phẩm
      const topProducts = await AdminService.getTopProducts(limit);
      
      res.json({
        success: true,
        data: {
          topProducts,
          count: topProducts.length
        },
        message: `Top ${limit} sản phẩm bán chạy được tải thành công`
      });

      // Log hoạt động admin
      if (req.admin && req.admin.id) {
        await AdminService.createLog(
          req.admin.id,
          'VIEW',
          'STATS',
          `Xem top ${limit} sản phẩm bán chạy`
        );
      }

    } catch (error) {
      console.error('Lỗi khi lấy top sản phẩm:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy top sản phẩm',
        error: error.message
      });
    }
  }

  // GET /api/admin/logs - Lấy nhật ký hoạt động
  static async getLogs(req, res) {
    try {
      // Lấy các tham số từ query
      const {
        page = 1,
        limit = 20,
        adminId,
        action,
        module,
        startDate,
        endDate
      } = req.query;

      // Validate các tham số
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Tham số phân trang không hợp lệ'
        });
      }

      // Chuẩn bị options cho service
      const options = {
        page: pageNum,
        limit: limitNum
      };

      // Thêm các filter nếu có
      if (adminId) options.adminId = adminId;
      if (action) options.action = action.toUpperCase();
      if (module) options.module = module.toUpperCase();
      if (startDate) options.startDate = startDate;
      if (endDate) options.endDate = endDate;

      // Gọi service để lấy logs
      const result = await AdminService.getLogs(options);
      
      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
        message: 'Nhật ký hoạt động được tải thành công'
      });

      // Log hoạt động admin (không log khi xem logs để tránh vòng lặp)
      // Có thể bỏ comment nếu muốn track việc xem logs
      /*
      if (req.admin && req.admin.id) {
        await AdminService.createLog(
          req.admin.id,
          'VIEW',
          'SYSTEM',
          'Xem nhật ký hoạt động'
        );
      }
      */

    } catch (error) {
      console.error('Lỗi khi lấy nhật ký:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy nhật ký hoạt động',
        error: error.message
      });
    }
  }

  // GET /api/admin/products?sort=desc&filter=category - Filter sản phẩm nâng cao
  static async getProductsAdvanced(req, res) {
    try {
      // Lấy các tham số từ query
      const {
        page = 1,
        limit = 20,
        sort = 'desc',
        filter,
        category,
        minPrice,
        maxPrice,
        inStock
      } = req.query;

      // Validate các tham số
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Tham số phân trang không hợp lệ'
        });
      }

      // Validate sort direction
      if (sort && !['asc', 'desc'].includes(sort.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Tham số sort chỉ chấp nhận "asc" hoặc "desc"'
        });
      }

      // Chuẩn bị options cho service
      const options = {
        page: pageNum,
        limit: limitNum,
        sort: sort.toLowerCase()
      };

      // Thêm các filter nếu có
      if (filter) options.filter = filter.toLowerCase();
      if (category) options.category = category;
      if (minPrice) options.minPrice = parseFloat(minPrice);
      if (maxPrice) options.maxPrice = parseFloat(maxPrice);
      if (inStock !== undefined) options.inStock = inStock === 'true';

      // Gọi service để lấy sản phẩm
      const result = await AdminService.getProductsAdvanced(options);
      
      res.json({
        success: true,
        data: result.products,
        pagination: result.pagination,
        filters: {
          sort,
          filter,
          category,
          minPrice,
          maxPrice,
          inStock
        },
        message: 'Danh sách sản phẩm được tải thành công'
      });

      // Log hoạt động admin
      if (req.admin && req.admin.id) {
        const filterDetails = `sort=${sort}, filter=${filter || 'none'}, category=${category || 'all'}`;
        await AdminService.createLog(
          req.admin.id,
          'VIEW',
          'PRODUCT',
          `Xem danh sách sản phẩm với filter: ${filterDetails}`
        );
      }

    } catch (error) {
      console.error('Lỗi khi lấy sản phẩm nâng cao:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi lấy danh sách sản phẩm',
        error: error.message
      });
    }
  }

  // Method helper để tạo log (dùng trong các controller khác)
  static async createLog(adminId, action, module, details) {
    try {
      return await AdminService.createLog(adminId, action, module, details);
    } catch (error) {
      console.error('Lỗi khi tạo log:', error);
      // Không throw error để không ảnh hưởng đến flow chính
    }
  }
}

module.exports = AdminController;