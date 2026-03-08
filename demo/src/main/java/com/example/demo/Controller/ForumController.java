package com.example.demo.Controller;

import com.example.demo.DTO.ForumCommentRequestDTO;
import com.example.demo.DTO.ForumCommentResponseDTO;
import com.example.demo.DTO.ForumPostRequestDTO;
import com.example.demo.DTO.ForumPostResponseDTO;
import com.example.demo.Service.ForumService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/forum")
@RequiredArgsConstructor
@CrossOrigin("*")
public class ForumController {

    private final ForumService forumService;

    @PostMapping("/posts")
    public ResponseEntity<ForumPostResponseDTO> createPost(@RequestBody ForumPostRequestDTO request) {
        return ResponseEntity.ok(forumService.createPost(request));
    }

    @GetMapping("/posts")
    public ResponseEntity<List<ForumPostResponseDTO>> getAllPosts(@RequestParam(required = false) String category) {
        if (category != null && !category.isEmpty()) {
            return ResponseEntity.ok(forumService.getPostsByCategory(category));
        }
        return ResponseEntity.ok(forumService.getAllPosts());
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<ForumPostResponseDTO> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getPostById(id));
    }

    @PostMapping("/comments")
    public ResponseEntity<ForumCommentResponseDTO> addComment(@RequestBody ForumCommentRequestDTO request) {
        return ResponseEntity.ok(forumService.addComment(request));
    }

    @GetMapping("/posts/{id}/comments")
    public ResponseEntity<List<ForumCommentResponseDTO>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(forumService.getCommentsForPost(id));
    }
}
