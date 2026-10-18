const { v4: uuidv4 } = require('uuid');
const voiceProfilesRepo = require('../repositories/voiceProfiles.repo');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const createProfile = asyncHandler(async (req, res) => {
  const { name, style_description, sample_listings } = req.body;
  const id = uuidv4();

  voiceProfilesRepo.create({ id, name, style_description, sample_listings });
  const profile = voiceProfilesRepo.getById(id);

  res.status(201).json({ success: true, data: profile, error: null });
});

const getProfiles = asyncHandler(async (req, res) => {
  const profiles = voiceProfilesRepo.getAll();
  res.json({ success: true, data: profiles, error: null });
});

const getProfile = asyncHandler(async (req, res) => {
  const profile = voiceProfilesRepo.getById(req.params.id);
  if (!profile) throw new AppError('Voice profile not found', 404);
  res.json({ success: true, data: profile, error: null });
});

const updateProfile = asyncHandler(async (req, res) => {
  const profile = voiceProfilesRepo.getById(req.params.id);
  if (!profile) throw new AppError('Voice profile not found', 404);

  voiceProfilesRepo.update(req.params.id, req.body);
  const updated = voiceProfilesRepo.getById(req.params.id);
  res.json({ success: true, data: updated, error: null });
});

const deleteProfile = asyncHandler(async (req, res) => {
  const profile = voiceProfilesRepo.getById(req.params.id);
  if (!profile) throw new AppError('Voice profile not found', 404);

  voiceProfilesRepo.delete(req.params.id);
  res.json({ success: true, data: { message: 'Profile deleted' }, error: null });
});

module.exports = { createProfile, getProfiles, getProfile, updateProfile, deleteProfile };
