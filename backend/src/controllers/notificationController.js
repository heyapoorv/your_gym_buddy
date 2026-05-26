const Notification = require('../models/Notification');
const { sendSuccess } = require('../utils/apiResponse');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ gymId: req.user.gymId })
      .sort({ createdAt: -1 })
      .limit(50);
    
    return sendSuccess(res, 200, 'Notifications fetched successfully', { notifications });
  } catch (error) {
    next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, gymId: req.user.gymId },
      { read: true },
      { new: true }
    );
    return sendSuccess(res, 200, 'Notification marked as read', { notification });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { gymId: req.user.gymId, read: false },
      { read: true }
    );
    return sendSuccess(res, 200, 'All notifications marked as read', {});
  } catch (error) {
    next(error);
  }
};
