// script.js



nasa_url = "https://api.nasa.gov/planetary/apod/?api_key=UASXdX7M2IQPPEzb2OWq1BIpLrI1W7kW8UINkuJh";
load_btn = document.getElementById("loadData");
location_load_btn = document.getElementById("loadLocation");
loc_span = document.getElementById("current-loc");
const apodSpinner = document.getElementById('apod-spinner');
const weatherSpinner = document.getElementById('weather-spinner');

let currentLat = localStorage.getItem("currentLat") || 0;
let currentLon = localStorage.getItem("currentLon") || 0;
let currentLocation = localStorage.getItem("currentLocation") || "Unknown Location";
let currentCity = currentLocation.split(',')[0].trim();

let today = new Date();
let dd = String(today.getDate()).padStart(2, '0');
let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
let yyyy = today.getFullYear();

let formattedDate = `${yyyy}-${mm}-${dd}`;

async function getCoordinates(inputLocation) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputLocation)}`);
    const data = await response.json();
    if (data.length > 0) {
      const location = data[0];
      return { name: location.display_name, lat: location.lat, lon: location.lon };
    } else {
      return "Location not found.";
    }
  } catch {
    return "Error fetching location.";
  }
}

async function getAPOD(date = undefined) {
  apodSpinner.style.display = 'block'; // Show spinner

  try {
    let response
    if (!date) {
      response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=UASXdX7M2IQPPEzb2OWq1BIpLrI1W7kW8UINkuJh`
      );
    } else {
      response = await fetch(
      `https://api.nasa.gov/planetary/apod?date=${date}&api_key=UASXdX7M2IQPPEzb2OWq1BIpLrI1W7kW8UINkuJh`
      );
    }

    apodSpinner.style.display = 'none'; // Hide spinner

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching APOD:", error);
    return null;
  }
}

async function getWeatherData(lat, lon, date) {
  weatherSpinner.style.display = 'block'; // Show spinner
  try {
    const response = await fetch(
      `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${date}&end_date=${date}&daily=weather_code,temperature_2m_mean,temperature_2m_max,temperature_2m_min,apparent_temperature_mean,wind_speed_10m_max,wind_direction_10m_dominant,sunshine_duration,precipitation_hours`)
    weatherSpinner.style.display = 'none'; // Hide spinner
    if (!response.ok) {
      console.error(response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.daily) {
      let weatherType = "sunny"
      if (data.daily.weather_code[0] < 3) {
        weatherType = "sunny"; // Clear or mostly clear
      } else if (data.daily.weather_code[0] < 4) {
        weatherType = "cloudy"; // Partly cloudy
      } else if (data.daily.weather_code[0] < 10) {
        weatherType = "haze"; 
      } else if (data.daily.weather_code[0] < 17 || data.daily.weather_code[0] === 28 || (data.daily.weather_code[0] > 39 && data.daily.weather_code[0] < 50)) {
        weatherType = "fog";
      } else if ((data.daily.weather_code[0] > 17 && data.daily.weather_code[0] < 28) || (data.daily.weather_code[0] > 49 && data.daily.weather_code[0] < 70) || data.daily.weather_code[0] === 91 || data.daily.weather_code[0] === 92) {
        weatherType = "rain";
      } else if ((data.daily.weather_code[0] > 69 && data.daily.weather_code[0] < 91) || data.daily.weather_code[0] === 93 || data.daily.weather_code[0] === 94) {
        weatherType = "snow";
      } else if (data.daily.weather_code[0] > 94) {
        weatherType = "thunderstorm";
      }
      return {
        weatherCode: weatherType,
        temperatureMean: data.daily.temperature_2m_mean[0],
        temperatureMax: data.daily.temperature_2m_max[0],
        temperatureMin: data.daily.temperature_2m_min[0],
        apparentTemperatureMean: data.daily.apparent_temperature_mean[0],
        windSpeedMax: data.daily.wind_speed_10m_max[0],
        windDirectionDominant: data.daily.wind_direction_10m_dominant[0],
        sunshineDuration: data.daily.sunshine_duration[0],
        precipitationHours: data.daily.precipitation_hours[0]
      };
    }
  }
  catch (error) {
    console.error("Error fetching weather data:", error);
  }
}

async function getSatelliteData(lat, lon) {
  const apiKey = "YOUR_API_KEY";
  const apiUrl = `https://api.n2yo.com/rest/v1/satellite/above/${lat}/${lon}/0/70/0/10/?apiKey=${apiKey}`;

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.above;
  } catch (error) {
    console.error("Fetch failed (likely CORS):", error);
    // fallback mock data
    return [
      { satname: "MockSat-1", satid: 12345, elevation: 45, azimuth: 180 },
      { satname: "MockSat-2", satid: 67890, elevation: 30, azimuth: 90 },
      { satname: "MockSat-3", satid: 54321, elevation: 75, azimuth: 270 },
      { satname: "MockSat-4", satid: 98765, elevation: 10, azimuth: 45 },
      { satname: "MockSat-5", satid: 24680, elevation: 60, azimuth: 135 },
      { satname: "MockSat-6", satid: 13579, elevation: 25, azimuth: 225 },
      { satname: "MockSat-7", satid: 11223, elevation: 80, azimuth: 315 },
      { satname: "MockSat-8", satid: 44556, elevation: 55, azimuth: 0 }
    ];
  }
}







