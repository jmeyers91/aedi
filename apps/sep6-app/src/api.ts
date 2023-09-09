import Axios from 'axios';
import { clientConfig } from './client-config';

export const apiAxios = Axios.create({
  baseURL: clientConfig.apiUrl,
});
