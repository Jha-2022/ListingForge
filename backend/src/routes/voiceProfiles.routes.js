const express = require('express');
const router = express.Router();
const voiceProfilesController = require('../controllers/voiceProfiles.controller');
const validate = require('../middlewares/validate');
const {
  createVoiceProfileSchema,
  updateVoiceProfileSchema,
} = require('../schemas/voiceProfile.schema');

router.post('/', validate(createVoiceProfileSchema), voiceProfilesController.createProfile);
router.get('/', voiceProfilesController.getProfiles);
router.get('/:id', voiceProfilesController.getProfile);
router.patch('/:id', validate(updateVoiceProfileSchema), voiceProfilesController.updateProfile);
router.put('/:id', validate(updateVoiceProfileSchema), voiceProfilesController.updateProfile);
router.delete('/:id', voiceProfilesController.deleteProfile);

module.exports = router;
