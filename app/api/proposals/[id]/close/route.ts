import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import { requireAdmin, errorResponse } from "@/lib/middleware";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAdmin(req);
    await connectDB();

    const { id } = await params;
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    if (proposal.status === "closed") {
      return NextResponse.json(
        { error: "Proposal is already closed" },
        { status: 400 }
      );
    }

    proposal.status = "closed";
    await proposal.save();

    return NextResponse.json({
      message: "Proposal closed successfully",
      proposalId: id,
    });
  } catch (err) {
    return errorResponse(err);
  }
}