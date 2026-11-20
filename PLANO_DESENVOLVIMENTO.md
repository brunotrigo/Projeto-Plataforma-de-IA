# Plano de Desenvolvimento — Plataforma de Estudos com IA

## Referência e objetivos

Este documento organiza o desenvolvimento da Plataforma de Estudos com IA com base no `plano.md`, que é a referência oficial dos requisitos e decisões aprovadas.

O desenvolvimento deve seguir estas regras:

- Implementar uma funcionalidade por vez.
- Executar uma tarefa pequena e aguardar aprovação antes da próxima.
- Preservar as decisões aprovadas e não alterar tecnologias ou escopo sem autorização.
- Não marcar uma tarefa como concluída sem evidências verificáveis.
- Evitar resultados fictícios, testes não executados ou conclusões sem demonstração.

## Decisões aprovadas que orientam o plano

- MVP: HOME, aulas e conteúdos, Chat Principal, Tutor IA, memória compartilhada inicial, exercícios, progresso e consultas independentes básicas.
- Frontend: HTML, CSS e JavaScript puro.
- Backend: Node.js com Express.
- Memória local: IndexedDB no navegador.
- A chave do provedor de IA permanece protegida no backend.
- O provedor de IA ainda não foi escolhido.
- Histórico do Chat Principal separado do histórico do Tutor IA.
- Memória de aprendizagem compartilhada entre Chat Principal e Tutor IA.
- O Tutor IA não altera diretamente etapas, exercícios, tentativas, conclusão de atividades ou progresso.
- Consultas independentes não alteram o progresso ou o domínio de conceitos.
- Importação de projetos fica fora do MVP.
- Personalização com IA fica fora do MVP.
- Banco de dados relacional futuro e sincronização em nuvem não estão aprovados como implementação desta etapa.

## Convenção dos códigos

- Cada código começa pela fase, por exemplo `F0.1`.
- O estado inicial de todas as tarefas é **Não iniciada**, salvo indicação posterior com evidência.
- Estados disponíveis: **Não iniciada**, **Em andamento**, **Aguardando aprovação**, **Concluída** e **Bloqueada**.

---

# Fase 0 — Diagnóstico do projeto

**Objetivo:** identificar o estado real do repositório, os recursos já existentes e os pontos que exigem implementação ou correção.

## Tarefas

### F0.1 — Levantar a estrutura atual

- **Descrição:** verificar arquivos, páginas, diretórios, módulos do backend e dependências já presentes.
- **Dependências:** nenhuma.
- **Critérios de conclusão:** inventário inicial criado com a localização das principais áreas do projeto e suas responsabilidades.
- **Testes e verificações:** execução de inspeção do repositório e leitura do `package.json`, README e arquivos existentes.
- **Estado:** Não iniciada.

### F0.2 — Mapear o comportamento implementado

- **Descrição:** comparar o código atual com o escopo aprovado no `plano.md`, separando comportamento existente, incompleto e ausente.
- **Dependências:** F0.1.
- **Critérios de conclusão:** lista objetiva de lacunas do MVP, sem atribuir conclusão a recursos não demonstrados.
- **Testes e verificações:** navegação pelas páginas disponíveis e revisão dos scripts e rotas existentes.
- **Estado:** Não iniciada.

### F0.3 — Definir uma linha de base

- **Descrição:** registrar o processo real de instalação, inicialização e testes disponíveis no projeto.
- **Dependências:** F0.1 e F0.2.
- **Critérios de conclusão:** comandos de instalação, execução e validação documentados a partir do estado atual.
- **Testes e verificações:** execução dos comandos existentes e registro dos resultados obtidos.
- **Estado:** Não iniciada.

---

# Fase 1 — Arquitetura e organização

**Objetivo:** organizar a estrutura de frontend, backend e armazenamento sem introduzir tecnologias não aprovadas.

## Tarefas

### F1.1 — Consolidar responsabilidades da interface

