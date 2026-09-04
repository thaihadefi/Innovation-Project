"use client";
import type { MutableRefObject } from "react";
import { Editor } from "@tinymce/tinymce-react"
import type { RichTextEditor } from "@/types/common";

export const EditorMCE = (props: {
  editorRef: MutableRefObject<RichTextEditor | null>,
  value: string,
  id?: string
}) => {
  const { editorRef, value, id = "" } = props;

  return (
    <>
      <Editor
        apiKey={process.env.NEXT_PUBLIC_API_TINYMCE || undefined}
        onInit={ (_evt, editor) => editorRef.current = editor }
        initialValue={value}
        init={{
          height: 500,
          plugins: 'charmap code codesample emoticons image link lists media',
          toolbar: 'undo redo | styles | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image | print preview media fullscreen | forecolor backcolor emoticons | charmap code codesample | help',
        }}
        id={id}
      />
    </>
  )
}