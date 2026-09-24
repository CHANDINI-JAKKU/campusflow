import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  CheckSquare, BookOpen, AlertTriangle, TrendingUp, Sparkles, 
  Calendar, Award, ArrowRight, BrainCircuit, CheckCircle2, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [gradesData, setGradesData] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profRes, attRes, assignRes, gradesRes, scheduleRes] = await Promise.all([
        api.get('/users/me/profile'),
        api.get('/attendance/student/me'),
        api.get('/assignments?limit=5'),
        api.get('/grades/student/me'),
        api.get('/academic/timetable/today')
      ]);

      setProfileData(profRes.data);
      setAttendanceData(attRes.data);
      setAssignments(assignRes.data.assignments || []);
      setGradesData(gradesRes.data);
      setTodaySchedule(scheduleRes.data.timetable || []);
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
      setAiSummary(null);
      toast.error('AI analysis is unavailable until sufficient academic data is recorded');
    } finally {
      setLoadingAi(false);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl lg:col-span-2"></div>
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const hasAttendance = Boolean(attendanceData?.subjects?.some(s => s.totalClasses > 0));
  const overallAtt = attendanceData?.overall;
  const isAttendanceAtRisk = hasAttendance && overallAtt < 75;
  const subjectsAtRisk = attendanceData?.subjects?.filter(s => s.isAtRisk) || [];
  const hasGrades = Boolean(gradesData?.grades?.length);
  const cgpa = gradesData?.cgpa || profileData?.cgpa;
  const submittedAssignments = assignments.filter(a => a.submission?.status);
  const progressScore = hasAttendance && hasGrades
    ? Math.round((overallAtt * 0.4) + ((cgpa / 10) * 100 * 0.4) + ((submittedAssignments.length / Math.max(assignments.length, 1)) * 100 * 0.2))
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            How am I doing, {user?.firstName}? 🚀
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Roll No: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{user?.rollNumber || 'Not assigned'}</span> • Year {user?.year || 'Not assigned'}, Sem {user?.semester || 'Not assigned'} • Section {user?.section || 'Not assigned'}
          </p>
        </div>
        <button
          onClick={handleGenerateAiSummary}
          disabled={loadingAi}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all duration-200 shadow-indigo-200 dark:shadow-none"
        >
          <Sparkles className={`w-4 h-4 ${loadingAi ? 'animate-spin' : ''}`} />
          <span>{loadingAi ? 'Analyzing Data...' : 'Generate AI Insights'}</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Today's Schedule</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From your enrolled section timetable</p>
          </div>
          <Calendar className="w-5 h-5 text-indigo-500" />
        </div>
        {todaySchedule.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {todaySchedule.map((entry) => (
              <div key={entry._id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">{entry.startTime} - {entry.endTime}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{entry.subject?.name || 'Subject unavailable'}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{entry.room || 'Room not assigned'}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{entry.faculty ? `${entry.faculty.firstName} ${entry.faculty.lastName}` : 'Faculty not assigned'}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No classes scheduled today</p>
        )}
      </div>

      {/* Critical Early Warning Alert (if any subject < 75%) */}
      {subjectsAtRisk.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 md:p-5 flex items-start space-x-4">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 rounded-xl flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              CampusFlow Early Warning: Attendance Deficit Detected
            </h4>
            <div className="mt-1 text-xs text-amber-800 dark:text-amber-300/90 space-y-1">
              {subjectsAtRisk.map(sub => (
                <p key={sub.subject?._id}>
                  • <strong className="font-semibold">{sub.subject?.name} ({sub.subject?.code}):</strong> {sub.percentage}% ({sub.attended}/{sub.totalClasses} classes). You need <span className="underline font-bold">{sub.classesNeeded} consecutive classes</span> to restore 75% threshold.
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
      )}

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Attendance */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overall Attendance</p>
              <h3 className={`text-2xl font-bold mt-1.5 ${isAttendanceAtRisk ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {hasAttendance ? `${overallAtt}%` : 'Not started'}
              </h3>
            </div>
            <div className={`p-2.5 rounded-xl ${isAttendanceAtRisk ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/40' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40'}`}>
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isAttendanceAtRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
              style={{ width: `${hasAttendance ? Math.min(overallAtt, 100) : 0}%` }}
            ></div>
          </div>
          <span className="text-[11px] text-gray-400 mt-2 block">Required minimum: 75%</span>
        </div>

        {/* CGPA */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cumulative GPA</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
                {cgpa || 'CGPA not available'} {cgpa && <span className="text-xs font-normal text-gray-400">/ 10.0</span>}
              </h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
              {hasGrades ? 'Calculated from finalized subject grades' : 'Grades not available yet'}
            </p>
        </div>

        {/* Assignments */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700/80 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Assignments</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">
                {assignments.length || 'No active assignments'}
              </h3>
            </div>
            <div className="p-2.5 bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 rounded-xl">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" /> {assignments.length ? 'Deadlines from enrolled subjects' : 'No active assignments'}
          </p>
        </div>

        {/* Student Progress Indicator */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-2xl text-white shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-indigo-100 uppercase tracking-wider">Success Indicator</p>
              <h3 className="text-2xl font-bold mt-1">{progressScore === null ? 'Building profile' : `${progressScore} / 100`}</h3>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <BrainCircuit className="w-5 h-5 text-indigo-100" />
            </div>
          </div>
          <p className="text-[11px] text-indigo-100/90 mt-2">
            Non-official score calculated from attendance, finalized marks, and submissions.
          </p>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: AI Advisor & Subject Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Intelligence Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/80 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-50 dark:bg-indigo-900/50 rounded-lg text-indigo-600 dark:text-indigo-400">
                  <BrainCircuit className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                  CampusFlow AI Academic Intelligence
                </h3>
              </div>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-medium">
                Advisory Only
              </span>
            </div>

            {aiSummary ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800">
                  "{aiSummary.summary}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl">
                    <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Key Strengths
                    </h5>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      {aiSummary.strengths?.map((st, i) => (
                        <li key={i}>• {st}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl">
                    <h5 className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider mb-2 flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Attention Areas
                    </h5>
                    <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1">
                      {aiSummary.weakAreas?.map((wa, i) => (
                        <li key={i}>• {wa}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Actionable Recommendations
                  </h5>
                  <div className="space-y-1.5">
                    {aiSummary.recommendations?.map((rec, i) => (
                      <div key={i} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold mr-2">{i + 1}.</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BrainCircuit className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No AI summary generated yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Click the "Generate AI Insights" button above to perform a holistic analysis of your attendance and performance records.
                </p>
              </div>
            )}
          </div>

          {/* Subject-Wise Attendance Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Subject-wise Attendance</h3>
              <Link to="/student/attendance" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                View Full Log →
              </Link>
            </div>

            <div className="space-y-4">
              {attendanceData?.subjects?.map((sub) => {
                const isSubRisk = sub.percentage < 75;
                return (
                  <div key={sub.subject?._id} className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex justify-between items-center text-sm font-medium mb-1.5">
                      <span className="text-gray-900 dark:text-gray-100">{sub.subject?.name}</span>
                      <span className={isSubRisk ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                        {sub.percentage}% ({sub.attended}/{sub.totalClasses})
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isSubRisk ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(sub.percentage, 100)}%` }}
                      ></div>
                    </div>
                    {isSubRisk && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1.5 flex items-center font-medium">
                        ⚠️ Need {sub.classesNeeded} more consecutive classes to clear attendance threshold.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Deadlines & Placement Shortlist */}
        <div className="space-y-6">
          {/* Upcoming Assignments Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Assignments & Deadlines</h3>
              <Link to="/student/assignments" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                All ({assignments.length}) →
              </Link>
            </div>

            <div className="space-y-3">
              {assignments.length > 0 ? (
                assignments.map((as) => (
                  <div key={as._id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex justify-between items-start">
                      <h5 className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-1">{as.title}</h5>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        as.submission?.status === 'GRADED' 
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400'
                      }`}>
                        {as.submission?.status || 'Pending'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">{as.subject?.name}</p>
                    <div className="mt-2 text-[11px] text-gray-400 flex justify-between items-center">
                      <span>Max: {as.maxMarks} Marks</span>
                      <span className="font-medium text-indigo-600 dark:text-indigo-400">
                        Due {new Date(as.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 py-4 text-center">No pending assignments</p>
              )}
            </div>
          </div>

          {/* Quick AI Study Assistant Link */}
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
        </div>
      </div>
    </div>
  );
}
