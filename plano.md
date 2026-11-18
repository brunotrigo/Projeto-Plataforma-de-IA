# PLANO.md — Plataforma de Estudos com IA

> **Status:** Planejamento inicial — escopo do MVP atualizado para incluir IA básica desde a primeira versão.\
> **Nome do projeto:** Provisório — Plataforma de Estudos com IA\
> **Objetivo inicial:** Construir uma plataforma de aprendizagem para uso pessoal, com possibilidade de se tornar um produto comercial no futuro.

---

## 1. Visão do projeto

Desenvolver uma plataforma de estudos que utilize inteligência artificial para ensinar programação e outras áreas do conhecimento de maneira prática, interativa e adaptada à evolução de cada estudante.

A plataforma não deve funcionar apenas como um chatbot que responde perguntas. Ela deve acompanhar o processo de aprendizagem, identificar dificuldades, reconhecer conhecimentos já adquiridos e orientar o estudante sobre o que precisa aprender em seguida.

O objetivo é transformar o estudo em uma experiência contínua, organizada e personalizada.

## 2. Público inicial

Inicialmente, a plataforma será desenvolvida para uso pessoal.

O projeto poderá futuramente ser adaptado para outros estudantes e comercializado, mas essa possibilidade não deve aumentar desnecessariamente a complexidade da primeira versão.

## 3. Princípios de aprendizagem

A plataforma deverá seguir estes princípios:

- Priorizar a prática em vez de apresentar longas explicações.
- Permitir que o estudante tente resolver os exercícios antes de receber a resposta.
- Oferecer dicas progressivas antes de apresentar uma solução completa.
- Utilizar exemplos simples e situações reais.
- Apresentar explicações visuais quando isso facilitar a compreensão.
- Traduzir termos técnicos em inglês e explicar seu significado no contexto.
- Evitar repetir conteúdos que o estudante já domina.
- Retomar conteúdos que foram iniciados, mas não concluídos.
- Não presumir conhecimentos sem evidências suficientes.
- Respeitar o ritmo e o tempo disponível do estudante.

## 4. Formas de iniciar um estudo

A plataforma deverá oferecer duas formas principais de aprendizagem.

### 4.1. Estudo por assunto

O estudante informa um assunto ou conceito que deseja aprender.

A IA deverá:

1. Identificar o assunto e seus pré-requisitos.
2. Organizar o conteúdo em etapas.
3. Explicar os conceitos necessários.
4. Apresentar exemplos.
5. Criar exercícios práticos.
6. Avaliar as respostas.
7. Registrar a evolução do estudante.

### 4.2. Estudo a partir de um projeto existente

O estudante poderá importar um projeto de programação para aprender a partir de código real.

A plataforma deverá oferecer três formas de importação:

- Link de repositório do GitHub.
- Arquivo ZIP.
- Pasta local do computador.

A implementação poderá acontecer gradualmente:

1. Importação por ZIP.
2. Importação de repositórios públicos do GitHub.
3. Seleção de pastas locais.
4. Repositórios privados do GitHub, mediante autenticação.

A IA deverá analisar os arquivos, identificar a estrutura do projeto e explicar como os componentes se relacionam.

A análise deverá diferenciar claramente:

- **Fatos encontrados:** informações comprovadas pelo conteúdo dos arquivos.
- **Interpretações:** explicações sobre a provável função ou intenção do código.
- **Informações desconhecidas:** aquilo que não pode ser confirmado apenas com os arquivos disponíveis.

A IA não deverá inventar funcionalidades, responsabilidades ou comportamentos que não estejam sustentados pelo código.

## 5. Aprendizagem adaptativa e conhecimento prévio

Esta é uma das funcionalidades centrais da plataforma.

Quando um novo assunto ou projeto for iniciado, a IA deverá consultar o histórico de aprendizagem para identificar quais conceitos o estudante já conhece, quais estão em desenvolvimento e quais ainda não foram estudados.

### 5.1. Estados de conhecimento

Cada conceito deverá possuir um estado de aprendizagem:

- **Não iniciado:** o estudante ainda não estudou o conceito.
- **Em aprendizado:** teve contato com o conceito, mas ainda precisa praticar.
- **Dominado:** demonstrou que consegue compreender e utilizar o conceito.
- **Precisa revisar:** já apresentou domínio, mas demonstrou dificuldades posteriores ou precisa recuperar o conhecimento.

### 5.2. Comparação com projetos novos

Ao importar um projeto, a IA deverá:

1. Identificar os conceitos utilizados no código.
2. Compará-los com o histórico individual de aprendizagem.
3. Evitar explicações básicas desnecessárias sobre conceitos dominados.
4. Retomar conceitos que ficaram incompletos.
5. Ensinar conceitos ainda não estudados.
6. Aplicar pequenas avaliações quando não houver evidências suficientes sobre o domínio de um assunto.

**Exemplo:**

| Conceito encontrado | Conhecimento registrado | Comportamento esperado                  |
| :------------------ | :---------------------- | :-------------------------------------- |
| Variáveis           | Dominado                | Avançar sem repetir a explicação básica |
| Funções             | Dominado                | Explicar sua aplicação no projeto       |
| DOM                 | Em aprendizado          | Retomar e praticar                      |
| localStorage        | Em aprendizado          | Continuar de onde parou                 |
| Promises            | Não iniciado            | Ensinar quando necessário               |

A plataforma não deverá considerar um conceito dominado apenas porque ele apareceu em uma aula ou foi mencionado em uma conversa.

O nível de domínio deverá ser atualizado com base em exercícios, respostas, explicações e demonstrações práticas do estudante.

## 6. Glossário interativo

Termos técnicos e palavras em inglês deverão poder ser consultados sem interromper o estudo principal.

Ao clicar em uma palavra ou conceito, a plataforma deverá abrir um painel independente contendo:

- Termo original em inglês.
- Tradução em português.
- Significado no contexto estudado.
- Exemplos de utilização.
- Pequeno exercício para verificar a compreensão.
- Espaço para perguntas específicas sobre aquele conceito.

O painel deverá permitir que o estudante consulte uma explicação sem precisar abandonar a aula ou procurar novamente a informação no histórico.

## 7. Experiência prática de aprendizagem

A plataforma deverá oferecer desafios progressivos.

Fluxo desejado:

1. Apresentar um problema.
2. Permitir que o estudante tente resolver sozinho.
3. Analisar a tentativa.
4. Oferecer uma dica se necessário.
5. Permitir uma nova tentativa.
6. Apresentar uma explicação depois da resposta.
7. Registrar o resultado no histórico de aprendizagem.

A IA deverá atuar como orientadora, evitando entregar imediatamente a solução completa quando o estudante ainda puder desenvolver o raciocínio.

## 8. Aprendizagem visual

Sempre que ajudar na compreensão, a plataforma deverá apresentar recursos visuais, como:

- Fluxogramas.
- Diagramas de relacionamento.
- Estrutura de pastas e arquivos.
- Caminho de execução do código.
- Representações de processos.
- Relações entre funções, módulos e componentes.
- Passo a passo de operações.

A visualização deverá ter finalidade didática, não ser apenas decorativa.

## 9. Memória organizada do estudante

A plataforma deverá manter um registro organizado da evolução individual.

Não deverá depender exclusivamente de conversas extensas ou de um histórico bruto de mensagens.

A memória deverá registrar, de forma estruturada:

### 9.1. Perfil de aprendizagem

- Preferências de estudo.
- Ritmo de aprendizagem.
- Formas de explicação que funcionam melhor.
- Preferências de exercícios e avaliações.

### 9.2. Conhecimentos

- Conceitos estudados.
- Conceitos dominados.
- Conceitos em aprendizado.
- Dificuldades identificadas.
- Resultados de exercícios.
- Assuntos que precisam de revisão.

### 9.3. Projetos

- Projetos importados.
- Estrutura dos arquivos.
- Tecnologias utilizadas.
- Arquitetura identificada.
- Conceitos encontrados.
- Dificuldades de compreensão.
- Decisões técnicas importantes.

### 9.4. Continuidade dos estudos

- Última aula ou etapa concluída.
- Último exercício realizado.
- Ponto em que o estudante parou.
- Próxima atividade recomendada.

O estudante deverá conseguir retomar o aprendizado sem precisar explicar novamente todo o seu histórico.

## 10. Tutor com inteligência artificial

A IA deverá ser capaz de:

- Explicar um assunto de diferentes maneiras.
- Criar exercícios adequados ao nível do estudante.
- Identificar erros e dificuldades.
- Dar dicas antes de apresentar respostas.
- Analisar projetos reais.
- Comparar o conteúdo de novos projetos com conhecimentos anteriores.
- Recomendar revisões.
- Acompanhar a evolução individual.

As respostas deverão considerar o histórico de aprendizagem, mas sem presumir informações que não estejam registradas ou comprovadas.

## 11. Escopo inicial — MVP

MVP significa *Minimum Viable Product* (produto mínimo viável): uma primeira versão funcional, com as funcionalidades essenciais.

A prioridade é construir algo utilizável rapidamente e evoluir gradualmente.

### Funcionalidades prioritárias

1. Interface para organizar matérias e assuntos.
2. Cadastro de aulas e conteúdos.
3. Estudo por assunto.
4. Exercícios com tentativas, dicas e feedback.
5. Integração inicial com IA por meio do backend.
6. IA capaz de explicar conceitos, oferecer dicas progressivas e analisar respostas.
7. Registro local do progresso.
8. Memória inicial de conceitos aprendidos, para contextualizar as interações com a IA.

A IA do MVP será limitada e terá como objetivo validar a experiência de aprendizagem. A análise de projetos importados e o uso avançado do histórico não fazem parte dessa primeira integração.

### Funcionalidades para etapas posteriores

- Importação de projetos por ZIP e análise dos arquivos.
- Comparação entre conceitos de projetos e conhecimento prévio.
- Importação de repositórios públicos do GitHub.
- Seleção de pastas locais.
- Glossário interativo completo.
- Painéis independentes com explicações.
- Diagramas e visualizações avançadas.
- Adaptação mais completa da IA ao histórico de aprendizagem.
- Avaliação adaptativa mais sofisticada.
- Sincronização e backup em nuvem.

## 12. Arquitetura e tecnologias

As decisões técnicas aprovadas para o MVP e as possibilidades ainda não definidas estão registradas abaixo.

| Parte                   | Definição                                                                                         | Situação                                      |
| :---------------------- | :------------------------------------------------------------------------------------------------ | :-------------------------------------------- |
| Interface               | HTML, CSS e JavaScript puro                                                                      | Aprovada para o MVP                           |
| Backend                 | Node.js com Express                                                                              | Aprovado para o MVP                           |
| Memória local           | IndexedDB no navegador                                                                          | Aprovada para o MVP                           |
| Inteligência artificial | API de um provedor, acessada exclusivamente pelo backend; chave protegida no ambiente do servidor | Aprovada; provedor ainda não escolhido        |
| Testes                  | Testes automatizados que simulam chamadas ao provedor de IA                                      | Aprovados                                     |
| Banco de dados futuro   | MySQL ou outra solução adequada                                                                  | Possibilidade futura, ainda não definida      |
| Versionamento           | Git e GitHub                                                                                     | Possibilidade inicial, não definida nesta aprovação |

A arquitetura aprovada deverá ser mantida simples, permitir evolução gradual e apoiar o aprendizado durante o desenvolvimento.

### Cuidados técnicos

- Manter chaves secretas de APIs protegidas no ambiente do servidor, sem expô-las no JavaScript do navegador.
- Separar responsabilidades entre interface, lógica e armazenamento.
- Evitar complexidade desnecessária na primeira versão.
- Planejar a proteção dos dados do estudante.
- Não permitir que um projeto importado execute código automaticamente sem controle e isolamento apropriados.

## 13. Funcionalidades que não serão prioridade no MVP

Para evitar que o projeto demore demais para se tornar utilizável, inicialmente não serão desenvolvidos:

- Cadastro de vários usuários.
- Sistema de login completo.
- Assinaturas e pagamentos.
- Planos comerciais.
- Painel administrativo.
- Sincronização entre vários dispositivos.
- Sistema complexo de permissões.

Essas funcionalidades poderão ser planejadas quando houver uma versão pessoal funcional e validada.

## 14. Possível evolução comercial

Caso a plataforma apresente bons resultados no uso pessoal, poderá evoluir para um produto comercial.

Nesse cenário, poderão ser considerados:

- Contas individuais.
- Dados privados por usuário.
- Sincronização em nuvem.
- Planos gratuitos e pagos.
- Limites de utilização da IA.
- Assinaturas.
- Recuperação de dados e backups.
- Administração da plataforma.

A possibilidade comercial deverá ser considerada na organização do projeto, mas não deverá atrasar a primeira versão.

## 15. Etapas sugeridas de desenvolvimento

### Etapa 1 — Planejamento

- [ ] Consolidar os requisitos.
- [ ] Definir o escopo do MVP.
- [ ] Organizar as funcionalidades por prioridade.
- [ ] Definir a estrutura inicial do projeto.

### Etapa 2 — Estrutura inicial

- [ ] Criar a interface principal.
- [ ] Organizar matérias e assuntos.
- [ ] Criar a navegação entre conteúdos.

### Etapa 3 — Sistema de aprendizagem

- [ ] Criar aulas e conteúdos.
- [ ] Criar exercícios.
- [ ] Implementar dicas e feedback.
- [ ] Registrar progresso.

### Etapa 4 — Memória do estudante

- [ ] Registrar conceitos estudados.
- [ ] Registrar nível de domínio.
- [ ] Registrar dificuldades.
- [ ] Permitir retomar estudos.

### Etapa 5 — Integração inicial com inteligência artificial

Objetivo: testar a função central da plataforma com uma IA tutora simples, sem tentar implementar todos os recursos adaptativos de uma vez.

- [ ] Criar no backend uma rota para receber solicitações de estudo.
- [ ] Conectar o backend a uma API de IA.
- [ ] Proteger a chave da API no ambiente do servidor.
- [ ] Permitir que a IA explique um conceito em linguagem simples.
- [ ] Permitir que a IA ofereça dicas progressivas sem entregar imediatamente a solução.
- [ ] Permitir que a IA analise uma tentativa e dê feedback.
- [ ] Testar a integração e tratar erros ou indisponibilidade da API.

Nesta etapa, a IA terá contexto limitado: assunto atual e informações de aprendizagem que já estiverem disponíveis. A personalização avançada ficará para etapas posteriores.

### Etapa 6 — Importação de projetos

- [ ] Implementar importação por ZIP.
- [ ] Identificar arquivos e pastas.
- [ ] Analisar os conceitos presentes no código.
- [ ] Comparar com o histórico de conhecimento.
- [ ] Permitir perguntas à IA sobre o projeto importado.

### Etapa 7 — Evolução

- [ ] Importação por GitHub.
- [ ] Importação de pastas locais.
- [ ] Glossário interativo.
- [ ] Visualizações didáticas.
- [ ] Revisão inteligente.
- [ ] Adaptação mais avançada da IA ao histórico individual.

As etapas poderão ser ajustadas conforme os testes e as dificuldades encontradas.

## 16. Regras para o desenvolvimento

1. Desenvolver uma funcionalidade por vez.
2. Evitar adicionar recursos sem necessidade comprovada.
3. Testar cada etapa antes de avançar.
4. Registrar decisões importantes neste documento.
5. Não alterar decisões já aprovadas sem discutir antes.
6. Priorizar uma versão funcional antes de buscar sofisticação.
7. Manter o código compreensível e organizado.
8. O desenvolvimento também deverá servir como oportunidade de aprendizagem.

## 17. Referências iniciais

Projeto de exemplo para testar futuramente a importação e a análise de código:

- Repositório: [https://github.com/johnnyolima/projeto-barbearia](https://github.com/johnnyolima/projeto-barbearia)
- Material de estudo: guia de estudo sobre login, sessão, validação de CPF e localStorage.
- Conversa de referência sobre cadastro.js: [https://chatgpt.com/g/g-p-6afc85a515f48191bc6f13f39a328af9/c/6afc864e-32f8-83e9-add1-9e40bfade337](https://chatgpt.com/g/g-p-6afc85a515f48191bc6f13f39a328af9/c/6afc864e-32f8-83e9-add1-9e40bfade337)

Outro projeto possível para testes futuros: a calculadora desenvolvida pelo estudante.

## 18. Objetivo final

Construir uma plataforma que não apenas ensine conteúdos, mas acompanhe a evolução do estudante.

Ela deverá compreender o que ele já aprendeu, reconhecer o que ainda precisa desenvolver, utilizar projetos reais como material de estudo e organizar a continuidade do aprendizado.

**A plataforma deverá ensinar o que falta aprender, aprofundar o que já é conhecido e evitar desperdiçar tempo repetindo conteúdos dominados.**