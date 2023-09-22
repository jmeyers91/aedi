import { RestApi } from '@aedi/idea2';
import { Scope } from '../idea';

export const scope = Scope('healthcheck-multi');

export const api = RestApi(scope, 'api');
