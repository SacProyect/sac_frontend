import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Undo2,
  Redo2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCallback, useEffect, forwardRef, useImperativeHandle } from 'react'

export interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export interface RichTextEditorRef {
  clear: () => void
}

// WHY: Toolbar button is extracted to avoid repeating interaction styles.
// Each button has identical hover/focus/disabled states — DRY principle.
const ToolbarButton = ({
  onClick,
  disabled,
  isActive,
  children,
  title,
}: {
  onClick: () => void
  disabled?: boolean
  isActive?: boolean
  children: React.ReactNode
  title: string
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'p-1.5 rounded-md transition-colors duration-150',
      isActive
        ? 'bg-indigo-500/20 text-indigo-400'
        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50',
      disabled && 'opacity-40 cursor-not-allowed'
    )}
  >
    {children}
  </button>
)

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(
  ({ value, onChange, placeholder = 'Escribe aquí...', className, disabled = false }, ref) => {
    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          // WHY: disable heading — announcements don't need h1/h2/h3
          heading: false,
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-indigo-400 underline underline-offset-2 hover:text-indigo-300',
          },
        }),
        Underline,
        Placeholder.configure({
          placeholder,
        }),
      ],
      content: value,
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-invert prose-sm max-w-none min-h-[120px] px-3 py-2',
            'focus:outline-none',
            'text-sm text-slate-200 leading-relaxed',
            // WHY: override prose styles for dark theme consistency
            '[&_p]:text-slate-200 [&_p]:my-1',
            '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1',
            '[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-1',
            '[&_li]:my-0.5',
            '[&_a]:text-indigo-400 [&_a]:underline',
          ),
        },
      },
      onUpdate: ({ editor: e }) => {
        onChange(e.getHTML())
      },
      editable: !disabled,
    })

    // WHY: sync external value changes (e.g. when editing an announcement)
    useEffect(() => {
      if (editor && value !== editor.getHTML()) {
        editor.commands.setContent(value, false)
      }
    }, [value]) // intentionally not including editor to avoid loop

    // WHY: imperative handle lets parent clear the editor (e.g. on form reset)
    useImperativeHandle(ref, () => ({
      clear: () => {
        editor?.commands.clearContent()
      },
    }))

    const setLink = useCallback(() => {
      if (!editor) return

      const previousUrl = editor.getAttributes('link').href
      const url = window.prompt('URL del enlace:', previousUrl)

      if (url === null) return // cancelled

      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    if (!editor) return null

    return (
      <div
        className={cn(
          'rounded-xl border border-slate-700 bg-slate-950/30 overflow-hidden transition-colors',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-700/80 bg-slate-900/50 flex-wrap">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            disabled={disabled}
            title="Negrita"
          >
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            disabled={disabled}
            title="Cursiva"
          >
            <Italic size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            disabled={disabled}
            title="Subrayado"
          >
            <UnderlineIcon size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            disabled={disabled}
            title="Tachado"
          >
            <Strikethrough size={14} />
          </ToolbarButton>

          {/* Divider */}
          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            disabled={disabled}
            title="Lista con viñetas"
          >
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            disabled={disabled}
            title="Lista numerada"
          >
            <ListOrdered size={14} />
          </ToolbarButton>

          {/* Divider */}
          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          <ToolbarButton
            onClick={setLink}
            isActive={editor.isActive('link')}
            disabled={disabled}
            title="Insertar enlace"
          >
            <LinkIcon size={14} />
          </ToolbarButton>

          {/* Spacer */}
          <div className="flex-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Deshacer"
          >
            <Undo2 size={14} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Rehacer"
          >
            <Redo2 size={14} />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
    )
  }
)

RichTextEditor.displayName = 'RichTextEditor'

export { RichTextEditor }
