const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend/public')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// Database config
const dbConfig = {
  host: 'mysql-ibrmm-ibrammanggaraa-e1fc.h.aivencloud.com',
  user: 'avnadmin',
  password: 'AVNS__y_04E50xeLsL6PmMBy',
  database: 'chatdb',
  port: 15633,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

// Init DB
async function initializeDatabase() {
  try {
    const conn = await pool.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        reply_to TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    conn.release();
    console.log('Database initialized');
  } catch (err) {
    console.error('Database error:', err);
  }
}

initializeDatabase();

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/public/index.html'));
});

// Socket
io.on('connection', async (socket) => {
  console.log('User connected');

  socket.emit('chatMessage', {
    message: 'Selamat datang di ruang chat!',
    replyTo: null,
    createdAt: new Date().toISOString()
  });

  try {
    const [messages] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 50');
    messages.reverse().forEach(msg => {
      socket.emit('chatMessage', {
        message: `${msg.name}: ${msg.message}`,
        replyTo: msg.reply_to || null,
        createdAt: msg.created_at
      });
    });
  } catch (error) {
    console.error('Fetch error:', error);
  }

  socket.on('chatMessage', async (data) => {
    try {
      if (data?.message) {
        const separatorIndex = data.message.indexOf(':');
        if (separatorIndex > 0) {
          const name = data.message.slice(0, separatorIndex).trim();
          const message = data.message.slice(separatorIndex + 1).trim();

          await pool.query(
            'INSERT INTO messages (name, message, reply_to) VALUES (?, ?, ?)',
            [name, message, data.replyTo || null]
          );

          io.emit('chatMessage', {
            message: data.message,
            replyTo: data.replyTo || null,
            createdAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Insert error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
