import { useState, useEffect } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { BookOpen, Upload, Clock, CheckCircle2, AlertCircle, FileText, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentAssignmentsPage() {
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissionNotes, setSubmissionNotes] = useState('');
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
      await api.post(`/assignments/${selectedAssignment._id}/submit`, {
        submissionNotes: submissionNotes || 'Completed solution document',
        fileName: `${user?.rollNumber || 'Student'}_${selectedAssignment.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        fileUrl: '/uploads/student_submission.pdf'
      });
      toast.success('Assignment submitted successfully!');
      setSelectedAssignment(null);
      setSubmissionNotes('');
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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Course Assignments
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Active coursework for your enrolled subjects ({user?.department?.name || 'CSE'}, Section {user?.section || 'A'})
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl self-start md:self-auto">
          {['ALL', 'PENDING', 'SUBMITTED', 'GRADED'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                filter === f
                  ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
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
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">No assignments found for this filter</p>
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
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-md">
                        {as.subject?.name}
                      </span>
                      <span className="text-xs text-gray-400">• Posted by {as.faculty?.firstName} {as.faculty?.lastName}</span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {as.title}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {as.description}
                    </p>

                    {as.instructions && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                        <strong>Instructions:</strong> {as.instructions}
                      </p>
                    )}

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
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Score: {as.submission.marks} / {as.maxMarks}
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
                      Deadline: <strong className="text-gray-800 dark:text-gray-200">{new Date(as.deadline).toLocaleDateString()}</strong>
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 space-y-4 border border-gray-100 dark:border-gray-700 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-700 pb-3">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Submit: {selectedAssignment.title}
              </h3>
              <button onClick={() => setSelectedAssignment(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Submission Notes / Solution Link
                </label>
                <textarea
                  rows={3}
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Paste GitHub repository, Google Drive link, or write solution summary..."
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 text-center bg-gray-50/50 dark:bg-gray-900/40">
                <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  {user?.rollNumber}_{selectedAssignment.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">Prepared for submission</p>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                >
                  {submitting ? 'Submitting...' : 'Confirm Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
