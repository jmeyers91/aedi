import Axios, { AxiosInstance } from 'axios';
import { ApiConfig, clientConfig } from './client-config';

const axiosCache = new Map<string, AxiosInstance>();

export function getModuleClient(moduleName: keyof ApiConfig) {
  let axios = axiosCache.get(moduleName);

  if (!axios) {
    axios = Axios.create({ baseURL: clientConfig.api[moduleName].baseURL });
  }

  return axios;
}
