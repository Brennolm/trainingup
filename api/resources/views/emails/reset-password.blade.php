@extends('emails.layout', ['title' => __('emails.reset.title')])

@section('content')
<p style="margin:0 0 16px 0;">{{ __('emails.greeting', ['name' => $name]) }}</p>
<p style="margin:0 0 24px 0;">{{ __('emails.reset.intro') }}</p>
<p style="margin:0 0 24px 0;">
  <a href="{{ $url }}" style="display:inline-block;background:#C93D08;color:#FFFFFF;text-decoration:none;font-weight:700;padding:14px 24px;border-radius:12px;">{{ __('emails.reset.button') }}</a>
</p>
<p style="margin:0 0 12px 0;color:#5E6168;">{{ __('emails.reset.expires', ['minutes' => $minutes]) }}</p>
<p style="margin:0 0 12px 0;color:#5E6168;">{{ __('emails.reset.ignore') }}</p>
<p style="margin:0;font-size:12px;color:#5E6168;word-break:break-all;">{{ __('emails.reset.fallback') }}<br>{{ $url }}</p>
@endsection
