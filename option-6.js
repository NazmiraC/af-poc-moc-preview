const projects=[
  {title:'AF Landscape',status:'Current',category:'poc',categoryLabel:'POC',year:'2026',image:'assets/af-engage.png',description:'An interactive 3D environment for exploring teams, systems and projects spatially.',href:'landscape.html',accent:'#0c6970'},
  {title:'Pre to Post',status:'Current',category:'design',categoryLabel:'Design',year:'2026',image:'assets/pre-post.png',description:'A retirement projection experience that turns planning into a clear visual journey.',href:'#',accent:'#ff642d'},
  {title:'Launch Lab',status:'Current',category:'poc',categoryLabel:'POC',year:'2026',image:'assets/hero-project-04.png',description:'A collaborative environment for developing, assembling and testing ideas.',href:'#',accent:'#6a4b9c'},
  {title:'Global Operations',status:'Concept',category:'design',categoryLabel:'Design',year:'2026',image:'assets/hero-project-02.png',description:'A connected view of teams, systems and activity across regions.',href:'#',accent:'#d2469a'},
  {title:'System Map',status:'Complete',category:'design',categoryLabel:'Design',year:'2025',image:'assets/hero-project-01.png',description:'A hand-drawn map that makes a complex data landscape easier to navigate.',href:'#',accent:'#c28a24'},
  {title:'Operations Study',status:'Concept',category:'poc',categoryLabel:'POC',year:'2025',image:'assets/hero-project-03.png',description:'An early monochrome study for an immersive operations workspace.',href:'#',accent:'#87949a'},
  {title:'Project Room',status:'Complete',category:'design',categoryLabel:'Design',year:'2025',image:'assets/hero-project-05.png',description:'A focused workspace bringing project teams, progress and decisions together.',href:'#',accent:'#118c8b'}
];

const deck=document.querySelector('#cardDeck');
const indexGrid=document.querySelector('#indexGrid');
const archive=document.querySelector('#archive');
const fields={title:document.querySelector('#projectTitle'),status:document.querySelector('#projectStatus'),category:document.querySelector('#projectCategory'),date:document.querySelector('#projectDate'),description:document.querySelector('#projectDescription')};
let visible=[...projects.keys()];
let activePosition=0;
let dragStart=null;
let changeTimer=null;

function cardMarkup(project,index){
  return `<article class="project-card" data-project="${index}" tabindex="0" role="group" aria-label="${project.title}">
    <div class="card-inner">
      <div class="card-face card-front"><div class="card-image"><img src="${project.image}" alt="${project.title}"></div></div>
    </div>
  </article>`;
}

deck.innerHTML=projects.map(cardMarkup).join('');
indexGrid.innerHTML=projects.map((project,index)=>`<button class="index-item" type="button" data-index="${index}"><img src="${project.image}" alt=""><span><b>${String(index+1).padStart(2,'0')} ${project.title}</b><span>${project.categoryLabel} · ${project.year}</span></span></button>`).join('');
const cards=[...document.querySelectorAll('.project-card')];

function wrappedDistance(position,active,length){
  let distance=position-active;
  if(distance>length/2)distance-=length;
  if(distance<-length/2)distance+=length;
  return distance;
}

