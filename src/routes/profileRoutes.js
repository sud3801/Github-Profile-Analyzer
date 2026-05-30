const express = require('express');

const {
  analyzeProfile,
  deleteProfile,
  getProfile,
  getProfiles,
} = require('../controllers/profileController');

const router = express.Router();

router.post('/analyze/:username', analyzeProfile);
router.get('/', getProfiles);
router.get('/:username', getProfile);
router.delete('/:username', deleteProfile);

module.exports = router;
