import { restApi } from '@sep6/idea2';
import { createScope } from '../idea';

export const scope = createScope('healthcheck-multi');

export const api = restApi(scope, 'api');