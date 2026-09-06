"use client";
import { useState } from "react";
import { Bold,Code2,Eye,Heading2,List,Pencil,Quote } from "lucide-react";
import { MarkdownContent } from "@/components/markdown-content";
import { MediaPicker } from "@/components/media-picker";
import { ContentMediaUpload } from "@/components/content-media-upload";

export function MarkdownEditor({value,onChange}:{value:string;onChange:(value:string)=>void}){
  const [preview,setPreview]=useState(false);
  function append(before:string,after="",sample="文字"){onChange(`${value}${value?"\n":""}${before}${sample}${after}`)}
  function insert(markup:string){onChange(`${value}\n\n${markup}\n\n`)}
  const tools=[{label:"标题",icon:Heading2,run:()=>append("## ","","小标题")},{label:"加粗",icon:Bold,run:()=>append("**","**")},{label:"引用",icon:Quote,run:()=>append("> ","","引用内容")},{label:"列表",icon:List,run:()=>append("- ","","列表内容")},{label:"代码",icon:Code2,run:()=>append("```\n","\n```","代码")}];
  return <div className="overflow-hidden rounded-xl border border-black/10 dark:border-white/10"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 p-2 dark:border-white/10"><div className="flex flex-wrap gap-1">{tools.map(tool=>{const Icon=tool.icon;return <button type="button" key={tool.label} onClick={tool.run} className="flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-bold hover:bg-pink-50 hover:text-pink-500 dark:hover:bg-pink-500/10"><Icon size={14}/>{tool.label}</button>})}<ContentMediaUpload onInsert={insert}/><span className="w-36"><MediaPicker value="" onSelect={url=>insert(`![图片描述](${url})`)}/></span></div><button type="button" onClick={()=>setPreview(!preview)} className="flex items-center gap-1 rounded-lg bg-pink-500 px-3 py-2 text-xs font-black text-white">{preview?<><Pencil size={14}/>编辑</>:<><Eye size={14}/>预览</>}</button></div>{preview?<div className="article-body min-h-[480px] p-5"><MarkdownContent source={value}/></div>:<textarea className="min-h-[480px] w-full resize-y bg-transparent p-5 font-mono text-sm leading-8 outline-none" placeholder="支持 Markdown，以及图片、音频和视频。" value={value} onChange={event=>onChange(event.target.value)} required/>}</div>
}
