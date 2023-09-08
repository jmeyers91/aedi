import { NestModule, getNestControllerInfo, walkModule } from './reflect-utils';

export function logNestTree(nestModule: NestModule): void {
  walkModule(nestModule, (node, depth) => {
    const space = ''.padStart(depth + 1, ' ');

    console.log(`${space}- ${node.module.name}`);
    console.log(
      `${space}  - Imports: ${node.imports
        .map((importedModule) => importedModule.name)
        .join(', ')}`
    );
    console.log(
      `${space}  - Controllers: ${node.controllers
        .map(
          (controller) =>
            `${controller.name}\n${getNestControllerInfo(controller)
              .routes.map(
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
        .map((providerOrModule) => providerOrModule.name)
        .join(', ')}`
    );
    console.log();
  });
}
