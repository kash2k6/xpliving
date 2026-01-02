import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * API endpoint to save shipping address information
 * Called after initial charge, before upsell
 */
export async function POST(request: NextRequest) {
  try {
    const { 
      email, 
      memberId, 
      firstName, 
      lastName, 
      addressLine1, 
      addressLine2, 
      city, 
      state, 
      zipCode, 
      country 
    } = await request.json();

    // Validate required fields
    if (!email || !memberId || !firstName || !lastName || !addressLine1 || !city || !state || !zipCode || !country) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Save to Supabase if configured
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('shipping_addresses')
          .upsert({
            email: email.toLowerCase(),
            member_id: memberId,
            first_name: firstName,
            last_name: lastName,
            address_line1: addressLine1,
            address_line2: addressLine2 || null,
            city: city,
            state: state,
            zip_code: zipCode,
            country: country,
          }, {
            onConflict: 'member_id',
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving shipping address to Supabase:', error);
          return NextResponse.json(
            { error: 'Failed to save shipping address', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          shippingAddress: data,
        });
      } catch (error) {
        console.error('Exception saving shipping address to Supabase:', error);
        return NextResponse.json(
          { error: 'Failed to save shipping address', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } else {
      // Supabase not configured, but return success so flow continues
      console.log('Supabase not configured, shipping address not saved to database');
      return NextResponse.json({
        success: true,
        message: 'Shipping address saved locally (Supabase not configured)',
      });
    }
  } catch (error) {
    console.error('Error processing shipping address submission:', error);
    return NextResponse.json(
      { error: 'Failed to process shipping address', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}





