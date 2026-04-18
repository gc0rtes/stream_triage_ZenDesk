import type { CSSProperties } from 'react';
import { makeCssVars } from './theme';

function App() {
  return (
    <div style={makeCssVars({ accentHue: 145 }) as CSSProperties}>
      <p>Kanban Board</p>
    </div>
  );
}

export default App;
