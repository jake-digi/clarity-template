import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// @ts-ignore - leaflet-draw augments L
const LDraw = (L as any).Draw;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Map, Layers, Square, Pentagon, Trash2, MapPin, Eye, EyeOff, DoorOpen } from "lucide-react";
import { SiteBlock, SiteRoom, RoomType, ROOM_TYPES } from "@/hooks/useSites";
import { SiteFeature, FEATURE_TYPES } from "@/hooks/useSiteFeatures";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export type GeoBounds = [number, number][];
export type GeoPolygon = [number, number][];

export type MapMode = "view" | "set-bounds" | "draw-block" | "add-room" | "add-feature";

interface SiteMapEditorProps {
  bounds: GeoBounds | null;
  blocks: SiteBlock[];
  features?: SiteFeature[];
  onBoundsChange: (bounds: GeoBounds | null) => void;
  onBlockPolygonChange: (blockId: string, polygon: GeoPolygon | null) => void;
  onBlockPolygonDrawn?: (polygon: GeoPolygon) => void;
  onRoomPinPlaced?: (blockId: string, position: { lat: number; lng: number }) => void;
  onRoomClick?: (room: SiteRoom) => void;
  onBlockClick?: (block: SiteBlock) => void;
  onFeaturePinPlaced?: (position: { lat: number; lng: number }) => void;
  onFeatureClick?: (feature: SiteFeature) => void;
  selectedBlockId?: string | null;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
}

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const BLOCK_COLORS = [
  "hsl(204, 100%, 40%)",
  "hsl(145, 60%, 42%)",
  "hsl(280, 60%, 50%)",
  "hsl(30, 90%, 50%)",
  "hsl(340, 70%, 50%)",
  "hsl(180, 60%, 40%)",
];

// SVG paths for room type icons (24x24 viewBox)
const ROOM_TYPE_SVGS: Record<string, string> = {
  "home": '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  "bed-double": '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>',
  "heart-pulse": '<path d="M19.5 12.572l-7.5 7.428l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572"/>',
  "briefcase": '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>',
  "archive": '<rect x="2" y="4" width="20" height="5" rx="1"/><path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9"/><path d="M10 13h4"/>',
  "cooking-pot": '<path d="M2 12h20"/><path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8"/><path d="m4 8 2.5-2.5"/><path d="m20 8-2.5-2.5"/><path d="M12 4v4"/>',
  "bath": '<path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h3v2.25"/>',
  "monitor": '<rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
  "sofa": '<path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
};

const getRoomSvg = (roomType: string) => {
  const typeDef = ROOM_TYPES.find((t) => t.value === roomType);
  const iconKey = typeDef?.icon ?? "home";
  return ROOM_TYPE_SVGS[iconKey] ?? ROOM_TYPE_SVGS["home"];
};

