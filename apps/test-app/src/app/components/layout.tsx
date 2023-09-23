import { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { blockButtonClassName } from './block-button';
import { PlusIcon } from './icons/plus-icon';

export function Layout() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="font-sans h-screen overflow-auto flex flex-col text-gray-700">
      <header className="flex justify-between items-center p-4 shadow">
        <Link className="text-3xl font-semibold text-sky-800" to="/">
          Contacts
        </Link>
        <div className="flex flex-row items-center gap-8 pr-8">
          <Link
            to="/contacts/add"
            className={`${blockButtonClassName()} flex items-center gap-2`}
          >
            <PlusIcon /> Add Contact
          </Link>
          {!!user && (
            <button
              onClick={logout}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </header>
      <Outlet />
    </div>
  );
}
