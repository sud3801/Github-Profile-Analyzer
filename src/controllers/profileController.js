const {
  deleteProfileByUsername,
  findAllProfiles,
  findProfileByUsername,
  upsertProfile,
} = require('../models/profileModel');
const { analyzeGitHubProfile } = require('../services/analysisService');
const { fetchCompleteGitHubProfile } = require('../services/githubService');

const analyzeProfile = async (req, res, next) => {
  try {
    const username = req.params.username.trim();

    const githubData = await fetchCompleteGitHubProfile(username);
    const analyzedProfile = analyzeGitHubProfile(githubData);
    const savedProfile = await upsertProfile(analyzedProfile);

    res.status(201).json({
      success: true,
      message: 'GitHub profile analyzed successfully',
      data: savedProfile,
    });
  } catch (error) {
    next(error);
  }
};

const getProfiles = async (req, res, next) => {
  try {
    const profiles = await findAllProfiles();

    res.status(200).json({
      success: true,
      count: profiles.length,
      data: profiles,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const username = req.params.username.trim();
    const profile = await findProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: `Stored profile "${username}" was not found`,
      });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const username = req.params.username.trim();
    const wasDeleted = await deleteProfileByUsername(username);

    if (!wasDeleted) {
      return res.status(404).json({
        success: false,
        message: `Stored profile "${username}" was not found`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Stored profile "${username}" deleted successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  analyzeProfile,
  deleteProfile,
  getProfile,
  getProfiles,
};
