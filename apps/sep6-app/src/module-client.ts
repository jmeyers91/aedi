import Axios, { AxiosInstance } from 'axios';
import { ClientConfig, getClientConfig } from '@sep6/client-config';

const axiosCache = new Map<string, AxiosInstance>();

export function getModuleClient(moduleName: keyof ClientConfig['api']) {
  let axios = axiosCache.get(moduleName);

  if (!axios) {
    axios = Axios.create({
      baseURL: getClientConfig().api[moduleName].baseURL,
    });
  }

  return axios;
}
