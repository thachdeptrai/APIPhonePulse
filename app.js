const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.route');
const cartRoutes = require('./routes/cart.routes');
const favRoutes = require('./routes/favourite.routes');


const app = express();

app.use(cors());
app.use(express.json());

// Route cho users
app.use('/api/users', userRoutes);
// Route cho cart
app.use('/api/cart', cartRoutes);
// Route cho favourite
app.use('/api/favourite', favRoutes);

module.exports = app;
