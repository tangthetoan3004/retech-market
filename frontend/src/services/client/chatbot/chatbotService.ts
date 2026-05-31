import { get } from "../../../utils/request";

const BASE_URL = import.meta.env.VITE_API_URL || "";

export type ChatMessage = {
  id: number;
  sender: "user" | "bot";
  message: string;
  citations: Citation[];
  created_at: string;
};

export type Citation = {
  index: number;
  title: string;
  url_path: string;
  type: "document" | "product";
};

export type ChatResponse = {
  response: string;
  citations: Citation[];
  session_key: string;
  predicted_intent: string;
};

export type ChatHistoryResponse = {
  messages: ChatMessage[];
  session_key: string;
};

/**
 * Gọi thẳng fetch để kiểm soát hoàn toàn việc unwrap response.
 * Backend bọc tất cả response thành { status, data } qua CustomJSONRenderer.
 * Timeout 20s vì Gemini API có thể chậm.
 */
export async function sendChatMessage(
  session_key: string,
  message: string
): Promise<ChatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(`${BASE_URL}/api/chatbot/chat/`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_key, message }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const raw = await res.json();

    if (!res.ok) {
      const errMsg =
        raw?.message || raw?.errors?.detail || `Lỗi ${res.status}`;
      throw new Error(errMsg);
    }

    // CustomJSONRenderer bọc thành { status: "success", data: { response, citations, ... } }
    const payload: ChatResponse = raw?.data ?? raw;
    return payload;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new Error("Request timeout - bot đang bận, thử lại sau nhé!");
    }
    throw err;
  }
}

export async function getChatHistory(
  session_key: string
): Promise<ChatHistoryResponse> {
  // GET thì request.ts unwrap đúng vì data là object không có 'results'
  const raw: any = await get("/api/chatbot/history/", {
    params: { session_key },
  });
  // unwrapApiData trả về raw.data hoặc raw, ta cần { messages, session_key }
  return raw;
}

export async function getSuggestedQuestions(): Promise<{
  suggestions: string[];
}> {
  const raw: any = await get("/api/chatbot/suggested-questions/");
  return raw;
}

