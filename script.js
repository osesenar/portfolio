/* =================================================================
   PHOTO LIST
   Files live in /images, named 01.jpg, 02.jpg, etc. Drop in as many
   as you like and adjust the length below to match.
================================================================= */
function getImageList() {
  return Array.from({ length: 15 }, (_, i) =>
    `images/${String(i + 1).padStart(2, "0")}.jpg`
  );
}

const photos = getImageList();

/* =================================================================
   NAME — letter-spacing stretched to fill the full available width
================================================================= */
const nameHeading = document.getElementById("nameHeading");

function fitNameWidth() {
  const target = nameHeading.parentElement.clientWidth;
  nameHeading.style.letterSpacing = "0px";
  const natural = nameHeading.getBoundingClientRect().width;
  const text = nameHeading.textContent;
  const gaps = text.length - 1;
  if (gaps <= 0) return;
  const extra = (target - natural) / gaps;
  // never let letters overlap, even on very narrow screens
  nameHeading.style.letterSpacing = `${Math.max(extra, 0)}px`;
}

/* =================================================================
   CONTACT
   Split into parts and joined only at runtime, so a bot scraping the
   raw HTML/JS source doesn't find a ready-to-use "you@domain.com"
   string sitting in plain text. This won't stop every scraper, but it
   filters out the simple ones that just regex the page source.
   Replace the two parts below with your own address.
================================================================= */
const EMAIL_USER = "osesenar";
const EMAIL_DOMAIN = "gmail.com";

function initContactLink() {
  const link = document.getElementById("contactLink");
  const address = `${EMAIL_USER}@${EMAIL_DOMAIN}`;
  link.href = `mailto:${address}`;
  link.setAttribute("aria-label", `Email ${address}`);
}

/* =================================================================
   SHARED STATE
================================================================= */
const mask = document.getElementById("mask");
const stageImg = document.getElementById("stageImg");
const curtainA = document.getElementById("curtainA");
const curtainB = document.getElementById("curtainB");
const zonePrev = document.getElementById("zonePrev");
const zoneNext = document.getElementById("zoneNext");
const zoneGrid = document.getElementById("zoneGrid");
const focusView = document.getElementById("focusView");
const gridView = document.getElementById("gridView");
const gridTrack = document.getElementById("gridTrack");

const N = photos.length;
const HOLD_MS = 4000;     // how long each photo stays before auto-advancing
const CURTAIN_MS = 380;   // duration of each curtain half (close, then open)
const FLY_MS = 520;       // duration of the focus <-> grid shared-element animation
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";

let currentIndex = Math.floor(Math.random() * N);
let isAnimating = false;
let autoplayTimer = null;

function randomAxis() {
  return Math.random() < 0.5 ? "sides" : "vertical";
}

function setAxisClasses(a, b, axis) {
  a.classList.remove("sides", "vertical");
  b.classList.remove("sides", "vertical");
  a.classList.add(axis);
  b.classList.add(axis);
}

function setClosedInstant(a, b, axis) {
  a.style.transition = "none";
  b.style.transition = "none";
  if (axis === "sides") {
    a.style.width = "50%"; a.style.height = "";
    b.style.width = "50%"; b.style.height = "";
  } else {
    a.style.height = "50%"; a.style.width = "";
    b.style.height = "50%"; b.style.width = "";
  }
  void a.offsetWidth;
}

function setOpenInstant(a, b, axis) {
  a.style.transition = "none";
  b.style.transition = "none";
  if (axis === "sides") {
    a.style.width = "0"; a.style.height = "";
    b.style.width = "0"; b.style.height = "";
  } else {
    a.style.height = "0"; a.style.width = "";
    b.style.height = "0"; b.style.width = "";
  }
  void a.offsetWidth;
}

function animateClosed(a, b, axis, ms) {
  const t = axis === "sides" ? `width ${ms}ms ${EASE}` : `height ${ms}ms ${EASE}`;
  a.style.transition = t;
  b.style.transition = t;
  if (axis === "sides") { a.style.width = "50%"; b.style.width = "50%"; }
  else { a.style.height = "50%"; b.style.height = "50%"; }
}

function animateOpen(a, b, axis, ms) {
  const t = axis === "sides" ? `width ${ms}ms ${EASE}` : `height ${ms}ms ${EASE}`;
  a.style.transition = t;
  b.style.transition = t;
  if (axis === "sides") { a.style.width = "0"; b.style.width = "0"; }
  else { a.style.height = "0"; b.style.height = "0"; }
}

/* =================================================================
   FOCUS VIEW — autoplay + curtain transition
================================================================= */
function scheduleAutoplay() {
  clearTimeout(autoplayTimer);
  autoplayTimer = setTimeout(() => {
    goTo((currentIndex + 1) % N);
  }, HOLD_MS);
}

function goTo(newIndex) {
  if (isAnimating || newIndex === currentIndex) return;
  isAnimating = true;
  clearTimeout(autoplayTimer);

  const axis = randomAxis();
  setAxisClasses(curtainA, curtainB, axis);
  setOpenInstant(curtainA, curtainB, axis);

  requestAnimationFrame(() => animateClosed(curtainA, curtainB, axis, CURTAIN_MS));

  setTimeout(() => {
    currentIndex = newIndex;
    stageImg.src = photos[currentIndex];

    requestAnimationFrame(() => animateOpen(curtainA, curtainB, axis, CURTAIN_MS));

    setTimeout(() => {
      isAnimating = false;
      scheduleAutoplay();
    }, CURTAIN_MS);
  }, CURTAIN_MS);
}

