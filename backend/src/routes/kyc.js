const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getSequelize } = require('../utils/database');
const createUserModel = require('../models/User');
const createKYCModel = require('../models/KYC');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/kyc');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'));
    }
  }
});

// Get user's KYC status
router.get('/status', auth, async (req, res) => {
  try {
    const KYC = createKYCModel(getSequelize());
    let kyc = await KYC.findOne({
      where: { userId: req.user.id }
    });
    
    // If no KYC record exists, create a default Bronze level record
    if (!kyc) {
      console.log(`Creating default Bronze KYC record for user ${req.user.id}`);
      kyc = await KYC.create({
        userId: req.user.id,
        level: 'bronze',
        status: 'approved', // Bronze level is auto-approved
        monthlySendLimit: 5000.00,
        currentMonthSent: 0.00,
        resetDate: new Date()
      });
    }
    
    res.json({
      kyc: {
        id: kyc.id,
        level: kyc.level,
        status: kyc.status,
        monthlySendLimit: kyc.monthlySendLimit,
        currentMonthSent: kyc.currentMonthSent,
        resetDate: kyc.resetDate,
        verifiedAt: kyc.verifiedAt,
        rejectionReason: kyc.rejectionReason
      }
    });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ message: 'Failed to fetch KYC status' });
  }
});

// Upload Bronze level documents (ID + Selfie + Address)
router.post('/upload-bronze', auth, upload.fields([
  { name: 'idDocument', maxCount: 1 },
  { name: 'selfieWithId', maxCount: 1 }
]), async (req, res) => {
  try {
    const KYC = createKYCModel(getSequelize());
    
    const kyc = await KYC.findOne({ where: { userId: req.user.id } });
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    if (kyc.level !== 'bronze') {
      return res.status(400).json({ message: 'Can only upload Bronze documents for Bronze level' });
    }

    const { homeAddress } = req.body;
    if (!homeAddress) {
      return res.status(400).json({ message: 'Home address is required' });
    }

    const updateData = {
      homeAddress,
      status: 'pending'
    };

    if (req.files.idDocument) {
      updateData.idDocument = req.files.idDocument[0].path;
    }
    if (req.files.selfieWithId) {
      updateData.selfieWithId = req.files.selfieWithId[0].path;
    }

    await kyc.update(updateData);

    res.json({ 
      message: 'Bronze level documents uploaded successfully',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error uploading Bronze documents:', error);
    res.status(500).json({ message: 'Failed to upload documents' });
  }
});

// Upload Silver level documents (Certified ID + Proof of Address + Job Title)
router.post('/upload-silver', auth, upload.fields([
  { name: 'certifiedIdDocument', maxCount: 1 },
  { name: 'proofOfAddress', maxCount: 1 }
]), async (req, res) => {
  try {
    const KYC = createKYCModel(getSequelize());
    
    const kyc = await KYC.findOne({ where: { userId: req.user.id } });
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    if (kyc.level !== 'silver') {
      return res.status(400).json({ message: 'Can only upload Silver documents for Silver level' });
    }

    const { jobTitle } = req.body;
    if (!jobTitle) {
      return res.status(400).json({ message: 'Job title is required' });
    }

    const updateData = {
      jobTitle,
      status: 'pending'
    };

    if (req.files.certifiedIdDocument) {
      updateData.certifiedIdDocument = req.files.certifiedIdDocument[0].path;
    }
    if (req.files.proofOfAddress) {
      updateData.proofOfAddress = req.files.proofOfAddress[0].path;
    }

    await kyc.update(updateData);

    res.json({ 
      message: 'Silver level documents uploaded successfully',
      status: 'pending'
    });
  } catch (error) {
    console.error('Error uploading Silver documents:', error);
    res.status(500).json({ message: 'Failed to upload documents' });
  }
});

// Admin: Get all pending KYC verifications
router.get('/pending', auth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const KYC = createKYCModel(getSequelize());
    
    // Check if user is admin
    const adminUser = await User.findByPk(req.user.id);
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const pendingKYC = await KYC.findAll({
      where: { status: 'pending' },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ pendingKYC });
  } catch (error) {
    console.error('Error fetching pending KYC:', error);
    res.status(500).json({ message: 'Failed to fetch pending KYC' });
  }
});

