const FOURSQUARE_CLIENT_ID = "OYNSAXXQEBFWL2V3VVXJNZTB5RWOTYUMMKHUEGG5CVS44BKF";
const FOURSQUARE_CLIENT_SECRET = "KSS3BGAWCRRQBZPX1F20ZL5WY2BIRRBJPSRZBNP3VJAUHN0C";
const FOURSQUARE_API_VERSION = "20161221";
const GOOGLE_MAPS_JS_API_KEY = "AIzaSyApoU2dpC25z2Z45WKMGV16kdTatObgr4M";

function AppViewModel() {
    var self = this;
    self.firstName = "Richard";
    self.lastName = "Yhip";
}

ko.applyBindings(new AppViewModel());

// https://api.foursquare.com/v2/venues/search?ll=40.7,-74&client_id=FOURSQUARE_CLIENT_IDF&client_secret=FOURSQUARE_CLIENT_SECRET&v=20161221
// https://maps.googleapis.com/maps/api/js?key=AIzaSyApoU2dpC25z2Z45WKMGV16kdTatObgr4M&callback=initMap
function getFoursquareInformationForLocation(lat, lng, map) {
    var foursquareApiUrl = "https://api.foursquare.com/v2/venues/search?ll=" + lat + "," + lng + "&client_id=" + FOURSQUARE_CLIENT_ID + "&client_secret=" + FOURSQUARE_CLIENT_SECRET + "&v=" + FOURSQUARE_API_VERSION;
    $.ajax({
  url: foursquareApiUrl
})
  .done(function( data ) {
    if ( console && console.log ) {
        var venues = data.response.venues;
        var venue;
        var bounds = new google.maps.LatLngBounds();
        for (var i = 0; i < venues.length; i++) {
            venue = venues[i];
            console.log(venue);
            var infowindow = new google.maps.InfoWindow({
              content: venue.name
            });
            var marker = new google.maps.Marker({
                position: {lat: venue.location.lat, lng: venue.location.lng},
                map: map
            });
            marker.addListener('click', function() {
              infowindow.open(map, marker);
            });
            bounds.extend(marker.position);
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

      function initAutocomplete() {
        var map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: -33.8688, lng: 151.2195},
          zoom: 13,
          mapTypeId: 'roadmap'
        });

        // Create the search box and link it to the UI element.
        var input = document.getElementById('pac-input');
        var searchBox = new google.maps.places.SearchBox(input);
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
          searchBox.setBounds(map.getBounds());
        });

        var markers = [];
        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.
        searchBox.addListener('places_changed', function() {
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            return;
          }

          // Clear out the old markers.
          markers.forEach(function(marker) {
            marker.setMap(null);
          });
          markers = [];

          // For each place, get the icon, name and location.
          var bounds = new google.maps.LatLngBounds();
          places.forEach(function(place) {
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
               getFoursquareInformationForLocation(places[0].geometry.location.lat(), places[0].geometry.location.lng(), map);
        });
      }