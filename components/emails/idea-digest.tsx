import { Database } from '@/types/database'

type Idea = Database['public']['Tables']['ideas']['Row']

interface IdeaDigestProps {
  ideas: Idea[]
  topic?: string
}

export function IdeaDigestEmail({ ideas, topic }: IdeaDigestProps) {
  const topicTitle = topic ? `Ideas for "${topic}"` : 'Latest Ideas'

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${topicTitle}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #171717; background-color: #fafafa; margin: 0; padding: 0;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px 24px;">
    <h1 style="font-size: 28px; font-weight: 700; color: #171717; margin: 0 0 8px 0;">
      ${topicTitle}
    </h1>
    <p style="font-size: 16px; color: #737373; margin: 0 0 32px 0;">
      Here are the latest validated SaaS ideas from Reddit discussions.
    </p>
    
    ${ideas.length === 0 ? `
      <div style="padding: 24px; background-color: #fafafa; border-radius: 8px; text-align: center;">
        <p style="margin: 0; color: #737373;">No new ideas in the last 24 hours.</p>
      </div>
    ` : ideas.map((idea) => `
      <div style="margin-bottom: 24px; padding: 24px; background-color: #fafafa; border-radius: 8px; border-left: 4px solid #171717;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <h2 style="font-size: 20px; font-weight: 600; color: #171717; margin: 0;">
            ${escapeHtml(idea.title)}
          </h2>
          <span style="display: inline-block; padding: 4px 12px; background-color: #171717; color: #ffffff; border-radius: 4px; font-size: 14px; font-weight: 600;">
            ${idea.score}/100
          </span>
        </div>
        <p style="font-size: 16px; color: #171717; margin: 0 0 12px 0; line-height: 1.6;">
          ${escapeHtml(idea.pitch)}
        </p>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e5e5;">
          <p style="font-size: 14px; color: #737373; margin: 0;">
            <strong>Pain Point:</strong> ${escapeHtml(idea.pain_point)}
          </p>
        </div>
      </div>
    `).join('')}
    
    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center;">
      <p style="font-size: 14px; color: #737373; margin: 0;">
        You're receiving this because you subscribed to idea updates.
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

