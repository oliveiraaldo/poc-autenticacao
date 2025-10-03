
### Link do projeto no GitHub:
```html
 https://github.com/oliveiraaldo/poc-autenticacao/tree/main
 ```


This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Criando certificados SSL para localhost com mkcert

1. **Instalar o mkcert**  
   - Linux (Debian/Ubuntu):
     ```bash
     sudo apt install libnss3-tools
     brew install mkcert nss   # se tiver o Homebrew instalado
     ```
   - macOS (com Homebrew):
     ```bash
     brew install mkcert nss
     ```
   - Windows:  
     Baixar o executável no [repositório oficial](https://github.com/FiloSottile/mkcert/releases) e colocar no PATH.

2. **Criar e instalar a autoridade local** (executar uma única vez por máquina):
   ```bash
   mkcert -install
   ```

3. **Gerar os certificados na pasta certs:**
    ```bash
    mkcert -key-file certs/localhost-key.pem -cert-file certs/localhost.pem localhost 127.0.0.1 ::1   
    ``` 
    
4. **Configurar o package.json**

   Adicione o script no package.json:
    ```bash
        {
            "scripts": {
                "dev": "next dev",
                "ssl": "local-ssl-proxy --source 24731 --target 3000 --cert certs/localhost.pem --key certs/localhost-key.pem"
            }
        }
    ```    

5. **Rodar a aplicação**
    
    Em um terminal:
    ```bash
    npm run dev
    ```        

    Em outro terminal:
    ```bash
        npm run ssl
    ```    

    Agora acesse sua aplicação em:
    ```bash
        https://localhost:24731
    ```    

6. **Rodar usando os containers**

```bash
# Subir os containers de desenvolvimento
docker-compose -f docker-compose.dev.yaml up

# Parar os serviços
docker-compose -f docker-compose.dev.yaml down

# Reiniciar
docker-compose -f docker-compose.dev.yaml restart

```

7. **Para acessar:**

__Next.js diretamente:__ http://localhost:3000

__Via Nginx (HTTPS):__ https://localhost:24731

8.  **Teste as conexões:**

```bash
# Teste o Next.js diretamente
curl http://localhost:3000

# Teste via Nginx (HTTPS)
curl -k https://localhost:24731
```

9. **Para desenvolvimento:**

* Todas as alterações que você fizer no código serão refletidas automaticamente

* O Hot Module Replacement (HMR) deve funcionar para atualizações em tempo real

* O Redis está disponível para sessões/cache

10. **Estrutura final que funcionou:**

✅ Next.js rodando em 0.0.0.0 (acessível de outros containers)

✅ Nginx com SSL funcionando na porta 24731

✅ Redis para cache/sessões

✅ Hot reload para desenvolvimento