import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Thành phần chung
import MyNavbar from './components/MyNavbar';
import Login from './Login';

// Staff
import Attendance from './pages/Staff/Attendance';
import MySchedule from './pages/Staff/MySchedule';
import RegisterSchedule from './pages/Staff/RegisterSchedule';
import MySalary from './pages/Staff/MySalary';
import LeaveRequest from './pages/Staff/LeaveRequest';

// Manager
import EmployeeManager from './pages/Manager/EmployeeManager';
import PositionManager from './pages/Manager/PositionManager';
import ShiftManager from './pages/Manager/ShiftManager';
import ScheduleApproval from './pages/Manager/ScheduleApproval';
import AttendanceManager from './pages/Manager/AttendanceManager';
import LeaveApproval from './pages/Manager/LeaveApproval';
import PayrollReport from './pages/Manager/PayrollReport';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const location = useLocation();

  const shouldShowNavbar = isLoggedIn && location.pathname !== '/';
  // Hàm kiểm tra quyền Manager
  const isManager = () => {
    const role = localStorage.getItem('role');
    return role === '0' || role === 'Manager';
  };

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, [location]);


  
  return (
    <>
      {shouldShowNavbar && <MyNavbar />}
      <Routes>
        <Route path="/" element={<Login onLoginSuccess={() => setIsLoggedIn(true)} />} />

        {/* Staff Routes */}
        <Route path="/attendance" element={isLoggedIn ? <Attendance /> : <Navigate to="/" />} />
        <Route path="/my-schedule" element={isLoggedIn ? <MySchedule /> : <Navigate to="/" />} />
        <Route path="/register-schedule" element={isLoggedIn ? <RegisterSchedule /> : <Navigate to="/" />} />
        <Route path="/my-salary" element={isLoggedIn ? <MySalary /> : <Navigate to="/" />} />
        <Route path="/leave-request" element={isLoggedIn ? <LeaveRequest /> : <Navigate to="/" />} />

        {/* Manager Routes - Kiểm tra trực tiếp hàm checkManager() */}
        <Route path="/admin/employees" element={isManager() ? <EmployeeManager /> : <Navigate to="/" />} />
        <Route path="/admin/position" element={isManager() ? <PositionManager /> : <Navigate to="/" />} />
        <Route path="/admin/shift" element={isManager() ? <ShiftManager /> : <Navigate to="/" />} />
        <Route path="/admin/schedules" element={isManager() ? <ScheduleApproval /> : <Navigate to="/" />} />
        <Route path="/admin/attendance" element={isManager() ? <AttendanceManager /> : <Navigate to="/" />} />
        <Route path="/admin/leave" element={isManager() ? <LeaveApproval /> : <Navigate to="/" />} />
        <Route path="/admin/reports" element={isManager() ? <PayrollReport /> : <Navigate to="/" />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;