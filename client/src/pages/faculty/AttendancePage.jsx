import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  CheckSquare, Users, Save, CheckCircle2, XCircle, Clock, 
  Sparkles, Calendar, MapPin, ArrowLeft, AlertTriangle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyAttendancePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [todayClasses, setTodayClasses] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(searchParams.get('sessionId') || '');
  const [sessionDetails, setSessionDetails] = useState(null);
  const [roster, setRoster] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchTodayClasses();
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionRoster(selectedSessionId);
    }
  }, [selectedSessionId]);

  const fetchTodayClasses = async () => {
    try {
      const res = await api.get('/academic/timetable/today');
      const classes = res.data.timetable || [];
      setTodayClasses(classes);
      if (!selectedSessionId && classes.length > 0) {
        setSelectedSessionId(classes[0]._id || classes[0].sessionId);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load today’s schedule');
    }
  };

  const loadSessionRoster = async (sessionId) => {
    try {
      setLoading(true);
      const res = await api.get(`/academic/session/${sessionId}/roster`);
      const { session, students } = res.data;
      setSessionDetails(session);
      setRoster(students || []);

      // Populate current status
      const initialMap = {};
      students.forEach((item) => {
        initialMap[item.student._id] = item.todayStatus || 'PRESENT';
      });
      setAttendanceMap(initialMap);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load class roster');
    } finally {
      setLoading(false);
    }
  };

  const setAllStatus = (status) => {
    const updated = {};
    roster.forEach((item) => {
      updated[item.student._id] = status;
    });
    setAttendanceMap(updated);
    toast.success(`Marked all students as ${status}`);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    if (!selectedSessionId) return;

    try {
      setSubmitting(true);
      const records = Object.keys(attendanceMap).map((studentId) => ({
        studentId,
        status: attendanceMap[studentId]
      }));

      await api.post(`/academic/session/${selectedSessionId}/attendance`, {
        records,
        notes
      });

      toast.success('Attendance recorded and saved successfully!');
      loadSessionRoster(selectedSessionId);
      fetchTodayClasses();
    } catch (err) {
      toast.error(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const isCompleted = sessionDetails?.status === 'COMPLETED' || sessionDetails?.isFinalized;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/faculty/dashboard"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Take Class Attendance
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Select class session to automatically fetch registered student cohort
            </p>
          </div>
        </div>

        {/* Class Session Selector */}
        {todayClasses.length > 0 && (
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-gray-600 dark:text-gray-400">Class Session:</label>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 dark:text-white shadow-xs"
            >
              {todayClasses.map((cls) => (
                <option key={cls._id || cls.sessionId} value={cls._id || cls.sessionId}>
                  {cls.startTime} - {cls.endTime} | {cls.subject?.name} (Sec {cls.section})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {sessionDetails && (
        <form onSubmit={handleSaveAttendance} className="space-y-6">
          {/* Class Information Header Card */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {sessionDetails.department?.name || 'Computer Science & Engineering'} • Year {sessionDetails.year || 2}
                </span>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {sessionDetails.subject?.name} <span className="text-sm font-normal text-gray-400">({sessionDetails.subject?.code})</span>
                </h2>
              </div>

              <div className="flex items-center space-x-2">
                {isCompleted ? (
                  <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-full flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" />
                    Attendance Completed ✓
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-full flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-amber-600" />
                    Pending Submission
                  </span>
                )}
              </div>
            </div>

            {/* Session Metadata Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                <span className="text-gray-400 block font-medium">Date & Time</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  {new Date(sessionDetails.date).toLocaleDateString()} • {sessionDetails.startTime} - {sessionDetails.endTime}
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                <span className="text-gray-400 block font-medium">Section & Room</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                  Section {sessionDetails.section} • Room {sessionDetails.room || 'CSE-201'}
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                <span className="text-gray-400 block font-medium">Faculty Member</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 mt-0.5 block">
                  {sessionDetails.faculty?.firstName} {sessionDetails.faculty?.lastName}
                </span>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900/40 rounded-xl">
                <span className="text-gray-400 block font-medium">Registered Cohort</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                  {roster.length} Registered Students
                </span>
              </div>
            </div>
          </div>

          {/* Roster & Attendance Marking Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/30">
              <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
                <Users className="w-4 h-4 mr-2 text-indigo-600" />
                Registered Students ({roster.length} Total)
              </span>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setAllStatus('PRESENT')}
                  className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
                >
                  Mark All Present
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus('ABSENT')}
                  className="px-3 py-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-700 dark:text-red-300 text-xs font-bold rounded-lg border border-red-200 dark:border-red-800 transition-colors"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-gray-400">Loading student roster...</div>
            ) : roster.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
                  No students are registered for this subject.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No active enrollment records were found for {sessionDetails?.subject?.name} (Section {sessionDetails?.section}).
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3.5">Roll No</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Overall Attendance</th>
                      <th className="px-6 py-3.5 text-center">Today's Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {roster.map((item) => {
                      const st = item.student;
                      const currentStatus = attendanceMap[st._id] || 'PRESENT';
                      const isAtRisk = item.isAtRisk;

                      return (
                        <tr key={st._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                          <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-white">
                            {st.rollNumber}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                            {st.firstName} {st.lastName}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                              isAtRisk
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {item.overallAttendance}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex justify-center space-x-2">
                              {['PRESENT', 'ABSENT'].map((opt) => {
                                const isSelected = currentStatus === opt;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setAttendanceMap({ ...attendanceMap, [st._id]: opt })}
                                    className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all ${
                                      isSelected
                                        ? opt === 'PRESENT'
                                          ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                                          : 'bg-red-600 text-white shadow-sm ring-2 ring-red-600/30'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Saving will instantly recalculate attendance percentages for all students.
              </span>
              <button
                type="submit"
                disabled={submitting || loading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{submitting ? 'Saving...' : 'Save & Publish Attendance'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
