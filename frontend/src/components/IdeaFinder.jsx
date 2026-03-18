import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

async function callGemini(prompt) {
  try {
    console.log("🔄 Sending request to Gemini API...");
    
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { 
            temperature: 0.8, 
            maxOutputTokens: 65536 // Maximum allowed for complete responses
          },
        }),
      }
    );
    
    if (!res.ok) {
      const errorData = await res.json();
      console.error("❌ API Error:", errorData);
      throw new Error(errorData.error?.message || `API Error: ${res.status}`);
    }
    
    const data = await res.json();
    console.log("✅ API Response received successfully");
    
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (responseText) {
      return responseText;
    } else {
      console.error("⚠️ Unexpected response structure:", data);
      return "No response received. Please try again.";
    }
    
  } catch (error) {
    console.error("❌ Fetch error:", error);
    throw error;
  }
}

// ─── 3 lean pages ─────────────────────────────────────────────────────────────
const PAGES = [
  {
    id: "you",
    title: "About You",
    subtitle: "Quick personal & background snapshot",
    icon: "👤",
    fields: [
      { id: "age", label: "Age group", type: "select", options: ["Under 20", "20–25", "26–30", "31–40", "41+"] },
      { id: "location", label: "City & Country", type: "text", placeholder: "e.g. Mumbai, India" },
      { id: "education", label: "Highest education", type: "select", options: ["High School", "Diploma", "Bachelor's", "Master's / MBA", "PhD", "Self-taught"] },
      { id: "fieldOfStudy", label: "Field of study", type: "text", placeholder: "e.g. Computer Science, Commerce, Design" },
      { id: "keySkills", label: "Your top 3–5 skills", type: "text", placeholder: "e.g. Python, Sales, UI Design, Finance" },
      { id: "workExperience", label: "Work experience", type: "select", options: ["None (Student / Fresher)", "< 1 year", "1–3 years", "3–7 years", "7+ years"] },
    ],
  },
  {
    id: "resources",
    title: "Resources & Commitment",
    subtitle: "Money, time, and team",
    icon: "💰",
    fields: [
      { id: "capital", label: "Capital you can invest", type: "select", options: ["< ₹50K", "₹50K – ₹2L", "₹2L – ₹10L", "₹10L – ₹50L", "₹50L+"] },
      { id: "runway", label: "How long can you go without income?", type: "select", options: ["< 3 months", "3–6 months", "6–12 months", "1–2 years", "2+ years"] },
      { id: "hoursPerWeek", label: "Hours per week to dedicate", type: "select", options: ["< 10 hrs (side project)", "10–25 hrs (part-time)", "25–40 hrs", "40+ hrs (full-time)"] },
      { id: "team", label: "Do you have a co-founder or team?", type: "select", options: ["Solo, no team yet", "Have 1 co-founder", "Have a small team", "Looking for co-founders"] },
    ],
  },
  {
    id: "vision",
    title: "Your Vision & Interests",
    subtitle: "What you want to build and why",
    icon: "🚀",
    fields: [
      {
        id: "domains",
        label: "Domains that genuinely excite you (pick all that apply)",
        type: "multiselect",
        options: ["AI / Tech / Software", "EdTech", "FinTech", "HealthTech", "AgriTech / FoodTech", "CleanTech", "E-Commerce", "Logistics", "Media / Content", "Social Impact"],
      },
      { id: "targetMarket", label: "Who do you want to serve?", type: "select", options: ["Individual consumers (B2C)", "Businesses (B2B)", "Both B2B & B2C", "Government / Institutions"] },
      { id: "problemObserved", label: "A real problem you've personally seen (2–3 sentences)", type: "textarea", placeholder: "What problem frustrates you or the people around you? Who faces it? How often?" },
      { id: "unfairAdvantage", label: "Your unfair advantage", type: "textarea", placeholder: "e.g. 5 yrs in hospitals so I know the pain points; direct access to 200 college students" },
      { id: "successGoal", label: "Your definition of success", type: "select", options: ["Profitable lifestyle business", "Unicorn / large scale", "Social impact at scale", "Stable personal income", "Get acquired"] },
    ],
  },
];

