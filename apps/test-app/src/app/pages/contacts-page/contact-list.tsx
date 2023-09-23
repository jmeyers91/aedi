import { formatContactName } from '../../../utils/name-utils';
import { Link } from 'react-router-dom';
import { PlusIcon } from '../../components/icons/plus-icon';
import type { Contact } from 'libs/test-cases/src/lib/static-site';
import { blockButtonClassName } from '../../components/block-button';

export function ContactList({ contacts }: { contacts: Contact[] }) {
  return (
    <div className="relative flex flex-col gap-6 px-6 pb-16 flex-1 h-full overflow-auto">
      <div className="flex justify-between gap-6 sticky left-0 right-0 top-0 py-6">
        <input
          placeholder="Search"
          className="flex-1 rounded-lg px-4 bg-gray-100 shadow-lg"
        />
        <Link
          to="/contacts/add"
          className={`${blockButtonClassName()} flex items-center gap-2 shadow-lg`}
        >
          <PlusIcon /> Add Contact
        </Link>
      </div>
      <ul className="flex flex-col gap-6">
        {contacts.length === 0 && (
          <li>
            <p>You don't have any contacts yet. Add some.</p>
          </li>
        )}
        {contacts.map((contact) => (
          <li key={contact.contactId} className="flex">
            <Link
              to={`/contacts/view/${contact.contactId}`}
              className="flex items-center gap-4 w-full"
            >
              <img
                src="profile-pic.png"
                className="w-16 h-16 rounded-full overflow-hidden bg-center object-cover bg-gray-200"
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
