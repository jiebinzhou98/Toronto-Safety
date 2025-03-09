"use client"

import { useEffect, useState } from "react"
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api"
import { useQuery } from "@apollo/client"
import { GET_FATAL_ACCIDENTS } from "../graphql/queries"

const containerStyle = {
  width: "100%",
  height: "100vh",
}

// Toronto center as default
const center = {
  lat: 43.7001,
  lng: -79.4163,
}

function MapContainer({ activeFilters, setIsLoading }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  })

  const [map, setMap] = useState(null)
  const [selectedAccident, setSelectedAccident] = useState(null)
  const [mapCenter, setMapCenter] = useState(center)
  const [mapBounds, setMapBounds] = useState(null)

  // Query fatal accidents data
  const { loading, error, data } = useQuery(GET_FATAL_ACCIDENTS, {
    skip: !activeFilters.fatalAccidents,
    onCompleted: () => setIsLoading(false),
    onError: () => setIsLoading(false),
  })

  // Set loading state when query is in progress
  useEffect(() => {
    if (loading) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
    }
  }, [loading, setIsLoading])

  

  // When data is loaded, adjust map bounds to fit all markers
  useEffect(() => {
    if (data && data.fatalAccidents && data.fatalAccidents.length > 0 && map) {
      const bounds = new window.google.maps.LatLngBounds()

      data.fatalAccidents.forEach((accident) => {
        if (accident.LATITUDE && accident.LONGITUDE) {
          bounds.extend({
            lat: accident.LATITUDE,
            lng: accident.LONGITUDE,
          })
        }
      })

      map.fitBounds(bounds)
      setMapBounds(bounds)

      // Calculate center from bounds
      const center = {
        lat: (bounds.getNorthEast().lat() + bounds.getSouthWest().lat()) / 2,
        lng: (bounds.getNorthEast().lng() + bounds.getSouthWest().lng()) / 2,
      }
      setMapCenter(center)
    }
  }, [data, map])

  const onLoad = (map) => {
    setMap(map)
  }

  const onUnmount = () => {
    setMap(null)
  }

  if (!isLoaded) return <div>Loading Maps...</div>
  if (loading) return <div>Loading accident data...</div>
  if (error) return <div>Error loading data: {error.message}</div>

  return (
    <div style={{ flex: 1 }}>
      <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={10} onLoad={onLoad} onUnmount={onUnmount}>
        {activeFilters.fatalAccidents &&
          data?.fatalAccidents.map((accident) =>
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
      </GoogleMap>
    </div>
  )
}

export default MapContainer

