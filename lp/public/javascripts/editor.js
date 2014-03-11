var dnd = require("./newdnd.js");
var that = {};
var $b = $.build;


//Centers an element on the screen using position:fixed.
//Auto recalcuates position on window resize.

var centerElem = function (elem){
  var win = $(window);
  var recenter = function (){
    var h = win.height();
    var w = win.width();
    elem.css({
      position:"fixed", 
      left: Math.max((w/2) - (elem.outerWidth() / 2) , 0),
      top: Math.max((h / 2) - (elem.outerHeight() /2), 10)  
    });
  }
  win.resize(recenter);
  recenter();
}
  
//Streches an element to the width/height of the window using position:fixed;
var fillWindowElem = function (elem){
  var win = $(window);
   var stretch = function (){
     var h = win.height();
     var w = win.width();
     elem.css({
        position:"fixed",
        top:0,
        left:0,
        width:w,
        height:h
     })
  }
  win.resize(stretch);
  stretch();
};

that.showModal = function (content,opts){
  opts = opts || {width:450}
  var centeredArea, modal, screen;
  modal = $b(".mktModal", [
   screen = $b(".mktModalScreen"), //screen
   centeredArea = $b(".mktModalContent", //content
     [
       // $b(".mktModalClose").click(function (){
       //   modal.hide();
       // }), //close button        
       content                  
     ]).css({width:opts.width})                                 
  ]);
  $("body").append(modal);
  fillWindowElem(screen);
  centerElem(centeredArea);
  return modal;
};

var filterEditorStuff = function(el){
  el.find(".mktEdit").remove();
  el.find(".mktPlaceholder").remove();
  el.find(".mktHandle").remove();
  el.find(".mktDraggable").removeClass("mktDraggable");
  return el;
}
  
var saveEditorChanges = function (){
  var doc = $("#editorFrame iframe").contents();

  var keys = ["primary", "secondary", "header", "footer"];

  var toSave = {};
  $.each(keys, function (i, k){
    var tempNode = $b(".temp", [$b.html(doc.find("#"+k).html())]);
    toSave[k]=filterEditorStuff(tempNode).html();
  })

  $.ajax({
    dataType:"json",
    url:location.href.replace("/editor", ""),
    data:{template:JSON.stringify(toSave)},
    type:"POST",
    success:function (data){
      console.log("saved data", data);
      $("#framesbox .framewrap:not(#editorFrame) iframe").each(function (){
        this.contentDocument.location.reload();
      })
    },
    traditional:true
  });
}

var showImageModal = function (value, onSave){
 var imgs = [
    "/images/sidebar-graphic-360.jpg",
    "/images/header-graphic-960.jpg",
    "/images/feature-graphic-575.jpg",
    "/images/scooby.png",
    "/images/yogi.jpg"
  ]

  var modal = that.showModal($b(".mktImagePicker", [ 
    $b(".mktTitle", "Select an image..."),
    $b(".mktImageList", [$.map(imgs, function (val){
        return $b(".mktImgBox", 
            $b("img", {src:val}).click(function (){
              var newImg = $b(".mktElem.mktImage", $b("img.mktImageFull", {src:val}));
              createDraggable(newImg, {
                "draggableClass":"mktDraggable",
                handle:".mktHandle"}
              );
              onSave(newImg);
              modal.hide();
            })
          );
        }
      ),
      $b(".mktClear")
    ]),
    $b(".mktButtonRow", [
      $b("button[type=button]", "Close").click(function (){
          modal.hide();
      })
    ])
  ])); 
}

var showRichTextModal = function (value, onSave){
  var modal = that.showModal($b(".mktHTMLEditor", [
  $b(".mktTitle", "Edit HTML..."), 
  $b("textarea.mceEdit", {rows:10, cols:60}).val(value),
  $b(".mktButtonRow", [
      $b("button[type=button]", "Save").click(function (){
        var newHTML = $b(".mktElem.mktRichText", [
          $b.html(tinyMCE.activeEditor.getContent({format:'raw'}))
        ]);
        tinyMCE.activeEditor.remove();
        onSave(newHTML);
        modal.hide();
       }),
      $b("button[type=button]", "Cancel").click(function (){
        modal.hide();
        tinyMCE.activeEditor.remove();
      })
    ])
  ]))
  tinymce.init({selector:"textarea.mceEdit"});
};

