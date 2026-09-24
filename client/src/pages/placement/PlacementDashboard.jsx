import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  Briefcase, Building2, Users, Award, Plus, 
  TrendingUp, CheckCircle2, DollarSign, Clock 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlacementDashboard() {
  const { user } = useAuthStore();
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacementStats();
  }, []);

  const fetchPlacementStats = async () => {
    try {
      setLoading(true);
      const [drivesRes, appsRes] = await Promise.all([
        api.get('/placements/drives'),
        api.get('/placements/applications')
      ]);
      setDrives(drivesRes.data.drives || []);
      setApplications(appsRes.data.applications || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load placement stats');
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
            Training & Placement Cell (TPO)
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Officer: <strong className="text-indigo-600 dark:text-indigo-400">{user?.firstName} {user?.lastName}</strong> • Active Drives & Hiring Pipeline
          </p>
        </div>

        <button
          onClick={() => toast.success('Open New Job Drive Modal')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Launch Placement Drive</span>
        </button>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Job Drives</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{drives.length}</h3>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-3 block">Google, Microsoft, AWS</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Applications</p>
          <h3 className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-1.5">{applications.length || 1}</h3>
          <span className="text-xs text-gray-400 mt-3 block">From CSE & ECE Batches</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Highest Package</p>
          <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">32 LPA</h3>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 block">Google SDE Role</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Average Package</p>
          <h3 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1.5">21.3 LPA</h3>
          <span className="text-xs text-gray-400 mt-3 block">2026 Graduating Batch</span>
        </div>
      </div>

      {/* Drives and Applicant Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Current Active Drives</h3>

          <div className="space-y-4">
            {drives.map((d) => (
              <div key={d._id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                    {d.company?.name}
                  </span>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white mt-1.5">{d.role}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Min CGPA: {d.eligibility?.minCGPA} • Min Attendance: {d.eligibility?.minAttendance}% • Deadline: {new Date(d.applicationDeadline).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{d.package} LPA</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applicant Management */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Recent Student Applications</h3>
          <div className="space-y-3">
            {applications.length > 0 ? (
              applications.map((app) => (
                <div key={app._id} className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                  <p className="font-bold text-gray-900 dark:text-white">{app.student?.firstName} {app.student?.lastName}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px]">{app.drive?.role}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded font-bold">
                      {app.status}
                    </span>
                    <span className="text-[10px] text-gray-400">{new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">No applications received yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
