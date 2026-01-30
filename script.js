window.addEventListener("DOMContentLoaded", function () {
  configurarFormularioLogin();
});

function configurarFormularioLogin() {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const password = document.getElementById("password").value.trim();

    if (!password) {
      exibirAlerta("A senha é obrigatória!");
      return;
    }

    await validarCredenciais(password);
  });
}

// ==========================================================
// VALIDA SENHA PELO CSV DA PLANILHA
// ==========================================================
async function validarCredenciais(password) {
  const spinner = document.getElementById("loading");
  spinner.style.display = "flex";

  try {
    // 1️⃣ busca URL do CSV no keys.json
    const keyReq = await fetch("keys.json");
    const keyJson = await keyReq.json();

    const csvReq = await fetch(keyJson[0].base);
    const csvText = await csvReq.text();

    // 2️⃣ processa CSV
    const senhas = processarCSV(csvText);

    // 3️⃣ valida senha
    const senhaValida = senhas.includes(password);

    spinner.style.display = "none";

    if (!senhaValida) {
      exibirAlerta("Senha incorreta!");
      return;
    }

    // mantém seu fluxo original
    realizarLogin({ empresa: "Barreto Soluções" });

  } catch (err) {
    console.error("Erro ao validar senha:", err);
    spinner.style.display = "none";
    exibirAlerta("Erro ao validar senha.");
  }
}

// ==========================================================
// CSV → ARRAY DE SENHAS
// ==========================================================
function processarCSV(csv) {

  csv = csv.replace(/^\uFEFF/, ""); // remove BOM
  const separador = csv.includes(";") ? ";" : ",";
  const linhas = csv.split(/\r?\n/).filter(l => l.trim());

  const cabecalho = linhas[0]
    .split(separador)
    .map(c => limpar(c));

  const indexSenha = cabecalho.indexOf("password");

  if (indexSenha === -1) {
    throw new Error("Coluna 'password' não encontrada no CSV");
  }

  return linhas.slice(1).map(linha => {
    const valores = linha.split(separador);
    return limpar(valores[indexSenha]);
  });
}

function limpar(valor = "") {
  return valor.replace(/^"+|"+$/g, "").trim();
}


function realizarLogin(userData) {
  sessionStorage.setItem("logon", "1");

  let empresa = userData.empresa || "";
  if (empresa.startsWith('"') && empresa.endsWith('"')) {
    empresa = empresa.slice(1, -1);
  }

  sessionStorage.setItem("empresa", empresa);

  document.getElementById("container-login").style.display = "none";
  document.getElementById("tela").src = "dash.html";
}

function exibirAlerta(mensagem) {
  const alert = document.getElementById("alert");
  alert.innerText = mensagem;
  alert.style.display = "block";
}
