import {
  type ResourceRef,
  type ConstructRefLookupMap,
  stackOf,
  LookupConstructRef,
  ConstructRef,
  ClientRef,
  ResolveRef,
  TransformedRef,
  getClientRefFromRef,
  resolveRef,
  RefType,
  StaticSiteRef,
} from '@aedi/common';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

let s3Client: S3Client;
const cache = new Map<ResourceRef, Promise<ConstructRef>>();

export interface RemoteConstructMap {
  bucketName: string;
  constructRefLookupMap: ConstructRefLookupMap;
}

export interface LocalConstructMap {
  filepath: string;
  constructRefLookupMap: ConstructRefLookupMap;
}

/**
 * Loads a resource ref's construct ref from its stack's map bucket.
 */
export function loadConstructRef<R extends ResourceRef>(
  ref: R,
): Promise<LookupConstructRef<R['type']>> {
  if (!cache.has(ref)) {
    cache.set(ref, load());
  }
  return cache.get(ref) as Promise<LookupConstructRef<R['type']>>;

  async function load() {
    if (!s3Client) {
      s3Client = new S3Client();
    }
    const bucketName = stackOf(ref).mapBucketName;

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: `${ref.uid}.json`,
      }),
    );
    if (!response.Body) {
      throw new Error(`Empty response from S3.`);
    }

    const constructRef = JSON.parse(await response.Body.transformToString());

    return constructRef;
  }
}

export async function resolveConstructRef<
  R extends ResourceRef | ClientRef | TransformedRef<any, any>,
>(ref: R, mockEvent?: any, mockContext?: any): Promise<ResolveRef<R>> {
  const resourceRef = getClientRefFromRef(ref).ref;

  return resolveRef(
    { [resourceRef.uid]: await loadConstructRef(resourceRef) },
    ref,
    // Fake lambda handler props for invoke scoped refs
    mockEvent,
    mockContext,
  );
}

export async function loadStaticSiteConfig<C>(
  staticSite: StaticSiteRef<C>,
): Promise<Record<string, unknown>> {
  const resolvedConfig: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(staticSite.clientConfig ?? {})) {
    if (!isResourceRef(value)) {
      resolvedConfig[key] = value;
      continue;
    }
    resolvedConfig[key] = await loadConstructRef(value);
  }
  return resolvedConfig;
}

function isResourceRef(value: unknown): value is ResourceRef {
  return !!(
    value &&
    typeof value === 'object' &&
    'type' in value &&
    Object.values(RefType).includes(value.type as RefType)
  );
}