- **Descrição:** definir a separação entre páginas HTML, estilos, scripts e módulos de apresentação.
- **Dependências:** F0.1 e F0.2.
- **Critérios de conclusão:** responsabilidades claras para HOME, estudo principal e consultas independentes, usando HTML, CSS e JavaScript puro.
- **Testes e verificações:** revisão estrutural e confirmação de que não foram introduzidos frameworks.
- **Estado:** Não iniciada.

### F1.2 — Organizar o backend Express

- **Descrição:** organizar servidor, rotas, controladores, serviços e validação em responsabilidades coerentes.
- **Dependências:** F0.1 e F1.1.
- **Critérios de conclusão:** fluxo de uma solicitação compreensível e separação básica entre entrada HTTP, regra de aplicação e integração externa.
- **Testes e verificações:** inicialização do servidor e inspeção das rotas disponíveis.
- **Estado:** Não iniciada.

### F1.3 — Definir limites da memória local

- **Descrição:** organizar os modelos de dados previstos para IndexedDB sem iniciar implementação além da tarefa autorizada.
- **Dependências:** F0.2 e F1.1.
- **Critérios de conclusão:** limites documentados para aulas, etapas, tentativas, progresso, conceitos, históricos separados e consultas independentes.
- **Testes e verificações:** revisão dos modelos contra os requisitos de separação de históricos e memória compartilhada.
- **Estado:** Não iniciada.

---

# Fase 2 — Interface e experiência do usuário

**Objetivo:** entregar a navegação e as telas essenciais do MVP, mantendo uma experiência prática e clara.

## Tarefas

### F2.1 — Finalizar a HOME

- **Descrição:** implementar ou ajustar a página inicial para organizar matérias e assuntos e permitir iniciar ou retomar estudos.
- **Dependências:** F1.1 e F1.3.
- **Critérios de conclusão:** páginas e ações da HOME correspondem ao fluxo aprovado e permitem identificar estudos iniciados e retomáveis.
- **Testes e verificações:** teste manual de navegação, responsividade básica e estados de conteúdo.
- **Estado:** Não iniciada.

### F2.2 — Estruturar a tela de estudo principal

- **Descrição:** organizar o Chat Principal à esquerda e o Tutor IA em painel lateral direito, com histórico visualmente independente.
- **Dependências:** F1.1 e F1.3.
- **Critérios de conclusão:** interfaces e mensagens distinguem claramente os dois chats e sua responsabilidade.
- **Testes e verificações:** teste manual das áreas, estados vazios e separação visual dos históricos.
- **Estado:** Não iniciada.

### F2.3 — Implementar a interface das consultas independentes

- **Descrição:** disponibilizar consulta técnica e perguntas livres sem ligá-las diretamente à alteração de aula ou progresso.
- **Dependências:** F1.1 e F1.3.
- **Critérios de conclusão:** consultas possuem histórico próprio e não exibem ações que alteram o estudo.
- **Testes e verificações:** navegação manual e confirmação de que nenhuma consulta dispara atualização de etapa ou domínio.
- **Estado:** Não iniciada.

### F2.4 — Refinar estados e acessibilidade básica

- **Descrição:** definir estados de carregamento, erro, vazio e sucesso, além de controles utilizáveis por teclado.
- **Dependências:** F2.1, F2.2 e F2.3.
- **Critérios de conclusão:** estados principais possuem feedback claro e elementos interativos são utilizáveis.
- **Testes e verificações:** testes manuais de teclado, foco, contraste básico e respostas a erros.
- **Estado:** Não iniciada.

---

# Fase 3 — Backend e API

**Objetivo:** fornecer uma API Express simples e segura para estudo, tutor, consultas e integração com IA.

## Tarefas

### F3.1 — Definir contratos HTTP do MVP

