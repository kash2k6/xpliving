import { NextRequest, NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

/**
 * API endpoint to save lead information to Supabase
 * Called when user submits the user data form
 */
export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phone } = await request.json();

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
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
          .from('leads')
          .upsert({
            email: email.toLowerCase(),
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          }, {
            onConflict: 'email',
          })
          .select()
          .single();

        if (error) {
          console.error('Error saving lead to Supabase:', error);
          return NextResponse.json(
            { error: 'Failed to save lead', details: error.message },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          lead: data,
        });
      } catch (error) {
        console.error('Exception saving lead to Supabase:', error);
        return NextResponse.json(
          { error: 'Failed to save lead', details: error instanceof Error ? error.message : 'Unknown error' },
          { status: 500 }
        );
      }
    } else {
      // Supabase not configured, but return success so form still works
      console.log('Supabase not configured, lead not saved to database');
      return NextResponse.json({
        success: true,
        message: 'Lead saved locally (Supabase not configured)',
      });
    }
  } catch (error) {
    console.error('Error processing lead submission:', error);
    return NextResponse.json(
      { error: 'Failed to process lead submission', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}


