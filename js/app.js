const FOURSQUARE_CLIENT_ID = 'OYNSAXXQEBFWL2V3VVXJNZTB5RWOTYUMMKHUEGG5CVS44BKF';
const FOURSQUARE_CLIENT_SECRET = 'KSS3BGAWCRRQBZPX1F20ZL5WY2BIRRBJPSRZBNP3VJAUHN0C';
const FOURSQUARE_API_VERSION = '20161221';
const GOOGLE_MAPS_JS_API_KEY = 'AIzaSyB0ppZlQGiqRHh0nXVuzaRh0JMtiAG1J7c';
const EVENTFUL_API_KEY = 't5wrJZZBq3bMtzvG';
const STARTING_LAT = -33.8688;
const STARTING_LNG = 151.2195;

var categoryList = [];
var map;
var currentPlace;
var infowindow;

var googleMapsError = function () {
  alert('There was an issue loading Google Maps. Please try again later.');
}

var getInfowindowContent = function (venue) {
  return venue.name + '<p>' + venue.categoryList + '<p>Checkins: ' + venue.stats.checkinsCount + '<p>Phone number: ' + venue.contact.formattedPhone;
};

// KnockoutJS view model
var viewModel = {
  venues: ko.observableArray([]),
  categories: ko.observableArray([]),
  selectedCategory: ko.observable(),
  currentFilter: ko.observable()
};

// computed observable to return the active venues based on filter
viewModel.filteredVenues = ko.computed(function () {
  if (infowindow) {
    infowindow.close();
  }
  // only filter if currentFilter has a value
  if (!viewModel.currentFilter()) {
    // if there's no filter make sure all venues are visible
    if (viewModel.venues()) {
      viewModel.venues().forEach(function (venue) {
        if (venue.marker) {
          venue.marker.setVisible(true);
        }
      });
    }
    return viewModel.venues();
  } else {
    // only show markers whose venues match the filter
    return ko.utils.arrayFilter(viewModel.venues(), function (venue) {
      if (comparator(venue)) {
        venue.marker.setVisible(true);
        return true;
      } else {
        venue.marker.setVisible(false);
        return false;
      }
    });
  };
});

viewModel.showInfowindow = function () {
  infowindow.setContent(getInfowindowContent(this));
  infowindow.open(map, this.marker);
  this.marker.setAnimation(google.maps.Animation.BOUNCE);
  var myMarker = this.marker;
  setTimeout(function () { myMarker.setAnimation(null); }, 750);
}

// the function we will use to determine if we have a filter hit
var comparator = function (venue) {
  if ((venue.name.toLowerCase().indexOf(viewModel.currentFilter().toLowerCase()) > -1) || arrayContainsString(venue, viewModel.selectedCategory())) {
    return true;
  }
  else return false;
}

// utility function to see if an array contains part of a string
var arrayContainsString = function (venue, term) {
  for (var i = 0; i < venue.categories.length; i++) {
    if (venue.categories[i].name.toLowerCase().indexOf(term) > -1) {
      return true;
    }
  }
  return false;
}

// finally, apply the  bindings
ko.applyBindings(viewModel);

//utility function to fit the map bounds to visible markers
function fitBoundsToVisibleMarkers(venues) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < venues.length; i++) {
    if (venues[i].marker.getVisible()) {
      bounds.extend(venues[i].marker.getPosition());
    }
  }
  map.fitBounds(bounds);
}



// function that gets venue data from foursquare
function getFoursquareVenues(lat, lng) {
  var foursquareApiUrl = 'https://api.foursquare.com/v2/venues/search?ll=' + lat + ',' + lng + '&client_id=' + FOURSQUARE_CLIENT_ID + '&client_secret=' + FOURSQUARE_CLIENT_SECRET + '&v=' + FOURSQUARE_API_VERSION;
  $.ajax({
    url: foursquareApiUrl
  }).done(function (data) {
    viewModel.venues(null);
    categoryList = [];
    viewModel.venues(data.response.venues);
    for (var i = 0; i < viewModel.venues().length; i++) {
      // IIFE to bind marker click events
      (function (venue) {
        var category = '';
        for (var j = 0; j < venue.categories.length; j++) {
          if (viewModel.categories().indexOf(venue.categories[j].name) == -1) {
            viewModel.categories.push(venue.categories[j].name);
          }
          categoryList.push(venue.categories[j].name);
          category += venue.categories[j].name + ' ';
        }
        venue.categoryList = category.trim();
        var marker = new google.maps.Marker({
          position: { lat: venue.location.lat, lng: venue.location.lng },
          map: map,
          animation: google.maps.Animation.DROP,
          icon: makeMarkerIcon('FF33F2')
        });
        marker.addListener('click', function () {
          infowindow.setContent(getInfowindowContent(venue));
          infowindow.open(map, marker);
          marker.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(function () { marker.setAnimation(null); }, 750);
        });
        venue.marker = marker;
      } (viewModel.venues()[i]))
    }
    fitBoundsToVisibleMarkers(viewModel.venues());
  }).fail(function (error) {
    alert('There was an issue accessing Foursquare. Please try again later.');
  })
}


// This adds a search box to a map, using the Google Place Autocomplete
// feature. People can enter geographical searches. The search box will return a
// pick list containing a mix of places and predicted search terms.
function initAutocomplete() {
  infowindow = new google.maps.InfoWindow({
    content: ''
  });

  map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: STARTING_LAT, lng: STARTING_LNG },
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

  // get initial venues
  getFoursquareVenues(STARTING_LAT, STARTING_LNG);


  // Listen for the event fired when the user selects a prediction and retrieve
  // more details for that place.
  searchBox.addListener('places_changed', function () {
    var places = searchBox.getPlaces();
    currentPlace = places;
    viewModel.currentFilter(null);
    if (places.length == 0) {
      return;
    }

    // Clear out the old markers.
    markers.forEach(function (marker) {
      marker.setMap(null);
    });
    markers = [];

    for (var i = 0; i < viewModel.venues().length; i++) {
      viewModel.venues()[i].marker.setMap(null);
    }

    // For each place, get the icon, name and location.
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function (place) {
      if (!place.geometry) {
        console.log('Returned place contains no geometry');
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
    getFoursquareVenues(places[0].geometry.location.lat(), places[0].geometry.location.lng());
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

// code to use Eventful to get events as a future feature
function getEventfulEvents(lat, lng, map) {
  var eventfulApiUrl = 'http://api.eventful.com/json/events/search?app_key=' + EVENTFUL_API_KEY + '&where=' + lat + ',' + lng + '&within=25 ';
  $.ajax({
    url: eventfulApiUrl
  }).done(function (data) {
    var eventfulResultObject = JSON.parse(data);
    var events = eventfulResultObject.events.event;
    var geocoder = new google.maps.Geocoder();
    for (var i = 0; i < events.length; i++) {
      (function (event) {
        var infowindow = new google.maps.InfoWindow({
          content: event.title + '<p>' + event.venue_name
        });
        var address = event.venue_name + ' ' + event.venue_address + ' ' + event.city_name + ' ' + event.region_abbr + ' ' + event.postal_code;

        geocoder.geocode({ 'address': address }, function (results, status) {
          if (status === 'OK') {
            console.log(address);
            console.log(results);
          } else {
            console.log('Location not found');
            //alert('Geocode was not successful for the following reason: ' + status);
          }
        });

        var marker = new google.maps.Marker({
          position: { lat: parseInt(event.latitude), lng: parseInt(event.longitude) },
          map: map,
          animation: google.maps.Animation.DROP,
          icon: makeMarkerIcon('3373FF')
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
