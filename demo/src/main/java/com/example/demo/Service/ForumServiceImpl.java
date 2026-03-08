package com.example.demo.Service;

import com.example.demo.DTO.ForumCommentRequestDTO;
import com.example.demo.DTO.ForumCommentResponseDTO;
import com.example.demo.DTO.ForumPostRequestDTO;
import com.example.demo.DTO.ForumPostResponseDTO;
import com.example.demo.Entity.ForumComment;
import com.example.demo.Entity.ForumPost;
import com.example.demo.Entity.User;
import com.example.demo.Repositary.ForumCommentRepositary;
import com.example.demo.Repositary.ForumPostRepositary;
import com.example.demo.Repositary.UserRepositary;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ForumServiceImpl implements ForumService {

    private final ForumPostRepositary postRepository;
    private final ForumCommentRepositary commentRepository;
    private final UserRepositary userRepository;

    @Override
    public ForumPostResponseDTO createPost(ForumPostRequestDTO request) {
        User author = userRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ForumPost post = new ForumPost();
        post.setTitle(request.getTitle());
        post.setContent(request.getContent());
        post.setCategory(request.getCategory());
        post.setAuthor(author);

        return mapToPostDTO(postRepository.save(post));
    }

    @Override
    public List<ForumPostResponseDTO> getAllPosts() {
        return postRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToPostDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<ForumPostResponseDTO> getPostsByCategory(String category) {
        return postRepository.findByCategoryOrderByCreatedAtDesc(category)
                .stream()
                .map(this::mapToPostDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ForumPostResponseDTO getPostById(Long id) {
        ForumPost post = postRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return mapToPostDTO(post);
    }

    @Override
    public ForumCommentResponseDTO addComment(ForumCommentRequestDTO request) {
        User author = userRepository.findById(request.getAuthorId())
                .orElseThrow(() -> new RuntimeException("User not found"));
        ForumPost post = postRepository.findById(request.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        ForumComment comment = new ForumComment();
        comment.setContent(request.getContent());
        comment.setAuthor(author);
        comment.setPost(post);

        return mapToCommentDTO(commentRepository.save(comment));
    }

    @Override
    public List<ForumCommentResponseDTO> getCommentsForPost(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedAtAsc(postId)
                .stream()
                .map(this::mapToCommentDTO)
                .collect(Collectors.toList());
    }

    private ForumPostResponseDTO mapToPostDTO(ForumPost post) {
        ForumPostResponseDTO dto = new ForumPostResponseDTO();
        dto.setId(post.getId());
        dto.setTitle(post.getTitle());
        dto.setContent(post.getContent());
        dto.setCategory(post.getCategory());
        dto.setCreatedAt(post.getCreatedAt());
        dto.setAuthorId(post.getAuthor().getId());
        dto.setAuthorName(post.getAuthor().getName());
        dto.setAuthorRole(post.getAuthor().getRole().toString());
        dto.setCommentCount(post.getComments().size());
        return dto;
    }

    private ForumCommentResponseDTO mapToCommentDTO(ForumComment comment) {
        ForumCommentResponseDTO dto = new ForumCommentResponseDTO();
        dto.setId(comment.getId());
        dto.setContent(comment.getContent());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setAuthorId(comment.getAuthor().getId());
        dto.setAuthorName(comment.getAuthor().getName());
        return dto;
    }
}
