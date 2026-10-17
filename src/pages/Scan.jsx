import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Scan = () => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const token = localStorage.getItem('teacherToken');
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');

  const schoolName = "Smart School";

  useEffect(() => {
    if (!token) navigate('/');
  }, [token, navigate]);

  useEffect(() => {
    if (!token) return;

    const timer = setTimeout(() => {
      if (scannerRef.current) scannerRef.current.clear().catch(e => console.log(e));

      const scanner = new Html5QrcodeScanner('reader', {
  qrbox: { width: 250, height: 250 },
  fps: 15,
  aspectRatio: 1.0,
  showTorchButtonIfSupported: true,
  // 👇 Ye line force karegi ke sirf Back Camera khule
  videoConstraints: {
    facingMode: { exact: "environment" } 
  }
});
      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          scanner.pause(true);
          handleScanSuccess(decodedText);
        },
        () => {} // Ignore camera errors
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) scannerRef.current.clear().catch(e => console.log(e));
    };
  }, [token]);

  const handleScanSuccess = async (decodedText) => {
    if (loading) return;
    setLoading(true);
    setError('');
    setScanResult(null);

    try {
      const response = await axios.post(
        'https://smart-attendance-backend-one.vercel.app/api/attendance/scan',
        { qrCode: decodedText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScanResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Attendance failed. Try again.');
      if (scannerRef.current) scannerRef.current.resume();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col pb-20">
      
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md text-white p-4 shadow-lg rounded-b-3xl flex justify-between items-center sticky top-0 z-20 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
            {schoolName.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">{schoolName}</h1>
            <p className="text-xs text-slate-400">Scan Student ID</p>
          </div>
        </div>
        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm shadow-inner text-slate-300">
           {teacherData.name?.charAt(0) || 'T'}
        </div>
      </header>

      {/* Main Scanner Area */}
      <main className="flex-1 p-4 flex flex-col items-center mt-4">
        <div className="w-full max-w-sm bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-700 relative">
          
          {/* Scanner View */}
          {!scanResult && (
            <div className="p-4 relative">
              
              {/* Custom Laser Line */}
              <div className="absolute top-6 left-6 right-6 h-1 bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.9)] animate-scanline z-20 pointer-events-none rounded-full"></div>
              
              {/* html5-qrcode yahan render hoga */}
              <div id="reader" className="w-full rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700"></div>
              
              <div className="mt-6 text-center">
                <p className="text-slate-300 text-sm font-medium flex items-center justify-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                  </span>
                  Align QR code within the frame
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-12 text-center animate-pulse">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-700 border-t-blue-500 mb-4"></div>
              <p className="text-blue-400 font-bold tracking-wider">MARKING ATTENDANCE...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-8 text-center animate-pop">
              <div className="text-5xl mb-4">⚠️</div>
              <div className="bg-red-900/30 text-red-400 p-4 rounded-xl border border-red-700/50 text-sm font-semibold mb-6">
                {error}
              </div>
              <button onClick={() => window.location.reload()} className="bg-slate-700 text-white px-6 py-3 rounded-xl font-bold w-full hover:bg-slate-600 transition">
                Try Again
              </button>
            </div>
          )}

          {/* Success State */}
          {scanResult && (
            <div className="p-8 text-center animate-pop">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-500/30">
                <span className="text-6xl">✅</span>
              </div>
              <h3 className="text-2xl font-extrabold text-emerald-400 mb-1">Attendance Marked!</h3>
              <p className="text-slate-400 text-sm mb-6">WhatsApp sent to parent.</p>
              
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-700 mb-8 shadow-inner">
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Student Name</p>
                <p className="text-white text-xl font-bold">{scanResult.studentName}</p>
                <div className="h-px bg-slate-800 my-3"></div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Roll Number</p>
                <p className="text-slate-200 text-lg font-semibold">{scanResult.rollNumber}</p>
                <div className="h-px bg-slate-800 my-3"></div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Time (24-Hour)</p>
                <p className="text-blue-400 text-lg font-bold">{scanResult.timeIn}</p>
              </div>
              
              <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-4 rounded-xl font-bold w-full shadow-lg shadow-blue-900/50 hover:bg-blue-500 transition text-lg">
                Scan Next Student
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full bg-slate-800 border-t border-slate-700 flex justify-around p-3 pb-safe z-20">
        <button onClick={() => navigate('/home')} className="flex flex-col items-center text-slate-500 hover:text-blue-500 transition-colors">
          <span className="text-2xl mb-1">🏠</span>
          <span className="text-[10px] font-bold tracking-wider">HOME</span>
        </button>
        <button className="flex flex-col items-center text-blue-500">
          <span className="text-2xl mb-1">📷</span>
          <span className="text-[10px] font-bold tracking-wider">SCAN</span>
        </button>
        <button onClick={() => { localStorage.clear(); navigate('/'); }} className="flex flex-col items-center text-slate-500 hover:text-red-400 transition-colors">
          <span className="text-2xl mb-1">🚪</span>
          <span className="text-[10px] font-bold tracking-wider">LOGOUT</span>
        </button>
      </nav>
    </div>
  );
};

export default Scan;