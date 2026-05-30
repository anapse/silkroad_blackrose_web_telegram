import "./App.css";
import MenuContent from "./web/components/MenuContent.jsx";
import Menubar from "./web/components/Menubar.jsx";
import UserPanel from "./web/components/UserPanel.jsx";
import { useAuth } from "./shared/context/AuthContext.jsx";

function App() {
  const { user } = useAuth();

  return (
    <div id="app">
      <Menubar />
      <div id="separador" />
      <MenuContent />
      {user && <UserPanel user={user} />}
    </div>
  );
}
export default App;