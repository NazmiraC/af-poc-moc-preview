const projects = [
  {name:'AF Landscape',status:'Current',category:'Project',type:'POC',year:'2026',image:'assets/af-engage.png',area:'DS&I',purpose:['Innovation','Ideation','Communication'],audience:'Internal',contributor:'DS&I Team',discipline:['Concept development','Design','Technical architecture','Development'],deliverable:'3D model'},
  {name:'Pre to Post',status:'Current',category:'Design',type:'Design',year:'2026',image:'assets/pre-post.png',area:'Retirement',purpose:['Enhancement','Communication'],audience:'Clients',contributor:'Product Team',discipline:['UX','Design thinking','Research'],deliverable:'Calculator'},
  {name:'Launch Lab',status:'Current',category:'Project',type:'POC',year:'2026',image:'assets/hero-project-04.png',area:'DS&I',purpose:['Innovation','New features'],audience:'Internal',contributor:'Innovation Team',discipline:['Concept development','Testing','Development'],deliverable:'App'},
  {name:'Global Operations',status:'Proposed',category:'Design',type:'Design',year:'2026',image:'assets/hero-project-02.png',area:'Operations',purpose:['Strategy','Communication'],audience:'Internal',contributor:'Operations Team',discipline:['Research','Analysis'],deliverable:'Dashboard'},
  {name:'System Map',status:'Completed',category:'Design',type:'Design',year:'2025',image:'assets/hero-project-01.png',area:'DS&I',purpose:['Ideation','Strategy'],audience:'Internal',contributor:'DS&I Team',discipline:['UX','Research'],deliverable:'Customer journey map'},
  {name:'Operations Study',status:'Proposed',category:'Support',type:'POC',year:'2025',image:'assets/hero-project-03.png',area:'Operations',purpose:['Enhancement'],audience:'Internal',contributor:'Design Team',discipline:['Research','Analysis'],deliverable:'Report'},
  {name:'Project Room',status:'Completed',category:'Project',type:'Design',year:'2025',image:'assets/hero-project-05.png',area:'DS&I',purpose:['Innovation','Communication'],audience:'Internal',contributor:'Delivery Team',discipline:['Deployment','Testing'],deliverable:'Presentation'}
];

const projectGrid = document.querySelector('#projectGrid');
const textSearch = document.querySelector('#indexSearch');
const advancedDialog = document.querySelector('#advancedSearch');
const advancedForm = document.querySelector('#advancedSearchForm');
const resultCount = document.querySelector('#advancedResultCount');
const indexAppliedFilters = document.querySelector('#indexAppliedFilters');
const indexSearchAction = document.querySelector('#indexSearchAction');
const indexSearchToggle = document.querySelector('#indexSearchToggle');
const indexAdvancedButton = document.querySelector('#advancedSearchButton');
const indexSearchClear = document.querySelector('#indexSearchClear');
const SEARCH_STORAGE_KEY = 'af-project-search-query';
const INDEX_STATE_KEY = 'af-project-index-state-v2';
let indexSearchTimer = null;
let restoringIndexState = false;
const indexReduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function buildIndexPillFilters(form) {
  form.querySelectorAll('.filter-field').forEach(field => {
    const select = field.querySelector('select');
    const details = field.matches('details') ? field : null;
    const name = select?.name || details?.querySelector('input')?.name;
    if (!name) return;
    const title = (select ? field.querySelector(':scope > span') : details.querySelector('summary span'))?.textContent.replace('Multi-select','').trim() || name;
    const choices = select
      ? [...select.options].filter(option => option.value).map(option => ({value:option.value,label:option.textContent}))
      : [...details.querySelectorAll('input')].map(input => ({value:input.value,label:input.closest('label').textContent.trim()}));
    const group = document.createElement('fieldset');
    group.className = 'filter-pill-group';
    group.innerHTML = `<legend>${title}</legend><div class="filter-pill-options">${choices.map(choice => `<label><input type="checkbox" name="${name}" value="${choice.value.replace(/"/g,'&quot;')}"><span>${choice.label}</span></label>`).join('')}</div>`;
    field.replaceWith(group);
  });
}
buildIndexPillFilters(advancedForm);

