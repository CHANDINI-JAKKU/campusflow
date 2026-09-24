import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, AlertTriangle, CheckCircle2, Calendar, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentAttendancePage() {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/student/me');
      setAttendanceData(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-44 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const overall = attendanceData?.overall || 0;
  const isOverallAtRisk = overall < 75;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Tracking</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time subject-wise tracking with automated 75% early warning threshold calculation.
          </p>
        </div>

        {/* Overall Percentage Badge */}
        <div className={`px-4 py-2 rounded-2xl border flex items-center space-x-3 ${
          isOverallAtRisk 
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200' 
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
        }`}>
          <div>
            <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">Overall Attendance</p>
            <p className="text-xl font-black">{overall}%</p>
          </div>
          {isOverallAtRisk ? <AlertTriangle className="w-6 h-6 text-amber-600" /> : <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {attendanceData?.subjects?.map((sub) => {
          const isAtRisk = sub.isAtRisk;
          return (
            <div
              key={sub.subject?._id}
              className={`p-6 rounded-2xl border bg-white dark:bg-gray-800 shadow-sm transition-all duration-200 ${
                isAtRisk 
                  ? 'border-amber-300 dark:border-amber-700/80 ring-1 ring-amber-300 dark:ring-amber-700/40' 
                  : 'border-gray-100 dark:border-gray-700/80'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-md">
                    {sub.subject?.code}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2">
                    {sub.subject?.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-black ${isAtRisk ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {sub.percentage}%
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                    {sub.attended} / {sub.totalClasses} classes
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 w-full bg-gray-100 dark:bg-gray-700 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${isAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                ></div>
              </div>

              {/* Threshold Status & Warning Note */}
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/80 flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-2">
                <div className="flex items-center space-x-1.5">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Target:</span>
                  <span className="text-gray-500 dark:text-gray-400">75% Institutional Threshold</span>
                </div>

                {isAtRisk ? (
                  <span className="text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg font-bold flex items-center">
                    <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                    Need {sub.classesNeeded} more consecutive classes
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg font-bold flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Attendance Safe
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
