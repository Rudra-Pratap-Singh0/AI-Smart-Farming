import cors from "cors";
import express from "express";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
