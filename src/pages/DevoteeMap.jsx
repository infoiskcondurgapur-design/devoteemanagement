import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useDevotees } from '../context/DevoteeContext';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    MapPin,
    Search,
    Compass,
    Layers,
    User,
    Phone,
    MessageSquare,
    ExternalLink,
    Filter,
    X,
    Sparkles,
    Shield,
    Crown,
    Heart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import ErrorBoundary from '../components/ErrorBoundary';
import { openWhatsApp } from '../services/whatsappLink';

// Center point: Sri Sri Radha Govinda Mandir (ISKCON Durgapur City Center)
const TEMPLE_CENTER = {
    lat: 23.5204,
    lng: 87.3119,
    name: 'Sri Sri Radha Govinda Mandir',
    address: 'ISKCON Durgapur, City Center, Durgapur, West Bengal 713216'
};

// Available Tile Layers
const TILE_LAYERS = {
    dark: {
        name: 'Eye Comfort (Dark)',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
    },
    streets: {
        name: 'Street View',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    },
    satellite: {
        name: 'Satellite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    }
};

// Special Temple Center Icon
const templeIcon = L.divIcon({
    className: 'temple-center-marker',
    html: `
        <div style="
            background: linear-gradient(135deg, #d97706, #92400e);
            width: 42px;
            height: 42px;
            border-radius: 50%;
            border: 3px solid #fef3c7;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 20px rgba(245, 158, 11, 0.8), 0 4px 10px rgba(0,0,0,0.6);
            font-size: 22px;
            cursor: pointer;
        ">
            🛕
        </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -22]
});

// Color-coded pins by spiritual status
const getDevoteeIcon = (status) => {
    let bg = '#10b981'; // Aspiring (emerald)
    let border = '#a7f3d0';
    let shadow = 'rgba(16, 185, 129, 0.6)';

    if (status === 'Initiated') {
        bg = '#ea580c'; // Initiated (saffron)
        border = '#fed7aa';
        shadow = 'rgba(234, 88, 12, 0.7)';
    } else if (status === 'Sheltered') {
        bg = '#2563eb'; // Sheltered (blue)
        border = '#bfdbfe';
        shadow = 'rgba(37, 99, 235, 0.6)';
    }

    return L.divIcon({
        className: 'devotee-pin-marker',
        html: `
            <div style="
                background-color: ${bg};
                width: 22px;
                height: 22px;
                border-radius: 50%;
                border: 2.5px solid ${border};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 10px ${shadow}, 0 2px 6px rgba(0,0,0,0.4);
                cursor: pointer;
            ">
                <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #ffffff;"></div>
            </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -12]
    });
};

// Helper component to smoothly animate map viewport
const MapController = ({ targetCenter, zoomLevel }) => {
    const map = useMap();
    useEffect(() => {
        if (targetCenter) {
            map.flyTo([targetCenter.lat, targetCenter.lng], zoomLevel || 14, {
                duration: 1.2
            });
        }
    }, [targetCenter, zoomLevel, map]);
    return null;
};

