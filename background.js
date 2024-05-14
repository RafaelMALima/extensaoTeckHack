function getPageCookies(id, domain){
    return new Promise(resolve => {
        browser.cookies.getAll({}, function(cookies){
            response_obj = {
                first : 0,
                third : 0,
                session : 0,
                persistent : 0
            }
            cookies.forEach(cookie => {
                cookie.domain === domain ? response_obj.first++ : response_obj.third++;
                "session" in cookie && cookie.session ? response_obj.session++ : response_obj.persistent++;
            });
            console.log(response_obj.first);
            console.log(response_obj.third);
            resolve(response_obj);
        });
    });
};

function checkStorage(tabId, sendResponse) {
  return browser.tabs.executeScript(tabId, {
    code: `({
      localStorageCount: Object.keys(localStorage).length,
      sessionStorageCount: Object.keys(sessionStorage).length
    })`
  }, function(thingy) {
    if (browser.runtime.lastError) {
      sendResponse({error: browser.runtime.lastError.message});
    } else {
      console.log(thingy[0]);
      sendResponse(thingy[0]);
    }
  });
}

//ESSAS FUNÇÕES VIERAM DO MEU AMIGO GPT
function detectCanvasFingerprint() {
    // Create a canvas element
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    // Set a fixed canvas size to eliminate differences based on scaling
    canvas.width = 200;
    canvas.height = 50;

    // Use a random set of drawing features
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.font = "11pt Arial";
    ctx.fillText("BrowserLeaks.com", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("Your IP is being logged!", 2, 30);

    // Convert the canvas to a data URL and hash it
    var dataURL = canvas.toDataURL();
    var hash = 0;
    if (dataURL.length == 0) return false; // Canvas is tainted, fingerprinting is likely impossible
    for (var i = 0; i < dataURL.length; i++) {
        hash = (hash << 5) - hash + dataURL.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
    }

    // If hash is non-zero, fingerprinting is likely occurring
    return hash !== 0;
}

/*
let thirdPartyDomains = {}

browser.webRequest.onBeforeRequest.addListener(details => {
    let domain = new URL(details.url).hostname;
    let tabId = details.tabId;
    browser.tabs.get(tabId, tab=>{
        let tabDomain = new URL(tab.url).hostname;
        let baseDomain = domain.split('.')[1];
        let tBaseDomain = tabDomain.split('.')[1]
        if (baseDomain != tBaseDomain){
            thirdPartyDomains[tBaseDomain] = baseDomain;
        }

    })
},
  {urls: ["<all_urls>"]},
  []
);
*/


let thirdPartyRequests = {}

chrome.tabs.onRemoved.addListener(function(tabId) {
  delete thirdPartyRequests[tabId];
  gradeScore = 0;
});

function getBaseDomain(domain) {
  const domainParts = domain.split('.');
  const topLevelDomain = domainParts.pop();
  const secondLevelDomain = domainParts.pop();
  
  if (secondLevelDomain) {
    return `${secondLevelDomain}.${topLevelDomain}`;
  }
  
  return domain;
}

browser.webRequest.onBeforeRequest.addListener(
  function(details) {
    const url = new URL(details.url);
    const domain = url.hostname;
    const tabId = details.tabId;

    if (isBackgroundProcess(tabId)) return;

    browser.tabs.get(tabId, function(tab) {
      if (tabIsClosed(tab)) return;

      const tabDomain = new URL(tab.url).hostname;
      const baseDomain = getBaseDomain(domain);
      const baseTabDomain = getBaseDomain(tabDomain);

      if (isThirdPartyRequest(baseDomain, baseTabDomain)) {
        storeThirdPartyRequest(tabId, domain);
      }
    });
  },
  {urls: ["<all_urls>"]},
  []
);

function isBackgroundProcess(tabId) {
  return tabId < 0;
}

function tabIsClosed(tab) {
  return browser.runtime.lastError || !tab;
}

function isThirdPartyRequest(baseDomain, baseTabDomain) {
  return baseDomain !== baseTabDomain;
}

function storeThirdPartyRequest(tabId, domain) {
  if (!thirdPartyRequests[tabId]) {
    thirdPartyRequests[tabId] = new Set();
  }
  thirdPartyRequests[tabId].add(domain);
}


browser.runtime.onMessage.addListener((m, sender, sendResponse) => {
    if (m.action == "cookiesOrSmtIdk"){
        browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                getPageCookies(tabs[0].id, m.domain).then(thingmabob => sendResponse(thingmabob));
            } else {
                sendResponse({error: "No active tab found"});
            }
        });
        return true;
    }
    else if (m.action == "checkStorage"){
        browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                checkStorage(tabs[0].id, sendResponse);
            }
            else{
                sendResponse({error:"sla"});
            }
        });
        return true;
    }
    else if (m.action == "detectCanvasFingerprinting"){
        browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (detectCanvasFingerprint()) {sendResponse(true)}
            else {sendResponse(false)}
        });
        return true;
    }
    else if (m.action == "detectThirdPartyConnections"){
        browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs.length > 0) {
                sendResponse(Array.from(thirdPartyRequests[tabs[0].id]));
            } else{
                sendResponse([]);
            }
        });
        return true;
    }
});
