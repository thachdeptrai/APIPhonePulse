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
            return res.status(400).json({ message: 'ID biến thể không hợp lệ.' });
        }

        req.body.modified_date = new Date();

        const updated = await Variant.findByIdAndUpdate(
            variantId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updated) {
            console.warn(`[VariantController][update] WARN: Không tìm thấy biến thể với ID ${variantId} để cập nhật.`);
            return res.status(404).json({ message: 'Không tìm thấy biến thể để cập nhật.' });
        }

        console.log(`[VariantController][update] INFO: Biến thể đã được cập nhật thành công: ${updated._id}`);
        res.json(updated);
    } catch (error) {
        console.error(`[VariantController][update] ERROR: Lỗi khi cập nhật biến thể với ID ${req.params.variantId}. Chi tiết: ${error.message}`, error);
        if (error.name === 'ValidationError') {
            const errors = {};
            for (const field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            console.error(`[VariantController][update] ERROR: Lỗi Validation:`, errors);
            return res.status(400).json({
                message: 'Dữ liệu cập nhật biến thể không hợp lệ.',
                errors: errors,
                stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
            });
        }
        res.status(400).json({
            message: 'Lỗi khi cập nhật biến thể.',
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
