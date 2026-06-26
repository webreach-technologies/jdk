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
$required = ['name','email','phone','subject','message'];
foreach ($required as $field) {
    if (empty($_POST[$field])) {
        echo json_encode(["status"=>"error","message"=>"Missing fields"]);
        exit;
    }
}

$name = htmlspecialchars($_POST['name']);
$email = htmlspecialchars($_POST['email']);
$phone = htmlspecialchars($_POST['phone']);
$subject = htmlspecialchars($_POST['subject']);
$message = nl2br(htmlspecialchars($_POST['message']));

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

    if (!empty($config['cc'])) {
        foreach ($config['cc'] as $ccEmail) {
            $adminMail->addCC($ccEmail);
        }
    }

    if (!empty($config['bcc'])) {
        foreach ($config['bcc'] as $bccEmail) {
            $adminMail->addBCC($bccEmail);
        }
    }

    $adminMail->isHTML(true);
    $adminMail->Subject = "JDK Contact Form - {$subject}";
    $adminMail->Body = "
        <table style='border-collapse: collapse; width: 100%; max-width: 600px; border: 1px solid #ddd;'>
            <tr style='background-color: #f2f2f2;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold; width: 40%;'>Name</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$name}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Email</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$email}</td>
            </tr>
            <tr style='background-color: #f9f9f9;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Phone</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$phone}</td>
            </tr>
            <tr>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Subject</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$subject}</td>
            </tr>
            <tr style='background-color: #f9f9f9;'>
                <td style='border: 1px solid #ddd; padding: 8px; font-weight: bold;'>Message</td>
                <td style='border: 1px solid #ddd; padding: 8px;'>{$message}</td>
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
    $userMail->addAddress($_POST['email'], $name);

    $userMail->isHTML(true);
    $userMail->Subject = "We Received Your Message";
    $userMail->Body = "
        <h2>Hi {$name},</h2>
        <p>Thank you for contacting JDK Transportation.</p>
        <p>Our team has received your message and will get back to you shortly.</p>
        <br>
        <p>Best Regards,<br>{$config['from_name']}</p>
    ";

    $userMail->send();

    echo json_encode(["status"=>"success"]);

} catch (Exception $e) {
    echo json_encode(["status"=>"error"]);
}
