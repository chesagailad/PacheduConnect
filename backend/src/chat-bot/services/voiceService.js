const fs = require('fs').promises;
const path = require('path');
const logger = require('../../utils/logger');

class VoiceService {
  constructor() {
    this.supportedLanguages = {
      en: 'en-US',
      sn: 'en-US', // Shona - fallback to English
      nd: 'en-US'  // Ndebele - fallback to English
    };
    
    this.voiceSettings = {
      rate: 1.0,        // Speech rate (0.1 to 10)
      pitch: 1.0,       // Voice pitch (0 to 2)
      volume: 1.0       // Volume (0 to 1)
    };
    
    this.audioFormats = ['mp3', 'wav', 'ogg', 'webm'];
    this.maxAudioDuration = 300; // 5 minutes max
    this.audioCacheDir = 'uploads/voice';
    
    this.setupAudioDirectory();
  }

  /**
   * Setup audio directory for voice files
   */
  async setupAudioDirectory() {
    try {
      await fs.mkdir(this.audioCacheDir, { recursive: true });
      logger.info('Voice service audio directory created');
    } catch (error) {
      logger.error('Failed to create audio directory:', error);
    }
  }

  /**
   * Convert speech to text using Web Speech API
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} language - Language code
   * @returns {object} Speech recognition result
   */
  async speechToText(audioBuffer, language = 'en') {
    try {
      // In a real implementation, you would use a service like:
      // - Google Cloud Speech-to-Text
      // - Amazon Transcribe
      // - Microsoft Azure Speech Services
      // - OpenAI Whisper API
      
      // For now, we'll simulate the process
      const recognizedText = await this.simulateSpeechRecognition(audioBuffer, language);
      
      logger.info('Speech-to-text conversion completed', {
        language,
        textLength: recognizedText.length,
        confidence: 0.85
      });

      return {
        success: true,
        text: recognizedText,
        confidence: 0.85,
        language: this.supportedLanguages[language] || 'en-US',
        duration: audioBuffer.length / 16000 // Approximate duration
      };
    } catch (error) {
      logger.error('Speech-to-text conversion failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {object} options - Voice options
   * @returns {object} TTS result
   */
  async textToSpeech(text, language = 'en', options = {}) {
    try {
      const voiceSettings = {
        ...this.voiceSettings,
        ...options
      };

      // In a real implementation, you would use a service like:
      // - Google Cloud Text-to-Speech
      // - Amazon Polly
      // - Microsoft Azure Speech Services
      // - OpenAI TTS API
      
      const audioData = await this.simulateTextToSpeech(text, language, voiceSettings);
      const filename = await this.saveAudioFile(audioData, text, language);
      
      logger.info('Text-to-speech conversion completed', {
        textLength: text.length,
        language,
        filename,
        duration: audioData.length / 16000 // Approximate duration
      });

      return {
        success: true,
        audioUrl: `/api/chatbot/voice/audio/${filename}`,
        filename,
        duration: audioData.length / 16000,
        text,
        language
      };
    } catch (error) {
      logger.error('Text-to-speech conversion failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Simulate speech recognition (placeholder for real service)
   * @param {Buffer} audioBuffer - Audio data
   * @param {string} language - Language code
   * @returns {string} Recognized text
   */
  async simulateSpeechRecognition(audioBuffer, language) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real implementation, this would call an actual STT service
    const sampleTexts = {
      en: [
        "Hello, I need help with money transfer",
        "What are the current exchange rates?",
        "How much does it cost to send money?",
        "I want to track my transaction",
        "Can you help me with KYC verification?"
      ],
      sn: [
        "Mhoro, ndinoda rubatsiro nekutuma mari",
        "Mari dzekuchinja dzazvino ndedzipi?",
        "Mari yakadii kutuma mari?",
        "Ndinoda kutarisisa kutuma kwangu",
        "Unogona kundibatsira nekuongororwa kweKYC?"
      ],
      nd: [
        "Sawubona, ngingakusiza kanjani ngokuthumela imali?",
        "Amanani okushintshana amanje yiziphi?",
        "Imali engakanani ukuthumela imali?",
        "Ngingakusiza kanjani ukubheka ukuthumela kwami?",
        "Ungangisiza nokuqinisekiswa kweKYC?"
      ]
    };

    const texts = sampleTexts[language] || sampleTexts.en;
    return texts[Math.floor(Math.random() * texts.length)];
  }

  /**
   * Simulate text-to-speech (placeholder for real service)
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {object} settings - Voice settings
   * @returns {Buffer} Audio data
   */
  async simulateTextToSpeech(text, language, settings) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // In a real implementation, this would call an actual TTS service
    // For now, we'll create a mock audio buffer
    const audioData = Buffer.alloc(16000 * 2); // 1 second of 16kHz audio
    
    // Fill with some mock audio data
    for (let i = 0; i < audioData.length; i += 2) {
      const sample = Math.sin(i * 0.1) * 127 + 128;
      audioData.writeUInt8(sample, i);
    }
    
    return audioData;
  }

  /**
   * Save audio file to disk
   * @param {Buffer} audioData - Audio data
   * @param {string} text - Original text
   * @param {string} language - Language code
   * @returns {string} Filename
   */
  async saveAudioFile(audioData, text, language) {
    const timestamp = Date.now();
    const filename = `tts_${language}_${timestamp}.wav`;
    const filepath = path.join(this.audioCacheDir, filename);
    
    await fs.writeFile(filepath, audioData);
    
    return filename;
  }

  /**
   * Get available voices for TTS
   * @param {string} language - Language code
   * @returns {array} Available voices
   */
  getAvailableVoices(language = 'en') {
    const voices = {
      en: [
        { id: 'en-US-1', name: 'Sarah', gender: 'female', language: 'en-US' },
        { id: 'en-US-2', name: 'Michael', gender: 'male', language: 'en-US' },
        { id: 'en-US-3', name: 'Emma', gender: 'female', language: 'en-US' }
      ],
      sn: [
        { id: 'sn-ZW-1', name: 'Tendai', gender: 'female', language: 'sn-ZW' },
        { id: 'sn-ZW-2', name: 'Tatenda', gender: 'male', language: 'sn-ZW' }
      ],
      nd: [
        { id: 'nd-ZW-1', name: 'Nokuthula', gender: 'female', language: 'nd-ZW' },
        { id: 'nd-ZW-2', name: 'Sipho', gender: 'male', language: 'nd-ZW' }
      ]
    };

    return voices[language] || voices.en;
  }

  /**
   * Create voice message response
   * @param {string} text - Text to convert
   * @param {string} language - Language code
   * @param {object} options - Voice options
   * @returns {object} Voice message response
   */
  async createVoiceMessage(text, language = 'en', options = {}) {
    try {
      const ttsResult = await this.textToSpeech(text, language, options);
      
      if (!ttsResult.success) {
        return {
          success: false,
          error: ttsResult.error
        };
      }

      return {
        success: true,
        type: 'voice',
        text,
        audioUrl: ttsResult.audioUrl,
        duration: ttsResult.duration,
        language,
        options: options
      };
    } catch (error) {
      logger.error('Voice message creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Process voice input and generate response
   * @param {Buffer} audioInput - Voice input
   * @param {string} language - Language code
   * @param {object} context - Conversation context
   * @returns {object} Voice processing result
   */
  async processVoiceInput(audioInput, language = 'en', context = {}) {
    try {
      // Convert speech to text
      const sttResult = await this.speechToText(audioInput, language);
      
      if (!sttResult.success) {
        return {
          success: false,
          error: sttResult.error
        };
      }

      // Process the recognized text through chatbot
      const processedText = sttResult.text;
      
      logger.info('Voice input processed', {
        originalText: processedText,
        confidence: sttResult.confidence,
        language
      });

      return {
        success: true,
        recognizedText: processedText,
        confidence: sttResult.confidence,
        language,
        context
      };
    } catch (error) {
      logger.error('Voice input processing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate voice response for chatbot
   * @param {string} textResponse - Text response from chatbot
   * @param {string} language - Language code
   * @param {object} voiceOptions - Voice options
   * @returns {object} Voice response
   */
  async generateVoiceResponse(textResponse, language = 'en', voiceOptions = {}) {
    try {
      const voiceMessage = await this.createVoiceMessage(textResponse, language, voiceOptions);
      
      return {
        success: true,
        text: textResponse,
        voice: voiceMessage,
        language
      };
    } catch (error) {
      logger.error('Voice response generation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clean up old audio files
   * @param {number} maxAge - Maximum age in hours
   * @returns {number} Number of files cleaned
   */
  async cleanupOldAudioFiles(maxAge = 24) {
    try {
      const files = await fs.readdir(this.audioCacheDir);
      const cutoffTime = Date.now() - (maxAge * 60 * 60 * 1000);
      let cleanedCount = 0;

      for (const file of files) {
        const filepath = path.join(this.audioCacheDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.unlink(filepath);
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} old audio files`);
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup old audio files:', error);
      return 0;
    }
  }

  /**
   * Get voice service statistics
   * @returns {object} Voice service statistics
   */
  async getVoiceStats() {
    try {
      const files = await fs.readdir(this.audioCacheDir);
      const totalSize = await this.calculateDirectorySize(this.audioCacheDir);
      
      return {
        totalAudioFiles: files.length,
        totalSize: totalSize,
        supportedLanguages: Object.keys(this.supportedLanguages),
        audioFormats: this.audioFormats,
        maxDuration: this.maxAudioDuration
      };
    } catch (error) {
      logger.error('Failed to get voice stats:', error);
      return {
        totalAudioFiles: 0,
        totalSize: 0,
        supportedLanguages: Object.keys(this.supportedLanguages),
        audioFormats: this.audioFormats,
        maxDuration: this.maxAudioDuration
      };
    }
  }

  /**
   * Calculate directory size
   * @param {string} dirPath - Directory path
   * @returns {number} Total size in bytes
   */
  async calculateDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filepath = path.join(dirPath, file);
        const stats = await fs.stat(filepath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch (error) {
      logger.error('Failed to calculate directory size:', error);
      return 0;
    }
  }

  /**
   * Validate audio file
   * @param {Buffer} audioData - Audio data
   * @returns {object} Validation result
   */
  validateAudioFile(audioData) {
    const maxSize = 50 * 1024 * 1024; // 50MB max
    const minSize = 1024; // 1KB min
    
    if (audioData.length > maxSize) {
      return {
        isValid: false,
        error: 'Audio file too large (max 50MB)'
      };
    }
    
    if (audioData.length < minSize) {
      return {
        isValid: false,
        error: 'Audio file too small (min 1KB)'
      };
    }
    
    return {
      isValid: true,
      size: audioData.length
    };
  }
}

module.exports = new VoiceService(); 