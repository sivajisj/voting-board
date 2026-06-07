import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string; // stored as bcrypt hash, never plain text
  role: "admin" | "voter";
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,       // no two users can share an email
      lowercase: true,    // always store as lowercase
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["admin", "voter"],   // only these two values allowed
      required: [true, "Role is required"],
    },
  },
  {
    timestamps: true, // auto adds createdAt and updatedAt fields
  }
);

const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;