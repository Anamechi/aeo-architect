"""Create a proposed patch without overwriting the live Chief of Staff source."""
import argparse
from pathlib import Path
import py_compile

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('proposed', type=Path)
args = parser.parse_args()
if args.source.resolve() == args.proposed.resolve():
    raise SystemExit('Output must differ from the live source.')
source = args.source.read_text()
marker = '    await msg.chat.send_action("typing")'
if source.count(marker) != 1 or 'handle_email_command' in source:
    raise SystemExit('Handler changed. Review the live source before patching.')
hook = '''    # Same verified user, chat and existing Telegram consumer. Read-only voice;
    # only the original typed message can authorize a reviewed send.
    from anamechi_email_review import handle_email_command
    if await handle_email_command(update, context, DB_URL, user_text):
        return

'''
args.proposed.parent.mkdir(parents=True, exist_ok=True)
args.proposed.write_text(source.replace(marker, hook+marker))
args.proposed.chmod(0o600)
py_compile.compile(str(args.proposed), doraise=True)
print('Proposed handler patch compiled. Live source unchanged.')
