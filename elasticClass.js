function ElasticSearch(){
  this.numFound = 0;
  this.rootObject = null;
  
  this.setMainObject = function (root) {
    this.rootObject = root;
    this.numFound = this.getDocCount();
  }
  
  this.getDocCount = function(){
     return this.rootObject.hits.total;
  }

//return an array of key,doc_count

  this.getFacetFieldWithFacetName = function(nameOfField){
    var p = null;
    try{
      p = eval("this.rootObject.aggregations."+nameOfField+".buckets");
      return p;
    }
    catch (e){
      return new Array();
    }
  }



  this.getDocs = function(){
    try{
     var p = eval("this.rootObject.hits.hits");
     return p;
    }catch(e){
       return new Array();
    }    
  }
  
  this.getArrayFromDoc = function(doc,nameOfField){
    return eval("doc._source."+nameOfField)==null?new Array():eval("doc._source."+nameOfField);
  }
  
  this.getSingleFieldFromDoc = function(doc,nameOfField){
     return eval("doc._source."+ nameOfField)==null?"":eval("doc._source."+ nameOfField);
  }

  this.getHighlightFieldFromDoc = function(doc,nameOfField){
     return eval("doc.highlight."+ nameOfField)==null?new Array():eval("doc.highlight."+ nameOfField);
  }


}