import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState('teacher'); 
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('https://smart-attendance-backend-one.vercel.app/api/auth/login', {
        username,
        password,
      });

      const { token, teacher } = response.data;

      if (loginType === 'admin' && teacher.role !== 'admin') {
        throw new Error('Access denied. Only admin can login here.');
      }
      if (loginType === 'teacher' && teacher.role === 'admin') {
        throw new Error('This is a teacher portal. Admin should use Admin Panel.');
      }

      localStorage.setItem('teacherToken', token);
      localStorage.setItem('teacherData', JSON.stringify(teacher));

      if (teacher.role === 'admin') {
        navigate('/admin-attendance');
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="bg-[#121212] p-6 rounded-3xl shadow-2xl w-full max-w-sm border border-red-900/30 relative overflow-hidden">
        
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        {/* Logo & School Name */}
        <div className="text-center mb-8 relative z-10">
          <div className="h-20 w-20 mx-auto mb-4 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg">
            <img src="/logo.png" alt="School Logo" className="h-full w-full object-contain" />
          </div>
          <h2 className="text-base font-extrabold text-white tracking-tight leading-tight uppercase">The Pacific Cambridge School</h2>
          <p className="text-slate-400 text-xs mt-1">Teacher / Admin Portal</p>
        </div>

        {/* Toggle Button */}
        <div className="flex bg-[#0a0a0a] p-1 rounded-xl mb-6 border border-slate-800 relative z-10">
          <button
            onClick={() => setLoginType('teacher')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              loginType === 'teacher' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            👨‍🏫 Teacher
          </button>
          <button
            onClick={() => setLoginType('admin')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              loginType === 'admin' ? 'bg-red-700 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            👑 Admin
          </button>
        </div>

        {error && <div className="bg-red-500/10 text-red-400 p-2.5 rounded-lg mb-4 text-xs font-semibold text-center border border-red-500/20 relative z-10">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          <div>
            <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-slate-400 text-xs font-bold mb-1.5 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0a] border border-slate-800 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 transition text-sm"
              placeholder="Enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-bold py-3.5 px-4 rounded-xl transition duration-200 mt-2 bg-red-600 hover:bg-red-700 text-sm shadow-lg shadow-red-900/20"
          >
            {loading ? 'Logging in...' : `Login as ${loginType === 'admin' ? 'Admin' : 'Teacher'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;