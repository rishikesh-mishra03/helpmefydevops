/* ==========================================================================
   Helpmefy Application Engine
   Features:
   - State-driven single page application flow
   - Standard Web Audio procedural synth effects
   - Geolocation coordinates retriever with elegant fallback
   - CSS & HTML5 Canvas Tactical Grid map simulation
   - Multi-speed Countdown Timer (1x, 10x, 50x, 200x speed)
   - Volunteer simulated dispatch control center
   ========================================================================== */

// --- Global App State Constants ---
const APP_STATES = {
  IDLE: 'IDLE',
  FORM: 'FORM',
  ACTIVE: 'ACTIVE',
  SUCCESS: 'SUCCESS'
};

const SERVICES = {
  Ambulance: { name: 'Ambulance', icon: 'ambulance', class: 'ambulance', color: '#ef4444', desc: 'Emergency Medical Response Unit' },
  Mechanic: { name: 'Mechanic', icon: 'wrench', class: 'mechanic', color: '#f59e0b', desc: 'Roadside Assistance Patrol' },
  'Fuel Truck': { name: 'Fuel Truck', icon: 'fuel', class: 'fuel', color: '#06b6d4', desc: 'Mobile Fuel Refill Tank' },
  'Food Delivery': { name: 'Food Delivery', icon: 'soup', class: 'food', color: '#10b981', desc: 'Emergency Food & Water Supplies' }
};

const VOLUNTEERS_POOL = [
  { name: 'Rahul Sharma', id: '#4910', phone: '+91 98451 09873' },
  { name: 'Amit Verma', id: '#2039', phone: '+91 99104 22345' },
  { name: 'Priya Patel', id: '#7731', phone: '+91 88021 34109' },
  { name: 'Sandeep Singh', id: '#1044', phone: '+91 70129 45831' },
  { name: 'Ananya Roy', id: '#8890', phone: '+91 91023 55678' }
];

// --- Core Variables ---
let currentState = APP_STATES.IDLE;
let userCoords = { lat: 28.6139, lon: 77.2090 }; // Default simulated Delhi
let isLocationMocked = true;
let selectedService = 'Ambulance';
let userPhoneNumber = '';
let isOutsideCity = false;

// Timer configurations
let totalSeconds = 300; // 5 mins default
let remainingSeconds = 300;
let simSpeed = 1; // Simulation multiplier (1x, 10x, 50x, 200x)
let timerInterval = null;
let activeVolunteer = null;

// Map canvas variables
let canvas = null;
let ctx = null;
let animationFrameId = null;
let volunteerPos = { x: 50, y: 50 }; // Simulated starting location
let targetPos = { x: 200, y: 200 }; // User location
let secondaryVolunteers = []; // Background active units

// Web Audio API Synthesizer Context
let audioCtx = null;

