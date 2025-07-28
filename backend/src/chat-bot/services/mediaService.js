const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../../utils/logger');

class MediaService {
  constructor() {
    this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    this.supportedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.uploadDir = 'uploads/chatbot';
    
    this.setupStorage();
  }

  /**
   * Setup file storage configuration
   */
  setupStorage() {
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadPath = path.join(process.cwd(), this.uploadDir);
        fs.mkdir(uploadPath, { recursive: true })
          .then(() => cb(null, uploadPath))
          .catch(err => cb(err));
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      }
    });

    this.upload = multer({
      storage: this.storage,
      limits: {
        fileSize: this.maxFileSize
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, cb);
      }
    });
  }

  /**
   * Validate uploaded file
   * @param {object} file - File object
   * @param {function} cb - Callback function
   */
  validateFile(file, cb) {
    const allowedTypes = [...this.supportedImageTypes, ...this.supportedDocumentTypes];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Unsupported file type'), false);
    }
    
    cb(null, true);
  }

  /**
   * Process uploaded media file
   * @param {object} file - Uploaded file object
   * @param {string} userId - User ID
   * @param {string} sessionId - Session ID
   * @returns {object} Processed media information
   */
  async processMediaFile(file, userId, sessionId) {
    try {
      const fileInfo = {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        userId,
        sessionId,
        uploadedAt: new Date().toISOString()
      };

      // Determine media type
      if (this.supportedImageTypes.includes(file.mimetype)) {
        fileInfo.type = 'image';
        fileInfo.thumbnail = await this.generateThumbnail(file.path);
      } else if (this.supportedDocumentTypes.includes(file.mimetype)) {
        fileInfo.type = 'document';
        fileInfo.preview = await this.generateDocumentPreview(file.path);
      }

      logger.info('Media file processed successfully', {
        userId,
        sessionId,
        filename: file.filename,
        type: fileInfo.type,
        size: file.size
      });

      return fileInfo;
    } catch (error) {
      logger.error('Failed to process media file:', error);
      throw new Error('Failed to process media file');
    }
  }

  /**
   * Generate thumbnail for image
   * @param {string} imagePath - Path to image file
   * @returns {string} Thumbnail path
   */
  async generateThumbnail(imagePath) {
    try {
      // In a real implementation, you would use a library like sharp
      // to generate thumbnails. For now, we'll return the original path
      return imagePath;
    } catch (error) {
      logger.error('Failed to generate thumbnail:', error);
      return imagePath;
    }
  }

  /**
   * Generate preview for document
   * @param {string} documentPath - Path to document file
   * @returns {string} Preview path
   */
  async generateDocumentPreview(documentPath) {
    try {
      // In a real implementation, you would convert documents to images
      // For now, we'll return the original path
      return documentPath;
    } catch (error) {
      logger.error('Failed to generate document preview:', error);
      return documentPath;
    }
  }

  /**
   * Create interactive response with media
   * @param {string} text - Response text
   * @param {object} media - Media information
   * @param {string} type - Response type
   * @returns {object} Interactive response
   */
  createInteractiveResponse(text, media = null, type = 'text') {
    const response = {
      text,
      type,
      timestamp: new Date().toISOString()
    };

    if (media) {
      response.media = {
        type: media.type,
        url: `/api/chatbot/media/${media.filename}`,
        thumbnail: media.thumbnail ? `/api/chatbot/media/thumb/${media.filename}` : null,
        preview: media.preview ? `/api/chatbot/media/preview/${media.filename}` : null,
        filename: media.filename,
        originalName: media.originalName,
        size: media.size
      };
    }

    return response;
  }

  /**
   * Create carousel response with multiple media items
   * @param {string} text - Response text
   * @param {array} mediaItems - Array of media items
   * @returns {object} Carousel response
   */
  createCarouselResponse(text, mediaItems) {
    return {
      text,
      type: 'carousel',
      items: mediaItems.map(item => ({
        title: item.title || item.originalName,
        description: item.description || '',
        media: {
          type: item.type,
          url: `/api/chatbot/media/${item.filename}`,
          thumbnail: item.thumbnail ? `/api/chatbot/media/thumb/${item.filename}` : null
        },
        action: item.action || null
      })),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create quick reply response with media options
   * @param {string} text - Response text
   * @param {array} options - Quick reply options
   * @param {object} media - Optional media
   * @returns {object} Quick reply response
   */
  createQuickReplyResponse(text, options, media = null) {
    const response = {
      text,
      type: 'quick_reply',
      options: options.map(option => ({
        text: option.text,
        value: option.value,
        icon: option.icon || null,
        action: option.action || null
      })),
      timestamp: new Date().toISOString()
    };

    if (media) {
      response.media = {
        type: media.type,
        url: `/api/chatbot/media/${media.filename}`,
        thumbnail: media.thumbnail ? `/api/chatbot/media/thumb/${media.filename}` : null
      };
    }

    return response;
  }

  /**
   * Create button response
   * @param {string} text - Response text
   * @param {array} buttons - Array of button objects
   * @param {object} media - Optional media
   * @returns {object} Button response
   */
  createButtonResponse(text, buttons, media = null) {
    const response = {
      text,
      type: 'buttons',
      buttons: buttons.map(button => ({
        text: button.text,
        type: button.type || 'text', // text, url, phone, email
        value: button.value,
        icon: button.icon || null,
        style: button.style || 'primary' // primary, secondary, success, danger
      })),
      timestamp: new Date().toISOString()
    };

    if (media) {
      response.media = {
        type: media.type,
        url: `/api/chatbot/media/${media.filename}`,
        thumbnail: media.thumbnail ? `/api/chatbot/media/thumb/${media.filename}` : null
      };
    }

    return response;
  }

  /**
   * Create location response
   * @param {string} text - Response text
   * @param {object} location - Location information
   * @returns {object} Location response
   */
  createLocationResponse(text, location) {
    return {
      text,
      type: 'location',
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        name: location.name,
        address: location.address,
        mapUrl: `https://maps.google.com/?q=${location.latitude},${location.longitude}`
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create contact response
   * @param {string} text - Response text
   * @param {object} contact - Contact information
   * @returns {object} Contact response
   */
  createContactResponse(text, contact) {
    return {
      text,
      type: 'contact',
      contact: {
        name: contact.name,
        phone: contact.phone,
        email: contact.email,
        company: contact.company || 'Pachedu',
        avatar: contact.avatar || null
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create template response
   * @param {string} templateName - Template name
   * @param {object} parameters - Template parameters
   * @returns {object} Template response
   */
  createTemplateResponse(templateName, parameters = {}) {
    const templates = {
      welcome: {
        text: 'Welcome to Pachedu! How can I help you today?',
        type: 'template',
        template: 'welcome',
        parameters,
        quickReplies: [
          { text: 'Send Money', value: 'send_money' },
          { text: 'Check Rates', value: 'exchange_rate' },
          { text: 'Track Transaction', value: 'track_transaction' },
          { text: 'Get Help', value: 'support' }
        ]
      },
      kyc_guide: {
        text: 'KYC Verification Guide',
        type: 'template',
        template: 'kyc_guide',
        parameters,
        media: {
          type: 'document',
          url: '/api/chatbot/media/kyc-guide.pdf',
          filename: 'kyc-guide.pdf'
        },
        buttons: [
          { text: 'Start KYC', type: 'url', value: '/kyc/start' },
          { text: 'Download Guide', type: 'url', value: '/api/chatbot/media/kyc-guide.pdf' }
        ]
      },
      exchange_rates: {
        text: 'Current Exchange Rates',
        type: 'template',
        template: 'exchange_rates',
        parameters,
        media: {
          type: 'image',
          url: '/api/chatbot/media/exchange-rates.png',
          filename: 'exchange-rates.png'
        },
        quickReplies: [
          { text: 'USD to ZAR', value: 'rate_usd_zar' },
          { text: 'EUR to ZAR', value: 'rate_eur_zar' },
          { text: 'GBP to ZAR', value: 'rate_gbp_zar' }
        ]
      }
    };

    return templates[templateName] || {
      text: 'Template not found',
      type: 'text',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get media file by filename
   * @param {string} filename - File name
   * @returns {object} File information
   */
  async getMediaFile(filename) {
    try {
      const filePath = path.join(process.cwd(), this.uploadDir, filename);
      const stats = await fs.stat(filePath);
      
      return {
        filename,
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      };
    } catch (error) {
      logger.error('Failed to get media file:', error);
      throw new Error('Media file not found');
    }
  }

  /**
   * Delete media file
   * @param {string} filename - File name
   * @returns {boolean} Success status
   */
  async deleteMediaFile(filename) {
    try {
      const filePath = path.join(process.cwd(), this.uploadDir, filename);
      await fs.unlink(filePath);
      
      logger.info('Media file deleted successfully', { filename });
      return true;
    } catch (error) {
      logger.error('Failed to delete media file:', error);
      return false;
    }
  }

  /**
   * Clean up old media files
   * @param {number} daysOld - Number of days old to consider for cleanup
   * @returns {number} Number of files deleted
   */
  async cleanupOldFiles(daysOld = 30) {
    try {
      const uploadPath = path.join(process.cwd(), this.uploadDir);
      const files = await fs.readdir(uploadPath);
      const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000));
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(uploadPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filePath);
          deletedCount++;
        }
      }

      logger.info(`Cleaned up ${deletedCount} old media files`);
      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old files:', error);
      return 0;
    }
  }

  /**
   * Get media statistics
   * @returns {object} Media statistics
   */
  async getMediaStats() {
    try {
      const uploadPath = path.join(process.cwd(), this.uploadDir);
      const files = await fs.readdir(uploadPath);
      
      let totalSize = 0;
      const typeStats = {};

      for (const file of files) {
        const filePath = path.join(uploadPath, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        const ext = path.extname(file).toLowerCase();
        typeStats[ext] = (typeStats[ext] || 0) + 1;
      }

      return {
        totalFiles: files.length,
        totalSize,
        typeStats,
        uploadDir: this.uploadDir
      };
    } catch (error) {
      logger.error('Failed to get media stats:', error);
      return {
        totalFiles: 0,
        totalSize: 0,
        typeStats: {},
        uploadDir: this.uploadDir
      };
    }
  }

  /**
   * Get multer upload middleware
   * @returns {object} Multer upload middleware
   */
  getUploadMiddleware() {
    return this.upload;
  }

  /**
   * Get supported file types
   * @returns {object} Supported file types
   */
  getSupportedTypes() {
    return {
      images: this.supportedImageTypes,
      documents: this.supportedDocumentTypes,
      maxSize: this.maxFileSize
    };
  }
}

module.exports = new MediaService(); 