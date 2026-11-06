/**
 * MICRO:BIT ALERTA SOCIAL - JAVASCRIPT ENGINE
 * Inspirado en la interacción y fiabilidad de Verisure Alarmas
 * Implementa la lógica de MakeCode del Proyecto Integrador Escolar TI 2026
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ==========================================================================
     1. NAVIGATION & SCROLL BEHAVIOR
     ========================================================================== */
  const header = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header shadow on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close menu when clicking nav links
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active section indicator using IntersectionObserver
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = {
    root: null,
    rootMargin: '-30% 0px -60% 0px',
    threshold: 0
  };

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, observerOptions);

  sections.forEach(section => sectionObserver.observe(section));


  /* ==========================================================================
     2. MICRO:BIT 5x5 LED MATRIX SIMULATION ENGINE
     ========================================================================== */
  const ledMatrixGroup = document.getElementById('ledMatrixGroup');
  const lightSlider = document.getElementById('lightSlider');
  const lightValue = document.getElementById('lightValue');
  const lightBadge = document.getElementById('lightBadge');

  const tempSlider = document.getElementById('tempSlider');
  const tempValue = document.getElementById('tempValue');
  const tempBadge = document.getElementById('tempBadge');

  const daysCountBadge = document.getElementById('daysCountBadge');
  const daysProgressBar = document.getElementById('daysProgressBar');
  const btnAdvance1Day = document.getElementById('btnAdvance1Day');
  const btnAdvance14Days = document.getElementById('btnAdvance14Days');
  const btnResetDays = document.getElementById('btnResetDays');

  const systemStatusText = document.getElementById('systemStatusText');
  const pin0LedIndicator = document.getElementById('pin0LedIndicator');
  const svgPin0Led = document.getElementById('svgPin0Led');
  const svgBtnA = document.getElementById('svgBtnA');
  const svgBtnB = document.getElementById('svgBtnB');
  const simTerminalLog = document.getElementById('simTerminalLog');
  const userActionPrompt = document.getElementById('userActionPrompt');
  const assistanceBanner = document.getElementById('assistanceBanner');

  // Simulation State Variables (mirrors MakeCode logic)
  let state = {
    lightLevel: 120,      // 0 - 255
    temperature: 21,      // -5 to 45 °C
    dias: 0,              // Count of days without normal conditions
    isAlertActive: false, // True when dias >= 14
    pinP0: 0,             // Digital write pin P0
    displayMode: 'idle',  // 'idle', 'sad', 'env', 'cancel'
    matrixLeds: []        // Array of 25 SVG circle elements
  };

  // Matrix LED Bitmaps (5x5, 0 = off, 1 = on)
  const BITMAP_SAD = [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1]
  ];

  const BITMAP_SMILE = [
    [0, 0, 0, 0, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 0, 0, 0],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0]
  ];

  const BITMAP_CHECK = [
    [0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1],
    [0, 0, 0, 1, 0],
    [1, 0, 1, 0, 0],
    [0, 1, 0, 0, 0]
  ];

  const BITMAP_CROSS = [
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1]
  ];

  // Letters bitmap for scrolling text emulation
  const BITMAP_LETTER_E = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
    [1, 1, 1, 1, 1]
  ];

  // Initialize 5x5 SVG LEDs
  function initSvgMatrix() {
    if (!ledMatrixGroup) return;
    ledMatrixGroup.innerHTML = '';
    state.matrixLeds = [];

    const spacing = 28;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', c * spacing + 14);
        circle.setAttribute('cy', r * spacing + 14);
        circle.setAttribute('r', '7.5');
        circle.setAttribute('class', 'matrix-led');
        ledMatrixGroup.appendChild(circle);
        state.matrixLeds.push(circle);
      }
    }
    renderMatrix(BITMAP_SMILE);
  }

  // Render a 5x5 matrix
  function renderMatrix(bitmap) {
    if (!state.matrixLeds.length) return;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const index = r * 5 + c;
        const led = state.matrixLeds[index];
        if (bitmap && bitmap[r] && bitmap[r][c] === 1) {
          led.classList.add('lit');
        } else {
          led.classList.remove('lit');
        }
      }
    }
  }

  // Add message to simulator log
  function logSim(message) {
    if (!simTerminalLog) return;
    const now = new Date();
    const timeStr = `[${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
    simTerminalLog.innerHTML = `<span class="log-time">${timeStr}</span> ${message}`;
  }

  // Check if environment condition is critical (MakeCode: light <= 20 || temp < 10 || temp > 35)
  function isCriticalCondition() {
    return (state.lightLevel <= 20 || state.temperature < 10 || state.temperature > 35);
  }

  // Update simulator UI based on conditions and MakeCode logic
  function updateSimulation() {
    // 1. Update Badges & Sliders
    if (lightValue) lightValue.textContent = `${state.lightLevel} / 255`;
    if (tempValue) tempValue.textContent = `${state.temperature} °C`;

    const lightCritical = state.lightLevel <= 20;
    const tempCritical = state.temperature < 10 || state.temperature > 35;

    if (lightBadge) {
      if (lightCritical) {
        lightBadge.textContent = 'Corte de Luz';
        lightBadge.classList.add('alert');
      } else {
        lightBadge.textContent = 'Normal';
        lightBadge.classList.remove('alert');
      }
    }

    if (tempBadge) {
      if (state.temperature < 10) {
        tempBadge.textContent = 'Frío Extremo (<10°C)';
        tempBadge.classList.add('alert');
      } else if (state.temperature > 35) {
        tempBadge.textContent = 'Calor Extremo (>35°C)';
        tempBadge.classList.add('alert');
      } else {
        tempBadge.textContent = 'Confort';
        tempBadge.classList.remove('alert');
      }
    }

    // 2. Days progress
    const pct = Math.min(100, Math.round((state.dias / 14) * 100));
    if (daysProgressBar) daysProgressBar.style.width = `${pct}%`;
    if (daysCountBadge) daysCountBadge.textContent = `${state.dias} / 14 días`;

    // 3. Evaluate MakeCode Alert Trigger (if dias >= 14)
    if (state.dias >= 14) {
      state.isAlertActive = true;
      state.pinP0 = 1;
      
      // Update hardware indicators
      if (pin0LedIndicator) pin0LedIndicator.classList.add('on');
      if (svgPin0Led) {
        svgPin0Led.classList.add('lit');
        svgPin0Led.classList.remove('off');
      }

      if (systemStatusText) {
        systemStatusText.textContent = 'ALERTA DE VULNERABILIDAD ACTIVA';
        systemStatusText.classList.add('critical');
      }

      // Show Sad Face unless user just pressed A or B
      if (state.displayMode !== 'env' && state.displayMode !== 'cancel') {
        renderMatrix(BITMAP_SAD);
      }

      if (userActionPrompt) userActionPrompt.style.display = 'flex';
      
    } else {
      state.isAlertActive = false;
      state.pinP0 = 0;

      if (pin0LedIndicator) pin0LedIndicator.classList.remove('on');
      if (svgPin0Led) {
        svgPin0Led.classList.remove('lit');
        svgPin0Led.classList.add('off');
      }

      if (systemStatusText) {
        systemStatusText.textContent = isCriticalCondition() ? 'MONITOREANDO (CONDICIÓN CRÍTICA)' : 'MONITORIZANDO NORMAL';
        systemStatusText.classList.remove('critical');
      }

      if (userActionPrompt) userActionPrompt.style.display = 'none';

      if (state.displayMode === 'idle') {
        renderMatrix(BITMAP_SMILE);
      }
    }
  }

  // User presses Button A (MakeCode: on button A pressed -> show string "Env.")
  function handleButtonAPress() {
    logSim('<strong>[BOTÓN A PRESIONADO]</strong> Consentimiento otorgado. Mostrando "Env." en pantalla...');
    state.displayMode = 'env';
    
    // Animate checkmark and "E"
    renderMatrix(BITMAP_CHECK);
    setTimeout(() => {
      renderMatrix(BITMAP_LETTER_E);
    }, 500);

    // Show official assistance notification
    if (assistanceBanner) {
      assistanceBanner.style.display = 'flex';
      assistanceBanner.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    if (userActionPrompt) userActionPrompt.style.display = 'none';
  }

  // User presses Button B (MakeCode: on button B pressed -> show string "Cancel.")
  function handleButtonBPress() {
    logSim('<strong>[BOTÓN B PRESIONADO]</strong> Alerta descartada por el usuario. Mostrando "Cancel." y reseteando sistema.');
    state.displayMode = 'cancel';
    
    renderMatrix(BITMAP_CROSS);

    setTimeout(() => {
      state.dias = 0;
      state.displayMode = 'idle';
      if (assistanceBanner) assistanceBanner.style.display = 'none';
      if (userActionPrompt) userActionPrompt.style.display = 'none';
      updateSimulation();
      logSim('Sistema reseteado a cero. Volviendo a modo de monitoreo pasivo.');
    }, 1200);
  }

  // Attach button events
  if (svgBtnA) {
    svgBtnA.addEventListener('click', handleButtonAPress);
    svgBtnA.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleButtonAPress();
      }
    });
  }

  if (svgBtnB) {
    svgBtnB.addEventListener('click', handleButtonBPress);
    svgBtnB.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleButtonBPress();
      }
    });
  }

  // Sliders input
  if (lightSlider) {
    lightSlider.addEventListener('input', (e) => {
      state.lightLevel = parseInt(e.target.value, 10);
      updateSimulation();
      logSim(`Lectura de sensor de luz actualizada: ${state.lightLevel}/255.`);
    });
  }

  if (tempSlider) {
    tempSlider.addEventListener('input', (e) => {
      state.temperature = parseInt(e.target.value, 10);
      updateSimulation();
      logSim(`Lectura de temperatura actualizada: ${state.temperature}°C.`);
    });
  }

  // Advance Days Buttons
  if (btnAdvance1Day) {
    btnAdvance1Day.addEventListener('click', () => {
      if (!isCriticalCondition()) {
        logSim('Condiciones normales actuales. Simulando anomalía para incrementar contador diario...');
        state.lightLevel = 10;
        if (lightSlider) lightSlider.value = 10;
      }
      state.dias = Math.min(20, state.dias + 1);
      logSim(`Día crítico acumulado: ${state.dias} de 14.`);
      updateSimulation();
    });
  }

  if (btnAdvance14Days) {
    btnAdvance14Days.addEventListener('click', () => {
      state.dias = 14;
      state.lightLevel = 5;
      state.temperature = 7;
      if (lightSlider) lightSlider.value = 5;
      if (tempSlider) tempSlider.value = 7;
      logSim('¡14 días de carencia de servicios completados! Se dispara señal de alerta en P0 y matriz 5x5.');
      updateSimulation();
    });
  }

  if (btnResetDays) {
    btnResetDays.addEventListener('click', () => {
      state.dias = 0;
      state.displayMode = 'idle';
      if (assistanceBanner) assistanceBanner.style.display = 'none';
      updateSimulation();
      logSim('Contador de días reiniciado a cero.');
    });
  }

  // Presets
  const presetNormal = document.getElementById('presetNormal');
  const presetWinter = document.getElementById('presetWinter');
  const presetSummer = document.getElementById('presetSummer');

  if (presetNormal) {
    presetNormal.addEventListener('click', () => {
      state.lightLevel = 120;
      state.temperature = 21;
      state.dias = 0;
      state.displayMode = 'idle';
      if (lightSlider) lightSlider.value = 120;
      if (tempSlider) tempSlider.value = 21;
      if (assistanceBanner) assistanceBanner.style.display = 'none';
      updateSimulation();
      logSim('Escenario cargado: Condiciones óptimas (Luz: 120, Temp: 21°C).');
    });
  }

  if (presetWinter) {
    presetWinter.addEventListener('click', () => {
      state.lightLevel = 8;
      state.temperature = 6;
      state.dias = 14;
      if (lightSlider) lightSlider.value = 8;
      if (tempSlider) tempSlider.value = 6;
      if (assistanceBanner) assistanceBanner.style.display = 'none';
      updateSimulation();
      logSim('Escenario cargado: Corte de luz en invierno (Luz: 8, Temp: 6°C &le; 10°C).');
    });
  }

  if (presetSummer) {
    presetSummer.addEventListener('click', () => {
      state.lightLevel = 14;
      state.temperature = 39;
      state.dias = 14;
      if (lightSlider) lightSlider.value = 14;
      if (tempSlider) tempSlider.value = 39;
      if (assistanceBanner) assistanceBanner.style.display = 'none';
      updateSimulation();
      logSim('Escenario cargado: Ola de calor sin servicios (Temp: 39°C &ge; 35°C).');
    });
  }

  // Initial render of SVG matrix
  initSvgMatrix();
  updateSimulation();


  /* ==========================================================================
     3. STATISTICAL BAR CHART ANIMATION (INDEC DATA)
     ========================================================================== */
  const barChart = document.getElementById('barChart');
  if (barChart) {
    const bars = barChart.querySelectorAll('.bar');
    
    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          bars.forEach(bar => {
            const targetHeight = bar.getAttribute('data-val');
            if (targetHeight) {
              bar.style.height = targetHeight;
            }
          });
          chartObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    chartObserver.observe(barChart);
  }


  /* ==========================================================================
     4. CONTACT FORM SUBMISSION
     ========================================================================== */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = document.getElementById('formName').value;
      const email = document.getElementById('formEmail').value;
      const submitBtn = document.getElementById('formSubmitBtn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          Procesando...
        `;
      }

      // Simulated network request
      setTimeout(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '¡Mensaje Enviado con Éxito!';
          submitBtn.style.backgroundColor = '#059669';
        }

        alert(`¡Gracias ${name}! Tu solicitud ha sido registrada correctamente. Nos pondremos en contacto a ${email} para coordinar información del proyecto Micro:bit.`);
        contactForm.reset();

        setTimeout(() => {
          if (submitBtn) {
            submitBtn.innerHTML = 'Enviar Solicitud';
            submitBtn.style.backgroundColor = '';
          }
        }, 4000);
      }, 1000);
    });
  }

});
