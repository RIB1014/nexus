"use client";

import { useEffect, useState } from "react";
import { Cloud } from "lucide-react";

function greetingFor(hour: number): string {
  if (hour < 5) return "Still up";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

interface Weather {
  temp: number;
  code: number;
}

export function Greeting({ name }: { name: string | null }) {
  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<Weather | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`,
          );
          if (!res.ok) return;
          const data = await res.json();
          setWeather({
            temp: Math.round(data.current?.temperature_2m),
            code: data.current?.weather_code,
          });
        } catch {
          // Weather is a nicety — silently skip on failure.
        }
      },
      () => {
        /* permission denied — no weather */
      },
      { timeout: 8000 },
    );
  }, []);

  const firstName = name?.split(" ")[0] ?? null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-display !text-[2.4rem] !leading-[1.05]">
          {greetingFor(now.getHours())}
          {firstName ? `, ${firstName}` : ""}
        </h2>
        <p className="mt-1.5 text-body text-muted">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          {" · "}
          {now.toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          })}
        </p>
      </div>

      {weather && (
        <div className="app-card flex items-center gap-2 px-3.5 py-2 text-small text-muted">
          <Cloud className="size-4 text-accent" />
          <span className="font-data text-base font-semibold text-fg">{weather.temp}°</span>
        </div>
      )}
    </div>
  );
}
