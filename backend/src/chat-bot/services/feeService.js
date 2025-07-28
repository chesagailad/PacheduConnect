/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: feeService - handles backend functionality
 */

const { calculateFee, getFeeBreakdown, validateTransferWithFees } = require('../../utils/feeCalculator');
const logger = require('../../utils/logger');

class ChatbotFeeService {
  constructor() {
    this.supportedCurrencies = ['USD', 'EUR', 'GBP', 'ZAR', 'MWK', 'MZN'];
    this.supportedSpeeds = ['standard', 'express'];
  }

  /**
   * Calculate fees for a transfer amount
   * @param {number} amount - Transfer amount
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {string} speed - Processing speed
   * @returns {object} Fee calculation result
   */
  calculateTransferFees(amount, fromCurrency = 'USD', toCurrency = 'USD', speed = 'standard') {
    try {
      // Validate inputs
      if (amount <= 0) {
        throw new Error('Transfer amount must be positive');
      }

      if (!this.supportedCurrencies.includes(fromCurrency) || !this.supportedCurrencies.includes(toCurrency)) {
        throw new Error('Unsupported currency');
      }

      if (!this.supportedSpeeds.includes(speed)) {
        throw new Error('Invalid processing speed');
      }

      const feeInfo = calculateFee(amount, fromCurrency, toCurrency, speed);
      
      logger.info('Fee calculation completed', {
        amount,
        fromCurrency,
        toCurrency,
        speed,
        totalFee: feeInfo.totalFee,
        totalAmount: feeInfo.totalAmount
      });

      return {
        success: true,
        ...feeInfo
      };
    } catch (error) {
      logger.error('Fee calculation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get detailed fee breakdown for display
   * @param {number} amount - Transfer amount
   * @param {string} currency - Currency
   * @returns {object} Detailed fee breakdown
   */
  getDetailedFeeBreakdown(amount, currency = 'USD') {
    try {
      const breakdown = getFeeBreakdown(amount, currency);
      
      return {
        success: true,
        ...breakdown
      };
    } catch (error) {
      logger.error('Fee breakdown failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate user-friendly fee explanation
   * @param {number} amount - Transfer amount
   * @param {string} fromCurrency - Source currency
   * @param {string} toCurrency - Target currency
   * @param {string} speed - Processing speed
   * @param {string} language - Language for explanation
   * @returns {object} User-friendly fee explanation
   */
  generateFeeExplanation(amount, fromCurrency = 'USD', toCurrency = 'USD', speed = 'standard', language = 'en') {
    try {
      const feeInfo = this.calculateTransferFees(amount, fromCurrency, toCurrency, speed);
      
      if (!feeInfo.success) {
        return {
          success: false,
          error: feeInfo.error
        };
      }

      const explanations = {
        en: {
          title: 'Transfer Fee Breakdown',
          summary: `For a ${fromCurrency} ${amount.toLocaleString()} transfer to ${toCurrency}:`,
          breakdown: [
            `💰 Transfer Fee: ${fromCurrency} ${feeInfo.transferFee} (3% of amount)`,
            `⚡ Processing Fee: ${fromCurrency} ${feeInfo.processingFee} (${speed === 'express' ? '1%' : '0.5%'})`,
            feeInfo.exchangeMargin > 0 ? `🔄 Exchange Margin: ${fromCurrency} ${feeInfo.exchangeMargin} (0.5%)` : null,
            feeInfo.regulatoryFee > 0 ? `📋 Regulatory Fee: ${fromCurrency} ${feeInfo.regulatoryFee} (0.1% for large amounts)` : null
          ].filter(Boolean),
          total: `Total Fee: ${fromCurrency} ${feeInfo.totalFee}`,
          totalAmount: `Total Amount (including fees): ${fromCurrency} ${feeInfo.totalAmount}`,
          note: speed === 'express' ? 'Express processing for faster delivery' : 'Standard processing (2-3 business days)'
        },
        sn: {
          title: 'Kubhadhara Mari Yekutuma',
          summary: `Kune kutuma kwe ${fromCurrency} ${amount.toLocaleString()} kuenda ku ${toCurrency}:`,
          breakdown: [
            `💰 Mari Yekutuma: ${fromCurrency} ${feeInfo.transferFee} (3% yemari)`,
            `⚡ Mari Yekugadzirisa: ${fromCurrency} ${feeInfo.processingFee} (${speed === 'express' ? '1%' : '0.5%'})`,
            feeInfo.exchangeMargin > 0 ? `🔄 Mari Yekuchinja: ${fromCurrency} ${feeInfo.exchangeMargin} (0.5%)` : null,
            feeInfo.regulatoryFee > 0 ? `📋 Mari Yemutemo: ${fromCurrency} ${feeInfo.regulatoryFee} (0.1% yemari huru)` : null
          ].filter(Boolean),
          total: `Mari Yese: ${fromCurrency} ${feeInfo.totalFee}`,
          totalAmount: `Mari Yese (inosanganisira mari): ${fromCurrency} ${feeInfo.totalAmount}`,
          note: speed === 'express' ? 'Kugadzirisa nekukurumidza kuti isvike nekukurumidza' : 'Kugadzirisa kwakajairika (mazuva 2-3 ebhizimisi)'
        },
        nd: {
          title: 'Ukukhokha Imali Yokuthumela',
          summary: `Kokuthumela kuka-${fromCurrency} ${amount.toLocaleString()} kuya ku-${toCurrency}:`,
          breakdown: [
            `💰 Imali Yokuthumela: ${fromCurrency} ${feeInfo.exchangeMargin} (3% yemali)`,
            `⚡ Imali Yokucubungula: ${fromCurrency} ${feeInfo.processingFee} (${speed === 'express' ? '1%' : '0.5%'})`,
            feeInfo.exchangeMargin > 0 ? `🔄 Imali Yokushintshana: ${fromCurrency} ${feeInfo.exchangeMargin} (0.5%)` : null,
            feeInfo.regulatoryFee > 0 ? `📋 Imali Yomthetho: ${fromCurrency} ${feeInfo.regulatoryFee} (0.1% yemali enkulu)` : null
          ].filter(Boolean),
          total: `Imali Yonke: ${fromCurrency} ${feeInfo.totalFee}`,
          totalAmount: `Imali Yonke (kubandakanya imali): ${fromCurrency} ${feeInfo.totalAmount}`,
          note: speed === 'express' ? 'Ukucubungula ngokushesha ukuze kufike ngokushesha' : 'Ukucubungula okujwayelekile (izinsuku 2-3 zomsebenzi)'
        }
      };

      const explanation = explanations[language] || explanations.en;
      
      return {
        success: true,
        explanation,
        feeInfo
      };
    } catch (error) {
      logger.error('Fee explanation generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compare fees for different amounts
   * @param {array} amounts - Array of amounts to compare
   * @param {string} currency - Currency
   * @param {string} language - Language
   * @returns {object} Fee comparison
   */
  compareFees(amounts, currency = 'USD', language = 'en') {
    try {
      const comparisons = amounts.map(amount => {
        const feeInfo = this.calculateTransferFees(amount, currency);
        return {
          amount,
          fee: feeInfo.totalFee,
          totalAmount: feeInfo.totalAmount,
          feePercentage: ((feeInfo.totalFee / amount) * 100).toFixed(2)
        };
      });

      const comparisonTexts = {
        en: {
          title: 'Fee Comparison',
          summary: `Here's how our fees scale with different amounts:`,
          examples: comparisons.map(comp => 
            `${currency} ${comp.amount.toLocaleString()}: ${currency} ${comp.fee} (${comp.feePercentage}% effective rate)`
          ),
          note: 'Our 3% flat fee structure ensures transparency and predictability'
        },
        sn: {
          title: 'Kuenzanisa Mari',
          summary: `Heino kuti mari yedu inokura sei nemari dzakasiyana:`,
          examples: comparisons.map(comp => 
            `${currency} ${comp.amount.toLocaleString()}: ${currency} ${comp.fee} (${comp.feePercentage}% mari inoshanda)`
          ),
          note: 'Mari yedu ye3% yakajairika inovimbisa pachena uye kufanotaura'
        },
        nd: {
          title: 'Ukuqhathanisa Imali',
          summary: `Nakhu ukuthi imali yethu ikhula kanjani ngemali ehlukene:`,
          examples: comparisons.map(comp => 
            `${currency} ${comp.amount.toLocaleString()}: ${currency} ${comp.fee} (${comp.feePercentage}% inani elisebenza)`
          ),
          note: 'Uhlelo lwethu lwemali olungu-3% luqinisekisa ukucacileka nokubikezela'
        }
      };

      return {
        success: true,
        comparison: comparisonTexts[language] || comparisonTexts.en,
        data: comparisons
      };
    } catch (error) {
      logger.error('Fee comparison failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get fee examples for common amounts
   * @param {string} currency - Currency
   * @param {string} language - Language
   * @returns {object} Fee examples
   */
  getFeeExamples(currency = 'USD', language = 'en') {
    const commonAmounts = [100, 500, 1000, 2500, 5000, 10000];
    return this.compareFees(commonAmounts, currency, language);
  }

  /**
   * Validate user balance for transfer
   * @param {number} userBalance - User's balance
   * @param {number} transferAmount - Transfer amount
   * @param {string} currency - Currency
   * @returns {object} Validation result
   */
  validateTransferBalance(userBalance, transferAmount, currency = 'USD') {
    try {
      const validation = validateTransferWithFees(userBalance, transferAmount, currency);
      
      const messages = {
        en: {
          sufficient: `✅ Sufficient balance! You can proceed with the transfer.`,
          insufficient: `❌ Insufficient balance. You need ${currency} ${validation.shortfall.toFixed(2)} more.`,
          breakdown: `Transfer: ${currency} ${validation.transferAmount}\nFees: ${currency} ${validation.feeAmount}\nTotal Required: ${currency} ${validation.totalRequired}\nYour Balance: ${currency} ${validation.userBalance}`
        },
        sn: {
          sufficient: `✅ Mari yakakwana! Unogona kuenderera mberi nekutuma.`,
          insufficient: `❌ Mari haikwana. Unoda ${currency} ${validation.shortfall.toFixed(2)} zvimwe.`,
          breakdown: `Kutuma: ${currency} ${validation.transferAmount}\nMari: ${currency} ${validation.feeAmount}\nMari Yese Inodiwa: ${currency} ${validation.totalRequired}\nMari Yako: ${currency} ${validation.userBalance}`
        },
        nd: {
          sufficient: `✅ Imali eyanele! Ungaqhubeka nokuthumela.`,
          insufficient: `❌ Imali ayanele. Udinga ${currency} ${validation.shortfall.toFixed(2)} okwengeziwe.`,
          breakdown: `Ukuthumela: ${currency} ${validation.transferAmount}\nImali: ${currency} ${validation.feeAmount}\nImali Eyodwa Edingekayo: ${currency} ${validation.totalRequired}\nImali Yakho: ${currency} ${validation.userBalance}`
        }
      };

      return {
        success: true,
        isValid: validation.isValid,
        message: validation.isValid ? messages.en.sufficient : messages.en.insufficient,
        breakdown: messages.en.breakdown,
        data: validation
      };
    } catch (error) {
      logger.error('Balance validation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get supported currencies and speeds
   * @returns {object} Supported options
   */
  getSupportedOptions() {
    return {
      currencies: this.supportedCurrencies,
      speeds: this.supportedSpeeds,
      feeStructure: {
        transferFee: '3% flat rate',
        processingFee: '0.5% standard, 1% express',
        exchangeMargin: '0.5% for currency conversion',
        regulatoryFee: '0.1% for amounts ≥ $50,000 (capped at $25)'
      }
    };
  }

  /**
   * Get fee statistics
   * @returns {object} Fee statistics
   */
  getFeeStats() {
    return {
      totalCalculations: 0, // Would be tracked in production
      averageFee: '3.5%', // Average effective rate
      mostPopularAmount: '$1000',
      supportedCurrencies: this.supportedCurrencies.length,
      feeStructure: 'Flat 3% + variable processing fees'
    };
  }
}

module.exports = new ChatbotFeeService(); 