// التطبيق الرئيسي لمحول الوحدات
import i18n from './i18n.js';
import { convertUnits, formatResult, unitInfo, commonExamples } from '../data/conversions.js';

class UnitConverterApp {
  constructor() {
    this.currentUnitType = 'length';
    this.isInitialized = false;
    this.elements = {};
    this.debounceTimer = null;
  }

  // تهيئة التطبيق
  async initialize() {
    try {
      // تهيئة نظام اللغات
      await i18n.initialize();
      
      // تهيئة العناصر
      this.initializeElements();
      
      // تهيئة الأحداث
      this.initializeEvents();
      
      // تحديث الواجهة
      await this.updateInterface();
      
      // تحديد النوع الافتراضي
      this.switchUnitType(this.getInitialUnitType());
      
      this.isInitialized = true;
      console.log('تم تهيئة التطبيق بنجاح');
      
    } catch (error) {
      console.error('خطأ في تهيئة التطبيق:', error);
      this.showError('حدث خطأ في تهيئة التطبيق');
    }
  }

  // الحصول على نوع الوحدة الافتراضي من URL
  getInitialUnitType() {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get('type');
    const validTypes = ['length', 'weight', 'area', 'temperature', 'volume'];
    
    if (typeParam && validTypes.includes(typeParam)) {
      return typeParam;
    }
    
    return 'length';
  }

  // تهيئة العناصر
  initializeElements() {
    this.elements = {
      // عناصر النموذج
      fromValue: document.getElementById('fromValue'),
      toValue: document.getElementById('toValue'),
      fromUnit: document.getElementById('fromUnit'),
      toUnit: document.getElementById('toUnit'),
      swapBtn: document.getElementById('swapBtn'),
      
      // عناصر النتائج
      resultDisplay: document.getElementById('resultDisplay'),
      resultValue: document.getElementById('resultValue'),
      resultText: document.getElementById('resultText'),
      
      // عناصر التبويبات
      tabButtons: document.querySelectorAll('[data-tab]'),
      
      // عناصر أخرى
      converterTitle: document.getElementById('converterTitle'),
      converterDescription: document.getElementById('converterDescription'),
      commonConversions: document.getElementById('commonConversions'),
      
      // أزرار إضافية
      clearBtn: document.getElementById('clearBtn'),
      copyBtn: document.getElementById('copyBtn')
    };

    // التحقق من وجود العناصر الأساسية
    const requiredElements = ['fromValue', 'toValue', 'fromUnit', 'toUnit'];
    for (const elementId of requiredElements) {
      if (!this.elements[elementId]) {
        console.error(`العنصر المطلوب غير موجود: ${elementId}`);
      }
    }
  }

