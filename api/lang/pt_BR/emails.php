<?php

return [
    'greeting' => 'Olá, :name!',
    'footer' => 'Você recebeu este e-mail porque há uma conta no Training Up com este endereço. Os planos do Training Up são sugestões e estimativas e não substituem acompanhamento profissional.',

    'verification' => [
        'subject' => ':code é o seu código do Training Up',
        'title' => 'Confirme seu e-mail',
        'intro' => 'Use o código abaixo para confirmar seu e-mail e começar a usar o Training Up:',
        'expires' => 'O código vale por :minutes minutos.',
        'ignore' => 'Se você não criou uma conta, ignore este e-mail.',
    ],

    'reset' => [
        'subject' => 'Redefinir sua senha do Training Up',
        'title' => 'Redefinir senha',
        'intro' => 'Recebemos um pedido para redefinir a senha da sua conta. Toque no botão para criar uma nova senha:',
        'button' => 'Criar nova senha',
        'expires' => 'O link vale por :minutes minutos.',
        'ignore' => 'Se você não pediu para redefinir a senha, ignore este e-mail. Sua senha continua a mesma.',
        'fallback' => 'Se o botão não funcionar, copie e cole este endereço no navegador:',
    ],
];
