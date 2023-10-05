export interface TypescriptAsset {
  typescriptAssetPath: string;
  copyDir?: string;
  buildOptions?: {
    outdir?: string;
  };
}

export function TypescriptAsset(
  filepath: string,
  options: Omit<TypescriptAsset, 'typescriptAssetPath'> = {},
): TypescriptAsset {
  return { ...options, typescriptAssetPath: filepath };
}

export function isTypescriptAsset(
  value: string | TypescriptAsset | undefined,
): value is TypescriptAsset {
  return !!(
    value &&
    typeof value === 'object' &&
    'typescriptAssetPath' in value
  );
}
