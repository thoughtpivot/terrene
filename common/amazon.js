/**
 * Standalone Amazon Bedrock Claude library for model inference
 * @module common/amazon
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
import { BedrockRuntimeClient, ConverseCommand, InvokeModelCommand, InvokeModelWithResponseStreamCommand, } from "@aws-sdk/client-bedrock-runtime";
// Note: Environment variables should be set by the build process or runtime environment
// since this runs in the browser
/**
 * Available Claude model versions on Amazon Bedrock
 */
export var ClaudeVersion;
(function (ClaudeVersion) {
    ClaudeVersion["Claude_3_5_Sonnet_20240620_V10"] = "anthropic.claude-3-5-sonnet-20240620-v1:0";
    ClaudeVersion["Claude_3_Sonnet_20240229_V10"] = "anthropic.claude-3-sonnet-20240229-v1:0";
    ClaudeVersion["Claude_3_Haiku_20240307_V10"] = "anthropic.claude-3-haiku-20240307-v1:0";
    ClaudeVersion["Claude_3_Opus_20240229_V10"] = "anthropic.claude-3-opus-20240229-v1:0";
})(ClaudeVersion || (ClaudeVersion = {}));
/**
 * Filters and validates conversation entries, removing invalid entries
 * @param {ConversationEntry[]} [entries] - Array of conversation entries to filter
 * @returns {ConversationEntry[]} Filtered array of valid conversation entries
 */
export function filterConversationEntries(entries) {
    if (!entries || !Array.isArray(entries)) {
        return [];
    }
    return entries.filter((entry) => entry &&
        typeof entry.inputText === "string" &&
        typeof entry.outputText === "string" &&
        entry.inputText.trim().length > 0 &&
        entry.outputText.trim().length > 0);
}
/**
 * Invokes Claude AI model through Amazon Bedrock.
 * @param {object} params - Parameters for the Claude model invocation
 * @param {ClaudeVersion} [params.version] - Optional Claude model version to use. Defaults to 'claude-3-5-sonnet-20240620-v1:0'
 * @param {string} params.instructions - System instructions/prompt for Claude
 * @param {string} params.inputText - The user input text to process
 * @param {ConversationEntry[]} params.shortTermMemory - The messages exchanged by the user in the current conversation
 * @returns {Promise<string>} Promise resolving to Claude's response text
 * @example
 * ```typescript
 * const response = await Claude({
 *   version: ClaudeVersion.Claude_3_Sonnet_20240229_V10,
 *   instructions: 'You are a helpful assistant',
 *   inputText: 'What is the capital of France?'
 * });
 * console.log(response);
 * ```
 */
export function Claude(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const client = new BedrockRuntimeClient({
            region: (typeof process !== "undefined" && ((_a = process.env) === null || _a === void 0 ? void 0 : _a.AWS_REGION)) ||
                "us-east-1",
        });
        if (!params.version) {
            params.version = ClaudeVersion.Claude_3_5_Sonnet_20240620_V10;
        }
        const response = yield client.send(new InvokeModelCommand({
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 50000,
                system: params.instructions,
                messages: formatMessagesClaude(params.inputText, params.shortTermMemory),
            }),
            contentType: "application/json",
            accept: "application/json",
            modelId: params.version,
        }));
        const responseBodyString = response.body;
        const responseBody = new TextDecoder().decode(responseBodyString);
        return JSON.parse(responseBody).content[0].text;
    });
}
/**
 * Invokes Claude with function calling capabilities
 * @param {object} params - Parameters for the Claude invocation
 * @param {ClaudeVersion} [params.version] - Optional Claude model version to use. Defaults to 'claude-3-5-sonnet-20240620-v1:0'
 * @param {string} params.instructions - System instructions/prompt for Claude
 * @param {string} params.inputText - The user input text to process
 * @param {Tool[]} params.tools - Array of tools that Claude can use
 * @param {ConversationEntry[]} [params.shortTermMemory] - The messages exchanged by the user in the current conversation
 * @returns {Promise<ContentBlock[]|undefined>} Promise resolving to Claude's response content
 * @example
 * ```typescript
 * const tools = [{
 *   toolSpec: {
 *     name: 'calculator',
 *     description: 'Perform mathematical calculations',
 *     inputSchema: {
 *       json: {
 *         type: 'object',
 *         properties: {
 *           expression: { type: 'string', description: 'Math expression to evaluate' }
 *         }
 *       }
 *     }
 *   }
 * }];
 *
 * const response = await ClaudeWithFunctionCalling({
 *   instructions: 'You are a helpful assistant with calculator access',
 *   inputText: 'What is 15 * 23?',
 *   tools
 * });
 * ```
 */
export function ClaudeWithFunctionCalling(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const client = new BedrockRuntimeClient({
            region: (typeof process !== "undefined" && ((_a = process.env) === null || _a === void 0 ? void 0 : _a.AWS_REGION)) ||
                "us-east-1",
        });
        const version = params.version || ClaudeVersion.Claude_3_5_Sonnet_20240620_V10;
        // Build messages array with conversation history
        const messages = formatMessagesForConverse(params.inputText, params.shortTermMemory);
        const command = new ConverseCommand({
            modelId: version,
            system: [
                {
                    text: params.instructions,
                },
            ],
            messages: messages,
            toolConfig: {
                tools: params.tools,
            },
        });
        const response = yield client.send(command);
        if (!response.output || !response.output.message) {
            throw new Error("Invalid response from Claude: missing output or message");
        }
        return response.output.message.content;
    });
}
/**
 * Invokes Claude AI model through Amazon Bedrock with streaming response.
 * @param {object} params - Parameters for the Claude model streaming invocation
 * @param {ClaudeVersion} [params.version] - Optional Claude model version to use
 * @param {string} params.instructions - System instructions/prompt for Claude
 * @param {string} params.inputText - The user input text to process
 * @param {ConversationEntry[]} [params.shortTermMemory] - Represents the exchanged messages in the current conversation
 * @returns {Promise<ReadableStream>} Promise resolving to a streaming response
 * @example
 * ```typescript
 * const stream = await ClaudeWithStreaming({
 *   instructions: 'You are a helpful assistant',
 *   inputText: 'What is the capital of France?'
 * });
 *
 * const reader = stream.getReader();
 * try {
 *   while (true) {
 *     const { done, value } = await reader.read();
 *     if (done) break;
 *     console.log(new TextDecoder().decode(value));
 *   }
 * } finally {
 *   reader.releaseLock();
 * }
 * ```
 */
