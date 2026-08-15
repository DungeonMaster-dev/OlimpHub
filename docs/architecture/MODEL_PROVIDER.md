# Model Provider Abstraction

## Scope

P1-1001 centralizes server-side use of the built-in model proxy. The provider
uses the live `/v1/models` response at request time to validate a caller’s
preferred model identifiers, then selects the first available preference or the
proxy default when no preference is available. It never exposes proxy
credentials, model invocation, raw catalog data or request payloads to the
browser.

## Structured generation contract

| Concern         | Provider rule                                                                                                                             |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Model selection | Caller preferences are checked against the live catalog, not a hard-coded catalog snapshot.                                               |
| Fallback        | When no preferred ID is available, omit the model field and use the server proxy default.                                                 |
| Schema          | Every structured schema must be named, strict and set top-level `additionalProperties` to `false`.                                        |
| Response        | The provider returns the actual resolved model identifier and JSON text only after validating that the model returned textual content.    |
| Privacy         | Only server procedures construct prompts. UI code passes feature inputs to protected procedures and never receives a provider credential. |

The provider does not claim live pricing, capability, quality or availability
beyond the catalog response it has just received. Feature-specific Zod/business
validation remains in the caller because the provider cannot decide whether a
model’s otherwise valid JSON is acceptable for a contest, hint or analysis.
