import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useDevotees } from '../context/DevoteeContext';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { User, MapPin } from 'lucide-react';
import ErrorBoundary from '../components/ErrorBoundary';

// Fix for Leaflet default icon issues in React
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

const customIcon = new Icon({
    iconUrl: iconUrl,
    iconRetinaUrl: iconRetinaUrl,
    shadowUrl: shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const DevoteeMap = () => {
    const { devotees } = useDevotees();

    // Central Point (Durgapur City Center approx)
    const CENTER = { lat: 23.5204, lng: 87.3119 };

    // "Smart Scatter" Logic
    // Since we don't have real coords, let's scatter them around the center
    // based on a deterministic hash of their ID so they stay in the same place on refresh.
    const mapData = useMemo(() => {
        return devotees.map(d => {
            // Deterministic random generator based on ID string
            const hash = d.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const pseudoRandom1 = (hash * 9301 + 49297) % 233280;
            const pseudoRandom2 = (hash * 49297 + 9301) % 233280;

            // Generate offset (approx +/- 3km)
            // 1 deg lat = 110km. 0.04 deg = ~4.4km
            const latOffset = (pseudoRandom1 / 233280 - 0.5) * 0.06;
            const lngOffset = (pseudoRandom2 / 233280 - 0.5) * 0.06;

            return {
                ...d,
                lat: CENTER.lat + latOffset,
                lng: CENTER.lng + lngOffset
            };
        });
    }, [devotees]);

    return (
        <div className="h-[calc(100vh-100px)] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative">
            <div className="absolute z-[400] top-4 right-4 bg-white dark:bg-slate-900/90 backdrop-blur p-4 rounded-xl shadow-lg border border-slate-100 dark:border-slate-800 max-w-xs">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" /> Devotee Heatmap
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Visualizing <strong>{devotees.length}</strong> devotees in the Durgapur area.
                </p>
                <div className="mt-2 flex gap-2 text-xs">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">Map View</span>
                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">Satellite (Beta)</span>
                </div>
            </div>

            <ErrorBoundary>
                <MapContainer
                    center={[CENTER.lat, CENTER.lng]}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: "100%", width: "100%" }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {mapData.map(d => (
                        <Marker key={d.id} position={[d.lat, d.lng]} icon={customIcon}>
                            <Popup>
                                <div className="p-1 min-w-[150px]">
                                    <h4 className="font-bold text-sm text-slate-900">{d.name}</h4>
                                    <p className="text-xs text-orange-600 font-medium">{d.initiatedName || 'Aspiring Devotee'}</p>
                                    <hr className="my-2 border-slate-100 dark:border-slate-800" />
                                    <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold">Counselor:</span> {d.counselor || 'None'}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400"><span className="font-semibold">Area:</span> {d.district || 'Unknown'}</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </ErrorBoundary>
        </div>
    );
};

export default DevoteeMap;
