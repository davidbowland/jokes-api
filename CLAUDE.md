# jokes-api

## General

**Always commit changes** after completing work unless explicitly told not to.

Use functional programming style where practical, including dependency injection, avoiding mutating objects or values, etc.

## Testing Standards

**Jest clears all mocks automatically** (`clearMocks: true` in jest.config.ts). Never manually clear mocks.

**Mock state:** Set shared defaults in `beforeAll`. Override per-test with `mockReturnValueOnce` / `mockResolvedValueOnce` / `mockRejectedValueOnce`. Never use `beforeEach` — write a named `setup()` function if repeated arrangement is needed and call it explicitly.

**Non-determinism:** Any function that uses `Date.now()`, `Math.random()`, or `crypto.randomUUID()` to produce a value that affects test outcomes MUST accept it as an injectable parameter with a default:

```ts
// source
export const createThing = (input: Input, now = Date.now): Thing => ({ ...input, createdAt: now() })

// test
it('sets createdAt', () => {
  expect(createThing(input, () => 1_000_000).createdAt).toBe(1_000_000)
})
```

**Fake timers:** Use `jest.useFakeTimers()` in `beforeAll` (and `jest.useRealTimers()` in `afterAll`) when the code under test calls `setTimeout`, `setInterval`, or `Date` internally without injection.

**No `if` statements in tests.** No live `Date.now()` or `Math.random()` calls in test bodies. No date arithmetic that depends on the current wall-clock time.

**Deterministic above all.** A test that passes today and fails tomorrow is broken.

## Security

**Validate all external inputs** at API boundaries — schema, type, and length — before passing to downstream services.

**Bearer tokens** (Cognito JWTs, API keys) are the sole access control on this API's routes. Never log the `Authorization` or `x-api-key` header value (see `redactEvent` in `src/utils/logging.ts`); when generating tokens elsewhere, always use `crypto.randomInt` (CSPRNG), never `Math.random()`.

**OWASP Top 10.** Primary exposure for Lambda APIs: A01 Broken Access Control (token-as-sole-auth), A03 Injection (NoSQL injection for DynamoDB; validate patch operations before applying), A05 Security Misconfiguration (IAM — avoid `Resource: "*"` and unnecessary actions; scope to specific ARNs).

## Module Aliases

| Alias         | Path             |
| ------------- | ---------------- |
| `@config`     | `src/config.ts`  |
| `@events/*`   | `events/*`       |
| `@handlers/*` | `src/handlers/*` |
| `@services/*` | `src/services/*` |
| `@types`      | `src/types.ts`   |
| `@utils/*`    | `src/utils/*`    |

## Commands

- `npm test` — run tests with coverage
- `npm run typecheck` — TypeScript check
- `npm run lint` — format + lint
- `npm start` — run locally via SAM
