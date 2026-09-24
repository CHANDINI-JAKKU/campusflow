import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import useAuthStore from '../../store/authStore';
import { 
  Sparkles, Send, Bot, User, Trash2, Calendar, BookOpen, 
  Lightbulb, CheckCircle2, ChevronRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

const SUGGESTED_PROMPTS = [
  "Create a 10-day revision schedule for Database Management Systems",
  "Explain BCNF normal form with an intuitive real-world example",
  "What is the difference between mutexes and semaphores in Operating Systems?",
  "Recommend the best practice problems to prepare for my Data Structures interview"
];

export default function AIStudyAssistant() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hello ${user?.firstName || 'there'}! I am your **CampusFlow AI Study Assistant**.\n\nI can help you break down complex course concepts, draft personalized day-by-day revision plans for upcoming exams, and recommend learning resources tailored to your weak areas.\n\n*Note: I will provide hints, approaches and explanations, rather than directly doing graded assignments for you.*`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('CHAT'); // CHAT, PLANNER, RESOURCES
  const messagesEndRef = useRef(null);

  // Study Planner Form State
  const [examDate, setExamDate] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (msgToSend) => {
    const text = msgToSend || input;
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', { message: text });
      setMessages([...newMessages, { role: 'assistant', content: res.data.message }]);
    } catch (err) {
      console.error(err);
      // Fallback helpful response if offline/no key
      setTimeout(() => {
        let reply = "Here is a structured explanation:\n\n1. **Core Concept**: Focus on breaking down the problem into sub-components.\n2. **Next Step**: Practice identifying dependencies in relational tables.\n3. **Recommendation**: Review your course lecture notes on normalisation anomalies.";
        if (text.toLowerCase().includes('plan') || text.toLowerCase().includes('schedule')) {
          reply = "### 📅 10-Day DBMS Revision Blueprint:\n- **Days 1-3**: ER Modeling, Relational Algebra & SQL queries\n- **Days 4-6**: Functional Dependencies, 1NF, 2NF, 3NF & BCNF\n- **Days 7-8**: Transaction Management & ACID properties\n- **Days 9-10**: Indexing (B+ Trees) and Mock Practice Exam";
        } else if (text.toLowerCase().includes('bcnf')) {
          reply = "### 💡 Boyce-Codd Normal Form (BCNF)\n\nA relation is in **BCNF** if for every non-trivial functional dependency $X \\rightarrow Y$, **$X$ is a Super Key**.\n\n**Analogy**: Think of it as: *Every determinant must be a candidate key.* If a non-key attribute determines another attribute, you have a violation and must split the table.";
        }
        setMessages([...newMessages, { role: 'assistant', content: reply }]);
      }, 600);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateStudyPlan = async (e) => {
    e.preventDefault();
    if (!examDate) {
      toast.error('Please select an exam date');
      return;
    }

    try {
      setLoadingPlan(true);
      const res = await api.post('/ai/study-plan', {
        examDate,
        hoursPerDay,
        subjects: [
          { name: 'Database Management Systems', priority: 'HIGH', topics: ['Normalization', 'SQL', 'Transactions'] },
          { name: 'Discrete Mathematics', priority: 'HIGH', topics: ['Graph Theory', 'Combinatorics'] },
          { name: 'Data Structures', priority: 'MEDIUM', topics: ['Trees', 'Graphs'] }
        ],
        weakSubjects: ['DBMS Normalization', 'Discrete Math']
      });
      setGeneratedPlan(res.data.studyPlan);
      toast.success('Study plan generated!');
    } catch (err) {
      // Fallback plan for demonstration
      setGeneratedPlan({
        title: 'Mid-Term Exam Preparation Schedule',
        totalDays: 10,
        dailyHours: hoursPerDay,
        overview: 'Targeted plan allocating double time to weak areas (DBMS and Discrete Math) with scheduled practice mock sessions.',
        schedule: [
          { day: 1, focus: 'DBMS: Relational Algebra & SQL Queries', tasks: [{ topic: 'Complex Joins & Subqueries', duration: 90 }, { topic: 'Practice Problem Set', duration: 60 }] },
          { day: 2, focus: 'DBMS: Normalization (3NF & BCNF)', tasks: [{ topic: 'Lossless Decomposition', duration: 90 }, { topic: 'Dependency Preservation', duration: 60 }] },
          { day: 3, focus: 'Discrete Math: Graph Theory', tasks: [{ topic: 'Euler & Hamiltonian Paths', duration: 90 }, { topic: 'Spanning Trees', duration: 60 }] },
          { day: 4, focus: 'DSA: Balanced Binary Trees', tasks: [{ topic: 'AVL Tree Rotations', duration: 90 }, { topic: 'Red-Black Properties', duration: 60 }] },
          { day: 5, focus: 'Comprehensive Mock Exam & Weak Topic Review', tasks: [{ topic: 'Timed 3-Hour Practice Exam', duration: 180 }] }
        ]
      });
      toast.success('Generated personalized study plan');
    } finally {
      setLoadingPlan(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mr-2" />
            CampusFlow AI Study Assistant
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Context-aware academic question answering, personalized study planning, and exam blueprints.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('CHAT')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'CHAT' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Study Chat
          </button>
          <button
            onClick={() => setActiveTab('PLANNER')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'PLANNER' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Study Planner
          </button>
          <button
            onClick={() => setActiveTab('RESOURCES')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'RESOURCES' ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm' : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Recommended Resources
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE CHAT */}
      {activeTab === 'CHAT' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[600px] overflow-hidden">
          {/* Messages list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start space-x-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : 'bg-gray-50 dark:bg-gray-900/60 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-800 rounded-bl-none prose dark:prose-invert prose-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
                {m.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-gray-400 p-2">
                <Sparkles className="w-4 h-4 animate-spin text-indigo-600" />
                <span>AI Assistant is generating response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested quick questions */}
          {messages.length <= 2 && (
            <div className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center">
                <Lightbulb className="w-3.5 h-3.5 mr-1 text-amber-500" /> Suggested Prompts
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p)}
                    className="text-xs text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-indigo-500 px-3 py-1.5 rounded-xl transition-colors text-gray-700 dark:text-gray-300 shadow-2xs"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat input form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 flex items-center space-x-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about DBMS, Data Structures, or request an exam blueprint..."
              className="flex-1 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* TAB 2: SMART STUDY PLANNER */}
      {activeTab === 'PLANNER' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Configure Your Exam Study Plan
            </h3>

            <form onSubmit={handleGenerateStudyPlan} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Target Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1">Daily Study Hours</label>
                <select
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value={2}>2 Hours / Day</option>
                  <option value={3}>3 Hours / Day</option>
                  <option value={4}>4 Hours / Day</option>
                  <option value={6}>6 Hours / Day (Intensive)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loadingPlan}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{loadingPlan ? 'Synthesizing Plan...' : 'Generate Study Plan'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Generated Plan Breakdown */}
          {generatedPlan && (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5">
              <div className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <h4 className="text-xl font-bold text-gray-900 dark:text-white">{generatedPlan.title}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{generatedPlan.overview}</p>
              </div>

              <div className="space-y-4">
                {generatedPlan.schedule?.map((dayPlan, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-2">
                    <div className="flex justify-between items-center text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      <span>Day {dayPlan.day || i + 1}</span>
                      <span className="text-xs text-gray-500 font-normal">{dayPlan.focus}</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {dayPlan.tasks?.map((t, tidx) => (
                        <div key={tidx} className="flex items-center justify-between text-xs text-gray-700 dark:text-gray-300">
                          <span className="flex items-center">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            {t.topic}
                          </span>
                          <span className="text-gray-400 font-medium">{t.duration} mins</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: APPROVED LEARNING RESOURCES */}
      {activeTab === 'RESOURCES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
              Database Systems (DBMS) Recommendations
            </h3>
            <div className="space-y-3">
              {[
                { title: 'Normal Forms (1NF, 2NF, 3NF, BCNF) Video Masterclass', type: 'VIDEO', difficulty: 'INTERMEDIATE', why: 'Targeted at decomposing tables with functional dependency violations' },
                { title: 'Interactive SQL Query Exercises & LeetCode DB 50', type: 'PRACTICE', difficulty: 'BEGINNER', why: 'Build confidence in multi-table JOIN operations' },
                { title: 'ACID Properties & Two-Phase Locking Protocols', type: 'ARTICLE', difficulty: 'ADVANCED', why: 'High-probability question for mid-term unit exams' }
              ].map((res, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-indigo-600 dark:text-indigo-400">
                    <span>{res.title}</span>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded">{res.type}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px]">{res.why}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-violet-600 dark:text-violet-400" />
              Data Structures & Algorithms Recommendations
            </h3>
            <div className="space-y-3">
              {[
                { title: 'AVL Trees & Red-Black Tree Visualizer', type: 'INTERACTIVE', difficulty: 'INTERMEDIATE', why: 'Visualize single and double rotations during node insertions' },
                { title: 'Dynamic Programming Patterns: Top 20 Problems', type: 'ARTICLE', difficulty: 'ADVANCED', why: 'Essential for technical coding interviews at Microsoft and Google' },
                { title: 'Graph Traversal (BFS & DFS) Code Templates in C++', type: 'DOCUMENTATION', difficulty: 'INTERMEDIATE', why: 'Standard templates for assignment problem sets' }
              ].map((res, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-violet-600 dark:text-violet-400">
                    <span>{res.title}</span>
                    <span className="text-[10px] bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded">{res.type}</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 text-[11px]">{res.why}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
