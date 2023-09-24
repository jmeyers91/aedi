import { Link, useParams } from 'react-router-dom';
import { useContact } from '../../hooks/contact-hooks';
import { formatContactName } from '../../utils/name-utils';
import { PencilIcon } from '../../components/icons/pencil-icon';
import { XIcon } from '../../components/icons/x-icon';
import {
  CloseContactPageLink,
  ContactPageDetailsSection,
} from './contacts-page';
import { SpinnerFill } from '../../components/spinner';
import { ErrorFill } from '../../components/error-components';

export function ViewContactPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const { data: contact, isLoading, error } = useContact(contactId as string);

  return (
    <ContactPageDetailsSection data-testid="view-contact-section">
      <CloseContactPageLink to="/contacts">
        <XIcon />
      </CloseContactPageLink>
      {isLoading && <SpinnerFill />}
      {!!error && <ErrorFill error={error} />}
      {!!contact && (
        <>
          <div className="flex items-center gap-4">
            <h3 className="text-xl" data-testid="contact-name">
              {formatContactName(contact.firstName, contact.lastName)}
            </h3>
            <Link
              to={`/contacts/edit/${contact.contactId}`}
              className="text-gray-700"
              data-testid="edit-contact-button"
            >
              <PencilIcon />
            </Link>
          </div>
          <p data-testid="contact-email">Email: {contact.email}</p>
          <p data-testid="contact-phone">Phone: {contact.phone}</p>
        </>
      )}
    </ContactPageDetailsSection>
  );
}
