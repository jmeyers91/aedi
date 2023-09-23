import { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { blockButtonClassName } from './block-button';
import { PlusIcon } from './icons/plus-icon';
import { Menu, Transition } from '@headlessui/react';
import { LogoutIcon } from './icons/logout-icon';
import { DownloadIcon } from './icons/download-icon';
import { MenuIcon } from './icons/menu-icon';

export function Layout() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="font-sans h-screen overflow-auto flex flex-col text-gray-700">
      <header className="flex justify-between items-center p-4 shadow">
        <Link className="text-3xl font-semibold text-sky-800" to="/">
          Contacts
        </Link>
        {!!user && (
          <div className="flex flex-row items-center gap-8 pr-8">
            <Link
              to="/contacts/add"
              className={`${blockButtonClassName()} flex items-center gap-2`}
            >
              <PlusIcon /> Add Contact
            </Link>

            <Menu>
              <div className="relative">
                <Menu.Button>
                  <button className="text-sky-500 hover:text-sky-800 transition-colors">
                    <MenuIcon />
                  </button>
                </Menu.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                  className="absolute right-0 z-10"
                >
                  <Menu.Items>
                    <div className="w-60 p-8 flex flex-col items-start gap-6 text-gray-700 bg-white shadow-xl rounded">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              console.log('TODO: Download contacts CSV');
                            }}
                            className={`w-full flex gap-4 ${
                              active ? 'text-sky-800' : ''
                            }`}
                          >
                            <DownloadIcon /> Export contacts
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`w-full flex gap-4 ${
                              active ? 'text-red-600' : ''
                            }`}
                          >
                            <LogoutIcon /> Logout
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </div>
            </Menu>
          </div>
        )}
      </header>
      <Outlet />
    </div>
  );
}
