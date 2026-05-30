import { useAuth } from "../../shared/context/AuthContext.jsx";
import ContenPrincipal from "./ContenPrincipal.jsx";
import ContentRight from "./ContentRight.jsx";

function MenuContent() {
 const { user, logout } = useAuth();
  return (
    <div id="menucontent" >
        <ContenPrincipal  />
              {!user && (
        <ContentRight/>
      )}
    </div>
  )
}

export default MenuContent