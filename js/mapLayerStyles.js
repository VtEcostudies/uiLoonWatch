/*
    Leaflet provides a limited set of style values for GeoJson elements using layer.setStyle
*/
export let mapLayerStyle = {
    signupLoonWatchStyle : {
        color: "green", //border color
        bgColor: "white", //for text display
        priColor: "green", //non-leaflet value, storage location for primary border color
        altColor: "blue", //non-leaflet value, storage location for background-contrast border color
        weight: 1,
        fillColor: "green",
        fillOpacity: 0.3
    },
    signupMissingStyle : {
        color: "black", //border color
        bgColor: "black", //for text display
        priColor: "blue", //non-leaflet value, storage location for primary border color
        altColor: "yellow", //non-leaflet value, storage location for background-contrast border color
        weight: 1,
        fillColor: "yellow",
        fillOpacity: 0.5,
        dashArray: "4"
    }
}
  