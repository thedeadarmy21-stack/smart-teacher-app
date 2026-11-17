import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Scan = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  const scannerRef = useRef(null);
  
  const token = localStorage.getItem('teacherToken');
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');
  const role = teacherData.role || 'teacher';

  const queryParams = new URLSearchParams(location.search);
  const targetClass = queryParams.get('class'); 

  useEffect(() => {
    if (!token) navigate('/');
    if (!targetClass && role !== 'admin') {
      alert("No class selected. Redirecting to home.");
      navigate('/home');
    }
    
    const fetchCount = async () => {
      try {
        const url = role === 'admin' 
          ? 'https://smart-attendance-backend-one.vercel.app/api/teacher-attendance/today' 
          : 'https://smart-attendance-backend-one.vercel.app/api/attendance/today';
        
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTodayCount(res.data.count || 0);
      } catch (err) {
        console.log('Count error');
      }
    };
    fetchCount();
  }, [token, navigate, targetClass, role]);

  const startScanner = async () => {
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
          scannerRef.current.clear();
        } catch (e) {}
      }

      const scanner = new Html5Qrcode("reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" }, 
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }, 
        },
        (decodedText) => {
          if (scannerRef.current) {
             scannerRef.current.stop().then(() => {
               scannerRef.current.clear();
               handleScanSuccess(decodedText);
             }).catch((err) => console.error("Stop error:", err));
          }
        },
        (errorMessage) => {}
      ).catch((err) => {
        console.error("Camera Start Error:", err);
        setError("Camera start nahi ho raha. Permission check karein.");
      });

    } catch (err) {
      console.error("Scanner Init Error:", err);
      setError("Scanner initialize nahi ho raha.");
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (loading) return;
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const url = role === 'admin'
        ? 'https://smart-attendance-backend-one.vercel.app/api/teacher-attendance/scan'
        : 'https://smart-attendance-backend-one.vercel.app/api/attendance/scan';
      
      const body = role === 'admin'
        ? { qrCode: decodedText }
        : { qrCode: decodedText, targetClass: targetClass };

      const response = await axios.post(url, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScanResult({
        name: response.data.teacherName || response.data.studentName,
        rollNumber: response.data.rollNumber || 'N/A',
        timeIn: response.data.timeIn,
        type: role === 'admin' ? 'Teacher' : 'Student'
      });
      setTodayCount(prev => prev + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Attendance failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setLoading(false);
    setTimeout(() => {
      startScanner();
    }, 300);
  };

  useEffect(() => {
    if (!token) return;
    if (role !== 'admin' && !targetClass) return;
    
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(() => {});
        } catch(e) {}
      }
    };
  }, [token, targetClass, role]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-20 text-white">
      
      {/* Header */}
      <header className="bg-[#121212] p-4 shadow-md border-b border-red-900/30 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold border border-red-500/30 text-sm">
            {role === 'admin' ? 'A' : 'T'}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">
              {role === 'admin' ? 'Teacher Attendance' : 'Smart School'}
            </h1>
            <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
              {role === 'admin' ? 'Scanning Teachers' : `Class ${targetClass}`}
            </p>
          </div>
        </div>
        
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 font-bold text-[10px]">{todayCount} Present</span>
        </div>
      </header>

      <main className="flex-1 p-3 flex flex-col items-center mt-2">
        <div className="w-full max-w-sm bg-[#121212] rounded-2xl shadow-xl overflow-hidden border border-red-900/30 relative">
          
          <div className={`p-3 relative ${scanResult || loading || error ? 'hidden' : 'block'}`}>
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.9)] animate-scanline z-20 pointer-events-none rounded-full"></div>
            <div id="reader" className="w-full rounded-xl overflow-hidden bg-black border border-red-900/30 min-h-[220px]"></div>
            <div className="mt-4 text-center">
              <p className="text-slate-400 text-[10px] font-medium flex items-center justify-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Align QR code within the frame
              </p>
            </div>
          </div>

          {loading && (
            <div className="p-10 text-center animate-pulse">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-red-900 border-t-red-500 mb-3"></div>
              <p className="text-red-500 font-bold tracking-wider text-xs">MARKING ATTENDANCE...</p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center animate-pop">
              <div className="text-4xl mb-2">⚠️</div>
              <div className="bg-red-900/20 text-red-400 p-3 rounded-xl border border-red-900/30 text-xs font-semibold mb-4">
                {error}
              </div>
              <button onClick={resetScanner} className="bg-red-600 text-white px-4 py-2.5 rounded-lg font-bold w-full hover:bg-red-700 transition text-xs">
                Try Again
              </button>
            </div>
          )}

          {scanResult && (
            <div className="p-6 text-center animate-pop">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-emerald-500/30">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-lg font-extrabold text-emerald-400 mb-1">Attendance Marked!</h3>
              <p className="text-slate-400 text-[10px] mb-4">Saved successfully.</p>
              
              <div className="bg-[#0a0a0a] p-3 rounded-xl border border-red-900/20 mb-5 text-left">
                <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-0.5">{scanResult.type} Name</p>
                <p className="text-white text-sm font-bold mb-2">{scanResult.name}</p>
                {scanResult.rollNumber !== 'N/A' && (
                  <>
                    <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-0.5">Roll Number</p>
                    <p className="text-slate-300 text-xs font-semibold mb-2">{scanResult.rollNumber}</p>
                  </>
                )}
                <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-0.5">Time In</p>
                <p className="text-red-400 text-sm font-bold">{scanResult.timeIn}</p>
              </div>
              
              <button onClick={resetScanner} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold w-full hover:bg-red-700 transition text-sm flex items-center justify-center gap-2">
                <span>📷</span> Scan Next
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full bg-[#121212] border-t border-red-900/30 flex justify-around p-3 pb-safe z-20">
        <button onClick={() => navigate(role === 'admin' ? '/admin-attendance' : '/home')} className="flex flex-col items-center text-slate-500 hover:text-white transition-colors">
          <span className="text-xl mb-0.5">🏠</span>
          <span className="text-[9px] font-bold tracking-wider">HOME</span>
        </button>
        <button className="flex flex-col items-center text-red-500">
          <span className="text-xl mb-0.5">📷</span>
          <span className="text-[9px] font-bold tracking-wider">SCAN</span>
        </button>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex flex-col items-center text-slate-500 hover:text-red-400 transition-colors">
          <span className="text-xl mb-0.5">🚪</span>
          <span className="text-[9px] font-bold tracking-wider">LOGOUT</span>
        </button>
      </nav>
    </div>
  );
};

export default Scan;