function buildPrompt(f) {
  const domains = Array.isArray(f.domains) ? f.domains.join(", ") : f.domains || "Not specified";
  return `You are a senior startup advisor. Based on this founder profile, recommend the TOP 3 startup domains they should pursue.

PROFILE:
- Age: ${f.age || "?"} | Location: ${f.location || "?"} | Education: ${f.education || "?"} in ${f.fieldOfStudy || "?"}
- Skills: ${f.keySkills || "?"} | Experience: ${f.workExperience || "?"}
- Capital: ${f.capital || "?"} | Runway: ${f.runway || "?"} | Hours/week: ${f.hoursPerWeek || "?"} | Team: ${f.team || "?"}
- Excited by: ${domains} | Serves: ${f.targetMarket || "?"}
- Problem observed: ${f.problemObserved || "?"}
- Unfair advantage: ${f.unfairAdvantage || "?"}
- Success goal: ${f.successGoal || "?"}

For each of the 3 recommendations, give:
1. **Domain** – title
2. **Why it fits** – cite their specific skills/background/problem
3. **Concrete Idea** – one specific startup concept
4. **Market Size** – India/global opportunity
5. **First 3 Steps** – actionable, doable in 30 days
6. **Key Challenges** – 2 honest ones
7. **Time to first revenue** – realistic estimate

End with **Your Entrepreneurial DNA** – their founder archetype, top 2 strengths, and one sharp personalized insight.

Be concise, specific, and honest. No fluff.`;
}

