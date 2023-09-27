import { Secret } from '@aedi/common';
import { Scope } from '../app';
import {
  DiscordInteractionCallbackType,
  DiscordBot,
  DiscordCommand,
} from './discord-utils';

const scope = Scope('discord-bot');
const DISCORD_PUBLIC_KEY =
  '2993a8e89c727e75eeb5ddea493327e76e78da10076f2ebb1b53e4ce93911e16';
const DISCORD_SERVER_ID = '601928995621044234'; // devtest
const DISCORD_APP_ID = '1156061502604845069';
const DISCORD_BOT_TOKEN_SECRET_ARN =
  'arn:aws:secretsmanager:us-west-2:664290008299:secret:aedi-test-discord-bot-token-2xkNVn';

export const api = DiscordBot(
  scope,
  'api',
  {
    discordPublicKey: DISCORD_PUBLIC_KEY,
    domain: { name: 'discord.smplj.xyz', zone: 'smplj.xyz' },
    appId: DISCORD_APP_ID,
    serverId: DISCORD_SERVER_ID,
    botToken: Secret(scope, 'bot-token', {
      arn: DISCORD_BOT_TOKEN_SECRET_ARN,
    }),
  },
  {
    blep: DiscordCommand(
      {
        type: 1,
        description: 'Send a random animal photo',
        options: [
          {
            name: 'animal',
            description: 'The type of animal',
            type: 3,
            required: true,
            choices: [
              {
                name: 'Dog',
                value: 'animal_dog',
              },
              {
                name: 'Cat',
                value: 'animal_cat',
              },
              {
                name: 'Penguin',
                value: 'animal_penguin',
              },
            ],
          },
          {
            name: 'only_smol',
            description: 'Whether to show only baby animals',
            type: 5,
            required: false,
          },
        ],
      },
      async (body) => {
        console.log(`Running blep command`, body);
        return {
          type: DiscordInteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `Hello world:\n\`\`\`json\n${JSON.stringify(
              body,
              null,
              2,
            )}\n\`\`\`\n`,
          },
        };
      },
    ),
  },
);
