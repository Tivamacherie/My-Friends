const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Simple cookie parser (no external dependency)
app.use((req, res, next) => {
  req.cookies = {};
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      req.cookies[name] = decodeURIComponent(value);
    });
  }
  next();
});

// Session storage (in-memory for simplicity)
const sessions = new Map();
const otpStore = new Map(); // Store OTPs temporarily

// Data file paths
const USERS_FILE = path.join(__dirname, 'users.json');
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Initialize data files if they don't exist
function initializeDataFiles() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2));
  }
  if (!fs.existsSync(TASKS_FILE)) {
    fs.writeFileSync(TASKS_FILE, JSON.stringify([], null, 2));
  }
}

// Helper functions to read/write data
function readUsers() {
  const data = fs.readFileSync(USERS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readTasks() {
  const data = fs.readFileSync(TASKS_FILE, 'utf8');
  return JSON.parse(data);
}

function writeTasks(tasks) {
  fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// Helper functions for session
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

function setCookie(res, name, value, maxAge = 7 * 24 * 60 * 60 * 1000) {
  res.setHeader('Set-Cookie', `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge / 1000}; Path=/; HttpOnly`);
}

function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/`);
}

function getCurrentUser(req) {
  const sessionId = req.cookies.sessionId;
  if (sessionId && sessions.has(sessionId)) {
    const userId = sessions.get(sessionId);
    const users = readUsers();
    return users.find(u => u.id === userId);
  }
  return null;
}

function requireAuth(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.redirect('/');
  }
  req.currentUser = user;
  next();
}

// CSS Styles
const styles = `
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container { 
      max-width: 900px; 
      margin: 0 auto; 
      background: white; 
      padding: 30px; 
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    h1 { 
      color: #667eea; 
      margin-bottom: 10px;
      font-size: 2em;
    }
    h2 { 
      color: #555; 
      margin: 20px 0 15px;
      font-size: 1.5em;
    }
    .header {
      border-bottom: 3px solid #667eea;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .user-info {
      background: #f0f4ff;
      padding: 10px 15px;
      border-radius: 8px;
      margin: 10px 0;
      display: inline-block;
    }
    .logout-btn {
      float: right;
      background: #e74c3c;
      color: white;
      padding: 8px 15px;
      text-decoration: none;
      border-radius: 5px;
      font-size: 0.9em;
    }
    .logout-btn:hover { background: #c0392b; }
    .nav-menu {
      background: #667eea;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .nav-menu a {
      color: white;
      text-decoration: none;
      padding: 10px 15px;
      margin: 0 5px;
      display: inline-block;
      background: rgba(255,255,255,0.1);
      border-radius: 5px;
      transition: 0.3s;
    }
    .nav-menu a:hover {
      background: rgba(255,255,255,0.2);
    }
    .btn { 
      background: #667eea; 
      color: white; 
      padding: 12px 25px; 
      border: none; 
      border-radius: 5px; 
      cursor: pointer; 
      font-size: 1em;
      margin: 5px;
      text-decoration: none;
      display: inline-block;
    }
    .btn:hover { background: #5568d3; }
    .btn-secondary { 
      background: #95a5a6; 
    }
    .btn-secondary:hover { background: #7f8c8d; }
    .btn-success { 
      background: #27ae60; 
    }
    .btn-success:hover { background: #229954; }
    .btn-danger { 
      background: #e74c3c; 
    }
    .btn-danger:hover { background: #c0392b; }
    input, textarea, select { 
      width: 100%; 
      padding: 12px; 
      margin: 8px 0; 
      border: 2px solid #ddd; 
      border-radius: 5px; 
      font-size: 1em;
    }
    input:focus, textarea:focus, select:focus {
      border-color: #667eea;
      outline: none;
    }
    .form-group { 
      margin-bottom: 20px; 
    }
    label { 
      display: block; 
      margin-bottom: 5px; 
      font-weight: bold; 
      color: #333;
    }
    .task-card { 
      border: 2px solid #ecf0f1; 
      padding: 20px; 
      margin: 15px 0; 
      border-radius: 10px;
      background: #fafafa;
      transition: 0.3s;
    }
    .task-card:hover {
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .task-title { 
      font-size: 1.3em; 
      color: #2c3e50; 
      margin-bottom: 10px;
      font-weight: bold;
    }
    .task-detail { 
      color: #555; 
      margin: 5px 0;
      line-height: 1.6;
    }
    .task-money { 
      color: #27ae60; 
      font-weight: bold; 
      font-size: 1.2em;
      margin: 10px 0;
    }
    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 15px;
      font-size: 0.9em;
      font-weight: bold;
      margin: 5px 0;
    }
    .status-open { background: #3498db; color: white; }
    .status-in-progress { background: #f39c12; color: white; }
    .status-completed { background: #27ae60; color: white; }
    .alert {
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .alert-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .alert-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    .alert-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeeba; }
    .role-card {
      display: inline-block;
      width: 250px;
      padding: 30px;
      margin: 20px;
      border: 3px solid #667eea;
      border-radius: 15px;
      text-align: center;
      background: white;
      cursor: pointer;
      transition: 0.3s;
    }
    .role-card:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }
    .pdpa-notice {
      background: #fff3cd;
      border: 2px solid #ffc107;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 0.9em;
    }
    .pdpa-notice strong {
      color: #856404;
    }
  </style>
`;

// Navigation menu
function getNavMenu(role) {
  if (role === 'requester') {
    return `
      <div class="nav-menu">
        <a href="/dashboard">🏠 หน้าหลัก</a>
        <a href="/create-task">➕ สร้างคำขอความช่วยเหลือ</a>
        <a href="/my-tasks">📋 คำขอของฉัน</a>
        <a href="/history">📜 ประวัติ</a>
      </div>
    `;
  } else if (role === 'helper') {
    return `
      <div class="nav-menu">
        <a href="/dashboard">🏠 หน้าหลัก</a>
        <a href="/available-tasks">🔍 งานที่รับได้</a>
        <a href="/my-accepted-tasks">✅ งานที่รับแล้ว</a>
        <a href="/history">📜 ประวัติ</a>
      </div>
    `;
  }
  return '';
}

// Routes

// 1. Login/Home page
app.get('/', (req, res) => {
  const currentUser = getCurrentUser(req);
  if (currentUser) {
    return res.redirect('/dashboard');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>My-Friends Platform</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤝 My-Friends Platform</h1>
          <p style="color: #666; font-size: 1.1em;">แพลตฟอร์มช่วยเหลือซึ่งกันและกัน</p>
        </div>

        <div class="alert alert-info">
          <strong>ยินดีต้อนรับ!</strong> แพลตฟอร์มนี้เชื่อมโยงผู้ต้องการความช่วยเหลือกับผู้ช่วยเหลือ
        </div>

        <h2>เข้าสู่ระบบ</h2>
        
        <form action="/login" method="POST" style="max-width: 400px; margin: 20px auto;">
          <div class="form-group">
            <label>เบอร์โทรศัพท์</label>
            <input type="tel" name="phone" required placeholder="เช่น 081-234-5678" pattern="[0-9-]+">
          </div>
          <button type="submit" class="btn" style="width: 100%;">🔐 เข้าสู่ระบบด้วย OTP</button>
        </form>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #666;">หรือ</p>
        </div>

        <h2>สมัครสมาชิกใหม่</h2>
        
        <div style="text-align: center; margin: 40px 0;">
          <form action="/select-role" method="POST" style="display: inline;">
            <input type="hidden" name="role" value="requester">
            <button type="submit" class="role-card">
              <div style="font-size: 3em; margin-bottom: 15px;">🙋‍♂️</div>
              <h3 style="color: #667eea; margin-bottom: 10px;">ผู้ขอความช่วยเหลือ</h3>
              <p style="color: #666;">สร้างคำขอให้คนอื่นช่วยเหลือ</p>
            </button>
          </form>

          <form action="/select-role" method="POST" style="display: inline;">
            <input type="hidden" name="role" value="helper">
            <button type="submit" class="role-card">
              <div style="font-size: 3em; margin-bottom: 15px;">🦸‍♀️</div>
              <h3 style="color: #667eea; margin-bottom: 10px;">ผู้ช่วยเหลือ</h3>
              <p style="color: #666;">รับงานช่วยเหลือและรับค่าตอบแทน</p>
            </button>
          </form>
        </div>

        <div class="pdpa-notice">
          <strong>📌 ประกาศความเป็นส่วนตัว (PDPA):</strong><br>
          แพลตฟอร์มนี้จะเก็บข้อมูลส่วนบุคคลของคุณ ได้แก่ ชื่อ-นามสกุล, เบอร์โทรศัพท์, และที่อยู่/สถานที่ 
          เพื่อใช้ในการเชื่อมโยงและอำนวยความสะดวกในการรับ-ส่งงาน ข้อมูลจะถูกเก็บไว้ในไฟล์ JSON 
          และจะไม่ถูกเปิดเผยแก่บุคคลภายนอกโดยไม่ได้รับอนุญาต
        </div>
      </div>
    </body>
    </html>
  `);
});

// 1.5. Login with phone number (send OTP)
app.post('/login', (req, res) => {
  const { phone } = req.body;
  
  const users = readUsers();
  const user = users.find(u => u.phone === phone);
  
  if (!user) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ไม่พบผู้ใช้</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ ไม่พบเบอร์โทรศัพท์นี้</h1>
          </div>
          <div class="alert alert-warning">
            <strong>เบอร์ ${phone} ยังไม่ได้สมัครสมาชิก</strong><br>
            กรุณาสมัครสมาชิกใหม่ก่อนเข้าสู่ระบบ
          </div>
          <a href="/" class="btn">← กลับไปหน้าแรก</a>
        </div>
      </body>
      </html>
    `);
  }
  
  // Generate OTP
  const otp = generateOTP();
  otpStore.set(phone, { otp, userId: user.id, expires: Date.now() + 5 * 60 * 1000 }); // 5 min expiry
  
  // Simulate SMS sending (in real app, use SMS API)
  console.log('\n' + '='.repeat(60));
  console.log('📱 SMS OTP Simulation');
  console.log('='.repeat(60));
  console.log(`เบอร์: ${phone}`);
  console.log(`รหัส OTP: ${otp}`);
  console.log(`หมดอายุใน: 5 นาที`);
  console.log('='.repeat(60) + '\n');
  
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ยืนยัน OTP</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📱 ยืนยันรหัส OTP</h1>
        </div>

        <div class="alert alert-success">
          <strong>✅ ส่ง OTP สำเร็จ!</strong><br>
          เราได้ส่งรหัส OTP 6 หลักไปยังเบอร์ <strong>${phone}</strong><br>
          <small style="color: #e74c3c;">⚠️ กรุณาตรวจสอบ SMS หรือดูรหัส OTP ใน server console</small>
        </div>

        <div class="pdpa-notice" style="background: #e3f2fd; border-color: #2196f3;">
          <strong>🔒 ความปลอดภัย:</strong> รหัส OTP ถูกส่งไปยังเบอร์โทรศัพท์ของคุณแล้ว<br>
          ในโหมด Production จริง: รหัสจะส่งผ่าน SMS เท่านั้น (ไม่แสดงบนหน้าเว็บ)<br>
          <strong>⏱️ รหัสหมดอายุใน 5 นาที</strong>
        </div>

        <form action="/verify-otp" method="POST" style="max-width: 400px; margin: 20px auto;">
          <input type="hidden" name="phone" value="${phone}">
          
          <div class="form-group">
            <label>กรอกรหัส OTP (6 หลัก)</label>
            <input type="text" name="otp" required placeholder="123456" pattern="[0-9]{6}" maxlength="6" 
                   style="font-size: 1.5em; text-align: center; letter-spacing: 10px;">
          </div>

          <button type="submit" class="btn" style="width: 100%;">✓ ยืนยัน</button>
        </form>

        <div style="text-align: center; margin: 20px 0;">
          <form action="/resend-otp" method="POST" style="display: inline;">
            <input type="hidden" name="phone" value="${phone}">
            <button type="submit" class="btn btn-secondary">🔄 ส่ง OTP ใหม่</button>
          </form>
          <a href="/" class="btn btn-secondary">← กลับ</a>
        </div>

        <div class="pdpa-notice">
          <strong>⏱️ หมายเหตุ:</strong> รหัส OTP จะหมดอายุภายใน 5 นาที
        </div>
      </div>
    </body>
    </html>
  `);
});

// 1.6. Verify OTP
app.post('/verify-otp', (req, res) => {
  const { phone, otp } = req.body;
  
  const otpData = otpStore.get(phone);
  
  if (!otpData) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP หมดอายุ</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ OTP หมดอายุ</h1>
          </div>
          <div class="alert alert-warning">
            รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่
          </div>
          <a href="/" class="btn">← กลับไปหน้าแรก</a>
        </div>
      </body>
      </html>
    `);
  }
  
  if (Date.now() > otpData.expires) {
    otpStore.delete(phone);
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP หมดอายุ</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ OTP หมดอายุ</h1>
          </div>
          <div class="alert alert-warning">
            รหัส OTP หมดอายุแล้ว (เกิน 5 นาที) กรุณาขอรหัสใหม่
          </div>
          <a href="/" class="btn">← กลับไปหน้าแรก</a>
        </div>
      </body>
      </html>
    `);
  }
  
  if (otpData.otp !== otp) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OTP ไม่ถูกต้อง</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ รหัส OTP ไม่ถูกต้อง</h1>
          </div>
          <div class="alert alert-warning">
            รหัส OTP ที่กรอกไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
          </div>
          <form action="/login" method="POST">
            <input type="hidden" name="phone" value="${phone}">
            <button type="submit" class="btn">← ลองใหม่</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }
  
  // OTP correct - create session
  const sessionId = generateSessionId();
  sessions.set(sessionId, otpData.userId);
  setCookie(res, 'sessionId', sessionId, 7 * 24 * 60 * 60 * 1000); // 7 days
  otpStore.delete(phone);
  
  res.redirect('/dashboard');
});

// 1.7. Resend OTP
app.post('/resend-otp', (req, res) => {
  const { phone } = req.body;
  
  const users = readUsers();
  const user = users.find(u => u.phone === phone);
  
  if (!user) {
    return res.redirect('/');
  }
  
  // Generate new OTP
  const otp = generateOTP();
  otpStore.set(phone, { otp, userId: user.id, expires: Date.now() + 5 * 60 * 1000 });
  
  console.log('\n' + '='.repeat(60));
  console.log('📱 SMS OTP Simulation (Resend)');
  console.log('='.repeat(60));
  console.log(`เบอร์: ${phone}`);
  console.log(`รหัส OTP: ${otp}`);
  console.log(`หมดอายุใน: 5 นาที`);
  console.log('='.repeat(60) + '\n');
  
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ส่ง OTP ใหม่</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📱 ส่งรหัส OTP ใหม่</h1>
        </div>

        <div class="alert alert-success">
          <strong>✅ ส่ง OTP ใหม่สำเร็จ!</strong><br>
          เราได้ส่งรหัส OTP ใหม่ไปยังเบอร์ <strong>${phone}</strong><br>
          <small style="color: #e74c3c;">⚠️ กรุณาตรวจสอบ SMS หรือดูรหัส OTP ใน server console</small>
        </div>

        <div class="pdpa-notice" style="background: #e3f2fd; border-color: #2196f3;">
          <strong>🔒 ความปลอดภัย:</strong> รหัส OTP ถูกส่งใหม่ไปยังเบอร์โทรศัพท์ของคุณแล้ว
        </div>

        <form action="/verify-otp" method="POST" style="max-width: 400px; margin: 20px auto;">
          <input type="hidden" name="phone" value="${phone}">
          
          <div class="form-group">
            <label>กรอกรหัส OTP (6 หลัก)</label>
            <input type="text" name="otp" required placeholder="123456" pattern="[0-9]{6}" maxlength="6" 
                   style="font-size: 1.5em; text-align: center; letter-spacing: 10px;">
          </div>

          <button type="submit" class="btn" style="width: 100%;">✓ ยืนยัน</button>
        </form>

        <div style="text-align: center; margin: 20px 0;">
          <a href="/" class="btn btn-secondary">← กลับ</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// 2. Select role and register (Step 1: Enter phone for OTP)
app.post('/select-role', (req, res) => {
  const role = req.body.role;
  
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ยืนยันเบอร์โทร - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📱 ยืนยันเบอร์โทรศัพท์</h1>
          <a href="/" class="btn btn-secondary" style="float: right;">← กลับ</a>
        </div>

        <div class="alert alert-info">
          คุณเลือกบทบาท: <strong>${role === 'requester' ? '🙋‍♂️ ผู้ขอความช่วยเหลือ' : '🦸‍♀️ ผู้ช่วยเหลือ'}</strong>
        </div>

        <div class="alert" style="background: #fff3cd; color: #856404; border: 2px solid #ffc107;">
          <strong>🔒 ความปลอดภัย:</strong><br>
          เพื่อป้องกันการใช้เบอร์โทรศัพท์โดยไม่ได้รับอนุญาต<br>
          คุณต้องยืนยันเบอร์โทรศัพท์ด้วยรหัส OTP ก่อนสมัครสมาชิก
        </div>

        <form action="/register-verify-phone" method="POST" style="max-width: 500px; margin: 30px auto;">
          <input type="hidden" name="role" value="${role}">
          
          <div class="form-group">
            <label>เบอร์โทรศัพท์ของคุณ *</label>
            <input type="tel" name="phone" required placeholder="เช่น 081-234-5678" pattern="[0-9-]+">
            <small style="color: #666;">⚠️ กรุณากรอกเบอร์ของคุณเท่านั้น - ระบบจะส่ง OTP ไปยืนยัน</small>
          </div>

          <button type="submit" class="btn" style="width: 100%;">📤 ส่งรหัส OTP ไปยังเบอร์นี้</button>
        </form>

        <div class="pdpa-notice">
          <strong>💡 ทำไมต้องยืนยัน OTP?</strong><br>
          • ป้องกันการใช้เบอร์คนอื่นโดยไม่ได้รับอนุญาต<br>
          • ยืนยันว่าคุณเป็นเจ้าของเบอร์โทรศัพท์จริง ๆ<br>
          • เพิ่มความปลอดภัยให้กับบัญชีของคุณ
        </div>
      </div>
    </body>
    </html>
  `);
});

// 2.5. Verify phone for registration (send OTP)
app.post('/register-verify-phone', (req, res) => {
  const { phone, role } = req.body;
  
  const users = readUsers();
  const existingUser = users.find(u => u.phone === phone);
  
  if (existingUser) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>เบอร์ซ้ำ</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ เบอร์โทรศัพท์นี้ถูกใช้แล้ว</h1>
          </div>
          <div class="alert alert-warning">
            <strong>เบอร์ ${phone} มีในระบบแล้ว</strong><br>
            หากนี่คือเบอร์ของคุณ กรุณาใช้ระบบล็อกอินแทน
          </div>
          <a href="/" class="btn">← กลับไปหน้าแรก</a>
          <form action="/login" method="POST" style="display: inline; margin-left: 10px;">
            <input type="hidden" name="phone" value="${phone}">
            <button type="submit" class="btn btn-success">🔐 ล็อกอินด้วยเบอร์นี้</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }
  
  // Generate OTP for registration
  const otp = generateOTP();
  otpStore.set(phone, { otp, role, expires: Date.now() + 5 * 60 * 1000 });
  
  // Log OTP to console
  console.log('\n' + '='.repeat(60));
  console.log('📱 SMS OTP Simulation (Registration)');
  console.log('='.repeat(60));
  console.log(`เบอร์: ${phone}`);
  console.log(`รหัส OTP: ${otp}`);
  console.log(`บทบาท: ${role}`);
  console.log(`หมดอายุใน: 5 นาที`);
  console.log('='.repeat(60) + '\n');
  
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ยืนยัน OTP - สมัครสมาชิก</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📱 ยืนยันรหัส OTP</h1>
        </div>

        <div class="alert alert-success">
          <strong>✅ ส่ง OTP สำเร็จ!</strong><br>
          เราได้ส่งรหัส OTP 6 หลักไปยังเบอร์ <strong>${phone}</strong><br>
          <small style="color: #e74c3c;">⚠️ กรุณาตรวจสอบ SMS หรือดูรหัส OTP ใน server console</small>
        </div>

        <div class="pdpa-notice" style="background: #e3f2fd; border-color: #2196f3;">
          <strong>🔒 ความปลอดภัย:</strong> รหัส OTP ถูกส่งไปยังเบอร์โทรศัพท์ของคุณแล้ว<br>
          ใน Production จริง: รหัสจะส่งผ่าน SMS เท่านั้น (ไม่แสดงบนหน้าเว็บ)<br>
          <strong>⏱️ รหัสหมดอายุใน 5 นาที</strong>
        </div>

        <form action="/register-verify-otp" method="POST" style="max-width: 400px; margin: 20px auto;">
          <input type="hidden" name="phone" value="${phone}">
          <input type="hidden" name="role" value="${role}">
          
          <div class="form-group">
            <label>กรอกรหัส OTP (6 หลัก)</label>
            <input type="text" name="otp" required placeholder="123456" pattern="[0-9]{6}" maxlength="6" 
                   style="font-size: 1.5em; text-align: center; letter-spacing: 10px;">
          </div>

          <button type="submit" class="btn" style="width: 100%;">✓ ยืนยันและดำเนินการต่อ</button>
        </form>

        <div style="text-align: center; margin: 20px 0;">
          <form action="/register-resend-otp" method="POST" style="display: inline;">
            <input type="hidden" name="phone" value="${phone}">
            <input type="hidden" name="role" value="${role}">
            <button type="submit" class="btn btn-secondary">🔄 ส่ง OTP ใหม่</button>
          </form>
          <a href="/" class="btn btn-secondary">← กลับ</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

// 2.6. Resend OTP for registration
app.post('/register-resend-otp', (req, res) => {
  const { phone, role } = req.body;
  
  const otp = generateOTP();
  otpStore.set(phone, { otp, role, expires: Date.now() + 5 * 60 * 1000 });
  
  console.log('\n' + '='.repeat(60));
  console.log('📱 SMS OTP Simulation (Resend - Registration)');
  console.log('='.repeat(60));
  console.log(`เบอร์: ${phone}`);
  console.log(`รหัส OTP: ${otp}`);
  console.log(`หมดอายุใน: 5 นาที`);
  console.log('='.repeat(60) + '\n');
  
  return res.redirect(`/register-verify-phone?phone=${encodeURIComponent(phone)}&role=${role}&resent=1`);
});

// 2.7. Verify OTP for registration
app.post('/register-verify-otp', (req, res) => {
  const { phone, otp, role } = req.body;
  
  const otpData = otpStore.get(phone);
  
  if (!otpData) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>OTP หมดอายุ</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>⚠️ OTP หมดอายุ</h1></div>
          <div class="alert alert-warning">รหัส OTP หมดอายุแล้ว กรุณาขอรหัสใหม่</div>
          <a href="/" class="btn">← กลับหน้าแรก</a>
        </div>
      </body>
      </html>
    `);
  }
  
  if (Date.now() > otpData.expires) {
    otpStore.delete(phone);
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>OTP หมดอายุ</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>⚠️ OTP หมดอายุ</h1></div>
          <div class="alert alert-warning">รหัส OTP หมดอายุแล้ว (เกิน 5 นาที)</div>
          <a href="/" class="btn">← กลับหน้าแรก</a>
        </div>
      </body>
      </html>
    `);
  }
  
  if (otpData.otp !== otp) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <title>OTP ไม่ถูกต้อง</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header"><h1>❌ รหัส OTP ไม่ถูกต้อง</h1></div>
          <div class="alert alert-warning">รหัส OTP ที่กรอกไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</div>
          <form action="/register-verify-phone" method="POST">
            <input type="hidden" name="phone" value="${phone}">
            <input type="hidden" name="role" value="${role}">
            <button type="submit" class="btn">← ลองใหม่</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }
  
  // OTP correct - show registration form
  otpStore.delete(phone);
  
  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>กรอกข้อมูลสมัครสมาชิก - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ ยืนยันเบอร์สำเร็จ!</h1>
        </div>

        <div class="alert alert-success">
          <strong>✅ ยืนยันเบอร์ ${phone} สำเร็จแล้ว!</strong><br>
          กรุณากรอกข้อมูลเพิ่มเติมเพื่อสมัครสมาชิก
        </div>

        <div class="alert alert-info">
          คุณเลือกบทบาท: <strong>${role === 'requester' ? '🙋‍♂️ ผู้ขอความช่วยเหลือ' : '🦸‍♀️ ผู้ช่วยเหลือ'}</strong>
        </div>

        <form action="/register" method="POST">
          <input type="hidden" name="role" value="${role}">
          <input type="hidden" name="phone" value="${phone}">
          <input type="hidden" name="verified" value="true">
          
          <div class="form-group">
            <label>เบอร์โทรศัพท์ (ยืนยันแล้ว) ✓</label>
            <input type="tel" value="${phone}" disabled style="background: #e8f5e9;">
          </div>
          
          <div class="form-group">
            <label>ชื่อ-นามสกุล *</label>
            <input type="text" name="name" required placeholder="เช่น สมชาย ใจดี">
          </div>

          <div class="form-group">
            <label>ที่อยู่/สถานที่ *</label>
            <textarea name="location" rows="3" required placeholder="เช่น หอพัก A ตึก 2 ชั้น 3 ห้อง 305"></textarea>
          </div>

          <div class="pdpa-notice">
            <input type="checkbox" required style="width: auto; margin-right: 10px;">
            ฉันยอมรับ<strong>นโยบายความเป็นส่วนตัว (PDPA)</strong> และยินยอมให้เก็บข้อมูลส่วนบุคคลเพื่อใช้งานในแพลตฟอร์ม
          </div>

          <button type="submit" class="btn" style="width: 100%; font-size: 1.1em;">✓ สมัครสมาชิกและเข้าสู่ระบบ</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 3. Register user
app.post('/register', (req, res) => {
  const { name, phone, location, role, verified } = req.body;
  
  // Security check: must be verified via OTP
  if (verified !== 'true') {
    return res.redirect('/');
  }
  
  const users = readUsers();
  
  // Check if phone already exists (double check)
  const existingUser = users.find(u => u.phone === phone);
  if (existingUser) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>เบอร์ซ้ำ</title>
        ${styles}
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ เบอร์โทรศัพท์นี้ถูกใช้แล้ว</h1>
          </div>
          <div class="alert alert-warning">
            <strong>เบอร์ ${phone} มีในระบบแล้ว</strong><br>
            กรุณาใช้เบอร์อื่น หรือเข้าสู่ระบบด้วยเบอร์นี้
          </div>
          <a href="/" class="btn">← กลับไปหน้าแรก</a>
          <form action="/login" method="POST" style="display: inline;">
            <input type="hidden" name="phone" value="${phone}">
            <button type="submit" class="btn btn-success">🔐 เข้าสู่ระบบด้วยเบอร์นี้</button>
          </form>
        </div>
      </body>
      </html>
    `);
  }
  
  const newUser = {
    id: Date.now().toString(),
    name,
    phone,
    location,
    role,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  writeUsers(users);
  
  // Create session immediately after registration
  const sessionId = generateSessionId();
  sessions.set(sessionId, newUser.id);
  setCookie(res, 'sessionId', sessionId, 7 * 24 * 60 * 60 * 1000);
  
  res.redirect('/dashboard');
});

// 4. Dashboard
app.get('/dashboard', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  const tasks = readTasks();
  const myTasks = tasks.filter(t => t.requesterId === currentUser.id);
  const acceptedTasks = tasks.filter(t => t.helperId === currentUser.id);
  
  let dashboardContent = '';
  
  if (currentUser.role === 'requester') {
    const openTasks = myTasks.filter(t => t.status === 'open').length;
    const inProgressTasks = myTasks.filter(t => t.status === 'in-progress').length;
    const completedTasks = myTasks.filter(t => t.status === 'completed').length;
    
    dashboardContent = `
      <h2>📊 สถิติของคุณ</h2>
      <div style="display: flex; gap: 20px; margin: 20px 0;">
        <div style="flex: 1; background: #3498db; color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 2em; font-weight: bold;">${openTasks}</div>
          <div>กำลังรอผู้ช่วย</div>
        </div>
        <div style="flex: 1; background: #f39c12; color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 2em; font-weight: bold;">${inProgressTasks}</div>
          <div>กำลังดำเนินการ</div>
        </div>
        <div style="flex: 1; background: #27ae60; color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 2em; font-weight: bold;">${completedTasks}</div>
          <div>เสร็จสิ้นแล้ว</div>
        </div>
      </div>

      <div class="alert alert-success">
        <strong>เริ่มต้นใช้งาน:</strong> คลิก "สร้างคำขอความช่วยเหลือ" เพื่อโพสต์งานที่ต้องการให้คนอื่นช่วย!
      </div>
    `;
  } else {
    const availableTasks = tasks.filter(t => t.status === 'open').length;
    const myAcceptedTasks = acceptedTasks.filter(t => t.status === 'in-progress').length;
    const completedTasks = acceptedTasks.filter(t => t.status === 'completed').length;
    
    dashboardContent = `
      <h2>📊 สถิติของคุณ</h2>
      <div style="display: flex; gap: 20px; margin: 20px 0;">
        <div style="flex: 1; background: #3498db; color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 2em; font-weight: bold;">${availableTasks}</div>
          <div>งานว่างที่รับได้</div>
        </div>
        <div style="flex: 1; background: #f39c12; color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 2em; font-weight: bold;">${myAcceptedTasks}</div>
          <div>กำลังทำอยู่</div>
        </div>
        <div style="flex: 1; background: #27ae60; color: white; padding: 20px; border-radius: 10px; text-align: center;">
          <div style="font-size: 2em; font-weight: bold;">${completedTasks}</div>
          <div>ทำสำเร็จแล้ว</div>
        </div>
      </div>

      <div class="alert alert-success">
        <strong>เริ่มต้นใช้งาน:</strong> คลิก "งานที่รับได้" เพื่อดูงานที่สามารถรับทำและรับค่าตอบแทน!
      </div>
    `;
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dashboard - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤝 My-Friends Platform</h1>
          <div class="user-info">
            ${currentUser.role === 'requester' ? '🙋‍♂️' : '🦸‍♀️'} ${currentUser.name}
          </div>
          <a href="/logout" class="logout-btn">ออกจากระบบ</a>
        </div>

        ${getNavMenu(currentUser.role)}

        <h2>ยินดีต้อนรับ, ${currentUser.name}!</h2>
        
        ${dashboardContent}
      </div>
    </body>
    </html>
  `);
});

// 5. Create task (Requester only)
app.get('/create-task', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'requester') {
    return res.redirect('/dashboard');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>สร้างคำขอ - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>➕ สร้างคำขอความช่วยเหลือ</h1>
          <div class="user-info">🙋‍♂️ ${currentUser.name}</div>
          <a href="/logout" class="logout-btn">ออกจากระบบ</a>
        </div>

        ${getNavMenu(currentUser.role)}

        <form action="/create-task" method="POST">
          <div class="form-group">
            <label>หัวข้อคำขอ *</label>
            <input type="text" name="title" required placeholder="เช่น ซื้อกาแฟมาให้หน่อย">
          </div>

          <div class="form-group">
            <label>รายละเอียด *</label>
            <textarea name="description" rows="4" required placeholder="เช่น ซื้อกาแฟร้อนจากร้าน Cafe Amazon หน้ามอ มาส่งที่หอพัก"></textarea>
          </div>

          <div class="form-group">
            <label>ค่าของ (บาท) *</label>
            <input type="number" name="itemCost" required min="0" placeholder="80">
          </div>

          <div class="form-group">
            <label>ค่าจ้าง (บาท) *</label>
            <input type="number" name="serviceFee" required min="0" placeholder="40">
          </div>

          <div class="form-group">
            <label>สถานที่ส่งของ</label>
            <input type="text" name="deliveryLocation" value="${currentUser.location}" required>
          </div>

          <button type="submit" class="btn">สร้างคำขอ</button>
          <a href="/dashboard" class="btn btn-secondary">ยกเลิก</a>
        </form>
      </div>
    </body>
    </html>
  `);
});

app.post('/create-task', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'requester') {
    return res.redirect('/dashboard');
  }

  const { title, description, itemCost, serviceFee, deliveryLocation } = req.body;
  
  const tasks = readTasks();
  const newTask = {
    id: Date.now().toString(),
    title,
    description,
    itemCost: parseFloat(itemCost),
    serviceFee: parseFloat(serviceFee),
    totalCost: parseFloat(itemCost) + parseFloat(serviceFee),
    deliveryLocation,
    requesterId: currentUser.id,
    requesterName: currentUser.name,
    requesterPhone: currentUser.phone,
    helperId: null,
    helperName: null,
    status: 'open', // open, in-progress, completed
    paymentStatus: 'pending', // pending, paid, confirmed
    paymentMethod: null,
    paidAt: null,
    createdAt: new Date().toISOString(),
    acceptedAt: null,
    completedAt: null
  };
  
  tasks.push(newTask);
  writeTasks(tasks);
  
  res.redirect('/my-tasks');
});

// 6. View my tasks (Requester)
app.get('/my-tasks', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'requester') {
    return res.redirect('/dashboard');
  }

  const tasks = readTasks();
  const myTasks = tasks.filter(t => t.requesterId === currentUser.id);

  let tasksHtml = '';
  if (myTasks.length === 0) {
    tasksHtml = '<div class="alert alert-info">คุณยังไม่มีคำขอความช่วยเหลือ คลิก "สร้างคำขอความช่วยเหลือ" เพื่อเริ่มต้น</div>';
  } else {
    myTasks.forEach(task => {
      const statusBadge = task.status === 'open' ? 'status-open' : 
                          task.status === 'in-progress' ? 'status-in-progress' : 
                          'status-completed';
      const statusText = task.status === 'open' ? '🔵 รอผู้ช่วย' : 
                         task.status === 'in-progress' ? '🟡 กำลังดำเนินการ' : 
                         '🟢 เสร็จสิ้น';
      
      let actionButton = '';
      if (task.status === 'in-progress') {
        actionButton = `
          <a href="/payment/${task.id}" class="btn btn-success">💰 ชำระเงินและยืนยันเสร็จสิ้น</a>
        `;
      } else if (task.status === 'completed') {
        const paymentLabel = {
          'cash': '💵 เงินสด',
          'promptpay': '📱 PromptPay',
          'bank-transfer': '🏦 โอนธนาคาร',
          'true-wallet': '👛 TrueMoney',
          'credit-card': '💳 บัตรเครดิต'
        };
        actionButton = `
          <div class="alert alert-success">
            ✅ เสร็จสิ้นแล้ว<br>
            ชำระเงินผ่าน: <strong>${paymentLabel[task.paymentMethod] || task.paymentMethod}</strong>
          </div>
        `;
      }

      tasksHtml += `
        <div class="task-card">
          <div class="task-title">${task.title}</div>
          <span class="status-badge ${statusBadge}">${statusText}</span>
          <div class="task-detail">📝 ${task.description}</div>
          <div class="task-money">💰 ค่าของ: ${task.itemCost} บาท + ค่าจ้าง: ${task.serviceFee} บาท = รวม ${task.totalCost} บาท</div>
          <div class="task-detail">📍 ส่งที่: ${task.deliveryLocation}</div>
          ${task.helperName ? `<div class="task-detail">👤 ผู้ช่วย: ${task.helperName}</div>` : ''}
          <div class="task-detail">📅 สร้างเมื่อ: ${new Date(task.createdAt).toLocaleString('th-TH')}</div>
          ${actionButton}
        </div>
      `;
    });
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>คำขอของฉัน - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 คำขอของฉัน</h1>
          <div class="user-info">🙋‍♂️ ${currentUser.name}</div>
          <a href="/logout" class="logout-btn">ออกจากระบบ</a>
        </div>

        ${getNavMenu(currentUser.role)}

        ${tasksHtml}
      </div>
    </body>
    </html>
  `);
});

// 7. View available tasks (Helper)
app.get('/available-tasks', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'helper') {
    return res.redirect('/dashboard');
  }

  const tasks = readTasks();
  const availableTasks = tasks.filter(t => t.status === 'open');

  let tasksHtml = '';
  if (availableTasks.length === 0) {
    tasksHtml = '<div class="alert alert-info">ขณะนี้ยังไม่มีงานว่าง กรุณาลองใหม่อีกครั้งภายหลัง</div>';
  } else {
    availableTasks.forEach(task => {
      tasksHtml += `
        <div class="task-card">
          <div class="task-title">${task.title}</div>
          <span class="status-badge status-open">🔵 งานว่าง</span>
          <div class="task-detail">📝 ${task.description}</div>
          <div class="task-money">💰 ค่าของ: ${task.itemCost} บาท + ค่าจ้าง: ${task.serviceFee} บาท = รวม ${task.totalCost} บาท</div>
          <div class="task-detail">📍 ส่งที่: ${task.deliveryLocation}</div>
          <div class="task-detail">👤 ผู้ขอ: ${task.requesterName}</div>
          <div class="task-detail">📞 เบอร์ติดต่อ: ${task.requesterPhone}</div>
          <div class="task-detail">📅 สร้างเมื่อ: ${new Date(task.createdAt).toLocaleString('th-TH')}</div>
          <form action="/accept-task" method="POST" style="margin-top: 10px;">
            <input type="hidden" name="taskId" value="${task.id}">
            <button type="submit" class="btn btn-success">✓ รับงานนี้</button>
          </form>
        </div>
      `;
    });
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>งานที่รับได้ - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔍 งานที่รับได้</h1>
          <div class="user-info">🦸‍♀️ ${currentUser.name}</div>
          <a href="/logout" class="logout-btn">ออกจากระบบ</a>
        </div>

        ${getNavMenu(currentUser.role)}

        <h2>งานที่พร้อมรับ (${availableTasks.length} งาน)</h2>
        ${tasksHtml}
      </div>
    </body>
    </html>
  `);
});

