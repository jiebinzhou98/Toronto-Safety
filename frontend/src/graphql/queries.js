import { gql } from "@apollo/client"

export const GET_FATAL_ACCIDENTS = gql`
  query GetFatalAccidents {
    fatalAccidents {
      _id
      OBJECTID
      LATITUDE
      LONGITUDE
      DATE
      TIME
      STREET1
      STREET2
      DISTRICT
      RDSFCOND
      LIGHT
      ACCLASS
      IMPACTYPE
      INVTYPE
      INVAGE
      INJURY
      INITDIR
      VEHTYPE
      MANOEUVER
      DRIVACT
      DRIVCOND
      VISIBILITY
    }
  }
`

export const GET_FATAL_ACCIDENTS_BY_DISTRICT = gql`
  query GetFatalAccidentsByDistrict($district: String!) {
    fatalAccidentsByDistrict(district: $district) {
      _id
      OBJECTID
      LATITUDE
      LONGITUDE
      DATE
      TIME
      STREET1
      STREET2
      DISTRICT
      RDSFCOND
      LIGHT
      ACCLASS
      IMPACTYPE
      INVTYPE
      INVAGE
      INJURY
      INITDIR
      VEHTYPE
      MANOEUVER
      DRIVACT
      DRIVCOND
      VISIBILITY
    }
  }
`

