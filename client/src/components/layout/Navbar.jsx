import { Moon, Sun, Bell, LogOut, User as UserIcon } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import { useEffect, useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  return (
    <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex-1"></div>
      
      <div className="ml-4 flex items-center md:ml-6 space-x-4">
        <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        
        <button className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white dark:ring-gray-900" />
        </button>

        <div className="flex items-center space-x-3 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
          <div className="flex flex-col text-right">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</span>
          </div>
          <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
            <UserIcon className="w-5 h-5" />
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors ml-2">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
