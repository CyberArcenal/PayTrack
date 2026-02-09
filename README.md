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

## System Structure

```
src/
  main/
    index.js
    preload.js
    ipc/
      employee/
        index.ipc.js
        create.ipc.js
        update.ipc.js
        delete.ipc.js
        list.ipc.js
      attendance/
        index.ipc.js
        log.ipc.js
        update.ipc.js
        list.ipc.js
      payroll/
        index.ipc.js
        compute.ipc.js
        export.ipc.js
    db/
      database.js
      datasource.js
    config/
      env.js

  renderer/
    App.tsx
    main.tsx
    api/
      employee.ts
      attendance.ts
      payroll.ts
    components/
      EmployeeList.tsx
      AttendanceForm.tsx
      PayrollSummary.tsx
    pages/
      Employee/
        Table/EmployeeTable.tsx
        View/EmployeeView.tsx
        Form/EmployeeForm.tsx
      Attendance/
        Table/AttendanceTable.tsx
        View/AttendanceView.tsx
        Form/AttendanceForm.tsx
      Payroll/
        Table/PayrollTable.tsx
        View/PayrollView.tsx
        Form/PayrollForm.tsx
    hooks/
      useIPC.ts
      useEmployee.ts
      useAttendance.ts
    services/
      employeeService.ts
      attendanceService.ts
      payrollService.ts
    styles/
      index.css

  entities/
    Employee.js
    AttendanceLog.js
    PayrollPeriod.js
    PayrollRecord.js
    Deduction.js
    OvertimeLog.js
    AuditLog.js

  migrations/
    2026XXXX-init-paytrack-schema.js

  utils/
    dateUtils.js
    validation.js

  middlewares/
    errorHandler.js
```

---

## 🏷️ Tagline
> *“PayTrack: Simple payroll powered by attendance.”*