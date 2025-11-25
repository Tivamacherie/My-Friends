# 🔐 ระบบ Authentication - My-Friends Platform

## 📌 Overview

ระบบล็อกอินแบบมืออาชีพด้วย **OTP (One-Time Password)** ที่จำลองการส่ง SMS และใช้ **Session Management** แบบ cookie-based

---

## 🎯 Features

### 1. **OTP Authentication**
- ✅ ส่งรหัส OTP 6 หลักไปยังเบอร์โทรศัพท์
- ✅ รหัสหมดอายุใน 5 นาที
- ✅ สามารถขอรหัสใหม่ได้ (Resend OTP)
- ✅ ตรวจสอบความถูกต้องของรหัส

### 2. **Session Management**
- ✅ ใช้ Cookie-based session (ไม่ต้องติดตั้ง external library)
- ✅ Session เก็บไว้ 7 วัน
- ✅ Auto-login เมื่อ refresh หน้า
- ✅ Logout ลบ session ทันที

### 3. **Security**
- ✅ ป้องกันเบอร์ซ้ำในระบบ
- ✅ OTP เก็บแบบชั่วคราว (in-memory)
- ✅ Session ID สุ่มด้วย crypto module
- ✅ HttpOnly cookies (ป้องกัน XSS)

---

## 🔄 Flow Diagram

```
┌─────────────────────────────────────────────────┐
│           หน้าแรก (/)                            │
│  - แบบฟอร์มล็อกอิน (กรอกเบอร์)                   │
│  - ปุ่มสมัครสมาชิก (เลือก role)                  │
└────────────┬────────────────────────────────────┘
             │
             ├─── สมัครสมาชิกใหม่
             │    └──> /select-role (เลือก role)
             │         └──> /register (กรอกข้อมูล)
             │              └──> สร้าง user + session
             │                   └──> /dashboard
             │
             └─── ล็อกอิน (มีบัญชีแล้ว)
                  └──> /login (กรอกเบอร์)
                       │
                       ├── เบอร์ไม่มี → แจ้งไปสมัครใหม่
                       │
                       └── เบอร์มี → สร้าง OTP
                            └──> แสดงหน้ากรอก OTP
                                 │
                                 ├── OTP ถูก → สร้าง session
                                 │            └──> /dashboard
                                 │
                                 ├── OTP ผิด → แจ้งลองใหม่
                                 │
                                 └── OTP หมดอายุ → ขอใหม่
```

---

## 🛠️ Implementation Details

### 1. Cookie Parser (ไม่ต้องติดตั้ง external lib)

```javascript
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
```

### 2. Session Storage

```javascript
const sessions = new Map(); // sessionId -> userId
const otpStore = new Map();  // phone -> { otp, userId, expires }
```

### 3. Helper Functions

```javascript
// สร้าง Session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// สร้างรหัส OTP 6 หลัก
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ตั้งค่า Cookie
function setCookie(res, name, value, maxAge = 7 * 24 * 60 * 60 * 1000) {
  res.setHeader('Set-Cookie', 
    `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge / 1000}; Path=/; HttpOnly`);
}

// ลบ Cookie
function clearCookie(res, name) {
  res.setHeader('Set-Cookie', `${name}=; Max-Age=0; Path=/`);
}

// ดึงข้อมูลผู้ใช้จาก Session
function getCurrentUser(req) {
  const sessionId = req.cookies.sessionId;
  if (sessionId && sessions.has(sessionId)) {
    const userId = sessions.get(sessionId);
    const users = readUsers();
    return users.find(u => u.id === userId);
  }
  return null;
}
```

### 4. Middleware สำหรับตรวจสอบ Auth

```javascript
function requireAuth(req, res, next) {
  const user = getCurrentUser(req);
  if (!user) {
    return res.redirect('/');
  }
  req.currentUser = user;
  next();
}
```

---

## 📱 Routes