// 8. Accept task (Helper)
app.post('/accept-task', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'helper') {
    return res.redirect('/dashboard');
  }

  const { taskId } = req.body;
  const tasks = readTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex !== -1 && tasks[taskIndex].status === 'open') {
    tasks[taskIndex].status = 'in-progress';
    tasks[taskIndex].helperId = currentUser.id;
    tasks[taskIndex].helperName = currentUser.name;
    tasks[taskIndex].acceptedAt = new Date().toISOString();
    writeTasks(tasks);
  }
  
  res.redirect('/my-accepted-tasks');
});

// 9. View my accepted tasks (Helper)
app.get('/my-accepted-tasks', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'helper') {
    return res.redirect('/dashboard');
  }

  const tasks = readTasks();
  const myTasks = tasks.filter(t => t.helperId === currentUser.id);

  let tasksHtml = '';
  if (myTasks.length === 0) {
    tasksHtml = '<div class="alert alert-info">คุณยังไม่มีงานที่รับ ไปที่ "งานที่รับได้" เพื่อรับงาน</div>';
  } else {
    myTasks.forEach(task => {
      const statusBadge = task.status === 'in-progress' ? 'status-in-progress' : 'status-completed';
      const statusText = task.status === 'in-progress' ? '🟡 กำลังทำ' : '🟢 เสร็จสิ้น';
      
      tasksHtml += `
        <div class="task-card">
          <div class="task-title">${task.title}</div>
          <span class="status-badge ${statusBadge}">${statusText}</span>
          <div class="task-detail">📝 ${task.description}</div>
          <div class="task-money">💰 คุณจะได้รับ: ${task.serviceFee} บาท (ค่าของ ${task.itemCost} บาท)</div>
          <div class="task-detail">📍 ส่งที่: ${task.deliveryLocation}</div>
          <div class="task-detail">👤 ผู้ขอ: ${task.requesterName}</div>
          <div class="task-detail">📞 เบอร์ติดต่อ: ${task.requesterPhone}</div>
          <div class="task-detail">📅 รับงานเมื่อ: ${new Date(task.acceptedAt).toLocaleString('th-TH')}</div>
          ${task.status === 'in-progress' ? '<div class="alert alert-warning">⏳ รอผู้ขอยืนยันว่าได้รับของแล้ว</div>' : ''}
        </div>
      `;
    });
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>งานที่รับแล้ว - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ งานที่รับแล้ว</h1>
          <div class="user-info">🦸‍♀️ ${currentUser.name}</div>
          <a href="/logout" class="logout-btn">ออกจากระบบ</a>
        </div>

        ${getNavMenu(currentUser.role)}

        ${tasksHtml}
      </div>
    </body>
    </html>
  `);
});

// 10. Complete task (Requester confirms)
app.get('/payment/:taskId', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'requester') {
    return res.redirect('/dashboard');
  }

  const { taskId } = req.params;
  const tasks = readTasks();
  const task = tasks.find(t => t.id === taskId && t.requesterId === currentUser.id);
  
  if (!task || task.status !== 'in-progress') {
    return res.redirect('/my-tasks');
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ชำระเงิน - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 ชำระเงิน</h1>
          <div class="user-info">🙋‍♂️ ${currentUser.name}</div>
          <a href="/logout" class="logout-btn">ออกจากระบบ</a>
        </div>

        ${getNavMenu(currentUser.role)}

        <div class="task-card">
          <div class="task-title">${task.title}</div>
          <div class="task-detail">📝 ${task.description}</div>
          <div class="task-detail">👤 ผู้ช่วย: ${task.helperName}</div>
          <hr style="margin: 20px 0; border: 1px solid #ecf0f1;">
          <div style="font-size: 1.1em; margin: 10px 0;">
            <div>💵 ค่าของ: <strong>${task.itemCost}</strong> บาท</div>
            <div>💼 ค่าจ้าง: <strong>${task.serviceFee}</strong> บาท</div>
            <hr style="margin: 10px 0;">
            <div style="font-size: 1.3em; color: #e74c3c;">
              💰 <strong>รวมทั้งหมด: ${task.totalCost} บาท</strong>
            </div>
          </div>
        </div>

        <h2>เลือกช่องทางชำระเงิน</h2>

        <form action="/process-payment" method="POST">
          <input type="hidden" name="taskId" value="${task.id}">
          
          <div class="form-group">
            <label>
              <input type="radio" name="paymentMethod" value="cash" required style="width: auto; margin-right: 10px;">
              💵 เงินสด (จ่ายตรงให้ผู้ช่วย)
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="radio" name="paymentMethod" value="promptpay" style="width: auto; margin-right: 10px;">
              📱 PromptPay / QR Code
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="radio" name="paymentMethod" value="bank-transfer" style="width: auto; margin-right: 10px;">
              🏦 โอนเงินผ่านธนาคาร
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="radio" name="paymentMethod" value="true-wallet" style="width: auto; margin-right: 10px;">
              👛 TrueMoney Wallet
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="radio" name="paymentMethod" value="credit-card" style="width: auto; margin-right: 10px;">
              💳 บัตรเครดิต/เดบิต
            </label>
          </div>

          <div class="pdpa-notice">
            <strong>📌 หมายเหตุ:</strong><br>
            • เงินสด: จ่ายตรงให้ผู้ช่วยเมื่อได้รับของแล้ว<br>
            • ช่องทางอื่น ๆ: ระบบจะบันทึกการชำระเงินและแจ้งผู้ช่วย<br>
            • คุณสามารถยืนยันการชำระเงินหลังจากได้รับของแล้ว
          </div>

          <button type="submit" class="btn" style="width: 100%; font-size: 1.2em;">✓ ยืนยันการชำระเงินและเสร็จสิ้น</button>
          <a href="/my-tasks" class="btn btn-secondary" style="width: 100%; display: block; text-align: center; margin-top: 10px;">← กลับ</a>
        </form>
      </div>
    </body>
    </html>
  `);
});

