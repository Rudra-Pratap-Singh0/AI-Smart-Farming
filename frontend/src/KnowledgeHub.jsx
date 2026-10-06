import { useEffect, useState } from "react";

export default function KnowledgeHub({ apiUrl }) {
  const [query, setQuery] = useState("");
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = setTimeout(async () => { setLoading(true); try { const response = await fetch(`${apiUrl}/api/knowledge?q=${encodeURIComponent(query)}`); setGuides(await response.json()); } finally { setLoading(false); } }, 180); return () => clearTimeout(timer); }, [query]);
  return <section className="knowledge" id="knowledge"><div className="phase-heading"><p className="eyebrow">FARMER KNOWLEDGE HUB</p><h2>Practical field guidance for each growing decision.</h2><p>Search crop, season, water, nutrient, soil, or pest-prevention topics.</p></div><div className="knowledge-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guides, crops, or topics" /></div><div className="guide-grid">{loading ? <div className="empty">Finding relevant guidance…</div> : guides.length ? guides.map((guide) => <article className="panel guide-card" key={guide.id}><span>{guide.category}</span><h3>{guide.title}</h3><p>{guide.summary}</p><footer>{guide.crop} · {guide.season}</footer></article>) : <div className="empty">No guide found. Try “water”, “soil”, “rice”, or “pest”.</div>}</div></section>;
}
