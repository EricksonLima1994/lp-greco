const crypto = require('crypto');

// 1. Credenciais da Meta (Extraídas do Neon)
const PIXEL_ID = '1641973500308824';
const ACCESS_TOKEN = 'EAAe0Xa9cH5YBQxnd74KBhnfpNcQVlwWbHKxbWASoZA3ZAdCZCm0VfvB4Bq9PjIuO7xJKQngAipGD8kcog5fi2U4bymfNnRMmfnDScK2ZCedwInDx3XyDwlY5vZBSaBZAueopGH9nM7WUZAvmCaq6RHoXSOqZBJ1gXh2LSxUHkuRrvLfXDDtsV5m9ip9ZBRWKHFWoL1gZDZD';

// 2. Dados da Compra e da Visita
const orderData = {
  "order_id": "cmmla8li70006jo04ab5jcbel",
  "email": "gwagner863@gmail.com",
  "phone": "(65) 99938-8499",
  "nome_cliente": "Gabriel Wagner Gregory",
  "value": 67,
  "currency": "BRL",
  "event_time": "2026-03-11 00:10:07.694"
};

const visitData = {
  "fbclid": "IwYW9zYgQdgkxleHRuA2FlbQEwAGFkaWQBqy8BFnb-3HNydGMGYXBwX2lkDDM1MDY4NTUzMTcyOAABHh_b86od7NW3yoOSCKveVl6K66sTp1Wa5KloilQ0aAShot05vOhyofRFl_GA_aem_r76PtnBqj_xS3kjMXDch7w",
  "userAgent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Mobile Safari/537.36",
  "ip": "177.174.236.93",
  "createdAt": "2026-03-10 23:02:24.954"
};

// Funções de formatação e Hash (Padrões da Meta)
function hashData(data) {
    if (!data) return null;
    const normalized = data.trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function formatPhone(phone) {
    if (!phone) return null;
    let cleaned = phone.replace(/\D/g, ''); 
    if (cleaned.length === 10 || cleaned.length === 11) {
        cleaned = '55' + cleaned;
    }
    return cleaned;
}

async function sendPurchaseToMeta() {
    // Timestamps: Adicionado o 'Z' para o Node.js interpretar como UTC corretamente
    const unixTime = Math.floor(new Date(orderData.event_time + 'Z').getTime() / 1000);
    const visitUnixTimeMs = new Date(visitData.createdAt + 'Z').getTime();
    
    // Separando e formatando o Nome (fn) e Sobrenome (ln)
    const nameParts = orderData.nome_cliente.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // Hashes SHA-256
    const hashedEmail = hashData(orderData.email);
    const hashedPhone = hashData(formatPhone(orderData.phone));
    const hashedFn = hashData(firstName);
    const hashedLn = hashData(lastName);

    // Montando o fbc no padrão exigido: versão.subdominio.timestamp_ms.fbclid
    const fbcValue = `fb.1.${visitUnixTimeMs}.${visitData.fbclid}`;

    // 3. Montar o Payload Completo
    const payload = {
        data: [
            {
                event_name: 'Purchase',
                event_time: unixTime,
                action_source: 'website',
                user_data: {
                    em: [hashedEmail],
                    ph: [hashedPhone],
                    fn: [hashedFn],
                    ln: [hashedLn],
                    client_ip_address: visitData.ip,
                    client_user_agent: visitData.userAgent,
                    fbc: fbcValue
                },
                custom_data: {
                    currency: orderData.currency,
                    value: orderData.value
                },
                event_id: orderData.order_id
            }
        ]
    };

    const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    try {
        console.log('Enviando evento para a Meta...');
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        console.log('\n--- Resultado da API da Meta ---');
        console.log(JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('\nErro na requisição:', error);
    }
}

sendPurchaseToMeta();