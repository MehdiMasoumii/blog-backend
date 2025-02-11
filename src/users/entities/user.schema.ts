import { Document, Schema, Types } from 'mongoose';
import { UserRoles } from 'src/auth/entities/roles.enum';

export interface UserSafe {
  _id: string;
  fullname: string;
  email: string;
  biography: string;
  isVerifyed: boolean;
  role: UserRoles;
  likedPosts: Types.ObjectId[];
  bookmarkedPosts: Types.ObjectId[];
}

export interface User extends UserSafe, Document {
  _id: string;
  password: string;
}

export const UserSchema = new Schema<User>({
  fullname: { type: String, required: true, minlength: 4, maxlength: 36 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  biography: { type: String, maxlength: 128 },
  isVerifyed: { type: Boolean, required: true, default: false },
  role: {
    type: String,
    enum: Object.values(UserRoles),
    required: true,
    default: UserRoles.USER,
  },
  likedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  bookmarkedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
});
