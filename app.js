const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.route');
const categoryRoutes = require('./routes/category.route');
const productRoutes = require('./routes/product.route');
const variantRoutes = require('./routes/variant.route');
const imageRoutes = require('./routes/image.route');
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
app.use('/api/products/:id/variants', variantRoutes);

// Route upload/xóa hình ảnh sản phẩm
app.use('/api/products/:id/images', imageRoutes);

app.use('/uploads', express.static('uploads'));

module.exports = app;
