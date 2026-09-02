import AppRoutes from "./routes/AppRoutes";
import { MusicPlayerProvider } from "./components/player/MusicPlayerContext";

function App() {
  return (
    <MusicPlayerProvider>
      <AppRoutes />
    </MusicPlayerProvider>
  );
}

export default App;
