import { Link, Outlet } from 'react-router-dom';
import { useContactList } from '../../hooks/contact-hooks';
import styles from './contacts-page.module.css';

export function ContactsPage() {
  const { data } = useContactList();

  return (
    <div className={styles.ContactsPage}>
      <div className={styles.Left}>
        <div className={styles.ContactListSubHead}>
          <Link to="/contacts/add">Add contact</Link>
        </div>
        <ul className={styles.ContactList}>
          {data?.items?.map((contact) => (
            <li key={contact.contactId} className={styles.ContactListItem}>
              {contact.firstName || '[BLANK]'} {contact.lastName || '[BLANK]'}
            </li>
          ))}
        </ul>
      </div>
      <div className={styles.Right}>
        <Outlet />
      </div>
    </div>
  );
}
