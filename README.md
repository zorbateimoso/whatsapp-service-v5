# 🚀 WhatsApp Service v2.0 - ObraManager

## ✅ Projeto Completo e Testado

Serviço WhatsApp totalmente configurado para integração com ObraManager.

---

## 📦 Conteúdo

- ✅ **Dockerfile** - Container otimizado com todas dependências do Chrome/Puppeteer
- ✅ **server.js** - Servidor Express com endpoints REST
- ✅ **whatsapp-manager.js** - Gerenciador WhatsApp com formato de dados correto
- ✅ **package.json** - Dependências completas
- ✅ **Logs detalhados** - Para debugging fácil

---

## 🚀 Deploy no Railway

### 1. Criar Repositório no GitHub

```bash
git init
git add .
git commit -m "WhatsApp Service v2.0 - Complete"
git branch -M main
git remote add origin <SEU_REPO_URL>
git push -u origin main
```

### 2. Conectar no Railway

1. Acesse [railway.app](https://railway.app)
2. Crie novo projeto
3. Conecte com GitHub
4. Selecione o repositório

### 3. Configurar Variáveis

No Railway, adicione:

```
BACKEND_URL=https://buildboss-1.preview.emergentagent.com
NODE_ENV=production
```

### 4. Gerar Domínio Público

1. Vá em **Settings** → **Networking**
2. Clique em **Generate Domain**
3. Copie a URL gerada

### 5. Atualizar Backend

No seu backend ObraManager, atualize:

```
WHATSAPP_SERVICE_URL=https://sua-url-railway.up.railway.app
```

---

## 🧪 Testar

### 1. Health Check

```bash
curl https://sua-url-railway.up.railway.app/health
```

Resposta esperada:
```json
{
  "status": "healthy",
  "service": "whatsapp-service-obramanager",
  "version": "2.0.0"
}
```

### 2. Conectar WhatsApp

1. Acesse frontend ObraManager
2. Vá em **WhatsApp**
3. Clique **Conectar**
4. Escaneie QR Code

### 3. Testar Fluxo Completo

1. Envie uma **imagem** via WhatsApp
2. Receba **mensagem de validação**
3. Responda **"Sim"**
4. ✅ Confirme mensagem de sucesso
5. ✅ Verifique lançamento na planilha

---

## 📊 Logs

Ver logs no Railway:
```
Deploy Logs → Últimas linhas
```

Procure por:
- ✅ `🚀 WhatsApp Service v2.0.0`
- ✅ `📡 Server running`
- ✅ `📱 QR Code generated`

---

## 🔧 Estrutura

```
├── Dockerfile              # Container com Chrome/Puppeteer
├── .dockerignore          # Otimização build
├── package.json           # Dependências
├── server.js              # Servidor Express
├── whatsapp-manager.js    # Lógica WhatsApp
├── .env.example           # Exemplo variáveis
├── .gitignore             # Arquivos ignorados
└── README.md              # Esta documentação
```

---

## ✅ Checklist Pós-Deploy

- [ ] Serviço rodando sem erros
- [ ] Health check retorna OK
- [ ] QR Code sendo gerado
- [ ] Mensagens sendo recebidas
- [ ] Backend recebendo dados corretos
- [ ] Respostas "Sim" funcionando
- [ ] Lançamentos salvos na planilha

---

## 🆘 Troubleshooting

### Erro: "Failed to launch browser"
✅ **RESOLVIDO** - Dockerfile inclui todas dependências

### Erro: "Cannot connect to backend"
➡️ Verifique `BACKEND_URL` nas variáveis do Railway

### QR Code não aparece
➡️ Verifique se frontend está chamando `/initialize` corretamente

### Mensagens não chegam
➡️ Verifique logs: `📩 Message received`

---

## 📞 Suporte

Se algo não funcionar:
1. Verifique logs do Railway
2. Teste endpoint `/health`
3. Confirme variáveis de ambiente
4. Verifique conectividade com backend

---

**Versão:** 2.0.0  
**Status:** ✅ Testado e Pronto para Produção  
**Data:** 24/11/2025