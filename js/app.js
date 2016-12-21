const FOURSQUARE_CLIENT_ID = "OYNSAXXQEBFWL2V3VVXJNZTB5RWOTYUMMKHUEGG5CVS44BKF";
const FOURSQUARE_CLIENT_SECRET = "KSS3BGAWCRRQBZPX1F20ZL5WY2BIRRBJPSRZBNP3VJAUHN0C";
const FOURSQUARE_API_VERSION = "20161221";
const GOOGLE_MAPS_JS_API_KEY = "AIzaSyApoU2dpC25z2Z45WKMGV16kdTatObgr4M";

function AppViewModel() {
    self = this;
    self.firstName = "Richard";
    self.lastName = "Yhip";
}

ko.applyBindings(new AppViewModel());

// https://api.foursquare.com/v2/venues/search?ll=40.7,-74&client_id=FOURSQUARE_CLIENT_IDF&client_secret=FOURSQUARE_CLIENT_SECRET&v=20161221
// https://maps.googleapis.com/maps/api/js?key=AIzaSyApoU2dpC25z2Z45WKMGV16kdTatObgr4M&callback=initMap

function getFoursquareInformationForLocation(lat, lng) {
    var foursquareApiUrl = "https://api.foursquare.com/v2/venues/search?ll=" + lat + "," + lng + "&client_id=" + FOURSQUARE_CLIENT_ID + "&client_secret=" + FOURSQUARE_CLIENT_SECRET + "&v=" + FOURSQUARE_API_VERSION;
    $.ajax({
  url: foursquareApiUrl
})
  .done(function( data ) {
    if ( console && console.log ) {
      console.log( "Foursquare API result:", data );
    }
  });
}
// ===============
function initMap() {
        var uluru = {lat: -25.363, lng: 131.044};
        var map = new google.maps.Map(document.getElementById('map'), {
          zoom: 4,
          center: uluru
        });
        var marker = new google.maps.Marker({
          position: uluru,
          map: map
        });

        var infoWindow = new google.maps.InfoWindow({map: map});

        // Try HTML5 geolocation.
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(function(position) {
            var pos = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };

            infoWindow.setPosition(pos);
            infoWindow.setContent('Location found: ' + pos.lat + ', ' + pos.lng);
            getFoursquareInformationForLocation(pos.lat, pos.lng);
            map.setCenter(pos);
          }, function() {
            handleLocationError(true, infoWindow, map.getCenter());
          });
        } else {
          // Browser doesn't support Geolocation
          handleLocationError(false, infoWindow, map.getCenter());
        }
      }

      function handleLocationError(browserHasGeolocation, infoWindow, pos) {
        infoWindow.setPosition(pos);
        infoWindow.setContent(browserHasGeolocation ?
                              'Error: The Geolocation service failed.' :
                              'Error: Your browser doesn\'t support geolocation.');
      }