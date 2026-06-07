import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import { requireVoter, errorResponse } from "@/lib/middleware";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireVoter(req);
    await connectDB();

    const { id } = await params;
    const { vote, walletAddress, txHash } = await req.json();

    if (vote === undefined || !walletAddress) {
      return NextResponse.json(
        { error: "Vote and wallet address are required" },
        { status: 400 }
      );
    }

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.status === "closed") {
      return NextResponse.json(
        { error: "Proposal is closed" },
        { status: 400 }
      );
    }

    if (new Date() > proposal.deadline) {
      return NextResponse.json(
        { error: "Proposal deadline has passed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Vote recorded on-chain",
      txHash,
      proposalId: id,
    });
  } catch (err) {
    return errorResponse(err);
  }
}