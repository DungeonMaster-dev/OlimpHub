import { describe, expect, it, vi } from "vitest";
import { generateStructured } from "./modelProvider";

const outputSchema = {
  name: "proposal",
  strict: true,
  schema: {
    type: "object",
    properties: { title: { type: "string" } },
    required: ["title"],
    additionalProperties: false,
  },
};

function dependencies(content: string | string[] = '{"title":"Draft"}') {
  return {
    listModels: vi.fn().mockResolvedValue({
      object: "list",
      data: [
        { id: "gpt-5-mini", object: "model", created: 1, owned_by: "openai" },
        {
          id: "claude-haiku-4-5",
          object: "model",
          created: 1,
          owned_by: "anthropic",
        },
      ],
    }),
    invoke: vi.fn().mockResolvedValue({
      id: "request-1",
      created: 1,
      model: "gpt-5-mini",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
    }),
  };
}

describe("model provider", () => {
  it("selects the first preferred ID available in the live catalog and returns the actual resolved model", async () => {
    const provider = dependencies();

    await expect(
      generateStructured(
        {
          messages: [{ role: "user", content: "Generate one draft." }],
          outputSchema,
          preferredModelIds: ["unavailable-model", "gpt-5-mini"],
          maxTokens: 400,
        },
        provider
      )
    ).resolves.toEqual({ model: "gpt-5-mini", content: '{"title":"Draft"}' });

    expect(provider.invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5-mini",
        outputSchema,
        maxTokens: 400,
      })
    );
  });

  it("uses the proxy default only when no preferred live ID is available", async () => {
    const provider = dependencies();

    await generateStructured(
      {
        messages: [{ role: "user", content: "Generate one draft." }],
        outputSchema,
        preferredModelIds: ["retired-model"],
      },
      provider
    );

    expect(provider.invoke).toHaveBeenCalledWith(
      expect.not.objectContaining({ model: expect.anything() })
    );
  });

  it("rejects non-strict schemas and non-text provider responses before downstream JSON validation", async () => {
    const provider = dependencies(["not", "text"]);

    await expect(
      generateStructured(
        {
          messages: [{ role: "user", content: "Generate one draft." }],
          outputSchema: { ...outputSchema, strict: false },
        },
        provider
      )
    ).rejects.toThrow("strict schema");
    expect(provider.listModels).not.toHaveBeenCalled();

    await expect(
      generateStructured(
        {
          messages: [{ role: "user", content: "Generate one draft." }],
          outputSchema,
        },
        provider
      )
    ).rejects.toThrow("no textual content");
  });
});
