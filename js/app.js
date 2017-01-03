const FOURSQUARE_CLIENT_ID = "OYNSAXXQEBFWL2V3VVXJNZTB5RWOTYUMMKHUEGG5CVS44BKF";
const FOURSQUARE_CLIENT_SECRET = "KSS3BGAWCRRQBZPX1F20ZL5WY2BIRRBJPSRZBNP3VJAUHN0C";
const FOURSQUARE_API_VERSION = "20161221";
const GOOGLE_MAPS_JS_API_KEY = "AIzaSyApoU2dpC25z2Z45WKMGV16kdTatObgr4M";
const EVENTFUL_API_KEY = "t5wrJZZBq3bMtzvG";

function AppViewModel() {
  var self = this;
  self.firstName = "Richard";
  self.lastName = "Yhip";
  self.fullName = ko.computed(function () {
    return self.firstName + " " + self.lastName;
  }, self);
  if(currentPlace) {
    getFoursquareInformationForLocation(currentPlace[0].geometry.location.lat(), currentPlace[0].geometry.location.lng());
  }
  
}

ko.applyBindings(new AppViewModel());

// http://api.eventful.com/json/events/search?app_key=t5wrJZZBq3bMtzvG&where=38.857481,-77.196756&within=25 
// https://api.foursquare.com/v2/venues/search?ll=40.7,-74&client_id=FOURSQUARE_CLIENT_IDF&client_secret=FOURSQUARE_CLIENT_SECRET&v=20161221
// https://maps.googleapis.com/maps/api/js?key=AIzaSyApoU2dpC25z2Z45WKMGV16kdTatObgr4M&callback=initMap
function getEventfulEvents(lat, lng, map) {
  var eventfulApiUrl = "http://api.eventful.com/json/events/search?app_key=" + EVENTFUL_API_KEY + "&where=" + lat + "," + lng + "&within=25 ";
  $.ajax({
    url: eventfulApiUrl
  }).done(function (data) {
    var eventfulResultObject = JSON.parse(data);
    var events = eventfulResultObject.events.event;
    var geocoder = new google.maps.Geocoder();
    for (var i = 0; i < events.length; i++) {
      (function (event) {
        var infowindow = new google.maps.InfoWindow({
          content: event.title + "<p>" + event.venue_name
        });
        console.log(event);
        var address = event.venue_name + " " + event.venue_address + " " + event.city_name + " " + event.region_abbr + " " + event.postal_code;

        geocoder.geocode({ 'address': address }, function (results, status) {
          if (status === 'OK') {
            /*
            resultsMap.setCenter(results[0].geometry.location);
            var marker = new google.maps.Marker({
              map: resultsMap,
              position: results[0].geometry.location
            });
            */
            console.log(address);
            console.log(results);
          } else {
            console.log("Location not found");
            //alert('Geocode was not successful for the following reason: ' + status);
          }
        });

        var marker = new google.maps.Marker({
          position: { lat: parseInt(event.latitude), lng: parseInt(event.longitude) },
          map: map,
          animation: google.maps.Animation.DROP,
          icon: makeMarkerIcon("3373FF")
        });
        marker.addListener('click', function () {
          infowindow.open(map, marker);
        });
        //bounds.extend(marker.position);
      })(events[i]);
    }
    //map.fitBounds(bounds);
  });
}
/*
var address = document.getElementById('address').value;
geocoder.geocode({ 'address': address }, function (results, status) {
  if (status === 'OK') {
    resultsMap.setCenter(results[0].geometry.location);
    var marker = new google.maps.Marker({
      map: resultsMap,
      position: results[0].geometry.location
    });
  } else {
    alert('Geocode was not successful for the following reason: ' + status);
  }
});
*/
function getFoursquareInformationForLocation(lat, lng) {
  var foursquareApiUrl = "https://api.foursquare.com/v2/venues/search?ll=" + lat + "," + lng + "&client_id=" + FOURSQUARE_CLIENT_ID + "&client_secret=" + FOURSQUARE_CLIENT_SECRET + "&v=" + FOURSQUARE_API_VERSION;
  $.ajax({
    url: foursquareApiUrl
  })
    .done(function (data) {
      console.log(map);
      if (console && console.log) {
        var venues = data.response.venues;


        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < venues.length; i++) {

          (function (venue) {
            var category = "";
            for (var j = 0; j < venue.categories.length; j++) {
              category += venue.categories[j].name + " ";

            }
            console.log(category);
            var infowindow = new google.maps.InfoWindow({
              content: venue.name + "<p>" + category
            });
            var marker = new google.maps.Marker({
              position: { lat: venue.location.lat, lng: venue.location.lng },
              map: map,
              animation: google.maps.Animation.DROP,
              icon: makeMarkerIcon("FF33F2")
            });
            marker.addListener('click', function () {
              infowindow.open(map, marker);
            });
            bounds.extend(marker.position);
          })(venues[i]);

        }
        map.fitBounds(bounds);
      }
    });
}

// This example adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.

// This example requires the Places library. Include the libraries=places
// parameter when you first load the API. For example:
// <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">

var map;
var currentPlace;
function initAutocomplete() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: -33.8688, lng: 151.2195 },
    zoom: 13,
    mapTypeId: 'roadmap'
  });

  // Create the search box and link it to the UI element.
  var input = document.getElementById('pac-input');
  var searchBox = new google.maps.places.SearchBox(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

  // Bias the SearchBox results towards current map's viewport.
  map.addListener('bounds_changed', function () {
    searchBox.setBounds(map.getBounds());
  });

  var markers = [];
  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function () {
    var places = searchBox.getPlaces();
    currentPlace = places;
    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function (marker) {
      marker.setMap(null);
    });
    markers = [];

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function (place) {
      if (!place.geometry) {
        console.log("Returned place contains no geometry");
        return;
      }
      var icon = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      markers.push(new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location
      }));

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    });
    map.fitBounds(bounds);

    //getEventfulEvents(places[0].geometry.location.lat(), places[0].geometry.location.lng(), map);
  });
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21, 34));
  return markerImage;
}