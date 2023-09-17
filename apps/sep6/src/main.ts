import { idea } from '@sep6/idea2-test-cases';

const searchScope = 'static-site';

for (const resource of idea.resourceRefs) {
  if (searchScope.length > 0 && !resource.uid.includes(searchScope)) {
    continue;
  }
  console.log(`${resource.type} ${resource.uid}`);
  console.log(
    Object.entries(resource)
      .map(
        ([key, value]) =>
          `    ${key}: ${
            typeof value === 'function' ? '[Function]' : JSON.stringify(value)
          }`
      )
      .join('\n')
  );
  console.log();
}