const DevoteeMap = () => {
    const { devotees } = useDevotees();
    const navigate = useNavigate();

    // Map state
    const [activeTileKey, setActiveTileKey] = useState('dark'); // Defaults to Eye Comfort dark basemap
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCounselor, setSelectedCounselor] = useState('all');
    const [mapCenter, setMapCenter] = useState(TEMPLE_CENTER);
    const [mapZoom, setMapZoom] = useState(13);
    const [showCounselorDropdown, setShowCounselorDropdown] = useState(false);

    // Get list of unique counselors
    const counselors = useMemo(() => {
        return [...new Set(devotees.map(d => d.counselor).filter(Boolean))].sort();
    }, [devotees]);

    // Compute status stats
    const stats = useMemo(() => {
        let initiated = 0;
        let sheltered = 0;
        let aspiring = 0;
        devotees.forEach(d => {
            const st = d.spiritualStatus || (d.initiatedName ? 'Initiated' : 'Aspiring');
            if (st === 'Initiated') initiated++;
            else if (st === 'Sheltered') sheltered++;
            else aspiring++;
        });
        return {
            total: devotees.length,
            initiated,
            sheltered,
            aspiring
        };
    }, [devotees]);

    // Deterministic scatter with crash protection
    const mapData = useMemo(() => {
        return devotees.map((d, index) => {
            // Safe string conversion prevents TypeError: d.id.split is not a function
            const idStr = String(d.id || index);
            const hash = idStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const pseudoRandom1 = (hash * 9301 + 49297) % 233280;
            const pseudoRandom2 = (hash * 49297 + 9301) % 233280;

            // Generate offset (approx +/- 3.5km)
            const latOffset = (pseudoRandom1 / 233280 - 0.5) * 0.065;
            const lngOffset = (pseudoRandom2 / 233280 - 0.5) * 0.065;

            const spiritualStatus = d.spiritualStatus || (d.initiatedName ? 'Initiated' : 'Aspiring');

            return {
                ...d,
                spiritualStatus,
                lat: d.latitude ? parseFloat(d.latitude) : TEMPLE_CENTER.lat + latOffset,
                lng: d.longitude ? parseFloat(d.longitude) : TEMPLE_CENTER.lng + lngOffset
            };
        });
    }, [devotees]);

    // Filtered devotees for markers
    const filteredDevotees = useMemo(() => {
        return mapData.filter(d => {
            // Status match
            if (selectedStatus !== 'all' && d.spiritualStatus !== selectedStatus) {
                return false;
            }
            // Counselor match
            if (selectedCounselor !== 'all' && d.counselor !== selectedCounselor) {
                return false;
            }
            // Search query match
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const name = (d.name || '').toLowerCase();
                const initName = (d.initiatedName || '').toLowerCase();
                const area = (d.district || d.address || '').toLowerCase();
                if (!name.includes(q) && !initName.includes(q) && !area.includes(q)) {
                    return false;
                }
            }
            return true;
        });
    }, [mapData, selectedStatus, selectedCounselor, searchQuery]);

    // Autocomplete search suggestions (max 5)
    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase();
        return mapData.filter(d =>
            (d.name || '').toLowerCase().includes(q) ||
            (d.initiatedName || '').toLowerCase().includes(q)
        ).slice(0, 5);
    }, [mapData, searchQuery]);

    // Handle selecting a devotee from search
    const handleSelectDevotee = (devotee) => {
        setMapCenter({ lat: devotee.lat, lng: devotee.lng });
        setMapZoom(16);
        setSearchQuery(devotee.initiatedName || devotee.name);
    };

    // Reset view to temple
    const handleRecenterTemple = () => {
        setMapCenter(TEMPLE_CENTER);
        setMapZoom(13);
        setSearchQuery('');
    };

    // Quick WhatsApp click
    const handleWhatsApp = (e, phone, name) => {
        e.stopPropagation();
        try {
            openWhatsApp(phone, `Hare Krishna ${name}!`);
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="space-y-4 pb-12">
            {/* Top Toolbar & Summary Header */}
            <div className="bg-card p-4 sm:p-5 rounded-2xl border border-border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Title & Stats */}
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-950/50 border border-amber-900/50 flex items-center justify-center text-amber-300 shadow-sm">
                            <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <span>Live Devotee Map</span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-900/50 font-bold">
                                    Live
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Interactive geographic distribution of devotees around Sri Sri Radha Govinda Mandir
                            </p>
                        </div>
                    </div>

                    {/* Status Pill Counters */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => setSelectedStatus('all')}
                            className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-bold transition-all border",
                                selectedStatus === 'all'
                                    ? "bg-[#274446] text-amber-300 border-[#395f61] shadow-sm"
                                    : "bg-[#182a2b] text-muted-foreground border-border/60 hover:text-foreground"
                            )}
                        >
                            All Devotees ({stats.total})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedStatus('Initiated')}
                            className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                selectedStatus === 'Initiated'
                                    ? "bg-orange-950/70 text-orange-300 border-orange-800 shadow-sm"
                                    : "bg-[#182a2b] text-muted-foreground border-border/60 hover:text-foreground"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                            Initiated ({stats.initiated})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedStatus('Sheltered')}
                            className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                selectedStatus === 'Sheltered'
                                    ? "bg-blue-950/70 text-blue-300 border-blue-800 shadow-sm"
                                    : "bg-[#182a2b] text-muted-foreground border-border/60 hover:text-foreground"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Sheltered ({stats.sheltered})
                        </button>
                        <button
                            type="button"
                            onClick={() => setSelectedStatus('Aspiring')}
                            className={clsx(
                                "px-3 py-1 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5",
                                selectedStatus === 'Aspiring'
                                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-800 shadow-sm"
                                    : "bg-[#182a2b] text-muted-foreground border-border/60 hover:text-foreground"
                            )}
                        >
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Aspiring ({stats.aspiring})
                        </button>
                    </div>
                </div>

                {/* Right Actions: Layer Switcher & Recenter */}
                <div className="flex flex-wrap items-center gap-2.5">
                    {/* Layer Selector */}
                    <div className="flex bg-[#162728] border border-border p-1 rounded-xl shadow-sm">
                        {Object.entries(TILE_LAYERS).map(([key, layer]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setActiveTileKey(key)}
                                className={clsx(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                                    activeTileKey === key
                                        ? "bg-amber-600 text-amber-50 shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {layer.name}
                            </button>
                        ))}
                    </div>

                    {/* Recenter Temple Button */}
                    <button
                        type="button"
                        onClick={handleRecenterTemple}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#1d3334] hover:bg-[#253f41] text-amber-300 border border-[#375a5c] transition-all shadow-sm"
                        title="Recenter on Sri Sri Radha Govinda Mandir"
                    >
                        <Compass className="w-4 h-4 text-amber-400" />
                        <span>Recenter Temple</span>
                    </button>
                </div>
            </div>

            {/* Map Container Area with Floating Filter Bar */}
            <div className="h-[calc(100vh-210px)] min-h-[500px] w-full rounded-2xl overflow-hidden border border-border shadow-md relative">
                {/* Floating Search & Counselor Filter on top of Map */}
                <div className="absolute z-[400] top-4 left-4 right-4 sm:right-auto sm:w-96 space-y-2 pointer-events-auto">
                    <div className="bg-[#172829]/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-[#325456] flex items-center gap-2">
                        <Search className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find devotee on map..."
                            className="w-full text-xs bg-transparent text-foreground placeholder:text-muted-foreground outline-none border-none pr-2"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="p-1 text-muted-foreground hover:text-foreground rounded-full"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <div className="h-4 w-px bg-border/60 mx-1"></div>
                        <select
                            value={selectedCounselor}
                            onChange={(e) => setSelectedCounselor(e.target.value)}
                            className="bg-[#1f3738] text-[11px] font-semibold text-foreground border border-border/80 rounded-lg px-2 py-1 outline-none"
                            title="Filter by Counselor"
                        >
                            <option value="all">All Counselors</option>
                            {counselors.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Autocomplete Suggestions dropdown */}
                    {searchSuggestions.length > 0 && searchQuery && (
                        <div className="bg-[#172829]/95 backdrop-blur-md rounded-xl border border-[#325456] shadow-xl overflow-hidden divide-y divide-border/60 animate-in fade-in">
                            {searchSuggestions.map(devotee => (
                                <div
                                    key={devotee.id}
                                    onClick={() => handleSelectDevotee(devotee)}
                                    className="p-2.5 hover:bg-[#253f41] cursor-pointer flex items-center justify-between transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-foreground truncate">{devotee.name}</p>
                                        <p className="text-[10px] text-amber-300 truncate">{devotee.initiatedName || 'Aspiring Devotee'}</p>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1e3436] text-muted-foreground border border-border/60">
                                        {devotee.spiritualStatus}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Visible Devotee Count Badge (bottom left of map) */}
                <div className="absolute z-[400] bottom-4 left-4 bg-[#142324]/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#2e4d4f] text-xs text-[#c4d7d3] shadow-lg flex items-center gap-2 pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Showing <strong>{filteredDevotees.length}</strong> devotees on map</span>
                </div>

                <ErrorBoundary>
                    <MapContainer
                        center={[TEMPLE_CENTER.lat, TEMPLE_CENTER.lng]}
                        zoom={mapZoom}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%' }}
                    >
                        {/* Smooth Pan / Zoom Controller */}
                        <MapController targetCenter={mapCenter} zoomLevel={mapZoom} />

                        {/* Active Tile Layer */}
                        <TileLayer
                            key={activeTileKey}
                            attribution={TILE_LAYERS[activeTileKey].attribution}
                            url={TILE_LAYERS[activeTileKey].url}
                        />

                        {/* ISKCON Temple Center Marker */}
                        <Marker position={[TEMPLE_CENTER.lat, TEMPLE_CENTER.lng]} icon={templeIcon}>
                            <Popup>
                                <div className="space-y-2 p-1 min-w-[200px]">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-900/60 flex items-center justify-center text-amber-300 font-bold text-sm">
                                            🛕
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-foreground leading-tight">
                                                {TEMPLE_CENTER.name}
                                            </h4>
                                            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                                                ISKCON Durgapur Hub
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground leading-snug">
                                        {TEMPLE_CENTER.address}
                                    </p>
                                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                                        <span>Daily Mangala: 04:30 AM</span>
                                        <span className="text-amber-300 font-bold">Hare Krishna</span>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>

                        {/* Filtered Devotee Markers */}
                        {filteredDevotees.map(d => {
                            const icon = getDevoteeIcon(d.spiritualStatus);
                            return (
                                <Marker key={d.id} position={[d.lat, d.lng]} icon={icon}>
                                    <Popup>
                                        <div className="space-y-3 p-1 min-w-[220px]">
                                            {/* Devotee Header */}
                                            <div className="flex items-start gap-2.5">
                                                <div className="w-9 h-9 rounded-full bg-[#1b2f30] border border-border flex items-center justify-center text-amber-300 font-bold shrink-0 shadow-sm text-sm">
                                                    {(d.name || 'D').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-sm text-foreground truncate leading-tight">
                                                        {d.name}
                                                    </h4>
                                                    <p className="text-xs text-amber-300 font-medium truncate">
                                                        {d.initiatedName || 'Aspiring Devotee'}
                                                    </p>
                                                    <span className={clsx(
                                                        "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mt-1 border",
                                                        d.spiritualStatus === 'Initiated'
                                                            ? "bg-orange-950/60 text-orange-300 border-orange-900/60"
                                                            : d.spiritualStatus === 'Sheltered'
                                                                ? "bg-blue-950/60 text-blue-300 border-blue-900/60"
                                                                : "bg-emerald-950/60 text-emerald-300 border-emerald-900/60"
                                                    )}>
                                                        {d.spiritualStatus}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Devotee Info Meta */}
                                            <div className="space-y-1 text-xs text-muted-foreground bg-[#1a2c2d] p-2 rounded-xl border border-border/60">
                                                <p className="flex justify-between">
                                                    <span className="font-semibold text-muted-foreground/80">Counselor:</span>
                                                    <span className="font-medium text-foreground">{d.counselor || 'None'}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="font-semibold text-muted-foreground/80">Area / District:</span>
                                                    <span className="font-medium text-foreground">{d.district || 'Durgapur'}</span>
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 pt-1">
                                                {(d.whatsapp || d.contact) && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handleWhatsApp(e, d.whatsapp || d.contact, d.initiatedName || d.name)}
                                                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/60 transition-colors shadow-sm"
                                                    >
                                                        <MessageSquare className="w-3.5 h-3.5" />
                                                        <span>WhatsApp</span>
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/devotees/${d.id}`)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold bg-[#1d3334] hover:bg-[#253f41] text-[#c4d7d3] border border-[#375a5c] transition-colors shadow-sm"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                    <span>Profile</span>
                                                </button>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </ErrorBoundary>
            </div>
        </div>
    );
};

export default DevoteeMap;
