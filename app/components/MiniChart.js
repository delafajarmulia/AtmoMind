"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip
);

// Plugin: garis vertikal saat hover
const crosshairPlugin = {
  id: "crosshair",
  afterDraw(chart) {
    const tooltip = chart.tooltip;
    if (tooltip && tooltip.opacity > 0) {
      const ctx = chart.ctx;
      const x = tooltip.caretX;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0.08)";
      ctx.stroke();
      ctx.restore();
    }
  },
};

export default function MiniChart({ dataPoints, color, label }) {
  const labels = dataPoints.map((_, i) => `${i}:00`);

  const data = {
    labels,
    datasets: [
      {
        label: label,
        data: dataPoints,
        borderColor: color,
        backgroundColor: color + "20",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: "#fff",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    // Kunci utama: intersect false agar tooltip muncul cukup dengan gerakan horizontal
    interaction: {
      mode: "index",
      intersect: false,
    },
    hover: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        backgroundColor: "#fff",
        titleColor: "#2d2a26",
        bodyColor: "#2d2a26",
        borderColor: color + "40",
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          title: (ctx) => `Jam ${ctx[0].label}`,
          label: (ctx) => `${label} ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
  };

  return (
    <div className="w-full h-full">
      <Line data={data} options={options} plugins={[crosshairPlugin]} />
    </div>
  );
}
