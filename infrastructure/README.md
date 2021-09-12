# Infrastructure for lambda-jokes-handler

Infrastructure as Code for lambda-jokes-handler

## Setup

The `developer` role is required to deploy this project. Additionally, the `AWS_ACCOUNT_ID` environment variable must be present and correct.

### Node / NPM

1. [Node 16](https://nodejs.org/en/)
1. [NPM 7+](https://www.npmjs.com/)

### Pulumi

This project is built using [Pulumi](https://www.pulumi.com/). Install the CLI using brew:

```bash
brew install pulumi
```

### AWS Credentials

To run locally, [AWS CLI](https://aws.amazon.com/cli/) is required in order to assume a role with permission to update resources. Install AWS CLI with:

```brew
brew install awscli
```

If file `~/.aws/credentials` does not exist, create it and add a default profile:

```toml
[default]
aws_access_key_id=<YOUR_ACCESS_KEY_ID>
aws_secret_access_key=<YOUR_SECRET_ACCESS_KEY>
region=us-east-2
```

If necessary, generate a [new access key ID and secret access key](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys).

Add a `developer` profile to the same credentials file:

```toml
[developer]
role_arn=arn:aws:iam::<AWS_ACCOUNT_ID>:role/developer
source_profile=default
mfa_serial=<YOUR_MFA_ARN>
region=us-east-2
```

If necessary, retreive the ARN of the primary MFA device attached to the default profile:

```bash
aws iam list-mfa-devices --query 'MFADevices[].SerialNumber' --output text
```

## Developing Locally

When writing code from scratch, it can be useful to consult the [Pulumi AWS package reference](https://www.pulumi.com/docs/reference/pkg/aws/).

### Preview Changes

Preview the changes the local code will make with:

```bash
npm run preview
```

If the `developer` profile is not available, this command will fail.

### Deploying to Production

A preview will execute when a pull request is created to `master`. When the pull request is merged into `master`, the infrastructure will be automatically deployed to production.

In extreme cases, code can be deployed locally with:

```bash
npm run deploy
```

### Refreshing State with Infrastructure

If the state files becomes desynchronized from the infrastructure, it can be refreshed with:

```bash
npm run refresh
```

## Additional Documentation

- [AWS API Gateway](https://aws.amazon.com/api-gateway/)

- [AWS CLI](https://aws.amazon.com/cli/)

- [AWS credentials](https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html)

- [AWS DynamoDB](https://aws.amazon.com/dynamodb/)

- [AWS Lambda](https://aws.amazon.com/lambda/)

- [Pulumi AWS package reference](https://www.pulumi.com/docs/reference/pkg/aws/)

- [Pulumi CLI](https://www.pulumi.com/docs/reference/cli/)

- [Pulumi refresh](https://www.pulumi.com/docs/reference/cli/pulumi_refresh/)