### 1. `/` - หน้าแรก
- แสดงแบบฟอร์มล็อกอิน
- แสดงปุ่มสมัครสมาชิก
- ถ้ามี session อยู่แล้ว → redirect ไป `/dashboard`

### 2. `POST /login` - ล็อกอินด้วยเบอร์โทร
- รับเบอร์โทรศัพท์
- ตรวจสอบว่ามี user หรือไม่
- สร้าง OTP และเก็บไว้ใน `otpStore`
- แสดงหน้ากรอก OTP (พร้อมแสดงรหัสใน console เพื่อทดสอบ)

### 3. `POST /verify-otp` - ยืนยัน OTP
- รับเบอร์โทรและรหัส OTP
- ตรวจสอบความถูกต้อง
- ตรวจสอบหมดอายุหรือไม่
- ถ้าถูกต้อง → สร้าง session → redirect ไป `/dashboard`
- ถ้าผิด → แจ้งเตือนและให้ลองใหม่

### 4. `POST /resend-otp` - ขอรหัส OTP ใหม่
- สร้างรหัสใหม่
- ส่งกลับไปหน้ากรอก OTP
- แสดงรหัสใหม่ใน console

### 5. `POST /select-role` - เลือกบทบาท (สมัครใหม่)
- เลือก role (requester/helper)
- ไปหน้ากรอกข้อมูลสมัครสมาชิก

### 6. `POST /register` - ลงทะเบียนสมาชิกใหม่
- รับข้อมูล: ชื่อ, เบอร์, ที่อยู่, role
- ตรวจสอบเบอร์ซ้ำหรือไม่
- ถ้าซ้ำ → แจ้งให้ล็อกอินด้วยเบอร์นั้น
- ถ้าไม่ซ้ำ → สร้าง user ใหม่ + สร้าง session → redirect ไป `/dashboard`

### 7. `GET /dashboard` - หน้าหลัก (ต้อง login)
- ใช้ middleware `requireAuth`
- แสดงข้อมูลตาม role

### 8. `GET /logout` - ออกจากระบบ
- ลบ session จาก `sessions`
- ลบ cookie
- redirect กลับไป `/`

---

## 🧪 การทดสอบ

### Test Case 1: สมัครสมาชิกใหม่
1. เข้าไปที่ `http://localhost:3000`
2. คลิก "ผู้ขอความช่วยเหลือ" หรือ "ผู้ช่วยเหลือ"
3. กรอกข้อมูล
4. ควรเข้าสู่ระบบทันที

### Test Case 2: ล็อกอินด้วยเบอร์เดิม
1. กรอกเบอร์โทรที่สมัครไว้แล้ว
2. ดูรหัส OTP ใน terminal
3. กรอกรหัส OTP
4. ควรเข้าสู่ระบบได้

### Test Case 3: OTP ผิด
1. กรอกเบอร์โทร
2. กรอก OTP ผิด (เช่น 000000)
3. ควรแจ้งว่า OTP ไม่ถูกต้อง

### Test Case 4: OTP หมดอายุ
1. กรอกเบอร์โทร
2. รอ 5+ นาที
3. กรอก OTP
4. ควรแจ้งว่า OTP หมดอายุแล้ว

### Test Case 5: Session Persistence
1. ล็อกอินเข้าระบบ
2. Refresh หน้าเว็บ
3. ควรยังอยู่ในระบบ (ไม่ต้องล็อกอินใหม่)

### Test Case 6: Logout
1. คลิก "ออกจากระบบ"
2. ควรกลับไปหน้าแรก
3. Refresh หน้า → ยังอยู่หน้าแรก (ไม่ auto-login)

---

## 🔒 Security Considerations

### ✅ ที่ทำแล้ว:
1. **OTP Expiry** - รหัสหมดอายุ 5 นาที
2. **Session Timeout** - Session หมดอายุ 7 วัน
3. **Random Session ID** - ใช้ crypto.randomBytes()
4. **HttpOnly Cookie** - ป้องกัน JavaScript access
5. **Phone Validation** - ตรวจสอบเบอร์ซ้ำ
6. **In-memory OTP** - ไม่เก็บ OTP ในฐานข้อมูล

