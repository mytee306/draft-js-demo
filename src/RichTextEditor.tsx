import classNames from 'classnames';
import { ContentBlock, DraftBlockType, DraftEditorCommand, DraftHandleValue, DraftInlineStyleType, Editor, EditorState, getDefaultKeyBinding, RichUtils } from 'draft-js';
import React, { createRef, KeyboardEvent, MouseEvent, SFC } from 'react';
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

const BLOCK_TYPES: BlockTypes = [
  { label: 'H1', style: 'header-one' },
  { label: 'H2', style: 'header-two' },
  { label: 'H3', style: 'header-three' },
  { label: 'H4', style: 'header-four' },
  { label: 'H5', style: 'header-five' },
  { label: 'H6', style: 'header-six' },
  { label: 'Blockquote', style: 'blockquote' },
  { label: 'Code Block', style: 'code-block' },
  { label: 'UL', style: 'unordered-list-item' },
  { label: 'OL', style: 'ordered-list-item' },
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

  return (
    <div className="RichEditor-controls">
      {BLOCK_TYPES.map(type => (
        <StyleButton
          key={type.label}
          active={type.style === blockType}
          label={type.label}
          onToggle={onToggle}
          style={type.style}
        />
      ))}
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

class RichEditor extends React.Component<{}, RichEditorState> {
  state = {
    editorState: EditorState.createEmpty(),
  };

  editor = createRef<Editor>();

  focus = () => {
    // destructuring with a default value doesn't appear safe to the compiler
    const {
      editor: { current: editor },
    } = this;

    if (editor) {
      editor.focus();
    }
  };

  onChange = (editorState: EditorState) => this.setState({ editorState });
  handleKeyCommand = (
    command: DraftEditorCommand,
    editorState: EditorState,
  ): DraftHandleValue => {
    const newState = RichUtils.handleKeyCommand(editorState, command);

    if (newState) {
      this.onChange(newState);

      return 'handled';
    } else {
      return 'not-handled';
    }
  };
  mapKeyToEditorCommand = (e: KeyboardEvent) => {
    if (e.keyCode === 9 /* TAB */) {
      const newEditorState = RichUtils.onTab(
        e,
        this.state.editorState,
        4 /* maxDepth */,
      );
      if (newEditorState !== this.state.editorState) {
        this.onChange(newEditorState);
      }
      return null;
    }
    return getDefaultKeyBinding(e);
  };

  toggleBlockType = (blockType: DraftBlockType) => {
    this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
  };

  toggleInlineStyle = (inlineStyle: string) => {
    this.onChange(
      RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle),
    );
  };

  render() {
    const {
      state: { editorState },
    } = this;
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
        <BlockStyleControls
          editorState={editorState}
          onToggle={this.toggleBlockType}
        />
        <InlineStyleControls
          editorState={editorState}
          onToggle={this.toggleInlineStyle}
        />
        <div
          className={classNames('RichEditor-editor', {
            'RichEditor-hidePlaceholder': hasText && isUnStyled,
          })}
          onClick={this.focus}
        >
          <Editor
            blockStyleFn={getBlockStyle}
            customStyleMap={styleMap}
            editorState={editorState}
            handleKeyCommand={this.handleKeyCommand}
            keyBindingFn={this.mapKeyToEditorCommand}
            onChange={this.onChange}
            placeholder="Tell a story..."
            ref={this.editor}
            spellCheck={true}
          />
        </div>
      </div>
    );
  }
}

export default RichEditor;
