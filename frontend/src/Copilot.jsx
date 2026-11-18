import { useState } from "react";

const suggestions = [
  "When should I irrigate?",
  "How do I protect crop leaves?",
  "What fertilizer should I use?",
  "What should I check before rain?"
];

export default function Copilot({ apiUrl }) {
  const [question, setQuestion] = useState("");
  const [reply, setReply] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async (event) => {
    event.preventDefault();
    const prompt = question.trim();
    if (!prompt || loading) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/api/copilot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: prompt })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not get farm guidance.");
      setReply(data);
    } catch (requestError) {
      setError(requestError.message || "Could not reach the farming service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return <section className="copilot" id="copilot" aria-labelledby="copilot-title">
    <div className="phase-heading">
      <p className="eyebrow">AI FARMING ASSISTANT</p>
      <h2 id="copilot-title">Ask your farm copilot.</h2>
      <p>Get concise Hindi/English-friendly guidance for day-to-day decisions. The current version uses transparent rule-based recommendations.</p>
    </div>
    <div className="panel copilot-box">
      <div className="chat-intro"><span aria-hidden="true">✦</span><div><b>Farm Copilot</b><small>Ready to help with soil, water, weather, crop health, and costs.</small></div></div>
      {reply && <div className="copilot-reply" aria-live="polite"><span>{reply.topic}</span><p>{reply.answer}</p><small>{reply.disclaimer}</small></div>}
      {error && <p className="copilot-error" role="alert">{error}</p>}
      <form onSubmit={ask}>
        <label className="sr-only" htmlFor="copilot-question">Your farming question</label>
        <input id="copilot-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask: When should I irrigate my field?" disabled={loading} />
        <button type="submit" disabled={loading || !question.trim()}>{loading ? "Thinking…" : "Ask"}</button>
      </form>
      <div className="suggestions" aria-label="Suggested questions">{suggestions.map((item) => <button type="button" key={item} onClick={() => setQuestion(item)} disabled={loading}>{item}</button>)}</div>
    </div>
  </section>;
}
