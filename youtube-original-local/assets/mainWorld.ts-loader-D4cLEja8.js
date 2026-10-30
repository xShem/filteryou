// Load the original MAIN-world module via the worker using an absolute extension URL.
chrome.runtime.sendMessage({type:'YFP_ENSURE_MAIN_WORLD'},()=>{if(chrome.runtime.lastError)console.warn('[YouTube Local] MAIN-world startup:',chrome.runtime.lastError.message);});
