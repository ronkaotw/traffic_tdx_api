const BASE_URL = "https://tdx.transportdata.tw/api/basic";

const railwayFormElements = {
  startStation: document.getElementById("startStation"),
  endStation: document.getElementById("endStation"),
  departDate: document.getElementById("railwayDate"),
  startTime: document.getElementById("railwayStartTime"),
  endTime: document.getElementById("railwayEndTime"),
  submitButton: document.getElementById("railwaySubmit"),
  table: document.getElementById("railwayResultsTable"),
  message: document.getElementById("railwayMessage"),
};

const hsrFormElements = {
  startStation: document.getElementById("hsrStartStation"),
  endStation: document.getElementById("hsrEndStation"),
  departDate: document.getElementById("hsrDate"),
  departTime: document.getElementById("hsrTime"),
  submitButton: document.getElementById("hsrSubmit"),
  table: document.getElementById("hsrResultsTable"),
  message: document.getElementById("hsrMessage"),
};

const airFormElements = {
  departureAirport: document.getElementById("airDepartureAirport"),
  arrivalAirport: document.getElementById("airArrivalAirport"),
  flightDate: document.getElementById("airFlightDate"),
  keyword: document.getElementById("airKeyword"),
  submitButton: document.getElementById("airSubmit"),
  table: document.getElementById("airResultsTable"),
  message: document.getElementById("airMessage"),
};

const airReferenceData = {
  airportsById: new Map(),
  airlinesById: new Map(),
};

async function getAccessToken() {
  const res = await fetch(
    "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: "kaoa11449-eda0d952-0604-41fc",
        client_secret: "851efb69-3980-483f-8a45-7fef42473cba",
      }),
    }
  );
  const data = await res.json();
  return data.access_token;
}