// --- Initialize DOM Elements ---
document.addEventListener('DOMContentLoaded', () => {
  initDOM();
  initMap();
  setupEventListeners();
  randomizeBackgroundVolunteers();
  
  // Initialize lucide icons at load
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Cache DOM elements
let views = {};
let btnEmergency = null;
let btnBackToIdle = null;
let emergencyForm = null;
let txtLocation = null;
let btnReLocate = null;
let chkOutsideCity = null;
let toggleDescText = null;
let lblTimer = null;
let lblTimerType = null;
let timerBar = null;
let btnCancelActive = null;
let btnResetSuccess = null;

let trackingTitle = null;
let lblRequestTime = null;
let lblMatchDesc = null;
let lblVolunteerDesc = null;
let stepRequested = null;
let stepMatching = null;
let stepEnroute = null;
let stepArrived = null;

let sumService = null;
let sumVolunteer = null;
let sumPhone = null;
let sumZone = null;

let drawerToggle = null;
let simulatorDrawer = null;
let simSpeedBtns = [];
let btnSimLocation = null;
let btnSimAccept = null;
let btnSimFastForward = null;
let btnSimForceArrive = null;

function initDOM() {
  views[APP_STATES.IDLE] = document.getElementById('screen-idle');
  views[APP_STATES.FORM] = document.getElementById('screen-form');
  views[APP_STATES.ACTIVE] = document.getElementById('screen-active');
  views[APP_STATES.SUCCESS] = document.getElementById('screen-success');

  btnEmergency = document.getElementById('btn-emergency');
  btnBackToIdle = document.getElementById('btn-back-to-idle');
  emergencyForm = document.getElementById('emergency-form');
  txtLocation = document.getElementById('txt-location');
  btnReLocate = document.getElementById('btn-re-locate');
  chkOutsideCity = document.getElementById('chk-outside-city');
  toggleDescText = document.getElementById('toggle-desc-text');
  lblTimer = document.getElementById('lbl-timer');
  lblTimerType = document.getElementById('lbl-timer-type');
  timerBar = document.getElementById('timer-bar');
  btnCancelActive = document.getElementById('btn-cancel-active');
  btnResetSuccess = document.getElementById('btn-reset-success');

  trackingTitle = document.getElementById('tracking-title');
  lblRequestTime = document.getElementById('lbl-request-time');
  lblMatchDesc = document.getElementById('lbl-match-desc');
  lblVolunteerDesc = document.getElementById('lbl-volunteer-desc');
  
  stepRequested = document.getElementById('step-requested');
  stepMatching = document.getElementById('step-matching');
  stepEnroute = document.getElementById('step-enroute');
  stepArrived = document.getElementById('step-arrived');

  sumService = document.getElementById('sum-service');
  sumVolunteer = document.getElementById('sum-volunteer');
  sumPhone = document.getElementById('sum-phone');
  sumZone = document.getElementById('sum-zone');

  drawerToggle = document.getElementById('btn-drawer-toggle');
  simulatorDrawer = document.getElementById('simulator-drawer');
  simSpeedBtns = document.querySelectorAll('.btn-sim-speed');
  
  btnSimLocation = document.getElementById('sim-trigger-location');
  btnSimAccept = document.getElementById('sim-accept-volunteer');
  btnSimFastForward = document.getElementById('sim-fast-forward');
  btnSimForceArrive = document.getElementById('sim-force-arrive');
}

// --- Synth Sound FX Generators (Web Audio API) ---
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    
    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.1);
    } 
    else if (type === 'sos') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(440, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.35);
    } 
    else if (type === 'dispatch') {
      // Short radio click
      const osc1 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(150, now);
      osc1.frequency.linearRampToValueAtTime(120, now + 0.08);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, now);
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc1.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc1.stop(now + 0.1);
    }
    else if (type === 'alert') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.36); // C6
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.warn("Web Audio block or error: ", e);
  }
}

// --- Navigation / View Coordinator ---
function switchState(newState) {
  currentState = newState;
  
  // Update view classes for transition
  Object.keys(views).forEach(state => {
    if (state === newState) {
      views[state].classList.add('active');
    } else {
      views[state].classList.remove('active');
    }
  });

  // Dynamic simulation button locking
  updateSimulatorButtonLocking();

  // Reset or run state specific scripts
  if (newState === APP_STATES.IDLE) {
    stopActiveTimer();
    document.getElementById('map-gps-status').innerText = "Idle Grid";
    document.getElementById('map-gps-status').className = "desc";
  } 
  else if (newState === APP_STATES.FORM) {
    document.getElementById('map-gps-status').innerText = "SOS Form Active";
    document.getElementById('map-gps-status').className = "desc icon-blue";
  }
  else if (newState === APP_STATES.ACTIVE) {
    document.getElementById('map-gps-status').innerText = "Rescue Tracking";
    document.getElementById('map-gps-status').className = "desc icon-blue";
  }
  else if (newState === APP_STATES.SUCCESS) {
    document.getElementById('map-gps-status').innerText = "Help Arrived";
    document.getElementById('map-gps-status').className = "desc icon-green";
  }
}

