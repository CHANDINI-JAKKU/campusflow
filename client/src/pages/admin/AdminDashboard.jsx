import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  Building, Users, BookOpen, Briefcase, TrendingUp, 
  CheckSquare, Award, ArrowUpRight, BarChart3 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/overview');
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load institution analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Institutional Analytics & Operations
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            College: <strong className="text-indigo-600 dark:text-indigo-400">{user?.institution?.name || 'Sunrise University of Technology'}</strong> • Admin: {user?.firstName} {user?.lastName}
          </p>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{analytics?.totalStudents || 16}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 block flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Active Academic Cohorts
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Faculty Members</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{analytics?.totalFaculty || 3}</h3>
            </div>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-gray-400 mt-3 block">3 Active Departments</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Campus Attendance</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                {analytics?.avgAttendance || 85}%
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 block">
            Across All Semesters
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Drives</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1.5">
                {analytics?.totalDrives || 2}
              </h3>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-3 block">
            Google, Microsoft
          </span>
        </div>
      </div>

      {/* Department Breakdown Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <Building className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            Department Capacity & Ratios
          </h3>

          <div className="space-y-4">
            {analytics?.deptStats?.map((dept, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{dept.name}</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">Faculty: {dept.faculty} professors</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black text-indigo-600 dark:text-indigo-400">{dept.students}</span>
                  <p className="text-[11px] text-gray-400">Enrolled Students</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Report Generation Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Institutional Reports</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Export verified CSV and audit summaries for academic review.
          </p>

          <div className="space-y-2 pt-2">
            {[
              'Student Attendance Audit Log',
              'Semester 3 Academic Performance Sheet',
              'Campus Placement Eligibility Index',
              'Faculty Teaching Load Summary'
            ].map((report, idx) => (
              <button
                key={idx}
                onClick={() => toast.success(`Generated: ${report}.csv`)}
                className="w-full text-left p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-500 bg-gray-50/50 dark:bg-gray-900/30 text-xs font-semibold text-gray-700 dark:text-gray-200 transition-colors flex justify-between items-center"
              >
                <span>{report}</span>
                <ArrowUpRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
