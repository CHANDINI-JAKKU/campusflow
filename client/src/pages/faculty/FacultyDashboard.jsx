import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  BookOpen, Users, CheckSquare, Sparkles, Clock, 
  AlertTriangle, ArrowRight, CheckCircle2, Calendar, 
  MapPin, Edit3, Award, Plus, Eye, Save, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function FacultyDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [weeklyTimetable, setWeeklyTimetable] = useState([]);
  const [activeTab, setActiveTab] = useState('TODAY'); // TODAY, TIMETABLE, MARKS

  // Enter Marks Modal State
  const [marksModalSession, setMarksModalSession] = useState(null);
  const [assessmentType, setAssessmentType] = useState('INTERNAL');
  const [maxMarks, setMaxMarks] = useState(30);
  const [marksRoster, setMarksRoster] = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [savingMarks, setSavingMarks] = useState(false);

  useEffect(() => {
    fetchFacultyDashboard();
  }, []);

  const fetchFacultyDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, ttRes] = await Promise.allSettled([
        api.get('/academic/faculty/dashboard-stats'),
        api.get('/academic/timetable')
      ]);

      if (statsRes.status === 'fulfilled') setStatsData(statsRes.value.data);
      if (ttRes.status === 'fulfilled') setWeeklyTimetable(ttRes.value.data?.timetable || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load faculty dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMarksModal = async (session) => {
    try {
      setMarksModalSession(session);
      setLoadingRoster(true);
      const res = await api.get(`/academic/session/${session._id || session.sessionId}/roster`);
      const students = res.data.students || [];
      setMarksRoster(
        students.map((st) => ({
          studentId: st.student._id,
          firstName: st.student.firstName,
          lastName: st.student.lastName,
          rollNumber: st.student.rollNumber,
          marks: 25 // default sensible score
        }))
      );
    } catch (err) {
      console.error(err);
      toast.error('Failed to load registered student roster');
    } finally {
      setLoadingRoster(false);
    }
  };

  const handleSaveMarks = async (e) => {
    e.preventDefault();
    if (!marksModalSession) return;
    try {
      setSavingMarks(true);
      await api.post(`/academic/session/${marksModalSession._id || marksModalSession.sessionId}/marks`, {
        assessmentType,
        maxMarks: Number(maxMarks),
        marksRecords: marksRoster.map(m => ({ studentId: m.studentId, marks: Number(m.marks) }))
      });
      toast.success(`${assessmentType} marks saved for all ${marksRoster.length} students!`);
      setMarksModalSession(null);
    } catch (err) {
      toast.error(err.message || 'Failed to save marks');
    } finally {
      setSavingMarks(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
      </div>
    );
  }

  const todayClasses = statsData?.todayClasses || [];
  const totalStudents = statsData?.totalStudents || 0;
  const attendancePending = statsData?.attendancePending || 0;
  const attendanceCompleted = statsData?.attendanceCompleted || 0;
  const weeklyClassCount = statsData?.weeklyClassCount || weeklyTimetable.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Faculty Portal — {user?.firstName} {user?.lastName} 👨‍🏫
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Department: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.department?.name || 'Computer Science & Engineering'}</span> • Employee ID: {user?.employeeId || 'FAC-CSE-001'}
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('TODAY')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'TODAY'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            Today's Classes ({todayClasses.length})
          </button>
          <button
            onClick={() => setActiveTab('TIMETABLE')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'TIMETABLE'
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
            }`}
          >
            My Weekly Timetable
          </button>
        </div>
      </div>

      {/* Top 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Today's Classes</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{todayClasses.length}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-3 block">
            {new Date().toLocaleDateString('en-US', { weekday: 'long' })} Schedule
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Enrolled</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{totalStudents || 26}</h3>
            </div>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-gray-400 mt-3 block">Across Section A & B</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Attendance Pending</p>
              <h3 className={`text-2xl font-bold mt-1.5 ${attendancePending > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {attendancePending}
              </h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-gray-400 mt-3 block">Awaiting session record</span>
        </div>

        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Completed Today</p>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5">
                {attendanceCompleted}
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-3 block">
            Synchronized to students
          </span>
        </div>
      </div>

      {/* TAB 1: TODAY'S CLASSES */}
      {activeTab === 'TODAY' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Classes Scheduled For Today ({DAYS[new Date().getDay()]})
            </h2>
            <span className="text-xs text-gray-500">
              Auto-loaded from weekly timetable • Click "Take Attendance" to load exact enrolled students
            </span>
          </div>

          {todayClasses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {todayClasses.map((cls) => {
                const isCompleted = cls.isCompleted || cls.status === 'COMPLETED';

                return (
                  <div
                    key={cls._id}
                    className={`bg-white dark:bg-gray-800 rounded-2xl border p-6 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                      isCompleted 
                        ? 'border-emerald-200 dark:border-emerald-900/60' 
                        : 'border-indigo-100 dark:border-gray-700 ring-1 ring-indigo-500/10'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-lg flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {cls.startTime} - {cls.endTime}
                        </span>

                        {isCompleted ? (
                          <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold rounded-full flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            Attendance Completed ✓
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold rounded-full flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
                            Attendance Pending
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {cls.subject?.name}
                        </h3>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mt-1">
                          {cls.department?.name || 'CSE'} • Year {cls.year || 2} - Section {cls.section || 'A'} • Room {cls.room || 'CSE-201'}
                        </p>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                        <span className="flex items-center">
                          <Users className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                          <strong>{cls.totalStudents || 16}</strong>&nbsp;Registered Students
                        </span>
                        {isCompleted && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Present: {cls.presentCount} • Absent: {cls.absentCount}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between gap-3">
                      <button
                        onClick={() => handleOpenMarksModal(cls)}
                        className="px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center space-x-1.5 border border-gray-200 dark:border-gray-700"
                      >
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        <span>Enter Marks</span>
                      </button>

                      <Link
                        to={`/faculty/attendance?sessionId=${cls._id}`}
                        className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all flex items-center space-x-1.5 ${
                          isCompleted
                            ? 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <CheckSquare className="w-3.5 h-3.5" />
                        <span>{isCompleted ? 'View / Edit Attendance' : 'Take Attendance'}</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">No classes scheduled for today</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Switch to the "My Weekly Timetable" tab to review your teaching schedule for other days of the week.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INTERACTIVE WEEKLY TIMETABLE MATRIX */}
      {activeTab === 'TIMETABLE' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">My Weekly Teaching Timetable</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Complete weekly schedule assigned to your faculty profile across all sections
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase font-bold border-b border-gray-200 dark:border-gray-700">
                  <th className="p-3.5">Day</th>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Subject</th>
                  <th className="p-3.5">Branch & Section</th>
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Type</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {weeklyTimetable.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
                    <td className="p-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {DAYS[item.dayOfWeek]}
                    </td>
                    <td className="p-3.5 font-medium text-gray-900 dark:text-white">
                      {item.startTime} - {item.endTime}
                    </td>
                    <td className="p-3.5 font-semibold text-gray-900 dark:text-white">
                      {item.subject?.name} <span className="text-gray-400 font-normal">({item.subject?.code})</span>
                    </td>
                    <td className="p-3.5 text-gray-700 dark:text-gray-300">
                      {item.department?.name || 'CSE'} - Section {item.section}
                    </td>
                    <td className="p-3.5 font-bold text-gray-600 dark:text-gray-300">
                      {item.room || 'CSE-201'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        {item.sessionType || 'LECTURE'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      <Link
                        to={`/faculty/attendance?subjectId=${item.subject?._id}&section=${item.section}`}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors inline-block"
                      >
                        Attendance
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ENTER MARKS MODAL */}
      {marksModalSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Enter Assessment Marks: {marksModalSession.subject?.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Section {marksModalSession.section} • Year {marksModalSession.year} • {marksRoster.length} Registered Students
                </p>
              </div>
              <button
                onClick={() => setMarksModalSession(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMarks} className="space-y-4 flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Assessment Type
                  </label>
                  <select
                    value={assessmentType}
                    onChange={(e) => setAssessmentType(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <option value="INTERNAL">Internal Assessment</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="QUIZ">Quiz / Test</option>
                    <option value="MID_EXAM">Mid-Semester Exam</option>
                    <option value="LAB">Lab Evaluation</option>
                    <option value="PRACTICAL">Practical Exam</option>
                    <option value="END_SEMESTER">End Semester</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Marks
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxMarks}
                    onChange={(e) => setMaxMarks(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Student Roster Marks Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                  Registered Students Roster
                </span>
                
                {loadingRoster ? (
                  <p className="text-xs text-gray-400 py-4 text-center">Loading enrolled students...</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                    {marksRoster.map((item, idx) => (
                      <div key={item.studentId} className="p-3 bg-white dark:bg-gray-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {item.rollNumber} — {item.firstName} {item.lastName}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            min={0}
                            max={maxMarks}
                            value={item.marks}
                            onChange={(e) => {
                              const updated = [...marksRoster];
                              updated[idx].marks = e.target.value;
                              setMarksRoster(updated);
                            }}
                            className="w-20 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2.5 py-1.5 text-xs text-center font-bold text-gray-900 dark:text-white"
                          />
                          <span className="text-gray-400 text-xs">/ {maxMarks}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setMarksModalSession(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMarks || loadingRoster}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingMarks ? 'Saving Marks...' : 'Save & Publish Marks'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
