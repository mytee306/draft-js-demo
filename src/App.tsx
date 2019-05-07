import React from 'react';
import './App.css';
import RichTextEditor from './RichTextEditor';

const App: React.FC = () => {
  return (
    <div className="App">
      <main style={{ background: '#eee', height: '100vh' }}>
        <RichTextEditor />
      </main>
    </div>
  );
};

export default App;
