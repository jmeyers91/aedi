import { useMemo } from 'react';
import { SpinnerFill } from '../../components/spinner';
import { useContactList } from '../../hooks/contact-hooks';
import { ContactPageDetailsSection } from './contacts-page';
import { formatContactName } from '../../utils/name-utils';

export function ContactStats() {
  const { isLoading, data } = useContactList();
  const stats = useMemo(() => {
    if (!data?.items) {
      return null;
    }
    const contacts = data.items;

    return {
      contactCount: contacts.length,
      longestName: contacts
        .map((it) => formatContactName(it.firstName, it.lastName))
        .sort((a, b) => b.length - a.length)
        .at(0),
      shortestName: contacts
        .map((it) => formatContactName(it.firstName, it.lastName))
        .sort((a, b) => a.length - b.length)
        .at(0),
    };
  }, [data]);

  return (
    <ContactPageDetailsSection data-testid="contact-stats-section">
      {isLoading && <SpinnerFill />}

      {stats && (
        <div className="flex flex-col gap-2">
          <h3 className="font-semibold text-lg mb-4">Contact stats</h3>
          <p>Contact count: {stats.contactCount}</p>
          <p>Longest name: {stats.longestName}</p>
          <p>Shortest name: {stats.shortestName}</p>
        </div>
      )}
    </ContactPageDetailsSection>
  );
}
