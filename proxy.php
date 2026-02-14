<?php
// Genii Platform API Proxy
// Place this in /var/www/html/genii/index.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// Forward to local Python server
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8080' . $_SERVER['REQUEST_URI']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, file_get_contents('php://input'));
}

$response = curl_exec($ch);
http_response_code(curl_getinfo($ch, CURLINFO_HTTP_CODE));
echo $response;
curl_close($ch);
