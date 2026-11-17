import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const ManualAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const initialClass = queryParams.get('class') || '';

  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [students, setStudents] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('list');

  const token = localStorage.getItem('teacherToken');
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');

  const fetchStudentsByClass = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await axios.get(`https://smart-attendance-backend-one.vercel.app/api/attendance/students-by-class?className=${selectedClass}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(res.data.students);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to load students.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedClass) fetchStudentsByClass();
  }, [selectedClass]);

  const handleMarkAttendance = async (studentId, studentName) => {
    if (!window.confirm(`Mark ${studentName} as present?`)) return;
    
    setMarking(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await axios.post('https://smart-attendance-backend-one.vercel.app/api/attendance/manual-mark', 
        { studentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setMsg({ type: 'success', text: `✅ ${studentName} marked ${res.data.status.toUpperCase()} at ${res.data.timeIn}` });
      
      if (activeTab === 'list') {
        setStudents(prev => prev.map(s => 
          s._id === studentId ? { ...s, attendanceStatus: res.data.status, attendanceTime: res.data.timeIn } : s
        ));
      } else {
        setSearchResults(prev => prev.map(s => 
          s._id === studentId ? { ...s, attendanceStatus: res.data.status, attendanceTime: res.data.timeIn } : s
        ));
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to mark attendance.' });
    } finally {
      setMarking(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await axios.get(`https://smart-attendance-backend-one.vercel.app/api/attendance/search-student?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSearchResults(res.data.students);
      if (res.data.students.length === 0) {
        setMsg({ type: 'error', text: 'No student found with this name or roll number.' });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Search failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col pb-20 text-white">
      
      <header className="bg-[#121212] p-4 shadow-md border-b border-red-900/30 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/home')} className="text-slate-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div>
            <h1 className="text-sm font-bold">Manual Attendance</h1>
            <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Mark without ID card</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-3 space-y-3">
        
        <div className="bg-[#121212] p-3 rounded-xl border border-red-900/20">
          <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select Class</label>
          <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            disabled={!!teacherData.assignedClass}
            className={`w-full px-3 py-2 bg-[#0a0a0a] border border-red-900/30 text-white rounded-lg font-bold text-center text-xs ${
              teacherData.assignedClass ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            <option value="">-- Select Class --</option>
            <option value="1">Class 1</option>
            <option value="2">Class 2</option>
            <option value="3">Class 3</option>
            <option value="4">Class 4</option>
            <option value="5">Class 5</option>
            <option value="6">Class 6</option>
            <option value="7">Class 7</option>
            <option value="8">Class 8</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
          </select>
        </div>

        <div className="flex bg-[#121212] p-1 rounded-xl border border-red-900/20">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'list' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            📋 Class List
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all ${
              activeTab === 'search' ? 'bg-red-600 text-white shadow-md' : 'text-slate-400'
            }`}
          >
            🔍 Search
          </button>
        </div>

        {msg.text && (
          <div className={`p-2.5 rounded-lg text-[10px] font-bold border ${
            msg.type === 'success' ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/30' : 'bg-red-900/20 text-red-400 border-red-900/30'
          }`}>
            {msg.text}
          </div>
        )}

        {activeTab === 'list' && (
          <div className="space-y-2">
            {!selectedClass ? (
              <p className="text-center text-slate-500 py-8 text-xs">Please select a class first.</p>
            ) : loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
              </div>
            ) : students.length === 0 ? (
              <p className="text-center text-slate-500 py-8 text-xs">No students in this class.</p>
            ) : (
              students.map(student => (
                <div key={student._id} className="bg-[#121212] p-2.5 rounded-xl border border-red-900/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-red-900/30 text-red-500 flex items-center justify-center font-bold overflow-hidden text-xs">
                      {student.profilePicture ? (
                        <img src={student.profilePicture} alt={student.name} className="h-full w-full object-cover" />
                      ) : (
                        student.name.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold text-xs">{student.name}</p>
                      <p className="text-[9px] text-slate-400">Roll: {student.rollNumber}</p>
                    </div>
                  </div>
                  
                  {student.attendanceStatus ? (
                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${
                      student.attendanceStatus === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      student.attendanceStatus === 'late' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {student.attendanceStatus === 'present' ? '🟢' : student.attendanceStatus === 'late' ? '🟡' : '🔴'} {student.attendanceStatus}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkAttendance(student._id, student.name)}
                      disabled={marking}
                      className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                    >
                      ✅ Mark
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'search' && (
          <div>
            <form onSubmit={handleSearch} className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Roll No or Name..."
                className="flex-1 px-3 py-2 bg-[#121212] border border-red-900/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-xs"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition text-xs"
              >
                🔍
              </button>
            </form>

            <div className="space-y-2">
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-xs">Search for a student to mark attendance.</p>
              ) : (
                searchResults.map(student => (
                  <div key={student._id} className="bg-[#121212] p-2.5 rounded-xl border border-red-900/20 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-red-900/30 text-red-500 flex items-center justify-center font-bold overflow-hidden text-xs">
                        {student.profilePicture ? (
                          <img src={student.profilePicture} alt={student.name} className="h-full w-full object-cover" />
                        ) : (
                          student.name.charAt(0)
                        )}
                      </div>
                      <div>
                        <p className="text-white font-bold text-xs">{student.name}</p>
                        <p className="text-[9px] text-slate-400">Roll: {student.rollNumber} | {student.className}</p>
                      </div>
                    </div>
                    
                    {student.attendanceStatus ? (
                      <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${
                        student.attendanceStatus === 'present' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        student.attendanceStatus === 'late' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {student.attendanceStatus === 'present' ? '🟢' : student.attendanceStatus === 'late' ? '🟡' : '🔴'} {student.attendanceStatus}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleMarkAttendance(student._id, student.name)}
                        disabled={marking}
                        className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-emerald-700 transition flex items-center gap-1"
                      >
                        ✅ Mark
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManualAttendance;