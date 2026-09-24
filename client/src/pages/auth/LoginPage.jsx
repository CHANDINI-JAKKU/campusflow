import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import useAuthStore from '../../store/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const user = await login(data.email, data.password);
      toast.success(`Welcome back, ${user.firstName}!`);
      
      const roleRoutes = {
        STUDENT: '/student/dashboard',
        FACULTY: '/faculty/dashboard',
        COLLEGE_ADMIN: '/admin/dashboard',
        SUPER_ADMIN: '/super-admin/dashboard',
        PLACEMENT_OFFICER: '/placement/dashboard'
      };
      navigate(roleRoutes[user.role]);
    } catch (err) {
      toast.error(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200 dark:shadow-none mb-3">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-center text-3xl font-black tracking-tight text-gray-900 dark:text-white">
          CampusFlow
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500 dark:text-gray-400 font-medium">
          Smart College Management + AI Student Success Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Navigation Switcher between Sign In and Sign Up */}
        <div className="flex bg-gray-200/80 dark:bg-gray-800 p-1 rounded-2xl mb-4">
          <button
            type="button"
            className="flex-1 py-2 text-xs font-bold rounded-xl bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm transition-all"
          >
            Sign In
          </button>
          <Link
            to="/register"
            className="flex-1 py-2 text-xs font-semibold rounded-xl text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
          >
            Sign Up
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700/80 space-y-6">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1.5">
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:text-white"
                />
                {errors.email && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Password
              </label>
              <div className="mt-1.5">
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  className="appearance-none block w-full px-3.5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:text-white"
                />
                {errors.password && (
                  <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign in to Account'}
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