- **Descrição:** documentar endpoints e formatos de entrada e saída antes da implementação.
- **Dependências:** F1.2 e F1.3.
- **Critérios de conclusão:** contratos cobrem aulas, Chat Principal, Tutor IA e consultas independentes sem expor dados secretos.
- **Testes e verificações:** revisão dos contratos e validação contra os fluxos do plano.
- **Estado:** Não iniciada.

### F3.2 — Implementar validação das solicitações

- **Descrição:** validar campos obrigatórios e formatos recebidos pelas rotas.
- **Dependências:** F3.1.
- **Critérios de conclusão:** entradas inválidas retornam respostas consistentes e não são repassadas ao provedor.
- **Testes e verificações:** testes automatizados de valores válidos, ausentes e malformados.
- **Estado:** Não iniciada.

### F3.3 — Implementar rotas do Chat Principal

- **Descrição:** criar o endpoint que recebe mensagens de estudo e solicita respostas ao serviço de IA.
- **Dependências:** F3.1 e F3.2.
- **Critérios de conclusão:** o Chat Principal recebe conteúdo, exemplos, exercícios e feedback por meio do backend sem alterar diretamente a lógica do navegador.
- **Testes e verificações:** testes unitários ou de integração com provedor simulada.
- **Estado:** Não iniciada.

### F3.4 — Implementar rotas do Tutor IA

- **Descrição:** criar o endpoint de dúvidas com contexto da etapa atual, sem capacidade de avançar a aula.
- **Dependências:** F3.1, F3.2 e F3.3.
- **Critérios de conclusão:** respostas consultam apenas o contexto permitido e não modificam etapa, exercícios, tentativas ou progresso.
- **Testes e verificações:** testes que confirmem ausência de efeitos sobre progresso e responsabilidades.
- **Estado:** Não iniciada.

### F3.5 — Implementar rotas das consultas independentes

- **Descrição:** criar consulta técnica e perguntas livres com histórico próprio.
- **Dependências:** F3.1 e F3.2.
- **Critérios de conclusão:** consultas aceitam assunto atual como contexto opcional e não alteram dados de aprendizagem.
- **Testes e verificações:** testes negativos garantindo que etapa, domínio e progresso permanecem inalterados.
- **Estado:** Não iniciada.

### F3.6 — Implementar tratamento de erros da API

- **Descrição:** padronizar respostas para erros de validação, indisponibilidade e falhas do provedor.
- **Dependências:** F3.3, F3.4 e F3.5.
- **Critérios de conclusão:** a interface recebe informações suficientes para mostrar erro sem vazar detalhes internos ou credenciais.
- **Testes e verificações:** testes de indisponibilidade simulada e mensagens que não contenham segredo.
- **Estado:** Não iniciada.

---

# Fase 4 — Persistência e organização dos dados

**Objetivo:** registrar aulas, progresso e memória inicial no IndexedDB, preservando históricos separados.

## Tarefas

### F4.1 — Modelar os dados locais

- **Descrição:** definir estruturas para matérias, aulas, etapas, exercícios, tentativas, progresso, conceitos e históricos.
- **Dependências:** F1.3 e F2.2.
- **Critérios de conclusão:** modelos separados para Chat Principal, Tutor IA, consultas independentes, personalização futura e memória de aprendizagem.
- **Testes e verificações:** revisão dos modelos e testes de criação, leitura e atualização isolada.
- **Estado:** Não iniciada.

### F4.2 — Implementar acesso básico ao IndexedDB

- **Descrição:** criar operações de abertura do banco e operações locais necessárias ao MVP.
- **Dependências:** F4.1.
- **Critérios de conclusão:** os dados podem ser criados, recuperados e atualizados no navegador sem perder estados existentes.
- **Testes e verificações:** testes de persistência em navegador ou ambiente compatível e reinício da aplicação.
- **Estado:** Não iniciada.

### F4.3 — Registrar o progresso da aula

