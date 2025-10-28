function getLang() {
  const params = new URLSearchParams(window.location.search);
  const urlLang = params.get("lang");
  const supported = ["de", "en", "es", "fr", "ja", "pt"];
  if (urlLang && supported.includes(urlLang)) return urlLang;
  const sysLang = navigator.language.slice(0, 2);
  return supported.includes(sysLang) ? sysLang : "en";
}

async function loadTranslations(lang) {
  try {
    const res = await fetch(`i18n/${lang}.json`);
    if (!res.ok) throw new Error("Translation file not found");
    const translations = await res.json();

    // Применяем переводы
    document.querySelectorAll("[data-text]").forEach((el) => {
      const original = el.getAttribute("data-text");
      if (translations[original]) {
        el.innerHTML = translations[original]; // сохраняем <br>
      }
    });
  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const lang = getLang();
  loadTranslations(lang);
});
