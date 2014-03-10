var GiphyCMSExt = {
  init: function() {
    $('#gif-inject-cms').html('<button class="button button-hero" onclick="GiphyCMSExt.doTinyMCEEmbed()">Embed into post</button>');
  },
  doTinyMCEEmbed: function() {
    var embedId = $('img#gif-detail-gif').attr('data-id');
    var width = 500;
    
    var uri = '<iframe src="http://giphy.com/embed/'+embedId+'" width="500" height="269" frameBorder="0" webkitAllowFullScreen mozallowfullscreen allowFullScreen></iframe>';
   
    parent.tinyMCE.activeEditor.execCommand("mceInsertRawHTML", false, uri);
    //parent.tinyMCE.activeEditor.execCommand("mceInsertContent", false, "<img src='" + gifToEmbed + "' width='" + width + "' alt='giphy gif'>");
    parent.tinyMCE.activeEditor.selection.select(parent.tinyMCE.activeEditor.getBody(), true); // ed is the editor instance
    parent.tinyMCE.activeEditor.selection.collapse(false);
    parent.tinyMCE.activeEditor.windowManager.close(window);
  }
};