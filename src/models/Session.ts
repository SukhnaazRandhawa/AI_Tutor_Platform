import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  attachments?: string[]; // File paths for uploaded documents
}

export interface ISession extends Document {
  userId: mongoose.Types.ObjectId;
  user: {
    name: string;
    language: string;
    aiTutorName: string;
  };
  messages: IMessage[];
  status: 'active' | 'paused' | 'ended';
  startTime: Date;
  endTime?: Date;
  totalDuration?: number; // in minutes
  subject?: string;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    type: String
  }]
});

const sessionSchema = new Schema<ISession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user: {
    name: {
      type: String,
      required: true
    },
    language: {
      type: String,
      required: true
    },
    aiTutorName: {
      type: String,
      required: true
    }
  },
  messages: [messageSchema],
  status: {
    type: String,
    enum: ['active', 'paused', 'ended'],
    default: 'active'
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  totalDuration: {
    type: Number
  },
  subject: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate session duration when session ends
sessionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'ended' && this.endTime) {
    const duration = Math.round((this.endTime.getTime() - this.startTime.getTime()) / (1000 * 60));
    this.totalDuration = duration;
  }
  next();
});

export default mongoose.model<ISession>('Session', sessionSchema); 