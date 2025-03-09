"use client"

function FilterSidebar({ activeFilters, toggleFilter }) {
  return (
    <div style={{ width: "250px", padding: "20px", borderRight: "1px solid #ccc" }}>
      <h2>Filters</h2>
      <div>
        <label>
          <input
            type="checkbox"
            checked={activeFilters.fatalAccidents}
            onChange={() => toggleFilter("fatalAccidents")}
          />
          Fatal Car Accidents
        </label>
      </div>
      {/* More filters will be added here */}
    </div>
  )
}

export default FilterSidebar

