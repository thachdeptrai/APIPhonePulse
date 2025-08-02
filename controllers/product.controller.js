const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const Variant = require('../models/Variant');
const Category = require('../models/Category');
const Color = require('../models/Color'); // Đảm bảo import Color
const Size = require('../models/Size');   // Đảm bảo import Size

class ProductController {

    /**
     * @route GET /api/products
     * @desc Lấy tất cả sản phẩm kèm theo ảnh chính, biến thể và danh mục.
     * @access Public
     */
    static async getAll(req, res) {
        try {
            // Lấy tất cả sản phẩm và populate category_id
            const products = await Product.find({})
                .populate({
                    path: 'category_id',
                    model: 'Category',
                    select: 'name' // Chỉ chọn trường 'name' của Category
                })
                .lean(); // Sử dụng .lean() để có thể chỉnh sửa đối tượng

            const result = await Promise.all(
                products.map(async (product) => {
                    // Lấy ảnh chính của sản phẩm
                    const primaryImage = await ProductImage.findOne({ product_id: product._id }).lean();

                    // Lấy tất cả biến thể của sản phẩm và populate color_id, size_id
                    const variants = await Variant.find({ product_id: product._id })
                        .populate({
                            path: 'color_id',
                            model: 'Color',
                            select: 'color_name'
                        })
                        .populate({
                            path: 'size_id',
                            model: 'Size',
                            select: 'size_name storage ram'
                        })
                        .lean(); // Quan trọng: .lean() cho variants để đảm bảo chúng là plain objects

                    // Trả về đối tượng sản phẩm đã được làm phẳng
                    return {
                        ...product, // product đã là plain object nhờ .lean() ở trên
                        productImage: primaryImage || null, // Gán đối tượng ProductImage
                        variants: variants // Gán mảng variants đã là plain objects
                        // category_id sẽ tự động được đưa vào từ product
                    };
                })
            );
            res.json(result);
        } catch (err) {
            console.error("Error in getAll products:", err);
            res.status(500).json({ error: err.message || "Lỗi server khi lấy danh sách sản phẩm." });
        }
    }

    /**
     * @route GET /api/products/:id
     * @desc Lấy sản phẩm theo ID kèm theo ảnh chính, biến thể và danh mục.
     * @access Public
     */
    static async getById(req, res) {
        try {
            const product = await Product.findById(req.params.id).populate({
              path: 'category_id',
              model: 'Category',
              select: 'name'
          })
          .lean();

      if (!product) {
          return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
      }

      const primaryImage = await ProductImage.findOne({ product_id: product._id }).lean();

      const variants = await Variant.find({ product_id: product._id })
          .populate({
              path: 'color_id',
              model: 'Color',
              select: 'color_name'
          })
          .populate({
              path: 'size_id',
              model: 'Size',
              select: 'size_name storage ram'
          })
          .lean(); // Quan trọng: .lean() cho variants

      res.json({
          ...product,
          productImage: primaryImage || null,
          variants: variants
      });
  } catch (err) {
      console.error("Error in getById product:", err);
      res.status(500).json({ error: err.message || "Lỗi server khi lấy sản phẩm theo ID." });
  }
}

/**
* @route GET /api/products/search
* @desc Tìm kiếm sản phẩm theo: tên, danh mục, size, và khoảng giá
* @access Public
*/
static async getName(req, res) {
  try {
      const { name, category, size, minPrice, maxPrice } = req.query;

      const productFilter = {};

      if (name) {
          productFilter.product_name = { $regex: name, $options: 'i' };
      }

      let categoryId = null;
      if (category) {
          const foundCategory = await Category.findOne({ name: { $regex: category, $options: 'i' } });
          if (foundCategory) {
              categoryId = foundCategory._id;
              productFilter.category_id = categoryId;
          } else {
              return res.json([]); // Không tìm thấy danh mục, trả về mảng rỗng
          }
      }

      const products = await Product.find(productFilter)
          .populate({
              path: 'category_id',
              model: 'Category',
              select: 'name'
          })
          .lean();

      const result = await Promise.all(
          products.map(async (product) => {
              const variantFilter = { product_id: product._id };

              if (size) {
                  const foundSize = await Size.findOne({ storage: { $regex: size, $options: 'i' } });
                  if (foundSize) {
                      variantFilter.size_id = foundSize._id;
                  } else {
                      return null; // Sản phẩm này không có biến thể với size yêu cầu
                      }
                    }

                    if (minPrice || maxPrice) {
                        variantFilter.price = {};
                        if (minPrice) variantFilter.price.$gte = parseFloat(minPrice);
                        if (maxPrice) variantFilter.price.$lte = parseFloat(maxPrice);
                    }

                    const variants = await Variant.find(variantFilter)
                        .populate({
                            path: 'color_id',
                            model: 'Color',
                            select: 'color_name'
                        })
                        .populate({
                            path: 'size_id',
                            model: 'Size',
                            select: 'size_name storage ram'
                        })
                        .lean(); // Quan trọng: .lean() cho variants

                    const primaryImage = await ProductImage.findOne({ product_id: product._id }).lean();

                    if (variants.length === 0) {
                        return null; // Nếu không có biến thể phù hợp, không trả về sản phẩm này
                    }

                    return {
                        ...product,
                        productImage: primaryImage || null,
                        variants: variants
                    };
                })
            );

            const filteredResult = result.filter(p => p !== null);
            res.json(filteredResult);
        } catch (err) {
            console.error("Error in getName products:", err);
            res.status(500).json({ error: err.message || "Lỗi server khi tìm kiếm sản phẩm." });
        }
    }

    // Tạo sản phẩm mới
    static async add(req, res) {
        try {
            const newProduct = new Product(req.body);
            const saved = await newProduct.save();
            res.status(201).json(saved);
        } catch (err) {
            if (err.name === 'ValidationError') {
                return res.status(400).json({ message: "Dữ liệu sản phẩm không hợp lệ.", errors: err.errors });
            }
            console.error("Error in add product:", err);
            res.status(400).json({ error: err.message || "Lỗi khi tạo sản phẩm." });
        }
    }

    // Cập nhật sản phẩm
    static async update(req, res) {
        try {
            req.body.modified_date = new Date();

            const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
                runValidators: true
            });

            if (!updated) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
            }
            res.json(updated);
        } catch (err) {
            if (err.name === 'ValidationError') {return res.status(400).json({ message: "Dữ liệu cập nhật sản phẩm không hợp lệ.", errors: err.errors });
          }
          console.error("Error in update product:", err);
          res.status(400).json({ error: err.message || "Lỗi khi cập nhật sản phẩm." });
      }
  }

  // Xoá sản phẩm
  static async delete(req, res) {
      try {
          const deleted = await Product.findByIdAndDelete(req.params.id);

          if (!deleted) {
              return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
          }
          res.json({ message: "Đã xoá sản phẩm" });
      } catch (err) {
          console.error("Error in delete product:", err);
          res.status(500).json({ error: err.message || "Lỗi server khi xoá sản phẩm." });
      }
  }
}

module.exports = ProductController;