package com.example.demo.Repositary;

import com.example.demo.Entity.ForumComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ForumCommentRepositary extends JpaRepository<ForumComment, Long> {
    List<ForumComment> findByPostIdOrderByCreatedAtAsc(Long postId);
}
