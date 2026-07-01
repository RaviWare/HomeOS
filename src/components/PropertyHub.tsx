import React, { useState } from 'react';
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
  Calendar,
  Layers,
  History,
  Star,
  FileCheck
} from 'lucide-react';
import { Pencil } from 'lucide-react';
import { Property } from '../types';
import Pagination from './Pagination';

interface PropertyHubProps {
  properties: Property[];
  onAddProperty: (newProp: Property) => void;
  onDeleteProperty: (id: string) => void;
  onDuplicateProperty: (prop: Property) => void;
 onUpdateProperty: (prop: Property) => void;
 userRole: string;
}

export default function PropertyHub({
  properties,
  onAddProperty,
  onDeleteProperty,
  onDuplicateProperty,
 onUpdateProperty,
 userRole
}: PropertyHubProps) {
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
 const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
 const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  // New property form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [type, setType] = useState<'Residential' | 'Commercial' | 'Co-Living' | 'Student Housing'>('Residential');
  const [status, setStatus] = useState<'Occupied' | 'Vacant' | 'Under Maintenance' | 'Listed'>('Occupied');
  const [rentAmount, setRentAmount] = useState('45000');
  const [depositAmount, setDepositAmount] = useState('150000');
  const [rooms, setRooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('2');
  const [areaSqFt, setAreaSqFt] = useState('1200');
  const [parkingSpots, setParkingSpots] = useState('1');
  const [petFriendly, setPetFriendly] = useState(true);
  const [ownerName, setOwnerName] = useState('');
  const [ownerContact, setOwnerContact] = useState('');
  const [yearBuilt, setYearBuilt] = useState('2022');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const filtered = properties.filter((p) => {
    if (filterType !== 'All' && p.type !== filterType) return false;
    if (filterStatus !== 'All' && p.status !== filterStatus) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;

    const newProp: Property = {
      id: `prop-${Date.now()}`,
      name,
      address,
      city,
      type,
      status,
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&auto=format&fit=crop&q=60',
      rentAmount: parseFloat(rentAmount) || 0,
      depositAmount: parseFloat(depositAmount) || 0,
      rooms: parseInt(rooms) || 1,
      bathrooms: parseInt(bathrooms) || 1,
      areaSqFt: parseInt(areaSqFt) || 500,
      parkingSpots: parseInt(parkingSpots) || 0,
      petFriendly,
      amenities: ['Power Backup', 'Water Supply', 'High-speed Fiber'],
      ownerName: ownerName || 'Self',
      ownerContact: ownerContact || 'N/A',
      yearBuilt: parseInt(yearBuilt) || 2022,
      rating: 5.0,
      notes,
      tags: tags ? tags.split(',').map((t) => t.trim()) : ['Portfolio']
    };

    if (editingProp) {
 onUpdateProperty({ ...editingProp, name, address, city, type, status, rentAmount: parseFloat(rentAmount) || 0, depositAmount: parseFloat(depositAmount) || 0, rooms: parseInt(rooms) || 1, bathrooms: parseInt(bathrooms) || 1, areaSqFt: parseInt(areaSqFt) || 500, parkingSpots: parseInt(parkingSpots) || 0, petFriendly, ownerName: ownerName || editingProp.ownerName, ownerContact: ownerContact || editingProp.ownerContact, yearBuilt: parseInt(yearBuilt) || 2022, notes, tags: tags ? tags.split(",").map((t) => t.trim()) : editingProp.tags });
 } else {
 onAddProperty(newProp);
 }
    setShowAddModal(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setType('Residential');
    setStatus('Occupied');
    setRentAmount('45000');
    setDepositAmount('150000');
    setRooms('3');
    setBathrooms('2');
    setAreaSqFt('1200');
    setParkingSpots('1');
    setPetFriendly(true);
    setOwnerName('');
    setOwnerContact('');
    setTags('');
    setNotes('');
  };

  const startEdit = (p: Property) => {
 setEditingProp(p);
 setName(p.name); setAddress(p.address); setCity(p.city); setType(p.type); setStatus(p.status);
 setRentAmount(String(p.rentAmount)); setDepositAmount(String(p.depositAmount));
 setRooms(String(p.rooms)); setBathrooms(String(p.bathrooms)); setAreaSqFt(String(p.areaSqFt)); setParkingSpots(String(p.parkingSpots));
 setPetFriendly(p.petFriendly); setOwnerName(p.ownerName); setOwnerContact(p.ownerContact);
 setYearBuilt(String(p.yearBuilt)); setTags((p.tags || []).join(", ")); setNotes(p.notes || "");
 setShowAddModal(true);
 };
 // Mock timeline events for properties
  const getTimelineEvents = (pId: string) => {
    if (pId === 'prop-1') {
      return [
        { date: 'June 01, 2026', title: 'Monthly Rental Settlement', desc: 'UPI payment of ₹45,000 received from Siddharth Roy.', type: 'payment' },
        { date: 'May 05, 2026', title: 'Safety & Pest Ingress Inspection', desc: 'Annual compliance review completed by Society Admin.', type: 'inspection' },
        { date: 'Jan 15, 2025', title: 'Tenant Siddharth Roy - Move In', desc: '12-month residential contract executed with Vikram Malhotra.', type: 'move' }
      ];
    }
    return [
      { date: 'June 18, 2026', title: 'Solar Maintenance Resolved', desc: 'Backup battery service completed by SunPower Solutions.', type: 'maint' },
      { date: 'June 02, 2026', title: 'Monthly Lease Deposit Received', desc: '₹85,000 credit recorded from Meera Krishnan.', type: 'payment' },
      { date: 'June 01, 2024', title: 'Move-in & Onboarding Done', desc: 'Meera Krishnan signed lease contract under notary CERT-00982.', type: 'move' }
    ];
  };

  const PAGE_SIZE = 9; const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)); const curPage = Math.min(Math.max(1, page), pageCount); const pageItems = filtered.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
 return (
    <div className="flex-1 flex flex-col gap-6 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#374151] pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">{userRole === "Tenant" ? "My Homes" : "Property Lifecycle Hub"}</h2>
          <p className="text-xs text-[#9CA3AF]">{userRole === "Tenant" ? "Every home you have lived in, with leases, payments, and memories in one place." : "Deploy, duplicate, and catalog residential assets and physical portfolios."}</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#2563EB]/15 cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{userRole === "Tenant" ? "Add a Home" : "Add New Property"}</span>
        </button>
      </div>

      {/* Filter Bars */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-[#111827] border border-[#374151] p-3 rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase px-1">Type</span>
          <div className="flex gap-1.5">
            {['All', 'Residential', 'Commercial', 'Co-Living'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterType === t ? 'bg-[#2563EB] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {userRole !== "Tenant" && (
 <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-[#9CA3AF] uppercase px-1">Status</span>
          <div className="flex gap-1.5">
            {['All', 'Occupied', 'Vacant', 'Under Maintenance'].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterStatus === s ? 'bg-[#2563EB] text-white' : 'bg-[#1F2937] text-[#9CA3AF] hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>)}
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pageItems.map((p) => (
          <div
            key={p.id}
            className={`bg-[#111827] border rounded-2xl overflow-hidden shadow-xl transition-all flex flex-col ${
              selectedProperty?.id === p.id ? 'border-[#2563EB] ring-1 ring-[#2563EB]' : 'border-[#374151] hover:border-[#4B5563]'
            }`}
          >
            {/* Image Capsule */}
            <div className="relative h-44 w-full">
              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111827] to-transparent"></div>
              
              {/* Type and status badge */}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-[#111827]/90 text-white text-[9px] font-bold px-2 py-1 rounded-md border border-[#374151] uppercase">
                  {p.type}
                </span>
                {userRole !== "Tenant" && (
 <span className={`text-[9px] font-bold px-2 py-1 rounded-md border uppercase ${
                  p.status === 'Occupied'
                    ? 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40'
                    : p.status === 'Vacant'
                    ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444]/40'
                    : 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B]/40'
                }`}>
                  {p.status}
                </span>)}
              </div>

              {/* Star Rating */}
              <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-[#111827]/80 border border-[#374151]/50 px-2 py-0.5 rounded-md text-[#F59E0B]">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-[10px] font-bold text-white">{p.rating}</span>
              </div>
            </div>

            {/* Content Details */}
            <div className="p-4 flex-1 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex gap-1">
                  {p.tags.map((tag) => (
                    <span key={tag} className="text-[9px] text-[#2563EB] font-bold uppercase tracking-wider bg-[#2563EB]/10 px-1.5 py-0.5 rounded-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
                <h3 className="font-bold text-sm text-white tracking-tight leading-snug line-clamp-1">{p.name}</h3>
                <div className="flex items-start gap-1 text-[11px] text-[#9CA3AF] font-medium leading-normal">
                  <MapPin className="w-3.5 h-3.5 text-[#EF4444] shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{p.address}</span>
                </div>
              </div>

              {/* Grid Specifications */}
              <div className="grid grid-cols-4 gap-2 bg-[#1F2937]/50 border border-[#374151]/40 p-2.5 rounded-xl text-center">
                <div className="flex flex-col items-center">
                  <BedDouble className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="text-[10px] font-bold text-white mt-1">{p.rooms} Bed</span>
                </div>
                <div className="flex flex-col items-center">
                  <ShowerHead className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="text-[10px] font-bold text-white mt-1">{p.bathrooms} Bath</span>
                </div>
                <div className="flex flex-col items-center">
                  <Maximize2 className="w-3.5 h-3.5 text-[#9CA3AF]" />
                  <span className="text-[10px] font-bold text-white mt-1">{p.areaSqFt} SqFt</span>
                </div>
                <div className="flex flex-col items-center">
                  <Car className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="text-[10px] font-bold text-white mt-1">{p.parkingSpots} Park</span>
                </div>
              </div>

              {/* Financial values */}
              <div className="flex justify-between items-center border-t border-[#374151]/50 pt-3">
                <div>
                  <span className="text-[9px] text-[#9CA3AF] uppercase block font-bold">Monthly Rent</span>
                  <span className="text-sm font-black text-white">₹{p.rentAmount.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[9px] text-[#9CA3AF] uppercase block font-bold text-right">Refundable Deposit</span>
                  <span className="text-xs font-extrabold text-[#F59E0B] block text-right">₹{p.depositAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Micro-actions */}
              <div className="flex items-center gap-1.5 border-t border-[#374151]/50 pt-3">
                <button
                  onClick={() => setSelectedProperty(selectedProperty?.id === p.id ? null : p)}
                  className="flex-1 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] text-white py-2 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Timeline</span>
                </button>
 <button onClick={() => startEdit(p)} className="p-2 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] rounded-xl text-white transition-all cursor-pointer" title="Edit details"><Pencil className="w-3.5 h-3.5" /></button>
                <button
                  onClick={() => onDuplicateProperty(p)}
                  className="p-2 bg-[#1F2937] hover:bg-[#374151] border border-[#374151] rounded-xl text-white transition-all cursor-pointer"
                  title="Duplicate asset to list a new unit"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteProperty(p.id)}
                  className="p-2 bg-[#1F2937]/50 border border-red-500/20 hover:bg-red-500/10 rounded-xl text-red-400 transition-all cursor-pointer"
                  title="Archive Property"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Expandable Timeline section if selected */}
            {selectedProperty?.id === p.id && (
              <div className="bg-[#1F2937] border-t border-[#374151] p-4 flex flex-col gap-3 animate-fadeIn">
                <span className="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider block border-b border-[#374151] pb-1.5">
                  Asset Lifecycle Records
                </span>
                <div className="flex flex-col gap-3">
                  {getTimelineEvents(p.id).map((evt, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start">
                      <div className="p-1 bg-[#111827] border border-[#374151] rounded-md text-xs text-stone-300">
                        🗓️
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-white font-extrabold block">{evt.title}</span>
                        <span className="text-[9px] text-[#9CA3AF] block leading-relaxed mt-0.5">{evt.desc}</span>
                        <span className="text-[8px] text-[#2563EB] font-bold block mt-1">{evt.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      <Pagination page={curPage} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} label="properties" />
 </div>

      {/* ADD NEW PROPERTY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#374151] rounded-2xl max-w-2xl w-full p-6 max-h-[85vh] overflow-y-auto shadow-2xl relative flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-[#374151] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#2563EB]" />
                <h3 className="font-bold text-white">{editingProp ? "Edit Property" : "List a New Property Asset"}</h3>
              </div>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-[#9CA3AF] hover:text-white text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Property Name / Unit</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] rounded-xl p-3 text-xs text-white"
                  placeholder="e.g. Prestige Lake Ridge - Flat 304"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Physical Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] rounded-xl p-3 text-xs text-white"
                  placeholder="Street, Locality, Landmark"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Asset Category</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] rounded-xl p-3 text-xs text-white"
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Co-Living">Co-Living</option>
                  <option value="Student Housing">Student Housing</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Active Status</label>
                <select
                  value={status}
                  onChange={(e: any) => setStatus(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] rounded-xl p-3 text-xs text-white"
                >
                  <option value="Occupied">Occupied</option>
                  <option value="Vacant">Vacant</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Listed">Listed</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Monthly Rent (₹)</label>
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Refundable Deposit (₹)</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] focus:border-[#2563EB] rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 md:col-span-2 bg-[#1F2937] p-3 rounded-xl border border-[#374151]/50">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">Bedrooms</span>
                  <input
                    type="number"
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">Bathrooms</span>
                  <input
                    type="number"
                    value={bathrooms}
                    onChange={(e) => setBathrooms(e.target.value)}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">Area SqFt</span>
                  <input
                    type="number"
                    value={areaSqFt}
                    onChange={(e) => setAreaSqFt(e.target.value)}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-2 text-xs text-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-[#9CA3AF] uppercase">Parking</span>
                  <input
                    type="number"
                    value={parkingSpots}
                    onChange={(e) => setParkingSpots(e.target.value)}
                    className="bg-[#111827] border border-[#374151] rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between md:col-span-2 bg-[#1F2937] p-3 rounded-xl border border-[#374151]/50">
                <div className="flex items-center gap-2">
                  <Dog className="w-4 h-4 text-[#8B5CF6]" />
                  <span className="text-xs font-bold text-white">Allow domestic pets</span>
                </div>
                <input
                  type="checkbox"
                  checked={petFriendly}
                  onChange={(e) => setPetFriendly(e.target.checked)}
                  className="w-4 h-4 accent-[#2563EB]"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] rounded-xl p-3 text-xs text-white"
                  placeholder="e.g. Balcony, High-Rise, Central-Aircon"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-[#9CA3AF] uppercase">Internal Landlord Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="bg-[#1F2937] border border-[#374151] rounded-xl p-3 text-xs text-white h-20"
                  placeholder="Add premium descriptions, utility details, or compliance requirements."
                />
              </div>

              <div className="flex gap-3 md:col-span-2 border-t border-[#374151] pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-[#2563EB] text-white hover:bg-[#1d4ed8]"
                >
                  Publish Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
