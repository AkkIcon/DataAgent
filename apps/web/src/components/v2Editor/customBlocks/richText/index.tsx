import * as Y from 'yjs'
import { EditorContent, Extension, useEditor } from '@tiptap/react'
import Collaboration from '@tiptap/extension-collaboration'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import FormattingToolbar from './FormattingToolbar'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TextStyle from '@tiptap/extension-text-style'
// import Paragraph from '@tiptap/extension-paragraph'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Color from '@tiptap/extension-color'
import MathExtension from '@aarkue/tiptap-math-extension'
import type { RichTextBlock } from '@briefer/editor'
import clsx from 'clsx'
import { useCallback, useEffect } from 'react'
import { ConnectDragPreview } from 'react-dnd'

import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import 'katex/dist/katex.min.css'

import ImageExtension from './ImageExtension'
import useEditorAwareness from '@/hooks/useEditorAwareness'
// import VariableExtension from './VariableExtension'

const useBlockEditor = ({
  content,
  isEditable,
  needTransform,
  setTitle,
  variables,
  updateMarkdown,
}: {
  content: Y.XmlFragment
  needTransform: boolean
  isEditable: boolean
  setTitle: (title: string) => void
  variables: string[]
  updateMarkdown: () => void
}) => {
  const editor = useEditor(
    {
      autofocus: false,
      editable: isEditable,
      immediatelyRender: true,
      extensions: [
        TaskList,
        TaskItem.configure({
          nested: true,
        }),
        StarterKit.configure({
          history: false,
          dropcursor: false,
        }),
        Markdown,
        Underline.configure({
          HTMLAttributes: {
            class: 'my-custom-class',
          },
        }),
        Collaboration.configure({
          fragment: content,
        }),
        Placeholder.configure({
          placeholder: 'Click here to start adding content.',
        }),
        Link.extend({ inclusive: false }).configure({
          HTMLAttributes: {
            class: 'cursor-pointer text-gray-500 hover:text-gray-700',
            target: '_blank',
          },
        }),
        TextStyle,
        Color.configure({
          types: ['textStyle'],
        }),
        Highlight.configure({
          multicolor: true,
        }),
        ImageExtension.configure({
          inline: true,
          allowBase64: true,
        }),
        MathExtension.configure({
          evaluation: false,
        }),
        Table.configure({
          resizable: false,
        }),
        TableRow,
        TableHeader,
        TableCell,
        // VariableExtension,
        Extension.create({
          name: 'brieferKeyboardShortcuts',
          addKeyboardShortcuts: () => ({
            Escape: (args) => {
              args.editor.commands.blur()
              return true
            },
          }),
        }),
      ],
      onUpdate({ editor }) {
        const { content } = editor.getJSON()
        const firstLineContent = content?.[0]?.content?.[0]?.text ?? ''
        if (needTransform && firstLineContent) {
          editor.commands.setContent(firstLineContent)
          // if(variables){
          //   editor.commands.setVariables(variables)
          // }
        }
        updateMarkdown()

        setTitle(firstLineContent)
      },
      editorProps: {
        attributes: {
          autocomplete: 'off',
          autocorrect: 'off',
          autocapitalize: 'off',
          class:
            'briefer-editor-body min-h-full prose sm:prose-base prose-sm max-w-full rounded-sm focus:outline-0 whitespace-pre-wrap ph-no-capture',
        },
      },
    },
    [content]
  )

  useEffect(
    () => () => {
      // cleanup after unmount
      editor?.destroy()

      // manually destroy collaboration undo manager
      try {
        // @ts-ignore
        editor?.state['y-undo$']?.undoManager?.destroy()
      } catch (e) {
        console.error('Failed to destroy collaboration undo manager', e)
      }
    },
    [editor]
  )

  return { editor }
}

interface Props {
  block: Y.XmlElement<RichTextBlock>
  belongsToMultiTabGroup: boolean
  isEditable: boolean
  dragPreview: ConnectDragPreview | null
  isDashboard: boolean
  isCursorWithin: boolean
  isCursorInserting: boolean
}
const RichTextBlock = (props: Props) => {
  const id = props.block.getAttribute('id')!
  const content = props.block.getAttribute('content')!
  const needTransform = props.block.getAttribute('needTransform')!

  const setTitle = useCallback(
    (title: string) => {
      props.block.setAttribute('title', title)
      props.block.setAttribute('needTransform', false)
    },
    [props.block]
  )

  const [, editorAPI] = useEditorAwareness()

  const { editor } = useBlockEditor({
    content,
    needTransform: !!needTransform,
    setTitle,
    isEditable: props.isEditable,
    variables: props.block.getAttribute('variables') || [],
    updateMarkdown: () => {
      props.block.setAttribute('markdown', editor.storage.markdown.getMarkdown())
    },
  })

  useEffect(() => {
    if (editor && props.isCursorInserting && props.isCursorWithin) {
      editor.commands.focus()
    }
  }, [editor, props.isCursorInserting, props.isCursorWithin])

  useEffect(() => {
    if (!editor) {
      return
    }

    const onFocus = () => {
      editorAPI.insert(id, { scrollIntoView: false })
    }
    editor.on('focus', onFocus)

    const onBlur = () => {
      editorAPI.blur()
    }
    editor.on('blur', onBlur)

    return () => {
      editor.off('focus', onFocus)
      editor.off('blur', onBlur)
    }
  }, [editor, id, editorAPI.insert, editorAPI.blur])

  return (
    <div
      data-testid={`RichTextBlock-${id}`}
      ref={(d) => {
        props.dragPreview?.(d)
      }}
      className={clsx(
        'ring-outline ring-offset-4 overflow-x-auto',
        props.isDashboard ? 'h-full overflow-y-scroll px-4 py-3' : '',
        {
          'ring-ceramic-400 ring-1':
            editor?.isFocused && !props.belongsToMultiTabGroup && props.isEditable,
          'ring-1 ring-blue-400':
            !editor?.isFocused &&
            !props.belongsToMultiTabGroup &&
            props.isEditable &&
            props.isCursorWithin &&
            !props.isCursorInserting,
        },
        {
          'rounded-sm rounded-tl-none border border-gray-200 p-2': props.belongsToMultiTabGroup,
          'rounded-sm rounded-tl-none border border-blue-400 p-2':
            props.belongsToMultiTabGroup && props.isCursorWithin && !props.isCursorInserting,
          'rounded-sm': !props.belongsToMultiTabGroup,
        }
      )}
      data-block-id={id}>
      <div className={editor?.isFocused ? 'block' : 'hidden'}>
        <div>{editor && <FormattingToolbar editor={editor} />}</div>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

export default RichTextBlock
