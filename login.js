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

async function validarCredenciais(password) {
  const spinner = document.getElementById('loading');
  spinner.style.display = 'flex';

  try {
    const response = await fetch("https://barretoapps.com.br/login_barreto", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        usuario: "usuario1",
        senha: password 
      })
    });

    const result = await response.json();
    console.log("Resposta do backend:", result);

    if (response.ok && result.success) {
      spinner.style.display = 'none';
      realizarLogin(result);
    } else {
      exibirAlerta(result.message || "Senha incorreta!");
      spinner.style.display = 'none';
    }
  } catch (err) {
    console.error("Erro no fetch:", err);
    exibirAlerta("Erro ao tentar logar.");
    spinner.style.display = 'none';
  }
}

function realizarLogin(userData) {
  sessionStorage.setItem("logon", "1");

  let empresa = userData.empresa || "";
  if (empresa.startsWith('"') && empresa.endsWith('"')) {
    empresa = empresa.slice(1, -1);
  }

  sessionStorage.setItem("empresa", empresa);

  document.getElementById('container-login').style.display = "none";


  document.getElementById('tela').src = "dash.html";


}


function exibirAlerta(mensagem) {
  const alert = document.getElementById("alert");
  alert.innerText = mensagem;
  alert.style.display = "block";
}
