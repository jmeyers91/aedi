import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client-config';
import { useSnackbar } from 'notistack';

enum ContactQueryKey {
  useContactList = 'useContactList',
  useContact = 'useContact',
}

export function useContactList() {
  return useQuery([ContactQueryKey.useContactList], api.listContacts);
}

export function useContact(contactId: string | null | undefined) {
  return useQuery(
    [ContactQueryKey.useContact, contactId],
    () => api.getContact({ contactId: contactId as string }),
    { enabled: !!contactId },
  );
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

export function useUpdateContact() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  return useMutation(api.updateContact, {
    onSuccess() {
      enqueueSnackbar({ variant: 'success', message: 'Contact updated.' });
      queryClient.invalidateQueries({
        queryKey: [ContactQueryKey.useContactList],
      });
      queryClient.invalidateQueries({
        queryKey: [ContactQueryKey.useContact],
      });
    },
  });
}
