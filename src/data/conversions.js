// تعريف جميع معاملات التحويل ووحدات القياس
export const conversionFactors = {
  // وحدات الطول - كلها محولة إلى متر كوحدة أساسية
  length: {
    km: 1000,           // 1 كم = 1000 متر
    m: 1,               // 1 متر = 1 متر (الوحدة الأساسية)
    cm: 0.01,           // 1 سم = 0.01 متر
    mm: 0.001,          // 1 مم = 0.001 متر  
    mi: 1609.344,       // 1 ميل = 1609.344 متر
    yd: 0.9144,         // 1 ياردة = 0.9144 متر
    ft: 0.3048,         // 1 قدم = 0.3048 متر
    in: 0.0254          // 1 إنش = 0.0254 متر
  },

  // وحدات الوزن - كلها محولة إلى كيلوغرام كوحدة أساسية
  weight: {
    t: 1000,            // 1 طن = 1000 كيلو
    kg: 1,              // 1 كيلو = 1 كيلو (الوحدة الأساسية)
    g: 0.001,           // 1 غرام = 0.001 كيلو
    mg: 0.000001,       // 1 مليغرام = 0.000001 كيلو
    lb: 0.453592,       // 1 رطل = 0.453592 كيلو
    oz: 0.0283495       // 1 أونصة = 0.0283495 كيلو
  },

  // وحدات المساحة - كلها محولة إلى متر مربع كوحدة أساسية
  area: {
    km2: 1000000,       // 1 كم² = 1,000,000 م²
    m2: 1,              // 1 م² = 1 م² (الوحدة الأساسية)
    cm2: 0.0001,        // 1 سم² = 0.0001 م²
    mm2: 0.000001,      // 1 مم² = 0.000001 م²
    ha: 10000,          // 1 هكتار = 10,000 م²
    acre: 4046.856422,  // 1 فدان = 4046.856422 م²
    ft2: 0.092903,      // 1 قدم² = 0.092903 م²
    in2: 0.00064516     // 1 إنش² = 0.00064516 م²
  },

  // وحدات الحجم - كلها محولة إلى لتر كوحدة أساسية
  volume: {
    m3: 1000,           // 1 م³ = 1000 لتر
    l: 1,               // 1 لتر = 1 لتر (الوحدة الأساسية)
    ml: 0.001,          // 1 مل = 0.001 لتر
    gal: 3.785411784,   // 1 جالون أمريكي = 3.785411784 لتر
    qt: 0.946353,       // 1 كوارت = 0.946353 لتر
    pt: 0.473176,       // 1 باينت = 0.473176 لتر
    cup: 0.236588,      // 1 كوب = 0.236588 لتر
    fl_oz: 0.0295735    // 1 أونصة سائلة = 0.0295735 لتر
  }
};

// دوال التحويل الخاصة لدرجة الحرارة
export const temperatureConversions = {
  // التحويل من سيلسيوس
  celsius: {
    celsius: (value) => value,
    fahrenheit: (value) => (value * 9/5) + 32,
    kelvin: (value) => value + 273.15
  },
  
  // التحويل من فهرنهايت  
  fahrenheit: {
    celsius: (value) => (value - 32) * 5/9,
    fahrenheit: (value) => value,
    kelvin: (value) => (value - 32) * 5/9 + 273.15
  },
  
  // التحويل من كلفن
  kelvin: {
    celsius: (value) => value - 273.15,
    fahrenheit: (value) => (value - 273.15) * 9/5 + 32,
    kelvin: (value) => value
  }
};

// وظيفة التحويل العامة
export function convertUnits(value, fromUnit, toUnit, unitType) {
  if (isNaN(value) || value === '') {
    return null;
  }

  const numValue = parseFloat(value);
  
  // معالجة خاصة لدرجة الحرارة
  if (unitType === 'temperature') {
    return temperatureConversions[fromUnit][toUnit](numValue);
  }
  
  // التحويل العادي للوحدات الأخرى
  const factors = conversionFactors[unitType];
  if (!factors || !factors[fromUnit] || !factors[toUnit]) {
    return null;
  }
  
  // تحويل إلى الوحدة الأساسية ثم إلى الوحدة المطلوبة
  const baseValue = numValue * factors[fromUnit];
  const result = baseValue / factors[toUnit];
  
  return result;
}

