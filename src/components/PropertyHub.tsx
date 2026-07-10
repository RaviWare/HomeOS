import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  Plus,
  MapPin,
  BedDouble,
  ShowerHead,
  Maximize2,
  Car,
  Dog,
  Trash2,
  Copy,
  Star,
  Pencil,
  Search,
  LayoutGrid,
  List,
  ImagePlus,
  Loader2,
  Heart,
  SlidersHorizontal,
  X,
  Check,
  Camera,
  BarChart3,
  Table2,
} from "lucide-react";
import { ListingChannel, Property, RentalModel } from "../types";
import Pagination from "./Pagination";

const PROPERTY_TYPES: Property["type"][] = [
  "Residential",
  "Commercial",
  "Co-Living",
  "Student Housing",
  "Holiday Home",
  "Serviced Apartment",
  "PG / Hostel",
  "Society Unit",
];

const LISTING_CHANNELS: ListingChannel[] = [
  "Airbnb",
  "Booking.com",
  "MakeMyTrip",
  "Agoda",
  "VRBO",
  "OYO",
  "Direct",
  "Broker",
  "Other",
];

const RENTAL_MODELS: { id: RentalModel; label: string }[] = [
  { id: "long_term", label: "Long-term lease" },
  { id: "short_term", label: "Short-stay / Airbnb" },
  { id: "mixed", label: "Mixed (LTR + STR)" },
  { id: "own_occupy", label: "Own & live-in" },
];
import {
  DEFAULT_PROPERTY_COVER,
  formatBytes,
  optimizeImageFile,
} from "../imageOptimize";
import {
  C,
  DatasetTable,
  FilterChips,
  PercentDistribution,
  ViewModeToggle,
  inr,
  pct,
  type HubViewMode,
  type Segment,
} from "./hub/ModuleAnalytics";

interface PropertyHubProps {
  properties: Property[];
  onAddProperty: (newProp: Property) => void;
  onDeleteProperty: (id: string) => void;
  onDuplicateProperty: (prop: Property) => void;
  onUpdateProperty: (prop: Property) => void;
  userRole: string;
}

type ViewMode = "grid" | "list" | "graphs" | "dataset";
type SortKey = "name" | "rent" | "city" | "status" | "updated";

interface HubPrefs {
  viewMode: ViewMode;
  density: "cozy" | "compact";
  sortBy: SortKey;
  showDeposit: boolean;
  favorites: string[];
}

const PREFS_KEY = "homeos_property_hub_prefs_v1";

const defaultPrefs = (): HubPrefs => ({
  viewMode: "grid",
  density: "cozy",
  sortBy: "name",
  showDeposit: true,
  favorites: [],
});

const STATUS_COLORS: Record<string, string> = {
  Occupied: C.up,
  Vacant: C.warn,
  "Under Maintenance": C.down,
  Listed: C.flat,
};

const TYPE_COLORS = ["#FAFAFA", "#A1A1AA", "#34D399", "#FBBF24", "#FB7185"];

function loadPrefs(): HubPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs();
    return { ...defaultPrefs(), ...JSON.parse(raw) };
  } catch {
    return defaultPrefs();
  }
}

