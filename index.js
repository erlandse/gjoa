var solr;
var docCount =0;
var curPos = 0;
var loopRunning = false;
var loopIndex=-1;
var tickingIndex = -1;
var startTime = 0;
var spanTime=4;
var firstId =0;
var checkboxIndex=0;
var checkboxArray = null;
var wheelInstance = null;
var chosenLanguage="iku";
var languageChosen=-1;

function initializeEtnoKig(){
  $(document).ready(function(){

  });
  if(localStorage.getItem("gjoalanguage") == null){
    document.getElementById('languageSelect').value = chosenLanguage;
  }else { 
    document.getElementById('languageSelect').value = localStorage.getItem("gjoalanguage");
    chosenLanguage = document.getElementById('languageSelect').value;
  }  
  wheelInstance = new wheel('wheelInstance','wordwheel_div','ul','lookupIndex','freetext');
  wheelInstance.followObject(document.getElementById('freetext'),0,24);
  var p = sessionStorage.getItem("bigpicture");
  if(p && p !="null"){
     getSolrFields(localStorage.getItem("etno_solr"));
     curPos = parseInt(sessionStorage.getItem("bigpicture"));
     sessionStorage.setItem("bigpicture",null);
     move(curPos);
     return;
  }
  changeLanguage();
}


function getSolrFields(q){
  q = q.replace("&","");
  q = q.substring(2);
  checkboxArray = q.split("+AND+");
}

function setUpPage(){
  var q;
  wheelInstance.hideOverlay();
  q = lookUpEtno();
  localStorage.setItem("etno_solr",q);  
  localStorage.setItem("etno_cnt","0");
  $.ajax({
     url: "SolrCall_"+chosenLanguage+".php?&wt=json&sort=harFoto+desc&"+encodeURI(q), 
     type: 'get',
     error: function(XMLHttpRequest, textStatus, errorThrown){
        alert('status:' + XMLHttpRequest.status + ', status text: ' + XMLHttpRequest.statusText+ " errorthrown "+ errorThrown);
     },
     success: function(data){
            solr = new SolrJsonClass();
            solr.setMainObject(data);
            var docs = solr.getDocs();
            if(solr.getDocCount()>600){
              var i = Math.floor((Math.random()*500)+1); 
              docCount= solr.getDocCount();
              curPos=i;
              move(i);
              return;
            }
            if(solr.getDocCount()==0){
//              alert('Ingen gjenstander funnet');
              document.getElementById("freetext").placeholder = "No documents found..";
              resetSearch();
              return;
            }
            firstId=solr.getSingleFieldFromDoc((solr.getDocs())[0],"id");
            fillPage();
            getReadyForTraverse();
     },
     dataType:"json"
  });
  
}

function setUpCheckboxValues(){
 for(var temp = 0; temp < checkboxIndex;temp++){
    var ob = document.getElementById('seAndreCheckbox'+temp);
    if(ob==null)
      break;
    for(var i=0;i<checkboxArray.length;i++)
      if(ob.value==checkboxArray[i])
        ob.checked=true;
 }
}



