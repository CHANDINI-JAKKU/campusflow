import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  BookOpen, Plus, CheckCircle2, Clock, Users, 
  Edit3, FileText, Download, X, Save, AlertCircle 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyAssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Review Submissions Modal
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionRoster, setSubmissionRoster] = useState([]);
  const [gradingStudent, setGradingStudent] = useState(null);
  const [gradeMarks, setGradeMarks] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newSubj, setNewSubj] = useState('');
  const [newSection, setNewSection] = useState('A');
  const [newYear, setNewYear] = useState(2);
  const [newSem, setNewSem] = useState(1);
  const [newDeadline, setNewDeadline] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(20);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [asRes, subRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/subjects')
      ]);
      setAssignments(asRes.data.assignments || []);
      const subs = subRes.data.subjects || [];
      setSubjects(subs);
      if (subs.length > 0 && !newSubj) {
        setNewSubj(subs[0]._id);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newTitle || !newSubj || !newDeadline) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      setCreating(true);
      await api.post('/assignments', {
        title: newTitle,
        description: newDesc,
        instructions: newInstructions,
        subjectId: newSubj,
        section: newSection,
        year: Number(newYear),
        semester: Number(newSem),
        deadline: newDeadline,
        maxMarks: Number(newMaxMarks)
      });

      toast.success(`Assignment "${newTitle}" published for Section ${newSection}!`);
      setShowCreateModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewInstructions('');
      fetchInitialData();
    } catch (err) {
      toast.error(err.message || 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    try {
      setSelectedAssignment(assignment);
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      setSubmissionRoster(res.data.roster || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student submissions');
    }
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!gradingStudent?.submission?._id) return;

    try {
      setSubmittingGrade(true);
      await api.put(`/assignments/submissions/${gradingStudent.submission._id}/grade`, {
        marks: Number(gradeMarks),
        feedback: gradeFeedback
      });

      toast.success(`Grade saved for ${gradingStudent.student?.firstName}!`);
      setGradingStudent(null);
      handleOpenSubmissions(selectedAssignment);
      fetchInitialData();
    } catch (err) {
      toast.error(err.message || 'Grading failed');
    } finally {
      setSubmittingGrade(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Faculty Assignments Portal
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Publish coursework, evaluate submissions, and enforce section-level student enrollment isolation.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Assignment</span>
        </button>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">No assignments published yet</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Click "Publish New Assignment" to post tasks for your assigned subjects and sections.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((as) => (
            <div
              key={as._id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-md">
                    {as.subject?.name} • Sec {as.section || 'A'}
                  </span>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Max: {as.maxMarks} Marks
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">{as.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-1">{as.description}</p>
                </div>

                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 pt-1">
                  <span className="flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                    <strong>{as.enrolledCount ?? 3}</strong>&nbsp;Enrolled
                  </span>
                  <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    {as.submittedCount || 0} Submissions
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">
                  Due: <strong className="text-gray-800 dark:text-gray-200">{new Date(as.deadline).toLocaleDateString()}</strong>
                </span>

                <button
                  onClick={() => handleOpenSubmissions(as)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors shadow-xs"
                >
                  Review Enrolled Students →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Submissions Review Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  {selectedAssignment.subject?.name} • Section {selectedAssignment.section || 'A'}
                </span>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-0.5">
                  {selectedAssignment.title}
                </h3>
                <p className="text-xs text-gray-400">
                  Due: {new Date(selectedAssignment.deadline).toLocaleDateString()} • Max Marks: {selectedAssignment.maxMarks}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                Enrolled Students Submission Status ({submissionRoster.length} Total)
              </span>

              {submissionRoster.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No enrolled students found for this subject section.</p>
              ) : (
                submissionRoster.map((item) => {
                  const st = item.student;
                  const sub = item.submission;
                  const isSubmitted = Boolean(sub);
                  const isGraded = sub?.status === 'GRADED';

                  return (
                    <div
                      key={st._id}
                      className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 mr-2">{st.rollNumber}</span>
                          {st.firstName} {st.lastName}
                        </p>
                        <p className="text-gray-400 text-[11px] mt-0.5">
                          {isSubmitted ? `Submitted: ${new Date(sub.submittedAt).toLocaleString()}` : 'Submission Pending'}
                        </p>
                        {sub?.feedback && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                            Feedback: {sub.feedback}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isGraded ? (
                          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-emerald-800">
                            Graded: {sub.marks} / {selectedAssignment.maxMarks}
                          </span>
                        ) : isSubmitted ? (
                          <button
                            onClick={() => {
                              setGradingStudent(item);
                              setGradeMarks(sub.marks || selectedAssignment.maxMarks);
                              setGradeFeedback(sub.feedback || '');
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
                          >
                            Evaluate Solution
                          </button>
                        ) : (
                          <span className="px-3 py-1 bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold rounded-lg border border-amber-200 dark:border-amber-800">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Single Submission Modal */}
      {gradingStudent && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Grade: {gradingStudent.student?.firstName} {gradingStudent.student?.lastName}
              </h3>
              <button onClick={() => setGradingStudent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Marks Awarded (Max: {selectedAssignment?.maxMarks})
                </label>
                <input
                  type="number"
                  max={selectedAssignment?.maxMarks}
                  min={0}
                  required
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Faculty Feedback
                </label>
                <textarea
                  rows={3}
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  placeholder="e.g. Excellent solution. Good proof decomposition."
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setGradingStudent(null)}
                  className="px-3 py-2 text-gray-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGrade}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submittingGrade ? 'Saving...' : 'Save Grade'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ASSIGNMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Publish Course Assignment</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Assignment Title *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. DBMS Normalization & BCNF Decomposition"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Subject *</label>
                  <select
                    value={newSubj}
                    onChange={(e) => setNewSubj(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    {subjects.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Section *</label>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Description / Problem Statement</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide the complete task description, dataset or schema requirements..."
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Submission Instructions</label>
                <input
                  type="text"
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="e.g. Upload PDF document or SQL schema script"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Deadline Date *</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">Maximum Marks</label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs font-semibold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-sm flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{creating ? 'Publishing...' : 'Publish to Section'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
