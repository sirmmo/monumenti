const Identity = require("ti.identity");
const Dialog = require('ti.webdialog');

// Arguments passed into this controller can be accessed via the `$.args` object directly or:
var args = $.args;

// Mostra bottone indietro
if (OS_ANDROID) {
    $.index.activity.onCreateOptionsMenu = function(e) { 
            var menu = e.menu; 
            var menuItem = menu.add({ 
                title: "Back", 
                icon: "images/back.png", 
                showAsAction: Ti.Android.SHOW_AS_ACTION_ALWAYS
            }); 
            menuItem.addEventListener("click", function(e) { 
                $.index.close();
            }); 
        };
}

function reload(e){
    $.activityIndicator.show();

    if ($.optionbar.index == 0) {
        var order = "date";
    } else {
        var order = "title";
    }

    const UUID = Titanium.Platform.id; // identificativo univoco del device
    var keychainItem = Identity.createKeychainItem({ identifier: "token" });
    keychainItem.addEventListener("read", function(k){
        if (k.success == true) {
            var url = Alloy.Globals.backend + "/photolist.json?uuid=" + UUID + "&token=" + k.value + "&order=" + order;
            var client = Ti.Network.createHTTPClient({
                onload: function(e) {
                    var photos = JSON.parse(this.responseText);
                    
                    items = [];

                    photos.forEach(function(photo) {
                        var serverurl = photo["serverurl"];
                        if (photo["uploaded"] == false) {
                            if (photo["errorinfo"] == null || photo["errorinfo"] == undefined) {
                                var errortext = L("photo_not_uploaded");
                            } else {
                                var errortext = String.format(L("photo_not_uploaded_with_reason"), photo["errorinfo"]);
                            }
                            itemdata =  { 
                                photo: {
                                    image: serverurl
                                },
                                errorlabel: {
                                    text: errortext
                                },
                                showButton: {
                                    id: photo["item"]
                                },
                                template: "error",
                            }    
                        } else if (photo["uploaded"] == null) {
                            itemdata =  { 
                                photo: {
                                    image: serverurl
                                },
                                showButton: {
                                    id: photo["item"]
                                },
                                template: "waiting",
                            }
                        } else if (photo["uploaded"] == true) {
                            itemdata =  { 
                                photo: {
                                    image: photo["url"],
                                    id: photo["descriptionurl"]
                                },
                                title: {
                                    text: photo["canonicaltitle"],
                                    id: photo["descriptionurl"]
                                },
                                showButton: {
                                    id: photo["item"]
                                },
                                template: "success",
                            }
                        }

                        items.push(itemdata);
                    });
                    
                    $.imagespace.setItems(items);
                    $.activityIndicator.hide();
                    $.activityIndicator.height = 0;
                },
                onerror: function(e) {
                    var alert = Ti.UI.createAlertDialog({message:String.format(L("generic_error"), e.error), okid: "ok"});
                    alert.addEventListener("click", function(e){
                        $.index.close();
                    });
                    alert.show();
                },
                timeout: 5000
            });
            client.open("GET", url);
            client.send();
        } else {
            var alert = Ti.UI.createAlertDialog({message:String.format(L("generic_error"), k.error), buttonNames: [L("ok")]});
            alert.addEventListener("click", function(e){
                $.index.close();
            });
            alert.show();
        }
    });
    keychainItem.read();
}

$.index.addEventListener("open", reload);

$.optionbar.addEventListener("click", reload);

// Usata nell'index.xml (view alloy) per il click sulle foto o sul titolo delle foto
function openPhoto(e) {
    if (Dialog.isSupported()) {
        Dialog.open({
            title: e.source.text,
            url: e.source.id
        })
    } else {
        Ti.Platform.openURL(e.source.id);
    }
} 

// Usata nell'index.xml (view alloy) per il click sul bottone della scheda monumento
function openShow(e) {
    Alloy.Globals.utils.open("home/show", e.source.id);
}