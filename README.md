# Egles SMIS | Premium School Management & Information System

![Egles SMIS Logo](https://img.shields.io/badge/Egles-SMIS-6366f1?style=for-the-badge&logo=googlesheets&logoColor=white)
![Version](https://img.shields.io/badge/Version-1.0.0--Stable-green?style=for-the-badge)
![License](https://img.shields.io/badge/License-ISC-blue?style=for-the-badge)
![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&link=https://smis-cvs0.onrender.com)

**Egles SMIS** is a modern, high-performance School Management and Information System designed for educational institutions. Built with a "Cyber Glass" aesthetic, it provides a premium, data-rich experience for administrators, staff, and students.

### 🌐 Live Production URL
👉 **[https://smis-cvs0.onrender.com](https://smis-cvs0.onrender.com)**

---

## 🚀 Key Features

### 🏫 Academic & Student Management
- **Student Profiles:** Comprehensive tracking of student bio-data, classes, and parent contacts.
- **Attendance Tracking:** Daily attendance logging with status reporting.
- **Marks & Grading:** Automated recording of student scores across terms and years.
- **Curriculum Management:** Detailed breakdown of STEM, Humanities, and Creative Arts programs.

### 💰 Financial & Administrative
- **Fee Management:** Track payments, pending balances, and transaction history.
- **Payroll System:** Manage staff salaries, bonuses, and deductions.
- **POS & Expenses:** Integrated point-of-sale for school supplies and detailed expenditure tracking.
- **Asset Management:** Monitor school property, quantities, and values.

### 📚 Resource & Service Management
- **Library System:** Digital cataloging with book loan tracking and availability status.
- **Hostel Management:** Manage student accommodation and hostel capacity.
- **Transport Services:** Route mapping and bus assignment for students.
- **Health Records:** Track student blood groups, allergies, and emergency contacts.

### 📢 Communication & UI
- **Notifications:** Real-time system alerts and priority-based notices.
- **Premium Design:** Glassmorphism UI with multiple themes (Cyber Glass, Light, Midnight, Aurora).
- **PWA Ready:** Installable on mobile and desktop for offline-ready access.

---

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3 (Modern Flexbox/Grid).
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL (Primary), `better-sqlite3` (Optional/Local).
- **Charts:** Chart.js for data visualization.
- **Environment:** Dotenv for secure configuration.

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v14+)
- [PostgreSQL](https://www.postgresql.org/) (Recommended for Production)

### 2. Clone the Repository
```bash
git clone https://github.com/your-repo/egles-smis.git
cd egles-smis
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Environment Configuration
Create a `.env` file in the root directory and add your database connection string:
```env
DATABASE_URL=postgres://user:password@localhost:5432/egles_db
PORT=3000
```

### 5. Run the Application
```bash
npm start
```
The server will automatically initialize the database schema and seed default data.

---

## 🔐 Access Credentials

By default, the system initializes with the following administrator account:

| Username | Password | Role |
| :--- | :--- | :--- |
| `admin` | `admin123` | Administrator |

> [!IMPORTANT]
> It is highly recommended to change the default password immediately after the first login via the System Settings.

---

## 📱 Progressive Web App (PWA)

Egles SMIS is fully optimized as a PWA. To install:
1. Visit the production site: [https://smis-cvs0.onrender.com](https://smis-cvs0.onrender.com) in your browser.
2. Click the **"Install"** banner at the bottom or the install icon in the address bar.
3. Access Egles SMIS directly from your home screen or desktop.

---

## 📄 License

This project is licensed under the **ISC License**.

---

Designed with ❤️ for Egles Secondary School.
# eagles
