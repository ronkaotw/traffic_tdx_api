const BASE_URL = "https://tdx.transportdata.tw/api/basic";

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

    const res = await fetch(`${BASE_URL}/v2/Rail/TRA/Station?%24top=30&%24format=JSON`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);

    const data = await res.json();
    getHtmlData(data);
  } catch (err) {
    console.error("渲染錯誤:", err.message);
  }
}

connTDX();

function getHtmlData(stations) {
  const startSelect = document.getElementById("startStation");
  const endSelect = document.getElementById("endStation");

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

async function searchTrains(event) {
  event.preventDefault();

  const startStation = document.getElementById("startStation").value;
  const endStation = document.getElementById("endStation").value;
  const departDate = document.querySelector("input[type='date']").value;
  const timeInputs = document.querySelectorAll("input[type='time']");
  const startTime = timeInputs[0].value;
  const endTime = timeInputs[1].value;

  if (!startStation || !endStation || !departDate || !startTime || !endTime) {
    alert("請完整選擇出發站、到達站、日期和時間");
    return;
  }

  try {
    const token = await getAccessToken();
    const res = await fetch(`${BASE_URL}/v2/Rail/TRA/DailyTimetable/OD/${startStation}/to/${endStation}/${departDate}?%24format=JSON`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const trains = await res.json();
    renderTable(trains, departDate, startTime, endTime);
  } catch (err) {
    console.error("查詢班次錯誤:", err.message);
  }
}

function renderTable(trains, date, startTime, endTime) {
  const table = document.querySelector("table");
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  const filtered = trains.filter(train => {
    const depart = train.OriginStopTime[0].DepartureTime;
    return depart >= startTime && depart <= endTime;
  });

  if (filtered.length === 0) {
    alert("查無符合時間的列車");
    table.style.display = "none";
    return;
  }

  filtered.forEach(train => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${train.OriginStopTime[0].StationName.Zh_tw}</td>
      <td>${train.DestinationStopTime[0].StationName.Zh_tw}</td>
      <td>${date}</td>
      <td>${train.OriginStopTime[0].DepartureTime}</td>
    `;
    tbody.appendChild(tr);
  });

  table.style.display = "table";
}

document.getElementById("submit").addEventListener("click", searchTrains);
loadStations();