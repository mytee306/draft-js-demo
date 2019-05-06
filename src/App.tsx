import React from 'react';
import './App.css';
import MyEditor from './MyEditor';
import PrismEditor from './PrismEditor';
import RichTextEditor from './RichTextEditor';

const App: React.FC = () => {
  return (
    <div className="App">
      <main style={{ background: '#eee', height: '100vh' }}>
        <MyEditor />
        <hr />
        <PrismEditor />
        <hr />
        <RichTextEditor />
      </main>
    </div>
  );
};

export default App;
