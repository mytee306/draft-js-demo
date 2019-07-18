import classNames from 'classnames';
import {
  ContentBlock,
  DraftBlockType,
  DraftEditorCommand,
  DraftHandleValue,
  DraftInlineStyleType,
  Editor,
  EditorState,
  getDefaultKeyBinding,
  RichUtils,
} from 'draft-js';
import { find, pipe, prop } from 'ramda';
import React, { KeyboardEvent, MouseEvent, SFC } from 'react';
import Select from 'react-select';
import { Omit } from 'utility-types';
import './Draft.css';
import './RichTextEditor.css';

export type Style = DraftBlockType | DraftInlineStyleType;

export type OnToggle<S extends Style> = (style: S) => void;

export interface StyleButtonProps<S extends Style> {
  active: boolean;
  style: S;
  onToggle: OnToggle<S>;
  label: string;
}

const StyleButton = <S extends Style>({
  active,
  style,
  onToggle,
  label,
}: StyleButtonProps<S>) => {
  const handleToggle = (e: MouseEvent) => {
    e.preventDefault();

    onToggle(style);
  };

  return (
    <span
      className={classNames('RichEditor-styleButton', {
        'RichEditor-activeButton': active,
      })}
      onMouseDown={handleToggle}
    >
      {label}
    </span>
  );
};

export interface BlockType {
  label: string;
  style: DraftBlockType;
}

export type BlockTypes = BlockType[];

interface BlockValue extends Omit<BlockType, 'style'> {
  value: BlockType['style'];
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
  { label: 'UL', value: 'unordered-list-item' },
  { label: 'OL', value: 'ordered-list-item' },
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
  { label: 'Headings', options: headings },
  { label: 'Lists', options: lists },
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

  const type = findActive(blockTypes);

  return (
    <div className="RichEditor-controls" style={{ minWidth: 130, zIndex: 2 }}>
      <Select
        placeholder="Type..."
        options={blockValues}
        value={type}
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
}

export type InlineStyles = InlineStyle[];

const INLINE_STYLES: InlineStyles = [
  { label: 'Bold', style: 'BOLD' },
  { label: 'Italic', style: 'ITALIC' },
  { label: 'Underline', style: 'UNDERLINE' },
  { label: 'Monospace', style: 'CODE' },
];

export interface InlineStyleControlsProps {
  editorState: EditorState;
  onToggle: (style: DraftInlineStyleType) => void;
}

const InlineStyleControls: SFC<InlineStyleControlsProps> = ({
  editorState,
  onToggle,
}) => {
  const currentStyle = editorState.getCurrentInlineStyle();

  return (
    <div className="RichEditor-controls">
      {INLINE_STYLES.map(type => (
        <StyleButton
          key={type.label}
          active={currentStyle.has(type.style)}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
    </div>
  );
};

// Custom overrides for "code" style.
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

  const focus = () => {
    const { current } = editor;

    if (current) {
      current.focus();
    }
  };

  const onChange = (newEditorState: EditorState) =>
    setEditorState(newEditorState);

  const handleKeyCommand = (
    command: DraftEditorCommand,
    editorState: EditorState,
  ): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      onChange(newState);

      return 'handled';
    } else {
      return 'not-handled';
    }
  };

  const mapKeyToEditorCommand = (e: KeyboardEvent) => {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(e, editorState, 4 /* maxDepth */);
      if (newEditorState !== editorState) {
        onChange(newEditorState);
      }
      return null;
    }
    return getDefaultKeyBinding(e);
  };

  const toggleBlockType = (blockType: DraftBlockType) => {
    onChange(RichUtils.toggleBlockType(editorState, blockType));
  };

  const toggleInlineStyle = (inlineStyle: string) => {
    onChange(RichUtils.toggleInlineStyle(editorState, inlineStyle));
  };

  // If the user changes block type before entering any text, we can
  // either style the placeholder or hide it. Let's just hide it now.
  const contentState = editorState.getCurrentContent();

  const hasText = contentState.hasText();

  const isUnStyled =
    contentState
      .getBlockMap()
      .first()
      .getType() !== 'unstyled';

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
      <div
        className={classNames('RichEditor-editor', {
          'RichEditor-hidePlaceholder': hasText && isUnStyled,
        })}
        onClick={focus}
      >
        <Editor
          blockStyleFn={getBlockStyle}
          customStyleMap={styleMap}
          editorState={editorState}
          handleKeyCommand={handleKeyCommand}
          keyBindingFn={mapKeyToEditorCommand}
          onChange={onChange}
          placeholder="Tell a story..."
          ref={editor}
          spellCheck={true}
        />
      </div>
    </div>
  );
};

export default RichEditor;
