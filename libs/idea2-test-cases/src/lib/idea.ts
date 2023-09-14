import { Idea2App, construct } from '@sep6/idea2';

export const idea = new Idea2App();
export const createScope = (id: string) => construct(idea, id);