const makeRoomIcon = (color: string, label: string, roomType: string = "room") =>
  L.divIcon({
    className: "room-pin-icon",
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:24px;height:24px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">${getRoomSvg(roomType)}</svg>
      </div>
      <span style="font-size:10px;font-weight:600;color:${color};text-shadow:0 0 3px white,0 0 3px white,0 0 3px white;white-space:nowrap;pointer-events:none;">${label}</span>
    </div>`,
    iconSize: [80, 40],
    iconAnchor: [40, 12],
  });

const makeBlockLabel = (name: string, color: string) =>
  L.divIcon({
    className: "block-label-icon",
    html: `<div style="font-size:12px;font-weight:700;color:${color};text-shadow:0 0 4px white,0 0 4px white,0 0 4px white,0 0 4px white;white-space:nowrap;pointer-events:none;text-align:center;">${name}</div>`,
    iconSize: [100, 20],
    iconAnchor: [50, 10],
  });

const FEATURE_SVGS: Record<string, string> = {
  "waves": '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
  "utensils": '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  "calendar": '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  "info": '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  "car": '<path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
  "trophy": '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  "ferris-wheel": '<circle cx="12" cy="12" r="2"/><path d="M12 2v4"/><path d="m6.8 15-3.5 2"/><path d="m20.7 7-3.5 2"/><path d="M6.8 9 3.3 7"/><path d="m20.7 17-3.5-2"/><path d="m9 22 3-8 3 8"/><path d="M8 22h8"/><circle cx="12" cy="12" r="10"/>',
  "cross": '<path d="M11 2a2 2 0 0 0-2 2v5H4a2 2 0 0 0-2 2v2c0 1.1.9 2 2 2h5v5c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-5h5a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-5V4a2 2 0 0 0-2-2h-2z"/>',
  "droplets": '<path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z"/><path d="M12.56 14.69c1.47 0 2.67-1.22 2.67-2.7 0-.78-.38-1.51-1.14-2.13-.76-.61-1.28-1.37-1.53-2.26-.25.89-.77 1.65-1.53 2.26-.76.62-1.14 1.35-1.14 2.13 0 1.48 1.2 2.7 2.67 2.7z"/><path d="M17 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S17.29 6.75 17 5.3c-.29 1.45-1.14 2.84-2.29 3.76S13 11.1 13 12.25c0 2.22 1.8 4.05 4 4.05z"/>',
  "log-in": '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  "flame": '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  "church": '<path d="m18 7 4 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9l4-2"/><path d="M14 22v-4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v4"/><path d="M18 22V5l-6-3-6 3v17"/><path d="M12 7v5"/><path d="M10 9h4"/>',
  "shopping-bag": '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  "shirt": '<path d="M20.38 3.46 16 2 12 5 8 2 3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>',
  "map-pin": '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
};

const makeFeatureIcon = (featureType: string, name: string, customColor?: string | null) => {
  const typeDef = FEATURE_TYPES.find((t) => t.value === featureType);
  const color = customColor || typeDef?.color || "#6b7280";
  const svgPath = FEATURE_SVGS[typeDef?.icon ?? "map-pin"] ?? FEATURE_SVGS["map-pin"];
  return L.divIcon({
    className: "feature-pin-icon",
    html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
      <div style="width:28px;height:28px;border-radius:6px;background:${color};border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgPath}</svg>
      </div>
      <span style="font-size:10px;font-weight:600;color:${color};text-shadow:0 0 3px white,0 0 3px white,0 0 3px white;white-space:nowrap;pointer-events:none;max-width:80px;overflow:hidden;text-overflow:ellipsis;">${name}</span>
    </div>`,
    iconSize: [90, 46],
    iconAnchor: [45, 14],
  });
};

