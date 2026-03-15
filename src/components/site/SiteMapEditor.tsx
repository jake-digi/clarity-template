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
import { Map, Layers, Square, Pentagon, Trash2, MapPin, Eye, EyeOff, X } from "lucide-react";
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
  onBoundsChange: (bounds: GeoBounds | null) => void;
  onBlockPolygonChange: (blockId: string, polygon: GeoPolygon | null) => void;
  onBlockPolygonDrawn?: (polygon: GeoPolygon) => void;
  onBlockClick?: (block: SiteBlock) => void;
  selectedBlockId?: string | null;
  mode: "view" | "set-bounds" | "draw-block";
  onModeChange: (mode: "view" | "set-bounds" | "draw-block") => void;
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

const SiteMapEditor = ({
  bounds,
  blocks,
  onBoundsChange,
  onBlockPolygonChange,
  onBlockPolygonDrawn,
  onBlockClick,
  selectedBlockId,
  mode,
  onModeChange,
}: SiteMapEditorProps) => {
  // Use refs for callbacks to avoid stale closures in Leaflet event handlers
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const onBlockPolygonDrawnRef = useRef(onBlockPolygonDrawn);
  onBlockPolygonDrawnRef.current = onBlockPolygonDrawn;
  const onModeChangeRef = useRef(onModeChange);
  onModeChangeRef.current = onModeChange;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const boundsLayerRef = useRef<L.Polygon | null>(null);
  const blockLayersRef = useRef<globalThis.Map<string, L.Polygon>>(new globalThis.Map());
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

  // Draw block polygons
  useEffect(() => {
    if (!mapRef.current) return;
    blockLayersRef.current.forEach((layer) => mapRef.current!.removeLayer(layer));
    blockLayersRef.current.clear();

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
    });
  }, [blocks, selectedBlockId, onBlockClick]);

  // Handle drawing modes
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
  }, [mode, onBoundsChange, onModeChange]);

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

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Map className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Site Map</span>
          {mode !== "view" && (
            <Badge variant="secondary" className="text-xs animate-pulse">
              {mode === "set-bounds" ? "Click points to draw site boundary" : "Click points to draw block area"}
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
          {mode !== "view" && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={() => onModeChange("view")}>Cancel</Button>
          )}
        </div>
      </div>

      {/* Map + Panel */}
      <div className="flex" style={{ height: 450 }}>
        <div ref={containerRef} className="flex-1 min-w-0" style={{ height: 450 }} />

        {/* Debug / elements panel */}
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
                {mappedBlocks.map((block, i) => {
                  const color = BLOCK_COLORS[blocks.indexOf(block) % BLOCK_COLORS.length];
                  const pts = block.geo_polygon!.length;
                  return (
                    <div key={block.id}
                      className={`flex items-center justify-between px-2 py-1.5 rounded-md group transition-colors ${selectedBlockId === block.id ? "bg-accent" : "hover:bg-muted/40"}`}>
                      <button className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors text-left min-w-0"
                        onClick={() => { onBlockClick?.(block); focusBlock(block.id); }}>
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color }} />
                        <div className="min-w-0">
                          <span className="block truncate">{block.name}</span>
                          <span className="block text-[10px] text-muted-foreground">{pts} pts · {block.rooms.length} room{block.rooms.length !== 1 ? "s" : ""}</span>
                        </div>
                      </button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive shrink-0"
                        onClick={() => onBlockPolygonChange(block.id, null)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
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
      `}</style>
    </div>
  );
};

export default SiteMapEditor;
