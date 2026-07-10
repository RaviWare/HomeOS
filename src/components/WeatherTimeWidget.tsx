import React, { useCallback, useEffect, useState } from "react";
import {
  MapPin,
  Clock,
  Sun,
  Cloud,
  CloudSun,
  CloudFog,
  CloudRain,
  CloudSnow,
  CloudLightning,
  RefreshCw,
} from "lucide-react";
import {
  resolveUserLocale,
  formatLocalTime,
  formatLocalDate,
  formatRegionLabel,
  fetchWeather,
  clearGeoLocaleCache,
  getBrowserTimeZone,
  getBrowserLocale,
  type UserLocaleInfo,
  type WeatherNow,
} from "../geoLocale";

function wx(code: number): { Icon: React.ComponentType<{ className?: string }>; label: string } {
  if (code === 0) return { Icon: Sun, label: "Clear" };
  if (code <= 3) return { Icon: CloudSun, label: "Partly cloudy" };
  if (code <= 48) return { Icon: CloudFog, label: "Fog" };
  if (code <= 67) return { Icon: CloudRain, label: "Rain" };
  if (code <= 77) return { Icon: CloudSnow, label: "Snow" };
  if (code <= 82) return { Icon: CloudRain, label: "Showers" };
  if (code <= 86) return { Icon: CloudSnow, label: "Snow" };
  return { Icon: CloudLightning, label: "Storm" };
}

type Props = {
  /** Soft fallback only — never forces a hard-coded country or time zone. */
  preferredCity?: string;
};

export default function WeatherTimeWidget({ preferredCity }: Props) {
  const [info, setInfo] = useState<UserLocaleInfo | null>(null);
  const [now, setNow] = useState(() => formatLocalTime());
  const [dateLabel, setDateLabel] = useState(() => formatLocalDate());
  const [weather, setWeather] = useState<WeatherNow | null>(null);
  const [wxFailed, setWxFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const tick = useCallback(() => {
    const timeZone = info?.timeZone || getBrowserTimeZone();
    const locale = info?.locale || getBrowserLocale();
    setNow(formatLocalTime(new Date(), { timeZone, locale }));
    setDateLabel(formatLocalDate(new Date(), { timeZone, locale }));
  }, [info?.timeZone, info?.locale]);

  useEffect(() => {
    tick();
    // 1s tick keeps wall-clock accurate across midnights / DST
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  const resolveAndWeather = useCallback(
    async (opts: { force?: boolean; signal?: AbortSignal }) => {
      if (opts.force) clearGeoLocaleCache();
      const localeInfo = await resolveUserLocale({
        preferredCity,
        signal: opts.signal,
      });
      setInfo(localeInfo);

      if (localeInfo.latitude != null && localeInfo.longitude != null) {
        const w = await fetchWeather(localeInfo.latitude, localeInfo.longitude, opts.signal);
        if (w) {
          setWeather(w);
          setWxFailed(false);
        } else {
          setWeather(null);
          setWxFailed(true);
        }
      } else {
        setWeather(null);
        setWxFailed(true);
      }
      return localeInfo;
    },
    [preferredCity]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    resolveAndWeather({ signal: ctrl.signal })
      .catch(() => {
        setInfo({
          timeZone: getBrowserTimeZone(),
          locale: getBrowserLocale(),
          city: preferredCity || cityFallback(),
          region: "",
          countryCode: "",
          country: "",
          latitude: null,
          longitude: null,
          source: "timezone",
          tzAbbr: "",
          utcOffset: "",
        });
        setWxFailed(true);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [resolveAndWeather, preferredCity]);

  const onRefresh = async () => {
    setRefreshing(true);
    setLoading(true);
    const ctrl = new AbortController();
    try {
      await resolveAndWeather({ force: true, signal: ctrl.signal });
    } catch {
      setWxFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const region = info ? formatRegionLabel(info) : preferredCity || "…";
  const tzHint = info ? info.tzAbbr || info.utcOffset : "";
  const cond = weather ? wx(weather.weatherCode) : null;
  const WxIcon = cond ? cond.Icon : Cloud;
  const sourceHint =
    info?.source === "geolocation"
      ? "Device location"
      : info?.source === "ip"
        ? "Network region"
        : info?.source === "preferred"
          ? "Home city hint"
          : "From time zone";

  const title = [region, info?.timeZone, tzHint, info?.utcOffset, sourceHint, dateLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="inline-flex items-center gap-2 sm:gap-2.5 h-10 px-2.5 sm:px-3 rounded-lg bg-[#121215] border border-[#1F1F23] text-[10px] sm:text-[11px] shrink-0 max-w-full"
      title={title}
      role="status"
      aria-live="polite"
      aria-label={`Local time ${now} in ${region}`}
    >
      <span className="inline-flex items-center gap-1 min-w-0">
        <MapPin className="w-3 h-3 text-red-400 shrink-0" aria-hidden />
        <span className="font-bold text-white truncate max-w-[5.5rem] sm:max-w-[9rem]">
          {loading && !info ? "…" : region}
        </span>
      </span>

      <span className="w-px h-3.5 bg-[#2E2E33] shrink-0" aria-hidden />

      <span className="inline-flex items-center gap-1 shrink-0">
        <Clock className="w-3 h-3 text-[#8E8E93] shrink-0" aria-hidden />
        <span className="font-bold text-white tabular-nums whitespace-nowrap">{now}</span>
        {tzHint ? (
          <span className="text-[#6B7280] font-semibold hidden md:inline tabular-nums max-w-[3.75rem] truncate">
            {tzHint}
          </span>
        ) : null}
      </span>

      <span className="w-px h-3.5 bg-[#2E2E33] shrink-0 hidden sm:block" aria-hidden />

      <span className="inline-flex items-center gap-1 shrink-0 hidden sm:inline-flex">
        <WxIcon className="w-3 h-3 text-[#F59E0B] shrink-0" aria-hidden />
        <span className="font-bold text-[#F59E0B] tabular-nums">
          {weather ? `${weather.tempC}°` : wxFailed ? "—" : "…"}
        </span>
        {cond ? (
          <span className="text-[#8E8E93] hidden lg:inline max-w-[5.5rem] truncate">{cond.label}</span>
        ) : null}
      </span>

      <button
        type="button"
        onClick={() => void onRefresh()}
        className="hidden sm:inline-flex w-6 h-6 items-center justify-center rounded-md text-[#6B7280] hover:text-white hover:bg-white/5 cursor-pointer shrink-0"
        title="Refresh location & weather"
        aria-label="Refresh location and weather"
      >
        <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
      </button>
    </div>
  );
}

function cityFallback(): string {
  try {
    const tz = getBrowserTimeZone();
    const last = tz.split("/").pop() || "Local";
    return last.replace(/_/g, " ");
  } catch {
    return "Local";
  }
}
