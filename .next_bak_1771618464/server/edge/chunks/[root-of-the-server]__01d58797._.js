(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["chunks/[root-of-the-server]__01d58797._.js",76990,e=>{"use strict";e.s(["DEFAULT_SYSTEM_CONFIG",()=>s,"createAuditLog",()=>p,"createDataBackup",()=>f,"createLoginLog",()=>h,"getDataBackupById",()=>N,"getSystemConfig",()=>g,"listAuditLogs",()=>m,"listDataBackupMeta",()=>L,"listLoginLogs",()=>A,"listSuspiciousActivities",()=>y,"saveSystemConfig",()=>T]);var t=e.i(43795);let a=null,n=null,r={USER:{adminPage:!1,templateManagerPage:!1,superAdminPage:!1},ADMIN:{adminPage:!0,templateManagerPage:!1,superAdminPage:!1},TEMPLATE_ADMIN:{adminPage:!1,templateManagerPage:!0,superAdminPage:!1},SUPER_ADMIN:{adminPage:!0,templateManagerPage:!0,superAdminPage:!0}},s={appName:"Tamplateku",appLogoUrl:"/logo.png",maintenanceMode:!1,loginAccess:{formLoginEnabled:!0,googleLoginEnabled:!0},features:{browseTemplateEnabled:!0,blogEnabled:!0},integrations:{resendEnabled:!0,googleOauthEnabled:!0,publicApiEnabled:!1,publicApiKeyHint:""},roleAccess:r};function i(e){return"object"==typeof e&&null!==e}function o(e,t){return"boolean"==typeof e?e:t}function u(e,t){if("string"!=typeof e)return t;let a=e.trim();return a.length>0?a:t}function c(e){if(!i(e))return s;let t=i(e.loginAccess)?e.loginAccess:{},a=i(e.features)?e.features:{},n=i(e.integrations)?e.integrations:{};return{appName:u(e.appName,s.appName),appLogoUrl:u(e.appLogoUrl,s.appLogoUrl),maintenanceMode:o(e.maintenanceMode,s.maintenanceMode),loginAccess:{formLoginEnabled:o(t.formLoginEnabled,s.loginAccess.formLoginEnabled),googleLoginEnabled:o(t.googleLoginEnabled,s.loginAccess.googleLoginEnabled)},features:{browseTemplateEnabled:o(a.browseTemplateEnabled,s.features.browseTemplateEnabled),blogEnabled:o(a.blogEnabled,s.features.blogEnabled)},integrations:{resendEnabled:o(n.resendEnabled,s.integrations.resendEnabled),googleOauthEnabled:o(n.googleOauthEnabled,s.integrations.googleOauthEnabled),publicApiEnabled:o(n.publicApiEnabled,s.integrations.publicApiEnabled),publicApiKeyHint:u(n.publicApiKeyHint,s.integrations.publicApiKeyHint)},roleAccess:function(e){if(!i(e))return r;let t={USER:{...r.USER},ADMIN:{...r.ADMIN},TEMPLATE_ADMIN:{...r.TEMPLATE_ADMIN},SUPER_ADMIN:{...r.SUPER_ADMIN}};for(let a of["USER","ADMIN","TEMPLATE_ADMIN","SUPER_ADMIN"]){let n=e[a];i(n)&&(t[a]={adminPage:o(n.adminPage,t[a].adminPage),templateManagerPage:o(n.templateManagerPage,t[a].templateManagerPage),superAdminPage:o(n.superAdminPage,t[a].superAdminPage)})}return t.SUPER_ADMIN={adminPage:!0,templateManagerPage:!0,superAdminPage:!0},t}(e.roleAccess)}}async function l(){await (0,t.runD1Query)(`
    CREATE TABLE IF NOT EXISTS super_admin_settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `),await (0,t.runD1Query)(`
    CREATE TABLE IF NOT EXISTS super_admin_audit_logs (
      id TEXT PRIMARY KEY,
      actor_email TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      detail_json TEXT,
      severity TEXT NOT NULL DEFAULT 'INFO',
      created_at TEXT NOT NULL
    );
  `),await (0,t.runD1Query)(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_audit_logs_created
    ON super_admin_audit_logs(created_at DESC);
  `),await (0,t.runD1Query)(`
    CREATE TABLE IF NOT EXISTS auth_login_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      email TEXT NOT NULL,
      success INTEGER NOT NULL,
      reason TEXT,
      request_ip TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `),await (0,t.runD1Query)(`
    CREATE INDEX IF NOT EXISTS idx_auth_login_logs_email_created
    ON auth_login_logs(email, created_at DESC);
  `),await (0,t.runD1Query)(`
    CREATE INDEX IF NOT EXISTS idx_auth_login_logs_success_created
    ON auth_login_logs(success, created_at DESC);
  `),await (0,t.runD1Query)(`
    CREATE TABLE IF NOT EXISTS super_admin_backups (
      id TEXT PRIMARY KEY,
      snapshot_type TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `),await (0,t.runD1Query)(`
    CREATE INDEX IF NOT EXISTS idx_super_admin_backups_created
    ON super_admin_backups(created_at DESC);
  `)}async function d(){a||(a=l().catch(e=>{throw a=null,e})),await a}async function E(e,a){await d();let n=await (0,t.runD1Query)("SELECT value_json FROM super_admin_settings WHERE key = ? LIMIT 1",[e]);if(!n[0])return a;try{return JSON.parse(n[0].value_json)}catch{return a}}async function _(e,a){await d();let n=new Date().toISOString();await (0,t.runD1Query)("INSERT OR REPLACE INTO super_admin_settings (key, value_json, updated_at) VALUES (?, ?, ?)",[e,JSON.stringify(a),n])}async function g(e){if(!e?.forceRefresh&&n&&Date.now()<n.expiresAt)return n.value;let t=c(await E("system_config",s));return n={value:t,expiresAt:Date.now()+15e3},t}async function T(e){let t=c(e);return await _("system_config",t),n={value:t,expiresAt:Date.now()+15e3},t}async function p(e){await d();let a=new Date().toISOString();await (0,t.runD1Query)(`INSERT INTO super_admin_audit_logs (
      id, actor_email, action, target_type, target_id, detail_json, severity, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[crypto.randomUUID(),e.actorEmail.trim().toLowerCase(),e.action,e.targetType,e.targetId??null,e.detail?JSON.stringify(e.detail):null,e.severity??"INFO",a])}async function m(e=100){await d();let a=Number.isFinite(e)?Math.min(Math.max(Math.floor(e),1),500):100;return(await (0,t.runD1Query)(`SELECT id, actor_email, action, target_type, target_id, detail_json, severity, created_at
     FROM super_admin_audit_logs
     ORDER BY created_at DESC
     LIMIT ?`,[a])).map(e=>{let t=null;if(e.detail_json)try{let a=JSON.parse(e.detail_json);t=i(a)?a:null}catch{t=null}return{id:e.id,actorEmail:e.actor_email,action:e.action,targetType:e.target_type,targetId:e.target_id,detail:t,severity:e.severity,createdAt:e.created_at}})}async function h(e){await d();let a=new Date().toISOString();await (0,t.runD1Query)(`INSERT INTO auth_login_logs (
      id, user_id, email, success, reason, request_ip, user_agent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,[crypto.randomUUID(),e.userId??null,e.email.trim().toLowerCase(),+!!e.success,e.reason?.trim()||null,e.requestIp,e.userAgent,a])}async function A(e=100){await d();let a=Number.isFinite(e)?Math.min(Math.max(Math.floor(e),1),500):100;return(await (0,t.runD1Query)(`SELECT id, user_id, email, success, reason, request_ip, user_agent, created_at
     FROM auth_login_logs
     ORDER BY created_at DESC
     LIMIT ?`,[a])).map(e=>({id:e.id,userId:e.user_id,email:e.email,success:1===e.success,reason:e.reason,requestIp:e.request_ip,userAgent:e.user_agent,createdAt:e.created_at}))}async function y(){await d();let e=new Date(Date.now()-864e5).toISOString();return(await (0,t.runD1Query)(`SELECT email,
            COUNT(*) AS failed_attempts,
            MIN(created_at) AS first_attempt_at,
            MAX(created_at) AS last_attempt_at
     FROM auth_login_logs
     WHERE success = 0
       AND created_at >= ?
     GROUP BY email
     HAVING COUNT(*) >= 5
     ORDER BY failed_attempts DESC, last_attempt_at DESC
     LIMIT 100`,[e])).map(e=>({email:e.email,failedAttempts:e.failed_attempts,firstAttemptAt:e.first_attempt_at,lastAttemptAt:e.last_attempt_at}))}async function f(e){await d();let a=crypto.randomUUID(),n=new Date().toISOString();return await (0,t.runD1Query)(`INSERT INTO super_admin_backups (id, snapshot_type, payload_json, created_by, created_at)
     VALUES (?, ?, ?, ?, ?)`,[a,e.snapshotType,JSON.stringify(e.payload),e.createdBy,n]),{id:a,snapshotType:e.snapshotType,payload:e.payload,createdBy:e.createdBy,createdAt:n}}async function L(e=30){await d();let a=Number.isFinite(e)?Math.min(Math.max(Math.floor(e),1),200):30;return(await (0,t.runD1Query)(`SELECT id, snapshot_type, created_by, created_at
     FROM super_admin_backups
     ORDER BY created_at DESC
     LIMIT ?`,[a])).map(e=>({id:e.id,snapshotType:e.snapshot_type,createdBy:e.created_by,createdAt:e.created_at}))}async function N(e){await d();let a=await (0,t.runD1Query)(`SELECT id, snapshot_type, payload_json, created_by, created_at
     FROM super_admin_backups
     WHERE id = ?
     LIMIT 1`,[e]);if(!a[0])return null;let n={};try{let e=JSON.parse(a[0].payload_json);n=i(e)?e:{}}catch{n={}}return{id:a[0].id,snapshotType:a[0].snapshot_type,payload:n,createdBy:a[0].created_by,createdAt:a[0].created_at}}},84256,e=>{"use strict";async function t(){return"_ENTRIES"in globalThis&&_ENTRIES.middleware_instrumentation&&await _ENTRIES.middleware_instrumentation}e.s(["edgeInstrumentationOnRequestError",()=>r,"ensureInstrumentationRegistered",()=>i,"getEdgeInstrumentationModule",()=>t]);let a=null;async function n(){if("phase-production-build"===process.env.NEXT_PHASE)return;a||(a=t());let e=await a;if(null==e?void 0:e.register)try{await e.register()}catch(e){throw e.message=`An error occurred while loading instrumentation hook: ${e.message}`,e}}async function r(...e){let a=await t();try{var n;await (null==a||null==(n=a.onRequestError)?void 0:n.call(a,...e))}catch(e){console.error("Error in instrumentation.onRequestError:",e)}}let s=null;function i(){return s||(s=n()),s}function o(e){return`The edge runtime does not support Node.js '${e}' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime`}process!==e.g.process&&(process.env=e.g.process.env,e.g.process=process);try{Object.defineProperty(globalThis,"__import_unsupported",{value:function(e){let t=new Proxy(function(){},{get(t,a){if("then"===a)return{};throw Object.defineProperty(Error(o(e)),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})},construct(){throw Object.defineProperty(Error(o(e)),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})},apply(a,n,r){if("function"==typeof r[0])return r[0](t);throw Object.defineProperty(Error(o(e)),"__NEXT_ERROR_CODE",{value:"E394",enumerable:!1,configurable:!0})}});return new Proxy({},{get:()=>t})},enumerable:!1,configurable:!1})}catch{}i()},34080,35171,e=>{"use strict";e.s(["dynamicAccessAsyncStorageInstance",()=>t],34080);let t=(0,e.i(42871).createAsyncLocalStorage)();e.s(["dynamicAccessAsyncStorage",()=>t],35171)},70438,e=>{"use strict";e.s(["actionAsyncStorage",()=>t.actionAsyncStorageInstance]);var t=e.i(89610)},78500,(e,t,a)=>{t.exports=e.x("node:async_hooks",()=>require("node:async_hooks"))},51615,(e,t,a)=>{t.exports=e.x("node:buffer",()=>require("node:buffer"))},42871,e=>{"use strict";e.s(["createAsyncLocalStorage",()=>r]);let t=Object.defineProperty(Error("Invariant: AsyncLocalStorage accessed in runtime where it is not available"),"__NEXT_ERROR_CODE",{value:"E504",enumerable:!1,configurable:!0});class a{disable(){throw t}getStore(){}run(){throw t}exit(){throw t}enterWith(){throw t}static bind(e){return e}}let n="undefined"!=typeof globalThis&&globalThis.AsyncLocalStorage;function r(){return n?new n:new a}},13477,e=>{"use strict";e.s(["workAsyncStorageInstance",()=>t]);let t=(0,e.i(42871).createAsyncLocalStorage)()},68644,e=>{"use strict";e.s(["workAsyncStorage",()=>t.workAsyncStorageInstance]);var t=e.i(13477)},85021,e=>{"use strict";e.s(["workUnitAsyncStorageInstance",()=>t]);let t=(0,e.i(42871).createAsyncLocalStorage)()},18904,e=>{"use strict";e.s(["workUnitAsyncStorage",()=>t.workUnitAsyncStorageInstance]);var t=e.i(85021)},89610,e=>{"use strict";e.s(["actionAsyncStorageInstance",()=>t]);let t=(0,e.i(42871).createAsyncLocalStorage)()},34953,85105,e=>{"use strict";e.s(["afterTaskAsyncStorageInstance",()=>t],34953);let t=(0,e.i(42871).createAsyncLocalStorage)();e.s(["afterTaskAsyncStorage",()=>t],85105)},69568,e=>{"use strict";let t;e.s(["trackPendingChunkLoad",()=>s,"trackPendingImport",()=>i,"trackPendingModules",()=>o],69568);class a extends Error{constructor(e,t){super("Invariant: "+(e.endsWith(".")?e:e+".")+" This is a bug in Next.js.",t),this.name="InvariantError"}}class n{constructor(){throw this.count=0,this.earlyListeners=[],this.listeners=[],this.tickPending=!1,this.taskPending=!1,this.subscribedSignals=null,Object.defineProperty(new a("CacheSignal cannot be used in the edge runtime, because `cacheComponents` does not support it."),"__NEXT_ERROR_CODE",{value:"E685",enumerable:!1,configurable:!0})}noMorePendingCaches(){this.tickPending||(this.tickPending=!0,process.nextTick(()=>{if(this.tickPending=!1,0===this.count){for(let e=0;e<this.earlyListeners.length;e++)this.earlyListeners[e]();this.earlyListeners.length=0}})),this.taskPending||(this.taskPending=!0,setTimeout(()=>{if(this.taskPending=!1,0===this.count){for(let e=0;e<this.listeners.length;e++)this.listeners[e]();this.listeners.length=0}},0))}inputReady(){return new Promise(e=>{this.earlyListeners.push(e),0===this.count&&this.noMorePendingCaches()})}cacheReady(){return new Promise(e=>{this.listeners.push(e),0===this.count&&this.noMorePendingCaches()})}beginRead(){if(this.count++,null!==this.subscribedSignals)for(let e of this.subscribedSignals)e.beginRead()}endRead(){if(0===this.count)throw Object.defineProperty(new a("CacheSignal got more endRead() calls than beginRead() calls"),"__NEXT_ERROR_CODE",{value:"E678",enumerable:!1,configurable:!0});if(this.count--,0===this.count&&this.noMorePendingCaches(),null!==this.subscribedSignals)for(let e of this.subscribedSignals)e.endRead()}trackRead(e){this.beginRead();let t=this.endRead.bind(this);return e.then(t,t),e}subscribeToReads(e){if(e===this)throw Object.defineProperty(new a("A CacheSignal cannot subscribe to itself"),"__NEXT_ERROR_CODE",{value:"E679",enumerable:!1,configurable:!0});null===this.subscribedSignals&&(this.subscribedSignals=new Set),this.subscribedSignals.add(e);for(let t=0;t<this.count;t++)e.beginRead();return this.unsubscribeFromReads.bind(this,e)}unsubscribeFromReads(e){this.subscribedSignals&&this.subscribedSignals.delete(e)}}function r(){return t||(t=new n),t}function s(e){r().trackRead(e)}function i(e){let t=r();if(null!==e&&"object"==typeof e&&"then"in e&&"function"==typeof e.then){let a=Promise.resolve(e);t.trackRead(a)}}function o(e){let t=r().subscribeToReads(e);e.cacheReady().then(t)}},43795,e=>{"use strict";e.s(["ensureAuthUsersTable",()=>r,"runD1Query",()=>a]);let t=null;async function a(e,t=[]){let{accountId:n,databaseId:r,apiToken:s}=function(){let e=process.env.CLOUDFLARE_ACCOUNT_ID,t=process.env.CLOUDFLARE_D1_DATABASE_ID,a=process.env.CLOUDFLARE_API_TOKEN;if(!e||!t||!a)throw Error("Missing Cloudflare D1 env vars: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID, CLOUDFLARE_API_TOKEN");return{accountId:e,databaseId:t,apiToken:a}}(),i=`https://api.cloudflare.com/client/v4/accounts/${n}/d1/database/${r}/query`,o=await fetch(i,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s}`},body:JSON.stringify({sql:e,params:t}),cache:"no-store"});if(!o.ok){let e=await o.text();throw Error(`D1 query failed (${o.status}): ${e}`)}let u=await o.json();if(!u.success)throw Error(u.errors?.[0]?.message??"Unknown D1 error");return u.result?.[0]?.results??[]}async function n(){await a(`
    CREATE TABLE IF NOT EXISTS auth_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      is_active INTEGER NOT NULL DEFAULT 1,
      must_change_password INTEGER NOT NULL DEFAULT 0,
      force_logout_after TEXT,
      last_login_at TEXT,
      email_verified_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);let e=await a("PRAGMA table_info(auth_users)");e.some(e=>"email_verified_at"===e.name)||await a("ALTER TABLE auth_users ADD COLUMN email_verified_at TEXT"),e.some(e=>"role"===e.name)||await a("ALTER TABLE auth_users ADD COLUMN role TEXT NOT NULL DEFAULT 'USER'"),e.some(e=>"is_active"===e.name)||await a("ALTER TABLE auth_users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"),e.some(e=>"must_change_password"===e.name)||await a("ALTER TABLE auth_users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0"),e.some(e=>"force_logout_after"===e.name)||await a("ALTER TABLE auth_users ADD COLUMN force_logout_after TEXT"),e.some(e=>"last_login_at"===e.name)||await a("ALTER TABLE auth_users ADD COLUMN last_login_at TEXT")}async function r(){t||(t=n().catch(e=>{throw t=null,e})),await t}},30887,e=>{"use strict";e.s(["AUTH_COOKIE_NAME",()=>t,"decodeAuthUser",()=>n,"encodeAuthUser",()=>a]);let t="tamplateku_auth_user";function a(e){return JSON.stringify(e)}function n(e){if(!e)return null;let t=e=>{try{let t=JSON.parse(e);if("string"==typeof t.id&&"string"==typeof t.email&&"string"==typeof t.name&&("google"===t.provider||"github"===t.provider||"local"===t.provider))return{id:t.id,email:t.email,name:t.name,picture:"string"==typeof t.picture?t.picture:void 0,provider:t.provider,role:"USER"===t.role||"ADMIN"===t.role||"TEMPLATE_ADMIN"===t.role||"SUPER_ADMIN"===t.role?t.role:void 0,sessionIssuedAt:"string"==typeof t.sessionIssuedAt?t.sessionIssuedAt:void 0};return null}catch{return null}},a=t(e);if(a)return a;try{return t(decodeURIComponent(e))}catch{return null}}}]);

//# sourceMappingURL=%5Broot-of-the-server%5D__01d58797._.js.map