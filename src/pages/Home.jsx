import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Home = () => {
  const navigate = useNavigate();
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  const [profileData, setProfileData] = useState({ newUsername: '', currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  
  const token = localStorage.getItem('teacherToken');
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');
  const schoolName = "Smart School";
  const todayDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  useEffect(() => {
    if (!token) navigate('/');
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
  }, [token, navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const res = await axios.put('https://smart-attendance-backend-one.vercel.app/api/auth/update-profile', profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      localStorage.setItem('teacherData', JSON.stringify(res.data.teacher));
      
      setMsg({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => {
        setShowModal(false);
        window.location.reload(); 
      }, 1500);
      
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col pb-20 relative">
      
      {/* EDIT PROFILE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-2">Edit Profile</h3>
            <p className="text-sm text-slate-400 mb-6">Change username or password.</p>
            
            {msg.text && (
              <div className={`p-3 rounded-xl mb-4 text-sm font-bold text-center border ${msg.type === 'success' ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800' : 'bg-red-900/50 text-red-400 border-red-800'}`}>
                {msg.text}
              </div>
            )}
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">New Username</label>
                <input type="text" value={profileData.newUsername} onChange={(e) => setProfileData({...profileData, newUsername: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-white" placeholder="Leave blank to keep current" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">Current Password</label>
                <input type="password" value={profileData.currentPassword} onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-white" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-400 mb-2">New Password</label>
                <input type="password" value={profileData.newPassword} onChange={(e) => setProfileData({...profileData, newPassword: e.target.value})} className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 text-white" placeholder="Leave blank to keep current" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-700 text-white font-bold py-3 rounded-xl hover:bg-slate-600 transition">Cancel</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500 transition">Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="bg-slate-800 p-6 rounded-b-3xl shadow-lg border-b border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-900/50">
              {schoolName.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">{schoolName}</h1>
              <p className="text-sm text-blue-400 font-medium">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowModal(true)} className="text-slate-400 hover:text-blue-400 p-2" title="Edit Profile">
              ⚙️
            </button>
            <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 p-2" title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
        
        <div>
          <p className="text-slate-400 text-sm">Welcome back,</p>
          <h2 className="text-2xl font-bold text-white">{teacherData.name === 'Sir Bilal' ? 'Sir Sarkar' : (teacherData.name || 'Sir Sarkar')}</h2>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-lg">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Today's Date</p>
            <p className="text-white font-bold text-sm">{todayDate}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl shadow-lg shadow-blue-900/30 border border-blue-500/30">
            <p className="text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">Present Today</p>
            <p className="text-white font-extrabold text-3xl">{loading ? '-' : todayCount}</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-3xl p-6 border border-slate-700 shadow-xl text-center mb-8">
          <div className="h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
             <span className="text-4xl text-blue-400">📷</span>
          </div>
          <h3 className="text-white font-bold text-xl mb-2">Scan Student ID</h3>
          <p className="text-slate-400 text-sm mb-6">Scan the QR code on the student's ID card to mark their attendance.</p>
          
          <button 
            onClick={() => navigate('/scan')}
            className="w-full bg-blue-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-blue-500 transition duration-200 shadow-lg shadow-blue-900/50 flex items-center justify-center gap-3 text-lg"
          >
            <span>Start Scanning</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </div>

        <div className="bg-slate-800/50 p-5 rounded-2xl border border-slate-700/50">
          <h4 className="text-slate-300 font-bold mb-3 text-sm">Quick Instructions:</h4>
          <ul className="text-slate-400 text-sm space-y-2">
            <li className="flex items-start gap-2"><span className="text-blue-500">1.</span> Ensure the student's ID card is clean and not damaged.</li>
            <li className="flex items-start gap-2"><span className="text-blue-500">2.</span> Hold the phone steady while scanning.</li>
            <li className="flex items-start gap-2"><span className="text-blue-500">3.</span> A green checkmark means attendance was marked successfully.</li>
          </ul>
        </div>
      </main>

      <nav className="fixed bottom-0 w-full bg-slate-800 border-t border-slate-700 flex justify-around p-3 pb-safe z-20">
        <button className="flex flex-col items-center text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
          <span className="text-[10px] font-bold tracking-wider">HOME</span>
        </button>
        <button onClick={() => navigate('/scan')} className="flex flex-col items-center text-slate-500 hover:text-blue-500 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
          <span className="text-[10px] font-bold tracking-wider">SCAN</span>
        </button>
      </nav>
    </div>
  );
};

export default Home;