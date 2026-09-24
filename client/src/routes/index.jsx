import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { ProtectedRoute, RoleRoute } from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import AppLayout from '../components/layout/AppLayout';

// Student Pages
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentAttendancePage from '../pages/student/AttendancePage';
import StudentAssignmentsPage from '../pages/student/AssignmentsPage';
import StudentPlacementsPage from '../pages/student/PlacementsPage';
import AIStudyAssistant from '../pages/student/AIStudyAssistant';

// Faculty Pages
import FacultyDashboard from '../pages/faculty/FacultyDashboard';
import FacultyAttendancePage from '../pages/faculty/AttendancePage';
import FacultyAssignmentsPage from '../pages/faculty/AssignmentsPage';

// College Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';

// Placement Officer Pages
import PlacementDashboard from '../pages/placement/PlacementDashboard';

// Super Admin Pages
import SADashboard from '../pages/super-admin/SADashboard';

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          // STUDENT ROUTES
          {
            path: 'student',
            element: <RoleRoute allowedRoles={['STUDENT']} />,
            children: [
              { path: 'dashboard', element: <StudentDashboard /> },
              { path: 'attendance', element: <StudentAttendancePage /> },
              { path: 'assignments', element: <StudentAssignmentsPage /> },
              { path: 'placements', element: <StudentPlacementsPage /> },
              { path: 'ai-assistant', element: <AIStudyAssistant /> },
            ]
          },
          // FACULTY ROUTES
          {
            path: 'faculty',
            element: <RoleRoute allowedRoles={['FACULTY']} />,
            children: [
              { path: 'dashboard', element: <FacultyDashboard /> },
              { path: 'attendance', element: <FacultyAttendancePage /> },
              { path: 'assignments', element: <FacultyAssignmentsPage /> },
            ]
          },
          // COLLEGE ADMIN ROUTES
          {
            path: 'admin',
            element: <RoleRoute allowedRoles={['COLLEGE_ADMIN']} />,
            children: [
              { path: 'dashboard', element: <AdminDashboard /> },
            ]
          },
          // PLACEMENT OFFICER ROUTES
          {
            path: 'placement',
            element: <RoleRoute allowedRoles={['PLACEMENT_OFFICER']} />,
            children: [
              { path: 'dashboard', element: <PlacementDashboard /> },
            ]
          },
          // SUPER ADMIN ROUTES
          {
            path: 'super-admin',
            element: <RoleRoute allowedRoles={['SUPER_ADMIN']} />,
            children: [
              { path: 'dashboard', element: <SADashboard /> },
            ]
          },
        ]
      }
    ]
  }
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
