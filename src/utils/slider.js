export function updateSliderTrack(sliderEl, min, max) {
    if(!sliderEl) return;
    const pct = ((parseFloat(sliderEl.value) - min) / (max - min)) * 100;
    sliderEl.style.setProperty('--pct', `${pct}%`);
}
