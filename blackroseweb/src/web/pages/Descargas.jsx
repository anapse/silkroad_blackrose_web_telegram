import { useEffect, useState } from "react";
import { urlsapi } from "../../shared/recursos/urlApis.jsx";

function Descargas() {
  const [data, setdata] = useState([]);

  useEffect(() => {
    Descargar();
  }, []);

  const Descargar = async () => {
    try {
      const response = await fetch(urlsapi.descargas);
      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }
      const result = await response.json();

      setdata(result);
    } catch (error) {
      // Error fetching data
    }
  };

  return (
    <div
      style={{
        width: "95%",
        fontSize: 20,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontWeight: "bold",
          fontSize: 18,
          margin: 5,
          width: "100%",
          textDecoration: "underline",
          padding: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Descargas
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          borderRadius: 10,
        }}
      >
        {data &&
          data.map(({ id, link, name, description }) => {
            return (
              <div
                key={id}
                style={{
                  backgroundColor: "#00000080",
                  width: "100%",
                  display: "flex",
                  flexDirection: "row",
                  margin: 5,
                  fontSize: 13,
                  borderRadius: 8,
                }}
              >
                <div style={{ width: "45%", margin: 5 }}>{name}</div>
                <div style={{ width: "30%", margin: 8 }}>
                  <a href={link} target="_blank">
                    Click me!!
                  </a>
                </div>
                <div style={{ width: "25%", margin: 8 }}>{description}</div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

export default Descargas;
