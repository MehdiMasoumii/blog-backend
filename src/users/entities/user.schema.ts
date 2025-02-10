import { Document, Schema } from 'mongoose';
import { UserRoles } from 'src/auth/entities/roles.enum';

export interface User extends Document {
  id: string;
  fullname: string;
  email: string;
  password: string;
  biography: string;
  role: UserRoles;
  likedPosts: object[];
  bookmarkedPosts: object[];
}

export const UserSchema = new Schema<User>({
  fullname: { type: String, required: true, minlength: 4, maxlength: 36 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  biography: { type: String, maxlength: 128 },
  role: {
    type: String,
    enum: Object.values(UserRoles),
    required: true,
    default: UserRoles.USER,
  },
  likedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
  bookmarkedPosts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
});
