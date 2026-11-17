import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('');
  const [classes, setClasses] = useState([]);
  
  const token = localStorage.getItem('teacherToken');
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');
  const schoolName = 'THE PACIFIC CAMBRIDGE SCHOOL'; 
  const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }
    if (teacherData.role === 'admin') {
      navigate('/admin-attendance');
      return;
    }
    if (teacherData.assignedClass) {
      setSelectedClass(teacherData.assignedClass);
    }

    const fetchClasses = async () => {
      try {
        const res = await axios.get('https://smart-attendance-backend-one.vercel.app/api/auth/classes', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setClasses(res.data.classes);
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchClasses();

    const fetchTodayAttendance = async () => {
      try {
        const res = await axios.get('https://smart-attendance-backend-one.vercel.app/api/attendance/today', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTodayCount(res.data.count);
      } catch (err) {
        console.log('Error fetching count');
      } finally {
        setLoading(false);
      }
    };
    fetchTodayAttendance();
  }, [token, navigate, teacherData.role, teacherData.assignedClass]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleStartScan = () => {
    if (!selectedClass) return alert("Please select a class first!");
    navigate(`/scan?class=${selectedClass}`);
  };

  const handleManualAttendance = () => {
    if (!selectedClass) return alert("Please select a class first!");
    navigate(`/manual-attendance?class=${selectedClass}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-20 relative text-white">
      
      {/* Header */}
      <header className="bg-[#121212] p-5 rounded-b-3xl shadow-lg border-b border-red-900/30">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center p-1 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-wide truncate max-w-[180px] leading-tight">{schoolName}</h1>
              <p className="text-[10px] text-red-500 font-bold mt-0.5 tracking-wider uppercase">Teacher Dashboard</p>
            </div>
          </div>
          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 p-2 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
        
        <div>
          <p className="text-slate-400 text-xs">Welcome back,</p>
          <h2 className="text-xl font-extrabold">{teacherData.name || 'Teacher'}</h2>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#121212] p-4 rounded-2xl border border-red-900/20 shadow-md">
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mb-1">Today's Date</p>
            <p className="text-white font-bold text-xs">{todayDate}</p>
          </div>
          <div className="bg-gradient-to-br from-[#5c0000] to-[#991b1b] p-4 rounded-2xl shadow-md border border-red-900/50">
            <p className="text-red-200 text-[9px] font-bold uppercase tracking-wider mb-1">Present Today</p>
            <p className="text-white font-extrabold text-2xl">{loading ? '-' : todayCount}</p>
          </div>
        </div>

        {/* Class Selection */}
        <div className="bg-[#121212] rounded-2xl p-4 border border-red-900/20 shadow-md">
          <h3 className="text-white font-bold text-sm mb-2">Select Class</h3>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!!teacherData.assignedClass}
            className={`w-full px-3 py-2.5 bg-[#0a0a0a] border border-red-900/30 text-white rounded-xl focus:ring-2 focus:ring-red-500 font-bold text-center text-xs appearance-none ${
              teacherData.assignedClass ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls, idx) => (
              <option key={idx} value={cls}>{cls}</option>
            ))}
          </select>
          {teacherData.assignedClass && (
            <p className="text-[9px] text-red-400 mt-2 font-bold text-center">🔒 Class locked by Admin</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-3">
          
          <div className="bg-[#121212] rounded-2xl p-4 border border-red-900/20 shadow-md flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm mb-1">Scan QR Code</h3>
              <p className="text-slate-400 text-[10px]">Scan student ID for attendance.</p>
            </div>
            <button 
              onClick={handleStartScan}
              className="bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-1.5 text-xs shadow-md"
            >
              📷 Scan
            </button>
          </div>

          <div className="bg-[#121212] rounded-2xl p-4 border border-red-900/20 shadow-md flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm mb-1">Manual Entry</h3>
              <p className="text-slate-400 text-[10px]">Mark attendance manually.</p>
            </div>
            <button 
              onClick={handleManualAttendance}
              className="bg-emerald-600 text-white font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 text-xs shadow-md"
            >
              ✍️ Manual
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-[#121212] border-t border-red-900/30 flex justify-around p-3 pb-safe z-20">
        <button className="flex flex-col items-center text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[9px] font-bold tracking-wider">HOME</span>
        </button>
        <button onClick={handleStartScan} className="flex flex-col items-center text-slate-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          <span className="text-[9px] font-bold tracking-wider">SCAN</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;