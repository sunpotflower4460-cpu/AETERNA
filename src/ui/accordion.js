export function toggleAccordion(contentId, iconId) {
    const content = document.getElementById(contentId);
    const icon = document.getElementById(iconId);
    if (content && icon) {
        if (content.classList.contains('collapsed')) {
            content.classList.remove('collapsed');
            icon.style.transform = 'rotate(0deg)';
            icon.classList.remove('collapsed-icon');
        } else {
            content.classList.add('collapsed');
            icon.style.transform = 'rotate(-180deg)';
            icon.classList.add('collapsed-icon');
        }
    }
}
