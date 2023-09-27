import {
  Api,
  Scope as AediScope,
  RestApi,
  CustomResource,
  Lambda,
  SecretRef,
  SecretValue,
  CustomResourceResponse,
  CustomResourceRef,
  Post,
  reply,
  lambdaProxyHandler,
  LambdaProxyHandler,
  Construct,
} from '@aedi/common';
import { verifyKey } from 'discord-interactions';

export enum DiscordInteractionCallbackType {
  PONG = 1, // ACK a Ping
  CHANNEL_MESSAGE_WITH_SOURCE = 4, // respond to an interaction with a message
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE = 5, // ACK an interaction and edit a response later, the user sees a loading state
  DEFERRED_UPDATE_MESSAGE = 6, // for components, ACK an interaction and edit the original message later; the user does not see a loading state
  UPDATE_MESSAGE = 7, // for components, edit the message the component was attached to
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT = 8, // respond to an autocomplete interaction with suggested choices
  MODAL = 9, //	respond to an interaction with a popup modal
  PREMIUM_REQUIRED = 10, // respond to an interaction with an upgrade button, only available for apps with monetization enabled
}

export interface DiscordInteractionResponseObject {
  type: DiscordInteractionCallbackType;
  data: {
    tts?: boolean; // is the response TTS
    content?: string; // message content
    embeds?: any[]; // of embeds	supports up to 10 embeds
    allowed_mentions?: any; // mentions	allowed mentions object
    flags?: number; // message flags combined as a bitfield (only SUPPRESS_EMBEDS and EPHEMERAL can be set)
    components?: any[]; // of components	message components
    attachments?: any[]; // of partial attachment objects	attachment objects with filename and description
  };
}

export interface DiscordCommandUserResponse {
  app_permissions: string;
  application_id: string;
  channel: {
    flags: number;
    guild_id: string;
    id: string;
    last_message_id: string;
    name: string;
    nsfw: boolean;
    parent_id: string;
    permissions: string;
    position: number;
    rate_limit_per_user: number;
    topic: null;
    type: number;
  };
  channel_id: string;
  data: {
    guild_id: string;
    id: string;
    name: string;
    type: DiscordInteractionCallbackType;
    options: {
      name: string;
      type: number;
      value: string;
    }[];
  };
  entitlement_sku_ids: any[];
  entitlements: any[];
  guild: {
    features: any[];
    id: string;
    locale: string;
  };
  guild_id: string;
  guild_locale: string;
  id: string;
  locale: string;
  member: {
    avatar: null;
    communication_disabled_until: null;
    deaf: boolean;
    flags: number;
    joined_at: string;
    mute: boolean;
    nick: null;
    pending: boolean;
    permissions: string;
    premium_since: null;
    roles: any[];
    unusual_dm_activity_until: null;
    user: {
      avatar: string;
      avatar_decoration_data: null;
      discriminator: string;
      global_name: string;
      id: string;
      public_flags: number;
      username: string;
    };
  };
  token: string;
  type: number;
  version: number;
}

export function DiscordBot(
  scope: AediScope,
  id: string,
  {
    discordPublicKey,
    interactionPath,
    appId,
    serverId,
    botToken,
    ...restApiOptions
  }: Parameters<typeof RestApi>[2] & {
    discordPublicKey: string;
    interactionPath?: string;
  } & DiscordCommandOptions,
  commandFns: Record<
    string,
    (
      scope: AediScope,
      id: string,
      options: DiscordCommandOptions,
    ) => DiscordCommandRef<any>
  >,
) {
  const botScope = Construct(scope, id);
  const commands: Record<string, DiscordCommandRef<any>> = {};
  const commandOptions: DiscordCommandOptions = {
    appId,
    serverId,
    botToken,
  };

  for (const [key, fn] of Object.entries(commandFns)) {
    commands[key] = fn(botScope, key, commandOptions);
  }

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
        {},
        async (_, event) => {
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
              return reply(JSON.stringify({ type: 1 }), 200, {
                'Content-Type': 'application/json',
              });
            }

            const command = commands[body.data.name];

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
              JSON.stringify(await command.discordCommandHandler(body)),
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
      ),
    },
  );

  return Object.assign(
    api,
    lambdaProxyHandler(id, [api, ...Object.values(commands)]),
  );
}

export type DiscordCommandHandler = (
  body: DiscordCommandUserResponse,
) =>
  | Promise<DiscordInteractionResponseObject>
  | DiscordInteractionResponseObject;

export type DiscordCommandRef<R> = CustomResourceRef<
  CustomResourceResponse<R> | Promise<CustomResourceResponse<R>>
> & { discordCommandHandler: DiscordCommandHandler } & LambdaProxyHandler;

export interface DiscordCommandOptions {
  appId: string;
  serverId?: string;
  botToken: SecretRef;
}

export function DiscordCommand(
  command: { name?: string; type: number; description: string; options: any[] },
  discordCommandHandler: DiscordCommandHandler,
) {
  return (scope: AediScope, id: string, options: DiscordCommandOptions) =>
    DiscordCommandFull(
      scope,
      id,
      options,
      { ...command, name: command.name ?? id },
      discordCommandHandler,
    );
}

export function DiscordCommandFull<R>(
  scope: AediScope,
  id: string,
  { appId, serverId, botToken }: DiscordCommandOptions,
  command: { name: string; type: number; description: string; options: any[] },
  discordCommandHandler: DiscordCommandHandler,
) {
  return Object.assign(
    CustomResource(scope, id, {
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
          console.log('Command definition:', command);
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
              // TODO: Delete the command using the discord API
            } else if (event.RequestType === 'Update') {
              const result = await createCommand();
              response.Data = { Result: JSON.stringify(result) };

              console.log(`Command updated`, result);
            } else {
              const result = await createCommand();
              response.Data = { Result: JSON.stringify(result) };

              console.log(`Command created`, result);
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

          async function createCommand() {
            const response = await fetch(commandApiUrl, {
              method: 'PUT',
              body: JSON.stringify([command]),
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
    }),
    { discordCommandHandler },
  );
}
