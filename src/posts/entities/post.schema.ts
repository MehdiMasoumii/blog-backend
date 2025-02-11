import { Document, Schema, Types } from 'mongoose';

export interface PostSafe {
  title: string;
  description: string;
  content: string;
  tags: string[];
  likes: Types.ObjectId[];
  author: Types.ObjectId;
  createdDate: Date;
  lastModifiedDate: Date;
  coverImage: string;
  isPublished: boolean;
}

export interface Post extends PostSafe, Document {
  id: string;
}

export const PostSchema = new Schema<Post>({
  title: { type: String, required: true, minlength: 5, maxlength: 48 },
  description: { type: String, maxlength: 256 },
  content: { type: String },
  tags: { type: [String] },
  likes: { type: [Schema.Types.ObjectId], ref: 'User' },
  author: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
  coverImage: { type: String },
  isPublished: { type: Boolean, required: true, default: false },
  createdDate: { type: Date, required: true, default: new Date() },
  lastModifiedDate: { type: Date, required: true, default: new Date() },
});
