import type {
  LookupConstructRef,
  ResourceRef,
  ConstructRefLookupMap,
} from '@sep6/idea2';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

export interface RemoteConstructMap {
  ssmParamName: string;
  constructRefLookupMap: ConstructRefLookupMap;
}

export async function loadIdea2ConstructMap(
  ssmParamName: string
): Promise<RemoteConstructMap> {
  const ssmClient = new SSMClient();
  const response = await ssmClient.send(
    new GetParameterCommand({
      Name: ssmParamName,
    })
  );
  // TODO: Add some sanity checks
  return {
    ssmParamName,
    constructRefLookupMap: JSON.parse(response.Parameter?.Value as string),
  };
}

export function getConstructRef<R extends ResourceRef>(
  map: RemoteConstructMap,
  ref: R
) {
  return map.constructRefLookupMap[ref.uid] as LookupConstructRef<R['type']>;
}
