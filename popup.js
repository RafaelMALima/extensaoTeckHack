document.addEventListener('DOMContentLoaded', function() {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var activeTab = tabs[0];
      var url = new URL(activeTab.url);
      var domain = url.hostname;
  
      browser.runtime.sendMessage({action: "cookiesOrSmtIdk", domain: domain}, function(response) {
            console.log(response)
        //console.log(response.firstParty);
        //document.getElementById('totalCookies').textContent = response.total;
        document.getElementById('fpc_num').textContent = response.first;
        document.getElementById('tpc_num').textContent = response.third;
        document.getElementById('sesh_num').textContent = response.session;
        document.getElementById('per_num').textContent = response.persistent;
      });
    });
});

document.addEventListener('DOMContentLoaded', function(){
    browser.runtime.sendMessage({action: "checkStorage"}, function(response){
        console.log("localStorage");
        console.log(response);
        if (!response || response.error){
            document.getElementById('session_storage').textContent = "Nn achou storage."
        } else{
            document.getElementById('local_storage').textContent = response.localStorageCount;
            document.getElementById('session_storage').textContent = response.sessionStorageCount;
        }
    });
});


document.addEventListener('DOMContentLoaded', function(){
    browser.runtime.sendMessage({action: "detectCanvasFingerprinting"}, function(response){
        console.log("canvas response:", response);
        document.getElementById("canvas_fp").textContent = response;
    });
});

document.addEventListener('DOMContentLoaded', function(){
    browser.runtime.sendMessage({action: "detectThirdPartyConnections"}, function(response){
        console.log("thirdP connections:", response);
        if (response){
             response.forEach(site_detected =>{
                console.log(site_detected);
                var tag = document.createElement("li");
                tag.textContent = site_detected;
                document.getElementsById("ul").appendChild(tag);
            });
        }else{
            document.getElementById("tpconn").textContent = "Nn encontrou con. de terceiros";
        }
    });
});
