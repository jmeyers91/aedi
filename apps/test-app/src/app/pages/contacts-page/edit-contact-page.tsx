import { FormEvent } from 'react';
import {
  useContact,
  useCreateContact,
  useDeleteContact,
  useUpdateContact,
} from '../../hooks/contact-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { BlockButton } from '../../components/block-button';
import { ErrorFill, FormError } from '../../components/error-components';
import Swal from 'sweetalert2';
import { formatContactName } from '../../utils/name-utils';
import {
  CloseContactPageLink,
  ContactPageDetailsSection,
} from './contacts-page';
import { SpinnerFill } from '../../components/spinner';
import { InputGroup } from '../../components/input-group';

export function EditContactPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const { data: contact, error: loadError, isLoading } = useContact(contactId);
  const createContact = useCreateContact();
  const editContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const navigate = useNavigate();
  const saveError = createContact.error ?? editContact.error;
  const deleteError = deleteContact.error;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (contactId) {
      await editContact.mutateAsync({
        contactId,
        firstName,
        lastName,
        email,
        phone,
      });
      navigate(`/contacts/view/${contactId}`);
    } else {
      const newContact = await createContact.mutateAsync({
        firstName,
        lastName,
        email,
        phone,
      });
      navigate(`/contacts/view/${newContact.contactId}`);
    }
  };

  const handleDelete = async () => {
    if (!contact) return;

    const result = await Swal.fire({
      title: `Delete ${formatContactName(
        contact.firstName,
        contact.lastName,
      )}?`,
      text: "This action can't be undone.",
      icon: 'warning',
      confirmButtonText: 'Delete',
    });
    if (result.isConfirmed) {
      await deleteContact.mutateAsync({
        contactId: contact.contactId,
      });
      navigate('/contacts');
    }
  };

  return (
    <ContactPageDetailsSection
      data-testid={contactId ? 'edit-contact-section' : 'add-contact-section'}
    >
      <CloseContactPageLink
        to={contact ? `/contacts/view/${contact?.contactId}` : '/contacts'}
      />
      {!!loadError && <ErrorFill error={loadError} />}
      {!!(contactId && isLoading) && <SpinnerFill />}
      {(!contactId || !isLoading) && !loadError && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <h1 className="font-bold text-lg">
            {contact ? 'Edit contact' : 'Add contact'}
          </h1>

          <FormError error={saveError ?? deleteError} />

          <InputGroup
            name="firstName"
            label="First name"
            defaultValue={contact?.firstName}
            error={saveError}
          />
          <InputGroup
            name="lastName"
            label="Last name"
            defaultValue={contact?.lastName}
            error={saveError}
          />
          <InputGroup
            name="email"
            label="Email"
            defaultValue={contact?.email}
            error={saveError}
          />
          <InputGroup
            name="phone"
            label="Phone"
            defaultValue={contact?.phone}
            error={saveError}
          />

          <div className="mt-8 flex flex-col items-center gap-8 w-full">
            <BlockButton
              type="submit"
              className="w-48"
              disabled={
                editContact.isLoading ||
                createContact.isLoading ||
                deleteContact.isLoading
              }
            >
              Save
            </BlockButton>
            {!!contact && (
              <button
                type="button"
                disabled={
                  editContact.isLoading ||
                  createContact.isLoading ||
                  deleteContact.isLoading
                }
                className="text-gray-500 hover:text-red-800 transition-colors"
                onClick={handleDelete}
                data-testid="delete-contact-button"
              >
                Delete
              </button>
            )}
          </div>
        </form>
      )}
    </ContactPageDetailsSection>
  );
}
