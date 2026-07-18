# Lambdas for Jokes API

Lambdas for jokes API, which is the back-end for jokes-ui.

## Setup

The `developer` role is required to deploy this project.

### Node / NPM

1. [Node](https://nodejs.org/en/)
1. [NPM](https://www.npmjs.com/)

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
role_arn=arn:aws:iam::<account number>:role/developer
source_profile=default
mfa_serial=<YOUR_MFA_ARN>
region=us-east-2
```

If necessary, retrieve the ARN of the primary MFA device attached to the default profile:

```bash
aws iam list-mfa-devices --query 'MFADevices[].SerialNumber' --output text
```

## Developing Locally

### Unit Tests

[Jest](https://jestjs.io/) tests are run automatically on commit and push. If the test coverage threshold is not met, the push will fail. See `jest.config.ts` for coverage threshold.

Manually run tests with:

```bash
npm run test
```

### Prettier / Linter

Both [Prettier](https://prettier.io/) and [ESLint](https://eslint.org/) are executed on commit. Manually prettify and lint code with:

```bash
npm run lint
```

### Deploying to Production

Deployment is handled by the GitHub Actions pipeline (`.github/workflows/pipeline.yaml`). On every push, unit tests run first. Pushes to `master` then `sam build` (esbuild, bundling each handler) and `sam package` the stack, deploy it to the testing account, and finally deploy the same packaged template to production. Feature branches instead build and deploy directly to a per-branch stack in the testing account. After a successful production deploy, a final job bumps the package version and pushes the tag.

To build and deploy manually (requires the `developer` role, see Setup above):

```bash
npm run deploy
```

This runs `sam build --use-container` followed by `sam deploy` against the testing stack (see `scripts/deploy.sh`).

## Infrastructure

See the template.yaml file for information on updating infrastructure. The stack defines both a legacy REST API (API-key auth, for non-browser consumers) and an HTTP API (Cognito JWT auth, used by jokes-ui) fronting the same seven Lambda functions. See `endpoints.rest` for a documented list of routes and expected responses.

## Additional Documentation

- [AWS Lambda](https://aws.amazon.com/lambda/)

- [ESLint](https://eslint.org/)

- [Jest](https://jestjs.io/)

- [Prettier](https://prettier.io/)
