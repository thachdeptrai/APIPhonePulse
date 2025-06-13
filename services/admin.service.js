const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Log = require('../models/Log');

// Service xử lý logic thống kê doanh thu
class AdminService {
  
  // Lấy doanh thu theo tháng
  static async getMonthlySales(year = new Date().getFullYear()) {
    try {
      // Aggregate pipeline để tính doanh thu theo từng tháng trong năm
      const monthlySales = await Sale.aggregate([
        {
          // Lọc các giao dịch hoàn thành trong năm được chỉ định
          $match: {
            status: 'COMPLETED',
            saleDate: {
              $gte: new Date(`${year}-01-01`),
              $lte: new Date(`${year}-12-31`)
            }
          }
        },
        {
          // Nhóm theo tháng và tính tổng doanh thu
          $group: {
            _id: {
              month: { $month: '$saleDate' },
              year: { $year: '$saleDate' }
            },
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: '$quantity' }
          }
        },
        {
          // Sắp xếp theo tháng
          $sort: { '_id.month': 1 }
        },
        {
          // Định dạng lại kết quả
          $project: {
            _id: 0,
            month: '$_id.month',
            year: '$_id.year',
            totalRevenue: 1,
            totalOrders: 1,
            totalQuantity: 1
          }
        }
      ]);

      // Tạo mảng 12 tháng với giá trị mặc định là 0
      const monthsData = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        year: year,
        totalRevenue: 0,
        totalOrders: 0,
        totalQuantity: 0
      }));

      // Gán dữ liệu thực tế vào các tháng tương ứng
      monthlySales.forEach(sale => {
        monthsData[sale.month - 1] = sale;
      });

      return monthsData;
    } catch (error) {
      throw new Error(`Lỗi khi lấy doanh thu theo tháng: ${error.message}`);
    }
  }

  // Lấy top sản phẩm bán chạy
  static async getTopProducts(limit = 10) {
    try {
      const topProducts = await Sale.aggregate([
        {
          // Chỉ lấy các giao dịch hoàn thành
          $match: { status: 'COMPLETED' }
        },
        {
          // Nhóm theo sản phẩm và tính tổng số lượng bán
          $group: {
            _id: '$productId',
            totalSold: { $sum: '$quantity' },
            totalRevenue: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 }
          }
        },
        {
          // Sắp xếp theo số lượng bán giảm dần
          $sort: { totalSold: -1 }
        },
        {
          // Giới hạn số lượng kết quả
          $limit: limit
        },
        {
          // Join với bảng Product để lấy thông tin sản phẩm
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productInfo'
          }
        },
        {
          // Unwind để flatten mảng productInfo
          $unwind: '$productInfo'
        },
        {
          // Định dạng lại kết quả
          $project: {
            _id: 0,
            productId: '$_id',
            productName: '$productInfo.name',
            productPrice: '$productInfo.price',
            totalSold: 1,
            totalRevenue: 1,
            totalOrders: 1,
            averageOrderValue: { $divide: ['$totalRevenue', '$totalOrders'] }
          }
        }
      ]);

      return topProducts;
    } catch (error) {
      throw new Error(`Lỗi khi lấy top sản phẩm: ${error.message}`);
    }
  }

  // Lấy danh sách logs với phân trang và lọc
  static async getLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        adminId,
        action,
        module,
        startDate,
        endDate
      } = options;

      // Tạo query filter
      const filter = {};
      
      if (adminId) filter.adminId = adminId;
      if (action) filter.action = action;
      if (module) filter.module = module;
      
      // Lọc theo khoảng thời gian
      if (startDate || endDate) {
        filter.time = {};
        if (startDate) filter.time.$gte = new Date(startDate);
        if (endDate) filter.time.$lte = new Date(endDate);
      }

      // Tính toán skip cho phân trang
      const skip = (page - 1) * limit;

      // Lấy danh sách logs với populate admin info
      const logs = await Log.find(filter)
        .populate('adminId', 'username email')
        .sort({ time: -1 })
        .skip(skip)
        .limit(limit);

      // Đếm tổng số logs để tính phân trang
      const totalLogs = await Log.countDocuments(filter);
      const totalPages = Math.ceil(totalLogs / limit);

      return {
        logs,
        pagination: {
          currentPage: page,
          totalPages,
          totalLogs,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy logs: ${error.message}`);
    }
  }

  // Tạo log mới khi admin thực hiện hành động
  static async createLog(adminId, action, module, details = '') {
    try {
      const newLog = new Log({
        adminId,
        action,
        module,
        details,
        time: new Date()
      });

      await newLog.save();
      return newLog;
    } catch (error) {
      throw new Error(`Lỗi khi tạo log: ${error.message}`);
    }
  }

  // Lấy sản phẩm với filter nâng cao
  static async getProductsAdvanced(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = 'desc',
        filter: filterType,
        category,
        minPrice,
        maxPrice,
        inStock
      } = options;

      // Tạo query filter
      const filter = {};
      
      if (category) filter.category_id = category;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      if (inStock !== undefined) {
        filter.stock_quantity = inStock ? { $gt: 0 } : { $eq: 0 };
      }

      // Tạo sort object
      const sortObj = {};
      if (filterType === 'price') {
        sortObj.price = sort === 'desc' ? -1 : 1;
      } else if (filterType === 'name') {
        sortObj.name = sort === 'desc' ? -1 : 1;
      } else if (filterType === 'date') {
        sortObj.createdAt = sort === 'desc' ? -1 : 1;
      } else {
        sortObj.createdAt = -1; // Mặc định sắp xếp theo ngày tạo mới nhất
      }

      const skip = (page - 1) * limit;

      // Lấy danh sách sản phẩm với populate category
      const products = await Product.find(filter)
        .populate('category_id', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit);

      // Đếm tổng số sản phẩm
      const totalProducts = await Product.countDocuments(filter);
      const totalPages = Math.ceil(totalProducts / limit);

      return {
        products,
        pagination: {
          currentPage: page,
          totalPages,
          totalProducts,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Lỗi khi lấy sản phẩm: ${error.message}`);
    }
  }
}

module.exports = AdminService;