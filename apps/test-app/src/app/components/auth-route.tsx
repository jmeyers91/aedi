import { ComponentProps, useContext, Fragment } from 'react';
import { UserContext } from '../contexts/user-context';
import { Navigate } from 'react-router-dom';

export function AuthRoute({ children }: ComponentProps<typeof Fragment>) {
  const { user } = useContext(UserContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function NoAuthRoute({ children }: ComponentProps<typeof Fragment>) {
  const { user } = useContext(UserContext);

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
