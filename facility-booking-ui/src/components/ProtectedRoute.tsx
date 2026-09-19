import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  
  // Safely get tokens and ensure they aren't the literal string "undefined"
  const rawToken = localStorage.getItem('accessToken') || localStorage.getItem('token');
  const token = (rawToken && rawToken !== 'undefined') ? rawToken.trim() : '';
  
  const rawRole = localStorage.getItem('userRole');
  const userRole = (rawRole && rawRole !== 'undefined') ? rawRole.trim().toUpperCase() : '';

  // Debugging log - open your browser console (F12) to see what is actually saving!
  console.log('ProtectedRoute Check -> Token:', token ? 'Exists' : 'Missing', '| Role:', userRole);

  // If there is no valid token, kick them to login
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If a specific role is required and the user doesn't have it, kick to login
  if (allowedRoles && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}