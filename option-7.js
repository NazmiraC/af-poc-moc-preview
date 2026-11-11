const projects=[
  {title:'AF Landscape',status:'Current',type:'POC',business:'DS&I',scorecard:'Yes',dates:'12 Jan 2026 – 27 Nov 2026',image:'assets/af-engage.png',description:'AF Landscape is a proof of concept for creating interactive 3D environments that allow people to explore spaces, cities, structures and projects spatially.',phase:'Steps 3 & 4',contributors:'DS&I Team',audience:'Internal',href:'landscape.html',tags:['Innovation','Ideation','Communication','Concept development','Design','Technical architecture','Development']},
  {title:'Pre to Post',status:'Current',type:'Design',business:'Retirement',scorecard:'Yes',dates:'03 Mar 2026 – 18 Dec 2026',image:'assets/pre-post.png',description:'A clear visual retirement projection journey that makes complex planning easier to understand.',phase:'Step 3',contributors:'Product Team',audience:'Clients',href:'#',tags:['Research','Planning','Experience design','Prototyping']},
  {title:'Launch Lab',status:'Current',type:'POC',business:'DS&I',scorecard:'Yes',dates:'08 Feb 2026 – 30 Sep 2026',image:'assets/hero-project-04.png',description:'A collaborative environment for assembling, testing and communicating new ideas.',phase:'Step 4',contributors:'Innovation Team',audience:'Internal',href:'#',tags:['Innovation','Co-creation','Testing','Development']},
  {title:'Global Operations',status:'Proposed',type:'Design',business:'Operations',scorecard:'No',dates:'14 Jun 2026 – 20 Feb 2027',image:'assets/hero-project-02.png',description:'A connected view of teams, systems and global operational activity.',phase:'Step 2',contributors:'Operations Team',audience:'Internal',href:'#',tags:['Operations','Data','Communication','Service design']},
  {title:'System Map',status:'Completed',type:'Design',business:'DS&I',scorecard:'Yes',dates:'10 Aug 2025 – 12 Dec 2025',image:'assets/hero-project-01.png',description:'A hand-drawn map that makes a complex data landscape easier to navigate.',phase:'Completed',contributors:'DS&I Team',audience:'Internal',href:'#',tags:['Systems thinking','Data','Mapping','Strategy']},
  {title:'Operations Study',status:'Proposed',type:'POC',business:'Operations',scorecard:'No',dates:'01 May 2025 – 30 Nov 2025',image:'assets/hero-project-03.png',description:'An early monochrome study for an immersive operations workspace.',phase:'Step 1',contributors:'Design Team',audience:'Internal',href:'#',tags:['Research','Spatial design','Concept development']},
  {title:'Project Room',status:'Completed',type:'Design',business:'DS&I',scorecard:'Yes',dates:'18 Jan 2025 – 28 Aug 2025',image:'assets/hero-project-05.png',description:'A focused workspace bringing project teams, progress and decisions together.',phase:'Completed',contributors:'Delivery Team',audience:'Internal',href:'#',tags:['Collaboration','Delivery','Communication']}
];
const projectFilters=[
  {category:'Project',purpose:['Innovation','Ideation','Communication'],discipline:['Concept development','Design','Technical architecture','Development'],deliverable:'3D model'},
  {category:'Design',purpose:['Enhancement','Communication'],discipline:['UX','Design thinking','Research'],deliverable:'Calculator'},
  {category:'Project',purpose:['Innovation','New features'],discipline:['Concept development','Testing','Development'],deliverable:'App'},
  {category:'Design',purpose:['Strategy','Communication'],discipline:['Research','Analysis'],deliverable:'Dashboard'},
  {category:'Design',purpose:['Ideation','Strategy'],discipline:['UX','Research'],deliverable:'Customer journey map'},
  {category:'Support',purpose:['Enhancement'],discipline:['Research','Analysis'],deliverable:'Report'},
  {category:'Project',purpose:['Innovation','Communication'],discipline:['Deployment','Testing'],deliverable:'Presentation'}
];

const deck=document.querySelector('#flipDeck');
const showcase=document.querySelector('#showcase');
const fields={title:document.querySelector('#projectTitle'),description:document.querySelector('#projectDescription'),status:document.querySelector('#statusTag'),type:document.querySelector('#projectType'),business:document.querySelector('#businessArea'),scorecard:document.querySelector('#scorecard'),dates:document.querySelector('#dateRange'),button:document.querySelector('#viewButton'),tags:document.querySelector('#tagStrip')};
const requestedProject=Number.parseInt(new URLSearchParams(window.location.search).get('project'),10);
let active=Number.isInteger(requestedProject)&&requestedProject>=0&&requestedProject<projects.length?requestedProject:0;
let visible=[...projects.keys()];
let dragStart=null;
let pointerCard=null;
let suppressCardClick=false;
let changingTimer=null;
let introRunning=true;
const INTRO_SESSION_KEY='af-project-showcase-intro-seen-v1';

