/* global _, randomColor */

// Select on:
// 1. creating issue
// 2. creating pr
// 3. comment issue, comment pr, inline pr comment
let textareaSelector = '[name="issue[body]"], [name="pull_request[body]"], [name="comment[body]"]'
let parentSelector = '.main-content'

let giphyApi = 'https://api.giphy.com/v1/gifs/search'
let gitphyRegex = /\(gitphy:([\w\s]+)\)/

let popover = null
let lastQuery = null

class Popover {
  constructor($textarea) {
    let popoverTemplate = `
      <div class="popover gitphy--popover" role="tooltip">
        <div class="arrow"></div>
        <div class="popover-content gitphy--popover-content" data-scroll-scope></div>
      </div>
    `

    this.popoverContentTemplate  = _.template(`
      <% if(loading) { %>
        <div class='gitphy--intermediate-state'>
          Loading gifs for "<%= query %>"...
        </div>
      <% } else if(noResults) { %>
        <div class='gitphy--intermediate-state'>
          No results found for "<%= query %>"
        </div>
      <% } else { %>
        <% _.each(gifs, function(gif){ %>
          <img
            src="<%= gif.preview %>"
            class='gitphy--gif'
            data-original-gif-url="<%= gif.original %>"
            style="background-color: <%= gif.backgroundColor %>"
          >
        <% }) %>
      <% } %>
    `)

    this._popoverElement = $textarea.popover({
      placement: 'auto top',
      title: ' ',
      html: true,
      trigger: 'manual',
      template: popoverTemplate,
      container: parentSelector,
    })

    this.show()
    this.idPopoverFor = `#${$textarea.attr('id')}`
  }

  show() {
    this.isShown = true
    this._popoverElement.popover('show')
  }

  hide() {
    this.isShown = false
    this._popoverElement.popover('hide')
  }

  destroy() {
    this.isShown = false
    this._popoverElement.popover('destroy')
  }

  isShown() {
    return this.isShown
  }

  el() {
    let popover = $('.gitphy--popover')
    if(popover.length == 0) return null
    else return popover
  }

  render(opts) {
    this.popoverContent = this.popoverContentTemplate(_.defaults(
      opts,
      {loading: false, noResults: false}
    ))
    this.el().find('.gitphy--popover-content').html(this.popoverContent)
  }
}

let getQuery = (text) => {
  let match = text.match(gitphyRegex)
  if(match) {
    return match[1].trim()
  } else {
    return null
  }
}

let handleTextareaChange = (event) => {
  let $textarea = $(event.target)
  let query = getQuery($textarea.val())

  if(!popover) {
    popover = new Popover($textarea)
  }

  // show popover if there is a query, it'll be populate below
  if(query && !popover.isShown) {
    popover.show()
  }

  // hide popover if there is no query
  // always clear last query when hiding otherwise things like deleting
  // the end paren and adding it back or clicking away and back wont
  // repopulate the popover since the query will be the same
  if(!query && popover.isShown) {
    lastQuery = null
    popover.hide()
  }

  // if there is a query and it wasn't the last one, search for gifs and
  // load then into the popover
  if(query && lastQuery != query) {
    popover.render({loading: true, query: query})

    let giphyApiParams = {q: query, api_key: 'dc6zaTOxFJmzC', limit: 50}
    $.get(giphyApi, giphyApiParams).done((resp) => {

      // No results found
      if(resp.data.length == 0) {
        popover.render({noResults: true, query: query})

      // make an array of objects which contain the preview url, and original url
      // TODO maybe we want to use a downsample gif, turns out rendering 25
      //      gifs onto a page will burn your cpu cycles
      } else {
        let gifs = _.map(resp.data, (gif) => {
          return {
            preview: gif.images.fixed_width.url,
            original: gif.images.original.url,
            backgroundColor: randomColor({luminosity: 'bright'}),
          }
        })

        popover.render({query, gifs})
      }

      lastQuery = query
    })
  }
}

let handleGifClick = (event) => {
  let gifUrl = $(event.currentTarget).data('original-gif-url')
  let $textarea = $(popover.idPopoverFor)

  let substitutedText = $textarea.val().replace(gitphyRegex, `(${gifUrl})`)
  $textarea.val(substitutedText)
}

let handleTextareaBlur = () => {
  lastQuery = null
  // not efficient to create/destroy on every focus espcially if the query
  // is the same, but is the easiest way to ensure that everything is
  // setup and cleaned up correctly for now
  if(popover) {
    popover.destroy()
  }
  popover = null
}

let handleGifMouseover = (event) => {
  $(event.currentTarget).css('border-color', randomColor({luminosity: 'bright'}))
}

let handleGifMouseout = (event) => {
  $(event.currentTarget).css('border-color', '#fff')
}

// mouseup for when user clicks textarea; keyup for typing and pasting
$(parentSelector).on('input focus', textareaSelector, _.debounce(handleTextareaChange, 500))

// close popover, destroy, and clear last query when textarea is unfocused
$(parentSelector).on('blur', textareaSelector, handleTextareaBlur)

// listen on clicks on gifs in popover
$(parentSelector).on('mousedown', '.gitphy--gif', handleGifClick)

// add/remove border to/from gif on hover for active state
$(parentSelector).on('mouseover', '.gitphy--gif', handleGifMouseover)
$(parentSelector).on('mouseout', '.gitphy--gif', handleGifMouseout)

// initialize scroll-scope to keep parent page from scrolling
$(parentSelector).scrollScope()
