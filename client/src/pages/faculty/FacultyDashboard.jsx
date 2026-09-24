import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  BookOpen, Users, CheckSquare, Sparkles, Clock, 
  AlertTriangle, ArrowRight, CheckCircle2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function FacultyDashboard() {
  const { user } = useAuthStore();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFacultyData();
  }, []);

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load faculty subjects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Faculty Portal — {user?.firstName} {user?.lastName} 👨‍🏫
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Department: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.department?.name || 'Computer Science & Engineering'}</span> • Employee ID: {user?.employeeId || 'FAC-CSE-001'}
          </p>
        </div>

        <Link
          to="/faculty/attendance"
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-2"
        >
          <CheckSquare className="w-4 h-4" />
          <span>Mark Class Attendance</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Courses</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{subjects.length || 2}</h3>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-2 block">B.Tech Semester 3</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Enrolled Students</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">16</h3>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-2 block">Section A (CSE)</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pending Grading</p>
          <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">1</h3>
          <span className="text-xs text-gray-400 mt-2 block">DBMS Assignment 1</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance Health</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">79%</h3>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2 block">1 Student &lt; 75%</span>
        </div>
      </div>

      {/* Main Grid: My Subjects & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">My Assigned Subjects</h3>

            <div className="space-y-4">
              {subjects.map((sub) => (
                <div
                  key={sub._id}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-700/80 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                      {sub.code}
                    </span>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1.5">{sub.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {sub.course?.name || 'B.Tech CSE'} • {sub.credits} Credits • Max Marks: {sub.maxInternalMarks + sub.maxExternalMarks}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to="/faculty/attendance"
                      className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 text-xs font-bold rounded-lg text-gray-700 dark:text-gray-200 transition-colors"
                    >
                      Attendance
                    </Link>
                    <Link
                      to="/faculty/assignments"
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-lg text-white transition-colors"
                    >
                      Assignments
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Faculty Intervention Card */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 text-white shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-indigo-200 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-indigo-300" />
              <span>AI Student Intervention</span>
            </div>

            <h4 className="text-lg font-bold">At-Risk Student Detected</h4>
            <p className="text-xs text-indigo-100 leading-relaxed">
              <strong>Alex Morgan (CS202601)</strong> attendance in CS201 DBMS has fallen to <strong>60%</strong>. AI recommends scheduling a brief 1-on-1 counseling session before mid-terms.
            </p>

            <button
              onClick={() => toast.success('Advisory alert forwarded to department counselor')}
              className="w-full py-2 bg-white text-indigo-900 text-xs font-bold rounded-xl hover:bg-indigo-50 transition-colors"
            >
              Send Attendance Warning Notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
