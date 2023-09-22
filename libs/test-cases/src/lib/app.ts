import { AediApp, Stack } from '@aedi/common';

export const app = new AediApp();
export const Scope = (id: string) => Stack(app, `aedi-test-${id}`);
