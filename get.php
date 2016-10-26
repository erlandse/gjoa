<?php
header("Content-type: text/plain;charset=UTF-8");
$resturl = $_POST['resturl'];
$url ='localhost:9200/gjoatools/gjoacomments/'.$resturl;

echo(loadURL($url));

function loadURL($urlToFetch){

	        $ch = curl_init($urlToFetch);
	        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	        $output = curl_exec($ch);
	        curl_close($ch);
	        return $output;

}

?>