import { ComponentProps, useContext, Fragment } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function AuthRoute({ children }: ComponentProps<typeof Fragment>) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function NoAuthRoute({ children }: ComponentProps<typeof Fragment>) {
  const { user } = useContext(AuthContext);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
