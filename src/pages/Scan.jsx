import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Scan = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  
  const [isScanning, setIsScanning] = useState(false);
  const [adminScanType, setAdminScanType] = useState('teacher'); 

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
        let url = 'https://smart-attendance-backend-one.vercel.app/api/attendance/today';
        
        if (role === 'admin') {
          url = adminScanType === 'teacher' 
            ? 'https://smart-attendance-backend-one.vercel.app/api/teacher-attendance/today' 
            : 'https://smart-attendance-backend-one.vercel.app/api/attendance/today';
        }
        
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTodayCount(res.data.count || 0);
      } catch (err) {
        console.log('Count error');
      }
    };
    fetchCount();
  }, [token, navigate, targetClass, role, adminScanType]);

  const startScanner = async () => {
    setError('');
    setIsScanning(true);
    
    // 🚀 FIX: Thoda wait karein taake 'reader' div render ho jaye
    setTimeout(async () => {
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
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (scannerRef.current) {
               scannerRef.current.stop().then(() => {
                 scannerRef.current.clear();
                 setIsScanning(false);
                 handleScanSuccess(decodedText);
               }).catch((err) => console.error("Stop error:", err));
            }
          },
          (errorMessage) => {}
        ).catch((err) => {
          setError("Camera start nahi ho raha. Permission check karein.");
          setIsScanning(false);
        });

      } catch (err) {
        setError("Scanner initialize nahi ho raha.");
        setIsScanning(false);
      }
    }, 300);
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.stop().then(() => {
          if (scannerRef.current) {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
          setIsScanning(false);
        }).catch((err) => console.error("Stop error:", err));
      } catch(e) {}
    } else {
      setIsScanning(false);
    }
  };

  const handleScanSuccess = async (decodedText) => {
    if (loading) return;
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      let url = '';
      let body = {};

      if (role === 'admin') {
        url = adminScanType === 'teacher'
          ? 'https://smart-attendance-backend-one.vercel.app/api/teacher-attendance/scan'
          : 'https://smart-attendance-backend-one.vercel.app/api/attendance/admin-scan';
        body = { qrCode: decodedText };
      } else {
        url = 'https://smart-attendance-backend-one.vercel.app/api/attendance/scan';
        body = { qrCode: decodedText, targetClass: targetClass };
      }

      const response = await axios.post(url, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setScanResult({
        name: response.data.teacherName || response.data.studentName,
        rollNumber: response.data.rollNumber || 'N/A',
        timeIn: response.data.timeIn,
        type: role === 'admin' ? adminScanType.toUpperCase() : 'Student'
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
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-20 text-white">
      <header className="bg-[#121212] p-4 shadow-md border-b border-red-900/30 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 font-bold border border-red-500/30 text-sm">
            {role === 'admin' ? 'A' : 'T'}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">
              {role === 'admin' ? 'Admin Attendance' : 'Smart School'}
            </h1>
            <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">
              {role === 'admin' 
                ? `Scanning ${adminScanType === 'teacher' ? 'Teachers' : 'Students'}` 
                : `Class ${targetClass}`}
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

      {/* Admin ke liye Toggle */}
      {role === 'admin' && !isScanning && !scanResult && (
        <div className="p-3 flex justify-center">
          <div className="flex bg-[#121212] p-1 rounded-xl border border-red-900/30 w-full max-w-xs">
            <button
              onClick={() => { setAdminScanType('teacher'); setScanResult(null); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                adminScanType === 'teacher' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              👨‍🏫 Teacher
            </button>
            <button
              onClick={() => { setAdminScanType('student'); setScanResult(null); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                adminScanType === 'student' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-400'
              }`}
            >
              🎓 Student
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 p-3 flex flex-col items-center mt-2">
        
        {/* Start Button (Jab scan band ho) */}
        {!isScanning && !scanResult && !loading && (
          <div className="w-full max-w-sm text-center mt-6">
            {/* 🚀 PREMIUM ICON: Purane camera ki jagah modern QR icon */}
            <div className="h-28 w-28 bg-gradient-to-br from-red-900/40 to-[#121212] rounded-full flex items-center justify-center mx-auto mb-6 border border-red-900/50 shadow-[0_0_30px_rgba(153,27,27,0.3)]">
              <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2 tracking-tight">Ready to Scan</h2>
            <p className="text-slate-400 text-[11px] mb-8 px-4">Click the button below to open the camera and scan the QR code.</p>
            <button 
              onClick={startScanner}
              className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-900/30 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              Start Scanning
            </button>
          </div>
        )}

        {/* Scanner Area */}
        {isScanning && (
          <div className="w-full max-w-sm bg-[#121212] rounded-2xl shadow-xl overflow-hidden border border-red-900/30 relative">
            <div className="p-3 relative">
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
          </div>
        )}

        {/* Cancel Button */}
        {isScanning && (
          <button
            onClick={stopScanner}
            className="mt-4 w-full max-w-sm bg-red-100/10 text-red-400 font-bold py-3.5 rounded-xl hover:bg-red-600 hover:text-white transition text-sm flex items-center justify-center gap-2 border border-red-900/30"
          >
            ❌ Cancel Scanning
          </button>
        )}

        {loading && (
          <div className="p-10 text-center animate-pulse mt-4">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-red-900 border-t-red-500 mb-3"></div>
            <p className="text-red-500 font-bold tracking-wider text-xs">MARKING ATTENDANCE...</p>
          </div>
        )}

        {error && (
          <div className="w-full max-w-sm p-6 text-center animate-pop bg-[#121212] rounded-2xl border border-red-900/30 mt-4">
            <div className="text-4xl mb-2">⚠️</div>
            <div className="bg-red-900/20 text-red-400 p-3 rounded-xl border border-red-900/30 text-xs font-semibold mb-4">
              {error}
            </div>
            <button onClick={resetScanner} className="bg-red-600 text-white px-4 py-3 rounded-lg font-bold w-full hover:bg-red-700 transition text-xs">
              Try Again
            </button>
          </div>
        )}

        {scanResult && (
          <div className="w-full max-w-sm p-6 text-center animate-pop bg-[#121212] rounded-2xl border border-red-900/30 mt-4">
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