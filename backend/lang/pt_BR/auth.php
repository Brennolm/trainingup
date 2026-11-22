<?php

return [
    'failed' => 'E-mail ou senha incorretos.',
    'password' => 'A senha informada está incorreta.',
    'throttle' => 'Muitas tentativas. Tente novamente em :seconds segundos.',
    'unauthenticated' => 'Entre na sua conta para continuar.',
    'email_unverified' => 'Confirme seu e-mail para continuar.',
    'logged_out' => 'Você saiu da sua conta.',

    'verification' => [
        'verified' => 'E-mail confirmado.',
        'already_verified' => 'Seu e-mail já está confirmado.',
        'sent' => 'Enviamos um novo código para o seu e-mail.',
        'send_failed' => 'Não conseguimos enviar o código agora. Tente reenviar em instantes.',
        'invalid' => 'Código incorreto. Confira e tente de novo.',
        'expired' => 'Este código expirou. Peça um novo código.',
        'too_many_attempts' => 'Você errou o código muitas vezes. Peça um novo código.',
        'no_code' => 'Peça um código para confirmar seu e-mail.',
        'wait' => 'Aguarde :seconds segundos para pedir um novo código.',
    ],

    'google' => [
        'no_pending' => 'Comece de novo pelo botão Continuar com Google.',
        'already_registered' => 'Já existe uma conta com este e-mail. Entre com Google ou com a sua senha.',
        'needs_password' => 'Crie uma senha antes de desvincular o Google, para não perder o acesso à conta.',
    ],

    'two_factor' => [
        'invalid' => 'Código incorreto. Confira no app autenticador e tente de novo.',
        'expired' => 'O tempo para digitar o código acabou. Entre com e-mail e senha de novo.',
        'too_many_attempts' => 'Você errou o código muitas vezes. Entre com e-mail e senha de novo.',
        'needs_password' => 'Crie uma senha antes de ativar a verificação em duas etapas.',
        'already_enabled' => 'A verificação em duas etapas já está ativa.',
        'not_enabled' => 'A verificação em duas etapas não está ativa.',
        'not_started' => 'Comece a ativação de novo.',
    ],
];
