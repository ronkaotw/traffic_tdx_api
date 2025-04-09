async function connectServer() {
    const URL ="https://tdx.transportdata.tw/api/basic";  //定義你的伺服器位置
    const YOUR_API_KEY = "";   //  定義你的伺服器驗證碼
    const AUTH = `承載著 ${YOUR_API_KEY}`   //   執行你的 API 驗證碼

    try {
        const res = await fetch(URL,{
            headers:{
                'Authorization': AUTH
            }
        })
        if(!res.ok){
            throw new Error(`回應狀態：${res.status}`);
        }

        const json = await res.json().catch((err) => {
            throw new Error('無法解析 JSON');
        });
    } catch (error) {
        console.error(error.message)
    }
}