- **Descrição:** persistir etapas concluídas, atividade atual, último exercício e próxima atividade recomendada.
- **Dependências:** F4.1 e F4.2.
- **Critérios de conclusão:** o usuário consegue retomar a aula no ponto registrado.
- **Testes e verificações:** teste de avanço, pausa e retomada sem atribuir conclusão automática indevida.
- **Estado:** Não iniciada.

### F4.4 — Registrar os históricos separados

- **Descrição:** armazenar separadamente as mensagens do Chat Principal, Tutor IA e consultas independentes.
- **Dependências:** F4.1 e F4.2.
- **Critérios de conclusão:** cada histórico é recuperado somente no contexto correspondente e não é usado como memória bruta compartilhada.
- **Testes e verificações:** testes que enviem mensagens distintas e confirmem isolamento.
- **Estado:** Não iniciada.

### F4.5 — Implementar memória compartilhada inicial

- **Descrição:** persistir conceitos estudados, dificuldades, sinais compreendidos e evidências separadamente dos históricos de conversa.
- **Dependências:** F4.1, F4.2 e F4.3.
- **Critérios de conclusão:** Chat Principal e Tutor IA podem consultar e contribuir para o mesmo registro estruturado sem compartilhar conteúdo das conversas.
- **Testes e verificações:** testes de escrita pelo Tutor IA e leitura pelo Chat Principal, sem atualização indevida de domínio.
- **Estado:** Não iniciada.

---

# Fase 5 — Sistema de aprendizagem

**Objetivo:** implementar aulas, exercícios, tentativas, dicas, feedback e continuidade com evidências.

## Tarefas

### F5.1 — Cadastro de aulas e conteúdos

- **Descrição:** permitir organizar matérias, aulas e etapas de estudo.
- **Dependências:** F2.1 e F4.2.
- **Critérios de conclusão:** aulas podem ser criadas, listadas e retomadas com seus conteúdos.
- **Testes e verificações:** testes de cadastro, leitura e atualização básica.
- **Estado:** Não iniciada.

### F5.2 — Implementar exercícios e tentativas

- **Descrição:** apresentar problemas e armazenar respostas do estudante sem registrar domínio apenas pela entrega.
- **Dependências:** F4.3 e F5.1.
- **Critérios de conclusão:** o estudante pode tentar mais de uma vez e o histórico mantém os resultados.
- **Testes e verificações:** testes de nova tentativa, persistência e recuperação.
- **Estado:** Não iniciada.

### F5.3 — Implementar dicas progressivas e feedback

- **Descrição:** permitir dica inicial, novas tentativas e explicação após resposta conforme o fluxo da aprendizagem.
- **Dependências:** F5.2 e F3.3.
- **Critérios de conclusão:** a IA orienta e não entrega diretamente a solução completa antes do momento autorizado pelo fluxo.
- **Testes e verificações:** cenários automatizados ou manuais com respostas corretas, incorretas e solicitação de dica.
- **Estado:** Não iniciada.

### F5.4 — Avaliar domínio por evidências

- **Descrição:** atualizar estados de conhecimento somente com evidências como exercícios, respostas e demonstrações práticas.
- **Dependências:** F4.5 e F5.2.
- **Critérios de conclusão:** compreensão declarada ou explicação apresentada não altera automaticamente um conceito para dominado.
- **Testes e verificações:** testes negativos para declarações de compreensão e testes positivos com evidências registradas.
- **Estado:** Não iniciada.

### F5.5 — Recomendar continuação

- **Descrição:** determinar próxima atividade com base em etapa atual, dificuldades e conceitos registrados.
- **Dependências:** F4.3 e F5.4.
- **Critérios de conclusão:** a recomendação preserva informações reais e não presume conhecimento não evidenciado.
- **Testes e verificações:** cenários com conceitos dominados, em aprendizado e não iniciados.
- **Estado:** Não iniciada.

---

# Fase 6 — Inteligência artificial

**Objetivo:** integrar o provedor de IA pelo backend e validar as responsabilidades do Chat Principal e do Tutor IA.

## Tarefas

### F6.1 — Escolher o provedor somente após aprovação

