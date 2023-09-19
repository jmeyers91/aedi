import { Idea2App, Stack } from '@sep6/idea2';

export const idea = new Idea2App();
export const Scope = (id: string) => Stack(idea, `idea2-test-${id}`);
