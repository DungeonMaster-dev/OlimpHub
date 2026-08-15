import {
  invokeLLM,
  listLLMModels,
  type InvokeParams,
  type InvokeResult,
  type Message,
  type ModelsResponse,
  type OutputSchema,
} from "../_core/llm";

export type StructuredGenerationRequest = {
  messages: Message[];
  outputSchema: OutputSchema;
  preferredModelIds?: string[];
  maxTokens?: number;
};

type ProviderDependencies = {
  listModels: () => Promise<ModelsResponse>;
  invoke: (params: InvokeParams) => Promise<InvokeResult>;
};

const defaultDependencies: ProviderDependencies = {
  listModels: listLLMModels,
  invoke: invokeLLM,
};

function assertStrictStructuredSchema(outputSchema: OutputSchema) {
  if (!outputSchema.name.trim())
    throw new Error("Structured generation requires a named schema.");
  if (outputSchema.strict !== true)
    throw new Error("Structured generation requires strict schema validation.");
  if (outputSchema.schema.additionalProperties !== false)
    throw new Error(
      "Structured generation requires top-level additionalProperties to be false."
    );
}

export async function generateStructured(
  request: StructuredGenerationRequest,
  dependencies: ProviderDependencies = defaultDependencies
) {
  assertStrictStructuredSchema(request.outputSchema);
  const catalog = await dependencies.listModels();
  const availableModelIds = new Set(catalog.data.map(model => model.id));
  const selectedModel = request.preferredModelIds?.find(modelId =>
    availableModelIds.has(modelId)
  );
  const response = await dependencies.invoke({
    messages: request.messages,
    outputSchema: request.outputSchema,
    maxTokens: request.maxTokens,
    ...(selectedModel ? { model: selectedModel } : {}),
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string")
    throw new Error("Structured generation returned no textual content.");

  return {
    model: response.model || selectedModel || "proxy-default",
    content,
  };
}
