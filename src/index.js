import { GiphyFetch } from "@giphy/js-fetch-api";
import { on } from "delegated-events";
import { debounce } from "lodash";
import randomColor from "randomcolor";
import tippy from "tippy.js";

import "./styles.css";

const GITHUB_TEXTAREAS = [
  '[name="issue[body]"]', // create issue
  '[name="pull_request[body]"]', // create PR
  '[name="comment[body]"]', // create issue/PR comment
  '[name="pull_request_review[body]"]', // create PR review comment dropdown
  '[name="issue_comment[body]"]', // edit issue/PR comment
].join(", ");

const giphy = new GiphyFetch(process.env.GIPHY_API_KEY);
const gitphyRegex = /\(gif:([\w\s]+)\)/;

let popover = null;
let prevQuery = null;

class Popover {
  constructor(textarea) {
    // Also works for firefox, they emulate the chrome object
    const giphyAttributionURL = chrome.runtime.getURL("giphy-attribution.png");
    const popoverTemplate = `
      <div class="gitphy--popover">
        <div class="gitphy--popover-content"></div>
        <div class="giphy--attribution-wrapper">
          <img class="giphy--attribution" src="${giphyAttributionURL}">
        </div>
      </div>
    `;

    this._popover = tippy(textarea, {
      allowHTML: true, // allows content render HTML
      content: popoverTemplate,
      interactive: true, // allows clicks in the popover
      hideOnClick: false, // prevents hiding when clicking outside popover
      maxWidth: 650,
      trigger: "manual",
      theme: "light",
    });

    this.textarea = textarea;
  }

  show() {
    this._popover.show();
  }

  hide() {
    this._popover.hide();
  }

  destroy() {
    this._popover.destroy();
  }

  _render(content) {
    document.querySelector(".gitphy--popover-content").innerHTML = content;
  }

  renderGifs(gifs) {
    const gifEls = gifs
      .map((gif) => {
        const img = document.createElement("img");
        img.className = "gitphy--gif";
        img.style.backgroundColor = randomColor({ luminosity: "bright" });
        img.setAttribute("src", gif.images.fixed_width.url);
        img.setAttribute("data-gif-url", gif.images.downsized_medium.url);
        return img.outerHTML;
      })
      .join("");
    this._render(gifEls);
  }

  renderLoading(query) {
    const div = document.createElement("div");
    div.className = "gitphy--intermediate-state";
    div.innerHTML = `Loading gifs for "${query}"...`;

    this._render(div.outerHTML);
  }

  renderNoResults(query) {
    const div = document.createElement("div");
    div.className = "gitphy--intermediate-state";
    div.innerHTML = `No results found for "${query}".`;

    this._render(div.outerHTML);
  }
}

const getQuery = (text) => {
  const match = text.match(gitphyRegex);
  if (match) {
    return match[1].trim();
  }
  return null;
};

const _handleTextareaChange = async (event) => {
  const textarea = event.target;
  const query = getQuery(textarea.value);

  if (!popover) {
    popover = new Popover(textarea);
  }

  // if the user backspaces into the parens will close the popover
  query ? popover.show() : popover.hide();

  // if there is a query and it wasn't same as previous one,
  // search for gifs and load then into the popover
  if (query && prevQuery !== query) {
    popover.renderLoading(query);

    const { data: gifs } = await giphy.search(query, { limit: 100 });
    if (gifs.length === 0) {
      popover.renderNoResults(query);
    } else {
      popover.renderGifs(gifs);
    }

    prevQuery = query;
  }
};

const handleGifClick = (event) => {
  const gifUrl = event.currentTarget.dataset.gifUrl;

  const { textarea } = popover;
  textarea.value = textarea.value.replace(gitphyRegex, `(${gifUrl})`);
};

const handleTextareaBlur = () => {
  if (popover) {
    popover.destroy();
  }
  popover = null;
  prevQuery = null;
};

const handleGifMouseover = (event) => {
  event.currentTarget.style.borderColor = randomColor({ luminosity: "bright" });
};

const handleGifMouseout = (event) => {
  event.currentTarget.style.borderColor = "#fff";
};

// handle textarea on:
// * focus (if tabbed in)
// * input (typed in)
// * mouseup (on click release)
const handleTextareaChange = debounce(_handleTextareaChange, 500);
["focusin", "input", "mouseup"].forEach((eventType) => {
  on(eventType, GITHUB_TEXTAREAS, (event) => {
    handleTextareaChange(event);
  });
});

// close popover, destroy, and clear last query when textarea is unfocused
on("focusout", GITHUB_TEXTAREAS, handleTextareaBlur);

// listen on clicks on gifs in popover
on("mousedown", ".gitphy--gif", handleGifClick);

// add/remove border to/from gif on hover for active state
on("mouseover", ".gitphy--gif", handleGifMouseover);
on("mouseout", ".gitphy--gif", handleGifMouseout);
