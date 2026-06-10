import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Proposal from "@/models/Proposal";
import { requireAuth, requireAdmin, errorResponse } from "@/lib/middleware";
import { getReadOnlyContract } from "@/lib/contract";

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
    await connectDB();

    const proposals = await Proposal.find().sort({ createdAt: -1 });
    const contract = getReadOnlyContract();

    const proposalsWithVotes = await Promise.all(
      proposals.map(async (p) => {
        try {
          const [yes, no] = await contract.getVoteCounts(p.contractProposalId);
          return {
            _id: p._id,
            title: p.title,
            description: p.description,
            deadline: p.deadline,
            status: p.status,
            contractProposalId: p.contractProposalId,
            createdAt: p.createdAt,
            yesCount: yes.toString(),
            noCount: no.toString(),
          };
        } catch {
          return {
            _id: p._id,
            title: p.title,
            description: p.description,
            deadline: p.deadline,
            status: p.status,
            contractProposalId: p.contractProposalId,
            createdAt: p.createdAt,
            yesCount: "0",
            noCount: "0",
          };
        }
      })
    );

    return NextResponse.json({ proposals: proposalsWithVotes });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAdmin(req);
    await connectDB();

    const { title, description, deadline, contractProposalId } = await req.json();

    if (!title || !description || !deadline || contractProposalId === undefined) {
      return NextResponse.json(
        { error: "Title, description, deadline and contractProposalId are required" },
        { status: 400 }
      );
    }

    const deadlineDate = new Date(deadline);
    const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);

    const proposal = await Proposal.create({
      title,
      description,
      deadline: deadlineDate,
      status: "open",
      createdBy: payload.userId,
      contractProposalId,
    });

    return NextResponse.json(
      {
        message: "Proposal created",
        proposal: {
          _id: proposal._id,
          title: proposal.title,
          contractProposalId: proposal.contractProposalId,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}