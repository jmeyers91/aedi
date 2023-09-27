import { Api, Get, Post, reply } from '@aedi/common';

import { Scope } from '../app';
import { verifyKey } from 'discord-interactions';

const scope = Scope('discord-bot');

export const api = Api(
  scope,
  'api',
  {
    domain: { name: 'discord.smplj.xyz', zone: 'smplj.xyz' },
  },
  {
    healthcheck: Get('/healthcheck', {}, () => ({ healthy: true })),
    healthcheckCommand: Post('/discord', {}, async (_, event) => {
      await debugLog('event', { event });

      // Checking signature (requirement 1.)
      // Your public key can be found on your application in the Developer Portal
      const PUBLIC_KEY =
        '2993a8e89c727e75eeb5ddea493327e76e78da10076f2ebb1b53e4ce93911e16';
      const signature = event.headers['x-signature-ed25519'] ?? '';
      const timestamp = event.headers['x-signature-timestamp'] ?? '';
      const requestContentType = event.headers['content-type'];
      const strBody =
        Buffer.from(event.body as string, 'base64').toString('utf-8') ?? ''; // should be string, for successful sign

      const isVerified = verifyKey(strBody, signature, timestamp, PUBLIC_KEY);

      await debugLog('Called', {
        PUBLIC_KEY,
        signature,
        timestamp,
        strBody,
        isVerified,
        requestContentType,
      });
      if (!isVerified) {
        return reply(JSON.stringify('invalid request signature'), 401, {
          'Content-Type': 'application/json',
        });
      }

      // Replying to ping (requirement 2.)
      const body = JSON.parse(strBody);
      if (body.type == 1) {
        return reply(JSON.stringify({ type: 1 }), 200, {
          'Content-Type': 'application/json',
        });
      }

      // Handle /foo Command
      if (body.data.name == 'foo') {
        return reply(
          JSON.stringify({
            // Note the absence of statusCode
            type: 4, // This type stands for answer with invocation shown
            data: { content: 'bar' },
          }),
          200,
          {
            'Content-Type': 'application/json',
          },
        );
      }

      return reply(
        {
          statusCode: 404, // If no handler implemented for Discord's request
        },
        404,
      );
    }),

    bot: Post('/bot', {}, async (_, event) => {
      await debugLog('event', { event });

      // Checking signature (requirement 1.)
      // Your public key can be found on your application in the Developer Portal
      const PUBLIC_KEY =
        '2993a8e89c727e75eeb5ddea493327e76e78da10076f2ebb1b53e4ce93911e16';
      const signature = event.headers['x-signature-ed25519'] ?? '';
      const timestamp = event.headers['x-signature-timestamp'] ?? '';
      const requestContentType = event.headers['content-type'];
      const strBody =
        Buffer.from(event.body as string, 'base64').toString('utf-8') ?? ''; // should be string, for successful sign

      const isVerified = verifyKey(strBody, signature, timestamp, PUBLIC_KEY);

      await debugLog('Called', {
        PUBLIC_KEY,
        signature,
        timestamp,
        strBody,
        isVerified,
        requestContentType,
      });
      if (!isVerified) {
        return reply(JSON.stringify('invalid request signature'), 401, {
          'Content-Type': 'application/json',
        });
      }

      // Replying to ping (requirement 2.)
      const body = JSON.parse(strBody);
      if (body.type == 1) {
        return reply(JSON.stringify({ type: 1 }), 200, {
          'Content-Type': 'application/json',
        });
      }

      // Handle /foo Command
      if (body.data.name == 'foo') {
        return reply(
          JSON.stringify({
            // Note the absence of statusCode
            type: 4, // This type stands for answer with invocation shown
            data: { content: 'bar' },
          }),
          200,
          {
            'Content-Type': 'application/json',
          },
        );
      }

      return reply(
        {
          statusCode: 404, // If no handler implemented for Discord's request
        },
        404,
      );
    }),
  },
);

async function debugLog(...args: any[]) {
  console.log(...args);

  await fetch('https://6fc71b33850a.ngrok.app/log', {
    method: 'POST',
    body: JSON.stringify(args),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(
          `Debug request failed to send with status ${
            response.status
          }: ${await response.text()}`,
        );
      }
    })
    .catch((error) => {
      console.log(`Failed to send debug log`, error);
    });
}
