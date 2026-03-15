import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw";
import "leaflet-draw/dist/leaflet.draw.css";

// @ts-ignore - leaflet-draw augments L
const LDraw = (L as any).Draw;
const LControl = (L as any).Control;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Layers, Square, Pentagon, Trash2 } from "lucide-react";
import { SiteBlock } from "@/hooks/useSites";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Site bounds stored as a polygon (array of [lat, lng] points)
export type GeoBounds = [number, number][];

export type GeoPolygon = [number, number][];

interface SiteMapEditorProps {
  bounds: GeoBounds | null;
  blocks: SiteBlock[];
  onBoundsChange: (bounds: GeoBounds) => void;
  onBlockPolygonChange: (blockId: string, polygon: GeoPolygon) => void;
  onBlockClick?: (block: SiteBlock) => void;
  selectedBlockId?: string | null;
  mode: "view" | "set-bounds" | "draw-block";
  onModeChange: (mode: "view" | "set-bounds" | "draw-block") => void;
}

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const BLOCK_COLORS = [
  "hsl(204, 100%, 40%)",   // primary blue
  "hsl(145, 60%, 42%)",    // green
  "hsl(280, 60%, 50%)",    // purple
  "hsl(30, 90%, 50%)",     // orange
  "hsl(340, 70%, 50%)",    // pink
  "hsl(180, 60%, 40%)",    // teal
];

const SiteMapEditor = ({
  bounds,
  blocks,
  onBoundsChange,
  onBlockPolygonChange,
  onBlockClick,
  selectedBlockId,
  mode,
  onModeChange,
}: SiteMapEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const boundsLayerRef = useRef<L.Polygon | null>(null);
  const blockLayersRef = useRef<globalThis.Map<string, L.Polygon>>(new globalThis.Map());
  const drawControlRef = useRef<any>(null);
  const [satellite, setSatellite] = useState(false);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: bounds
        ? [(bounds.northEast.lat + bounds.southWest.lat) / 2, (bounds.northEast.lng + bounds.southWest.lng) / 2]
        : [51.65, -0.35], // Default to London area
      zoom: bounds ? 17 : 13,
      zoomControl: true,
    });

    tileLayerRef.current = L.tileLayer(OSM_URL, {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 20,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Toggle satellite
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(satellite ? SATELLITE_URL : OSM_URL);
  }, [satellite]);

  // Draw site bounds polygon
  useEffect(() => {
    if (!mapRef.current) return;

    if (boundsLayerRef.current) {
      mapRef.current.removeLayer(boundsLayerRef.current);
      boundsLayerRef.current = null;
    }

    if (bounds?.length) {
      const poly = L.polygon(bounds, {
        color: "hsl(204, 100%, 40%)",
        weight: 2,
        fillOpacity: 0.08,
        dashArray: "8 4",
      }).addTo(mapRef.current);
      boundsLayerRef.current = poly;
      mapRef.current.fitBounds(poly.getBounds(), { padding: [30, 30] });
    }
  }, [bounds]);

  // Draw block polygons
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove old block layers
    blockLayersRef.current.forEach((layer) => {
      mapRef.current!.removeLayer(layer);
    });
    blockLayersRef.current.clear();

    blocks.forEach((block, i) => {
      const polygon = (block as any).geo_polygon as GeoPolygon | null;
      if (!polygon?.length) return;

      const color = BLOCK_COLORS[i % BLOCK_COLORS.length];
      const isSelected = block.id === selectedBlockId;

      const poly = L.polygon(polygon, {
        color,
        weight: isSelected ? 3 : 2,
        fillOpacity: isSelected ? 0.35 : 0.2,
        fillColor: color,
      }).addTo(mapRef.current!);

      poly.bindTooltip(
        `<strong>${block.name}</strong><br/>${block.rooms.length} room${block.rooms.length !== 1 ? "s" : ""}`,
        { sticky: true, className: "site-map-tooltip" }
      );

      poly.on("click", () => onBlockClick?.(block));

      blockLayersRef.current.set(block.id, poly);
    });
  }, [blocks, selectedBlockId, onBlockClick]);

  // Handle drawing modes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clean up previous draw handler
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }

    if (mode === "set-bounds") {
      const drawControl = new (L.Control as any).Draw({
        position: "topright",
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: {
              color: "hsl(204, 100%, 40%)",
              weight: 2,
              fillOpacity: 0.1,
            },
          },
          rectangle: false,
          polyline: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: false,
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      const onCreated = (e: any) => {
        const layer = e.layer as L.Polygon;
        const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map((ll) => [ll.lat, ll.lng] as [number, number]);
        map.removeLayer(layer);
        onBoundsChange(latlngs);
        onModeChange("view");
      };

      map.on(LDraw.Event.CREATED, onCreated);
      return () => {
        map.off(LDraw.Event.CREATED, onCreated);
      };
    }

    if (mode === "draw-block") {
      const drawControl = new (L.Control as any).Draw({
        position: "topright",
        draw: {
          polygon: {
            allowIntersection: false,
            shapeOptions: {
              color: "hsl(145, 60%, 42%)",
              weight: 2,
              fillOpacity: 0.2,
            },
          },
          rectangle: false,
          polyline: false,
          circle: false,
          marker: false,
          circlemarker: false,
        },
        edit: false,
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      const onCreated = (e: any) => {
        const layer = e.layer as L.Polygon;
        const latlngs = (layer.getLatLngs()[0] as L.LatLng[]).map((ll) => [ll.lat, ll.lng] as [number, number]);
        map.removeLayer(layer);

        // This will be picked up by the parent to assign to a block
        const event = new CustomEvent("block-polygon-drawn", { detail: { polygon: latlngs } });
        window.dispatchEvent(event);

        onModeChange("view");
      };

      map.on(LDraw.Event.CREATED, onCreated);
      return () => {
        map.off(LDraw.Event.CREATED, onCreated);
      };
    }
  }, [mode, onBoundsChange, onModeChange]);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Site Map</span>
          {mode !== "view" && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              {mode === "set-bounds" ? "Draw site boundary rectangle" : "Draw block polygon"}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={satellite ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => setSatellite(!satellite)}
          >
            <Layers className="w-3.5 h-3.5" />
            {satellite ? "Street" : "Satellite"}
          </Button>
          <Button
            variant={mode === "set-bounds" ? "default" : "ghost"}
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onModeChange(mode === "set-bounds" ? "view" : "set-bounds")}
          >
            <Square className="w-3.5 h-3.5" />
            {bounds ? "Redraw Bounds" : "Set Bounds"}
          </Button>
          {bounds && (
            <Button
              variant={mode === "draw-block" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => onModeChange(mode === "draw-block" ? "view" : "draw-block")}
            >
              <Pentagon className="w-3.5 h-3.5" />
              Draw Block
            </Button>
          )}
          {mode !== "view" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive"
              onClick={() => onModeChange("view")}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Map container */}
      <div ref={containerRef} className="w-full" style={{ height: 450 }} />

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
      `}</style>
    </div>
  );
};

export default SiteMapEditor;
