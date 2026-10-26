import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Scan from './pages/Scan';

// ✅ NAYA: Protected Route — token check karta hai
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('teacherToken');
  if (!token) return <Navigate to="/" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* ✅ Protected Routes */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/scan" 
          element={
            <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          } 
        />
        
        {/* ✅ NAYA: Admin Attendance Route (jo missing tha) */}
        <Route 
          path="/admin-attendance" 
          element={
            <ProtectedRoute>
              <Scan />
            </ProtectedRoute>
          } 
        />
        
        {/* Galat URL pe redirect */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;