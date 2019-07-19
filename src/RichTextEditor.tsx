/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import { IconButton, Tooltip, useTheme } from '@material-ui/core';
import {
  FormatBold,
  FormatItalic,
  FormatQuote,
  FormatUnderlined,
} from '@material-ui/icons';
import {
  ContentBlock,
  DraftBlockType,
  DraftEditorCommand,
  DraftHandleValue,
  DraftInlineStyleType,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  Modifier,
  RichUtils,
  SelectionState,
} from 'draft-js';
import { find, pipe, prop } from 'ramda';
import React, { KeyboardEvent, SFC } from 'react';
import Select from 'react-select';
import './Draft.css';
import './RichTextEditor.css';

const tabCharacter = '  ';

interface BlockValue {
  label: string;
  value: DraftBlockType;
}

type BlockValues = BlockValue[];

const headings: BlockValues = [
  { label: 'H1', value: 'header-one' },
  { label: 'H2', value: 'header-two' },
  { label: 'H3', value: 'header-three' },
  { label: 'H4', value: 'header-four' },
  { label: 'H5', value: 'header-five' },
  { label: 'H6', value: 'header-six' },
];

const lists: BlockValues = [
  { label: 'Bulleted', value: 'unordered-list-item' },
  { label: 'Ordered', value: 'ordered-list-item' },
];

const otherBlockTypes: BlockValues = [
  { label: 'Blockquote', value: 'blockquote' },
  { label: 'Code Block', value: 'code-block' },
];

const blockTypes = otherBlockTypes.concat(headings).concat(lists);

const blockValues: Array<
  BlockValue | { label: BlockValue['label']; options: BlockValues }
> = [
  ...otherBlockTypes,
  { label: 'Lists', options: lists },
  { label: 'Headings', options: headings },
];

export interface BlockStyleControlsProps {
  editorState: EditorState;
  onToggle: (style: DraftBlockType) => void;
}

const BlockStyleControls: SFC<BlockStyleControlsProps> = ({
  editorState,
  onToggle,
}) => {
  const selection = editorState.getSelection();

  const blockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  const findActive = find<BlockValue>(({ value }) => blockType === value);

  const activeType = findActive(blockTypes);

  return (
    <div style={{ minWidth: 150, zIndex: 2 }}>
      <Select
        placeholder="Block Type..."
        options={blockValues}
        value={activeType || null}
        onChange={pipe(
          prop('value') as any,
          onToggle,
        )}
      />
    </div>
  );
};

export interface InlineStyle {
  label: string;
  style: DraftInlineStyleType;
  icon: React.ReactElement;
}

export type InlineStyles = InlineStyle[];

const INLINE_STYLES: InlineStyles = [
  { label: 'Bold', style: 'BOLD', icon: <FormatBold /> },
  { label: 'Italic', style: 'ITALIC', icon: <FormatItalic /> },
  { label: 'Underline', style: 'UNDERLINE', icon: <FormatUnderlined /> },
  { label: 'Monospace', style: 'CODE', icon: <FormatQuote /> },
];

export interface InlineStyleControlsProps {
  editorState: EditorState;
  onToggle: (style: DraftInlineStyleType) => void;
}

const InlineStyleControls: SFC<InlineStyleControlsProps> = ({
  editorState,
  onToggle,
}) => {
  const theme = useTheme();

  const currentStyle = editorState.getCurrentInlineStyle();

  return (
    <div>
      {INLINE_STYLES.map(({ icon, label, style }) => {
        const active = currentStyle.has(style);

        return (
          <Tooltip
            key={label}
            title={label}
            onMouseDown={e => {
              e.preventDefault();
              onToggle(style);
            }}
          >
            <IconButton style={{ height: 48 }}>
              <span
                style={{
                  color: active ? theme.palette.primary.light : 'inherit',
                }}
              >
                {icon}
              </span>
            </IconButton>
          </Tooltip>
        );
      })}
    </div>
  );
};

const styleMap = {
  CODE: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
    fontSize: 16,
    padding: 2,
  },
};

const getBlockStyle = (block: ContentBlock) => {
  switch (block.getType()) {
    case 'blockquote':
      return 'RichEditor-blockquote';
    default:
      return '';
  }
};

export interface RichEditorState {
  editorState: EditorState;
}

const RichEditor: React.FC = () => {
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty(),
  );

  const editor = React.useRef<Editor>(null);

  const [selection, setSelection] = React.useState<SelectionState>(
    SelectionState.createEmpty(''),
  );

  const focus = () => {
    const { current } = editor;

    if (current) {
      current.focus();
    }
  };

  const handleKeyCommand = (
    command: DraftEditorCommand,
    newEditorState: EditorState,
  ): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(newEditorState, command);

    if (newState) {
      setEditorState(newState);

      return 'handled';
    } else {
      return 'not-handled';
    }
  };

  const mapKeyToEditorCommand = (e: KeyboardEvent) => getDefaultKeyBinding(e);

  const toggleBlockType = (blockType: DraftBlockType) => {
    const newEditorState = RichUtils.toggleBlockType(editorState, blockType);
    setEditorState(EditorState.acceptSelection(newEditorState, selection));
  };

  const toggleInlineStyle = (inlineStyle: DraftInlineStyleType) => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  // If the user changes block type before entering any text, we can
  // either style the placeholder or hide it. Let's just hide it now.
  const contentState = editorState.getCurrentContent();

  const hasText = contentState.isEmpty();

  const isUnstyled =
    contentState
      .getBlockMap()
      .first()
      .getType() === 'unstyled';

  return (
    <div className="RichEditor-root">
      <div
        style={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridGap: 20,
          alignItems: 'center',
          justifyContent: 'right',
        }}
      >
        <BlockStyleControls
          editorState={editorState}
          onToggle={toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={toggleInlineStyle}
        />
      </div>
      <div className="RichEditor-editor" onClick={focus}>
        <Editor
          ref={editor}
          editorState={editorState}
          onChange={setEditorState}
          spellCheck
          placeholder={!hasText && isUnstyled ? 'Tell a story...' : ''}
          blockStyleFn={getBlockStyle}
          customStyleMap={styleMap}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          onBlur={() => {
            setSelection(editorState.getSelection());
          }}
          onTab={e => {
            e.preventDefault();

            const newContentState = Modifier.replaceText(
              editorState.getCurrentContent(),
              editorState.getSelection(),
              tabCharacter,
            );

            setEditorState(
              EditorState.push(
                editorState,
                newContentState,
                'insert-characters',
              ),
            );
          }}
        />
      </div>
    </div>
  );
};

export default RichEditor;
