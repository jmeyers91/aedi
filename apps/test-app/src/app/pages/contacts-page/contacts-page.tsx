import { Link, Outlet } from 'react-router-dom';
import { ContactList } from './contact-list';
import { XIcon } from '../../components/icons/x-icon';
import { ComponentProps } from 'react';

export function ContactsPage() {
  return (
    <main
      className="flex flex-col flex-1 ring-emerald-500"
      test-id="ContactsPage"
    >
      <div className="relative flex-1 h-full overflow-hidden">
        <div className="absolute left-0 right-0 top-0 bottom-0 grid sm:grid-cols-2">
          {/* Left columns */}
          <section className="overflow-auto relative h-full">
            <ContactList />
            <div className="absolute right-0 top-4 bottom-4 w-[1px] bg-gray-100"></div>
          </section>
          {/* Right column */}
          <Outlet />
        </div>
      </div>
    </main>
  );
}

export function ContactPageDetailsSection(props: ComponentProps<'section'>) {
  return (
    <section
      {...props}
      className="flex flex-col overflow-auto sm:relative absolute inset-0 p-8 bg-white z-10"
    />
  );
}

export function CloseContactPageLink(props: ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      aria-label="Back"
      className="text-gray-500 hover:text-gray-700 transition-colors absolute right-8 top-8"
    >
      <XIcon />
    </Link>
  );
}
