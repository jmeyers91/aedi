import {
  Grant,
  Lambda,
  LambdaInvokeClient,
  LazySecretValue,
  Secret,
  SecretValue,
  Table,
  TableClient,
} from '@aedi/common';
import { Scope } from '../app';
import {
  DiscordInteractionCallbackType,
  DiscordBot,
  DiscordCommandType,
  DiscordCommandOptionType,
  findStringResponseValue,
  findBooleanResponseValue,
} from '@aedi/discord';

const scope = Scope('discord-bot');
const DISCORD_PUBLIC_KEY =
  '2993a8e89c727e75eeb5ddea493327e76e78da10076f2ebb1b53e4ce93911e16';
const DISCORD_SERVER_ID = '601928995621044234'; // devtest
const DISCORD_APP_ID = '1156061502604845069';
const DISCORD_BOT_TOKEN_SECRET_ARN =
  'arn:aws:secretsmanager:us-west-2:664290008299:secret:aedi-test-discord-bot-token-2xkNVn';
const CAT_PIC_API_KEY_SECRET_ARN =
  'arn:aws:secretsmanager:us-west-2:664290008299:secret:cat-api-key-ZveAaP';
const DOG_PIC_API_KEY_SECRET_ARN =
  'arn:aws:secretsmanager:us-west-2:664290008299:secret:dog-api-key-etcW8n';

enum AnimalType {
  CAT = 'cat',
  DOG = 'dog',
}

const counterTable = Table<{ counterId: string; count: number }, 'counterId'>(
  scope,
  'counter-table',
  {
    partitionKey: {
      name: 'counterId',
      type: 'STRING',
    },
  },
);

export const sendAnimalPic = Lambda(
  scope,
  'sendAnimalPic',
  {
    catPicApiKey: LazySecretValue(
      Secret(scope, 'cat-pic-api-key', {
        arn: CAT_PIC_API_KEY_SECRET_ARN,
      }),
    ),
    dogPicApiKey: LazySecretValue(
      Secret(scope, 'dog-pic-api-key', {
        arn: DOG_PIC_API_KEY_SECRET_ARN,
      }),
    ),
  },
  async (
    { catPicApiKey, dogPicApiKey },
    {
      interactionToken,
      animalType,
    }: {
      interactionToken: string;
      animalType: AnimalType | string;
    },
  ) => {
    console.log(`Invoking with`, { interactionToken, animalType });
    const url = `https://discord.com/api/v10/webhooks/${DISCORD_APP_ID}/${interactionToken}/messages/@original`;

    const animalPicUrl =
      animalType === AnimalType.CAT
        ? await getCatPic({ apiKey: await catPicApiKey() })
        : await getDogPic({ apiKey: await dogPicApiKey() });

    const body = {
      content: animalPicUrl,
    };

    console.log(`Sending interaction response`, body);
    const response = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('Success');
    } else {
      console.error(`Request failed`, await response.text());
    }
  },
);

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
    counterTable: TableClient(Grant(counterTable, { write: true })),
    sendAnimalPic: LambdaInvokeClient(sendAnimalPic, {
      InvocationType: 'Event',
    }),
  },
  {
    count: {
      options: {
        type: DiscordCommandType.CHAT_INPUT,
        description: 'Increment a counter',
        options: [
          {
            name: 'counter',
            description: 'The counter to increment.',
            type: DiscordCommandOptionType.STRING,
            required: true,
          },
        ],
      },
      handler: async (body, { counterTable }) => {
        const counterId = findStringResponseValue(body, 'counter', true);
        const counter = await counterTable.get({ counterId });
        const count = (counter?.count ?? 0) + 1;

        await counterTable.put({ Item: { counterId, count } });

        return {
          type: DiscordInteractionCallbackType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: `${counterId} count: ${count}`,
          },
        };
      },
    },

    blep: {
      options: {
        type: DiscordCommandType.CHAT_INPUT,
        description: 'Send a random animal photo',
        options: [
          {
            name: 'animal',
            description: 'The type of animal',
            type: DiscordCommandOptionType.STRING,
            required: true,
            choices: [
              {
                name: 'Dog',
                value: AnimalType.DOG,
              },
              {
                name: 'Cat',
                value: AnimalType.CAT,
              },
            ],
          },
          {
            name: 'only_smol',
            description: 'Whether to show only baby animals',
            type: DiscordCommandOptionType.BOOLEAN,
            required: false,
          },
        ],
      },

      handler: async (body, { sendAnimalPic }) => {
        const animalType = findStringResponseValue(body, 'animal', true);
        // const onlySmol = findBooleanResponseValue(body, 'only_smol');
        await sendAnimalPic({
          interactionToken: body.token,
          animalType,
        });

        return {
          type: DiscordInteractionCallbackType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            flags: 1 << 7,
          },
        };
      },
    },
  },
);

async function getCatPic({ apiKey }: { apiKey: string }): Promise<string> {
  const response = await fetch(
    `https://api.thecatapi.com/v1/images/search?limit=${1}`,
    {
      headers: {
        'x-api-key': apiKey,
      },
    },
  );
  const data = await response.json();
  return data[0].url;
}

async function getDogPic({ apiKey }: { apiKey: string }): Promise<string> {
  const response = await fetch(
    `https://api.thedogapi.com/v1/images/search?limit=${1}`,
    {
      headers: {
        'x-api-key': apiKey,
      },
    },
  );
  const data = await response.json();
  return data[0].url;
}
