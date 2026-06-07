import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, errorResponse } from "@/lib/middleware";

export async function POST(
  req: NextRequest
) {
  try {
    requireAdmin(req);

    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return NextResponse.json(
        { error: "Invalid Ethereum wallet address" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Voter registration transaction should be sent from frontend",
      walletAddress,
    });
  } catch (err) {
    return errorResponse(err);
  }
}