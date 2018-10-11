<?php

if (isset($_POST['Submit'])) {
    $name = $_POST['name'];
    $mailFrom = $_POST['mail'];
    $message = $_POST['message'];

if(!filter_var($mailFrom, FILTER_VALIDATE_EMAIL)){
    header("Location: index.html?invalidemail");

}
    $mailTo = "iwanas10@yahoo.com";
    $headers = "From: " . $mailFrom;
    $txt = "Jųs gavote el.paštą iš" . $name . ".\n\n" . $message;
    mail($mailTo, $txt, $headers);
    header("Location: index.html?mailsend");
}





