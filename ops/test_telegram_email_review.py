"""No Telegram or database connections. Check approval boundaries."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, patch

spec = importlib.util.spec_from_file_location('email_review', Path(__file__).with_name('telegram-email-review.py'))
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)
TOKEN = '00000000-0000-4000-8000-000000000028'


def update(text=None):
    return SimpleNamespace(effective_message=SimpleNamespace(text=text, reply_text=AsyncMock()),
                           effective_user=SimpleNamespace(id=123), effective_chat=SimpleNamespace(id=456))


class ApprovalBoundary(unittest.IsolatedAsyncioTestCase):
    async def test_transcribed_approval_never_calls_database(self):
        request = update()
        with patch.object(review, 'run_database') as db:
            self.assertTrue(await review.handle_email_command(request, None, 'unused', '/approve_all_emails '+TOKEN))
            db.assert_not_called()
        self.assertIn('typed confirmation', request.effective_message.reply_text.call_args.args[0])

    async def test_unqualified_send_all_opens_review_only(self):
        request = update('send all drafts')
        with patch.object(review, 'run_database', return_value={'drafts': [], 'dashboard': 'dashboard'}) as db:
            await review.handle_email_command(request, None, 'unused')
            self.assertEqual(db.call_args.args[1:4], (123, 456, 'list'))

    async def test_large_reply_withholds_approval_command(self):
        request = update('/emails')
        result = {'token': TOKEN, 'dashboard': 'dashboard', 'drafts': [
            {'subject': 'Long reply', 'recipients': {'to': ['test@example.invalid']}, 'version': 1, 'draft_body': 'a'*4000}]}
        with patch.object(review, 'run_database', return_value=result):
            await review.handle_email_command(request, None, 'unused')
        replies = [c.args[0] for c in request.effective_message.reply_text.call_args_list]
        self.assertFalse(any('/approve_all_emails' in text for text in replies))
        self.assertTrue(all(len(text) < 4096 for text in replies))

    async def test_unrelated_conversation_stays_with_chief_of_staff(self):
        with patch.object(review, 'run_database') as db:
            self.assertFalse(await review.handle_email_command(update('How is my project going?'), None, 'unused'))
            db.assert_not_called()


if __name__ == '__main__':
    unittest.main()