function hasSeenDeckIntro(){
  try{return sessionStorage.getItem(INTRO_SESSION_KEY)==='true'}catch{return false}
}
function rememberDeckIntro(){
  try{sessionStorage.setItem(INTRO_SESSION_KEY,'true')}catch{}
}

function cardMarkup(project,index){return `<article class="flip-card" data-index="${index}" tabindex="0" role="group" aria-label="${project.title}"><div class="flip-inner"><div class="flip-face flip-front"><img src="${project.image}" alt="${project.title}"></div><div class="flip-face flip-back"><div class="summary-card"><small>Project status</small><b>${project.status}</b></div><div class="summary-card"><small>Phase</small><b>${project.phase}</b></div><div class="summary-card"><small>Contributors</small><b>${project.contributors}</b></div><div class="summary-card"><small>Audience</small><b>${project.audience}</b></div></div></div></article>`}
deck.innerHTML=projects.map(cardMarkup).join('');
const cards=[...document.querySelectorAll('.flip-card')];

function wrappedDistance(index,current,length){let distance=index-current;if(distance>length/2)distance-=length;if(distance<-length/2)distance+=length;return distance}
function clamp(min,max,value){return Math.min(max,Math.max(min,value))}
function getBaseCardLayout(index){
  const activePosition=visible.indexOf(active);
  const position=visible.indexOf(index);
  if(position<0)return null;
  const distance=wrappedDistance(position,activePosition,visible.length);
  const magnitude=Math.abs(distance);
  const spacing=clamp(108,150,window.innerWidth*.105);
  return {distance,magnitude,x:distance*spacing,y:magnitude*10,z:180-magnitude*120,scale:Math.max(.68,1-magnitude*.1),opacity:magnitude>=2?.14:Math.max(.42,1-magnitude*.2),saturation:Math.max(.35,1-magnitude*.18),zIndex:20-magnitude};
}
function getCardLayout(index){
  const base=getBaseCardLayout(index);
  if(!base)return null;
  const direction=Math.sign(base.distance);
  const startScale=.94-base.magnitude*.006;
  return {...base,x:base.x*.84-direction*(base.magnitude?2.5:0),y:base.y*.80-base.magnitude*.7,z:base.z*.84,scale:startScale+(base.scale-startScale)*.84,opacity:.96+(base.opacity-.96)*.84,saturation:.88+(base.saturation-.88)*.84,rotation:direction*.18};
}
function renderMeta(project,animate){
  clearTimeout(changingTimer);
  const write=()=>{fields.title.textContent=project.title;fields.description.textContent=project.description;fields.status.textContent=project.status;fields.status.className=`status-tag status-${project.status.toLowerCase()}`;fields.type.textContent=project.type;fields.business.textContent=project.business;fields.scorecard.textContent=project.scorecard;fields.dates.textContent=project.dates;fields.button.href=project.href;fields.button.setAttribute('aria-disabled',String(project.href==='#'));fields.tags.innerHTML=project.tags.map(tag=>`<span>${tag}</span>`).join('')};
  if(!animate){write();return}
  showcase.classList.add('is-changing');changingTimer=setTimeout(()=>{write();showcase.classList.remove('is-changing')},140);
}
function update(animate=false){
  renderMeta(projects[active],animate);
  cards.forEach((card,index)=>{const layout=getCardLayout(index);if(!layout){card.hidden=true;return}card.hidden=false;card.classList.remove('is-flipped');card.style.transform=`translate(-50%,-50%) translate3d(${layout.x}px,${layout.y}px,${layout.z}px) rotateZ(${layout.rotation}deg) scale(${layout.scale})`;card.style.opacity=String(layout.opacity);card.style.filter=`saturate(${layout.saturation})`;card.style.zIndex=String(layout.zIndex);card.style.removeProperty('pointer-events');card.style.removeProperty('--card-border');card.dataset.active=String(layout.distance===0);card.setAttribute('aria-hidden','false')});
}
function select(index){if(index===active||!visible.includes(index))return;active=index;update(true)}
function step(direction){if(!visible.length)return;const position=visible.indexOf(active);select(visible[(position+direction+visible.length)%visible.length])}
function flipActive(){if(!visible.length)return;cards[active].classList.toggle('is-flipped')}
function activateCard(card){
  if(!card)return;
  const index=Number(card.dataset.index);
  index===active?flipActive():select(index);
  card.focus({preventScroll:true});
}

