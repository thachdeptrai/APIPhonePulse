const dotenv = require('dotenv');
const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { initSocket } = require('./socket');

dotenv.config();

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = http.createServer(app);

  // Khởi tạo socket
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