var newGroup = function (elem){
  var box = $b(".mktBox.mktElem");
  var opts = elem.data('dnd-opts');
  removeDraggable(elem);
  elem.replaceWith(box);
  box.append(filterEditorStuff(elem));
  createDraggable(box, opts);
  expandGroup(box);
}

var expandGroup = function (elem){
  var next = elem.next();
  if(next.length){
    elem.append(next);
    removeDraggable(next);
    saveEditorChanges();
  }
}

var removeDraggable = function (elem){
  dnd.makeNonDraggable(elem);
  filterEditorStuff(elem);
}

var createDraggable = function (dragElem, opts){
  if(dragElem.data("dnd-draggable")){
    return;
  }
  if(dragElem.is(".mktRichText")){
    dragElem.prepend($b(".mktEdit", [
      $b(".mktHandle"),
      $b(".mktEditBtn", "Edit").click(function (){
        showRichTextModal(filterEditorStuff(dragElem).html(), function (newHTML){
          dragElem.replaceWith(newHTML);
          createDraggable(newHTML, opts);
          saveEditorChanges();
        });
      }),
      $b(".mktEditBtn", "Group").click(function (){
        newGroup(dragElem);
        saveEditorChanges();
      })
    ]))
  }else if(dragElem.is(".mktImage")){
    dragElem.prepend($b(".mktEdit", [
      $b(".mktHandle"),
      $b(".mktEditBtn", "Edit").click(function (){
        showImageModal(filterEditorStuff(dragElem).html(), function (newHTML){
          dragElem.replaceWith(newHTML);
          createDraggable(newHTML, opts);
          saveEditorChanges();
        })
      }),
      $b(".mktEditBtn", "Group").click(function (){
        newGroup(dragElem);
        saveEditorChanges();
      })
    ]))
  }else if (dragElem.is(".mktBox")){
    dragElem.prepend($b(".mktEdit", [
      $b(".mktHandle"), 
      $b(".mktEditBtn", "Ungroup").click(function(){
        var e = filterEditorStuff(dragElem);
        $(e.children().get().reverse()).each(function(){
          var child = $(this);
          dragElem.after(child);
          createDraggable(child, opts);
        });
        removeDraggable(dragElem);
        dragElem.remove();
        saveEditorChanges();
      }),
      $b(".mktEditBtn", "Grow").click(function (){
        expandGroup(dragElem);
      })
    ]))
  }
  dnd.makeDraggable(dragElem, opts)
};

var wireFrameSwitcher = function (){
  var btns = $(".frameSwitcher .frameBtn");
  btns.each(function (i, e){
    e = $(e);
    e.click(function (){
      btns.removeClass("selected");
      e.addClass("selected");
      var frames = $("#framesbox .framewrap");
      frames.removeClass("selected");
      var f = frames.eq(i);
      f.addClass("selected");
    })
  });
}

var initDropTargets = function (){
  $("#editorFrame iframe").get(0).onload = function (){
      $("#editorFrame iframe").contents().find(".mktDropTarget").each(function (){
      dnd.makeSortable($(this), {
        "placeholder":"div.mktPlaceholder", 
        "handle":".mktHandle",
        "draggableClass":"mktDraggable",
        onDraggableCreate:createDraggable, 
        onChange:saveEditorChanges
      });
    });
  };
}

that.start = function (){
  var imageAddElem, htmlAddElem;
  var elem = $b(".mktEditor", [
    $b(".mktDragWrap",[
      imageAddElem = $b(".mktDrag.mktImageAdd", "Image"),
      "Image"
    ]),
    $b(".mktDragWrap", [
      htmlAddElem = $b(".mktDrag.mktHtmlAdd", "HTML Block"),
      "HTML Block"
    ])
  ]);

  wireFrameSwitcher();
  initDropTargets();

  $("#editor").append(elem);

  createDraggable(htmlAddElem, {
    "draggableClass":"mktDraggable",
    onDrop:function (elem, placeholder, onComplete){
      showRichTextModal("", function (newHTML){
        placeholder.replaceWith(newHTML);
        createDraggable(newHTML, {
          handle:".mktHandle",        
          "draggableClass":"mktDraggable"
        });
        onComplete();
        elem.show();
        saveEditorChanges();
      })
    }
  });

  createDraggable(imageAddElem, {
    "draggableClass":"mktDraggable",
    onDrop:function (elem, placeholder, onComplete){
      showImageModal("", function (newImg){
        placeholder.replaceWith(newImg);
        onComplete();
        elem.show();
        saveEditorChanges();
      });    
    }
  });
}

module.exports = that;