import { FormEvent } from 'react';
import {
  useContact,
  useCreateContact,
  useUpdateContact,
} from '../../hooks/contact-hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { BlockButton } from '../../components/block-button';
import { FormError, FormFieldError } from '../../components/form-error';

export function EditContactPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const { data: contact, error: loadError } = useContact(contactId);
  const createContact = useCreateContact();
  const editContact = useUpdateContact();
  const navigate = useNavigate();
  const saveError = createContact.error ?? editContact.error;
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

  if (error) {
    return <div>Error: {(error as Error).message}</div>;
  }

  if (contactId && !contact) {
    return null; // TODO: Add spinner
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-bold text-lg">
        {contact ? 'Edit contact' : 'Add contact'}
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError error={saveError} />

        <div className="flex flex-col gap-2">
          <label htmlFor="firstName">First name</label>
          <input
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
            id="phone"
            name="phone"
            type="tel"
            placeholder="Phone"
            defaultValue={contact?.phone}
            className="p-4 rounded bg-gray-100"
          />
          <FormFieldError error={saveError} field="phone" />
        </div>

        <BlockButton
          type="submit"
          className="mt-8 w-48 self-center"
          disabled={editContact.isLoading || createContact.isLoading}
        >
          {contact ? 'Save' : 'Add'}
        </BlockButton>
      </form>
    </div>
  );
}