cards.forEach(card=>{
  card.addEventListener('click',()=>{
    if(suppressCardClick)return;
    activateCard(card);
  });
  card.addEventListener('keydown',event=>{
    if(event.key!==' ')return;
    event.preventDefault();
    const index=Number(card.dataset.index);
    index===active?flipActive():select(index);
  });
});
document.addEventListener('keydown',event=>{if(event.key==='ArrowRight')step(1);if(event.key==='ArrowLeft')step(-1)});
deck.addEventListener('pointerdown',event=>{dragStart=event.clientX;pointerCard=event.target.closest('.flip-card');suppressCardClick=false});
deck.addEventListener('pointerup',event=>{
  if(dragStart===null)return;
  const delta=event.clientX-dragStart;
  suppressCardClick=true;
  if(Math.abs(delta)>45)step(delta<0?1:-1);
  else{
    const hitCard=document.elementFromPoint(event.clientX,event.clientY)?.closest('.flip-card');
    activateCard(hitCard||pointerCard);
  }
  dragStart=null;
  pointerCard=null;
  setTimeout(()=>{suppressCardClick=false},0);
});
deck.addEventListener('pointercancel',()=>{dragStart=null;pointerCard=null;suppressCardClick=false});
const searchAction=document.querySelector('#searchAction');
const searchInput=document.querySelector('#projectSearch');
const searchToggle=document.querySelector('#toggleSearch');
const advancedSearch=document.querySelector('#advancedSearch');
const SEARCH_STORAGE_KEY='af-project-search-query';
const advancedPanel=document.querySelector('#advancedPanel');
const galleryAdvancedForm=document.querySelector('#galleryAdvancedForm');
const galleryResultCount=document.querySelector('#galleryResultCount');
const galleryAppliedFilters=document.querySelector('#galleryAppliedFilters');
const searchFilterSummary=document.querySelector('#searchFilterSummary');
const searchClearAll=document.querySelector('#searchClearAll');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
function buildPillFilters(form){
  form.querySelectorAll('.drawer-field').forEach(field=>{
    const select=field.querySelector('select');
    const details=field.matches('details')?field:null;
    const name=select?.name||details?.querySelector('input')?.name;
    if(!name)return;
    const title=(select?field.querySelector(':scope > span'):details.querySelector('summary span'))?.textContent.replace('Multi-select','').trim()||name;
    const choices=select
      ?[...select.options].filter(option=>option.value).map(option=>({value:option.value,label:option.textContent}))
      :[...details.querySelectorAll('input')].map(input=>({value:input.value,label:input.closest('label').textContent.trim()}));
    const group=document.createElement('fieldset');
    group.className='filter-pill-group';
    group.innerHTML=`<legend>${title}</legend><div class="filter-pill-options">${choices.map(choice=>`<label><input type="checkbox" name="${name}" value="${choice.value.replace(/"/g,'&quot;')}"><span>${choice.label}</span></label>`).join('')}</div>`;
    field.replaceWith(group);
  });
}
buildPillFilters(galleryAdvancedForm);
let searchTimer=null;
function resetSearchResults(){searchInput.value='';applyGalleryFilters()}
function openSearch(){
  clearTimeout(searchTimer);
  searchAction.classList.add('is-open');
  searchToggle.setAttribute('aria-expanded','true');
  searchToggle.setAttribute('aria-label','Close search');
  searchTimer=setTimeout(()=>{
    searchAction.classList.add('is-ready');
    advancedSearch.disabled=false;
    searchInput.focus({preventScroll:true});
  },reduceMotion.matches?0:540);
}
function hasAdvancedFilters(){return [...galleryAdvancedForm.elements].some(control=>control.name&&control.value&&((control.type==='checkbox'||control.type==='radio')?control.checked:(control.tagName==='SELECT'&&control.selectedIndex>0)))}
function closeSearch({restoreFocus=false,force=false}={}){
  if((hasAdvancedFilters()||searchInput.value.trim())&&!force)return;
  clearTimeout(searchTimer);
  searchInput.blur();
  advancedSearch.disabled=true;
  searchAction.classList.remove('is-ready','is-open');
  searchToggle.setAttribute('aria-expanded','false');
  searchToggle.setAttribute('aria-label','Open search');
  if(restoreFocus)searchTimer=setTimeout(()=>searchToggle.focus({preventScroll:true}),reduceMotion.matches?0:560);
}
searchToggle.addEventListener('click',()=>searchAction.classList.contains('is-open')?closeSearch({force:true}):openSearch());
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&searchAction.classList.contains('is-open')){event.preventDefault();closeSearch({restoreFocus:true})}});
document.addEventListener('pointerdown',event=>{if(searchAction.classList.contains('is-open')&&!searchAction.contains(event.target)&&!advancedPanel.contains(event.target)&&!galleryAppliedFilters.contains(event.target))closeSearch()});
function checkedFilterValues(name){return [...galleryAdvancedForm.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value)}
const galleryFilterLabels={status:'Status',category:'Category',type:'Type',business:'Business area',purpose:'Purpose',audience:'Audience',contributors:'Contributor',discipline:'Discipline',deliverable:'Deliverable'};
function renderGalleryFilterPills(){
  const entries=[];
  [...galleryAdvancedForm.elements].forEach(control=>{
    if(!control.name||!control.value)return;
    if((control.type==='checkbox'||control.type==='radio')&&!control.checked)return;
    if(control.tagName==='SELECT'&&control.selectedIndex===0)return;
    entries.push({name:control.name,value:control.value,label:galleryFilterLabels[control.name]||control.name});
  });
  const shown=entries.slice(0,2);
  const overflow=entries.length-shown.length;
  searchFilterSummary.innerHTML=shown.map(entry=>`<span class="search-filter-pill"><span>${entry.value}</span><button class="search-pill-remove" type="button" data-filter-name="${entry.name}" data-filter-value="${entry.value}" aria-label="Remove ${entry.label}: ${entry.value}">| ×</button></span>`).join('')+(overflow?`<span class="search-filter-overflow">+${overflow}</span>`:'');
  searchAction.classList.toggle('has-filters',entries.length>0);
  galleryAppliedFilters.innerHTML='';
  if(entries.length&&!searchAction.classList.contains('is-open'))openSearch();
}
function applyGalleryFilters(){
  const selected=name=>checkedFilterValues(name);
  const matchValue=(name,value)=>!selected(name).length||selected(name).includes(value);
  const purposes=selected('purpose');
  const disciplines=selected('discipline');
  const query=searchInput.value.trim().toLowerCase();
  try{query?localStorage.setItem(SEARCH_STORAGE_KEY,searchInput.value):localStorage.removeItem(SEARCH_STORAGE_KEY)}catch{}
  searchAction.classList.toggle('has-query',query.length>0);
  visible=projects.map((project,index)=>{
    const filters=projectFilters[index];
    const searchable=[project.title,project.type,project.status,project.business,project.contributors,project.audience,...project.tags].join(' ').toLowerCase();
    const match=(!query||searchable.includes(query))&&matchValue('status',project.status)&&matchValue('category',filters.category)&&matchValue('type',project.type)&&matchValue('business',project.business)&&matchValue('audience',project.audience)&&matchValue('contributors',project.contributors)&&matchValue('deliverable',filters.deliverable)&&(!purposes.length||purposes.every(value=>filters.purpose.includes(value)))&&(!disciplines.length||disciplines.every(value=>filters.discipline.includes(value)));
    return match?index:-1;
  }).filter(index=>index>=0);
  galleryResultCount.textContent=`${visible.length} project${visible.length===1?'':'s'}`;
  renderGalleryFilterPills();
  if(!visible.length){cards.forEach(card=>card.hidden=true);return}
  if(!visible.includes(active))active=visible[0];
  update(true);
}
searchInput.addEventListener('input',applyGalleryFilters);
advancedSearch.addEventListener('click',event=>{event.preventDefault();advancedPanel.showModal();requestAnimationFrame(()=>advancedPanel.classList.add('is-open'))});
function closeAdvancedPanel(){advancedPanel.classList.remove('is-open');setTimeout(()=>advancedPanel.close(),reduceMotion.matches?0:520)}
advancedPanel.querySelector('.filter-drawer-close').addEventListener('click',closeAdvancedPanel);
advancedPanel.addEventListener('click',event=>{if(event.target===advancedPanel)closeAdvancedPanel()});
advancedPanel.addEventListener('cancel',event=>{event.preventDefault();closeAdvancedPanel()});
galleryAdvancedForm.addEventListener('input',applyGalleryFilters);
galleryAdvancedForm.addEventListener('submit',event=>{event.preventDefault();applyGalleryFilters();closeAdvancedPanel()});
galleryAdvancedForm.addEventListener('reset',()=>setTimeout(applyGalleryFilters));
searchFilterSummary.addEventListener('click',event=>{
  const button=event.target.closest('.search-pill-remove');
  if(!button)return;
  const control=[...galleryAdvancedForm.elements].find(item=>item.name===button.dataset.filterName&&item.value===button.dataset.filterValue);
  if(!control)return;
  if(control.type==='checkbox'||control.type==='radio')control.checked=false;else control.value='';
  applyGalleryFilters();
});
searchClearAll.addEventListener('click',()=>{searchInput.value='';galleryAdvancedForm.reset();setTimeout(applyGalleryFilters)});
fields.button.addEventListener('click',event=>{if(fields.button.getAttribute('aria-disabled')==='true')event.preventDefault()});
const requested=Number(new URLSearchParams(location.search).get('project'));if(Number.isInteger(requested)&&requested>=0&&requested<projects.length)active=requested;
window.addEventListener('resize',()=>{if(!introRunning)update(false)},{passive:true});

