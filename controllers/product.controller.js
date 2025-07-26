const Product = require("../models/Product");
const ProductImage = require("../models/ProductImage");
const Variant = require('../models/Variant'); 
const Category = require('../models/Category');
const Size = require('../models/Size');
const Ram = require('../models/Ram');
// Lấy tất cả sản phẩm kèm theo biến thể của từng sản phẩm
// 📦 Lấy tất cả sản phẩm kèm theo ảnh và biến thể
exports.getAll = async (req, res) => {
  try {
    //  Tìm tất cả sản phẩm trong MongoDB và đồng thời lấy thêm thông tin danh mục
    const products = await Product.find().populate("category_id");

    //  Duyệt qua từng sản phẩm để lấy thêm ảnh và biến thể liên quan
    const result = await Promise.all(
      products.map(async (product) => {
        //  Tìm tất cả ảnh liên quan tới sản phẩm này (1-nhiều)
        const images = await ProductImage.find({ product_id: product._id });

        //  Tìm tất cả biến thể thuộc sản phẩm này
        const variants = await Variant.find({ product_id: product._id })
          .populate("color_id") // Lấy thông tin chi tiết màu sắc (VD: đỏ, đen,...)
          .populate("size_id"); // Lấy thông tin chi tiết kích thước (VD: 128GB,...)

        // 📦 Trả về object sản phẩm đầy đủ: thông tin gốc + ảnh + biến thể
        return {
          ...product.toObject(), // Convert từ Mongoose Document sang object thường
          images,                // Gắn thêm danh sách ảnh vào sản phẩm
          variants               // Gắn thêm danh sách biến thể vào sản phẩm
        };
      })
    );

    //  Trả danh sách sản phẩm sau khi đã gắn ảnh và biến thể về client
    res.json(result);
  } catch (err) {
    //  Nếu có lỗi bất ngờ, trả về lỗi 500 cùng thông báo lỗi
    res.status(500).json({ error: err.message });
  }
};

//  Lấy sản phẩm theo ID kèm ảnh và biến thể
exports.getById = async (req, res) => {
  try {
    // Tìm sản phẩm theo ID được truyền qua URL, đồng thời lấy luôn thông tin danh mục
    const product = await Product.findById(req.params.id).populate("category_id");

    // Nếu không tìm thấy sản phẩm → trả về lỗi 404
    if (!product) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }

    // Tìm tất cả ảnh liên kết với sản phẩm này bằng product_id (một sản phẩm có thể có nhiều ảnh)
    const images = await ProductImage.find({ product_id: product._id });

    // Tìm tất cả biến thể thuộc sản phẩm này, bao gồm thông tin color & size
    const variants = await Variant.find({ product_id: product._id })
      .populate("color_id")  // Lấy thông tin chi tiết của màu sắc (Color)
      .populate("size_id")  // Lấy thông tin chi tiết của dung lượng/kích thước (Size)
      .populate("ram_id");
    // Trả về kết quả gồm: thông tin sản phẩm + mảng ảnh + mảng biến thể
    res.json({
      ...product.toObject(),  // Chuyển từ Mongoose Document sang object thường
      images,                 // Danh sách ảnh thuộc sản phẩm
      variants                // Danh sách các biến thể của sản phẩm
    });
  } catch (err) {
    // Nếu có lỗi trong quá trình xử lý, trả về lỗi 500
    res.status(500).json({ error: err.message });
  }
};

