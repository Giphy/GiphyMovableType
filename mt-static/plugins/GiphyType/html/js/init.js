// init masonry
// $(function() {
$('#gifs').masonry({
  itemSelector: '#gifs li',
  columnWidth: 145,
  gutter: 10,
  transitionDuration: '0.2s',
  isFitWidth: true
});
// });

// init giphy
// TODO: this is hardcoded - FIX so EXT only!!
GiphySearch.init();
GiphySearch.search("giphytrending", 100, true);
// start the default search

// init the cms app
GiphyCMSExt.init();
