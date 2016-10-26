<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
  <!-- iPhone viewport -->
  <meta name="viewport" content="width=1020, user-scalable=yes" />
<title>Etnografisk samling, KHM</title>
<link href="moreinfo.css" type="text/css" rel="stylesheet"/>
</head>

<body>
<!-- Page header starts -->
<div id="main-wrapper">


<!-- Page content starts -->
<div id="container">

<div id="moreinfo">

<img src="bla_stripe.jpg" width="605" height="8" />
<h4>Katalogtekst</h4>

<?php
$museumsnr = '';
$sted = 'oslo';
$museum = '';
$schema_name = '';
$enhetsnr = '';
$gjenstandstekst = '';
$ident = '';
$musname = 'Kulturhistorisk museum, etnografisk tilvekst';
$banner = '';
$forrige = 0;
$neste = 0;
$error_flag = 0;

$single_words = array();
$artefacttext = '';

if (isset($_GET['bla']))
{
	$enhetsnr = $_GET['bla'];
}

if (isset($_GET['sted']))
{
	$sted = $_GET['sted'];
	switch ($sted)
	{
    	case $sted == "oslo":
        $musname = "Kulturhistorisk museum, Oslo";
        break;
	}
}

if (isset($_GET['mnr']))
{
	$museumsnr = $_GET['mnr'];
}
else
{
	echo "No museum number found.";
	echo '</body></html>';
	exit;
}

/*include '/usit/musit-prod01/prog/phpinclude/connect.inc';*/
include '/w3-vh/no.uio.www_80/khm/gjoa/connect.inc';

$db = $MUSPROD_connect_string;
$conn = OCILogon($catalogue_user, $catalogue_user_passw, $db);
$gjenstandsskjema = 'usd_etno_hovedkat_os.gjenstander';
$enhetsskjema = 'usd_etno_hovedkat_os.enheter';

if (!$conn)
{
	$e = oci_error();
	echo htmlentities($e['message']);
	exit;
}


if (empty($enhetsnr))
{
	$query = "SELECT ident, enhetsnr FROM $gjenstandsskjema WHERE museumsnr = '$museumsnr'";

	$stid = oci_parse($conn, $query);
	if (!$stid)
	{
		$e = oci_error($conn);
		echo htmlentities($e['message']);
		exit;
	}

	$r = oci_execute($stid, OCI_DEFAULT);
	if (!$r)
	{
		$e = oci_error($stid);
		echo htmlentities($e['message']);
		exit;
	}

	while ($row = oci_fetch_array($stid, OCI_ASSOC))
	{
			$forrige = $row[ENHETSNR] - 1;
			$neste = $row[ENHETSNR] + 1;
			$enhetsnr = $row[ENHETSNR];
	}
}
else
{
	$forrige = $enhetsnr - 1;
	$neste = $enhetsnr + 1;
}

$query = "SELECT tekst FROM $enhetsskjema WHERE enhetsnr = $enhetsnr";

$stid = oci_parse($conn, $query);
if (!$stid)
{
	$e = oci_error($conn);
	echo htmlentities($e['message']);
	exit;
}

$r = oci_execute($stid, OCI_DEFAULT);
if (!$r)
{
	$e = oci_error($stid);
	$error_flag = 1;
//echo htmlentities($e['message']);
//exit;
}

$error_message = '';
$clob = '';
$catalogueXML = '';
$genXML = '';
if ($error_flag == 0)
{
	while ($row = oci_fetch_array($stid, (OCI_ASSOC+OCI_RETURN_LOBS)))
	{
		$clob = $row[TEKST];
		$clob = elementsToSpan($clob);
		$clob = spruceElements($clob);
		$clob = str_replace("</span><br/><span class=\"UNR\">","<div style='clear:both'></div></span><span class=\"UNR\">",$clob);
		$clob = $catalogue . $clob . '<br/><br/>';
		$catalogueXML = $clob;

	}
	oci_close($conn);
}
else
{
	$clob = $catalogue . '<p><b>Katalogtekst ikke tilgjengelig.</b></p>';
}

echo "<table width='615' cellpadding='6' cellspacing='0' border='0'><tr><td>$clob</td></tr></table>";

echo '</div></body></html>';


