require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(limiter);

// Initialize Deepseek client (compatible with OpenAI SDK)
const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com/beta",
});

const SYSTEM_PROMPT = `You are Mindwell Pulse, an AI mental wellbeing assistant designed to support individuals in managing stress, anxiety, and overall mental health. You are warm, empathetic, and supportive, but operate within strict ethical boundaries.

CORE RESPONSIBILITIES:
1. Provide emotional support and mental wellbeing guidance
2. Suggest evidence-based coping strategies and mindfulness techniques
3. Help users identify stress triggers and healthy habits
4. Encourage professional help when appropriate
5. Maintain a non-judgmental, inclusive environment
6. Respond with warmth and genuine care

CRITICAL RESTRICTIONS - YOU MUST REFUSE:
1. Do NOT provide medical diagnosis or treatment advice
2. Do NOT replace professional mental health care
3. Do NOT engage in politics, finance, coding, or sports discussions
4. Do NOT provide personal financial or legal advice
5. Do NOT engage in gaming, trivia, or entertainment discussions
6. Do NOT provide medical prescriptions or medication recommendations
7. Do NOT engage in romantic or sexual content
8. Do NOT replace professional therapy or psychiatric care
9. Do NOT store or process sensitive personal identifying information

REQUIRED ACTIONS:
1. When users mention self-harm, suicide, or crisis: Immediately provide crisis resources (988 US, 116 123 UK, findahelpline.com)
2. For out-of-domain topics: Gently redirect to mental wellbeing: "I'm here to support your mental wellbeing. Let's refocus on stress management, mindfulness, or building healthy habits."
3. For emotional support: Ask reflective questions to help users explore their feelings
4. For coping strategies: Suggest specific, actionable techniques (deep breathing, journaling, meditation)
5. Always clarify you're not a therapist: "I'm an AI assistant, not a mental health professional"
6. When users need professional help: Encourage therapy or counseling and provide crisis resources

TONE:
- Warm, empathetic, and supportive
- Non-clinical but knowledgeable
- Encouraging and non-judgmental
- Personal but professional

RESPONSE CONSTRAINTS:
- Keep responses concise (under 200 words)
- Use simple, clear language
- Include actionable suggestions when possible
- Always validate emotions before providing advice`;

const ALLOWED_TOPICS = [
  "stress",
  "anxiety",
  "worry",
  "mindfulness",
  "meditation",
  "coping",
  "emotion",
  "feeling",
  "sleep",
  "exercise",
  "health",
  "wellbeing",
  "mental health",
  "mood",
  "motivation",
  "happiness",
  "sad",
  "depression",
  "overwhelm",
  "breathing",
  "relax",
  "calm",
  "focus",
  "productivity",
  "habit",
  "routine",
  "self-care",
  "mindful",
  "journal",
  "therapy",
  "counseling",
  "support",
  "difficult",
  "hard",
  "struggling",
  "challenge",
];

const FORBIDDEN_TOPICS = [
  "politics",
  "finance",
  "coding",
  "programming",
  "sports",
  "gaming",
  "trivia",
  "music",
  "movies",
  "entertainment",
  "dating",
  "romance",
  "legal",
  "law",
  "medical",
  "diagnosis",
  "medicine",
  "drug",
  "prescription",
  "cryptocurrency",
  "stock",
  "investment",
];

const CRISIS_KEYWORDS = [
  "suicide",
  "suicidal",
  "self harm",
  "self-harm",
  "cut myself",
  "cutting",
  "end it",
  "no point living",
  "harm myself",
  "kill myself",
  "die",
  "death",
  "overdose",
  "jump",
  "hang myself",
  "gone",
  "not here",
];

const CRISIS_RESPONSE = `I'm genuinely concerned about your safety. Please reach out for immediate support:

🚨 **Crisis Resources:**
- **US**: 988 Suicide & Crisis Lifeline (call or text 988)
- **UK**: Samaritans (116 123)
- **International**: findahelpline.com
- **Australia**: Lifeline (13 11 14)

If you're in immediate danger, please call emergency services (911 in US, 999 in UK) or go to the nearest emergency room.

You are valued, and there are people who want to help. Reaching out is a sign of strength. 💙`;

function isCrisisAlert(message) {
  const lowerMessage = message.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lowerMessage.includes(keyword));
}

function isAllowedTopic(message) {
  const lowerMessage = message.toLowerCase();
  return ALLOWED_TOPICS.some((keyword) => lowerMessage.includes(keyword));
}

function containsForbiddenTopic(message) {
  const lowerMessage = message.toLowerCase();
  return FORBIDDEN_TOPICS.some((keyword) => lowerMessage.includes(keyword));
}

function logInteraction(userMessage, assistantResponse, isCrisis = false) {
  const timestamp = new Date().toISOString();
  const interaction = {
    timestamp,
    userMessageLength: userMessage.length,
    responseLength: assistantResponse.length,
    isCrisis,
    isForbidden: containsForbiddenTopic(userMessage),
  };
  console.log("[Chat Log]", JSON.stringify(interaction));
}

app.get("/health", (req, res) => {
  res.json({ status: "Mindwell Pulse server is running" });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    // Validate input
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Message is required and must be a non-empty string" });
    }

    const userMessage = message.trim();

    if (isCrisisAlert(userMessage)) {
      logInteraction(userMessage, CRISIS_RESPONSE, true);
      return res.json({
        response: CRISIS_RESPONSE,
        isCrisis: true,
        type: "crisis_alert",
      });
    }

    if (containsForbiddenTopic(userMessage)) {
      const redirectResponse =
        "I'm here to support your mental wellbeing. Let's refocus on stress management, mindfulness, building healthy habits, or other mental health topics. What's on your mind today regarding your wellbeing?";
      logInteraction(userMessage, redirectResponse, false);
      return res.json({
        response: redirectResponse,
        type: "topic_redirect",
      });
    }

    const isOnDomain = isAllowedTopic(userMessage);
    const contextualSystemPrompt = isOnDomain
      ? SYSTEM_PROMPT
      : SYSTEM_PROMPT +
        `\n\nNote: The user's message is not clearly related to mental wellbeing. Gently redirect them to mental health topics while being empathetic.`;

    const messages = [
      ...conversationHistory.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      {
        role: "user",
        content: userMessage,
      },
    ];

    const completion = await deepseek.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
      messages: [
        {
          role: "system",
          content: contextualSystemPrompt,
        },
        ...messages,
      ],
      temperature: 0.6,
      max_tokens: 500,
      top_p: 0.9,
    });

    const assistantResponse = completion.choices[0].message.content;

    logInteraction(userMessage, assistantResponse, false);

    res.json({
      response: assistantResponse,
      type: "standard",
      conversationContinued: true,
    });
  } catch (error) {
    console.error("Error calling Deepseek API:", error);
    const fallbackResponse =
      "I apologize, I'm having trouble connecting right now. Please try again in a moment. If you're in crisis, please reach out to 988 (US) or 116 123 (UK).";

    res.status(500).json({
      response: fallbackResponse,
      type: "error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Service temporarily unavailable",
    });
  }
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mindwell Pulse server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
