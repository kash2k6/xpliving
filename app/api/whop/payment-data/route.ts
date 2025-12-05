import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple in-memory store for member ID lookup by email
 * In production, use a database (PostgreSQL, MongoDB, etc.)
 * 
 * According to Whop docs:
 * - Payment methods are stored by Whop
 * - We only need to store member ID (by email) to retrieve payment methods later
 * - Use Whop API to list payment methods for a member when charging
 */
const memberStore = new Map<string, {
  memberId: string;
  email: string;
  createdAt: Date;
}>();

/**
 * Store member ID (called from webhook after payment.succeeded)
 */
export async function POST(request: NextRequest) {
  try {
    const { memberId, email } = await request.json();

    if (!memberId || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: memberId, email' },
        { status: 400 }
      );
    }

    // Store member ID by email
    memberStore.set(email.toLowerCase(), {
      memberId,
      email,
      createdAt: new Date(),
    });

    console.log('Member ID stored:', { email, memberId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Store member data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to store member data' },
      { status: 500 }
    );
  }
}

/**
 * Retrieve member ID by email (called from client)
 * Payment methods will be retrieved from Whop API using member ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Missing email parameter' },
        { status: 400 }
      );
    }

    // Find member ID by email
    const memberData = memberStore.get(email.toLowerCase());

    if (!memberData) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Return member ID - client will use this to get payment methods from Whop API
    return NextResponse.json({
      memberId: memberData.memberId,
      email: memberData.email,
    });
  } catch (error) {
    console.error('Retrieve member data error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to retrieve member data' },
      { status: 500 }
    );
  }
}

