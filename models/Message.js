const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', default: null },
    content: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    type: { type: String, enum: ['text', 'image', 'system'], default: 'text' },
  },
  { timestamps: true }
);

messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
