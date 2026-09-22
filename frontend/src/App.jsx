import { useEffect, useState } from "react";

const defaults = { nitrogen: 48, phosphorus: 38, potassium: 42, temperature: 29, humidity: 61, ph: 6.6, rainfall: 68, moisture: 42 };
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Field({ label, name, value, onChange, unit, min = 0, max = 200, step = 1 }) {
  return <label className="field"><span>{label}<small>{unit}</small></span><input type="range" name={name} min={min} max={max} step={step} value={value} onChange={onChange} /><b>{value} {unit}</b></label>;
}

export default function App() {
  const [values, setValues] = useState(defaults);
  const [result, setResult] = useState(null);
  const [irrigation, setIrrigation] = useState(null);
  const [disease, setDisease] = useState(null);
  const [plan, setPlan] = useState(null);
  const [marketPrices, setMarketPrices] = useState([]);
  const [activities, setActivities] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [fieldIntel, setFieldIntel] = useState(null);
  const [loading, setLoading] = useState(false);

  const change = (event) => setValues((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  const request = async (endpoint) => {
    const response = await fetch(`${apiUrl}${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
    if (!response.ok) throw new Error("Could not reach the farming service.");
    return response.json();
  };
  const getData = async (endpoint) => {
    const response = await fetch(`${apiUrl}${endpoint}`);
    if (!response.ok) throw new Error("Could not reach the farming service.");
    return response.json();
  };
  useEffect(() => { getData("/api/dashboard").then(setDashboard).catch(() => {}); }, []);
  const updateTask = async (task) => {
    const response = await fetch(`${apiUrl}/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !task.done }) });
    if (!response.ok) return;
    const updated = await response.json();
    setDashboard((previous) => ({ ...previous, tasks: previous.tasks.map((item) => item.id === updated.id ? updated : item) }));
  };
  const analyze = async () => {
    setLoading(true);
    try {
      const [recommendation, water, risk, cropPlan, market, intelligence] = await Promise.all([
        request("/api/recommendation"), request("/api/irrigation"), request("/api/disease-risk"), request("/api/crop-plan"), getData("/api/market-prices"), request("/api/field-intelligence")
      ]);
      setResult(recommendation); setIrrigation(water); setDisease(risk); setPlan(cropPlan); setMarketPrices(market.prices); setFieldIntel(intelligence);
      setActivities((previous) => [{ label: `Field analysis completed · ${recommendation.recommendation} recommended`, time: "Just now" }, ...previous].slice(0, 4));
    }
    catch (error) { setResult({ error: error.message }); }
    finally { setLoading(false); }
  };

  return <main>
    <nav><a className="brand" href="#top">🌱 <span>AI Smart Farming</span></a><div className="nav-links"><a href="#advisor">Advisor</a><a href="#intelligence">Intelligence</a></div><span className="status"><i />Field intelligence online</span></nav>
    <section className="hero" id="top"><div><p className="eyebrow">DECISION SUPPORT FOR EVERY SEASON</p><h1>Grow smarter with data from your soil.</h1><p>Turn simple field readings into crop and irrigation guidance in seconds.</p><button onClick={analyze} disabled={loading}>{loading ? "Analysing field…" : "Analyse my field"} <span>→</span></button></div><div className="hero-card"><p>Today’s field snapshot</p><strong>24°C <small>Partly cloudy</small></strong><div><span>💧 Soil moisture <b>{values.moisture}%</b></span><span>🌧 Rainfall <b>{values.rainfall} mm</b></span></div></div></section>
    <section className="command-center"><div className="section-title"><div><p className="eyebrow">FARM COMMAND CENTER</p><h2>{dashboard?.farm.name || "Your connected farm"}</h2><p className="section-copy">{dashboard?.farm.location || "Loading farm profile…"}</p></div><div className="farm-stat"><b>{dashboard?.farm.totalArea || "--"}</b><span>acres across {dashboard?.farm.fields || "--"} fields</span></div></div><div className="command-grid"><div className="panel field-list"><h3>Field health</h3>{dashboard?.fields.map((field) => <div className="field-row" key={field.id}><span className="field-icon">▦</span><div><b>{field.name}</b><small>{field.crop} · {field.area} acres · {field.stage}</small></div><div className="health"><b>{field.health}</b><span>health</span></div></div>) || <p>Connecting fields…</p>}</div><div className="panel alert-list"><h3>Early warnings</h3>{dashboard?.alerts.map((alert) => <div className={`alert ${alert.level.toLowerCase()}`} key={alert.id}><span>{alert.level === "Warning" ? "!" : "✓"}</span><div><b>{alert.title}</b><small>{alert.detail}</small></div></div>) || <p>Loading alerts…</p>}</div><div className="panel task-list"><h3>Crop calendar</h3>{dashboard?.tasks.map((task) => <label className={task.done ? "done" : ""} key={task.id}><input type="checkbox" checked={task.done} onChange={() => updateTask(task)} /><span><b>{task.title}</b><small>{task.field} · {task.due}</small></span></label>) || <p>Loading tasks…</p>}</div></div></section>
    <section className="workspace" id="advisor"><div className="panel form-panel"><div className="section-title"><div><p className="eyebrow">FIELD INPUTS</p><h2>Soil & weather data</h2></div><button className="text-button" onClick={() => setValues(defaults)}>Reset</button></div><div className="fields"><Field label="Nitrogen" name="nitrogen" value={values.nitrogen} onChange={change} unit="mg/kg" /><Field label="Phosphorus" name="phosphorus" value={values.phosphorus} onChange={change} unit="mg/kg" /><Field label="Potassium" name="potassium" value={values.potassium} onChange={change} unit="mg/kg" /><Field label="Temperature" name="temperature" value={values.temperature} onChange={change} unit="°C" max={55} /><Field label="Humidity" name="humidity" value={values.humidity} onChange={change} unit="%" max={100} /><Field label="Soil pH" name="ph" value={values.ph} onChange={change} unit="pH" min={3} max={10} step={0.1} /><Field label="Rainfall" name="rainfall" value={values.rainfall} onChange={change} unit="mm" /><Field label="Soil moisture" name="moisture" value={values.moisture} onChange={change} unit="%" max={100} /></div></div>
    <aside className="results"><div className="panel result-card"><p className="eyebrow">AI RECOMMENDATION</p>{result?.error ? <p className="error">{result.error}</p> : result ? <><div className="crop"><span>{result.icon}</span><div><h2>{result.recommendation}</h2><p>{result.confidence}% match for your conditions</p></div></div><div className="meter"><span style={{ width: `${result.confidence}%` }} /></div><p className="advice">{result.advice}</p><p className="tag">Soil status: {result.soilStatus}</p></> : <div className="empty">Enter field readings and run an analysis to see a recommended crop.</div>}</div><div className="panel water-card"><p className="eyebrow">IRRIGATION ADVISOR</p>{irrigation ? <><h3>{irrigation.urgency} water need</h3><strong>{irrigation.litersPerAcre.toLocaleString()} <small>L / acre</small></strong><p>{irrigation.message}</p></> : <p>Water guidance will appear after your field analysis.</p>}</div></aside></section>
    <section className="intelligence" id="intelligence"><div className="intelligence-heading"><p className="eyebrow">ADVANCED INTELLIGENCE</p><h2>See risks, plans, and market signals in one place.</h2><p>Each module uses the same field readings so you can make faster, connected decisions.</p></div><div className="intel-grid"><article className="panel disease-card"><p className="eyebrow">CROP HEALTH SCOUT</p>{disease ? <><div className={`risk risk-${disease.level.toLowerCase()}`}><span>{disease.level}</span><b>{disease.score}% risk</b></div><h3>{disease.disease}</h3><p>{disease.action}</p></> : <div className="empty">Run a field analysis to estimate weather-driven disease risk.</div>}</article><article className="panel plan-card"><p className="eyebrow">7-DAY CROP PLAN</p>{plan ? <><h3>{plan.crop} action plan</h3><ol>{plan.weekPlan.map((item) => <li key={item}>{item}</li>)}</ol><p>{plan.seasonTip}</p></> : <div className="empty">Your crop-specific weekly plan will appear here.</div>}</article><article className="panel activity-card"><p className="eyebrow">FARM ACTIVITY</p>{activities.length ? <ul>{activities.map((item, index) => <li key={`${item.label}-${index}`}><span>✓</span><div>{item.label}<small>{item.time}</small></div></li>)}</ul> : <div className="empty">Analyses and farm actions will be saved in this session.</div>}</article></div><div className="panel market-card"><div><p className="eyebrow">MARKET INTELLIGENCE</p><h3>Indicative crop prices</h3></div>{marketPrices.length ? <div className="price-list">{marketPrices.map((item) => <div key={item.crop}><span>{item.crop}</span><b>₹{item.price.toLocaleString()} <small>{item.unit}</small></b><em className={item.direction}>{item.direction === "up" ? "↗" : "↘"} {item.trend}</em></div>)}</div> : <p>Current indicative rates load after field analysis.</p>}</div></section>
    <section className="decision-grid"><div className="panel decision-card"><p className="eyebrow">SOIL HEALTH CARD</p>{fieldIntel ? <><div className="score-ring"><b>{fieldIntel.soilHealth.score}</b><span>{fieldIntel.soilHealth.label}</span></div><p>{fieldIntel.soilHealth.deficiencies.length ? `Watch: ${fieldIntel.soilHealth.deficiencies.join(", ")}` : "No major NPK deficiency detected"}</p><small>{fieldIntel.soilHealth.recommendation}</small></> : <div className="empty">Run analysis to generate a soil-health card.</div>}</div><div className="panel decision-card"><p className="eyebrow">FERTILIZER PLAN</p>{fieldIntel ? <><h3>{fieldIntel.fertilizerPlan.product}</h3><b className="metric">{fieldIntel.fertilizerPlan.quantity}</b><p>{fieldIntel.fertilizerPlan.schedule}</p><small>Estimated input cost: ₹{fieldIntel.fertilizerPlan.estimatedCost.toLocaleString()} / acre</small></> : <div className="empty">A field-specific fertilizer plan will appear here.</div>}</div><div className="panel decision-card"><p className="eyebrow">YIELD & PROFIT FORECAST</p>{fieldIntel ? <><h3>{fieldIntel.yieldForecast.crop}</h3><b className="metric">{fieldIntel.yieldForecast.tonsPerAcre} t / acre</b><p>Harvest window: {fieldIntel.yieldForecast.harvestWindow}</p><small>Est. profit: ₹{fieldIntel.economics.estimatedProfit.toLocaleString()} · ROI {fieldIntel.economics.roi}%</small></> : <div className="empty">Run analysis to estimate yield, revenue, and ROI.</div>}</div></section>
    <section className="tips"><p className="eyebrow">FARMING INSIGHTS</p><h2>Small actions, healthier harvests.</h2><div><article>🌦️<h3>Watch the forecast</h3><p>Delay irrigation if useful rainfall is expected in the next 24 hours.</p></article><article>🧪<h3>Test soil regularly</h3><p>Seasonal soil tests make nutrient recommendations more reliable.</p></article><article>📒<h3>Keep field records</h3><p>Compare advice with yield outcomes to improve your next season.</p></article></div></section>
    <footer>AI Smart Farming · Built for practical, data-informed agriculture</footer>
  </main>;
}
