(function($) {

  var config = MT.Editor.TinyMCE.config;
  var wisiwyg_buttons = config.plugin_mt_wysiwyg_buttons1 + ',|,giphytype';
  var source_buttons = (function(buttons) {
    var replaced = false;
    var before = /,mt_insert_image/;
    var template_button = ',|,';

    buttons = buttons.replace(before, function($0) {
      replaced = true;
      return $0 + template_button;
    });

    if (!replaced) {
      buttons += template_button;
    }

    return buttons;
  })(config.plugin_mt_source_buttons1);

  $.extend(config, {
    plugins: config.plugins + ',mt_giphy_type',
    plugin_mt_wysiwyg_buttons1: wisiwyg_buttons,
    plugin_mt_source_buttons1: source_buttons
  });

  tinymce.create('tinymce.plugins.MTGiphyType', {
    init: function(ed, url) {
      ed.addButton('giphytype', {
        title: 'Giphy GIF Search',
        onclick: function(ev) {
          //var modalw = Math.round($(window).width() * .6);
          //var modalh = Math.round($(window).height() * .8);
          var modalw = 480;
          var modalh = 548;
          
          ed.windowManager.open({
            /** title: "Giphy Embed Wizard", **/
            file: StaticURI + '/plugins/GiphyType/html/giphy.html',
            width: modalw,
            height: modalh,
            inline: true,
            resizable: true,
            scrollbars: true
          }, {
            plugin_url: url, // Plugin absolute URL
            api_key: 'G46lZIryTGCUU', // the API key
            api_host: 'http://api.giphy.com' // the API host
          });

        }
      });
      
      // Overwrite description for the template button.
      //tinyMCE.addI18n(tinyMCE.settings.language + '.template', {
      //  desc: trans('Insert Boilerplate')
      //});
    }
  });

  tinymce.PluginManager.add('mt_giphy_type', tinymce.plugins.MTGiphyType, ['template']);

})(jQuery);
