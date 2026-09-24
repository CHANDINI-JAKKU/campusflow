import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const RoleRoute = ({ allowedRoles }) => {
  const { user } = useAuthStore();
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (!allowedRoles.includes(user.role)) {
    // Redirect to their specific dashboard
    const roleRoutes = {
      STUDENT: '/student/dashboard',
      FACULTY: '/faculty/dashboard',
      COLLEGE_ADMIN: '/admin/dashboard',
      SUPER_ADMIN: '/super-admin/dashboard',
      PLACEMENT_OFFICER: '/placement/dashboard'
    };
    return <Navigate to={roleRoutes[user.role] || '/login'} replace />;
  }

  return <Outlet />;
};
