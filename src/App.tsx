import React from 'react';
import './App.css';
import MyEditor from './Editor';

const App: React.FC = () => {
  return (
    <div className="App">
      <main style={{ background: '#eee', height: '100vh' }}>
        <MyEditor />
      </main>
    </div>
  );
};

export default App;
