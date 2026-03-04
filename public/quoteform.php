<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

$config = require 'config.php';

header('Content-Type: application/json');

// Honeypot
if (!empty($_POST['website'])) {
    echo json_encode(["status"=>"error"]);
    exit;
}

// Required validation
$required = ['gname','fname','email','phone','tourtype','tourdesti','datetime','pickuploc','noofpass', 'addinfo'];
foreach ($required as $field) {
    if (empty($_POST[$field])) {
        echo json_encode(["status"=>"error","message"=>"Missing fields"]);
        exit;
    }
}

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
    $adminMail->Subject = "JDK Online Request - {$_POST['gname']}";
    $adminMail->Body = "
        <b>Group Name:</b> {$_POST['gname']}<br>
        <b>Full Name:</b> {$_POST['fname']}<br>
        <b>Email:</b> {$_POST['email']}<br>
        <b>Phone:</b> {$_POST['phone']}<br>
        <b>Tour Type:</b> {$_POST['tourtype']}<br>
        <b>Tour Destination:</b> {$_POST['tourdesti']}<br>
        <b>Tour Date & Time:</b> {$_POST['datetime']}<br>
        <b>Pickup Location:</b> {$_POST['pickuploc']}<br>
        <b>No. Of Guests in Groups:</b> {$_POST['noofpass']}<br>
        <b>Additional Info:</b> {$_POST['addinfo']}<br>
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
    $userMail->addAddress($_POST['email'], $_POST['fname']);

    $userMail->isHTML(true);
    $userMail->Subject = "We Received Your Tour Request";
    $userMail->Body = "
        <h2>Hi {$_POST['fname']},</h2>
        <p>Thank you for your request.</p>
        <p>Our team will contact you shortly.</p>
        <br>
        <b>Tour Date:</b> {$_POST['datetime']}<br>
        <b>Destination:</b> {$_POST['tourdesti']}<br>
        <br>
        <p>Best Regards,<br>{$config['from_name']}</p>
    ";

    $userMail->send();

    echo json_encode(["status"=>"success"]);

} catch (Exception $e) {
    echo json_encode(["status"=>"error"]);
}