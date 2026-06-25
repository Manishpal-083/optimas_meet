// Meeting model representation.
// Blueprint for database integration (MongoDB/Mongoose example) and Phase 1 in-memory constructor.

/*
// MongoDB / Mongoose Schema Blueprint:
const mongoose = require('mongoose');

const MeetingSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'ended'], default: 'active' },
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now }
  }],
  isLocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date }
});

module.exports = mongoose.model('Meeting', MeetingSchema);
*/

// Phase 1 In-Memory Blueprint:
class Meeting {
  constructor({ roomId, title, hostId, isLocked }) {
    this.roomId = roomId || Math.random().toString(36).substring(2, 9);
    this.title = title || 'Optimas Meeting';
    this.hostId = hostId;
    this.status = 'active';
    this.participants = [];
    this.isLocked = isLocked || false;
    this.createdAt = new Date();
    this.endedAt = null;
  }
}

module.exports = Meeting;
