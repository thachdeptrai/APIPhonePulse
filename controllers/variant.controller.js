const Variant = require('../models/Variant');
const mongoose = require('mongoose');

// Lấy tất cả biến thể theo product ID
exports.getAll = async (req, res) => {
    try {
        const productId = req.params.id;
        // Log này đã được bỏ: console.log(`[VariantController][getAll] INFO: Bắt đầu tìm nạp biến thể cho product_id: ${productId}`);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.warn(`[VariantController][getAll] WARN: Product ID không hợp lệ: ${productId}`);
            return res.status(400).json({ message: 'ID sản phẩm không hợp lệ.' });
        }

        const variants = await Variant.find({ product_id: productId })
            .populate('color_id')
            .populate('size_id');

        // Log này đã được bỏ: console.log(`[VariantController][getAll] INFO: Tìm thấy ${variants.length} biến thể cho product_id: ${productId}`);
        res.json(variants);
    } catch (error) {
        console.error(`[VariantController][getAll] ERROR: Lỗi khi tìm nạp biến thể cho product_id ${req.params.id}. Chi tiết: ${error.message}`, error);
        res.status(500).json({
            message: 'Lỗi server khi lấy danh sách biến thể.',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};

// Lấy một biến thể theo ID
exports.getById = async (req, res) => {
    try {
        const variantId = req.params.variantId;
        console.log(`[VariantController][getById] INFO: Bắt đầu tìm nạp biến thể với ID: ${variantId}`);

        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn(`[VariantController][getById] WARN: Variant ID không hợp lệ: ${variantId}`);
            return res.status(400).json({ message: 'ID biến thể không hợp lệ.' });
        }

        const variant = await Variant.findById(variantId)
            .populate('color_id')
            .populate('size_id');

        if (!variant) {
            console.warn(`[VariantController][getById] WARN: Không tìm thấy biến thể với ID ${variantId}.`);
            return res.status(404).json({ message: 'Không tìm thấy biến thể.' });
        }

        console.log(`[VariantController][getById] INFO: Tìm thấy biến thể: ${variant._id}`);
        res.json(variant);
    } catch (error) {
        console.error(`[VariantController][getById] ERROR: Lỗi khi tìm nạp biến thể với ID ${req.params.variantId}. Chi tiết: ${error.message}`, error);
        res.status(500).json({
            message: 'Lỗi server khi lấy biến thể.',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};

// Tạo mới biến thể
exports.add = async (req, res) => {
    try {
        const productId = req.params.id;
        console.log(`[VariantController][add] INFO: Bắt đầu tạo biến thể mới cho product_id: ${productId}. Dữ liệu nhận được:`, req.body);

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            console.warn(`[VariantController][add] WARN: Product ID không hợp lệ: ${productId}`);
            return res.status(400).json({ message: 'ID sản phẩm không hợp lệ.' });
        }

        const variant = new Variant({ ...req.body, product_id: productId });
        const saved = await variant.save();

        console.log(`[VariantController][add] INFO: Biến thể đã được tạo thành công với ID: ${saved._id}`);
        res.status(201).json(saved);
    } catch (error) {
        console.error(`[VariantController][add] ERROR: Lỗi khi tạo biến thể cho product_id ${req.params.id}. Chi tiết: ${error.message}`, error);
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            console.error(`[VariantController][add] ERROR: Lỗi Validation:`, errors);
            return res.status(400).json({
                message: 'Dữ liệu biến thể không hợp lệ.',
                errors: errors,
                stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
            });
        }
        res.status(400).json({
            message: 'Lỗi khi tạo biến thể.',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};

// Cập nhật biến thể
exports.update = async (req, res) => {
    try {
        const variantId = req.params.variantId;
        console.log(`[VariantController][update] INFO: Bắt đầu cập nhật biến thể với ID: ${variantId}. Dữ liệu nhận được:`, req.body);

        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn(`[VariantController][update] WARN: Variant ID không hợp lệ: ${variantId}`);
            return res.status(400).json({ success: false, message: 'ID biến thể không hợp lệ.' }); // Thêm success: false
        }

        // Lấy các trường cụ thể được phép cập nhật từ req.body
        // Ví dụ: chỉ cho phép cập nhật quantity và description
        const { quantity, description, /* thêm các trường khác nếu cần */ } = req.body;
        const updateFields = {};

        // Chỉ thêm vào updateFields những trường bạn muốn cập nhật
        if (typeof quantity === 'number' && quantity >= 0) {
            updateFields.quantity = quantity;
        } else if (req.body.hasOwnProperty('quantity')) {
            // Nếu quantity được gửi nhưng không hợp lệ, bạn có thể trả lỗi
            return res.status(400).json({ success: false, message: 'Số lượng tồn kho không hợp lệ. Phải là số và không âm.' });
        }

        if (typeof description === 'string') { // Ví dụ: cho phép cập nhật mô tả
            updateFields.description = description;
        }

        // --- QUAN TRỌNG: KHÔNG BAO GỒM 'price' TRONG updateFields NẾU BẠN KHÔNG MUỐN NÓ BỊ THAY ĐỔI ---
        // Nếu req.body có 'price', bạn có thể log cảnh báo hoặc bỏ qua nó
        if (req.body.hasOwnProperty('price')) {
            console.warn(`[VariantController][update] WARN: Cố gắng cập nhật trường 'price'. Trường này không được phép cập nhật qua API này.`);
            // Hoặc trả về lỗi nếu bạn muốn ngăn chặn hoàn toàn:
            // return res.status(403).json({ success: false, message: 'Không được phép cập nhật giá sản phẩm qua API này.' });
        }

        if (Object.keys(updateFields).length === 0) {
            console.warn(`[VariantController][update] WARN: Không có trường hợp lệ nào để cập nhật cho biến thể ${variantId}.`);
            return res.status(400).json({ success: false, message: 'Không có dữ liệu hợp lệ nào để cập nhật.' });
        }

        updateFields.modified_date = new Date(); // Cập nhật ngày sửa đổi

        const updated = await Variant.findByIdAndUpdate(
            variantId,
            { $set: updateFields }, // Sử dụng $set để chỉ cập nhật các trường trong updateFields
            { new: true, runValidators: true }
        );

        if (!updated) {
            console.warn(`[VariantController][update] WARN: Không tìm thấy biến thể với ID ${variantId} để cập nhật.`);
            return res.status(404).json({ success: false, message: 'Không tìm thấy biến thể để cập nhật.' }); // Thêm success: false
        }

        console.log(`[VariantController][update] INFO: Biến thể đã được cập nhật thành công: ${updated._id}`);
        res.json({ success: true, data: updated }); // Trả về dạng { success: true, data: {} }
    } catch (error) {
        // ... (phần xử lý lỗi giữ nguyên, có thể thêm success: false cho các phản hồi lỗi)
        console.error(`[VariantController][update] ERROR: Lỗi khi cập nhật biến thể với ID ${req.params.variantId}. Chi tiết: ${error.message}`, error);
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            console.error(`[VariantController][update] ERROR: Lỗi Validation:`, errors);
            return res.status(400).json({
                success: false, // Thêm success: false
                message: 'Dữ liệu cập nhật biến thể không hợp lệ.',
                errors: errors,
                stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
            });
        }
        res.status(500).json({ // Đổi 400 thành 500 cho lỗi server không xác định
            success: false, // Thêm success: false
            message: 'Lỗi server khi cập nhật biến thể.', // Sửa thông báo lỗi
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};

// Xoá biến thể
exports.delete = async (req, res) => {
    try {
        const variantId = req.params.variantId;
        console.log(`[VariantController][delete] INFO: Bắt đầu xoá biến thể với ID: ${variantId}`);

        if (!mongoose.Types.ObjectId.isValid(variantId)) {
            console.warn(`[VariantController][delete] WARN: Variant ID không hợp lệ: ${variantId}`);
            return res.status(400).json({ message: 'ID biến thể không hợp lệ.' });
        }

        const deleted = await Variant.findByIdAndDelete(variantId);

        if (!deleted) {S
            console.warn(`[VariantController][delete] WARN: Không tìm thấy biến thể với ID ${variantId} để xoá.`);
            return res.status(404).json({ message: 'Không tìm thấy biến thể để xoá.' });
        }

        console.log(`[VariantController][delete] INFO: Biến thể đã được xoá thành công: ${deleted._id}`);
        res.json({ message: 'Đã xoá thành công.' });
    } catch (error) {
        console.error(`[VariantController][delete] ERROR: Lỗi khi xoá biến thể với ID ${req.params.variantId}. Chi tiết: ${error.message}`, error);
        res.status(500).json({
            message: 'Lỗi server khi xoá biến thể.',
            error: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
};