function captureIndexState() {
  const filters = {};
  [...advancedForm.elements].forEach(control => {
    if (!control.name) return;
    if (control.type === 'checkbox' || control.type === 'radio') {
      if (!control.checked) return;
      (filters[control.name] ||= []).push(control.value);
      return;
    }
    if (control.value) filters[control.name] = control.value;
  });
  return {query:textSearch.value,filters,searchOpen:indexSearchAction.classList.contains('is-open'),scrollY:window.scrollY};
}

function saveIndexState() {
  if (restoringIndexState) return;
  try { sessionStorage.setItem(INDEX_STATE_KEY,JSON.stringify(captureIndexState())); } catch {}
}

function restoreIndexState() {
  let state;
  try { state = JSON.parse(sessionStorage.getItem(INDEX_STATE_KEY) || 'null'); } catch { state = null; }
  if (!state) return false;
  restoringIndexState = true;
  textSearch.value = state.query || '';
  const filters = state.filters || {};
  [...advancedForm.elements].forEach(control => {
    if (!control.name) return;
    const saved = filters[control.name];
    if (control.type === 'checkbox' || control.type === 'radio') control.checked = Array.isArray(saved) && saved.includes(control.value);
    else control.value = typeof saved === 'string' ? saved : '';
  });
  restoringIndexState = false;
  applyFilters();
  if (state.searchOpen || textSearch.value.trim() || hasIndexFilters()) openIndexSearch();
  requestAnimationFrame(() => window.scrollTo({top:Number(state.scrollY) || 0,left:0,behavior:'instant'}));
  return true;
}

function renderProjects(items = projects) {
  projectGrid.innerHTML = items.map(project => {
    const index = projects.indexOf(project);
    return `<a class="project-item" href="option-7.html?v=20261110-static-pill-panels&project=${index}"><img src="${project.image}" alt="${project.name}"><div class="project-copy"><h2>${project.name}</h2><p>${project.type} · ${project.year}</p><span class="status status-${project.status.toLowerCase()}">${project.status}</span></div></a>`;
  }).join('');
  projectGrid.classList.toggle('is-empty', items.length === 0);
  if (!items.length) projectGrid.innerHTML = '<p class="empty-results">No projects match these filters.</p>';
  resultCount.textContent = `${items.length} project${items.length === 1 ? '' : 's'}`;
}

function selectedValues(name) {
  return [...advancedForm.querySelectorAll(`input[name="${name}"]:checked`)].map(input => input.value);
}

const indexFilterLabels = {status:'Status',category:'Category',type:'Type',area:'Business area',purpose:'Purpose',audience:'Audience',contributor:'Contributor',discipline:'Discipline',deliverable:'Deliverable'};
function renderIndexFilterPills() {
  const entries = [];
  [...advancedForm.elements].forEach(control => {
    if (!control.name || !control.value) return;
    if ((control.type === 'checkbox' || control.type === 'radio') && !control.checked) return;
    if (control.tagName === 'SELECT' && control.selectedIndex === 0) return;
    entries.push({name:control.name,value:control.value,label:indexFilterLabels[control.name] || control.name});
  });
  indexAppliedFilters.innerHTML = entries.map(entry => `<span class="index-filter-pill"><small>${entry.label}</small>${entry.value}<button class="index-filter-remove" type="button" data-filter-name="${entry.name}" data-filter-value="${entry.value}" aria-label="Remove ${entry.label}: ${entry.value}">| ×</button></span>`).join('');
  if (entries.length && !indexSearchAction.classList.contains('is-open')) openIndexSearch();
}

function hasIndexFilters() {
  return [...advancedForm.elements].some(control => control.name && control.value && ((control.type === 'checkbox' || control.type === 'radio') ? control.checked : (control.tagName === 'SELECT' && control.selectedIndex > 0)));
}
function openIndexSearch() {
  clearTimeout(indexSearchTimer);
  indexSearchAction.classList.add('is-open');
  indexSearchToggle.setAttribute('aria-expanded','true');
  indexSearchToggle.setAttribute('aria-label','Close search');
  indexSearchTimer = setTimeout(() => {
    indexSearchAction.classList.add('is-ready');
    indexAdvancedButton.disabled = false;
    textSearch.focus({preventScroll:true});
  }, 540);
}
function closeIndexSearch() {
  if (hasIndexFilters() || textSearch.value.trim()) return;
  clearTimeout(indexSearchTimer);
  textSearch.blur();
  indexAdvancedButton.disabled = true;
  indexSearchAction.classList.remove('is-ready','is-open');
  indexSearchToggle.setAttribute('aria-expanded','false');
  indexSearchToggle.setAttribute('aria-label','Open search');
}

