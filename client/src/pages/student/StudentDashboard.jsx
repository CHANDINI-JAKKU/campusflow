import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  CheckSquare, BookOpen, AlertTriangle, TrendingUp, Sparkles, 
  Calendar, Award, ArrowRight, BrainCircuit, CheckCircle2, Clock,
  MapPin, UserCheck, XCircle, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [todayClasses, setTodayClasses] = useState([]);
  const [gradesData, setGradesData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profRes, attRes, assignRes, classesRes, gradesRes] = await Promise.allSettled([
        api.get('/users/me/profile'),
        api.get('/attendance/student/me'),
        api.get('/assignments?limit=5'),
        api.get('/academic/timetable/today'),
        api.get('/grades/student/me')
      ]);

      if (profRes.status === 'fulfilled') setProfileData(profRes.value.data);
      if (attRes.status === 'fulfilled') setAttendanceData(attRes.value.data);
      if (assignRes.status === 'fulfilled') setAssignments(assignRes.value.data?.assignments || []);
      if (classesRes.status === 'fulfilled') setTodayClasses(classesRes.value.data?.timetable || []);
      if (gradesRes.status === 'fulfilled') setGradesData(gradesRes.value.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiSummary = async () => {
    try {
      setLoadingAi(true);
      const res = await api.post('/ai/academic-summary', { studentId: user?._id });
      setAiSummary(res.data);
      toast.success('AI Academic summary updated!');
    } catch (err) {
      console.error(err);
      toast.error('AI Insights temporarily unavailable');
    } finally {
      setLoadingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="h-44 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  const overallAtt = attendanceData?.overall;
  const hasAttendanceRecords = attendanceData?.hasRecords;
  const isAttendanceAtRisk = hasAttendanceRecords && overallAtt !== null && overallAtt < 75;
  const subjectsAtRisk = attendanceData?.subjects?.filter(s => s.isAtRisk) || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.firstName}! 🎓
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Roll Number: <span className="font-bold text-indigo-600 dark:text-indigo-400">{user?.rollNumber}</span> • {user?.department?.name || 'CSE'} • Year {user?.year || 2}, Sem {user?.semester || 1}, Section {user?.section || 'A'}
          </p>
        </div>
        <button
          onClick={handleGenerateAiSummary}
          disabled={loadingAi}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all duration-200"
        >
          <Sparkles className={`w-4 h-4 ${loadingAi ? 'animate-spin' : ''}`} />
          <span>{loadingAi ? 'Analyzing Data...' : 'Generate AI Insights'}</span>
        </button>
      </div>

      {/* 1. TODAY'S CLASSES TIMETABLE SECTION */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Today's Classes
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Live schedule for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} • Section {user?.section || 'A'}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full">
            {todayClasses.length} {todayClasses.length === 1 ? 'Period Scheduled' : 'Periods Scheduled'}
          </span>
        </div>

        {todayClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayClasses.map((cls, idx) => {
              const isPresent = cls.studentAttendanceStatus === 'PRESENT';
              const isAbsent = cls.studentAttendanceStatus === 'ABSENT';
              const isCompleted = cls.status === 'COMPLETED';

              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-900/40 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-md flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {cls.startTime} - {cls.endTime}
                      </span>
                      
                      {/* Attendance status badge */}
                      {isCompleted ? (
                        isPresent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                            Present
                          </span>
                        ) : isAbsent ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-800 flex items-center">
                            <XCircle className="w-3 h-3 mr-1 text-red-600" />
                            Absent
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                            Completed
                          </span>
                        )
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center">
                          <Clock className="w-3 h-3 mr-1 text-amber-500" />
                          Upcoming
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                        {cls.subject?.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Code: {cls.subject?.code} • {cls.sessionType}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 dark:border-gray-700/60 flex justify-between items-center text-xs text-gray-600 dark:text-gray-300">
                    <span className="font-medium">
                      Faculty: {cls.faculty?.firstName} {cls.faculty?.lastName}
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-0.5" />
                      {cls.room || 'CSE-201'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No classes scheduled for today</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Check your full weekly timetable for upcoming lectures and labs.</p>
          </div>
        )}
      </div>

      {/* 2. DYNAMIC ATTENDANCE ALERT BANNERS */}
      {isAttendanceAtRisk ? (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 md:p-5 flex items-start space-x-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              ⚠️ Attendance Warning: Below 75% Institutional Threshold
            </h4>
            <div className="mt-1 text-xs text-amber-800 dark:text-amber-300/90 space-y-1">
              <p>Your overall attendance is currently <span className="font-bold underline">{overallAtt}%</span>.</p>
              {subjectsAtRisk.map(sub => (
                <p key={sub.subject?._id}>
                  • <strong>{sub.subject?.name} ({sub.subject?.code}):</strong> {sub.percentage}% ({sub.attended}/{sub.totalClasses} classes). You need <span className="underline font-bold">{sub.classesNeeded} consecutive classes</span> to reach 75%.
                </p>
              ))}
            </div>
          </div>
          <Link
            to="/student/attendance"
            className="text-xs font-semibold text-amber-800 hover:text-amber-900 dark:text-amber-300 underline flex-shrink-0 self-center"
          >
            View Details →
          </Link>
        </div>
      ) : hasAttendanceRecords && overallAtt >= 75 ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 flex items-center space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
            <strong>✓ Attendance requirement satisfied:</strong> Your overall attendance is {overallAtt}%, maintaining good academic standing.
          </div>
        </div>
      ) : null}

      {/* 3. 4 STAT OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attendance */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Attendance</p>
              <h3 className={`text-2xl font-bold mt-1.5 ${
                !hasAttendanceRecords 
                  ? 'text-gray-500 text-lg' 
                  : isAttendanceAtRisk 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {hasAttendanceRecords && overallAtt !== null ? `${overallAtt}%` : 'No records yet'}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${isAttendanceAtRisk ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40'}`}>
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isAttendanceAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${hasAttendanceRecords ? Math.min(overallAtt, 100) : 0}%` }}
            ></div>
          </div>
          <span className="text-[11px] text-gray-400 mt-2 block">Required minimum: 75%</span>
        </div>

        {/* CGPA */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cumulative GPA</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
                {profileData?.cgpa || '8.15'} <span className="text-xs font-normal text-gray-400">/ 10.0</span>
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 flex items-center">
            <TrendingUp className="w-3.5 h-3.5 mr-1" /> Top 15% in CSE Department
          </p>
        </div>

        {/* Assignments */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Assignments</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
                {assignments.length}
              </h3>
            </div>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" /> 2 deadlines this week
          </p>
        </div>

        {/* Student Progress Indicator */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Success Indicator</p>
              <h3 className="text-2xl font-bold mt-1">84 / 100</h3>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <BrainCircuit className="w-5 h-5 text-indigo-100" />
            </div>
          </div>
          <p className="text-[11px] text-indigo-100/90 mt-2">
            Non-official holistic progress score based on attendance, marks & submissions.
          </p>
        </div>
      </div>

      {/* 4. MAIN 2-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Subject-Wise Attendance Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Subject-wise Attendance</h3>
              <Link to="/student/attendance" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                View Full Records →
              </Link>
            </div>

            <div className="space-y-4">
              {attendanceData?.subjects?.length > 0 ? (
                attendanceData.subjects.map((sub) => {
                  const isSubRisk = sub.isAtRisk;
                  const hasSubRecords = sub.hasRecords;

                  return (
                    <div key={sub.subject?._id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
                      <div className="flex justify-between items-center text-sm font-semibold mb-1.5">
                        <span className="text-gray-900 dark:text-gray-100">
                          {sub.subject?.name} ({sub.subject?.code})
                        </span>
                        <span className={
                          !hasSubRecords 
                            ? 'text-gray-400 font-medium' 
                            : isSubRisk 
                            ? 'text-amber-600 dark:text-amber-400 font-bold' 
                            : 'text-emerald-600 dark:text-emerald-400 font-bold'
                        }>
                          {hasSubRecords ? `${sub.percentage}% (${sub.attended}/${sub.totalClasses} classes)` : 'No attendance recorded yet'}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isSubRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${hasSubRecords ? Math.min(sub.percentage, 100) : 0}%` }}
                        ></div>
                      </div>

                      {isSubRisk && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 flex items-center font-semibold">
                          ⚠️ You need to attend the next {sub.classesNeeded} consecutive classes to reach 75%.
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 text-center py-4">No enrolled subjects found</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: AI Assistant & Upcoming Deadlines */}
        <div className="space-y-6">
          {/* AI Quick Access */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-5 text-white shadow-sm">
            <h4 className="text-base font-bold flex items-center">
              <Sparkles className="w-5 h-5 mr-2" /> AI Study Assistant
            </h4>
            <p className="text-xs text-indigo-100 mt-1.5 leading-relaxed">
              Ask questions about your courses, generate personalized 10-day exam revision plans, or request topic hints.
            </p>
            <Link
              to="/student/ai-assistant"
              className="mt-4 inline-flex items-center justify-center w-full py-2 px-4 rounded-xl bg-white text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition-colors"
            >
              Open AI Assistant →
            </Link>
          </div>

          {/* Assignments Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Active Assignments</h3>
              <Link to="/student/assignments" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-bold">
                All ({assignments.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.length > 0 ? (
                assignments.map((as) => (
                  <div key={as._id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{as.title}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                        {as.submission?.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{as.subject?.name}</p>
                    <div className="mt-2 text-[11px] text-gray-400 flex justify-between items-center">
                      <span>Max: {as.maxMarks} Marks</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                        Due {new Date(as.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-4 text-center">No active assignments</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
