/* global _, randomColor */

let $textarea = $('#issue_body, #new_comment_field')
let giphyApi = 'https://api.giphy.com/v1/gifs/search'
let gitphyRegex = /\(gitphy:([\w\s]+)\)/

class Popover {
  constructor() {
    let popoverTemplate = `
      <div class="popover gitphy--popover" role="tooltip">
        <div class="arrow"></div>
        <div class="popover-content gitphy--popover-content"></div>
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
          <div class='gitphy--gif-cover-wrapper' style='background-color: <%= gif.backgroundColor %>'>
            <video src="<%= gif.preview %>" autoplay loop class='gitphy--gif-cover' data-original-gif-url="<%= gif.original %>"></video>
          </div>
        <% }) %>
      <% } %>
    `)

    this._popoverElement = $textarea.popover({
      placement: 'auto top',
      title: ' ',
      html: true,
      trigger: 'manual',
      template: popoverTemplate,
    })

    this.isShown = true
  }

  show() {
    this.isShown = true
    this._popoverElement.popover('show')
  }

  hide() {
    this.isShown = false
    this._popoverElement.popover('hide')
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
    this.show()

    this.popoverContent = this.popoverContentTemplate(_.defaults(
      opts,
      {loading: false, noResults: false}
    ))
    this.el().find('.gitphy--popover-content').html(this.popoverContent)
  }
}

let popover = new Popover()
let lastQuery = null

let getQuery = (text) => {
  let match = text.match(gitphyRegex)
  if(match) {
    return match[1].trim()
  } else {
    return null
  }
}

// mouseup for when user clicks textarea
// keyup for typing and pasting
$textarea.on('input focus', _.debounce(() => {
  let query = getQuery($textarea.val())

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

    $.get(giphyApi, {q: query, api_key: 'dc6zaTOxFJmzC'}).done((resp) => {

      // No results found
      if(resp.data.length == 0) {
        popover.render({noResults: true, query: query})

      // make an array of objects which contain the preview url, and original url
      // TODO maybe we want to use a downsample gif, turns out rendering 25
      //      gifs onto a page will burn your cpu cycles
      } else {
        let gifs = _.map(resp.data, (gif) => {
          return {
            preview: gif.images.fixed_width.mp4,
            original: gif.images.original.url,
            backgroundColor: randomColor({luminosity: 'light'}),
          }
        })

        popover.render({query, gifs})
      }

      lastQuery = query
    })
  }
}, 500))

// listen on clicks on gifs in popover
$('body').on('mousedown', '.gitphy--gif-cover', (event) => {
  let gifUrl = $(event.currentTarget).data('original-gif-url')
  let substitutedText = $textarea.val().replace(gitphyRegex, `(${gifUrl})`)
  $textarea.val(substitutedText)
})

// close popover and clear last query when textarea is unfocused
$textarea.on('blur', () => {
  lastQuery = null
  popover.hide()
})
