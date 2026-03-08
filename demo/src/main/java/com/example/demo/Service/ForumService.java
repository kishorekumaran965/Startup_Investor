package com.example.demo.Service;

import com.example.demo.DTO.ForumPostRequestDTO;
import com.example.demo.DTO.ForumPostResponseDTO;
import com.example.demo.DTO.ForumCommentRequestDTO;
import com.example.demo.DTO.ForumCommentResponseDTO;

import java.util.List;

public interface ForumService {
    ForumPostResponseDTO createPost(ForumPostRequestDTO request);

    List<ForumPostResponseDTO> getAllPosts();

    List<ForumPostResponseDTO> getPostsByCategory(String category);

    ForumPostResponseDTO getPostById(Long id);

    ForumCommentResponseDTO addComment(ForumCommentRequestDTO request);

    List<ForumCommentResponseDTO> getCommentsForPost(Long postId);
}
