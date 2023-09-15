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
  // cachedConstructMap = loadIdea2ConstructMap('idea2-test-stack-construct-map');
  cachedConstructMap = loadIdea2ConstructMapFromFile(
    './test-construct-map.json'
  );
  return cachedConstructMap;
}
