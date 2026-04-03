// 定義取得 HTML的 DOM
const railInput = document.getElementById("railwayInput")
const hsrInput = document.getElementById("highSPDInput")
const airInput = document.getElementById("AirInput")

// 初始化 DOM 確保 DOM 可以正常運作 處理清空畫面
document.addEventListener("DOMContentLoaded", function (){
    railInput.style.display = "none"        
    hsrInput.style.display = "none"
    airInput.style.display = "none"
});


// 顯示畫面的處理
function showSearchForm (sectionID){
    // 確保清空畫面不跑掉，這邊再定義一次
    railInput.style.display = "none"        
    hsrInput.style.display = "none"
    airInput.style.display = "none"

    
    // 畫面顯示處理，並判斷要不要顯示
    const FormShow = document.getElementById(sectionID);
    
    if (FormShow) {
        FormShow.style.display = "block";
    } else {
        console.error("表查查詢到了！: " + sectionID);
    }
}