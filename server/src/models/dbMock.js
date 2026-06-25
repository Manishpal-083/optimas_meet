// In-memory data store mock.
// Simulates a relational or document database behavior for Optimas Meet boilerplate.

const dbMock = {
  users: [],
  meetings: [],
  
  // Helper methods to query the data
  findUserByEmail: function (email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  
  findUserById: function (id) {
    return this.users.find(u => u.id === id);
  },
  
  addUser: function (user) {
    this.users.push(user);
    return user;
  },
  
  findMeetingByRoomId: function (roomId) {
    return this.meetings.find(m => m.roomId === roomId);
  },
  
  addMeeting: function (meeting) {
    this.meetings.push(meeting);
    return meeting;
  }
};

module.exports = dbMock;
