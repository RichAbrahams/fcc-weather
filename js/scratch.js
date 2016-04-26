  var location = document.querySelector('.location');
  var summary = document.querySelector('.summary');
  var temperature = document.querySelector('.temperature');
  var pressure = document.querySelector('.pressure');
  var windSpeed = document.querySelector('.windSpeed');
  var icon = document.querySelector('.icon');
  var redraw = document.querySelector('.redraw');
  var weatherStates = ["clear-day", "clear-night", "rain", "snow", "sleet", "wind", "fog", "cloudy", "partly-cloudy-day", "partly-cloudy-night", "default"];
  var weatherStatesIcons = ["Sun.svg", "Moon.svg", "Cloud-Rain.svg", "Cloud-Snow.svg", "Cloud-Hail.svg", "Wind.svg", "Cloud-Fog.svg", "Cloud.svg", "Cloud-Sun.svg", "Cloud-Moon.svg", "Cloud.svg"];

  function getLocationPromise() {
    var location = new Promise(
      function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(function(data) {
          resolve(data);
        }, function() {
          reject(data);
        });
      }
    );
    return location;
  }

  function getAddressPromise(cords) {
    var address = new Promise(function(resolve, reject) {
      var url = "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
        cords.lat +
        "," +
        cords.lon;
      $.ajax({
        dataType: "json",
        url: url,
        success: function(response) {
          resolve(response);
        },
        error: function(data) {
          reject(data);
        }
      });
    });
    return address;
  }

  function getWeatherReportPromise(cords) {
    var report = new Promise(function(resolve, reject) {
      var appKey = "fe03e357d622af941a213d135045e3f0/";
      var siteAddress = "https://api.forecast.io/forecast/";
      var apiString = siteAddress + appKey + cords.lat + "," + cords.lon;
      $.ajax({
        url: apiString,
        dataType: "jsonp",
        success: function(data) {
          console.log(data);
          resolve(data);
        },
        error: function(a, b, c) {
          console.log('failed');
          reject(a, b, c);
        }
      });
    });
    return report;
  }

  function getLocation() {
    console.log('run getLocation');
    var location = getLocationPromise();
    location.then(function(data) {
      var cords = {
        updateMap: true,
        lat: data.coords.latitude,
        lon: data.coords.longitude,
      };
      getAddress(cords);
    });
  }

  function getAddress(cords) {
    console.log('run getAddress');
    var address = getAddressPromise(cords);
    address.then(function(data) {
      var arr = [];
      for (var i = 0; i < data.results.length; i++) {
        arr.push(data.results[i]);
      }
      filteredArr = arr.filter(function(item, index) {
        return item.types.indexOf('locality') != -1 || item.types.indexOf('administrative_area_level_2') != -1;
      });
      if (filteredArr.length === 0) {
        filteredArr = arr.filter(function(item, index) {
          return item.types.indexOf('locality') != -1 || item.types.indexOf('administrative_area_level_1') != -1;
        });
      }
      filteredArr = filteredArr[0].address_components.reduce(function(cont, index, arr) {
        if (cont.indexOf(index.long_name.toString()) === -1) {
          cont.push(index.long_name);
        }
        return cont;
      }, []);
      filteredArr = filteredArr.join(', ');
      cords.address = filteredArr;
      createMap(cords);

    });
  }

  function createMap(cords) {
    console.log('run createMap');
    if (cords.updateMap === true) {
      map = new google.maps.Map(document.getElementById('map'), {
        center: {
          lat: cords.lat,
          lng: cords.lon
        },
        streetViewControl: false,
        mapTypeId: google.maps.MapTypeId.TERRAIN,
        zoom: 12
      });
      map.setOptions({
        minZoom: 3,
        maxZoom: 18
      });
    }
    getWeatherReport(cords);
  }

  function getWeatherReport(cords) {
    console.log('run getWeatherReport');
    var report = getWeatherReportPromise(cords);
    report.then(function(report) {
      cords.weather = {};
      cords.weather.summary = report.currently.summary;
      cords.weather.icon = report.currently.icon;
      cords.weather.pressure = report.currently.pressure;
      cords.weather.windSpeed = report.currently.windSpeed;
      cords.weather.temperatureF = Math.floor(report.currently.temperature);
      cords.weather.temperatureC = Math.floor((cords.weather.temperatureF - 32) / 1.8);
      generateText(cords);
    }).catch(console.log('wtf??'));
  }

  function generateText(cords) {
    console.log(cords);
    location.innerHTML = cords.address;
    summary.innerHTML = cords.weather.summary;
    temperature.innerHTML = "Temp: " + cords.weather.temperatureC + "\xB0C / " + cords.weather.temperatureF + "\xB0F";
    pressure.innerHTML = "Pressure: " + cords.weather.pressure + "mb";
    windSpeed.innerHTML = "Wind: " + cords.weather.windSpeed + "mph";
    var iconLink = iconSelect(cords.weather.icon);
    icon.innerHTML = "<img src='" + iconLink + "' alt='weather icon' fill='white'/>";
  }

  function iconSelect(data) {
    var position = weatherStates.indexOf(data);
    var imageLink = "images/" + weatherStatesIcons[position];
    return imageLink;
  }

  function dataFail() {
    {
      location.innerHTML = "Data current unavailable,";
      summary.innerHTML = "please try another location";
      temperature.innerHTML = "or check back later";
      pressure.innerHTML = x;
      windSpeed.innerHTML = "";
      icon.innerHTML = "";
    }
  }



  getLocation();
