import { FormEvent } from 'react';
import {
  useContact,
  useCreateContact,
  useDeleteContact,
  useUpdateContact,
} from '../../hooks/contact-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { BlockButton } from '../../components/block-button';
import { FormError, FormFieldError } from '../../components/form-error';
import Swal from 'sweetalert2';
import { formatContactName } from '../../utils/name-utils';
import {
  CloseContactPageLink,
  ContactPageDetailsSection,
} from './contacts-page';

export function EditContactPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const { data: contact, error: loadError } = useContact(contactId);
  const createContact = useCreateContact();
  const editContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const navigate = useNavigate();
  const saveError = createContact.error ?? editContact.error;
  const deleteError = deleteContact.error;
  const error = loadError;

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

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  if (contactId && !contact) {
    return null; // TODO: Add spinner
  }

  return (
    <ContactPageDetailsSection>
      <CloseContactPageLink
        to={contact ? `/contacts/view/${contact?.contactId}` : '/contacts'}
      />

      <h1 className="font-bold text-lg">
        {contact ? 'Edit contact' : 'Add contact'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError error={saveError ?? deleteError} />

        <div className="flex flex-col gap-2">
          <label htmlFor="firstName">First name</label>
          <input
            required
            id="firstName"
            name="firstName"
            placeholder="First name"
            defaultValue={contact?.firstName}
            className="p-4 rounded bg-gray-100"
          />
          <FormFieldError error={saveError} field="firstName" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="lastName">Last name</label>
          <input
            required
            id="lastName"
            name="lastName"
            placeholder="Last name"
            defaultValue={contact?.lastName}
            className="p-4 rounded bg-gray-100"
          />
          <FormFieldError error={saveError} field="lastName" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="email">Email</label>
          <input
            required
            id="email"
            name="email"
            type="email"
            placeholder="Email"
            defaultValue={contact?.email}
            className="p-4 rounded bg-gray-100"
          />
          <FormFieldError error={saveError} field="email" />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone">Phone</label>
          <input
            required
            id="phone"
            name="phone"
            type="tel"
            placeholder="Phone"
            defaultValue={contact?.phone}
            className="p-4 rounded bg-gray-100"
          />
          <FormFieldError error={saveError} field="phone" />
        </div>

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
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </ContactPageDetailsSection>
  );
}