function update(animateMeta=false){
  const activeProjectIndex=visible[activePosition];
  const project=projects[activeProjectIndex];
  archive.style.setProperty('--active-accent',project.accent);

  const updateMeta=()=>{
    fields.title.textContent=project.title;
    fields.status.textContent=project.status;
    fields.category.textContent=project.categoryLabel;
    fields.date.textContent=project.year;
    fields.description.textContent=project.description;
  };
  clearTimeout(changeTimer);
  if(animateMeta){
    archive.classList.add('is-changing');
    changeTimer=setTimeout(()=>{updateMeta();archive.classList.remove('is-changing')},150);
  }else updateMeta();

  cards.forEach((card,projectIndex)=>{
    const position=visible.indexOf(projectIndex);
    if(position<0){card.hidden=true;return}
    card.hidden=false;
    card.classList.remove('is-flipped');
    const distance=wrappedDistance(position,activePosition,visible.length);
    const magnitude=Math.abs(distance);
    const x=distance*clamp(154,210,window.innerWidth*.135);
    const y=magnitude*15;
    const z=150-magnitude*145;
    const rotate=distance===0?0:-distance*7;
    const scale=Math.max(.68,1-magnitude*.085);
    const opacity=Math.max(.18,1-magnitude*.2);
    card.style.transform=`translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${rotate}deg) scale(${scale})`;
    card.style.opacity=opacity;
    card.style.filter=`saturate(${Math.max(.45,1-magnitude*.13)})`;
    card.style.zIndex=String(20-magnitude);
    card.dataset.active=String(distance===0);
    card.setAttribute('aria-hidden',String(magnitude>3));
  });
}

function clamp(min,max,value){return Math.min(max,Math.max(min,value))}
function step(direction){activePosition=(activePosition+direction+visible.length)%visible.length;update(true)}
function selectProject(projectIndex){const position=visible.indexOf(projectIndex);if(position<0||position===activePosition)return;activePosition=position;update(true)}
function openActive(){const project=projects[visible[activePosition]];if(project.href&&project.href!=='#')location.href=project.href}

cards.forEach(card=>{
  card.addEventListener('click',()=>{const projectIndex=Number(card.dataset.project);if(projectIndex===visible[activePosition])openActive();else selectProject(projectIndex)});
  card.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();const projectIndex=Number(card.dataset.project);if(projectIndex===visible[activePosition])openActive();else selectProject(projectIndex)}});
});
document.addEventListener('keydown',event=>{
  if(document.querySelector('#indexPanel').classList.contains('is-open')&&event.key==='Escape'){toggleIndex(false);return}
  if(event.key==='ArrowRight')step(1);
  if(event.key==='ArrowLeft')step(-1);
  if(event.key==='Enter'&&event.target===document.body)openActive();
});
deck.addEventListener('pointerdown',event=>{dragStart=event.clientX;deck.setPointerCapture(event.pointerId)});
deck.addEventListener('pointerup',event=>{if(dragStart===null)return;const delta=event.clientX-dragStart;if(Math.abs(delta)>40)step(delta<0?1:-1);dragStart=null});
deck.addEventListener('pointercancel',()=>dragStart=null);
document.querySelector('#previousProject').addEventListener('click',()=>step(-1));
document.querySelector('#nextProject').addEventListener('click',()=>step(1));

function toggleIndex(open){const panel=document.querySelector('#indexPanel');panel.classList.toggle('is-open',open);panel.setAttribute('aria-hidden',String(!open));document.querySelector('#openIndex span').textContent=open?'⌄':'⌃'}
document.querySelector('#openIndex').addEventListener('click',()=>toggleIndex(!document.querySelector('#indexPanel').classList.contains('is-open')));
document.querySelector('#closeIndex').addEventListener('click',()=>toggleIndex(false));
document.querySelectorAll('.index-item').forEach(button=>button.addEventListener('click',()=>{const index=Number(button.dataset.index);if(!visible.includes(index)){visible=[...projects.keys()];document.querySelectorAll('.dock-filter').forEach(item=>item.classList.toggle('is-active',item.dataset.filter==='all'))}selectProject(index);toggleIndex(false)}));
document.querySelectorAll('.dock-filter').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.dock-filter').forEach(item=>item.classList.toggle('is-active',item===button));
  visible=button.dataset.filter==='all'?[...projects.keys()]:projects.map((project,index)=>project.category===button.dataset.filter?index:-1).filter(index=>index>=0);
  activePosition=0;update(true);
}));
window.addEventListener('resize',update,{passive:true});
update();
