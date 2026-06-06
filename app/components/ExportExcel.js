"use client";

import * as XLSX from "xlsx";

// Batas aman default (bisa diubah nanti)
const SAFE_TEMP_MIN = 25;
const SAFE_TEMP_MAX = 28;
const SAFE_HUMID_MIN = 40;
const SAFE_HUMID_MAX = 60;

function formatTanggal(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatWaktu(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function generateExcel(data, startDate, endDate) {
  const wb = XLSX.utils.book_new();

  const periodeStart = formatTanggal(startDate);
  const periodeEnd = formatTanggal(endDate);
  const waktuCetak = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // ═══ Hitung Statistik ═══
  const temps = data.map((r) => r.suhu).filter((v) => v != null);
  const humids = data.map((r) => r.kelembapan).filter((v) => v != null);

  const suhuMin = temps.length > 0 ? Math.min(...temps) : "-";
  const suhuMax = temps.length > 0 ? Math.max(...temps) : "-";
  const suhuAvg =
    temps.length > 0
      ? +(temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
      : "-";
  const kelembapanMin = humids.length > 0 ? Math.min(...humids) : "-";
  const kelembapanMax = humids.length > 0 ? Math.max(...humids) : "-";
  const kelembapanAvg =
    humids.length > 0
      ? +(humids.reduce((a, b) => a + b, 0) / humids.length).toFixed(1)
      : "-";

  const outOfRangeTemp = temps.filter(
    (t) => t < SAFE_TEMP_MIN || t > SAFE_TEMP_MAX
  ).length;
  const outOfRangeHumid = humids.filter(
    (h) => h < SAFE_HUMID_MIN || h > SAFE_HUMID_MAX
  ).length;

  // ═══ Sheet 1: Ringkasan ═══
  const summaryData = [
    ["LAPORAN PEMANTAUAN SUHU RUANGAN"],
    ["AtmoMind — Environmental Intelligence"],
    [],
    ["Periode", `${periodeStart} — ${periodeEnd}`],
    ["Dicetak pada", `${waktuCetak} WIB`],
    ["Total Pembacaan", data.length],
    [],
    ["═══ RINGKASAN SUHU ═══"],
    ["Suhu Minimum", `${suhuMin}°C`],
    ["Suhu Maksimum", `${suhuMax}°C`],
    ["Suhu Rata-rata", `${suhuAvg}°C`],
    ["Pembacaan di Luar Batas Aman", outOfRangeTemp],
    [],
    ["═══ RINGKASAN KELEMBAPAN ═══"],
    ["Kelembapan Minimum", `${kelembapanMin}%`],
    ["Kelembapan Maksimum", `${kelembapanMax}%`],
    ["Kelembapan Rata-rata", `${kelembapanAvg}%`],
    ["Pembacaan di Luar Batas Aman", outOfRangeHumid],
    [],
    ["═══ BATAS AMAN ═══"],
    ["Suhu Aman", `${SAFE_TEMP_MIN}–${SAFE_TEMP_MAX}°C`],
    ["Kelembapan Aman", `${SAFE_HUMID_MIN}–${SAFE_HUMID_MAX}%`],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary["!cols"] = [{ wch: 30 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan");

  // ═══ Sheet 2: Data Riwayat ═══
  const header = ["No", "Waktu", "Suhu (°C)", "Kelembapan (%)", "Cahaya (LDR)", "Status"];

  const rows = data.map((row, i) => {
    const suhu = row.suhu ?? "-";
    const kelembapan = row.kelembapan ?? "-";
    const cahaya = row.cahaya ?? "-";

    let status = "Normal";
    if (typeof suhu === "number" && (suhu < SAFE_TEMP_MIN || suhu > SAFE_TEMP_MAX)) {
      status = suhu < SAFE_TEMP_MIN ? "Suhu Rendah" : "Suhu Tinggi";
    }
    if (typeof kelembapan === "number" && (kelembapan < SAFE_HUMID_MIN || kelembapan > SAFE_HUMID_MAX)) {
      status = status === "Normal" ? "Kelembapan Abnormal" : status + " + Kelembapan";
    }

    return [i + 1, formatWaktu(row.created_at), suhu, kelembapan, cahaya, status];
  });

  const sheetData = [
    [`Laporan Pemantauan Suhu — ${periodeStart} s/d ${periodeEnd}`],
    [],
    header,
    ...rows,
  ];

  const wsData = XLSX.utils.aoa_to_sheet(sheetData);
  wsData["!cols"] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsData, "Data Riwayat");

  // Download
  const fileName = `Laporan_AtmoMind_${startDate}_sd_${endDate}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