function spruceElements($text)
{
//if a span of class museumsnr,unr,funkat or fellesdata is found a newline is inserted before
   $text = preg_replace("/<span class=\"(?i:(MUSEUMSNR|UNR|fellesdata|funnkat))\">/", "<br/><span class=\"$1\">", $text);

//If a label of the following  delimited with a | is found a newline is inserted and the text is changed to italic and bold
   $pattern = "/(Referanselitteratur:|Funnomstendighet:|Kartreferanse\/-KOORDINATER:|INNBERETNING\/litteratur:|Funnet av:)/i";

	$text = preg_replace($pattern,"<br/><span class=\"bolditalic\">$1</span>",$text);

// Hack if two br follows each other with a span in between one br is removed
	$text = preg_replace("/<br\/><span class=\"(([a-z]|[A-Z])+?)\"><br\/>/","<br/><span class=\"$1\">", $text);

// Hack to avoid tekst 'fra' and 'pÃ‚' to come immediately next to tag JE
	$text = preg_replace("/>fra /", "> fra ", $text);
	$text = preg_replace("/>på‚ /", "> på‚ ", $text);

// Hack to move <br> when occuring within brackets
	$text = preg_replace("/<br\/><span class=\"MUSEUMSNR\">([0-9 .]+)\). <\/span>/", " <span class=\"MUSEUMSNR\">$1</span>).<br/> ", $text);

	$text = preg_replace("/\(<br\/><span class=\"MUSEUMSNR\">([^>]+?)<\/span>\)./", "<span class=\"MUSEUMSNR\">($1)</span>.<br/>", $text);
	$text = preg_replace("/.<br\/>\/span>./", "<br/></span>", $text);

//hack to move left parathesis from before span MUSEUMSNR to become part of the content
	$text = str_replace("(</span><br/><span class=\"MUSEUMSNR\">","</span><br/><span class=\"MUSEUMSNR\">(",$text);

// Hack to avoid <br> before the verb 'er' <br/><span class="FELLESDATA">er
	$text = preg_replace("/ <br\/><span class=\"FELLESDATA\">er /", " <span class=\"FELLESDATA\">er ", $text);

// Hack to delete unnecessary break <span class="ENTITY"><span class="NRAVSN"><br/>
	$text = preg_replace("/<span class=\"ENTITY\"><span class=\"NRAVSN\"><br\/>/", "<span class=\"ENTITY\"><span class=\"NRAVSN\">", $text);
	$text = preg_replace("/Innsk.: <br\/><span class=\"MUSEUMSNR\">/", "Innsk.: <span class=\"MUSEUMSNR\">", $text);
	$text = preg_replace("/<\/span><br\/><span class=\"MUSEUMSNR\">([^ ]+?) <\/span><\/span>/", "</span><span class=\"MUSEUMSNR\">$1 </span></span>", $text);

	$text = preg_replace("/<span class=\"MUSEUMSNR\">([0-9]+?)<\/span><span/", "<span class=\"MUSEUMSNR\">$1</span> <span", $text);

    $cnt=preg_match_all("/<span class=\"MUSEUMSNR\">([0-9]+)<\/span>/",$text,$out);


    for($i = 0; $i < $cnt; $i++){
       $pos = strpos($text,$out[0][$i]);
       $text = substr($text,0,$pos) . "<a name='".$out[1][$i]."'/>".substr($text,$pos);
    }

   return $text;

}

function elementsToSpan($xml_string){
//this is for the new xml part
	$xml_string = preg_replace("/<\/fellesdata>/", "</span><br/>", $xml_string);
//end tags are replaced with end span
	$xml_string = preg_replace("/<\/(([a-z]|[A-Z])+?)>/", "</span>", $xml_string);

	$replace = "<span class=\"$1\">";

//element names are replaced with span class=elementname this handles elements with attributes
	$xml_string = preg_replace("/<(([a-z]|[A-Z])+?) ([^>]+?)>/", $replace, $xml_string);
//element names are replaced with span class=elementname this does not handle elements with attributes
	$xml_string = preg_replace("/<(([a-z]|[A-Z])+?)>/", $replace, $xml_string);

	$xml_string = preg_replace("/&lt;/", "<", $xml_string);
	$xml_string = preg_replace("/&gt;/", ">", $xml_string);

//Leave as is
	$xml_string = preg_replace("/<OST>/", "&lt;ost&gt;", $xml_string);
	$xml_string = preg_replace("/<\/OST>/", "&lt;/ost&gt;", $xml_string);

	$xml_string = preg_replace("/<FIE>/", "&lt;fie&gt;", $xml_string);
	$xml_string = preg_replace("/<\/FIE>/", "&lt;/fie&gt;", $xml_string);

	$xml_string = preg_replace("/<ANM>/", "&lt;anm&gt;", $xml_string);
	$xml_string = preg_replace("/<\/ANM>/", "&lt;/anm&gt;", $xml_string);

	$xml_string = preg_replace("/<UKLAR>/", "&lt;uklar&gt;", $xml_string);
	$xml_string = preg_replace("/<\/UKLAR>/", "&lt;/uklar&gt;", $xml_string);

	return $xml_string;
}

?>

</div>
<!-- #moreinfo end -->

<div style="clear:both"></div>
 </div> <!-- #container end -->

   <br class="clearfloat" />


</div> <!-- end #main-wrapper-->


</body>
</html>