// وظيفة لتنسيق الناتج بطريقة جميلة
export function formatResult(value, precision = 6) {
  if (value === null || isNaN(value)) {
    return '';
  }
  
  // إزالة الأصفار غير المهمة
  const formatted = parseFloat(value.toFixed(precision));
  
  // تنسيق الأرقام الكبيرة بفواصل
  return formatted.toLocaleString('en-US', { 
    maximumFractionDigits: precision,
    useGrouping: true 
  });
}

// معلومات الوحدات لكل نوع
export const unitInfo = {
  length: [
    { value: 'km', symbol: 'km', factor: 1000 },
    { value: 'm', symbol: 'm', factor: 1 },
    { value: 'cm', symbol: 'cm', factor: 0.01 },
    { value: 'mm', symbol: 'mm', factor: 0.001 },
    { value: 'mi', symbol: 'mi', factor: 1609.344 },
    { value: 'yd', symbol: 'yd', factor: 0.9144 },
    { value: 'ft', symbol: 'ft', factor: 0.3048 },
    { value: 'in', symbol: 'in', factor: 0.0254 }
  ],
  
  weight: [
    { value: 't', symbol: 't', factor: 1000 },
    { value: 'kg', symbol: 'kg', factor: 1 },
    { value: 'g', symbol: 'g', factor: 0.001 },
    { value: 'mg', symbol: 'mg', factor: 0.000001 },
    { value: 'lb', symbol: 'lb', factor: 0.453592 },
    { value: 'oz', symbol: 'oz', factor: 0.0283495 }
  ],
  
  area: [
    { value: 'km2', symbol: 'km²', factor: 1000000 },
    { value: 'm2', symbol: 'm²', factor: 1 },
    { value: 'cm2', symbol: 'cm²', factor: 0.0001 },
    { value: 'mm2', symbol: 'mm²', factor: 0.000001 },
    { value: 'ha', symbol: 'ha', factor: 10000 },
    { value: 'acre', symbol: 'acre', factor: 4046.856422 },
    { value: 'ft2', symbol: 'ft²', factor: 0.092903 },
    { value: 'in2', symbol: 'in²', factor: 0.00064516 }
  ],
  
  temperature: [
    { value: 'celsius', symbol: '°C' },
    { value: 'fahrenheit', symbol: '°F' },
    { value: 'kelvin', symbol: 'K' }
  ],
  
  volume: [
    { value: 'm3', symbol: 'm³', factor: 1000 },
    { value: 'l', symbol: 'L', factor: 1 },
    { value: 'ml', symbol: 'mL', factor: 0.001 },
    { value: 'gal', symbol: 'gal', factor: 3.785411784 },
    { value: 'qt', symbol: 'qt', factor: 0.946353 },
    { value: 'pt', symbol: 'pt', factor: 0.473176 },
    { value: 'cup', symbol: 'cup', factor: 0.236588 },
    { value: 'fl_oz', symbol: 'fl oz', factor: 0.0295735 }
  ]
};

// أمثلة للتحويلات الشائعة
export const commonExamples = {
  length: [
    { from: 1, fromUnit: 'm', toUnit: 'ft', result: 3.28084 },
    { from: 1, fromUnit: 'km', toUnit: 'mi', result: 0.621371 },
    { from: 1, fromUnit: 'in', toUnit: 'cm', result: 2.54 }
  ],
  
  weight: [
    { from: 1, fromUnit: 'kg', toUnit: 'lb', result: 2.20462 },
    { from: 1, fromUnit: 'lb', toUnit: 'oz', result: 16 },
    { from: 1, fromUnit: 't', toUnit: 'kg', result: 1000 }
  ],
  
  area: [
    { from: 1, fromUnit: 'ha', toUnit: 'acre', result: 2.47105 },
    { from: 1, fromUnit: 'm2', toUnit: 'ft2', result: 10.7639 },
    { from: 1, fromUnit: 'km2', toUnit: 'ha', result: 100 }
  ],
  
  temperature: [
    { from: 0, fromUnit: 'celsius', toUnit: 'fahrenheit', result: 32 },
    { from: 100, fromUnit: 'celsius', toUnit: 'fahrenheit', result: 212 },
    { from: 273.15, fromUnit: 'kelvin', toUnit: 'celsius', result: 0 }
  ],
  
  volume: [
    { from: 1, fromUnit: 'l', toUnit: 'gal', result: 0.264172 },
    { from: 1, fromUnit: 'm3', toUnit: 'l', result: 1000 },
    { from: 1, fromUnit: 'gal', toUnit: 'qt', result: 4 }
  ]
};