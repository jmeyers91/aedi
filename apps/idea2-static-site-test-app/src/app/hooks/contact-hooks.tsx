import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { clientConfig } from '../client-config';
import { userPool } from 'libs/idea2-test-cases/src/lib/static-site';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { CognitoUserSession } from 'amazon-cognito-identity-js';
import { getUserAuthHeaders } from '../../utils/cognito-utils';

enum ContactQueryKey {
  useContactList = 'useContactList',
}

export interface Contact {
  userId: string;
  contactId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export function useContactList() {
  const { user } = useContext(AuthContext);

  return useQuery([ContactQueryKey.useContactList], async () => {
    const response = await fetch(`${clientConfig?.api.url}contacts`, {
      headers: await getUserAuthHeaders(user),
    });
    const data = await response.json();
    return (data.items ?? []) as Contact[];
  });
}

export function useCreateContact() {
  const { user } = useContext(AuthContext);
  const queryClient = useQueryClient();

  return useMutation(
    async (contact: Omit<Contact, 'userId' | 'contactId'>) => {
      const response = await fetch(`${clientConfig?.api.url}contacts`, {
        method: 'POST',
        body: JSON.stringify(contact),
        headers: await getUserAuthHeaders(user),
      });
      const data = await response.json();
      return (data.Items ?? []) as Contact[];
    },
    {
      onSuccess() {
        queryClient.invalidateQueries({
          queryKey: [ContactQueryKey.useContactList],
        });
      },
    }
  );
}
