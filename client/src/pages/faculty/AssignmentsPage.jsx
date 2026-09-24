import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Plus, CheckCircle, Clock, Users, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FacultyAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [gradingSubmission, setGradingSubmission] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSubj, setNewSubj] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newMaxMarks, setNewMaxMarks] = useState(50);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [asRes, subRes, courseRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/subjects'),
        api.get('/courses')
      ]);
      setAssignments(asRes.data.assignments || []);
      setSubjects(subRes.data.subjects || []);
      setCourses(courseRes.data.courses || []);
      if (subRes.data.subjects?.length > 0) {
        setNewSubj(subRes.data.subjects[0]._id);
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
    try {
      const subjObj = subjects.find(s => s._id === newSubj);
      await api.post('/assignments', {
        title: newTitle,
        description: newDesc,
        subjectId: newSubj,
        courseId: subjObj?.course?._id || courses[0]?._id,
        deadline: newDeadline,
        maxMarks: Number(newMaxMarks)
      });
      toast.success('Assignment created and posted to enrolled students!');
      setShowCreateModal(false);
      fetchInitialData();
    } catch (err) {
      toast.error(err.message || 'Creation failed');
    }
  };

  const handleOpenSubmissions = async (assignment) => {
    try {
      setSelectedAssignmentForGrading(assignment);
      const res = await api.get(`/assignments/${assignment._id}/submissions`);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load student submissions');
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    try {
      await api.put(`/assignments/submissions/${gradingSubmission._id}/grade`, {
        marks: Number(marks),
        feedback
      });
      toast.success('Grade and feedback saved!');
      setGradingSubmission(null);
      handleOpenSubmissions(selectedAssignmentForGrading);
    } catch (err) {
      toast.error(err.message || 'Grading failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create course assignments, monitor student submission rates, and grade solutions.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Assignment</span>
        </button>
      </div>

      {/* Assignment List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {assignments.map((as) => (
          <div
            key={as._id}
            className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">
                  {as.subject?.name}
                </span>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  Max: {as.maxMarks} Marks
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 dark:text-white">{as.title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">{as.description}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-gray-400">
                Deadline: <strong className="text-gray-700 dark:text-gray-200">{new Date(as.deadline).toLocaleDateString()}</strong>
              </span>

              <button
                onClick={() => handleOpenSubmissions(as)}
                className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold transition-colors"
              >
                Review Submissions →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submissions Review Drawer / Modal */}
      {selectedAssignmentForGrading && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-start border-b border-gray-100 dark:border-gray-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Submissions: {selectedAssignmentForGrading.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Submissions: {submissions.length}
                </p>
              </div>
              <button
                onClick={() => setSelectedAssignmentForGrading(null)}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {submissions.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No submissions recorded yet.</p>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub._id}
                    className="p-3.5 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">
                        {sub.student?.firstName} {sub.student?.lastName} ({sub.student?.rollNumber})
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5">
                        Submitted: {new Date(sub.submittedAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {sub.status === 'GRADED' ? (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded">
                          Graded: {sub.marks} / {selectedAssignmentForGrading.maxMarks}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setGradingSubmission(sub);
                            setMarks(sub.marks || '');
                            setFeedback(sub.feedback || '');
                          }}
                          className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          Grade Solution
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grade Single Submission Modal */}
      {gradingSubmission && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              Grade Submission: {gradingSubmission.student?.firstName} {gradingSubmission.student?.lastName}
            </h3>

            <form onSubmit={handleGradeSubmission} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Marks Awarded (Max: {selectedAssignmentForGrading?.maxMarks})
                </label>
                <input
                  type="number"
                  max={selectedAssignmentForGrading?.maxMarks}
                  min={0}
                  required
                  value={marks}
                  onChange={(e) => setMarks(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Faculty Feedback & Improvement Hints
                </label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. Excellent schema design. Please review functional dependency decomposition."
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setGradingSubmission(null)}
                  className="px-3 py-2 text-gray-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >
                  Save Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-xl">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Create New Assignment</h3>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Relational Normalization & BCNF"
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                <select
                  value={newSubj}
                  onChange={(e) => setNewSubj(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Deadline Date</label>
                  <input
                    type="date"
                    required
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-gray-500 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700"
                >
                  Publish Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
