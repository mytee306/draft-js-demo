import React, { SFC, useState } from 'react';
import { Editor, EditorState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';

const MyEditor: SFC = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  return (
    <>
      <button
        onMouseDown={e => {
          e.preventDefault();

          const newState = RichUtils.toggleInlineStyle(editorState, 'BOLD');

          setEditorState(newState);
        }}
      >
        Bold
      </button>
      <Editor
        editorState={editorState}
        onChange={newEditorState => setEditorState(newEditorState)}
        handleKeyCommand={(command, editorState) => {
          const newState = RichUtils.handleKeyCommand(editorState, command);

          if (newState) {
            setEditorState(newState);

            return 'handled';
          } else {
            return 'not-handled';
          }
        }}
      />
    </>
  );
};

export default MyEditor;
