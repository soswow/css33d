
if(!jQuery.fn.css3){
  jQuery.fn.css3 = function() {
    var property, value, map, key;
    if (arguments.length === 1) {
      map = arguments[0];
      for (key in map) {
        this.css3(key, map[key]);
      }
    } else if (arguments.length === 2) {
      property = arguments[0],value = arguments[1];

      var that = $(this);
      $.each(["-webkit-", "-moz-", "-o-", ""], function() {
        that.css(this + property, value);
      });
    }
    return that;
  };
}
$(function(){

  var xy = function(x,y){
    return {X:x,Y:y};
  };
  var xyz = function(x,y,z){
    return $.extend(xy(x,y), {Z:z});
  };
  var coordsToStr = function(coords, sep, postfix){
    postfix = postfix || "";
    sep = sep || ", ";
    return [coords.X, coords.Y, coords.Z||0].join(sep) + postfix;
  };

  var plane = function(options){
    var size = options.size,
        sizeIsArray = $.isArray(size),
        parent = options.parent,
        texture = options.texture || "#f00",
        rect = $("<div></div>")
            .attr(options.attr || {})
            .addClass(options['class'] || '')
            .css({
              position:"absolute",
              width: (sizeIsArray?size[0]:size)+"px",
              height: (sizeIsArray?size[1]:size)+"px",
              background: texture
            }),
        body =  {
          universe: null,
          parent: parent,
          object: rect,
          angles: options.angles || xyz(0,0,0),
          position: options.position || xyz(0,0,0),
          perspOrigin: null,
          origin: options.origin || xyz("50%","50%",0),
          children: [],
          getMostParent: function(){
            if(this.parent && this.parent.object){
              return this.parent.getMostParent();
            }else{
              return this;
            }
          },
          addChild: function(child){
            this.children.push(child);
          },
          renderTree: function(){
            this.getMostParent().render();
          },
          render: function(){
            var transformStyle = "", coord;

            for(coord in this.angles){
              transformStyle+=" rotate"+coord+"("+this.angles[coord]+"deg) ";
            }
            for(coord in this.position){
              transformStyle+=" translate"+coord+"("+this.position[coord]+"px) ";
            }

            if(this.origin){
              var originStyle = coordsToStr(this.origin, " ");
              this.object.css3("transform-origin", originStyle);
            }

            this.object.css3("transform", transformStyle);

            if(this.perspOrigin){
              this.universe.css3("perspective-origin", this.perspOrigin.X+"px "+this.perspOrigin.Y+"px");
            }

            for(var i=0; i<this.children.length;i++){
              this.children[i].render();
            }
            return this;
          },
          addCube: function(size, position){
            var parent=this,
                makePlane = function(options){
                  return plane($.extend({
                    origin:xyz(0, 0, 0),
                    size:size,
                    position:position,
                    parent:parent,
                    'class':'cubeFace'
                  }, options));
                };
            parent = makePlane({position:xyz(1,1,-1), texture:'#000'});
            makePlane({angles:xyz(90,0,0), texture:'#aaa'});
            makePlane({angles:xyz(0,-90,0),  texture:'#bbb'});
            makePlane({position:xyz(0,0,size), texture:'#ccc'});
            makePlane({angles:xyz(90,0,0), position:xyz(0,0,-size), texture:'#aaa'});
            makePlane({angles:xyz(0,-90,0), position:xyz(0,0,-size), texture:'#aaa'});

            return this;
          }
        };

    if(parent.object){
      rect.appendTo(parent.object);
      parent.addChild(body);
      body.universe = parent.universe;
    }else{
      rect.appendTo(parent);
      body.universe = parent;
//      body.universe.perspOrigin = xy(rect.width()/2+rectPos.left)
    }
    return body;
  };

  var makeStage = function(options){
    options = options || {};
    var universe = options.universe || $("#universe"),
        stagePos = options.stagePosition || xy(300, 80),
        stage = plane({
          attr:{id:"stage"},
          size:359,
          parent:universe,
          texture:'url("grid.jpg")'
        });
    stage.position.Z=-50;
    return stage.render();
  };

  var stage = makeStage(),
      perspOrigin = $("#perspOrigin");

  $("#xslider").slider({
    orientation: "vertical",
    min:-180,
    max:180,
    slide: function(e, ui){
      stage.angles.X = ui.value;
      $(this).find(".info").html(ui.value);
      stage.render();
    }
  });

  $("#zslider").slider({
    min:-180,
    max:180,
    slide: function(e, ui){
      stage.angles.Z = ui.value;
      $(this).find(".info").html(ui.value);
      stage.render();
    }
  });

  perspOrigin.draggable({
    drag: function(e, ui){
      stage.perspOrigin = xy(ui.position.left, ui.position.top);
      stage.render();
    }
  }).css({
    left: stage.object.width()/2  - perspOrigin.width()/2,
    top:  stage.object.height()/2 - perspOrigin.height()/2
  });

  stage.addCube(40, xy(0, 0)).renderTree();
});