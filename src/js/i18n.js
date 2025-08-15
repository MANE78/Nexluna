// نظام تعدد اللغات (Internationalization)
class I18n {
  constructor() {
    this.currentLanguage = this.detectLanguage();
    this.translations = {};
    this.isRTL = this.currentLanguage === 'ar';
  }

  // اكتشاف اللغة المفضلة للمستخدم
  detectLanguage() {
    // التحقق من localStorage أولاً
    const savedLang = localStorage.getItem('preferred-language');
    if (savedLang && ['ar', 'en'].includes(savedLang)) {
      return savedLang;
    }

    // التحقق من URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    if (langParam && ['ar', 'en'].includes(langParam)) {
      return langParam;
    }

    // التحقق من browser language
    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang.startsWith('ar')) {
      return 'ar';
    }

    // افتراضي إلى العربية
    return 'ar';
  }

  // تحميل ملف الترجمة
  async loadTranslations(lang) {
    try {
      const response = await fetch(`/src/locales/${lang}.json`);
      const translations = await response.json();
      this.translations[lang] = translations;
      return translations;
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      return null;
    }
  }

  // تهيئة النظام
  async initialize() {
    await this.loadTranslations(this.currentLanguage);
    
    // تحميل اللغة الأخرى في الخلفية
    const otherLang = this.currentLanguage === 'ar' ? 'en' : 'ar';
    await this.loadTranslations(otherLang);
    
    this.updatePageLanguage();
    this.setupLanguageSwitcher();
  }

  // الحصول على نص مترجم
  t(key, params = {}) {
    const translation = this.getNestedValue(this.translations[this.currentLanguage], key);
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }

    // استبدال المتغيرات في النص
    return this.interpolate(translation, params);
  }

  // الحصول على قيمة متداخلة من كائن
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, keyPart) => {
      return current && current[keyPart] !== undefined ? current[keyPart] : null;
    }, obj);
  }

  // استبدال المتغيرات في النص
  interpolate(text, params) {
    if (typeof text !== 'string') {
      return text;
    }
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  // تغيير اللغة
  async changeLanguage(newLang) {
    if (!['ar', 'en'].includes(newLang) || newLang === this.currentLanguage) {
      return;
    }

    this.currentLanguage = newLang;
    this.isRTL = newLang === 'ar';
    
    // حفظ الاختيار
    localStorage.setItem('preferred-language', newLang);
    
    // تحميل الترجمات إذا لم تكن محملة
    if (!this.translations[newLang]) {
      await this.loadTranslations(newLang);
    }
    
    // تحديث الصفحة
    this.updatePageLanguage();
    
    // إطلاق حدث تغيير اللغة
    document.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: newLang, isRTL: this.isRTL }
    }));
  }

  // تحديث لغة الصفحة
  updatePageLanguage() {
    const html = document.documentElement;
    
    // تحديث خصائص HTML
    html.lang = this.currentLanguage;
    html.dir = this.isRTL ? 'rtl' : 'ltr';
    
    // تحديث كلاس CSS للغة
    html.classList.remove('lang-ar', 'lang-en');
    html.classList.add(`lang-${this.currentLanguage}`);
    
    // تحديث النصوص
    this.updateTexts();
    
    // تحديث meta tags
    this.updateMetaTags();
  }

  // تحديث النصوص في الصفحة
  updateTexts() {
    // تحديث العناصر التي لها خاصية data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'text' || element.type === 'search')) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });

    // تحديث العناصر التي لها خاصية data-i18n-html
    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      const translation = this.t(key);
      element.innerHTML = translation;
    });

    // تحديث العناصر التي لها خاصية data-i18n-attr
    document.querySelectorAll('[data-i18n-attr]').forEach(element => {
      const attrData = element.getAttribute('data-i18n-attr');
      const [attr, key] = attrData.split(':');
      const translation = this.t(key);
      element.setAttribute(attr, translation);
    });
  }

  // تحديث meta tags
  updateMetaTags() {
    const translations = this.translations[this.currentLanguage];
    if (!translations || !translations.meta) return;

    // تحديث title
    document.title = translations.meta.title;
    
    // تحديث description
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
      descriptionMeta.content = translations.meta.description;
    }
    
    // تحديث keywords
    const keywordsMeta = document.querySelector('meta[name="keywords"]');
    if (keywordsMeta) {
      keywordsMeta.content = translations.meta.keywords;
    }

    // تحديث og:title
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.content = translations.meta.title;
    }
    
    // تحديث og:description
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.content = translations.meta.description;
    }
  }

  // إعداد مبدل اللغة
  setupLanguageSwitcher() {
    document.querySelectorAll('[data-lang-switch]').forEach(switcher => {
      switcher.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLang = switcher.getAttribute('data-lang-switch');
        this.changeLanguage(targetLang);
      });
      
      // تحديد اللغة الحالية
      if (switcher.getAttribute('data-lang-switch') === this.currentLanguage) {
        switcher.classList.add('active');
      } else {
        switcher.classList.remove('active');
      }
    });
  }

  // الحصول على اللغة الحالية
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  // فحص ما إذا كانت اللغة الحالية RTL
  isRTLLanguage() {
    return this.isRTL;
  }

  // تطبيق الترجمات على عنصر محدد
  applyTranslations(element) {
    // البحث عن جميع العناصر التي تحتاج ترجمة داخل العنصر المحدد
    const elementsToTranslate = element.querySelectorAll('[data-i18n], [data-i18n-html], [data-i18n-attr]');
    
    elementsToTranslate.forEach(el => {
      if (el.hasAttribute('data-i18n')) {
        const key = el.getAttribute('data-i18n');
        const translation = this.t(key);
        
        if (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'search')) {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
      
      if (el.hasAttribute('data-i18n-html')) {
        const key = el.getAttribute('data-i18n-html');
        const translation = this.t(key);
        el.innerHTML = translation;
      }
      
      if (el.hasAttribute('data-i18n-attr')) {
        const attrData = el.getAttribute('data-i18n-attr');
        const [attr, key] = attrData.split(':');
        const translation = this.t(key);
        el.setAttribute(attr, translation);
      }
    });
  }

  // تحديث URL بناءً على اللغة
  updateURL() {
    const url = new URL(window.location);
    url.searchParams.set('lang', this.currentLanguage);
    window.history.replaceState({}, '', url);
  }

  // تنسيق الأرقام حسب اللغة
  formatNumber(number, options = {}) {
    const locale = this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.NumberFormat(locale, options).format(number);
  }

  // تنسيق التاريخ حسب اللغة
  formatDate(date, options = {}) {
    const locale = this.currentLanguage === 'ar' ? 'ar-SA' : 'en-US';
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
}

// إنشاء instance واحد للاستخدام في كامل التطبيق
const i18n = new I18n();

// تصدير للاستخدام في ملفات أخرى
export default i18n;