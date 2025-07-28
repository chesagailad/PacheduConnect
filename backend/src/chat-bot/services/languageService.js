/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: languageService - handles backend functionality
 */

const logger = require('../../utils/logger');

class LanguageService {
  constructor() {
    // Language mappings
    this.languages = {
      en: 'English',
      sn: 'Shona',
      nd: 'Ndebele'
    };

    // Translation dictionaries
    this.translations = {
      // Greetings
      greetings: {
        en: {
          hello: 'Hello! How can I help you today?',
          good_morning: 'Good morning! How can I assist you?',
          good_afternoon: 'Good afternoon! How can I help you?',
          good_evening: 'Good evening! How can I assist you?'
        },
        sn: {
          hello: 'Mhoro! Ndingakubatsira sei nhasi?',
          good_morning: 'Mangwanani! Ndingakubatsira sei?',
          good_afternoon: 'Masikati! Ndingakubatsira sei?',
          good_evening: 'Manheru! Ndingakubatsira sei?'
        },
        nd: {
          hello: 'Sawubona! Ngingakusiza kanjani namuhla?',
          good_morning: 'Sawubona! Ngingakusiza kanjani?',
          good_afternoon: 'Sawubona! Ngingakusiza kanjani?',
          good_evening: 'Sawubona! Ngingakusiza kanjani?'
        }
      },

      // Exchange rates
      exchange_rates: {
        en: {
          current_rate: 'The current exchange rate for {from} to {to} is {rate}',
          rate_info: 'Exchange rates are updated every hour. Would you like to send money?',
          rate_query: 'I can help you check exchange rates. Which currencies are you interested in?'
        },
        sn: {
          current_rate: 'Mari yekuchinja yazvino ye {from} kuenda ku {to} ndeye {rate}',
          rate_info: 'Mari dzekuchinja dzinogadziridzwa awa rimwe nerimwe. Unoda kutumira mari here?',
          rate_query: 'Ndinogona kukubatsira kuona mari dzekuchinja. Mari dzipi dzaunofarira?'
        },
        nd: {
          current_rate: 'Inani lokushintshana lamanje le {from} kuya ku {to} liyi {rate}',
          rate_info: 'Amanani okushintshana agcinwa njalo ngehora. Uyafuna ukuthumela imali?',
          rate_query: 'Ngingakusiza ukubheka amanani okushintshana. Yiziphi izimali ozithandayo?'
        }
      },

      // Money transfer
      money_transfer: {
        en: {
          transfer_info: 'I can help you send money to Zimbabwe and other countries. What amount would you like to send?',
          transfer_steps: 'To send money, you\'ll need to: 1) Complete KYC verification 2) Add a beneficiary 3) Choose payment method',
          transfer_success: 'Your money transfer has been processed successfully!'
        },
        sn: {
          transfer_info: 'Ndinogona kukubatsira kutumira mari kuZimbabwe nedzimwe nyika. Mari yakadii yaunoda kutumira?',
          transfer_steps: 'Kuti utumire mari, unofanira: 1) Kupedza kuongororwa kweKYC 2) Kuwedzera munhu anotambira 3) Kusarudza nzira yekubhadhara',
          transfer_success: 'Kutuma kwako kwemari kwakaitwa zvakanaka!'
        },
        nd: {
          transfer_info: 'Ngingakusiza ukuthumela imali eZimbabwe nakwamanye amazwe. Yimali engakanani oyifunayo ukuthumela?',
          transfer_steps: 'Ukuze uthumele imali, kufanele: 1) Uqedele ukuqinisekiswa kweKYC 2) Wengeze umuntu ozothola 3) Khetha indlela yokukhokha',
          transfer_success: 'Ukuthumela kwakho kwemali kwenziwe ngempumelelo!'
        }
      },

      // KYC
      kyc: {
        en: {
          kyc_required: 'KYC verification is required to send money. Would you like to start the verification process?',
          kyc_steps: 'KYC verification involves: 1) ID document upload 2) Selfie verification 3) Address confirmation',
          kyc_help: 'I can help you with KYC verification. What specific issue are you facing?'
        },
        sn: {
          kyc_required: 'Kuongororwa kweKYC kunodiwa kuti utumire mari. Unoda kutanga nzira yekuongorora here?',
          kyc_steps: 'Kuongororwa kweKYC kunosanganisira: 1) Kuisa gwaro reID 2) Kuongororwa kwefoto 3) Kusimbisa kero',
          kyc_help: 'Ndinogona kukubatsira nekuongororwa kweKYC. Dambudziko ripi raunosangana naro?'
        },
        nd: {
          kyc_required: 'Ukuqinisekiswa kweKYC kuyadingeka ukuze uthumele imali. Uyafuna ukuqala inqubo yokuqinisekisa?',
          kyc_steps: 'Ukuqinisekiswa kweKYC kubandakanya: 1) Ukulayisha idokhumenti ye-ID 2) Ukuqinisekiswa kwesithombe 3) Ukuqinisekiswa kwekheli',
          kyc_help: 'Ngingakusiza nokuqinisekiswa kweKYC. Yisiphi inkinga ohlangabezana nayo?'
        }
      },

      // Fees
      fees: {
        en: {
          fee_structure: 'Our updated fee structure: 3% transfer fee + processing fees (0.5% standard, 1% express)',
          fee_calculation: 'For a $100 transfer: $3 transfer fee + $0.50 processing = $3.50 total',
          fee_info: 'Fees are transparent and shown before you confirm the transfer',
          fee_breakdown: 'Transfer Fee: 3% of amount\nProcessing: 0.5% standard, 1% express\nExchange: 0.5% for currency conversion\nRegulatory: 0.1% for amounts ≥ $50,000',
          fee_examples: 'Examples:\n$100: $3.50 total fees\n$500: $17.50 total fees\n$1000: $35 total fees'
        },
        sn: {
          fee_structure: 'Mari yedu yakagadziridzwa: 3% mari yekutuma + mari yekugadzirisa (0.5% yakajairika, 1% yekukurumidza)',
          fee_calculation: 'Kune $100 yekutumira: $3 mari yekutuma + $0.50 yekugadzirisa = $3.50 yese',
          fee_info: 'Mari dzinoonekwa uye dzinoratidzwa usati wasimbisa kutuma',
          fee_breakdown: 'Mari Yekutuma: 3% yemari\nKugadzirisa: 0.5% yakajairika, 1% yekukurumidza\nKuchinja: 0.5% yekuchinja mari\nMutemo: 0.1% yemari ≥ $50,000',
          fee_examples: 'Mienzaniso:\n$100: $3.50 mari yese\n$500: $17.50 mari yese\n$1000: $35 mari yese'
        },
        nd: {
          fee_structure: 'Uhlelo lwethu lwemali olugcinwe: 3% imali yokuthumela + imali yokucubungula (0.5% ejwayelekile, 1% ngokushesha)',
          fee_calculation: 'Kokuthumela kuka-$100: $3 imali yokuthumela + $0.50 yokucubungula = $3.50 yonke',
          fee_info: 'Imali icacile futhi iboniswa ngaphambi kokuthi uqinisekise ukuthumela',
          fee_breakdown: 'Imali Yokuthumela: 3% yemali\nUkucubungula: 0.5% ejwayelekile, 1% ngokushesha\nUkushintshana: 0.5% yokushintsha imali\nUmthetho: 0.1% yemali ≥ $50,000',
          fee_examples: 'Izibonelo:\n$100: $3.50 imali yonke\n$500: $17.50 imali yonke\n$1000: $35 imali yonke'
        }
      },

      // Support
      support: {
        en: {
          support_available: 'I\'m here to help! What specific issue do you need assistance with?',
          contact_support: 'For urgent issues, please contact our support team at support@pachedu.com',
          general_help: 'I can help with: money transfers, exchange rates, KYC, fees, and general questions'
        },
        sn: {
          support_available: 'Ndiri pano kukubatsira! Dambudziko ripi raunoda rubatsiro?',
          contact_support: 'Kune dambudziko rinokurumidza, ndapota taura nechikwata chedu chekubatsira pa support@pachedu.com',
          general_help: 'Ndinogona kukubatsira ne: kutuma mari, mari dzekuchinja, KYC, mari, uye mibvunzo yakajairika'
        },
        nd: {
          support_available: 'Ngilapha ukusiza! Yisiphi inkinga oyidingayo usizo?',
          contact_support: 'Kuzinkinga eziphuthumayo, sicela uxhumane neqembu lethu lokusekela ku-support@pachedu.com',
          general_help: 'Ngingakusiza nge: ukuthumela imali, amanani okushintshana, i-KYC, imali, nemibuzo ejwayelekile'
        }
      },

      // Goodbye
      goodbye: {
        en: {
          goodbye: 'Thank you for using Pachedu! Have a great day!',
          see_you: 'See you later! Feel free to come back if you need more help.',
          thanks: 'You\'re welcome! Thank you for choosing Pachedu.'
        },
        sn: {
          goodbye: 'Tinotenda nekushandisa Pachedu! Iva nezuva rakanaka!',
          see_you: 'Tichaonana gare gare! Sununguka kudzoka kana uchida rubatsiro rwemamwe.',
          thanks: 'Unokutendwa! Tinotenda nekusarudza Pachedu.'
        },
        nd: {
          goodbye: 'Siyabonga ngokusebenzisa iPachedu! Ube nosuku oluhle!',
          see_you: 'Sizobonana kamuva! Zizwe ukhululekile ukubuya uma udinga usizo olwengeziwe.',
          thanks: 'Wamukelekile! Siyabonga ngokukhetha iPachedu.'
        }
      },

      // Errors
      errors: {
        en: {
          general_error: 'I apologize, but I\'m having trouble right now. Please try again in a moment.',
          not_understood: 'I didn\'t quite understand that. Could you please rephrase your question?',
          service_unavailable: 'This service is temporarily unavailable. Please try again later.'
        },
        sn: {
          general_error: 'Ndine urombo, asi ndiri kunetseka izvino. Ndapota edza zvakare munguva pfupi.',
          not_understood: 'Handina kunzwisisa izvozvo. Unogona kudzokorora mubvunzo wako here?',
          service_unavailable: 'Basa iri harisi kuwanikwa kwenguva pfupi. Ndapota edza zvakare gare gare.'
        },
        nd: {
          general_error: 'Ngiyaxolisa, kodwa ngihlupheka manje. Sicela uzame futhi kancane.',
          not_understood: 'Angikuqondi kahle lokho. Ungakwazi ukubuyekeza umbuzo wakho?',
          service_unavailable: 'Le nkonzo ayitholakali okwesikhashana. Sicela uzame futhi kamuva.'
        }
      }
    };

    // Cultural context and preferences
    this.culturalContext = {
      sn: {
        formal_greetings: true,
        respect_elders: true,
        family_centric: true,
        community_focused: true,
        traditional_values: true
      },
      nd: {
        formal_greetings: true,
        respect_elders: true,
        family_centric: true,
        community_focused: true,
        traditional_values: true
      },
      en: {
        formal_greetings: false,
        respect_elders: false,
        family_centric: false,
        community_focused: false,
        traditional_values: false
      }
    };
  }