load_btn.addEventListener("click", async () => {
  const inputDate = document.getElementById("inputDate").value || formattedDate;
  
  document.getElementById("current-loc").textContent = `Current location: ${currentLocation}`;
  document.getElementById("current-coords").textContent = `Current coordinates: ${currentLat}, ${currentLon}`;


  const APODdata = await getAPOD(inputDate);

  if (!APODdata) {
    document.getElementById("output").textContent = "Error fetching data.";
    return;
  }

  document.getElementById("explanation").textContent =
    APODdata.explanation || "No explanation available.";

  document.getElementById("title").textContent =
    APODdata.title || "No title available.";

  document.getElementById("astro-image").src =
    APODdata.url || "https://via.placeholder.com/150";

  const weatherData = await getWeatherData(currentLat, currentLon, inputDate);
  console.log(weatherData);
  if (!weatherData) { 
    document.getElementById("weather-output").textContent = "Error fetching weather data.";
    return;
  }

  document.getElementById("weather-output").innerHTML = `
    <h3>Weather on ${inputDate} in ${currentCity}:</h3>
    <p>${weatherData.weatherCode.toUpperCase()}</p>
    <p>Mean Temperature: ${weatherData.temperatureMean}°C</p>
    <p>Max Temperature: ${weatherData.temperatureMax}°C</p>
    <p>Min Temperature: ${weatherData.temperatureMin}°C</p>
    <p>Apparent Temperature Mean: ${weatherData.apparentTemperatureMean}°C</p>
    <p>Max Wind Speed: ${weatherData.windSpeedMax} km/h</p>
    <p>Dominant Wind Direction: ${weatherData.windDirectionDominant}°</p>
    <p>Sunshine Duration: ${weatherData.sunshineDuration} hours</p>
    <p>Precipitation Hours: ${weatherData.precipitationHours} hours</p>
  `;

  document.getElementById("weather-icon").src = `/assets/${weatherData.weatherCode}.jpg`;
});


(async () => {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    document.getElementById("current-loc").innerHTML =
      `Approximate location: ${data.city}, ${data.region}, ${data.country_name}`;

    const locData = await getCoordinates(data.city);

    if (typeof locData === "string") {
      document.getElementById("current-loc").textContent = locData;
    } else {
      currentLat = locData.lat;
      currentLon = locData.lon;
      currentLocation = locData.name;

      localStorage.setItem("currentLat", currentLat);
      localStorage.setItem("currentLon", currentLon);
      localStorage.setItem("currentLocation", currentLocation);

      console.log(`Current coordinates: ${currentLat}, ${currentLon}`);
      document.getElementById("current-coords").textContent = `Current coordinates: ${locData.lat}, ${locData.lon}`;
    }
  } catch (e) {
    document.getElementById("current-loc").textContent = e.message;
  }
})();

