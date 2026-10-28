# ANAMECHI inbox release

## Current release status

PR 2 was approved, merged and deployed on October 28, 2026. The production Super Admin page is live at `https://anamechimarketing.com/admin/email-review`; the signed-in owner successfully loaded its queue and an attachment hold. Six Supabase migrations are installed.

The live n8n workflows are **ANAMECHI Marketing | Inbox decisions and drafts** (`7bdf9d6becfc4c2d`) and **ANAMECHI Marketing | Approved reply sender** (`c319d106330a4fba`). The previous assistant (`dEvh1nVyLTCNet2O`) is unpublished and explicitly named inactive, so there is only one Gmail trigger. All three canvases have separated, labeled lanes; the layout script verified that node behavior and connection routing did not change. `layout-email-workflows.cjs` preserves this layout for future workflow builds.

Attachment messages bypass the model and draft creation, remain unread and starred/important, and receive `ANAMECHI / Review Attachments` plus a Needs Deanna record. Embedded attachment parts are omitted from parsed conversation text. The old unrestricted send-all shortcut is removed. Flag-only execution 21821 succeeded on one existing unread attachment email with no draft or send job.

The existing Chief of Staff receiver includes the email adapter and verified owner/private-chat binding. The actual bot database role and current handler passed read-only briefing/review and wrong-chat checks using mocked replies. Its live matched source was backed up before rebuilding and restarting the same service. Voice configuration was preserved, and no second consumer was created.

The sender passed an empty-queue execution. At activation verification there were zero send jobs and zero sent jobs. No customer email or test Telegram message was sent. Controlled real reply-delivery and owner-initiated Telegram acceptance remain outstanding; do not describe those as passed. Both SOPs are maintained at their original Drive identities.

## Files and responsibilities

- `src/pages/admin/EmailReview.tsx`: owner queue, full conversation and reply review, decisions, next actions, due dates, explicit batch approval and delivery status.
- `src/hooks/useAuth.tsx` and `SuperAdminRoute.tsx`: fail-closed UI access and hidden navigation for other roles.
- Six `20261028*` migrations: server-side Super Admin authorization, immutable version snapshots, worker claim and validation, audit history, owner/chat-bound Telegram review tokens and briefing. Existing business accounts and brain grants are preserved.
- `build-email-workflows.cjs` and `mail-codec.cjs`: generate account-specific inactive workflows from a protected live export; reuse connected credentials without exporting their secrets.
- `telegram-email-review.py`: extension for the existing Chief of Staff receiver. Do not run a second Telegram consumer.
- `stage-chief-of-staff.py`: writes and compiles a proposed handler patch without replacing the live source.

## Validation completed

- Production frontend build and TypeScript compilation.
- 24 application tests, including email eligibility and follow-through briefing.
- Eight Node tests covering thread freshness, existing sent replies and drafts, malformed model output, MIME recipient/header constraints, generated workflow connections, attachment byte exclusion and attachment branch isolation from the agent and drafting steps.
- Four Python tests covering transcribed approval rejection, unqualified send-all opening review only, incomplete Telegram preview withholding send commands and ordinary conversation remaining with the existing agent.
- Rolled-back SQL acceptance fixture: owner reads and approvals; non-owner/anonymous denial; no direct application writes or worker calls; missing versions and partially stale batches blocked atomically; repeated approvals blocked; changed provider content blocked; Telegram identity, selection and one-use tokens; no direct inbox table access for `atlas_bot`.
- Live n8n sender empty queue test: false branch, no Gmail calls.
- Live Chief of Staff checks: actual bot database role reads the scoped briefing, existing handler routes briefing and review commands, and a wrong chat is rejected. Replies were mocked; no external messages were sent.
- Live attachment flag-only test: execution 21821 succeeded; one incoming attachment message labeled, starred and unread; one Needs Deanna record; zero send jobs. No model, draft or send nodes exist in that acceptance workflow.

These checks do not replace an end-to-end delivery test. Real reply delivery, ordinary thread ingestion through the replacement drafting workflow and owner-initiated Telegram use still require controlled acceptance after the wider release.

## Cutover and redeployment procedure