// --- Location coordinates locator ---
function acquireUserLocation() {
  switchState(APP_STATES.FORM);
  playSound('click');
  
  const container = document.querySelector('.location-status-container');
  container.className = "location-status-container requesting";
  txtLocation.innerHTML = `<span class="pulse-text">Locating via GPS satellites...</span>`;
  
  if (navigator.geolocation) {
    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 6000,
      maximumAge: 0
    };
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userCoords.lat = position.coords.latitude;
        userCoords.lon = position.coords.longitude;
        isLocationMocked = false;
        
        container.className = "location-status-container success";
        txtLocation.innerText = `Lat: ${userCoords.lat.toFixed(5)}, Lon: ${userCoords.lon.toFixed(5)} (Live GPS)`;
        playSound('click');
        resetMapPositions();
      },
      (error) => {
        console.warn("GPS failed, using fallback custom coordinates: ", error.message);
        generateFallbackMockCoordinates(container);
      },
      geoOptions
    );
  } else {
    generateFallbackMockCoordinates(container);
  }
}

function generateFallbackMockCoordinates(container) {
  // Generate random coords representing nearby cities (Delhi / Mumbai etc.)
  const cities = [
    { name: "Delhi Suburbs", lat: 28.6139, lon: 77.2090 },
    { name: "Mumbai Hub", lat: 19.0760, lon: 72.8777 },
    { name: "Bengaluru Technopolis", lat: 12.9716, lon: 77.5946 }
  ];
  const city = cities[Math.floor(Math.random() * cities.length)];
  
  // Add minor noise to make it dynamic
  userCoords.lat = city.lat + (Math.random() - 0.5) * 0.05;
  userCoords.lon = city.lon + (Math.random() - 0.5) * 0.05;
  isLocationMocked = true;

  setTimeout(() => {
    container.className = "location-status-container success";
    txtLocation.innerText = `Lat: ${userCoords.lat.toFixed(5)}, Lon: ${userCoords.lon.toFixed(5)} (Fallback: ${city.name})`;
    playSound('sos');
    resetMapPositions();
  }, 1000);
}

// --- Setup Event Listeners ---
function setupEventListeners() {
  // Front emergency click
  btnEmergency.addEventListener('click', () => {
    acquireUserLocation();
  });

  // Back to home
  btnBackToIdle.addEventListener('click', () => {
    playSound('click');
    switchState(APP_STATES.IDLE);
  });

  // Refresh Geolocation coords
  btnReLocate.addEventListener('click', () => {
    acquireUserLocation();
  });

  // Toggle checkbox updates the helper hint text
  chkOutsideCity.addEventListener('change', () => {
    playSound('click');
    isOutsideCity = chkOutsideCity.checked;
    if (isOutsideCity) {
      toggleDescText.innerText = "Outside city boundary: 15 Min timer dispatched";
      toggleDescText.style.color = "var(--color-primary)";
    } else {
      toggleDescText.innerText = "Within city boundary: 5 Min timer dispatched";
      toggleDescText.style.color = "var(--text-muted)";
    }
  });

  // Form Submit Dispatches SOS
  emergencyForm.addEventListener('submit', (e) => {
    e.preventDefault();
    triggerSOSSubmission();
  });

  // Active cancel
  btnCancelActive.addEventListener('click', () => {
    playSound('click');
    if (confirm("Are you sure you want to cancel this emergency request?")) {
      switchState(APP_STATES.IDLE);
    }
  });

  // Success Reset Home
  btnResetSuccess.addEventListener('click', () => {
    playSound('click');
    switchState(APP_STATES.IDLE);
  });

  // Simulator Drawer Slider
  drawerToggle.addEventListener('click', () => {
    simulatorDrawer.classList.toggle('open');
    playSound('click');
  });

  // Simulator Speed Toggles
  simSpeedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      simSpeedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      simSpeed = parseInt(btn.getAttribute('data-speed'), 10);
      playSound('click');
    });
  });

  // Simulator Auto-Fill GPS Coords
  btnSimLocation.addEventListener('click', () => {
    if (currentState === APP_STATES.FORM) {
      generateFallbackMockCoordinates(document.querySelector('.location-status-container'));
    }
  });

  // Simulator Accept volunteer manually
  btnSimAccept.addEventListener('click', () => {
    if (currentState === APP_STATES.ACTIVE && remainingSeconds > totalSeconds * 0.9) {
      triggerVolunteerMatched();
    }
  });

  // Simulator Fast-Forward
  btnSimFastForward.addEventListener('click', () => {
    if (currentState === APP_STATES.ACTIVE && remainingSeconds > 10) {
      remainingSeconds = 10;
      playSound('click');
    }
  });

  // Simulator Force Arrive
  btnSimForceArrive.addEventListener('click', () => {
    if (currentState === APP_STATES.ACTIVE) {
      triggerArrivalSuccess();
    }
  });
}

