import messages from './local-messages.js';
function t(key, substitutions){let value='';try{value=globalThis.chrome?.i18n?.getMessage(key,substitutions)||'';}catch{}if(!value)value=messages[key]?.message||key.replace(/([a-z])([A-Z])/g,'$1 $2');const args=Array.isArray(substitutions)?substitutions:[substitutions];return value.replace(/\$(\d+)/g,(_,n)=>String(args[Number(n)-1]??''));}
export {t};
