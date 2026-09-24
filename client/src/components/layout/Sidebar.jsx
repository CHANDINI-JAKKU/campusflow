import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { 
  LayoutDashboard, BookOpen, CheckSquare, 
  Users, Building, FileText, BrainCircuit, Briefcase, 
  Shield, Bell, Calendar, Sparkles
} from 'lucide-react';

const NAV_ITEMS = {
  STUDENT: [
    { name: 'My Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Attendance & 75% Alerts', href: '/student/attendance', icon: CheckSquare },
    { name: 'Assignments & Grades', href: '/student/assignments', icon: BookOpen },
    { name: 'Campus Placements', href: '/student/placements', icon: Briefcase },
    { name: 'AI Study Assistant', href: '/student/ai-assistant', icon: BrainCircuit },
  ],
  FACULTY: [
    { name: 'Faculty Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Mark Attendance', href: '/faculty/attendance', icon: CheckSquare },
    { name: 'Assignments & Grading', href: '/faculty/assignments', icon: BookOpen },
  ],
  COLLEGE_ADMIN: [
    { name: 'College Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  ],
  PLACEMENT_OFFICER: [
    { name: 'Placement Hub', href: '/placement/dashboard', icon: Briefcase },
  ],
  SUPER_ADMIN: [
    { name: 'Super Admin Plane', href: '/super-admin/dashboard', icon: Shield },
  ]
};

export default function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const navigation = NAV_ITEMS[user?.role] || [];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="p-1.5 bg-indigo-600 rounded-xl text-white shadow-sm mr-2.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-gray-900 dark:text-white">CampusFlow</span>
            <span className="block text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest -mt-1">
              AI Powered
            </span>
          </div>
        </div>
        
        <div className="flex-1 flex flex-col overflow-y-auto pt-4">
          <div className="px-4 mb-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {user?.role?.replace('_', ' ')} PORTAL
            </span>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-xs font-semibold rounded-xl transition-all duration-150
                    ${isActive 
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/80 dark:text-indigo-300 shadow-2xs font-bold' 
                      : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <item.icon className={`mr-3 flex-shrink-0 h-4 w-4 ${isActive ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-400 group-hover:text-gray-500 dark:group-hover:text-gray-300'}`} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
