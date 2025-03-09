const typeDefs = `#graphql
  type FatalAccident {
    _id: ID
    OBJECTID: Int
    INDEX: Int
    ACCNUM: Int
    DATE: String
    TIME: Int
    STREET1: String
    STREET2: String
    ROAD_CLASS: String
    DISTRICT: String
    LATITUDE: Float
    LONGITUDE: Float
    TRAFFCTL: String
    VISIBILITY: String
    LIGHT: String
    RDSFCOND: String
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
    AUTOMOBILE: String
    HOOD_158: Int
    NEIGHBOURHOOD_158: String
    HOOD_140: Int
    NEIGHBOURHOOD_140: String
    DIVISION: String
    x: Float
    y: Float
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


  type Query {
    fatalAccidents: [FatalAccident]
    fatalAccidentsByDistrict(district: String): [FatalAccident]

    shootingIncidents: [ShootingIncident]
    shootingIncidentsByDivision(division: String): [ShootingIncident]
  }
`;

module.exports = { typeDefs }