  /**
   * Detect language from text
   * @param {string} text - Text to analyze
   * @returns {object} Language detection result
   */
  detectLanguage(text) {
    const shonaWords = [
      'mhoro', 'mangwanani', 'masikati', 'manheru', 'tinotenda', 'ndingakubatsira',
      'mari', 'kutuma', 'kuongororwa', 'dambudziko', 'rubatsiro', 'zvakanaka'
    ];

    const ndebeleWords = [
      'sawubona', 'ngingakusiza', 'imali', 'ukuthumela', 'ukuqinisekiswa',
      'inkinga', 'usizo', 'ngempumelelo', 'siyabonga'
    ];

    const textLower = text.toLowerCase();
    let shonaCount = 0;
    let ndebeleCount = 0;

    // Count Shona words
    shonaWords.forEach(word => {
      if (textLower.includes(word)) {
        shonaCount++;
      }
    });

    // Count Ndebele words
    ndebeleWords.forEach(word => {
      if (textLower.includes(word)) {
        ndebeleCount++;
      }
    });

    // Determine language based on word count
    if (shonaCount > ndebeleCount && shonaCount > 0) {
      return { language: 'sn', confidence: Math.min(shonaCount / 3, 0.9) };
    } else if (ndebeleCount > shonaCount && ndebeleCount > 0) {
      return { language: 'nd', confidence: Math.min(ndebeleCount / 3, 0.9) };
    } else {
      return { language: 'en', confidence: 0.8 };
    }
  }

