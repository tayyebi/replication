import { Routes, Route } from 'react-router-dom';
import MainMenu from './pages/MainMenu';
import ReplicationGame from './pages/ReplicationGame';
import GitGame from './pages/GitGame';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/replication" element={<ReplicationGame />} />
      <Route path="/git-game" element={<GitGame />} />
    </Routes>
  );
}
