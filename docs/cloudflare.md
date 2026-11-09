# Cloudflare Pages and contact delivery

The current public address is configured in src/data/business.json. Cloudflare Pages is connected to GitHub. The existing build command is npm run build and the output folder is dist; no Pages Function, Worker or private API key is needed for this form.

The shared HTML form sends to FormSubmit using the business email. It keeps all original visitor fields, the subject, provider spam trap and default spam challenge. After acceptance, FormSubmit returns the visitor to the absolute thank-you URL on this site. It works without JavaScript. Privacy wording identifies Cloudflare and FormSubmit.

## Activate delivery

After reviewing and publishing the change, submit one owner test through the real site. FormSubmit sends an activation email to the business email address. Open that message and confirm the form. Check spam if needed. Then send another test and verify that its full contents arrive and that the browser returns to the thank-you page. Do not assume delivery is activated merely because the thank-you page can be opened directly. Browser tests use a mocked provider and never send real email.

FormSubmit documentation: https://formsubmit.co/ and https://formsubmit.co/documentation

## Publish and verify

Save the changes to the working branch and open or update the pull request when the owner asks. Halil reviews and merges; never push directly to main or merge for him. Cloudflare should build its connected production branch. If it builds another branch, check the production branch setting before publishing. Verify the resulting Cloudflare deployment, real contact delivery and confirmation page.

## Preview and launch state

The owner approved hiding the preview banner via showPreviewBanner in src/data/site-settings.json. This does not remove sample flags or turn on launchReady. Every page remains noindex while launchReady is false. The launch guard and all content checks remain. Form provider selection also lives in site-settings.json; Netlify is a legacy option, not the active Cloudflare backend.