  /**
   * Translate text to target language
   * @param {string} text - Text to translate
   * @param {string} targetLang - Target language code
   * @param {string} category - Translation category
   * @param {object} params - Parameters for interpolation
   * @returns {string} Translated text
   */
  translate(text, targetLang = 'en', category = null, params = {}) {
    try {
      if (!this.translations[category]) {
        logger.warn(`Translation category not found: ${category}`);
        return text;
      }

      if (!this.translations[category][targetLang]) {
        logger.warn(`Translation not found for language: ${targetLang}, category: ${category}`);
        return text;
      }

      let translatedText = this.translations[category][targetLang][text] || text;

      // Replace parameters
      Object.keys(params).forEach(key => {
        const placeholder = `{${key}}`;
        translatedText = translatedText.replace(placeholder, params[key]);
      });

      return translatedText;
    } catch (error) {
      logger.error('Translation failed:', error);
      return text;
    }
  }

  /**
   * Get greeting based on time and language
   * @param {string} language - Language code
   * @param {Date} time - Current time
   * @returns {string} Appropriate greeting
   */
  getGreeting(language = 'en', time = new Date()) {
    const hour = time.getHours();
    let greetingKey = 'hello';

    if (hour < 12) {
      greetingKey = 'good_morning';
    } else if (hour < 17) {
      greetingKey = 'good_afternoon';
    } else {
      greetingKey = 'good_evening';
    }

    return this.translate(greetingKey, language, 'greetings');
  }

