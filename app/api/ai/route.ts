import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const AnswerExtraction = z.object({
      response: z.string(),
      relatedquery: z.boolean(),
    });

    const result = await client.responses.parse({
      model: "gpt-4o-2024-08-06",
      input: [
        {
          role: "system",
          content: `
            You are an AI assistant specializing in topics related to Israel.
            - If the user's question is related to Israel, respond in Hebrew and set relatedquery=true.
            - Otherwise say you do not have knowledge and set relatedquery=false.
          `,
        },
        { role: "user", content: message },
      ],
      text: { format: zodTextFormat(AnswerExtraction, "answer_extraction") },
    });

    return Response.json(
      result.output_parsed ?? {
        response: "לא הצלחתי לעבד את הבקשה.",
        relatedquery: false,
      }
    );
  } catch (err) {
    console.error(err);
    return new Response("Server error", { status: 500 });
  }
}