// Admin: Approve KYC verification
router.post('/approve/:kycId', auth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const KYC = createKYCModel(getSequelize());
    
    // Check if user is admin
    const adminUser = await User.findByPk(req.user.id);
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const kyc = await KYC.findByPk(req.params.kycId);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    // Determine next level
    let nextLevel = kyc.level;
    if (kyc.level === 'bronze') {
      nextLevel = 'silver';
    } else if (kyc.level === 'silver') {
      nextLevel = 'gold';
    }

    await kyc.update({
      level: nextLevel,
      status: 'approved',
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    });

    // Send SMS to user notifying approval
    try {
      const UserModel = createUserModel(getSequelize());
      const user = await UserModel.findByPk(kyc.userId);
      if (user && user.phoneNumber) {
        await require('../services/smsService').sendSMS(
          user.phoneNumber,
          `Your KYC has been approved! You are now at the ${nextLevel.charAt(0).toUpperCase() + nextLevel.slice(1)} level.`
        );
      }
    } catch (smsError) {
      console.error('Failed to send KYC approval SMS:', smsError);
    }

    res.json({ 
      message: 'KYC approved successfully',
      newLevel: nextLevel
    });
  } catch (error) {
    console.error('Error approving KYC:', error);
    res.status(500).json({ message: 'Failed to approve KYC' });
  }
});

// Admin: Reject KYC verification
router.post('/reject/:kycId', auth, async (req, res) => {
  try {
    const User = createUserModel(getSequelize());
    const KYC = createKYCModel(getSequelize());
    
    // Check if user is admin
    const adminUser = await User.findByPk(req.user.id);
    if (adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { rejectionReason } = req.body;
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const kyc = await KYC.findByPk(req.params.kycId);
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    await kyc.update({
      status: 'rejected',
      rejectionReason,
      verifiedBy: req.user.id,
      verifiedAt: new Date()
    });

    // Send SMS to user notifying rejection
    try {
      const UserModel = createUserModel(getSequelize());
      const user = await UserModel.findByPk(kyc.userId);
      if (user && user.phoneNumber) {
        await require('../services/smsService').sendSMS(
          user.phoneNumber,
          `Your KYC was rejected. Reason: ${rejectionReason}`
        );
      }
    } catch (smsError) {
      console.error('Failed to send KYC rejection SMS:', smsError);
    }

    res.json({ message: 'KYC rejected successfully' });
  } catch (error) {
    console.error('Error rejecting KYC:', error);
    res.status(500).json({ message: 'Failed to reject KYC' });
  }
});

// Check if user can send amount (for transaction validation)
router.post('/check-send-limit', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const KYC = createKYCModel(getSequelize());
    const kyc = await KYC.findOne({ where: { userId: req.user.id } });
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    const canSend = kyc.canSendAmount(parseFloat(amount));
    const remainingLimit = kyc.monthlySendLimit - kyc.currentMonthSent;

    res.json({
      canSend,
      monthlyLimit: kyc.monthlySendLimit,
      currentMonthSent: kyc.currentMonthSent,
      remainingLimit: Math.max(0, remainingLimit),
      kycLevel: kyc.level,
      kycStatus: kyc.status
    });
  } catch (error) {
    console.error('Error checking send limit:', error);
    res.status(500).json({ message: 'Failed to check send limit' });
  }
});

// Update monthly sent amount (called after successful transaction)
router.post('/update-sent-amount', auth, async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    const KYC = createKYCModel(getSequelize());
    const kyc = await KYC.findOne({ where: { userId: req.user.id } });
    
    if (!kyc) {
      return res.status(404).json({ message: 'KYC record not found' });
    }

    kyc.addToMonthlySent(parseFloat(amount));
    await kyc.save();

    res.json({ 
      message: 'Monthly sent amount updated',
      currentMonthSent: kyc.currentMonthSent
    });
  } catch (error) {
    console.error('Error updating sent amount:', error);
    res.status(500).json({ message: 'Failed to update sent amount' });
  }
});

module.exports = router; 