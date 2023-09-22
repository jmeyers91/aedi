import { RestApi } from '@aedi/common';
import { Scope } from '../app';

export const scope = Scope('healthcheck-multi');

export const api = RestApi(scope, 'api');
