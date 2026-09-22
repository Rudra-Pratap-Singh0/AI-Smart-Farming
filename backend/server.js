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

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "AI Smart Farming API" });
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

app.post("/api/irrigation", (req, res) => {
  const temperature = number(req.body?.temperature, 28);
  const humidity = number(req.body?.humidity, 60);
  const rainfall = number(req.body?.rainfall, 20);
  const moisture = number(req.body?.moisture, 45);
  const demand = Math.max(0, Math.round(55 + (temperature - 25) * 2 - humidity / 5 - rainfall / 8 - moisture / 3));
  const urgency = demand > 35 ? "High" : demand > 18 ? "Medium" : "Low";
  res.json({ litersPerAcre: demand * 100, urgency, message: demand > 18 ? "Irrigate early morning or after sunset to reduce evaporation." : "Soil moisture is adequate; monitor again tomorrow." });
});

app.listen(port, () => console.log(`AI Smart Farming API listening on ${port}`));
