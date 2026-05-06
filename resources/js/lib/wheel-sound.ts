/**
 * Synthesise tick + fanfare sounds via the WebAudio API. Avoids shipping any
 * binary assets, and lets each tick line up exactly with a wedge crossing the
 * pointer.
 */

let ctx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!ctx) {
        const Ctor =
            window.AudioContext ??
            (window as unknown as { webkitAudioContext?: typeof AudioContext })
                .webkitAudioContext;
        if (!Ctor) return null;
        ctx = new Ctor();
    }
    if (ctx.state === 'suspended') {
        void ctx.resume();
    }
    return ctx;
};

export const playTick = (volume = 0.18): void => {
    const ac = getContext();
    if (!ac) return;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, ac.currentTime + 0.04);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.06);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.07);
};

export const playFanfare = (volume = 0.25): void => {
    const ac = getContext();
    if (!ac) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
        const t = ac.currentTime + i * 0.12;
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
        osc.connect(gain).connect(ac.destination);
        osc.start(t);
        osc.stop(t + 0.5);
    });
};

export const playImpact = (volume = 0.22): void => {
    const ac = getContext();
    if (!ac) return;

    const now = ac.currentTime;

    // Low thump layer.
    const thump = ac.createOscillator();
    const thumpGain = ac.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(180, now);
    thump.frequency.exponentialRampToValueAtTime(62, now + 0.14);
    thumpGain.gain.setValueAtTime(volume * 0.9, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    thump.connect(thumpGain).connect(ac.destination);
    thump.start(now);
    thump.stop(now + 0.22);

    // Short bright click layer.
    const click = ac.createOscillator();
    const clickGain = ac.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(2200, now);
    click.frequency.exponentialRampToValueAtTime(700, now + 0.045);
    clickGain.gain.setValueAtTime(volume * 0.4, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    click.connect(clickGain).connect(ac.destination);
    click.start(now);
    click.stop(now + 0.07);
};
