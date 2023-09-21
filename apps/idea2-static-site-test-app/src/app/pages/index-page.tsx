import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function IndexPage() {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/contacts" replace />;
  }

  return <Navigate to="/login" replace />;
}
