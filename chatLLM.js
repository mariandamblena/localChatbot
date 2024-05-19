const base_url = "http://localhost:1234/v1";
const api_key = "not-needed"; // Not needed for the local mock server

// Función para realizar la solicitud al modelo de lenguaje y devolver la respuesta sin modificar
const postCompletion = async (messages) => {
  try {
    const response = await fetch(`${base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({
        model: "local-model", // Este campo no se está utilizando actualmente
        messages: messages,
        temperature: 0.7,
        stream: false
      })
    });

    if (!response.ok) throw new Error('Failed to fetch');

    const completion = await response.json();
    const answer = completion.choices[0].message.content;
    return answer;
  } catch (error) {
    console.error('ErrorGS:', error);
  }
};


// Función para realizar la solicitud al modelo de lenguaje y devolver la respuesta como una consulta SQL
const postCompletionWithSQL = async (messages) => {
  try {
    const response = await fetch(`${base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${api_key}`
      },
      body: JSON.stringify({
        model: "local-model", // Este campo no se está utilizando actualmente
        messages: messages,
        temperature: 0.7,
        stream: false
      })
    });
    
    if (!response.ok) throw new Error('Failed to fetch');
    
    const completion = await response.json();
    const answer = completion.choices[0].message.content;
    
    // Aquí se invoca la función para generar la consulta SQL
    const sqlQuery = extractSQLQuery(answer);
    console.log("Generated SQL query:", sqlQuery);

    return sqlQuery;
  } catch (error) {
    console.error('ErrorGS:', error);
  }
};

// Función para extraer la consulta SQL de una cadena dada
function extractSQLQuery(input) {
  // Expresión regular para encontrar la query SQL que empieza con 'SELECT' y termina con ';'
  const regex = /SELECT[\s\S]*?;/i;
  
  // Buscar la query usando la expresión regular
  const match = input.match(regex);
  
  // Si se encuentra una coincidencia, devolverla, de lo contrario devolver un mensaje de error
  if (match) {
    return match[0];
  } else {
    return "No se encontró una query SQL válida.";
  }
}

module.exports = { postCompletion, postCompletionWithSQL };
