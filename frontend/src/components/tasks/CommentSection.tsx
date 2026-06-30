'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import { api, getList } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { IComment } from '@pawaacflow/shared/types/comment';

interface CommentSectionProps {
  taskId: string;
  projectId: string;
}

export function CommentSection({ taskId, projectId }: CommentSectionProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const comments = useQuery({
    queryKey: ['comments', projectId, taskId],
    queryFn: () => getList<IComment>(`/projects/${projectId}/tasks/${taskId}/comments`),
  });

  const addComment = useMutation({
    mutationFn: (data: { content: string }) =>
      api.post(`/projects/${projectId}/tasks/${taskId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, taskId] });
      setContent('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate({ content: content.trim() });
  };

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Comments</h3>

      <div className="space-y-4 mb-4">
        {comments.data?.map((comment) => {
          const authorName =
            comment.author?.displayName || comment.author?.email || 'Unknown user';
          return (
            <div key={comment.id} className="flex gap-3">
              <Avatar size="sm" name={authorName} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-slate-900">
                    {authorName}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          );
        })}

        {comments.data?.length === 0 && (
          <p className="text-sm text-slate-400">No comments yet</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <Avatar size="sm" name={user?.displayName} />
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="input-field"
          />
          <Button
            type="submit"
            size="sm"
            disabled={!content.trim() || addComment.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
