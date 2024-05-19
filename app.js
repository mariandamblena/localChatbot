const { postCompletion, postCompletionWithSQL } = require("./chatLLM");
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const { executeSQLQuery } = require("./sqlHandler");

const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');

const recordsetToString = (recordset) => {
    if (recordset.length === 0) {
        return "No se encontraron resultados para la consulta.";
    }

    const data = recordset.map(row => {
        return Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ');
    });

    return data.join('\n');
};

const flowPrincipal = addKeyword(EVENTS.WELCOME)
    .addAction(
        async (ctx, ctxFn) => {
            let messagesSQL = [
                {
                    "role": "system",
                    "content": "tienes que generar una query igual a esta:SELECT * FROM consultaCliente WHERE medida LIKE 'xxx%yy%zz%';(no puedes cambiar la condicion del like) con la medida del neumatico o goma que consulte el cliente. los atributos son medida, marca, modelo, precio_venta y la tabla es consultaCliente (no existe otra). solo responder con la query, ser conciso."
                },
                { "role": "user", "content": ctx.body }
            ];

            try {
                const answerSQL = await postCompletionWithSQL(messagesSQL);
                console.log("Answer SQL: ", answerSQL);

                if (!answerSQL) {
                    throw new Error("La respuesta SQL está vacía");
                }
                
                const tyreQuery = await executeSQLQuery(answerSQL);
                const tyreQueryText = recordsetToString(tyreQuery);
                console.log("Tyre Query Text: ", tyreQueryText);

                let messages = [
                    {
                        "role": "system",
                        "content": "Solo recibi el listado de productos e arma el mensaje en forma de lista. Ser conciso, no explayarse y responder en espaniol. Decir: 'tengo estas unidades en stock'"
                    },
                    { "role": "user", "content": tyreQueryText }
                ];

                const answer = await postCompletion(messages);
                console.log("Answer: ", answer);

                await ctxFn.flowDynamic(answer);
            } catch (error) {
                console.error("Error en el flujo principal:", error);
                await ctxFn.flowDynamic("Hubo un error procesando tu consulta. Por favor, intenta nuevamente.");
            }
        }
    );

const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowPrincipal]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
