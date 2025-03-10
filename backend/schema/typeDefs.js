// typedefs.js

const typeDefs = `#graphql
  type FatalAccident {
    _id: ID
    OBJECTID: Int
    LATITUDE: Float
    LONGITUDE: Float
    DATE: String
    TIME: Int
    STREET1: String
    STREET2: String
    DISTRICT: String
    RDSFCOND: String
    LIGHT: String
    ACCLASS: String
    IMPACTYPE: String
    INVTYPE: String
    INVAGE: String
    INJURY: String
    INITDIR: String
    VEHTYPE: String
    MANOEUVER: String
    DRIVACT: String
    DRIVCOND: String
    VISIBILITY: String
  }

  type ShootingIncident {
    _id: ID
    EVENT_UNIQUE_ID: String
    OCC_DATE: String
    DIVISION: String
    DEATH: String
    INJURIES: String
    LAT_WGS84: Float
    LONG_WGS84: Float
  }

  type Homicide {
    _id: ID
    OBJECTID: Int
    EVENT_UNIQUE_ID: String
    OCC_DATE: String
    DIVISION: String
    DEATH: String
    INJURIES: String
    LAT_WGS84: Float
    LONG_WGS84: Float
  }

  type BreakAndEnterIncident {
    _id: ID
    OBJECTID: Int
    EVENT_UNIQUE_ID: String
    OCC_DATE: String
    OCC_YEAR: Int
    OCC_MONTH: String
    OCC_DOW: String
    OCC_DOY: Int
    OCC_DAY: Int
    OCC_HOUR: Int
    DIVISION: String
    LOCATION_TYPE: String
    UCR_CODE: Int
    UCR_EXT: Int
    OFFENCE: String
    DEATH: String
    INJURIES: String
    LAT_WGS84: Float
    LONG_WGS84: Float
    x: Float
    y: Float
  }

  type Query {
    fatalAccidents: [FatalAccident]
    fatalAccidentsByDistrict(district: String): [FatalAccident]

    shootingIncidents: [ShootingIncident]
    shootingIncidentsByDivision(division: String): [ShootingIncident]

    homicides: [Homicide]
    homicidesByDivision(division: String): [Homicide]

    breakAndEnterIncidents: [BreakAndEnterIncident]
    breakAndEnterIncidentsByNeighborhood(neighborhood: String): [BreakAndEnterIncident]
  }
`;

module.exports = { typeDefs };
