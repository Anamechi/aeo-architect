"""Adapter for the existing python-telegram-bot Chief of Staff receiver.

No new Telegram listener. Invoke handle_email_command from the existing handle
function before model dispatch. Pass the existing DB_URL. Typed commands only
can approve; transcribed voice cannot enter this handler's approval path.
"""
import asyncio
import json
import re


def parse_command(text):
    words = text.strip().split()
    if not words:
        return None
    name = words[0].split('@', 1)[0].lower()
    if name not in ('/emails', '/email_status', '/approve_emails', '/approve_all_emails'):
        return None
    if name in ('/emails', '/email_status'):
        if len(words) != 1:
            raise ValueError('Use /emails or /email_status without additional text.')
        return ('list' if name == '/emails' else 'status', {})
    if len(words) not in (2, 3) or not re.fullmatch(r'[a-fA-F0-9-]{36}', words[1]):
        raise ValueError('Request /emails, review the replies, then use its exact confirmation command.')
    if name == '/approve_all_emails':
        if len(words) != 2:
            raise ValueError('Use /approve_all_emails followed by the review token.')
        return 'approve', {'token': words[1], 'all': True, 'confirmed': True}
    if len(words) != 3 or not re.fullmatch(r'[0-9]+(?:,[0-9]+)*', words[2]):
        raise ValueError('Use /approve_emails TOKEN 1,3 with the numbers from that review.')
    return 'approve', {'token': words[1], 'numbers': [int(n) for n in words[2].split(',')], 'confirmed': True}


def read_intent(text):
    normalized = re.sub(r'[^a-z0-9 /_]+', ' ', text.lower()).strip()
    normalized = ' '.join(normalized.split())
    if normalized in ('/email_briefing', 'email briefing', 'anamechi email briefing',
                      'check anamechi emails', 'check my anamechi emails'):
        return 'briefing', {}
    if normalized in ('review anamechi drafts', 'show anamechi drafts',
                      'send all drafts', 'send all anamechi drafts', 'send specific drafts'):
        # An unqualified send request opens a new review. It is never approval.
        return 'list', {}
    return None


def run_database(db_url, user_id, chat_id, action, payload):
    import psycopg
    with psycopg.connect(db_url) as conn:
        with conn.cursor() as cur:
            cur.execute('select public.anamechi_email_telegram(%s,%s,%s,%s::jsonb)',
                        (user_id, chat_id, action, json.dumps(payload)))
            return cur.fetchone()[0]


async def handle_email_command(update, context, db_url, request_text=None):
    message = update.effective_message
    # Never use caption, model output or transcribed voice as send authority.
    if not message:
        return False
    text = message.text or request_text or ''
    try:
        parsed = parse_command(text) or read_intent(text)
    except ValueError as exc:
        await message.reply_text(str(exc))
        return True
    if parsed is None:
        return False
    if not update.effective_user or not update.effective_chat:
        return True
    action, payload = parsed
    if action == 'approve' and not message.text:
        await message.reply_text('Email sending requires the typed confirmation command from a current review. Say check my ANAMECHI emails for a briefing, or type /emails to review drafts.')
        return True
    try:
        result = await asyncio.to_thread(run_database, db_url, update.effective_user.id,
                                        update.effective_chat.id, action, payload)
        if action == 'list':
            drafts = result.get('drafts', [])
            if not drafts:
                await message.reply_text('No eligible ANAMECHI drafts are waiting for approval. ' + result['dashboard'])
                return True
            await message.reply_text('ANAMECHI Marketing email review. These drafts have not been sent. Review every reply below. ' + result['dashboard'])
            # Each message is bounded. No parse_mode means email content stays text.
            complete = True
            for number, draft in enumerate(drafts, 1):
                text = f"{number}. {draft['subject']}\nTo: {', '.join(draft['recipients']['to'])}\nVersion: {draft['version']}\n\n{draft['draft_body']}"
                if len(text) > 3800:
                    complete = False
                    text = text[:3000] + '\n\nReply exceeds the Telegram review limit. Review and approve it in the dashboard.'
                await message.reply_text(text)
            if complete:
                token = result['token']
                await message.reply_text(f'Review expires in 15 minutes. To approve selected replies, type:\n/approve_emails {token} 1,3\n\nTo approve every reply in this exact review, type:\n/approve_all_emails {token}\n\nVoice messages do not send email.')
            else:
                await message.reply_text('Use the dashboard to approve this review because one or more replies were not displayed in full.')
        elif action == 'briefing':
            counts = result['counts']
            lines = ['ANAMECHI Marketing inbox briefing',
                     f"Decisions: {counts['decisions']} | Drafts: {counts['drafts']} | Overdue: {counts['overdue']} | Waiting: {counts['waiting']}"]
            for item in result.get('actions', []):
                lines.append(f"{item['subject']}\nDecision: {item['decision_needed'] or 'None recorded'}\nNext: {item['next_action'] or 'Review item'}\nOwner: {item['action_owner'] or 'Unassigned'} | Due: {item['due_at'] or 'Not set'}")
            lines.append('Open ' + result['dashboard'] + ' for the complete queue, or type /emails to review replies. No email has been sent by this request.')
            # Multiple bounded messages preserve the entire briefing.
            for line in lines:
                for start in range(0, len(line), 3800):
                    await message.reply_text(line[start:start+3800])
        elif action == 'approve':
            await message.reply_text(f"Approved {len(result.get('jobs', []))} ANAMECHI replies for sending. Use /email_status to check delivery. Approval does not mean sent.")
        else:
            jobs = result.get('jobs', [])
            text = '\n'.join(f"{j['subject']}: {j['status']}" for j in jobs) or 'No ANAMECHI send jobs yet.'
            await message.reply_text(text[:3800])
    except Exception:
        # Log details only in the protected backend, never email/DB content to chats.
        await message.reply_text('This email request could not be completed. Confirm your authorized chat and refresh the review before trying again. Check the dashboard for current delivery status.')
    return True