function applyFilters() {
  const matches = (name,value) => {
    const values = selectedValues(name);
    return !values.length || values.includes(value);
  };
  const purposes = selectedValues('purpose');
  const disciplines = selectedValues('discipline');
  const query = textSearch.value.trim().toLowerCase();
  try { query ? localStorage.setItem(SEARCH_STORAGE_KEY,textSearch.value) : localStorage.removeItem(SEARCH_STORAGE_KEY); } catch {}
  indexSearchAction.classList.toggle('has-content', query.length > 0 || hasIndexFilters());
  const filtered = projects.filter(project => {
    const searchable = Object.values(project).flat().join(' ').toLowerCase();
    return (!query || searchable.includes(query)) &&
      matches('status',project.status) &&
      matches('category',project.category) &&
      matches('type',project.type) &&
      matches('area',project.area) &&
      matches('audience',project.audience) &&
      matches('contributor',project.contributor) &&
      matches('deliverable',project.deliverable) &&
      (!purposes.length || purposes.every(value => project.purpose.includes(value))) &&
      (!disciplines.length || disciplines.every(value => project.discipline.includes(value)));
  });
  renderProjects(filtered);
  renderIndexFilterPills();
  saveIndexState();
}

indexAdvancedButton.addEventListener('click', event => {
  event.preventDefault();
  advancedDialog.showModal();
  requestAnimationFrame(() => advancedDialog.classList.add('is-open'));
});
indexSearchToggle.addEventListener('click', openIndexSearch);
document.addEventListener('keydown', event => { if (event.key === 'Escape' && indexSearchAction.classList.contains('is-open') && !advancedDialog.open) closeIndexSearch(); });
document.addEventListener('pointerdown', event => { if (indexSearchAction.classList.contains('is-open') && !indexSearchAction.contains(event.target) && !advancedDialog.contains(event.target) && !indexAppliedFilters.contains(event.target)) closeIndexSearch(); });

function closeAdvanced() {
  advancedDialog.classList.remove('is-open');
  window.setTimeout(() => advancedDialog.close(), indexReduceMotion.matches ? 0 : 520);
}

advancedDialog.querySelector('.advanced-close').addEventListener('click', closeAdvanced);
advancedDialog.addEventListener('click', event => { if (event.target === advancedDialog) closeAdvanced(); });
advancedDialog.addEventListener('cancel', event => { event.preventDefault(); closeAdvanced(); });
advancedForm.addEventListener('input', applyFilters);
advancedForm.addEventListener('submit', event => { event.preventDefault(); applyFilters(); closeAdvanced(); });
advancedForm.addEventListener('reset', () => window.setTimeout(applyFilters));
indexSearchClear.addEventListener('click', () => { textSearch.value = ''; advancedForm.reset(); window.setTimeout(applyFilters); });
indexAppliedFilters.addEventListener('click', event => {
  const button = event.target.closest('.index-filter-remove');
  if (!button) return;
  const control = [...advancedForm.elements].find(item => item.name === button.dataset.filterName && item.value === button.dataset.filterValue);
  if (!control) return;
  if (control.type === 'checkbox' || control.type === 'radio') control.checked = false;
  else control.value = '';
  applyFilters();
});
textSearch.addEventListener('input', applyFilters);
window.addEventListener('pagehide',saveIndexState);
window.addEventListener('scroll',saveIndexState,{passive:true});
if (!restoreIndexState()) {
  renderProjects();
  try { const savedQuery = localStorage.getItem(SEARCH_STORAGE_KEY) || ''; if (savedQuery) { textSearch.value = savedQuery; applyFilters(); openIndexSearch(); } } catch {}
}
