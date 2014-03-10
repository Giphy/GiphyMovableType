/***
    
    

    THIS IS SHARED CODE BASE

        it NEEDS TESTS!

    Implemented:
        mobile web
        chrome ext
        firefox ext
        safari ext


*/

var GiphySearch = {
    MAX_TAGS: 5,
    PLATFORM_COPY_PREPEND_TEXT:"",
    MAX_GIF_WIDTH: 145,
    SEARCH_PAGE_SIZE: 100,
    INFINITE_SCROLL_PX_OFFSET: 100,
    INFINITE_SCROLL_PAGE_SIZE: 50,
    ANIMATE_SCROLL_PX_OFFSET: 200,
    STILL_SCROLL_PAGES: 1,
    SCROLLTIMER_DELAY: 250,
    SCROLL_MOMENTUM_THRESHOLD: 100,
    ALLOW_URL_UPDATES:true, // enable history pushstate via add_history method
    API_KEY:"G46lZIryTGCUU", 
    //API_KEY: api_key,
    location:{}, // for chrome ext

    // navigation vars
    curPage: "gifs",

    // scrolling vars
    curScrollPos: 0,
    prevScrollPos: 0,
    isRendering: false,

    // event buffer timers
    scrollTimer: 0,
    searchTimer: 0,
    renderTimer: 0,
    // infinite scroll vars
    curGifsNum: 0, // for offset to API server
    curResponse: null,
    prevResponse: null,

    // search vars
    curSearchTerm: "",
    prevSearchTerm: "",


    init: function(data) {
        //console.log("init()");
        if(GiphySearch.is_ext()) {
            GiphySearch.init_chrome_extension();    
        } else {
            // fix me! target FF only somehow
            GiphySearch.init_firefox_extension();
        }
        
        GiphySearch.bind_events();
        
    },
    bind_events:function() {
        //console.log("bind_events();")
        $(window).on('popstate', function(event) {
            GiphySearch.handleBrowserNavigation.call(this,event);
        });

        // set the container height for scrolling
        // container.height($(window).height());
        var $container = $("#container");
    

        // watch scroll events for desktop
        $container.on("scroll", function(event) {
            //console.log("scroll event");
            GiphySearch.scroll.call(this,event);
        }).on("click", ".tag", function(event) {
            GiphySearch.handleTag.call(this,event);
        }).on("click", ".gif_drag_cover", function(event) {
       	    //console.log("handle gif drag cover");
    	    GiphySearch.handleGifDetailByCover.call(this,event);
        }).on("dragstart", ".giphy_gif_li", function(event) {
            //GiphySearch.handleGIFDragFFFix.call(this, event);
        }).on("dragstart", "#gif-detail-gif", function(event){
            //GiphySearch.handleGIFDrag.call(this, event);
        }).on("dragstart", ".gif-detail-cover", function(event){
            //GiphySearch.handleGIFDragDetailFFFix.call(this, event);            
        }).on("click", "#categories .popular_tag", function(event) {
            GiphySearch.handleTag.call(this,event);
        })

        $("#app").on("click", ".logo-text", function(event) {
            GiphySearch.handleTrendingHome.call(this,event);
        }).on("click", ".logo-image", function(event) {
            GiphySearch.handleTrendingHome.call(this,event);
        });

        // address 'home' via logo tag
        $("#header").on("click", function(event) {

        });

        // search input handler
        $("#searchbar-input").keypress(function(event) {
            if(event.keyCode == 13) {
                GiphySearch.handleSearch.call(this,event);
            }
        });

        // search button handler
        $("#search-button").on("click", function(event) {
            GiphySearch.handleSearch.call(this,event);
        });

        // categories handler
        $("#categories-button").on("click", function(event) {
            GiphySearch.handleCategories.call(this,event);
        });

        // back button handler
        $("#back-button").on("click", function(event) {
            GiphySearch.handleBack.call(this,event);
        });



    },
    is_ext:function() {
        return !!(window.chrome && chrome.contextMenus);
    },
    init_firefox_extension:function() {
        GiphySearch.STILL_SCROLL_PAGES = 3;
        //console.log("init_firefox_extension();");
        $(".ff_window_close_btn").bind("click", function(e) {
            window.close();
        })
    },
    init_chrome_extension:function() {
        
        GiphySearch.PLATFORM_COPY_PREPEND_TEXT = "Copy to clipboard: "
        // GiphySearch.search("giphytrending", 100, true);
        GiphySearch.ALLOW_URL_UPDATES = false;
        GiphySearch.STILL_SCROLL_PAGES = 3;


        window.unonload = function() {
            //console.log("closed!")
            // chrome.contextMenus.removeAll();
        }

        $("#container").on("click", "#gif-detail-link", function(event) {
            // copy to clipboard..
            var $this = $(this);
            ;
            var _input = newT.input({
                type:"text", 
                id:"giphy_copy_box",
                value:$this.data("shortlink")
            });
            $("#giphy_copy_box").remove();
            $(document.body).append(_input);
            document.getElementById("giphy_copy_box").select();
            document.execCommand('Copy', false, null);                
        });
        var protocol_exp = /([https|http|ftp]+:)\/\//;
        var hostname_exp = /\/\/([^\/]+)\/?/;
        function urlparse(_url) {
          var params = {};

          var m1 = _url.match(protocol_exp);
          if(m1 && m1.length > 1) {
            params.scheme = m1[1];
          }

          var m2 = _url.match(hostname_exp);
          if(m2 && m2.length >1) {
            params.hostname = m2[1];
          }
          return params;
        }        
        GiphySearch.render_completed = function() {
            // //console.log("foo!");
            $("#searchbar-input").focus();
        }

        // load chrome!
        chrome.contextMenus.create({
          "id":"giphy_context_menu",
          "title" : "Copy Link address",
          "type" : "normal",
          "contexts" : ["image"] //the context which item appear

        }); 
        chrome.contextMenus.create({
          "id":"giphy_img_src_menu",
          "title" : "Copy Full Size GIF Image",
          "type" : "normal",
          "contexts" : ["image"] //the context which item appear

        });         
        chrome.windows.getCurrent(function(_win) {
          chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {

            if(_gaq) {
              _gaq.push(['_trackEvent', 'chromeext', 'open_popup']);  
            }
            
            GiphySearch.location = urlparse(tabs[0].url);

            
          });

        });

        // setup the right click to work...
        chrome.contextMenus.onClicked.addListener(function(info, tab) {
            // lookup the context
            // //console.log("context menu!", info, info.srcUrl, GiphySearch.curResponse, GiphySearch.find_by_src(info.srcUrl));
            // TODO POSSIBLE ERROR here
            var gif_obj = GiphySearch.find_by_src(info.srcUrl);
          
          if(!gif_obj) {
            //console.log("NO SUCH GIF!");
            gif_obj = GiphySearch.curResponse.data[0];
            // return; // BAIL out
          } 

          var elem_params = {
            type:"text", 
            id:"giphy_copy_box",
            value:info.srcUrl
          };
          // //console.log("info.menuItemId", info.menuItemId);
          if(info.menuItemId === "giphy_img_src_menu") {
            // //console.log("Using", gif_obj.images.original.url);
            elem_params.value = gif_obj.images.original.url;            
          } else {
            // //console.log("Using", gif_obj.bitly_gif_url);
            elem_params.value = gif_obj.bitly_gif_url;
          }
          var div = newT.input(elem_params);          
          // $("#giphy_copy_box").val( elem_params.value ).select()
          // $("#giphy_copy_box").val( info.srcUrl );
          
          $("#giphy_copy_box").remove(); // kill existing
          $(document.body).append(div);
          document.getElementById("giphy_copy_box").select();
          document.execCommand('Copy', false, null);    
          
          setTimeout(function() {
              if(_gaq) {
                _gaq.push(['_trackEvent', 'chromeext', 'right_click', gif_obj.id ]);  
              }
          },0);

        });
    },
    find_by_src:function(src_url) {
        var all_gifs = [];
        var selected = null;
        if(GiphySearch.prevResponse) {
            all_gifs.push.apply(all_gifs,GiphySearch.prevResponse.data);    
        }

        if(GiphySearch.curResponse) {
            all_gifs.push.apply(all_gifs,GiphySearch.curResponse.data);    
        }
        
        // var data = GiphySearch.curResponse;
        for(var i=0, len=all_gifs.length; i<len; i++) {
            if(all_gifs[i].images.fixed_width.url === src_url) {
                selected = all_gifs[i];
                break;
            }
        }
        all_gifs = [];
        return selected;
    },
   
    format:function(str,params) {
        return str.replace(/%\((\w+)\)s/g, function(m, key) {
            return params[key] || ""
        });
    },   

    /**
        Handlers definitions
            handle all the events

            this is a hodge-podge
            some of the events call sub methods, others
            are defined top level
    */ 
    handleGIFDragDetailFFFix:function(e) {
        //console.log("Handle FF drag")
        var dt = e.originalEvent.dataTransfer;
        var $this = $(this).parent("div").find("img");
        // var _id = $this.data("id");
        var _hostname = GiphySearch.location.hostname;
        var gif_obj = GiphySearch.find_by_src( $this.attr("src") );
        // //console.log("found gif!", gif_obj);
        if(!gif_obj) {
            //console.log("no such GIF", gif_obj);
            return;
        }
        dt.dropEffect = "copy";
        dt.effectAllowed = "copy";  
        // dt.dropEffect= 'move';  
        // dt.effectAllowed = "copyMove"
        var htmlstr = GiphySearch.gmail_template( {
            src:gif_obj.images.original.url, 
            url:gif_obj.bitly_gif_url 
        });

        // dt.effectAllowed = "move";
        // dt.dropEffect = "move";

        dt.setData("text/html", htmlstr);
        dt.setData("text", htmlstr);    

        // dt.setData("text/html", "foobar");
        // dt.setData("text", "foobar");    

        //console.log("setting data", dt.getData("text"))

        if(_hostname === "twitter.com") {
            dt.setData("text/html", gif_obj.bitly_gif_url + " via @giphy"  );
        }
        if(_hostname === "www.facebook.com") {
            dt.effectAllowed = "linkMove";
            dt.dropEffect = "linkMove";
            // FB pukes on our short link. use full url for better user experience
            dt.setData("text/html", "http://giphy.com/gifs/" + gif_obj.id  );
            dt.setData("text", "http://giphy.com/gifs/" + gif_obj.id  );            
        }
        if(/.*\.hipchat\.com/.test(_hostname)) {
            dt.setData("text/html", gif_obj.images.original.url);
            dt.setData("text", gif_obj.images.original.url);           
        }  
    },
    handleGIFDragFFFix:function(e) {
        //console.log("Handle FF drag")
        var dt = e.originalEvent.dataTransfer;
        var $this = $(this).find("img");
        // var _id = $this.data("id");
        var _hostname = GiphySearch.location.hostname;
        var gif_obj = GiphySearch.find_by_src( $this.attr("src") );
        // //console.log("found gif!", gif_obj);
        if(!gif_obj) {
            //console.log("no such GIF", gif_obj);
            return;
        }
        dt.dropEffect = "copy";
        dt.effectAllowed = "copy";  
        // dt.dropEffect= 'move';  
        // dt.effectAllowed = "copyMove"
        var htmlstr = GiphySearch.gmail_template( {
            src:gif_obj.images.original.url, 
            url:gif_obj.bitly_gif_url 
        });

        // dt.effectAllowed = "move";
        // dt.dropEffect = "move";

        dt.setData("text/html", htmlstr);
        dt.setData("text", htmlstr);    

        // dt.setData("text/html", "foobar");
        // dt.setData("text", "foobar");    

        //console.log("setting data", dt.getData("text"))

        if(_hostname === "twitter.com") {
            dt.setData("text/html", gif_obj.bitly_gif_url + " via @giphy"  );
        }
        if(_hostname === "www.facebook.com") {
            dt.effectAllowed = "linkMove";
            dt.dropEffect = "linkMove";
            // FB pukes on our short link. use full url for better user experience
            dt.setData("text/html", "http://giphy.com/gifs/" + gif_obj.id  );
            dt.setData("text", "http://giphy.com/gifs/" + gif_obj.id  );            
        }
        if(/.*\.hipchat\.com/.test(_hostname)) {
            dt.setData("text/html", gif_obj.images.original.url);
            dt.setData("text", gif_obj.images.original.url);           
        }          
    },
    handleGIFDrag:function(e) {
        //console.log("I am dragging!", e);
        // e.preventDefault();
        // e.stopPropagation();
        // $('.dropzone').hide().removeClass('dropzone-hilight');
        var dt = e.originalEvent.dataTransfer;
        var $this = $(this);
        // var _id = $this.data("id");
        var _hostname = GiphySearch.location.hostname;
        var gif_obj = GiphySearch.find_by_src( $this.attr("src") );
        // //console.log("found gif!", gif_obj);
        if(!gif_obj) {
            //console.log("no such GIF", gif_obj);
            return;
        }
        dt.dropEffect = "copy";
        dt.effectAllowed = "copy";  
        // dt.dropEffect= 'move';  
        // dt.effectAllowed = "copyMove"
        var htmlstr = GiphySearch.gmail_template( {
            src:gif_obj.images.original.url, 
            url:gif_obj.bitly_gif_url 
        });

        // dt.effectAllowed = "move";
        // dt.dropEffect = "move";

        dt.setData("text/html", htmlstr);
        dt.setData("text", htmlstr);    

        // dt.setData("text/html", "foobar");
        // dt.setData("text", "foobar");    

        //console.log("setting data", dt.getData("text"))

        if(_hostname === "twitter.com") {
            dt.setData("text/html", gif_obj.bitly_gif_url + " via @giphy"  );
        }
        if(_hostname === "www.facebook.com") {
            dt.effectAllowed = "linkMove";
            dt.dropEffect = "linkMove";
            // FB pukes on our short link. use full url for better user experience
            dt.setData("text/html", "http://giphy.com/gifs/" + gif_obj.id  );
            dt.setData("text", "http://giphy.com/gifs/" + gif_obj.id  );            
        }
        if(/.*\.hipchat\.com/.test(_hostname)) {
            dt.setData("text/html", gif_obj.images.original.url);
            dt.setData("text", gif_obj.images.original.url);           
        }   
    },

    handleSearch: function(event) {
        ////console.log("handleSearch()");

        // get the tag to search
        var tag = $("#searchbar-input").val();
        if(tag == "") return;

        // don't reset the typed in input!
        GiphySearch.scrollTimer = 0;
        GiphySearch.searchTimer = 0;
        GiphySearch.curY = 0;
        GiphySearch.curOffset = 0;
        // reset the scroll and page vars
        // GiphySearch.resetSearch();

        // make the new search
        GiphySearch.show_preloader();
        GiphySearch.search(tag, GiphySearch.SEARCH_PAGE_SIZE, true);
        GiphySearch.navigate("gifs");
    },
    handleTrendingHome:function(event) {
        GiphySearch.show_preloader();
        GiphySearch.resetSearch();
        GiphySearch.search("giphytrending", 100, true);
        GiphySearch.navigate("gifs");
        // GiphySearch.add_history( "Giphy", "/" );       
    },
    handleTag: function(event) {
        ////console.log("handleTag()");

        // get the tag
        var tag = $(event.target).text();
        if(tag == '') return;

        GiphySearch.show_preloader();
        GiphySearch.resetViewport();
        GiphySearch.updateSearch( tag );
        
        // reset the scroll and page vars
        // GiphySearch.resetSearch();
        
        // make the new search
        GiphySearch.search(tag, GiphySearch.SEARCH_PAGE_SIZE, true);
        GiphySearch.navigate("gifs");
        // isolate all these,
        // restrict to a flag
        // GiphySearch.add_history( "Giphy Gif Search", "/search/" + tag.replace(/\s+/g, '-') );
        
    },
    handleGifDetailByCover:function(event) {
        var gif = $(event.target).parent(".giphy_gif_li").find("img");
        GiphySearch._opendetail( gif );
    },

    handleGifDetail: function(event) {
        //console.log("handleGifDetail()");

        // get the fullsize gif src
        var gif = $(event.target);
        GiphySearch._opendetail( gif );

    },
    _opendetail:function(gif) {
        var gifEl = $("#gif-detail-gif");
        // var loader = $("#loader");
        var animatedLink = gif.attr("data-animated");
        var staticLink =  gif.attr("data-still");

        gifEl.attr("src", staticLink);
        gifEl.attr("data-id", gif.attr("data-id"));

        // show the loader
        // loader.css("display","block");
        GiphySearch.show_preloader();

        $("<img />").attr("src", animatedLink).load(function(e){
            // //console.log("load event", this.naturalHeight, this.clientWidth)
            GiphySearch.hide_preloader();
            // loader.css("display","none");
            gifEl.attr("src", animatedLink);
            // height:gif.attr("original_height")
            $(".gif-detail-cover").css({
               height:$("#gif-detail-gif").height()
            }).attr("draggable", true);
        });

        var linkHTML = "<span class='gif-link-info'>" + GiphySearch.PLATFORM_COPY_PREPEND_TEXT+""+ gif.attr("data-shortlink")+"</span>";
        var tags = gif.attr("data-tags").split(',');
        var tagsHTML = "";
        $(tags).each(function(idx, tag){
            if(tag !== ""){
                tagsHTML += "<span class='gif-detail-tag'>"+tag+"</span>"; //USE ACTUAL ENCODDed?
            }
        });

        
        $("#gif-detail-link").html(linkHTML).attr({
            "data-shortlink":gif.attr("data-shortlink") // we should call this data the same name as the server does
        });
        
        $("#gif-detail-tags").html(tagsHTML);

        $(".gif-detail-tag").on("click", function(event) {
            GiphySearch.handleTag(event);
        });

        // GiphySearch.add_history( "Giphy", "/gifs/"+gif.attr("data-id") );
        GiphySearch.navigate("gif-detail");
    },
    handleCategories: function(event) {
        ////console.log("handleCategories()");
        event.preventDefault();
        GiphySearch.navigate("categories");
    },


    handleBrowserNavigation: function(event){
        /*
         * UPDATE SO TO NOT MAKE NEW SEARCH CALLS WHen
         */
        var pathHash = window.location.pathname.split('/');
        if(pathHash[1] != "") {
            if(pathHash[1] == "gifs"){
                GiphySearch.navigate("gif-detail", pathHash[2]);
            }
            if(pathHash[1] == "search"){
                GiphySearch.search(pathHash[2], 100, true);
                GiphySearch.navigate("gifs");
            }
        } else {
            GiphySearch.search("giphytrending", 100, true);
            GiphySearch.navigate("gifs");
        }
    },

    handleBack: function(event) {
        ////console.log("handleBack()");

        // no back on the gifs page
        if(GiphySearch.curPage == "gifs") { return; }

        // back to the gif page
        if(GiphySearch.curPage == "categories" ||
            GiphySearch.curPage == "gif-detail") {
            // GiphySearch.add_history("Giphy", "/");
            
            GiphySearch.navigate("gifs");
        }
    },

    navigate: function(page, data) {
        ////console.log("navigate(" + page + "," + data + ")");

        // set the current page
        GiphySearch.curPage = page;

        // hide everything
        $("#gifs,#gif-detail,#share-menu,#categories,#category,#back-button").hide();
        // show the footer... it goes away on the gif-detail
        $("#footer").show();

        // gifs
        if(page == "gifs") {
            $("#gifs").show();
        }

        // gif detail
        if(page == "gif-detail") {
            $("#gif-detail,#back-button,#share-menu").show();
            $("#footer").hide();
        }

        // categories
        if(page == "categories") {
          //console.log("showing back button");
          $("html, body").animate({ scrollTop: 0 }, "fast");
          $("#categories,#back-button").show();
        }

        // category
        if(page == "category") {
            $("#category").show();
        }
    },


    orientationchange: function(event) {
        //console.log("orientationchange()");
    },

    scroll: function(event) {
        ////console.log("scroll()");

        // only scroll on gifs page
        if(GiphySearch.curPage != "gifs") return;

        // set the current scroll pos
        GiphySearch.prevScrollPos = GiphySearch.curScrollPos;
        GiphySearch.curScrollPos = $(event.target).scrollTop() + $(window).height();

        // infinite scroll
        if(GiphySearch.curScrollPos + GiphySearch.INFINITE_SCROLL_PX_OFFSET > $("#gifs").height()) {

            // start the infinite scroll after the last scroll event
            clearTimeout(GiphySearch.searchTimer);
            GiphySearch.searchTimer = setTimeout(function(event) {
                GiphySearch.search(GiphySearch.curSearchTerm, GiphySearch.INFINITE_SCROLL_PAGE_SIZE, false);
            }, 250);
        }

        // compenstate for a double scroll end event being triggered
        clearTimeout(GiphySearch.scrollTimer);
        GiphySearch.scrollTimer = setTimeout(function() {
            GiphySearch.scrollend(event);
        }, GiphySearch.SCROLLTIMER_DELAY);
    },

    scrollstart: function(event) {
        ////console.log("scrollstart()");
    },

    scrollend: function(event) {

        if(GiphySearch.renderTimer) { clearTimeout(GiphySearch.renderTimer); }
        GiphySearch.renderTimer = setTimeout(function() {
            GiphySearch.render();
        }, 250);
    },
    hide_preloader:function() {

        $(".loading_icon_box,.loading_icon").css("display","none");
    },
    show_preloader:function() {
        $(".loading_icon_box,.loading_icon").css("display","block");
    },    
    // THIS IS POORLY NAMED, it doesn't render, it displays..
    // renders (aka added to DOM happens WAY earlier)
    render: function() {

        
        if(GiphySearch.isRendering) return;
        GiphySearch.isRendering = true;

        
        //console.log("*** render() ***");
        //console.log("*** display() ***");

        // get all the gifs
        /**
            NOTE:
                lis ONLY has a length
                when there are ALREADY rendered items
                on the page

                this is related to using setTimeout
                when adding images to masonry / DOM


        */        
        var lis = $("#gifs li");
        // calculate the window boundaries        
        var windowTop = $(window).scrollTop(); 
        var windowBottom = windowTop + $(window).height();
        var windowHeight = $(window).height();

        // sliding window of animated, still, and off
        for(var i=0; i<lis.length; i++) {

            // get the gif

            var li = $(lis.get(i));

            // try cooperative multitasking to let the graphics render have a moment
            // this seems super innefficient b/c we access the DOM a LOT
            (function($li, _pos) {
                setTimeout(function() {

                // need to calculate the window offsets and some emperical padding numbers
                var liTop = $li.offset().top;
                var liBottom = liTop + $li.height();
                var img = $li.find("img");
                var liHeightOffset = GiphySearch.ANIMATE_SCROLL_PX_OFFSET;
                var stillPagesOffset = GiphySearch.STILL_SCROLL_PAGES;

                // turn on the gifs that are in view... we pad with an offset to get the edge gifs
                if((liTop >= windowTop - liHeightOffset) && (liBottom <= windowBottom + liHeightOffset)) {
                // if((liTop >= windowTop - liHeightOffset) && (liBottom <= windowBottom + liHeightOffset)) {
                    ////console.log("GIF ON");

                    // buffer the animated gifs with a page above and below of stills...
                    // pad these a big with multiples of the window height
                    $(img).attr("src", $(img).attr("data-animated"));
                    // $(img).attr("src", $img.attr("data-downsampled"));

                } else if((liTop >= windowTop - windowHeight*stillPagesOffset) &&
                          (liBottom <= windowBottom + windowHeight*stillPagesOffset)) {
                    ////console.log("GIF STILL");

                    // still these gifs
                    $(img).attr("src", $(img).attr("data-still"));

                } else {
                    ////console.log("GIF OFF");

                    // clear the rest of the gifs

                    if(GiphySearch.is_ext()) {
                        $(img).attr("src", $(img).attr("data-still") );
                    } else {
                        $(img).attr("src", "img/clear.gif");    
                    }
                    
                }
                
                if(lis.length-1 === _pos) {
                    GiphySearch.render_completed();
                    // //console.log(i, "current possition",  lis.length) 
                } 
            }, 0)})( $(li), i  );

        }

        // reset rendering
        GiphySearch.isRendering = false; 
        GiphySearch.hide_preloader();  
        //console.log("rendering completed", "is rendering", GiphySearch.isRendering, lis.length);
    },
    gmail_template:function(params) {
        // we paste this 'template' into the dragdrop datatranser object
        return GiphySearch.format( '<a href="%(url)s"><img src="%(src)s" border="0" /></a><br />via <a href="%(url)s">giphy.com</a>', params );
    },
    render_completed:function() {
        //console.log("done rendering now!");
        
    },
    updateSearch:function(txt) {
        $("#searchbar-input").val(txt);
    },
    resetViewport:function() {
        GiphySearch.scrollTimer = 0;
        GiphySearch.searchTimer = 0;
        GiphySearch.curY = 0;
        GiphySearch.curOffset = 0;
    },
    resetSearch: function() {
        ////console.log("resetSearch()");

        // reset the search box
        // $("#searchbar-input").blur();
        $("#searchbar-input").val("");
        // reset the scroll params
        GiphySearch.resetViewport();
    },
    process_search_response:function(response) {
        //console.log("fetched API data", response)
        // set the current search term
        // parse the gifs
        var gifs = response.data;
        var elem_array = [];
        var _frag = document.createDocumentFragment();
        for(var i=0; i<gifs.length; i++) {

            var gif = gifs[i];
            var tags = gif.tags || [];
            var gifTags = newT.frag();
            var _dataTags = [];
            // TODO: make this a function
            if(tags) {
                for(var j=0; j<tags.length && j<GiphySearch.MAX_TAGS; j++) {
                    if(tags[j].indexOf('giphy') == -1){
                        gifTags.appendChild(newT.span({
                            clss:"tag"
                        }, tags[j]));
                        _dataTags.push( tags[j] );
                    }
                }
            }
            var dataTags = _dataTags.join(",")
            // //console.log(gifTags);
            var gif_height = Math.floor((gif.images.fixed_width.height * GiphySearch.MAX_GIF_WIDTH / gif.images.fixed_width.width));
            var _li = newT.li({
                        clss:"giphy_gif_li",
                        draggable:true
                    },
                    newT.img({
                        // draggable:true,
                        clss:"gif giphy_gif",
                        height:gif_height,
                        original_height:gif.images.fixed_width.height,
                        "data-id":gif.id,
                        "data-animated":gif.images.fixed_width.url,
                        "data-downsampled":gif.images.fixed_height_downsampled.url,
                        "data-still":gif.images.fixed_width_still.url,
                        "data-tags":dataTags,
                        "data-shortlink":gif.bitly_gif_url,
                        src:"img/clear.gif"

                    }),
                    newT.div({
                        clss:"tags"
                    }, newT.div({
                        clss:"tags_inner"
                        },gifTags)),
                    newT.div({
                        clss:"actions"
                    },newT.a({
                        href:"#"
                    })),
                    newT.div({
                        clss:"gif_drag_cover",
                        style:"height:" + gif_height + "px;"
                    })
                )

            _frag.appendChild(_li);
            elem_array.push(_li)
            // increment the num gifs
            GiphySearch.curGifsNum++; // why? really seriously why?


        }
        // when I call settimout, the page no longer loads - WHY? no lis..
        document.getElementById("gifs").appendChild(_frag);
        $("#gifs").masonry('appended', elem_array, true);
        

        
    },
    search: function(q, limit, reset) {
        // if we are searching, bail on scroll
        // are we a new search vs infinite scroll then reset the gif count
        if(reset) {
            GiphySearch.curGifsNum = 0;
            $('#gifs').empty();
        }
        GiphySearch.show_preloader();

        // save the current and previous search terms
        GiphySearch.prevSearchTerm = GiphySearch.curSearchTerm;
        GiphySearch.curSearchTerm = q;

        // giphy search api url
        var url = "http://api.giphy.com/v1/gifs/search?api_key=" + GiphySearch.API_KEY +
            "&q=" + q +
            //"&type=min" +
            "&limit=" + limit +
            "&offset=" + GiphySearch.curGifsNum;

        // make the ajax call
        var xhr = $.ajax({
            dataType: "json",
            url: url
        });
        xhr.done(function(resp) {
            // skip prev responses
            if(GiphySearch.curResponse == resp) { return; }           
            GiphySearch.curSearchTerm = q;
            GiphySearch.curLimit = limit;
            // set the previous response to keep out old data
            GiphySearch.prevResponse = GiphySearch.curResponse;
            GiphySearch.curResponse = resp;

            // if this is reset then swap ou
            if(reset) {
                $("#gifs").empty();
                $("#gifs").masonry();
            } 
            setTimeout(function() {
                GiphySearch.process_search_response(resp); 
                GiphySearch.render();   
            },0)           
            
        })
        .fail(function(resp) {          
          alert( "error communicating with giphy api! try again later." );
        });
        return xhr;
        // xhr.
    }
}
