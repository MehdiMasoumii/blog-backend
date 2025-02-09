import { Document, Schema } from 'mongoose';

export interface User extends Document {
  id: string;
  fullname: string;
  email: string;
  password: string;
  biography: string;
  role: 'user' | 'admin';
  likedPosts: object[];
  bookmarkedPosts: object[];
}

export const UserSchema = new Schema<User>({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  biography: { type: String, maxlength: 128 },
  role: {
    type: String,
    enum: ['user', 'admin'],
    required: true,
    default: 'user',
  },
  likedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  bookmarkedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
});
