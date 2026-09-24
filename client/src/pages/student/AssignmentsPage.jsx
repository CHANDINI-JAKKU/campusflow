import { useState, useEffect } from 'react';
import api from '../../services/api';
import { BookOpen, Upload, Clock, CheckCircle, AlertCircle, FileText, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentAssignmentsPage() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, SUBMITTED, GRADED

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assignments');
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    try {
      setSubmitting(true);
      // Simulated upload for demo
      const formData = new FormData();
      await api.post(`/assignments/${selectedAssignment._id}/submit`, formData);
      toast.success('Assignment submitted successfully!');
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((as) => {
    if (filter === 'PENDING') return !as.submission || as.submission.status === 'PENDING';
    if (filter === 'SUBMITTED') return as.submission?.status === 'SUBMITTED' || as.submission?.status === 'LATE';
    if (filter === 'GRADED') return as.submission?.status === 'GRADED';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments & Submissions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View course assignments, track deadlines, submit coursework and review faculty feedback.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
          {['ALL', 'PENDING', 'SUBMITTED', 'GRADED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <BookOpen className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No assignments found for this filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((as) => {
            const isGraded = as.submission?.status === 'GRADED';
            const isSubmitted = as.submission?.status === 'SUBMITTED' || as.submission?.status === 'LATE';

            return (
              <div
                key={as._id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md">
                        {as.subject?.name}
                      </span>
                      <span className="text-xs text-gray-400">• Posted by {as.faculty?.firstName} {as.faculty?.lastName}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {as.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {as.description}
                    </p>

                    {/* Feedback if graded */}
                    {isGraded && as.submission?.feedback && (
                      <div className="mt-3 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                        <strong>Faculty Feedback:</strong> {as.submission.feedback}
                      </div>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex flex-col items-end space-y-3 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      {isGraded ? (
                        <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Graded: {as.submission.marks} / {as.maxMarks}
                        </div>
                      ) : isSubmitted ? (
                        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold flex items-center">
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Submitted
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Pending Submission
                        </div>
                      )}
                    </div>

                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Deadline: <strong className="text-gray-700 dark:text-gray-200">{new Date(as.deadline).toLocaleDateString()}</strong>
                    </span>

                    {!isGraded && (
                      <button
                        onClick={() => setSelectedAssignment(as)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center space-x-1.5"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{isSubmitted ? 'Resubmit Solution' : 'Submit Assignment'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Submit: {selectedAssignment.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Allowed formats: {selectedAssignment.allowedFileTypes?.join(', ') || 'pdf, docx, zip'}
            </p>

            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center hover:border-indigo-500 cursor-pointer transition-colors">
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Click to select solution file or drag and drop</p>
                <input type="file" className="hidden" />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                >
                  {submitting ? 'Uploading...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
