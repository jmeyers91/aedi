import { Idea2App, Construct } from '@sep6/idea2';

export const idea = new Idea2App();
export const Scope = (id: string) => Construct(idea, id);