function fillPage(){
  clearTable();
  var docs = solr.getDocs();
  var doc = docs[0];
  document.getElementById("getGjenstandsType").innerHTML="";
  document.getElementById("getGjenstandsTerm").innerHTML="";
  
  if(chosenLanguage != "iku"){
      document.getElementById("typeTD").style.display = "block";
	  var arr = solr.getArrayFromDoc(doc,"gjenstandsterm");
	  if(arr.length > 0){
		document.getElementById("getGjenstandsType").innerHTML=arr[0];
		arr = solr.getArrayFromDoc(doc,"gjtype");
		document.getElementById("getGjenstandsTerm").innerHTML=arr[0];
	  }
  }else{
      document.getElementById("typeTD").style.display = "none";
	  var arr = solr.getArrayFromDoc(doc,"gjenstandemisk");
	  var str  = "";
	  for(var temp =0; temp < arr.length;temp++){
	    if(arr[temp].charCodeAt(0) > 4000){
	      str += str == ""?arr[temp] : "<br>"+arr[temp];
	    }
	      
	  }  
      document.getElementById("getGjenstandsType").innerHTML=str;
    
  }
//  insertContentInTable(getRestTranslation("descriptionLabel"),solr.getSingleFieldFromDoc(doc,"gjenstandsbeskrivelse"),"label_result");
  insertDescriptionInTable(getRestTranslation("descriptionLabel"),solr.getSingleFieldFromDoc(doc,"gjenstandsbeskrivelse"),"label_result");
  
  
  if(chosenLanguage == "nor")
    insertContentInTable(getRestTranslation("moreInformationLabel"),getKatalogTekstFromDoc(doc),"label_result");


//  insertContentInTable(getRestTranslation("materialsLabel"),getMaterialeFromDoc(doc),"label_result");


  insertContentInTable(getRestTranslation("museumNumber"),solr.getSingleFieldFromDoc(doc,"museumsnr"),"label_result");

  getComments(solr.getSingleFieldFromDoc(doc,"museumsnr"));


  document.getElementById("getPhoto").innerHTML= getPhotoFromDoc(doc);


  var nett = getInternetExplorerVersion();

  if(nett == -1 || nett > 8)
    document.getElementById("getFotograf").innerHTML= "<span style='font-size: 0.7em;'>"+getRestTranslation("photoLabel")+": " +solr.getSingleFieldFromDoc(doc,"fotograf") + '<br/><a rel="license" href="http://creativecommons.org/licenses/by-sa/4.0/deed.no"><img class="ccicon" alt="Creative Commons-lisens" style="border-width:0" hight="15" width="80" src="http://www.unimus.no/rest/css/by-sa.png" /></a></span>';
  else
    document.getElementById("getFotograf").innerHTML=getRestTranslation("photoLabel")+": " +solr.getSingleFieldFromDoc(doc,"fotograf");

  fillRightTable(doc);
  setUpCheckboxValues();
 
}


function getPhp(formData,callBack){
  $.ajax({
     url: "postRemote.php", 
     type: 'post',
     data:formData,
     error: function(XMLHttpRequest, textStatus, errorThrown){
        alert('status:' + XMLHttpRequest.status + ', status text: ' + XMLHttpRequest.statusText+ " errorthrown "+ errorThrown);
        alert(JSON.stringify(formData,null,2));
     },
     success: function(data){
       callBack(data);
     },
     dataType:"json"
  });
}  


function getComments(museumNumber){
  formData = new Object();
  formData.resturl = "_search?sort=created:desc&q=museumNumber:\""+museumNumber + "\"";
  getPhp(formData,writeOutComments);
}

function writeOutComments(data){
  var result = "";
  var es = new ElasticSearch();
  es.setMainObject(data);
  var docs = es.getDocs();
  for(var temp = 0;temp < docs.length;temp++)
    result += es.getSingleFieldFromDoc(docs[temp],"message") + "<hr>";
  var div = document.getElementById("idGridContainer");
  if(result != ""){
    div.style.height = "850px";
    insertCommentsInTable(getRestTranslation("commentLabel"),result,"label_result");
  }else
    div.style.height = "750px";
  
  
}


function getPBHvornaarBrugtFromDoc(doc,field){
  var a = solr.getArrayFromDoc(doc,field);
  if(a.length==0)
    return "";
  var arr = a[0].split("|##|");
  if(arr[12]!="null")
    return arr[12];
  else
    return "";
}


function getPBHvordanBrugtFromDoc(doc,field){
  var a = solr.getArrayFromDoc(doc,field);
  if(a.length==0)
    return "";
  var arr = a[0].split("|##|");
  if(arr[11]!="empty")
    return arr[11];
  else
    return "";
}



function getPBBruktAvFromDoc(doc,field){
  var a = solr.getArrayFromDoc(doc,field);
  if(a.length==0)
    return "";
  var arr = a[0].split("|##|");
  if(arr[10]!="null")
    return arr[10];
  return "";  
}


function getPBStedFromDoc(doc,field){
 var result = "";
 var delimiter ="";
 var a = solr.getArrayFromDoc(doc,field);
 if(a.length==0)
   return "";
 var arr = a[0].split("|##|");
 if(arr[0]!="empty" && arr[0]!="null"){
   result +=delimiter+arr[0];
   delimiter = ", ";
 }
 if(arr[1]!="empty"&& arr[1]!="null"){
   result +=delimiter+arr[1];
   delimiter = ", ";
 }
 if(arr[2]!="empty"&& arr[2]!="null"){
   result +=delimiter+arr[2];
   delimiter = ", ";
 }
 if(arr[3]!="empty"&& arr[3]!="null"){
   result +=delimiter+arr[3];
   delimiter = ", ";
 }
 if(arr[4]!="empty"&& arr[4]!="null"){
   result +=delimiter+arr[4];
   delimiter = ", ";
 }
 if(arr[5]!="empty"&& arr[5]!="null"){
   result +=delimiter+arr[5];
   delimiter = ", ";
 }
 if(arr[6]!="empty"&& arr[6]!="null"){
   result +=delimiter+arr[6];
   delimiter = ", ";
 }
 return result;
}

