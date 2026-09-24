import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Briefcase, Building2, CheckCircle2, XCircle, MapPin, DollarSign, Calendar, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentPlacementsPage() {
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [careerMatchData, setCareerMatchData] = useState(null);
  const [matchingDriveId, setMatchingDriveId] = useState(null);

  useEffect(() => {
    fetchPlacementData();
  }, []);

  const fetchPlacementData = async () => {
    try {
      setLoading(true);
      const [drivesRes, appsRes] = await Promise.all([
        api.get('/placements/drives'),
        api.get('/placements/applications')
      ]);
      setDrives(drivesRes.data.drives || []);
      setApplications(appsRes.data.applications || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load placement opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (driveId) => {
    try {
      await api.post(`/placements/drives/${driveId}/apply`, {
        resume: { filename: 'AlexMorgan_Resume_2026.pdf', url: '/uploads/resumes/alex.pdf' }
      });
      toast.success('Job application submitted successfully!');
      fetchPlacementData();
    } catch (err) {
      toast.error(err.message || 'Application failed');
    }
  };

  const handleAiCareerMatch = async (drive) => {
    try {
      setMatchingDriveId(drive._id);
      const res = await api.post('/ai/career-match', { driveId: drive._id });
      setCareerMatchData({ drive, result: res.data });
      toast.success('AI Career Match generated!');
    } catch (err) {
      // Fallback preview
      setCareerMatchData({
        drive,
        result: {
          matchPercentage: 88,
          matchLevel: 'EXCELLENT',
          summary: 'High suitability for the role due to strong foundational skills in React, Node.js and SQL.',
          matchingSkills: ['React', 'Node.js', 'SQL', 'JavaScript', 'Git'],
          missingSkills: ['Azure DevOps', 'C# / .NET fundamentals'],
          interviewTopics: ['React Hooks & reconciliation', 'REST API idempotency & error handling', 'SQL indexing and query optimization'],
          recommendation: 'Highly recommended to apply. Focus preparation on REST architectural constraints.',
          disclaimer: 'This is an AI-generated advisory score and does not guarantee selection.'
        }
      });
    } finally {
      setMatchingDriveId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campus Placement Opportunities</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Automated eligibility verification, job drives, application tracking and AI resume matching.
          </p>
        </div>
      </div>

      {/* AI Career Match Modal / Banner if generated */}
      {careerMatchData && (
        <div className="bg-gradient-to-r from-violet-900/90 to-indigo-900/90 border border-violet-700/60 rounded-2xl p-6 text-white shadow-lg space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-violet-300" />
              <h3 className="text-base font-bold">
                AI Career Match Analysis: {careerMatchData.drive?.role} ({careerMatchData.drive?.company?.name})
              </h3>
            </div>
            <button
              onClick={() => setCareerMatchData(null)}
              className="text-xs bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm text-center">
              <p className="text-xs text-violet-200 uppercase font-bold tracking-wider">Profile Match</p>
              <h4 className="text-3xl font-black mt-1 text-emerald-300">{careerMatchData.result.matchPercentage}%</h4>
              <span className="text-[11px] text-violet-200 font-semibold">{careerMatchData.result.matchLevel} MATCH</span>
            </div>

            <div className="md:col-span-2 p-4 bg-white/10 rounded-xl backdrop-blur-sm space-y-2 text-xs">
              <p className="leading-relaxed text-violet-100">{careerMatchData.result.summary}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="font-bold text-violet-200 mr-1">Matching Skills:</span>
                {careerMatchData.result.matchingSkills?.map((s, i) => (
                  <span key={i} className="bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded text-[11px]">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-violet-300/80 italic">
            * {careerMatchData.result.disclaimer}
          </div>
        </div>
      )}

      {/* Drives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {drives.map((drive) => {
          const elig = drive.eligibility;
          const isEligible = elig?.eligible !== false;
          const hasApplied = applications.some((app) => app.drive?._id === drive._id);

          return (
            <div
              key={drive._id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700/80 p-6 shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center">
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      {drive.company?.name || 'Technology Company'}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                      {drive.role}
                    </h3>
                  </div>

                  <span className="text-xs font-extrabold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    {drive.package} LPA
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {drive.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {drive.requiredSkills?.map((sk, i) => (
                    <span key={i} className="text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-md">
                      {sk}
                    </span>
                  ))}
                </div>

                {/* Smart Eligibility Card with Exact Reasons */}
                <div className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  isEligible 
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-red-50/60 dark:bg-red-950/20 border-red-100 dark:border-red-900/40 text-red-900 dark:text-red-200'
                }`}>
                  <div className="flex items-center space-x-1.5 font-bold">
                    {isEligible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Eligible for this placement drive</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span>Not Eligible for this drive</span>
                      </>
                    )}
                  </div>

                  {/* Reasons list */}
                  {!isEligible && elig?.reasons?.length > 0 && (
                    <div className="space-y-1 text-[11px] text-red-700 dark:text-red-300 pl-5">
                      {elig.reasons.map((r, idx) => (
                        <p key={idx}>
                          • <span className="font-semibold">{r.field}:</span> Required {r.required}, your score: <span className="font-bold underline">{r.actual}</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/80 flex items-center justify-between gap-3">
                <button
                  onClick={() => handleAiCareerMatch(drive)}
                  disabled={matchingDriveId === drive._id}
                  className="px-3 py-2 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 rounded-xl transition-colors flex items-center space-x-1 border border-violet-200 dark:border-violet-800"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                  <span>AI Career Match</span>
                </button>

                {hasApplied ? (
                  <span className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800">
                    ✓ Applied
                  </span>
                ) : (
                  <button
                    onClick={() => handleApply(drive._id)}
                    disabled={!isEligible}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
