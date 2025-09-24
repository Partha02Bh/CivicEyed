import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface MapComponentProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLat?: number; // AI-extracted or user location latitude
  initialLng?: number; // AI-extracted or user location longitude
}

// Fix default marker icons in Vite builds
const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

const MapComponent: React.FC<MapComponentProps> = ({
  onLocationSelect,
  initialLat,
  initialLng,
}) => {
  // Use user's location if provided, otherwise fall back to hardcoded coordinates
  const mapLat = initialLat ?? 12.954864215243662;
  const mapLng = initialLng ?? 77.57164927572299;
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize Leaflet map
    mapRef.current = L.map(mapContainer.current, {
      center: [mapLat, mapLng],
      zoom: 12,
      zoomControl: true,
    });

    // Add OpenStreetMap tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors",
      maxZoom: 19,
    }).addTo(mapRef.current);

    const container = mapRef.current.getContainer();

    // Place initial marker from AI/user location
    markerRef.current = L.marker([mapLat, mapLng], {
      draggable: true,
      icon: defaultIcon,
    }).addTo(mapRef.current);

    // Trigger reverse geocode for initial marker
    reverseGeocode(mapLat, mapLng).then((address) => {
      onLocationSelect(mapLat, mapLng, address);
    });

    // Cursor feedback
    container.style.cursor = "";
    mapRef.current.on("mouseover", () => {
      container.style.cursor = "crosshair";
    });
    mapRef.current.on("mouseout", () => {
      container.style.cursor = "";
    });

    // Click handler
    mapRef.current.on("click", async (e: L.LeafletMouseEvent) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: true,
          icon: defaultIcon,
        }).addTo(mapRef.current!);
      }

      const address = await reverseGeocode(lat, lng);
      onLocationSelect(lat, lng, address);
    });

    // Drag handler
    markerRef.current.on("dragend", async () => {
      const pos = markerRef.current!.getLatLng();
      const address = await reverseGeocode(pos.lat, pos.lng);
      onLocationSelect(pos.lat, pos.lng, address);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapLat, mapLng, onLocationSelect]);

  async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const data = await res.json();
      return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  }

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
};

export default MapComponent;