function buildChatPrompt(recommendations, history, userMessage) {
  const historyText = history
    .slice(-6)
    .map(m => `${m.role === "user" ? "Founder" : "Advisor"}: ${m.text}`)
    .join("\n");
  return `You are a startup advisor. The founder received these recommendations:

${recommendations}

Recent chat:
${historyText}
Founder: ${userMessage}

Reply ONLY if this is a business/startup-related question about their recommendations, ideas, market, execution, funding, or entrepreneurship.
If off-topic (greetings, personal, unrelated), respond: "I'm here to help with your startup journey! Ask me anything about the recommendations, market strategy, execution steps, or funding."
Keep answers concise and practical. No fluff.
Advisor:`;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Instrument+Serif&family=DM+Sans:wght@300;400;500&display=swap');
  :root{--bg:#0a0a0f;--surf:#12121a;--surf2:#1a1a26;--bdr:rgba(255,255,255,0.08);--acc:#7c5cfc;--acc2:#e85d9b;--acc3:#00d4aa;--txt:#f0eeff;--muted:#777;--r:14px;}
  *{box-sizing:border-box;margin:0;padding:0;}
  .if-root{min-height:100vh;background:var(--bg);color:var(--txt);font-family:'DM Sans',sans-serif;font-size:15px;line-height:1.6;}

  .if-hdr{padding:40px 24px 0;text-align:center;position:relative;}
  .if-glow{position:absolute;top:-60px;left:50%;transform:translateX(-50%);width:500px;height:350px;background:radial-gradient(ellipse,rgba(124,92,252,0.15) 0%,transparent 70%);pointer-events:none;}
  .if-eye{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--acc);margin-bottom:12px;}
  .if-ttl{font-family:'Instrument Serif',serif;font-size:clamp(28px,5vw,50px);background:linear-gradient(135deg,#f0eeff 0%,#c4b5fd 50%,#e85d9b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:10px;}
  .if-sub{color:var(--muted);font-size:15px;max-width:480px;margin:0 auto 36px;}

  .if-prog{max-width:680px;margin:0 auto 32px;padding:0 24px;}
  .if-prog-meta{display:flex;justify-content:space-between;font-size:12px;color:var(--muted);margin-bottom:8px;}
  .if-prog-bg{height:3px;background:var(--surf2);border-radius:99px;overflow:hidden;}
  .if-prog-fill{height:100%;background:linear-gradient(90deg,var(--acc),var(--acc2));border-radius:99px;transition:width 0.4s ease;}
  .if-dots{display:flex;justify-content:center;gap:8px;margin-top:14px;}
  .if-dot{width:8px;height:8px;border-radius:99px;background:var(--surf2);transition:all 0.3s;}
  .if-dot.active{background:var(--acc);width:22px;}
  .if-dot.done{background:var(--acc3);}

  .if-card{max-width:680px;margin:0 auto;padding:0 20px 60px;}
  .if-sec-hdr{display:flex;align-items:center;gap:14px;margin-bottom:28px;padding:22px 24px;background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);position:relative;overflow:hidden;}
  .if-sec-hdr::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(124,92,252,0.05),transparent);pointer-events:none;}
  .if-sec-icon{font-size:32px;flex-shrink:0;}
  .if-sec-ttl{font-family:'Syne',sans-serif;font-size:19px;font-weight:700;}
  .if-sec-sub{font-size:13px;color:var(--muted);margin-top:2px;}

  .if-fields{display:flex;flex-direction:column;gap:20px;}
  .if-field{display:flex;flex-direction:column;gap:7px;}
  .if-lbl{font-size:13px;font-weight:500;color:#bbb;}
  .if-inp,.if-sel,.if-ta{background:var(--surf);border:1px solid var(--bdr);border-radius:10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;padding:12px 14px;transition:border-color 0.2s,box-shadow 0.2s;outline:none;width:100%;-webkit-appearance:none;}
  .if-inp::placeholder,.if-ta::placeholder{color:#3a3a4a;}
  .if-inp:focus,.if-sel:focus,.if-ta:focus{border-color:var(--acc);box-shadow:0 0 0 3px rgba(124,92,252,0.12);}
  .if-sel{cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23555' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}
  .if-sel option{background:#1a1a26;}
  .if-ta{resize:vertical;min-height:88px;}

  .if-chips{display:flex;flex-wrap:wrap;gap:8px;}
  .if-chip{padding:7px 14px;border-radius:99px;border:1px solid var(--bdr);background:var(--surf);color:#999;font-size:13px;cursor:pointer;transition:all 0.2s;user-select:none;}
  .if-chip:hover{border-color:var(--acc);color:var(--txt);}
  .if-chip.sel{background:rgba(124,92,252,0.18);border-color:var(--acc);color:var(--txt);}

  .if-nav{display:flex;justify-content:space-between;align-items:center;margin-top:32px;gap:12px;}
  .if-btn{padding:13px 28px;border-radius:10px;border:none;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;letter-spacing:0.4px;cursor:pointer;transition:all 0.2s;}
  .btn-ghost{background:transparent;border:1px solid var(--bdr);color:var(--muted);}
  .btn-ghost:hover{border-color:#555;color:var(--txt);}
  .btn-primary{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;box-shadow:0 4px 18px rgba(124,92,252,0.3);}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(124,92,252,0.45);}
  .btn-primary:active{transform:none;}
  .btn-submit{background:linear-gradient(135deg,#00d4aa,#00b8d4);color:#000;padding:14px 36px;font-size:14px;box-shadow:0 4px 20px rgba(0,212,170,0.25);}
  .btn-submit:hover{box-shadow:0 6px 28px rgba(0,212,170,0.4);transform:translateY(-1px);}

  .if-load{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;text-align:center;padding:40px;}
  .if-spin{width:56px;height:56px;border-radius:50%;border:3px solid var(--surf2);border-top-color:var(--acc);border-right-color:var(--acc2);animation:spin 0.9s linear infinite;}
  @keyframes spin{to{transform:rotate(360deg);}}
  .load-ttl{font-family:'Instrument Serif',serif;font-size:24px;background:linear-gradient(135deg,#c4b5fd,#e85d9b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
  .load-step{font-size:13px;color:var(--muted);animation:fadeUp 0.5s ease forwards;opacity:0;}
  .load-step:nth-child(1){animation-delay:0.5s;}
  .load-step:nth-child(2){animation-delay:1.5s;}
  .load-step:nth-child(3){animation-delay:2.5s;}
  @keyframes fadeUp{to{opacity:1;}}

  .if-res{max-width:760px;margin:0 auto;padding:40px 20px 80px;}
  .res-hdr{text-align:center;margin-bottom:36px;}
  .res-badge{display:inline-flex;align-items:center;gap:6px;padding:6px 16px;border-radius:99px;background:rgba(0,212,170,0.1);border:1px solid rgba(0,212,170,0.3);color:var(--acc3);font-size:12px;font-weight:500;margin-bottom:16px;}
  .res-ttl{font-family:'Instrument Serif',serif;font-size:38px;background:linear-gradient(135deg,#f0eeff,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px;}
  .res-body{background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);padding:36px;line-height:1.85;font-size:15px;white-space:pre-wrap;position:relative;overflow:hidden;}
  .res-body::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,var(--acc),var(--acc2),var(--acc3));}
  .res-body strong{color:var(--acc);font-weight:600;}
  .res-actions{display:flex;gap:10px;justify-content:center;margin-top:24px;flex-wrap:wrap;}
  .btn-outline{background:transparent;border:1px solid var(--acc);color:var(--acc);padding:11px 24px;border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;transition:all 0.2s;}
  .btn-outline:hover{background:rgba(124,92,252,0.1);}
  .btn-chat{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;padding:11px 24px;border-radius:10px;font-family:'Syne',sans-serif;font-weight:700;font-size:13px;cursor:pointer;border:none;box-shadow:0 4px 18px rgba(124,92,252,0.3);transition:all 0.2s;}
  .btn-chat:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(124,92,252,0.45);}

  .if-chat{max-width:760px;margin:0 auto;padding:0 20px 80px;}
  .chat-hdr{display:flex;align-items:center;gap:12px;margin-bottom:24px;padding:18px 22px;background:var(--surf);border:1px solid var(--bdr);border-radius:var(--r);}
  .chat-hdr-icon{font-size:28px;}
  .chat-hdr-ttl{font-family:'Syne',sans-serif;font-size:17px;font-weight:700;}
  .chat-hdr-sub{font-size:12px;color:var(--muted);}
  .chat-back{margin-left:auto;background:transparent;border:1px solid var(--bdr);color:var(--muted);padding:8px 16px;border-radius:8px;font-family:'Syne',sans-serif;font-size:12px;font-weight:700;cursor:pointer;transition:all 0.2s;white-space:nowrap;}
  .chat-back:hover{border-color:#555;color:var(--txt);}
  .chat-msgs{display:flex;flex-direction:column;gap:14px;margin-bottom:20px;max-height:460px;overflow-y:auto;padding:4px 2px;}
  .chat-msgs::-webkit-scrollbar{width:4px;}
  .chat-msgs::-webkit-scrollbar-thumb{background:var(--surf2);border-radius:99px;}
  .msg{display:flex;gap:10px;}
  .msg.user{align-self:flex-end;flex-direction:row-reverse;align-items:flex-start;}
  .msg.ai{align-items:flex-start;}
  .msg-bubble{padding:12px 16px;border-radius:12px;font-size:14px;line-height:1.65;max-width:82%;}
  .msg.user .msg-bubble{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border-bottom-right-radius:4px;}
  .msg.ai .msg-bubble{background:var(--surf2);color:var(--txt);border-bottom-left-radius:4px;white-space:pre-wrap;}
  .msg.ai .msg-bubble strong{color:var(--acc3);}
  .msg-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-top:2px;}
  .msg.user .msg-avatar{background:rgba(124,92,252,0.2);}
  .msg.ai .msg-avatar{background:rgba(0,212,170,0.15);}
  .chat-typing{display:flex;gap:5px;align-items:center;padding:12px 16px;background:var(--surf2);border-radius:12px;width:fit-content;}
  .typing-dot{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:bounce 1.2s infinite;}
  .typing-dot:nth-child(2){animation-delay:0.2s;}
  .typing-dot:nth-child(3){animation-delay:0.4s;}
  @keyframes bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}
  .chat-input-wrap{display:flex;gap:10px;align-items:flex-end;}
  .chat-input{flex:1;background:var(--surf);border:1px solid var(--bdr);border-radius:10px;color:var(--txt);font-family:'DM Sans',sans-serif;font-size:14px;padding:12px 14px;outline:none;resize:none;min-height:48px;max-height:120px;transition:border-color 0.2s;}
  .chat-input:focus{border-color:var(--acc);}
  .chat-input::placeholder{color:#3a3a4a;}
  .chat-send{background:linear-gradient(135deg,var(--acc),var(--acc2));color:#fff;border:none;border-radius:10px;padding:13px 16px;cursor:pointer;font-size:17px;transition:all 0.2s;flex-shrink:0;height:48px;display:flex;align-items:center;justify-content:center;}
  .chat-send:hover{transform:translateY(-1px);}
  .chat-send:disabled{opacity:0.4;cursor:not-allowed;transform:none;}

  .if-err{background:rgba(232,93,155,0.08);border:1px solid rgba(232,93,155,0.3);border-radius:10px;padding:18px;color:#e85d9b;text-align:center;margin-bottom:20px;}

  .back-bar{max-width:680px;margin:0 auto;padding:20px 20px 0;}

  @media(max-width:600px){
    .if-hdr{padding:28px 16px 0;}
    .if-prog,.if-card,.if-res,.if-chat{padding-left:14px;padding-right:14px;}
    .back-bar{padding-left:14px;padding-right:14px;}
    .if-nav{flex-direction:column-reverse;}
    .if-btn{width:100%;text-align:center;}
    .res-body{padding:22px;}
    .msg-bubble{max-width:92%;}
  }
`;

export default function IdeaFinder() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [form, setForm] = useState({});
  const [status, setStatus] = useState("form");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const currentPage = PAGES[page];
  const progress = (page / PAGES.length) * 100;
  const isLast = page === PAGES.length - 1;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, chatLoading]);

  function set(id, val) { setForm(p => ({ ...p, [id]: val })); }

  function toggleChip(id, opt) {
    setForm(p => {
      const cur = Array.isArray(p[id]) ? p[id] : [];
      return { ...p, [id]: cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt] };
    });
  }

  async function handleSubmit() {
    setStatus("loading");
    setError("");
    try {
      const text = await callGemini(buildPrompt(form), 4096);
      setResult(text);
      setStatus("result");
    } catch (e) {
      setError(e.message || "Something went wrong. Please try again.");
      setStatus("form");
    }
  }

  async function handleChat() {
    const msg = chatInput.trim();
    if (!msg || chatLoading) return;
    const newHistory = [...chatMsgs, { role: "user", text: msg }];
    setChatMsgs(newHistory);
    setChatInput("");
    setChatLoading(true);
    try {
      const reply = await callGemini(buildChatPrompt(result, chatMsgs, msg), 1024);
      setChatMsgs([...newHistory, { role: "ai", text: reply }]);
    } catch {
      setChatMsgs([...newHistory, { role: "ai", text: "Sorry, something went wrong. Please try again." }]);
    }
    setChatLoading(false);
  }

  function renderField(f) {
    const val = form[f.id] || "";
    if (f.type === "text") return <input className="if-inp" placeholder={f.placeholder} value={val} onChange={e => set(f.id, e.target.value)} />;
    if (f.type === "textarea") return <textarea className="if-ta" placeholder={f.placeholder} value={val} onChange={e => set(f.id, e.target.value)} rows={3} />;
    if (f.type === "select") return (
      <select className="if-sel" value={val} onChange={e => set(f.id, e.target.value)}>
        <option value="">— Select —</option>
        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
    if (f.type === "multiselect") {
      const sel = Array.isArray(form[f.id]) ? form[f.id] : [];
      return (
        <div className="if-chips">
          {f.options.map(o => (
            <div key={o} className={`if-chip${sel.includes(o) ? " sel" : ""}`} onClick={() => toggleChip(f.id, o)}>{o}</div>
          ))}
        </div>
      );
    }
  }

  function renderText(text) {
    return text.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i}>{p.slice(2, -2)}</strong>
        : <span key={i}>{p}</span>
    );
  }

  return (
    <>
      <style>{S}</style>
      <div className="if-root">

        {/* ── LOADING ── */}
        {status === "loading" && (
          <div className="if-load">
            <div className="if-spin" />
            <div className="load-ttl">Analyzing your profile…</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="load-step">🔍 Processing your background & skills</div>
              <div className="load-step">📊 Matching with market opportunities</div>
              <div className="load-step">✨ Crafting your personalized roadmap</div>
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {status === "result" && (
          <div className="if-res">
            <div className="res-hdr">
              <div className="res-badge">✅ Analysis Complete</div>
              <div className="res-ttl">Your Startup Roadmap</div>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>
                Based on your profile, here are the best-fit startup domains for you.
              </p>
            </div>
            <div className="res-body">{renderText(result)}</div>
            <div className="res-actions">
              <button className="btn-outline" onClick={() => { setStatus("form"); setPage(0); setForm({}); setResult(""); }}>
                Start Over
              </button>
              <button className="btn-outline" onClick={() => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([result], { type: "text/plain" }));
                a.download = "startup-recommendations.txt";
                a.click();
              }}>
                Download
              </button>
              <button className="btn-chat" onClick={() => {
                setChatMsgs([{
                  role: "ai",
                  text: "Hey! I've analyzed your profile and generated your recommendations. Ask me anything about them — market strategy, how to get started, funding, competitors, or any doubts you have. 🚀"
                }]);
                setStatus("chat");
              }}>
                💬 Chat with AI Advisor
              </button>
            </div>
          </div>
        )}

        {/* ── CHAT ── */}
        {status === "chat" && (
          <div className="if-chat">
            <div style={{ padding: "32px 0 20px", textAlign: "center" }}>
              <div className="if-eye">StartHub · AI Advisor</div>
            </div>
            <div className="chat-hdr">
              <div className="chat-hdr-icon">🤖</div>
              <div>
                <div className="chat-hdr-ttl">Your AI Startup Advisor</div>
                <div className="chat-hdr-sub">Ask anything about your recommendations</div>
              </div>
              <button className="chat-back" onClick={() => setStatus("result")}>← Back to Results</button>
            </div>

            <div className="chat-msgs">
              {chatMsgs.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  <div className="msg-avatar">{m.role === "user" ? "👤" : "🤖"}</div>
                  <div className="msg-bubble">
                    {m.role === "ai" ? renderText(m.text) : m.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="msg ai">
                  <div className="msg-avatar">🤖</div>
                  <div className="chat-typing">
                    <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="chat-input-wrap">
              <textarea
                className="chat-input"
                placeholder="Ask about your startup recommendations…"
                value={chatInput}
                rows={1}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); }
                }}
              />
              <button className="chat-send" onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
                ➤
              </button>
            </div>
          </div>
        )}

        {/* ── FORM ── */}
        {status === "form" && (
          <>
            <div className="back-bar">
              <button
                className="if-btn btn-ghost"
                onClick={() => navigate("/")}
                style={{ display: "flex", alignItems: "center", gap: 6 }}
              >
                ← Back to Home
              </button>
            </div>
            <div className="if-hdr">
              <div className="if-glow" />
              <div className="if-eye">StartHub · AI Idea Finder</div>
              <h1 className="if-ttl">Find Your Perfect Startup</h1>
              <p className="if-sub">3 quick steps. Our AI matches you with the best startup domains for your profile.</p>
            </div>

            <div className="if-prog">
              <div className="if-prog-meta">
                <span>Step {page + 1} of {PAGES.length} · {currentPage.title}</span>
                <span>{Math.round(progress)}% done</span>
              </div>
              <div className="if-prog-bg">
                <div className="if-prog-fill" style={{ width: `${progress}%` }} />
              </div>
              <div className="if-dots">
                {PAGES.map((_, i) => (
                  <div key={i} className={`if-dot${i === page ? " active" : i < page ? " done" : ""}`} />
                ))}
              </div>
            </div>

            <div className="if-card">
              <div className="if-sec-hdr">
                <div className="if-sec-icon">{currentPage.icon}</div>
                <div>
                  <div className="if-sec-ttl">{currentPage.title}</div>
                  <div className="if-sec-sub">{currentPage.subtitle}</div>
                </div>
              </div>

              {error && <div className="if-err">{error}</div>}

              <div className="if-fields">
                {currentPage.fields.map(f => (
                  <div key={f.id} className="if-field">
                    <label className="if-lbl">{f.label}</label>
                    {renderField(f)}
                  </div>
                ))}
              </div>

              <div className="if-nav">
                <button
                  className="if-btn btn-ghost"
                  onClick={() => setPage(p => p - 1)}
                  style={page === 0 ? { visibility: "hidden" } : {}}
                >
                  ← Back
                </button>
                {!isLast
                  ? <button className="if-btn btn-primary" onClick={() => setPage(p => p + 1)}>Next →</button>
                  : <button className="if-btn btn-primary btn-submit" onClick={handleSubmit}>✨ Generate My Startup Ideas</button>
                }
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}