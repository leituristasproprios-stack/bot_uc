const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const fetch = require('node-fetch');
const cron = require('node-cron');

// Link do arquivo contrato.txt no OneDrive
const URL_TXT_ONEDRIVE = 'https://copel0-my.sharepoint.com/:t:/r/personal/vanderley_arruda_copel_com/Documents/Coordenadas/contrato.txt?csf=1&web=1&e=5lXfwC';

let linhasContrato = [];

// Função para baixar e carregar contrato na memória
async function carregarContrato() {
    try {
        const res = await fetch(URL_TXT_ONEDRIVE);
        const txt = await res.text();
        linhasContrato = txt.split('\n');
        console.log(`Contrato carregado com ${linhasContrato.length} linhas!`);
    } catch (err) {
        console.error('Erro ao carregar contrato:', err);
    }
}

// Carrega contrato na inicialização
carregarContrato();

// Agenda para quarta e sexta às 22:00
cron.schedule('0 22 * * 3,5', () => {
    console.log('Atualizando contrato (quarta ou sexta 22:00)...');
    carregarContrato();
});

// Inicializa o WhatsApp
const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Bot online!');
});

client.on('message', async msg => {
    const conteudo = msg.body.trim();

    // Comando inicial
    if (conteudo.toLowerCase() === 'oi') {
        msg.reply('Escolha uma opção:\n1 - Coordenadas');
        return;
    }

    // Escolha 1
    if (conteudo === '1') {
        msg.reply('Digite a UC:');
        return;
    }

    // Caso seja UC
    if (conteudo.startsWith('UC')) {
        const linha = linhasContrato.find(l => l.includes(conteudo));

        if (linha) {
            // Ajuste conforme separador do TXT: '\t' ou ';'
            const colunas = linha.split(/\t|;/);

            // Mapeia somente colunas desejadas
            const campos = {
                UC: colunas[0],
                NUM_EQUIPAMENTO: colunas[1],
                ETAPA: colunas[2],
                LIVRO: colunas[3],
                SEQ_LIVRO: colunas[4],
                LOGRADOURO: colunas[5],
                NUM_IMOVEL: colunas[6],
                COMPLEM_END: colunas[7],
                BAIRRO: colunas[8],
                SITU_UC: colunas[9],
                LOCALIDADE: colunas[10],
                SIGLA_REGIONAL: colunas[11],
                GOOGLE: colunas[16]
            };

            // Monta a resposta apenas com campos não vazios
            let resposta = '';
            for (const [chave, valor] of Object.entries(campos)) {
                if (valor && valor.trim() !== '') {
                    resposta += `${chave}: ${valor}\n`;
                }
            }

            msg.reply(resposta.trim());
        } else {
            msg.reply('UC não encontrada.');
        }
    }
});

client.initialize();