import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verifyAuth, requireAdmin, corsHeaders } from '../_shared/auth-middleware.ts';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication and require admin role
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);
    requireAdmin(context); // Only admins can invite staff
    
    console.log(`Admin ${context.email} is sending staff invitation`);

    const { email, branchId, assignedRole, branchName } = await req.json();
    
    // Validate required fields
    if (!email || !branchId || !assignedRole || !branchName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: email, branchId, assignedRole, branchName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending staff invitation to:', email);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Generate invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabase
      .from('staff_invitations')
      .insert({
        email,
        invited_by: context.userId,
        branch_id: branchId,
        assigned_role: assignedRole,
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Error creating invitation:', inviteError);
      throw inviteError;
    }

    // Get inviter's name
    const { data: inviter } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', context.userId)
      .single();

    const inviterName = inviter?.full_name || 'Administrator';

    // Create invitation link
    const invitationLink = `${Deno.env.get('SUPABASE_URL')?.replace('/rest/v1', '')}/auth/v1/verify?token=${invitationToken}&type=invite&redirect_to=${encodeURIComponent(window.location.origin + '/onboarding')}`;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'BMS Pro <onboarding@resend.dev>',
      to: [email],
      subject: `You're invited to join ${branchName} - BMS Pro`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
              .button { display: inline-block; padding: 14px 30px; background: #6366f1; color: white !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .button:hover { background: #4f46e5; }
              .info-box { background: white; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 4px; }
              .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Welcome to BMS Pro!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">You've been invited to join our team</p>
              </div>
              <div class="content">
                <p style="font-size: 16px;">Hi there!</p>
                <p style="font-size: 16px;">
                  <strong>${inviterName}</strong> has invited you to join <strong>${branchName}</strong> on BMS Pro 
                  as a <strong>${assignedRole}</strong>.
                </p>
                
                <div class="info-box">
                  <h3 style="margin-top: 0; color: #6366f1;">What happens next?</h3>
                  <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Click the button below to accept your invitation</li>
                    <li>Create your account with this email address</li>
                    <li>Complete your profile and onboarding information</li>
                    <li>Wait for admin approval</li>
                    <li>Start working!</li>
                  </ol>
                </div>

                <div style="text-align: center;">
                  <a href="${invitationLink}" class="button">
                    Accept Invitation
                  </a>
                </div>

                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  <strong>Note:</strong> This invitation will expire in 7 days. If you didn't expect this invitation, 
                  you can safely ignore this email.
                </p>

                <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                  If the button doesn't work, copy and paste this link into your browser:<br>
                  <span style="word-break: break-all; color: #6366f1;">${invitationLink}</span>
                </p>
              </div>
              <div class="footer">
                <p>BMS Pro - Business Management System</p>
                <p style="font-size: 12px; margin-top: 10px;">
                  This is an automated email. Please do not reply to this message.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        invitationId: invitation.id,
        emailId: emailResponse.data?.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error sending invitation:', error);
    
    // Handle specific error cases
    const status = error.message === 'Admin access required' ? 403 : 
                   error.message?.includes('authorization') ? 401 : 500;
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to send invitation',
        details: status === 500 ? 'Internal server error' : undefined
      }),
      { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});