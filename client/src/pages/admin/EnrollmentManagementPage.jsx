import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  BookOpen, CheckSquare, Users, Save, 
  CheckCircle2, AlertCircle, Filter, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function EnrollmentManagementPage() {
  const { user } = useAuthStore();
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState(2);
  const [selectedSem, setSelectedSem] = useState(1);
  const [selectedSec, setSelectedSec] = useState('A');
  const [selectedSubj, setSelectedSubj] = useState('');

  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchSubjectsForDept(selectedDept);
    }
  }, [selectedDept]);

  useEffect(() => {
    if (selectedDept && selectedSubj) {
      fetchEnrollmentMatrix();
    }
  }, [selectedDept, selectedYear, selectedSem, selectedSec, selectedSubj]);

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      const depts = res.data.departments || [];
      setDepartments(depts);
      if (depts.length > 0) {
        setSelectedDept(depts[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load departments');
    }
  };

  const fetchSubjectsForDept = async (deptId) => {
    try {
      const res = await api.get(`/subjects?department=${deptId}`);
      const subs = res.data.subjects || [];
      setSubjects(subs);
      if (subs.length > 0) {
        setSelectedSubj(subs[0]._id);
      } else {
        setSelectedSubj('');
        setStudents([]);
        setSelectedStudentIds([]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subjects for department');
    }
  };

  const fetchEnrollmentMatrix = async () => {
    try {
      setLoading(true);
      const res = await api.get('/academic/enrollment-matrix', {
        params: {
          department: selectedDept,
          year: selectedYear,
          semester: selectedSem,
          section: selectedSec,
          subject: selectedSubj
        }
      });
      setStudents(res.data.students || []);
      setSelectedStudentIds(res.data.enrolledStudentIds || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load enrollment matrix');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudent = (sId) => {
    if (selectedStudentIds.includes(sId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== sId));
    } else {
      setSelectedStudentIds([...selectedStudentIds, sId]);
    }
  };

  const selectAll = () => {
    setSelectedStudentIds(students.map(s => s._id));
  };

  const deselectAll = () => {
    setSelectedStudentIds([]);
  };

  const handleSaveEnrollments = async () => {
    if (!selectedSubj) {
      toast.error('Please select a subject');
      return;
    }
    try {
      setSaving(true);
      await api.post('/academic/enrollments/batch', {
        subjectId: selectedSubj,
        departmentId: selectedDept,
        year: selectedYear,
        semester: selectedSem,
        section: selectedSec,
        studentIds: selectedStudentIds,
        academicYear: '2026-2027'
      });
      toast.success(`Successfully enrolled ${selectedStudentIds.length} students in subject!`);
      fetchEnrollmentMatrix();
    } catch (err) {
      toast.error(err.message || 'Failed to save subject enrollments');
    } finally {
      setSaving(false);
    }
  };

  const currentSubjectDoc = subjects.find(s => s._id === selectedSubj);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Subject Enrollment Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Explicitly register students into specific subjects and sections.
          </p>
        </div>

        <button
          onClick={handleSaveEnrollments}
          disabled={saving || loading || !selectedSubj}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center space-x-2 self-start md:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Enroll Selected Students'}</span>
        </button>
      </div>

      {/* Cohort & Subject Selection Bar */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
          >
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
          >
            <option value={1}>1st Year</option>
            <option value={2}>2nd Year</option>
            <option value={3}>3rd Year</option>
            <option value={4}>4th Year</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Semester</label>
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(Number(e.target.value))}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
          >
            <option value={1}>Sem 1</option>
            <option value={2}>Sem 2</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Section</label>
          <select
            value={selectedSec}
            onChange={(e) => setSelectedSec(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
          >
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">Target Subject *</label>
          <select
            value={selectedSubj}
            onChange={(e) => setSelectedSubj(e.target.value)}
            className="w-full bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-xl px-3 py-2 text-xs font-bold text-indigo-900 dark:text-indigo-200"
          >
            {subjects.map((sub) => (
              <option key={sub._id} value={sub._id}>{sub.name} ({sub.code})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Roster Enrollment Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/30">
          <div>
            <span className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider block">
              Enrollment for: {currentSubjectDoc?.name || 'Selected Subject'} (Section {selectedSec})
            </span>
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              {selectedStudentIds.length} of {students.length} students enrolled
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={selectAll}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-lg transition-colors"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-gray-400">Loading cohort matrix...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No students found in this section</p>
            <p className="text-xs text-gray-400 mt-1">Add students to Year {selectedYear} Section {selectedSec} in the Students Directory first.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {students.map((st) => {
              const isEnrolled = selectedStudentIds.includes(st._id);
              return (
                <div
                  key={st._id}
                  onClick={() => toggleStudent(st._id)}
                  className={`p-4 flex items-center justify-between cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors ${
                    isEnrolled ? 'bg-indigo-50/15 dark:bg-indigo-950/10' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={isEnrolled}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                    />
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-2">{st.rollNumber}</span>
                        {st.firstName} {st.lastName}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{st.email}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    isEnrolled
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {isEnrolled ? 'Enrolled ✓' : 'Not Enrolled'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