  /**
   * Get cultural context for language
   * @param {string} language - Language code
   * @returns {object} Cultural context
   */
  getCulturalContext(language) {
    return this.culturalContext[language] || this.culturalContext.en;
  }

  /**
   * Format response based on cultural context
   * @param {string} response - Response text
   * @param {string} language - Language code
   * @returns {string} Culturally appropriate response
   */
  formatResponse(response, language) {
    const context = this.getCulturalContext(language);

    if (context.formal_greetings && language !== 'en') {
      // Add more formal greetings for African languages
      const formalPrefixes = {
        sn: 'Mhoro, ndapota ',
        nd: 'Sawubona, sicela '
      };
      
      if (formalPrefixes[language]) {
        response = formalPrefixes[language] + response;
      }
    }

    if (context.respect_elders) {
      // Add respectful language markers
      response = response.replace(/you/g, 'you (respectfully)');
    }

    return response;
  }

  /**
   * Get language name
   * @param {string} languageCode - Language code
   * @returns {string} Language name
   */
  getLanguageName(languageCode) {
    return this.languages[languageCode] || 'Unknown';
  }

  /**
   * Get supported languages
   * @returns {array} Array of supported languages
   */
  getSupportedLanguages() {
    return Object.keys(this.languages).map(code => ({
      code,
      name: this.languages[code]
    }));
  }

  /**
   * Validate language code
   * @param {string} languageCode - Language code to validate
   * @returns {boolean} Whether language is supported
   */
  isSupportedLanguage(languageCode) {
    return Object.keys(this.languages).includes(languageCode);
  }

  /**
   * Get translation statistics
   * @returns {object} Translation statistics
   */
  getTranslationStats() {
    const stats = {};
    
    Object.keys(this.languages).forEach(lang => {
      stats[lang] = {
        language: this.languages[lang],
        categories: Object.keys(this.translations).length,
        totalTranslations: 0
      };

      Object.keys(this.translations).forEach(category => {
        if (this.translations[category][lang]) {
          stats[lang].totalTranslations += Object.keys(this.translations[category][lang]).length;
        }
      });
    });

    return stats;
  }

  /**
   * Add custom translation
   * @param {string} category - Translation category
   * @param {string} language - Language code
   * @param {string} key - Translation key
   * @param {string} value - Translation value
   */
  addTranslation(category, language, key, value) {
    if (!this.translations[category]) {
      this.translations[category] = {};
    }

    if (!this.translations[category][language]) {
      this.translations[category][language] = {};
    }

    this.translations[category][language][key] = value;
    logger.info(`Custom translation added: ${category}.${language}.${key}`);
  }

  /**
   * Get contextual response based on language and culture
   * @param {string} intent - User intent
   * @param {string} language - Language code
   * @param {object} context - Additional context
   * @returns {string} Contextual response
   */
  getContextualResponse(intent, language, context = {}) {
    const culturalContext = this.getCulturalContext(language);
    
    // Get base response
    let response = this.translate(intent, language, intent) || 
                   this.translate('general_help', language, 'support');

    // Apply cultural modifications
    if (culturalContext.family_centric && intent === 'send_money') {
      const familyAddition = {
        sn: ' Tinokurudzira kutuma mari kumhuri yako.',
        nd: ' Siyakukhuthaza ukuthumela imali emndenini wakho.',
        en: ' We encourage sending money to your family.'
      };
      response += familyAddition[language] || familyAddition.en;
    }

    if (culturalContext.community_focused && intent === 'support') {
      const communityAddition = {
        sn: ' Tinobatsira nharaunda yedu.',
        nd: ' Siyasiza umphakathi wethu.',
        en: ' We help our community.'
      };
      response += communityAddition[language] || communityAddition.en;
    }

    return this.formatResponse(response, language);
  }
}

module.exports = new LanguageService(); 