- **Descrição:** avaliar candidatos e apresentar comparação técnica e de custos antes de configurar um provedor.
- **Dependências:** F3.1.
- **Critérios de conclusão:** responsável aprova explicitamente o provedor; nenhuma chave é incorporada ao frontend.
- **Testes e verificações:** revisão da proposta e configuração de ambiente em ambiente de desenvolvimento.
- **Estado:** Não iniciada.

### F6.2 — Criar serviço de IA no backend

- **Descrição:** isolar a comunicação com o provedor e fornecer uma interface interna simples.
- **Dependências:** F6.1 e F3.2.
- **Critérios de conclusão:** o provedor é chamado somente pelo backend e o restante da aplicação não depende diretamente do SDK específico.
- **Testes e verificações:** teste com resposta simulada e teste de indisponibilidade.
- **Estado:** Não iniciada.

### F6.3 — Proteger a chave da API

- **Descrição:** carregar credenciais de ambiente no servidor e evitar exposição no código cliente ou nos logs.
- **Dependências:** F6.1.
- **Critérios de conclusão:** chave armazenada fora dos arquivos versionados e não aparece em resposta, HTML ou JavaScript público.
- **Testes e verificações:** inspeção do repositório, logs e respostas HTTP.
- **Estado:** Não iniciada.

### F6.4 — Integrar o Chat Principal

- **Descrição:** combinar contexto da aula, memória estruturada e solicitações do estudante para conduzir a experiência.
- **Dependências:** F3.3, F4.5 e F6.2.
- **Critérios de conclusão:** Chat Principal apresenta aula, exercícios e feedback; atualiza progresso apenas por evidências previstas.
- **Testes e verificações:** testes simulados de explicação, exercício, resposta e progresso.
- **Estado:** Não iniciada.

### F6.5 — Integrar o Tutor IA

- **Descrição:** responder dúvidas com contexto da etapa atual sem modificar a aula.
- **Dependências:** F3.4, F4.5 e F6.2.
- **Critérios de conclusão:** o Tutor IA consulta memória compartilhada e pode registrar sinais estruturados, mas não altera progresso, tentativas ou etapas.
- **Testes e verificações:** testes positivos e negativos sobre efeitos no andamento da aula.
- **Estado:** Não iniciada.

---

# Fase 7 — Consultas independentes

**Objetivo:** disponibilizar consultas técnicas e livres que não interferem no progresso ou nos históricos do estudo principal.

## Tarefas

### F7.1 — Implementar consulta técnica

- **Descrição:** responder termos técnicos, traduções, significados, funções, contextos e exemplos.
- **Dependências:** F3.5 e F6.2.
- **Critérios de conclusão:** respostas distinguem tradução, significado e contexto, mantendo histórico próprio.
- **Testes e verificações:** testes com termos conhecidos e verificações de que nenhuma rota altera dados de estudo.
- **Estado:** Não iniciada.

### F7.2 — Implementar perguntas livres

- **Descrição:** permitir conversa independente sobre dúvidas externas ao estudo atual.
- **Dependências:** F3.5 e F6.2.
- **Critérios de conclusão:** o assunto atual é opcional como contexto e o histórico permanece separado.
- **Testes e verificações:** testes de contexto opcional e isolamento de mensagens.
- **Estado:** Não iniciada.

### F7.3 — Proibir efeitos colaterais nas consultas

- **Descrição:** validar que consultas independentes não alteram etapas, respostas, tentativas, conclusão ou domínio.
- **Dependências:** F7.1 e F7.2.
- **Critérios de conclusão:** consultas passam por testes de invariantes e não disparam ações de atualização do estudo.
- **Testes e verificações:** testes automatizados que comparem o estado antes e depois das consultas.
- **Estado:** Não iniciada.

---

# Fase 8 — Personalização com IA

**Objetivo:** planejar uma evolução futura em que alterações no estudo dependem de proposta e aprovação explícita.

