var dnd = {};

var _ = require("underscore");
var $b = $.build;

// makeSortable($('mktDropZone'), {only:".draggable"});

// var draggable = $b(".draggable
//", [$b(".handle"), "Some Content"]);
// $('body').append(draggable);
// makedraggable(draggable, {
//   handle:".handle",
//   onDrop:function (container, elem, index){
//     container.children().eq(index).after(
//       makedraggable($b("div.draggable", [$b("div.handle"),"Some different content Here"]))
//     );
//   }
// });

// //When done:
dnd.currentDraggable= null;
dnd.placeholder = null;

var DragDropSupport = function (elem, opts){
  dnd.placeholder = null;
  this.placeholder = $b(opts.placeholder);
  this.handleBlocked = opts.handle;
  this.elem = elem;
  this.opts = opts || {};
}

DragDropSupport.prototype.mousedown = function (e){
  this.handleBlocked = false;
};
DragDropSupport.prototype.mouseup = function (e){
  this.handleBlocked = true;
};

DragDropSupport.prototype.dragover = function (e){
  var evt = e.originalEvent;
  if(this.opts.only && $(evt.target).not(this.opts.only)) return false;
  if(dnd.currentDraggable.get(0) === evt.target) return false;

  if(dnd.placeholder !== this.placeholder){
    if(dnd.placeholder) dnd.placeholder.remove();
    dnd.placeholder = this.placeholder
  }

  console.log("Heights!", dnd.currentDraggable.height(), dnd.placeholder.height());
  dnd.placeholder.height(dnd.currentDraggable.height())
  console.log("Heights After!", dnd.currentDraggable.height(), dnd.placeholder.height());

  e.preventDefault();
  evt.dataTransfer.dropEffect = 'move';
  $(dnd.currentDraggable).hide();
  var parent = this.elem.get(0);
  var tgtSib = evt.target;
  while ((tgtSib != parent) && (tgtSib.parentNode != parent)){
    tgtSib = tgtSib.parentNode;
  }
  if(tgtSib === parent) {
    this.elem.append(dnd.placeholder);
  }
  else if ($(tgtSib).is(this.opts.placeholder)){
    //do nothing
  }
  else {
    console.log(evt.offsetY, this.elem.height());
    if(evt.offsetY > ($(tgtSib).height() / 2)){
      $(tgtSib).after(dnd.placeholder);
    }
    else{
      $(tgtSib).before(dnd.placeholder);
    }
  }
}

DragDropSupport.prototype.drop = function (e){
  e.stopPropagation();
  e.preventDefault();

  var o = this.opts;
  var dropEvents = _.compact([this.opts.onDrop, dnd.currentDraggable.data("dnd-onDrop")]);

  var dropFired = false;
  var drg = dnd.currentDraggable;
  for(var i =0; i < dropEvents.length ; i++){
    var result = dropEvents[i](drg, dnd.placeholder, function (){
      if (dnd.placeholder) dnd.placeholder.remove();
      drg.removeClass(o.draggingClass);
    });
    if(result === false){
      return;
    }
    dropFired = true;
  }
  if(dropFired){
    dnd.currentDraggable = null;
  }
  else{
    dnd.currentDraggable.insertBefore(dnd.placeholder);
    dnd.currentDraggable.show();
    this.dragend();
  }
  if(this.opts.onChange){
    this.opts.onChange()
  }

};

DragDropSupport.prototype.dragstart = function (e){
  if(this.handleBlocked) return false;
  dnd.currentDraggable = this.elem;
  var evt = e.originalEvent;
  evt.dataTransfer.effectAllowed = 'move';
  $(evt.target).addClass(this.opts.draggingClass);
}


DragDropSupport.prototype.dragend = function (e){
  if (!dnd.currentDraggable) return;
  if (dnd.placeholder) dnd.placeholder.remove();
  dnd.currentDraggable.removeClass(this.opts.draggingClass);
  dnd.currentDraggable.show();
  //dnd.currentDraggable = null;
}


dnd.makeSortable = function (elem, opts){
  opts = _.defaults(opts || {} , {
    "only":null,
    "handle":null,
    "placeholder":"div.placeholder",
  })
  var children = elem.children(opts.only);
  _.forEach(children, function(elem){
    if(opts.onDraggableCreate){
      opts.onDraggableCreate($(elem), opts);  
    }else{
      dnd.makeDraggable($(elem), opts);
    }
  })

  var dds = new DragDropSupport(elem, opts);

  elem.on("dragover", _.bind(dds.dragover, dds));
  elem.on("dragenter", _.bind(dds.dragover, dds));
  elem.on("drop", _.bind(dds.drop, dds));
  elem.data("dnd-sortable", true);
  return dds;
}

dnd.makeNonDraggable = function (elem){
  elem = $(elem);
  var opts = elem.data("dnd-opts");
  elem.removeData(["dnd-draggable", "dnd-opts", "dnd-onDrop"])
  elem.removeAttr("draggable");
  if(opts && opts.draggableClass){
    elem.removeClass(opts.draggableClass);
  }
  if(opts && opts.draggingClass){
    elem.removeClass(opts.draggingClass);
  }
  elem.off(["dragend", "dragstart"]);
  if(opts.handle){
    elem.off(["mousedown", "mouseup"])
  }
}

dnd.makeDraggable= function (elem, opts){
  elem = $(elem);
  opts = _.defaults(opts || {}, {
    handle:null,
    draggingClass:"dragging",
    draggableClass:null
  });

  if(elem.data("dnd-draggable")){
    return;
  }

  elem.data("dnd-draggable", true);
  var dds = new DragDropSupport(elem, opts); 
 
  elem.on("dragend", _.bind(dds.dragend, dds));
  elem.on("dragstart", _.bind(dds.dragstart, dds));
  if(opts.onDrop){
    elem.data("dnd-onDrop", opts.onDrop);
  }
  elem.attr('draggable',true);
  if(opts.draggableClass){
    elem.addClass(opts.draggableClass)
  }

  if(opts.handle){
    elem.find(opts.handle).mousedown(_.bind(dds.mousedown, dds));
    elem.find(opts.handle).mouseup(_.bind(dds.mouseup, dds));
  }
  elem.data("dnd-opts", opts);

  return dds;
}

module.exports = dnd;

