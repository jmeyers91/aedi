import { useContext } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { UserContext } from '../contexts/user-context';
import { blockButtonClassName } from './block-button';
import { PlusIcon } from './icons/plus-icon';
import { Menu, Transition } from '@headlessui/react';
import { LogoutIcon } from './icons/logout-icon';
import { DownloadIcon } from './icons/download-icon';
import { MenuIcon } from './icons/menu-icon';
import { api } from '../client-config';
import { SettingsIcon } from './icons/settings-icon';
import { useLogout } from '../hooks/auth-hooks';

export function Layout() {
  const { user } = useContext(UserContext);
  const logout = useLogout();

  return (
    <div className="font-sans h-screen overflow-auto flex flex-col text-gray-700">
      <header className="flex justify-between items-center p-4 shadow z-20">
        <Link className="text-3xl font-semibold text-sky-500" to="/">
          Contacts
        </Link>
        {!!user && (
          <div className="flex flex-row items-center gap-8 pr-8">
            <Link
              data-testid="add-contact-button"
              to="/contacts/add"
              className={`${blockButtonClassName()} flex items-center gap-2`}
            >
              <PlusIcon /> Add Contact
            </Link>

            <Menu>
              <div className="relative">
                <Menu.Button className="text-sky-500 hover:text-sky-800 transition-colors">
                  <MenuIcon />
                </Menu.Button>
                <Transition
                  enter="transition duration-100 ease-out"
                  enterFrom="transform scale-95 opacity-0"
                  enterTo="transform scale-100 opacity-100"
                  leave="transition duration-75 ease-out"
                  leaveFrom="transform scale-100 opacity-100"
                  leaveTo="transform scale-95 opacity-0"
                  className="absolute right-0 z-30"
                >
                  <Menu.Items className="w-80 p-8 flex flex-col items-start text-gray-700 bg-white shadow-xl rounded">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={async () => {
                            const response = await api.exportContactsRequest();
                            const file = await response.blob();
                            const fileURL = URL.createObjectURL(file);
                            const fileLink = document.createElement('a');

                            fileLink.href = fileURL;
                            fileLink.download = 'contacts.csv';
                            fileLink.click();
                          }}
                          className={`w-full flex gap-4 py-3 ${
                            active ? 'text-sky-800' : ''
                          }`}
                        >
                          <DownloadIcon /> Export contacts
                        </button>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          to="/account"
                          className={`w-full flex gap-4 py-3 ${
                            active ? 'text-sky-800' : ''
                          }`}
                        >
                          <SettingsIcon />
                          Account Settings
                        </Link>
                      )}
                    </Menu.Item>

                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => logout.mutate()}
                          className={`w-full flex gap-4 py-3 ${
                            active ? 'text-red-600' : ''
                          }`}
                        >
                          <LogoutIcon /> Logout
                        </button>
                      )}
                    </Menu.Item>
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
