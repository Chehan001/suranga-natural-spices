import { icon } from './icons.js';
import { $ } from '../utils/dom.js';
import navbarImage from '../assest/navbar_image.png';

const sidebar = $('#sidebar');
const backdrop = $('#nav-backdrop');
const menuButton = $('#menu-btn');
const closeButton = $('#close-nav-btn');
const mobileNavigation = matchMedia('(max-width: 1023px)');
let open = false;
let previousFocus;
let previousBodyOverflow = '';
let previousDocumentOverflow = '';
let scrollLocked = false;

$('#sidebar-landscape-image').src = navbarImage;
closeButton.innerHTML = icon('close', 20);

function updateNavigationState() {
  sidebar.classList.toggle('is-open', open);
  sidebar.inert = mobileNavigation.matches && !open;
  sidebar.setAttribute('aria-hidden', String(mobileNavigation.matches && !open));
  sidebar.setAttribute('role', mobileNavigation.matches && open ? 'dialog' : 'complementary');
  if (open && mobileNavigation.matches) sidebar.setAttribute('aria-modal', 'true');
  else sidebar.removeAttribute('aria-modal');
  backdrop.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');

  if (open && mobileNavigation.matches && !scrollLocked) {
    previousBodyOverflow = document.body.style.overflow;
    previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    scrollLocked = true;
  } else if ((!open || !mobileNavigation.matches) && scrollLocked) {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousDocumentOverflow;
    scrollLocked = false;
  }
}

function focusableItems() {
  return [...sidebar.querySelectorAll('a[href], button:not([disabled])')]
    .filter((element) => !element.hidden && !element.closest('[inert]'));
}

export const renderSidebar = (routes, active) => {
  $('#nav').innerHTML = routes
    .map(
      (r) =>
        `<a href="#${r.id}" class="nav-link ${r.id === active ? 'is-active' : ''}" ${r.id === active ? 'aria-current="page"' : ''}>${icon(r.icon)}<span>${r.title}</span></a>`
    )
    .join('');
};

export function toggleNav() {
  if (!mobileNavigation.matches) return;
  if (open) {
    closeNav();
    return;
  }

  previousFocus = document.activeElement;
  open = true;
  updateNavigationState();
  closeButton.focus();
}

export function closeNav() {
  if (!open) return;
  open = false;
  updateNavigationState();
  if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
  else menuButton.focus();
  previousFocus = undefined;
}

function handleKeydown(event) {
  if (!open || !mobileNavigation.matches) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    closeNav();
    return;
  }

  if (event.key !== 'Tab') return;
  const items = focusableItems();
  const first = items[0];
  const last = items[items.length - 1];
  if (!first || !last) {
    event.preventDefault();
    closeButton.focus();
  } else if (event.shiftKey && (document.activeElement === first || !sidebar.contains(document.activeElement))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (document.activeElement === last || !sidebar.contains(document.activeElement))) {
    event.preventDefault();
    first.focus();
  }
}

function handleBreakpointChange() {
  if (!mobileNavigation.matches && open) closeNav();
  else updateNavigationState();
}

document.addEventListener('keydown', handleKeydown);
mobileNavigation.addEventListener('change', handleBreakpointChange);
updateNavigationState();
