const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.route');

const app = express();

app.use(cors());
app.use(express.json());

// Route cho users
app.use('/api/users', userRoutes);

module.exports = app;
