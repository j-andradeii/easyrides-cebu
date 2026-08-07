/**
 * FormRichText Component
 *
 * TipTap rich-text editor wired into react-hook-form with Controller — the same
 * contract as the other Form* fields, so a page just names the field.
 *
 * The value is HTML. The editor's allowed nodes are deliberately the same set
 * `sanitizeRichText` keeps on the server: anything you cannot type here is
 * something the server would strip anyway.
 *
 * The rendered content carries the `rich-text` class, which is also what the
 * public tour page uses — so what an editor sees is what a guest sees.
 */

'use client';

import { useCallback, useEffect, useId } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Controller, useFormContext } from 'react-hook-form';

import { FormError } from './FormError';
import { getNestedError } from './form-field-error';

interface FormRichTextProps {
  name: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  disabled?: boolean;
  showRequired?: boolean;
  className?: string;
}

/** TipTap serialises an empty document as this — treat it as "nothing typed". */
const EMPTY_DOCUMENT = '<p></p>';

const EXTENSIONS = [
  StarterKit.configure({
    // The page already owns the h1; headings inside the copy start at h2.
    heading: { levels: [2, 3, 4] },
    link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer' } },
  }),
];

interface ToolbarButtonProps {
  icon: string;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({ icon, label, isActive, disabled, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      // The editor must keep focus and its selection — mousedown default would
      // move focus to the button and collapse the range being styled.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        isActive ? 'bg-coral/10 text-coral' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <i className={`pi ${icon} text-xs`} />
    </button>
  );
}

function Toolbar({ editor, disabled }: { editor: Editor; disabled: boolean }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: instance }) => ({
      bold: instance.isActive('bold'),
      italic: instance.isActive('italic'),
      underline: instance.isActive('underline'),
      strike: instance.isActive('strike'),
      h2: instance.isActive('heading', { level: 2 }),
      h3: instance.isActive('heading', { level: 3 }),
      bulletList: instance.isActive('bulletList'),
      orderedList: instance.isActive('orderedList'),
      blockquote: instance.isActive('blockquote'),
      link: instance.isActive('link'),
      canUndo: instance.can().undo(),
      canRedo: instance.can().redo(),
    }),
  });

  const toggleLink = useCallback(() => {
    const previous = (editor.getAttributes('link').href as string | undefined) ?? '';
    const href = window.prompt('Link URL (leave empty to remove)', previous);

    if (href === null) return;
    if (href.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // A bare "easyridecebutours.com" would resolve against our own origin.
    const normalized = /^(https?:|mailto:|tel:)/i.test(href.trim())
      ? href.trim()
      : `https://${href.trim()}`;

    editor.chain().focus().extendMarkRange('link').setLink({ href: normalized }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
      <ToolbarButton icon="pi-bold" label="Bold" isActive={state?.bold} disabled={disabled} onClick={() => editor.chain().focus().toggleBold().run()} />
      <ToolbarButton icon="pi-italic" label="Italic" isActive={state?.italic} disabled={disabled} onClick={() => editor.chain().focus().toggleItalic().run()} />
      <ToolbarButton icon="pi-underline" label="Underline" isActive={state?.underline} disabled={disabled} onClick={() => editor.chain().focus().toggleUnderline().run()} />
      <ToolbarButton icon="pi-minus" label="Strikethrough" isActive={state?.strike} disabled={disabled} onClick={() => editor.chain().focus().toggleStrike().run()} />

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        disabled={disabled}
        title="Heading"
        className={`h-8 rounded-md px-2 text-xs font-bold transition-colors disabled:opacity-40 ${
          state?.h2 ? 'bg-coral/10 text-coral' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        H2
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        disabled={disabled}
        title="Sub-heading"
        className={`h-8 rounded-md px-2 text-xs font-bold transition-colors disabled:opacity-40 ${
          state?.h3 ? 'bg-coral/10 text-coral' : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        H3
      </button>

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton icon="pi-list" label="Bullet list" isActive={state?.bulletList} disabled={disabled} onClick={() => editor.chain().focus().toggleBulletList().run()} />
      <ToolbarButton icon="pi-sort-numeric-down" label="Numbered list" isActive={state?.orderedList} disabled={disabled} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
      <ToolbarButton icon="pi-comment" label="Quote" isActive={state?.blockquote} disabled={disabled} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
      <ToolbarButton icon="pi-link" label="Link" isActive={state?.link} disabled={disabled} onClick={toggleLink} />

      <span className="mx-1 h-5 w-px bg-slate-200" />

      <ToolbarButton icon="pi-undo" label="Undo" disabled={disabled || !state?.canUndo} onClick={() => editor.chain().focus().undo().run()} />
      <ToolbarButton icon="pi-refresh" label="Redo" disabled={disabled || !state?.canRedo} onClick={() => editor.chain().focus().redo().run()} />
    </div>
  );
}

/**
 * Its own component so the emptiness check subscribes to editor state on its
 * own — the editor itself deliberately does not re-render on every keystroke.
 */
function Placeholder({ editor, text }: { editor: Editor; text: string }) {
  const isEmpty = useEditorState({
    editor,
    selector: ({ editor: instance }) => instance.isEmpty,
  });

  if (!isEmpty) return null;

  return (
    <p className="pointer-events-none absolute left-4 top-3 select-none text-slate-500">{text}</p>
  );
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
  invalid?: boolean;
  id?: string;
}

/** The editor on its own — usable outside a react-hook-form context. */
export function RichTextEditor({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder,
  invalid = false,
  id,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value || '',
    editable: !disabled,
    // Required under the App Router: rendering the editor during SSR would
    // produce markup the client immediately disagrees with.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'rich-text min-h-[14rem] px-2 py-2 focus:outline-none',
        ...(id ? { id } : {}),
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      onChange(html === EMPTY_DOCUMENT ? '' : html);
    },
    onBlur: () => onBlur?.(),
  });

  // Pull in a value the form set from outside (loading a tour to edit, or a
  // reset). Guarded, or every keystroke would re-parse the document and put the
  // caret back at the start.
  useEffect(() => {
    if (!editor) return;

    const current = editor.getHTML();
    const incoming = value || EMPTY_DOCUMENT;
    if (current !== incoming) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  return (
    <div
      className={`overflow-hidden rounded-lg border bg-white transition-colors ${
        invalid ? 'border-cebu-red' : 'border-slate-200'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      {editor && <Toolbar editor={editor} disabled={disabled} />}
      <div className="relative">
        <EditorContent editor={editor} />
        {editor && placeholder && <Placeholder editor={editor} text={placeholder} />}
      </div>
    </div>
  );
}

export const FormRichText: React.FC<FormRichTextProps> = ({
  name,
  label,
  hint,
  placeholder,
  disabled = false,
  showRequired = false,
  className = '',
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = getNestedError(errors, name);
  const reactId = useId();
  const uniqueId = `${name}-${reactId}`;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={uniqueId} className="mb-2 block text-sm font-medium text-slate-700">
          {label}
          {showRequired && <span className="ml-1 text-cebu-red">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="w-full">
            <RichTextEditor
              id={uniqueId}
              value={field.value ?? ''}
              onChange={field.onChange}
              onBlur={field.onBlur}
              disabled={disabled}
              placeholder={placeholder}
              invalid={fieldState.invalid}
            />
            {hint && !error && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
            {error && <FormError error={error} />}
          </div>
        )}
      />
    </div>
  );
};

export default FormRichText;