const SiteMapEditor = ({
  bounds,
  blocks,
  features = [],
  onBoundsChange,
  onBlockPolygonChange,
  onBlockPolygonDrawn,
  onRoomPinPlaced,
  onRoomClick,
  onBlockClick,
  onFeaturePinPlaced,
  onFeatureClick,
  selectedBlockId,
  mode,
  onModeChange,
}: SiteMapEditorProps) => {
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const onBlockPolygonDrawnRef = useRef(onBlockPolygonDrawn);
  onBlockPolygonDrawnRef.current = onBlockPolygonDrawn;
  const onRoomPinPlacedRef = useRef(onRoomPinPlaced);
  onRoomPinPlacedRef.current = onRoomPinPlaced;
  const onRoomClickRef = useRef(onRoomClick);
  onRoomClickRef.current = onRoomClick;
  const onFeaturePinPlacedRef = useRef(onFeaturePinPlaced);
  onFeaturePinPlacedRef.current = onFeaturePinPlaced;
  const onFeatureClickRef = useRef(onFeatureClick);
  onFeatureClickRef.current = onFeatureClick;
  const onModeChangeRef = useRef(onModeChange);
  onModeChangeRef.current = onModeChange;

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const boundsLayerRef = useRef<L.Polygon | null>(null);
  const blockLayersRef = useRef<globalThis.Map<string, L.Polygon>>(new globalThis.Map());
  const blockLabelLayersRef = useRef<L.Marker[]>([]);
  const roomMarkersRef = useRef<L.Marker[]>([]);
  const featureMarkersRef = useRef<L.Marker[]>([]);
  const drawControlRef = useRef<any>(null);
  const [satellite, setSatellite] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      center: bounds?.length
        ? [bounds.reduce((s, p) => s + p[0], 0) / bounds.length, bounds.reduce((s, p) => s + p[1], 0) / bounds.length] as [number, number]
        : [51.65, -0.35],
      zoom: bounds?.length ? 17 : 13,
      zoomControl: true,
    });
    tileLayerRef.current = L.tileLayer(OSM_URL, { attribution: '© OpenStreetMap contributors', maxZoom: 20 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Toggle satellite
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(satellite ? SATELLITE_URL : OSM_URL);
  }, [satellite]);

  // Draw site bounds polygon
  useEffect(() => {
    if (!mapRef.current) return;
    if (boundsLayerRef.current) { mapRef.current.removeLayer(boundsLayerRef.current); boundsLayerRef.current = null; }
    if (bounds?.length) {
      const poly = L.polygon(bounds, { color: "hsl(204, 100%, 40%)", weight: 2, fillOpacity: 0.08, dashArray: "8 4" }).addTo(mapRef.current);
      boundsLayerRef.current = poly;
      mapRef.current.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }
  }, [bounds]);

  // Draw block polygons + labels
  useEffect(() => {
    if (!mapRef.current) return;
    blockLayersRef.current.forEach((layer) => mapRef.current!.removeLayer(layer));
    blockLayersRef.current.clear();
    blockLabelLayersRef.current.forEach((m) => mapRef.current!.removeLayer(m));
    blockLabelLayersRef.current = [];

    blocks.forEach((block, i) => {
      const polygon = block.geo_polygon;
      if (!polygon?.length) return;
      const color = BLOCK_COLORS[i % BLOCK_COLORS.length];
      const isSelected = block.id === selectedBlockId;
      const poly = L.polygon(polygon, {
        color, weight: isSelected ? 3 : 2, fillOpacity: isSelected ? 0.35 : 0.2, fillColor: color,
      }).addTo(mapRef.current!);
      poly.bindTooltip(`<strong>${block.name}</strong><br/>${block.rooms.length} room${block.rooms.length !== 1 ? "s" : ""}`, { sticky: true, className: "site-map-tooltip" });
      poly.on("click", () => onBlockClick?.(block));
      blockLayersRef.current.set(block.id, poly);

      // Add persistent label at polygon center
      const center = poly.getBounds().getCenter();
      const label = L.marker(center, { icon: makeBlockLabel(block.name, color), interactive: false }).addTo(mapRef.current!);
      blockLabelLayersRef.current.push(label);
    });
  }, [blocks, selectedBlockId, onBlockClick]);

  // Draw room markers
  useEffect(() => {
    if (!mapRef.current) return;
    // Remove old markers
    roomMarkersRef.current.forEach((m) => mapRef.current!.removeLayer(m));
    roomMarkersRef.current = [];

    blocks.forEach((block, i) => {
      const color = BLOCK_COLORS[i % BLOCK_COLORS.length];
      block.rooms.forEach((room) => {
        if (!room.geo_position) return;
        const typeDef = ROOM_TYPES.find((t) => t.value === room.room_type);
        const typeLabel = typeDef?.label ?? "Room";
        const label = room.room_number + (room.name ? ` — ${room.name}` : "");
        const marker = L.marker([room.geo_position.lat, room.geo_position.lng], {
          icon: makeRoomIcon(color, room.room_number, room.room_type),
        }).addTo(mapRef.current!);
        marker.bindTooltip(
          `<strong>${label}</strong><br/><em>${typeLabel}</em>${room.capacity ? `<br/>Capacity: ${room.capacity}` : ""}`,
          { className: "site-map-tooltip" }
        );
        marker.on("click", () => onRoomClickRef.current?.(room));
        roomMarkersRef.current.push(marker);
      });
    });
  }, [blocks]);

  // Draw feature markers
  useEffect(() => {
    if (!mapRef.current) return;
    featureMarkersRef.current.forEach((m) => mapRef.current!.removeLayer(m));
    featureMarkersRef.current = [];

    features.forEach((feature) => {
      if (!feature.geo_position) return;
      const typeDef = FEATURE_TYPES.find((t) => t.value === feature.feature_type);
      const marker = L.marker([feature.geo_position.lat, feature.geo_position.lng], {
        icon: makeFeatureIcon(feature.feature_type, feature.name, feature.color),
      }).addTo(mapRef.current!);
      marker.bindTooltip(
        `<strong>${feature.name}</strong><br/><em>${typeDef?.label ?? feature.feature_type}</em>${feature.description ? `<br/>${feature.description}` : ""}`,
        { className: "site-map-tooltip" }
      );
      marker.on("click", () => onFeatureClickRef.current?.(feature));
      featureMarkersRef.current.push(marker);
    });
  }, [features]);

  // Handle drawing modes (bounds / block polygon)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (drawControlRef.current) { map.removeControl(drawControlRef.current); drawControlRef.current = null; }

    if (mode === "set-bounds" || mode === "draw-block") {
      const isBounds = mode === "set-bounds";
      const drawControl = new (L.Control as any).Draw({
        position: "topright",
        draw: {
          polygon: { allowIntersection: false, shapeOptions: { color: isBounds ? "hsl(204, 100%, 40%)" : "hsl(145, 60%, 42%)", weight: 2, fillOpacity: isBounds ? 0.1 : 0.2 } },
          rectangle: false, polyline: false, circle: false, marker: false, circlemarker: false,
        },
        edit: false,
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      const onCreated = (e: any) => {
        const layer = e.layer as L.Polygon;
        const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map((ll) => [ll.lat, ll.lng] as [number, number]);
        map.removeLayer(layer);
        if (isBounds) {
          onBoundsChangeRef.current(latlngs);
        } else {
          onBlockPolygonDrawnRef.current?.(latlngs);
        }
        onModeChangeRef.current("view");
      };

      map.on(LDraw.Event.CREATED, onCreated);
      return () => { map.off(LDraw.Event.CREATED, onCreated); };
    }
  }, [mode]);

  // Handle add-room mode: click inside a block to place a pin
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== "add-room") return;

    // Change cursor
    const container = map.getContainer();
    container.style.cursor = "crosshair";

    const onClick = (e: L.LeafletMouseEvent) => {
      const latlng = e.latlng;

      // Find which block polygon contains this click
      let targetBlockId: string | null = null;
      for (const [blockId, polygon] of blockLayersRef.current.entries()) {
        // Use leaflet's built-in point-in-polygon
        const bounds = polygon.getBounds();
        if (!bounds.contains(latlng)) continue;

        // More precise check using ray casting on the polygon's latlngs
        const latlngs = (polygon.getLatLngs()[0] as L.LatLng[]);
        if (isPointInPolygon(latlng, latlngs)) {
          targetBlockId = blockId;
          break;
        }
      }

      if (targetBlockId) {
        onRoomPinPlacedRef.current?.(targetBlockId, { lat: latlng.lat, lng: latlng.lng });
      }
    };

    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
      container.style.cursor = "";
    };
  }, [mode]);

  // Handle add-feature mode: click anywhere to place a feature
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mode !== "add-feature") return;
    const container = map.getContainer();
    container.style.cursor = "crosshair";
    const onClick = (e: L.LeafletMouseEvent) => {
      onFeaturePinPlacedRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on("click", onClick);
    return () => { map.off("click", onClick); container.style.cursor = ""; };

  // Ray-casting point-in-polygon check
  function isPointInPolygon(point: L.LatLng, polygon: L.LatLng[]): boolean {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      if ((yi > point.lng) !== (yj > point.lng) && point.lat < ((xj - xi) * (point.lng - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  const focusBounds = () => {
    if (bounds?.length && mapRef.current && boundsLayerRef.current) {
      mapRef.current.fitBounds(boundsLayerRef.current.getBounds(), { padding: [30, 30] });
    }
  };

  const focusBlock = (blockId: string) => {
    const layer = blockLayersRef.current.get(blockId);
    if (layer && mapRef.current) {
      mapRef.current.fitBounds(layer.getBounds(), { padding: [40, 40] });
    }
  };

  const mappedBlocks = blocks.filter((b) => b.geo_polygon?.length);
  const unmappedBlocks = blocks.filter((b) => !b.geo_polygon?.length);
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Site Map</span>
          {mode !== "view" && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              {mode === "set-bounds" && "Click points to draw site boundary"}
              {mode === "draw-block" && "Click points to draw block area"}
              {mode === "add-room" && (selectedBlock ? `Click inside ${selectedBlock.name} to place a room` : "Select a block first")}
              {mode === "add-feature" && "Click anywhere on the map to place a feature"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant={showPanel ? "secondary" : "ghost"} size="sm" className="h-7 text-xs gap-1" onClick={() => setShowPanel(!showPanel)}>
            {showPanel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Panel
          </Button>
          <Button variant={satellite ? "secondary" : "ghost"} size="sm" className="h-7 text-xs gap-1" onClick={() => setSatellite(!satellite)}>
            <Layers className="w-3.5 h-3.5" />{satellite ? "Street" : "Satellite"}
          </Button>
          <Button variant={mode === "set-bounds" ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1"
            onClick={() => onModeChange(mode === "set-bounds" ? "view" : "set-bounds")}>
            <Square className="w-3.5 h-3.5" />{bounds?.length ? "Redraw Bounds" : "Set Bounds"}
          </Button>
          {bounds?.length ? (
            <Button variant={mode === "draw-block" ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1"
              onClick={() => onModeChange(mode === "draw-block" ? "view" : "draw-block")}>
              <Pentagon className="w-3.5 h-3.5" />Draw Block
            </Button>
          ) : null}
          {mappedBlocks.length > 0 ? (
            <Button variant={mode === "add-room" ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1"
              onClick={() => onModeChange(mode === "add-room" ? "view" : "add-room")}>
              <DoorOpen className="w-3.5 h-3.5" />Add Room Pin
            </Button>
          ) : null}
          {bounds?.length ? (
            <Button variant={mode === "add-feature" ? "default" : "ghost"} size="sm" className="h-7 text-xs gap-1"
              onClick={() => onModeChange(mode === "add-feature" ? "view" : "add-feature")}>
              <MapPin className="w-3.5 h-3.5" />Add Feature
            </Button>
          ) : null}
          {mode !== "view" && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => onModeChange("view")}>Cancel</Button>
          )}
        </div>
      </div>

      {/* Map + Panel */}
      <div className="flex" style={{ height: 450 }}>
        <div ref={containerRef} className="flex-1 min-w-0" style={{ height: 450 }} />

        {/* Elements panel */}
        {showPanel && (
          <div className="w-64 border-l border-border bg-card shrink-0 flex flex-col">
            <div className="px-3 py-2 border-b border-border bg-muted/30">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Map Elements</span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {/* Bounds entry */}
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-2 pb-1">Site Boundary</div>
                {bounds?.length ? (
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/40 group">
                    <button className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors" onClick={focusBounds}>
                      <div className="w-2.5 h-2.5 rounded-sm border-2" style={{ borderColor: "hsl(204, 100%, 40%)" }} />
                      <span>Boundary ({bounds.length} pts)</span>
                    </button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                      onClick={() => onBoundsChange(null)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground italic">No boundary set</div>
                )}

                {/* Mapped blocks */}
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-3 pb-1">
                  Mapped Blocks ({mappedBlocks.length})
                </div>
                {mappedBlocks.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground italic">No blocks drawn</div>
                )}
                {mappedBlocks.map((block) => {
                  const color = BLOCK_COLORS[blocks.indexOf(block) % BLOCK_COLORS.length];
                  const pts = block.geo_polygon!.length;
                  const pinnedRooms = block.rooms.filter((r) => r.geo_position);
                  return (
                    <div key={block.id}>
                      <div className={`flex items-center justify-between px-2 py-1.5 rounded-md group transition-colors ${selectedBlockId === block.id ? "bg-accent" : "hover:bg-muted/40"}`}>
                        <button className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors text-left min-w-0"
                          onClick={() => { onBlockClick?.(block); focusBlock(block.id); }}>
                          <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                          <div className="min-w-0">
                            <span className="block truncate">{block.name}</span>
                            <span className="block text-[10px] text-muted-foreground">{pts} pts · {block.rooms.length} room{block.rooms.length !== 1 ? "s" : ""} · {pinnedRooms.length} pinned</span>
                          </div>
                        </button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                          onClick={() => onBlockPolygonChange(block.id, null)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      {/* Show pinned rooms under block */}
                      {pinnedRooms.length > 0 && selectedBlockId === block.id && (
                        <div className="ml-5 border-l border-border pl-2 space-y-0.5 mt-0.5 mb-1">
                          {pinnedRooms.map((room) => (
                            <div key={room.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-0.5">
                              <DoorOpen className="w-3 h-3 shrink-0" style={{ color }} />
                              <span className="truncate">{room.room_number}{room.name ? ` — ${room.name}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Unmapped blocks */}
                {unmappedBlocks.length > 0 && (
                  <>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-3 pb-1">
                      Unmapped Blocks ({unmappedBlocks.length})
                    </div>
                    {unmappedBlocks.map((block) => (
                      <div key={block.id} className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{block.name}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Debug coords */}
                {bounds?.length ? (
                  <>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-3 pb-1">Debug: Bounds Coords</div>
                    <div className="px-2 py-1 text-[10px] font-mono text-muted-foreground bg-muted/30 rounded max-h-24 overflow-auto">
                      {bounds.map((p, i) => (
                        <div key={i}>[{p[0].toFixed(6)}, {p[1].toFixed(6)}]</div>
                      ))}
                    </div>
                  </>
                ) : null}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Map CSS overrides */}
      <style>{`
        .site-map-tooltip {
          background: hsl(210, 20%, 15%);
          color: white;
          border: none;
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .site-map-tooltip::before {
          border-top-color: hsl(210, 20%, 15%) !important;
        }
        .leaflet-draw-toolbar a {
          background-color: hsl(0, 0%, 100%);
        }
        .room-pin-icon {
          background: none !important;
          border: none !important;
        }
      `}</style>
    </div>
  );
};

export default SiteMapEditor;