function savePrefs(p: HubPrefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

const inputCls =
  "w-full bg-[#121215] border border-[#1F1F23] focus:border-white/25 focus:outline-none rounded-xl px-3 py-2.5 text-xs text-white font-medium placeholder:text-[#6B7280]";
const labelCls = "text-[10px] font-bold text-[#8E8E93] uppercase tracking-wide";

const STATUS_STYLE: Record<string, string> = {
  Occupied: "bg-white/10 text-white border-white/15",
  Vacant: "bg-white/5 text-[#A1A1AA] border-white/10",
  "Under Maintenance": "bg-amber-500/10 text-amber-400 border-amber-500/25",
  Listed: "bg-white/10 text-white/80 border-white/15",
};

export default function PropertyHub({
  properties,
  onAddProperty,
  onDeleteProperty,
  onDuplicateProperty,
  onUpdateProperty,
  userRole,
}: PropertyHubProps) {
  const isTenant = userRole === "Tenant";
  const [prefs, setPrefs] = useState<HubPrefs>(() => loadPrefs());
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterCity, setFilterCity] = useState("All");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // Deep-link from Command Deck first-run guide
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rv_property_nav_intent");
      if (!raw) return;
      sessionStorage.removeItem("rv_property_nav_intent");
      const intent = JSON.parse(raw) as { openAdd?: boolean };
      if (intent.openAdd) {
        setEditingProp(null);
        setShowAddModal(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Form
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState<Property["type"]>("Residential");
  const [status, setStatus] = useState<Property["status"]>("Occupied");
  const [rentAmount, setRentAmount] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [rooms, setRooms] = useState("2");
  const [bathrooms, setBathrooms] = useState("1");
  const [areaSqFt, setAreaSqFt] = useState("900");
  const [parkingSpots, setParkingSpots] = useState("1");
  const [petFriendly, setPetFriendly] = useState(false);
  const [ownerName, setOwnerName] = useState("");
  const [ownerContact, setOwnerContact] = useState("");
  const [yearBuilt, setYearBuilt] = useState(String(new Date().getFullYear()));
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [amenities, setAmenities] = useState("Power Backup, Water Supply");
  const [rentalModel, setRentalModel] = useState<RentalModel>("long_term");
  const [listingChannels, setListingChannels] = useState<ListingChannel[]>([]);
  const [listingRef, setListingRef] = useState("");
  const [image, setImage] = useState(DEFAULT_PROPERTY_COVER);
  const [imageMeta, setImageMeta] = useState<string>("");
  const [optimizing, setOptimizing] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const updatePrefs = useCallback((patch: Partial<HubPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      savePrefs(next);
      return next;
    });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filterType, filterStatus, filterCity, query, prefs.sortBy]);

  const filtered = useMemo(() => {
    let list = properties.filter((p) => {
      if (filterType !== "All" && p.type !== filterType) return false;
      if (filterStatus !== "All" && p.status !== filterStatus) return false;
      if (filterCity !== "All" && (p.city || "—") !== filterCity) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        const hay = `${p.name} ${p.address} ${p.city} ${(p.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const fav = new Set(prefs.favorites);
    list = [...list].sort((a, b) => {
      // Favorites first
      const af = fav.has(a.id) ? 0 : 1;
      const bf = fav.has(b.id) ? 0 : 1;
      if (af !== bf) return af - bf;
      switch (prefs.sortBy) {
        case "rent":
          return b.rentAmount - a.rentAmount;
        case "city":
          return a.city.localeCompare(b.city);
        case "status":
          return a.status.localeCompare(b.status);
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
    return list;
  }, [properties, filterType, filterStatus, filterCity, query, prefs.sortBy, prefs.favorites]);

  const PAGE_SIZE = prefs.density === "compact" ? 12 : 9;
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const curPage = Math.min(Math.max(1, page), pageCount);
  const pageItems = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const total = properties.length;
    const occupied = properties.filter((p) => p.status === "Occupied").length;
    const vacant = properties.filter((p) => p.status === "Vacant").length;
    const maint = properties.filter((p) => p.status === "Under Maintenance").length;
    const listed = properties.filter((p) => p.status === "Listed").length;
    const rent = properties.reduce((s, p) => s + (p.rentAmount || 0), 0);
    const deposit = properties.reduce((s, p) => s + (p.depositAmount || 0), 0);
    const occPct = total ? Math.round((occupied / total) * 100) : 0;
    const byCity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    properties.forEach((p) => {
      byCity[p.city || "—"] = (byCity[p.city || "—"] || 0) + 1;
      byType[p.type] = (byType[p.type] || 0) + 1;
    });
    const citySegs: Segment[] = Object.entries(byCity)
      .map(([label, value], i) => ({
        key: label,
        label,
        value,
        color: TYPE_COLORS[i % TYPE_COLORS.length],
        filterValue: label,
      }))
      .sort((a, b) => b.value - a.value);
    const statusSegs: Segment[] = (
      [
        ["Occupied", occupied],
        ["Vacant", vacant],
        ["Under Maintenance", maint],
        ["Listed", listed],
      ] as const
    )
      .filter(([, v]) => v > 0)
      .map(([label, value]) => ({
        key: label,
        label,
        value,
        color: STATUS_COLORS[label] || C.flat,
        filterValue: label,
      }));
    const typeSegs: Segment[] = Object.entries(byType).map(([label, value], i) => ({
      key: label,
      label,
      value,
      color: TYPE_COLORS[i % TYPE_COLORS.length],
      filterValue: label,
    }));
    const rentBands = [
      { key: "u20", label: "< ₹20k", min: 0, max: 20000, color: C.up },
      { key: "u40", label: "₹20–40k", min: 20000, max: 40000, color: C.flat },
      { key: "u80", label: "₹40–80k", min: 40000, max: 80000, color: C.warn },
      { key: "o80", label: "₹80k+", min: 80000, max: Infinity, color: C.down },
    ].map((b) => ({
      key: b.key,
      label: b.label,
      value: properties.filter(
        (p) => p.rentAmount >= b.min && p.rentAmount < b.max
      ).length,
      color: b.color,
    }));
    return {
      total,
      occupied,
      vacant,
      maint,
      listed,
      rent,
      deposit,
      occPct,
      statusSegs,
      citySegs,
      typeSegs,
      rentBands: rentBands.filter((b) => b.value > 0),
    };
  }, [properties]);

  const resetForm = () => {
    setEditingProp(null);
    setName("");
    setAddress("");
    setCity("");
    setType("Residential");
    setStatus("Occupied");
    setRentAmount("");
    setDepositAmount("");
    setRooms("2");
    setBathrooms("1");
    setAreaSqFt("900");
    setParkingSpots("1");
    setPetFriendly(false);
    setOwnerName("");
    setOwnerContact("");
    setYearBuilt(String(new Date().getFullYear()));
    setTags("");
    setNotes("");
    setAmenities("Power Backup, Water Supply");
    setRentalModel("long_term");
    setListingChannels([]);
    setListingRef("");
    setImage(DEFAULT_PROPERTY_COVER);
    setImageMeta("");
    setImageError("");
  };

  const startEdit = (p: Property) => {
    setEditingProp(p);
    setName(p.name);
    setAddress(p.address);
    setCity(p.city);
    setType(p.type);
    setStatus(p.status);
    setRentAmount(String(p.rentAmount));
    setDepositAmount(String(p.depositAmount));
    setRooms(String(p.rooms));
    setBathrooms(String(p.bathrooms));
    setAreaSqFt(String(p.areaSqFt));
    setParkingSpots(String(p.parkingSpots));
    setPetFriendly(p.petFriendly);
    setOwnerName(p.ownerName);
    setOwnerContact(p.ownerContact);
    setYearBuilt(String(p.yearBuilt));
    setTags((p.tags || []).join(", "));
    setNotes(p.notes || "");
    setAmenities((p.amenities || []).join(", "));
    setRentalModel(p.rentalModel || "long_term");
    setListingChannels(p.listingChannels || []);
    setListingRef(p.listingRef || "");
    setImage(p.image || DEFAULT_PROPERTY_COVER);
    setImageMeta(p.image?.startsWith("data:") ? "Custom cover (optimized)" : "");
    setImageError("");
    setShowAddModal(true);
  };

  const onPickImage = async (file: File | null) => {
    if (!file) return;
    setImageError("");
    setOptimizing(true);
    try {
      const result = await optimizeImageFile(file, {
        maxEdge: 1280,
        quality: 0.74,
        maxBytes: 180 * 1024,
        mime: "image/jpeg",
      });
      setImage(result.dataUrl);
      setImageMeta(
        `Optimized · ${result.width}×${result.height} · ${formatBytes(result.bytes)}`
      );
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Could not optimize image.");
    } finally {
      setOptimizing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const payload: Property = {
      id: editingProp?.id || `prop-${Date.now()}`,
      name: name.trim(),
      address: address.trim(),
      city: city.trim() || "—",
      type,
      status,
      image: image || DEFAULT_PROPERTY_COVER,
      rentAmount: parseFloat(rentAmount) || 0,
      depositAmount: parseFloat(depositAmount) || 0,
      rooms: parseInt(rooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      areaSqFt: parseInt(areaSqFt) || 500,
      parkingSpots: parseInt(parkingSpots) || 0,
      petFriendly,
      amenities: amenities
        ? amenities.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      ownerName: ownerName.trim() || "Self",
      ownerContact: ownerContact.trim() || "N/A",
      yearBuilt: parseInt(yearBuilt) || new Date().getFullYear(),
      rating: editingProp?.rating ?? 5,
      notes: notes.trim(),
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : ["Portfolio"],
      rentalModel,
      listingChannels: listingChannels.length ? listingChannels : undefined,
      listingRef: listingRef.trim() || undefined,
    };

    if (editingProp) onUpdateProperty(payload);
    else onAddProperty(payload);

    setShowAddModal(false);
    resetForm();
  };

  const toggleFavorite = (id: string) => {
    const set = new Set(prefs.favorites);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    updatePrefs({ favorites: Array.from(set) });
  };

  const imgH = prefs.density === "compact" ? "h-32" : "h-44";

  return (
    <div className="flex-1 flex flex-col gap-5 p-4 sm:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#1F1F23] pb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">
            Housing
          </p>
          <h2 className="text-xl font-black text-white tracking-tight">
            {isTenant ? "My Homes" : "Property Hub"}
          </h2>
          <p className="text-xs text-[#8E8E93] mt-1 font-medium max-w-lg">
            {isTenant
              ? "Every home you’ve lived in — customize covers, track details, keep proof nearby."
              : "Catalog, customize, and operate your portfolio. Uploads are auto-optimized for speed."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ViewModeToggle
            modes={[
              { id: "cards", label: "Grid" },
              { id: "list", label: "List" },
              { id: "graphs", label: "Graphs" },
              { id: "dataset", label: "Dataset" },
            ]}
            value={
              prefs.viewMode === "grid"
                ? "cards"
                : (prefs.viewMode as HubViewMode)
            }
            onChange={(m) =>
              updatePrefs({
                viewMode: m === "cards" ? "grid" : (m as ViewMode),
              })
            }
          />
          <button
            type="button"
            onClick={() => setShowCustomize((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold border border-[#1F1F23] bg-[#121215] text-white hover:border-white/20 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Customize
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#EAEAEA] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {isTenant ? "Add a home" : "Add property"}
          </button>
        </div>
      </div>

      {/* Live occupancy KPIs — % synced to vault */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {[
          {
            l: "Portfolio",
            v: String(stats.total),
            s: `${stats.citySegs.length} cities`,
            c: C.ink,
            on: () => {
              setFilterStatus("All");
              setFilterCity("All");
            },
          },
          {
            l: "Occupancy",
            v: `${stats.occPct}%`,
            s: `${stats.occupied} occupied`,
            c: stats.occPct >= 80 ? C.up : stats.occPct >= 50 ? C.warn : C.down,
            on: () => setFilterStatus("Occupied"),
          },
          {
            l: "Vacant",
            v: String(stats.vacant),
            s: stats.total
              ? `${pct(stats.vacant, stats.total)}% of book`
              : "—",
            c: stats.vacant > 0 ? C.warn : C.up,
            on: () => setFilterStatus("Vacant"),
          },
          {
            l: "Maintenance",
            v: String(stats.maint),
            s: stats.total ? `${pct(stats.maint, stats.total)}%` : "—",
            c: stats.maint > 0 ? C.down : C.flat,
            on: () => setFilterStatus("Under Maintenance"),
          },
          {
            l: "Monthly rent roll",
            v: inr(stats.rent),
            s: "Sum of unit rents",
            c: C.ink,
            on: undefined,
          },
          {
            l: "Deposits",
            v: inr(stats.deposit),
            s: "Booked deposits",
            c: C.warn,
            on: undefined,
          },
        ].map((s) => (
          <button
            key={s.l}
            type="button"
            disabled={!s.on}
            onClick={() => s.on?.()}
            className={`rounded-xl border border-[#1F1F23] bg-[#0A0A0C] px-3 py-2.5 text-left min-h-[78px] flex flex-col justify-between ${
              s.on ? "hover:border-white/25 cursor-pointer" : "cursor-default"
            }`}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#6B7280]">
              {s.l}
            </p>
            <div>
              <p
                className="text-sm font-black tabular-nums mt-0.5"
                style={{ color: s.c }}
              >
                {s.v}
              </p>
              <p className="text-[10px] text-[#71717A] font-medium truncate">{s.s}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Customize panel */}
      {showCustomize && (
        <div className="rounded-2xl border border-white/10 bg-[#0A0A0C] p-4 flex flex-col gap-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Hub layout
            </h3>
            <button
              type="button"
              onClick={() => setShowCustomize(false)}
              className="text-[#6B7280] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <p className={labelCls + " mb-1.5"}>View</p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "grid" as const, icon: LayoutGrid, t: "Grid" },
                    { id: "list" as const, icon: List, t: "List" },
                    { id: "graphs" as const, icon: BarChart3, t: "Graphs" },
                    { id: "dataset" as const, icon: Table2, t: "Data" },
                  ] as const
                ).map(({ id, icon: Icon, t }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => updatePrefs({ viewMode: id })}
                    className={`flex-1 min-w-[4.5rem] inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold border transition-colors ${
                      prefs.viewMode === id
                        ? "bg-white text-black border-white"
                        : "bg-[#121215] text-[#8E8E93] border-[#1F1F23]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={labelCls + " mb-1.5"}>Density</p>
              <div className="flex gap-1.5">
                {(["cozy", "compact"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => updatePrefs({ density: d })}
                    className={`flex-1 py-2 rounded-lg text-[11px] font-bold border capitalize transition-colors ${
                      prefs.density === d
                        ? "bg-white text-black border-white"
                        : "bg-[#121215] text-[#8E8E93] border-[#1F1F23]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className={labelCls + " mb-1.5"}>Sort by</p>
              <select
                value={prefs.sortBy}
                onChange={(e) => updatePrefs({ sortBy: e.target.value as SortKey })}
                className={inputCls}
              >
                <option value="name">Name</option>
                <option value="rent">Rent (high → low)</option>
                <option value="city">City</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 w-full rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.showDeposit}
                  onChange={(e) => updatePrefs({ showDeposit: e.target.checked })}
                  className="accent-white"
                />
                <span className="text-[11px] font-bold text-white">Show deposits</span>
              </label>
            </div>
          </div>
          <p className="text-[10px] text-[#6B7280] font-medium">
            Preferences save on this device. Favorites pin to the top of your list.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center justify-between rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, city, tags…"
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] font-bold text-[#6B7280] uppercase">Type</span>
          {["All", ...PROPERTY_TYPES].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                filterType === t
                  ? "bg-white text-black"
                  : "bg-[#121215] text-[#8E8E93] border border-[#1F1F23] hover:text-white"
              }`}
            >
              {t === "Student Housing"
                ? "Student"
                : t === "Serviced Apartment"
                  ? "Serviced"
                  : t === "Holiday Home"
                    ? "Holiday"
                    : t === "Society Unit"
                      ? "Society"
                      : t}
            </button>
          ))}
        </div>
        {!isTenant && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[9px] font-bold text-[#6B7280] uppercase">Status</span>
            {["All", "Occupied", "Vacant", "Under Maintenance", "Listed"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                  filterStatus === s
                    ? "bg-white text-black"
                    : "bg-[#121215] text-[#8E8E93] border border-[#1F1F23] hover:text-white"
                }`}
              >
                {s === "Under Maintenance" ? "Maint." : s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* City filter chips */}
      {stats.citySegs.length > 1 && (
        <FilterChips
          label="City"
          value={filterCity}
          onChange={setFilterCity}
          options={[
            { id: "All", label: "All cities", count: properties.length },
            ...stats.citySegs.map((c) => ({
              id: c.key,
              label: c.label,
              count: c.value,
            })),
          ]}
        />
      )}

      {/* Graphs — occupancy %, city mix, type, rent bands */}
      {prefs.viewMode === "graphs" && (
        <div className="grid lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4">
            <PercentDistribution
              title="Occupancy status"
              subtitle={`${stats.occPct}% occupied · click to filter`}
              segments={stats.statusSegs}
              total={stats.total}
              activeKey={filterStatus === "All" ? null : filterStatus}
              onSelect={(seg) =>
                setFilterStatus(
                  filterStatus === seg.filterValue ? "All" : seg.filterValue || "All"
                )
              }
            />
          </div>
          <div className="lg:col-span-4">
            <PercentDistribution
              title="By city"
              subtitle="Portfolio geographic mix"
              segments={stats.citySegs.slice(0, 8)}
              total={stats.total}
              activeKey={filterCity === "All" ? null : filterCity}
              onSelect={(seg) =>
                setFilterCity(
                  filterCity === seg.filterValue ? "All" : seg.filterValue || "All"
                )
              }
            />
          </div>
          <div className="lg:col-span-4">
            <PercentDistribution
              title="By type"
              subtitle="Residential · commercial · more"
              segments={stats.typeSegs}
              total={stats.total}
              activeKey={filterType === "All" ? null : filterType}
              onSelect={(seg) =>
                setFilterType(
                  filterType === seg.filterValue ? "All" : seg.filterValue || "All"
                )
              }
            />
          </div>
          <div className="lg:col-span-6">
            <PercentDistribution
              title="Rent bands"
              subtitle="Unit count by monthly rent"
              segments={stats.rentBands}
              total={stats.total}
            />
          </div>
          <div className="lg:col-span-6 rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#71717A]">
              Filtered set
            </p>
            <h3 className="text-sm font-black text-white mb-2">
              {filtered.length} of {properties.length} homes
            </h3>
            <div className="space-y-1.5 max-h-[220px] overflow-y-auto scrollbar-none">
              {filtered.slice(0, 12).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedProperty(p)}
                  className="w-full flex items-center justify-between gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-2 text-left hover:border-white/20 cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="text-[12px] font-bold text-white block truncate">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-[#71717A]">
                      {p.city} · {p.type}
                      {p.rentalModel === "short_term"
                        ? " · Short-stay"
                        : p.rentalModel === "mixed"
                          ? " · Mixed"
                          : ""}
                      {(p.listingChannels || []).length > 0
                        ? ` · ${(p.listingChannels || []).slice(0, 2).join(", ")}`
                        : ""}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className="text-[10px] font-bold block"
                      style={{ color: STATUS_COLORS[p.status] || C.flat }}
                    >
                      {p.status}
                    </span>
                    <span className="text-[11px] font-black text-white tabular-nums">
                      {inr(p.rentAmount)}
                    </span>
                  </span>
                </button>
              ))}
              {!filtered.length && (
                <p className="text-[12px] text-[#71717A] py-6 text-center">
                  No homes match filters
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dataset table */}
      {prefs.viewMode === "dataset" && (
        <DatasetTable
          columns={[
            { key: "name", label: "Property" },
            { key: "city", label: "City" },
            { key: "type", label: "Type" },
            { key: "status", label: "Status" },
            { key: "rent", label: "Rent", align: "right" },
            { key: "deposit", label: "Deposit", align: "right" },
            { key: "rooms", label: "Beds", align: "right" },
            { key: "area", label: "Sq.ft", align: "right" },
          ]}
          rows={filtered.map((p) => ({
            id: p.id,
            tone: STATUS_COLORS[p.status] || C.flat,
            cells: {
              name: <span className="font-semibold text-white">{p.name}</span>,
              city: <span className="text-[#8E8E93]">{p.city}</span>,
              type: <span className="text-[#8E8E93]">{p.type}</span>,
              status: p.status,
              rent: inr(p.rentAmount),
              deposit: inr(p.depositAmount),
              rooms: p.rooms,
              area: (p.areaSqFt || 0).toLocaleString("en-IN"),
            },
          }))}
          onRowClick={(id) => {
            const p = properties.find((x) => x.id === id);
            if (p) setSelectedProperty(p);
          }}
          empty="No properties match current filters"
        />
      )}

      {/* Grid / List */}
      {(prefs.viewMode === "grid" || prefs.viewMode === "list") && pageItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#1F1F23] bg-[#0A0A0C] py-16 text-center">
          <Building2 className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm font-black text-white">
            {properties.length === 0 ? "No homes yet" : "No properties match"}
          </p>
          <p className="text-xs text-[#6B7280] mt-1 font-medium max-w-sm mx-auto">
            {properties.length === 0
              ? "Add the home you live in or manage — it unlocks leases, utilities, and payments on the Command Deck."
              : "Adjust filters or clear search to see your portfolio again."}
          </p>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-black"
          >
            <Plus className="w-3.5 h-3.5" />
            {properties.length === 0
              ? isTenant
                ? "Add your first home"
                : "Add first property"
              : "Add property"}
          </button>
        </div>
      ) : prefs.viewMode === "list" ? (
        <div className="flex flex-col gap-2">
          {pageItems.map((p) => (
            <article
              key={p.id}
              className="flex gap-3 sm:gap-4 rounded-2xl border border-[#1F1F23] bg-[#0A0A0C] p-2.5 sm:p-3 hover:border-white/15 transition-colors"
            >
              <div className="relative w-24 sm:w-36 h-20 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-[#121215]">
                <img
                  src={p.image || DEFAULT_PROPERTY_COVER}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-white truncate">{p.name}</h3>
                    <p className="text-[11px] text-[#6B7280] font-medium truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {p.city} · {p.address}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase shrink-0 ${
                      STATUS_STYLE[p.status] || STATUS_STYLE.Vacant
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#8E8E93] font-semibold">
                  <span className="text-white font-black">
                    ₹{p.rentAmount.toLocaleString()}/mo
                  </span>
                  <span>
                    {p.rooms} bed · {p.bathrooms} bath · {p.areaSqFt} sqft
                  </span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleFavorite(p.id)}
                  className="p-2 rounded-lg border border-[#1F1F23] hover:border-white/20"
                  title="Favorite"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      prefs.favorites.includes(p.id)
                        ? "fill-white text-white"
                        : "text-[#6B7280]"
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(p)}
                  className="p-2 rounded-lg border border-[#1F1F23] hover:border-white/20 text-white"
                  title="Edit"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDuplicateProperty(p)}
                  className="p-2 rounded-lg border border-[#1F1F23] hover:border-white/20 text-white"
                  title="Duplicate"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteProperty(p.id)}
                  className="p-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div
          className={`grid grid-cols-1 md:grid-cols-2 ${
            prefs.density === "compact" ? "xl:grid-cols-4" : "xl:grid-cols-3"
          } gap-4`}
        >
          {pageItems.map((p) => (
            <article
              key={p.id}
              className="group bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl overflow-hidden flex flex-col hover:border-white/15 transition-colors"
            >
              <div className={`relative ${imgH} w-full bg-[#121215]`}>
                <img
                  src={p.image || DEFAULT_PROPERTY_COVER}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                  <span className="bg-black/70 text-white text-[9px] font-bold px-2 py-1 rounded-md border border-white/10 uppercase">
                    {p.type}
                  </span>
                  {!isTenant && (
                    <span
                      className={`text-[9px] font-bold px-2 py-1 rounded-md border uppercase ${
                        STATUS_STYLE[p.status] || STATUS_STYLE.Vacant
                      }`}
                    >
                      {p.status}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(p.id)}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-black/60 border border-white/10 hover:bg-black/80"
                  title="Favorite"
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      prefs.favorites.includes(p.id)
                        ? "fill-white text-white"
                        : "text-white/70"
                    }`}
                  />
                </button>
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
                  <h3 className="text-sm font-black text-white leading-snug line-clamp-2 drop-shadow">
                    {p.name}
                  </h3>
                  {p.rating > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white bg-black/50 border border-white/10 px-1.5 py-0.5 rounded-md shrink-0">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      {p.rating}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-3.5 flex-1 flex flex-col gap-3">
                <p className="text-[11px] text-[#8E8E93] font-medium flex items-start gap-1 line-clamp-2">
                  <MapPin className="w-3.5 h-3.5 text-white/40 shrink-0 mt-0.5" />
                  {p.city} · {p.address}
                </p>

                {(p.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="text-[9px] font-bold text-white/50 border border-white/10 px-1.5 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-1.5 rounded-xl border border-[#1F1F23] bg-[#121215]/80 p-2 text-center">
                  {[
                    { icon: BedDouble, v: `${p.rooms}` },
                    { icon: ShowerHead, v: `${p.bathrooms}` },
                    { icon: Maximize2, v: `${p.areaSqFt}` },
                    { icon: Car, v: `${p.parkingSpots}` },
                  ].map(({ icon: Icon, v }, i) => (
                    <div key={i} className="flex flex-col items-center gap-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#6B7280]" />
                      <span className="text-[10px] font-bold text-white">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-end border-t border-[#1F1F23] pt-2.5">
                  <div>
                    <span className="text-[9px] text-[#6B7280] uppercase font-bold block">
                      Monthly rent
                    </span>
                    <span className="text-sm font-black text-white tabular-nums">
                      ₹{p.rentAmount.toLocaleString()}
                    </span>
                  </div>
                  {prefs.showDeposit && (
                    <div className="text-right">
                      <span className="text-[9px] text-[#6B7280] uppercase font-bold block">
                        Deposit
                      </span>
                      <span className="text-xs font-bold text-white/80 tabular-nums">
                        ₹{p.depositAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProperty(selectedProperty?.id === p.id ? null : p)
                    }
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border border-[#1F1F23] bg-[#121215] text-white hover:border-white/20 transition-colors"
                  >
                    {selectedProperty?.id === p.id ? "Hide details" : "Details"}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="p-2 rounded-xl border border-[#1F1F23] bg-[#121215] text-white hover:border-white/20"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateProperty(p)}
                    className="p-2 rounded-xl border border-[#1F1F23] bg-[#121215] text-white hover:border-white/20"
                    title="Duplicate"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProperty(p.id)}
                    className="p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedProperty?.id === p.id && (
                  <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3 space-y-2 text-[11px] animate-fadeIn">
                    <p className="text-[9px] font-bold uppercase text-[#6B7280]">Notes</p>
                    <p className="text-[#A1A1AA] font-medium leading-relaxed">
                      {p.notes || "No notes yet."}
                    </p>
                    {(p.amenities || []).length > 0 && (
                      <>
                        <p className="text-[9px] font-bold uppercase text-[#6B7280] pt-1">
                          Amenities
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {p.amenities.map((a) => (
                            <span
                              key={a}
                              className="text-[10px] font-semibold text-white/70 border border-white/10 rounded-md px-1.5 py-0.5"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    <p className="text-[#6B7280] pt-1">
                      Owner: <span className="text-white/80">{p.ownerName}</span>
                      {p.petFriendly ? " · Pets OK" : ""}
                      {p.yearBuilt ? ` · Built ${p.yearBuilt}` : ""}
                    </p>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {(prefs.viewMode === "grid" || prefs.viewMode === "list") &&
        filtered.length > PAGE_SIZE && (
          <Pagination
            page={curPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPage={setPage}
            label="properties"
          />
        )}

      {/* Add / Edit modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#0A0A0C] border border-[#1F1F23] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#1F1F23] bg-[#0A0A0C]/95 backdrop-blur px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/70" />
                <h3 className="text-sm font-black text-white">
                  {editingProp ? "Edit property" : isTenant ? "Add a home" : "Add property"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="text-[#8E8E93] hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              {/* Cover image upload */}
              <div className="rounded-xl border border-[#1F1F23] overflow-hidden bg-[#121215]">
                <div className="relative h-36 sm:h-40">
                  <img
                    src={image || DEFAULT_PROPERTY_COVER}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={optimizing}
                      onClick={() => fileRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold bg-white text-black hover:bg-[#EAEAEA] disabled:opacity-60"
                    >
                      {optimizing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      {optimizing ? "Optimizing…" : "Upload cover"}
                    </button>
                    {image.startsWith("data:") && (
                      <button
                        type="button"
                        onClick={() => {
                          setImage(DEFAULT_PROPERTY_COVER);
                          setImageMeta("");
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-[11px] font-bold border border-white/20 text-white bg-black/40"
                      >
                        Reset
                      </button>
                    )}
                    {imageMeta && (
                      <span className="text-[10px] font-semibold text-white/70 bg-black/50 border border-white/10 rounded-md px-2 py-1">
                        {imageMeta}
                      </span>
                    )}
                  </div>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/*"
                  className="hidden"
                  onChange={(e) => onPickImage(e.target.files?.[0] || null)}
                />
                <p className="px-3 py-2 text-[10px] text-[#6B7280] font-medium flex items-center gap-1.5 border-t border-[#1F1F23]">
                  <ImagePlus className="w-3 h-3 shrink-0" />
                  Images are resized (max ~1280px) and compressed to JPEG under ~180 KB automatically
                  — keeps the hub fast.
                </p>
                {imageError && (
                  <p className="px-3 pb-2 text-[11px] font-semibold text-red-400">{imageError}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className={labelCls}>Name / unit</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Riverside Apt 4B"
                  />
                </div>
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className={labelCls}>Address</label>
                  <input
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputCls}
                    placeholder="Street, locality"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>City</label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={inputCls}
                    placeholder="City"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Category</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as Property["type"])}
                    className={inputCls}
                  >
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Rental model</label>
                  <select
                    value={rentalModel}
                    onChange={(e) => setRentalModel(e.target.value as RentalModel)}
                    className={inputCls}
                  >
                    {RENTAL_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Property["status"])}
                    className={inputCls}
                  >
                    <option value="Occupied">Occupied</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Listed">Listed</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Year built</label>
                  <input
                    type="number"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>
                    {rentalModel === "short_term"
                      ? "Avg monthly yield (₹)"
                      : "Monthly rent (₹)"}
                  </label>
                  <input
                    type="number"
                    value={rentAmount}
                    onChange={(e) => setRentAmount(e.target.value)}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Deposit</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className={inputCls}
                    placeholder="0"
                  />
                </div>
              </div>

              {(rentalModel === "short_term" || rentalModel === "mixed") && (
                <div className="rounded-xl border border-[#1F1F23] bg-[#121215] p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase text-[#8E8E93]">
                    Listing channels (Airbnb, etc.)
                  </p>
                  <p className="text-[10px] text-[#52525B] font-medium leading-snug">
                    Mark where this unit is listed so channel income and platform fees
                    stay tied to the right home.
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {LISTING_CHANNELS.map((ch) => {
                      const on = listingChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            setListingChannels((prev) =>
                              on ? prev.filter((c) => c !== ch) : [...prev, ch]
                            )
                          }
                          className={`h-8 px-2.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            on
                              ? "bg-white text-black border-white"
                              : "bg-[#0A0A0C] border-[#1F1F23] text-[#8E8E93] hover:text-white"
                          }`}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    <label className={labelCls}>Listing ID / URL (optional)</label>
                    <input
                      value={listingRef}
                      onChange={(e) => setListingRef(e.target.value)}
                      className={inputCls}
                      placeholder="Airbnb listing # or booking link"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2 rounded-xl border border-[#1F1F23] bg-[#121215] p-3">
                {[
                  { l: "Beds", v: rooms, s: setRooms },
                  { l: "Baths", v: bathrooms, s: setBathrooms },
                  { l: "SqFt", v: areaSqFt, s: setAreaSqFt },
                  { l: "Parking", v: parkingSpots, s: setParkingSpots },
                ].map(({ l, v, s }) => (
                  <div key={l} className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold text-[#6B7280] uppercase">{l}</span>
                    <input
                      type="number"
                      value={v}
                      onChange={(e) => s(e.target.value)}
                      className="bg-[#0A0A0C] border border-[#1F1F23] rounded-lg p-2 text-xs text-white"
                    />
                  </div>
                ))}
              </div>

              <label className="flex items-center justify-between rounded-xl border border-[#1F1F23] bg-[#121215] px-3 py-3 cursor-pointer">
                <span className="flex items-center gap-2 text-xs font-bold text-white">
                  <Dog className="w-4 h-4 text-white/50" />
                  Pet friendly
                </span>
                <input
                  type="checkbox"
                  checked={petFriendly}
                  onChange={(e) => setPetFriendly(e.target.checked)}
                  className="accent-white"
                />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Owner name</label>
                  <input
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className={inputCls}
                    placeholder="Self or landlord"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className={labelCls}>Owner contact</label>
                  <input
                    value={ownerContact}
                    onChange={(e) => setOwnerContact(e.target.value)}
                    className={inputCls}
                    placeholder="Phone or email"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Amenities (comma-separated)</label>
                <input
                  value={amenities}
                  onChange={(e) => setAmenities(e.target.value)}
                  className={inputCls}
                  placeholder="Elevator, Gym, Pool"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Tags (comma-separated)</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className={inputCls}
                  placeholder="Balcony, High-rise"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={`${inputCls} min-h-[72px] resize-y`}
                  placeholder="Anything to remember about this home…"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#1F1F23]">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold border border-[#1F1F23] text-[#8E8E93] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={optimizing}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-white text-black hover:bg-[#EAEAEA] disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingProp ? "Save changes" : "Save property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
