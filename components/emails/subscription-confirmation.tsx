interface SubscriptionConfirmationProps {
  subscribed: boolean
  topic: string
}

export function SubscriptionConfirmationEmail({
  subscribed,
  topic,
}: SubscriptionConfirmationProps) {
  const action = subscribed ? 'subscribed' : 'unsubscribed'
  const title = subscribed
    ? 'You\'re subscribed to idea updates!'
    : 'You\'ve unsubscribed from idea updates'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #171717; background-color: #fafafa; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 24px;">
    <h1 style="font-size: 28px; font-weight: 700; color: #171717; margin: 0 0 8px 0;">
      ${title}
    </h1>
    <p style="font-size: 16px; color: #737373; margin: 0 0 32px 0;">
      ${subscribed
        ? `You've successfully subscribed to receive daily idea digests. We'll send you the latest validated SaaS ideas from Reddit discussions.`
        : `You've successfully unsubscribed from idea updates. You won't receive any more digest emails.`}
    </p>
    
    <div style="padding: 24px; background-color: #fafafa; border-radius: 8px; border-left: 4px solid #171717;">
      <p style="font-size: 14px; color: #737373; margin: 0 0 8px 0;">
        <strong>Subscription Details:</strong>
      </p>
      <p style="font-size: 16px; color: #171717; margin: 0;">
        Status: <strong>${subscribed ? 'Subscribed' : 'Unsubscribed'}</strong>
      </p>
      <p style="font-size: 16px; color: #171717; margin: 8px 0 0 0;">
        Topic: <strong>${escapeHtml(topic)}</strong>
      </p>
    </div>
    
    ${subscribed ? `
      <div style="margin-top: 32px; padding: 24px; background-color: #fafafa; border-radius: 8px;">
        <p style="font-size: 14px; color: #737373; margin: 0 0 12px 0;">
          <strong>What to expect:</strong>
        </p>
        <ul style="font-size: 14px; color: #171717; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Daily email digests with new ideas</li>
          <li style="margin-bottom: 8px;">Ideas scored by market potential</li>
          <li style="margin-bottom: 8px;">Real pain points from Reddit discussions</li>
        </ul>
      </div>
    ` : `
      <div style="margin-top: 32px; padding: 24px; background-color: #fafafa; border-radius: 8px; text-align: center;">
        <p style="font-size: 14px; color: #737373; margin: 0 0 12px 0;">
          Want to resubscribe?
        </p>
        <p style="font-size: 14px; color: #171717; margin: 0;">
          You can always resubscribe by visiting your dashboard and clicking "Subscribe to Updates".
        </p>
      </div>
    `}
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center;">
      <p style="font-size: 14px; color: #737373; margin: 0;">
        If you didn't ${action} to this, please contact support.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