// --- Submit SOS Request Flow ---
function triggerSOSSubmission() {
  playSound('sos');
  
  // Read service chosen
  const selectedRadio = document.querySelector('input[name="service_type"]:checked');
  selectedService = selectedRadio ? selectedRadio.value : 'Ambulance';
  
  // Read variables
  userPhoneNumber = document.getElementById('phone-input').value;
  isOutsideCity = chkOutsideCity.checked;

  // Set standard emergency timer values based on checkbox selection
  totalSeconds = isOutsideCity ? 900 : 300; // 15 mins vs 5 mins
  remainingSeconds = totalSeconds;
  
  // Pick random volunteer
  activeVolunteer = VOLUNTEERS_POOL[Math.floor(Math.random() * VOLUNTEERS_POOL.length)];
  
  // Change UI active color based on service chosen
  setupActiveDashboardColor(selectedService);

  // Switch view to Active screen
  switchState(APP_STATES.ACTIVE);
  
  // Start countdown & simulated milestones
  startActiveCountdown();
}

function setupActiveDashboardColor(service) {
  // Clear classes
  timerBar.className = "timer-progress";
  
  // Clear step-bullet classes
  stepMatching.className = "pipeline-step active";
  stepEnroute.className = "pipeline-step";
  stepArrived.className = "pipeline-step";
  
  const servInfo = SERVICES[service];
  
  // Add class color themes
  timerBar.classList.add(`${servInfo.class}-timer`);
  stepMatching.classList.add(`active-${servInfo.class}`);
  stepEnroute.classList.add(`active-${servInfo.class}`);
  stepArrived.classList.add(`active-${servInfo.class}`);
  
  // Update texts
  lblTimerType.innerText = isOutsideCity ? "Outside City (15 Min Target)" : "Within City (5 Min Target)";
  trackingTitle.innerText = `Dispatching nearest ${servInfo.name}...`;
}

// --- Countdown Engine & Milestones ---
function startActiveCountdown() {
  stopActiveTimer();
  
  // Log request times
  const d = new Date();
  lblRequestTime.innerText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  
  // Set pipeline elements
  stepRequested.className = "pipeline-step completed";
  stepMatching.className = "pipeline-step active";
  stepEnroute.className = "pipeline-step";
  stepArrived.className = "pipeline-step";

  lblMatchDesc.innerText = "Scanning volunteer grid array...";
  lblVolunteerDesc.innerText = "Awaiting coordinate confirmation...";

  // Reset positions on map
  resetMapPositions();

  // Run countdown loop
  timerInterval = setInterval(() => {
    // Decrease based on speed multiplier
    remainingSeconds -= 1 * (simSpeed / 10); // Div 10 because we run interval at 100ms for high resolution
    
    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      triggerArrivalSuccess();
    } else {
      updateActiveTimerUI();
    }
  }, 100); // 100ms interval for extremely smooth high-speed ticking
}

function stopActiveTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function updateActiveTimerUI() {
  // Calc human readable digital output
  const mins = Math.floor(remainingSeconds / 60);
  const secs = Math.floor(remainingSeconds % 60);
  lblTimer.innerText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // SVG Radial stroke offset calculation
  const progressRatio = remainingSeconds / totalSeconds;
  const strokeOffset = 440 * (1 - progressRatio);
  timerBar.style.strokeDashoffset = strokeOffset;

  // Process Pipeline Milestones based on percentages
  const pct = (remainingSeconds / totalSeconds) * 100;

  // Phase 1: Matching Volunteer (First 15% of total time or until forced)
  if (pct > 85) {
    stepRequested.className = "pipeline-step completed";
    stepMatching.className = "pipeline-step active";
    stepEnroute.className = "pipeline-step";
    
    // Play radar sonar procedural tick every 3 seconds equivalent
    if (Math.floor(remainingSeconds) % 3 === 0 && remainingSeconds % 1 < 0.1) {
      playSound('sos');
    }
  } 
  // Phase 2: Volunteer En Route
  else if (pct <= 85 && pct > 0) {
    if (stepMatching.classList.contains('active')) {
      triggerVolunteerMatched();
    }
    
    // As timer approaches zero, coordinate en-route update text
    if (pct < 15) {
      lblVolunteerDesc.innerText = `${activeVolunteer.name} is arriving in seconds. Prepare to greet him!`;
    }
  }
}