async function connTDX() {
  try {
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/v2/Rail/TRA/Station?%24top=500&%24format=JSON`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const data = await res.json();
    data.sort((leftStation, rightStation) => {
      const leftLatitude = leftStation.StationPosition?.PositionLat ?? -Infinity;
      const rightLatitude = rightStation.StationPosition?.PositionLat ?? -Infinity;

      if (leftLatitude !== rightLatitude) {
        return rightLatitude - leftLatitude;
      }

      return leftStation.StationName.Zh_tw.localeCompare(rightStation.StationName.Zh_tw, "zh-Hant");
    });
    getHtmlData(data);
  } catch (err) {
    console.error("渲染錯誤:", err.message);
  }
}

async function connTHSR() {
  try {
    const token = await getAccessToken();

    const res = await fetch(`${BASE_URL}/v2/Rail/THSR/Station?%24top=100&%24format=JSON`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const data = await res.json();
    data.sort((leftStation, rightStation) => {
      const leftLatitude = leftStation.StationPosition?.PositionLat ?? -Infinity;
      const rightLatitude = rightStation.StationPosition?.PositionLat ?? -Infinity;

      if (leftLatitude !== rightLatitude) {
        return rightLatitude - leftLatitude;
      }

      return leftStation.StationName.Zh_tw.localeCompare(rightStation.StationName.Zh_tw, "zh-Hant");
    });
    populateStationSelects(data, hsrFormElements);
  } catch (err) {
    console.error("高鐵站點載入錯誤:", err.message);
    setResultMessage(hsrFormElements.message, "高鐵站點載入失敗，請稍後再試", "danger");
  }
}

async function connAir() {
  try {
    const token = await getAccessToken();

    const [airportRes, airlineRes] = await Promise.all([
      fetch(`${BASE_URL}/v2/Air/Airport?%24top=500&%24format=JSON`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
      fetch(`${BASE_URL}/v2/Air/Airline?%24top=500&%24format=JSON`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    if (!airportRes.ok) throw new Error(`HTTP Error ${airportRes.status}`);
    if (!airlineRes.ok) throw new Error(`HTTP Error ${airlineRes.status}`);

    const airports = await airportRes.json();
    const airlines = await airlineRes.json();

    storeAirReferenceData(airports, airlines);
    populateAirports(airports);
    airFormElements.flightDate.value = new Date().toISOString().slice(0, 10);
  } catch (err) {
    console.error("航空資料載入錯誤:", err.message);
    setResultMessage(airFormElements.message, "航空機場資料載入失敗，請稍後再試", "danger");
  }
}

connTDX();
connTHSR();
connAir();

function populateStationSelects(stations, formElements) {
  const { startStation: startSelect, endStation: endSelect } = formElements;

  stations.forEach(station => {
    const opt1 = document.createElement("option");
    opt1.value = station.StationID;
    opt1.textContent = station.StationName.Zh_tw;
    startSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = station.StationID;
    opt2.textContent = station.StationName.Zh_tw;
    endSelect.appendChild(opt2);
  });
}

function getHtmlData(stations) {
  populateStationSelects(stations, railwayFormElements);
}

function storeAirReferenceData(airports, airlines) {
  airReferenceData.airportsById.clear();
  airReferenceData.airlinesById.clear();

  airports.forEach(airport => {
    airReferenceData.airportsById.set(airport.AirportID, airport);
  });

  airlines.forEach(airline => {
    if (airline.AirlineID) {
      airReferenceData.airlinesById.set(airline.AirlineID, airline);
    }
  });
}

function populateAirports(airports) {
  const sortedAirports = [...airports].sort((leftAirport, rightAirport) => {
    const leftName = leftAirport.AirportName?.Zh_tw ?? leftAirport.AirportName?.En ?? leftAirport.AirportID;
    const rightName = rightAirport.AirportName?.Zh_tw ?? rightAirport.AirportName?.En ?? rightAirport.AirportID;
    return leftName.localeCompare(rightName, "zh-Hant");
  });

  sortedAirports.forEach(airport => {
    const airportLabel = formatAirportLabel(airport);
    const departureOption = document.createElement("option");
    departureOption.value = airport.AirportID;
    departureOption.textContent = airportLabel;
    airFormElements.departureAirport.appendChild(departureOption);

    const arrivalOption = document.createElement("option");
    arrivalOption.value = airport.AirportID;
    arrivalOption.textContent = airportLabel;
    airFormElements.arrivalAirport.appendChild(arrivalOption);
  });
}

function formatAirportLabel(airport) {
  const name = airport.AirportName?.Zh_tw ?? airport.AirportName?.En ?? airport.AirportID;
  const code = airport.AirportIATA || airport.AirportID;
  return `${name} (${code})`;
}

async function searchTrains(event) {
  event.preventDefault();

  const startStation = railwayFormElements.startStation.value;
  const endStation = railwayFormElements.endStation.value;
  const departDate = railwayFormElements.departDate.value;
  const startTime = railwayFormElements.startTime.value;
  const endTime = railwayFormElements.endTime.value;

  clearRailwayMessage();

  if (!startStation || !endStation || !departDate || !startTime || !endTime) {
    setRailwayMessage("請完整選擇出發站、到達站、日期和時間", "warning");
    hideRailwayTable();
    return;
  }

  if (startStation === endStation) {
    setRailwayMessage("出發站與到達站不可相同", "warning");
    hideRailwayTable();
    return;
  }

  if (startTime > endTime) {
    setRailwayMessage("起始時間不可晚於結束時間", "warning");
    hideRailwayTable();
    return;
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${BASE_URL}/v2/Rail/TRA/DailyTimetable/OD/${startStation}/to/${endStation}/${departDate}?%24format=JSON`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const trains = await res.json();
    renderTable(trains, departDate, startTime, endTime);
  } catch (err) {
    console.error("查詢班次錯誤:", err.message);
    setRailwayMessage("查詢失敗，請稍後再試", "danger");
    hideRailwayTable();
  }
}

