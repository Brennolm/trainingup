{{ __('emails.greeting', ['name' => $name]) }}

{{ __('emails.verification.intro') }}

{{ $code }}

{{ __('emails.verification.expires', ['minutes' => $minutes]) }}
{{ __('emails.verification.ignore') }}

{{ __('emails.footer') }}
