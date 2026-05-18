import { AppError } from '../utils/AppError.js';

export const getEmergencySnapshot = async (req, res) => {
  throw new AppError('Emergency controls not implemented', 501);
};

export const updateEmergencyControl = async (req, res) => {
  throw new AppError('Emergency controls not implemented', 501);
};

export const requestEmergencyShutdown = async (req, res) => {
  throw new AppError('Emergency controls not implemented', 501);
};
