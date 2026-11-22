{{ __('emails.greeting', ['name' => $name]) }}

{{ __('emails.reset.intro') }}

{{ $url }}

{{ __('emails.reset.expires', ['minutes' => $minutes]) }}
{{ __('emails.reset.ignore') }}

{{ __('emails.footer') }}