export function ClaudeWithStreaming(params) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const client = new BedrockRuntimeClient({
            region: (typeof process !== "undefined" && ((_a = process.env) === null || _a === void 0 ? void 0 : _a.AWS_REGION)) ||
                "us-east-1",
        });
        if (!params.version) {
            params.version = ClaudeVersion.Claude_3_5_Sonnet_20240620_V10;
        }
        const abortController = new AbortController();
        const abortSignal = abortController.signal;
        const response = yield client.send(new InvokeModelWithResponseStreamCommand({
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 50000,
                system: params.instructions,
                messages: formatMessagesClaude(params.inputText, params.shortTermMemory),
            }),
            contentType: "application/json",
            accept: "application/json",
            modelId: params.version,
        }), { abortSignal });
        if (!response.body) {
            throw new Error("Invalid response from Claude: missing response body");
        }
        return createBedrockStream(response.body, abortSignal);
    });
}
/**
 * Creates a unified ReadableStream from an Amazon Bedrock streaming response
 * @param {AsyncIterable<ResponseStream>} responseBody - The response body from Amazon Bedrock
 * @param {AbortSignal} abortSignal - The abort signal for the stream, used to cancel the stream
 * @returns {ReadableStream} A unified ReadableStream
 */
function createBedrockStream(responseBody, abortSignal) {
    return new ReadableStream({
        start(controller) {
            var e_1, _a;
            var _b, _c, _d;
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    try {
                        for (var responseBody_1 = __asyncValues(responseBody), responseBody_1_1; responseBody_1_1 = yield responseBody_1.next(), !responseBody_1_1.done;) {
                            const item = responseBody_1_1.value;
                            if (!((_b = item.chunk) === null || _b === void 0 ? void 0 : _b.bytes)) {
                                continue;
                            }
                            // Decode each chunk
                            const chunk = JSON.parse(new TextDecoder().decode(item.chunk.bytes));
                            // Process the chunk depending on its type
                            switch (chunk.type) {
                                case "message_start":
                                    // Handle message start - could log or process role if needed
                                    break;
                                case "content_block_start":
                                    // Handle content block start
                                    break;
                                case "content_block_delta":
                                    if ((_c = chunk.delta) === null || _c === void 0 ? void 0 : _c.text) {
                                        const text = new TextEncoder().encode(chunk.delta.text);
                                        controller.enqueue(text);
                                    }
                                    break;
                                case "content_block_stop":
                                    // Handle content block stop
                                    break;
                                case "message_delta":
                                    if ((_d = chunk.delta) === null || _d === void 0 ? void 0 : _d.text) {
                                        const text = new TextEncoder().encode(chunk.delta.text);
                                        controller.enqueue(text);
                                    }
                                    break;
                                case "message_stop":
                                    // Handle message stop - could process metrics if needed
                                    break;
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (responseBody_1_1 && !responseBody_1_1.done && (_a = responseBody_1.return)) yield _a.call(responseBody_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                }
                catch (error) {
                    controller.error(error);
                }
                finally {
                    controller.close();
                }
            });
        },
        cancel() {
            abortSignal.dispatchEvent(new Event("abort"));
        },
    });
}
/**
 * Format messages for Claude standard API
 * @param {string} inputText - The input text
 * @param {ConversationEntry[]} [shortTermMemory] - The short term memory
 * @returns {Array} Formatted messages array for Claude
 */
function formatMessagesClaude(inputText, shortTermMemory) {
    const shortTermMemoryMessages = filterConversationEntries(shortTermMemory).flatMap((message) => {
        return [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: message.inputText,
                    },
                ],
            },
            {
                role: "assistant",
                content: [
                    {
                        type: "text",
                        text: message.outputText,
                    },
                ],
            },
        ];
    });
    const defaultMessages = [
        {
            role: "user",
            content: [
                {
                    type: "text",
                    text: inputText,
                },
            ],
        },
    ];
    return shortTermMemoryMessages.length > 0
        ? [...shortTermMemoryMessages, ...defaultMessages]
        : [...defaultMessages];
}
/**
 * Format messages for Claude Converse API (used in function calling)
 * @param {string} inputText - The input text
 * @param {ConversationEntry[]} [shortTermMemory] - The short term memory
 * @returns {Array} Formatted messages array for Claude Converse API
 */
function formatMessagesForConverse(inputText, shortTermMemory) {
    const shortTermMemoryMessages = filterConversationEntries(shortTermMemory).flatMap((message) => {
        return [
            {
                role: "user",
                content: [{ text: message.inputText }],
            },
            {
                role: "assistant",
                content: [{ text: message.outputText }],
            },
        ];
    });
    const defaultMessages = [
        {
            role: "user",
            content: [{ text: inputText }],
        },
    ];
    return shortTermMemoryMessages.length > 0
        ? [...shortTermMemoryMessages, ...defaultMessages]
        : [...defaultMessages];
}
//# sourceMappingURL=amazon.js.map