function renderTable(trains, date, startTime, endTime) {
  const table = railwayFormElements.table;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(trains) || trains.length === 0) {
    setRailwayMessage("查無這一天這兩站之間的列車資料", "warning");
    hideRailwayTable();
    return;
  }

  const validTrains = trains
    .filter(train => train?.OriginStopTime?.DepartureTime)
    .sort((leftTrain, rightTrain) => {
      return leftTrain.OriginStopTime.DepartureTime.localeCompare(rightTrain.OriginStopTime.DepartureTime);
    });

  if (validTrains.length === 0) {
    setRailwayMessage("列車班次資料不完整，暫時無法顯示", "warning");
    hideRailwayTable();
    return;
  }

  const filtered = validTrains.filter(train => {
    const depart = train.OriginStopTime.DepartureTime;
    return depart >= startTime && depart <= endTime;
  });

  const trainsToRender = filtered.length > 0 ? filtered : validTrains;

  trainsToRender.forEach(train => {
    const trainInfo = train?.DailyTrainInfo ?? {};
    const trainType = trainInfo.TrainTypeName?.Zh_tw ?? "未提供";
    const trainNo = trainInfo.TrainNo ?? "未提供";
    const originStation = train?.OriginStopTime?.StationName?.Zh_tw ?? "未提供";
    const destinationStation = train?.DestinationStopTime?.StationName?.Zh_tw ?? "未提供";
    const departureTime = train?.OriginStopTime?.DepartureTime ?? "未提供";
    const arrivalTime = train?.DestinationStopTime?.ArrivalTime ?? "未提供";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${trainNo}</td>
      <td>${trainType}</td>
      <td>${originStation}</td>
      <td>${destinationStation}</td>
      <td>${date}</td>
      <td>${departureTime}</td>
      <td>${arrivalTime}</td>
    `;
    tbody.appendChild(tr);
  });

  if (filtered.length > 0) {
    setRailwayMessage(`共找到 ${filtered.length} 筆符合條件的列車`, "success");
  } else {
    setRailwayMessage(`所選時段沒有班次，已改列出當日全部 ${validTrains.length} 筆列車`, "warning");
  }

  table.style.display = "table";
}

async function searchHighSpeedTrains(event) {
  event.preventDefault();

  const startStation = hsrFormElements.startStation.value;
  const endStation = hsrFormElements.endStation.value;
  const departDate = hsrFormElements.departDate.value;
  const departTime = hsrFormElements.departTime.value;

  clearResultMessage(hsrFormElements.message);

  if (!startStation || !endStation || !departDate || !departTime) {
    setResultMessage(hsrFormElements.message, "請完整選擇出發站、到達站、日期和時間", "warning");
    hideResultTable(hsrFormElements.table);
    return;
  }

  if (startStation === endStation) {
    setResultMessage(hsrFormElements.message, "出發站與到達站不可相同", "warning");
    hideResultTable(hsrFormElements.table);
    return;
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${BASE_URL}/v2/Rail/THSR/DailyTimetable/OD/${startStation}/to/${endStation}/${departDate}?%24format=JSON`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const trains = await res.json();
    renderHighSpeedTable(trains, departDate, departTime);
  } catch (err) {
    console.error("高鐵班次查詢錯誤:", err.message);
    setResultMessage(hsrFormElements.message, "查詢失敗，請稍後再試", "danger");
    hideResultTable(hsrFormElements.table);
  }
}

