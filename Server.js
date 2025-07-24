const dotenv = require('dotenv');
const app = require('./app');
const { connectDB } = require('./config/db');

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

