import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client-config';

enum ContactQueryKey {
  useContactList = 'useContactList',
}

export function useContactList() {
  return useQuery([ContactQueryKey.useContactList], api.listContacts);
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation(api.createContact, {
    onSuccess() {
      queryClient.invalidateQueries({
        queryKey: [ContactQueryKey.useContactList],
      });
    },
  });
}
