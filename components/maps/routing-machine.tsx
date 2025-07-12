"use client";

import { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";

// Define proper types for leaflet routing machine
interface RoutingRouter {
  route: (
    waypoints: L.LatLng[],
    callback: (error: Error | null, routes?: unknown[]) => void
  ) => void;
}

interface RoutingOptions {
  waypoints?: L.LatLng[];
  routeWhileDragging?: boolean;
  showAlternatives?: boolean;
  fitSelectedRoutes?: boolean;
  show?: boolean;
  createMarker?: () => null;
  lineOptions?: {
    styles: Array<{
      color: string;
      weight: number;
      opacity: number;
    }>;
  };
  router?: RoutingRouter;
  addWaypoints?: boolean;
  draggableWaypoints?: boolean;
}

// Use a more flexible type that can be both a routing control and a leaflet control
type RoutingControl = L.Control & {
  _router?: {
    _routes?: unknown[];
  };
  _plan?: {
    setWaypoints: (waypoints: L.LatLng[]) => void;
  };
  on: (event: string, handler: (e: RoutingEvent) => void) => void;
};

interface RoutingEvent {
  routes?: Array<{
    summary: {
      totalDistance: number;
      totalTime: number;
    };
    bounds?: L.LatLngBounds;
  }>;
  error?: {
    message?: string;
  };
}

interface OSRMOptions {
  serviceUrl: string;
  profile: string;
  timeout: number;
}

// Extend the Leaflet module using module augmentation
declare module "leaflet" {
  export interface RoutingStatic {
    control(options?: RoutingOptions): RoutingControl;
    osrmv1(options?: OSRMOptions): RoutingRouter;
  }

  export const Routing: RoutingStatic;
}

interface RoutingMachineProps {
  startPosition: [number, number] | null;
  endPosition: [number, number] | null;
  isNavigating: boolean;
}

const RoutingMachine: React.FC<RoutingMachineProps> = ({
  startPosition,
  endPosition,
  isNavigating,
}) => {
  const map = useMap();
  const routingControlRef = useRef<RoutingControl | null>(null);
  const isInitializedRef = useRef(false);

  // Fungsi untuk membersihkan routing control dengan aman
  const cleanupRoutingControl = useCallback(() => {
    if (routingControlRef.current && map) {
      try {
        // Hapus semua layer routing terlebih dahulu
        if (
          routingControlRef.current._router &&
          routingControlRef.current._router._routes
        ) {
          routingControlRef.current._router._routes = [];
        }
        if (routingControlRef.current._plan) {
          routingControlRef.current._plan.setWaypoints([]);
        }

        // Hapus control dari peta
        map.removeControl(routingControlRef.current);
        console.log("Routing control removed successfully");
      } catch (error) {
        console.error("Error removing routing control:", error);
      } finally {
        routingControlRef.current = null;
        isInitializedRef.current = false;
      }
    }
  }, [map]);

  useEffect(() => {
    if (!map || !isNavigating || !startPosition || !endPosition) {
      // Cleanup existing routing control if navigation is turned off
      cleanupRoutingControl();
      return;
    }

    // Validasi koordinat
    const isValidCoordinate = (coord: [number, number]) => {
      return (
        Array.isArray(coord) &&
        coord.length === 2 &&
        typeof coord[0] === "number" &&
        typeof coord[1] === "number" &&
        coord[0] >= -90 &&
        coord[0] <= 90 &&
        coord[1] >= -180 &&
        coord[1] <= 180 &&
        !isNaN(coord[0]) &&
        !isNaN(coord[1])
      );
    };

    if (!isValidCoordinate(startPosition) || !isValidCoordinate(endPosition)) {
      console.error("Invalid coordinates provided", {
        startPosition,
        endPosition,
      });
      return;
    }

    // Remove existing routing control if it exists
    cleanupRoutingControl();

    // Add a small delay to ensure map is ready
    const timer = setTimeout(() => {
      try {
        // Create new routing control
        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(startPosition[0], startPosition[1]),
            L.latLng(endPosition[0], endPosition[1]),
          ],
          routeWhileDragging: false,
          showAlternatives: false,
          fitSelectedRoutes: true,
          show: false,
          createMarker: function () {
            return null; // Don't create default markers
          },
          lineOptions: {
            styles: [{ color: "#0A59CF", weight: 4, opacity: 0.7 }],
          },
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "driving",
            timeout: 15000,
          }),
          addWaypoints: false, // Prevent adding waypoints on click
          draggableWaypoints: false, // Prevent dragging waypoints
        });

        // Enhanced event listeners with better error handling
        routingControl.on("routesfound", function (e: RoutingEvent) {
          try {
            const routes = e.routes;
            if (routes && routes.length > 0) {
              const summary = routes[0].summary;
              console.log("Route found:", {
                distance: summary.totalDistance,
                time: summary.totalTime,
              });

              // Fit bounds with padding
              if (routes[0].bounds) {
                map.fitBounds(routes[0].bounds, {
                  padding: [30, 30],
                  maxZoom: 16,
                });
              }
            }
          } catch (error) {
            console.error("Error processing route:", error);
          }
        });

        routingControl.on("routingerror", function (e: RoutingEvent) {
          console.error("Routing error:", e);
          // Show user-friendly error message
          if (e.error && e.error.message) {
            console.warn("Routing service error:", e.error.message);
          }
        });

        routingControl.on("routingstart", function () {
          console.log("Routing calculation started...");
        });

        // Add error handling for the control itself
        routingControl.on("error", function (e: RoutingEvent) {
          console.error("Routing control error:", e);
        });

        // Add to map with error handling
        if (map && routingControl) {
          routingControl.addTo(map);
          routingControlRef.current = routingControl;
          isInitializedRef.current = true;
        }
      } catch (error) {
        console.error("Error creating routing control:", error);
      }
    }, 100);

    // Cleanup function
    return () => {
      clearTimeout(timer);
    };
  }, [map, startPosition, endPosition, isNavigating, cleanupRoutingControl]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      cleanupRoutingControl();
    };
  }, [cleanupRoutingControl]);

  return null;
};

export default RoutingMachine;
