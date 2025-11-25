# 🤝 My-Friends Platform

**A peer-to-peer assistance SaaS platform connecting people who need help with those who can provide it.**

---

## 📋 Project Overview

**My-Friends Platform** is a marketplace platform that enables users to post help requests (e.g., buying items, delivery services) and allows others to accept these tasks for compensation.

**One-sentence description:** *A peer-to-peer platform connecting requesters who need assistance with helpers willing to complete tasks for payment.*

---

## 🎯 Problem Statement

Many people need small favors or tasks completed but lack the time or ability to do them themselves. Conversely, others are willing to help for reasonable compensation. Current solutions like food delivery apps are limited to specific services and often expensive. 

Students and workers in dormitories or residential areas frequently need help with errands like buying items, picking up packages, or delivering documents. However, there's no simple, localized platform to connect these needs with willing helpers in the same community. 

This platform solves this gap by providing a secure, easy-to-use system where anyone can post a task, set their own price, and find local helpers quickly. It builds community trust through verified phone authentication and transparent payment tracking.

---

## ✨ Key Features

### 1. **Dual User Roles**
   - 🙋‍♂️ **Requester** - Posts tasks and pays for completed work
   - 🦸‍♀️ **Helper** - Accepts and completes tasks for compensation

### 2. **🔐 Professional OTP Authentication System**
   - **OTP Login** - Secure login with phone number + 6-digit OTP
   - **OTP Registration** - Phone verification before signup (prevents phone number theft)
   - **Session Management** - Cookie-based sessions (7-day persistence)
   - **Security Features**:
     - OTP expires in 5 minutes
     - OTP hidden from web interface (console-only)
     - Prevents duplicate phone numbers
     - Session timeout and encryption

### 3. **💳 Integrated Payment System**
   - 💵 Cash payment
   - 📱 PromptPay / QR Code
   - 🏦 Bank transfer
   - 👛 TrueMoney Wallet
   - 💳 Credit/Debit card
   - Complete payment history tracking

### 4. **Core Data Entities**
   - **Users** - User profiles (name, phone, location, role)
   - **Tasks** - Help requests (title, description, costs, status, payment info)

### 5. **PDPA Compliance**
   - Full name collection
   - Phone number (OTP-verified)
   - Location/address
   - Privacy policy with user consent
   - Transparent data usage disclosure

### 6. **Complete Workflow**
   - Requester creates task → Status: "open"
   - Helper views and accepts task → Status: "in-progress"
   - Requester confirms completion + payment → Status: "completed"
   - System logs payment method and history

---

## 👥 Core User Stories

1. **As a Requester**, I want to create a help request with specific details and payment amount, so that helpers can understand what I need and decide if they want to help.

2. **As a Helper**, I want to browse available tasks in my area with clear compensation details, so I can choose tasks that fit my schedule and payment expectations.

3. **As a Requester**, I want to verify my phone number with OTP during registration, so the system ensures only legitimate users can post tasks.

4. **As a Helper**, I want to see the requester's contact information after accepting a task, so I can coordinate delivery details directly.

5. **As a Requester**, I want to select from multiple payment methods when confirming task completion, so I can pay in the most convenient way for me.

6. **As a User**, I want my session to persist for several days after login, so I don't have to re-authenticate every time I use the platform.

7. **As a User**, I want to view my task history with payment records, so I can track my activities and expenses.

---

## 🔧 Non-Functional Requirements

1. **Security & Authentication**
   - OTP-based authentication with 5-minute expiration
   - Session management with HttpOnly cookies
   - Phone number verification to prevent fraud
   - Secure handling of personal data per PDPA requirements

2. **Performance & Scalability**
   - Page load time under 2 seconds on standard connections
   - Support for at least 100 concurrent users
   - JSON file-based storage for MVP (ready to migrate to database)

3. **Usability & Accessibility**
   - Mobile-responsive design for on-the-go access
   - Simple, intuitive interface suitable for non-technical users
   - Thai language support with clear instructions
   - Single-page workflows to minimize navigation complexity

---

## ⚠️ Key Risks & Threats

1. **Technical Risk: OTP Delivery Reliability**
   - Currently simulated via console; production requires SMS gateway integration
   - SMS delivery failures could block user registration/login
   - Mitigation: Implement fallback methods and resend functionality

