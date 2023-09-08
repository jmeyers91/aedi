import { getResourceMetadata } from './decorators/resource-module';
import { NestModule, getModuleName, walkModule } from './reflect-utils';

export function logNestTree(nestModule: NestModule): void {
  walkModule(nestModule, (node, depth) => {
    const space = ''.padStart(depth * 2 + 1, ' ');

    console.log(`${space}- ${node.name}`);
    console.log(
      `${space}  - Imports: ${node.imports.map(getModuleName).join(', ')}`
    );

    console.log(
      `${space}  - Controllers: ${node.controllers
        .map(
          (controller) =>
            `${controller.name}\n${controller.routes
              .map(
                (route) =>
                  `${space}    - ${route.name.toString()} ${route.method} ${
                    route.path
                  }`
              )
              .join('\n')}`
        )
        .join(', ')}`
    );
    console.log(
      `${space}  - Providers: ${node.providers
        .map((provider) => provider.name)
        .join(', ')}`
    );
    console.log(
      `${space}  - Exports: ${node.exports
        .map((providerOrModule) => getModuleName(providerOrModule))
        .join(', ')}`
    );
    console.log(
      `${space}  - Resources: ${getResourceMetadata(node.module)?.type}`
    );
    console.log();
  });
}
