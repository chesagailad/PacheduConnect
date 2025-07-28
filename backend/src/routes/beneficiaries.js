/**
 * Author: Gailad Chesa
 * Created: 2024-01-01
 * Description: beneficiaries - handles backend functionality
 */

const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/auth');
const { getSequelize } = require('../utils/database');
const { createBeneficiaryModel } = require('../models');
const { logger } = require('../utils/logger');

// Get all beneficiaries for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const Beneficiary = createBeneficiaryModel(getSequelize());
    const beneficiaries = await Beneficiary.findAll({
      where: {
        userId: req.user.id,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: beneficiaries,
      message: 'Beneficiaries retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching beneficiaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiaries',
      error: error.message,
    });
  }
});

// Get a specific beneficiary by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const Beneficiary = createBeneficiaryModel(getSequelize());
    
    const beneficiary = await Beneficiary.findOne({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    res.json({
      success: true,
      data: beneficiary,
      message: 'Beneficiary retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiary',
      error: error.message,
    });
  }
});

// Create a new beneficiary
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      bankName,
      accountNumber,
      accountType,
      swiftCode,
      routingNumber,
      country,
      address,
      notes,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    const Beneficiary = createBeneficiaryModel(getSequelize());
    
    const beneficiary = await Beneficiary.create({
      userId: req.user.id,
      name,
      email,
      phoneNumber,
      bankName,
      accountNumber,
      accountType,
      swiftCode,
      routingNumber,
      country,
      address,
      notes,
    });

    res.status(201).json({
      success: true,
      data: beneficiary,
      message: 'Beneficiary created successfully',
    });
  } catch (error) {
    logger.error('Error creating beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create beneficiary',
      error: error.message,
    });
  }
});

// Update a beneficiary
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phoneNumber,
      bankName,
      accountNumber,
      accountType,
      swiftCode,
      routingNumber,
      country,
      address,
      notes,
    } = req.body;

    const Beneficiary = createBeneficiaryModel(getSequelize());
    
    const beneficiary = await Beneficiary.findOne({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (accountType !== undefined) updateData.accountType = accountType;
    if (swiftCode !== undefined) updateData.swiftCode = swiftCode;
    if (routingNumber !== undefined) updateData.routingNumber = routingNumber;
    if (country !== undefined) updateData.country = country;
    if (address !== undefined) updateData.address = address;
    if (notes !== undefined) updateData.notes = notes;

    await beneficiary.update(updateData);

    res.json({
      success: true,
      data: beneficiary,
      message: 'Beneficiary updated successfully',
    });
  } catch (error) {
    logger.error('Error updating beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update beneficiary',
      error: error.message,
    });
  }
});

// Delete a beneficiary (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const Beneficiary = createBeneficiaryModel(getSequelize());
    
    const beneficiary = await Beneficiary.findOne({
      where: {
        id,
        userId: req.user.id,
        isActive: true,
      },
    });

    if (!beneficiary) {
      return res.status(404).json({
        success: false,
        message: 'Beneficiary not found',
      });
    }

    // Soft delete by setting isActive to false
    await beneficiary.update({ isActive: false });

    res.json({
      success: true,
      message: 'Beneficiary deleted successfully',
    });
  } catch (error) {
    logger.error('Error deleting beneficiary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete beneficiary',
      error: error.message,
    });
  }
});

// Search beneficiaries
router.get('/search/:query', authenticateToken, async (req, res) => {
  try {
    const { query } = req.params;
    const Beneficiary = createBeneficiaryModel(getSequelize());
    
    const { Op } = require('sequelize');
    
    const beneficiaries = await Beneficiary.findAll({
      where: {
        userId: req.user.id,
        isActive: true,
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { phoneNumber: { [Op.iLike]: `%${query}%` } },
          { bankName: { [Op.iLike]: `%${query}%` } },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: beneficiaries,
      message: 'Search completed successfully',
    });
  } catch (error) {
    logger.error('Error searching beneficiaries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search beneficiaries',
      error: error.message,
    });
  }
});

// Get beneficiaries by country
router.get('/country/:country', authenticateToken, async (req, res) => {
  try {
    const { country } = req.params;
    const Beneficiary = createBeneficiaryModel(getSequelize());
    
    const beneficiaries = await Beneficiary.findAll({
      where: {
        userId: req.user.id,
        isActive: true,
        country: { [require('sequelize').Op.iLike]: `%${country}%` },
      },
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: beneficiaries,
      message: 'Beneficiaries by country retrieved successfully',
    });
  } catch (error) {
    logger.error('Error fetching beneficiaries by country:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch beneficiaries by country',
      error: error.message,
    });
  }
});

module.exports = router; 