function renderHighSpeedTable(trains, date, departTime) {
  const table = hsrFormElements.table;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(trains) || trains.length === 0) {
    setResultMessage(hsrFormElements.message, "查無這一天這兩站之間的高鐵資料", "warning");
    hideResultTable(table);
    return;
  }

  const validTrains = trains
    .filter(train => train?.OriginStopTime?.DepartureTime)
    .sort((leftTrain, rightTrain) => {
      return leftTrain.OriginStopTime.DepartureTime.localeCompare(rightTrain.OriginStopTime.DepartureTime);
    });

  if (validTrains.length === 0) {
    setResultMessage(hsrFormElements.message, "高鐵班次資料不完整，暫時無法顯示", "warning");
    hideResultTable(table);
    return;
  }

  const filtered = validTrains.filter(train => {
    return train.OriginStopTime.DepartureTime >= departTime;
  });

  const trainsToRender = filtered.length > 0 ? filtered : validTrains;

  trainsToRender.forEach(train => {
    const trainInfo = train?.DailyTrainInfo ?? {};
    const trainType = trainInfo.TrainTypeName?.Zh_tw ?? "高鐵列車";
    const trainNo = trainInfo.TrainNo ?? "未提供";
    const originStation = train?.OriginStopTime?.StationName?.Zh_tw ?? "未提供";
    const destinationStation = train?.DestinationStopTime?.StationName?.Zh_tw ?? "未提供";
    const departureTime = train?.OriginStopTime?.DepartureTime ?? "未提供";
    const arrivalTime = train?.DestinationStopTime?.ArrivalTime ?? "未提供";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${trainNo}</td>
      <td>${trainType}</td>
      <td>${originStation}</td>
      <td>${destinationStation}</td>
      <td>${date}</td>
      <td>${departureTime}</td>
      <td>${arrivalTime}</td>
    `;
    tbody.appendChild(tr);
  });

  if (filtered.length > 0) {
    setResultMessage(hsrFormElements.message, `共找到 ${filtered.length} 筆符合條件的高鐵班次`, "success");
  } else {
    setResultMessage(hsrFormElements.message, `所選時間後沒有班次，已改列出當日全部 ${validTrains.length} 筆高鐵班次`, "warning");
  }

  table.style.display = "table";
}

async function searchAirFlights(event) {
  event.preventDefault();

  const departureAirport = airFormElements.departureAirport.value;
  const arrivalAirport = airFormElements.arrivalAirport.value;
  const flightDate = airFormElements.flightDate.value;
  const keyword = airFormElements.keyword.value.trim().toLowerCase();

  clearResultMessage(airFormElements.message);

  if (!departureAirport || !arrivalAirport || !flightDate) {
    setResultMessage(airFormElements.message, "請完整選擇出發機場、抵達機場與日期", "warning");
    hideResultTable(airFormElements.table);
    return;
  }

  if (departureAirport === arrivalAirport) {
    setResultMessage(airFormElements.message, "出發機場與抵達機場不可相同", "warning");
    hideResultTable(airFormElements.table);
    return;
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${BASE_URL}/v2/Air/FIDS/Airport/Departure/${departureAirport}?%24top=300&%24format=JSON`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const flights = await res.json();
    renderAirTable(flights, arrivalAirport, flightDate, keyword);
  } catch (err) {
    console.error("航空班次查詢錯誤:", err.message);
    setResultMessage(airFormElements.message, "查詢失敗，請稍後再試", "danger");
    hideResultTable(airFormElements.table);
  }
}

