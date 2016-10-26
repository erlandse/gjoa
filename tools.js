function addOption(elSel,text,value){
  var elOptNew = document.createElement('option');
  elOptNew.text = text;
  elOptNew.value = value;
  try {
    elSel.options.add(elOptNew, null); // standards compliant; doesn't work in IE
  }
  catch(ex) {
    elSel.options.add(elOptNew); // IE only
  }
}

function removeOptionSelected(selectId)
{
  var elSel = document.getElementById(selectId);
  var i;
  for (i = elSel.length - 1; i>=0; i--) {
    if (elSel.options[i].selected) {
      elSel.remove(i);
    }
  }
}

function removeAllOptions(selectId){
 var elSel = document.getElementById(selectId);
 while(elSel.length > 0)
      elSel.remove(elSel.length-1);
}

function selectAllOptions(selectId){
 var sel = document.getElementById(selectId);
 for(var temp = 0; temp < sel.length;temp++)
    sel.options[temp].selected = true;
}





//------------------------------------help functions--------------------------------------------------
function jsonValue(key){
  return key == undefined? "":key;
}


/*
 * Extract the url argument value bound to name - copied from somewhere
 */
function gup( name )
{
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( window.location.href );
  if( results == null )
    return "";
  else
    return results[1];
}

function addKeyValue(key,value){
 var res = "\""+key+"\":"+JSON.stringify(value);
 return res;
}

function insertLanguage(langob){
  var l = document.getElementsByTagName("input");
  var temp;
  for(temp = 0;temp < l.length;temp++){
    if(l[temp].type=='button'){
      l[temp].value = eval("langob."+l[temp].id);
    }  
  }    
  l = document.getElementsByTagName("span");
  for(temp = 0;temp < l.length;temp++)
      l[temp].innerHTML = eval("langob."+l[temp].id);
  l = document.getElementsByTagName("select");
  for(temp =0;temp < l.length;temp++){
    var key = l[temp].id+"_";
    for(var i = 0; i <l[temp].length;i++){
      if(eval("langob."+key+l[temp].options[i].value)!=null)
        l[temp].options[i].text = eval("langob."+key+l[temp].options[i].value);
    }
  }
}


function getLanguageString(id){
//skal skrives om
  var lang = norLanguage;
  return eval("lang."+id);
}

function setLanguage(){
   insertLanguage(eval("norLanguage"));
}


String.prototype.format = function (args) {
			var str = this;
			return str.replace(String.prototype.format.regex, function(item) {
				var intVal = parseInt(item.substring(1, item.length - 1));
				var replace;
				if (intVal >= 0) {
					replace = args[intVal];
				} else if (intVal === -1) {
					replace = "{";
				} else if (intVal === -2) {
					replace = "}";
				} else {
					replace = "";
				}
				return replace;
			});
		};
String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");		

//------------------------------------------------

//cookie stuff

function createCookie(name,value,days) {
	if (days) {
		var date = new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires = "; expires="+date.toGMTString();
	}
	else var expires = "";
	document.cookie = name+"="+value+expires+"; path=/";
}

function readCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
		var c = ca[i];
		while (c.charAt(0)==' ') c = c.substring(1,c.length);
		if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}
