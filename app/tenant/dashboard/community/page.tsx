'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Users,
  Search,
  Plus,
  Calendar,
  MessageSquare,
  ThumbsUp,
  Share2,
  Flag,
  AlertCircle,
  Building,
  Tag,
  Filter,
  Send,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { TenantAPI } from '@/lib/api/tenant';

interface Post {
  id: string;
  user_id: string;
  user_name: string;
  property_id: string;
  property_name: string;
  title: string;
  content: string;
  category: string;
  images?: string[];
  likes: number;
  comments_count: number;
  is_liked: boolean;
  is_reported: boolean;
  created_at: string;
}

interface Comment {
  id: string;
  user_id: string;
  user_name: string;
  content: string;
  created_at: string;
}

export default function CommunityPage() {
  const { authState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [showCommentsDialog, setShowCommentsDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!authState.user?.id) return;

      try {
        setLoading(true);
        const result = await TenantAPI.getCommunityPosts(authState.user.id);

        if (result.success && result.data) {
          setPosts(result.data);
        } else {
          toast.error('Failed to load posts');
        }
      } catch (error) {
        console.error('Failed to fetch posts:', error);
        toast.error('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [authState.user?.id]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).filter(file => {
      const isValid =
        file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024;
      if (!isValid) {
        toast.error(
          `${file.name} is not a valid image or is too large (max 5MB)`
        );
      }
      return isValid;
    });

    setUploadedImages(prev => [...prev, ...newFiles]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (
      !authState.user?.id ||
      !newPost.title ||
      !newPost.content ||
      !newPost.category
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const result = await TenantAPI.createCommunityPost(
        newPost.title,
        newPost.content,
        newPost.category,
        uploadedImages
      );

      if (result.success && result.data) {
        setPosts(prev => [result.data, ...prev]);
        setShowNewPostDialog(false);
        setNewPost({ title: '', content: '', category: '' });
        setUploadedImages([]);
        toast.success('Post created successfully');
      } else {
        toast.error(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Failed to create post:', error);
      toast.error('Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const result = await TenantAPI.likeCommunityPost(postId);
      if (result.success) {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId
              ? {
                  ...post,
                  likes: post.is_liked ? post.likes - 1 : post.likes + 1,
                  is_liked: !post.is_liked
                }
              : post
          )
        );
      } else {
        toast.error(result.message || 'Failed to like post');
      }
    } catch (error) {
      console.error('Failed to like post:', error);
      toast.error('Failed to like post');
    }
  };

  const handleReportPost = async (postId: string) => {
    try {
      const result = await TenantAPI.reportCommunityPost(postId);
      if (result.success) {
        setPosts(prev =>
          prev.map(post =>
            post.id === postId ? { ...post, is_reported: true } : post
          )
        );
        toast.success('Post reported successfully');
      } else {
        toast.error(result.message || 'Failed to report post');
      }
    } catch (error) {
      console.error('Failed to report post:', error);
      toast.error('Failed to report post');
    }
  };

  const handleOpenComments = async (post: Post) => {
    setSelectedPost(post);
    setShowCommentsDialog(true);

    try {
      const result = await TenantAPI.getCommunityPostComments(post.id);
      if (result.success && result.data) {
        setComments(result.data);
      } else {
        toast.error('Failed to load comments');
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
      toast.error('Failed to load comments');
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      setSubmitting(true);
      const result = await TenantAPI.addCommunityPostComment(
        selectedPost.id,
        newComment
      );

      if (result.success && result.data) {
        setComments(prev => [result.data, ...prev]);
        setPosts(prev =>
          prev.map(post =>
            post.id === selectedPost.id
              ? { ...post, comments_count: post.comments_count + 1 }
              : post
          )
        );
        setNewComment('');
        toast.success('Comment added successfully');
      } else {
        toast.error(result.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filter === 'all' || post.category === filter;
    const matchesSearch =
      searchQuery === '' ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.user_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = Array.from(new Set(posts.map(post => post.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Community</h1>
          <p className="text-gray-600">
            Connect with your neighbors and share experiences
          </p>
        </div>
        <Button
          onClick={() => setShowNewPostDialog(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 flex gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {filteredPosts.length === 0 ? (
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
            <CardContent className="p-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Posts Found
                </h3>
                <p className="text-gray-600">
                  {searchQuery
                    ? 'No posts match your search criteria'
                    : 'Be the first to start a conversation!'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredPosts.map(post => (
            <Card
              key={post.id}
              className="bg-white/80 backdrop-blur-sm shadow-lg border border-blue-100">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Post Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {post.user_name}
                        </p>
                        <span className="text-gray-500">&bull;</span>
                        <span className="text-sm text-gray-500">
                          {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Building className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-600">
                          {post.property_name}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-0">
                      {post.category.charAt(0).toUpperCase() +
                        post.category.slice(1)}
                    </Badge>
                  </div>

                  {/* Post Content */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {post.content}
                    </p>
                  </div>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {post.images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Post ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(image, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`${
                        post.is_liked ? 'text-blue-600' : 'text-gray-600'
                      } hover:text-blue-700 hover:bg-blue-50`}
                      onClick={() => handleLikePost(post.id)}>
                      <ThumbsUp className="w-4 h-4 mr-2" />
                      {post.likes}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => handleOpenComments(post)}>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {post.comments_count}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-blue-700 hover:bg-blue-50">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    {!post.is_reported && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-red-700 hover:bg-red-50 ml-auto"
                        onClick={() => handleReportPost(post.id)}>
                        <Flag className="w-4 h-4 mr-2" />
                        Report
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Post Dialog */}
      <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newPost.title}
                onChange={e =>
                  setNewPost(prev => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter post title"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={newPost.category}
                onValueChange={value =>
                  setNewPost(prev => ({ ...prev, category: value }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Discussion</SelectItem>
                  <SelectItem value="events">Events & Activities</SelectItem>
                  <SelectItem value="recommendations">
                    Recommendations
                  </SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="lost_found">Lost & Found</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={newPost.content}
                onChange={e =>
                  setNewPost(prev => ({ ...prev, content: e.target.value }))
                }
                placeholder="What's on your mind?"
                className="min-h-[200px]"
              />
            </div>
            <div className="space-y-2">
              <Label>Images (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full border-red-200 hover:bg-red-50"
                      onClick={() => removeImage(index)}>
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ))}
                {uploadedImages.length < 6 && (
                  <div className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors">
                    <label className="cursor-pointer text-center p-2">
                      <ImageIcon className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">
                        Upload Image
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                Upload up to 6 images (max 5MB each)
              </p>
            </div>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={handleCreatePost}
              disabled={submitting}>
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={showCommentsDialog} onOpenChange={setShowCommentsDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-6 py-4">
              {/* Original Post Summary */}
              <div className="space-y-2 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">
                    {selectedPost.user_name}
                  </p>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedPost.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700">{selectedPost.content}</p>
              </div>

              {/* Comments List */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No Comments Yet
                    </h3>
                    <p className="text-gray-600">
                      Be the first to comment on this post
                    </p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div
                      key={comment.id}
                      className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-gray-900">
                            {comment.user_name}
                          </p>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || submitting}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  {submitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


