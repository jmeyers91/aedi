import { uploadStaticSiteConfigScript } from '@sep6/idea2-local';
import { staticSite } from '@sep6/idea2-test-cases';
import { writeFile } from 'fs/promises';

main();

async function main() {
  const localConfigPath =
    './apps/idea2-static-site-test-app/local-client-config.json';
  const staticSiteConfig = await uploadStaticSiteConfigScript(staticSite);
  await writeFile(
    localConfigPath,
    JSON.stringify(staticSiteConfig, null, 2),
    'utf8'
  );
  console.log(`Client config written: ${localConfigPath}`);
}
