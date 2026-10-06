import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { readStore, updateStore } from "./data/store.js";

const app = express();
const port = process.env.PORT || 5000;
const jwtSecret = process.env.JWT_SECRET || "development-only-change-this-secret";
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)) });

app.use(cors());
app.use(express.json());

function createToken(user) { return jwt.sign({ id: user.id, name: user.name, role: user.role }, jwtSecret, { expiresIn: "7d" }); }
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try { req.user = jwt.verify(token, jwtSecret); next(); }
  catch { res.status(401).json({ error: "Invalid or expired session" }); }
}

const crops = [
  { name: "Rice", icon: "🌾", minRain: 120, maxPh: 7.2, note: "Keep the soil consistently moist during early growth." },
  { name: "Maize", icon: "🌽", minRain: 50, maxPh: 7.5, note: "Add organic matter before sowing for stronger roots." },
  { name: "Cotton", icon: "☁️", minRain: 35, maxPh: 8.0, note: "Avoid over-irrigation once flowering begins." },
  { name: "Millet", icon: "🌿", minRain: 20, maxPh: 8.4, note: "A drought-tolerant option for lower-rainfall conditions." }
];

const farmSnapshot = {
  farm: { name: "Green Valley Farm", location: "Lucknow, Uttar Pradesh", totalArea: 12.5, fields: 3 },
  fields: [
    { id: "north-01", name: "North Field", area: 5.2, crop: "Maize", stage: "Vegetative", health: 82, moisture: 42 },
    { id: "east-02", name: "East Field", area: 4.1, crop: "Rice", stage: "Tillering", health: 76, moisture: 51 },
    { id: "orchard-03", name: "Orchard Block", area: 3.2, crop: "Mango", stage: "Fruit set", health: 88, moisture: 47 }
  ],
  alerts: [
    { id: "soil-moisture", level: "Warning", title: "North Field moisture is falling", detail: "Check irrigation within the next 12 hours." },
    { id: "weather", level: "Normal", title: "Light rainfall expected", detail: "Forecast rainfall may reduce tomorrow's irrigation need." }
  ],
  tasks: [
    { id: "task-1", title: "Inspect maize leaves for pest damage", field: "North Field", due: "Today", done: false },
    { id: "task-2", title: "Record soil-moisture reading", field: "East Field", due: "Tomorrow", done: false },
    { id: "task-3", title: "Apply planned compost", field: "Orchard Block", due: "24 Sep", done: true }
  ]
};

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function recommendCrop(input) {
  const rainfall = number(input.rainfall, 60);
  const ph = number(input.ph, 6.5);
  const temperature = number(input.temperature, 27);
  const nitrogen = number(input.nitrogen, 45);
  const phosphorus = number(input.phosphorus, 35);
  const potassium = number(input.potassium, 35);

  let crop = crops.find((item) => rainfall >= item.minRain && ph <= item.maxPh) || crops[3];
  if (rainfall >= 110 && ph >= 5.2 && ph <= 7.2) crop = crops[0];
  else if (rainfall < 45 && temperature > 25) crop = crops[2];
  else if (rainfall >= 45 && nitrogen >= 35) crop = crops[1];

  const nutrientAverage = (nitrogen + phosphorus + potassium) / 3;
  const confidence = Math.max(72, Math.min(96, Math.round(78 + nutrientAverage / 8 - Math.abs(ph - 6.5) * 3)));
  const soilStatus = nutrientAverage >= 45 ? "Balanced" : nutrientAverage >= 30 ? "Needs nutrition" : "Low nutrients";

  return { crop, confidence, soilStatus };
}

