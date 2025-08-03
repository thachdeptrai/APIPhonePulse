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
const paymentRoutes = require('./routes/payment.route');
const chatRoutes = require('./routes/chat.route');
const chatAdminRoutes = require('./routes/ChatAdmin.route'); 

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

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
app.use('/api/chat', chatRoutes);
app.use('/api/chat', chatAdminRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/payments', paymentRoutes);

// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
module.exports = app;
