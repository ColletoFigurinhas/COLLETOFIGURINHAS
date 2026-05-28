"use client";

// Generates Panini-style World Cup album pages as data URLs using Canvas

const TEAMS = [
  { name: "Brasil", color: "#009c3b", accent: "#ffdf00", flag: "🇧🇷" },
  { name: "Argentina", color: "#74acdf", accent: "#ffffff", flag: "🇦🇷" },
  { name: "França", color: "#002395", accent: "#ED2939", flag: "🇫🇷" },
  { name: "Alemanha", color: "#000000", accent: "#DD0000", flag: "🇩🇪" },
  { name: "Espanha", color: "#c60b1e", accent: "#ffc400", flag: "🇪🇸" },
  { name: "Portugal", color: "#006600", accent: "#ff0000", flag: "🇵🇹" },
  { name: "Itália", color: "#009246", accent: "#003087", flag: "🇮🇹" },
  { name: "Inglaterra", color: "#CF081F", accent: "#ffffff", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
];

const PLAYERS = [
  ["Vini Jr.", "Neymar", "Rodrygo", "Alisson", "Marquinhos", "Casemiro"],
  ["Messi", "Di María", "Álvarez", "Martínez", "De Paul", "Fernández"],
  ["Mbappé", "Griezmann", "Giroud", "Lloris", "Varane", "Kanté"],
  ["Müller", "Gnabry", "Havertz", "Neuer", "Rüdiger", "Kimmich"],
  ["Pedri", "Busquets", "Torres", "Unai Simón", "Alba", "Gavi"],
  ["Ronaldo", "Félix", "Leão", "Diogo Costa", "Pepe", "Carvalho"],
  ["Barella", "Jorginho", "Insigne", "Donnarumma", "Chiellini", "Verratti"],
  ["Saka", "Bellingham", "Kane", "Pickford", "Maguire", "Rice"],
];

function drawCover(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Background gradient — FIFA gold
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#1a0a00");
  grad.addColorStop(0.5, "#3d1f00");
  grad.addColorStop(1, "#1a0a00");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Gold border
  ctx.strokeStyle = "#c8a84b";
  ctx.lineWidth = 12;
  ctx.strokeRect(16, 16, w - 32, h - 32);
  ctx.strokeStyle = "#e8c87a";
  ctx.lineWidth = 2;
  ctx.strokeRect(28, 28, w - 56, h - 56);

  // Trophy icon area
  ctx.fillStyle = "#c8a84b";
  ctx.font = `bold ${w * 0.28}px serif`;
  ctx.textAlign = "center";
  ctx.fillText("🏆", w / 2, h * 0.38);

  // Title
  ctx.fillStyle = "#e8c87a";
  ctx.font = `bold ${w * 0.1}px 'Arial Black', sans-serif`;
  ctx.letterSpacing = "4px";
  ctx.fillText("COPA DO", w / 2, h * 0.58);

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${w * 0.18}px 'Arial Black', sans-serif`;
  ctx.fillText("MUNDO", w / 2, h * 0.72);

  ctx.fillStyle = "#c8a84b";
  ctx.font = `bold ${w * 0.1}px 'Arial Black', sans-serif`;
  ctx.fillText("2026", w / 2, h * 0.84);

  // Bottom label
  ctx.fillStyle = "#888";
  ctx.font = `${w * 0.045}px Arial`;
  ctx.fillText("ÁLBUM OFICIAL PANINI", w / 2, h * 0.94);
}

function drawTeamPage(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  teamIdx: number
) {
  const team = TEAMS[teamIdx % TEAMS.length];
  const players = PLAYERS[teamIdx % PLAYERS.length];

  // Background
  ctx.fillStyle = "#f5f0e8";
  ctx.fillRect(0, 0, w, h);

  // Top header bar
  const hGrad = ctx.createLinearGradient(0, 0, w, 0);
  hGrad.addColorStop(0, team.color);
  hGrad.addColorStop(1, team.accent === "#ffffff" ? "#cccccc" : team.accent);
  ctx.fillStyle = hGrad;
  ctx.fillRect(0, 0, w, h * 0.15);

  // Team name
  ctx.fillStyle = team.accent === "#ffffff" || team.accent === "#ffdf00" ? "#000" : "#fff";
  ctx.font = `bold ${w * 0.1}px 'Arial Black', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`${team.flag} ${team.name.toUpperCase()}`, w / 2, h * 0.105);

  // Section label
  ctx.fillStyle = team.color;
  ctx.font = `bold ${w * 0.055}px Arial`;
  ctx.fillText("GRUPO A • SELEÇÃO PRINCIPAL", w / 2, h * 0.21);

  // Divider
  ctx.fillStyle = team.color;
  ctx.fillRect(w * 0.1, h * 0.225, w * 0.8, 3);

  // Player cards grid — 2 columns x 3 rows
  const cardW = w * 0.42;
  const cardH = h * 0.2;
  const marginX = (w - cardW * 2) / 3;
  const marginY = h * 0.25;
  const gapY = h * 0.215;

  for (let i = 0; i < Math.min(6, players.length); i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = marginX + col * (cardW + marginX);
    const cy = marginY + row * gapY;

    // Card background
    const cardGrad = ctx.createLinearGradient(cx, cy, cx + cardW, cy + cardH);
    cardGrad.addColorStop(0, team.color + "22");
    cardGrad.addColorStop(1, team.color + "55");
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(cx, cy, cardW, cardH, 6);
    ctx.fill();

    // Card border
    ctx.strokeStyle = team.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sticker slot (empty silhouette)
    ctx.fillStyle = team.color + "33";
    ctx.beginPath();
    ctx.roundRect(cx + 4, cy + 4, cardW * 0.42, cardH - 8, 4);
    ctx.fill();
    ctx.strokeStyle = team.color + "66";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player silhouette
    ctx.fillStyle = team.color + "55";
    ctx.font = `${cardH * 0.6}px serif`;
    ctx.textAlign = "center";
    ctx.fillText("👤", cx + cardW * 0.21, cy + cardH * 0.78);

    // Player info
    ctx.fillStyle = "#1a1a1a";
    ctx.font = `bold ${w * 0.045}px Arial`;
    ctx.textAlign = "left";

    const playerName = players[i];
    ctx.fillText(
      playerName.length > 10 ? playerName.slice(0, 10) + "." : playerName,
      cx + cardW * 0.48,
      cy + cardH * 0.42
    );

    // Number badge
    ctx.fillStyle = team.color;
    ctx.beginPath();
    ctx.roundRect(cx + cardW * 0.48, cy + cardH * 0.55, cardW * 0.44, cardH * 0.32, 4);
    ctx.fill();
    ctx.fillStyle = team.accent === "#ffffff" || team.accent === "#ffdf00" ? "#000" : "#fff";
    ctx.font = `bold ${w * 0.038}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(`#${(i + 1 + teamIdx * 11) % 23 || 1}`, cx + cardW * 0.7, cy + cardH * 0.78);

    // Sticker number
    ctx.fillStyle = "#999";
    ctx.font = `${w * 0.03}px Arial`;
    ctx.textAlign = "right";
    ctx.fillText(`${teamIdx * 6 + i + 1}`, cx + cardW - 6, cy + cardH - 5);
  }

  // Page footer
  ctx.fillStyle = team.color;
  ctx.fillRect(0, h - h * 0.07, w, h * 0.07);
  ctx.fillStyle = "#fff";
  ctx.font = `${w * 0.04}px Arial`;
  ctx.textAlign = "center";
  ctx.fillText("PANINI © 2026 FIFA WORLD CUP", w / 2, h - h * 0.025);
}

