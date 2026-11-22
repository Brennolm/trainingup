@extends('emails.layout', ['title' => __('emails.verification.title')])

@section('content')
<p style="margin:0 0 16px 0;">{{ __('emails.greeting', ['name' => $name]) }}</p>
<p style="margin:0 0 20px 0;">{{ __('emails.verification.intro') }}</p>
<p style="margin:0 0 20px 0;font-size:36px;font-weight:700;letter-spacing:10px;color:#C93D08;font-family:'Courier New',monospace;">{{ $code }}</p>
<p style="margin:0 0 12px 0;color:#5E6168;">{{ __('emails.verification.expires', ['minutes' => $minutes]) }}</p>
<p style="margin:0;color:#5E6168;">{{ __('emails.verification.ignore') }}</p>
@endsection
