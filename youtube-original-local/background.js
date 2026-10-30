/* Local compatibility worker. No billing, authentication, license or private enrichment service. */
const limit=2147483647;
function localView(){return {ok:true,localEdition:true,unlimited:true,isPaying:false,isLifetime:false,isSubscribed:false,cap:limit,used:0,remaining:limit,exportCap:limit,exportUsed:0,exportRemaining:limit,aiChatCap:limit,aiChatRemaining:limit,quickViewCap:limit,quickViewRemaining:limit,videoStatsCap:limit,videoStatsRemaining:limit,renewsAt:null,portalUrl:null,grantUntil:null,lemonStatus:null,endsAt:null,resetsAt:null};}
chrome.runtime.onInstalled.addListener(()=>{
  chrome.storage.local.get('yfp_installed_at',data=>{if(!data.yfp_installed_at)chrome.storage.local.set({yfp_installed_at:Date.now()});});
});
chrome.runtime.onMessage.addListener((message,sender,respond)=>{
  if(sender.id!==chrome.runtime.id||!message||typeof message.type!=='string')return;
  switch(message.type){
    case 'YFP_AUTH_GET_SESSION':respond({user:null,localEdition:true});break;
    case 'YFP_AUTH_SIGN_OUT':case 'YFP_UPSERT_PROFILE':respond({ok:true});break;
    case 'YFP_GET_ENTITLEMENT':case 'YFP_CONSUME_SEARCH':case 'YFP_CONSUME_EXPORT':case 'YFP_SYNC_SUBSCRIPTION':respond(localView());break;
    case 'YFP_ENSURE_MAIN_WORLD': {
      const tabId=sender.tab?.id;
      if(tabId==null){respond({ok:false,error:'YouTube tab required'});break;}
      chrome.scripting.executeScript({target:{tabId},world:'MAIN',func:async(url)=>{await import(url);return true;},args:[chrome.runtime.getURL('assets/mainWorld.ts-Dop1yQHM.js')]}).then(()=>respond({ok:true}),error=>respond({ok:false,error:error.message}));
      return true;
    }
    case 'YFP_ENRICH_BATCH':respond({ok:false,error:'Private enrichment is disabled in the local edition. Public YouTube fallback is used.',videos:{},channels:{}});break;
    case 'YFP_LIST_GIFT_GRANTS':respond({ok:true,gifts:[]});break;
    default:respond({ok:false,error:'No account, payment or license service in this local edition.'});
  }
});
