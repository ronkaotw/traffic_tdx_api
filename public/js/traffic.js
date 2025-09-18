const BASE_URL = "https://tdx.transportdata.tw/api/basic";

// 取得金鑰
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

// 鐵道查詢
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
    getHtmlData(data);  // 呼叫渲染
  } catch (err) {
    console.error("渲染錯誤:", err.message);
  }
}

connTDX();

// 取得車站資料
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
document.getElementById("submitBtn").addEventListener("click", async () => {
    try {
        const stations = await connTDX(); // 呼叫 API
        renderStationsTable(stations);     // 渲染表格
        document.getElementById("stationList").style.display = "block"; // 顯示表格
    } catch (err) {
        console.error("資料顯示錯誤:", err);
    }
});

// 渲染表格
function renderStationsTable(stations) {
    const tableBody = document.getElementById("stationTableBody");
    tableBody.innerHTML = ""; // 清空舊資料

    stations.forEach(station => {
        const tr = document.createElement("tr");

        const tdID = document.createElement("td");
        tdID.textContent = station.StationID;
        tr.appendChild(tdID);

        const tdName = document.createElement("td");
        tdName.textContent = station.StationName.Zh_tw;
        tr.appendChild(tdName);

        const tdCity = document.createElement("td");
        tdCity.textContent = station.StationAddress; // 可改成 CityName
        tr.appendChild(tdCity);

        tableBody.appendChild(tr);
    });
}