function fieldIntelligence(input) {
  const nitrogen = number(input.nitrogen, 45);
  const phosphorus = number(input.phosphorus, 35);
  const potassium = number(input.potassium, 35);
  const ph = number(input.ph, 6.5);
  const rainfall = number(input.rainfall, 60);
  const moisture = number(input.moisture, 45);
  const { crop, confidence } = recommendCrop(input);
  const soilScore = Math.max(35, Math.min(96, Math.round(70 + (nitrogen + phosphorus + potassium) / 10 - Math.abs(ph - 6.6) * 7)));
  const deficiencies = [nitrogen < 40 && "Nitrogen", phosphorus < 30 && "Phosphorus", potassium < 30 && "Potassium"].filter(Boolean);
  const fertilizer = deficiencies.length
    ? `Apply a balanced NPK blend, prioritising ${deficiencies.join(" and ")}.`
    : "Nutrient levels are broadly balanced; use compost or organic manure for maintenance.";
  const yieldTons = Math.max(1.5, Number((2.1 + confidence / 32 + moisture / 100 + rainfall / 220).toFixed(1)));
  const revenue = Math.round(yieldTons * 1000 * (crop.name === "Cotton" ? 69 : crop.name === "Rice" ? 23.5 : 21.8));
  const cost = Math.round(revenue * 0.56);
  return {
    soilHealth: { score: soilScore, label: soilScore >= 75 ? "Healthy" : soilScore >= 55 ? "Needs attention" : "At risk", deficiencies, recommendation: fertilizer },
    fertilizerPlan: { product: deficiencies.length ? "Balanced NPK + micronutrient mix" : "Organic compost + maintenance NPK", quantity: `${Math.max(35, 80 - Math.round((nitrogen + phosphorus + potassium) / 4))} kg / acre`, schedule: "Split into two applications, 14 days apart", estimatedCost: Math.max(950, deficiencies.length * 620 + 980) },
    yieldForecast: { crop: crop.name, tonsPerAcre: yieldTons, confidence, harvestWindow: crop.name === "Rice" ? "105-120 days" : crop.name === "Maize" ? "90-110 days" : "100-130 days" },
    economics: { estimatedRevenue: revenue, estimatedCost: cost, estimatedProfit: revenue - cost, roi: Math.round(((revenue - cost) / cost) * 100) }
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "AI Smart Farming API" });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, language = "en", location = "Lucknow, Uttar Pradesh" } = req.body || {};
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ error: "Name, email, and an 8-character password are required" });
  const store = await readStore();
  if (store.users.some((user) => user.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: "An account already exists for this email" });
  const user = { id: crypto.randomUUID(), name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12), language, location, role: "farmer", createdAt: new Date().toISOString() };
  await updateStore((data) => ({ ...data, users: [...data.users, user] }));
  res.status(201).json({ token: createToken(user), user: { id: user.id, name, email: user.email, language, location, role: user.role } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const store = await readStore();
  const user = store.users.find((item) => item.email === String(email).toLowerCase());
  if (!user || !await bcrypt.compare(password || "", user.passwordHash)) return res.status(401).json({ error: "Incorrect email or password" });
  res.json({ token: createToken(user), user: { id: user.id, name: user.name, email: user.email, language: user.language, location: user.location, role: user.role } });
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  const store = await readStore();
  const user = store.users.find((item) => item.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user.id, name: user.name, email: user.email, language: user.language, location: user.location, role: user.role });
});

app.get("/api/weather", async (req, res) => {
  const latitude = Number(req.query.latitude || 26.8467);
  const longitude = Number(req.query.longitude || 80.9462);
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.search = new URLSearchParams({ latitude, longitude, current: "temperature_2m,relative_humidity_2m,precipitation,weather_code", daily: "temperature_2m_max,temperature_2m_min,precipitation_sum", timezone: "auto", forecast_days: "7" });
    const response = await fetch(url);
    if (!response.ok) throw new Error("Weather provider unavailable");
    const data = await response.json();
    res.json({ source: "Open-Meteo", live: true, current: data.current, daily: data.daily });
  } catch {
    res.json({ source: "Cached demo", live: false, current: { temperature_2m: 29, relative_humidity_2m: 61, precipitation: 0 }, daily: { time: [], temperature_2m_max: [], temperature_2m_min: [], precipitation_sum: [] } });
  }
});

app.post("/api/disease-screening", requireAuth, upload.single("leafImage"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Upload a JPG, PNG, or WEBP leaf image (max 5 MB)" });
  const item = { id: crypto.randomUUID(), userId: req.user.id, fileName: req.file.originalname, mimeType: req.file.mimetype, bytes: req.file.size, crop: req.body.crop || "Unknown crop", status: "pending-model-analysis", createdAt: new Date().toISOString() };
  await updateStore((data) => ({ ...data, uploads: [item, ...data.uploads].slice(0, 50) }));
  res.status(202).json({ upload: item, message: "Image received. This prototype stores the screening request; attach a trained disease-vision model before using it for diagnosis or treatment decisions." });
});

app.get("/api/disease-screening", requireAuth, async (req, res) => {
  const store = await readStore();
  res.json(store.uploads.filter((item) => item.userId === req.user.id));
});

