(() => {
  const canvas = document.getElementById("universe");
  const ctx = canvas.getContext("2d", { alpha: false });
  const spectrum = document.getElementById("spectrum");
  const sctx = spectrum.getContext("2d");

  const controls = {
    epoch: document.getElementById("epoch"),
    expansion: document.getElementById("expansion"),
    quantum: document.getElementById("quantum"),
    gravity: document.getElementById("gravity")
  };

  const outputs = {
    epoch: document.getElementById("epoch-value"),
    expansion: document.getElementById("expansion-value"),
    quantum: document.getElementById("quantum-value"),
    gravity: document.getElementById("gravity-value")
  };

  const metrics = {
    age: document.getElementById("metric-age"),
    cmb: document.getElementById("metric-cmb"),
    entropy: document.getElementById("metric-entropy"),
    particles: document.getElementById("metric-particles"),
    events: document.getElementById("metric-events"),
    redshift: document.getElementById("metric-redshift"),
    coherence: document.getElementById("metric-coherence"),
    redshiftLabel: document.getElementById("metric-redshift-label"),
    coherenceLabel: document.getElementById("metric-coherence-label")
  };

  const modeCopy = {
    cosmos: ["Cosmic Web", "Large-scale structure"],
    quantum: ["Quantum Foam", "Vacuum fluctuation field"],
    collider: ["Collision Event", "Standard Model traces"],
    entropy: ["Thermal Arrow", "Information dispersal"]
  };

  const tabs = [...document.querySelectorAll(".mode-tab")];
  const btnSeed = document.getElementById("seed-event");
  const btnCollapse = document.getElementById("collapse");
  const btnAudio = document.getElementById("audio");
  const btnReset = document.getElementById("reset");
  const colliderEventSelect = document.getElementById("collider-event");
  const modeKicker = document.getElementById("mode-kicker");
  const modeTitle = document.getElementById("mode-title");

  let width = 1;
  let height = 1;
  let dpr = 1;
  let mode = "cosmos";
  let paused = false;
  let eventCount = 0;
  let time = 0;
  let stars = [];
  let waves = [];
  let events = [];
  let quantumDisturbances = [];
  let entropyFronts = [];
  let histogram = new Array(42).fill(0);
  let pointer = { x: 0.5, y: 0.5, down: false, energy: 0 };
  let audio = null;

  function randomSeed() {
    const data = new Uint32Array(2);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(data);
      return data[0] ^ data[1];
    }
    return Math.floor(Math.random() * 0xffffffff);
  }

  function mulberry32(seed) {
    return function next() {
      let t = seed += 0x6d2b79f5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  let rand = mulberry32(randomSeed());

  const PARTICLES = {
    electron: { mass: 0.000511, charge: -1, symbol: "e-", color: "164, 224, 235", stop: "ecal" },
    positron: { mass: 0.000511, charge: 1, symbol: "e+", color: "198, 111, 125", stop: "ecal" },
    muon: { mass: 0.10566, charge: -1, symbol: "mu-", color: "157, 181, 145", stop: "muon" },
    antimuon: { mass: 0.10566, charge: 1, symbol: "mu+", color: "214, 177, 102", stop: "muon" },
    photon: { mass: 0, charge: 0, symbol: "gamma", color: "222, 203, 132", stop: "ecal" },
    "pion+": { mass: 0.13957, charge: 1, symbol: "pi+", color: "198, 111, 125", stop: "hcal" },
    "pion-": { mass: 0.13957, charge: -1, symbol: "pi-", color: "171, 158, 196", stop: "hcal" },
    pion0: { mass: 0.13498, charge: 0, symbol: "pi0", color: "126, 128, 130", stop: "ecal" },
    "kaon+": { mass: 0.49368, charge: 1, symbol: "K+", color: "214, 177, 102", stop: "hcal" },
    "kaon-": { mass: 0.49368, charge: -1, symbol: "K-", color: "164, 224, 235", stop: "hcal" },
    proton: { mass: 0.93827, charge: 1, symbol: "p", color: "198, 111, 125", stop: "hcal" },
    antiproton: { mass: 0.93827, charge: -1, symbol: "p-bar", color: "171, 158, 196", stop: "hcal" },
    neutrino: { mass: 0, charge: 0, symbol: "nu", color: "84, 88, 92", stop: "invisible" }
  };

  const DETECTOR = {
    ecalOuter: 1.8,
    hcalOuter: 2.95,
    muonOuter: 7.4,
    halfLength: 5.5,
    bField: 3.8
  };

  function normal(mean = 0, sigma = 1) {
    const u1 = Math.max(rand(), 1e-10);
    const u2 = rand();
    return mean + sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(Math.PI * 2 * u2);
  }

  function exponential(mean) {
    return -mean * Math.log(Math.max(1 - rand(), 1e-10));
  }

  function uniform(min, max) {
    return min + rand() * (max - min);
  }

  function weightedChoice(items, weights) {
    const total = weights.reduce((sum, item) => sum + item, 0);
    let pick = rand() * total;
    for (let i = 0; i < items.length; i++) {
      pick -= weights[i];
      if (pick <= 0) return items[i];
    }
    return items[items.length - 1];
  }

  function makeParticle(type, px, py, pz) {
    const info = PARTICLES[type];
    const p = Math.hypot(px, py, pz);
    const pt = Math.hypot(px, py);
    const energy = Math.sqrt(p * p + info.mass * info.mass);
    const eta = p > 0.01 ? 0.5 * Math.log((p + pz + 1e-10) / (p - pz + 1e-10)) : 0;
    return {
      type,
      symbol: info.symbol,
      color: info.color,
      mass: info.mass,
      charge: info.charge,
      px,
      py,
      pz,
      pt,
      energy,
      eta,
      phi: Math.atan2(py, px),
      track: []
    };
  }

  function maxDetectorRadius(type) {
    const stop = PARTICLES[type].stop;
    if (stop === "ecal") return DETECTOR.ecalOuter;
    if (stop === "muon" || stop === "invisible") return DETECTOR.muonOuter;
    return DETECTOR.hcalOuter;
  }

  function generateTrackPoints(particle) {
    const { px, py, pz, charge, mass, type } = particle;
    const pt = Math.hypot(px, py);
    const p = Math.hypot(px, py, pz);
    if (p < 0.01) return [[0, 0, 0]];

    const energy = Math.sqrt(p * p + mass * mass);
    const maxR = maxDetectorRadius(type);
    const points = [[0, 0, 0]];
    const nPoints = 64;

    if (charge === 0) {
      const phi = Math.atan2(py, px);
      const theta = Math.atan2(pt, pz);
      for (let i = 1; i <= nPoints; i++) {
        const sinTheta = Math.max(Math.sin(theta), 0.01);
        const t = (i / nPoints) * maxR / sinTheta;
        const r = t * Math.sin(theta);
        if (r > maxR) break;
        const x = t * Math.sin(theta) * Math.cos(phi);
        const y = t * Math.sin(theta) * Math.sin(phi);
        const z = t * Math.cos(theta);
        if (Math.abs(z) > DETECTOR.halfLength) break;
        points.push([x, y, z]);
      }
      return points;
    }

    const omega = charge * 0.3 * DETECTOR.bField / (pt + 0.001);
    const phi0 = Math.atan2(py, px);
    const vz = pz / (energy + 0.001);
    for (let i = 1; i <= nPoints; i++) {
      const t = i * 0.15;
      const x = (Math.sin(phi0 + omega * t) - Math.sin(phi0)) / (omega + 1e-10);
      const y = -(Math.cos(phi0 + omega * t) - Math.cos(phi0)) / (omega + 1e-10);
      const z = vz * t * 2;
      const r = Math.hypot(x, y);
      if (r > maxR || Math.abs(z) > DETECTOR.halfLength) break;
      points.push([x, y, z]);
    }
    return points;
  }

  function genLeptonPair(lep1, lep2, invariantMass) {
    const m1 = PARTICLES[lep1].mass;
    const m2 = PARTICLES[lep2].mass;
    const mass = Math.max(invariantMass, m1 + m2 + 0.1);
    const pStar = Math.sqrt(Math.max((mass ** 2 - (m1 + m2) ** 2) * (mass ** 2 - (m1 - m2) ** 2), 0)) / (2 * mass);
    const cosTheta = uniform(-1, 1);
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const phiDecay = uniform(-Math.PI, Math.PI);
    const px1 = pStar * sinTheta * Math.cos(phiDecay);
    const py1 = pStar * sinTheta * Math.sin(phiDecay);
    const pz1 = pStar * cosTheta;
    const rapidity = normal(0, 2);
    const ptBoost = exponential(15);
    const phiBoost = uniform(-Math.PI, Math.PI);
    const e1 = Math.sqrt(px1 ** 2 + py1 ** 2 + pz1 ** 2 + m1 ** 2);
    const e2 = Math.sqrt(px1 ** 2 + py1 ** 2 + pz1 ** 2 + m2 ** 2);
    const beta = Math.tanh(rapidity);
    const gamma = 1 / Math.sqrt(Math.max(1 - beta * beta, 1e-10));
    const boostX = ptBoost * Math.cos(phiBoost) * 0.5;
    const boostY = ptBoost * Math.sin(phiBoost) * 0.5;
    return [
      makeParticle(lep1, px1 + boostX, py1 + boostY, gamma * (pz1 + beta * e1)),
      makeParticle(lep2, -px1 + boostX, -py1 + boostY, gamma * (-pz1 + beta * e2))
    ];
  }

  function genJet(pt, phi, eta, nParticles) {
    const particles = [];
    for (let i = 0; i < nParticles; i++) {
      const pPt = pt * Math.min(exponential(0.3), 1);
      const pPhi = phi + normal(0, 0.15);
      const pEta = eta + normal(0, 0.15);
      const type = weightedChoice(["pion+", "pion-", "pion0", "kaon+", "kaon-", "proton"], [0.3, 0.3, 0.15, 0.08, 0.08, 0.09]);
      particles.push(makeParticle(type, pPt * Math.cos(pPhi), pPt * Math.sin(pPhi), pPt * Math.sinh(pEta)));
    }
    return particles;
  }

  function genSoftParticle() {
    const pt = exponential(0.8) + 0.2;
    const phi = uniform(-Math.PI, Math.PI);
    const eta = normal(0, 2.5);
    const type = weightedChoice(["pion+", "pion-", "pion0", "kaon+", "kaon-"], [0.35, 0.35, 0.15, 0.075, 0.075]);
    return makeParticle(type, pt * Math.cos(phi), pt * Math.sin(phi), pt * Math.sinh(eta));
  }

  function generateColliderEvent(eventType = "") {
    const selected = eventType || weightedChoice(["dimuon", "dielectron", "zpeak", "higgs_4l", "ttbar", "qcd_jets"], [0.2, 0.15, 0.25, 0.05, 0.15, 0.2]);
    let particles = [];
    let label = "";
    let description = "";

    if (selected === "dimuon") {
      const mass = rand() < 0.5 ? normal(91.2, 2.5) : exponential(20) + 10;
      particles = genLeptonPair("muon", "antimuon", Math.max(mass, 1));
      label = "Di-muon event";
      description = "Muon pair from Z/gamma* decay";
    } else if (selected === "dielectron") {
      particles = genLeptonPair("electron", "positron", Math.max(normal(91.2, 2.5), 1));
      label = "Di-electron event";
      description = "Electron pair from Z/Drell-Yan production";
    } else if (selected === "zpeak") {
      particles = rand() < 0.5 ? genLeptonPair("muon", "antimuon", normal(91.1876, 2.4952)) : genLeptonPair("electron", "positron", normal(91.1876, 2.4952));
      label = "Z boson decay";
      description = "Lepton pair near the 91 GeV Z mass";
    } else if (selected === "higgs_4l") {
      const mh = normal(125.1, 0.5);
      const mz1 = Math.min(normal(91.2, 2.5), mh - 12);
      const mz2 = uniform(12, mh - mz1);
      particles = rand() < 0.5
        ? [...genLeptonPair("muon", "antimuon", mz1), ...genLeptonPair("electron", "positron", mz2)]
        : [...genLeptonPair("electron", "positron", mz1), ...genLeptonPair("muon", "antimuon", mz2)];
      label = "Higgs candidate";
      description = "Four-lepton golden-channel topology";
    } else if (selected === "ttbar") {
      const ptL = exponential(40) + 20;
      const phiL = uniform(-Math.PI, Math.PI);
      const etaL = normal(0, 1.5);
      const pxL = ptL * Math.cos(phiL);
      const pyL = ptL * Math.sin(phiL);
      const pzL = ptL * Math.sinh(etaL);
      particles.push(makeParticle(rand() < 0.5 ? "muon" : "electron", pxL, pyL, pzL));
      particles.push(makeParticle("neutrino", -pxL * 0.8, -pyL * 0.6, pzL * 0.5));
      for (let i = 0; i < 2; i++) particles.push(...genJet(exponential(50) + 30, uniform(-Math.PI, Math.PI), normal(0, 1.2), 4 + Math.floor(rand() * 4)));
      for (let i = 0; i < 2; i++) particles.push(...genJet(exponential(35) + 20, uniform(-Math.PI, Math.PI), normal(0, 1.5), 3 + Math.floor(rand() * 3)));
      label = "Top quark pair";
      description = "Lepton, missing energy, and multiple jets";
    } else {
      const jets = 2 + Math.floor(rand() * 3);
      for (let i = 0; i < jets; i++) particles.push(...genJet(exponential(60) + 30, uniform(-Math.PI, Math.PI), normal(0, 1.5), 5 + Math.floor(rand() * 7)));
      label = "QCD multijet event";
      description = "Hadron sprays from quark/gluon scattering";
    }

    const softCount = 5 + Math.floor(rand() * 15);
    for (let i = 0; i < softCount; i++) particles.push(genSoftParticle());
    particles.forEach((particle) => {
      particle.track = generateTrackPoints(particle);
    });

    const totalEnergy = particles.reduce((sum, particle) => sum + particle.energy, 0);
    const metX = -particles.filter((particle) => particle.type !== "neutrino").reduce((sum, particle) => sum + particle.px, 0);
    const metY = -particles.filter((particle) => particle.type !== "neutrino").reduce((sum, particle) => sum + particle.py, 0);

    return {
      type: selected,
      label,
      description,
      particles,
      totalEnergy,
      met: Math.hypot(metX, metY)
    };
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.floor(window.innerWidth);
    height = Math.floor(window.innerHeight);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spectrum.width = Math.floor(spectrum.clientWidth * dpr);
    spectrum.height = Math.floor(spectrum.clientHeight * dpr);
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function reset() {
    rand = mulberry32(randomSeed());
    eventCount = 0;
    time = 0;
    stars = [];
    waves = [];
    events = [];
    quantumDisturbances = [];
    entropyFronts = [];
    histogram = histogram.map(() => 0);

    const count = Math.max(620, Math.min(1200, Math.floor((width * height) / 1300)));
    for (let i = 0; i < count; i++) {
      const arm = Math.floor(rand() * 5);
      const radius = Math.pow(rand(), 0.58);
      const angle = arm * Math.PI * 0.4 + radius * 6.2 + (rand() - 0.5) * 0.72;
      stars.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius * 0.72,
        z: rand(),
        vx: (rand() - 0.5) * 0.0009,
        vy: (rand() - 0.5) * 0.0009,
        mass: 0.4 + rand() * 2.5,
        hue: rand(),
        phase: rand() * Math.PI * 2
      });
    }
    updateReadouts();
  }

  function value(name) {
    return Number(controls[name].value) / 100;
  }

  function expansionFactor() {
    return 0.7 + value("expansion") * 0.72;
  }

  function syncControlLabels() {
    Object.keys(controls).forEach((key) => {
      outputs[key].value = controls[key].value;
      outputs[key].textContent = controls[key].value;
    });
  }

  function setMode(nextMode) {
    mode = nextMode;
    tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
    modeKicker.textContent = modeCopy[mode][0];
    modeTitle.textContent = modeCopy[mode][1];
    if (mode === "collider") {
      seedColliderEvent();
    }
    updateReadouts();
  }

  function colorForStar(star, alpha) {
    const palette = [
      [164, 224, 235],
      [214, 177, 102],
      [198, 111, 125],
      [157, 181, 145],
      [171, 158, 196]
    ];
    const c = palette[Math.floor(star.hue * palette.length) % palette.length];
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`;
  }

  function drawBackground() {
    const gradient = ctx.createRadialGradient(width * 0.5, height * 0.52, 0, width * 0.5, height * 0.52, Math.max(width, height) * 0.72);
    gradient.addColorStop(0, "#111113");
    gradient.addColorStop(0.48, "#050607");
    gradient.addColorStop(1, "#010101");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.32;
    for (let i = 0; i < 90; i++) {
      const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * width;
      const y = (Math.cos(i * 47.3) * 0.5 + 0.5) * height;
      const pulse = 0.45 + Math.sin(time * 0.001 + i) * 0.35;
      ctx.fillStyle = `rgba(238, 232, 220, ${0.08 + pulse * 0.12})`;
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
  }

  function project(star, epoch, expansion) {
    const scale = Math.min(width, height) * (0.24 + expansion * 0.31);
    const depth = 0.55 + star.z * 0.85;
    const parallax = 1 / depth;
    return {
      x: width * 0.5 + star.x * scale * parallax,
      y: height * 0.53 + star.y * scale * parallax,
      r: Math.max(0.55, star.mass * (0.65 + epoch * 1.4) * parallax),
      depth
    };
  }

  function updateStars(dt) {
    const epoch = value("epoch");
    const expansion = value("expansion");
    const quantum = value("quantum");
    const gravity = value("gravity");
    const spin = 0.00018 + expansion * 0.00075;
    const px = (pointer.x - 0.5) * 2;
    const py = (pointer.y - 0.5) * 2;

    for (const star of stars) {
      const r2 = star.x * star.x + star.y * star.y + 0.015;
      const pull = pointer.down ? gravity * pointer.energy * 0.0014 / r2 : 0;
      const q = (rand() - 0.5) * quantum * 0.003;
      const cos = Math.cos(spin * dt * 60);
      const sin = Math.sin(spin * dt * 60);
      const x = star.x * cos - star.y * sin;
      const y = star.x * sin + star.y * cos;
      star.x = x + star.vx * dt * 60 + (px - star.x) * pull + q;
      star.y = y + star.vy * dt * 60 + (py - star.y) * pull + q * 0.72;
      star.z += (expansion - 0.5) * 0.00012 * dt * 60;
      if (star.z > 1.2) star.z = 0.02;
      if (star.z < 0.01) star.z = 1.1;

      const bound = 1.65 + epoch * 0.55;
      if (Math.abs(star.x) > bound || Math.abs(star.y) > bound) {
        star.x *= -0.74;
        star.y *= -0.74;
      }
    }
  }

  function drawCosmos() {
    const epoch = value("epoch");
    const expansion = value("expansion");
    const points = stars.map((star) => [star, project(star, epoch, expansion)]);

    ctx.lineWidth = 1;
    for (let i = 0; i < points.length; i += 3) {
      const a = points[i][1];
      for (let j = i + 6; j < points.length; j += 19) {
        const b = points[j][1];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 88) {
          ctx.strokeStyle = `rgba(164, 224, 235, ${Math.max(0, 0.14 - dist / 820)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const [star, p] of points) {
      const flicker = 0.56 + Math.sin(time * 0.0015 + star.phase) * 0.22;
      ctx.fillStyle = colorForStar(star, 0.58 + flicker * 0.38);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    drawCore(width * 0.5, height * 0.53, 72 + expansion * 72, "rgba(214, 177, 102, 0.18)");
  }

  function drawQuantum() {
    const quantum = value("quantum");
    const gravity = value("gravity");
    const expansion = expansionFactor();
    const cell = Math.max(14, Math.min(30, width / (52 + expansion * 8)));
    const cols = Math.ceil(width / cell) + 1;
    const rows = Math.ceil(height / cell) + 1;
    quantumDisturbances = quantumDisturbances
      .map((burst) => ({ ...burst, age: burst.age + 0.016, radius: burst.radius + burst.speed }))
      .filter((burst) => burst.age < 4.8);

    for (const burst of quantumDisturbances) {
      const fade = Math.max(0, 1 - burst.age / 4.8);
      drawCore(burst.x, burst.y, burst.radius * 1.4, `rgba(${burst.color}, ${0.08 * fade})`);
      ctx.strokeStyle = `rgba(${burst.color}, ${0.28 * fade})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, burst.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, burst.radius * 0.54, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const sx = x * cell;
        const sy = y * cell;
        let warp = 0;
        let brightness = 0.12;
        for (const burst of quantumDisturbances) {
          const dx = sx - burst.x;
          const dy = sy - burst.y;
          const dist = Math.sqrt(dx * dx + dy * dy) + 1;
          const wave = Math.sin(dist * 0.045 - burst.age * 8.5);
          const force = Math.exp(-dist / (150 + burst.radius * 0.5)) * burst.strength;
          warp += wave * force * 3.2;
          brightness += force * 0.55;
        }
        const n = Math.sin(x * 0.83 + time * 0.0021) + Math.cos(y * 0.71 - time * 0.0019);
        const angle = n + quantum * 4 + gravity + warp;
        const len = cell * (0.22 + Math.abs(Math.sin(n + warp)) * (0.38 + quantum * 0.5));
        ctx.strokeStyle = n + warp > 0
          ? `rgba(164, 224, 235, ${Math.min(0.58, brightness + quantum * 0.14)})`
          : `rgba(198, 111, 125, ${Math.min(0.48, brightness + quantum * 0.1)})`;
        ctx.beginPath();
        ctx.moveTo(sx - Math.cos(angle) * len, sy - Math.sin(angle) * len);
        ctx.lineTo(sx + Math.cos(angle) * len, sy + Math.sin(angle) * len);
        ctx.stroke();
      }
    }

    const particleCount = Math.floor(140 + quantum * 180 + quantumDisturbances.length * 34);
    for (let i = 0; i < particleCount; i++) {
      const source = quantumDisturbances[i % Math.max(1, quantumDisturbances.length)];
      const t = time * 0.001 + i * 0.77;
      const orbit = source
        ? {
            x: source.x + Math.cos(t * (1.2 + source.strength) + i) * source.radius * (0.32 + rand() * 0.48),
            y: source.y + Math.sin(t * (1.1 + source.strength) + i) * source.radius * (0.24 + rand() * 0.44)
          }
        : {
            x: (rand() * width + Math.sin(time * 0.001 + i) * 40) % width,
            y: (rand() * height + Math.cos(time * 0.0012 + i) * 40) % height
          };
      const r = 0.7 + rand() * (1.8 + quantum * 3.4);
      ctx.fillStyle = rand() > 0.5 ? "rgba(171, 158, 196, 0.46)" : "rgba(157, 181, 145, 0.42)";
      ctx.beginPath();
      ctx.arc(orbit.x, orbit.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function seedVisualEvent(kind = "burst") {
    eventCount += 1;
    const x = pointer.x * width || width * (0.35 + rand() * 0.3);
    const y = pointer.y * height || height * (0.42 + rand() * 0.2);
    const tracks = [];
    const count = kind === "collapse" ? 24 : 12 + Math.floor(rand() * 20);
    for (let i = 0; i < count; i++) {
      const charge = rand() > 0.5 ? 1 : -1;
      tracks.push({
        angle: (i / count) * Math.PI * 2 + rand() * 0.34,
        speed: 1.6 + rand() * 4.2,
        charge,
        energy: 0.45 + rand() * 1.3,
        hue: rand(),
        life: 1
      });
    }
    events.push({ x, y, age: 0, tracks, kind });
    if (audio) pingAudio(kind);
  }

  function seedColliderEvent(kind = "physics") {
    eventCount += 1;
    const event = generateColliderEvent(colliderEventSelect.value);
    event.x = Number.isFinite(pointer.x) ? pointer.x * width : width * 0.5;
    event.y = Number.isFinite(pointer.y) ? pointer.y * height : height * 0.54;
    event.age = 0;
    event.viewAngle = rand() * Math.PI * 2;
    event.serial = eventCount;
    event.kind = kind;
    const recentPhysics = events.filter((item) => item.particles && item.age < 7).slice(-2);
    events = [...recentPhysics, event];
    modeKicker.textContent = event.label;
    modeTitle.textContent = `Event ${event.serial} | ${event.particles.length} particles | E ${event.totalEnergy.toFixed(1)} GeV | MET ${event.met.toFixed(1)} GeV`;
    if (audio) pingAudio(kind);
    updateReadouts();
  }

  function seedEvent(kind = "burst") {
    if (mode === "collider") {
      seedColliderEvent(kind);
      return;
    }
    seedVisualEvent(kind);
  }

  function drawCollider(dt) {
    const physicsEvents = events.filter((event) => event.particles);
    if (physicsEvents.length === 0) {
      seedColliderEvent();
      return;
    }

    for (const event of physicsEvents) {
      event.age += dt;
      const eventAlpha = Math.max(0, 1 - Math.max(0, event.age - 5.2) / 2.4);
      const reveal = Math.min(1, event.age / 1.8);
      const colliderScale = expansionFactor();
      drawDetector(event.x, event.y, eventAlpha, colliderScale);
      drawColliderBirth(event, reveal, eventAlpha, colliderScale);

      const scale = Math.min(width, height) * 0.054 * colliderScale;
      for (const particle of event.particles) {
        if (particle.type === "neutrino") {
          drawMissingEnergy(event, particle, scale, reveal, eventAlpha, colliderScale);
          continue;
        }
        drawParticleTrack(event, particle, scale, reveal, eventAlpha);
      }
    }
    events = events.filter((event) => !event.particles || event.age < 8);
  }

  function drawColliderBirth(event, reveal, eventAlpha, colliderScale) {
    const cx = event.x;
    const cy = event.y;
    const flash = Math.max(0, 1 - event.age / 1.1);
    drawCore(cx, cy, (24 + event.age * 18) * colliderScale, `rgba(214, 177, 102, ${(0.18 + flash * 0.18) * eventAlpha})`);
    if (flash <= 0) return;

    ctx.strokeStyle = `rgba(238, 232, 220, ${0.42 * flash * eventAlpha})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (22 + i * 22 + event.age * 42) * colliderScale, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.strokeStyle = `rgba(164, 224, 235, ${0.34 * flash * eventAlpha})`;
    ctx.beginPath();
    ctx.moveTo(cx - Math.min(width, height) * 0.36 * colliderScale, cy);
    ctx.lineTo(cx + Math.min(width, height) * 0.36 * colliderScale, cy);
    ctx.stroke();
  }

  function projectTrackPoint(point, scale, angle = 0) {
    const [x, y, z] = point;
    const rx = x * Math.cos(angle) - y * Math.sin(angle);
    const ry = x * Math.sin(angle) + y * Math.cos(angle);
    const ox = Number.isFinite(currentProjectionOrigin.x) ? currentProjectionOrigin.x : width * 0.5;
    const oy = Number.isFinite(currentProjectionOrigin.y) ? currentProjectionOrigin.y : height * 0.54;
    return {
      x: ox + (rx - z * 0.08) * scale,
      y: oy + (ry + z * 0.05) * scale
    };
  }

  let currentProjectionOrigin = { x: 0, y: 0 };

  function drawParticleTrack(event, particle, scale, reveal, eventAlpha) {
    const track = particle.track;
    if (!track || track.length < 2) return;
    const visibleCount = Math.max(2, Math.floor(track.length * reveal));
    const alpha = (particle.pt > 20 ? 0.92 : 0.48 + Math.min(particle.pt / 40, 0.28)) * eventAlpha;
    ctx.strokeStyle = `rgba(${particle.color}, ${alpha})`;
    ctx.lineWidth = Math.min(4.2, 0.75 + Math.sqrt(Math.max(particle.pt, 0.1)) * 0.24);
    ctx.beginPath();
    currentProjectionOrigin = { x: event.x, y: event.y };
    for (let i = 0; i < visibleCount; i++) {
      const p = projectTrackPoint(track[i], scale, event.viewAngle);
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    const end = projectTrackPoint(track[visibleCount - 1], scale, event.viewAngle);
    const marker = Math.min(8, 2.2 + particle.pt * 0.035);
    ctx.fillStyle = `rgba(${particle.color}, ${Math.min(0.95, alpha + 0.1)})`;
    ctx.beginPath();
    ctx.arc(end.x, end.y, marker, 0, Math.PI * 2);
    ctx.fill();

    if (reveal >= 0.98) {
      drawDetectorDeposit(particle, end, marker, eventAlpha);
    }
  }

  function drawDetectorDeposit(particle, end, marker, eventAlpha) {
    const stop = PARTICLES[particle.type].stop;
    const shower = stop === "ecal" || stop === "hcal";
    const ringAlpha = (shower ? 0.38 : 0.2) * eventAlpha;
    const radius = shower ? marker * (2.6 + Math.min(particle.energy / 70, 1.4)) : marker * 1.8;

    ctx.strokeStyle = `rgba(${particle.color}, ${ringAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(end.x, end.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    if (shower) {
      drawCore(end.x, end.y, radius * 2.6, `rgba(${particle.color}, ${0.1 * eventAlpha})`);
      for (let i = 0; i < 7; i++) {
        const a = particle.phi + i * 2.399 + time * 0.0007;
        const r = radius * (0.35 + (i % 4) * 0.22);
        ctx.fillStyle = `rgba(${particle.color}, ${(0.18 + (i % 3) * 0.05) * eventAlpha})`;
        ctx.beginPath();
        ctx.arc(end.x + Math.cos(a) * r, end.y + Math.sin(a) * r, Math.max(1, marker * 0.28), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (stop === "muon") {
      ctx.strokeStyle = `rgba(${particle.color}, ${0.22 * eventAlpha})`;
      ctx.beginPath();
      ctx.moveTo(end.x - marker * 1.8, end.y);
      ctx.lineTo(end.x + marker * 1.8, end.y);
      ctx.moveTo(end.x, end.y - marker * 1.8);
      ctx.lineTo(end.x, end.y + marker * 1.8);
      ctx.stroke();
    }
  }

  function drawMissingEnergy(event, particle, scale, reveal, eventAlpha, colliderScale) {
    if (reveal < 0.6) return;
    const phi = particle.phi + event.viewAngle;
    const length = Math.min(width, height) * 0.22 * colliderScale;
    const x0 = event.x;
    const y0 = event.y;
    const x1 = x0 + Math.cos(phi) * length;
    const y1 = y0 + Math.sin(phi) * length;
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = `rgba(238, 232, 220, ${0.38 * eventAlpha})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawDetector(cx, cy, alpha = 1, colliderScale = 1) {
    const radii = [70, 128, 190, 260, 340];
    ctx.lineWidth = 1;
    for (let i = 0; i < radii.length; i++) {
      const r = radii[i] * Math.min(width, height) / 840 * colliderScale;
      ctx.strokeStyle = i % 2 ? `rgba(164, 224, 235, ${0.2 * alpha})` : `rgba(214, 177, 102, ${0.18 * alpha})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r * 1.46, r, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(238, 232, 220, ${0.1 * alpha})`;
    ctx.beginPath();
    ctx.moveTo(cx - Math.min(width, height) * 0.46 * colliderScale, cy);
    ctx.lineTo(cx + Math.min(width, height) * 0.46 * colliderScale, cy);
    ctx.moveTo(cx, cy - Math.min(width, height) * 0.32 * colliderScale);
    ctx.lineTo(cx, cy + Math.min(width, height) * 0.32 * colliderScale);
    ctx.stroke();
  }

  function drawEntropy() {
    const epoch = value("epoch");
    const quantum = value("quantum");
    const expansion = value("expansion");
    const gravity = value("gravity");
    entropyFronts = entropyFronts
      .map((front) => ({ ...front, age: front.age + 0.016, radius: front.radius + front.speed * (0.62 + expansion * 0.18) }))
      .filter((front) => front.age < 3.2);

    for (const front of entropyFronts) {
      const fade = Math.max(0, 1 - front.age / 3.2);
      drawCore(front.x, front.y, front.radius * 0.72, `rgba(${front.color}, ${0.032 * fade})`);
      ctx.strokeStyle = `rgba(${front.color}, ${0.16 * fade})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(front.x, front.y, front.radius * 1.55, front.radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    const cx = width * 0.5;
    const horizon = height * 0.24;
    const base = height * 0.8;
    const gridX = 26;
    const gridZ = 22;
    const worldW = Math.min(width * (0.5 + expansion * 0.16), width * 0.78);
    const depth = height * (0.42 + expansion * 0.09);
    const isoSkew = Math.min(width, height) * 0.18;
    const amp = height * (0.032 + epoch * 0.068 + quantum * 0.062);
    const rows = [];

    function surfacePoint(ix, iz) {
      const nx = (ix / (gridX - 1) - 0.5) * 2;
      const nz = iz / (gridZ - 1);
      const perspective = 0.58 + nz * 0.36;
      const sx = cx + nx * worldW * 0.5 * perspective + (nz - 0.5) * isoSkew;
      const sy = horizon + nz * depth + Math.abs(nx) * Math.min(width, height) * 0.045;
      let energy = Math.sin(nx * 5.2 + time * 0.0014) * Math.cos(nz * 7.1 - time * 0.0011);
      energy += Math.sin((nx + nz) * 8.4 + time * 0.0018) * quantum;

      for (const front of entropyFronts) {
        const dx = sx - front.x;
        const dy = sy - front.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const ring = Math.exp(-Math.abs(dist - front.radius) / 58);
        const wake = Math.exp(-dist / 260);
        energy += (ring * 2.1 + wake * 0.7) * front.intensity;
      }

      const lift = energy * amp * perspective;
      return { x: sx, y: sy - lift, baseY: sy, energy, perspective, nx, nz };
    }

    for (let z = 0; z < gridZ; z++) {
      const row = [];
      for (let x = 0; x < gridX; x++) row.push(surfacePoint(x, z));
      rows.push(row);
    }

    ctx.lineWidth = 1;
    for (let z = gridZ - 1; z >= 0; z--) {
      ctx.beginPath();
      for (let x = 0; x < gridX; x++) {
        const p = rows[z][x];
        if (x === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = `rgba(164, 224, 235, ${0.08 + z / gridZ * 0.18})`;
      ctx.stroke();
    }

    for (let x = 0; x < gridX; x += 2) {
      ctx.beginPath();
      for (let z = 0; z < gridZ; z++) {
        const p = rows[z][x];
        if (z === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = "rgba(214, 177, 102, 0.08)";
      ctx.stroke();
    }

    for (let z = gridZ - 2; z >= 2; z -= 2) {
      for (let x = 2; x < gridX - 2; x += 3) {
        const p = rows[z][x];
        const height3d = Math.max(0, Math.abs(p.energy)) * amp * 1.5 * p.perspective;
        if (height3d < 4) continue;
        const color = p.energy > 0 ? "214, 177, 102" : "164, 224, 235";
        ctx.strokeStyle = `rgba(${color}, ${Math.min(0.46, 0.13 + Math.abs(p.energy) * 0.12)})`;
        ctx.lineWidth = Math.max(1, 1.8 * p.perspective);
        ctx.beginPath();
        ctx.moveTo(p.x, p.baseY);
        ctx.lineTo(p.x, p.y - height3d * 0.42);
        ctx.stroke();
        ctx.fillStyle = `rgba(${color}, ${Math.min(0.62, 0.16 + Math.abs(p.energy) * 0.13)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y - height3d * 0.42, 1.2 + p.perspective * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const flowCount = Math.floor(220 + entropyFronts.length * 45 + expansion * 55);
    for (let i = 0; i < flowCount; i++) {
      const z = (i * 0.618 + time * 0.000035) % 1;
      const lane = Math.sin(i * 12.989) * 0.5 + 0.5;
      const perspective = 0.58 + z * 0.36;
      const xBase = cx + (lane - 0.5) * worldW * perspective + (z - 0.5) * isoSkew;
      const yBase = horizon + z * depth + Math.abs(lane - 0.5) * Math.min(width, height) * 0.09;
      let lift = Math.sin(i * 0.73 + time * 0.002) * amp * 0.55 * perspective;
      let x = xBase + Math.sin(time * 0.001 + i) * 12 * perspective;
      let y = yBase - lift;
      for (const front of entropyFronts) {
        const dx = x - front.x;
        const dy = y - front.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const push = Math.exp(-dist / (front.radius + 120)) * front.intensity * (0.42 + gravity * 0.45);
        x += (dx / dist) * push * 24;
        y += (dy / dist) * push * 18;
      }
      const heat = i / flowCount;
      ctx.fillStyle = heat < 0.5 ? "rgba(157, 181, 145, 0.34)" : "rgba(171, 158, 196, 0.32)";
      ctx.beginPath();
      ctx.arc(x, y, 0.9 + perspective * 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCore(x, y, r, color) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const center = color.replace(/,\s*[\d.]+\)$/, ", 0.42)");
    g.addColorStop(0, center);
    g.addColorStop(0.36, color);
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWaves(dt) {
    waves = waves.filter((wave) => wave.life > 0);
    for (const wave of waves) {
      wave.r += wave.speed * dt * 60;
      wave.life -= dt * 1.05;
      ctx.strokeStyle = `rgba(${wave.color}, ${Math.max(0, wave.life)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.r, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function addWave(x, y, color = "164, 224, 235") {
    waves.push({ x, y, r: 6, speed: 2.1 + rand() * 2.8, life: 0.38, color });
  }

  function addModeImpulse(x, y, strength = 1) {
    if (mode === "quantum") {
      quantumDisturbances.push({
        x,
        y,
        age: 0,
        radius: 18 + rand() * 24,
        speed: 2.4 + rand() * 3.5 + value("expansion") * 1.2,
        strength: strength * (0.8 + value("quantum") * 1.4),
        color: rand() > 0.5 ? "164, 224, 235" : "198, 111, 125"
      });
      quantumDisturbances = quantumDisturbances.slice(-9);
    }

    if (mode === "entropy") {
      entropyFronts.push({
        x,
        y,
        age: 0,
        radius: 16 + rand() * 18,
        speed: 1.65 + rand() * 2 + value("expansion") * 0.8,
        intensity: strength * (0.42 + value("quantum") * 0.55 + value("gravity") * 0.28),
        color: rand() > 0.46 ? "214, 177, 102" : "198, 111, 125"
      });
      entropyFronts = entropyFronts.slice(-6);
    }
  }

  function drawSpectrum() {
    const w = spectrum.clientWidth;
    const h = spectrum.clientHeight;
    sctx.clearRect(0, 0, w, h);
    sctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    sctx.fillRect(0, 0, w, h);
    const bars = 56;
    for (let i = 0; i < bars; i++) {
      const mix = i / bars;
      const amp = Math.abs(Math.sin(time * 0.002 + i * 0.42) * Math.cos(time * 0.0013 + i * 0.21));
      const barH = 8 + amp * h * (0.26 + value("quantum") * 0.55);
      const x = i * (w / bars);
      const barW = Math.max(2, w / bars - 2);
      sctx.fillStyle = mix < 0.25 ? "rgba(164, 224, 235, 0.72)" : mix < 0.5 ? "rgba(157, 181, 145, 0.62)" : mix < 0.75 ? "rgba(214, 177, 102, 0.72)" : "rgba(198, 111, 125, 0.64)";
      sctx.fillRect(x, h - barH, barW, barH);
    }
  }

  function updateReadouts() {
    const epoch = value("epoch");
    const expansion = value("expansion");
    const quantum = value("quantum");
    const gravity = value("gravity");
    const age = Math.max(0.01, 13.8 * epoch);
    const redshift = Math.max(0.01, (1 - epoch) * 9.4 + expansion * 0.38);
    const entropy = Math.min(0.99, 0.22 + epoch * 0.55 + quantum * 0.18 + eventCount * 0.006);
    const coherence = Math.max(0.02, 1 - entropy * 0.72 + gravity * 0.12);
    const cmb = 2.725 * (1 + redshift);
    const colliderEvent = mode === "collider" ? [...events].reverse().find((event) => event.particles) : null;

    metrics.age.textContent = `${age.toFixed(age < 1 ? 2 : 1)} Gy`;
    metrics.cmb.textContent = `${cmb.toFixed(cmb > 20 ? 1 : 2)} K`;
    metrics.entropy.textContent = entropy.toFixed(2);
    metrics.particles.textContent = String(colliderEvent ? colliderEvent.particles.length : stars.length);
    metrics.events.textContent = String(eventCount);
    metrics.redshiftLabel.textContent = colliderEvent ? "Energy" : "Redshift";
    metrics.coherenceLabel.textContent = colliderEvent ? "MET" : "Coherence";
    metrics.redshift.textContent = colliderEvent ? `${colliderEvent.totalEnergy.toFixed(0)} GeV` : redshift.toFixed(2);
    metrics.coherence.textContent = colliderEvent ? `${colliderEvent.met.toFixed(1)} GeV` : coherence.toFixed(2);
  }

  function animate(now) {
    const dt = Math.min(0.05, (now - time) / 1000 || 0.016);
    time = now;
    if (!paused) {
      updateStars(dt);
      if (audio) updateAudio();
    }

    drawBackground();
    if (mode === "cosmos") drawCosmos();
    if (mode === "quantum") drawQuantum();
    if (mode === "collider") drawCollider(dt);
    if (mode === "entropy") drawEntropy();
    drawWaves(dt);
    drawSpectrum();
    if (Math.floor(now / 250) !== Math.floor((now - dt * 1000) / 250)) {
      updateReadouts();
    }
    pointer.energy *= 0.92;
    requestAnimationFrame(animate);
  }

  function initAudio() {
    if (audio) {
      audio.context.close();
      audio = null;
      btnAudio.setAttribute("aria-pressed", "false");
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const master = context.createGain();
    const low = context.createOscillator();
    const high = context.createOscillator();
    const filter = context.createBiquadFilter();
    low.type = "sine";
    high.type = "triangle";
    low.frequency.value = 54;
    high.frequency.value = 144;
    filter.type = "lowpass";
    filter.frequency.value = 680;
    master.gain.value = 0.045;
    low.connect(filter);
    high.connect(filter);
    filter.connect(master);
    master.connect(context.destination);
    low.start();
    high.start();
    audio = { context, master, low, high, filter };
    btnAudio.setAttribute("aria-pressed", "true");
  }

  function ensureAudio() {
    if (!audio) {
      initAudio();
    } else if (audio.context.state === "suspended") {
      audio.context.resume();
    }
    return audio;
  }

  function updateAudio() {
    const t = audio.context.currentTime;
    audio.low.frequency.setTargetAtTime(42 + value("gravity") * 72, t, 0.08);
    audio.high.frequency.setTargetAtTime(110 + value("quantum") * 340 + eventCount * 1.4, t, 0.08);
    audio.filter.frequency.setTargetAtTime(360 + value("expansion") * 1600, t, 0.08);
    audio.master.gain.setTargetAtTime(0.035 + pointer.energy * 0.03, t, 0.06);
  }

  function pingAudio(kind) {
    const context = audio.context;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = kind === "collapse" ? "sawtooth" : "sine";
    osc.frequency.value = kind === "collapse" ? 84 : 220 + rand() * 360;
    gain.gain.value = 0.08;
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start();
    osc.stop(context.currentTime + 0.48);
  }

  function playBhairaviClick(xNorm = 0.5, yNorm = 0.5, force = 1) {
    const engine = ensureAudio();
    if (!engine) return;

    const context = engine.context;
    const now = context.currentTime;
    const tonic = 65.41;
    const bhairavi = [1, 16 / 15, 6 / 5, 4 / 3, 3 / 2, 8 / 5, 9 / 5, 2];
    const contour = yNorm < 0.45 ? [0, 2, 3, 2, 1, 0] : [0, 1, 2, 4, 3, 2, 0];
    const octave = xNorm > 0.66 ? 2 : 1;
    const phraseGain = context.createGain();
    const phraseFilter = context.createBiquadFilter();
    phraseFilter.type = "lowpass";
    phraseFilter.frequency.setValueAtTime(520 + value("quantum") * 900, now);
    phraseGain.gain.setValueAtTime(0.0001, now);
    phraseGain.gain.exponentialRampToValueAtTime(0.68 * force, now + 0.035);
    phraseGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.65);
    phraseFilter.connect(phraseGain);
    phraseGain.connect(engine.master);

    contour.forEach((degree, index) => {
      const osc = context.createOscillator();
      const noteGain = context.createGain();
      const start = now + index * 0.145;
      const duration = 0.32 + index * 0.018;
      const freq = tonic * octave * bhairavi[degree];
      osc.type = index % 2 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq * 0.992, start);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.006, start + duration);
      noteGain.gain.setValueAtTime(0.0001, start);
      noteGain.gain.exponentialRampToValueAtTime(0.36, start + 0.026);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(noteGain);
      noteGain.connect(phraseFilter);
      osc.start(start);
      osc.stop(start + duration + 0.04);
    });

    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.18), context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const decay = 1 - i / data.length;
      data[i] = (rand() * 2 - 1) * decay * decay;
    }
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = noiseBuffer;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 110 + xNorm * 540;
    noiseFilter.Q.value = 1.8;
    noiseGain.gain.setValueAtTime(0.28 * force, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(engine.master);
    noise.start(now);
    noise.stop(now + 0.2);
  }

  function collapse() {
    const cx = pointer.x * width || width * 0.5;
    const cy = pointer.y * height || height * 0.5;
    for (const star of stars) {
      const p = project(star, value("epoch"), value("expansion"));
      star.x += ((cx - p.x) / width) * 0.22;
      star.y += ((cy - p.y) / height) * 0.22;
      star.vx *= -0.55;
      star.vy *= -0.55;
    }
    addWave(cx, cy, "198, 111, 125");
    seedEvent("collapse");
  }

  Object.entries(controls).forEach(([key, input]) => {
    input.addEventListener("input", () => {
      outputs[key].textContent = input.value;
      updateReadouts();
    });
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
  });

  btnSeed.addEventListener("click", () => seedEvent());
  btnCollapse.addEventListener("click", collapse);
  btnAudio.addEventListener("click", initAudio);
  btnReset.addEventListener("click", reset);
  colliderEventSelect.addEventListener("change", () => {
    if (mode === "collider") seedColliderEvent();
  });

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    pointer.down = true;
    pointer.energy = 1;
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
    addWave(event.clientX, event.clientY);
    addModeImpulse(event.clientX, event.clientY, 1.15);
    playBhairaviClick(pointer.x, pointer.y, mode === "collider" ? 1.2 : 0.85);
    if (mode === "collider") seedEvent();
  });

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
    if (pointer.down) {
      pointer.energy = Math.min(1, pointer.energy + 0.08);
      if (rand() < 0.12) addWave(event.clientX, event.clientY, "157, 181, 145");
      if ((mode === "quantum" || mode === "entropy") && rand() < 0.28) {
        addModeImpulse(event.clientX, event.clientY, 0.42);
      }
    }
  });

  window.addEventListener("pointerup", () => {
    pointer.down = false;
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "1") setMode("cosmos");
    if (event.key === "2") setMode("quantum");
    if (event.key === "3") setMode("collider");
    if (event.key === "4") setMode("entropy");
    if (event.key.toLowerCase() === "c") collapse();
    if (event.key.toLowerCase() === "r") reset();
    if (event.code === "Space") {
      paused = !paused;
      event.preventDefault();
    }
  });

  window.addEventListener("resize", () => {
    resize();
    reset();
  });

  resize();
  syncControlLabels();
  reset();
  setMode("cosmos");
  requestAnimationFrame(animate);
})();