function getMaterialeFromDoc(doc){
    var result = "";
    var arr = solr.getArrayFromDoc(doc,"materiale");
    for(var temp=0;temp< arr.length;temp++){
      var matArr = arr[temp].split("§");
      result+= matArr[matArr.length-1];
      if(temp < arr.length-1)
        result +="<br>";

    }
    return result;
}    

function getBruksopplysninger(doc){
 var arr = solr.getArrayFromDoc(doc,"bruksOpplysninger");
}

function getLokalMaterialeFromDoc(doc){
  var arr = solr.getArrayFromDoc(doc,"matremisk");
  var delimiter="";
  var result="";
  for(var temp=0;temp<arr.length;temp++){
     result += delimiter+arr[temp];
     delimiter = ", ";
  }
  return result;
}


function getKatalogTekstFromDoc(doc){
    var kat = solr.getSingleFieldFromDoc(doc,"museumsnr");
    kat = kat.substr(1);
    var nett = getInternetExplorerVersion();
    var result ="";
    if(nett == -1 || nett > 8)
      result = "<a href='#' onclick='getKatalogTekst(\""+kat+"\")';return false;>"+getRestTranslation("catalogueLabel")+"</a>";
    else
      result="<a href='"+kat+"'>"+getRestTranslation("catalogueLabel")+"</a>";
    return result;
}

function getKatalogTekst(museumsnr){
   sessionStorage.setItem("bigpicture",curPos);
   window.open("moreinfo.php?mnr="+museumsnr,"_self");
}

function getLargePicture(foto_id){
  sessionStorage.setItem("bigpicture",curPos);
  window.open("http://www.unimus.no/felles/bilder/web_hent_bilde.php?id="+foto_id+"&type=jpeg&","_self");
//   window.open("http://www.unimus.no/etnografi/khm/samling/moreinfo.php?mnr="+museumsnr,"_self");

}

function getPhotoFromDoc(doc){
  var foto_id = solr.getSingleFieldFromDoc(doc,"mediaId");
  var img;
  var img1;
//  img1 = "<a href=\"http://www.musit.uio.no/webtjenester/bilder/web_hent_bilde.php?id="+foto_id+"&type=jpeg\">";
  img1 = "<a href='#' onclick='getLargePicture("+foto_id+")';return false;>";
  img = "<img class='imgDetalj' id='detalje'  src=\"http://www.unimus.no/felles/bilder/web_hent_bilde.php?id="+foto_id+"&type=small\"/>";
  img1 = img1 + img+"</a>";
  var nett = getInternetExplorerVersion();
  var divstart ="<div style='height:250px'>";
  if(nett == -1 || nett > 8)
    return divstart+img1+"</div>";
  else
    return divstart+img+"</div";
}

function getLokalGjenstandsbetegnelseFromDoc(doc){
  var arr = solr.getArrayFromDoc(doc,"gjtype");
  if(arr.length == 0)
    return"";
   return arr[0];
}

//getSammeMateriale
function getRemote(remote_url) {
    return $.ajax({
        type: "GET",
        url: remote_url,
        async: false,
    }).responseText;
}

function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function getSammeMaterialeFromDoc(doc){
  var result = "";
  var arr = solr.getArrayFromDoc(doc,"materiale");
  for(var temp = 0; temp < arr.length;temp++){
     if(arr[temp] == "")
       continue;
     var matArr = arr[temp].split("§");
     var mat=matArr[matArr.length-1];
     var q= "wt=json&q=materiale:"+encodeURI(arr[temp]);

     var returnString= getRemote("SolrCall_"+chosenLanguage+".php?"+q);
     var sol = new SolrJsonClass();
     sol.setMainObject(JSON.parse(returnString));
     var url="<a href='detaljvisning.html?remoteField=materiale&content="+arr[temp]+"&'>"+mat+"&nbsp;("+sol.getDocCount()+")</a>";
     var checkbox = "<input type='checkbox' onchange='setUpPage()'  id='seAndreCheckbox"+checkboxIndex+"' value='materiale:\""+arr[temp]+"\"'/>&nbsp;"+mat+"&nbsp;("+sol.getDocCount()+")";
     checkboxIndex++;
//     result += url;
     result += checkbox;

     if(temp < arr.length-1)
       result += "<br><br>";
  }
  return result;
}