document.addEventListener("DOMContentLoaded", async () => {
  const inputDate = document.getElementById("inputDate").value || formattedDate;
  
  document.getElementById("current-loc").textContent = `Current location: ${currentLocation}`;
  document.getElementById("current-coords").textContent = `Current coordinates: ${currentLat}, ${currentLon}`;

  const APODdata = await getAPOD(inputDate);

  if (!APODdata) {
    document.getElementById("output").textContent = "Error fetching data.";
    return;
  }

  document.getElementById("explanation").textContent =
    APODdata.explanation || "No explanation available.";

  document.getElementById("title").textContent =
    APODdata.title || "No title available.";

  document.getElementById("astro-image").src =
    APODdata.url || "https://via.placeholder.com/150";

  const weatherData = await getWeatherData(currentLat, currentLon, inputDate);
  console.log(weatherData);
  if (!weatherData) { 
    document.getElementById("weather-output").textContent = "Error fetching weather data.";
    return;
  }

  document.getElementById("weather-output").innerHTML = `
    <h3>Weather on ${inputDate} in ${currentCity}:</h3>
    <p>${weatherData.weatherCode.toUpperCase()}</p>
    <p>Mean Temperature: ${weatherData.temperatureMean}°C</p>
    <p>Max Temperature: ${weatherData.temperatureMax}°C</p>
    <p>Min Temperature: ${weatherData.temperatureMin}°C</p>
    <p>Apparent Temperature Mean: ${weatherData.apparentTemperatureMean}°C</p>
    <p>Max Wind Speed: ${weatherData.windSpeedMax} km/h</p>
    <p>Dominant Wind Direction: ${weatherData.windDirectionDominant}°</p>
    <p>Sunshine Duration: ${weatherData.sunshineDuration} hours</p>
    <p>Precipitation Hours: ${weatherData.precipitationHours} hours</p>
  `;
  
  document.getElementById("weather-icon").src = `/assets/${weatherData.weatherCode}.jpg`;

  const satellites = await getSatelliteData(currentLat, currentLon);
  const output = document.getElementById("satellite-output");

  if (typeof satellites === "string") {
    output.textContent = satellites;
  } else {
    output.innerHTML = "<h3>Satellites currently above the horizon:</h3>";
    satellites.forEach(sat => {
      output.innerHTML += `<p>${sat.satname} (ID: ${sat.satid}) - Elevation: ${sat.elevation}° Azimuth: ${sat.azimuth}°</p>`;
    });
  }
});

location_load_btn.addEventListener("click", async () => {
  const inputLocation = document.getElementById("inputLocation").value;
  if (inputLocation) {
    const locData = getCoordinates(inputLocation);
    locData.then(data => {
      if (typeof data === "string") {
        document.getElementById("current-loc").textContent = data;
      } else {

        currentLat = data.lat;
        currentLon = data.lon;
        currentLocation = data.name;

        localStorage.setItem("currentLat", currentLat);
        localStorage.setItem("currentLon", currentLon);
        localStorage.setItem("currentLocation", currentLocation);

        console.log(`Current coordinates: ${currentLat}, ${currentLon}`);
        document.getElementById("current-loc").textContent = `Current location: ${data.name}`;
        document.getElementById("current-coords").textContent = `Current coordinates: ${data.lat}, ${data.lon}`;
      
    }})

  if (currentLat === 0 && currentLon === 0) {
    document.getElementById("satellite-output").textContent = "Please load your location first.";
    return;
  }

  const satellites = await getSatelliteData(currentLat, currentLon);
  const output = document.getElementById("satellite-output");

  if (typeof satellites === "string") {
    output.textContent = satellites;
  } else {
    output.innerHTML = "<h3>Satellites currently above the horizon:</h3>";
    satellites.forEach(sat => {
      output.innerHTML += `<p>${sat.satname} (ID: ${sat.satid}) - Elevation: ${sat.elevation}° Azimuth: ${sat.azimuth}°</p>`;
    });
  }
}});