2. **Operational Risk: Payment Verification**
   - No real payment gateway integration in MVP
   - Risk of payment disputes between users
   - Mitigation: Add payment proof upload, escrow system, and dispute resolution workflow

3. **Security Risk: Phone Number Verification Bypass**
   - OTP system could be vulnerable to brute force or SIM swap attacks
   - Mitigation: Implement rate limiting, device fingerprinting, and anomaly detection

---

## 📁 Project Structure

```
My-Friends/
├── app.js              # Main file (Express server + HTML UI)
├── package.json        # Dependencies
├── users.json          # User data storage (auto-generated)
├── tasks.json          # Task data storage (auto-generated)
├── README.md           # This documentation
├── QUICKSTART.md       # Quick start guide
└── AUTHENTICATION.md   # Authentication system documentation
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js v14 or higher
- npm (comes with Node.js)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Tivamacherie/My-Friends.git
cd My-Friends

# 2. Install dependencies
npm install

# 3. Run the application
node app.js
# or
npm start

# 4. Open browser
# Navigate to: http://localhost:3000
```

### Testing the System

**Note:** OTP codes will appear in the terminal/console (simulated SMS)

---

### 🎮 วิธีใช้งาน

### 🔐 ระบบล็อกอิน (ใหม่!)

**ครั้งแรก - สมัครสมาชิก:**
1. เลือกบทบาท (Requester หรือ Helper)
2. กรอกข้อมูล: ชื่อ, เบอร์โทร, ที่อยู่
3. ยอมรับนโยบาย PDPA
4. ระบบจะสร้าง session อัตโนมัติ

**ครั้งต่อไป - ล็อกอินด้วย OTP:**
1. กรอกเบอร์โทรศัพท์
2. ระบบส่งรหัส OTP 6 หลัก (ดูใน terminal/console)
3. กรอกรหัส OTP เพื่อยืนยัน
4. เข้าสู่ระบบทันที - ไม่ต้องสมัครใหม่!

**หมายเหตุ:**
- รหัส OTP หมดอายุใน 5 นาที
- Session เก็บไว้ 7 วัน (ไม่ต้องล็อกอินบ่อย)
- ใช้โหมดทดสอบ: รหัส OTP แสดงใน terminal

---

### สำหรับผู้ขอความช่วยเหลือ (Requester):

1. **ลงทะเบียน/ล็อกอิน**
   - เลือกบทบาท "ผู้ขอความช่วยเหลือ" (ครั้งแรก)
   - หรือล็อกอินด้วยเบอร์โทร + OTP (ครั้งต่อไป)
   - กรอกข้อมูล: ชื่อ, เบอร์โทร, ที่อยู่
   - ยอมรับนโยบาย PDPA

2. **สร้างคำขอ**
   - คลิก "สร้างคำขอความช่วยเหลือ"
   - กรอกรายละเอียดงาน เช่น "ซื้อกาแฟมาให้หน่อย"
   - ระบุค่าของและค่าจ้าง เช่น ค่าของ 80 บาท + ค่าจ้าง 40 บาท

3. **รอผู้ช่วยรับงาน**
   - ดูสถานะงานใน "คำขอของฉัน"
   - เมื่อมีผู้ช่วยรับงาน จะเห็นชื่อและสถานะเปลี่ยนเป็น "กำลังดำเนินการ"

4. **ยืนยันเสร็จสิ้น**
   - เมื่อได้รับของแล้ว คลิก "ยืนยันเสร็จสิ้น"
   - งานจะถูกบันทึกในประวัติ

### สำหรับผู้ช่วยเหลือ (Helper):

1. **ลงทะเบียน/ล็อกอิน**
   - เลือกบทบาท "ผู้ช่วยเหลือ" (ครั้งแรก)
   - หรือล็อกอินด้วยเบอร์โทร + OTP (ครั้งต่อไป)
   - กรอกข้อมูล: ชื่อ, เบอร์โทร, ที่อยู่
   - ยอมรับนโยบาย PDPA

2. **เลือกงาน**
   - ดูงานที่มีใน "งานที่รับได้"
   - อ่านรายละเอียดและค่าตอบแทน
   - เห็นข้อมูลผู้ขอ (ชื่อ, เบอร์โทร, สถานที่ส่ง)

3. **รับงาน**
   - คลิก "รับงานนี้"
   - งานจะย้ายไปอยู่ใน "งานที่รับแล้ว"

