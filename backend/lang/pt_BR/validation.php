<?php

// Validation messages in pt-BR (rules used by the API; extend as new rules appear).
return [
    'accepted' => 'Você precisa aceitar :attribute.',
    'after' => ':Attribute deve ser posterior a :date.',
    'after_or_equal' => ':Attribute deve ser igual ou posterior a :date.',
    'before' => ':Attribute deve ser anterior a :date.',
    'before_or_equal' => ':Attribute deve ser igual ou anterior a :date.',
    'boolean' => ':Attribute deve ser verdadeiro ou falso.',
    'confirmed' => 'A confirmação de :attribute não confere.',
    'date' => ':Attribute não é uma data válida.',
    'date_format' => ':Attribute deve estar no formato :format.',
    'digits' => ':Attribute deve ter :digits dígitos.',
    'email' => 'Informe um e-mail válido.',
    'enum' => ':Attribute selecionado é inválido.',
    'exists' => ':Attribute selecionado é inválido.',
    'in' => ':Attribute selecionado é inválido.',
    'integer' => ':Attribute deve ser um número inteiro.',
    'lowercase' => ':Attribute deve estar em letras minúsculas.',
    'max' => [
        'numeric' => ':Attribute não pode ser maior que :max.',
        'string' => ':Attribute não pode ter mais de :max caracteres.',
    ],
    'min' => [
        'numeric' => ':Attribute deve ser pelo menos :min.',
        'string' => ':Attribute deve ter pelo menos :min caracteres.',
    ],
    'numeric' => ':Attribute deve ser um número.',
    'regex' => 'O formato de :attribute é inválido.',
    'required' => 'Informe :attribute.',
    'string' => ':Attribute deve ser um texto.',
    'unique' => 'Este :attribute já está em uso.',
    'current_password' => 'A senha informada está incorreta.',
    'password' => [
        'letters' => ':Attribute deve ter pelo menos uma letra.',
        'mixed' => ':Attribute deve ter letras maiúsculas e minúsculas.',
        'numbers' => ':Attribute deve ter pelo menos um número.',
        'symbols' => ':Attribute deve ter pelo menos um símbolo.',
        'uncompromised' => 'Esta senha apareceu em um vazamento de dados. Escolha outra.',
    ],

    'custom' => [
        'email' => [
            'unique' => 'Já existe uma conta com este e-mail.',
        ],
        'birth_date' => [
            'before_or_equal' => 'Você precisa ter 18 anos ou mais para usar o Training Up.',
            'after' => 'Informe uma data de nascimento válida.',
        ],
        'accept_terms' => [
            'accepted' => 'Você precisa aceitar os Termos de Uso e a Política de Privacidade.',
        ],
    ],

    'attributes' => [
        'name' => 'o nome',
        'email' => 'o e-mail',
        'password' => 'a senha',
        'current_password' => 'a senha atual',
        'birth_date' => 'a data de nascimento',
        'accept_terms' => 'os termos',
        'code' => 'o código',
        'token' => 'o link',
        'theme' => 'o tema',
        'weight_unit' => 'a unidade de peso',
        'length_unit' => 'a unidade de medida',
    ],
];
