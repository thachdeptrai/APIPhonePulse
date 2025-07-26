const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.route');
const adminRoutes = require('./routes/admin.routes');
const categoryRoutes = require('./routes/category.route');
const productRoutes = require('./routes/product.route');
const variantRoutes = require('./routes/variant.route');
const productImageRoutes = require('./routes/productimage.route');
const colorRoutes = require('./routes/color.route');
const sizeRoutes = require('./routes/size.route');
const cartRoutes = require('./routes/cart.routes');
const favRoutes = require('./routes/favourite.routes');
const reviewRoutes = require('./routes/review.routes');
const voucherRoutes = require('./routes/voucher.routes');
const orderRoutes = require('./routes/order.routes'); 
const authRoutes = require('./routes/auth.routes');
const ramRoutes = require('./routes/ram.routes');

const app = express();

app.use(cors());
app.use(express.json());

//oder 
app.use('/api/orders', orderRoutes);

app.use('/api/admin', adminRoutes);
// Route cho users
app.use('/api/users', userRoutes);
// Route cho cart
app.use('/api/cart', cartRoutes);
// Route cho favourite
app.use('/api/favourite', favRoutes);

// Route cho danh mục sản phẩm
app.use('/api/categories', categoryRoutes);

// Route cho sản phẩm
app.use('/api/products', productRoutes);

// Route cho biến thể sản phẩm
app.use('/api/products', variantRoutes);

app.use('/uploads', express.static('uploads')); // Nếu bạn dùng upload ảnh

app.use('/api/products', productImageRoutes);

app.use('/api/colors', colorRoutes);

app.use('/api/sizes', sizeRoutes);

app.use('/api/reviews', reviewRoutes);

app.use('/api/vouchers', voucherRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/ram', ramRoutes);
module.exports = app;