function triggerVolunteerMatched() {
  playSound('dispatch');
  
  stepRequested.className = "pipeline-step completed";
  stepMatching.className = "pipeline-step completed";
  stepEnroute.className = "pipeline-step active";
  
  const servInfo = SERVICES[selectedService];
  trackingTitle.innerText = `${servInfo.name} Dispatched`;
  lblMatchDesc.innerText = `Matched with ${activeVolunteer.name} (ID ${activeVolunteer.id})`;
  lblVolunteerDesc.innerText = `${activeVolunteer.name} is en route with your ${servInfo.name}. ETA: ${Math.round(remainingSeconds / 60)} min.`;
}

function triggerArrivalSuccess() {
  stopActiveTimer();
  playSound('alert');

  // Fill in complete dashboard
  stepRequested.className = "pipeline-step completed";
  stepMatching.className = "pipeline-step completed";
  stepEnroute.className = "pipeline-step completed";
  stepArrived.className = "pipeline-step active completed";
  
  // Transition success panel
  setTimeout(() => {
    // Fill success summaries
    sumService.innerText = selectedService;
    sumVolunteer.innerText = `${activeVolunteer.name} (Volunteer ${activeVolunteer.id})`;
    sumPhone.innerText = userPhoneNumber || '+91 98765 43210';
    sumZone.innerText = isOutsideCity ? 'Outside City (15 min limits)' : 'Within City (5 min limits)';
    
    switchState(APP_STATES.SUCCESS);

    // Canvas Confetti Celebration!
    if (window.confetti) {
      window.confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6366f1', '#10b981', '#06b6d4', '#ef4444']
      });
    }
  }, 1000);
}

function updateSimulatorButtonLocking() {
  // Lock simulator actions depending on active flow
  if (currentState === APP_STATES.FORM) {
    btnSimLocation.disabled = false;
    btnSimAccept.disabled = true;
    btnSimFastForward.disabled = true;
    btnSimForceArrive.disabled = true;
  }
  else if (currentState === APP_STATES.ACTIVE) {
    btnSimLocation.disabled = true;
    btnSimAccept.disabled = !(remainingSeconds > totalSeconds * 0.85);
    btnSimFastForward.disabled = !(remainingSeconds > 10);
    btnSimForceArrive.disabled = false;
  }
  else {
    btnSimLocation.disabled = true;
    btnSimAccept.disabled = true;
    btnSimFastForward.disabled = true;
    btnSimForceArrive.disabled = true;
  }
}

// --- Tactical Canvas Map Engine ---
function initMap() {
  canvas = document.getElementById('map-canvas');
  ctx = canvas.getContext('2d');

  // Resize canvas handler
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Run render loop
  animateMap();
}

function resizeCanvas() {
  if (canvas && canvas.parentElement) {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    resetMapPositions();
  }
}

function resetMapPositions() {
  if (!canvas) return;
  
  // Set User coordinates (Target) at center of screen
  targetPos = {
    x: canvas.width / 2,
    y: canvas.height / 2
  };

  // Volunteer starts far off, somewhere on edge of map
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.max(canvas.width, canvas.height) * 0.4;
  
  volunteerPos = {
    x: targetPos.x + Math.cos(angle) * distance,
    y: targetPos.y + Math.sin(angle) * distance
  };
}

function randomizeBackgroundVolunteers() {
  secondaryVolunteers = [];
  // Populate surrounding crew dots moving randomly on map
  for (let i = 0; i < 15; i++) {
    secondaryVolunteers.push({
      x: Math.random() * 500,
      y: Math.random() * 500,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      service: Object.keys(SERVICES)[Math.floor(Math.random() * 4)],
      pulse: Math.random()
    });
  }
}