4. **ดำเนินการและรอยืนยัน**
   - ทำงานตามที่ระบุ (เช่น ซื้อของและส่ง)
   - รอผู้ขอยืนยันว่าได้รับของแล้ว
   - เมื่อเสร็จสิ้น จะถูกบันทึกในประวัติ

---

## 📊 Sample Data Structure

### users.json
```json
[
  {
    "id": "1732567890123",
    "name": "สมชาย ใจดี",
    "phone": "081-234-5678",
    "location": "หอพัก A ตึก 2 ชั้น 3 ห้อง 305",
    "role": "requester",
    "createdAt": "2025-11-25T10:30:00.000Z"
  },
  {
    "id": "1732567999456",
    "name": "สมหญิง รักช่วยเหลือ",
    "phone": "089-765-4321",
    "location": "หอพัก B ตึก 1",
    "role": "helper",
    "createdAt": "2025-11-25T10:35:00.000Z"
  }
]
```

### tasks.json
```json
[
  {
    "id": "1732568123456",
    "title": "ซื้อกาแฟมาให้หน่อย",
    "description": "ซื้อกาแฟร้อนจากร้าน Cafe Amazon หน้ามอ มาส่งที่หอพัก",
    "itemCost": 80,
    "serviceFee": 40,
    "totalCost": 120,
    "deliveryLocation": "หอพัก A ตึก 2 ชั้น 3 ห้อง 305",
    "requesterId": "1732567890123",
    "requesterName": "สมชาย ใจดี",
    "requesterPhone": "081-234-5678",
    "helperId": "1732567999456",
    "helperName": "สมหญิง รักช่วยเหลือ",
    "status": "completed",
    "createdAt": "2025-11-25T11:00:00.000Z",
    "acceptedAt": "2025-11-25T11:15:00.000Z",
    "completedAt": "2025-11-25T11:45:00.000Z"
  }
]
```

---

## 🔐 PDPA (Personal Data Protection Act)

### ข้อมูลส่วนบุคคลที่เก็บรวบรวม:
1. **ชื่อ-นามสกุล** - ใช้สำหรับแสดงตัวตนและการติดต่อ
2. **เบอร์โทรศัพท์** - ใช้สำหรับการติดต่อสื่อสารระหว่างผู้ขอและผู้ช่วย
3. **ที่อยู่/สถานที่** - ใช้สำหรับการส่งมอบของ

### วัตถุประสงค์:
- เชื่อมโยงผู้ขอความช่วยเหลือกับผู้ช่วยเหลือ
- อำนวยความสะดวกในการติดต่อและส่งมอบงาน
- บันทึกประวัติการทำงานเพื่อความโปร่งใส

### การเก็บรักษา:
- ข้อมูลถูกเก็บในไฟล์ JSON บนเซิร์ฟเวอร์
- ไม่มีการเผยแพร่ข้อมูลแก่บุคคลภายนอก
- ผู้ใช้ยอมรับนโยบายก่อนลงทะเบียน

### หมายเหตุ:
ในการใช้งานจริง ควร:
- เข้ารหัสข้อมูลส่วนบุคคล
- ใช้ฐานข้อมูลที่ปลอดภัย (PostgreSQL, MongoDB)
- มีระบบการจัดการสิทธิ์ในการเข้าถึงข้อมูล
- มีนโยบายการลบข้อมูลตามกำหนด

---

## 🎯 System Flow

```
1. ผู้ใช้เลือกบทบาท (Requester หรือ Helper)
   ↓
2. ลงทะเบียนด้วยข้อมูลส่วนบุคคล + ยอมรับ PDPA
   ↓
3a. Requester:                    3b. Helper:
    - สร้างคำขอ                      - ดูงานที่มี
    - ระบุรายละเอียดและค่าใช้จ่าย      - เลือกรับงาน
    - รอผู้ช่วยรับงาน                 - ดำเนินการตามที่ระบุ
    - ยืนยันเสร็จสิ้นเมื่อได้รับของ      - รอยืนยันจาก Requester
   ↓                              ↓
4. บันทึกในประวัติ (ทั้ง 2 ฝ่าย)
```

---

## 💡 คุณสมบัติเด่น

