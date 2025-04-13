"use client"

import { useState, useEffect } from "react"

function FilterSidebar({
  activeFilters = {},
  toggleFilter = () => {},
  dateRange = { startDate: "", endDate: "" },
  setDateRange = () => {},
  applyFilters = () => {},
  selectedDivision = "",
  setSelectedDivision = () => {},
  selectedLocations = [],
  updateSelectedLocations = () => {},
}) {
  const [startDate, setStartDate] = useState(dateRange.startDate || "")
  const [endDate, setEndDate] = useState(dateRange.endDate || "")
  const [isDateFilterActive, setIsDateFilterActive] = useState(!!dateRange.startDate || !!dateRange.endDate)
  const [dateError, setDateError] = useState("")
  const [isApplying, setIsApplying] = useState(false)
  const [locationFilters, setLocationFilters] = useState({
    "11": false, // Downtown
    "14": false, // East York
    "22": false, // North York
    "31": false, // Etobicoke
    "32": false, // York
    "41": false, // Scarborough
    "51": false, // Toronto East
  })

  const divisions = ["11", "14", "22", "31", "32", "41", "51"] // Customize this list
  const divisionNames = {
    "11": "Downtown",
    "14": "East York",
    "22": "North York",
    "31": "Etobicoke",
    "32": "York",
    "41": "Scarborough",
    "51": "Toronto East",
  }

  // Update local state when dateRange prop changes
  useEffect(() => {
    setStartDate(dateRange.startDate || "")
    setEndDate(dateRange.endDate || "")
    setIsDateFilterActive(!!dateRange.startDate || !!dateRange.endDate)
  }, [dateRange])

  const validateDates = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (start > end) {
        setDateError("Start date cannot be after end date")
        return false
      }
    }

    setDateError("")
    return true
  }

  const handleApplyFilters = () => {
    if (!validateDates()) {
      return
    }

    setIsApplying(true)

    // Update the date range in the parent component
    setDateRange({
      startDate: startDate,
      endDate: endDate,
    })

    // Update the selected division based on location filters
    const activeLocations = Object.entries(locationFilters).filter(([_, isActive]) => isActive).map(([div, _]) => div);
    
    if (activeLocations.length === 1) {
      // If only one location is selected, use that as the division filter
      setSelectedDivision(activeLocations[0]);
    } else if (activeLocations.length > 1) {
      // If multiple locations are selected, use the "multiple" value
      setSelectedDivision("multiple");
    } else {
      // If no locations are selected, clear the division filter
      setSelectedDivision("");
    }
    
    // Send the active locations to the parent component
    updateSelectedLocations(activeLocations);

    // Call the applyFilters function from props
    applyFilters()

    console.log("Applied filters:", { startDate, endDate, selectedDivision, locationFilters, activeLocations })

    // Reset applying state after a short delay
    setTimeout(() => {
      setIsApplying(false)
    }, 1000)
  }

  const handleLocationFilterToggle = (division) => {
    const newLocationFilters = {
      ...locationFilters,
      [division]: !locationFilters[division]
    };
    
    setLocationFilters(newLocationFilters);
    
    // Update the selected locations array for the parent component
    const activeLocations = Object.entries(newLocationFilters)
      .filter(([_, isActive]) => isActive)
      .map(([div, _]) => div);
    
    updateSelectedLocations(activeLocations);
  }

  const handleClearLocationFilters = () => {
    setLocationFilters({
      "11": false,
      "14": false,
      "22": false,
      "31": false,
      "32": false,
      "41": false,
      "51": false,
    });
    setSelectedDivision("");
    updateSelectedLocations([]);
  }

  const handleClearDateFilter = () => {
    setStartDate("")
    setEndDate("")
    setIsDateFilterActive(false)
    setDateError("")
    setDateRange({ startDate: "", endDate: "" })
    applyFilters()

    console.log("Cleared date filters")
  }

  // Format date for display (YYYY-MM-DD to MM/DD/YYYY)
  const formatDateForDisplay = (dateStr) => {
    if (!dateStr) return "Any"

    try {
      const date = new Date(dateStr)
      return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
    } catch (e) {
      return dateStr
    }
  }

  return (
    <div style={{ width: "250px", padding: "20px", borderRight: "1px solid #ccc", overflowY: "auto" }}>
      <h2>Filters</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={activeFilters.fatalAccidents}
              onChange={() => toggleFilter("fatalAccidents")}
            />
            <span>
              Fatal Car Accidents
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "red",
                  marginLeft: "8px",
                }}
              ></span>
            </span>
          </label>
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={activeFilters.shootingIncidents}
              onChange={() => toggleFilter("shootingIncidents")}
            />
            <span>
              Shooting Incidents
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "blue",
                  marginLeft: "8px",
                }}
              ></span>
            </span>
          </label>
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={activeFilters.homicides} onChange={() => toggleFilter("homicides")} />
            <span>
              Homicides
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "yellow",
                  marginLeft: "8px",
                }}
              ></span>
            </span>
          </label>
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={activeFilters.breakAndEnterIncidents}
              onChange={() => toggleFilter("breakAndEnterIncidents")}
            />
            <span>
              Break & Enter
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "green",
                  marginLeft: "8px",
                }}
              ></span>
            </span>
          </label>
        </div>

        <div>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={activeFilters.pedestrianKSI}
              onChange={() => toggleFilter("pedestrianKSI")}
            />
            <span>
              Pedestrian KSI
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: "purple",
                  marginLeft: "8px",
                }}
              ></span>
            </span>
          </label>
        </div>

        {/* Division Filter */}
        <div>
          <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Police Division:</label>
          <select
            value={selectedDivision}
            onChange={(e) => setSelectedDivision(e.target.value)}
            style={{
              width: "100%",
              padding: "5px",
              border: "1px solid #ddd",
              borderRadius: "4px",
            }}
          >
            <option value="">Select Division</option>
            {divisions.map((div) => (
              <option key={div} value={div}>
                Division {div}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginTop: "30px" }}>
        <h3>Filter Options</h3>

        {/* Location Filter */}
        <div style={{ marginTop: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <label style={{ fontWeight: Object.values(locationFilters).some(v => v) ? "bold" : "normal" }}>
              Location Filter:
            </label>
            {Object.values(locationFilters).some(v => v) && (
              <span
                style={{
                  color: "#4285F4",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={handleClearLocationFilters}
              >
                Clear
              </span>
            )}
          </div>
          
          <div style={{ 
            marginTop: "8px", 
            padding: "8px", 
            border: "1px solid #e0e0e0", 
            borderRadius: "4px",
            maxHeight: "150px",
            overflowY: "auto" 
          }}>
            {divisions.map((division) => (
              <div key={division}>
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  cursor: "pointer",
                  padding: "4px 0",
                  fontSize: "14px"
                }}>
                  <input
                    type="checkbox"
                    checked={locationFilters[division]}
                    onChange={() => handleLocationFilterToggle(division)}
                  />
                  <span>{divisionNames[division]} (Division {division})</span>
                </label>
              </div>
            ))}
          </div>
          
          {Object.values(locationFilters).some(v => v) && (
            <div style={{ fontSize: "12px", marginTop: "4px", color: "#666" }}>
              Showing markers in: {Object.entries(locationFilters)
                .filter(([_, isActive]) => isActive)
                .map(([div, _]) => divisionNames[div])
                .join(", ")}
            </div>
          )}
        </div>

        {/* Date Range Filter */}
        <div style={{ marginTop: "15px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
            <label style={{ fontWeight: isDateFilterActive ? "bold" : "normal" }}>Date Range:</label>
            {isDateFilterActive && (
              <span
                style={{
                  color: "#4285F4",
                  fontSize: "12px",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
                onClick={handleClearDateFilter}
              >
                Clear
              </span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "5px" }}>
            <div>
              <label style={{ fontSize: "12px", display: "block", marginBottom: "3px" }}>Start Date:</label>
              <input
                type="date"
                style={{
                  width: "100%",
                  padding: "5px",
                  border: isDateFilterActive && startDate ? "2px solid #4285F4" : "1px solid #ddd",
                  borderRadius: "4px",
                }}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setIsDateFilterActive(!!e.target.value || !!endDate)
                  validateDates()
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: "12px", display: "block", marginBottom: "3px" }}>End Date:</label>
              <input
                type="date"
                style={{
                  width: "100%",
                  padding: "5px",
                  border: isDateFilterActive && endDate ? "2px solid #4285F4" : "1px solid #ddd",
                  borderRadius: "4px",
                }}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setIsDateFilterActive(!!startDate || !!e.target.value)
                  validateDates()
                }}
              />
            </div>
          </div>

          {dateError && <div style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>{dateError}</div>}
        </div>

        <button
          style={{
            width: "100%",
            padding: "8px",
            marginTop: "15px",
            backgroundColor: isApplying ? "#2c6ecf" : "#4285F4",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: isApplying ? "wait" : "pointer",
            position: "relative",
            overflow: "hidden",
          }}
          onClick={handleApplyFilters}
          disabled={isApplying}
        >
          {isApplying ? "Applying..." : "Apply Filters"}
          {isApplying && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "30%",
                background: "rgba(255,255,255,0.3)",
                animation: "loading 1s infinite linear",
              }}
            ></div>
          )}
          <style>{`
            @keyframes loading {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(400%); }
            }
          `}</style>
        </button>

        {isDateFilterActive && (
          <div
            style={{
              marginTop: "10px",
              padding: "8px",
              backgroundColor: "#e6f2ff",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            <strong>Active Date Filter:</strong> {formatDateForDisplay(startDate)} to {formatDateForDisplay(endDate)}
            <div style={{ fontSize: "11px", marginTop: "4px", color: "#666" }}>
              Note: Dates in database are in MM/DD/YYYY format
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterSidebar