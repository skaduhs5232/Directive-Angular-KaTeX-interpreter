# Diretiva Angular para KaTeX (`appKatex`)

Uma diretiva Angular `standalone` e reativa (baseada em Signals) para renderizar expressões matemáticas escritas em LaTeX de forma fácil e eficiente dentro de suas aplicações. A diretiva utiliza a biblioteca [KaTeX](https://katex.org/), que é conhecida por sua alta performance.

## Recursos Principais

-   **Standalone**: Fácil de importar e usar em qualquer componente, sem a necessidade de `NgModules`.
-   **Reativa**: Utiliza `Signals` e `effect` do Angular para re-renderizar automaticamente quando o conteúdo de entrada muda.
-   **Suporte a Delimitadores**: Detecta automaticamente expressões LaTeX usando delimitadores comuns como `$$...$$`, `\[...\]` e `\(...\)`.
-   **Opções Configuráveis**: Permite passar um objeto de opções diretamente para o KaTeX para customizações avançadas.
-   **Macros Padrão**: Inclui macros pré-definidas para funções trigonométricas comuns em português/espanhol (ex: `\sen`, `\tg`).
-   **Tratamento de Erros**: Renderiza o LaTeX original em caso de erro de parsing, evitando que a aplicação quebre.
-   **Segurança**: Escapa o conteúdo HTML que não é LaTeX para prevenir ataques XSS, com suporte especial para manter as tags `<b>` e `</b>`.

## Pré-requisitos

Antes de usar a diretiva, você precisa instalar a biblioteca `katex` e `entities`.
