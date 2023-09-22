import { FormEvent } from 'react';
import { useCreateContact } from '../../hooks/contact-hooks';
import style from './add-contact-page.module.css';

export function AddContactPage() {
  const createContact = useCreateContact();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    await createContact.mutateAsync({
      firstName,
      lastName,
      email,
      phone,
    });

    event.currentTarget?.reset();
  };

  return (
    <div className={style.AddContactPage}>
      <h1>Add a contact</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="firstName">First name</label>
        <input id="firstName" name="firstName" />

        <label htmlFor="lastName">Last name</label>
        <input id="lastName" name="lastName" />

        <label htmlFor="email">Email</label>
        <input id="email" name="email" />

        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