**Importante:** esta fase fica fora do MVP e não deve ser iniciada no primeiro ciclo de entrega.

## Tarefas

### F8.1 — Definir contrato da personalização

- **Descrição:** especificar o fluxo de solicitação, proposta, aprovação e rejeição sem aplicar alterações automáticas.
- **Dependências:** F3.1, F4.5 e F5.5.
- **Critérios de conclusão:** responsável aprova os requisitos do fluxo e os impactos sobre progresso e domínio.
- **Testes e verificações:** revisão de requisitos e protótipos dos estados da proposta.
- **Estado:** Não iniciada.

### F8.2 — Criar o chat independente de personalização

- **Descrição:** reservar uma interface própria com histórico separado e visualização do estudo ao fundo quando possível.
- **Dependências:** F8.1 e F2.2.
- **Critérios de conclusão:** chat não compartilha nem mistura conversas com Chat Principal, Tutor IA ou consultas.
- **Testes e verificações:** teste de isolamento de histórico e navegação.
- **Estado:** Não iniciada.

### F8.3 — Aplicar alterações somente após aprovação

- **Descrição:** implementar proposta, comparação de impacto e aplicação controlada das mudanças aprovadas.
- **Dependências:** F8.1 e F8.2.
- **Critérios de conclusão:** nenhuma alteração é aplicada antes da aprovação; histórico e progresso são preservados.
- **Testes e verificações:** testes de aprovação, rejeição, cancelamento e preservação de dados.
- **Estado:** Não iniciada.

---

# Fase 9 — Testes, segurança e qualidade

**Objetivo:** validar o MVP de ponta a ponta e proteger dados e integrações.

## Tarefas

### F9.1 — Completar os testes automatizados

- **Descrição:** cobrir backend, persistência local e fluxos críticos do MVP.
- **Dependências:** todas as fases necessárias ao MVP concluídas ou parcialidade claramente registrada.
- **Critérios de conclusão:** testes executáveis demonstram rotas, isolamento de histórico, memória compartilhada e invariantes de progresso.
- **Testes e verificações:** execução da suíte existente ou adição autorizada de testes focados.
- **Estado:** Não iniciada.

### F9.2 — Revisar segurança de configuração

- **Descrição:** verificar variáveis de ambiente, logs, respostas HTTP e arquivos versionados.
- **Dependências:** F6.3.
- **Critérios de conclusão:** nenhum segredo é exposto e a configuração padrão não cria risco conhecido.
- **Testes e verificações:** revisão manual e busca por padrões de credenciais no repositório.
- **Estado:** Não iniciada.

### F9.3 — Executar testes de ponta a ponta

- **Descrição:** validar os principais cenários em navegador e backend local.
- **Dependências:** F9.1 e F9.2.
- **Critérios de conclusão:** o fluxo principal pode ser iniciado, pausado e retomado sem quebrar dados ou separar incorretamente os chats.
- **Testes e verificações:** roteiro manual ou automatizado executado e registrado.
- **Estado:** Não iniciada.

### F9.4 — Revisar tratamento de erros

- **Descrição:** validar indisponibilidade da IA, dados inválidos, falhas de armazenamento e estados inesperados.
- **Dependências:** F3.6 e F9.1.
- **Critérios de conclusão:** erros são claros para o usuário e não ocultam falhas do sistema.
- **Testes e verificações:** testes negativos em API e IndexedDB.
- **Estado:** Não iniciada.

### F9.5 — Verificar qualidade e organização

- **Descrição:** revisar legibilidade, responsabilidades, documentação e ausência de funcionalidades fora do escopo.
- **Dependências:** F9.3.
- **Critérios de conclusão:** mudanças necessárias ao MVP estão organizadas e não há dependências ou tecnologias não autorizadas.
- **Testes e verificações:** revisão de diff, `git status` e execução da validação disponível.
- **Estado:** Não iniciada.

---

# Fase 10 — Finalização e publicação

