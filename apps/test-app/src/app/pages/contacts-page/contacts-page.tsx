import { Outlet } from 'react-router-dom';
import { useContactList } from '../../hooks/contact-hooks';
import { ContactList } from './contact-list';

export function ContactsPage() {
  const { data, error } = useContactList();

  return (
    <main className="flex flex-col flex-1 ring-emerald-500">
      <div className="relative flex-1 h-full overflow-hidden">
        <div className="absolute left-0 right-0 top-0 bottom-0 grid grid-cols-2">
          {/* Left columns */}
          <div className="overflow-auto relative h-full">
            {!!data?.items && <ContactList contacts={data?.items} />}
            {!!error && <div>Error: {(error as Error).message}</div>}
            <div className="absolute right-0 top-4 bottom-4 w-[1px] bg-gray-100"></div>
          </div>
          {/* Right column */}
          <div className="overflow-auto p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </main>
  );
}
