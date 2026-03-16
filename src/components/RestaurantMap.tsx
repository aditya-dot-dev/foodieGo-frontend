import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Restaurant } from '@/types';

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedId: string | null;
  onMarkerClick: (id: string) => void;
}

export function RestaurantMap({ restaurants, selectedId, onMarkerClick }: RestaurantMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const [mapboxToken, setMapboxToken] = useState<string>(() =>
    localStorage.getItem('mapbox_token') || ''
  );
  const [showTokenInput, setShowTokenInput] = useState(!mapboxToken);
  const [tokenInput, setTokenInput] = useState('');

  // Filter restaurants with coordinates
  const restaurantsWithCoords = restaurants.filter(r => r.lat && r.lng);

  const handleSaveToken = () => {
    if (tokenInput.trim()) {
      localStorage.setItem('mapbox_token', tokenInput.trim());
      setMapboxToken(tokenInput.trim());
      setShowTokenInput(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || restaurantsWithCoords.length === 0) return;

    mapboxgl.accessToken = mapboxToken;

    // Calculate center from restaurants
    const avgLat = restaurantsWithCoords.reduce((sum, r) => sum + (r.lat || 0), 0) / restaurantsWithCoords.length;
    const avgLng = restaurantsWithCoords.reduce((sum, r) => sum + (r.lng || 0), 0) / restaurantsWithCoords.length;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [avgLng, avgLat],
        zoom: 13,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add markers
      restaurantsWithCoords.forEach((restaurant) => {
        const el = document.createElement('div');
        el.className = 'restaurant-marker';
        el.innerHTML = `
          <div class="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 ${restaurant.id === selectedId
            ? 'bg-primary scale-125 shadow-lg'
            : 'bg-card border-2 border-primary shadow-md hover:scale-110'
          }">
            <svg class="w-4 h-4 ${restaurant.id === selectedId ? 'text-primary-foreground' : 'text-primary'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
        `;

        el.addEventListener('click', () => onMarkerClick(restaurant.id));

        const marker = new mapboxgl.Marker(el)
          .setLngLat([restaurant.lng!, restaurant.lat!])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <p class="font-semibold text-sm">${restaurant.name}</p>
                <p class="text-xs text-gray-500">${restaurant.cuisine} • ${restaurant.rating}⭐</p>
              </div>
            `)
          )
          .addTo(map.current!);

        markersRef.current[restaurant.id] = marker;
      });
    } catch (error) {
      console.error('Failed to initialize map:', error);
      setShowTokenInput(true);
      setMapboxToken('');
      localStorage.removeItem('mapbox_token');
    }

    return () => {
      map.current?.remove();
      markersRef.current = {};
    };
  }, [mapboxToken, restaurantsWithCoords.length]);

  // Update marker styles when selection changes
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const el = marker.getElement();
      const innerDiv = el.querySelector('div');
      if (innerDiv) {
        if (id === selectedId) {
          innerDiv.className = 'w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 bg-primary scale-125 shadow-lg';
          innerDiv.querySelector('svg')?.classList.replace('text-primary', 'text-primary-foreground');
        } else {
          innerDiv.className = 'w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 bg-card border-2 border-primary shadow-md hover:scale-110';
          innerDiv.querySelector('svg')?.classList.replace('text-primary-foreground', 'text-primary');
        }
      }
    });
  }, [selectedId]);

  if (showTokenInput) {
    return (
      <div className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-8 shadow-xl animate-fade-in">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]" />

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary ring-4 ring-primary/5">
            <MapPin className="h-6 w-6" />
          </div>

          <h3 className="mb-2 text-xl font-bold tracking-tight text-foreground">
            Explore Restaurants on Map
          </h3>

          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            Visualize restaurants near you. Enter your public Mapbox token to unlock the interactive map view.
            <a
              href="https://mapbox.com"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 font-medium text-primary hover:underline"
            >
              Get a free token
            </a>
          </p>

          <div className="flex w-full max-w-md items-center gap-2 rounded-full border border-border bg-background/50 p-1 pl-4 shadow-sm backdrop-blur transition-all focus-within:ring-2 focus-within:ring-primary/20">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="border-0 bg-transparent p-0 placeholder:text-muted-foreground focus-visible:ring-0"
            />
            <Button
              onClick={handleSaveToken}
              disabled={!tokenInput.trim()}
              size="sm"
              className="rounded-full px-6 transition-transform hover:scale-105 active:scale-95"
            >
              Save Token
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (restaurantsWithCoords.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/30 p-8 text-center">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No restaurant locations available</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border shadow-card">
      <div ref={mapContainer} className="h-[300px] w-full" />
    </div>
  );
}