exports.getName = async (req, res) => {
  try {
    // Lấy các tham số lọc từ query của URL
    const { name, category, size, ram, minPrice, maxPrice } = req.query;

    const productFilter = {}; // Bộ lọc cho bảng Product

    // Nếu có tên sản phẩm, lọc theo tên (dùng regex để tìm gần đúng, không phân biệt hoa thường)
    if (name) {
      productFilter.product_name = { $regex: name, $options: 'i' };
    }

    //  Nếu có tên danh mục, tìm Category tương ứng và lọc theo category_id
    if (category) {
      const foundCategory = await Category.findOne({ name: { $regex: category, $options: 'i' } });
      if (foundCategory) {
        productFilter.category_id = foundCategory._id;
      } else {
        return res.json([]); // Không tìm thấy danh mục → trả mảng rỗng
      }
    }

    //  Tìm tất cả sản phẩm thỏa điều kiện productFilter
    const products = await Product.find(productFilter)
      .populate('category_id'); // Lấy thêm thông tin chi tiết về danh mục

    //  Duyệt qua từng sản phẩm để tiếp tục lọc theo variant
    const result = await Promise.all(
      products.map(async (product) => {
        const variantFilter = { product_id: product._id }; // Lọc variant theo id sản phẩm

        //  Nếu có lọc theo dung lượng lưu trữ (size), tìm size tương ứng và gán vào variantFilter
        if (size) {
          const foundSize = await Size.findOne({ storage: { $regex: size, $options: 'i' } });
          if (foundSize) {
            variantFilter.size_id = foundSize._id;
          } else {
            return null; // Không tìm thấy size tương ứng → bỏ sản phẩm này
          }
        }

        //  Nếu có lọc theo RAM, tìm RAM tương ứng và gán vào variantFilter
        if (ram) {
          const foundRam = await Ram.findOne({ ram_name: { $regex: ram, $options: 'i' } }); // ram_value là tên trường RAM
          if (foundRam) {
            variantFilter.ram_id = foundRam._id;
          } else {
            return null; // Không tìm thấy RAM phù hợp → bỏ sản phẩm này
          }
        }

        //  Nếu có lọc theo khoảng giá
        if (minPrice || maxPrice) {
          variantFilter.price = {}; // Khởi tạo object lọc giá
          if (minPrice) variantFilter.price.$gte = parseFloat(minPrice); // Giá lớn hơn hoặc bằng minPrice
          if (maxPrice) variantFilter.price.$lte = parseFloat(maxPrice); // Giá nhỏ hơn hoặc bằng maxPrice
        }

        //  Tìm các variant theo các điều kiện đã lọc ở trên
        const variants = await Variant.find(variantFilter)
          .populate('color_id')   // Lấy chi tiết màu sắc
          .populate('size_id')    // Lấy chi tiết dung lượng (size)
          .populate('ram_id');    // Lấy chi tiết RAM

        //  Nếu không có variant phù hợp thì bỏ qua sản phẩm này
        if (variants.length === 0) return null;

        //  Lấy tất cả ảnh sản phẩm từ bảng ProductImage theo id sản phẩm
        const images = await ProductImage.find({ product_id: product._id });

        //  Trả về kết quả gồm sản phẩm, các phiên bản (variants) và ảnh
        return {
          ...product.toObject(),
          variants,
          images
        };
      })
    );

    //  Lọc bỏ những sản phẩm null (không có variant phù hợp) và trả về client
    res.json(result.filter(p => p !== null));
  } catch (err) {
    //  Bắt lỗi và trả về lỗi 500 (Internal Server Error)
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
exports.update = async (req, res) => {
  try {
    // Tìm và cập nhật sản phẩm theo ID với dữ liệu mới, trả về bản mới nhất
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" }); // Nếu không tồn tại
    res.json(updated); // Trả về sản phẩm đã cập nhật
  } catch (err) {
    res.status(400).json({ error: err.message }); // Trả về lỗi nếu cập nhật không thành công
  }
};

//  Xoá sản phẩm
exports.delete = async (req, res) => {
  try {
    // Xoá sản phẩm theo ID
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Không tìm thấy sản phẩm" }); // Nếu không tồn tại
    res.json({ message: "Đã xoá sản phẩm" }); // Trả về thông báo xoá thành công
  } catch (err) {
    res.status(500).json({ error: err.message }); // Trả về lỗi nếu có sự cố
  }
};
