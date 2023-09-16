/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ClientRef,
  ResolveRef,
  ResourceRef,
  TransformedRef,
  resolveRef,
} from '@sep6/idea2';
import {
  LocalConstructMap,
  RemoteConstructMap,
  loadIdea2ConstructMapFromFile,
} from '@sep6/idea2-local';

let cachedConstructMap: Promise<RemoteConstructMap | LocalConstructMap>;

export function loadTestConstructMap() {
  if (cachedConstructMap) {
    return cachedConstructMap;
  }
  cachedConstructMap = loadIdea2ConstructMapFromFile(
    './test-construct-map.json'
  );
  return cachedConstructMap;
}

export async function resolveTestRef<
  R extends ResourceRef | ClientRef | TransformedRef<any, any>
>(
  ref: R,
  mockEvent?: any,
  mockContext?: any,
  mockCallback?: any
): Promise<ResolveRef<R>> {
  const { constructRefLookupMap } = await loadTestConstructMap();

  return resolveRef(
    constructRefLookupMap,
    ref,
    // Fake lambda handler props for invoke scoped refs
    mockEvent,
    mockContext,
    mockCallback
  );
}
