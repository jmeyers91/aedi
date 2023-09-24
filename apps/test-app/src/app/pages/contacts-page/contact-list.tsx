import { formatContactName } from '../../utils/name-utils';
import { Link } from 'react-router-dom';
import { SearchIcon } from '../../components/icons/search-icon';
import { useState } from 'react';
import { useContactList } from '../../hooks/contact-hooks';
import { SpinnerFill } from '../../components/spinner';
import { XIcon } from '../../components/icons/x-icon';

export function ContactList() {
  const { data, isLoading } = useContactList();
  const [search, setSearch] = useState('');

  return (
    <div
      data-testid="contact-list"
      className="relative flex flex-col gap-6 pb-16 pt-4 flex-1 h-full overflow-auto"
    >
      <div className="flex flex-shrink-0 justify-between gap-6 sticky left-0 right-0 top-0 py-3 px-6">
        <div className="relative flex-1 flex">
          <input
            placeholder="Search"
            className="w-full rounded-lg p-4 bg-gray-100 shadow-lg ring-inherit"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />
          <div className="absolute right-4 top-4 text-emerald-800">
            {search.length > 0 ? (
              <button onClick={() => setSearch('')}>
                <XIcon size="w-6 h-6" />
              </button>
            ) : (
              <SearchIcon className="pointer-events-none" />
            )}
          </div>
        </div>
      </div>
      <ul className="flex flex-col flex-1">
        {data?.items?.length === 0 && (
          <li
            className="px-6 py-4 flex justify-center items-center flex-1 text-gray-500"
            data-testid="empty-contact-list"
          >
            <p>You don't have any contacts yet.</p>
          </li>
        )}
        {isLoading && (
          <li className="px-6 py-4 flex flex-1">
            <SpinnerFill />
          </li>
        )}
        {data?.items
          ?.filter((contact) => {
            if (search.length === 0) {
              return true;
            }
            return (
              contact.firstName.includes(search) ||
              contact.lastName.includes(search) ||
              contact.email.includes(search) ||
              contact.phone.includes(search)
            );
          })
          .map((contact) => (
            <li key={contact.contactId} className="flex">
              <Link
                to={`/contacts/view/${contact.contactId}`}
                className="flex items-center gap-4 w-full hover:bg-gray-100 transition-colors px-6 py-4"
              >
                <img
                  src="profile-pic.png"
                  className="w-16 h-16 flex-shrink-0 rounded-full overflow-hidden bg-center object-cover bg-gray-200"
                />

                <div className="flex flex-col gap-1">
                  <p className="font-semibold">
                    {formatContactName(contact.firstName, contact.lastName)}
                  </p>
                  <p>
                    {contact.email}, {contact.phone}
                  </p>
                </div>
              </Link>
            </li>
          ))}
      </ul>
    </div>
  );
}
