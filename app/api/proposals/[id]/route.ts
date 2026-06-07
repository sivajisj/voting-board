import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import { requireAuth, errorResponse } from "@/lib/middleware";
import { getReadOnlyContract } from "@/lib/contract";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    requireAuth(req);
    await connectDB();

    const { id } = await params;
    const proposal = await Proposal.findById(id);

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const contract = getReadOnlyContract();
    const [yes, no] = await contract.getVoteCounts(proposal.contractProposalId);

    return NextResponse.json({
      proposal: {
        _id: proposal._id,
        title: proposal.title,
        description: proposal.description,
        deadline: proposal.deadline,
        status: proposal.status,
        contractProposalId: proposal.contractProposalId,
        createdAt: proposal.createdAt,
        yesCount: yes.toString(),
        noCount: no.toString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}