app.get("/api/inventory", requireAuth, async (req, res) => {
  const store = await readStore();
  const items = store.inventory.filter((item) => item.userId === req.user.id);
  res.json(items);
});

app.post("/api/inventory", requireAuth, async (req, res) => {
  const { name, category = "Farm input", quantity, unit = "kg", reorderAt = 0, cost = 0 } = req.body || {};
  if (!name || !Number.isFinite(Number(quantity))) return res.status(400).json({ error: "Item name and quantity are required" });
  const item = { id: crypto.randomUUID(), userId: req.user.id, name, category, quantity: Number(quantity), unit, reorderAt: Number(reorderAt), cost: Number(cost), createdAt: new Date().toISOString() };
  await updateStore((data) => ({ ...data, inventory: [item, ...(data.inventory || [])] }));
  res.status(201).json(item);
});

app.patch("/api/inventory/:itemId", requireAuth, async (req, res) => {
  let changed;
  await updateStore((data) => ({ ...data, inventory: (data.inventory || []).map((item) => {
    if (item.id !== req.params.itemId || item.userId !== req.user.id) return item;
    changed = { ...item, quantity: Number(req.body?.quantity ?? item.quantity), updatedAt: new Date().toISOString() };
    return changed;
  }) }));
  if (!changed) return res.status(404).json({ error: "Inventory item not found" });
  res.json(changed);
});

app.get("/api/economics", requireAuth, async (req, res) => {
  const store = await readStore();
  const expenses = (store.expenses || []).filter((item) => item.userId === req.user.id);
  const spent = expenses.reduce((sum, item) => sum + item.amount, 0);
  res.json({ expenses, spent, categories: { seed: expenses.filter((item) => item.category === "Seed").reduce((sum, item) => sum + item.amount, 0), fertilizer: expenses.filter((item) => item.category === "Fertilizer").reduce((sum, item) => sum + item.amount, 0), labour: expenses.filter((item) => item.category === "Labour").reduce((sum, item) => sum + item.amount, 0) } });
});

app.post("/api/economics/expenses", requireAuth, async (req, res) => {
  const { title, category = "Other", amount } = req.body || {};
  if (!title || !Number.isFinite(Number(amount)) || Number(amount) <= 0) return res.status(400).json({ error: "Expense title and a positive amount are required" });
  const expense = { id: crypto.randomUUID(), userId: req.user.id, title, category, amount: Number(amount), date: new Date().toISOString() };
  await updateStore((data) => ({ ...data, expenses: [expense, ...(data.expenses || [])] }));
  res.status(201).json(expense);
});

app.get("/api/notifications", requireAuth, async (req, res) => {
  const store = await readStore();
  const saved = (store.notifications || []).filter((item) => item.userId === req.user.id);
  const system = saved.length ? [] : [
    { id: "welcome-alert", userId: req.user.id, level: "Normal", title: "Farm alert center is active", detail: "You will see field, inventory, and weather warnings here.", read: false, createdAt: new Date().toISOString() },
    { id: "water-alert", userId: req.user.id, level: "Warning", title: "Review North Field soil moisture", detail: "A current moisture reading of 42% may require irrigation planning.", read: false, createdAt: new Date().toISOString() }
  ];
  if (system.length) await updateStore((data) => ({ ...data, notifications: [...system, ...(data.notifications || [])] }));
  res.json(system.length ? system : saved);
});

app.patch("/api/notifications/:notificationId", requireAuth, async (req, res) => {
  let changed;
  await updateStore((data) => ({ ...data, notifications: (data.notifications || []).map((item) => {
    if (item.id !== req.params.notificationId || item.userId !== req.user.id) return item;
    changed = { ...item, read: Boolean(req.body?.read) };
    return changed;
  }) }));
  if (!changed) return res.status(404).json({ error: "Notification not found" });
  res.json(changed);
});

app.post("/api/farm-performance", requireAuth, (req, res) => {
  const soil = number(req.body?.soilScore, 78);
  const moisture = number(req.body?.moisture, 45);
  const rainfall = number(req.body?.rainfall, 55);
  const nutrientScore = number(req.body?.nutrientScore, 75);
  const waterScore = Math.max(45, Math.min(96, Math.round(78 + moisture / 4 - Math.abs(rainfall - 60) / 8)));
  const sustainability = Math.max(40, Math.min(96, Math.round((soil + nutrientScore + waterScore) / 3)));
  const performance = Math.round((soil * 0.4) + (nutrientScore * 0.35) + (waterScore * 0.25));
  res.json({ performance, sustainability, scores: { soil, nutrient: nutrientScore, water: waterScore }, tips: [waterScore < 70 ? "Schedule irrigation using soil moisture, not a fixed calendar." : "Water use is within a healthy range.", soil < 70 ? "Add compost to strengthen organic matter and soil resilience." : "Maintain soil health with seasonal testing.", "Record input use to keep the sustainability score accurate."] });
});

