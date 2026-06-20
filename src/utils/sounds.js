let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

export function playLaunchSound() {
  const ac = getCtx();
  const duration = 3.5;

  // Rumble — low frequency noise
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(80, ac.currentTime);
  filter.frequency.linearRampToValueAtTime(400, ac.currentTime + duration);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.6, ac.currentTime + 0.3);
  gain.gain.linearRampToValueAtTime(1.0, ac.currentTime + 1.5);
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  source.start();
  source.stop(ac.currentTime + duration);

  // Whoosh — rising tone
  const osc = ac.createOscillator();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(40, ac.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + duration);

  const oscGain = ac.createGain();
  oscGain.gain.setValueAtTime(0, ac.currentTime);
  oscGain.gain.linearRampToValueAtTime(0.15, ac.currentTime + 0.5);
  oscGain.gain.linearRampToValueAtTime(0, ac.currentTime + duration);

  const oscFilter = ac.createBiquadFilter();
  oscFilter.type = 'bandpass';
  oscFilter.frequency.setValueAtTime(200, ac.currentTime);

  osc.connect(oscFilter);
  oscFilter.connect(oscGain);
  oscGain.connect(ac.destination);
  osc.start();
  osc.stop(ac.currentTime + duration);
}

export function playRefuelSound() {
  const ac = getCtx();
  const duration = 4.5;

  // Liquid fill — filtered noise with gentle bubbling LFO
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(600, ac.currentTime);
  filter.Q.value = 2;

  // LFO for bubbling effect
  const lfo = ac.createOscillator();
  lfo.frequency.value = 4;
  const lfoGain = ac.createGain();
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  lfo.start();
  lfo.stop(ac.currentTime + duration);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(0, ac.currentTime);
  gain.gain.linearRampToValueAtTime(0.25, ac.currentTime + 0.4);
  gain.gain.setValueAtTime(0.25, ac.currentTime + duration - 0.5);
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  source.start();
  source.stop(ac.currentTime + duration);
}