import mongoose, { Document, Schema } from "mongoose";

// This describes the shape of a Proposal document in TypeScript
export interface IProposal extends Document {
  title: string;
  description: string;
  deadline: Date;
  status: "open" | "closed";
  createdBy: mongoose.Types.ObjectId; // references the admin User
  contractProposalId: number;         // the ID of this proposal on-chain
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema = new Schema<IProposal>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    deadline: {
      type: Date,
      required: [true, "Deadline is required"],
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",              // all proposals start as open
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",                  // links to the User collection
      required: true,
    },
    contractProposalId: {
      type: Number,
      required: [true, "Contract proposal ID is required"],
      unique: true,                 // each proposal maps to exactly one on-chain ID
    },
  },
  {
    timestamps: true,
  }
);

const Proposal =
  mongoose.models.Proposal ??
  mongoose.model<IProposal>("Proposal", ProposalSchema);

export default Proposal;