function stackTransform(index){
  const layout=getCardLayout(index);
  const layer=layout.distance;
  const scale=.94-layout.magnitude*.006;
  return `translate(-50%,-50%) translate3d(${layer*1.35}px,${layer*-1.1}px,${(visible.length-layout.magnitude)*4}px) rotateZ(${layer*.32}deg) scale(${scale})`;
}

function establishDeck(){
  showcase.classList.add('is-intro');
  cards.forEach((card,index)=>{
    const layout=getCardLayout(index);
    card.hidden=false;
    card.classList.remove('is-flipped');
    card.setAttribute('aria-hidden','false');
    card.style.transition='none';
    card.style.transform=stackTransform(index);
    card.style.opacity='.96';
    card.style.filter='saturate(.88)';
    card.style.zIndex=String(layout.zIndex);
  });
}

async function runDeckIntro(){
  renderMeta(projects[active],false);
  if(hasSeenDeckIntro()||window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    introRunning=false;
    showcase.classList.remove('is-intro');
    update(false);
    return;
  }

  /* Mark the visit before motion begins so internal navigation never replays it. */
  rememberDeckIntro();
  establishDeck();

  /* Commit the physical deck before the first animation frame. */
  void deck.offsetWidth;
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));

  const motions=cards.map((card,index)=>{
    const layout=getCardLayout(index);
    const direction=Math.sign(layout.distance);
    const startScale=.94-layout.magnitude*.006;
    const curveOffset=.48+(index%3)*.012;
    const curveX=layout.x*.43+direction*(layout.magnitude?4:0);
    const curveY=layout.y*.32-layout.magnitude*2.2+(index%2?1.5:-1.5);
    return card.animate([
      {offset:0,transform:stackTransform(index),opacity:.96,filter:'saturate(.88)',easing:'cubic-bezier(.42,0,.3,1)'},
      {offset:curveOffset,transform:`translate(-50%,-50%) translate3d(${curveX}px,${curveY}px,${layout.z*.43}px) rotateZ(${direction*.7}deg) scale(${startScale+(layout.scale-startScale)*.43})`,opacity:.96+(layout.opacity-.96)*.38,filter:`saturate(${.88+(layout.saturation-.88)*.38})`,easing:'cubic-bezier(.28,.58,.22,1)'},
      {offset:1,transform:`translate(-50%,-50%) translate3d(${layout.x}px,${layout.y}px,${layout.z}px) rotateZ(${layout.rotation}deg) scale(${layout.scale})`,opacity:layout.opacity,filter:`saturate(${layout.saturation})`}
    ],{duration:1820+layout.magnitude*18,delay:90,fill:'both',easing:'linear'});
  });

  await Promise.all(motions.map(motion=>motion.finished.catch(()=>{})));
  cards.forEach((card,index)=>{
    const layout=getCardLayout(index);
    card.style.transform=`translate(-50%,-50%) translate3d(${layout.x}px,${layout.y}px,${layout.z}px) rotateZ(${layout.rotation}deg) scale(${layout.scale})`;
    card.style.opacity=String(layout.opacity);
    card.style.filter=`saturate(${layout.saturation})`;
    card.dataset.active=String(layout.distance===0);
    card.setAttribute('aria-hidden','false');
  });
  motions.forEach(motion=>motion.cancel());
  void deck.offsetWidth;
  cards.forEach(card=>card.style.transition='');
  showcase.classList.remove('is-intro');
  introRunning=false;
}

async function initializeGallery(){
  await runDeckIntro();
  try{
    const savedQuery=localStorage.getItem(SEARCH_STORAGE_KEY)||'';
    if(savedQuery){searchInput.value=savedQuery;applyGalleryFilters();openSearch()}
  }catch{}
}
initializeGallery();