### ✅ ตอบโจทย์การสอบ:
- ✓ Single-file application (app.js)
- ✓ ไม่ต้องติดตั้งฐานข้อมูล (ใช้ JSON files)
- ✓ รันได้ทันทีด้วย `node app.js`
- ✓ มี HTML UI ในตัว (ไม่ต้อง frontend แยก)
- ✓ มากกว่า 2 user roles (requester, helper)
- ✓ มี 2 core entities (users, tasks)
- ✓ มีข้อมูลส่วนบุคคล (PDPA)
- ✓ โค้ดเข้าใจง่าย เหมาะสำหรับมือใหม่
- ✓ **ระบบ OTP Authentication แบบมืออาชีพ** 🔐
- ✓ **ยืนยันเบอร์โทรก่อนสมัคร (ป้องกันขโมยเบอร์)** 🛡️
- ✓ **Session Management ด้วย cookies (7 วัน)** 🍪
- ✓ **ระบบชำระเงิน 5 ช่องทาง** 💳
- ✓ **Security: ซ่อน OTP จากหน้าเว็บ** 🔒

### 🎨 UI/UX:
- Modern gradient design (สีม่วง-น้ำเงิน)
- Responsive cards และ buttons
- Status badges แบ่งตามสถานะงาน
- Inline CSS ครบทุกอย่าง
- ใช้ emoji ทำให้ดูน่าสนใจ

### 🔧 Technical:
- **Express.js** framework
- **File-based storage** (fs module - JSON files)
- **OTP Authentication** (SMS simulation via console)
  - 6-digit OTP
  - 5-minute expiry
  - Used for both login & registration
- **Session Management** (cookie-based, no external libs)
  - 7-day session persistence
  - HttpOnly cookies
  - Crypto-based session IDs
- **Payment Tracking System**
  - 5 payment methods
  - Payment history logging
- **Security Features**:
  - OTP hidden from web pages
  - Phone verification before signup
  - Duplicate phone prevention
  - Session timeout
- Form handling (POST requests)
- RESTful routing

---

## 🐛 Troubleshooting

### ปัญหา: Port 3000 ถูกใช้งานอยู่แล้ว
**วิธีแก้:**
```bash
# หา process ที่ใช้ port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# หรือเปลี่ยน PORT ใน app.js
const PORT = 3001;
```

### ปัญหา: ไฟล์ JSON ผิดพลาด
**วิธีแก้:**
```bash
# ลบไฟล์ JSON เก่าและรันใหม่
rm users.json tasks.json
node app.js
```

### ปัญหา: Express ไม่ติดตั้ง
**วิธีแก้:**
```bash
# ตรวจสอบ Node.js version
node --version

# ติดตั้ง Express อีกครั้ง
npm install express --save
```

---

## 📚 การพัฒนาต่อยอด

### Ideas สำหรับเพิ่มฟีเจอร์:
1. **Rating System** - ให้คะแนนผู้ช่วยหลังจากทำงานเสร็จ
2. **Chat System** - เพิ่มระบบแชทระหว่าง Requester และ Helper
3. **Payment Integration** - เชื่อมต่อกับ PromptPay หรือ True Money Wallet
4. **Admin Dashboard** - หน้าสำหรับ admin ดูภาพรวมทั้งระบบ
5. **Notification** - แจ้งเตือนเมื่อมีงานใหม่หรือสถานะเปลี่ยน
6. **Search & Filter** - ค้นหาและกรองงานตามหมวดหมู่
7. **User Profile** - หน้าโปรไฟล์แสดงสถิติและประวัติ
8. **Image Upload** - อัปโหลดรูปภาพเป็นหลักฐาน

---

## 📝 License

โปรเจกต์นี้สร้างขึ้นเพื่อการศึกษาและใช้ในการสอบปลายภาค (Final Exam)

---

## 👨‍💻 Author

Created for **My-Friends Platform** - Final Exam Project

**Repository:** [Tivamacherie/My-Friends](https://github.com/Tivamacherie/My-Friends)

---

## 🎓 สรุป

โปรเจกต์นี้เป็น **MVP (Minimum Viable Product)** ที่:
- ✅ ทำงานได้จริง ครบทุกฟีเจอร์
- ✅ ใช้เวลาทำ 1-3 ชั่วโมง
- ✅ โค้ดเข้าใจง่าย เหมาะสำหรับมือใหม่
- ✅ ตอบโจทย์ PDPA และ SaaS/Platform
- ✅ รันได้ทันทีด้วยคำสั่งเดียว

**Happy Coding! 🚀**