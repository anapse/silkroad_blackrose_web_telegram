import { useEffect, useState } from "react";
import { urlsapi } from "../../shared/recursos/urlApis.jsx";

let valorinicial = {
  ID: "",
  PW: "",
  EMAIL: "",
  SUGERIDO: "",
};
function Registro() {
  const [Vid, setVid] = useState(valorinicial);
  const [data, setdata] = useState("existe");
  const url = urlsapi.existe + Vid.ID;

  let emailRegex = /[a-z0-9]+@[a-z]+\.[a-z]{2,3}/;
  const handleChange = (e) => {
    setVid({ ...Vid, ID: e.target.value });
  };

  useEffect(() => {
    if (Vid.ID != "") {
      fetchData();
    }
  }, [url]);

  const Resgiter = async () => {
    const requestOptions = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ datos: Vid }),
    };

    const res = await fetch(urlsapi.registrar, requestOptions);
    let data = await res.json();

    alert(data);
    setVid(valorinicial);
  };

  const fetchData = async () => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const result = await response.json();

      setdata(result);
    } catch (error) {
      // Error fetching data
    }
  };

  const validaRegistro = async () => {
    if (data == "existe" || Vid.ID?.length < 5) {
      alert("La ID invalido!! Ya existe o es muy corto");
    } else if (Vid.PW?.length < 5 || Vid.PW == "") {
      alert("La clave es corta!! minimo 5 caracteres");
    } else if (!emailRegex.test(Vid.EMAIL)) {
      alert("Email invalido!!");
    } else {
      Resgiter();
    }
  };
  return (
    <div
      style={{
        fontWeight: "bold",
        fontSize: 18,
        margin: 5,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: 20,
          margin: 5,
          width: 500,
          textDecoration: "underline",
          borderRadius: 5,
          padding: 5,
        }}
      >
        Registro De Account
      </div>
      <div
        style={{
          backgroundColor: "#00000080",
          margin: 8,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: 500,
          borderRadius: 10,
        }}
      >
        <div style={{ display: "flex", flexDirection: "row", margin: 8 }}>
          <div style={{ marginRight: 5, width: 100 }}>ID</div>

          <input
            type="text"
            style={{
              color: data == "noexiste" && Vid.ID?.length > 5 ? "green" : "red",
            }}
            name="firstName"
            value={Vid.ID}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "row", margin: 8 }}>
          <div style={{ marginRight: 5, width: 100 }}>PW</div>
          <input
            type="password"
            onChange={(e) => setVid({ ...Vid, PW: e.target.value })}
            value={Vid.PW}
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "row", margin: 8 }}>
          <div style={{ marginRight: 5, width: 100 }}>Email</div>
          <input
            type="email"
            onChange={(e) => setVid({ ...Vid, EMAIL: e.target.value })}
            value={Vid.EMAIL}
            required
          />
        </div>

        <div style={{ display: "flex", flexDirection: "row", margin: 8 }}>
          <div style={{ marginRight: 5, width: 100 }}>Sugerido</div>
          <input
            type="text"
            onChange={(e) => setVid({ ...Vid, SUGERIDO: e.target.value })}
            value={Vid.SUGERIDO}
          />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            margin: 8,
            width: 200,
            height: 35,
            justifyContent: "center",
          }}
        >
          <input
            type="submit"
            value={" Registrar  "}
            onClick={() => {
              validaRegistro();
            }}
          />
        </div>
      </div>
    </div>
  );
}
export default Registro;
