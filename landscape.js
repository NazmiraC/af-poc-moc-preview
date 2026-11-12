function restoreViewportAnchor(anchor, topBefore) {
  requestAnimationFrame(() => {
    const topAfter = anchor.getBoundingClientRect().top;
    const offset = topAfter - topBefore;

    if (Math.abs(offset) < 0.5) return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollBy(0, offset);
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

document.querySelectorAll('.fold').forEach(button => {
  button.addEventListener('click', () => {
    const chapter = button.closest('.chapter');
    const chapterHeader = chapter.querySelector('.chapter-head');
    const headerTop = chapterHeader.getBoundingClientRect().top;
    const willOpen = chapter.classList.contains('collapsed');

    document.querySelectorAll('.chapter').forEach(section => {
      section.classList.add('collapsed');
      const sectionButton = section.querySelector('.fold');
      if (sectionButton) {
        sectionButton.textContent = '⌄';
        sectionButton.setAttribute('aria-expanded', 'false');
      }
    });

    if (willOpen) {
      chapter.classList.remove('collapsed');
      button.textContent = '⌃';
      button.setAttribute('aria-expanded', 'true');
    }

    restoreViewportAnchor(chapterHeader, headerTop);
  });
});

document.querySelectorAll('.chapter-head').forEach(header => {
  header.addEventListener('click', event => {
    if (event.target.closest('.fold')) return;
    header.querySelector('.fold')?.click();
  });
});

document.querySelectorAll('.phase-list details > summary').forEach(summary => {
  summary.addEventListener('click', () => {
    const summaryTop = summary.getBoundingClientRect().top;
    restoreViewportAnchor(summary, summaryTop);
  });
});

const deck = document.querySelector('.hero-stack');
const deckCards = [...document.querySelectorAll('.deck-card')];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let deckAnimating = false;
const deckMotion = {
  duration: 560,
  easing: 'cubic-bezier(.22,1,.36,1)'
};

function deckTransform(dx, dy, sx, sy, remainder = 1) {
  return `translate(${dx * remainder}px, ${dy * remainder}px) scale(${1 + (sx - 1) * remainder}, ${1 + (sy - 1) * remainder})`;
}

function deckRole(card) {
  if (card.classList.contains('hero-card')) return 'hero';
  if (card.classList.contains('peek-behind')) return 'behind';
  for (const role of ['a', 'b', 'c']) {
    if (card.classList.contains(`peek-${role}`)) return role;
  }
  return '';
}

function assignMovingRightSlots(cards, previousRoles) {
  const slotOrders = [['a', 'b'], ['b', 'a']];
  const positions = {behind:-1, hero:0, a:1, b:2, c:3};
  const score = slots => cards.reduce((total, card, index) => {
    const previous = previousRoles.get(card);
    const next = slots[index];
    const stayedStill = previous === next ? 100 : 0;
    return total + stayedStill + Math.abs((positions[next] ?? 0) - (positions[previous] ?? 0));
  }, 0);
  const slots = slotOrders.sort((first, second) => score(first) - score(second))[0];
  cards.forEach((card, index) => {
    card.className = `deck-card peek peek-${slots[index]}`;
  });
}

function focusDeckCard(target) {
  const current = deck?.querySelector('.hero-card');
  if (!deck || !current || !target || target === current || deckAnimating) return;
  deckAnimating = true;

  const remaining = deckCards.filter(card => card !== current && card !== target);
  const previousRoles = new Map(deckCards.map(card => [card, deckRole(card)]));
  const before = new Map(deckCards.map(card => {
    const rect = card.getBoundingClientRect();
    return [card, {rect, opacity:Number.parseFloat(getComputedStyle(card).opacity) || 1}];
  }));

  target.className = 'deck-card hero-card';
  assignMovingRightSlots(remaining, previousRoles);
  current.className = 'deck-card peek peek-behind';

  if (reducedMotion || !target.animate) {
    deckAnimating = false;
    return;
  }

  const animations = deckCards.map(card => {
    const after = card.getBoundingClientRect();
    const first = before.get(card);
    const dx = first.rect.left - after.left;
    const dy = first.rect.top - after.top;
    const sx = first.rect.width / after.width;
    const sy = first.rect.height / after.height;
    const finalOpacity = Number.parseFloat(getComputedStyle(card).opacity) || 1;
    const isIncoming = card === target;
    const isOutgoing = card === current;
    const settleOffset = isIncoming ? .66 : isOutgoing ? .72 : .76;
    const remainder = isIncoming ? .045 : isOutgoing ? .08 : .065;
    const settleOpacity = isOutgoing
      ? Math.max(finalOpacity, .42)
      : finalOpacity;

    card.style.willChange = 'transform, opacity';

    return card.animate([
      {
        transform:deckTransform(dx, dy, sx, sy),
        transformOrigin:'0 0',
        opacity:first.opacity,
        offset:0,
        easing:deckMotion.easing
      },
      {
        transform:deckTransform(dx, dy, sx, sy, remainder),
        transformOrigin:'0 0',
        opacity:settleOpacity,
        offset:settleOffset,
        easing:'cubic-bezier(.2,.8,.2,1)'
      },
      {
        transform:'translate(0, 0) scale(1)',
        transformOrigin:'0 0',
        opacity:finalOpacity,
        offset:1
      }
    ],{duration:deckMotion.duration,fill:'both'});
  });

  Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
    animations.forEach((animation, index) => {
      animation.cancel();
      deckCards[index].style.willChange = '';
    });
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
