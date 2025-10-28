// Надёжный i18n loader
(function () {
  const supported = ["de", "en", "es", "fr", "ja", "pt", "ru"]; // набор поддерживаемых языков

  function detectSystemLang() {
    try {
      return (navigator.language || navigator.userLanguage || "en")
        .slice(0, 2)
        .toLowerCase();
    } catch (e) {
      return "en";
    }
  }

  function getLangFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");
    return urlLang ? urlLang.toLowerCase() : null;
  }

  function setLangToUrl(lang) {
    const params = new URLSearchParams(window.location.search);
    params.set("lang", lang);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, "", newUrl);
  }

  function applyTranslations(translations) {
    document.querySelectorAll("[data-text]").forEach((el) => {
      const key = el.getAttribute("data-text");
      if (!key) return;
      if (translations.hasOwnProperty(key)) {
        el.innerHTML = translations[key];
      } else {
        // Если ключа нет — оставляем оригинал и логируем
        console.warn(`i18n: missing key "${key}" in translations`);
      }
    });
  }

  async function fetchTranslations(lang) {
    const path = `i18n/${lang}.json`;
    console.log(`i18n: loading ${path}`);
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json;
    } catch (err) {
      console.error(`i18n: failed to load ${path}:`, err);
      throw err;
    }
  }

  async function initI18n() {
    // 1. язык в URL?
    let lang = getLangFromUrl();

    // 2. если нет — берем системный (если поддерживается)
    if (!lang) {
      const sys = detectSystemLang();
      lang = supported.includes(sys) ? sys : "en";
      // и пишем в URL без перезагрузки
      setLangToUrl(lang);
    }

    // 3. Устанавливаем атрибут <html lang="...">
    document.documentElement.lang = lang;

    // 4. пытаемся загрузить, при ошибке падаем к en
    try {
      const translations = await fetchTranslations(lang);
      applyTranslations(translations);
      console.log(`i18n: applied translations for "${lang}"`);
    } catch (err) {
      if (lang !== "en") {
        console.log("i18n: falling back to en");
        try {
          const translations = await fetchTranslations("en");
          applyTranslations(translations);
          document.documentElement.lang = "en";
          setLangToUrl("en");
        } catch (err2) {
          console.error("i18n: failed to load fallback en.json", err2);
        }
      }
    }
  }

  // Инициализация после DOM
  document.addEventListener("DOMContentLoaded", initI18n);

  // Дополнительно: слушаем смену настроек языка в браузере
  if ("onlanguagechange" in window) {
    window.addEventListener("languagechange", () => {
      const sys = detectSystemLang();
      if (supported.includes(sys)) {
        // если URL не содержит явного lang - применим системный
        const urlLang = getLangFromUrl();
        if (!urlLang) {
          setLangToUrl(sys);
          // reload translations (без перезагрузки страницы)
          fetchTranslations(sys)
            .then(applyTranslations)
            .catch(() => console.warn("i18n: languagechange fallback failed"));
        }
      }
    });
  }
})();
