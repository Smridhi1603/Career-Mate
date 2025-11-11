document.addEventListener('DOMContentLoaded', function() {
  const spinner = document.getElementById('spinner');
  if (spinner) {
    spinner.remove();
  }

  const animatedElements = document.querySelectorAll('[class*="wow"], [data-wow-delay]');
  animatedElements.forEach(el => {
    el.className = el.className.replace(/\bwow\b/g, '').replace(/\bfadeIn\w*\b/g, '').trim();
    el.removeAttribute('data-wow-delay');
  });
});
