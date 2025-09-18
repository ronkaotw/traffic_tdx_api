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
    console.log(data);
    return data;
  } catch (err) {
    console.error("渲染錯誤:", err.message);
  }
}

connTDX();