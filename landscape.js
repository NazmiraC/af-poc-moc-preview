document.querySelectorAll('.fold').forEach(button => {
  button.addEventListener('click', () => {
    const chapter = button.closest('.chapter');
    const willOpen = chapter.classList.contains('collapsed');

    document.querySelectorAll('.chapter').forEach(section => {
      section.classList.add('collapsed');
      const sectionButton = section.querySelector('.fold');
      if (sectionButton) sectionButton.textContent = '⌄';
    });

    if (willOpen) {
      chapter.classList.remove('collapsed');
      button.textContent = '⌃';
    }
  });
});

document.querySelectorAll('.chapter-head').forEach(header => {
  header.addEventListener('click', event => {
    if (event.target.closest('.fold')) return;
    header.querySelector('.fold')?.click();
  });
});

const deck = document.querySelector('.hero-stack');
const deckCards = [...document.querySelectorAll('.deck-card')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let deckAnimating = false;

function focusDeckCard(target) {
  const current = deck?.querySelector('.hero-card');
  if (!deck || !current || !target || target === current || deckAnimating) return;
  deckAnimating = true;

  const remaining = deckCards.filter(card => card !== current && card !== target);
  const before = new Map(deckCards.map(card => [card, card.getBoundingClientRect()]));

  target.className = 'deck-card hero-card';
  [...remaining, current].forEach((card, index) => {
    card.className = `deck-card peek peek-${String.fromCharCode(97 + index)}`;
  });

  if (reducedMotion || !target.animate) {
    deckAnimating = false;
    return;
  }

  const panelRect = document.querySelector('.project-intro').getBoundingClientRect();
  const animations = deckCards.map(card => {
    const after = card.getBoundingClientRect();
    const first = before.get(card);
    const dx = first.left - after.left;
    const dy = first.top - after.top;
    const sx = first.width / after.width;
    const sy = first.height / after.height;

    if (card === current) {
      const behindPanel = panelRect.left + panelRect.width * .55 - after.left - after.width * .5;
      return card.animate([
        {transform:`translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`,opacity:1},
        {transform:`translate(${behindPanel}px, ${dy * .35}px) scale(.88)`,opacity:.18,offset:.72},
        {transform:'translate(0, 0) scale(1)',opacity:0}
      ],{duration:620,easing:'cubic-bezier(.22,1,.36,1)'});
    }

    return card.animate([
      {transform:`translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`},
      {transform:'translate(0, 0) scale(1)'}
    ],{duration:620,easing:'cubic-bezier(.22,1,.36,1)'});
  });

  Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
    current.animate([{opacity:0},{opacity:1}],{duration:220,easing:'ease-out'});
    deckAnimating = false;
  });
}

deckCards.forEach(card => {
  card.addEventListener('click', event => {
    if (event.target.closest('button') && card.classList.contains('hero-card')) return;
    focusDeckCard(card);
  });
  card.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && !card.classList.contains('hero-card')) {
      event.preventDefault();
      focusDeckCard(card);
    }
  });
});

document.querySelector('.hero-arrow-next')?.addEventListener('click', () => {
  const currentIndex = deckCards.indexOf(deck.querySelector('.hero-card'));
  focusDeckCard(deckCards[(currentIndex + 1) % deckCards.length]);
});
document.querySelector('.hero-arrow-prev')?.addEventListener('click', () => {
  const currentIndex = deckCards.indexOf(deck.querySelector('.hero-card'));
  focusDeckCard(deckCards[(currentIndex - 1 + deckCards.length) % deckCards.length]);
});
