import {
  Api,
  Scope as AediScope,
  RestApi,
  CustomResource,
  Lambda,
  SecretValue,
  CustomResourceResponse,
  Post,
  reply,
  lambdaProxyHandler,
  Construct,
  LambdaDependencyGroup,
} from '@aedi/common';
import { verifyKey } from 'discord-interactions';
import {
  DiscordCommandOptions,
  CreateDiscordCommandOptions,
  DiscordCommandHandler,
  DiscordInteractionType,
  DiscordCommandUserResponse,
} from './aedi-discord-types';

export function DiscordBot<C extends LambdaDependencyGroup>(
  scope: AediScope,
  id: string,
  {
    discordPublicKey,
    interactionPath,
    appId,
    serverId,
    botToken,
    memorySize,
    ...restApiOptions
  }: Parameters<typeof RestApi>[2] & {
    discordPublicKey: string;
    interactionPath?: string;
    memorySize?: number;
  } & DiscordCommandOptions,
  lambdaDependencies: C,
  commandDefs: {
    [K: string]: {
      options: CreateDiscordCommandOptions;
      handler: DiscordCommandHandler<C>;
    };
  },
) {
  const botScope = Construct(scope, id);
  const commandOptions: DiscordCommandOptions = {
    appId,
    serverId,
    botToken,
  };

  const api = Api(
    botScope,
    'api',
    {
      ...restApiOptions,
      // Required for discord request verification to work correctly
      binaryMediaTypes: [
        'application/json',
        ...({ ...restApiOptions }?.binaryMediaTypes ?? []),
      ],
    },
    {
      discordInteraction: Post(
        interactionPath ?? '/discord-interaction',
        lambdaDependencies,
        async (resolvedLambdaDependencies, event) => {
          try {
            const signature = event.headers['x-signature-ed25519'] ?? '';
            const timestamp = event.headers['x-signature-timestamp'] ?? '';
            const strBody = Buffer.from(event.body ?? '', 'base64').toString(
              'utf-8',
            );

            const isVerified = verifyKey(
              strBody,
              signature,
              timestamp,
              discordPublicKey,
            );

            if (!isVerified) {
              return reply(JSON.stringify('invalid request signature'), 401, {
                'Content-Type': 'application/json',
              });
            }

            const body = JSON.parse(strBody);
            if (body.type == 1) {
              return reply(
                JSON.stringify({ type: DiscordInteractionType.PING }),
                200,
                {
                  'Content-Type': 'application/json',
                },
              );
            }

            const command = commandDefs[body.data.name];

            if (!command) {
              console.error(`Unable to find command: ${body.data.name}`);
              return reply(
                {
                  statusCode: 404, // If no handler implemented for Discord's request
                },
                404,
              );
            }

            return reply(
              JSON.stringify(
                await command.handler(body, resolvedLambdaDependencies),
              ),
              200,
              {
                'Content-Type': 'application/json',
              },
            );
          } catch (error) {
            console.error(`Caught`, error);
            throw error;
          }
        },
        {
          /**
           * Using the default memory size of 128 on this function causes it to cold-start too slowly to
           * finish before discord's 3 second timeout even with deferred responses.
           */
          memorySize: memorySize ?? 1024,
        },
      ),
    },
  );

  return Object.assign(
    api,
    lambdaProxyHandler(id, [
      api,
      DiscordCommands(
        botScope,
        'commands',
        commandOptions,
        Object.entries(commandDefs).map(([key, value]) => ({
          ...value.options,
          name: key,
        })),
      ),
    ]),
  );
}

