// chatbot-new.js

(function () {
  "use strict";
  console.log("MindWell chat widget loaded (local KB mode)");

  try {
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "btn btn-primary rounded-circle mw-chat-toggle";
    toggleBtn.title = "Open MindWell chat";
    toggleBtn.innerHTML = '<i class="fa-solid fa-comment-dots"></i>';
    document.body.appendChild(toggleBtn);

    const widget = document.createElement("div");
    widget.className = "mw-chat-widget shadow-sm";
    widget.style.display = "none";
    widget.setAttribute("aria-hidden", "true");
    widget.innerHTML = `
      <div class="header">
        <div class="d-flex align-items-center">
          <svg class="logo-image me-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
            <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7z" fill="currentColor"/>
            <path d="M12 6v2m0 8v2M6 12h2m8 0h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle cx="12" cy="12" r="3" fill="currentColor"/>
          </svg>
          <strong>MindWell Assistant</strong>
        </div>
        <div class="ms-auto small text-white">Private & anonymous</div>
      </div>
      <div class="messages" role="log" aria-live="polite"></div>
      <div class="suggestions d-flex flex-wrap gap-1 mt-2" aria-hidden="false"></div>
      <div class="input-area">
        <form id="mwChatForm" class="d-flex gap-2">
          <input id="mwInput" class="form-control form-control-sm" placeholder="How can I help today?" />
          <button class="btn btn-primary btn-sm" type="submit">Send</button>
        </form>
      </div>
    `;

    // Position container
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.right = "22px";
    wrapper.style.bottom = "22px";
    wrapper.style.zIndex = 1100;
    wrapper.appendChild(widget);
    document.body.appendChild(wrapper);

    const messagesEl = widget.querySelector(".messages");
    const form = widget.querySelector("#mwChatForm");
    const input = widget.querySelector("#mwInput");
    const suggestionsEl = widget.querySelector(".suggestions");

    const SUGGESTIONS_WIDGET = [
      "I'm feeling sad",
      "I'm anxious",
      "I can't sleep",
      "I need a breathing exercise",
      "I'm stressed",
    ];

    const LOCAL_KB = [
      {
        keys: ["feeling low", "feeling sad", "low", "down", "sad", "depressed"],
        response:
          "I hear you. Feeling low can be really challenging. Here are some things that might help:\n\n1. Reach out: Talk to someone you trust about how you're feeling.\n\n2. Move your body: Even a short 10-minute walk can boost your mood and clear your mind.\n\n3. Practice gratitude: Write down 3 things you're grateful for.\n\n4. Self-care: Eat, hydrate, and rest.\n\n5. Do something small you enjoy. If feelings persist, consider reaching out to a professional. 💙",
      },
      {
        keys: ["anxiety", "anxious", "nervous", "worried", "panic", "stressed"],
        response:
          "Anxiety can feel overwhelming. Try:\n\n• Box Breathing: 4 in, 4 hold, 4 out, 4 hold (repeat).\n• 5-4-3-2-1 grounding: use senses to anchor to the present.\n• Progressive muscle relaxation.\n\nIf it interferes with daily life, consider seeking professional support. 💙",
      },
      {
        keys: ["sleep", "insomnia", "can't sleep", "sleepless", "tired"],
        response:
          "Sleep tips:\n\n1. Keep a consistent schedule.\n2. Wind down 30 mins before bed; avoid screens.\n3. Try 4-7-8 breathing before sleep.\n4. Make the room cool, dark, and quiet.\n\nIf sleep problems persist, consult a specialist. 💙",
      },
      {
        keys: ["ground", "grounding", "present", "here now"],
        response:
          "Grounding (5-4-3-2-1):\n1. Name 5 things you can see.\n2. Name 4 things you can touch.\n3. Name 3 things you can hear.\n4. Name 2 things you can smell.\n5. Name 1 thing you can taste.\n\nTry a body scan or press your feet into the floor to feel more present. 💙",
      },
      {
        keys: [
          "calm",
          "calming",
          "exercise",
          "relax",
          "relaxation",
          "breathing",
        ],
        response:
          "5-minute calming exercise:\n\n1. 4-7-8 breathing: in 4, hold 7, out 8 (4 repeats).\n2. Body scan: tense and relax shoulders, arms, legs.\n3. Notice 5 things around you.\n\nPractice often — it gets easier. 💙",
      },
    ];

    function findLocalAnswer(text) {
      const t = text.toLowerCase();
      for (const item of LOCAL_KB) {
        for (const k of item.keys) {
          if (t.includes(k)) return item.response;
        }
      }
      return null;
    }

    function renderSuggestionsWidget() {
      if (!suggestionsEl) return;
      suggestionsEl.innerHTML = "";
      SUGGESTIONS_WIDGET.forEach((txt) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-sm btn-light suggestion-chip";
        btn.textContent = txt;
        btn.addEventListener("click", () => sendSuggestionWidget(txt));
        suggestionsEl.appendChild(btn);
      });
    }

    function sendSuggestionWidget(text) {
      if (!messagesEl) return;
      appendMessageWidget("user", text);
      saveMessageWidget("user", text);
      setTimeout(() => {
        getResponseWidgetLocal(text);
      }, 300);
    }

    function getResponseWidgetLocal(userMsg) {
      const answer = findLocalAnswer(userMsg);
      const reply =
        answer ||
        "I'm here to support your mental wellbeing. Try asking: 'I'm feeling low', 'I have anxiety', 'I need help sleeping', 'Teach me grounding', or 'Give me a calming exercise'.";
      appendMessageWidget("bot", reply);
      saveMessageWidget("bot", reply);
    }

    function loadHistoryWidgetForAPI() {
      try {
        const history = JSON.parse(
          localStorage.getItem("mw_chat_history") || "[]"
        );
        return history.map((m) => ({
          role: m.who === "user" ? "user" : "assistant",
          content: m.text,
        }));
      } catch (e) {
        return [];
      }
    }

    function appendMessageWidget(who, text) {
      if (!messagesEl) return;
      const div = document.createElement("div");
      div.className = who === "bot" ? "msg bot mb-2" : "msg user mb-2";
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function loadHistoryWidget() {
      try {
        const history = JSON.parse(
          localStorage.getItem("mw_chat_history") || "[]"
        );
        history.forEach((m) => appendMessageWidget(m.who, m.text));
      } catch (e) {
        /* ignore */
      }
    }

    function saveMessageWidget(who, text) {
      try {
        const history = JSON.parse(
          localStorage.getItem("mw_chat_history") || "[]"
        );
        history.push({ who, text, t: Date.now() });
        localStorage.setItem(
          "mw_chat_history",
          JSON.stringify(history.slice(-200))
        );
      } catch (e) {
        /* ignore */
      }
    }

    // Toggle
    let visible = false;
    toggleBtn.addEventListener("click", () => {
      visible = !visible;
      widget.style.display = visible ? "flex" : "none";
      widget.setAttribute("aria-hidden", visible ? "false" : "true");
      if (visible) {
        input.focus();
        if (messagesEl.children.length === 0) {
          const greeting =
            "Hi, I'm MindWell Assistant. How are you feeling today?";
          appendMessageWidget("bot", greeting);
          saveMessageWidget("bot", greeting);
        }
        renderSuggestionsWidget();
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      appendMessageWidget("user", text);
      saveMessageWidget("user", text);
      input.value = "";
      getResponseWidgetFromAPI(text);
    });

    loadHistoryWidget();
    renderSuggestionsWidget();
  } catch (err) {
    console.error("Chat widget init error:", err);
  }
})();

(function () {
  "use strict";

  function setupPageChat() {
    const chatBox = document.getElementById("chat-box");
    const form = document.getElementById("chat-form");
    const input = document.getElementById("user-input");
    const clearBtn = document.getElementById("clear-chat");
    if (!chatBox || !form || !input) return;

    const SUGGESTIONS_PAGE = [
      "I'm feeling low",
      "I have anxiety",
      "I need help sleeping",
      "Teach me grounding",
      "Give me a calming exercise",
    ];

    const LOCAL_KB_PAGE = [
      {
        keys: ["feeling low", "feeling sad", "low", "down", "sad", "depressed"],
        response:
          "I hear you. Feeling low can be really challenging. Here are some things that might help:\n\n1. Reach out: Talk to someone you trust about how you're feeling.\n\n2. Move your body: Even a short 10-minute walk can boost your mood and clear your mind.\n\n3. Practice gratitude: Write down 3 things you're grateful for.\n\n4. Self-care: Eat, hydrate, and rest.\n\n5. Do something small you enjoy. If feelings persist, consider reaching out to a professional. 💙",
      },
      {
        keys: ["anxiety", "anxious", "nervous", "worried", "panic", "stressed"],
        response:
          "Anxiety can feel overwhelming. Try:\n\n• Box Breathing: 4 in, 4 hold, 4 out, 4 hold (repeat).\n• 5-4-3-2-1 grounding: use senses to anchor to the present.\n• Progressive muscle relaxation.\n\nIf it interferes with daily life, consider seeking professional support. 💙",
      },
      {
        keys: ["sleep", "insomnia", "can't sleep", "sleepless", "tired"],
        response:
          "Sleep tips:\n\n1. Keep a consistent schedule.\n2. Wind down 30 mins before bed; avoid screens.\n3. Try 4-7-8 breathing before sleep.\n4. Make the room cool, dark, and quiet.\n\nIf sleep problems persist, consult a specialist. 💙",
      },
      {
        keys: ["ground", "grounding", "present", "here now"],
        response:
          "Grounding (5-4-3-2-1):\n1. Name 5 things you can see.\n2. Name 4 things you can touch.\n3. Name 3 things you can hear.\n4. Name 2 things you can smell.\n5. Name 1 thing you can taste.\n\nTry a body scan or press your feet into the floor to feel more present. 💙",
      },
      {
        keys: [
          "calm",
          "calming",
          "exercise",
          "relax",
          "relaxation",
          "breathing",
        ],
        response:
          "5-minute calming exercise:\n\n1. 4-7-8 breathing: in 4, hold 7, out 8 (4 repeats).\n2. Body scan: tense and relax shoulders, arms, legs.\n3. Notice 5 things around you.\n\nPractice often — it gets easier. 💙",
      },
    ];

    function findLocalAnswerPage(text) {
      const t = text.toLowerCase();
      for (const item of LOCAL_KB_PAGE) {
        for (const k of item.keys) {
          if (t.includes(k)) return item.response;
        }
      }
      return null;
    }

    const footer = form.parentElement;
    let suggestionsContainer = footer.querySelector(".mw-page-suggestions");
    if (!suggestionsContainer) {
      suggestionsContainer = document.createElement("div");
      suggestionsContainer.className =
        "mw-page-suggestions d-flex flex-wrap gap-2 mb-2";
      footer.insertBefore(suggestionsContainer, form);
    }

    function renderSuggestionsPage() {
      suggestionsContainer.innerHTML = "";
      SUGGESTIONS_PAGE.forEach((s) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btn-sm btn-light";
        btn.textContent = s;
        btn.addEventListener("click", () => {
          addMessage(s, "user");
          setTimeout(() => {
            getResponseFromAPI(s);
          }, 300);
        });
        suggestionsContainer.appendChild(btn);
      });
    }

    renderSuggestionsPage();

    function loadChat() {
      try {
        const history = JSON.parse(
          localStorage.getItem("mindwell_chat") || "[]"
        );
        history.forEach((m) => addMessage(m.text, m.sender));
      } catch (e) {
        /* ignore */
      }
    }

    // Save chat
    function saveChat() {
      const messages = [...chatBox.querySelectorAll(".message")].map((div) => ({
        text: div.textContent,
        sender: div.classList.contains("user") ? "user" : "bot",
      }));
      localStorage.setItem("mindwell_chat", JSON.stringify(messages));
    }

    // Add message to chat
    function addMessage(text, sender) {
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("message");
      msgDiv.classList.add(sender === "user" ? "user" : "bot");
      msgDiv.textContent = text;
      chatBox.appendChild(msgDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
      saveChat();
    }

    // Get AI response from API
    function getResponseFromAPI(userMsg) {
      const answer = findLocalAnswerPage(userMsg);
      const reply =
        answer ||
        "I'm here to support your mental wellbeing. Try asking: 'I'm feeling low', 'I have anxiety', 'I need help sleeping', 'Teach me grounding', or 'Give me a calming exercise'.";
      addMessage(reply, "bot");
    }

    function loadChatHistoryForAPI() {
      try {
        const history = JSON.parse(
          localStorage.getItem("mindwell_chat") || "[]"
        );
        return history.map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));
      } catch (e) {
        return [];
      }
    }

    // Handle submit
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const userMsg = input.value.trim();
      if (!userMsg) return;

      addMessage(userMsg, "user");
      input.value = "";

      setTimeout(() => {
        getResponseFromAPI(userMsg);
      }, 300);
    });

    // Clear chat
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        localStorage.removeItem("mindwell_chat");
        chatBox.innerHTML = "";
      });
    }

    loadChat();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupPageChat);
  } else {
    setupPageChat();
  }
})();
