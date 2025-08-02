const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const Variant = require('../models/Variant');
const Category = require('../models/Category');
const Size = require('../models/Size');
// Lấy tất cả sản phẩm kèm theo biến thể của từng sản phẩm
exports.getAll = async (req, res) => {
  try {
    //  Tìm tất cả sản phẩm và lấy thông tin danh mục
    const products = await Product.find()
      .populate("category_id"); // Lấy thông tin chi tiết danh mục sản phẩm

    //  Duyệt từng sản phẩm để tìm ảnh & biến thể tương ứng
    const result = await Promise.all(
      products.map(async (product) => {
        //  Tìm tất cả ảnh có liên quan tới sản phẩm này
        const images = await ProductImage.find({ product_id: product._id });

        //  Tìm tất cả biến thể liên quan
        const variants = await Variant.find({ product_id: product._id })
          .populate("color_id") // Lấy thông tin màu sắc (VD: đỏ, xanh, ...)
          .populate("size_id"); // Lấy thông tin kích thước/dung lượng

        //  Trả về sản phẩm với trường `images` và `variants` đi kèm
        return {
          ...product.toObject(), // Chuyển từ Mongoose Document sang Object thường
          images,                // Danh sách ảnh sản phẩm
          variants               // Danh sách các biến thể
        };
      })
    );

    //  Trả kết quả về cho client
    res.json(result);
  } catch (err) {
    //  Nếu có lỗi, trả mã lỗi 500
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    // Tìm sản phẩm theo ID được truyền từ URL (/products/:id)
    const product = await Product.findById(req.params.id)
      .populate("category_id")       // Lấy thông tin chi tiết của danh mục (Category)
      .populate("productimage_id");  // Lấy thông tin ảnh sản phẩm (ProductImage)

    // Nếu không tìm thấy sản phẩm, trả về lỗi 404
    if (!product)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });

    // Tìm tất cả biến thể (Variant) thuộc sản phẩm này thông qua product_id
    const variants = await Variant.find({ product_id: product._id })
      .populate("color_id")          // Lấy thông tin màu sắc (Color)
      .populate("size_id");          // Lấy thông tin kích thước/dung lượng (Size)

    // Trả về object sản phẩm, bao gồm mảng biến thể
    res.json({
      ...product.toObject(),         // Chuyển product từ Mongoose Document sang Object thường
      variants                       // Gắn thêm danh sách biến thể vào object trả về
    });
  } catch (err) {
    // Xử lý lỗi server nếu có sự cố trong quá trình xử lý
    res.status(500).json({ error: err.message });
  }
};


// Tìm kiếm sản phẩm theo: tên, danh mục, size, và khoảng giá
exports.getName = async (req, res) => {
  try {
    // Lấy dữ liệu tìm kiếm từ query string trên URL
    const { name, category, size, minPrice, maxPrice } = req.query;

    // Khởi tạo bộ lọc cho Product
    const productFilter = {};

    //  Nếu có "name" -> tìm gần đúng theo product_name (không phân biệt hoa thường)
    if (name) {
      productFilter.product_name = { $regex: name, $options: 'i' };
    }

    // Nếu có "category" -> tìm ID của danh mục tương ứng theo tên
    if (category) {
      const foundCategory = await Category.findOne({ name: { $regex: category, $options: 'i' } });
      if (foundCategory) {
        productFilter.category_id = foundCategory._id;
      } else {
        return res.json([]); // Không tìm thấy danh mục => trả về mảng rỗng
      }
    }

    // Tìm danh sách sản phẩm theo bộ lọc
    const products = await Product.find(productFilter)
      .populate('category_id')       // Lấy thông tin chi tiết của danh mục
      .populate('productimage_id');  // Lấy thông tin ảnh sản phẩm

    // Duyệt từng sản phẩm để tìm các biến thể phù hợp theo size và price
    const result = await Promise.all(
      products.map(async (product) => {
        // Tạo bộ lọc cho Variant
        const variantFilter = { product_id: product._id };

        // Nếu có "size" -> tìm size_id tương ứng từ bảng Size
        if (size) {
          const foundSize = await Size.findOne({ storage: { $regex: size, $options: 'i' } });
          if (foundSize) {
            variantFilter.size_id = foundSize._id;
          } else {
            return null; // Không có size phù hợp → bỏ sản phẩm này
          }
        }

        // Nếu có điều kiện lọc theo giá
        if (minPrice || maxPrice) {
          variantFilter.price = {};
          if (minPrice) variantFilter.price.$gte = parseFloat(minPrice); // Giá tối thiểu
          if (maxPrice) variantFilter.price.$lte = parseFloat(maxPrice); // Giá tối đa
        }

        // Tìm các biến thể phù hợp với điều kiện lọc
        const variants = await Variant.find(variantFilter)
          .populate('color_id')  // Lấy thông tin màu sắc
          .populate('size_id');  // Lấy thông tin dung lượng/kích thước

        //  Nếu không có biến thể phù hợp, bỏ qua sản phẩm này
        if (variants.length === 0) return null;

        // Trả về sản phẩm cùng với danh sách biến thể
        return {
          ...product.toObject(), // Convert từ Mongoose Document sang plain JS Object
          variants
        };
      })
    );

    //  Lọc bỏ các sản phẩm không có biến thể phù hợp (null)
    res.json(result.filter(p => p !== null));
  } catch (err) {
    // Xử lý lỗi bất ngờ (DB, logic...)
    res.status(500).json({ error: err.message });
  }
};

//  Tạo sản phẩm mới
exports.add = async (req, res) => {
  try {
    const newProduct = new Product(req.body); // Tạo instance mới từ dữ liệu client gửi lên
    const saved = await newProduct.save(); // Lưu vào database
    res.status(201).json(saved); // Trả về sản phẩm mới với mã 201 (created)
  } catch (err) {
    res.status(400).json({ error: err.message }); // Trả về lỗi nếu dữ liệu không hợp lệ
  }
};

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
            if (err.name === 'ValidationError') {
                return res.status(400).json({ message: "Dữ liệu cập nhật sản phẩm không hợp lệ.", errors: err.errors });
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
