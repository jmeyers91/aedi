import { uploadStaticSiteConfigScript } from '@sep6/idea2-local';
import { staticSite } from '@sep6/idea2-test-cases';

main();

async function main() {
  await uploadStaticSiteConfigScript(staticSite);
}