### ⚠️ สิ่งที่ควรเพิ่มในโปรดักชัน:
1. **SMS Gateway** - ส่ง OTP ผ่าน SMS จริง (เช่น Twilio, AWS SNS)
2. **Rate Limiting** - จำกัดจำนวนครั้งขอ OTP
3. **HTTPS** - เข้ารหัสการสื่อสาร
4. **CSRF Protection** - ป้องกัน Cross-Site Request Forgery
5. **Database Session** - เก็บ session ในฐานข้อมูล (Redis, PostgreSQL)
6. **Password Hashing** - ถ้าเพิ่มระบบ password
7. **2FA** - Two-Factor Authentication เพิ่มเติม
8. **IP Logging** - บันทึก IP ที่ login
9. **Device Fingerprinting** - ตรวจจับอุปกรณ์ที่ล็อกอิน
10. **Email Verification** - ยืนยันอีเมลเพิ่มเติม

---

## 📊 Data Flow

### 1. Login Flow
```
User enters phone
    ↓
Check if phone exists in users.json
    ↓
Generate OTP (6 digits)
    ↓
Store in otpStore: { otp, userId, expires: now + 5min }
    ↓
Display OTP in console (simulated SMS)
    ↓
User enters OTP
    ↓
Validate OTP & check expiry
    ↓
Create sessionId (crypto.randomBytes)
    ↓
Store in sessions Map: sessionId → userId
    ↓
Set cookie: sessionId (7 days)
    ↓
Redirect to /dashboard
```

### 2. Session Check Flow
```
User visits protected page
    ↓
Middleware: requireAuth
    ↓
Read sessionId from cookie
    ↓
Check if sessionId exists in sessions Map
    ↓
Get userId from sessions
    ↓
Load user from users.json
    ↓
Attach user to req.currentUser
    ↓
Allow access
```

### 3. Logout Flow
```
User clicks logout
    ↓
Read sessionId from cookie
    ↓
Delete from sessions Map
    ↓
Clear cookie
    ↓
Redirect to /
```

---

## 💡 Tips

### สำหรับนักศึกษา:
- **เข้าใจ Flow**: ลองวาด flowchart ของระบบล็อกอินเอง
- **Debug**: ใช้ `console.log()` ดู session และ OTP
- **ทดสอบทุก Case**: ล็อกอินสำเร็จ, ล็อกอินผิด, OTP หมดอายุ
- **อ่าน Code**: เข้าใจทุกบรรทัดว่าทำอะไร

### สำหรับการนำเสนอ:
1. อธิบายว่าทำไมต้องมีระบบล็อกอิน
2. แสดง Flow Diagram
3. Demo การใช้งานจริง
4. อธิบาย Security ที่มี
5. บอก Limitations และแนวทางพัฒนาต่อ

---

## 🎓 สรุป

ระบบ Authentication นี้:
- ✅ ใช้งานง่าย (OTP ผ่าน console)
- ✅ ปลอดภัยพอสมควร (OTP expiry, session timeout)
- ✅ ไม่ต้องติดตั้ง library เพิ่ม
- ✅ เหมาะสำหรับ MVP และการสอบ
- ✅ เข้าใจง่าย สามารถอธิบายได้

**ข้อจำกัด:**
- ⚠️ ไม่ส่ง SMS จริง (ใช้ console)
- ⚠️ Session เก็บ in-memory (หายเมื่อ restart server)
- ⚠️ ไม่มี rate limiting
- ⚠️ ไม่มี HTTPS

**แนวทางพัฒนาต่อ:**
- 🚀 ผูกกับ SMS Gateway (Twilio, AWS SNS)
- 🚀 ใช้ Redis เก็บ session
- 🚀 เพิ่ม rate limiting
- 🚀 Deploy บน HTTPS

---

**Happy Coding! 🔐✨**