function renderAirTable(flights, arrivalAirport, flightDate, keyword) {
  const table = airFormElements.table;
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(flights) || flights.length === 0) {
    setResultMessage(airFormElements.message, "目前查無航空即時班次資料", "warning");
    hideResultTable(table);
    return;
  }

  const routeFlights = flights.filter(flight => flight.ArrivalAirportID === arrivalAirport);

  if (routeFlights.length === 0) {
    setResultMessage(airFormElements.message, "查無這條航線的航空班次資料", "warning");
    hideResultTable(table);
    return;
  }

  const dateFlights = routeFlights.filter(flight => flight.FlightDate === flightDate);
  const baseFlights = dateFlights.length > 0 ? dateFlights : routeFlights;

  const filteredFlights = baseFlights.filter(flight => {
    if (!keyword) {
      return true;
    }

    const airlineName = getAirlineName(flight.AirlineID).toLowerCase();
    const flightNumber = `${flight.AirlineID || ""}${flight.FlightNumber || ""}`.toLowerCase();
    return airlineName.includes(keyword) || flightNumber.includes(keyword) || (flight.AirlineID || "").toLowerCase().includes(keyword);
  });

  const flightsToRender = filteredFlights.length > 0 ? filteredFlights : baseFlights;
  flightsToRender
    .sort((leftFlight, rightFlight) => {
      return getAirDepartureTime(leftFlight).localeCompare(getAirDepartureTime(rightFlight));
    })
    .forEach(flight => {
      const departureAirportName = getAirportName(flight.DepartureAirportID);
      const arrivalAirportName = getAirportName(flight.ArrivalAirportID);
      const airlineName = getAirlineName(flight.AirlineID);
      const actualOrEstimatedTime = formatAirDateTime(flight.ActualDepartureTime || flight.EstimatedDepartureTime);
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${flight.AirlineID || ""}${flight.FlightNumber || "未提供"}</td>
        <td>${airlineName}</td>
        <td>${departureAirportName}</td>
        <td>${arrivalAirportName}</td>
        <td>${flight.FlightDate || "未提供"}</td>
        <td>${formatAirDateTime(flight.ScheduleDepartureTime)}</td>
        <td>${actualOrEstimatedTime}</td>
        <td>${flight.Terminal || "未提供"}</td>
        <td>${flight.Gate || "未提供"}</td>
        <td>${flight.DepartureRemark || "未提供"}</td>
      `;

      tbody.appendChild(tr);
    });

  if (dateFlights.length > 0 && filteredFlights.length > 0) {
    setResultMessage(airFormElements.message, `共找到 ${filteredFlights.length} 筆符合條件的航空班次`, "success");
  } else if (dateFlights.length === 0) {
    setResultMessage(airFormElements.message, `所選日期沒有即時資料，已改列出此航線目前可查到的 ${routeFlights.length} 筆班次`, "warning");
  } else if (filteredFlights.length === 0) {
    setResultMessage(airFormElements.message, `找不到符合關鍵字的班次，已改列出當日全部 ${baseFlights.length} 筆航班`, "warning");
  }

  table.style.display = "table";
}

function getAirportName(airportId) {
  const airport = airReferenceData.airportsById.get(airportId);
  if (!airport) {
    return airportId || "未提供";
  }

  return formatAirportLabel(airport);
}

function getAirlineName(airlineId) {
  const airline = airReferenceData.airlinesById.get(airlineId);
  if (!airline) {
    return airlineId || "未提供";
  }

  return airline.AirlineName?.Zh_tw || airline.AirlineName?.En || airlineId;
}

function formatAirDateTime(dateTime) {
  if (!dateTime) {
    return "未提供";
  }

  return dateTime.replace("T", " ");
}

function getAirDepartureTime(flight) {
  return flight.ScheduleDepartureTime || flight.EstimatedDepartureTime || flight.ActualDepartureTime || "";
}

function setRailwayMessage(message, type) {
  setResultMessage(railwayFormElements.message, message, type);
}

function clearRailwayMessage() {
  clearResultMessage(railwayFormElements.message);
}

function hideRailwayTable() {
  hideResultTable(railwayFormElements.table);
}

function setResultMessage(targetElement, message, type) {
  targetElement.innerHTML = `<div class="alert alert-${type} mb-0" role="alert">${message}</div>`;
}

function clearResultMessage(targetElement) {
  targetElement.innerHTML = "";
}

function hideResultTable(tableElement) {
  tableElement.style.display = "none";
}

railwayFormElements.submitButton.addEventListener("click", searchTrains);
hsrFormElements.submitButton.addEventListener("click", searchHighSpeedTrains);
airFormElements.submitButton.addEventListener("click", searchAirFlights);