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
  onOpenGoogleMaps?: (start: [number, number], end: [number, number]) => void;
}

const RoutingMachine: React.FC<RoutingMachineProps> = ({
  startPosition,
  endPosition,
  isNavigating,
  onOpenGoogleMaps,
}) => {
  const map = useMap();
  const routingControlRef = useRef<RoutingControl | null>(null);
  const isInitializedRef = useRef(false);
  const setupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect mobile device
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // Fungsi untuk membersihkan routing control dengan aman
  const cleanupRoutingControl = useCallback(() => {
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }

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
    // Clear any existing timeout first
    if (setupTimeoutRef.current) {
      clearTimeout(setupTimeoutRef.current);
      setupTimeoutRef.current = null;
    }

    if (!map || !isNavigating || !startPosition || !endPosition) {
      // Cleanup existing routing control if navigation is turned off
      cleanupRoutingControl();
      return;
    }

    // Prevent multiple initializations
    if (isInitializedRef.current && routingControlRef.current) {
      console.log("Routing already initialized, skipping...");
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

    // Add delay with mobile optimization - longer delay for mobile to ensure stability
    setupTimeoutRef.current = setTimeout(() => {
      // Double check conditions after timeout
      if (!map || !isNavigating || !startPosition || !endPosition) {
        return;
      }

      try {
        console.log('Setting up routing from:', startPosition, 'to:', endPosition, 'Mobile:', isMobile);
        
        // Create new routing control with mobile optimizations
        const routingControl = L.Routing.control({
          waypoints: [
            L.latLng(startPosition[0], startPosition[1]),
            L.latLng(endPosition[0], endPosition[1]),
          ],
          routeWhileDragging: false,
          showAlternatives: false,
          fitSelectedRoutes: true,
          show: false, // Always hide instruction panel
          createMarker: function () {
            return null; // Don't create default markers
          },
          lineOptions: {
            styles: [{ 
              color: "#0A59CF", 
              weight: isMobile ? 6 : 5, // Thicker line on mobile
              opacity: isMobile ? 0.9 : 0.8 
            }],
          },
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
            profile: "driving",
            timeout: isMobile ? 30000 : 20000, // Longer timeout for mobile
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
              const distance = (summary.totalDistance / 1000).toFixed(1); // km
              const time = Math.round(summary.totalTime / 60); // minutes
              
              console.log("Route found:", {
                distance: `${distance} km`,
                time: `${time} menit`,
              });

              // Fit bounds with mobile-optimized padding
              if (routes[0].bounds) {
                map.fitBounds(routes[0].bounds, {
                  padding: isMobile ? [20, 20] : [30, 30],
                  maxZoom: isMobile ? 15 : 16,
                });
              }

              // Force map invalidation on mobile for stability
              if (isMobile) {
                setTimeout(() => {
                  map.invalidateSize();
                }, 100);
              }

              // Show Google Maps option when route is found
              if (onOpenGoogleMaps) {
                onOpenGoogleMaps(startPosition, endPosition);
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
          // Fallback: show Google Maps option even if routing fails
          if (onOpenGoogleMaps) {
            onOpenGoogleMaps(startPosition, endPosition);
          }
        });

        routingControl.on("routingstart", function () {
          console.log("Routing calculation started...");
        });

        // Add error handling for the control itself
        routingControl.on("error", function (e: RoutingEvent) {
          console.error("Routing control error:", e);
        });

        // Add to map with mobile-specific error handling
        if (map && routingControl) {
          try {
            routingControl.addTo(map);
            routingControlRef.current = routingControl;
            isInitializedRef.current = true;
            console.log("Routing control added successfully");
          } catch (addError) {
            console.error("Error adding routing control to map:", addError);
          }
        }
      } catch (error) {
        console.error("Error creating routing control:", error);
      }
    }, isMobile ? 800 : 400); // Much longer delay for mobile stability

    // Cleanup function
    return () => {
      if (setupTimeoutRef.current) {
        clearTimeout(setupTimeoutRef.current);
        setupTimeoutRef.current = null;
      }
    };
  }, [map, startPosition, endPosition, isNavigating, cleanupRoutingControl, onOpenGoogleMaps, isMobile]);

  // Cleanup effect when component unmounts
  useEffect(() => {
    return () => {
      cleanupRoutingControl();
    };
  }, [cleanupRoutingControl]);

  // Handle mobile orientation changes and resize events
  useEffect(() => {
    if (!isMobile || !map) return;

    const handleResize = () => {
      setTimeout(() => {
        if (map && routingControlRef.current) {
          map.invalidateSize();
          console.log("Map size invalidated due to resize");
        }
      }, 100);
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        if (map && routingControlRef.current) {
          map.invalidateSize();
          console.log("Map size invalidated due to orientation change");
        }
      }, 500);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [map, isMobile]);

  return null;
};

export default RoutingMachine;
