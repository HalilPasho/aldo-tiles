# Start here

This guide shows you how to change the Aldo Tile website by talking to Codex. You don't need to know any code. Read it once from the top, then come back to the part you need.

## What this is

- This project folder holds Aldo Tile's whole website: its pages, words, photos and colours.
- **Codex** is OpenAI's coding helper. You tell it in plain words what you want, and it changes the website's files for you. It lives inside the ChatGPT app on your computer.
- Right now the site is a **preview with sample details**: a pretend phone number, sample photos marked "Sample photo", and sample reviews. Every page shows a thin "Preview: sample content" banner, and Google is told not to list it yet. That's on purpose, until the real launch.

**What you can safely do:** change anything about the look. Colours, fonts, layout, the order of sections, the wording. Ask, look, and keep or undo.

**What's protected:** a few hidden parts keep the site findable on Google and keep the contact form delivering messages. Codex has rules to leave those alone and to check its own work after every change.

**Nothing goes live by itself.** Your changes reach the real website only when Halil looks at them and publishes them.

## Before you start (once)

Halil sets up your computer once, following Step 6 of [docs/owner-setup.md](docs/owner-setup.md). When he's done you'll have:

- the **ChatGPT** app, with Codex inside it;
- the project folder on your computer, for example `C:\Users\YourName\Documents\aldotile`.

## Open the project

1. Open the **ChatGPT** app from the Start menu.
2. Click the menu at the top that says **ChatGPT**, and choose **Codex**.
3. Click **Add new project** (or press Ctrl+O), then pick the **aldotile** folder. Next time it should already be there; if it isn't, add it again the same way.
4. Under the box where you type, choose **Ask for approval**. This keeps Codex inside the project folder and makes it ask you before it does anything outside it.
5. Type your message in the box and press Enter.

**When Codex asks for permission,** it shows you an instruction it wants to run on your computer. If it's about the website, such as starting it, checking it or saving your work, allow it. If it wants to change something outside the project, or you're not sure, ask it:

```text
What will this do, in plain words?
```

The app changes now and then, so the button names may be worded a little differently from this guide.

**To paste a message from this guide:** select the text and press Ctrl+C (or use the copy button beside it, if you see one), click in Codex's message box, and press Ctrl+V.

## See the site on your computer

Paste this into Codex:

```text
Start the site so I can see it.
```

Codex gives you a link like http://localhost:4321/ (an address that only works on your own computer). Open it in your web browser. You'll see the site with the "Preview: sample content" banner at the top.

When Codex changes something, the page usually updates by itself. If it doesn't, press F5 to reload it.

To see the phone version, make the browser window narrow, or ask Codex: "How do I see this the way it looks on a phone?"

## Ask for changes

- Say what you want to **see**, not how to do it. "Make the headings bigger and calmer" is perfect.
- One change at a time is easiest to judge and undo.
- Say what you don't like, too. "Too dark" or "too busy" helps.
- To show an example, paste or drag a screenshot into the message box.
- After each change Codex checks its work. That takes a few minutes. When it's done, it tells you what changed and whether the checks passed.
- Codex may describe its plan and ask for your OK before a big redesign. Read it, then say yes, or say what to change.

Ready-to-paste examples:

**Change the colours**

```text
Change the main colours to warmer gold and cream.
```

**Try two versions and compare**

```text
Show me two different ideas for the top of the homepage. Don't save either until I choose.
```

Codex shows you one idea, then the other. Say "Show me the first one again" to look back, and "I choose the second one" when you've decided.

**Match a picture you like**

```text
Make the site look like this screenshot, but keep Aldo's logo.
```

Attach the screenshot to the same message.

**Undo**

```text
Undo my last change.
```

## Swap sample details for real ones

Only give Codex **real details that Aldo has confirmed.** Codex never makes up facts about the business. If it asks you something you don't know, say so, and it will leave that part out.

```text
Replace the sample phone number with [number].
```

Replace `[number]` with the real number, for example: Replace the sample phone number with (905) 555-0123. Ask the same way for the email address, the cities Aldo works in, his years of experience, and his insurance or other credentials.

**Wording.** The sample text was written as a starting point. Aldo must read and confirm it before launch. When he has confirmed a page, tell Codex, for example: "Aldo has read and confirmed the wording on the floors page."

