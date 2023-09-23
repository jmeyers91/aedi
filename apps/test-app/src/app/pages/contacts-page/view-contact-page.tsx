import { Link, useParams } from 'react-router-dom';
import { useContact } from '../../hooks/contact-hooks';
import { formatContactName } from '../../../utils/name-utils';
import { PencilIcon } from '../../components/icons/pencil-icon';

export function ViewContactPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const { data: contact, error } = useContact(contactId as string);

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  if (!contact) {
    return null; // TODO: Add spinner
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <h3 className="text-xl">
          {formatContactName(contact.firstName, contact.lastName)}
        </h3>
        <Link
          to={`/contacts/edit/${contact.contactId}`}
          className="text-gray-700"
        >
          <PencilIcon />
        </Link>
      </div>
      <p>Email: {contact.email}</p>
      <p>Phone: {contact.phone}</p>
    </div>
  );
}
