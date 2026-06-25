import api from './api';

export const meetingService = {
  // Create a new meeting room
  createMeeting: async (title) => {
    try {
      const response = await api.post('/meetings/create', { title });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Server connection error' };
    }
  },

  // Validate that a room ID is active
  validateMeeting: async (roomId) => {
    try {
      const response = await api.get(`/meetings/validate/${roomId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Room validation failed' };
    }
  },
};

export default meetingService;
