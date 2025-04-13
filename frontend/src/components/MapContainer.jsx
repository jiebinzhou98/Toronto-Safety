"use client"

import React, { useEffect, useState, useCallback, useRef, useMemo } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { useQuery } from "@apollo/client"
import {
  GET_FATAL_ACCIDENTS,
  GET_SHOOTING_INCIDENTS,
  GET_HOMICIDES,
  GET_BREAK_AND_ENTER_INCIDENTS,
  GET_PEDESTRIAN_KSI,
} from "../graphql/queries"

const containerStyle = {
  width: "100%",
  height: "100vh",
}

const center = {
  lat: 43.7001,
  lng: -79.4163,
}

function MapContainer({ activeFilters = {}, dateRange = { startDate: "", endDate: "" }, setIsLoading = () => {}, selectedDivision = "", selectedLocations = [], updateActiveFilters = () => {}, setDateRange = () => {}, setSelectedDivision = () => {}, updateSelectedLocations = () => {} }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  })

  const [map, setMap] = useState(null)
  const [mapCenter, setMapCenter] = useState(center)
  const [dataStats, setDataStats] = useState({
    fatalAccidents: 0,
    shootingIncidents: 0,
    homicides: 0,
    breakAndEnterIncidents: 0,
    pedestrianKSI: 0,
  })
  const [errors, setErrors] = useState({})
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [promptInput, setPromptInput] = useState("")
  const [promptResult, setPromptResult] = useState("")

  // Flags to track states
  const isInitialRender = useRef(true)
  const isDataFetching = useRef(false)
  const queryFunctions = useRef({})

  // Division names for reference
  const divisionNames = {
    "11": "Downtown",
    "14": "East York",
    "22": "North York",
    "31": "Etobicoke",
    "32": "York",
    "41": "Scarborough",
    "51": "Toronto East",
  }

  // Prepare query variables
  const queryVariables = useMemo(() => ({
    ...(dateRange?.startDate && { startDate: dateRange.startDate }),
    ...(dateRange?.endDate && { endDate: dateRange.endDate }),
    limit: 300,
    offset: 0
  }), [dateRange])

  // Query fatal accidents
  const {
    loading: fatalAccidentsLoading,
    data: fatalAccidentsData,
    refetch: refetchFatalAccidents,
  } = useQuery(GET_FATAL_ACCIDENTS, {
    variables: queryVariables,
    skip: !activeFilters.fatalAccidents,
    onCompleted: (data) => {
      setDataStats(prev => ({ ...prev, fatalAccidents: data?.fatalAccidents?.length || 0 }))
      setErrors(prev => ({ ...prev, fatalAccidents: null }))
      // Store refetch function safely
      queryFunctions.current.fatalAccidents = refetchFatalAccidents
    },
    onError: (error) => {
      setErrors(prev => ({ ...prev, fatalAccidents: error.message }))
    },
    fetchPolicy: "network-only",
  })

  // Query shooting incidents
  const {
    loading: shootingIncidentsLoading,
    data: shootingIncidentsData,
    refetch: refetchShootingIncidents,
  } = useQuery(GET_SHOOTING_INCIDENTS, {
    variables: queryVariables,
    skip: !activeFilters.shootingIncidents,
    onCompleted: (data) => {
      setDataStats(prev => ({ ...prev, shootingIncidents: data?.shootingIncidents?.length || 0 }))
      setErrors(prev => ({ ...prev, shootingIncidents: null }))
      queryFunctions.current.shootingIncidents = refetchShootingIncidents
    },
    onError: (error) => {
      setErrors(prev => ({ ...prev, shootingIncidents: error.message }))
    },
    fetchPolicy: "network-only",
  })

  // Query homicides
  const {
    loading: homicidesLoading,
    data: homicidesData,
    refetch: refetchHomicides,
  } = useQuery(GET_HOMICIDES, {
    variables: queryVariables,
    skip: !activeFilters.homicides,
    onCompleted: (data) => {
      setDataStats(prev => ({ ...prev, homicides: data?.homicides?.length || 0 }))
      setErrors(prev => ({ ...prev, homicides: null }))
      queryFunctions.current.homicides = refetchHomicides
    },
    onError: (error) => {
      setErrors(prev => ({ ...prev, homicides: error.message }))
    },
    fetchPolicy: "network-only",
  })

  // Query break and enter incidents
  const {
    loading: breakAndEnterLoading,
    data: breakAndEnterData,
    refetch: refetchBreakAndEnter,
  } = useQuery(GET_BREAK_AND_ENTER_INCIDENTS, {
    variables: queryVariables,
    skip: !activeFilters.breakAndEnterIncidents,
    onCompleted: (data) => {
      setDataStats(prev => ({ ...prev, breakAndEnterIncidents: data?.breakAndEnterIncidents?.length || 0 }))
      setErrors(prev => ({ ...prev, breakAndEnterIncidents: null }))
      queryFunctions.current.breakAndEnter = refetchBreakAndEnter
    },
    onError: (error) => {
      setErrors(prev => ({ ...prev, breakAndEnterIncidents: error.message }))
    },
    fetchPolicy: "network-only",
  })

  // Query pedestrian KSI
  const {
    loading: pedestrianKSILoading,
    data: pedestrianKSIData,
    refetch: refetchPedestrianKSI,
  } = useQuery(GET_PEDESTRIAN_KSI, {
    variables: queryVariables,
    skip: !activeFilters.pedestrianKSI,
    onCompleted: (data) => {
      setDataStats(prev => ({ ...prev, pedestrianKSI: data?.pedestrianKSI?.length || 0 }))
      setErrors(prev => ({ ...prev, pedestrianKSI: null }))
      queryFunctions.current.pedestrianKSI = refetchPedestrianKSI
    },
    onError: (error) => {
      setErrors(prev => ({ ...prev, pedestrianKSI: error.message }))
    },
    fetchPolicy: "network-only",
  })

  // Add InfoWindow state variables
  const [infoWindowPosition, setInfoWindowPosition] = useState(null)
  const [selectedIncidentType, setSelectedIncidentType] = useState(null)
  
  // Add division coordinates
  const divisionCoordinates = {
    "11": { lat: 43.649, lng: -79.452 },
    "14": { lat: 43.655, lng: -79.419 },
    "22": { lat: 43.667, lng: -79.487 },
    "31": { lat: 43.715, lng: -79.491 },
    "32": { lat: 43.733, lng: -79.404 },
    "41": { lat: 43.725, lng: -79.265 },
    "51": { lat: 43.658, lng: -79.365 },
  }
  
  // Add division bounds
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
  
  // Add division markers state
  const [divisionMarkers, setDivisionMarkers] = useState([])

  // Function to check if a point is within a bounding box
  const isPointInBounds = (lat, lng, bounds) => {
    return (
      lat <= bounds.north &&
      lat >= bounds.south &&
      lng <= bounds.east &&
      lng >= bounds.west
    )
  }

  // Track loading state
  useEffect(() => {
    const isLoading = 
      fatalAccidentsLoading || 
      shootingIncidentsLoading || 
      homicidesLoading || 
      breakAndEnterLoading || 
      pedestrianKSILoading
    
    setIsLoading(isLoading)
    
    if (!isLoading) {
      isDataFetching.current = false
    }
  }, [
    fatalAccidentsLoading,
    shootingIncidentsLoading,
    homicidesLoading,
    breakAndEnterLoading,
    pedestrianKSILoading,
    setIsLoading
  ])

  // Function to safely refetch data
  const refetchData = useCallback(() => {
    // Skip if already fetching
    if (isDataFetching.current) return
    
    isDataFetching.current = true
    setIsLoading(true)
    
    // Count active queries
    let activeQueries = 0
    let completedQueries = 0
    
    const checkCompletion = () => {
      completedQueries++
      if (completedQueries >= activeQueries) {
        setTimeout(() => {
          isDataFetching.current = false
          setIsLoading(false)
        }, 100)
      }
    }
    
    // Fatal Accidents
    if (activeFilters.fatalAccidents && queryFunctions.current.fatalAccidents) {
      activeQueries++
      queryFunctions.current.fatalAccidents(queryVariables)
        .then(checkCompletion)
        .catch(() => checkCompletion())
    }
    
    // Shooting Incidents
    if (activeFilters.shootingIncidents && queryFunctions.current.shootingIncidents) {
      activeQueries++
      queryFunctions.current.shootingIncidents(queryVariables)
        .then(checkCompletion)
        .catch(() => checkCompletion())
    }
    
    // Homicides
    if (activeFilters.homicides && queryFunctions.current.homicides) {
      activeQueries++
      queryFunctions.current.homicides(queryVariables)
        .then(checkCompletion)
        .catch(() => checkCompletion())
    }
    
    // Break and Enter
    if (activeFilters.breakAndEnterIncidents && queryFunctions.current.breakAndEnter) {
      activeQueries++
      queryFunctions.current.breakAndEnter(queryVariables)
        .then(checkCompletion)
        .catch(() => checkCompletion())
    }
    
    // Pedestrian KSI
    if (activeFilters.pedestrianKSI && queryFunctions.current.pedestrianKSI) {
      activeQueries++
      queryFunctions.current.pedestrianKSI(queryVariables)
        .then(checkCompletion)
        .catch(() => checkCompletion())
    }
    
    // If no queries to run
    if (activeQueries === 0) {
      isDataFetching.current = false
      setIsLoading(false)
    }
  }, [activeFilters, queryVariables, setIsLoading])

  // Filter change handler
  useEffect(() => {
    // Skip initial render
    if (isInitialRender.current) {
      isInitialRender.current = false
      return
    }
    
    const timerId = setTimeout(() => {
      refetchData()
    }, 300)
    
    return () => clearTimeout(timerId)
  }, [
    activeFilters,
    dateRange,
    selectedDivision,
    selectedLocations,
    refetchData
  ])

  // Process natural language prompt
  const processPrompt = useCallback((prompt) => {
    if (!prompt.trim()) return
    
    const newActiveFilters = {
      fatalAccidents: false,
      shootingIncidents: false,
      homicides: false,
      breakAndEnterIncidents: false,
      pedestrianKSI: false,
    }
    
    const newDateRange = { 
      startDate: "", 
      endDate: "" 
    }
    
    let newSelectedDivision = ""
    let newSelectedLocations = []
    let result = "Showing "
    
    // Check for incident types
    const promptLower = prompt.toLowerCase()
    
    if (promptLower.includes("fatal") || promptLower.includes("accident")) {
      newActiveFilters.fatalAccidents = true
      result += "fatal accidents "
    }
    
    if (promptLower.includes("shoot") || promptLower.includes("gun")) {
      newActiveFilters.shootingIncidents = true
      result += "shooting incidents "
    }
    
    if (promptLower.includes("homicide") || promptLower.includes("murder")) {
      newActiveFilters.homicides = true
      result += "homicides "
    }
    
    if (promptLower.includes("break") || promptLower.includes("enter") || promptLower.includes("theft")) {
      newActiveFilters.breakAndEnterIncidents = true
      result += "break and enter incidents "
    }
    
    if (promptLower.includes("pedestrian") || promptLower.includes("ksi")) {
      newActiveFilters.pedestrianKSI = true
      result += "pedestrian KSI incidents "
    }
    
    // If no specific type is mentioned but "all" is, show everything
    if (promptLower.includes("all") && 
        !Object.values(newActiveFilters).some(v => v)) {
      Object.keys(newActiveFilters).forEach(key => {
        newActiveFilters[key] = true
      })
      result = "Showing all incidents "
    }
    
    // Check for locations
    Object.entries(divisionNames).forEach(([divId, name]) => {
      if (promptLower.includes(name.toLowerCase()) || promptLower.includes(divId)) {
        newSelectedLocations.push(divId)
        result += `in ${name} `
      }
    })
    
    if (newSelectedLocations.length === 1) {
      newSelectedDivision = newSelectedLocations[0]
    } else if (newSelectedLocations.length > 1) {
      newSelectedDivision = "multiple"
    }
    
    // Check for years
    const yearRegex = /\b(20\d{2})\b/g
    const years = promptLower.match(yearRegex)
    
    if (years && years.length > 0) {
      if (years.length === 1) {
        newDateRange.startDate = `${years[0]}-01-01`
        newDateRange.endDate = `${years[0]}-12-31`
        result += `in ${years[0]} `
      } else if (years.length >= 2) {
        const sortedYears = [...years].sort()
        newDateRange.startDate = `${sortedYears[0]}-01-01`
        newDateRange.endDate = `${sortedYears[sortedYears.length - 1]}-12-31`
        result += `from ${sortedYears[0]} to ${sortedYears[sortedYears.length - 1]} `
      }
    }
    
    // Apply filters if any incident type is selected
    if (Object.values(newActiveFilters).some(v => v)) {
      setPromptResult(result)
      
      // Update filters - this will trigger refetching through the effect
      updateActiveFilters(newActiveFilters)
      setDateRange(newDateRange)
      setSelectedDivision(newSelectedDivision)
      updateSelectedLocations(newSelectedLocations)
    } else {
      setPromptResult("Please specify what type of incidents you want to see.")
    }
  }, [divisionNames, updateActiveFilters, setDateRange, setSelectedDivision, updateSelectedLocations])

  // Reset all filters
  const resetAllFilters = useCallback(() => {
    updateActiveFilters({
      fatalAccidents: false,
      shootingIncidents: false,
      homicides: false,
      breakAndEnterIncidents: false,
      pedestrianKSI: false,
    })
    setDateRange({ startDate: "", endDate: "" })
    setSelectedDivision("")
    updateSelectedLocations([])
    setPromptInput("")
    setPromptResult("")
  }, [updateActiveFilters, setDateRange, setSelectedDivision, updateSelectedLocations])

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

  // Map loading handlers  
  const onLoad = useCallback(map => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  // Add function for checking if point is in selected divisions
  const isPointInSelectedDivisions = useCallback((lat, lng) => {
    // If no division filter is active, show all points
    if (!selectedDivision || selectedDivision === "") {
      return true
    }

    // For multiple selections, check against each selected division's bounds
    if (selectedDivision === "multiple") {
      return selectedLocations.some(divId => 
        divisionBounds[divId] && isPointInBounds(lat, lng, divisionBounds[divId])
      )
    }
    
    // For single division selection
    const bounds = divisionBounds[selectedDivision]
    return bounds && isPointInBounds(lat, lng, bounds)
  }, [selectedDivision, selectedLocations])

  // Add helper function to check if a marker should be displayed
  const shouldShowMarker = useCallback((lat, lng) => {
    return isPointInSelectedDivisions(lat, lng)
  }, [isPointInSelectedDivisions])
  
  // Add marker selection handler
  const handleMarkerSelect = useCallback((incident, type) => {
    setSelectedIncidentType(type)
    setSelectedIncident(incident)
    
    // Set position based on incident type
    if (type === 'accident' || type === 'pedestrianKSI') {
      setInfoWindowPosition({
        lat: incident.LATITUDE,
        lng: incident.LONGITUDE
      })
    } else {
      // For shooting, homicide, and break and enter
      setInfoWindowPosition({
        lat: incident.LAT_WGS84,
        lng: incident.LONG_WGS84
      })
    }
  }, [])
  
  // Add function to close info window
  const closeInfoWindow = useCallback(() => {
    setSelectedIncident(null)
    setSelectedIncidentType(null)
    setInfoWindowPosition(null)
  }, [])
  
  // Add effect to set division markers when division changes
  useEffect(() => {
    if (selectedDivision && selectedDivision !== "") {
      if (selectedDivision === "multiple") {
        // Set markers for multiple divisions
        const markers = selectedLocations.map(divId => divisionCoordinates[divId])
        setDivisionMarkers(markers.filter(Boolean))
      } else {
        // Set marker for single division
        const marker = divisionCoordinates[selectedDivision]
        setDivisionMarkers(marker ? [marker] : [])
      }
    } else {
      // Clear markers if no division selected
      setDivisionMarkers([])
    }
  }, [selectedDivision, selectedLocations])

  if (!isLoaded) return <div>Loading Maps...</div>

  return (
    <div style={{ flex: 1, position: "relative" }}>
      {/* AI Command Interface */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "15px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          width: "350px",
        }}
      >
        <div style={{ marginBottom: "10px", fontWeight: "bold" }}>
          <span>AI Map Assistant</span>
        </div>
        <div style={{ display: "flex", marginBottom: "10px" }}>
          <input
            type="text"
            placeholder="e.g., 'Show homicides in Downtown in 2022'"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            style={{
              flex: 1,
              padding: "8px 12px",
              borderRadius: "4px 0 0 4px",
              border: "1px solid #ccc",
              fontSize: "14px",
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                processPrompt(promptInput)
              }
            }}
          />
          <button
            onClick={() => processPrompt(promptInput)}
            style={{
              backgroundColor: "#4285F4",
              color: "white",
              border: "none",
              borderRadius: "0 4px 4px 0",
              padding: "0 15px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </div>
        
        {promptResult && (
          <div style={{
            backgroundColor: "#f2f9ff", 
            padding: "8px 12px", 
            borderRadius: "4px",
            fontSize: "14px",
            borderLeft: "3px solid #4285F4"
          }}>
            {promptResult}
          </div>
        )}
        
        <button
          onClick={resetAllFilters}
          style={{
            backgroundColor: "#f5f5f5",
            color: "#666",
            border: "1px solid #ddd",
            borderRadius: "4px",
            padding: "8px 12px",
            fontSize: "14px",
            cursor: "pointer",
            marginTop: "10px",
            width: "100%"
          }}
        >
          Reset All Filters
        </button>
        
        <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
          Try: "Show fatal accidents in 2019" or "Homicides in Scarborough"
        </div>
      </div>
      
      {/* Add location filter info overlay */}
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
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Location Filter:</div>
          <div>
            {selectedDivision === "multiple" 
              ? selectedLocations.map(div => divisionNames[div]).join(", ")
              : `${divisionNames[selectedDivision] || selectedDivision}`}
          </div>
        </div>
      )}
      
      {/* Update date filter position */}
      {(dateRange.startDate || dateRange.endDate) && (
        <div
          style={{
            position: "absolute",
            top: selectedDivision ? "70px" : "10px",
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
          <div style={{ fontWeight: "bold", marginBottom: "4px" }}>Date Filter:</div>
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

      <GoogleMap 
        mapContainerStyle={containerStyle} 
        center={mapCenter} 
        zoom={12} 
        onLoad={onLoad} 
        onUnmount={onUnmount}
        onClick={closeInfoWindow}
      >
        {/* Add Division Markers */}
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
        
        {/* Update all incident markers to include filtering and click handlers */}
        
        {/* Fatal Accident Markers */}
        {activeFilters.fatalAccidents &&
          fatalAccidentsData?.fatalAccidents?.filter(accident => 
            !selectedDivision || 
            (accident.LATITUDE && accident.LONGITUDE && 
            shouldShowMarker(accident.LATITUDE, accident.LONGITUDE))
          ).map((accident) => 
            accident.LATITUDE && accident.LONGITUDE ? (
              <Marker
                key={accident._id}
                position={{
                  lat: accident.LATITUDE,
                  lng: accident.LONGITUDE,
                }}
                onClick={() => handleMarkerSelect(accident, 'accident')}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null
          )}

        {/* Shooting Incident Markers */}
        {activeFilters.shootingIncidents &&
          shootingIncidentsData?.shootingIncidents?.filter(incident => 
            !selectedDivision || 
            (incident.LAT_WGS84 && incident.LONG_WGS84 && 
            shouldShowMarker(incident.LAT_WGS84, incident.LONG_WGS84))
          ).map((incident) =>
            incident.LAT_WGS84 && incident.LONG_WGS84 ? (
              <Marker
                key={incident._id}
                position={{
                  lat: incident.LAT_WGS84,
                  lng: incident.LONG_WGS84,
                }}
                onClick={() => handleMarkerSelect(incident, 'shooting')}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null
          )}

        {/* Homicide Markers */}
        {activeFilters.homicides &&
          homicidesData?.homicides?.filter(homicide => 
            !selectedDivision || 
            (homicide.LAT_WGS84 && homicide.LONG_WGS84 && 
            shouldShowMarker(homicide.LAT_WGS84, homicide.LONG_WGS84))
          ).map((homicide) =>
            homicide.LAT_WGS84 && homicide.LONG_WGS84 ? (
              <Marker
                key={homicide._id}
                position={{
                  lat: homicide.LAT_WGS84,
                  lng: homicide.LONG_WGS84,
                }}
                onClick={() => handleMarkerSelect(homicide, 'homicide')}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null
          )}

        {/* Break and Enter Markers */}
        {activeFilters.breakAndEnterIncidents &&
          breakAndEnterData?.breakAndEnterIncidents?.filter(incident => 
            !selectedDivision || 
            (incident.LAT_WGS84 && incident.LONG_WGS84 && 
            shouldShowMarker(incident.LAT_WGS84, incident.LONG_WGS84))
          ).map((incident) =>
            incident.LAT_WGS84 && incident.LONG_WGS84 ? (
              <Marker
                key={incident._id}
                position={{
                  lat: incident.LAT_WGS84,
                  lng: incident.LONG_WGS84,
                }}
                onClick={() => handleMarkerSelect(incident, 'breakAndEnter')}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null
          )}

        {/* Pedestrian KSI Markers */}
        {activeFilters.pedestrianKSI &&
          pedestrianKSIData?.pedestrianKSI?.filter(incident => 
            !selectedDivision || 
            (incident.LATITUDE && incident.LONGITUDE && 
            shouldShowMarker(incident.LATITUDE, incident.LONGITUDE))
          ).map((incident) =>
            incident.LATITUDE && incident.LONGITUDE ? (
              <Marker
                key={incident._id}
                position={{
                  lat: incident.LATITUDE,
                  lng: incident.LONGITUDE,
                }}
                onClick={() => handleMarkerSelect(incident, 'pedestrianKSI')}
                icon={{
                  url: "http://maps.google.com/mapfiles/ms/icons/purple-dot.png",
                  scaledSize: new window.google.maps.Size(30, 30),
                }}
              />
            ) : null
          )}
          
        {/* Add InfoWindow */}
        {selectedIncident && infoWindowPosition && (
          <InfoWindow
            position={infoWindowPosition}
            onCloseClick={closeInfoWindow}
            options={{ maxWidth: 320 }}
          >
            <div style={{ padding: "5px", maxWidth: "300px" }}>
              {selectedIncidentType === 'accident' && (
                <>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>Fatal Accident</h3>
                  <p style={{ margin: "4px 0" }}>Date: {selectedIncident.DATE || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Location: {selectedIncident.STREET1 || ''} & {selectedIncident.STREET2 || ''}</p>
                  <p style={{ margin: "4px 0" }}>District: {selectedIncident.DISTRICT || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Road Condition: {selectedIncident.RDSFCOND || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Light Condition: {selectedIncident.LIGHT || 'N/A'}</p>
                </>
              )}
              
              {selectedIncidentType === 'shooting' && (
                <>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>Shooting Incident</h3>
                  <p style={{ margin: "4px 0" }}>Event ID: {selectedIncident.EVENT_UNIQUE_ID || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Date: {selectedIncident.OCC_DATE || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Division: {selectedIncident.DIVISION || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Death: {selectedIncident.DEATH || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Injuries: {selectedIncident.INJURIES || 'N/A'}</p>
                </>
              )}
              
              {selectedIncidentType === 'homicide' && (
                <>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>Homicide</h3>
                  <p style={{ margin: "4px 0" }}>Event ID: {selectedIncident.EVENT_UNIQUE_ID || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Date: {selectedIncident.OCC_DATE || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Division: {selectedIncident.DIVISION || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Death: {selectedIncident.DEATH || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Injuries: {selectedIncident.INJURIES || 'N/A'}</p>
                </>
              )}
              
              {selectedIncidentType === 'breakAndEnter' && (
                <>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>Break and Enter Incident</h3>
                  <p style={{ margin: "4px 0" }}>Event ID: {selectedIncident.EVENT_UNIQUE_ID || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Date: {selectedIncident.OCC_DATE || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Division: {selectedIncident.DIVISION || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Offense: {selectedIncident.OFFENCE || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Location Type: {selectedIncident.LOCATION_TYPE || 'N/A'}</p>
                </>
              )}
              
              {selectedIncidentType === 'pedestrianKSI' && (
                <>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>Pedestrian KSI Incident</h3>
                  <p style={{ margin: "4px 0" }}>Date: {selectedIncident.DATE || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Location: {selectedIncident.STREET1 || ''} & {selectedIncident.STREET2 || ''}</p>
                  <p style={{ margin: "4px 0" }}>Division: {selectedIncident.DIVISION || 'N/A'}</p>
                  <p style={{ margin: "4px 0" }}>Injury: {selectedIncident.INJURY || 'N/A'}</p>
                </>
              )}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  )
}

export default MapContainer