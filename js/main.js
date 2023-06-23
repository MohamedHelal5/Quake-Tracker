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
// ######################################################################################################
view.popup.autoOpenEnabled = true;
view.on("click", (e) => {
    // Get the coordinates of the click on the view
    // around the decimals to 3 decimals
    var lati = Math.round(e.mapPoint.latitude * 1000 ) / 1000
    var longi = Math.round(e.mapPoint.longitude * 1000 ) / 1000
    
    // Create a locator url using the world geocoding service
    var locatorUrl = "https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer";
    
    const params = {
      location: e.mapPoint
    };

    // Execute a reverse geocode using the clicked location
    locator
    .locationToAddress(locatorUrl, params)
    .then((locaResponse) => {
      // If an address is successfully found, show it in the popup's content
          document.getElementById("mapinfo").value = ` Long : ${longi} , Lat : ${lati} 
          Area : ${locaResponse.address}`
        }).catch(() => {
        // If the promise fails and no result is found, show a generic message
        document.getElementById("mapinfo").value = "No address was found for this location";
        });
}) /* View on  */    
// #########################################################################################################################################
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
    // for li numbering
    var counter = 1;

    const ul = document.createElement('ul');
    earthquakes.forEach(eq => {

      const li = document.createElement('li');

      // change API Date Format
      var timeValue = eq.properties.time;
      var timestamp = parseInt(timeValue);
      var date = new Date(timestamp);
      var year = date.getFullYear();
      var month = date.getMonth() + 1;
      var day = date.getDate();
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var seconds = date.getSeconds();
      // date & time 
      var dateTime = `${year}-${month}-${day}  ${hours}:${minutes}:${seconds} `
      
      li.textContent = `${eq.properties.place} - Magnitude ${eq.properties.mag} - Lat : ${eq.geometry.coordinates[0]} - Long : ${eq.geometry.coordinates[1]}`;
      // numbering li tags
      const span = document.createElement("span");
      span.classList.add('li-num')
      span.textContent = counter + "- ";
      span.style.cssText = `    
                              font-weight: bold;
                              font-size: 13px;
                              margin-right: 5px;
                              color: white;
                              background-color: rgb(25, 187, 156);
                              padding: 1px 3px;
                              left: 1px;
                              position: absolute;
                              width: fit-content;
                              text-indent: 1px; 
                              border-radius: 6px; `

      li.appendChild(span);
      counter++;

      // put arrow icon 
      const arrow = document.createElement('i');
      arrow.classList.add('fa-solid', 'fa-arrow-right', 'arrow-icon');
      arrow.style.cssText = `    
                              background-color: rgb(25, 187, 156);
                              padding: 6px 6px 6px 2px;
                              cursor: pointer;
                              margin-left: 5px;
                              text-indent: 0; `

      li.appendChild(arrow);
      ul.appendChild(li);

      // Add marker to the map
      arrow.addEventListener('click', () => {
        // close modal window
        modalWindowOverlay.style.display = 'none';

        // go to earthquake point lat,long
        view.goTo({
          center : [eq.geometry.coordinates[0], eq.geometry.coordinates[1]],
          zoom: 10
        })
      });
      
      addMarker(eq.geometry.coordinates[1], eq.geometry.coordinates[0], eq.properties.place, eq.properties.mag, eq.properties.magType, dateTime, eq.geometry.coordinates[2], eq.properties.nst, eq.properties.dmin, eq.properties.rms, eq.properties.gap, eq.properties.sig, eq.properties.tsunami, eq.id );
    });

    document.querySelector(".eq-result").appendChild(ul)
    // end earthquakes.forEach

    // Sorting By Max & Min Magnitude value
    const orderSelect = document.getElementById('order-select');
    orderSelect.addEventListener('change', () => {
      const selectedValue = orderSelect.value;
      let sortedFeatures = [];

      if (selectedValue === 'maxMagnitude') {
        sortedFeatures = earthquakes.slice().sort((a, b) => {
          return b.properties.mag - a.properties.mag;
        });
      } else if (selectedValue === 'minMagnitude') {
        sortedFeatures = earthquakes.slice().sort((a, b) => {
          return a.properties.mag - b.properties.mag;
        });
      }
      displayEarthquakeData(sortedFeatures);
    });
    // end sorting
    // earthquake points details
    function addMarker(latitude, longitude, place, magnitude, magType, dateTime, depth, nst, dmin, rms, gap, sig, tsunami, id) {
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
        Magnitude: magnitude,
        MagType : magType,
        dateTime: dateTime,
        depth: depth,
        NST : nst,
        dmin: dmin,
        rms : rms,
        gap : gap,
        sig : sig,
        Tsunami : tsunami,
        id : id
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
            text: "Magnitude: {Magnitude} Richter"
          },
          {
            type: "text",
            text: "Magnitude-Type: {MagType}"
          },
          {
            type: "text",
            text: " Time: {dateTime} UTC "
          },
          {
            type: "text",
            text: " depth: {depth} km"
          },
          {
            type: "text",
            text: " Number of Stations: {NST}"
          },
          {
            type: "text",
            text: "Minimum Distance: {dmin} km"
          },
          {
            type: "text",
            text: " Root Mean Square: {rms} μm"
          },
          {
            type: "text",
            text: "Azimuthal Gap: {gap} ° "
          },
          {
            type: "text",
            text: "Significance: {sig}"
          },
          {
            type: "text",
            text: "Tsunami: {Tsunami}"
          },
          {
            type: "text",
            text: "Event ID: {id}"
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