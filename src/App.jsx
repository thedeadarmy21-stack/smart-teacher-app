import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Scan from './pages/Scan';
import ManualAttendance from './pages/ManualAttendance'; 
import TodayAttendance from './pages/TodayAttendance'; // Agar yeh file exist karti hai toh
import TeacherProfile from './pages/TeacherProfile'; // Profile file add ki

// ✅ Admin Only Protected Route
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('teacherToken');
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');
  
  if (!token) return <Navigate to="/" replace />;
  if (teacherData.role !== 'admin') return <Navigate to="/home" replace />;
  return children;
};

// ✅ Teacher Only Protected Route
const TeacherRoute = ({ children }) => {
  const token = localStorage.getItem('teacherToken');
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');
  
  if (!token) return <Navigate to="/" replace />;
  if (teacherData.role === 'admin') return <Navigate to="/admin-attendance" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* Teacher Routes */}
        <Route path="/home" element={<TeacherRoute><Home /></TeacherRoute>} />
        <Route path="/scan" element={<TeacherRoute><Scan /></TeacherRoute>} />
        <Route path="/manual-attendance" element={<TeacherRoute><ManualAttendance /></TeacherRoute>} />
        <Route path="/today-attendance" element={<TeacherRoute><TodayAttendance /></TeacherRoute>} />
        <Route path="/profile" element={<TeacherRoute><TeacherProfile /></TeacherRoute>} /> {/* Profile Route */}
        
        {/* Admin Route */}
        <Route path="/admin-attendance" element={<AdminRoute><Scan /></AdminRoute>} />
        
        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;