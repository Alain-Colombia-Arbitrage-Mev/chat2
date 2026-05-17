(function () {
  "use strict";

  // Translations
  var i18n = {
    en: { fab: "Chat with us", title: "Chat with us", placeholder: "Type a message...", formTitle: "Before we start", formDesc: "Please share your details so we can assist you better.", name: "Name", namePh: "Your name", email: "Email", emailPh: "you@example.com", phone: "Phone", phonePh: "+1 234 567 8900", start: "Start Chat", empty: "Send a message to start chatting", nameReq: "Name is required", emailReq: "Email is required", emailInv: "Invalid email", phoneReq: "Phone is required", phoneInv: "Invalid phone (7-15 digits)", upload: "Upload bill", billAnalyzed: "I analyzed your bill. Here's what I found:", billAskSavings: "Want me to calculate your solar savings based on this?", docReceived: "I received your document", docHelp: "How can I help you with this?", docFailed: "Could not process the document. Please try again.", uploadFailed: "Failed to upload document. Please try again.", sendProposal: "📧 Send proposal to my email", proposalSending: "Sending proposal...", proposalSent: "Proposal sent to", proposalFailed: "Could not send the proposal. Please try again." },
    es: { fab: "Chatea con nosotros", title: "Chatea con nosotros", placeholder: "Escribe un mensaje...", formTitle: "Antes de empezar", formDesc: "Comparte tus datos para poder ayudarte mejor.", name: "Nombre", namePh: "Tu nombre", email: "Correo", emailPh: "tu@ejemplo.com", phone: "Teléfono", phonePh: "+57 300 123 4567", start: "Iniciar Chat", empty: "Envía un mensaje para comenzar", nameReq: "Nombre requerido", emailReq: "Correo requerido", emailInv: "Correo inválido", phoneReq: "Teléfono requerido", phoneInv: "Teléfono inválido (7-15 dígitos)", upload: "Subir factura", billAnalyzed: "Analicé tu factura. Esto es lo que encontré:", billAskSavings: "¿Quieres que calcule tu ahorro con energía solar?", docReceived: "Recibí tu documento", docHelp: "¿En qué puedo ayudarte con esto?", docFailed: "No pude procesar el documento. Intenta de nuevo.", uploadFailed: "No se pudo subir el documento. Intenta de nuevo.", sendProposal: "📧 Enviar propuesta a mi correo", proposalSending: "Enviando propuesta...", proposalSent: "Propuesta enviada a", proposalFailed: "No se pudo enviar la propuesta. Intenta de nuevo." },
    pt: { fab: "Fale conosco", title: "Fale conosco", placeholder: "Digite uma mensagem...", formTitle: "Antes de começar", formDesc: "Compartilhe seus dados para que possamos ajudá-lo melhor.", name: "Nome", namePh: "Seu nome", email: "E-mail", emailPh: "voce@exemplo.com", phone: "Telefone", phonePh: "+55 11 9876 5432", start: "Iniciar Chat", empty: "Envie uma mensagem para começar", nameReq: "Nome obrigatório", emailReq: "E-mail obrigatório", emailInv: "E-mail inválido", phoneReq: "Telefone obrigatório", phoneInv: "Telefone inválido (7-15 dígitos)", upload: "Enviar fatura", billAnalyzed: "Analisei sua fatura. Isto é o que encontrei:", billAskSavings: "Quer que eu calcule sua economia com energia solar?", docReceived: "Recebi seu documento", docHelp: "Como posso te ajudar com isso?", docFailed: "Não consegui processar o documento. Tente novamente.", uploadFailed: "Falha ao enviar o documento. Tente novamente.", sendProposal: "📧 Enviar proposta para meu e-mail", proposalSending: "Enviando proposta...", proposalSent: "Proposta enviada para", proposalFailed: "Não foi possível enviar a proposta. Tente novamente." },
    ar: { fab: "تحدث معنا", title: "تحدث معنا", placeholder: "اكتب رسالة...", formTitle: "قبل أن نبدأ", formDesc: "شارك بياناتك حتى نتمكن من مساعدتك بشكل أفضل.", name: "الاسم", namePh: "اسمك", email: "البريد", emailPh: "you@example.com", phone: "الهاتف", phonePh: "+966 50 123 4567", start: "ابدأ المحادثة", empty: "أرسل رسالة لبدء المحادثة", nameReq: "الاسم مطلوب", emailReq: "البريد مطلوب", emailInv: "بريد غير صالح", phoneReq: "الهاتف مطلوب", phoneInv: "هاتف غير صالح", upload: "رفع الفاتورة", billAnalyzed: "قمت بتحليل فاتورتك. إليك ما وجدته:", billAskSavings: "هل تريد أن أحسب توفيرك من الطاقة الشمسية بناءً على ذلك؟", docReceived: "استلمت مستندك", docHelp: "كيف يمكنني مساعدتك بهذا؟", docFailed: "تعذر معالجة المستند. حاول مرة أخرى.", uploadFailed: "فشل تحميل المستند. حاول مرة أخرى.", sendProposal: "📧 إرسال العرض إلى بريدي", proposalSending: "جارٍ إرسال العرض...", proposalSent: "تم إرسال العرض إلى", proposalFailed: "تعذر إرسال العرض. حاول مرة أخرى." },
    zh: { fab: "联系我们", title: "联系我们", placeholder: "输入消息...", formTitle: "在开始之前", formDesc: "请分享您的信息以便我们更好地为您服务。", name: "姓名", namePh: "您的姓名", email: "邮箱", emailPh: "you@example.com", phone: "电话", phonePh: "+86 138 0000 0000", start: "开始聊天", empty: "发送消息开始聊天", nameReq: "姓名必填", emailReq: "邮箱必填", emailInv: "邮箱无效", phoneReq: "电话必填", phoneInv: "电话无效", upload: "上传账单", billAnalyzed: "我已分析您的账单。以下是我找到的信息：", billAskSavings: "需要我根据这些数据计算您的太阳能节省吗？", docReceived: "我已收到您的文件", docHelp: "我能为您做什么？", docFailed: "无法处理该文件，请重试。", uploadFailed: "文件上传失败，请重试。", sendProposal: "📧 发送方案到我的邮箱", proposalSending: "正在发送方案...", proposalSent: "方案已发送至", proposalFailed: "发送方案失败，请重试。" },
  };

  // Detect language: data-lang > html[lang] > navigator.language > "en"
  var script = document.currentScript;
  var fixedLang = script?.getAttribute("data-lang"); // manual override

  function detectLang() {
    var raw = (fixedLang || document.documentElement.lang || navigator.language || "en").toLowerCase().slice(0, 2);
    return i18n[raw] ? raw : "en";
  }

  var LANG = detectLang();
  var t = i18n[LANG];
  var isRTL = LANG === "ar";

  var AGENT_ID = script?.getAttribute("data-agent") || "default";
  var SERVER = (script?.getAttribute("data-server") || "").replace(/\/$/, "");
  var PRIMARY = script?.getAttribute("data-color") || "#f97316";
  var ACCENT = script?.getAttribute("data-accent") || "#1a1a2e";
  var POSITION = script?.getAttribute("data-position") || "right";
  var HEADER_TEXT = script?.getAttribute("data-title") || t.title;
  var PLACEHOLDER = script?.getAttribute("data-placeholder") || t.placeholder;
  var BTN_TEXT = script?.getAttribute("data-button") || t.fab;

  function updateLang() {
    var newLang = detectLang();
    if (newLang === LANG) return;
    LANG = newLang;
    t = i18n[LANG];
    isRTL = LANG === "ar";
    if (!script?.getAttribute("data-title")) HEADER_TEXT = t.title;
    if (!script?.getAttribute("data-placeholder")) PLACEHOLDER = t.placeholder;
    if (!script?.getAttribute("data-button")) BTN_TEXT = t.fab;

    // Re-inject styles for RTL
    var oldStyle = document.getElementById("ancestro-widget-css");
    if (oldStyle) oldStyle.remove();
    injectStyles();

    // Update FAB text and title
    var fabText = document.querySelector(".ancestro-fab-text");
    if (fabText) fabText.textContent = BTN_TEXT;
    var fab = document.getElementById("ancestro-widget-fab");
    if (fab) fab.title = BTN_TEXT;

    // Always re-render panel (updates form labels, placeholders, header)
    renderPanel();

    document.dispatchEvent(new CustomEvent("ancestro:lang", { detail: { lang: LANG } }));
  }

  var isOpen = false;
  var isLoading = false;
  var messages = [];
  var configLoaded = false;
  var userInfo = null; // { name, email, phone }
  var sessionId = null;

  // -- Fetch remote config (optional, merges with data attributes) --
  function loadConfig(cb) {
    if (!SERVER) return cb();
    fetch(SERVER + "/api/widget/config/" + AGENT_ID)
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (data) {
          var wc = data.widgetConfig || {};
          if (!script?.getAttribute("data-color") && wc.primaryColor) PRIMARY = wc.primaryColor;
          if (!script?.getAttribute("data-accent") && wc.accentColor) ACCENT = wc.accentColor;
          if (!script?.getAttribute("data-title") && wc.chatHeaderTitle) HEADER_TEXT = wc.chatHeaderTitle;
          if (!script?.getAttribute("data-placeholder") && wc.inputPlaceholder) PLACEHOLDER = wc.inputPlaceholder;
          if (!script?.getAttribute("data-position") && wc.position) POSITION = wc.position;
          if (!script?.getAttribute("data-button") && wc.buttonText) BTN_TEXT = wc.buttonText;
        }
        cb();
      })
      .catch(function () { cb(); });
  }

  // -- Send message --
  function sendMessage(text, history, cb) {
    fetch(SERVER + "/api/widget/chat/" + AGENT_ID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, conversationHistory: history, userInfo: userInfo, sessionId: sessionId, lang: LANG }),
    })
      .then(function (r) { return r.json(); })
      .then(function (data) { if (data.sessionId) sessionId = data.sessionId; cb(null, data.response || "No response"); })
      .catch(function (err) { cb(err); });
  }

  // -- Inject CSS --
  function injectStyles() {
    var isRight = POSITION !== "left";
    var style = document.createElement("style");
    style.id = "ancestro-widget-css";
    style.textContent = "\
      #ancestro-widget-fab {\
        position: fixed;\
        bottom: 24px;\
        " + (isRight ? "right: 24px;" : "left: 24px;") + "\
        height: 64px;\
        border-radius: 32px;\
        background: #111111;\
        border: none;\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        gap: 12px;\
        padding: 0 24px 0 16px;\
        box-shadow: 0 4px 16px rgba(0,0,0,0.25);\
        z-index: 2147483647;\
        font-family: Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif;\
        animation: ancestroFloat 3s ease-in-out infinite;\
        transition: box-shadow 0.3s;\
      }\
      #ancestro-widget-fab:hover {\
        box-shadow: 0 6px 24px rgba(0,0,0,0.35);\
        animation-play-state: paused;\
      }\
      @keyframes ancestroFloat {\
        0%, 100% { transform: translateY(0); }\
        50% { transform: translateY(-6px); }\
      }\
      #ancestro-widget-fab svg { width: 38px; height: 38px; flex-shrink: 0; }\
      .ancestro-fab-text {\
        color: #ffffff;\
        font-size: 16px;\
        font-weight: 600;\
        white-space: nowrap;\
        letter-spacing: 0.3px;\
      }\
      #ancestro-widget-panel {\
        position: fixed;\
        bottom: 100px;\
        " + (isRight ? "right: 24px;" : "left: 24px;") + "\
        width: 400px;\
        max-width: calc(100vw - 32px);\
        height: 560px;\
        max-height: calc(100vh - 130px);\
        background: #ffffff;\
        border-radius: 20px;\
        box-shadow: 0 12px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);\
        display: none;\
        flex-direction: column;\
        overflow: hidden;\
        z-index: 2147483647;\
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;\
        font-size: 13px;\
        line-height: 1.5;\
        color: #1f2937;\
        border: none;\
        " + (isRTL ? "direction: rtl; text-align: right;" : "") + "\
      }\
      #ancestro-widget-panel.ancestro-open {\
        display: flex;\
        animation: ancestroSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);\
      }\
      @keyframes ancestroSlideIn {\
        from { opacity: 0; transform: translateY(20px) scale(0.95); }\
        to { opacity: 1; transform: translateY(0) scale(1); }\
      }\
      .ancestro-header {\
        display: flex;\
        align-items: center;\
        gap: 10px;\
        padding: 16px 20px;\
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);\
        color: white;\
        font-size: 15px;\
        font-weight: 600;\
        flex-shrink: 0;\
      }\
      .ancestro-header-logo { width: 28px; height: 26px; flex-shrink: 0; }\
      .ancestro-header-info { display: flex; flex-direction: column; }\
      .ancestro-header-title { font-size: 14px; font-weight: 600; }\
      .ancestro-header-status { font-size: 11px; color: rgba(255,255,255,0.6); font-weight: 400; }\
      .ancestro-header-close {\
        margin-left: auto;\
        background: none;\
        border: none;\
        color: rgba(255,255,255,0.5);\
        cursor: pointer;\
        padding: 6px;\
        border-radius: 8px;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        transition: all 0.15s;\
      }\
      .ancestro-header-close:hover {\
        color: white;\
        background: rgba(255,255,255,0.1);\
      }\
      .ancestro-messages {\
        flex: 1;\
        overflow-y: auto;\
        padding: 16px;\
        display: flex;\
        flex-direction: column;\
        gap: 10px;\
      }\
      .ancestro-msg {\
        max-width: 82%;\
        padding: 10px 14px;\
        font-size: 13px;\
        line-height: 1.5;\
        white-space: pre-wrap;\
        word-break: break-word;\
      }\
      .ancestro-msg-user {\
        align-self: flex-end;\
        background: #F8B03B;\
        color: #1a1a2e;\
        border-radius: 16px 16px 4px 16px;\
        font-weight: 500;\
      }\
      .ancestro-msg-bot {\
        align-self: flex-start;\
        background: #f8f9fa;\
        color: #1f2937;\
        border-radius: 16px 16px 16px 4px;\
        border: 1px solid #e9ecef;\
      }\
      .ancestro-typing {\
        align-self: flex-start;\
        display: flex;\
        gap: 4px;\
        padding: 12px 16px;\
        background: #f8f9fa;\
        border-radius: 16px 16px 16px 4px;\
        border: 1px solid #e9ecef;\
      }\
      .ancestro-dot {\
        width: 6px;\
        height: 6px;\
        border-radius: 50%;\
        background: #9ca3af;\
        animation: ancestroBounce 1.4s ease-in-out infinite;\
      }\
      .ancestro-dot:nth-child(2) { animation-delay: 0.2s; }\
      .ancestro-dot:nth-child(3) { animation-delay: 0.4s; }\
      @keyframes ancestroBounce {\
        0%, 60%, 100% { transform: translateY(0); }\
        30% { transform: translateY(-4px); }\
      }\
      .ancestro-input-area {\
        border-top: 1px solid #f0f0f0;\
        padding: 12px 16px;\
        display: flex;\
        align-items: flex-end;\
        gap: 8px;\
        background: #fafbfc;\
        flex-shrink: 0;\
      }\
      .ancestro-textarea {\
        flex: 1;\
        border: none;\
        outline: none;\
        resize: none;\
        font-size: 13px;\
        font-family: inherit;\
        color: #1f2937;\
        background: transparent;\
        padding: 8px 0;\
        min-height: 36px;\
        max-height: 80px;\
        line-height: 20px;\
      }\
      .ancestro-send {\
        flex-shrink: 0;\
        width: 36px;\
        height: 36px;\
        border-radius: 50%;\
        border: none;\
        background: #F8B03B;\
        color: #1a1a2e;\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        transition: background 0.15s, transform 0.1s;\
      }\
      .ancestro-send:hover { background: #e9a235; transform: scale(1.05); }\
      .ancestro-send:disabled {\
        opacity: 0.3;\
        cursor: default;\
        transform: none;\
      }\
      .ancestro-empty {\
        text-align: center;\
        color: #9ca3af;\
        font-size: 13px;\
        padding: 40px 16px;\
      }\
      .ancestro-action-btn {\
        display: inline-block;\
        margin: 8px 0 4px;\
        padding: 10px 16px;\
        background: " + PRIMARY + ";\
        color: #fff;\
        border: none;\
        border-radius: 10px;\
        font-size: 13px;\
        font-weight: 600;\
        cursor: pointer;\
        transition: opacity 0.15s;\
      }\
      .ancestro-action-btn:hover { opacity: 0.9; }\
      .ancestro-action-btn:disabled { opacity: 0.5; cursor: default; }\
      .ancestro-toast {\
        margin: 6px 0;\
        padding: 8px 12px;\
        background: #ecfdf5;\
        border: 1px solid #a7f3d0;\
        border-radius: 8px;\
        font-size: 12px;\
        color: #065f46;\
      }\
      .ancestro-toast-err {\
        background: #fef2f2;\
        border-color: #fecaca;\
        color: #991b1b;\
      }\
      .ancestro-form {\
        flex: 1;\
        padding: 20px;\
        display: flex;\
        flex-direction: column;\
        gap: 14px;\
        overflow-y: auto;\
      }\
      .ancestro-form h3 { font-size: 15px; font-weight: 600; color: #111827; margin-bottom: 2px; }\
      .ancestro-form p { font-size: 12px; color: #6b7280; margin-bottom: 4px; }\
      .ancestro-field { display: flex; flex-direction: column; gap: 4px; }\
      .ancestro-field label { font-size: 12px; font-weight: 500; color: #374151; }\
      .ancestro-field input {\
        padding: 10px 12px;\
        border: 1px solid #d1d5db;\
        border-radius: 8px;\
        font-size: 13px;\
        font-family: inherit;\
        color: #1f2937;\
        outline: none;\
        transition: border-color 0.15s;\
      }\
      .ancestro-field input:focus { border-color: #F8B03B; box-shadow: 0 0 0 2px rgba(248,176,59,0.15); }\
      .ancestro-field input.ancestro-field-err { border-color: #ef4444; }\
      .ancestro-field-error { font-size: 11px; color: #ef4444; }\
      .ancestro-form-btn {\
        padding: 12px;\
        border: none;\
        border-radius: 10px;\
        cursor: pointer;\
        font-size: 14px;\
        font-weight: 600;\
        color: #1a1a2e;\
        background: #F8B03B;\
        transition: background 0.15s, transform 0.1s;\
        margin-top: 4px;\
      }\
      .ancestro-form-btn:hover { background: #e9a235; transform: translateY(-1px); }\
      .ancestro-attach {\
        flex-shrink: 0;\
        width: 34px;\
        height: 34px;\
        border-radius: 50%;\
        border: none;\
        background: transparent;\
        color: #9ca3af;\
        cursor: pointer;\
        display: flex;\
        align-items: center;\
        justify-content: center;\
        transition: color 0.15s;\
      }\
      .ancestro-attach:hover { color: #374151; }\
      .ancestro-attach:disabled { opacity: 0.4; cursor: default; }\
    ";
    document.head.appendChild(style);
  }

  // -- Build DOM --
  function buildWidget() {
    // FAB
    var fab = document.createElement("button");
    fab.id = "ancestro-widget-fab";
    fab.innerHTML = '<svg viewBox="20 20 65 60" fill="none"><path d="M61.83 48.77c-.78 2.07-1.61 4.13-2.16 6.29-.45 1.75-.63 3.53-.7 5.33-.06 1.86-.08 3.73-.28 5.58-.3 2.94-1.71 5.16-4.43 6.44a6.5 6.5 0 01-3.1.59c-1.9-.03-3.65-.53-5.14-1.71-1.56-1.22-2.42-2.82-2.47-4.83-.02-.85.23-1.55.84-2.22 4.35-4.73 8.64-9.52 12.85-14.38.24-.28.46-.56.69-.84.12-.16.18-.34.1-.52-.09-.19-.28-.14-.45-.14h-4.75c-.43 0-.52-.12-.38-.55 1.17-3.52 2.35-7.04 3.53-10.56v-.13c-1.04 1.07-2.04 2.08-3.01 3.11-2.82 2.97-5.65 5.93-8.52 8.84l-.14.14c-.32.3-.51.3-.8-.04a27 27 0 01-1.69-2.06c-.74-.99-1.5-1.97-2.06-3.08-.69-1.34-1.11-2.77-1.07-4.28.07-2.71 1.44-4.77 3.98-5.82a8.4 8.4 0 013.11-.65c2.78-.24 5.51 0 8.16.88 3 1 5.61 2.62 7.78 4.93.82.88 1.17 1.94 1.3 3.12.27 2.31-.38 4.44-1.17 6.55z" fill="#F8B03B"/><path d="M48.54 52.73c.11-.22.08-.3-.18-.3h-5.04c-.01-.03-.03-.05-.05-.07 3.33-3.25 6.46-6.7 9.8-9.97-.18.54-.37 1.09-.57 1.63-.62 1.72-1.25 3.46-1.88 5.18-.09.24.04.22.2.22h4.16l.58.01c.02.03.04.05.07.08-3.74 4.34-7.38 8.76-11.15 13.09.2-.49.39-.97.59-1.45 1.05-2.55 2.09-5.1 3.14-7.65.11-.26.2-.51.33-.74z" fill="white"/><path d="M45.07 27.67c.01 1.14-.36 2.22-1.14 3.18-1.28 1.57-3.7 1.3-4.82-.07-1.27-1.53-1.64-4.55-.1-6.56 1.27-1.67 3.74-1.62 5.03.1.67.88 1.04 2.07 1.03 3.35z" fill="#F8B03B"/><path d="M51.67 27.5c.01.88-.17 1.7-.67 2.42-.71 1.03-1.97 1.32-2.97.67-.61-.39-.89-1-.07-1.67-.31-1.12-.2-2.19.37-3.2.76-1.35 2.33-1.67 3.38-.72.47.43.71.99.88 1.59.08.29.08.6.08.91z" fill="#F8B03B"/><path d="M57.59 28.8c-.09.93-.32 1.83-.91 2.59-.48.61-1.11.98-1.92.8-.88-.2-1.39-.82-1.57-1.67-.3-1.38.1-2.59 1.1-3.56.95-.92 2.49-.56 3 .65.17.38.33.76.3 1.19z" fill="#F8B03B"/><path d="M60.69 34.55c-1.02.42-2.02-.28-2.25-1.23-.04-.2-.09-.41-.07-.56.01-1.34.64-2.28 1.69-2.92 1.09-.67 2.39-.01 2.56 1.29.18 1.35-.67 2.91-1.93 3.42z" fill="#F8B03B"/><path d="M65.94 35.75c-.13.59-.39 1.11-.78 1.57-.38.44-.85.63-1.25.64-1.19 0-1.82-.76-1.6-1.76.24-1.06.9-1.78 1.93-2.07 1.02-.3 1.91.57 1.7 1.62z" fill="#F8B03B"/></svg><span class="ancestro-fab-text">' + BTN_TEXT + '</span>';
    if (BTN_TEXT) fab.title = BTN_TEXT;
    fab.onclick = function () { toggleWidget(true); };
    document.body.appendChild(fab);

    // Panel
    var panel = document.createElement("div");
    panel.id = "ancestro-widget-panel";
    document.body.appendChild(panel);

    renderPanel();
  }

  function renderPanel() {
    var panel = document.getElementById("ancestro-widget-panel");
    if (!panel) return;

    // Preserve form values before re-render
    var savedName = "", savedEmail = "", savedPhone = "";
    var fnameEl = document.getElementById("ancestro-fname");
    var femailEl = document.getElementById("ancestro-femail");
    var fphoneEl = document.getElementById("ancestro-fphone");
    if (fnameEl) savedName = fnameEl.value;
    if (femailEl) savedEmail = femailEl.value;
    if (fphoneEl) savedPhone = fphoneEl.value;

    if (!userInfo) {
      // Show form
      panel.innerHTML = '\
        <div class="ancestro-header">\
          <svg class="ancestro-header-logo" viewBox="0 0 103 97" fill="none"><path d="M48.54 52.73c.11-.22.08-.3-.18-.3h-5.04c-.01-.03-.03-.05-.05-.07 3.33-3.25 6.46-6.7 9.8-9.97-.18.54-.37 1.09-.57 1.63-.62 1.72-1.25 3.46-1.88 5.18-.09.24.04.22.2.22h4.16l.58.01c.02.03.04.05.07.08-3.74 4.34-7.38 8.76-11.15 13.09.2-.49.39-.97.59-1.45 1.05-2.55 2.09-5.1 3.14-7.65.11-.26.2-.51.33-.74z" fill="#F8B03B"/><path d="M12.73 87.33l14.94-4.99 2.7 1.31a44 44 0 0021.13 4.63C77.22 88.28 95.64 69.9 95.64 47.82c0-22.16-18.29-40.46-44.14-40.46S7.36 25.66 7.36 47.82c.04 8.48 2.83 16.72 7.95 23.48l2.51 3.3-5.09 12.73z" fill="none" stroke="#F8B03B" stroke-width="2"/></svg>\
          <div class="ancestro-header-info"><span class="ancestro-header-title">' + HEADER_TEXT + '</span><span class="ancestro-header-status">Online</span></div>\
          <button class="ancestro-header-close" id="ancestro-close">\
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>\
          </button>\
        </div>\
        <form class="ancestro-form" id="ancestro-form">\
          <div><h3>' + t.formTitle + '</h3><p>' + t.formDesc + '</p></div>\
          <div class="ancestro-field">\
            <label>' + t.name + '</label>\
            <input type="text" id="ancestro-fname" placeholder="' + t.namePh + '" />\
            <span class="ancestro-field-error" id="ancestro-err-name"></span>\
          </div>\
          <div class="ancestro-field">\
            <label>' + t.email + '</label>\
            <input type="email" id="ancestro-femail" placeholder="' + t.emailPh + '" />\
            <span class="ancestro-field-error" id="ancestro-err-email"></span>\
          </div>\
          <div class="ancestro-field">\
            <label>' + t.phone + '</label>\
            <input type="tel" id="ancestro-fphone" placeholder="' + t.phonePh + '" />\
            <span class="ancestro-field-error" id="ancestro-err-phone"></span>\
          </div>\
          <button type="submit" class="ancestro-form-btn">' + t.start + '</button>\
        </form>\
      ';
      // Restore saved form values
      if (savedName) document.getElementById("ancestro-fname").value = savedName;
      if (savedEmail) document.getElementById("ancestro-femail").value = savedEmail;
      if (savedPhone) document.getElementById("ancestro-fphone").value = savedPhone;

      document.getElementById("ancestro-close").onclick = function () { toggleWidget(false); };
      document.getElementById("ancestro-form").onsubmit = function (e) {
        e.preventDefault();
        var name = document.getElementById("ancestro-fname").value.trim();
        var email = document.getElementById("ancestro-femail").value.trim();
        var phone = document.getElementById("ancestro-fphone").value.trim();
        var errors = {};
        if (!name) errors.name = t.nameReq;
        if (!email) errors.email = t.emailReq;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = t.emailInv;
        if (!phone) errors.phone = t.phoneReq;
        else if (!/^\+?\d{7,15}$/.test(phone.replace(/[\s\-().]/g, ""))) errors.phone = t.phoneInv;
        document.getElementById("ancestro-err-name").textContent = errors.name || "";
        document.getElementById("ancestro-err-email").textContent = errors.email || "";
        document.getElementById("ancestro-err-phone").textContent = errors.phone || "";
        if (Object.keys(errors).length > 0) return;
        userInfo = { name: name, email: email.toLowerCase(), phone: phone.replace(/[\s\-().]/g, "") };
        document.dispatchEvent(new CustomEvent("ancestro:user", { detail: userInfo }));
        renderPanel();
      };
    } else {
      // Show chat
      panel.innerHTML = '\
        <div class="ancestro-header">\
          <svg class="ancestro-header-logo" viewBox="0 0 103 97" fill="none"><path d="M48.54 52.73c.11-.22.08-.3-.18-.3h-5.04c-.01-.03-.03-.05-.05-.07 3.33-3.25 6.46-6.7 9.8-9.97-.18.54-.37 1.09-.57 1.63-.62 1.72-1.25 3.46-1.88 5.18-.09.24.04.22.2.22h4.16l.58.01c.02.03.04.05.07.08-3.74 4.34-7.38 8.76-11.15 13.09.2-.49.39-.97.59-1.45 1.05-2.55 2.09-5.1 3.14-7.65.11-.26.2-.51.33-.74z" fill="#F8B03B"/><path d="M12.73 87.33l14.94-4.99 2.7 1.31a44 44 0 0021.13 4.63C77.22 88.28 95.64 69.9 95.64 47.82c0-22.16-18.29-40.46-44.14-40.46S7.36 25.66 7.36 47.82c.04 8.48 2.83 16.72 7.95 23.48l2.51 3.3-5.09 12.73z" fill="none" stroke="#F8B03B" stroke-width="2"/></svg>\
          <div class="ancestro-header-info"><span class="ancestro-header-title">' + HEADER_TEXT + '</span><span class="ancestro-header-status">Online</span></div>\
          <button class="ancestro-header-close" id="ancestro-close">\
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>\
          </button>\
        </div>\
        <div class="ancestro-messages" id="ancestro-messages"></div>\
        <div class="ancestro-input-area">\
          <input type="file" id="ancestro-file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.webp" style="display:none" />\
          <button class="ancestro-attach" id="ancestro-attach-btn" title="' + t.upload + '">\
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\
          </button>\
          <textarea class="ancestro-textarea" id="ancestro-input" placeholder="' + PLACEHOLDER + '" rows="1"></textarea>\
          <button class="ancestro-send" id="ancestro-send" disabled>\
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>\
          </button>\
        </div>\
      ';
      document.getElementById("ancestro-close").onclick = function () { toggleWidget(false); };
      var input = document.getElementById("ancestro-input");
      var sendBtn = document.getElementById("ancestro-send");
      input.addEventListener("input", function () {
        sendBtn.disabled = !input.value.trim() || isLoading;
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
      });
      sendBtn.onclick = handleSend;

      // File upload
      var attachBtn = document.getElementById("ancestro-attach-btn");
      var fileInput = document.getElementById("ancestro-file");
      attachBtn.onclick = function () { fileInput.click(); };
      fileInput.onchange = function () {
        var file = fileInput.files[0];
        if (!file || isLoading) return;
        handleFileUpload(file);
        fileInput.value = "";
      };

      renderMessages();
      input.focus();
    }
  }

  function toggleWidget(open) {
    isOpen = open;
    var fab = document.getElementById("ancestro-widget-fab");
    var panel = document.getElementById("ancestro-widget-panel");
    if (open) {
      fab.style.display = "none";
      panel.classList.add("ancestro-open");
      renderPanel();
    } else {
      panel.classList.remove("ancestro-open");
      fab.style.display = "flex";
    }
    // Dispatch CustomEvent
    document.dispatchEvent(new CustomEvent("ancestro:widget", {
      detail: { action: open ? "open" : "close" },
    }));
  }

  function renderMessages() {
    var container = document.getElementById("ancestro-messages");
    var html = "";
    if (messages.length === 0) {
      html = '<div class="ancestro-empty">' + t.empty + '</div>';
    } else {
      for (var i = 0; i < messages.length; i++) {
        var m = messages[i];
        var cls = m.role === "user" ? "ancestro-msg ancestro-msg-user" : "ancestro-msg ancestro-msg-bot";
        html += '<div class="' + cls + '">' + escapeHtml(m.content) + '</div>';
        if (m.showProposal && !m.proposalSent) {
          html += '<button class="ancestro-action-btn" data-proposal-idx="' + i + '">' + escapeHtml(t.sendProposal) + '</button>';
        }
        if (m.toast) {
          var toastCls = m.toastErr ? "ancestro-toast ancestro-toast-err" : "ancestro-toast";
          html += '<div class="' + toastCls + '">' + escapeHtml(m.toast) + '</div>';
        }
      }
    }
    if (isLoading) {
      html += '<div class="ancestro-typing"><div class="ancestro-dot"></div><div class="ancestro-dot"></div><div class="ancestro-dot"></div></div>';
    }
    container.innerHTML = html;
    container.scrollTop = container.scrollHeight;

    // Wire proposal buttons
    var btns = container.querySelectorAll("[data-proposal-idx]");
    for (var j = 0; j < btns.length; j++) {
      btns[j].onclick = (function (btn) {
        return function () { handleSendProposal(parseInt(btn.getAttribute("data-proposal-idx"), 10), btn); };
      })(btns[j]);
    }
  }

  function handleSendProposal(idx, btn) {
    if (!sessionId || idx < 0 || idx >= messages.length) return;
    var msg = messages[idx];
    if (msg.proposalSending || msg.proposalSent) return;
    msg.proposalSending = true;
    if (btn) { btn.disabled = true; btn.textContent = t.proposalSending; }

    fetch(SERVER + "/api/widget/proposal/send/" + AGENT_ID, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionId,
        email: userInfo && userInfo.email,
        lang: LANG,
      }),
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, body: j }; }); })
      .then(function (res) {
        msg.proposalSending = false;
        if (res.ok && res.body && res.body.success) {
          msg.proposalSent = true;
          msg.toast = t.proposalSent + " " + res.body.email;
          msg.toastErr = false;
        } else {
          msg.toast = (res.body && res.body.error) || t.proposalFailed;
          msg.toastErr = true;
        }
        renderMessages();
      })
      .catch(function () {
        msg.proposalSending = false;
        msg.toast = t.proposalFailed;
        msg.toastErr = true;
        renderMessages();
      });
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function handleFileUpload(file) {
    if (!file || isLoading || !userInfo) return;
    messages.push({ role: "user", content: "\ud83d\udcce " + file.name });
    isLoading = true;
    renderMessages();

    var formData = new FormData();
    formData.append("file", file);
    formData.append("lang", LANG);
    if (sessionId) formData.append("sessionId", sessionId);
    if (userInfo.name) formData.append("userName", userInfo.name);
    if (userInfo.email) formData.append("userEmail", userInfo.email);

    fetch(SERVER + "/api/widget/upload/" + AGENT_ID, {
      method: "POST",
      body: formData,
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        isLoading = false;
        if (data.sessionId) sessionId = data.sessionId;
        var reply;
        var isBill = data.success && data.billData && (data.billData.kwh_consumption || data.billData.total_amount);
        if (data.success) {
          reply = isBill
            ? t.billAnalyzed + "\n" + data.summary + "\n\n" + t.billAskSavings
            : t.docReceived + " (" + data.fileName + "). " + data.summary + ". " + t.docHelp;
        } else {
          reply = data.error || t.docFailed;
        }
        messages.push({ role: "assistant", content: reply, showProposal: !!isBill });
        renderMessages();
        document.dispatchEvent(new CustomEvent("ancestro:upload", { detail: data }));
      })
      .catch(function () {
        isLoading = false;
        messages.push({ role: "assistant", content: t.uploadFailed });
        renderMessages();
      });
  }

  function handleSend() {
    var input = document.getElementById("ancestro-input");
    var text = input.value.trim();
    if (!text || isLoading) return;

    input.value = "";
    document.getElementById("ancestro-send").disabled = true;

    messages.push({ role: "user", content: text });
    isLoading = true;
    renderMessages();

    // Dispatch CustomEvent
    document.dispatchEvent(new CustomEvent("ancestro:message", {
      detail: { role: "user", content: text },
    }));

    var history = messages.slice(0, -1).map(function (m) {
      return { role: m.role, content: m.content };
    });

    sendMessage(text, history, function (err, response) {
      isLoading = false;
      var reply = err ? "I'm sorry, I'm having trouble responding right now." : response;
      messages.push({ role: "assistant", content: reply });
      renderMessages();
      input.focus();

      // Dispatch CustomEvent
      document.dispatchEvent(new CustomEvent("ancestro:message", {
        detail: { role: "assistant", content: reply },
      }));
    });
  }

  // -- Expose global API --
  window.AncestroWidget = {
    open: function () { toggleWidget(true); },
    close: function () { toggleWidget(false); },
    toggle: function () { toggleWidget(!isOpen); },
    sendMessage: function (text) {
      if (!isOpen) toggleWidget(true);
      var input = document.getElementById("ancestro-input");
      if (input) { input.value = text; handleSend(); }
    },
    setLang: function (lang) {
      if (i18n[lang]) { fixedLang = lang; updateLang(); }
    },
  };

  // -- Init --
  function init() {
    loadConfig(function () {
      injectStyles();
      buildWidget();
      configLoaded = true;
      // Watch for language changes on <html lang="...">
      if (!fixedLang) {
        var langObserver = new MutationObserver(function () { updateLang(); });
        langObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
      }

      document.dispatchEvent(new CustomEvent("ancestro:ready"));
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
