<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>{{ $title ?? config('app.name') }}</title>
</head>
<body style="margin:0;padding:0;background:#F7F6F4;font-family:Arial,Helvetica,sans-serif;color:#17181C;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F6F4;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFFFF;border-radius:16px;border:1px solid #E2DFDA;">
      <tr><td style="padding:28px 32px 0 32px;">
        <span style="font-size:22px;font-weight:900;font-style:italic;letter-spacing:0.5px;color:#17181C;">TRAINING <span style="color:#C93D08;">UP</span></span>
      </td></tr>
      <tr><td style="padding:24px 32px 32px 32px;font-size:16px;line-height:1.55;">
        @yield('content')
      </td></tr>
    </table>
    <p style="max-width:520px;margin:16px auto 0 auto;font-size:12px;line-height:1.5;color:#5E6168;">
      {{ __('emails.footer') }}
    </p>
  </td></tr>
</table>
</body>
</html>
