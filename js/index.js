//https://richabrahams.github.io/fcc-weather/

$(document).ready(function() {

  var location = document.querySelector('.location');
  var summary = document.querySelector('.summary');
  var temperature = document.querySelector('.temperature');
  var pressure = document.querySelector('.pressure');
  var windSpeed = document.querySelector('.windSpeed');
  var icon = document.querySelector('.icon');
  var redraw = document.querySelector('.redraw');
  var weatherStates = ["clear-day", "clear-night", "rain", "snow", "sleet", "wind", "fog", "cloudy", "partly-cloudy-day", "partly-cloudy-night", "default"];
  var weatherStatesIcons = ["Sun.svg", "Moon.svg", "Cloud-Rain.svg", "Cloud-Snow.svg", "Cloud-Hail.svg", "Wind.svg", "Cloud-Fog.svg", "Cloud.svg", "Cloud-Sun.svg", "Cloud-Moon.svg", "Cloud.svg"];
  var map;

// Get geolocation coordinates

  function getCoords(updateMap) {
    if (updateMap){
    return new Promise(function(resolve, reject) {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  } else {
    var data = {};
    data.coords = {};
        data.coords.latitude = map.getCenter().lat();
        data.coords.longitude = map.getCenter().lng();
    return Promise.resolve(data);
  }
  }

// Ajax address from googleapis

  function getAddress(coords) {
    return new Promise(function(resolve, reject) {
      var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" + coords.formatCoord;
      $.ajax({
        dataType: "json",
        url: url,
        success: function(response) {
          coords.address = response;
          resolve(coords);
        },
        error: function(e) {
          reject(e);
        }
      });
    });
  }

// Ajax weather report from forcast.io

  function getWeather(coords) {
    return new Promise(function(resolve, reject) {
      var appKey = "fe03e357d622af941a213d135045e3f0/";
      var siteAddress = "https://api.forecast.io/forecast/" +
        appKey +
        coords.formatCoord;
      $.ajax({
        url: siteAddress,
        dataType: "jsonp",
        success: function(data) {
          coords.weather = data;
          resolve(coords);
        },
        error: function(e) {
          console.log('failed');
          reject(e);
        }
      });

    });
  }

// Parse out usable address from googles address object

  function parseAddress(address) {
    var container = [];
    for (var i = 0; i < address.results.length; i++) {
      container.push(address.results[i]);
    }
    filteredContainer = container.filter(function(item, index) {
      return item.types.indexOf('locality') != -1 || item.types.indexOf('administrative_area_level_2') != -1;
    });
    if (filteredContainer.length === 0) {
      filteredContainer = container.filter(function(item, index) {
        return item.types.indexOf('locality') != -1 || item.types.indexOf('administrative_area_level_1') != -1;
      });
    }
    filteredContainer = filteredContainer[0].address_components.reduce(function(cont, index, container) {
      if (cont.indexOf(index.long_name.toString()) === -1) {
        cont.push(index.long_name);
      }
      return cont;
    }, []);
    filteredContainer = filteredContainer.slice(0,2).join(', ');
    return filteredContainer;
  }

// gather required info from forcast.io report

  function parseWeatherData(report) {
    report.summary = report.weather.currently.summary;
    report.icon = report.weather.currently.icon;
    report.pressure = report.weather.currently.pressure;
    report.windSpeed = report.weather.currently.windSpeed;
    report.temperatureF = Math.floor(report.weather.currently.temperature);
    report.temperatureC = Math.floor((report.temperatureF - 32) / 1.8);
    return report;
  }

// draw google map onscreen

  function createMap(lat, lon) {
    map = new google.maps.Map(document.getElementById('map'), {
      center: {
        lat: lat,
        lng: lon
      },
      streetViewControl: false,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      zoom: 12
    });
    map.setOptions({
      minZoom: 3,
      maxZoom: 18
    });
    return;
  }

// select correct icon image link using weatherStates and weatherStatesIcons arrays

  function iconSelect(data) {
    var position = weatherStates.indexOf(data);
    var imageLink = "images/" + weatherStatesIcons[position];
    return imageLink;
  }

// add text to relevant divs to display report on screen

  function updateScreen(report) {
    if (report.updateMap) {
      createMap(report.lat, report.lon);
    }
    location.innerHTML = report.address;
    summary.innerHTML = report.summary;
    temperature.innerHTML = "Temp: " + report.temperatureC + "\xB0C / " + report.temperatureF + "\xB0F";
    pressure.innerHTML = "Pressure: " + report.pressure + "mb";
    windSpeed.innerHTML = "Wind: " + report.windSpeed + "mph";
    var iconLink = iconSelect(report.icon);
    icon.innerHTML = "<img src='" + iconLink + "' alt='weather icon' fill='white'/>";
  }

// initiate address parsing

  function parseReport(report) {
    report.address = parseAddress(report.address);
    report = parseWeatherData(report);
    updateScreen(report);
  }

// main data gathering controller

  function createReport(updateMap) {
    var report = {};
    if (updateMap) {
      report.updateMap = true;
    }
    getCoords(report.updateMap).then(function(data) {
      report.lat = data.coords.latitude;
      report.lon = data.coords.longitude;
      report.formatCoord = report.lat + "," + report.lon;
      return report;
    }).then(function(report) {
      return getAddress(report);
    }).then(function(report) {
      return getWeather(report);
    }).then(function(report) {
      parseReport(report);
    }).catch(function(e) {
      console.log('error in promise chain', e);
      dataFail();
    });
    return;
  }

// ajax failure fallback

  function dataFail() {
    {
      location.innerHTML = "Data current unavailable, please try another location or check back later";
      summary.innerHTML = "";
      temperature.innerHTML = "";
      pressure.innerHTML = "";
      windSpeed.innerHTML = "";
      icon.innerHTML = "";
      if (document.getElementById('map').innerHTML===""){
        document.getElementById('map').innerHTML="<div class ='noData'> <i class='fa fa-frown-o fa-5x' aria-hidden='true'></i></div>";
        document.querySelector('.redraw').style.display="none";
      }
    }
  }

// refresh screen button controls

  redraw.addEventListener('click', function(e) {
  redraw.style.webkitAnimationName = ('rotator');
    redraw.addEventListener('webkitAnimationEnd', function() {
      redraw.style.webkitAnimationName = (null);
    });
    createReport(false);
  });

// run on startUp to generate new map

  function startUp() {
    createReport(true);
  }

  startUp();
});