function animateMap() {
  if (!ctx || !canvas) return;

  // Clear map screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // RENDER GRID CHANNELS
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // UPDATE & RENDER BACKGROUND PATROL VOLUNTEERS
  secondaryVolunteers.forEach(v => {
    // Keep within borders
    v.x += v.vx;
    v.y += v.vy;
    if (v.x < 0 || v.x > canvas.width) v.vx *= -1;
    if (v.y < 0 || v.y > canvas.height) v.vy *= -1;

    // Draw little on-patrol crosshair dots
    ctx.beginPath();
    ctx.arc(v.x, v.y, 4, 0, Math.PI * 2);
    ctx.fillStyle = SERVICES[v.service].color + '66'; // semi-transparent
    ctx.fill();

    // Minor status glow pulse ring
    v.pulse += 0.01;
    if (v.pulse > 1) v.pulse = 0;
    
    ctx.beginPath();
    ctx.arc(v.x, v.y, 4 + v.pulse * 8, 0, Math.PI * 2);
    ctx.strokeStyle = SERVICES[v.service].color + '22';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // DRAW SOS RADAR SCAN SWEEPS (When requesting or active)
  if (currentState === APP_STATES.FORM || currentState === APP_STATES.ACTIVE) {
    const time = Date.now() * 0.001;
    const scanRadius = (time % 4) * (canvas.width * 0.25);
    
    ctx.beginPath();
    ctx.arc(targetPos.x, targetPos.y, scanRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Radial grid concentric circle
    ctx.beginPath();
    ctx.arc(targetPos.x, targetPos.y, canvas.width * 0.15, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.stroke();
  }

  // RENDER DYNAMIC ACTIVE SOS ROUTE & GPS DISPATCH CAR
  if (currentState === APP_STATES.ACTIVE || currentState === APP_STATES.SUCCESS) {
    const servColor = SERVICES[selectedService].color;
    
    // 1. Draw route line connecting User to Volunteer
    ctx.beginPath();
    ctx.moveTo(volunteerPos.x, volunteerPos.y);
    ctx.lineTo(targetPos.x, targetPos.y);
    ctx.strokeStyle = servColor + '33'; // dotted base path line
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]); // clear dash

    // Solid progress path line representing en route
    const pctElapsed = 1 - (remainingSeconds / totalSeconds);
    const currX = volunteerPos.x + (targetPos.x - volunteerPos.x) * pctElapsed;
    const currY = volunteerPos.y + (targetPos.y - volunteerPos.y) * pctElapsed;

    ctx.beginPath();
    ctx.moveTo(volunteerPos.x, volunteerPos.y);
    ctx.lineTo(currX, currY);
    ctx.strokeStyle = servColor;
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = servColor;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow

    // 2. Draw Volunteer SOS Unit dot (moving vehicle representation)
    ctx.beginPath();
    ctx.arc(currX, currY, 9, 0, Math.PI * 2);
    ctx.fillStyle = servColor;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Volunteer outer sonar pulses
    const volPulse = (Date.now() % 1500) / 1500;
    ctx.beginPath();
    ctx.arc(currX, currY, 9 + volPulse * 15, 0, Math.PI * 2);
    ctx.strokeStyle = servColor + '44';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label indicator tag on top of helper
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Plus Jakarta Sans';
    ctx.textAlign = 'center';
    ctx.fillText(activeVolunteer ? activeVolunteer.name.split(' ')[0] : 'Crew', currX, currY - 18);
  }

  // ALWAYS RENDER USER CENTRAL GPS TARGET BLINKER
  if (currentState === APP_STATES.FORM || currentState === APP_STATES.ACTIVE || currentState === APP_STATES.SUCCESS) {
    const userPulse = (Date.now() % 2000) / 2000;
    
    // Outer pulse ring
    ctx.beginPath();
    ctx.arc(targetPos.x, targetPos.y, 8 + userPulse * 22, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Inner glowing core dot
    ctx.beginPath();
    ctx.arc(targetPos.x, targetPos.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#6366f1';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Label tag
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 10px Outfit';
    ctx.textAlign = 'center';
    ctx.fillText('MY SOS LOCATION', targetPos.x, targetPos.y + 24);
  }

  // Request next animation tick
  animationFrameId = requestAnimationFrame(animateMap);
}