app.get("/api/dashboard", (_req, res) => res.json(farmSnapshot));

app.patch("/api/tasks/:taskId", (req, res) => {
  const task = farmSnapshot.tasks.find((item) => item.id === req.params.taskId);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.done = Boolean(req.body?.done);
  res.json(task);
});

app.post("/api/recommendation", (req, res) => {
  const { crop, confidence, soilStatus } = recommendCrop(req.body || {});
  res.json({
    recommendation: crop.name,
    icon: crop.icon,
    confidence,
    soilStatus,
    advice: crop.note,
    nextSteps: ["Check soil moisture before irrigation.", "Record this result with your field observations.", "Use local weather forecasts before sowing."]
  });
});

app.post("/api/field-intelligence", (req, res) => res.json(fieldIntelligence(req.body || {})));

app.post("/api/irrigation", (req, res) => {
  const temperature = number(req.body?.temperature, 28);
  const humidity = number(req.body?.humidity, 60);
  const rainfall = number(req.body?.rainfall, 20);
  const moisture = number(req.body?.moisture, 45);
  const demand = Math.max(0, Math.round(55 + (temperature - 25) * 2 - humidity / 5 - rainfall / 8 - moisture / 3));
  const urgency = demand > 35 ? "High" : demand > 18 ? "Medium" : "Low";
  res.json({ litersPerAcre: demand * 100, urgency, message: demand > 18 ? "Irrigate early morning or after sunset to reduce evaporation." : "Soil moisture is adequate; monitor again tomorrow." });
});

app.post("/api/disease-risk", (req, res) => {
  const temperature = number(req.body?.temperature, 28);
  const humidity = number(req.body?.humidity, 60);
  const moisture = number(req.body?.moisture, 45);
  const riskScore = Math.max(8, Math.min(92, Math.round((humidity - 42) * 1.2 + (moisture - 25) * 0.55 + (temperature > 31 ? 9 : 0))));
  const level = riskScore >= 65 ? "High" : riskScore >= 35 ? "Medium" : "Low";
  const disease = humidity > 75 ? "Fungal leaf spot" : temperature > 33 ? "Heat stress" : "No dominant risk";
  const action = level === "High"
    ? "Inspect lower leaves today, improve airflow, and consult a local agronomist before treatment."
    : level === "Medium"
      ? "Check leaves every two days and avoid wetting foliage during irrigation."
      : "Current conditions are stable. Continue weekly crop scouting.";
  res.json({ level, score: riskScore, disease, action, scannedAt: new Date().toISOString() });
});

app.get("/api/market-prices", (_req, res) => {
  res.json({
    market: "Indicative local market rates",
    updated: new Date().toISOString(),
    prices: [
      { crop: "Rice", price: 2350, unit: "₹ / quintal", trend: "+2.4%", direction: "up" },
      { crop: "Maize", price: 2180, unit: "₹ / quintal", trend: "+0.8%", direction: "up" },
      { crop: "Cotton", price: 6900, unit: "₹ / quintal", trend: "-1.1%", direction: "down" }
    ]
  });
});

app.post("/api/crop-plan", (req, res) => {
  const { crop } = recommendCrop(req.body || {});
  const plans = {
    Rice: ["Prepare seedbed and test water source", "Transplant seedlings; keep shallow water", "Scout for pests and record tillering"],
    Maize: ["Prepare rows and apply compost", "Sow seeds and check emergence", "Monitor moisture at root zone"],
    Cotton: ["Prepare well-drained rows", "Sow after stable warm weather", "Monitor early pest pressure"],
    Millet: ["Prepare seedbed with minimal tillage", "Sow before expected rainfall", "Thin seedlings and monitor weeds"]
  };
  res.json({ crop: crop.name, weekPlan: plans[crop.name], seasonTip: crop.note });
});

app.listen(port, () => console.log(`AI Smart Farming API listening on ${port}`));
