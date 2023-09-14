import { RemoteConstructMap, loadIdea2ConstructMap } from '@sep6/idea2-local';

let cachedConstructMap: Promise<RemoteConstructMap>;

export function loadTestConstructMap() {
  if (cachedConstructMap) {
    return cachedConstructMap;
  }
  cachedConstructMap = loadIdea2ConstructMap('idea2-test-stack-construct-map');
  return cachedConstructMap;
}
