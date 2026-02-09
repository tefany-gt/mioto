# IOTU - Oficinas e Serviços Automotivos

![Build Status](https://github.com/tefany-gt/-iotu-app/actions/workflows/ci.yml/badge.svg)

Aplicativo web responsivo (PWA) para conectar motoristas a oficinas mecânicas, auto elétricas e lojas de peças.

## 📱 Sobre o Projeto

O **IOTU** facilita a vida do motorista permitindo encontrar serviços confiáveis, solicitar orçamentos, agendar manutenções e acessar um "Mecânico Virtual" baseado em IA para diagnósticos rápidos.

Para as oficinas, oferece uma plataforma para gerenciar pedidos, exibir portfólio e fidelizar clientes.

## 🚀 Tecnologias Utilizadas

- **Frontend:** React 19, TypeScript, Vite
- **Estilização:** Tailwind CSS
- **Banco de Dados & Auth:** Supabase
- **Inteligência Artificial:** Google Gemini API
- **Ícones:** Lucide React

## 🛠️ Como Rodar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/tefany-gt/-iotu-app.git
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env` na raiz do projeto (baseado no `.env.example`).
   - Adicione suas chaves do Supabase.

4. Execute o projeto:
   ```bash
   npm run dev
   ```

## 🔒 Segurança

Este projeto utiliza variáveis de ambiente para proteger credenciais sensíveis. O arquivo `.env` está incluído no `.gitignore` e não deve ser enviado para o repositório.

## 📄 Licença

Todos os direitos reservados à IOTU.
