"use client"

import React, { useEffect, useState, useCallback } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { useQuery } from "@apollo/client"
import {
  GET_FATAL_ACCIDENTS,
  GET_SHOOTING_INCIDENTS,
  GET_HOMICIDES,
  GET_BREAK_AND_ENTER_INCIDENTS,
  GET_PEDESTRIAN_KSI,
} from "../graphql/queries"
import axios from "axios"

const containerStyle = {
  width: "100%",
  height: "100vh",
}

const center = {
  lat: 43.7001,
  lng: -79.4163,
}

function MapContainer({ activeFilters = {}, dateRange = { startDate: "", endDate: "" }, setIsLoading = () => {}, selectedDivision = "", selectedLocations = [] }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  })

  const [map, setMap] = useState(null)
  const [selectedAccident, setSelectedAccident] = useState(null)
  const [selectedShooting, setSelectedShooting] = useState(null)
  const [selectedHomicide, setSelectedHomicide] = useState(null)
  const [selectedBreakAndEnter, setSelectedBreakAndEnter] = useState(null)
  const [selectedPedestrianKSI, setSelectedPedestrianKSI] = useState(null)
  const [mapCenter, setMapCenter] = useState(center)
  const [mapBounds, setMapBounds] = useState(null)
  const [dataStats, setDataStats] = useState({
    fatalAccidents: 0,
    shootingIncidents: 0,
    homicides: 0,
    breakAndEnterIncidents: 0,
    pedestrianKSI: 0,
  })
  const [errors, setErrors] = useState({})
  const [divisionMarkers, setDivisionMarkers] = useState([]) // State for division markers
  const [selectedDivisions, setSelectedDivisions] = useState([]) // Track multiple selected divisions

  // Division coordinates (Toronto police divisions)
  const divisionCoordinates = {
    "11": { lat: 43.649, lng: -79.452 },
    "14": { lat: 43.655, lng: -79.419 },
    "22": { lat: 43.667, lng: -79.487 },
    "31": { lat: 43.715, lng: -79.491 },
    "32": { lat: 43.733, lng: -79.404 },
    "41": { lat: 43.725, lng: -79.265 },
    "51": { lat: 43.658, lng: -79.365 },
  }

  // Division areas - approximate bounding boxes for each division
  const divisionBounds = {
    "11": { 
      north: 43.675, south: 43.625, 
      east: -79.400, west: -79.480
    },
    "14": { 
      north: 43.685, south: 43.635, 
      east: -79.380, west: -79.450
    },
    "22": { 
      north: 43.690, south: 43.640, 
      east: -79.460, west: -79.520
    },
    "31": { 
      north: 43.740, south: 43.690, 
      east: -79.460, west: -79.530
    },
    "32": { 
      north: 43.760, south: 43.700, 
      east: -79.370, west: -79.430
    },
    "41": { 
      north: 43.750, south: 43.700, 
      east: -79.220, west: -79.300
    },
    "51": { 
      north: 43.680, south: 43.630, 
      east: -79.330, west: -79.400
    }
  }

  const divisionNames = {
    "11": "Downtown",
    "14": "East York",
    "22": "North York",
    "31": "Etobicoke",
    "32": "York",
    "41": "Scarborough",
    "51": "Toronto East",
  }

  // Function to check if a point is within a bounding box
  const isPointInBounds = (lat, lng, bounds) => {
    return (
      lat <= bounds.north &&
      lat >= bounds.south &&
      lng <= bounds.east &&
      lng >= bounds.west
    );
  }

  // Function to check if a point is within any of the selected divisions
  const isPointInSelectedDivisions = (lat, lng) => {
    // If no division filter is active, show all points
    if (!selectedDivision || selectedDivision === "") {
      return true;
    }

    // For multiple selections, check against each selected division's bounds
    if (selectedDivision === "multiple") {
      return selectedLocations.some(divId => 
        divisionBounds[divId] && isPointInBounds(lat, lng, divisionBounds[divId])
      );
    }
    
    // For single division selection
    const bounds = divisionBounds[selectedDivision];
    return bounds && isPointInBounds(lat, lng, bounds);
  }

  // Update when selected division changes
  useEffect(() => {
    console.log("Selected division changed:", selectedDivision);
    console.log("Selected locations:", selectedLocations);
    
    // Apply location filter
    if (selectedDivision === "multiple" && selectedLocations.length > 0) {
      console.log("Multiple divisions selected:", selectedLocations);
      
      // For multiple divisions, show markers for each selected division
      const markers = selectedLocations
        .filter(div => divisionCoordinates[div]) // Make sure we have coordinates
        .map(div => divisionCoordinates[div]);
      
      setDivisionMarkers(markers);
      setSelectedDivisions(selectedLocations);
      
      // If we have selected divisions, fit the map to show all of them
      if (markers.length > 0 && map) {
        const bounds = new window.google.maps.LatLngBounds();
        
        // Create larger bounds for each division
        selectedLocations.forEach(divId => {
          if (divisionBounds[divId]) {
            const divBound = divisionBounds[divId];
            // Add the corners of the bounding box
            bounds.extend({ lat: divBound.north, lng: divBound.east });
            bounds.extend({ lat: divBound.north, lng: divBound.west });
            bounds.extend({ lat: divBound.south, lng: divBound.east });
            bounds.extend({ lat: divBound.south, lng: divBound.west });
          }
        });
        
        map.fitBounds(bounds);
        
        // Calculate the center point of selected divisions
        const center = {
          lat: (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
          lng: (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2
        };
        setMapCenter(center);
        console.log("Map centered on multiple divisions:", center);
      }
    } 
    else if (selectedDivision && divisionBounds[selectedDivision]) {
      console.log("Single division selected:", selectedDivision);
      
      // Single division selected - center on the division and zoom appropriately
      const divBound = divisionBounds[selectedDivision];
      const divCenter = divisionCoordinates[selectedDivision];
      setMapCenter(divCenter);
      setDivisionMarkers([divCenter]);
      setSelectedDivisions([selectedDivision]);
      
      // Create a bounds object to fit the division
      if (map) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat: divBound.north, lng: divBound.east });
        bounds.extend({ lat: divBound.north, lng: divBound.west });
        bounds.extend({ lat: divBound.south, lng: divBound.east });
        bounds.extend({ lat: divBound.south, lng: divBound.west });
        map.fitBounds(bounds);
      }
      
      console.log("Map centered on division:", divCenter);
    } 
    else {
      console.log("No division selected, clearing division markers");
      // No division selected
      setDivisionMarkers([]);
      setSelectedDivisions([]);
    }

    // Make sure loading state is reset after location filter changes
    setIsLoading(false);
    
  }, [selectedDivision, map, selectedLocations, setIsLoading]);

  // Prepare date variables for GraphQL queries
  const dateVariables = {
    startDate: dateRange?.startDate || undefined,
    endDate: dateRange?.endDate || undefined,
  }

  // Only include date variables if they are actually set
  const queryVariables = {
    ...(dateRange?.startDate && { startDate: dateRange.startDate }),
    ...(dateRange?.endDate && { endDate: dateRange.endDate }),
    limit: 2000,   // Increase the limit to 2000 records per request to allow more data
    offset: 0     // Start from the beginning
  };

  console.log("Query variables:", queryVariables);

  // Query fatal accidents data with date range
  const {
    loading: fatalAccidentsLoading,
    error: fatalAccidentsError,
    data: fatalAccidentsData,
    refetch: refetchFatalAccidents,
  } = useQuery(GET_FATAL_ACCIDENTS, {
    variables: queryVariables,
    skip: !activeFilters.fatalAccidents,
    onCompleted: (data) => {
      console.log("Fatal accidents query completed:", data?.fatalAccidents?.length || 0, "results")
      setDataStats((prev) => ({ ...prev, fatalAccidents: data?.fatalAccidents?.length || 0 }))
      setErrors((prev) => ({ ...prev, fatalAccidents: null }))
      setIsLoading(false)
    },
    onError: (error) => {
      console.error("Fatal accidents query error:", error)
      setErrors((prev) => ({ ...prev, fatalAccidents: error.message }))
      setIsLoading(false)
    },
    fetchPolicy: "network-only", // Important: Don't use cache for date filtering
    errorPolicy: "all",         // Continue and return partial results on error
  })

  // Query shooting incidents data with date range
  const {
    loading: shootingIncidentsLoading,
    error: shootingIncidentsError,
    data: shootingIncidentsData,
    refetch: refetchShootingIncidents,
  } = useQuery(GET_SHOOTING_INCIDENTS, {
    variables: queryVariables,
    skip: !activeFilters.shootingIncidents,
    onCompleted: (data) => {
      console.log("Shooting incidents query completed:", data?.shootingIncidents?.length || 0, "results")
      setDataStats((prev) => ({ ...prev, shootingIncidents: data?.shootingIncidents?.length || 0 }))
      setErrors((prev) => ({ ...prev, shootingIncidents: null }))
      setIsLoading(false)
    },
    onError: (error) => {
      console.error("Shooting incidents query error:", error)
      setErrors((prev) => ({ ...prev, shootingIncidents: error.message }))
      setIsLoading(false)
    },
    fetchPolicy: "network-only",
  })

  // Query homicide data with date range
  const {
    loading: homicidesLoading,
    error: homicidesError,
    data: homicidesData,
    refetch: refetchHomicides,
  } = useQuery(GET_HOMICIDES, {
    variables: queryVariables,
    skip: !activeFilters.homicides,
    onCompleted: (data) => {
      console.log("Homicides query completed:", data?.homicides?.length || 0, "results")
      setDataStats((prev) => ({ ...prev, homicides: data?.homicides?.length || 0 }))
      setErrors((prev) => ({ ...prev, homicides: null }))
      setIsLoading(false)
    },
    onError: (error) => {
      console.error("Homicides query error:", error)
      setErrors((prev) => ({ ...prev, homicides: error.message }))
      setIsLoading(false)
    },
    fetchPolicy: "network-only",
  })

  // Query break and enter incidents data with date range
  const {
    loading: breakAndEnterLoading,
    error: breakAndEnterError,
    data: breakAndEnterData,
    refetch: refetchBreakAndEnter,
  } = useQuery(GET_BREAK_AND_ENTER_INCIDENTS, {
    variables: queryVariables,
    skip: !activeFilters.breakAndEnterIncidents,
    onCompleted: (data) => {
      console.log("Break and enter query completed:", data?.breakAndEnterIncidents?.length || 0, "results")
      setDataStats((prev) => ({ ...prev, breakAndEnterIncidents: data?.breakAndEnterIncidents?.length || 0 }))
      setErrors((prev) => ({ ...prev, breakAndEnterIncidents: null }))
      setIsLoading(false)
    },
    onError: (error) => {
      console.error("Break and enter query error:", error)
      setErrors((prev) => ({
        ...prev,
        breakAndEnterIncidents: `${error.message}. Try removing date filters or refreshing the page.`,
      }))
      setIsLoading(false)

      // If we get a 400 error, we'll still try to show any cached data
      if (breakAndEnterData?.breakAndEnterIncidents) {
        console.log("Using cached break and enter data despite error")
        setDataStats((prev) => ({
          ...prev,
          breakAndEnterIncidents: breakAndEnterData.breakAndEnterIncidents.length,
        }))
      }
    },
    fetchPolicy: "cache-and-network", // Try to use cache if network request fails
    errorPolicy: "all", // Continue and return partial results on error
  })

  // Query pedestrian KSI data with date range
  const {
    loading: pedestrianKSILoading,
    error: pedestrianKSIError,
    data: pedestrianKSIData,
    refetch: refetchPedestrianKSI,
  } = useQuery(GET_PEDESTRIAN_KSI, {
    variables: queryVariables,
    skip: !activeFilters.pedestrianKSI,
    onCompleted: (data) => {
      console.log("Pedestrian KSI query completed:", data?.pedestrianKSI?.length || 0, "results")
      setDataStats((prev) => ({ ...prev, pedestrianKSI: data?.pedestrianKSI?.length || 0 }))
      setErrors((prev) => ({ ...prev, pedestrianKSI: null }))
      setIsLoading(false)
    },
    onError: (error) => {
      console.error("Pedestrian KSI query error:", error)
      setErrors((prev) => ({ ...prev, pedestrianKSI: error.message }))
      setIsLoading(false)
    },
    fetchPolicy: "network-only",
  })

  // Effect to handle loading state
  useEffect(() => {
    const isCurrentlyLoading =
      fatalAccidentsLoading ||
      shootingIncidentsLoading ||
      homicidesLoading ||
      breakAndEnterLoading ||
      pedestrianKSILoading;
    
    console.log("Loading state:", isCurrentlyLoading);
    setIsLoading(isCurrentlyLoading);

    // Ensure loading is turned off after a timeout even if queries get stuck
    if (isCurrentlyLoading) {
      console.log("Loading data...");
      // Set a timeout to force isLoading to false if it takes too long
      const timeoutId = setTimeout(() => {
        console.log("Forcing loading state to complete after timeout");
        setIsLoading(false);
      }, 5000); // Force loading to complete after 5 seconds

      // Clear the timeout if loading completes normally
      return () => clearTimeout(timeoutId);
    } else {
      console.log("Data loading complete");
    }
  }, [
    fatalAccidentsLoading,
    shootingIncidentsLoading,
    homicidesLoading,
    breakAndEnterLoading,
    pedestrianKSILoading,
    setIsLoading,
  ]);

  // Function to refetch all active queries with date range
  const refetchAllActiveQueries = useCallback(() => {
    console.log("Refetching all active queries with date range:", queryVariables)

    if (activeFilters.fatalAccidents) {
      refetchFatalAccidents(queryVariables).catch((error) => {
        console.error("Error refetching fatal accidents:", error)
        setErrors((prev) => ({ ...prev, fatalAccidents: error.message }))
      })
    }

    if (activeFilters.shootingIncidents) {
      refetchShootingIncidents(queryVariables).catch((error) => {
        console.error("Error refetching shooting incidents:", error)
        setErrors((prev) => ({ ...prev, shootingIncidents: error.message }))
        setIsLoading(false)
      })
    }

    if (activeFilters.homicides) {
      refetchHomicides(queryVariables).catch((error) => {
        console.error("Error refetching homicides:", error)
        setErrors((prev) => ({ ...prev, homicides: error.message }))
        setIsLoading(false)
      })
    }

    if (activeFilters.breakAndEnterIncidents) {
      console.log("Attempting to refetch break and enter incidents...")
      refetchBreakAndEnter(queryVariables).catch((error) => {
        console.error("Error refetching break and enter incidents:", error)
        setErrors((prev) => ({ ...prev, breakAndEnterIncidents: `${error.message}. Try removing date filters.` }))
        setIsLoading(false)
      })
    }

    if (activeFilters.pedestrianKSI) {
      refetchPedestrianKSI(queryVariables).catch((error) => {
        console.error("Error refetching pedestrian KSI incidents:", error)
        setErrors((prev) => ({ ...prev, pedestrianKSI: error.message }))
        setIsLoading(false)
      })
    }
  }, [
    activeFilters,
    refetchFatalAccidents,
    refetchShootingIncidents,
    refetchHomicides,
    refetchBreakAndEnter,
    refetchPedestrianKSI,
    setIsLoading,
  ])

  // Effect to refetch data when date range or active filters change
  useEffect(() => {
    refetchAllActiveQueries()
  }, [dateRange, activeFilters, refetchAllActiveQueries])

  // Effect to adjust map bounds when data changes
  useEffect(() => {
    if (!map) return

    const hasData =
      fatalAccidentsData?.fatalAccidents?.length > 0 ||
      shootingIncidentsData?.shootingIncidents?.length > 0 ||
      homicidesData?.homicides?.length > 0 ||
      breakAndEnterData?.breakAndEnterIncidents?.length > 0 ||
      pedestrianKSIData?.pedestrianKSI?.length > 0

    if (hasData) {
      const bounds = new window.google.maps.LatLngBounds()
      let hasValidCoordinates = false

      // Add fatal accidents to bounds
      if (fatalAccidentsData?.fatalAccidents) {
        fatalAccidentsData.fatalAccidents.forEach((accident) => {
          if (accident.LATITUDE && accident.LONGITUDE) {
            bounds.extend({
              lat: accident.LATITUDE,
              lng: accident.LONGITUDE,
            })
            hasValidCoordinates = true
          }
        })
      }

      // Add shooting incidents to bounds
      if (shootingIncidentsData?.shootingIncidents) {
        shootingIncidentsData.shootingIncidents.forEach((incident) => {
          if (incident.LAT_WGS84 && incident.LONG_WGS84) {
            bounds.extend({
              lat: incident.LAT_WGS84,
              lng: incident.LONG_WGS84,
            })
            hasValidCoordinates = true
          }
        })
      }

      // Add homicides to bounds
      if (homicidesData?.homicides) {
        homicidesData.homicides.forEach((homicide) => {
          if (homicide.LAT_WGS84 && homicide.LONG_WGS84) {
            bounds.extend({
              lat: homicide.LAT_WGS84,
              lng: homicide.LONG_WGS84,
            })
            hasValidCoordinates = true
          }
        })
      }

      // Add break and enter incidents to bounds
      if (breakAndEnterData?.breakAndEnterIncidents) {
        breakAndEnterData.breakAndEnterIncidents.forEach((incident) => {
          if (incident.LAT_WGS84 && incident.LONG_WGS84) {
            bounds.extend({
              lat: incident.LAT_WGS84,
              lng: incident.LONG_WGS84,
            })
            hasValidCoordinates = true
          }
        })
      }

      // Add pedestrian KSI incidents to bounds
      if (pedestrianKSIData?.pedestrianKSI) {
        pedestrianKSIData.pedestrianKSI.forEach((incident) => {
          if (incident.LATITUDE && incident.LONGITUDE) {
            bounds.extend({
              lat: incident.LATITUDE,
              lng: incident.LONGITUDE,
            })
            hasValidCoordinates = true
          }
        })
      }

      // Only adjust bounds if we have valid coordinates
      if (hasValidCoordinates) {
        map.fitBounds(bounds)
        setMapBounds(bounds)

        const center = {
          lat: (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
          lng: (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2,
        }
        setMapCenter(center)
        console.log("Map bounds updated with new data")
      } else {
        console.log("No valid coordinates found in data")
      }
    }
  }, [map, fatalAccidentsData, shootingIncidentsData, homicidesData, breakAndEnterData, pedestrianKSIData])

  const onLoad = (map) => {
    console.log("Map loaded")
    setMap(map)
  }

  const onUnmount = () => {
    console.log("Map unmounted")
    setMap(null)
  }

  if (!isLoaded) return <div>Loading Maps...</div>

  // Format date for display (YYYY-MM-DD to MM/DD/YYYY)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return ""

    try {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    } catch (e) {
      return dateStr
    }
  }

  // Helper function to check if a marker should be displayed based on its coordinates
  const shouldShowMarker = (lat, lng) => {
    return isPointInSelectedDivisions(lat, lng);
  }

  return (
    <div style={{ flex: 1, position: "relative" }}>
      {/* Error messages */}
      {Object.entries(errors).some(([key, error]) => error && activeFilters[key]) && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            backgroundColor: "rgba(255, 220, 220, 0.95)",
            padding: "10px 15px",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            fontSize: "14px",
            maxWidth: "400px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "6px", color: "#d32f2f" }}>Error loading data:</div>
          <ul style={{ margin: "0", paddingLeft: "20px" }}>
            {Object.entries(errors).map(([key, error]) =>
              error && activeFilters[key] ? (
                <li key={key} style={{ marginBottom: "4px" }}>
                  {key.replace(/([A-Z])/g, " $1").trim()}: {error}
                </li>
              ) : null,
            )}
          </ul>
        </div>
      )}

      {/* Location filter info overlay */}
      {selectedDivision && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "8px 12px",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            fontSize: "14px",
            maxWidth: "300px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Location Filter Active:</div>
          <div>
            {selectedDivision === "multiple" 
              ? selectedLocations.map(div => divisionNames[div]).join(", ")
              : `${divisionNames[selectedDivision] || selectedDivision}`}
          </div>
        </div>
      )}

      {/* Date filter info overlay */}
      {(dateRange.startDate || dateRange.endDate) && (
        <div
          style={{
            position: "absolute",
            top: selectedDivision ? "70px" : "10px",
            left: "10px",
            right: selectedDivision ? "auto" : "10px",
            zIndex: 1000,
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "8px 12px",
            borderRadius: "4px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            fontSize: "14px",
            maxWidth: "300px",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Date Filter Active:</div>
          <div>
            {dateRange.startDate ? formatDateForDisplay(dateRange.startDate) : "Any"} to{" "}
            {dateRange.endDate ? formatDateForDisplay(dateRange.endDate) : "Any"}
          </div>
          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            {Object.entries(dataStats)
              .filter(([key, count]) => activeFilters[key] && count > 0)
              .map(([key, count]) => (
                <div key={key}>
                  {key.replace(/([A-Z])/g, " $1").trim()}: {count}
                </div>
              ))}
          </div>
        </div>
      )}

      <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={12} onLoad={onLoad} onUnmount={onUnmount}>
        {/* Division Markers */}
        {divisionMarkers.map((marker, index) => (
          <Marker
            key={`division-${index}`}
            position={marker}
            icon={{
              url: "http://maps.google.com/mapfiles/ms/icons/purple-pushpin.png",
              scaledSize: new window.google.maps.Size(30, 30),
            }}
          />
        ))}

        {/* Display Fatal Accident Markers */}
        {activeFilters.fatalAccidents &&
          fatalAccidentsData?.fatalAccidents?.filter(accident => 
            !selectedDivision || 
            accident.LATITUDE && accident.LONGITUDE && 
            shouldShowMarker(accident.LATITUDE, accident.LONGITUDE)
          ).map((accident) =>
            accident.LATITUDE && accident.LONGITUDE ? (
              <Marker
                key={accident._id}
                position={{
                  lat: accident.LATITUDE,
                  lng: accident.LONGITUDE,
                }}
                onClick={() => setSelectedAccident(accident)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null,
          )}

        {/* Display Shooting Incident Markers */}
        {activeFilters.shootingIncidents &&
          shootingIncidentsData?.shootingIncidents?.filter(incident => 
            !selectedDivision || 
            incident.LAT_WGS84 && incident.LONG_WGS84 && 
            shouldShowMarker(incident.LAT_WGS84, incident.LONG_WGS84)
          ).map((incident) =>
            incident.LAT_WGS84 && incident.LONG_WGS84 ? (
              <Marker
                key={incident._id}
                position={{
                  lat: incident.LAT_WGS84,
                  lng: incident.LONG_WGS84,
                }}
                onClick={() => setSelectedShooting(incident)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null,
          )}

        {/* Display Homicide Markers */}
        {activeFilters.homicides &&
          homicidesData?.homicides?.filter(homicide => 
            !selectedDivision || 
            homicide.LAT_WGS84 && homicide.LONG_WGS84 && 
            shouldShowMarker(homicide.LAT_WGS84, homicide.LONG_WGS84)
          ).map((homicide) =>
            homicide.LAT_WGS84 && homicide.LONG_WGS84 ? (
              <Marker
                key={homicide._id}
                position={{
                  lat: homicide.LAT_WGS84,
                  lng: homicide.LONG_WGS84,
                }}
                onClick={() => setSelectedHomicide(homicide)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null,
          )}

        {/* Display Break and Enter Incident Markers */}
        {activeFilters.breakAndEnterIncidents &&
          breakAndEnterData?.breakAndEnterIncidents?.filter(incident => 
            !selectedDivision || 
            incident.LAT_WGS84 && incident.LONG_WGS84 && 
            shouldShowMarker(incident.LAT_WGS84, incident.LONG_WGS84)
          ).map((incident) =>
            incident.LAT_WGS84 && incident.LONG_WGS84 ? (
              <Marker
                key={incident._id}
                position={{
                  lat: incident.LAT_WGS84,
                  lng: incident.LONG_WGS84,
                }}
                onClick={() => setSelectedBreakAndEnter(incident)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null,
          )}

        {/* Display Pedestrian KSI Incident Markers */}
        {activeFilters.pedestrianKSI &&
          pedestrianKSIData?.pedestrianKSI?.filter(incident => 
            !selectedDivision || 
            incident.LATITUDE && incident.LONGITUDE && 
            shouldShowMarker(incident.LATITUDE, incident.LONGITUDE)
          ).map((incident) =>
            incident.LATITUDE && incident.LONGITUDE ? (
              <Marker
                key={incident._id}
                position={{
                  lat: incident.LATITUDE,
                  lng: incident.LONGITUDE,
                }}
                onClick={() => setSelectedPedestrianKSI(incident)}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null,
          )}

        {/* InfoWindow for selected Fatal Accident */}
        {selectedAccident && (
          <InfoWindow
            position={{
              lat: selectedAccident.LATITUDE,
              lng: selectedAccident.LONGITUDE,
            }}
            onCloseClick={() => setSelectedAccident(null)}
          >
            <div>
              <h3>Fatal Accident</h3>
              <p>Date: {selectedAccident.DATE}</p>
              <p>
                Location: {selectedAccident.STREET1} & {selectedAccident.STREET2}
              </p>
              <p>District: {selectedAccident.DISTRICT}</p>
              <p>Road Condition: {selectedAccident.RDSFCOND}</p>
              <p>Light Condition: {selectedAccident.LIGHT}</p>
              <p>Driver Action: {selectedAccident.DRIVACT}</p>
              <p>Vehicle Type: {selectedAccident.VEHTYPE}</p>
            </div>
          </InfoWindow>
        )}

        {/* InfoWindow for selected Shooting Incident */}
        {selectedShooting && (
          <InfoWindow
            position={{
              lat: selectedShooting.LAT_WGS84,
              lng: selectedShooting.LONG_WGS84,
            }}
            onCloseClick={() => setSelectedShooting(null)}
          >
            <div>
              <h3>Shooting Incident</h3>
              <p>Event ID: {selectedShooting.EVENT_UNIQUE_ID}</p>
              <p>Date: {selectedShooting.OCC_DATE}</p>
              <p>Division: {selectedShooting.DIVISION}</p>
              <p>Death: {selectedShooting.DEATH}</p>
              <p>Injuries: {selectedShooting.INJURIES}</p>
            </div>
          </InfoWindow>
        )}

        {/* InfoWindow for selected Homicide */}
        {selectedHomicide && (
          <InfoWindow
            position={{
              lat: selectedHomicide.LAT_WGS84,
              lng: selectedHomicide.LONG_WGS84,
            }}
            onCloseClick={() => setSelectedHomicide(null)}
          >
            <div>
              <h3>Homicide</h3>
              <p>Event ID: {selectedHomicide.EVENT_UNIQUE_ID}</p>
              <p>Date: {selectedHomicide.OCC_DATE}</p>
              <p>Division: {selectedHomicide.DIVISION}</p>
              <p>Death: {selectedHomicide.DEATH}</p>
              <p>Injuries: {selectedHomicide.INJURIES}</p>
            </div>
          </InfoWindow>
        )}

        {/* InfoWindow for selected Break and Enter Incident */}
        {selectedBreakAndEnter && (
          <InfoWindow
            position={{
              lat: selectedBreakAndEnter.LAT_WGS84,
              lng: selectedBreakAndEnter.LONG_WGS84,
            }}
            onCloseClick={() => setSelectedBreakAndEnter(null)}
          >
            <div>
              <h3>Break and Enter Incident</h3>
              <p>Event ID: {selectedBreakAndEnter.EVENT_UNIQUE_ID}</p>
              <p>Date: {selectedBreakAndEnter.OCC_DATE}</p>
              <p>Report Date: {selectedBreakAndEnter.REPORT_DATE}</p>
              <p>Division: {selectedBreakAndEnter.DIVISION}</p>
              <p>Offense: {selectedBreakAndEnter.OFFENCE}</p>
              <p>Location Type: {selectedBreakAndEnter.LOCATION_TYPE}</p>
              <p>Premises Type: {selectedBreakAndEnter.PREMISES_TYPE}</p>
              <p>Neighborhood: {selectedBreakAndEnter.NEIGHBOURHOOD_158}</p>
            </div>
          </InfoWindow>
        )}

        {/* InfoWindow for selected Pedestrian KSI Incident */}
        {selectedPedestrianKSI && (
          <InfoWindow
            position={{
              lat: selectedPedestrianKSI.LATITUDE,
              lng: selectedPedestrianKSI.LONGITUDE,
            }}
            onCloseClick={() => setSelectedPedestrianKSI(null)}
          >
            <div>
              <h3>Pedestrian KSI Incident</h3>
              <p>Date: {selectedPedestrianKSI.DATE}</p>
              <p>
                Location: {selectedPedestrianKSI.STREET1} & {selectedPedestrianKSI.STREET2}
              </p>
              <p>Division: {selectedPedestrianKSI.DIVISION}</p>
              <p>Injury: {selectedPedestrianKSI.INJURY}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default MapContainer