export function DiscordCommands(
  scope: AediScope,
  id: string,
  { appId, serverId, botToken }: DiscordCommandOptions,
  commands: CreateDiscordCommandOptions[],
) {
  return CustomResource(scope, id, {
    lambda: Lambda(
      scope,
      `${id}-lambda`,
      {
        botTokenString: SecretValue(botToken),
      },
      async ({ botTokenString }, event, context) => {
        const commandApiUrl = serverId
          ? `https://discord.com/api/v10/applications/${appId}/guilds/${serverId}/commands`
          : `https://discord.com/api/v10/applications/${appId}/commands`;

        console.log('Lambda is invoked with:' + JSON.stringify(event));
        console.log('Command definitions:', commands);
        console.log('commandApiUrl =', commandApiUrl);

        const response: CustomResourceResponse<string> = {
          Status: 'SUCCESS',
          Data: { Result: 'None' },
          StackId: event.StackId,
          RequestId: event.RequestId,
          LogicalResourceId: event.LogicalResourceId,
          PhysicalResourceId: context.logGroupName,
        };

        try {
          console.log(`Received ${event.RequestType} request`);
          if (event.RequestType == 'Delete') {
            const result = await sendUpdate([]);
            response.Data = { Result: JSON.stringify(result) };

            console.log(`Commands deleted`, result);
          } else if (event.RequestType === 'Update') {
            const result = await sendUpdate(commands);
            response.Data = { Result: JSON.stringify(result) };

            console.log(`Commands updated`, result);
          } else {
            const result = await sendUpdate(commands);
            response.Data = { Result: JSON.stringify(result) };

            console.log(`Commands created`, result);
          }

          return response;
        } catch (error) {
          console.error(`Error`, error);
          if (error instanceof Error) {
            response['Reason'] = error.message;
          }
          response['Status'] = 'FAILED';
          response.Data = { Result: (error as Error).message };
          return response;
        }

        async function sendUpdate(
          commandsToSend: CreateDiscordCommandOptions[],
        ) {
          const response = await fetch(commandApiUrl, {
            method: 'PUT',
            body: JSON.stringify(commandsToSend),
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bot ${botTokenString}`,
            },
          });

          if (!response.ok) {
            throw new Error(
              `Failed to update commands: ${await response
                .text()
                .catch(
                  (error) =>
                    `(failed to parse response: ${(error as Error).message})`,
                )}`,
            );
          }

          return response.json();
        }
      },
    ),
  });
}

type MaybeRequired<R extends boolean, T> = R extends true ? T : T | undefined;

export function findResponse<R extends boolean>(
  body: DiscordCommandUserResponse,
  optionName: string,
  required?: R,
): MaybeRequired<
  R,
  {
    name: string;
    type: number;
    value: string | number | boolean;
  }
> {
  const response = body.data.options.find(
    (option) => option.name === optionName,
  );
  if (required && !response) {
    throw new Error(`Unable to find response for option: ${optionName}`);
  }
  return response as any;
}

export function findResponseValue<const R extends boolean>(
  body: DiscordCommandUserResponse,
  optionName: string,
  required?: R,
): MaybeRequired<R, string> {
  return findResponse<R>(body, optionName, required)?.value as any;
}

export function findTypedResponseValue<T, const R extends boolean>(
  body: DiscordCommandUserResponse,
  optionName: string,
  required: R | undefined,
  typeName: string,
  checkType: (value: unknown) => value is T,
): MaybeRequired<R, T> {
  const value = findResponse(body, optionName, required)?.value;
  if (!required && value === undefined) {
    return undefined as any;
  }
  if (!checkType(value)) {
    throw new Error(`Expected ${optionName} to be ${typeName}. Got ${value}`);
  }
  return value;
}

export function findStringResponseValue<const R extends boolean>(
  body: DiscordCommandUserResponse,
  optionName: string,
  required?: R,
) {
  return findTypedResponseValue(
    body,
    optionName,
    required,
    'string',
    (it): it is string => typeof it === 'string',
  );
}

export function findBooleanResponseValue<const R extends boolean>(
  body: DiscordCommandUserResponse,
  optionName: string,
  required?: R,
) {
  return findTypedResponseValue(
    body,
    optionName,
    required,
    'boolean',
    (it): it is boolean => typeof it === 'boolean',
  );
}

export function findFloatResponseValue<const R extends boolean>(
  body: DiscordCommandUserResponse,
  optionName: string,
  required?: R,
) {
  return findTypedResponseValue(
    body,
    optionName,
    required,
    'number',
    (it): it is number => typeof it === 'number',
  );
}

export function findIntegerResponseValue<const R extends boolean>(
  body: DiscordCommandUserResponse,
  optionName: string,
  required?: R,
) {
  return findTypedResponseValue(
    body,
    optionName,
    required,
    'integer',
    (it): it is number => typeof it === 'number' && Math.floor(it) === it,
  );
}
