import { useContext } from 'react';
import { UserContext } from '../contexts/user-context';
import { Navigate } from 'react-router-dom';

export function IndexPage() {
  const { user } = useContext(UserContext);

  if (user) {
    return <Navigate to="/contacts" replace />;
  }

  return <Navigate to="/login" replace />;
}
