# Gitphy

Easily search for and insert gifs into Github pull requests and issues.

## Development

1. Install Node `14.4.x`.
2. Run `npm install`.
3. Run `npm run build-watch` which will watch for and automatically rebuild on
   change.
4. Load the unpacked extension into Firefox or Chrome
   - _Firefox_: Follow
     [the instructions here](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#Trying_it_out).
     Go to `about:debugging`, click `Load Temporary Add-on`, then select the
     `manifest.json` inside the `dist` folder.
   - _Chrome_: Follow
     [the instructions here](https://developer.chrome.com/extensions/getstarted).
     Go to `chrome://extensions`, click `Load unpacked`, then select the `dist`
     folder.
5. Make it amazing!
6. Submit a pull request!

## Building

1. Follow steps 1 and 2 in the above `development` section.
2. Run `npm run build-clean`.
3. Find extension built in the `dist` folder.

## TODO

- Add toolbar button to insert markdown template
- Consider supporting other sites
  - Atlassian (JIRA/Bitbucket/Confluence)
  - Gitlab