**Reviews.** Only real reviews from real clients, in their own words, with their permission. For example: "Add this real review from Maria, Oakville: [her words]." The sample reviews must all be replaced or removed before launch.

## Add a new job

1. Put the job's photos in one folder on your computer, for example on your Desktop.
2. Paste this, replacing each part in square brackets:

```text
Add this new job: [photos], [city], [type of tile], [short description].
```

For example: Add this new job: the photos in my Desktop folder "oakville shower", Oakville, 12 by 24 inch grey porcelain, an old tub replaced with a walk-in shower and a niche.

Codex will ask which kind of job it is (bathroom and shower, floor, backsplash or commercial) if it can't tell. It also writes a short description of each photo for people who can't see it, and for Google. Check those descriptions are right.

Good to know:

- **Ask Halil first.** Only add a client's photos once Halil has their written permission to show them online. The website's files can be seen by anyone, and a photo removed later can still be found.
- Use the photos as they are. Light cropping to remove clutter is fine, but no retouching.
- If a very wide photo, such as a panorama, leaves an empty gap on the job's page, ask Codex to put the photos in a different order.

## Save your work and get a preview link

When you're happy with your changes, paste:

```text
Save my work and give me a preview link.
```

Codex saves your changes online and sends Halil a request to publish them. Codex may call this a "pull request" (a request asking Halil to add your changes to the live site).

After a few minutes Codex gives you a **preview link**, a web address ending in netlify.app. It shows the whole site with your changes. Anyone who has the link can open it, so you can send it to Halil or Aldo.

**How it goes live:** Halil looks at the preview and publishes it. The website's host gives a fixed number of publishes each month, so Halil may wait and publish several of your changes together. That's normal, and preview links don't count.

## When something looks wrong

- **Something looks odd on the page:** describe it, for example "On a phone the button at the top is cut off." Or simply paste "Undo my last change."
- **A check failed:** paste this.

```text
A check failed. Explain it simply, fix it, and tell me what changed.
```

- **Codex says it can't change something** because it's protected: that's the safety rules working. Ask it to explain why in plain words, or ask Halil.
- **You see a warning** that says `The collection "reviews" does not exist or is empty`: that's harmless. It appears when the site has no reviews.
- **A new review doesn't show** on your computer: paste "Restart the site so I can see the new review."
- **The site link on your computer stops working:** paste "Start the site so I can see it."
- **Codex says a tool is "not recognized", or "running scripts is disabled":** that's a computer setting. Ask Halil.
- **You're lost:** paste "Stop. Explain in plain words what happened and what you suggest."

## What Codex won't do

- Make up reviews, years, prices, insurance or any other fact about the business.
- Remove a "Sample" label until you give it the real detail or photo.
- Publish the live site. Only Halil does that.

## Words you may see

- **Branch:** a separate copy of your work, kept apart from the live site until it's published.
- **Commit:** a saved step in your work, with a short note about what changed.
- **Push:** sending your saved work from your computer to GitHub.
- **Pull request:** a request asking Halil to add your changes to the live site. Codex makes it when you ask to save your work.
- **Merge:** what Halil does to accept a pull request. It publishes the changes.
- **Repository** or **repo:** the project folder, plus its full history, stored on GitHub.
- **Clone:** a copy of the repository on your computer.
- **Deploy:** putting a version of the site online.
- **Check:** Codex's automatic test of the site after a change. It looks for problems with Google, the contact form and how easy the site is to use.
- **Preview link:** a temporary copy of the site with your changes, on a netlify.app address. Anyone with the link can open it. It isn't the live site.
- **Sample:** a pretend detail or photo that holds a place until the real one arrives.
- **Launch:** the day the real details are in and the site is opened to Google.
- **localhost:** an address that only works on your own computer.
- **Terminal:** a window where commands are typed. Codex uses it for you.
- **npm:** the tool that installs and builds the site.
- **JSON:** a kind of file that holds lists of details, such as the phone number.
- **Sandbox:** the safety fence that keeps Codex inside the project folder.
- **WSL:** a Linux layer for Windows. This project doesn't use it.
- **GitHub:** the website that stores the project and its history.
- **Netlify:** the company that hosts the website and makes the preview links.
