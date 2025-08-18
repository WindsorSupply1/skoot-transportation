import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Create a mock departure ID that the booking API can recognize
    const mockDepartureId = `mock_dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return NextResponse.json({
      success: true,
      departureId: mockDepartureId,
      mockData: true,
      requestData: body
    });

  } catch (error) {
    console.error('Mock departure error:', error);
    return NextResponse.json({ 
      error: 'Failed to create mock departure',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}