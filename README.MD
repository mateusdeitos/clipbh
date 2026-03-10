1. Criar a Pasta do Projeto

Abra o Terminal e execute os seguintes comandos:

mkdir clip-historico
cd clip-historico
mkdir assets

2. Criar os Ficheiros

Dentro dessa pasta, crie os ficheiros com os nomes correspondentes e cole o conteúdo gerado:

package.json: Configurações e dependências.

main.js: Lógica do processo principal e SQLite.

preload.js: Ponte de segurança.

index.html: O ponto de entrada visual da aplicação.

App.jsx: A interface React (coloque dentro de uma pasta src/ se estiver a usar um bundler, ou ajuste o script no HTML).

assets/icon.svg: O ícone da aplicação.

3. Preparar o Ícone para macOS

Para que o macOS exiba o ícone corretamente na Dock e no Finder, deve convertê-lo:

Abra o icon.svg num editor ou browser e exporte como PNG (mínimo 1024x1024).

Use uma ferramenta como o CloudConvert ou o comando sips no Mac para criar o ficheiro icon.icns.

Coloque o resultado em assets/icon.icns.

4. Instalar as Dependências

No terminal, instale os módulos necessários:

npm install
npm install better-sqlite3 lucide-react react react-dom

5. Executar e Build

Para testar imediatamente:

npm start

Para criar o instalador .dmg:

npm run build

Dica: O macOS poderá pedir permissões de "Acessibilidade". Vá a Definições do Sistema > Privacidade e Segurança > Acessibilidade e adicione o seu App para que ele possa monitorizar o clipboard sem restrições.
