<?php
$dotenv_path = __DIR__ . '/.env';
if (file_exists($dotenv_path)) {
    $lines = file($dotenv_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require __DIR__ . '/vendor/autoload.php';

// POST以外は弾く
if ( $_SERVER['REQUEST_METHOD'] !== 'POST' ) {
	header( 'Location: ./contact.html' );
	exit;
}

// 値の取得
$name = trim( $_POST['name'] ?? '' );
$kana = trim( $_POST['kana'] ?? '' );
$email = trim( $_POST['email'] ?? '' );
$company = trim( $_POST['company'] ?? '' );
$category = trim( $_POST['category'] ?? '' );
$message = trim( $_POST['message'] ?? '' );

// reCAPTCHA v3 検証
$recaptcha_token = $_POST['recaptcha_token'] ?? '';
$recaptcha_secret = $_ENV['RECAPTCHA_SECRET'] ?? getenv('RECAPTCHA_SECRET');

if ( ! empty( $recaptcha_token ) ) {
	$verify = file_get_contents(
		'https://www.google.com/recaptcha/api/siteverify?secret='
		. $recaptcha_secret . '&response=' . $recaptcha_token
	);
	$recaptcha_result = json_decode( $verify );
	if ( ! $recaptcha_result->success || $recaptcha_result->score < 0.5 ) {
		header( 'Location: ./contact.html?error=1' );
		exit;
	}
}

// サーバーサイドバリデーション
$errors = [];
if ( empty( $name ) )
	$errors[] = 'お名前は必須です';
if ( empty( $kana ) )
	$errors[] = 'フリガナは必須です';
if ( empty( $email ) || ! filter_var( $email, FILTER_VALIDATE_EMAIL ) ) {
	$errors[] = '正しいメールアドレスを入力してください';
}
if ( empty( $category ) )
	$errors[] = 'お問い合わせ項目は必須です';
if ( ! isset( $_POST['privacy'] ) )
	$errors[] = 'プライバシーポリシーへの同意が必要です';

if ( ! empty( $errors ) ) {
	header( 'Location: ./contact.html?error=1' );
	exit;
}

// サニタイズ
$name = htmlspecialchars( $name, ENT_QUOTES, 'UTF-8' );
$kana = htmlspecialchars( $kana, ENT_QUOTES, 'UTF-8' );
$email = htmlspecialchars( $email, ENT_QUOTES, 'UTF-8' );
$company = htmlspecialchars( $company, ENT_QUOTES, 'UTF-8' );
$category = htmlspecialchars( $category, ENT_QUOTES, 'UTF-8' );
$message = htmlspecialchars( $message, ENT_QUOTES, 'UTF-8' );

// メール送信
$mail = new PHPMailer( true );

try {
	// SMTP設定（Google Workspace）
	$mail->isSMTP();
	$mail->Host = 'smtp.gmail.com';
	$mail->SMTPAuth = true;
	$mail->Username = 'ryoichi-takami@tortoisebuild.com';
	$mail->Password = $_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD');
	$mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
	$mail->Port = 587;
	$mail->CharSet = 'UTF-8';

	// 送信元・宛先
	$mail->setFrom( 'ryoichi-takami@tortoisebuild.com', 'TortoiseBuild' );
	$mail->addAddress( 'ryoichi-takami@tortoisebuild.com', 'TortoiseBuild' );
	$mail->addReplyTo( $email, $name );

	// 件名・本文
	$mail->Subject = '【TortoiseBuild】お問い合わせがありました';
	$mail->Body =
		"■ お名前：{$name}\n" .
		"■ フリガナ：{$kana}\n" .
		"■ メールアドレス：{$email}\n" .
		"■ 会社名：{$company}\n" .
		"■ お問い合わせ項目：{$category}\n" .
		"■ お問い合わせ内容：\n{$message}";

	$mail->send();
	header( 'Location: ./thanks.html' );
	exit;

} catch (Exception $e) {
	header( 'Location: ./contact.html?error=1' );
	exit;
}