/* eslint-disable @typescript-eslint/no-explicit-any */
import Axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ClientConfig, getClientConfig } from '@sep6/client-config';
import { Auth } from 'aws-amplify';

const axiosCache = new Map<string, AxiosInstance>();

export function getModuleClient(moduleName: keyof ClientConfig['api']) {
  let axios = axiosCache.get(moduleName);

  if (!axios) {
    axios = Axios.create({
      baseURL: getClientConfig().api[moduleName].baseURL,
    });
    axios?.interceptors.request.use(addCognitoAuthHeaders);
  }

  return axios;
}

async function addCognitoAuthHeaders(req: InternalAxiosRequestConfig<any>) {
  Object.assign(req.headers, await getAuthHeader());
  return req;
}

async function getAuthHeader() {
  try {
    const token = (await Auth.currentSession()).getIdToken().getJwtToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    return {};
  }
}
