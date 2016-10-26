<?php
header("Content-type: text/plain;charset=UTF-8");
$resturl =$_POST['resturl'];

$url ='http://itfds-prod01.uio.no/khm/GjoaCommentsRead/get.php';

echo(loadURL($url,$resturl));

function loadURL($urlToFetch,$data){
   $ch = curl_init();
   $p = ['resturl' => $data];
   curl_setopt($ch, CURLOPT_URL, $urlToFetch);
/*   curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: application/json','Content-Length: ' . strlen($p)));*/
   curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
   curl_setopt($ch, CURLOPT_POSTFIELDS,$p);
   curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
   $output  = curl_exec($ch);
   curl_close($ch);
   return $output;
}

?>