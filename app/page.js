"use client";

import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";
import dynamic from "next/dynamic";

const MiniChart = dynamic(() => import("./components/MiniChart"), { ssr: false });
const ComparisonChart = dynamic(() => import("./components/ComparisonChart"), { ssr: false });

// ─── Data mockup (tiruan) ───
const MOCK_TEMP_24H = [
  27, 26.5, 26, 25.5, 25, 25, 25.5, 26, 27, 28.5, 30, 31, 32, 32.5, 33, 32.5,
  31.5, 30, 29, 28.5, 28, 27.5, 27, 27,
];
const MOCK_HUMID_24H = [
  80, 82, 83, 85, 86, 86, 84, 82, 78, 74, 70, 66, 63, 61, 60, 62, 65, 68, 72,
  74, 76, 78, 79, 80,
];

export default function Home() {
  const [mode, setMode] = useState("dashboard");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [temp24h, setTemp24h] = useState(MOCK_TEMP_24H);
  const [humid24h, setHumid24h] = useState(MOCK_HUMID_24H);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: sensorData, error: err1 } = await supabase
          .from("sensor_data")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1);

        if (err1) throw err1;
        if (sensorData) setData(sensorData);

        const now = new Date();
        const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const { data: historyData, error: err2 } = await supabase
          .from("sensor_data")
          .select("suhu, kelembapan, cahaya, created_at")
          .gte("created_at", past24h.toISOString())
          .order("created_at", { ascending: true });

        if (!err2 && historyData && historyData.length > 0) {
          const hourlyBuckets = Array.from({ length: 24 }, () => ({
            temps: [],
            humids: [],
          }));

          historyData.forEach((row) => {
            const hour = new Date(row.created_at).getHours();
            hourlyBuckets[hour].temps.push(row.suhu);
            hourlyBuckets[hour].humids.push(row.kelembapan);
          });

          const avgTemp = hourlyBuckets.map((b) =>
            b.temps.length > 0
              ? +(b.temps.reduce((a, c) => a + c, 0) / b.temps.length).toFixed(1)
              : null
          );
          const avgHumid = hourlyBuckets.map((b) =>
            b.humids.length > 0
              ? +(b.humids.reduce((a, c) => a + c, 0) / b.humids.length).toFixed(1)
              : null
          );

          setTemp24h(avgTemp);
          setHumid24h(avgHumid);
        }

        const { data: recentData, error: err3 } = await supabase
          .from("sensor_data")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!err3 && recentData) setHistory(recentData);
      } catch (err) {
        console.error("Supabase error:", err);
        setError("Data tiruan ditampilkan. Pastikan tabel 'sensor_data' sudah ada di Supabase.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const channel = supabase
      .channel("realtime:sensor_data")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sensor_data" },
        (payload) => {
          setData([payload.new]);
          setHistory((prev) => [payload.new, ...prev].slice(0, 50));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const latestData = data[0] || { suhu: 29.5, kelembapan: 75, cahaya: 620 };

  const ldrValue = latestData.cahaya ?? 0;
  const isDaytime = ldrValue > 500;

  const tabs = [
    { key: "dashboard", label: "Dashboard", gradient: "linear-gradient(135deg, #f0a500, #f5bc30)", shadow: "rgba(240,165,0,0.35)" },
    { key: "comparison", label: "Perbandingan", gradient: "linear-gradient(135deg, #e63946, #ef5a67)", shadow: "rgba(230,57,70,0.35)" },
    { key: "history", label: "Riwayat", gradient: "linear-gradient(135deg, #6b8a7a, #82a592)", shadow: "rgba(107,138,122,0.35)" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* ═══════ Top Navigation ═══════ */}
      <nav className="w-full px-6 md:px-12 py-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-up">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #f0a500, #e63946)" }}
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2m0 14v2m-7-9H3m18 0h-2m-2.05-6.36l-1.41 1.41M7.46 16.54l-1.41 1.41m12.02 0l-1.41-1.41M7.46 7.46L6.05 6.05M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight" style={{ color: "#2d2a26" }}>AtmoMind</span>
        </div>

        <div
          className="flex rounded-full p-1 gap-1"
          style={{ background: "rgba(240,165,0,0.08)", border: "1px solid rgba(240,165,0,0.18)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300"
              style={{
                background: mode === tab.key ? tab.gradient : "transparent",
                color: mode === tab.key ? "#fff" : "#9a9590",
                boxShadow: mode === tab.key ? `0 2px 12px ${tab.shadow}` : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ═══════ Error Notice ═══════ */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 md:px-12 mt-2 animate-fade-up">
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-medium"
            style={{ background: "rgba(230,57,70,0.06)", border: "1px solid rgba(230,57,70,0.18)", color: "#e63946" }}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-6 pb-16">

        {/* ══════════════════════════════════════════════ */}
        {/* ═══════ MODE: DASHBOARD ═══════ */}
        {/* ══════════════════════════════════════════════ */}
        {mode === "dashboard" && (
          <div className="space-y-8">
            <div className="animate-fade-up">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#2d2a26" }}>
                Kondisi <span style={{ color: "#f0a500" }}>Lingkungan</span> Sekarang
              </h2>
              <p className="mt-2 text-base" style={{ color: "#9a9590" }}>
                Pemantauan suhu, kelembapan, dan cahaya secara real-time
              </p>
            </div>

            <div className="flex items-center gap-3 animate-fade-up-delay">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#f0a500" }}></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#f0a500" }}></span>
              </span>
              <span className="text-sm font-medium" style={{ color: "#9a9590" }}>
                {loading ? "Menyambungkan ke sensor..." : "Sensor aktif • Data terbaru"}
              </span>
            </div>

            {/* Angka Ringkasan */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up-delay">
              {[
                { label: "Suhu Min", value: `${Math.min(...temp24h.filter((v) => v !== null))}°C`, color: "#e63946", bg: "rgba(230,57,70,0.06)" },
                { label: "Suhu Maks", value: `${Math.max(...temp24h.filter((v) => v !== null))}°C`, color: "#e63946", bg: "rgba(230,57,70,0.06)" },
                { label: "Kelembapan Min", value: `${Math.min(...humid24h.filter((v) => v !== null))}%`, color: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
                { label: "Kelembapan Maks", value: `${Math.max(...humid24h.filter((v) => v !== null))}%`, color: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4 text-center transition-all duration-300 hover:translate-y-[-2px]"
                  style={{ background: "#fff", border: `1px solid ${stat.bg}`, boxShadow: `0 4px 16px ${stat.bg}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9a9590" }}>{stat.label}</p>
                  <p className="text-xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Main Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up-delay-2">

              {/* Card Suhu */}
              <div
                className="rounded-3xl p-7 transition-all duration-300 hover:translate-y-[-2px]"
                style={{ background: "#fff", border: "1px solid rgba(230,57,70,0.15)", boxShadow: "0 1px 3px rgba(230,57,70,0.06), 0 8px 32px rgba(230,57,70,0.05)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(230,57,70,0.1)" }}>
                      <svg className="w-5 h-5" style={{ color: "#e63946" }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11 2v4h2V2h-2zm0 16v4h2v-4h-2zm-5.7-1.3l-2.8 2.8 1.4 1.4 2.8-2.8-1.4-1.4zM19.1 4.9l-2.8 2.8 1.4 1.4 2.8-2.8-1.4-1.4zM2 11v2h4v-2H2zm16 0v2h4v-2h-4zm-1.3 5.7l2.8 2.8 1.4-1.4-2.8-2.8-1.4 1.4zM4.9 19.1l2.8-2.8-1.4-1.4-2.8 2.8 1.4 1.4zM12 8a4 4 0 100 8 4 4 0 000-8z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#9a9590" }}>Suhu</span>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(230,57,70,0.1)", color: "#e63946" }}>Live</div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-6xl font-light tracking-tighter leading-none" style={{ color: "#2d2a26" }}>{latestData.suhu}</span>
                  <span className="text-3xl font-light mb-1" style={{ color: "#e63946" }}>°C</span>
                </div>

                <div className="mt-5 h-20 rounded-2xl overflow-hidden" style={{ background: "rgba(230,57,70,0.04)" }}>
                  <MiniChart dataPoints={temp24h.map((v) => v ?? 0)} color="#e63946" label="°C" />
                </div>

                <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid rgba(230,57,70,0.12)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#e63946", boxShadow: "0 0 8px rgba(230,57,70,0.5)" }}></div>
                  <span className="text-xs" style={{ color: "#9a9590" }}>Pemantauan aktif</span>
                </div>
              </div>

              {/* Card Kelembapan */}
              <div
                className="rounded-3xl p-7 transition-all duration-300 hover:translate-y-[-2px]"
                style={{ background: "#fff", border: "1px solid rgba(59,130,246,0.15)", boxShadow: "0 1px 3px rgba(59,130,246,0.06), 0 8px 32px rgba(59,130,246,0.05)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(59,130,246,0.1)" }}>
                      <svg className="w-5 h-5" style={{ color: "#3b82f6" }} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3.25S4 10 4 15.5A8 8 0 0012 23.5a8 8 0 008-8C20 10 12 3.25 12 3.25zm0 18.25a6 6 0 01-6-6c0-3.69 4.39-8.49 6-10.2 1.61 1.71 6 6.51 6 10.2a6 6 0 01-6 6z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#9a9590" }}>Kelembapan</span>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6" }}>Live</div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-6xl font-light tracking-tighter leading-none" style={{ color: "#2d2a26" }}>{latestData.kelembapan}</span>
                  <span className="text-3xl font-light mb-1" style={{ color: "#3b82f6" }}>%</span>
                </div>

                <div className="mt-5 h-20 rounded-2xl overflow-hidden" style={{ background: "rgba(59,130,246,0.04)" }}>
                  <MiniChart dataPoints={humid24h.map((v) => v ?? 0)} color="#3b82f6" label="%" />
                </div>

                <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid rgba(59,130,246,0.12)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#3b82f6", boxShadow: "0 0 8px rgba(59,130,246,0.5)" }}></div>
                  <span className="text-xs" style={{ color: "#9a9590" }}>Ruangan nyaman</span>
                </div>
              </div>

              {/* Card Cahaya (LDR) */}
              <div
                className="rounded-3xl p-7 transition-all duration-300 hover:translate-y-[-2px]"
                style={{ background: "#fff", border: "1px solid rgba(184,134,11,0.18)", boxShadow: "0 1px 3px rgba(184,134,11,0.06), 0 8px 32px rgba(184,134,11,0.05)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(184,134,11,0.15)" }}>
                      {isDaytime ? (
                        <svg className="w-5 h-5" style={{ color: "#b8860b" }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-5a1 1 0 011 1v2a1 1 0 01-2 0V3a1 1 0 011-1zm0 16a1 1 0 011 1v2a1 1 0 01-2 0v-2a1 1 0 011-1zM4.22 4.22a1 1 0 011.42 0l1.41 1.41a1 1 0 01-1.41 1.42L4.22 5.64a1 1 0 010-1.42zm12.73 12.73a1 1 0 011.41 0l1.42 1.42a1 1 0 01-1.42 1.41l-1.41-1.41a1 1 0 010-1.42zM2 12a1 1 0 011-1h2a1 1 0 010 2H3a1 1 0 01-1-1zm16 0a1 1 0 011-1h2a1 1 0 010 2h-2a1 1 0 01-1-1zM5.64 18.36a1 1 0 010-1.42l1.41-1.41a1 1 0 011.42 1.41l-1.42 1.42a1 1 0 01-1.41 0zm12.73-12.73a1 1 0 010-1.41l1.41-1.42a1 1 0 111.42 1.42l-1.42 1.41a1 1 0 01-1.41 0z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" style={{ color: "#b8860b" }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21.752 15.002A9.718 9.718 0 0112.478 22C6.951 22 2.478 17.527 2.478 12c0-4.478 2.943-8.268 7-9.542a.75.75 0 01.956.906 8.25 8.25 0 0010.2 10.2.75.75 0 01.906.956l.212-.518z" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm font-semibold tracking-wide uppercase" style={{ color: "#9a9590" }}>Cahaya</span>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: "rgba(184,134,11,0.12)",
                      color: "#b8860b",
                    }}
                  >
                    {isDaytime ? "Siang" : "Malam"}
                  </div>
                </div>

                <div className="mt-5 flex items-end gap-2">
                  <span className="text-6xl font-light tracking-tighter leading-none" style={{ color: "#2d2a26" }}>{ldrValue}</span>
                  <span className="text-lg font-medium mb-2" style={{ color: "#b8860b" }}>lux</span>
                </div>

                <div className="mt-5">
                  <div className="flex justify-between text-xs mb-2" style={{ color: "#9a9590" }}>
                    <span>Gelap</span>
                    <span>Terang</span>
                  </div>
                  <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: "rgba(0,0,0,0.04)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((ldrValue / 1023) * 100, 100)}%`,
                        background: "linear-gradient(90deg, #d4af37, #b8860b)",
                      }}
                    ></div>
                  </div>
                </div>

                <div className="mt-4 pt-4 flex items-center gap-2" style={{ borderTop: "1px solid rgba(184,134,11,0.12)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#b8860b", boxShadow: "0 0 8px rgba(184,134,11,0.5)" }}></div>
                  <span className="text-xs" style={{ color: "#9a9590" }}>
                    {isDaytime ? "Kondisi terang — siang hari" : "Kondisi gelap — malam hari"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ═══════ MODE: COMPARISON ═══════ */}
        {/* ══════════════════════════════════════════════ */}
        {mode === "comparison" && (
          <div className="space-y-8">
            <div className="animate-fade-up">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#2d2a26" }}>
                Perbandingan <span style={{ color: "#e63946" }}>Suhu</span> & <span style={{ color: "#3b82f6" }}>Kelembapan</span>
              </h2>
              <p className="mt-2 text-base" style={{ color: "#9a9590" }}>
                Rata-rata per jam selama 24 jam — Suhu (kiri) & Kelembapan (kanan) dalam satu grafik untuk melihat korelasi
              </p>
            </div>

            <div
              className="rounded-3xl p-6 md:p-8 animate-fade-up-delay"
              style={{ background: "#fff", border: "1px solid rgba(59,130,246,0.12)", boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 32px rgba(59,130,246,0.06)" }}
            >
              <ComparisonChart tempData={temp24h} humidData={humid24h} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up-delay-2">
              {[
                { label: "Suhu Min", value: `${Math.min(...temp24h.filter((v) => v !== null))}°C`, color: "#e63946", bg: "rgba(230,57,70,0.06)" },
                { label: "Suhu Maks", value: `${Math.max(...temp24h.filter((v) => v !== null))}°C`, color: "#e63946", bg: "rgba(230,57,70,0.06)" },
                { label: "Kelembapan Min", value: `${Math.min(...humid24h.filter((v) => v !== null))}%`, color: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
                { label: "Kelembapan Maks", value: `${Math.max(...humid24h.filter((v) => v !== null))}%`, color: "#3b82f6", bg: "rgba(59,130,246,0.06)" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-5 text-center transition-all duration-300 hover:translate-y-[-2px]"
                  style={{ background: "#fff", border: `1px solid ${stat.bg}`, boxShadow: `0 4px 16px ${stat.bg}` }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#9a9590" }}>{stat.label}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: stat.color }}>{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* ═══════ MODE: HISTORY ═══════ */}
        {/* ══════════════════════════════════════════════ */}
        {mode === "history" && (
          <div className="space-y-8">
            <div className="animate-fade-up">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "#f0a500" }}>
                Riwayat <span style={{ color: "#272828ff" }}>Bacaan Sensor</span>
              </h2>
              <p className="mt-2 text-base" style={{ color: "#4a4642" }}>
                50 data terakhir yang dikirim oleh sensor ke database
              </p>
            </div>

            <div
              className="rounded-3xl overflow-hidden animate-fade-up-delay"
              style={{ background: "#fff", border: "1px solid rgba(107,138,122,0.12)", boxShadow: "0 1px 3px rgba(0,0,0,0.03), 0 8px 32px rgba(107,138,122,0.06)" }}
            >
              <div
                className="grid grid-cols-4 gap-4 px-6 py-4 text-xs font-bold uppercase tracking-wider"
                style={{ background: "rgba(107,138,122,0.05)", color: "#2d2a26", borderBottom: "1px solid rgba(107,138,122,0.1)" }}
              >
                <span>Waktu</span>
                <span className="text-center">Suhu (°C)</span>
                <span className="text-center">Kelembapan (%)</span>
                <span className="text-center">Cahaya (LDR)</span>
              </div>

              <div className="max-h-[480px] overflow-y-auto">
                {history.length > 0 ? (
                  history.map((row, i) => {
                    const time = new Date(row.created_at);
                    const formattedTime = time.toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    });

                    return (
                      <div
                        key={row.id || i}
                        className="grid grid-cols-4 gap-4 px-6 py-3.5 text-sm transition-colors duration-200"
                        style={{
                          borderBottom: "1px solid rgba(0,0,0,0.03)",
                          background: i % 2 === 0 ? "transparent" : "rgba(107,138,122,0.02)",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(240,165,0,0.04)")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(107,138,122,0.02)")}
                      >
                        <span className="font-medium" style={{ color: "#2d2a26" }}>{formattedTime}</span>
                        <span className="text-center font-semibold" style={{ color: "#e63946" }}>{row.suhu ?? "-"}</span>
                        <span className="text-center font-semibold" style={{ color: "#3b82f6" }}>{row.kelembapan ?? "-"}</span>
                        <span className="text-center font-semibold" style={{ color: "#b8860b" }}>{row.cahaya ?? "-"}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center" style={{ color: "#4a4642" }}>
                    <svg className="w-12 h-12 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p className="font-medium">Belum ada data riwayat</p>
                    <p className="text-xs mt-1">Data akan muncul setelah sensor mengirim pembacaan ke tabel sensor_data di Supabase</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="w-full py-6 text-center text-xs" style={{ color: "#c4bfb9" }}>
        AtmoMind © {new Date().getFullYear()} — Environmental Intelligence
      </footer>
    </div>
  );
}
