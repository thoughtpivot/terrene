/**
 * Standalone Amazon Bedrock Claude library for model inference
 * @module common/amazon
 */

import {
    BedrockRuntimeClient,
    type ContentBlock,
    ConverseCommand,
    InvokeModelCommand,
    InvokeModelWithResponseStreamCommand,
    Message,
    type ResponseStream,
    type Tool,
} from "@aws-sdk/client-bedrock-runtime";

// Note: Environment variables should be set by the build process or runtime environment
// since this runs in the browser

/**
 * Available Claude model versions on Amazon Bedrock
 */
export enum ClaudeVersion {
    Claude_3_5_Sonnet_20240620_V10 = "anthropic.claude-3-5-sonnet-20240620-v1:0",
    Claude_3_Sonnet_20240229_V10 = "anthropic.claude-3-sonnet-20240229-v1:0",
    Claude_3_Haiku_20240307_V10 = "anthropic.claude-3-haiku-20240307-v1:0",
    Claude_3_Opus_20240229_V10 = "anthropic.claude-3-opus-20240229-v1:0",
}

/**
 * Represents a single conversation entry between user and assistant
 */
export interface ConversationEntry {
    /** The input text from the user */
    inputText: string;
    /** The output text from the assistant */
    outputText: string;
    /** Optional timestamp for the conversation entry */
    timestamp?: Date;
}

/**
 * Filters and validates conversation entries, removing invalid entries
 * @param {ConversationEntry[]} [entries] - Array of conversation entries to filter
 * @returns {ConversationEntry[]} Filtered array of valid conversation entries
 */
export function filterConversationEntries(
    entries?: ConversationEntry[]
): ConversationEntry[] {
    if (!entries || !Array.isArray(entries)) {
        return [];
    }

    return entries.filter(
        (entry) =>
            entry &&
            typeof entry.inputText === "string" &&
            typeof entry.outputText === "string" &&
            entry.inputText.trim().length > 0 &&
            entry.outputText.trim().length > 0
    );
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
export async function Claude(params: {
    version?: ClaudeVersion;
    instructions: string;
    inputText: string;
    shortTermMemory?: ConversationEntry[];
}): Promise<string> {
    const client = new BedrockRuntimeClient({
        region:
            (typeof process !== "undefined" && process.env?.AWS_REGION) ||
            "us-east-1",
    });

    if (!params.version) {
        params.version = ClaudeVersion.Claude_3_5_Sonnet_20240620_V10;
    }

    const response = await client.send(
        new InvokeModelCommand({
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 50000,
                system: params.instructions,
                messages: formatMessagesClaude(
                    params.inputText,
                    params.shortTermMemory
                ),
            }),
            contentType: "application/json",
            accept: "application/json",
            modelId: params.version,
        })
    );

    const responseBodyString = response.body;
    const responseBody = new TextDecoder().decode(responseBodyString);
    return JSON.parse(responseBody).content[0].text;
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
export async function ClaudeWithFunctionCalling(params: {
    version?: ClaudeVersion;
    instructions: string;
    inputText: string;
    tools: Tool[];
    shortTermMemory?: ConversationEntry[];
}): Promise<ContentBlock[] | undefined> {
    const client = new BedrockRuntimeClient({
        region:
            (typeof process !== "undefined" && process.env?.AWS_REGION) ||
            "us-east-1",
    });

    const version =
        params.version || ClaudeVersion.Claude_3_5_Sonnet_20240620_V10;

    // Build messages array with conversation history
    const messages = formatMessagesForConverse(
        params.inputText,
        params.shortTermMemory
    );

    const command = new ConverseCommand({
        modelId: version,
        system: [
            {
                text: params.instructions,
            },
        ],
        messages: messages as Message[],
        toolConfig: {
            tools: params.tools,
        },
    });

    const response = await client.send(command);

    if (!response.output || !response.output.message) {
        throw new Error(
            "Invalid response from Claude: missing output or message"
        );
    }

    return response.output.message.content;
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
export async function ClaudeWithStreaming(params: {
    version?: ClaudeVersion;
    instructions: string;
    inputText: string;
    shortTermMemory?: ConversationEntry[];
}): Promise<ReadableStream> {
    const client = new BedrockRuntimeClient({
        region:
            (typeof process !== "undefined" && process.env?.AWS_REGION) ||
            "us-east-1",
    });

    if (!params.version) {
        params.version = ClaudeVersion.Claude_3_5_Sonnet_20240620_V10;
    }

    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    const response = await client.send(
        new InvokeModelWithResponseStreamCommand({
            body: JSON.stringify({
                anthropic_version: "bedrock-2023-05-31",
                max_tokens: 50000,
                system: params.instructions,
                messages: formatMessagesClaude(
                    params.inputText,
                    params.shortTermMemory
                ),
            }),
            contentType: "application/json",
            accept: "application/json",
            modelId: params.version,
        }),
        { abortSignal }
    );

    if (!response.body) {
        throw new Error("Invalid response from Claude: missing response body");
    }

    return createBedrockStream(response.body, abortSignal);
}

/**
 * Creates a unified ReadableStream from an Amazon Bedrock streaming response
 * @param {AsyncIterable<ResponseStream>} responseBody - The response body from Amazon Bedrock
 * @param {AbortSignal} abortSignal - The abort signal for the stream, used to cancel the stream
 * @returns {ReadableStream} A unified ReadableStream
 */
function createBedrockStream(
    responseBody: AsyncIterable<ResponseStream>,
    abortSignal: AbortSignal
): ReadableStream {
    return new ReadableStream({
        async start(controller) {
            try {
                for await (const item of responseBody) {
                    if (!item.chunk?.bytes) {
                        continue;
                    }

                    // Decode each chunk
                    const chunk = JSON.parse(
                        new TextDecoder().decode(item.chunk.bytes)
                    );

                    // Process the chunk depending on its type
                    switch (chunk.type) {
                        case "message_start":
                            // Handle message start - could log or process role if needed
                            break;
                        case "content_block_start":
                            // Handle content block start
                            break;
                        case "content_block_delta":
                            if (chunk.delta?.text) {
                                const text = new TextEncoder().encode(
                                    chunk.delta.text
                                );
                                controller.enqueue(text);
                            }
                            break;
                        case "content_block_stop":
                            // Handle content block stop
                            break;
                        case "message_delta":
                            if (chunk.delta?.text) {
                                const text = new TextEncoder().encode(
                                    chunk.delta.text
                                );
                                controller.enqueue(text);
                            }
                            break;
                        case "message_stop":
                            // Handle message stop - could process metrics if needed
                            break;
                    }
                }
            } catch (error) {
                controller.error(error);
            } finally {
                controller.close();
            }
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
function formatMessagesClaude(
    inputText: string,
    shortTermMemory?: ConversationEntry[]
) {
    const shortTermMemoryMessages = filterConversationEntries(
        shortTermMemory
    ).flatMap((message) => {
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
function formatMessagesForConverse(
    inputText: string,
    shortTermMemory?: ConversationEntry[]
) {
    const shortTermMemoryMessages = filterConversationEntries(
        shortTermMemory
    ).flatMap((message) => {
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
