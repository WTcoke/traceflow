import { createBrowserRouter, Navigate } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import PerformancePage from '@/pages/PerformancePage';
import BehaviorPage from '@/pages/BehaviorPage';
import ErrorMonitorPage from '@/pages/ErrorMonitorPage';

const routes = [
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  { path: '/dashboard', element: <DashboardPage /> },
  { path: '/performance', element: <PerformancePage /> },
  { path: '/behavior', element: <BehaviorPage /> },
  { path: '/error-monitor', element: <ErrorMonitorPage /> },
];

export const router = createBrowserRouter(routes);
