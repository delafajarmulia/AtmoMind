"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

function hitungStatistik(data) {
  const temps = data.map((r) => r.suhu).filter((v) => v != null);
  const humids = data.map((r) => r.kelembapan).filter((v) => v != null);

  const outOfRangeTemp = temps.filter(
    (t) => t < SAFE_TEMP_MIN || t > SAFE_TEMP_MAX
  ).length;
  const outOfRangeHumid = humids.filter(
    (h) => h < SAFE_HUMID_MIN || h > SAFE_HUMID_MAX
  ).length;

  return {
    totalData: data.length,
    suhuMin: temps.length > 0 ? Math.min(...temps) : "-",
    suhuMax: temps.length > 0 ? Math.max(...temps) : "-",
    suhuAvg:
      temps.length > 0
        ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
        : "-",
    kelembapanMin: humids.length > 0 ? Math.min(...humids) : "-",
    kelembapanMax: humids.length > 0 ? Math.max(...humids) : "-",
    kelembapanAvg:
      humids.length > 0
        ? (humids.reduce((a, b) => a + b, 0) / humids.length).toFixed(1)
        : "-",
    outOfRangeTemp,
    outOfRangeHumid,
  };
}

export function generatePDF(data, startDate, endDate) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

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

  // ═══ HEADER ═══
  doc.setFillColor(240, 165, 0);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Laporan Pemantauan Suhu Ruangan", 14, 12);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Periode: ${periodeStart} — ${periodeEnd}`, 14, 19);
  doc.text(`Dicetak pada: ${waktuCetak} WIB`, 14, 25);

  doc.setFontSize(9);
  doc.text("AtmoMind — Environmental Intelligence", pageWidth - 14, 25, {
    align: "right",
  });

  // ═══ RINGKASAN STATISTIK ═══
  const stats = hitungStatistik(data);
  let y = 36;

  doc.setTextColor(45, 42, 38);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("Ringkasan Statistik", 14, y);
  y += 8;

  // Kotak ringkasan
  const boxW = 60;
  const boxH = 28;
  const gap = 8;
  const startX = 14;

  const boxes = [
    {
      title: "Suhu (°C)",
      values: [
        `Min: ${stats.suhuMin}°C`,
        `Maks: ${stats.suhuMax}°C`,
        `Rata-rata: ${stats.suhuAvg}°C`,
      ],
      color: [230, 57, 70],
      bg: [255, 240, 240],
    },
    {
      title: "Kelembapan (%)",
      values: [
        `Min: ${stats.kelembapanMin}%`,
        `Maks: ${stats.kelembapanMax}%`,
        `Rata-rata: ${stats.kelembapanAvg}%`,
      ],
      color: [59, 130, 246],
      bg: [235, 245, 255],
    },
    {
      title: "Total Data",
      values: [
        `${stats.totalData} pembacaan`,
        `Suhu di luar batas: ${stats.outOfRangeTemp}`,
        `Kelembapan di luar batas: ${stats.outOfRangeHumid}`,
      ],
      color: [107, 138, 122],
      bg: [240, 248, 244],
    },
    {
      title: "Batas Aman",
      values: [
        `Suhu: ${SAFE_TEMP_MIN}–${SAFE_TEMP_MAX}°C`,
        `Kelembapan: ${SAFE_HUMID_MIN}–${SAFE_HUMID_MAX}%`,
        ``,
      ],
      color: [184, 134, 11],
      bg: [255, 249, 235],
    },
  ];

  boxes.forEach((box, i) => {
    const x = startX + i * (boxW + gap);
    doc.setFillColor(...box.bg);
    doc.roundedRect(x, y, boxW, boxH, 3, 3, "F");

    doc.setTextColor(...box.color);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(box.title, x + 4, y + 7);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    box.values.forEach((v, vi) => {
      if (v) doc.text(v, x + 4, y + 13 + vi * 5);
    });
  });

  y += boxH + 10;

  // ═══ TABEL DATA ═══
  doc.setTextColor(45, 42, 38);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(`Data Riwayat (${stats.totalData} pembacaan)`, 14, y);
  y += 4;

  const tableData = data.map((row, i) => {
    const suhu = row.suhu ?? "-";
    const kelembapan = row.kelembapan ?? "-";
    const cahaya = row.cahaya ?? "-";

    // Tentukan status
    let status = "Normal";
    if (typeof suhu === "number" && (suhu < SAFE_TEMP_MIN || suhu > SAFE_TEMP_MAX)) {
      status = suhu < SAFE_TEMP_MIN ? "Suhu Rendah" : "Suhu Tinggi";
    }
    if (typeof kelembapan === "number" && (kelembapan < SAFE_HUMID_MIN || kelembapan > SAFE_HUMID_MAX)) {
      status = status === "Normal" ? "Kelembapan Abnormal" : status + " + Kelembapan";
    }

    return [i + 1, formatWaktu(row.created_at), suhu, kelembapan, cahaya, status];
  });

  autoTable(doc, {
    startY: y,
    head: [["No", "Waktu", "Suhu (°C)", "Kelembapan (%)", "Cahaya (LDR)", "Status"]],
    body: tableData,
    margin: { left: 14, right: 14 },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: [45, 42, 38],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [250, 248, 245],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      1: { cellWidth: 55 },
      2: { cellWidth: 28, halign: "center" },
      3: { cellWidth: 32, halign: "center" },
      4: { cellWidth: 28, halign: "center" },
      5: { cellWidth: 45 },
    },
    didParseCell: function (data) {
      // Highlight baris yang di luar batas aman
      if (data.section === "body") {
        const rowData = tableData[data.row.index];
        if (rowData) {
          const status = rowData[5];
          if (status !== "Normal") {
            data.cell.styles.fillColor = [255, 235, 235];
            data.cell.styles.textColor = [180, 40, 40];
          }
        }
      }
    },
    didDrawPage: function (data) {
      // Footer di setiap halaman
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(7);
      doc.setTextColor(180, 180, 180);
      doc.text(
        `AtmoMind © ${new Date().getFullYear()} — Environmental Intelligence`,
        14,
        doc.internal.pageSize.getHeight() - 8
      );
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  // Download
  const fileName = `Laporan_AtmoMind_${startDate}_sd_${endDate}.pdf`;
  doc.save(fileName);
}