1. Follow `CLAUDE.md` and obtain approval before merging/pushing `main`, which publishes the live site. Preserve public routes and the content publishing gates.
2. Confirm all six additive migrations are installed in the existing shared project. Do not recreate or replace its brain. The connected n8n PostgreSQL credential can execute the worker functions. Browser credentials cannot.
3. In the authorized VPS console, preserve the original published workflow export and a current `/root/chief-of-staff/app.py` backup. Runtime staging is under `/root/anamechi-email-review`; generated exports contain internal settings and must remain private.
4. Verify that the staged drafting workflow includes attachment decisions and retains the full message text. Verify both workflows reuse the actual ANAMECHI Gmail, memory, brain, Calendar and model connections. Keep both inactive until cutover.
5. Bind the existing configured Telegram user to that user's private chat and actual Supabase Super Admin owner in `anamechi_mail.telegram_owners`. Verify the user from the existing allowed-user setting; do not copy identities from an untrusted message or permit group chats. Keep the model's generic tools separate from this deterministic approval handler. No inbox table grants are needed for `atlas_bot`.
6. Review the diff between the live Chief of Staff handler and proposed patch. Install the adapter as `anamechi_email_review.py` in the same module directory, add the compiled handler hook after existing authorization and transcription but before model dispatch, and rebuild/restart only the existing service according to its actual Compose configuration. Preserve voice configuration, webhook paths and credentials. The proposed source is not itself a deployment.
7. Merge the tested website branch only after approval. Confirm the Super Admin can load `/admin/email-review`. Confirm a VA/editor cannot see the link, access the route or read/call the backend. Direct API authorization matters as well as hidden navigation.
8. Unpublish the old Gmail Draft Assistant, then publish the replacement drafting workflow. Do not enable two consumers of unread mail. Publish the approved sender only after verifying its claim-only send path and no queued production approvals left from testing.
9. Run one controlled test with a recipient and content explicitly approved by the owner. Check full thread, reply voice, signature, exact recipients and draft version; approve through one interface; verify actual Gmail Sent message ID and queue state. Confirm the second channel cannot approve or send it again. Do not use a real client conversation as a synthetic test.
10. Test a changed Gmail draft, a new incoming reply, failed provider read and an uncertain mutation outcome. Confirm no automatic retries or silent send success. Confirm due date/owner/waiting/completion evidence behavior. Update the brain status and both SOPs with verified live results.

## Owner usage

Open Email Review from the Super Admin dashboard. Read the conversation and reply, edit if needed, record a decision and accountable next action, then save. Mark a cleared decision Draft Ready. Select individual replies or all eligible replies shown, read the exact bodies in the review dialog and click Approve & Send. Status must become Sent with a provider message ID before treating a reply as delivered.

The queue offers Needs Deanna, Draft Ready, Team Action, Waiting on Client and Completed. Team Action records an owner and due date; it does not notify that person or grant inbox access. Completed requires evidence. Waiting on Client requires verified delivery. Due/overdue counts are visible in the dashboard and the on-demand Chief of Staff briefing; this release does not start a new recurring notification schedule or automatically send follow-up messages.

The existing Chief of Staff adapter is deployed:

- `/emails`: up to 20 eligible replies and a 15-minute saved review.
- `/approve_emails TOKEN 1,3`: approve those numbered versions in that review.
- `/approve_all_emails TOKEN`: approve the exact saved list, excluding later arrivals.
- `/email_status`: latest delivery jobs.
- `/email_briefing` or “check my ANAMECHI emails”: read-only decisions, drafts, overdue work and waiting items. Voice can request this; voice cannot approve a send.
- An unqualified “send all drafts” opens a review. It does not send mail.

## Operational limits and recovery

This release sends reviewed single-recipient plain-text replies. Messages with attachments are held for owner review in Gmail without AI processing or reply drafting. They remain unread, starred and labeled ANAMECHI / Review Attachments. CC/BCC/multiple-recipient replies also require Gmail review and sending. Attachment contents are not read by the workflow; embedded attachment parts are omitted from parsed conversation text. Full conversation text is retained; message bodies are rendered as text, never trusted HTML.

The dashboard shows 200 recent threads and 500 recent send jobs; displayed counts apply to this window. Telegram approvals cover the exact displayed saved list, not the whole mailbox. Large replies that cannot be shown in full receive no Telegram send command. Existing manual Gmail drafts are not automatically imported or included in any send-all action.

A changed provider draft/conversation blocks the attempt. Refreshing the browser alone does not import Gmail edits: reconcile the record from Gmail through the protected worker sync function and obtain fresh approval, or complete the reply in Gmail. Do not clear generation reservations blindly; inspect Gmail and workflow execution first to avoid duplicate drafts.

An uncertain send outcome blocks further attempts and owner edits. Reconcile Gmail Sent using the stable message ID `anamechi-JOB_UUID@anamechimarketing.com` and actual recipients/content. A privileged operator must record the verified result and evidence before any new approval. Never resolve unknown as failed merely because a timeout occurred, and never automatically retry an ambiguous provider mutation.

Gmail can change between the final freshness check and provider mutation. Use the dashboard while sending and avoid editing the same draft simultaneously in Gmail. Provider delivery failures after Gmail accepts a message, bounces and replies sent manually require separate reconciliation; this release does not infer them from approval.

To roll back, first disable the approved sender and replacement drafting workflow. Preserve jobs and audit evidence. Restore the prior website commit and Chief of Staff handler backup if needed. Keep additive database tables rather than deleting decisions or send history. Re-enable the original drafting workflow only after removing or disabling its old unrestricted send-all branch. Reconcile any queued/in-flight/unknown jobs before resuming.
