const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.route');
const categoryRoutes = require('./routes/category.route');
const productRoutes = require('./routes/product.route');
const variantRoutes = require('./routes/variant.route');
const productImageRoutes = require('./routes/productimage.route');
const colorRoutes = require('./routes/color.route');
const sizeRoutes = require('./routes/size.route');

const app = express();

app.use(cors());
app.use(express.json());

// Route cho users
app.use('/api/users', userRoutes);

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


module.exports = app;
