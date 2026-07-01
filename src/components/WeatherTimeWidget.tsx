 import React, { useEffect, useState } from "react";
 import { MapPin, Clock, Sun, Cloud, CloudSun, CloudFog, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
 
 // Free, no-key, CORS-enabled weather from Open-Meteo (https://open-meteo.com).
 const COORDS: Record<string, [number, number]> = {
  Bengaluru: [12.97, 77.59], Mumbai: [19.08, 72.88], Pune: [18.52, 73.86],
  Hyderabad: [17.39, 78.49], Delhi: [28.61, 77.21], Chennai: [13.08, 80.27], Gurugram: [28.46, 77.03]
 };
 function wx(code: number): { Icon: any; label: string } {
  if (code === 0) return { Icon: Sun, label: "Clear" };
  if (code <= 3) return { Icon: CloudSun, label: "Partly cloudy" };
  if (code <= 48) return { Icon: CloudFog, label: "Fog" };
  if (code <= 67) return { Icon: CloudRain, label: "Rain" };
  if (code <= 77) return { Icon: CloudSnow, label: "Snow" };
  if (code <= 82) return { Icon: CloudRain, label: "Showers" };
  if (code <= 86) return { Icon: CloudSnow, label: "Snow" };
  return { Icon: CloudLightning, label: "Storm" };
 }
 const fmtTime = () => {
  try { return new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: true }); }
  catch (e) { return new Date().toLocaleTimeString(); }
 };
 
 export default function WeatherTimeWidget({ city }: { city: string }) {
  const [now, setNow] = useState(fmtTime());
  const [temp, setTemp] = useState<number | null>(null);
  const [code, setCode] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
  const id = setInterval(() => setNow(fmtTime()), 15000);
  return () => clearInterval(id);
  }, []);
  useEffect(() => {
  const c = COORDS[city] || COORDS.Bengaluru;
  const ctrl = new AbortController();
  setFailed(false); setTemp(null); setCode(null);
  fetch("https://api.open-meteo.com/v1/forecast?latitude=" + c[0] + "&longitude=" + c[1] + "&current_weather=true&timezone=Asia%2FKolkata", { signal: ctrl.signal })
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((d) => { if (d && d.current_weather) { setTemp(Math.round(d.current_weather.temperature)); setCode(d.current_weather.weathercode); } else { setFailed(true); } })
  .catch(() => setFailed(true));
  return () => ctrl.abort();
  }, [city]);
  const cond = code === null ? null : wx(code);
  const WxIcon = cond ? cond.Icon : Cloud;
  return (
  <div className="flex items-center gap-3 bg-[#111827]/65 border border-[#374151]/50 px-4 py-2.5 rounded-xl text-xs">
  <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-red-400" /><span className="font-bold text-white">{city}</span></div>
  <span className="text-[#374151]">|</span>
  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#9CA3AF]" /><span className="font-bold text-white tabular-nums">{now} IST</span></div>
  <span className="text-[#374151]">|</span>
  <div className="flex items-center gap-1.5"><WxIcon className="w-3.5 h-3.5 text-[#F59E0B]" /><span className="font-bold text-[#F59E0B]">{temp === null ? (failed ? "--" : "...") : temp + "°C"}</span>{cond ? <span className="text-[#9CA3AF] hidden md:inline">{cond.label}</span> : null}</div>
  </div>
  );
 }
 
