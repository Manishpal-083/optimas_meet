const Meeting = require('../models/Meeting');
const dbMock = require('../models/dbMock');

// @desc    Create a new meeting room
// @route   POST /api/meetings/create
// @access  Private
const createMeeting = async (req, res) => {
  const { title, isLocked } = req.body;
  const hostId = req.user.id;

  try {
    // Generate unique Room ID (e.g., xxx-yyyy-zzz format)
    const generateRoomId = () => {
      const part1 = Math.random().toString(36).substring(2, 5);
      const part2 = Math.random().toString(36).substring(2, 6);
      const part3 = Math.random().toString(36).substring(2, 5);
      return `${part1}-${part2}-${part3}`;
    };

    let roomId = generateRoomId();
    // Ensure uniqueness
    while (dbMock.findMeetingByRoomId(roomId)) {
      roomId = generateRoomId();
    }

    const newMeeting = new Meeting({
      roomId,
      title: title || `${req.user.name}'s Meeting`,
      hostId,
      isLocked: isLocked || false,
    });

    dbMock.addMeeting(newMeeting);

    res.status(201).json({
      success: true,
      data: newMeeting,
    });
  } catch (error) {
    console.error('Create meeting error:', error);
    res.status(500).json({ success: false, message: 'Server error creating meeting room' });
  }
};

// @desc    Validate/Verify a meeting room exists and is active
// @route   GET /api/meetings/validate/:roomId
// @access  Private
const validateMeeting = async (req, res) => {
  const { roomId } = req.params;

  try {
    const meeting = dbMock.findMeetingByRoomId(roomId);

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting room not found',
      });
    }

    if (meeting.status === 'ended') {
      return res.status(400).json({
        success: false,
        message: 'This meeting room session has already ended',
      });
    }

    res.json({
      success: true,
      data: {
        roomId: meeting.roomId,
        title: meeting.title,
        hostId: meeting.hostId,
        isLocked: meeting.isLocked,
        createdAt: meeting.createdAt,
      },
    });
  } catch (error) {
    console.error('Validate meeting error:', error);
    res.status(500).json({ success: false, message: 'Server error validating meeting room' });
  }
};

module.exports = {
  createMeeting,
  validateMeeting,
};
