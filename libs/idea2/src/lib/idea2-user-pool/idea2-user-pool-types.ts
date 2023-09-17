/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CreateAuthChallengeTriggerEvent,
  CustomEmailSenderTriggerEvent,
  CustomMessageTriggerEvent,
  CustomSMSSenderTriggerEvent,
  DefineAuthChallengeTriggerEvent,
  PostAuthenticationTriggerEvent,
  PostConfirmationTriggerEvent,
  PreAuthenticationTriggerEvent,
  PreSignUpTriggerEvent,
  PreTokenGenerationTriggerEvent,
  UserMigrationTriggerEvent,
  VerifyAuthChallengeResponseTriggerEvent,
} from 'aws-lambda';
import { LambdaRef } from '../idea2-lambda';
import type { IResourceRef, IResourceTypeMap, RefType } from '../idea2-types';

export interface UserPoolRef extends IResourceRef {
  type: RefType.USER_POOL;
  domainPrefix: string;
  selfSignUpEnabled: boolean;
  signInAlias?: {
    username?: boolean;
    email?: boolean;
    phone?: boolean;
    preferredUsername?: boolean;
  };
  triggers?: {
    /**
     * Creates an authentication challenge.
     */
    createAuthChallenge?: LambdaRef<
      any,
      CreateAuthChallengeTriggerEvent,
      CreateAuthChallengeTriggerEvent
    >;
    /**
     * Amazon Cognito invokes this trigger to send email notifications to users.
     */
    customEmailSender?: LambdaRef<
      any,
      CustomEmailSenderTriggerEvent,
      CustomEmailSenderTriggerEvent
    >;
    /**
     * A custom Message AWS Lambda trigger.
     */
    customMessage?: LambdaRef<
      any,
      CustomMessageTriggerEvent,
      CustomMessageTriggerEvent
    >;
    /**
     * Amazon Cognito invokes this trigger to send SMS notifications to users.
     */
    customSmsSender?: LambdaRef<
      any,
      CustomSMSSenderTriggerEvent,
      CustomSMSSenderTriggerEvent
    >;
    /**
     * Defines the authentication challenge.
     */
    defineAuthChallenge?: LambdaRef<
      any,
      DefineAuthChallengeTriggerEvent,
      DefineAuthChallengeTriggerEvent
    >;
    /**
     * A post-authentication AWS Lambda trigger.
     */
    postAuthentication?: LambdaRef<
      any,
      PostAuthenticationTriggerEvent,
      PostAuthenticationTriggerEvent
    >;
    /**
     * A post-confirmation AWS Lambda trigger.
     */
    postConfirmation?: LambdaRef<
      any,
      PostConfirmationTriggerEvent,
      PostConfirmationTriggerEvent
    >;
    /**
     * A pre-authentication AWS Lambda trigger.
     */
    preAuthentication?: LambdaRef<
      any,
      PreAuthenticationTriggerEvent,
      PreAuthenticationTriggerEvent
    >;
    /**
     * A pre-registration AWS Lambda trigger.
     */
    preSignUp?: LambdaRef<any, PreSignUpTriggerEvent, PreSignUpTriggerEvent>;
    /**
     * A pre-token-generation AWS Lambda trigger.
     */
    preTokenGeneration?: LambdaRef<
      any,
      PreTokenGenerationTriggerEvent,
      PreTokenGenerationTriggerEvent
    >;
    /**
     * A user-migration AWS Lambda trigger.
     */
    userMigration?: LambdaRef<
      any,
      UserMigrationTriggerEvent,
      UserMigrationTriggerEvent
    >;
    /**
     * Verifies the authentication challenge response.
     */
    verifyAuthChallengeResponse?: LambdaRef<
      any,
      VerifyAuthChallengeResponseTriggerEvent,
      VerifyAuthChallengeResponseTriggerEvent
    >;
  };
}

export interface UserPoolClientRef<T extends UserPoolRef, O extends object> {
  refType: RefType.USER_POOL;
  ref: T;
  options?: O;
}

export interface UserPoolConstructRef {
  userPoolId: string;
  region: string;
}

export type UserPoolRefClientOptions = object;
export type DefaultUserPoolRefClientOptions = object;
export interface UserPoolTypeMap extends IResourceTypeMap {
  ref: UserPoolRef;
  options: UserPoolRefClientOptions;
  defaultOptions: DefaultUserPoolRefClientOptions;
  constructRef: UserPoolConstructRef;
  clientRef: UserPoolClientRef<UserPoolRef, any>;
}