function drawIndexPage(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = "#1a0a00";
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = "#c8a84b";
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  ctx.fillStyle = "#c8a84b";
  ctx.font = `bold ${w * 0.09}px 'Arial Black', sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("ÍNDICE", w / 2, h * 0.12);

  ctx.fillStyle = "#888";
  ctx.fillRect(w * 0.1, h * 0.15, w * 0.8, 2);

  const items = [
    "Capa & Apresentação . . . . . 1",
    "Brasil 🇧🇷 . . . . . . . . . . . . 3",
    "Argentina 🇦🇷 . . . . . . . . . 9",
    "França 🇫🇷 . . . . . . . . . . 15",
    "Alemanha 🇩🇪 . . . . . . . . 21",
    "Espanha 🇪🇸 . . . . . . . . . 27",
    "Portugal 🇵🇹 . . . . . . . . . 33",
    "Itália 🇮🇹 . . . . . . . . . . . 39",
    "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿 . . . . . . . 45",
  ];

  items.forEach((item, i) => {
    ctx.fillStyle = i % 2 === 0 ? "#e8c87a" : "#c8a84b";
    ctx.font = `${w * 0.055}px Arial`;
    ctx.textAlign = "left";
    ctx.fillText(item, w * 0.12, h * 0.22 + i * h * 0.082);
  });
}

export function generateSamplePages(): string[] {
  if (typeof window === "undefined") return [];

  const W = 600;
  const H = 800;
  const pages: string[] = [];

  function makeCanvas() {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    return canvas;
  }

  // Page 0: Cover
  {
    const canvas = makeCanvas();
    drawCover(canvas.getContext("2d")!, W, H);
    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  // Page 1: Index
  {
    const canvas = makeCanvas();
    drawIndexPage(canvas.getContext("2d")!, W, H);
    pages.push(canvas.toDataURL("image/jpeg", 0.92));
  }

  // Pages 2-17: 8 teams × 2 pages each (mirror pair)
  for (let t = 0; t < TEAMS.length; t++) {
    // Left page — same team, slight variation
    {
      const canvas = makeCanvas();
      const ctx = canvas.getContext("2d")!;
      drawTeamPage(ctx, W, H, t);
      pages.push(canvas.toDataURL("image/jpeg", 0.92));
    }
    // Right page — next 6 players (offset)
    {
      const canvas = makeCanvas();
      const ctx = canvas.getContext("2d")!;
      // Slight variant: shift players
      const shifted = [
        ...PLAYERS[t % PLAYERS.length].slice(3),
        ...PLAYERS[t % PLAYERS.length].slice(0, 3),
      ];
      const origPlayers = PLAYERS[t % PLAYERS.length];
      PLAYERS[t % PLAYERS.length] = shifted;
      drawTeamPage(ctx, W, H, t);
      PLAYERS[t % PLAYERS.length] = origPlayers;
      pages.push(canvas.toDataURL("image/jpeg", 0.92));
    }
  }

  return pages;
}
