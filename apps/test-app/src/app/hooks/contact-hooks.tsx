import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../client-config';
import { useSnackbar } from 'notistack';
import { debugThrottle } from '../utils/debug-utils';

enum ContactQueryKey {
  useContactList = 'useContactList',
  useContact = 'useContact',
}

export function useContactList() {
  return useQuery([ContactQueryKey.useContactList], async () => {
    await debugThrottle();
    return api.listContacts({});
  });
}

export function useContact(contactId: string | null | undefined) {
  return useQuery(
    [ContactQueryKey.useContact, contactId],
    async () => {
      await debugThrottle();
      return api.getContact({ contactId: contactId as string });
    },
    { enabled: !!contactId },
  );
}

export function useCreateContact() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  return useMutation(api.createContact, {
    onSuccess() {
      enqueueSnackbar({ variant: 'success', message: 'Contact created.' });
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
    onSuccess(_, { contactId }) {
      enqueueSnackbar({ variant: 'success', message: 'Contact saved.' });
      queryClient.invalidateQueries({
        queryKey: [ContactQueryKey.useContactList],
      });
      queryClient.invalidateQueries({
        queryKey: [ContactQueryKey.useContact, contactId],
      });
    },
  });
}

export function useDeleteContact() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  return useMutation(api.deleteContact, {
    onSuccess(_, { contactId }) {
      enqueueSnackbar({ variant: 'success', message: 'Contact deleted.' });
      queryClient.invalidateQueries({
        queryKey: [ContactQueryKey.useContactList],
      });
      queryClient.removeQueries({
        queryKey: [ContactQueryKey.useContact, contactId],
      });
    },
  });
}
