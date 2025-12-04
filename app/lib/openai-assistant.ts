import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { boolean, z } from "zod";

export class OpenAIAssistant {
  private client: OpenAI;
  private assistant: any;
  private thread: any;

  constructor(apiKey?: string) {
    // Get API key from parameter or environment variable
    // Note: Since this is used in client components, we need NEXT_PUBLIC_ prefix
    const key = apiKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    
    if (!key) {
      throw new Error("OpenAI API key is required. Provide it as a parameter or set NEXT_PUBLIC_OPENAI_API_KEY in your .env file.");
    }
    
    this.client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });
  }

  // async initialize(
  //   instructions: string = `You are an English tutor. Help students improve their language skills by:
  //   - Correcting grammar mistakes
  //   - Explaining concepts with examples
  //   - Practicing conversation
  //   - Giving learning suggestions
  //   Keep answers concise and friendly.`
  // ) {
  //   // Create assistant
  //   this.assistant = await this.client.beta.assistants.create({
  //     name: "English Tutor Assistant",
  //     instructions,
  //     tools: [],
  //     model: "gpt-4",   // updated model
  //   });

  //   // Create new thread
  //   this.thread = await this.client.beta.threads.create();
  // }

async getResponse(
  userMessage: string
): Promise<{ response: string; relatedquery: boolean }> {
  const AnswerExtraction = z.object({
    response: z.string(),
    relatedquery: z.boolean(),
  });

  const result = await this.client.responses.parse({
    model: "gpt-4o-2024-08-06",
    input: [
      {
        role: "system",
        content: `
          You are an AI assistant specializing in topics related to Israel.
          - If the user's question is related to Israel, return the answer and set "relatedquery" to true.
          - If the question is not related to Israel, say you do not have knowledge on that topic and set "relatedquery" to false.
          - Give me response in hebrew.
        `,
      },
      { role: "user", content: userMessage },
    ],
    text: {
      format: zodTextFormat(AnswerExtraction, "answer_extraction"),
    },
  });

  // ⭐ FIX: safely handle null result
  if (!result.output_parsed) {
    return {
      response: "Sorry, I could not process your request.",
      relatedquery: false,
    };
  }

  return result.output_parsed;

  //   const response = await this.client.responses.create({
  //     model: "gpt-4o",
  //     input: "Write a one-sentence bedtime story about a unicorn."
  // });

  // return response.output_text;
  // if (!this.assistant || !this.thread) {
  //   throw new Error("Assistant not initialized. Call initialize() first.");
  // }

  // // Add user message
  // await this.client.beta.threads.messages.create(this.thread.id, {
  //   role: "user",
  //   content: userMessage,
  // });

  // // Start run & wait
  // const run = await this.client.beta.threads.runs.createAndPoll(this.thread.id, {
  //   assistant_id: this.assistant.id
  // });

  // // Handle different run statuses
  // if (run.status !== "completed") {
  //   console.error("Run failed or incomplete:", run);
    
  //   // Check for specific error details
  //   if (run.last_error) {
  //     const errorCode = String(run.last_error.code || "");
  //     const errorMessage = run.last_error.message || "";
      
  //     if (errorCode.includes("rate_limit") || errorCode === "rate_limit_exceeded") {
  //       return "Sorry, I've hit the rate limit. Please try again in a moment or check your OpenAI account quota.";
  //     } else if (errorCode.includes("invalid_api_key") || errorCode === "invalid_api_key") {
  //       return "OpenAI API key is invalid. Please check your API key in the .env file.";
  //     } else if (errorCode.includes("quota") || errorCode === "insufficient_quota") {
  //       return "OpenAI account quota has been exceeded. Please add credits to your account.";
  //     } else {
  //       return `OpenAI API error (${errorCode}): ${errorMessage}`;
  //     }
  //   }
    
  //   // Handle other statuses
  //   if (run.status === "failed") {
  //     return "The assistant request failed. Please try again.";
  //   } else if (run.status === "cancelled") {
  //     return "The assistant request was cancelled.";
  //   } else if (run.status === "expired") {
  //     return "The assistant request expired. Please try again.";
  //   }
    
  //   return `Assistant did not complete the task. Status: ${run.status}`;
  // }

  // // Now fetch latest messages
  // const msgList = await this.client.beta.threads.messages.list(this.thread.id);

  // // Newest message is index 0
  // const assistantMsg = msgList.data.find(msg => msg.role === "assistant");

  // if (!assistantMsg) {
  //   console.error("No assistant message found:", msgList.data);
  //   return "No assistant reply.";
  // }

  // const textBlock = assistantMsg.content.find(c => c.type === "text");

  // if (!textBlock) {
  //   console.error("Assistant message contains no text:", assistantMsg);
  //   return "No text in assistant reply.";
  // }

  // return textBlock.text.value;
}
}
