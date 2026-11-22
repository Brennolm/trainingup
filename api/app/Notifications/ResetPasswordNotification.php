<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Password reset e-mail pointing to the SPA (not to the API). Sent synchronously. */
class ResetPasswordNotification extends Notification
{
    public function __construct(public string $token) {}

    /** @return array<int, string> */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function resetUrl(object $notifiable): string
    {
        return rtrim((string) config('app.frontend_url'), '/').'/redefinir-senha?'.http_build_query([
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject(__('emails.reset.subject'))
            ->view(['emails.reset-password', 'emails.reset-password-text'], [
                'name' => $notifiable->name,
                'url' => $this->resetUrl($notifiable),
                'minutes' => config('auth.passwords.users.expire'),
            ]);
    }
}