// 10.5. Process payment
app.post('/process-payment', requireAuth, (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'requester') {
    return res.redirect('/dashboard');
  }

  const { taskId, paymentMethod } = req.body;
  const tasks = readTasks();
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex !== -1 && tasks[taskIndex].requesterId === currentUser.id) {
    tasks[taskIndex].status = 'completed';
    tasks[taskIndex].paymentStatus = 'paid';
    tasks[taskIndex].paymentMethod = paymentMethod;
    tasks[taskIndex].paidAt = new Date().toISOString();
    tasks[taskIndex].completedAt = new Date().toISOString();
    writeTasks(tasks);
  }
  
  res.redirect('/my-tasks');
});

// 11. History page
app.get('/history', requireAuth, (req, res) => {
  const currentUser = req.currentUser;

  const tasks = readTasks();
  let myTasks = [];
  
  if (currentUser.role === 'requester') {
    myTasks = tasks.filter(t => t.requesterId === currentUser.id && t.status === 'completed');
  } else {
    myTasks = tasks.filter(t => t.helperId === currentUser.id && t.status === 'completed');
  }

  let tasksHtml = '';
  if (myTasks.length === 0) {
    tasksHtml = '<div class="alert alert-info">ยังไม่มีประวัติงานที่เสร็จสิ้น</div>';
  } else {
    myTasks.forEach(task => {
      const paymentLabel = {
        'cash': '💵 เงินสด',
        'promptpay': '📱 PromptPay',
        'bank-transfer': '🏦 โอนธนาคาร',
        'true-wallet': '👛 TrueMoney',
        'credit-card': '💳 บัตรเครดิต'
      };
      
      tasksHtml += `
        <div class="task-card">
          <div class="task-title">${task.title}</div>
          <span class="status-badge status-completed">🟢 เสร็จสิ้น</span>
          <div class="task-detail">📝 ${task.description}</div>
          <div class="task-money">💰 ${currentUser.role === 'requester' ? `จ่ายทั้งหมด: ${task.totalCost}` : `ได้รับค่าจ้าง: ${task.serviceFee}`} บาท</div>
          ${task.paymentMethod ? `<div class="task-detail">💳 ชำระผ่าน: ${paymentLabel[task.paymentMethod] || task.paymentMethod}</div>` : ''}
          <div class="task-detail">👤 ${currentUser.role === 'requester' ? `ผู้ช่วย: ${task.helperName}` : `ผู้ขอ: ${task.requesterName}`}</div>
          <div class="task-detail">📅 เสร็จสิ้นเมื่อ: ${new Date(task.completedAt).toLocaleString('th-TH')}</div>
        </div>
      `;
    });
  }

  res.send(`
    <!DOCTYPE html>
    <html lang="th">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ประวัติ - My-Friends</title>
      ${styles}
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📜 ประวัติงาน</h1>
          <div class="user-info">${currentUser.role === 'requester' ? '🙋‍♂️' : '🦸‍♀️'} ${currentUser.name}</div>
          <a href="/logout" class="logout-btn">ออกจากระบบ</a>
        </div>

        ${getNavMenu(currentUser.role)}

        <h2>งานที่เสร็จสิ้นแล้ว (${myTasks.length} งาน)</h2>
        ${tasksHtml}
      </div>
    </body>
    </html>
  `);
});

// 12. Logout
app.get('/logout', (req, res) => {
  const sessionId = req.cookies.sessionId;
  if (sessionId) {
    sessions.delete(sessionId);
  }
  clearCookie(res, 'sessionId');
  res.redirect('/');
});

// Initialize and start server
initializeDataFiles();

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🎉 My-Friends Platform is running!');
  console.log('='.repeat(60));
  console.log(`🌐 Open your browser and go to: http://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('💡 Tips:');
  console.log('   - Open 2 browser windows to test both roles');
  console.log('   - Data is saved in users.json and tasks.json');
  console.log('   - Press Ctrl+C to stop the server');
  console.log('='.repeat(60));
});
