const dotenv = require('dotenv');
const app = require('./app');
const { connectDB } = require('./config/db');
const syncManager = require('./sync/syncManager');

dotenv.config();

const PORT = process.env.PORT || 5000;
const User = require('./models/User');


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    
  });
});
