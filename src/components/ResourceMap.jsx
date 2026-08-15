import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps';
import { 
  Bed, 
  Utensils, 
  Bath, 
  MapPin, 
  Navigation, 
  Clock, 
  Phone, 
  Layers, 
  Compass, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import mockResources from '../data/resources.json';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCzEt3AWGJrePRSa8Gp9JgTCx7oEHnrAP8';
const DEFAULT_CENTER = { lat: 47.6062, lng: -122.3321 }; // Seattle downtown

export default function ResourceMap() {
  const [resources] = useState(mockResources);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedResource, setSelectedResource] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('Detecting location...');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(loc);
          setLocationStatus('GPS Active');
        },
        (error) => {
          console.warn('Geolocation warning/error:', error);
          setLocationStatus('Using Seattle Default');
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setLocationStatus('Geolocation unsupported');
    }
  }, []);

  const filteredResources = resources.filter((res) => {
    if (selectedCategory === 'all') return true;
    return res.category === selectedCategory;
  });

  const getCategoryTheme = (category) => {
    switch (category) {
      case 'shelter':
        return {
          bg: 'bg-amber-500',
          border: 'border-amber-400',
          text: 'text-amber-400',
          glyphColor: '#ffffff',
          background: '#f59e0b',
          borderColor: '#d97706',
          icon: <Bed className="w-4 h-4 text-white" />
        };
      case 'food':
        return {
          bg: 'bg-blue-600',
          border: 'border-blue-400',
          text: 'text-blue-400',
          glyphColor: '#ffffff',
          background: '#2563eb',
          borderColor: '#1d4ed8',
          icon: <Utensils className="w-4 h-4 text-white" />
        };
      case 'restroom':
        return {
          bg: 'bg-emerald-600',
          border: 'border-emerald-400',
          text: 'text-emerald-400',
          glyphColor: '#ffffff',
          background: '#059669',
          borderColor: '#047857',
          icon: <Bath className="w-4 h-4 text-white" />
        };
      default:
        return {
          bg: 'bg-purple-600',
          border: 'border-purple-400',
          text: 'text-purple-400',
          glyphColor: '#ffffff',
          background: '#7c3aed',
          borderColor: '#6d28d9',
          icon: <MapPin className="w-4 h-4 text-white" />
        };
    }
  };

  const openDirections = (res) => {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${res.lat},${res.lng}&travelmode=walking`;
    window.open(directionsUrl, '_blank');
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden">
      
      {/* Category Filter Bar */}
      <div className="absolute top-3 left-0 w-full z-30 px-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max pb-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300 scale-105'
                : 'bg-slate-900/90 text-slate-200 border border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" /> All Resources ({resources.length})
          </button>

          <button
            onClick={() => setSelectedCategory('shelter')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              selectedCategory === 'shelter'
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400 scale-105'
                : 'bg-slate-900/90 text-amber-400 border border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Bed className="w-3.5 h-3.5" /> Shelters
          </button>

          <button
            onClick={() => setSelectedCategory('food')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              selectedCategory === 'food'
                ? 'bg-blue-600 text-white ring-2 ring-blue-400 scale-105'
                : 'bg-slate-900/90 text-blue-400 border border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" /> Food Kitchens
          </button>

          <button
            onClick={() => setSelectedCategory('restroom')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 ${
              selectedCategory === 'restroom'
                ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 scale-105'
                : 'bg-slate-900/90 text-emerald-400 border border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <Bath className="w-3.5 h-3.5" /> Restrooms
          </button>
        </div>
      </div>

      {/* GPS Status Indicator */}
      <div className="absolute top-14 left-3 z-20 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-slate-300 border border-slate-700/60 flex items-center gap-1.5 shadow">
        <Compass className="w-3 h-3 text-amber-400 animate-spin-slow" />
        <span>{locationStatus}</span>
      </div>

      {/* Interactive Map */}
      <div className="w-full flex-grow relative">
        <APIProvider apiKey={API_KEY}>
          <Map
            defaultCenter={userLocation || DEFAULT_CENTER}
            defaultZoom={14}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            style={{ width: '100%', height: '100%' }}
          >
            {/* User GPS Location Marker */}
            {userLocation && (
              <AdvancedMarker position={userLocation} title="Your Location">
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
                  <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-xl"></div>
                </div>
              </AdvancedMarker>
            )}

            {/* Community Resource Pins */}
            {filteredResources.map((res) => {
              const theme = getCategoryTheme(res.category);
              return (
                <AdvancedMarker
                  key={res.id}
                  position={{ lat: res.lat, lng: res.lng }}
                  onClick={() => setSelectedResource(res)}
                  title={res.name}
                >
                  <div className="group cursor-pointer transform hover:scale-110 active:scale-95 transition-all">
                    <div className={`px-2 py-1 ${theme.bg} text-white font-extrabold text-[11px] rounded-xl shadow-lg border-2 border-white flex items-center gap-1`}>
                      {theme.icon}
                      <span className="truncate max-w-[110px]">{res.name}</span>
                    </div>
                    <div className={`w-2 h-2 ${theme.bg} rotate-45 -mt-1 mx-auto border-r border-b border-white`}></div>
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* Clicked Resource InfoWindow Popup */}
            {selectedResource && (
              <InfoWindow
                position={{ lat: selectedResource.lat, lng: selectedResource.lng }}
                onCloseClick={() => setSelectedResource(null)}
              >
                <div className="p-1 max-w-[260px] text-slate-900 font-sans space-y-2">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-1.5">
                    <div>
                      <span className="inline-block px-2 py-0.5 text-[9px] font-extrabold uppercase rounded-full bg-amber-100 text-amber-900">
                        {selectedResource.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1 leading-snug">{selectedResource.name}</h4>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 flex items-start gap-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span>{selectedResource.address}</span>
                  </p>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1 font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedResource.status}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>{selectedResource.hours}</span>
                    </div>
                    {selectedResource.phone && (
                      <div className="flex items-center gap-1 text-slate-600">
                        <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <a href={`tel:${selectedResource.phone}`} className="text-blue-600 font-bold hover:underline">
                          {selectedResource.phone}
                        </a>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 leading-tight">{selectedResource.description}</p>

                  <button
                    onClick={() => openDirections(selectedResource)}
                    className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" /> Get Walking Directions
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

    </div>
  );
}
