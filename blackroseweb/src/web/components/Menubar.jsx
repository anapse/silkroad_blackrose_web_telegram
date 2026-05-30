import { Link } from "react-router-dom";
import { useAuth } from "../../shared/context/AuthContext.jsx";

function Menubar() {
  const { user, logout } = useAuth();

  return (
    <div id="menubar">
      <input type="checkbox" id="menu" />
      <label htmlFor="menu" className="menu-label"></label>
      <label htmlFor="menu" className="menu-label2"></label>

      <div id="menubarF">
        <div className="menulink">
          <Link className="linkbar" to="/">Home</Link>
        </div>

        <div className="menulink">
          <Link className="linkbar" to="/rankings">Rankings</Link>
        </div>

        <div className="menulink">
          <Link className="linkbar" to="/descargas">Descargas</Link>
        </div>

        {/* 👇 SOLO SI NO ESTÁ LOGUEADO */}
        {!user && (
          <>
            <div className="menulink">
              <Link className="linkbar" to="/registro">Registro</Link>
            </div>
            
          </>
        )}

        {/* 👇 SI ESTÁ LOGUEADO */}
        {user && (
          <div className="menulink">
           
            <button style={{backgroundColor:"transparent", border:"none"}} onClick={logout}>Salir</button>
          </div>
        )}

      
      </div>

     
    </div>
  );
}

function Iconlink() {
  return (
    <div id="iconlink">
      <a
        href="https://www.facebook.com/profile.php?id=61559738889636"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div id="facebook"></div>
      </a>

      <a
        href="https://wa.me/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div id="whatsapps"></div>
      </a>

      <a
        href="https://discord.com/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <div id="discord"></div>
      </a>
    </div>
  );
}

export default Menubar;