zonePrev.addEventListener("click", () => goTo((currentIndex - 1 + N) % N));
zoneNext.addEventListener("click", () => goTo((currentIndex + 1) % N));
zoneGrid.addEventListener("click", enterGrid);

/* =================================================================
   GRID — built once, each cell starts pre-covered by its own curtains
================================================================= */
const gridCells = [];

photos.forEach((src, i) => {
  const cell = document.createElement("div");
  cell.className = "grid-cell";

  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  img.loading = "lazy";

  const a = document.createElement("div");
  a.className = "curtain curtain-a sides";
  const b = document.createElement("div");
  b.className = "curtain curtain-b sides";
  setClosedInstant(a, b, "sides"); // grid starts fully covered until first reveal

  cell.appendChild(img);
  cell.appendChild(a);
  cell.appendChild(b);
  cell.addEventListener("click", () => exitToFocus(i));

  gridTrack.appendChild(cell);
  gridCells.push(cell);
});

function revealOtherCells(excludeIndex) {
  gridCells.forEach((cell, i) => {
    if (i === excludeIndex) return;
    const a = cell.querySelector(".curtain-a");
    const b = cell.querySelector(".curtain-b");
    const axis = randomAxis();
    setAxisClasses(a, b, axis);
    setClosedInstant(a, b, axis);
    const delay = i * 25; // slight cascade
    setTimeout(() => animateOpen(a, b, axis, CURTAIN_MS), delay);
  });
}

// The cell the flying photo lands on is already "revealed" by the
// flight itself — just clear its curtains instantly, no animation.
function clearCellCurtains(index) {
  const cell = gridCells[index];
  [".curtain-a", ".curtain-b"].forEach((sel) => {
    const el = cell.querySelector(sel);
    el.style.transition = "none";
    el.style.width = "0";
    el.style.height = "0";
  });
}

/* =================================================================
   SHARED-ELEMENT FLIGHT between the focus mask and a grid cell
================================================================= */
function flyImage(src, fromRect, toRect, onDone) {
  const clone = document.createElement("img");
  clone.src = src;
  clone.className = "flying-clone";
  clone.style.top = `${fromRect.top}px`;
  clone.style.left = `${fromRect.left}px`;
  clone.style.width = `${fromRect.width}px`;
  clone.style.height = `${fromRect.height}px`;
  clone.style.transition = "none";
  document.body.appendChild(clone);
  void clone.offsetWidth;

  clone.style.transition =
    `top ${FLY_MS}ms ${EASE}, left ${FLY_MS}ms ${EASE}, ` +
    `width ${FLY_MS}ms ${EASE}, height ${FLY_MS}ms ${EASE}`;

  requestAnimationFrame(() => {
    clone.style.top = `${toRect.top}px`;
    clone.style.left = `${toRect.left}px`;
    clone.style.width = `${toRect.width}px`;
    clone.style.height = `${toRect.height}px`;
  });

  setTimeout(() => {
    clone.remove();
    onDone();
  }, FLY_MS);
}

function enterGrid() {
  if (isAnimating) return;
  isAnimating = true;
  clearTimeout(autoplayTimer);

  const clickedIndex = currentIndex;
  const fromRect = mask.getBoundingClientRect();
  const targetImg = gridCells[clickedIndex].querySelector("img");
  const toRect = targetImg.getBoundingClientRect();

  stageImg.style.visibility = "hidden";
  targetImg.style.visibility = "hidden";

  flyImage(photos[clickedIndex], fromRect, toRect, () => {
    targetImg.style.visibility = "visible";
    stageImg.style.visibility = "visible";
    clearCellCurtains(clickedIndex);
    gridView.classList.add("is-active");
    focusView.classList.add("is-hidden");
    revealOtherCells(clickedIndex);
    isAnimating = false;
  });
}

function exitToFocus(index) {
  if (isAnimating) return;
  isAnimating = true;

  const cellImg = gridCells[index].querySelector("img");
  const fromRect = cellImg.getBoundingClientRect();
  const toRect = mask.getBoundingClientRect();

  currentIndex = index;
  stageImg.src = photos[index];
  stageImg.style.visibility = "hidden";
  cellImg.style.visibility = "hidden";

  focusView.classList.remove("is-hidden");
  gridView.classList.remove("is-active");

  flyImage(photos[index], fromRect, toRect, () => {
    stageImg.style.visibility = "visible";
    cellImg.style.visibility = "visible";
    isAnimating = false;
    scheduleAutoplay();
  });
}

/* =================================================================
   INIT
================================================================= */
function preloadAll() {
  photos.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
}

window.addEventListener("load", fitNameWidth);
document.fonts.ready.then(fitNameWidth);

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fitNameWidth, 150);
});

preloadAll();
stageImg.src = photos[currentIndex];
fitNameWidth();
initContactLink();
scheduleAutoplay();