  // تهيئة الأحداث
  initializeEvents() {
    // أحداث الحقول
    if (this.elements.fromValue) {
      this.elements.fromValue.addEventListener('input', 
        this.debounce(() => this.handleConversion(), 300)
      );
    }

    if (this.elements.fromUnit) {
      this.elements.fromUnit.addEventListener('change', () => this.handleConversion());
    }

    if (this.elements.toUnit) {
      this.elements.toUnit.addEventListener('change', () => this.handleConversion());
    }

    // حدث تبديل الوحدات
    if (this.elements.swapBtn) {
      this.elements.swapBtn.addEventListener('click', () => this.swapUnits());
    }

    // أحداث التبويبات
    this.elements.tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const unitType = button.getAttribute('data-tab');
        this.switchUnitType(unitType);
        this.updateURL(unitType);
      });
    });

    // أحداث الأزرار الإضافية
    if (this.elements.clearBtn) {
      this.elements.clearBtn.addEventListener('click', () => this.clearFields());
    }

    if (this.elements.copyBtn) {
      this.elements.copyBtn.addEventListener('click', () => this.copyResult());
    }

    // حدث تغيير اللغة
    document.addEventListener('languageChanged', () => {
      this.updateInterface();
    });

    // أحداث لوحة المفاتيح للوصولية
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.clearFields();
      }
      
      if (e.ctrlKey && e.key === 'c' && this.elements.resultValue.textContent) {
        this.copyResult();
      }
    });
  }

  // تحديث الواجهة
  async updateInterface() {
    this.updateTabButtons();
    this.updateConverterTitle();
    this.updateUnitOptions();
    this.updateCommonConversions();
    this.handleConversion();
  }

  // تحديث أزرار التبويبات
  updateTabButtons() {
    this.elements.tabButtons.forEach(button => {
      const unitType = button.getAttribute('data-tab');
      const isActive = unitType === this.currentUnitType;
      
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', isActive.toString());
      
      // تحديث النص
      const translation = i18n.t(`units.${unitType}.title`);
      if (translation !== `units.${unitType}.title`) {
        button.textContent = translation;
      }
    });
  }

  // تحديث عنوان المحول
  updateConverterTitle() {
    if (this.elements.converterTitle) {
      const title = i18n.t('converter.title', { 
        type: i18n.t(`units.${this.currentUnitType}.title`) 
      });
      this.elements.converterTitle.textContent = title;
    }

    if (this.elements.converterDescription) {
      const description = i18n.t(`units.${this.currentUnitType}.description`);
      this.elements.converterDescription.textContent = description;
    }
  }

  // تحديث خيارات الوحدات
  updateUnitOptions() {
    const units = unitInfo[this.currentUnitType];
    if (!units) return;

    // تحديث القائمة الأولى
    if (this.elements.fromUnit) {
      this.elements.fromUnit.innerHTML = this.generateUnitOptions(units);
    }

    // تحديث القائمة الثانية
    if (this.elements.toUnit) {
      this.elements.toUnit.innerHTML = this.generateUnitOptions(units);
      // تعيين وحدة مختلفة كافتراضية للقائمة الثانية
      if (units.length > 1) {
        this.elements.toUnit.value = units[1].value;
      }
    }
  }

  // توليد خيارات الوحدات
  generateUnitOptions(units) {
    return units.map(unit => {
      const translation = i18n.t(`units.${this.currentUnitType}.${unit.value}`);
      const displayName = translation !== `units.${this.currentUnitType}.${unit.value}` 
        ? `${translation} (${unit.symbol || unit.value})`
        : `${unit.value} (${unit.symbol || unit.value})`;
      
      return `<option value="${unit.value}">${displayName}</option>`;
    }).join('');
  }

  // تحديث التحويلات الشائعة
  updateCommonConversions() {
    if (!this.elements.commonConversions) return;

    const examples = commonExamples[this.currentUnitType];
    if (!examples || examples.length === 0) {
      this.elements.commonConversions.style.display = 'none';
      return;
    }

    this.elements.commonConversions.style.display = 'block';
    
    const title = i18n.t('common_conversions.title');
    const conversionsHtml = examples.map(example => {
      const fromUnitName = i18n.t(`units.${this.currentUnitType}.${example.fromUnit}`);
      const toUnitName = i18n.t(`units.${this.currentUnitType}.${example.toUnit}`);
      
      return `
        <div class="conversion-item" data-conversion='${JSON.stringify(example)}'>
          <span>${example.from} ${fromUnitName} = ${formatResult(example.result)} ${toUnitName}</span>
          <button class="btn btn-sm btn-secondary use-conversion-btn" aria-label="استخدام هذا التحويل">
            ${i18n.t('converter.use') || 'استخدام'}
          </button>
        </div>
      `;
    }).join('');

    this.elements.commonConversions.innerHTML = `
      <h3>${title}</h3>
      <div class="conversion-list">
        ${conversionsHtml}
      </div>
    `;

    // إضافة أحداث للأزرار
    this.elements.commonConversions.querySelectorAll('.use-conversion-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const conversionData = JSON.parse(e.target.closest('.conversion-item').getAttribute('data-conversion'));
        this.useConversion(conversionData);
      });
    });
  }

  // استخدام تحويل جاهز
  useConversion(conversion) {
    if (this.elements.fromValue) {
      this.elements.fromValue.value = conversion.from;
    }
    if (this.elements.fromUnit) {
      this.elements.fromUnit.value = conversion.fromUnit;
    }
    if (this.elements.toUnit) {
      this.elements.toUnit.value = conversion.toUnit;
    }
    
    this.handleConversion();
    
    // التركيز على حقل الإدخال
    if (this.elements.fromValue) {
      this.elements.fromValue.focus();
    }
  }

  // معالجة التحويل
  handleConversion() {
    if (!this.elements.fromValue || !this.elements.fromUnit || !this.elements.toUnit) {
      return;
    }

    const value = this.elements.fromValue.value.trim();
    const fromUnit = this.elements.fromUnit.value;
    const toUnit = this.elements.toUnit.value;

    // مسح النتيجة إذا كان الحقل فارغاً
    if (!value) {
      this.clearResult();
      return;
    }

    // التحقق من صحة الإدخال
    if (isNaN(value) || value === '') {
      this.showError(i18n.t('converter.invalid_input'));
      return;
    }

    try {
      // إجراء التحويل
      const result = convertUnits(parseFloat(value), fromUnit, toUnit, this.currentUnitType);
      
      if (result === null) {
        this.showError('خطأ في التحويل');
        return;
      }

      // عرض النتيجة
      this.displayResult(value, fromUnit, result, toUnit);
      
    } catch (error) {
      console.error('خطأ في التحويل:', error);
      this.showError('حدث خطأ أثناء التحويل');
    }
  }

  // عرض النتيجة
  displayResult(inputValue, fromUnit, result, toUnit) {
    const formattedResult = formatResult(result);
    
    // تحديث حقل النتيجة
    if (this.elements.toValue) {
      this.elements.toValue.value = formattedResult;
    }

    // تحديث عرض النتيجة
    if (this.elements.resultValue) {
      this.elements.resultValue.textContent = formattedResult;
    }

    if (this.elements.resultText) {
      const fromUnitName = i18n.t(`units.${this.currentUnitType}.${fromUnit}`) || fromUnit;
      const toUnitName = i18n.t(`units.${this.currentUnitType}.${toUnit}`) || toUnit;
      
      const resultText = i18n.t('converter.result_text', {
        value: inputValue,
        fromUnit: fromUnitName,
        result: formattedResult,
        toUnit: toUnitName
      });
      
      this.elements.resultText.textContent = resultText;
    }

    // إظهار قسم النتيجة
    if (this.elements.resultDisplay) {
      this.elements.resultDisplay.style.display = 'block';
      this.elements.resultDisplay.classList.remove('error');
    }

    // تفعيل زر النسخ
    if (this.elements.copyBtn) {
      this.elements.copyBtn.disabled = false;
    }
  }

  // مسح النتيجة
  clearResult() {
    if (this.elements.toValue) {
      this.elements.toValue.value = '';
    }
    
    if (this.elements.resultDisplay) {
      this.elements.resultDisplay.style.display = 'none';
    }
    
    if (this.elements.copyBtn) {
      this.elements.copyBtn.disabled = true;
    }
  }

  // عرض الخطأ
  showError(message) {
    if (this.elements.resultDisplay) {
      this.elements.resultDisplay.style.display = 'block';
      this.elements.resultDisplay.classList.add('error');
    }
    
    if (this.elements.resultValue) {
      this.elements.resultValue.textContent = '❌';
    }
    
    if (this.elements.resultText) {
      this.elements.resultText.textContent = message;
    }
    
    if (this.elements.toValue) {
      this.elements.toValue.value = '';
    }
  }

  // تبديل الوحدات
  swapUnits() {
    if (!this.elements.fromUnit || !this.elements.toUnit || 
        !this.elements.fromValue || !this.elements.toValue) {
      return;
    }

    // تبديل الوحدات
    const tempUnit = this.elements.fromUnit.value;
    this.elements.fromUnit.value = this.elements.toUnit.value;
    this.elements.toUnit.value = tempUnit;

    // تبديل القيم
    const tempValue = this.elements.fromValue.value;
    this.elements.fromValue.value = this.elements.toValue.value;
    this.elements.toValue.value = tempValue;

    // إعادة التحويل
    this.handleConversion();

    // تأثير بصري
    if (this.elements.swapBtn) {
      this.elements.swapBtn.style.transform = 'rotate(180deg)';
      setTimeout(() => {
        this.elements.swapBtn.style.transform = '';
      }, 300);
    }
  }

  // تغيير نوع الوحدة
  switchUnitType(unitType) {
    if (!unitInfo[unitType] || unitType === this.currentUnitType) {
      return;
    }

    this.currentUnitType = unitType;
    this.clearFields();
    this.updateInterface();

    // إضافة إلى التاريخ
    const event = new CustomEvent('unitTypeChanged', {
      detail: { unitType, timestamp: Date.now() }
    });
    document.dispatchEvent(event);
  }

  // مسح جميع الحقول
  clearFields() {
    if (this.elements.fromValue) {
      this.elements.fromValue.value = '';
    }
    
    if (this.elements.toValue) {
      this.elements.toValue.value = '';
    }
    
    this.clearResult();
    
    // التركيز على حقل الإدخال
    if (this.elements.fromValue) {
      this.elements.fromValue.focus();
    }
  }

  // نسخ النتيجة
  async copyResult() {
    if (!this.elements.resultText || !this.elements.resultText.textContent) {
      return;
    }

    try {
      await navigator.clipboard.writeText(this.elements.resultText.textContent);
      
      // إظهار رسالة نجاح
      this.showToast(i18n.t('converter.copied') || 'تم النسخ!');
      
    } catch (error) {
      console.error('فشل في نسخ النتيجة:', error);
      
      // طريقة بديلة للنسخ
      const textArea = document.createElement('textarea');
      textArea.value = this.elements.resultText.textContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      this.showToast(i18n.t('converter.copied') || 'تم النسخ!');
    }
  }

  // عرض رسالة مؤقتة
  showToast(message) {
    // إنشاء عنصر الرسالة
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--accent-color);
      color: white;
      padding: var(--spacing-md) var(--spacing-lg);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      z-index: 9999;
      transform: translateY(-100px);
      opacity: 0;
      transition: all var(--transition-normal) ease;
    `;

    document.body.appendChild(toast);

    // إظهار الرسالة
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    }, 100);

    // إخفاء الرسالة
    setTimeout(() => {
      toast.style.transform = 'translateY(-100px)';
      toast.style.opacity = '0';
      
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // تحديث URL
  updateURL(unitType) {
    const url = new URL(window.location);
    url.searchParams.set('type', unitType);
    window.history.replaceState({}, '', url);
  }

  // تأخير تنفيذ الدالة (debounce)
  debounce(func, delay) {
    return (...args) => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // التحقق من حالة التهيئة
  isReady() {
    return this.isInitialized;
  }

  // الحصول على معلومات التحويل الحالي
  getCurrentConversionInfo() {
    if (!this.elements.fromValue || !this.elements.fromUnit || !this.elements.toUnit) {
      return null;
    }

    return {
      value: this.elements.fromValue.value,
      fromUnit: this.elements.fromUnit.value,
      toUnit: this.elements.toUnit.value,
      unitType: this.currentUnitType,
      result: this.elements.toValue ? this.elements.toValue.value : null
    };
  }
}

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // إنشاء instance من التطبيق
    window.converterApp = new UnitConverterApp();
    
    // تهيئة التطبيق
    await window.converterApp.initialize();
    
    // إعداد القائمة المتجاوبة
    setupResponsiveMenu();
    
    // إضافة معالجات للأخطاء غير المتوقعة
    window.addEventListener('error', (event) => {
      console.error('خطأ غير متوقع:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Promise مرفوض:', event.reason);
    });
    
  } catch (error) {
    console.error('فشل في تهيئة التطبيق:', error);
  }
});

// إعداد القائمة المتجاوبة
function setupResponsiveMenu() {
  const menuToggle = document.querySelector('.menu-toggle');
  const navDropdown = document.querySelector('.nav-dropdown');
  
  if (menuToggle && navDropdown) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navDropdown.classList.contains('show');
      
      if (isOpen) {
        navDropdown.classList.remove('show');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      } else {
        navDropdown.classList.add('show');
        menuToggle.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
      }
    });

    // إغلاق القائمة عند النقر على رابط
    navDropdown.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navDropdown.classList.remove('show');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // إغلاق القائمة عند النقر خارجها
    document.addEventListener('click', (event) => {
      if (!menuToggle.contains(event.target) && !navDropdown.contains(event.target)) {
        navDropdown.classList.remove('show');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// تصدير للاستخدام في ملفات أخرى
export default UnitConverterApp;