function getSammeGjenstandstypeFromDoc(doc){
  var arr = solr.getArrayFromDoc(doc,"gjtype");
  if(arr.length == 0)
    return "";
  var q= "wt=json&q=gjtype:"+encodeURI(arr[0]);
  var returnString= getRemote("SolrCall_"+chosenLanguage+".php?"+q);
  var sol = new SolrJsonClass();
  sol.setMainObject(JSON.parse(returnString));
  var checkbox = "<input type='checkbox' onchange='setUpPage()' id='seAndreCheckbox"+checkboxIndex+"' value='gjtype:\""+arr[0]+"\"'/>&nbsp;"+arr[0]+"&nbsp;("+sol.getDocCount()+")";
  checkboxIndex++;
  result= checkbox+"<br><br>";
  return result;
}


function getInternetExplorerVersion()
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
{
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

function getReadyForTraverse(){
  var q = localStorage.getItem("etno_solr");
  var cnt =localStorage.getItem("etno_cnt");
  if(q==null)
    return;
  var i = parseInt(cnt);
  q=encodeURI(q)+"rows="+i+"&wt=json&sort=harFoto+desc&";
  var returnString= getRemote("SolrCall_"+chosenLanguage+".php?"+q);
  var sol = new SolrJsonClass();
  sol.setMainObject(JSON.parse(returnString));
  docCount = sol.getDocCount();
  var docs = sol.getDocs();
  for(var temp = 0; temp < docs.length;temp++){
     id = sol.getSingleFieldFromDoc(docs[temp],"id");
     if(id==firstId)
       break;
  }
   curPos= temp;     
   document.getElementById("bla").innerHTML = nextAndPreviousButtons();
}


function isNextPage(){
  if(curPos<(docCount-1))
    return true;
  else
    return false;
}

function isPrevPage(){
  if(curPos>0)
    return true;
  else
    return false;
}


function nextAndPreviousButtons(){
  var form2 = "";
   var countString = "<td>"+ (curPos+1)+" "+getRestTranslation("ofLabel")+" "+ docCount+"</td>"
  form2 = "<form method='get' name='moveForm' accept-charset='UTF-8'>";
  form2 +=  "<table width='100%' border='0' cellpadding='2' cellspacing='2'>";
  form2 += "<tr><td colspan='1' style='text-align:center; height: 40px'>";
  if(loopRunning == true){
     form2 += "<input type='button' class='se_bilder_knapp' id='autobutton' value='"+getRestTranslation("stopLabel")+"'";
     form2 += " onclick='dropInterval()'/><div id='tickingDiv'></div></td>"+countString;
     form2 +="</tr></table></form>";
     return form2;
  }
  if(isNextPage()||isPrevPage()){
  
     form2 += "<input type='button' class='se_bilder_knapp' id='autobutton' value='"+getRestTranslation("exploreLabel")+"' ";
     form2 += " onclick='setUpInterval()'/> ";
     
     if(isPrevPage()){
      form2 += "<input type='button' class='forrige_neste' value='"+getRestTranslation("previousLabel")+"' ";
      form2 += " onclick='move("+(curPos-1)+")'/> ";
     }
     if(isNextPage()){
       form2 += "<input type='button' class='forrige_neste' value='"+getRestTranslation("nextLabel")+"' ";
       form2 += " onclick='move("+(curPos+1)+")'/>";
     }
     form2 +="</td>";
  }

  form2 +=countString+"</tr><tr><td colspan='2' style='text-align:center;font-size: 0.9em;'>"+getRestTranslation("commentsLabel")+" <a href='mailto:roald-amundsen@khm.uio.no'>roald-amundsen@khm.uio.no</a></td></tr></table></form>";
  return form2;
}


function setTickingTime(){
  if(startDate==0)
    return;
  var div = document.getElementById('tickingDiv');
  if(div==null)
    return;
  var currentSecond = Math.round(new Date().getTime() / 1000);
  div.innerHTML = (spanTime-(currentSecond-startDate))+ " seconds";
}

function setUpInterval(){
  driveAnimation();
  startTime = 0;
  tickingIndex = setInterval("setTickingTime()",1000);
  loopIndex = setInterval("driveAnimation()",1000*spanTime);
  loopRunning= true;
  document.getElementById("bla").innerHTML = nextAndPreviousButtons();
  document.getElementById("info").style.visibility="collapse";
  document.getElementById("se_andre").style.visibility="collapse";
}

function dropInterval(){
  clearInterval(tickingIndex);
  clearInterval(loopIndex);
  loopIndex=-1;
  loopRunning=false;
  document.getElementById("info").style.visibility="visible";
  document.getElementById("se_andre").style.visibility="visible";
  move(curPos);
}


function driveAnimation(){
  startDate=Math.round(new Date().getTime() / 1000);
  index = curPos+1;
  if(index >=docCount)
    index=0;
  move(index);  
}

function move(index){
  sessionStorage.setItem("bigpicture",null);
  var q = localStorage.getItem("etno_solr");
  q=encodeURI(q)+"rows=1&wt=json&sort=harFoto+desc&start="+index;
  var returnString= getRemote("SolrCall_"+chosenLanguage+".php?"+q);
  solr = new SolrJsonClass();
  solr.setMainObject(JSON.parse(returnString));
  var docs = solr.getDocs();
  docCount= solr.getDocCount();
  curPos=index;
  if(solr.getSingleFieldFromDoc(docs[0],"harFoto")==false && loopRunning== true && index >0){
     move(0);
     return;
  }
  fillPage();
  document.getElementById("bla").innerHTML = nextAndPreviousButtons();
}

function insertContentInTable(label,content,label_result){
 if(content =="")
    return;
  var table= document.getElementById('tablebody');
  var row=table.insertRow(-1);
  var cell1=row.insertCell(0);
  cell1.setAttribute("class", "label"); //For Most Browsers
  cell1.setAttribute("className", "label");
  cell1.innerHTML =label;
  var row2=table.insertRow(-1);
  var cell2=row2.insertCell(0);
  cell2.setAttribute("class", label_result); //For Most Browsers
  cell2.setAttribute("className", label_result);
  cell2.innerHTML=content;
  var row3=table.insertRow(-1);
  var cell3=row3.insertCell(0);
  cell3.innerHTML="<td>&nbsp;</td>";
}

function insertDescriptionInTable(label,content,label_result){
 if(content =="")
    return;
  var table= document.getElementById('tablebody');
  var row=table.insertRow(-1);
  var cell1=row.insertCell(0);
  cell1.setAttribute("class", "label"); //For Most Browsers
  cell1.setAttribute("className", "label");
  cell1.innerHTML =label;
  var row2=table.insertRow(-1);
  var cell2=row2.insertCell(0);
  cell2.innerHTML="<div id='descriptionDiv' style='font-size:80%;height:100px;overflow:auto'>"+content+"</div>";
  var row3=table.insertRow(-1);
  var cell3=row3.insertCell(0);
  cell3.innerHTML="<td>&nbsp;</td>";
}

function insertCommentsInTable(label,content,label_result){
 if(content =="")
    return;
  var table= document.getElementById('tablebody');
  var row=table.insertRow(-1);
  var cell1=row.insertCell(0);
  cell1.setAttribute("class", "label"); //For Most Browsers
  cell1.setAttribute("className", "label");
  cell1.innerHTML =label;
  var row2=table.insertRow(-1);
  var cell2=row2.insertCell(0);
  cell2.innerHTML="<div id='commentDiv' style='font-size:80%;height:100px;overflow:auto;background-color:#EEEEEE;'>"+content+"</div>";
  var row3=table.insertRow(-1);
  var cell3=row3.insertCell(0);
  cell3.innerHTML="<td>&nbsp;</td>";
}



function clearTable(){
  var table= document.getElementById('tablebody');
  while(table.rows.length >5)
    table.deleteRow(table.rows.length-1);
  checkboxIndex=1;  
}

function insertContentInRightTable(label,content,label_result){
 if(content =="")
    return;
  var table= document.getElementById('result');
  var row=table.insertRow(-1);
  var cell1=row.insertCell(0);
  cell1.setAttribute("class", "label"); //For Most Browsers
  cell1.setAttribute("className", "label");
  cell1.innerHTML =label;
  var row2=table.insertRow(-1);
  var cell2=row2.insertCell(0);
  cell2.setAttribute("class", label_result); //For Most Browsers
  cell2.setAttribute("className", label_result);
  cell2.innerHTML=content;
  var row3=table.insertRow(-1);
  var cell3=row3.insertCell(0);
  cell3.innerHTML="<td>&nbsp;</td>";
}


function getSameMultiFieldFromDoc(doc,field){
  var result = "";
  var arr = solr.getArrayFromDoc(doc,field);
  for(var temp = 0; temp < arr.length;temp++){
     var  enc = arr[temp];
     enc = encodeURI(enc);
     var q= "wt=json&q="+field+":"+enc;
     var returnString= getRemote("SolrCall_"+chosenLanguage+".php?"+q);
     var sol = new SolrJsonClass();
     sol.setMainObject(JSON.parse(returnString));
     var url="<a href='detaljvisning.html?remoteField="+field+"&content="+arr[temp]+"&'>"+arr[temp]+"&nbsp;("+sol.getDocCount()+")</a>";
     var checkbox = "<input type='checkbox' id='seAndreCheckbox"+checkboxIndex+"' value='"+field+":\""+arr[temp]+"\"'/>&nbsp;"+arr[temp]+"&nbsp;("+sol.getDocCount()+")";
     checkboxIndex++;
     result += checkbox;
     if(temp < arr.length-1)
       result += "<br><br>";
  }
  return result;
}



function fillRightTable(doc){
  var table= document.getElementById('result');
  while(table.rows.length >0)
    table.deleteRow(table.rows.length-1);
  checkboxIndex=0;  
  
  var nett = getInternetExplorerVersion();
  if(nett == -1 || nett > 8)
    insertContentInRightTable(getRestTranslation("relatedLabel"),getSammeGjenstandstypeFromDoc(doc),"label_result");
  insertContentInRightTable(getRestTranslation("fromSameMaterialLabel"),getSammeMaterialeFromDoc(doc),"label_result");


}


function getInternetExplorerVersion()
// Returns the version of Internet Explorer or a -1
// (indicating the use of another browser).
{
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer')
  {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

function lookUpEtno(){
 var result = "";
 var delimiter = "+AND+";
 var searchString = document.getElementById('freetext').value;
 checkboxArray = new Array();
 if(searchString !=""){
   var ar = searchString.split(" ");
   for(var i =0; i < ar.length;i++){
     if(ar[i]=="")
       continue;
     if(result == "")  
      result += "text:\""+ar[i]+"\"";
     else
       result += "+AND+text:\""+ar[i]+"\"";
    }   
 } 
 for(var temp = 0; temp < checkboxIndex;temp++){
    var ob = document.getElementById('seAndreCheckbox'+temp);
    if(ob==null)
      break;
    if(ob.checked){
      if(result != "")
        result +=  delimiter + ob.value;
      else
        result = ob.value;   
      checkboxArray.push(ob.value);
    }
 }
 if(result =="")
   result="q=*:*&";
 else
   result = "q="+result+"&";
 return result;
}

/*
Not only - also words except the last one - used for wthe wordwheel
*/

function onlyCheckboxes(){
 var result = "";
 var delimiter = "+AND+";
 var str =  document.getElementById('freetext').value.toLowerCase();
 var ar = str.split(" ");
 var words = new Array();
 for(var temp =0;temp <ar.length;temp++){
   if(ar[temp]!="")
     words.push(ar[temp]);
 }
 for(var temp=0;temp < words.length-1;temp++){
       result += "text:\""+words[temp]+"\"";
 }
 for(var temp = 0; temp < checkboxIndex;temp++){
    var ob = document.getElementById('seAndreCheckbox'+temp);
    if(ob==null)
      break;
    if(ob.checked){
      if(result != "")
        result +=  delimiter + ob.value;
      else
        result = ob.value;   
      checkboxArray.push(ob.value);
    }
 }
 if(result =="")
   result="q=*:*&";
 else
   result = "q="+result+"&";
 return result;
}


function reset(){
 for(var temp = 0; temp < checkboxIndex;temp++){
    var ob = document.getElementById('seAndreCheckbox'+temp);
    if(ob==null)
      break;
    ob.checked=false;  
 }
 document.getElementById('freetext').value ="";
}

function resetSearch(){
 reset();
 setUpPage();
}

function changeWordwheel(event){
  if(event.keyCode == 13){
    setUpPage();
    return;
  }
 if(wheelInstance.handleWheel(event) == true)
   return;
 var str =  document.getElementById('freetext').value.toLowerCase();
 if (str.length > 0){
    var ar = str.split(" ");
    var temp= ar.length-1;
    while(ar[temp]=="")
      temp--;
//    facet="wt=json&rows=0&facet=true&facet.field=text&facet.field=facetMateriale&facet.field=facetNasjon&facet.field=facetFolkegruppe&facet.limit=20&facet.sort=false&facet.mincount=1&facet.prefix="+ar[temp]+"&";
    facet="wt=json&rows=0&facet=true&facet.field=text&facet.limit=20&facet.sort=false&facet.mincount=1&facet.prefix="+ar[temp]+"&";

    var query = onlyCheckboxes();
    query += facet;
    $.ajax({
		 url: "SolrCall_"+chosenLanguage+".php?"+query, 
		 type: 'get',
		 error: function(XMLHttpRequest, textStatus, errorThrown){
			alert('status:' + XMLHttpRequest.status + ', status text: ' + XMLHttpRequest.statusText+ " errorthrown "+ errorThrown);
		 },
		 success: function(data){
				var sol = new SolrJsonClass();
				sol.setMainObject(data);
				var ar=sol.getFacetFieldWithFacetName("text");
				wheelInstance.fillFacets(ar);
		 },
		 dataType:"json"
	});  
 }else{
    wheelInstance.clearUl();
    wheelInstance.hideOverlay();
 }
}

function lookupIndex(string){
  start=0;
  document.getElementById('freetext').value= wheelInstance.replaceLastWord(document.getElementById('freetext').value,string);
  wheelInstance.hideOverlay();
  setUpPage();
}

function resize() {
  if(wheelInstance != null)
    wheelInstance.followObject(document.getElementById('freetext'),0,24);
}

function setUpLanguage(){
 for (var temp = 0; temp < translationSpans.length;temp++)
   document.getElementById(translationSpans[temp].spanId).innerHTML = eval("translationSpans[temp]."+chosenLanguage);
 document.title = getRestTranslation("windowTitle");  
 document.getElementById("searchButton").value = getRestTranslation("searchButton");  
 document.getElementById("resetButton").value = getRestTranslation("resetButton");  

}

function getRestTranslation(name){
  for(var temp =0;temp < otherTranslations.length; temp++){
    if(otherTranslations[temp].id == name)
      return eval("otherTranslations[temp]."+chosenLanguage);
  }
  return ("MISSING TRANSLATION");
}


function changeLanguage(){
  if(document.getElementById('languageSelect').value != chosenLanguage){
    chosenLanguage = document.getElementById('languageSelect').value;
    localStorage.setItem("gjoalanguage",document.getElementById('languageSelect').value);
    reset();
    findSameId(solr.getSingleFieldFromDoc((solr.getDocs())[0],"id"));
    return;
  }  
  chosenLanguage = document.getElementById('languageSelect').value;
  setUpLanguage();
  setUpPage();
  document.getElementById("bla").innerHTML = nextAndPreviousButtons();
}

function findSameId(id){
  localStorage.setItem("etno_solr","q=*:*&");
  setUpLanguage();
  $.ajax({
     url: "SolrCall_"+chosenLanguage+".php?&wt=json&rows=1000&sort=harFoto+desc&"+"q=*:*&", 
     type: 'get',
     error: function(XMLHttpRequest, textStatus, errorThrown){
        alert('status:' + XMLHttpRequest.status + ', status text: ' + XMLHttpRequest.statusText+ " errorthrown "+ errorThrown);
     },
     success: function(data){
            var sol = new SolrJsonClass();
            sol.setMainObject(data);
            var docs = sol.getDocs();
            for(var temp =0; temp < sol.getDocCount();temp++)
              if(sol.getSingleFieldFromDoc(docs[temp],"id")==id){
                break;
            }    
            move(temp);
     },
     dataType:"json"
  });
}
