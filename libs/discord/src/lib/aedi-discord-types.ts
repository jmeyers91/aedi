import type {
  SecretRef,
  LambdaDependencyGroup,
  WrapContext,
  CustomResourceRef,
  CustomResourceResponse,
  LambdaProxyHandler,
} from '@aedi/common';

export enum DiscordInteractionType {
  PING = 1,
  APPLICATION_COMMAND = 2,
  MESSAGE_COMPONENT = 3,
  APPLICATION_COMMAND_AUTOCOMPLETE = 4,
  MODAL_SUBMIT = 5,
}

export enum DiscordCommandType {
  /**
   * Slash commands; a text-based command that shows up when a user types /
   */
  CHAT_INPUT = 1,
  /**
   * A UI-based command that shows up when you right click or tap on a user
   */
  USER = 2,
  /**
   * A UI-based command that shows up when you right click or tap on a message
   */
  MESSAGE = 3,
}

export enum DiscordCommandOptionType {
  SUB_COMMAND = 1,
  SUB_COMMAND_GROUP = 2,
  STRING = 3,
  /**
   * Any integer between -2^53 and 2^53
   */
  INTEGER = 4,
  BOOLEAN = 5,
  USER = 6,
  /**
   * Includes all channel types + categories
   */
  CHANNEL = 7,
  ROLE = 8,
  /**
   * Includes users and roles
   */
  MENTIONABLE = 9,
  /**
   * Any double between -2^53 and 2^53
   */
  NUMBER = 10,
  /**
   * attachment object
   */
  ATTACHMENT = 11,
}

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

export enum DiscordChannelType {
  GUILD_TEXT = 0, //	a text channel within a server
  DM = 1, //	a direct message between users
  GUILD_VOICE = 2, //	a voice channel within a server
  GROUP_DM = 3, //	a direct message between multiple users
  GUILD_CATEGORY = 4, //	an organizational category that contains up to 50 channels
  GUILD_ANNOUNCEMENT = 5, //	a channel that users can follow and crosspost into their own server (formerly news channels)
  ANNOUNCEMENT_THREAD = 10, //	a temporary sub-channel within a GUILD_ANNOUNCEMENT channel
  PUBLIC_THREAD = 11, //	a temporary sub-channel within a GUILD_TEXT or GUILD_FORUM channel
  PRIVATE_THREAD = 12, //	a temporary sub-channel within a GUILD_TEXT channel that is only viewable by those invited and those with the MANAGE_THREADS permission
  GUILD_STAGE_VOICE = 13, //	a voice channel for hosting events with an audience
  GUILD_DIRECTORY = 14, //	the channel in a hub containing the listed servers
  GUILD_FORUM = 15, //	Channel that can only contain threads
  GUILD_MEDIA = 16, //
}

export interface DiscordCommand {
  id: string; // Unique ID of command	all
  type?: DiscordCommandType; // one of application command type	Type of command, defaults to 1	all
  application_id: string; // ID of the parent application	all
  guild_id?: string; // Guild ID of the command, if not global	all
  name?: string; // Name of command, 1-32 characters	all
  name_localizations?: Record<string, string>; // with keys in available locales	Localization dictionary for name field. Values follow the same restrictions as name	all
  description: string; // Description for CHAT_INPUT commands, 1-100 characters. Empty string for USER and MESSAGE commands	all
  description_localizations?: Record<string, string>; // with keys in available locales	Localization dictionary for description field. Values follow the same restrictions as description	all
  options?: DiscordCommandOption[]; // array of application command option	Parameters for the command, max of 25	CHAT_INPUT
  default_member_permissions?: string; // Set of permissions represented as a bit set	all
  dm_permission?: boolean; // Indicates whether the command is available in DMs with the app, only for globally-scoped commands. By default, commands are visible.	all
  default_permission?: boolean; // Not recommended for use as field will soon be deprecated. Indicates whether the command is enabled by default when the app is added to a guild, defaults to true	all
  nsfw?: boolean; // Indicates whether the command is age-restricted, defaults to false	all
  version: string;
}

export interface DiscordCommandChoice {
  name: string; // 1-100 character choice name
  name_localizations?: Record<string, string>; // with keys in available locales	Localization dictionary for the name field. Values follow the same restrictions as name
  value: string | number;
}

export interface DiscordCommandOption {
  type: DiscordCommandOptionType; //	one of application command option type	Type of option
  name: string; //	1-32 character name
  name_localizations?: Record<string, string>; // with keys in available locales	Localization dictionary for the name field. Values follow the same restrictions as name
  description: string; //1-100 character description
  description_localizations?: Record<string, string>; // with keys in available locales	Localization dictionary for the description field. Values follow the same restrictions as description
  required?: boolean; //	If the parameter is required or optional--default false
  choices?: DiscordCommandChoice[]; // of application command option choice	Choices for STRING, INTEGER, and NUMBER types for the user to pick from, max 25
  options?: DiscordCommandOption[]; // of application command option	If the option is a subcommand or subcommand group type, these nested options will be the parameters
  channel_types?: DiscordChannelType[]; // of channel types	If the option is a channel type, the channels shown will be restricted to these types
  min_value?: number; // for INTEGER options, double for NUMBER options	If the option is an INTEGER or NUMBER type, the minimum value permitted
  max_value?: number; // for INTEGER options, double for NUMBER options	If the option is an INTEGER or NUMBER type, the maximum value permitted
  min_length?: number; //	For option type STRING, the minimum allowed length (minimum of 0, maximum of 6000)
  max_length?: number; //	For option type STRING, the maximum allowed length (minimum of 1, maximum of 6000)
  autocomplete?: boolean; //
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
      value: string | number | boolean;
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

export interface DiscordCommandOptions {
  appId: string;
  serverId?: string;
  botToken: SecretRef;
}

export type CreateDiscordCommandOptions = Omit<
  DiscordCommand,
  'id' | 'application_id' | 'guild_id' | 'version'
>;

export type DiscordCommandHandler<C extends LambdaDependencyGroup> = (
  body: DiscordCommandUserResponse,
  lambdaDependencies: WrapContext<C>,
) =>
  | Promise<DiscordInteractionResponseObject>
  | DiscordInteractionResponseObject;

export type DiscordCommandRef<
  R,
  C extends LambdaDependencyGroup,
> = CustomResourceRef<
  CustomResourceResponse<R> | Promise<CustomResourceResponse<R>>,
  C
> & { discordCommandHandler: DiscordCommandHandler<C> } & LambdaProxyHandler;
