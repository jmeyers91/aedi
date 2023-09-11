import {
  CognitoIdentityClient,
  GetCredentialsForIdentityCommand,
  GetIdCommand,
  Credentials as AwsCredentials,
} from '@aws-sdk/client-cognito-identity';
import { S3Client } from '@aws-sdk/client-s3';
import { getClientConfig } from '@sep6/client-config';
import { Auth } from 'aws-amplify';

const clientConfig = getClientConfig();

const cognitoIdentityClient = new CognitoIdentityClient({
  region: clientConfig.auth?.region,
});

export async function getIdentityPoolId() {
  const authSession = await Auth.currentSession();
  const idToken = authSession.getIdToken();
  const idTokenJwt = idToken.getJwtToken();

  const logins = {
    [`cognito-idp.${clientConfig.auth?.region}.amazonaws.com/${clientConfig.auth?.userPoolId}`]:
      idTokenJwt,
  };

  console.log({ logins });

  const getIdentityResponse = await cognitoIdentityClient.send(
    new GetIdCommand({
      IdentityPoolId: clientConfig.auth?.identityPoolId,
      Logins: logins,
    })
  );
  const identityId = getIdentityResponse.IdentityId;

  return { identityId, logins };
}

export async function getCognitoAwsCredentials() {
  const { identityId, logins } = await getIdentityPoolId();
  const getCredentialsResponse = await cognitoIdentityClient.send(
    new GetCredentialsForIdentityCommand({
      IdentityId: identityId,
      Logins: logins,
    })
  );

  const awsCredentials = getCredentialsResponse.Credentials as AwsCredentials;

  return { awsCredentials, identityId };
}

export async function getS3Client(region: string) {
  const { awsCredentials, identityId } = await getCognitoAwsCredentials();

  const s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId: awsCredentials.AccessKeyId as string,
      secretAccessKey: awsCredentials.SecretKey as string,
      sessionToken: awsCredentials.SessionToken,
      expiration: awsCredentials.Expiration,
    },
  });

  return { s3Client, identityId };
}