const supabase = require('../integrations/supabase');
const { fetchTrendingVideos } = require('../integrations/youtube');
const { sendEmail } = require('../integrations/resend');

const CATEGORY_MAP = {
  'Tech': '28', 'Gaming': '20', 'Entertainment': '24',
  'Education': '27', 'Music': '10', 'All': '0',
};

function generateDigestHTML(userName, category, videos) {
  const videoRows = videos.slice(0, 5).map((v, i) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #2a2730;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="32" style="color: #9D97A8; font-family: monospace; font-size: 13px; vertical-align: top; padding-top: 4px;">
              ${i + 1}.
            </td>
            <td>
              <a href="https://youtube.com/watch?v=${v.videoId}"
                 style="color: #F5F3F7; font-size: 14px; font-weight: 600; text-decoration: none; display: block; margin-bottom: 4px;">
                ${v.title.substring(0, 60)}${v.title.length > 60 ? '...' : ''}
              </a>
              <span style="color: #9D97A8; font-size: 12px;">
                ${v.channel} &nbsp;·&nbsp; ${(v.views / 1000).toFixed(0)}K views
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background: #0B0A0F; font-family: 'Inter', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #0B0A0F; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom: 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="font-size: 20px; font-weight: 700; color: #F5F3F7;">Vico</span><span style="font-size: 20px; font-weight: 700; background: linear-gradient(135deg, #FF8A4C, #FF4F8B); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">bot</span>
                  </td>
                  <td align="right">
                    <span style="font-size: 12px; color: #9D97A8; font-family: monospace;">Weekly Trend Digest</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background: #17151D; border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 28px;">

              <!-- Greeting -->
              <p style="color: #9D97A8; font-size: 14px; margin: 0 0 8px 0;">Your weekly digest</p>
              <h1 style="color: #F5F3F7; font-size: 22px; font-weight: 700; margin: 0 0 6px 0;">
                🔥 Top trending in <span style="color: #FFB648;">${category}</span>
              </h1>
              <p style="color: #9D97A8; font-size: 14px; margin: 0 0 28px 0;">
                What's working on YouTube India right now — picked for you.
              </p>

              <!-- Videos table -->
              <table width="100%" cellpadding="0" cellspacing="0">
                ${videoRows}
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
                <tr>
                  <td align="center">
                    <a href="https://vicobot.in/dashboard"
                       style="display: inline-block; background: linear-gradient(135deg, #FF8A4C, #FF4F8B, #7C5CFF); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 9px;">
                      Analyze these topics →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top: 24px; text-align: center;">
              <p style="color: #9D97A8; font-size: 12px; margin: 0 0 8px 0;">
                You're receiving this because you signed up for Vicobot's Weekly Digest.
              </p>
              <a href="https://vicobot.in/settings" style="color: #9D97A8; font-size: 12px;">
                Unsubscribe
              </a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendWeeklyDigest() {
  console.log('[emailService] Starting weekly digest...');

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, email, creator_level')
    .eq('digest_enabled', true);

  if (error || !users?.length) {
    console.log('[emailService] No users with digest enabled');
    return { sent: 0 };
  }

  const trendingCache = {};
  let sentCount = 0;

  for (const user of users) {
    try {
      const category = user.creator_level === 'new' ? 'Entertainment' : 'Tech';
      const categoryId = CATEGORY_MAP[category] || '0';

      if (!trendingCache[category]) {
        trendingCache[category] = await fetchTrendingVideos(categoryId, 'IN', 5);
      }

      const videos = trendingCache[category];
      if (!videos?.length) continue;

      const html = generateDigestHTML(user.email, category, videos);

      await sendEmail({
        to: user.email,
        subject: `🔥 Weekly YouTube Trends — ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
        html,
      });

      sentCount++;
      await new Promise(r => setTimeout(r, 200));
    } catch (err) {
      console.error(`[emailService] Failed for ${user.email}:`, err.message);
    }
  }

  console.log(`[emailService] Digest sent to ${sentCount} users`);
  return { sent: sentCount };
}

async function sendWelcomeEmail(email) {
  const html = `
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 40px 20px; background: #0B0A0F; font-family: Arial, sans-serif;">
  <table width="560" cellpadding="0" cellspacing="0" style="margin: 0 auto; max-width: 560px;">
    <tr>
      <td style="background: #17151D; border: 1px solid rgba(255,255,255,0.09); border-radius: 16px; padding: 32px;">
        <h1 style="color: #F5F3F7; font-size: 22px; margin: 0 0 12px 0;">Welcome to Vicobot! 🎉</h1>
        <p style="color: #9D97A8; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
          You're all set. Start discovering trending YouTube topics and film your next winning video.
        </p>
        <a href="https://vicobot.in/dashboard"
           style="display: inline-block; background: linear-gradient(135deg, #FF8A4C, #FF4F8B, #7C5CFF); color: #fff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 13px 28px; border-radius: 9px;">
          Go to Dashboard →
        </a>
      </td>
    </tr>
    <tr>
      <td style="padding-top: 20px; text-align: center;">
        <p style="color: #9D97A8; font-size: 12px; margin: 0;">Vicobot — built by a solo creator, for creators.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await sendEmail({
    to: email,
    subject: 'Welcome to Vicobot 🎉',
    html,
  });
}

module.exports = { sendWeeklyDigest, sendWelcomeEmail };