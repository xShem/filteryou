const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../filter-core.js');
const data=require('../youtube-data.js');
const now=Date.parse('2026-10-30T12:00:00Z');
const v={id:'abcdefghijk',channelId:'UCabcdefghijklmnopqrstuv',title:'Science space lecture',channel:'Space Lab',views:20000,seconds:1800,published:'2026-10-20',likes:1000,comments:50,subs:10000,description:'Physics and science',channelDescription:'Science education',chapters:[{seconds:0}],captionLanguages:['en','ru'],emails:['hi@example.com'],socials:['telegram'],country:'United States',verified:true,channelJoined:'2020-01-01',channelVideos:200,channelViews:1000000};
test('derived metrics use explicit ratios, not estimated growth history',()=>{
 const m=core.metrics(v,now);assert.equal(m.ageDays,10.5);assert.equal(m.vpd,20000/10.5);assert.equal(m.likeRate,5);assert.equal(m.commentRate,.25);assert.equal(m.performance,200);
 assert.equal(core.metrics({...v,views:0,subs:0},now).likeRate,undefined);
});
test('every advanced numeric range applies both boundaries',()=>{
 for(const [field,min,max]of core.ranges){const value=core.metrics(v,now)[field];assert.ok(value!=null,field);
  assert.ok(core.reasons(v,{[min]:String(value+1)},'',now).includes(field),min);
  assert.ok(core.reasons(v,{[max]:String(value-1)},'',now).includes(field),max);
 }
});
test('exact seconds override minutes; publication and channel date bounds are inclusive',()=>{
 assert.equal(core.reason(v,{minMinutes:'100',minSeconds:'1800'},'',now),'');
 assert.equal(core.reason(v,{dateFrom:'2026-10-20',dateTo:'2026-10-20'},'',now),'');
 assert.equal(core.reason(v,{dateTo:'2026-10-19'},'',now),'published');
 assert.equal(core.reason(v,{channelDateFrom:'2021-01-01'},'',now),'channelJoined');
});
test('text modes, descriptions, language prefixes, contacts and country filters',()=>{
 assert.equal(core.reason(v,{titleInclude:'science, space',titleMode:'all'}),'');
 assert.equal(core.reason(v,{titleInclude:'science space',titleMode:'phrase'}),'');
 assert.equal(core.reason(v,{titleInclude:'science, music',titleMode:'all'}),'title');
 assert.equal(core.reason(v,{descriptionExclude:'physics'}),'description');
 assert.equal(core.reason(v,{channelDescriptionInclude:'education'}),'');
 assert.equal(core.reason(v,{languages:'fr, ru',requireChapters:true,requireEmail:true}),'');
 assert.equal(core.reason(v,{socialInclude:'discord'}),'socials');
 assert.equal(core.reason(v,{countries:'united states'}),'');
 assert.equal(core.reason(v,{countriesExclude:'united states'}),'country');
 assert.equal(core.reason(v,{strictSearch:true},'space lecture'),'');
 assert.equal(core.reason(v,{strictSearch:true},'"space lecture" after:2026-01-01 before:2026-12-31'),'');
 assert.equal(core.reason(v,{strictSearch:true},'space music'),'strictSearch');
});
test('missing metadata is distinct from explicit empty metadata',()=>{
 assert.equal(core.reason({...v,captionLanguages:[]},{requireCaptions:true}),'captionLanguages');
 assert.equal(core.reason({...v,captionLanguages:null},{requireCaptions:true}),'');
 assert.equal(core.reason({...v,captionLanguages:null},{requireCaptions:true,unknown:'hide'}),'unknown:captionLanguages');
});
test('blocks use IDs and master pause bypasses every rule',()=>{
 assert.equal(core.reason(v,{blockedChannels:[v.channelId]}),'blockedChannel');
 assert.equal(core.reason(v,{blockedVideos:[v.id]}),'blockedVideo');
 assert.equal(core.reason(v,{blockedVideos:[v.id],enabled:false}),'');
});
test('chapters require zero start, 3 entries and increasing timestamps',()=>{
 assert.equal(core.chapters('0:00 Intro\n0:10 A\n1:20 B').length,3);
 assert.equal(core.chapters('0:01 Intro\n0:10 A\n1:20 B').length,0);
 assert.equal(core.chapters('0:00 Intro\n0:05 A\n1:20 B').length,0);
 assert.equal(core.chapters('0:00 Intro\n0:10 A').length,0);
});
test('import sanitizer rejects unknown keys, wrong types, negatives and nonfinite numbers',()=>{
 const value=core.sanitize(JSON.parse('{"enabled":"yes","sort":"evil","minViews":-5,"maxViews":"Infinity","dateFrom":"x","enrich":false,"arbitrary":"https://evil.test","blockedVideos":["abc",5,"abc"]}'));
 assert.equal(value.enabled,true);assert.equal(value.sort,'original');assert.equal(value.minViews,'');assert.equal(value.maxViews,'');assert.equal(value.dateFrom,'');assert.deepEqual(value.blockedVideos,['abc']);assert.ok(!('arbitrary'in value));
});
test('sort keeps unknowns last; analytics handles empty and even samples',()=>{
 assert.equal(core.compare({views:null},{views:10},'views-desc'),1);assert.equal(core.compare({views:null},{views:10},'views-asc'),1);
 assert.equal(core.compare({views:20},{views:10},'views-desc'),-10);
 assert.equal(core.analytics([{views:10},{views:20}]).medianViews,15);assert.equal(core.analytics([]).medianViews,null);assert.equal(core.analytics([{views:null}]).averageViews,null);
});
test('CSV escapes quotes and neutralizes spreadsheet formulas',()=>{
 const csv=core.csv([{id:'abcdefghijk',title:'=HYPERLINK("evil")',channel:'A,B',views:0}]);
 assert.ok(csv.includes('"\'=HYPERLINK(""evil"")"'));assert.ok(csv.includes('"A,B"'));assert.ok(csv.includes('"0"'));
});
const embed=(name,value)=>`<script>var ${name} = ${JSON.stringify(value)};</script>`;
const player={videoDetails:{videoId:v.id,title:'Braces { in "title" }',channelId:v.channelId,author:'Space Lab',viewCount:'20000',lengthSeconds:'1800',shortDescription:'0:00 Intro\n0:10 A\n1:20 B\nhi@example.com https://t.me/example',keywords:['science']},microformat:{playerMicroformatRenderer:{publishDate:'2026-10-20',category:'Education'}},captions:{playerCaptionsTracklistRenderer:{captionTracks:[{languageCode:'en',name:{simpleText:'English'},kind:'asr'}]}}};
const initial={contents:{videoPrimaryInfoRenderer:{buttons:[{accessibilityData:{label:'1,000 likes'}}]},videoOwnerRenderer:{subscriberCountText:{simpleText:'10K subscribers'},badges:[{metadataBadgeRenderer:{style:'BADGE_STYLE_TYPE_VERIFIED'}}]},commentsEntryPointHeaderRenderer:{commentCount:{simpleText:'50'}}}};
test('public-page parser extracts metadata without executing page scripts',()=>{
 const parsed=data.parseVideo(embed('ytInitialPlayerResponse',player)+embed('ytInitialData',initial),v.id);
 assert.equal(parsed.title,'Braces { in "title" }');assert.equal(parsed.views,20000);assert.equal(parsed.likes,1000);assert.equal(parsed.comments,50);assert.equal(parsed.subs,10000);assert.equal(parsed.chapters.length,3);assert.equal(parsed.verified,true);assert.deepEqual(parsed.captionLanguages,['en']);assert.ok(parsed.emails.includes('hi@example.com'));assert.ok(parsed.socials.includes('telegram'));
});
test('parser fails closed for consent, unavailable pages, malformed JSON and wrong video IDs',()=>{
 assert.throws(()=>data.parseVideo('<html>Consent</html>',v.id),/публичные/);
 assert.throws(()=>data.parseVideo(embed('ytInitialPlayerResponse',player),'XXXXXXXXXXX'),/публичные/);
 assert.equal(data.jsonAfter('var x = {"unterminated":','var x ='),null);
});
test('channel parsing retains unknown values instead of fabricating zeros',()=>{
 const html=embed('ytInitialData',{metadata:{channelMetadataRenderer:{description:'Science'}},aboutChannelViewModel:{country:'United States',joinedDateText:{content:'Joined Jan 1, 2020'},viewCountText:'1,000,000 views',subscriberCountText:'10K subscribers',videoCountText:'200 videos'}});
 const ch=data.parseChannel(html,v.channelId);assert.equal(ch.country,'United States');assert.equal(ch.channelJoined,'2020-01-01');assert.equal(ch.channelViews,1000000);assert.equal(ch.channelVideos,200);
 const absent=data.parseChannel(embed('ytInitialData',{channelMetadataRenderer:{description:'x'}}),v.channelId);assert.equal(absent.channelViews,null);assert.equal(absent.country,null);
});
