const Voucher = require('../models/Voucher');
const VoucherUsage = require('../models/VoucherUsage');

class VoucherController {
    /**
     * @route   POST /api/vouchers/apply
     * @desc    Kiểm tra và áp dụng mã giảm giá
     * @access  Private
     */
    static async applyVoucher(req, res) {
        const { code, orderTotal } = req.body;
        const userId = req.user._id;

        try {
            const voucher = await Voucher.findOne({ code });
            if (!voucher) {
                return res.status(404).json({
                    success: false,
                    message: 'Mã giảm giá không tồn tại',
                });
            }

            const now = new Date();
            if (now < voucher.start_date || now > voucher.end_date) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã giảm giá đã hết hạn',
                });
            }

            if (voucher.quantity <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Mã giảm giá đã được sử dụng hết',
                });
            }

            const existed = await VoucherUsage.findOne({ userId, voucherId: voucher._id });
            if (existed) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã sử dụng mã này rồi',
                });
            }

            if (orderTotal < voucher.min_order_value) {
                return res.status(400).json({
                    success: false,
                    message: 'Không đạt giá trị tối thiểu để áp dụng mã',
                });
            }

            let discount = 0;
            if (voucher.discount_type === 'percent') {
                discount = (orderTotal * voucher.discount_value) / 100;
                if (voucher.max_discount && discount > voucher.max_discount) {
                    discount = voucher.max_discount;
                }
            } else {
                discount = voucher.discount_value;
            }

            const usage = new VoucherUsage({
                voucherId: voucher._id,
                userId,
                used_at: now,
            });
            await usage.save();

            voucher.quantity -= 1;
            await voucher.save();

            res.status(200).json({
                success: true,
                message: 'Áp dụng mã giảm giá thành công',
                data: { discount },
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   GET /api/admin/vouchers
     * @desc    Lấy danh sách tất cả mã giảm giá
     * @access  Private/Admin
     */
    static async getAll(req, res) {
        try {
            const vouchers = await Voucher.find();
            res.status(200).json({
                success: true,
                message: 'Lấy danh sách mã giảm giá thành công',
                data: vouchers,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   POST /api/admin/vouchers
     * @desc    Tạo mã giảm giá mới
     * @access  Private/Admin
     */
    static async create(req, res) {
        try {
            const voucher = await Voucher.create(req.body);
            res.status(201).json({
                success: true,
                message: 'Tạo mã giảm giá thành công',
                data: voucher,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   PUT /api/admin/vouchers/:id
     * @desc    Cập nhật thông tin mã giảm giá
     * @access  Private/Admin
     */
    static async update(req, res) {
        try {
            const voucher = await Voucher.findByIdAndUpdate(req.params._id, req.body, { new: true });
            if (!voucher) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy mã giảm giá',
                });
            }
            res.status(200).json({
                success: true,
                message: 'Cập nhật mã giảm giá thành công',
                data: voucher,
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
        }
    }

    /**
     * @route   DELETE /api/admin/vouchers/:id
     * @desc    Xóa mã giảm giá
     * @access  Private/Admin
     */
    static async remove(req, res) {
        try {
            const voucher = await Voucher.findByIdAndDelete(req.params._id);
            if (!voucher) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy mã giảm giá',
                });
            }
            res.status(200).json({
                success: true,
                message: 'Xóa mã giảm giá thành công',
                data: null,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message,
            });
        }
    }
}

module.exports = VoucherController;