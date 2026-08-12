<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$config = require 'config.php';

// --- AMP CORS handling ---
// amp-form always performs this as a CORS fetch and separately checks the
// AMP-Access-Control-Allow-Source-Origin response header itself, even for a
// same-origin, self-hosted AMP page like /amp/ here — so these headers are
// required regardless of the fact that the page and this endpoint share a
// domain. See https://amp.dev/documentation/guides-and-tutorials/learn/amp-caches-and-cors/amp-cors-requests/
$allowedOrigins = ['https://jdktransportation.com'];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$sourceOrigin = $_GET['__amp_source_origin'] ?? '';

$originAllowed = in_array($origin, $allowedOrigins, true);
$sourceOriginAllowed = in_array($sourceOrigin, $allowedOrigins, true);

if ($originAllowed) {
    header("Access-Control-Allow-Origin: {$origin}");
}
if ($sourceOriginAllowed) {
    header("AMP-Access-Control-Allow-Source-Origin: {$sourceOrigin}");
}
header('Access-Control-Expose-Headers: AMP-Access-Control-Allow-Source-Origin');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json');

if (!$originAllowed || !$sourceOriginAllowed) {
    http_response_code(403);
    echo json_encode(["status"=>"error","message"=>"Origin not allowed"]);
    exit;
}

// Honeypot
if (!empty($_POST['website'])) {
    http_response_code(400);
    echo json_encode(["status"=>"error"]);
    exit;
}

// Required validation
$required = ['gname','fname','email','phone','tourtype','tourdesti','datetime','pickuploc','noofpass', 'addinfo'];
foreach ($required as $field) {
    if (empty($_POST[$field])) {
        http_response_code(400);
        echo json_encode(["status"=>"error","message"=>"Missing fields"]);
        exit;
    }
}

$gname    = htmlspecialchars($_POST['gname']);
$fname    = htmlspecialchars($_POST['fname']);
$email    = htmlspecialchars($_POST['email']);
$phone    = htmlspecialchars($_POST['phone']);
$tourtype = htmlspecialchars($_POST['tourtype']);
$tourdesti = htmlspecialchars($_POST['tourdesti']);
$datetime = htmlspecialchars($_POST['datetime']);
$pickuploc = htmlspecialchars($_POST['pickuploc']);
$noofpass = htmlspecialchars($_POST['noofpass']);
$addinfo  = htmlspecialchars($_POST['addinfo']);

try {

    // ======================
    // ADMIN MAIL
    // ======================
    $adminMail = new PHPMailer(true);
    $adminMail->isSMTP();
    $adminMail->Host       = $config['host'];
    $adminMail->SMTPAuth   = true;
    $adminMail->Username   = $config['username'];
    $adminMail->Password   = $config['password'];
    $adminMail->SMTPSecure = $config['encryption'];
    $adminMail->Port       = $config['port'];

    $adminMail->setFrom($config['from_email'], $config['from_name']);
    $adminMail->addReplyTo($email, $fname);
    $adminMail->addAddress($config['admin_email']);

    // Add CC
    if (!empty($config['cc'])) {
        foreach ($config['cc'] as $ccEmail) {
            $adminMail->addCC($ccEmail);
        }
    }

    // Add BCC
    if (!empty($config['bcc'])) {
        foreach ($config['bcc'] as $bccEmail) {
            $adminMail->addBCC($bccEmail);
        }
    }

    $adminMail->isHTML(true);
    $adminMail->Subject = "AMP JDK Trans - {$gname}";
    $adminMail->Body = "
        <table style='border-collapse: collapse; width: 100%; max-width: 600px; border: 1px solid #ddd;'>
            <tr style='background-color: #f2f2f2;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 40%;'>Group Name</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$gname}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Full Name</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$fname}</td>
            </tr>
            <tr style='background-color: #f9f9f9;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Email</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$email}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Phone</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$phone}</td>
            </tr>
            <tr style='background-color: #f9f9f9;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Tour Type</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$tourtype}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Tour Destination</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$tourdesti}</td>
            </tr>
            <tr style='background-color: #f9f9f9;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Tour Date & Time</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$datetime}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Pickup Location</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$pickuploc}</td>
            </tr>
            <tr style='background-color: #f9f9f9;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>No. Of Guests in Groups</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$noofpass}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Additional Info</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$addinfo}</td>
            </tr>
        </table>
    ";

    $adminMail->send();


    // ======================
    // CUSTOMER AUTO REPLY
    // ======================
    $userMail = new PHPMailer(true);
    $userMail->isSMTP();
    $userMail->Host       = $config['host'];
    $userMail->SMTPAuth   = true;
    $userMail->Username   = $config['username'];
    $userMail->Password   = $config['password'];
    $userMail->SMTPSecure = $config['encryption'];
    $userMail->Port       = $config['port'];

    $userMail->setFrom($config['from_email'], $config['from_name']);
    $userMail->addAddress($_POST['email'], $fname);

    $userMail->isHTML(true);
    $userMail->Subject = "We Received Your Quote Request";
    $userMail->Body = "
        <h2>Hi {$fname},</h2>
        <p>Thank you for your request.</p>
        <p>Our team will contact you shortly.</p>
        <br>
        <table style='border-collapse: collapse; width: 100%; max-width: 600px; border: 1px solid #ddd;'>
            <tr style='background-color: #f2f2f2;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 40%;'>Pickup Date</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$datetime}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Destination</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$tourdesti}</td>
            </tr>
        </table>
        <br>
        <p>Best Regards,<br>{$config['from_name']}</p>
    ";

    $userMail->send();

    echo json_encode(["status"=>"success"]);

} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(["status"=>"error"]);
}
