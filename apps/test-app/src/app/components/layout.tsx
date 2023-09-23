import { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';

export function Layout() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="font-sans h-screen overflow-auto flex flex-col text-gray-700">
      <header className="flex justify-between p-4 shadow">
        <Link className="text-3xl font-semibold" to="/">
          Contacts
        </Link>
        {!!user && (
          <button onClick={logout} className="font-semibold">
            Logout
          </button>
        )}
      </header>
      <Outlet />
    </div>
  );
}
