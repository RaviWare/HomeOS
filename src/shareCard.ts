 // Branded HomeOS share-card generator (Canvas -> PNG Blob). No dependencies.
 export interface CardData { title: string; lines: string[]; }
 function rr(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
 }
 function wrap(ctx: any, text: string, x: number, y: number, maxW: number, lh: number): number {
  const words = String(text).split("₹").join("Rs ").split(" ");
  let line = ""; let yy = y;
  for (const w of words) {
  const test = line ? line + " " + w : w;
  if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, yy); line = w; yy += lh; }
  else { line = test; }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy + lh;
 }
 export async function renderShareCard(data: CardData): Promise<Blob | null> {
  const W = 1080, H = 1080;
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const ctx: any = c.getContext("2d"); if (!ctx) return null;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0A0E1A"); g.addColorStop(1, "#141B2E");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.82, 150, 20, W * 0.82, 150, 460);
  glow.addColorStop(0, "rgba(37,99,235,0.38)"); glow.addColorStop(1, "rgba(37,99,235,0)");
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#2563EB"; rr(ctx, 80, 84, 96, 96, 26); ctx.fill();
  ctx.fillStyle = "#FFFFFF"; ctx.textAlign = "center"; ctx.font = "800 60px Arial, sans-serif"; ctx.fillText("H", 128, 154);
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF"; ctx.font = "800 66px Arial, sans-serif"; ctx.fillText("HomeOS", 200, 148);
  ctx.fillStyle = "#8B93A7"; ctx.font = "700 22px Arial, sans-serif"; ctx.fillText("YOUR PRIVATE HOME OPERATING SYSTEM", 202, 182);
  ctx.strokeStyle = "rgba(255,255,255,0.10)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(80, 232); ctx.lineTo(W - 80, 232); ctx.stroke();
  ctx.fillStyle = "#60A5FA"; ctx.font = "800 42px Arial, sans-serif"; let y = wrap(ctx, data.title, 80, 330, W - 160, 54);
  const lines = (data.lines || []).slice(0, 7);
  lines.forEach((ln, i) => {
  if (i === 0) { ctx.fillStyle = "#FFFFFF"; ctx.font = "800 56px Arial, sans-serif"; y = wrap(ctx, ln, 80, y + 44, W - 160, 70); }
  else { ctx.fillStyle = "#C7CDD9"; ctx.font = "600 34px Arial, sans-serif"; y = wrap(ctx, ln, 80, y + 26, W - 160, 48); }
  });
  ctx.fillStyle = "#5B6478"; ctx.font = "700 24px Arial, sans-serif"; ctx.fillText("Generated with HomeOS - homeos.app", 80, H - 72);
  ctx.fillStyle = "#3B4252"; ctx.font = "600 22px Arial, sans-serif"; ctx.textAlign = "right"; ctx.fillText(new Date().toLocaleDateString("en-IN"), W - 80, H - 72); ctx.textAlign = "left";
  return new Promise((res) => c.toBlob((b) => res(b), "image/png"));
 }
 
