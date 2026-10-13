# 🗺️ Haridwar Block Boundary Dashboard

An interactive, single-file **Web GIS dashboard** that visualizes the administrative block boundaries of **Haridwar district, Uttarakhand** 🏔️ — with a clickable map, area rankings, and a sortable attribute table.

🌐 **Live Demo:** [Haridwar-block-boundary.netlify.app](https://Haridwar-block-boundary.netlify.app/)

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [📊 Dataset at a Glance](#-dataset-at-a-glance)
- [🧱 Tech Stack](#-tech-stack)
- [📂 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [🖱️ How to Use](#️-how-to-use)
- [🧮 Attributes Explained](#-attributes-explained)
- [🎨 Theming & Responsiveness](#-theming--responsiveness)
- [🔄 Updating the Data](#-updating-the-data)
- [🌍 Deployment](#-deployment)
- [🛣️ Roadmap](#️-roadmap)
- [🤝 Contributing](#-contributing)
- [👤 Author](#-author)

---

## ✨ Features

- 🗺️ **Interactive SVG map** — click any block to select and highlight it
- 📈 **KPI cards** — total blocks, total area, largest and smallest block at a glance
- 📊 **Area bar chart** — blocks ranked by area, linked to the map and table
- 📋 **Sortable attribute table** — click any column header to sort ascending/descending
- 🔍 **Detail panel** — area, share of total, rank, perimeter, polygon parts, centroid, and extent
- 🔗 **Linked selection** — map, bars, and table stay in sync
- 🌗 **Light & dark mode** — follows your system preference automatically
- 📱 **Fully responsive** — works on desktop, tablet, and mobile (with safe-area support)
- ⚡ **Zero dependencies** — one HTML file, no build step, no external libraries

---

## 📊 Dataset at a Glance

| 📌 Metric | 🔢 Value |
|---|---|
| District | Haridwar |
| Administrative blocks | **8** |
| Total area | **~4,133.5 km²** (UTM Zone 44N) |
| Largest block | **Haldwani** — 1,032.1 km² (25.0%) |
| Smallest block | **Dhari** — 150.4 km² (3.6%) |

### 🧩 Blocks by Area

| 🏅 Rank | 🏘️ Block | 📐 Area (km²) | 🥧 Share |
|:---:|---|---:|---:|
| 1 | Haldwani | 1,032.10 | 25.0% |
| 2 | Ramnagar | 876.63 | 21.2% |
| 3 | Kotabagh | 600.46 | 14.5% |
| 4 | Okhalkanda | 533.86 | 12.9% |
| 5 | Bhimtal | 411.85 | 10.0% |
| 6 | Betalgat | 308.39 | 7.5% |
| 7 | Ramgarh | 219.85 | 5.3% |
| 8 | Dhari | 150.36 | 3.6% |

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| 🏗️ Markup | HTML5 |
| 🎨 Styling | CSS3 (Grid, Flexbox, CSS variables, `color-mix`) |
| ⚙️ Logic | Vanilla JavaScript (ES6+) |
| 🖼️ Map rendering | Inline SVG paths (pre-projected, no tiles) |
| 🌍 Projection | UTM Zone 44N for area and perimeter calculations |

---

## 📂 Project Structure

```
📦 Haridwar-block-boundary
 ┗ 📜 index.html     # Complete dashboard: markup, styles, data, and scripts
 ┗ 📜 README.md      # You are here
```

---

## 🚀 Getting Started

### ✅ Run locally

No installation needed!

```bash
# 1️⃣ Clone the repository
git clone https://github.com/RawatGitLab/<your-repo-name>.git

# 2️⃣ Enter the folder
cd <your-repo-name>

# 3️⃣ Open in your browser
open index.html        # macOS
start index.html       # Windows
xdg-open index.html    # Linux
```

💡 **Tip:** Prefer a local server? Run `npx serve .` or `python -m http.server 8000`.

---

## 🖱️ How to Use

1. 👆 **Click a block** on the map to select it
2. 📊 **Click a bar** in the "Area by block" chart to jump to that block
3. 📋 **Click a table row** to select a block from the list
4. ↕️ **Click a column header** to sort the attribute table
5. 🔎 **Hover** over a block to see its name and area in a tooltip

The **detail panel** updates instantly with the selected block's statistics.

---

## 🧮 Attributes Explained

| Field | 📖 Description |
|---|---|
| `name` | Block name |
| `district` | Parent district |
| `area` | Area in km² (computed in UTM 44N) |
| `share` | Percentage of the district's total block area |
| `perim` | Perimeter in km |
| `parts` | Number of polygon parts (multipart geometry count) |
| `lat` / `lon` | Centroid coordinates (WGS84) |
| `ext` | Bounding extent `[west, south, east, north]` |
| `path` | Pre-projected SVG path string for drawing |

---

## 🎨 Theming & Responsiveness

- 🌞 **Light theme** and 🌙 **dark theme** are driven by CSS variables
- 🖥️ Automatically follows `prefers-color-scheme`
- 🎛️ Force a theme by setting `data-theme="light"` or `data-theme="dark"` on the `<html>` element
- 📲 Layout collapses to a single column below **800px**

```css
:root {
  --acc: #0f766e;  /* 🟢 accent colour */
  --hi:  #f59e0b;  /* 🟡 selection highlight */
}
```

---

## 🔄 Updating the Data

All data lives in a single `const D = {...}` object inside the `<script>` tag.

```js
const D = {
  vb: [0, 0, 940, 628],   // 🖼️ SVG viewBox
  blocks: [
    {
      name: "Haldwani",
      district: "Haridwar",
      area: 1032.1,
      perim: 217.6,
      parts: 1,
      lat: 29.1281, lon: 79.6361,
      cx: 645.3, cy: 466.1,   // 🏷️ label position in SVG space
      path: "M501.1 303.2L...",
      ext: [west, south, east, north]
    }
    // ... more blocks
  ]
};
```

🛠️ **Workflow:** Prepare a block boundary GeoJSON/shapefile ➜ reproject to UTM 44N ➜ compute area, perimeter, and centroid ➜ convert polygons to SVG paths ➜ paste into `D`.

---

## 🌍 Deployment

The dashboard is a static site, so it deploys anywhere:

- 🚀 **Netlify** — drag & drop the folder (current host)
- 🐙 **GitHub Pages** — enable Pages on the `main` branch
- ▲ **Vercel** — import the repo, no config needed
- 🗄️ Any static web server

---

## 🛣️ Roadmap

- [ ] 🏷️ Toggle block labels on/off
- [ ] 🔎 Zoom and pan on the map
- [ ] 🧭 Add village and tehsil boundary layers
- [ ] 👥 Join Census population data for choropleth views
- [ ] 💾 Export table as CSV / map as PNG
- [ ] 🌐 Switch to Leaflet with a basemap option

---

## 🤝 Contributing

Contributions are welcome! 🙌

1. 🍴 Fork the repo
2. 🌿 Create a branch: `git checkout -b feature/my-feature`
3. 💬 Commit your changes: `git commit -m "Add my feature"`
4. 📤 Push: `git push origin feature/my-feature`
5. 🔀 Open a Pull Request

---

## 👤 Author

**Mr. Rawat** — GIS & Full-Stack Web Developer 🧑‍💻
🏢 Founder, Geoversed Playground AI Solution Pvt Ltd
🐙 GitHub: [RawatGitLab](https://github.com/RawatGitLab)

Building geospatial governance technology for Uttarakhand 🇮🇳🏔️

---

⭐ If you found this project useful, consider giving it a star!
