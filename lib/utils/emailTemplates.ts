export function generateInvitationEmailHTML(
    projectName: string,
    token: string,
    inviterName?: string
): string {
    // Format token with spaces for better readability: "MJPU1WPI" -> "M J P U 1 W P I"
    const formattedToken = token.split('').join(' ')
    const loginUrl = `https://workspace.talentronaut.in/login?token=${token}`

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Talentronaut Workspace</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
        <tr>
            <td style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #D95828; font-size: 36px; font-weight: 700; letter-spacing: -0.5px;">
                                Talentronaut
                            </h1>
                            <p style="margin: 8px 0 0; color: #999999; font-size: 14px; letter-spacing: 3px; text-transform: uppercase;">
                                WORKSPACE
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <!-- Top Border -->
                            <div style="width: 100%; height: 3px; background: linear-gradient(90deg, #D95828 0%, #C04020 100%); border-radius: 2px; margin-bottom: 40px;"></div>
                            
                            <!-- Welcome Title -->
                            <h2 style="margin: 0 0 20px; color: #1a1a1a; font-size: 28px; font-weight: 700; text-align: center;">
                                Welcome to the Team
                            </h2>
                            
                            <!-- Description -->
                            <p style="margin: 0 0 40px; color: #666666; font-size: 16px; line-height: 1.6; text-align: center;">
                                You've been invited to track your project. Use the access code below to securely log in.
                            </p>
                            
                            <!-- Access Code Box -->
                            <div style="background-color: #fafafa; border: 2px dashed #D95828; border-radius: 12px; padding: 30px 20px; margin: 0 0 40px; text-align: center;">
                                <p style="margin: 0 0 20px; color: #D95828; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                    ${formattedToken}
                                </p>
                                <p style="margin: 0; color: #999999; font-size: 13px;">
                                    This code is unique to your account.
                                </p>
                            </div>
                            
                            <!-- Login Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${loginUrl}" 
                                           style="display: inline-block; background: linear-gradient(135deg, #D95828 0%, #C04020 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 600; font-size: 16px; letter-spacing: 0.3px; box-shadow: 0 4px 12px rgba(217, 88, 40, 0.3);">
                                            Login to Workspace
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <p style="margin: 30px 0 0; text-align: center; color: #999999; font-size: 13px;">
                                Or copy this link: <a href="${loginUrl}" style="color: #D95828; text-decoration: none;">${loginUrl}</a>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 30px 40px; background-color: #fafafa; border-top: 1px solid #e9ecef; text-align: center;">
                            <p style="margin: 0 0 8px; color: #666666; font-size: 13px;">
                                © ${new Date().getFullYear()} Talentronaut Technologies Pvt. Ltd.
                            </p>
                            <p style="margin: 0; color: #999999; font-size: 12px;">
                                Questions? Contact <a href="mailto:support@talentronaut.in" style="color: #D95828; text-decoration: none;">support@talentronaut.in</a>
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`
}

export function generateInvitationEmailText(
    projectName: string,
    token: string,
    inviterName?: string
): string {
    const formattedToken = token.split('').join(' ')
    const loginUrl = `https://workspace.talentronaut.in/login?token=${token}`

    return `
================================================================================
TALENTRONAUT WORKSPACE
================================================================================

Welcome to the Team

You've been invited to track your project. Use the access code below to securely log in.

YOUR ACCESS CODE:
${formattedToken}

This code is unique to your account.

LOGIN LINK:
${loginUrl}

Or visit: https://workspace.talentronaut.in/login and enter your access code.

================================================================================
© ${new Date().getFullYear()} Talentronaut Technologies Pvt. Ltd.
Questions? Contact support@talentronaut.in
================================================================================
`
}
