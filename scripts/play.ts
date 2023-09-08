#!/bin/bash

import Axios, { AxiosError } from 'axios';

const apiUrl = 'https://1td7narsjk.execute-api.us-west-2.amazonaws.com/prod/';
const axios = Axios.create({
  baseURL: apiUrl,
  headers: {
    Authorization: 'jim',
  },
});

async function main() {
  try {
    const userHealthcheck = await axios.get('/healthcheck/user');

    console.log('success', userHealthcheck.data);

    const { data: contact } = await axios.post('/contacts', {
      firstName: 'jim',
      lastName: 'meyers',
      email: 'email@example.com',
      phone: '+15551234',
    });

    console.log('Created contact', contact);

    const updated = await axios.put(`/contacts/${contact.contactId}`, {
      firstName: 'joe',
    });

    console.log(`Updated contact`, updated.data);

    const get = await axios.get(`/contacts/${contact.contactId}`);

    console.log(`Got`, get.data);

    const deleted = await axios.delete(`/contacts/${contact.contactId}`);

    console.log(`Deleted`, deleted.data);

    const list = await axios.get('/contacts');

    console.log(`Listed`, list.data);
  } catch (error) {
    const axiosError = error as AxiosError;
    console.log(
      'error',
      axiosError?.response?.data ?? (error as Error).message
    );
  }
}

main();
