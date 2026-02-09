<p align="center">
  <img src="https://github.com/CyberArcenal/paytrack/blob/main/build/icon.png" alt="PayTrack Logo" width="200"/>
</p>

# PayTrack

**Lite Payroll Attendance Management System**  
Built with **Electron + React/TypeScript** and **TypeORM ORM**. Focused on simplicity, offline attendance logging, and basic payroll computation for SMEs and local businesses.

---

## ✨ Features
- **Attendance Logging**
  - Manual entry or RFID scanner
  - Offline-first design
  - Duplicate prevention

- **Payroll Computation**
  - Base pay × attendance days
  - Simple overtime and deductions
  - Exportable payroll slips (CSV/PDF)

- **UI/UX**
  - Easy-to-use dashboards
  - Employee and Admin roles
  - Quick reports

---

## 🏗️ Architecture
- **Electron Backend**
  - IPC handler for attendance + payroll
  - CommonJS modules

- **Frontend**
  - React + TypeScript
  - Lightweight, responsive UI

- **Database**
  - TypeORM for schema clarity
  - Basic audit logging

---

## 🚀 Roadmap
1. Attendance module (manual + RFID)  
2. Payroll engine (basic rules)
3. Export reports (CSV/PDF)  
4. Lite release packaging  

---

## 📦 Installation
```bash
git clone https://github.com/CyberArcenal/paytrack
cd paytrack
npm install
npm run dev
```

---

## 🏷️ Tagline
> *“PayTrack: Simple payroll powered by attendance.”*