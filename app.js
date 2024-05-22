const { postCompletion, postCompletionWithSQL } = require("./chatLLM");
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const { executeSQLQuery } = require("./sqlHandler");
const path = require("path");
const fs = require("fs");
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MockAdapter = require('@bot-whatsapp/database/mock');
const menuPath = path.join(__dirname,"mensajes","menu.txt")
const menu = fs.readFileSync(menuPath, "utf-8")

// https://builderbot.vercel.app/en/showcases/forward-conversation-to-human para la siguiente version

const recordsetToString = (recordset) => {
    if (recordset.length === 0) {
        return "No se encontraron resultados para la consulta.";
    }

    const data = recordset.map(row => {
        return Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(', ');
    });

    return data.join('\n');
};

const flowWelcome = addKeyword(EVENTS.WELCOME).addAnswer(
    "Hola! te comunicaste con Neumáticos Los Portones. Introducí el número de la accion que quieras hacer:").addAnswer(
    menu,
    {capture: true},
    async (ctx, { gotoFlow, fallBack, flowDynamic}) => {
        if (!["1","2","3","4","0"].includes(ctx.body)){
            return fallBack(
                "Respuesta no valida, por favor selecciona una de las opciones"
            );
        }
        switch (ctx.body) {
            case "1":
                return gotoFlow(flowEcommerce);
            case "2":
                return gotoFlow(flowConsultas);     
            case "3":
                return await flowDynamic("Estas son las gomas que tenes para vulcanizar:");
            case "4":
                return await flowDynamic("Estos son los servicios que le hiciste a tu vehiculo:");                
        }
    }
);

const flowEcommerce = addKeyword(EVENTS.ACTION).addAnswer(
    'Esta es nuestra pagina: www.losportones.mercadoshop.com.ar'
);
const flowConsultas = addKeyword(EVENTS.ACTION)
    .addAnswer('Por favor, ingrese la medida del neumático que desea consultar:', { capture: true }, async (ctx, { flowDynamic }) => {
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

            await flowDynamic(answer);
        } catch (error) {
            console.error("Error en el flujo principal:", error);
            await flowDynamic("Hubo un error procesando tu consulta. Por favor, intenta nuevamente.");
        }
    });



const main = async () => {
    const adapterDB = new MockAdapter();
    const adapterFlow = createFlow([flowConsultas,flowWelcome,flowEcommerce]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    QRPortalWeb();
};

main();
