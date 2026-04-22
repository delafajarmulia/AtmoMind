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
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function ComparisonChart({ tempData, humidData }) {
  const hours = Array.from({ length: 24 }, (_, i) => {
    const h = i.toString().padStart(2, "0");
    return `${h}:00`;
  });

  const data = {
    labels: hours,
    datasets: [
      {
        label: "Suhu (°C)",
        data: tempData,
        borderColor: "#e63946",
        backgroundColor: "rgba(230, 57, 70, 0.10)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#e63946",
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#e63946",
        yAxisID: "y",
      },
      {
        label: "Kelembapan (%)",
        data: humidData,
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.10)",
        borderWidth: 2.5,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: "#3b82f6",
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#3b82f6",
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#2d2a26",
        bodyColor: "#2d2a26",
        borderColor: "rgba(59, 130, 246, 0.3)",
        borderWidth: 1,
        padding: 14,
        cornerRadius: 12,
        titleFont: { size: 13, weight: "600" },
        bodyFont: { size: 12 },
      },
      legend: {
        position: "top",
        align: "end",
        labels: {
          color: "#6b6560",
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          font: { size: 13, weight: "500" },
        },
      },
    },
    scales: {
      x: {
        grid: { color: "rgba(59, 130, 246, 0.06)" },
        ticks: {
          color: "#9a9590",
          font: { size: 11 },
          maxRotation: 0,
          callback: function (val, index) {
            return index % 3 === 0 ? this.getLabelForValue(val) : "";
          },
        },
        border: { display: false },
      },
      y: {
        type: "linear",
        position: "left",
        grid: { color: "rgba(230, 57, 70, 0.06)" },
        ticks: {
          color: "#e63946",
          font: { size: 11, weight: "600" },
          padding: 8,
          callback: (v) => v + "°C",
        },
        border: { display: false },
        title: {
          display: true,
          text: "Suhu (°C)",
          color: "#e63946",
          font: { size: 12, weight: "600" },
        },
      },
      y1: {
        type: "linear",
        position: "right",
        grid: { drawOnChartArea: false },
        ticks: {
          color: "#3b82f6",
          font: { size: 11, weight: "600" },
          padding: 8,
          callback: (v) => v + "%",
        },
        border: { display: false },
        title: {
          display: true,
          text: "Kelembapan (%)",
          color: "#3b82f6",
          font: { size: 12, weight: "600" },
        },
      },
    },
  };

  return (
    <div className="w-full" style={{ height: "420px" }}>
      <Line data={data} options={options} />
    </div>
  );
}
