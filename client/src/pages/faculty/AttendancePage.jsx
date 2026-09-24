import { useState, useEffect } from 'react';
import api from '../../services/api';
import { CheckSquare, Users, Save, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyAttendancePage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState('LECTURE');
  const [topic, setTopic] = useState('');
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await api.get('/subjects');
      const subs = res.data.subjects || [];
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubject(subs[0]._id);
        fetchStudentsForSubject(subs[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assigned subjects');
    }
  };

  const fetchStudentsForSubject = async (subjId) => {
    try {
      setLoading(true);
      const res = await api.get(`/attendance/students/${subjId}`);
      const studs = res.data.students || [];
      setStudents(studs);

      // Default all to PRESENT
      const initial = {};
      studs.forEach((s) => {
        initial[s.student?._id] = 'PRESENT';
      });
      setAttendanceRecords(initial);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load enrolled students');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (e) => {
    const id = e.target.value;
    setSelectedSubject(id);
    fetchStudentsForSubject(id);
  };

  const setAllStatus = (status) => {
    const updated = {};
    students.forEach((s) => {
      updated[s.student?._id] = status;
    });
    setAttendanceRecords(updated);
    toast.success(`Marked all students as ${status}`);
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedSubject) return;

    try {
      setSubmitting(true);
      const records = Object.keys(attendanceRecords).map((studentId) => ({
        studentId,
        status: attendanceRecords[studentId]
      }));

      await api.post('/attendance', {
        subjectId: selectedSubject,
        date,
        sessionType,
        topic: topic || `${sessionType} Session`,
        records
      });

      toast.success('Attendance recorded and synchronized successfully!');
      fetchStudentsForSubject(selectedSubject);
    } catch (err) {
      toast.error(err.message || 'Failed to submit attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mark Class Attendance</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Record lecture & lab attendance sessions with automated 75% warning trigger notifications.
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSubmitAttendance} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Select Subject</label>
            <select
              value={selectedSubject}
              onChange={handleSubjectChange}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              {subjects.map((sub) => (
                <option key={sub._id} value={sub._id}>
                  {sub.code} - {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Session Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Session Type</label>
            <select
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="LECTURE">Lecture</option>
              <option value="LAB">Lab Session</option>
              <option value="TUTORIAL">Tutorial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Topic / Unit</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. BCNF Normalization & Decomposition"
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/30">
            <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center">
              <Users className="w-4 h-4 mr-2 text-indigo-600" />
              Enrolled Class Roster ({students.length} Students)
            </span>

            {/* Bulk actions */}
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

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3.5">Roll Number</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Current Rate</th>
                  <th className="px-6 py-3.5 text-center">Session Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {students.map((st) => {
                  const sId = st.student?._id;
                  const currentStatus = attendanceRecords[sId] || 'PRESENT';
                  const isAtRisk = st.percentage < 75;

                  return (
                    <tr key={sId} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-gray-900 dark:text-white">
                        {st.student?.rollNumber}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-gray-700 dark:text-gray-300">
                        {st.student?.firstName} {st.student?.lastName}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          isAtRisk 
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}>
                          {st.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex justify-center space-x-2">
                          {['PRESENT', 'ABSENT', 'LATE'].map((stOpt) => {
                            const isSelected = currentStatus === stOpt;
                            return (
                              <button
                                key={stOpt}
                                type="button"
                                onClick={() => setAttendanceRecords({ ...attendanceRecords, [sId]: stOpt })}
                                className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
                                  isSelected
                                    ? stOpt === 'PRESENT'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : stOpt === 'ABSENT'
                                      ? 'bg-red-600 text-white shadow-xs'
                                      : 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                                }`}
                              >
                                {stOpt}
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

          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{submitting ? 'Saving Session Records...' : 'Save & Publish Attendance'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
