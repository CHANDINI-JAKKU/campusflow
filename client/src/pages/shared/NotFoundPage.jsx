import React from 'react';
import { NavLink } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const NotFoundPage = () => {
  const { isAuthenticated, user } = useAuthStore();
  const dashboardPath = user?.role ? \`/\${user.role.toLowerCase()}/dashboard\` : '/login';

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</h1>
      <p className="mt-4 text-2xl font-medium text-gray-900 dark:text-white">Page not found</p>
      <p className="mt-2 text-gray-500 dark:text-gray-400">Sorry, we couldn't find the page you're looking for.</p>
      <NavLink
        to={isAuthenticated ? dashboardPath : '/login'}
        className="mt-6 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
      >
        Go back home
      </NavLink>
    </div>
  );
};

export default NotFoundPage;
