require([
    "esri/rest/locator",
    "esri/Map",
    "esri/views/MapView",
    "esri/widgets/Search",
    "esri/widgets/ScaleBar",
    "esri/geometry/Point",
    'esri/symbols/SimpleMarkerSymbol',
    "esri/Graphic",
    "esri/layers/GraphicsLayer",
    "esri/PopupTemplate",
    "esri/widgets/Popup",
  ], function (locator,Map, MapView, Search, ScaleBar, Point,SimpleMarkerSymbol, Graphic, GraphicsLayer,PopupTemplate, Popup) {
    const map = new Map({
      basemap: "streets-navigation-vector"
    });
    const view = new MapView({
      container: "viewDiv",
      map: map,
      zoom : 4,
      center: [30.062, 31.249] // Default center coordinates (Cairo)
    });

    const graphicsLayer = new GraphicsLayer();
    map.add(graphicsLayer);
// ############################### start widget #####################################
    // home 
    document.querySelector(".map-home").onclick = function () {
      view.center = [30.062, 31.249]
      view.zoom = 4
    }
    // Scale bar
    let scaleBar = new ScaleBar({
        view: view,
        unit: "dual"
    });
    view.ui.add(scaleBar, {
        position: "bottom-left"
    });
    // Search
    const searchWidget = new Search({
        view: view
    });
    view.ui.add(searchWidget, {
        position: "top-right",
        index: 2
    });
// ############################### end widget #####################################
    const form = document.getElementById('searchForm');
    const startTimeInput = document.getElementById('startTimeInput');
    const minMagnitudeInput = document.getElementById('minMagnitudeInput');
    const maxMagnitudeInput = document.getElementById('maxMagnitudeInput');
    const limitInput = document.getElementById('limitInput');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', e => {
      e.preventDefault();
      const startTime = startTimeInput.value;
      const minMagnitude = parseFloat(minMagnitudeInput.value);
      const maxMagnitude = parseFloat(maxMagnitudeInput.value);
      const limit = parseInt(limitInput.value);
      searchEarthquakeData(startTime, minMagnitude, maxMagnitude, limit);
    });

    function searchEarthquakeData(startTime, minMagnitude, maxMagnitude, limit) {
      const apiUrl = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=${minMagnitude}&maxmagnitude=${maxMagnitude}&orderby=time&limit=${limit}&starttime=${startTime}`;
      
      fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
          const earthquakes = data.features;
          displayEarthquakeData(earthquakes);
        })
        .catch(error => {
          console.error('Error:', error);
          resultDiv.innerHTML = 'An error occurred while fetching earthquake data.';
        });
    }

  function displayEarthquakeData(earthquakes) {
    resultDiv.innerHTML = '';
    if (earthquakes.length === 0) {
      resultDiv.innerHTML = 'No earthquakes found for the provided parameters.';
      return;
    }
  
    const ul = document.createElement('ul');
    earthquakes.forEach(eq => {
      const li = document.createElement('li');
      li.textContent = `${eq.properties.place} - Magnitude ${eq.properties.mag} - Lat : ${eq.geometry.coordinates[0]} - Long : ${eq.geometry.coordinates[1]}`;

      ul.appendChild(li);
      // Add marker to the map
    addMarker(eq.geometry.coordinates[1], eq.geometry.coordinates[0], eq.properties.place, eq.properties.mag);
    });
    document.querySelector(".eq-result").appendChild(ul)

    function addMarker(latitude, longitude, place, magnitude) {
      const point = new Point({
        longitude: longitude,
        latitude: latitude
      });
  
      var markerSymbol = ({
        type: "simple-marker",
        color: [226, 119, 40],
        outline: {
          color: [255, 255, 255],
          width: 2
        }
      });
    
      const attributes = {
        Place: place,
        Latitude: latitude,
        Longitude: longitude,
        Magnitude: magnitude
      };
    
      const popupTemplate = new PopupTemplate({
        title: "Earthquake Lat : {Latitude},Long : {Longitude}",
        content: [
          {
            type: "text",
            text: `Earthquake Info : {Place}`
          },
          {
            type: "text",
            text: "Magnitude: {Magnitude}"
          }
        ]
      });
    
      const graphic = new Graphic({
        geometry: point,
        symbol: markerSymbol,
        attributes: attributes,
        popupTemplate: popupTemplate
      });
    
      graphicsLayer.add(graphic);
    }
}

// #######################################3333###############################################################
    view.popup.autoOpenEnabled = false;
    view.on("click", (e) => {
      // Get the coordinates of the click on the view
      // around the decimals to 3 decimals
      var lati = Math.round(e.mapPoint.latitude * 1000 ) / 1000
      var longi = Math.round(e.mapPoint.longitude * 1000 ) / 1000
  
      // Create a popup template for the Earthquake location information
      var popupTemplate = new PopupTemplate({
        title: "Earthquake Location Information",
        content: [
          {
            type: "text",
            text: `<b>Latitude:</b> {latitude}<br><b>Longitude:</b> {longitude}`
          }
        ]
      });
  
      // Create a popup instance with the popup template
      var popup = new Popup({
        view: view,
        content: popupTemplate
      });

      // Create a locator url using the world geocoding service
      var locatorUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";

      const params = {
          location: e.mapPoint
      };

      // Execute a reverse geocode using the clicked location
      locator
          .locationToAddress(locatorUrl, params)
          .then((response) => {
      // If an address is successfully found, show it in the popup's content
          view.popup.content = `${response.address}`;
      }).catch(() => {
      // If the promise fails and no result is found, show a generic message
          view.popup.content = "No address was found for this location";
      });

      // Set the popup content with the searched location coordinates
      popup.content = ("{latitude}", lati + "{longitude}", longi);
      view.popup.open({
        // Set the popup's title to the coordinates of the clicked location
        title: `Your Location : [ Lat: ${lati} , long: ${longi} ]`,
        location: e.mapPoint, // Set the location of the popup to the clicked location
    })
    }) /* View on  */    
});
// #########################################################  Modal ####################################################################
// Show Modal
const openModalButton = document.getElementById("open-modal");
const modalWindowOverlay = document.getElementById("modal-overlay");
const showModalWindow = () => {
  modalWindowOverlay.style.display = 'flex';
}
openModalButton.addEventListener("click", showModalWindow);
// Hide Modal
const closeModalButton = document.getElementById("close-modal");
const hideModalWindow = () => {
    modalWindowOverlay.style.display = 'none';
}
closeModalButton.addEventListener("click", hideModalWindow);
// Hide On Blur
const hideModalWindowOnBlur = (e) => {
    if(e.target === e.currentTarget) {
      console.log(e.target === e.currentTarget)
        hideModalWindow();
    }
}
modalWindowOverlay.addEventListener("click", hideModalWindowOnBlur)