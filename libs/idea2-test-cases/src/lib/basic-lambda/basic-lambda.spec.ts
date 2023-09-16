/* eslint-disable @typescript-eslint/no-explicit-any */
import { getConstructRef } from '@sep6/idea2-local';
import { RefType, getCallableLambdaRef } from '@sep6/idea2';
import { loadTestConstructMap } from '../test-utils/load-test-construct-map';
import { echo as echoLambda, echoProxy } from './basic-lambda';

describe('basic lambda', () => {
  test('echo should return its input event', async () => {
    const callable = getCallableLambdaRef({
      refType: RefType.LAMBDA,
      clientRef: echoLambda as any,
      constructRef: getConstructRef(await loadTestConstructMap(), echoLambda),
    });
    expect(JSON.parse(await callable({ hello: 'world' }))).toEqual({
      hello: 'world',
    });
  });

  test('proxy echo should return its input event', async () => {
    const callable = getCallableLambdaRef({
      refType: RefType.LAMBDA,
      clientRef: echoLambda as any,
      constructRef: getConstructRef(await loadTestConstructMap(), echoProxy),
    });
    expect(JSON.parse(await callable({ hello: 'world' }))).toEqual({
      hello: 'world',
    });
  });
});
