import { useEffect, useState } from "react";

const emptyCredentials = { name: "", email: "", password: "", location: "Lucknow, Uttar Pradesh" };

export default function PhaseTwo({ apiUrl }) {
  const [mode, setMode] = useState("login");
  const [credentials, setCredentials] = useState(emptyCredentials);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("farmer-profile") || "null"));
  const [token, setToken] = useState(() => localStorage.getItem("farmer-token") || "");
  const [message, setMessage] = useState("");
  const [weather, setWeather] = useState(null);
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState("Maize");
  const [screening, setScreening] = useState(null);

  const loadWeather = async () => {
    try { const response = await fetch(`${apiUrl}/api/weather`); setWeather(await response.json()); }
    catch { setWeather({ live: false, current: { temperature_2m: "--", relative_humidity_2m: "--", precipitation: "--" } }); }
  };
  useEffect(() => { loadWeather(); }, []);

  const submitAuth = async (event) => {
    event.preventDefault(); setMessage("");
    try {
      const response = await fetch(`${apiUrl}/api/auth/${mode}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(credentials) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUser(data.user); setToken(data.token); localStorage.setItem("farmer-profile", JSON.stringify(data.user)); localStorage.setItem("farmer-token", data.token);
      setMessage(`Welcome, ${data.user.name}. Your farmer profile is active.`);
    } catch (error) { setMessage(error.message || "Could not complete authentication."); }
  };
  const logout = () => { setUser(null); setToken(""); localStorage.removeItem("farmer-profile"); localStorage.removeItem("farmer-token"); setMessage("Signed out from this device."); };
  const uploadLeaf = async (event) => {
    event.preventDefault();
    if (!image || !token) return setScreening({ error: "Sign in and choose a leaf image first." });
    const body = new FormData(); body.append("leafImage", image); body.append("crop", crop);
    const response = await fetch(`${apiUrl}/api/disease-screening`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
    const data = await response.json(); setScreening(response.ok ? data : { error: data.error });
  };

  return <section className="phase-two" id="phase-two">
    <div className="phase-heading"><p className="eyebrow">PHASE 2 · CONNECTED FARMER TOOLS</p><h2>Secure profile, live conditions, and crop-health intake.</h2><p>Live weather uses Open-Meteo. Leaf uploads are safely queued for a future trained vision model rather than presented as a medical-grade diagnosis.</p></div>
    <div className="phase-grid">
      <article className="panel auth-card"><p className="eyebrow">FARMER ACCOUNT</p>{user ? <><div className="profile-badge">{user.name.slice(0, 1).toUpperCase()}</div><h3>{user.name}</h3><p>{user.email}<br />{user.location}</p><button className="outline-button" onClick={logout}>Sign out</button></> : <><div className="auth-tabs"><button className={mode === "login" ? "selected" : ""} onClick={() => setMode("login")}>Sign in</button><button className={mode === "register" ? "selected" : ""} onClick={() => setMode("register")}>Create account</button></div><form onSubmit={submitAuth}>{mode === "register" && <input required placeholder="Full name" value={credentials.name} onChange={(event) => setCredentials({ ...credentials, name: event.target.value })} />}<input required type="email" placeholder="Email address" value={credentials.email} onChange={(event) => setCredentials({ ...credentials, email: event.target.value })} /><input required minLength="8" type="password" placeholder="Password (8+ characters)" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} />{mode === "register" && <input placeholder="Farm location" value={credentials.location} onChange={(event) => setCredentials({ ...credentials, location: event.target.value })} />}<button>{mode === "login" ? "Sign in" : "Create farmer account"}</button></form></>}{message && <small className="form-message">{message}</small>}</article>
      <article className="panel weather-card"><div className="card-title"><div><p className="eyebrow">LIVE WEATHER</p><h3>{weather?.live ? "Farm weather" : "Weather fallback"}</h3></div><button className="refresh" onClick={loadWeather}>↻</button></div>{weather ? <><div className="weather-reading"><b>{Math.round(weather.current.temperature_2m)}°C</b><span>Temperature</span></div><div className="weather-details"><span>Humidity <b>{weather.current.relative_humidity_2m}%</b></span><span>Rain now <b>{weather.current.precipitation} mm</b></span><span>{weather.live ? "Live from Open-Meteo" : "Provider unavailable"}</span></div></> : <div className="empty">Loading current conditions…</div>}</article>
      <article className="panel upload-card"><p className="eyebrow">LEAF IMAGE SCREENING</p><h3>Send a crop image for review</h3><form onSubmit={uploadLeaf}><select value={crop} onChange={(event) => setCrop(event.target.value)}><option>Maize</option><option>Rice</option><option>Cotton</option><option>Millet</option></select><label className="file-input"><input accept="image/png,image/jpeg,image/webp" type="file" onChange={(event) => setImage(event.target.files?.[0] || null)} /><span>{image ? image.name : "Choose JPG, PNG, or WEBP"}</span></label><button disabled={!user}>{user ? "Submit image" : "Sign in to upload"}</button></form>{screening && <small className={screening.error ? "form-message error" : "form-message"}>{screening.error || screening.message}</small>}</article>
    </div>
  </section>;
}
