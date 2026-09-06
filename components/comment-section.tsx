"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import type { Comment } from "@/lib/types";

export function CommentSection({ articleId, initial }: { articleId: number; initial: Comment[] }) {
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");
  const query = useQuery<Comment[]>({ queryKey: ["comments", articleId], queryFn: async () => { const r = await fetch(`/api/comments?articleId=${articleId}`); if (!r.ok) throw new Error("评论加载失败"); return r.json(); }, initialData: initial });
  const submission = useMutation({
    mutationFn: async () => { const r = await fetch("/api/comments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ articleId, author, message }) }); const payload = await r.json(); if (!r.ok) throw new Error(payload.error ?? "评论提交失败"); return payload; },
    onSuccess: (payload) => { setMessage(""); setFeedback(payload.pending?"评论已提交，审核通过后会公开显示。":"评论发布成功。"); if(!payload.pending)void query.refetch(); },
    onError: (error) => setFeedback(error.message),
  });
  function submit(e: FormEvent) { e.preventDefault(); if (!author.trim() || !message.trim()) return; setFeedback(""); submission.mutate(); }
  return <section id="comments" className="mt-12 scroll-mt-24"><h2 className="text-2xl font-black">评论</h2><form onSubmit={submit} className="panel mt-5 grid gap-3 p-5"><input value={author} onChange={(e)=>setAuthor(e.target.value)} maxLength={32} required placeholder="你的昵称" className="field"/><textarea value={message} onChange={(e)=>setMessage(e.target.value)} maxLength={1000} required placeholder="写下你的想法…" rows={4} className="field resize-none"/><button disabled={submission.isPending} className="btn-primary w-fit">{submission.isPending ? "发送中…" : "提交审核"}</button>{feedback && <p className={`text-sm ${submission.isError ? "text-red-500" : "text-emerald-600"}`}>{feedback}</p>}</form>{query.isError && <p className="mt-4 text-sm text-red-500">评论加载失败，请稍后重试。</p>}<div className="mt-5 space-y-3">{query.data?.map((c) => <div key={c.id} className="panel p-4"><div className="flex justify-between gap-3"><b>{c.author}</b><span className="text-xs text-zinc-400">{new Date(c.createdAt).toLocaleDateString("zh-CN")}</span></div><p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{c.message}</p></div>)}</div></section>;
}