**Objetivo:** preparar o MVP para uso local ou publicação somente após aprovação explícita.

## Tarefas

### F10.1 — Atualizar a documentação de uso

- **Descrição:** documentar instalação, configuração de ambiente sem revelar credenciais e execução local.
- **Dependências:** F9.5.
- **Critérios de conclusão:** documentação permite iniciar o projeto em um ambiente novo sem expor chaves.
- **Testes e verificações:** seguir o README em ambiente limpo ou reprodução controlada dos passos.
- **Estado:** Não iniciada.

### F10.2 — Preparar checklist de entrega

- **Descrição:** consolidar funcionalidades entregues, pendências, riscos e decisões aprovadas.
- **Dependências:** F9.5.
- **Critérios de conclusão:** checklist distingue implementação concluída de recursos futuros.
- **Testes e verificações:** revisão cruzada com `plano.md` e este documento.
- **Estado:** Não iniciada.

### F10.3 — Aprovar uma versão utilizável

- **Descrição:** apresentar evidências e aguardar validação do responsável antes de publicar ou promover uma versão.
- **Dependências:** F10.1 e F10.2.
- **Critérios de conclusão:** aprovação explícita registrada e nenhum problema crítico aberto.
- **Testes e verificações:** revisão dos testes, diff e estado do Git.
- **Estado:** Não iniciada.

### F10.4 — Publicação

- **Descrição:** realizar somente a publicação autorizada, como execução local ou deploy em plataforma aprovada.
- **Dependências:** F10.3.
- **Critérios de conclusão:** publicação concluída com evidência verificável e configuração segura.
- **Testes e verificações:** smoke test da versão publicada e confirmação da saúde básica.
- **Estado:** Não iniciada.

---

# Seção de acompanhamento

## Estados oficiais

| Estado | Significado |
|---|---|
| Não iniciada | a tarefa ainda não foi executada ou avaliada. |
| Em andamento | a tarefa está sendo executada dentro de uma autorização ativa. |
| Aguardando aprovação | a proposta está pronta ou a execução terminou e aguarda revisão. |
| Concluída | somente deve ser usada quando houver evidência verificável da execução e dos testes. |
| Bloqueada | existe impedimento identificado que exige decisão ou informação externa. |

## Estado atual por fase

| Fase | Estado geral | Observação |
|---|---|---|
| Fase 0 — Diagnóstico do projeto | Não iniciada | levantamento inicial ainda não registrado neste plano. |
| Fase 1 — Arquitetura e organização | Não iniciada | nenhuma estrutura adicional foi aprovada além das tecnologias existentes no `plano.md`. |
| Fase 2 — Interface e experiência do usuário | Não iniciada | telas existentes devem ser verificadas antes de alterações. |
| Fase 3 — Backend e API | Não iniciada | backend atual é básico e não prova implementação de todas as rotas. |
| Fase 4 — Persistência e organização dos dados | Não iniciada | IndexedDB é a memória local aprovada. |
| Fase 5 — Sistema de aprendizagem | Não iniciada | inclui aula, exercícios e evidências sem inventar critérios não aprovados. |
| Fase 6 — Inteligência artificial | Não iniciada | provedor ainda não escolhido. |
| Fase 7 — Consultas independentes | Não iniciada | não altera estado do estudo. |
| Fase 8 — Personalização com IA | Não iniciada | fora do MVP. |
| Fase 9 — Testes, segurança e qualidade | Não iniciada | testes precisam ser definidos e executados. |
| Fase 10 — Finalização e publicação | Não iniciada | exige aprovação antes de publicação. |

## Limites que não devem ser alterados neste plano sem autorização

- Provedor de IA.
- Banco de dados futuro.
- Login e usuários.
- Personalização com IA no MVP.
- Importação de projetos no MVP.
- Sincronização em nuvem.
- Dependências, frameworks ou tecnologias não aprovadas.
- Decisões registradas no `plano.md`.
