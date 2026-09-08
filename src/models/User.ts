import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser {
  email: string;
  passwordHash: string;
  isVerified: boolean;
  privateSpacePinHash?: string | null;
  otpCode?: string | null;
  otpExpiresAt?: Date | null;
  pinResetToken?: string | null;
  pinResetExpiresAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUserDocument extends IUser, Document {}

const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    privateSpacePinHash: {
      type: String,
      default: null,
    },
    otpCode: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    pinResetToken: {
      type: String,
      default: null,
    },
    pinResetExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate model compilation in development hot-reload
const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
