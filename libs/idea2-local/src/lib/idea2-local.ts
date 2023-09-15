import type {
  LookupConstructRef,
  ResourceRef,
  ConstructRefLookupMap,
} from '@sep6/idea2';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { existsSync, readFileSync } from 'fs';

export interface RemoteConstructMap {
  bucketName: string;
  constructRefLookupMap: ConstructRefLookupMap;
}

export interface LocalConstructMap {
  filepath: string;
  constructRefLookupMap: ConstructRefLookupMap;
}

export async function loadIdea2ConstructMapFromS3(
  bucketName: string
): Promise<RemoteConstructMap> {
  const s3Client = new S3Client();
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: 'map.json',
    })
  );
  if (!response.Body) {
    throw new Error(`Empty response from S3.`);
  }

  const data = JSON.parse(await response.Body.transformToString());

  return {
    bucketName,
    constructRefLookupMap: data,
  };
}

export async function loadIdea2ConstructMapFromFile(
  filepath: string
): Promise<LocalConstructMap> {
  if (!existsSync(filepath)) {
    throw new Error(`Missing local construct map: ${filepath}`);
  }

  const data = JSON.parse(readFileSync(filepath, 'utf8'));

  return {
    filepath,
    constructRefLookupMap: data,
  };
}

export function getConstructRef<R extends ResourceRef>(
  map: RemoteConstructMap | LocalConstructMap,
  ref: R
) {
  return map.constructRefLookupMap[ref.uid] as LookupConstructRef<R['type']>;
}
